'use strict';
/**
 * `~/.flow/` as one private git repository, which is how Flow reaches every
 * other machine.
 *
 * One repository, never one per folder, and always called `flow-home` on the
 * user's GitHub account. The name never changes, so every machine finds it
 * through `gh` without asking, and a second repository made by mistake cannot
 * happen: GitHub refuses the name, and install joins the one already there.
 * `FLOW_HOME_REMOTE` stands in for GitHub in the tests, and is never a way to
 * pick another repository.
 *
 * Everything of the user's that should travel lives in `~/.flow/` already: the
 * rules, the workflow notes, the study cases, the private skills,
 * the wiki, and the tickets made outside any project. A project travels
 * through its own repository, and Flow leaves it alone.
 *
 * What describes this machine alone never travels, and `IGNORED` below is that
 * list:
 *
 *   settings.local.json   every setting holding a path, the clone included
 *   scripts, references, docs   links into this machine's clone, which sits
 *                 somewhere else on the other machine
 *   repos/        this machine's clones: Flow and util
 *   logs/         what happened on this machine: the last install, every
 *                 change Flow made, every failure, every rule check
 *   records-sync.json  when this machine last sent each project's tickets
 *                 and this folder, which paces the Stop hook's sends
 *   registry.json  the projects on this machine and their folders
 *                 (lib/registry.js)
 *   status-line.json   left by the retired status line on older machines
 *   audit/, changes/   what this machine's sessions left: the transcript
 *                 index, and what each subagent changed
 *   projects/*\/restarts/   retired: the dialogue files of restarted windows,
 *                 which may remain on older machines
 *   projects/*\/replies/    the agent's replies the mod saved on this machine
 *   a wiki tool's downloads   pages fetched once per machine
 *   node_modules/   what a prototype in a ticket installed, fetched again
 *                 wherever it runs
 *   version, run.json, setup-prompt.md, setup-settings.json, migrate-prompt.md,
 *   originals/, restore.md, skills-update.json, skills-update.lock   retired:
 *                 the setup sessions' files, the version stamp and the skill
 *                 repositories' pull. They stay on disk until the user deletes
 *                 them, and without a line here `flow sync` would send them
 *
 * Each machine keeps one record in the repository, `machines/<name>.json`:
 * its name and the day it joined. `flow install` sends it up the moment the
 * machine joins, so a name is claimed before another machine can be offered
 * it.
 *
 * A commit is named for the machine that made it, `pc-wsl: 2 files`, so a
 * line in a note can be traced to where it was written.
 *
 * `README.md` warns whoever opens the repository on GitHub. The first machine
 * sends it with the first commit.
 *
 * `flow sync` can be typed, and `flow install` connects the repository once.
 * It also runs by itself, from scripts/jobs/records-sync.js: after a status move on
 * a ticket here, after a reply once 30 minutes have passed, and when a session
 * ends.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { FlowError } = require('../error');
const { git, gh, DURABLE } = require('../git');
const tickets = require('../tickets/records');
const store = require('../tickets/store');

/** The repository's name on the user's GitHub account. Never configurable. */
const NAME = 'flow-home';

/** What the repository's page on GitHub says under its name. */
const DESCRIPTION = 'Managed by Flow. Never rename, edit or make public.';

/** The first line of the ignore file, which is how a Flow home is told apart. */
const MARK = '# What belongs to this machine alone.';

/**
 * What stays on the machine it was written on. Each path starts with `/`,
 * since git matches a bare name at any depth: `version` alone would also hide
 * a private project's `projects/shop/version`, and `docs` a ticket's
 * `docs/`. `node_modules/` is the one meant at any depth.
 */
const IGNORED = [
  MARK,
  '/version',
  '/run.json',
  '/setup-prompt.md',
  '/setup-settings.json',
  '/migrate-prompt.md',
  '/originals/',
  '/restore.md',
  '/settings.local.json',
  '/scripts',
  '/references',
  '/docs',
  '/repos/',
  '/logs/',
  '/skills-update.json',
  '/skills-update.lock',
  '/records-sync.json',
  '/registry.json',
  '/status-line.json',
  '/audit/',
  '/changes/',
  '/projects/*/restarts/',
  '/projects/*/replies/',
  '/wiki/*/downloads/',
  'node_modules/',
  '',
].join('\n');

const isRepo = (at) => fs.existsSync(path.join(at.flow, '.git'));

/** A repository with a remote to send to, which `flow install` always leaves. */
const connected = (at) => isRepo(at) && git(at.flow, ['remote', 'get-url', 'origin']).ok;

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
  fs.copyFileSync(path.join(__dirname, '..', '..', 'templates', 'flow-home-README.md'), path.join(at.flow, 'README.md'));
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
  if (!reached.ok) throw new FlowError(`git cannot reach ${url}: ${tickets.reason(reached.err)}`);

  const existing = git(at.flow, ['remote', 'get-url', 'origin']);
  if (existing.ok && existing.out === url) return;
  const set = git(at.flow, ['remote', existing.ok ? 'set-url' : 'add', 'origin', url]);
  if (!set.ok) throw new FlowError(`could not point origin at ${url}: ${set.err}`);
}

/** The remote's `main` fetched into `origin/main`. False where the remote has none yet. */
function fetch(at) {
  const heads = git(at.flow, ['ls-remote', '--heads', 'origin', 'main']);
  if (!heads.ok) throw new FlowError(`git cannot reach the Flow home's repository: ${tickets.reason(heads.err)}`);
  if (!heads.out) return false;
  const fetched = git(at.flow, ['fetch', '-q', 'origin', 'main']);
  if (!fetched.ok) throw new FlowError(`could not fetch the Flow home's repository: ${tickets.reason(fetched.err)}`);
  return true;
}

// ------------------------------------------------------ the machine records

const recordFile = (at, name) => path.join(at.flow, 'machines', `${name}.json`);

/** Write this machine's record: its name and the day it joined, kept from the record already there. */
function writeRecord(at) {
  const name = nameOf(at);
  const file = recordFile(at, name);
  let joined = new Date().toISOString().slice(0, 10);
  try {
    joined = JSON.parse(fs.readFileSync(file, 'utf8')).joined || joined;
  } catch {
    // No record yet: this machine joins today.
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ name, joined }, null, 2) + '\n');
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
      found.push({ name: record.name || file.slice(0, -5) });
    } catch {
      // Not a record Flow wrote.
    }
  }
  return found;
}

// ------------------------------------------------------------ joining

const hasHead = (at) => git(at.flow, ['rev-parse', '-q', '--verify', 'HEAD']).ok;

/**
 * What an install will find in the Flow home, read before anything is made.
 * Fetches, and changes nothing else.
 *
 *   { state: 'kept', taken }      this machine has committed before
 *   { state: 'first', taken }     the repository holds nothing yet
 *   { state: 'join', files, from, taken }   another machine's files, ready
 *                                 to come down
 *
 * `taken` is every name a record holds. Refuses a repository that is not a
 * Flow home, and a `~/.flow/` already holding a file the download would
 * write over.
 */
function inspect(at) {
  if (hasHead(at)) return { state: 'kept', taken: records(at, 'HEAD').map((r) => r.name) };
  if (!fetch(at)) return { state: 'first', taken: [] };

  const url = git(at.flow, ['remote', 'get-url', 'origin']).out;
  const ignore = git(at.flow, ['show', 'origin/main:.gitignore']);
  if (!ignore.ok || ignore.out.split('\n')[0] !== MARK) {
    throw new FlowError(`${url} holds something other than a Flow home, so nothing came down. ` +
      `Rename that repository on GitHub, then run flow install again.`);
  }

  const found = records(at, 'origin/main');
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
 * failed commit throws: nothing is sent where nothing was saved. Files the
 * Flow home already holds as they are commit nothing and send nothing: a
 * rebuilt computer joining again under its old name.
 */
function commitAndPush(at, files, message) {
  const staged = git(at.flow, [...DURABLE, 'add', ...files]);
  if (!staged.ok) throw new FlowError(`could not stage ${at.flow}: ${staged.err}`);
  if (git(at.flow, ['diff', '--cached', '--quiet']).ok) return null;
  const made = git(at.flow, [...DURABLE, ...identity(at), 'commit', '-q', '-m', message]);
  if (!made.ok) throw new FlowError(`could not commit ${at.flow}: ${made.err || made.out}`);
  const sent = git(at.flow, ['push', '-q', 'origin', 'main']);
  return sent.ok ? null : sent.err.split('\n')[0];
}

/**
 * Send this machine's record up the moment it joins, so the name is claimed.
 * A push that fails is not a stop: the files are here, and the next
 * `flow sync` sends the record. Returns the push's error, or null.
 */
function claim(at) {
  const file = path.relative(at.flow, writeRecord(at));
  return commitAndPush(at, [file], `${nameOf(at)}: joins`);
}

/**
 * On the first machine, send the ignore file, the README and this machine's
 * record up at once, as the Flow home's first commit. A second machine
 * installed before the first ever synced then still finds files and joins,
 * where an empty repository would have made it a first machine too, with a
 * history git refuses to merge.
 */
function seed(at) {
  writeIgnore(at);
  writeReadme(at);
  const file = path.relative(at.flow, writeRecord(at));
  const failed = commitAndPush(at, ['.gitignore', 'README.md', file], `${nameOf(at)}: the Flow home starts`);
  if (failed) throw new FlowError(`committed here, and the push failed:\n  ${failed}`);
}

// ------------------------------------------------------------ syncing

/**
 * Save this machine's work, bring the other machines' down, send the result
 * up.
 *
 * A commit first, then a merge, so the same file changed on 2 machines merges
 * where the changes touch different lines. Changes to the same lines stop it:
 * the merge is undone, and this machine's commit stays for the user to sort.
 *
 * After the merge and before the push, each ticket folder in `roots` holding
 * a number the remote already gave out is renumbered, `was:` kept where
 * `keepWas` says, so the fix goes up with everything else.
 *
 * Returns `{ came, sent, pushed, renumbered }`, or `rejected` and `why` where
 * another machine pushed between the fetch and the push. Every other failure
 * throws.
 */
function sync(at, { roots = [], keepWas = true } = {}) {
  if (!isRepo(at)) throw new FlowError(`${at.flow} is not a repository yet. Run flow install, which connects it.`);
  const remote = fetch(at);
  // What the other machines had sent, before this machine's push joins it:
  // the one a clash on a ticket number is judged against.
  const theirs = remote ? git(at.flow, ['rev-parse', '-q', '--verify', 'origin/main']).out || null : null;

  const count = changed(at);
  let sent = null;
  if (count) {
    sent = `${nameOf(at)}: ${count}`;
    const staged = git(at.flow, [...DURABLE, 'add', '-A']);
    if (!staged.ok) throw new FlowError(`could not stage ${at.flow}: ${staged.err}`);
    const made = git(at.flow, [...DURABLE, ...identity(at), 'commit', '-q', '-m', sent]);
    if (!made.ok) throw new FlowError(`could not commit ${at.flow}: ${made.err || made.out}`);
  }

  let came = 0;
  if (remote && !hasHead(at)) {
    const out = git(at.flow, ['checkout', '-q', '-B', 'main', 'origin/main']);
    if (!out.ok) throw new FlowError(`could not bring the Flow home down: ${out.err}`);
    came = git(at.flow, ['ls-tree', '-r', '--name-only', 'HEAD']).out.split('\n').filter(Boolean).length;
  } else if (remote) {
    const before = git(at.flow, ['rev-parse', 'HEAD']).out;
    let merged = git(at.flow, [...DURABLE, ...identity(at), 'merge', '-q', '--no-edit', 'origin/main']);
    if (!merged.ok && tickets.keepHigherCounters(at.flow, tickets.conflicted(at.flow))) {
      merged = git(at.flow, [...DURABLE, ...identity(at), 'commit', '-q', '--no-edit']);
    }
    if (!merged.ok) {
      const clash = tickets.conflicted(at.flow);
      git(at.flow, ['merge', '--abort']);
      const stopped = new FlowError(`another machine changed the same lines of ${clash.join(', ') || 'a file'}, so nothing came down ` +
        `and nothing went up. What this machine wrote is kept, committed in ${at.flow}. ` +
        'Merge origin/main there by hand, then run flow sync again.');
      stopped.clash = clash;
      throw stopped;
    }
    const diff = git(at.flow, ['diff', '--name-only', before, 'HEAD']).out;
    came = diff ? diff.split('\n').length : 0;
  }

  const renumbered = roots.flatMap((root) => tickets.renumber(root, theirs || 'origin/main', { keepWas }));

  const unsent = remote
    ? Number(git(at.flow, ['rev-list', '--count', 'origin/main..HEAD']).out || 0)
    : Number(git(at.flow, ['rev-list', '--count', 'HEAD']).out || 0);
  if (unsent > 0) {
    const pushed = git(at.flow, ['push', '-q', 'origin', 'main']);
    if (!pushed.ok && tickets.pushRefused(pushed.err)) return { rejected: true, why: pushed.err.split('\n')[0], renumbered };
    if (!pushed.ok) throw new FlowError(`committed here, and the push failed:\n  ${pushed.err.split('\n')[0]}`);
  }
  return { came, sent, pushed: unsent, renumbered };
}

/**
 * Run `fn` holding the Flow home's lock, the one `flow new` and every sync
 * take, so a background sync and a typed command never meet inside git.
 */
function withLock(at, fn) {
  const done = tickets.locked(at.flow, () => ({ value: fn() }));
  if (!('value' in done)) throw new FlowError(done.why);
  return done.value;
}

/**
 * `sync`, renumbering the tickets of ~/.flow/ and of `linked`, a project whose `.flow/` links into the Flow home. A ticket
 * reaches the remote through `claimTicket` before anyone sees its number, so
 * a clash here is one made before that rule, or with no remote: its old id is
 * kept as `was:`. Returns what `sync` does, and throws what it throws.
 */
function syncHome(at, linked = null) {
  return withLock(at, () => {
    const result = sync(at, { roots: [at.flow, linked].filter(Boolean) });
    if (result.rejected) throw new FlowError(`committed here, and the push failed:\n  ${result.why}`);
    return result;
  });
}

/**
 * Push a new ticket before its id is shown: a home ticket, or a private
 * project's, `root` being the place that holds it. A push refused because
 * another machine sent first merges what it sent, renumbers the ticket where
 * that machine took its number, and tries again. No `was:` is written, since
 * nobody saw the first number. Returns `{ ok, id, why }`, `id` being the
 * number the ticket ends with. A failure leaves the ticket committed here, and
 * the caller takes it back.
 */
function claimTicket(at, root, id) {
  let current = id;
  try {
    return withLock(at, () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const result = sync(at, { roots: [root], keepWas: false });
        const moved = result.renumbered.find((r) => r.from === current);
        if (moved) current = moved.to;
        if (!result.rejected) return { ok: true, id: current };
      }
      return { ok: false, id: current, why: 'the push was refused 5 times in a row' };
    });
  } catch (e) {
    if (!(e instanceof FlowError)) throw e;
    // Both folders are named by the number alone, so the merge stops on both
    // adding the same file. The caller takes the ticket back, and the next
    // merge nets out: this side added the folder and then removed it.
    if ((e.clash || []).some((f) => f.split('/').includes(store.folderName(current)))) {
      return { ok: false, id: current, why: `another machine took ${current} first. Run it again.` };
    }
    return { ok: false, id: current, why: e.message };
  }
}

module.exports = {
  syncHome, claimTicket,
  NAME, MARK, IGNORED, isRepo, connected, machineName, saveName, nameOf, changed, writeIgnore, writeReadme,
  locate, create, connect, fetch, writeRecord, records, inspect, join, claim, seed, sync,
};
