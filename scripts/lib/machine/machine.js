'use strict';
/**
 * What a machine Flow is on has to have: a finished setup, and the one line
 * `~/.claude/CLAUDE.md` holds. Where the folders sit is `lib/paths.js`.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const paths = require('../paths');
const { FlowError } = require('../error');

/**
 * Refuse every command on a machine where `flow install` never finished.
 *
 * `~/.flow/version` holds the number of the newest changelog entry this
 * machine applied, written by the last step of a setup or a migration, so
 * its absence means the run never reached the end. Nothing else can catch this:
 * Flow's hooks reach ~/.claude/settings.json only when the setup merges them,
 * so before it runs there is no hook to fire and no rule file loaded. The
 * commands that put Flow on a machine or take it off say `anywhere: true` and
 * skip it.
 *
 * A setup running right now passes too. Its migration runs `flow skills` to
 * take over the user's outside skills, and it stamps the version only after
 * the check at its end, so it would otherwise refuse its own steps.
 * `~/.flow/run.json` naming `setup-machine` is how the run says so.
 */
function requireSetup(root) {
  const at = paths.folders(root);
  if (fs.existsSync(path.join(at.flow, 'version'))) return;
  // Required here, not at the top: lib/setup.js loads half the library, and a
  // hook reaching this line wants none of it on a machine that is set up.
  const run = require('../setup').readRun(at);
  if (run && run.type === 'setup-machine') return;
  throw new FlowError('Flow is not set up on this machine. Run flow install.');
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

module.exports = { importLine, requireSetup };
