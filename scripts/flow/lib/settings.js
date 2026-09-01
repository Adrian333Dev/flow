'use strict';
/**
 * settings.json — what Flow itself reads, as opposed to what Claude Code reads.
 *
 *   ~/.flow/settings.json          global, and where a session entry lives
 *   <project>/.flow/settings.json  one project
 *
 * Keys sit at the top level. `git` is the only one today; a second setting is a
 * second key, and nothing here is shaped around there being exactly one.
 *
 * Reading never throws. `guard.js` calls it before every shell command the
 * agent runs, and a missing, empty or corrupt file has to mean the same thing
 * as a file that says off — never a crash that leaves the decision unmade.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const flowHome = () => process.env.FLOW_HOME || path.join(os.homedir(), '.flow');
const globalFile = () => path.join(flowHome(), 'settings.json');
const projectFile = (root) => path.join(root, '.flow', 'settings.json');

/** The settings object, or `{}` for anything unreadable. */
function read(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Write through a temp file in the same folder, then rename.
 *
 * The guard prunes an expired entry, and it runs once per shell command, so two
 * writes can land at once. Rename is atomic on one filesystem, so a reader sees
 * the old file or the new one and never half of either.
 */
function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(temp, file);
}

/** Drops a key, and the file itself once nothing is left in it. */
function remove(file, key) {
  const data = read(file);
  if (!(key in data)) return false;
  delete data[key];
  if (Object.keys(data).length) write(file, data);
  else fs.rmSync(file, { force: true });
  return true;
}

/** The nearest `.flow/settings.json` at or above `from`, or null. */
function findProjectFile(from) {
  let dir = path.resolve(from);
  for (;;) {
    const file = projectFile(dir);
    if (fs.existsSync(file)) return file;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// ------------------------------------------------------------- the git entry

const MODES = ['off', 'ask', 'allow'];

const expired = (entry) => !entry.until ? false : !(Date.parse(entry.until) > Date.now());

/** An entry is usable when it names a real mode and its clock has not run out. */
const live = (entry) =>
  !!entry && typeof entry === 'object' && MODES.includes(entry.mode) && !expired(entry);

/**
 * Which entry governs a git command, and which file holds it.
 *
 * Narrowest first, because the narrower scope is the more deliberate one: a
 * session entry was turned on inside the session asking, a project entry covers
 * one repository, and a global entry covers a machine.
 *
 * A `session` field is what makes the global file's entry session-scoped, so a
 * session entry belonging to a different session is not a global entry that
 * happens to be narrowed — it governs nothing here at all.
 */
function gitScope({ session, cwd }) {
  const global = globalFile();
  const entry = read(global).git;

  if (entry && entry.session) {
    if (entry.session === session) return { scope: 'session', file: global, entry };
  }

  const near = findProjectFile(cwd || process.cwd());
  if (near) {
    const found = read(near).git;
    if (found && !found.session) return { scope: 'project', file: near, entry: found };
  }

  if (entry && !entry.session) return { scope: 'global', file: global, entry };
  return { scope: null, file: null, entry: null };
}

/**
 * The mode in force, and the expired entry cleared on the way past.
 *
 * Pruning happens here rather than on a timer because there is nothing to run a
 * timer: the guard is the only thing that wakes up, and it wakes up on every
 * shell command. An entry the clock has run out on is deleted the first time
 * anything asks, which also collects entries left by sessions that ended.
 */
function gitMode(context) {
  const found = gitScope(context);
  if (!found.entry) return { mode: 'off', scope: null, entry: null };

  if (!live(found.entry)) {
    try {
      remove(found.file, 'git');
    } catch {
      // A read-only or vanished file still means off. Never block on cleanup.
    }
    return { mode: 'off', scope: null, entry: null, cleared: found.scope };
  }

  return { mode: found.entry.mode, scope: found.scope, entry: found.entry, file: found.file };
}

module.exports = {
  MODES, flowHome, globalFile, projectFile, findProjectFile,
  read, write, remove, gitScope, gitMode, expired, live,
};
