'use strict';
/**
 * The domain-skills clone keeping itself current.
 *
 * A domain skill carries knowledge about one field or tool, such as React. The
 * skills reach a project as symlinks into a clone of the domain-skills
 * repository, so pulling that clone makes every project holding one current at
 * once. Nothing else has to run, and no migration is involved: Flow being
 * behind means a plan and a yes, and a domain skill being behind means a pull.
 *
 * The `SessionStart` hook starts `scripts/domain-pull.js` in the background
 * and returns at once, so a session never waits for the network. That script
 * calls `run` below, which is the whole job:
 *
 *   uncommitted work in the clone   nothing is pulled, and a note says so
 *   "domainSkillsAutoUpdate": false a fetch, and a note naming what is behind
 *   otherwise                       git pull --ff-only
 *
 * A pull that would not fast-forward is refused by `--ff-only` itself, and the
 * note carries what git said. Either refusal would otherwise wreck work
 * sitting in that clone, which is the whole reason the 2 guards exist.
 *
 * The note is `~/.flow/skills-update.json`, and the hook prints it at the top
 * of every session until it is gone. It is also what keeps this cheap: the job
 * only runs when the clone has not fetched for `STALE_HOURS`, or when a note
 * is waiting and the news needs checking again.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
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

/**
 * The clone holding the domain skills, or null where there is none.
 *
 * `domainSkills` in `~/.flow/settings.local.json` names the `skills/` folder
 * rather than the clone, because that is what the link commands read. The walk
 * up finds the repository it sits in, however deep it was put.
 */
function skillsClone() {
  const { dir } = links.domainSetting();
  if (!dir) return null;
  let at = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(at, '.git'))) return at;
    const up = path.dirname(at);
    if (up === at) return null;
    at = up;
  }
}

/**
 * Where git keeps that clone's own files.
 *
 * A submodule's `.git` is a file holding `gitdir: ../../.git/modules/<name>`,
 * and `lab/domain-skills` in the Flow clone is exactly that, so the folder has
 * to be read rather than assumed.
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

/** What the last run found, or null. Unreadable counts as nothing found. */
function readNote(at) {
  try {
    const found = JSON.parse(fs.readFileSync(noteFile(at), 'utf8'));
    return found && typeof found === 'object' ? found : null;
  } catch {
    return null;
  }
}

function writeNote(at, note) {
  fs.mkdirSync(at.flow, { recursive: true });
  fs.writeFileSync(noteFile(at), JSON.stringify({ at: new Date().toISOString(), ...note }, null, 2) + '\n');
  return note;
}

const clearNote = (at) => {
  fs.rmSync(noteFile(at), { force: true });
  return null;
};

/** The one line a session prints for a note, or null where there is nothing to say. */
function line(note) {
  if (!note) return null;
  const where = note.clone || 'the domain-skills clone';

  if (note.state === 'dirty') {
    return `${where} has ${note.files} uncommitted file${note.files === 1 ? '' : 's'}, so no domain skill was updated. ` +
      'Commit them, or update the clone by hand.';
  }
  if (note.state === 'blocked') {
    return `${where} could not be updated: ${note.why} Sort it out by hand.`;
  }
  if (note.state === 'behind') {
    const named = note.skills && note.skills.length
      ? `${note.skills.length} domain skill${note.skills.length === 1 ? '' : 's'} changed: ${note.skills.join(', ')}.`
      : `${note.count} commit${note.count === 1 ? '' : 's'} arrived.`;
    return `${where} is behind. ${named} Update it when you want them, or set "domainSkillsAutoUpdate": true.`;
  }
  return null;
}

// -------------------------------------------------------------------- the job

/** Whether the clone updates itself. On unless the key says otherwise. */
const updates = (home) => settings.readGlobal(home).domainSkillsAutoUpdate !== false;

/** Everything not committed in the clone, as a count, or null where git failed. */
function uncommitted(root) {
  const status = git(root, ['status', '--porcelain']);
  if (!status.ok) return null;
  return status.out ? status.out.split('\n').length : 0;
}

/**
 * How far behind the tracked branch the clone is, and which skills moved.
 *
 * Named per skill because that is the news: a user reads "react changed" and
 * decides, where "3 commits" says nothing about what they hold.
 */
function behind(root, skillsDir) {
  const counted = git(root, ['rev-list', '--count', 'HEAD..@{u}']);
  if (!counted.ok) return null;

  const count = Number(counted.out) || 0;
  if (!count) return { count: 0, skills: [] };

  const changed = git(root, ['diff', '--name-only', 'HEAD..@{u}']);
  const under = path.relative(root, skillsDir).split(path.sep).join('/') + '/';
  const skills = [...new Set((changed.out || '').split('\n')
    .filter((file) => file.startsWith(under))
    .map((file) => file.slice(under.length).split('/')[0])
    .filter(Boolean))].sort();
  return { count, skills };
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

/**
 * Pull the clone, or fetch and say what is waiting. Returns the note it wrote,
 * or null when there is nothing to report.
 */
function work(at) {
  const root = skillsClone();
  if (!root) return clearNote(at);

  const dirty = uncommitted(root);
  if (dirty === null) return clearNote(at);
  if (dirty > 0) return writeNote(at, { state: 'dirty', files: dirty, clone: root });

  if (updates(at.flow)) {
    const pulled = git(root, ['pull', '--ff-only', '--quiet']);
    if (pulled.ok) return clearNote(at);
    return writeNote(at, { state: 'blocked', why: firstLine(pulled.err), clone: root });
  }

  const fetched = git(root, ['fetch', '--quiet']);
  if (!fetched.ok) return writeNote(at, { state: 'blocked', why: firstLine(fetched.err), clone: root });

  const found = behind(root, links.domainSetting().dir);
  if (!found || !found.count) return clearNote(at);
  return writeNote(at, { state: 'behind', ...found, clone: root });
}

/** The job under the lock, which is what `scripts/domain-pull.js` calls. */
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
  const root = skillsClone();
  if (!root) return false;
  return !!readNote(at) || stale(root);
}

module.exports = {
  NOTE, LOCK, STALE_HOURS, git, skillsClone, gitDir, stale,
  noteFile, readNote, writeNote, clearNote, line,
  updates, uncommitted, behind, work, run, due,
};
