'use strict';
/**
 * A project's records on a branch of their own.
 *
 * `.flow/` holds the tickets, the groundwork, the inbox and the findings. In a
 * project it is a checkout of the branch `flow`, which shares no history with
 * the code: git calls it an orphan branch. Every code branch ignores `.flow/`,
 * so switching branches never touches a ticket, and nothing ever merges into
 * the code. Anyone who can read the repository gets the tickets.
 *
 * Two other shapes carry no branch, and every function here does nothing for
 * them:
 *
 *   local       `.flow/` is a plain folder listed in `.git/info/exclude`,
 *               from `flow init --local`. It never leaves the clone
 *   home        ~/.flow/, the tickets that belong to no project. It is its
 *               own repository and travels through `flow sync`
 *
 * When the branch is saved and sent:
 *
 *   commit      after every command that writes a ticket, so a commit takes
 *               the whole folder and the user's own edits ride along
 *   push        at a status move, in the background; at once for a new
 *               ticket; and from the hooks, see scripts/records-sync.js
 *   pull        before a new ticket takes its number, and at session start
 *
 * A new ticket is pushed before its id is shown, so a number never changes
 * once someone has seen it. 2 people taking the same number in the same
 * moment is the one clash one folder per ticket cannot avoid, and a refused
 * push is how it shows: the ticket is renumbered and pushed again. Offline,
 * `flow new` makes no ticket at all.
 *
 * Every git call in `.flow/` holds one lock, so the background push and a
 * command typed at the same moment never meet inside git.
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const store = require('./store');

const BRANCH = 'flow';
const REMOTE = 'origin';

/**
 * git in `dir`. Never a password prompt: a remote with no stored sign-in fails
 * instead of waiting. Fetch and push run from the project's top folder, where
 * a remote given as a relative path means what the user set.
 */
function git(dir, args) {
  const ran = spawnSync('git', args, {
    cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

const recordsOf = (root) => store.recordsDir(root);

/** True where `.flow/` is a checkout of the `flow` branch. A checkout made by `git worktree` holds a `.git` file. */
const onBranch = (root) => !store.isHome(root) && fs.existsSync(path.join(recordsOf(root), '.git'));

/** git's `-c` pair naming who commits, where git has no name set, so a commit never stops on it. */
function identity(dir) {
  if (git(dir, ['config', '--get', 'user.email']).ok) return [];
  return ['-c', 'user.name=Flow', '-c', 'user.email=flow@localhost'];
}

const hasRemote = (dir) => git(dir, ['remote']).out.split('\n').includes(REMOTE);
const remoteHasBranch = (dir) => git(dir, ['rev-parse', '-q', '--verify', `refs/remotes/${REMOTE}/${BRANCH}`]).ok;

// ------------------------------------------------------------ the lock

const lockFile = (root) => path.join(os.tmpdir(),
  `flow-records-${crypto.createHash('sha1').update(path.resolve(root)).digest('hex').slice(0, 12)}.lock`);

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Run `fn` holding the project's lock. Waits up to 20 seconds, and takes over
 * a lock older than 2 minutes, which only a process that died leaves behind.
 */
function locked(root, fn) {
  const file = lockFile(root);
  const until = Date.now() + 20000;
  for (;;) {
    try {
      fs.writeFileSync(file, String(process.pid), { flag: 'wx' });
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        if (Date.now() - fs.statSync(file).mtimeMs > 120000) { fs.rmSync(file, { force: true }); continue; }
      } catch { continue; }
      if (Date.now() > until) return { ok: false, why: 'another Flow process held the records for 20 seconds' };
      sleep(100);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(file, { force: true });
  }
}

// ------------------------------------------------------------ saving

/** Commit everything in `.flow/`. Returns true when there was something to commit. */
function commitNow(root, message) {
  const dir = recordsOf(root);
  if (!git(dir, ['add', '-A']).ok) return false;
  if (git(dir, ['diff', '--cached', '--quiet']).ok) return false;
  return git(dir, [...identity(dir), 'commit', '-q', '--no-verify', '-m', message]).ok;
}

/** Commit the records. Nothing in a local project or at home. */
function commit(root, message) {
  if (!onBranch(root)) return false;
  const done = locked(root, () => ({ ok: true, made: commitNow(root, message) }));
  return !!done.made;
}

/**
 * Bring the other people's work down: commit what is here, then replay it on
 * top of theirs. A clash on the same lines of the same ticket stops the
 * replay and puts it back, keeping what this machine wrote, committed.
 */
function pullNow(root) {
  const dir = recordsOf(root);
  if (!hasRemote(dir)) return { ok: true, came: 0 };
  commitNow(root, 'saved before a pull');
  const fetched = git(root, ['fetch', '-q', REMOTE, BRANCH]);
  if (!fetched.ok) {
    if (/couldn't find remote ref/i.test(fetched.err)) return { ok: true, came: 0 };
    return { ok: false, offline: true, why: fetched.err.split('\n').pop() };
  }
  const before = git(dir, ['rev-parse', 'HEAD']).out;
  const replayed = git(dir, [...identity(dir), 'rebase', '-q', `${REMOTE}/${BRANCH}`]);
  if (!replayed.ok) {
    const clash = git(dir, ['diff', '--name-only', '--diff-filter=U']).out.split('\n').filter(Boolean);
    git(dir, ['rebase', '--abort']);
    return { ok: false, clash, why: `someone else changed the same lines of ${clash.join(', ') || 'a ticket'}` };
  }
  const diff = git(dir, ['diff', '--name-only', before, 'HEAD']).out;
  return { ok: true, came: diff ? diff.split('\n').length : 0 };
}

/** Send the branch up. `rejected` means someone pushed first; anything else failing reads as offline. */
function pushNow(root) {
  const dir = recordsOf(root);
  if (!hasRemote(dir)) return { ok: true, sent: 0 };
  const ahead = remoteHasBranch(dir)
    ? Number(git(dir, ['rev-list', '--count', `${REMOTE}/${BRANCH}..HEAD`]).out || 0)
    : 1;
  if (!ahead) return { ok: true, sent: 0 };
  const pushed = git(root, ['push', '-q', '-u', REMOTE, `refs/heads/${BRANCH}:refs/heads/${BRANCH}`]);
  if (pushed.ok) return { ok: true, sent: ahead };
  const rejected = /rejected|fetch first|non-fast-forward/i.test(pushed.err);
  return { ok: false, rejected, offline: !rejected, why: pushed.err.split('\n').pop() };
}

/** Commit, pull, push. What the hooks and a status move run. */
function sync(root, message = 'saved') {
  if (!onBranch(root)) return { ok: true, skipped: true };
  return locked(root, () => {
    commitNow(root, message);
    const pulled = pullNow(root);
    if (!pulled.ok) return pulled;
    const pushed = pushNow(root);
    return pushed.ok ? { ...pushed, came: pulled.came } : pushed;
  });
}

/** Pull alone, before a number is taken. */
function pull(root) {
  if (!onBranch(root)) return { ok: true, skipped: true };
  return locked(root, () => pullNow(root));
}

/**
 * Commit a new ticket and push it before its id is shown. A refused push
 * pulls, renumbers the ticket if its number was taken, and tries again. No
 * `was:` is written, since nobody saw the first number. `id` is the number the
 * ticket took; the one it ends with comes back. A failure leaves the ticket
 * committed here, and the caller takes it back.
 */
function claim(root, id) {
  if (!onBranch(root)) return { ok: true, id };
  return locked(root, () => {
    commitNow(root, `${id}: new`);
    let current = id;
    for (let attempt = 0; attempt < 5; attempt++) {
      const pushed = pushNow(root);
      if (pushed.ok) return { ok: true, id: current };
      if (!pushed.rejected) return { ok: false, offline: true, id: current, why: pushed.why };
      const pulled = pullNow(root);
      if (!pulled.ok) return { ...pulled, id: current };
      const moved = renumber(root, `${REMOTE}/${BRANCH}`, { keepWas: false }).find((r) => r.from === current);
      if (moved) current = moved.to;
    }
    return { ok: false, id: current, why: 'the push was refused 5 times in a row' };
  });
}

/**
 * Run `sync` in a process of its own, so a status move never waits on the
 * network. `flowHome` names the machine's Flow folder where it is not the
 * usual one. Its failures go to the failure log. At home it runs `flow sync`'s
 * own save, the same checkpoint for ~/.flow/.
 */
function syncLater(root, flowHome) {
  const args = store.isHome(root) ? ['--home'] : onBranch(root) ? ['--project', root] : null;
  if (!args) return;
  try {
    // `flowHome` is the machine's Flow folder where a command was given `--root`.
    const env = flowHome ? { ...process.env, FLOW_HOME: flowHome } : process.env;
    const child = spawn(process.execPath, [path.join(__dirname, '..', '..', 'records-sync.js'), ...args, '--now'], {
      detached: true, stdio: 'ignore', env,
    });
    child.unref();
  } catch {
    // The next status move or hook pushes it.
  }
}

// ------------------------------------------------------------ clashes

/**
 * 2 tickets holding one id after a pull. The one already on the remote keeps
 * it, and every other takes the next free number. Deps and parents pointing at
 * the old id are rewritten only in tickets the remote never saw, since those
 * are the ones that meant the ticket renumbered here.
 *
 * A project's new ticket meets this only inside `claim`, before its id is
 * shown, so it keeps no `was:`. ~/.flow/ sends its tickets every 30 minutes
 * rather than at creation, so a number shown there can be taken by another
 * machine meanwhile: `flow sync` renumbers it, keeping the old id as `was:`.
 */
function renumber(root, remoteRef = `${REMOTE}/${BRANCH}`, { keepWas = true } = {}) {
  const dir = recordsOf(root);
  const tickets = store.readTickets(root);
  const byId = new Map();
  for (const t of tickets) byId.set(t.id, [...(byId.get(t.id) || []), t]);
  const clashes = [...byId.values()].filter((list) => list.length > 1);
  if (!clashes.length) return [];

  const remote = new Set(git(dir, ['ls-tree', '-r', '--name-only', remoteRef]).out
    .split('\n').filter((f) => f.endsWith('/ticket.md')).map((f) => path.basename(path.dirname(f))));
  const local = tickets.filter((t) => !remote.has(t.dirName));
  const renamed = [];

  for (const list of clashes) {
    const keep = list.find((t) => remote.has(t.dirName)) || list[0];
    for (const t of list) {
      if (t === keep) continue;
      const to = store.nextId(store.readTickets(root), tickets.prefix);
      const folder = path.join(path.dirname(t.dir), `${to}-${store.labelOf(t)}`);
      fs.renameSync(t.dir, folder);
      t.dir = folder;
      t.dirName = path.basename(folder);
      t.file = path.join(folder, 'ticket.md');
      if (keepWas) t.data.was = t.id;
      t.data.id = to;
      for (const other of local) {
        if (other === t) continue;
        const deps = other.data.deps.map((d) => (d === t.id ? to : d));
        const parent = other.data.parent === t.id ? to : other.data.parent;
        if (deps.join() !== other.data.deps.join() || parent !== other.data.parent) {
          other.data.deps = deps;
          other.data.parent = parent;
          store.writeTicket(other);
        }
      }
      renamed.push({ from: t.id, to });
      t.id = to;
      store.writeTicket(t);
    }
  }
  commitNow(root, `renumbered ${renamed.map((r) => `${r.from} → ${r.to}`).join(', ')}`);
  return renamed;
}

/** The nearest folder at or above `from` whose `.flow/` is a checkout of the `flow` branch, or null. */
function projectAt(from) {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    if (onBranch(dir)) return dir;
    if (path.dirname(dir) === dir) return null;
  }
}

// ------------------------------------------------------------ setting up

/**
 * Check the `flow` branch out at `.flow/`: the one on the remote where a
 * teammate already made it, a new orphan branch otherwise. `.flow/` must be
 * missing or empty, since git refuses to check out into a full folder.
 */
function checkOut(root) {
  const dir = recordsOf(root);
  // A `.flow/` deleted by hand, or by `flow restore project`, stays registered
  // with git until pruned, and git refuses to check out over it.
  git(root, ['worktree', 'prune']);
  if (hasRemote(root)) git(root, ['fetch', '-q', REMOTE, BRANCH]);
  const local = git(root, ['rev-parse', '-q', '--verify', `refs/heads/${BRANCH}`]).ok;
  const remote = remoteHasBranch(root);
  let made;
  if (local) made = git(root, ['worktree', 'add', '-q', dir, BRANCH]);
  else if (remote) made = git(root, ['worktree', 'add', '-q', '--track', '-b', BRANCH, dir, `${REMOTE}/${BRANCH}`]);
  else made = git(root, ['worktree', 'add', '-q', '--orphan', '-b', BRANCH, dir]);
  if (!made.ok) return { ok: false, why: made.err.split('\n').pop() };
  return { ok: true, joined: local || remote };
}

module.exports = {
  BRANCH, REMOTE, onBranch, projectAt, commit, pull, sync, syncLater, claim, renumber, checkOut, remoteHasBranch, hasRemote,
};
