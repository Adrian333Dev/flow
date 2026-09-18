'use strict';
/**
 * Where Flow goes on a machine: 4 folders under the home folder.
 *
 *   ~/.agents  the one real copy of every file Flow keeps outside the clone:
 *              the rule file AGENTS.md, and the plugin folder skills/flow/
 *   ~/.claude  what Claude Code reads. It reaches ~/.agents through a link and
 *              an import, and holds no original of Flow's
 *   ~/.codex   what Codex reads. AGENTS.md here is a link into ~/.agents
 *   ~/.flow    what only Flow reads: scripts/ and references/
 *
 * `~/.agents` holds the originals because the name belongs to no vendor, and
 * Codex already reads skills from it. Claude Code does not, so it gets a link.
 *
 * `flow install --root <dir>` and `flow doctor --root <dir>` put all 4 under
 * `<dir>` instead, which is how the tests and lab/scripts/try.sh build a whole
 * machine inside tmp/. One flag for all 4, so no run can redirect some of them
 * and write the rest into the real home folder.
 */

const os = require('os');
const path = require('path');

/** The 4 folders, under `root` or under the home folder. */
function folders(root) {
  const base = path.resolve(root || os.homedir());
  return {
    base,
    agents: path.join(base, '.agents'),
    claude: path.join(base, '.claude'),
    codex: path.join(base, '.codex'),
    flow: path.join(base, '.flow'),
  };
}

/**
 * The one line `~/.claude/CLAUDE.md` holds, pulling in the real rule file.
 *
 * `~` only where the base is the home folder. A scratch base sits somewhere
 * else, and Claude Code reads `~` as the real home folder whatever the config
 * folder is, so there the line names the file by its full path.
 */
function importLine(base) {
  const file = path.join(base, '.agents', 'AGENTS.md');
  return `@${base === os.homedir() ? '~/.agents/AGENTS.md' : file}`;
}

/** A path under the home folder, written with `~`, for output. */
const shorten = (p) => (p === os.homedir() || p.startsWith(os.homedir() + path.sep)
  ? '~' + p.slice(os.homedir().length)
  : p);

module.exports = { folders, importLine, shorten };
