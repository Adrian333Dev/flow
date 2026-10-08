'use strict';
/**
 * What a machine Flow is on has to have: a finished setup. Where the folders
 * sit is `lib/paths.js`.
 */

const fs = require('fs');
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

module.exports = { requireSetup };
