'use strict';
/**
 * Every skill repository keeping itself current.
 *
 * A source is a skill repository cloned into `~/.flow/repos/sources/`, the
 * domain-skills repository being the first. Its skills reach a project or the
 * machine as links into the clone, so pulling it makes every place holding
 * one current at once. No migration is involved: Flow being behind means a
 * plan and a yes, and a skill being behind means a pull.
 *
 * The `SessionStart` hook starts `scripts/skills-pull.js` in the background
 * and returns at once, so a session never waits for the network. That script
 * calls `run` below, which does this for each clone:
 *
 *   uncommitted work in the clone   nothing is pulled, and a note says so
 *   "skillsAutoUpdate": false a fetch, and a note naming what is behind
 *   otherwise                       git pull --ff-only
 *
 * A pull that would not fast-forward is refused by `--ff-only` itself, and the
 * note carries what git said. Either refusal would otherwise wreck work
 * sitting in that clone, which is the whole reason the 2 guards exist. A pull
 * that changed something is a line in `~/.flow/history.jsonl`.
 *
 * The notes are `~/.flow/skills-update.json`, and the hook prints them at the
 * top of every session until they are gone. They are also what keeps this
 * cheap: the job only runs when a clone has not fetched for `STALE_HOURS`, or
 * when a note is waiting and the news needs checking again.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const history = require('./history');
const repos = require('./repos');
const settings = require('./settings');
const links = require('./skill-links');

const NOTE = 'skills-update.json';
const LOCK = 'skills-update.lock';

/** How old the last fetch has to be before a session goes looking again. */
const STALE_HOURS = 6;

/** When a lock left behind by a killed run stops counting. */
const LOCK_MINUTES = 10;

/** git in one folder, returning what it printed and whether it worked. */
function git(dir, args) {
  const ran = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

const firstLine = (text) => (text || '').split('\n')[0].trim();

// ------------------------------------------------------------------ the clone

/** Every source cloned on this machine: its name in `ls`, and its folder. */
function clones(home) {
  return repos.names(repos.sources(home))
    .map((source) => ({ name: source.name, id: source.id, root: repos.sourceDir(home, source) }))
    .filter((c) => fs.existsSync(path.join(c.root, '.git')));
}

/**
 * Where git keeps that clone's own files.
 *
 * A submodule or a worktree has a `.git` file holding `gitdir: <folder>`, so
 * the folder has to be read rather than assumed.
 */
function gitDir(root) {
  const at = path.join(root, '.git');
  try {
    if (fs.statSync(at).isDirectory()) return at;
    const said = fs.readFileSync(at, 'utf8').trim().replace(/^gitdir:\s*/, '');
    return path.resolve(root, said);
  } catch {
    return at;
  }
}

/**
 * Whether the clone's news is old enough to go and look again.
 *
 * `FETCH_HEAD` is written by every fetch and every pull, so its age is the age
 * of the last look. A clone that never fetched here counts as stale.
 */
function stale(root, hours = STALE_HOURS) {
  try {
    const when = fs.statSync(path.join(gitDir(root), 'FETCH_HEAD')).mtimeMs;
    return Date.now() - when > hours * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

// ------------------------------------------------------------------- the note

const noteFile = (at) => path.join(at.flow, NOTE);

/** What the last run found, one note per clone, or null. Unreadable counts as nothing found. */
function readNote(at) {
  try {
    const found = JSON.parse(fs.readFileSync(noteFile(at), 'utf8'));
    return found && Array.isArray(found.notes) && found.notes.length ? found.notes : null;
  } catch {
    return null;
  }
}

function writeNote(at, notes) {
  if (!notes.length) return clearNote(at);
  fs.mkdirSync(at.flow, { recursive: true });
  fs.writeFileSync(noteFile(at), JSON.stringify({ at: new Date().toISOString(), notes }, null, 2) + '\n');
  return notes;
}

const clearNote = (at) => {
  fs.rmSync(noteFile(at), { force: true });
  return null;
};

/** The line a session prints for one note, or null where there is nothing to say. */
function line(note) {
  if (!note) return null;
  const where = note.clone || 'a skill repository';

  if (note.state === 'dirty') {
    return `${where} has ${note.files} uncommitted file${note.files === 1 ? '' : 's'}, so none of its skills was updated. ` +
      'Commit them, or update the clone by hand.';
  }
  if (note.state === 'blocked') {
    return `${where} could not be updated: ${note.why} Sort it out by hand.`;
  }
  if (note.state === 'behind') {
    const named = note.skills && note.skills.length
      ? `${note.skills.length} skill${note.skills.length === 1 ? '' : 's'} changed: ${note.skills.join(', ')}.`
      : `${note.count} commit${note.count === 1 ? '' : 's'} arrived.`;
    return `${where} is behind. ${named} Update it when you want them, or set "skillsAutoUpdate": true.`;
  }
  return null;
}

/** Every note's line, for the session to print. */
const lines = (notes) => (notes || []).map(line).filter(Boolean);

// -------------------------------------------------------------------- the job

/** Whether the clones update themselves. On unless the key says otherwise. */
const updates = (home) => settings.readGlobal(home).skillsAutoUpdate !== false;

/** Everything not committed in the clone, as a count, or null where git failed. */
function uncommitted(root) {
  const status = git(root, ['status', '--porcelain']);
  if (!status.ok) return null;
  return status.out ? status.out.split('\n').length : 0;
}

/** The skills whose folders hold any of the files changed between 2 commits. */
function skillsIn(root, range) {
  const changed = git(root, ['diff', '--name-only', range]);
  const files = (changed.out || '').split('\n').filter(Boolean);
  const found = [...links.scan(root).values()].map((s) => ({
    name: s.name,
    under: path.relative(root, s.dir).split(path.sep).join('/'),
  }));
  return [...new Set(files.flatMap((file) => found
    .filter((s) => s.under === '' || file.startsWith(`${s.under}/`))
    .map((s) => s.name)))].sort();
}

/**
 * How far behind the tracked branch the clone is, and which skills moved.
 *
 * Named per skill because that is the news: a user reads "react changed" and
 * decides, where "3 commits" says nothing about what they hold.
 */
function behind(root) {
  const counted = git(root, ['rev-list', '--count', 'HEAD..@{u}']);
  if (!counted.ok) return null;
  const count = Number(counted.out) || 0;
  if (!count) return { count: 0, skills: [] };
  return { count, skills: skillsIn(root, 'HEAD..@{u}') };
}

/**
 * One run at a time. Two sessions opening together would otherwise reach git
 * at the same moment, and the second would report a lock file as a failure.
 * A lock older than `LOCK_MINUTES` belongs to a run that was killed.
 */
function lock(at) {
  const dir = path.join(at.flow, LOCK);
  fs.mkdirSync(at.flow, { recursive: true });
  try {
    fs.mkdirSync(dir);
  } catch {
    let held = 0;
    try {
      held = Date.now() - fs.statSync(dir).mtimeMs;
    } catch {
      return null;
    }
    if (held < LOCK_MINUTES * 60 * 1000) return null;
    fs.rmSync(dir, { recursive: true, force: true });
    try {
      fs.mkdirSync(dir);
    } catch {
      return null;
    }
  }
  return () => fs.rmSync(dir, { recursive: true, force: true });
}

/** One clone: pull it, or fetch and say what is waiting. Returns its note, or null. */
function one(at, clone) {
  const { root, name } = clone;
  const dirty = uncommitted(root);
  if (dirty === null) return null;
  if (dirty > 0) return { state: 'dirty', files: dirty, clone: name };

  if (updates(at.flow)) {
    const before = repos.head(root);
    const pulled = git(root, ['pull', '--ff-only', '--quiet']);
    if (!pulled.ok) return { state: 'blocked', why: firstLine(pulled.err), clone: name };
    const after = repos.head(root);
    if (before && after && before !== after) {
      history.record(at.flow, { type: 'pull', source: clone.id, from: before, to: after, changed: skillsIn(root, `${before}..${after}`) });
    }
    return null;
  }

  const fetched = git(root, ['fetch', '--quiet']);
  if (!fetched.ok) return { state: 'blocked', why: firstLine(fetched.err), clone: name };
  const found = behind(root);
  if (!found || !found.count) return null;
  return { state: 'behind', ...found, clone: name };
}

/** Every clone in turn, and the notes they leave. */
function work(at) {
  return writeNote(at, clones(at.flow).map((c) => one(at, c)).filter(Boolean));
}

/** The job under the lock, which is what `scripts/skills-pull.js` calls. */
function run(at) {
  const release = lock(at);
  if (!release) return null;
  try {
    return work(at);
  } finally {
    release();
  }
}

/**
 * Whether a session should start the job at all: a clone that has not fetched
 * for hours, or a note waiting, which is checked again every session so it
 * stops printing the moment the user has pulled by hand.
 */
function due(at) {
  const found = clones(at.flow);
  if (!found.length) return false;
  return !!readNote(at) || found.some((c) => stale(c.root));
}

module.exports = {
  NOTE, LOCK, STALE_HOURS, git, clones, gitDir, stale,
  noteFile, readNote, writeNote, clearNote, line, lines,
  updates, uncommitted, behind, work, run, due,
};
