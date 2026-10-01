'use strict';
/**
 * `~/.flow/` as one private git repository, which is how Flow reaches every
 * other machine.
 *
 * One repository, never one per folder, and always called `flow-home` on the
 * user's GitHub account. The name never changes, so every machine finds it
 * through `gh` without asking, and a second repository made by mistake cannot
 * happen: GitHub refuses the name, and install joins the one already there.
 * `FLOW_HOME_REMOTE` stands in for GitHub in the tests and in
 * lab/scripts/try.sh, and is never a way to pick another repository.
 *
 * Everything of the user's that should travel lives in `~/.flow/` already: the
 * rules and profile, the workflow notes, the study cases, the private skills,
 * the wiki, and the tickets made outside any project. A project travels
 * through its own repository, and Flow leaves it alone.
 *
 * What describes this machine alone never travels, and `IGNORED` below is that
 * list:
 *
 *   version       the changelog entry this machine reached. Another machine's
 *                 number here claims migrations that never ran
 *   run.json      a half-finished run on this machine
 *   setup-prompt.md, setup-settings.json, migrate-prompt.md   what a setup
 *                 or an update session was handed, rebuilt each run
 *   originals/    this machine's disk as it was before Flow. Putting another
 *                 machine's back would write its files over this one's
 *   restore.md    the form `flow restore` and `flow uninstall` hand over,
 *                 about this machine's paths, deleted once read
 *   settings.local.json   every setting holding a path, the clone included
 *   scripts, references, docs   links into this machine's clone, which sits
 *                 somewhere else on the other machine
 *   repos/        this machine's clones: Flow, util, the toolbox and every
 *                 source. `sources` travels, and `flow install` clones them
 *   logs/         what happened on this machine: the last install, every
 *                 change Flow made, every failure, every rule check
 *   skills-update.*   what this machine's source clones are behind by, and
 *                 the lock the job that reads it holds
 *   records-sync.json   when this machine last sent each project's tickets
 *                 and this folder, which paces the Stop hook's sends
 *   status-line.json   which ticket each of this machine's sessions works on,
 *                 and how far `flow status-line` read its transcript
 *   audit/, changes/   what this machine's sessions left: the transcript
 *                 index, and what each subagent changed
 *   a wiki tool's downloads   pages fetched once per machine
 *   node_modules/   what a prototype in a ticket installed, fetched again
 *                 wherever it runs
 *   projects-local/   the tickets of every project set up with
 *                 `--machine-only`, which the user kept on this machine
 *
 * Each machine keeps one record in the repository, `machines/<name>.json`:
 * its name, the day it joined, and the changelog entry it is on. `flow install`
 * sends it up the moment the machine joins, so a name is claimed before
 * another machine can be offered it. The highest
 * entry among them is the entry the Flow home is on. A machine below it has
 * not run the migration another machine already ran on its own copy, so it
 * neither sends nor fetches until `flow update` brings it level.
 *
 * A commit is named for the machine that made it, `desktop: 2 files`, so a
 * line in a note can be traced to where it was written.
 *
 * `README.md` warns whoever opens the repository on GitHub. The first machine
 * sends it with the first commit, and `flow update` rewrites it.
 *
 * `flow sync` can be typed, and `flow install` connects the repository once.
 * It also runs by itself, from scripts/records-sync.js: after a status move on
 * a ticket here, after a reply once 30 minutes have passed, and when a session
 * ends. `skills-pull.js` fetches it too, so a session can say another machine
 * moved ahead.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { FlowError } = require('./error');

/** The repository's name on the user's GitHub account. Never configurable. */
const NAME = 'flow-home';

/** What the repository's page on GitHub says under its name. */
const DESCRIPTION = 'Managed by Flow. Never rename, edit or make public.';

/** The first line of the ignore file, which is how a Flow home is told apart. */
const MARK = '# What belongs to this machine alone.';

/** What stays on the machine it was written on. */
const IGNORED = [
  MARK,
  'version',
  'run.json',
  'setup-prompt.md',
  'setup-settings.json',
  'migrate-prompt.md',
  'originals/',
  'restore.md',
  'settings.local.json',
  'scripts',
  'references',
  'docs',
  'repos/',
  'logs/',
  'skills-update.json',
  'skills-update.lock',
  'records-sync.json',
  'status-line.json',
  'audit/',
  'changes/',
  'wiki/*/downloads/',
  'node_modules/',
  'projects-local/',
  '',
].join('\n');

/**
 * git in one folder, returning what it printed and whether it worked. Never a
 * password prompt: a remote with no stored sign-in fails instead of waiting
 * on a terminal nobody may be watching.
 */
function git(dir, args) {
  const ran = spawnSync('git', args, {
    cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

/** gh, the same way. */
function gh(args) {
  const ran = spawnSync('gh', args, { encoding: 'utf8' });
  if (ran.error) return { ok: false, out: '', err: 'gh is not installed' };
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

const isRepo = (at) => fs.existsSync(path.join(at.flow, '.git'));

/**
 * This machine's name, from git's `flow.machine`, which `util git` reads too
 * where `util.machine` is missing. Read from the Flow home where it exists, so
 * a name set in that repository alone wins, as the tests set it.
 */
function machineName(at) {
  const set = git(fs.existsSync(at.flow) ? at.flow : os.tmpdir(), ['config', '--get', 'flow.machine']);
  return set.ok && set.out ? set.out : null;
}

/** Save this machine's name in the global git config. Returns why it failed, or null. */
function saveName(name) {
  const set = git(os.tmpdir(), ['config', '--global', 'flow.machine', name]);
  return set.ok ? null : set.err;
}

/** The name a record and a commit carry: the machine's own, or the home folder's. */
const nameOf = (at) => machineName(at) || path.basename(at.base);

/**
 * git's `-c` pair naming who commits, where git has no name set. A new
 * machine often has none, and a commit Flow makes should never stop on it.
 */
function identity(at) {
  if (git(at.flow, ['config', '--get', 'user.email']).ok) return [];
  const name = nameOf(at);
  return ['-c', `user.name=${name}`, '-c', `user.email=${name}@flow-home`];
}

/** Everything not committed, as `2 files` or null. */
function changed(at) {
  if (!isRepo(at)) return null;
  const status = git(at.flow, ['status', '--porcelain']);
  if (!status.ok || !status.out) return null;
  const count = status.out.split('\n').length;
  return `${count} file${count === 1 ? '' : 's'}`;
}

/** The `.gitignore`, written every run so a new machine-only path reaches it. */
function writeIgnore(at) {
  fs.mkdirSync(at.flow, { recursive: true });
  fs.writeFileSync(path.join(at.flow, '.gitignore'), IGNORED);
}

/** The README, from the template in this clone. */
function writeReadme(at) {
  fs.mkdirSync(at.flow, { recursive: true });
  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'flow-home-README.md'), path.join(at.flow, 'README.md'));
}

// ------------------------------------------------------------ finding it

/**
 * The repository's address, a line saying how it was found, and whether it
 * exists yet. On GitHub it is `<login>/flow-home`, and it does not exist on
 * the first machine, where `create()` makes it. Reads only. `gh` must be
 * signed in: `flow install` sees to that first.
 */
function locate() {
  if (process.env.FLOW_HOME_REMOTE) {
    return { url: process.env.FLOW_HOME_REMOTE, said: `using ${process.env.FLOW_HOME_REMOTE}`, exists: true };
  }
  const login = gh(['api', 'user', '--jq', '.login']);
  if (!login.ok || !login.out) throw new FlowError(`gh could not say which GitHub account is signed in: ${login.err}`);
  const full = `${login.out}/${NAME}`;
  const url = `https://github.com/${full}.git`;
  if (gh(['repo', 'view', full, '--json', 'name']).ok) return { url, full, said: `found ${full} on GitHub`, exists: true };
  return { url, full, exists: false };
}

/** Make the repository `locate()` found missing: private, with the warning as its description. */
function create(found) {
  const made = gh(['repo', 'create', NAME, '--private', '--description', DESCRIPTION]);
  if (!made.ok) throw new FlowError(`gh could not make ${found.full}: ${made.err}`);
  return `made ${found.full} on GitHub, private`;
}

/**
 * Turn `~/.flow/` into a repository and point it at `url`. Idempotent: an
 * existing repository keeps its history, and a remote already set is kept.
 * The address is read before it is kept, so one git cannot reach is refused
 * while the user is still at the install.
 */
function connect(at, url) {
  if (!isRepo(at)) {
    fs.mkdirSync(at.flow, { recursive: true });
    const made = git(at.flow, ['init', '-q', '-b', 'main']);
    if (!made.ok) throw new FlowError(`git init in ${at.flow} failed: ${made.err}`);
  }
  const reached = git(at.flow, ['ls-remote', url]);
  if (!reached.ok) throw new FlowError(`git cannot reach ${url}: ${reached.err.split('\n').pop()}`);

  const existing = git(at.flow, ['remote', 'get-url', 'origin']);
  if (existing.ok && existing.out === url) return;
  const set = git(at.flow, ['remote', existing.ok ? 'set-url' : 'add', 'origin', url]);
  if (!set.ok) throw new FlowError(`could not point origin at ${url}: ${set.err}`);
}

/** The remote's `main` fetched into `origin/main`. False where the remote has none yet. */
function fetch(at) {
  const heads = git(at.flow, ['ls-remote', '--heads', 'origin', 'main']);
  if (!heads.ok) throw new FlowError(`git cannot reach the Flow home's repository: ${heads.err.split('\n').pop()}`);
  if (!heads.out) return false;
  const fetched = git(at.flow, ['fetch', '-q', 'origin', 'main']);
  if (!fetched.ok) throw new FlowError(`could not fetch the Flow home's repository: ${fetched.err.split('\n').pop()}`);
  return true;
}

/** How long a fetch counts as fresh, the same 6 hours the skill repositories wait. */
const FETCH_HOURS = 6;

/**
 * Whether the background job should fetch: a repository with a remote, last
 * fetched more than 6 hours ago. What it fetches is what `ahead()` reads.
 */
function fetchDue(at) {
  if (!isRepo(at) || !git(at.flow, ['remote', 'get-url', 'origin']).ok) return false;
  try {
    return Date.now() - fs.statSync(path.join(at.flow, '.git', 'FETCH_HEAD')).mtimeMs > FETCH_HOURS * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

// ------------------------------------------------------ the machine records

const recordFile = (at, name) => path.join(at.flow, 'machines', `${name}.json`);

/**
 * Write this machine's record: the entry it is on now. The day it joined is
 * kept from the record already there.
 */
function writeRecord(at, number) {
  const name = nameOf(at);
  const file = recordFile(at, name);
  let joined = new Date().toISOString().slice(0, 10);
  try {
    joined = JSON.parse(fs.readFileSync(file, 'utf8')).joined || joined;
  } catch {
    // No record yet: this machine joins today.
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ name, joined, flowVersion: number }, null, 2) + '\n');
  return file;
}

/**
 * Every record `ref` holds, `origin/main` being what was last fetched.
 * A record that does not parse is skipped: a hand edit should never stop a
 * sync on its own.
 */
function records(at, ref) {
  const listed = git(at.flow, ['ls-tree', '--name-only', `${ref}:machines`]);
  if (!listed.ok || !listed.out) return [];
  const found = [];
  for (const file of listed.out.split('\n').filter((f) => f.endsWith('.json'))) {
    const shown = git(at.flow, ['show', `${ref}:machines/${file}`]);
    try {
      const record = JSON.parse(shown.out);
      if (Number.isInteger(record.flowVersion)) found.push({ name: record.name || file.slice(0, -5), number: record.flowVersion });
    } catch {
      // Not a record Flow wrote.
    }
  }
  return found;
}

/** The record with the highest entry, which is the entry the Flow home is on, or null. */
function highest(at, ref) {
  return records(at, ref).reduce((best, r) => (!best || r.number > best.number ? r : best), null);
}

/**
 * The machine ahead of this one, from what was last fetched: `{ name, number }`
 * or null. Reads no network, so the session check can ask it.
 */
function ahead(at, mine) {
  if (!isRepo(at) || !git(at.flow, ['rev-parse', '-q', '--verify', 'origin/main']).ok) return null;
  const top = highest(at, 'origin/main');
  return top && mine !== null && top.number > mine ? top : null;
}

// ------------------------------------------------------------ joining

const hasHead = (at) => git(at.flow, ['rev-parse', '-q', '--verify', 'HEAD']).ok;

/**
 * What an install will find in the Flow home, read before anything is made.
 * Fetches, and changes nothing else.
 *
 *   { state: 'kept', taken }      this machine has committed before
 *   { state: 'first', taken }     the repository holds nothing yet
 *   { state: 'version', home, name }   the Flow home is on another entry
 *                                 than this clone, which `flow install` fixes
 *                                 by switching the clone first
 *   { state: 'join', files, from, taken }   another machine's files, ready
 *                                 to come down
 *
 * `taken` is every name a record holds. Refuses a repository that is not a
 * Flow home, and a `~/.flow/` already holding a file the download would
 * write over.
 */
function inspect(at, newest) {
  if (hasHead(at)) return { state: 'kept', taken: records(at, 'HEAD').map((r) => r.name) };
  if (!fetch(at)) return { state: 'first', taken: [] };

  const url = git(at.flow, ['remote', 'get-url', 'origin']).out;
  const ignore = git(at.flow, ['show', 'origin/main:.gitignore']);
  if (!ignore.ok || ignore.out.split('\n')[0] !== MARK) {
    throw new FlowError(`${url} holds something other than a Flow home, so nothing came down. ` +
      `Rename that repository on GitHub, then run flow install again.`);
  }

  const found = records(at, 'origin/main');
  const top = highest(at, 'origin/main');
  if (top && newest !== null && top.number !== newest) return { state: 'version', home: top.number, name: top.name };

  const files = git(at.flow, ['ls-tree', '-r', '--name-only', 'origin/main']).out.split('\n').filter(Boolean);
  const inTheWay = files.filter((f) => f !== '.gitignore' && fs.existsSync(path.join(at.flow, f)));
  if (inTheWay.length) {
    throw new FlowError(`${at.flow} already holds ${inTheWay.join(', ')}, and your other machine's copies would ` +
      'go on top of them. Move them out of it, run flow install again, then copy back what you want to keep.');
  }
  return { state: 'join', files: files.length, from: found.map((r) => r.name), taken: found.map((r) => r.name) };
}

/** Bring what `inspect()` found down onto this machine, the first time. */
function join(at) {
  fs.rmSync(path.join(at.flow, '.gitignore'), { force: true });
  const out = git(at.flow, ['checkout', '-q', '-B', 'main', 'origin/main']);
  if (!out.ok) throw new FlowError(`could not bring the Flow home down: ${out.err}`);
  writeIgnore(at);
}

/**
 * Commit `files` and send them up. Returns the push's error, or null. A
 * failed commit throws: nothing is sent where nothing was saved.
 */
function commitAndPush(at, files, message) {
  const staged = git(at.flow, ['add', ...files]);
  if (!staged.ok) throw new FlowError(`could not stage ${at.flow}: ${staged.err}`);
  const made = git(at.flow, [...identity(at), 'commit', '-q', '-m', message]);
  if (!made.ok) throw new FlowError(`could not commit ${at.flow}: ${made.err}`);
  const sent = git(at.flow, ['push', '-q', 'origin', 'main']);
  return sent.ok ? null : sent.err.split('\n')[0];
}

/**
 * Send this machine's record up the moment it joins, so the name is claimed.
 * A push that fails is not a stop: the files are here, and the next
 * `flow sync` sends the record. Returns the push's error, or null.
 */
function claim(at, number) {
  const file = path.relative(at.flow, writeRecord(at, number));
  return commitAndPush(at, [file], `${nameOf(at)}: joins`);
}

/**
 * On the first machine, send the ignore file, the README and this machine's
 * record up at once, as the Flow home's first commit. A second machine
 * installed before the first ever synced then still finds files and joins,
 * where an empty repository would have made it a first machine too, with a
 * history git refuses to merge.
 */
function seed(at, number) {
  writeIgnore(at);
  writeReadme(at);
  const file = path.relative(at.flow, writeRecord(at, number));
  const failed = commitAndPush(at, ['.gitignore', 'README.md', file], `${nameOf(at)}: the Flow home starts`);
  if (failed) throw new FlowError(`committed here, and the push failed:\n  ${failed}`);
}

/**
 * Switch a clone to the release a Flow home is on, `v<number>`. Only ever
 * called on the clone `install.sh` made, never on one somebody works in.
 */
function switchClone(clone, number) {
  const tag = `v${number}`;
  const fetched = git(clone, ['fetch', '-q', 'origin', 'tag', tag]);
  if (!fetched.ok) return `could not fetch ${tag}: ${fetched.err.split('\n').pop()}`;
  const moved = git(clone, ['checkout', '-q', tag]);
  if (!moved.ok) return `could not switch to ${tag}: ${moved.err.split('\n').pop()}`;
  const subs = git(clone, ['submodule', 'update', '--init', '--recursive']);
  return subs.ok ? null : `switched to ${tag}, then could not update the submodules: ${subs.err.split('\n').pop()}`;
}

// ------------------------------------------------------------ syncing

/**
 * Save this machine's work, bring the other machines' down, send the result
 * up. `mine` is this machine's entry.
 *
 * Refuses before anything moves when another machine is on a higher entry:
 * this machine's copy still has the old shape, and a merge would mix the two.
 *
 * A commit first, then a merge, so the same file changed on 2 machines merges
 * where the changes touch different lines. Changes to the same lines stop it:
 * the merge is undone, and this machine's commit stays for the user to sort.
 *
 * `theirs` in what comes back is the remote as fetched, before the push.
 */
function sync(at, mine) {
  if (!isRepo(at)) throw new FlowError(`${at.flow} is not a repository yet. Run flow install, which connects it.`);
  const remote = fetch(at);
  if (remote) {
    const top = highest(at, 'origin/main');
    if (top && top.number > mine) {
      throw new FlowError(`your Flow home is on changelog entry ${top.number}, since ${top.name} moved to it, ` +
        `and this machine is on ${mine}. Nothing was synced. Run flow update first.`);
    }
  }
  // What the other machines had sent, before this machine's push joins it:
  // the one a clash on a ticket number is judged against.
  const theirs = remote ? git(at.flow, ['rev-parse', '-q', '--verify', 'origin/main']).out || null : null;

  const count = changed(at);
  let sent = null;
  if (count) {
    sent = `${nameOf(at)}: ${count}`;
    const staged = git(at.flow, ['add', '-A']);
    if (!staged.ok) throw new FlowError(`could not stage ${at.flow}: ${staged.err}`);
    const made = git(at.flow, [...identity(at), 'commit', '-q', '-m', sent]);
    if (!made.ok) throw new FlowError(`could not commit ${at.flow}: ${made.err}`);
  }

  let came = 0;
  if (remote && !hasHead(at)) {
    const out = git(at.flow, ['checkout', '-q', '-B', 'main', 'origin/main']);
    if (!out.ok) throw new FlowError(`could not bring the Flow home down: ${out.err}`);
    came = git(at.flow, ['ls-tree', '-r', '--name-only', 'HEAD']).out.split('\n').filter(Boolean).length;
  } else if (remote) {
    const before = git(at.flow, ['rev-parse', 'HEAD']).out;
    const merged = git(at.flow, [...identity(at), 'merge', '-q', '--no-edit', 'origin/main']);
    if (!merged.ok) {
      const clash = git(at.flow, ['diff', '--name-only', '--diff-filter=U']).out.split('\n').filter(Boolean);
      git(at.flow, ['merge', '--abort']);
      throw new FlowError(`another machine changed the same lines of ${clash.join(', ') || 'a file'}, so nothing came down ` +
        `and nothing went up. What this machine wrote is kept, committed in ${at.flow}. ` +
        'Merge origin/main there by hand, then run flow sync again.');
    }
    const diff = git(at.flow, ['diff', '--name-only', before, 'HEAD']).out;
    came = diff ? diff.split('\n').length : 0;
  }

  const unsent = remote
    ? Number(git(at.flow, ['rev-list', '--count', 'origin/main..HEAD']).out || 0)
    : Number(git(at.flow, ['rev-list', '--count', 'HEAD']).out || 0);
  if (unsent > 0) {
    const pushed = git(at.flow, ['push', '-q', 'origin', 'main']);
    if (!pushed.ok) throw new FlowError(`committed here, and the push failed:\n  ${pushed.err.split('\n')[0]}`);
  }
  return { came, sent, pushed: unsent, theirs };
}

module.exports = {
  NAME, MARK, IGNORED, git, gh, isRepo, machineName, saveName, nameOf, changed, writeIgnore, writeReadme,
  locate, create, connect, fetch, fetchDue, writeRecord, records, highest, ahead, inspect, join, claim, seed,
  switchClone, sync,
};
