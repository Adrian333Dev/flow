'use strict';
/**
 * settings.json: what Flow itself reads, as opposed to what Claude Code reads.
 *
 *   ~/.flow/settings.json        this machine and the next one, since
 *                                ~/.flow/ is one git repository shared between
 *                                them
 *   ~/.flow/settings.local.json  this machine alone, and git ignores it. Every
 *                                setting holding a path goes here, because the
 *                                other machine keeps its clone somewhere else
 *   <project>/.flow/settings.json  one project, committed with it
 *
 * The 2 machine files are read as one, and the local file wins key by key, so
 * a machine can override a shared setting without editing the shared file.
 * `readGlobal` and `globalKey` are that pair; `read` is one named file.
 *
 * Keys sit at the top level: `sources`, `skills`, and one per line Flow
 * prints by itself. A new setting is a new key, and nothing here is shaped
 * around a fixed set. `skills` is the one key merged name by name across all
 * 3 files, the project's included, and `lib/skill-links.js` does that merge.
 *
 * Reading never throws. A hook reads these files as a session opens and on
 * every message, and a missing, empty or corrupt file has to mean the
 * defaults, never a crash.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const flowHome = () => process.env.FLOW_HOME || path.join(os.homedir(), '.flow');
const globalFile = (home) => path.join(home || flowHome(), 'settings.json');
const localFile = (home) => path.join(home || flowHome(), 'settings.local.json');
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
 * Two sessions can write at once. Rename is atomic on one filesystem, so a
 * reader sees the old file or the new one and never half of either.
 */
function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(temp, file);
}

/** Both machine files as one object, the local one winning key by key. */
const readGlobal = (home) => ({ ...read(globalFile(home)), ...read(localFile(home)) });

/**
 * One machine setting, and the file it sits in, for a message that says where
 * to put it. A setting neither file holds names the local file, which is where
 * a path belongs.
 */
function globalKey(key, home) {
  const local = read(localFile(home));
  if (key in local) return { file: localFile(home), value: local[key] };
  const shared = read(globalFile(home));
  if (key in shared) return { file: globalFile(home), value: shared[key] };
  return { file: localFile(home), value: undefined };
}

// ------------------------------------------------ what Flow prints by itself

/**
 * Whether Flow prints one of the lines it puts on screen on its own, rather
 * than because a command was typed. Each one carries a key of its own,
 * `"reminder": false`, read by the script that does the printing.
 *
 * On unless the key says false, so a machine whose settings file is missing,
 * empty or corrupt still gets every line.
 */
const prints = (name, home) => readGlobal(home)[name] !== false;

module.exports = {
  flowHome, globalFile, localFile, projectFile, read, readGlobal, globalKey, prints, write,
};
