'use strict';
/**
 * Migrations: a change to where Flow and the harnesses keep their files,
 * proposed by the session `flow install`, `flow init` or `flow update` opens.
 *
 *   ~/.flow/migrations/<machine or project>/<date-time>/
 *   ├─ migration.md   the form the user reads and ticks
 *   └─ files/         the new version of each file it writes, at files/<full path>
 *
 * The folder sits beside the project's original, named the same way:
 * `lib/machine/originals.js` says how.
 *
 * At go, a setup session runs `record-originals.js` on every path the form's
 * file list names, then makes each ticked change with its own tools. Nothing
 * here reads the form: `lab/archive/` holds the parser and the script that ran
 * it until 2026-10-08.
 */

const path = require('path');
const { FlowError } = require('../error');
const originals = require('./originals');
const paths = require('../paths');

const home = (at) => path.join(at.flow, 'migrations');

/**
 * The command that carries a stopped run on, named for its `type`. Every
 * run is opened by a command, so every one is carried on by typing it again.
 */
function resume(found) {
  const inside = found.project ? `in ${paths.shorten(found.project)}, ` : '';
  if (found.type === 'setup-machine') return 'run flow install';
  if (found.type === 'setup-project') return `${inside}run flow init`;
  if (found.type === 'migrate') return 'run flow update';
  return 'open the run that wrote it again';
}

/** No setup may record the migrations or the originals, or anything holding them. */
function guard(p, at) {
  for (const kept of [home(at), originals.home(at)]) {
    if (p === kept || p.startsWith(kept + path.sep) || kept.startsWith(p + path.sep)) {
      throw new FlowError(`${p} holds ${path.basename(kept)}, and a setup may not touch it.`);
    }
  }
}

module.exports = { home, resume, guard };
