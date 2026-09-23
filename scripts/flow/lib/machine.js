'use strict';
/**
 * Where Flow goes on a machine: 3 folders under the home folder.
 *
 *   ~/.agents  the one real copy of every file Flow keeps outside the clone:
 *              the rule file AGENTS.md, and the plugin folder skills/flow/
 *   ~/.claude  what Claude Code reads. It reaches ~/.agents through a link and
 *              an import, and holds no original of Flow's
 *   ~/.flow    what only Flow reads: the clones in repos/, scripts/,
 *              references/, docs/ and the settings
 *
 * `~/.agents` holds the originals because the name belongs to no vendor.
 * Claude Code does not read it, so it gets a link.
 *
 * `flow install --root <dir>` and `flow doctor --root <dir>` put all 3 under
 * `<dir>` instead, which is how the tests and lab/scripts/try.sh build a whole
 * machine inside tmp/. One flag for all 3, so no run can redirect some of them
 * and write the rest into the real home folder.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { FlowError } = require('./error');

/**
 * The 3 folders, under `root` or under the home folder.
 *
 * FLOW_HOME moves the last one on its own, the way `lib/settings.js` reads it,
 * so a test can point Flow's own folder somewhere else without moving the
 * other 2. `--root` wins over it: that flag exists to put a whole
 * machine in one place.
 */
function folders(root) {
  const base = path.resolve(root || os.homedir());
  const flow = !root && process.env.FLOW_HOME ? path.resolve(process.env.FLOW_HOME) : path.join(base, '.flow');
  return {
    base,
    agents: path.join(base, '.agents'),
    claude: path.join(base, '.claude'),
    flow,
  };
}

/**
 * Refuse every command on a machine where /flow:setup-machine never finished.
 *
 * `~/.flow/version` holds the number of the newest changelog entry this
 * machine applied, written by the last step of a setup or a migration, so
 * its absence means the run never reached the end. Nothing else can catch this:
 * Flow's hooks reach ~/.claude/settings.json only when that skill merges them,
 * so before it runs there is no hook to fire and no rule file loaded. The
 * commands that put Flow on a machine or take it off say `anywhere: true` and
 * skip it.
 */
function requireSetup(root) {
  const at = folders(root);
  if (fs.existsSync(path.join(at.flow, 'version'))) return;
  throw new FlowError('Flow is not set up on this machine. Run flow install again.');
}

/**
 * The one line `~/.claude/CLAUDE.md` holds, pulling in the real rule file,
 * read from its template, home/CLAUDE.md.
 *
 * `~` only where the base is the home folder. A scratch base sits somewhere
 * else, and Claude Code reads `~` as the real home folder whatever the config
 * folder is, so there the line names the file by its full path.
 */
function importLine(clone, base) {
  const line = fs.readFileSync(path.join(clone, 'home', 'CLAUDE.md'), 'utf8').trim();
  return base === os.homedir() ? line : line.replace('@~/', `@${base}${path.sep}`);
}

/** `$HOME` and a leading `~` are what a settings file or a hook line holds instead of a path. */
const expandHome = (p) => p.replace(/^~(?=\/|$)/, os.homedir()).split('$HOME').join(os.homedir());

/** A path under the home folder, written with `~`, for output. */
const shorten = (p) => (p === os.homedir() || p.startsWith(os.homedir() + path.sep)
  ? '~' + p.slice(os.homedir().length)
  : p);

module.exports = { folders, importLine, requireSetup, shorten, expandHome };
