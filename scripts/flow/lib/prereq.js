'use strict';
/**
 * What has to be on a machine before Flow runs, checked by running it.
 *
 * A prerequisite is something Flow calls and never installs: the 3 programs it
 * shells out to. Everything Flow puts on a machine itself belongs to
 * `flow doctor`'s other checks, where a missing piece is repaired rather than
 * treated as a wall. util is one of those: `flow install` clones and links it.
 *
 * Two callers, and a failure stops both. `flow doctor --prereq` is step 0 of
 * `flow setup`, /flow:setup-project and /flow:migrate: one command with
 * an exit code, in place of a skill typing shell lines and reading them back.
 * `apply-migration.js` runs the same list again before it changes its first
 * path, so a skill that skipped step 0 still writes nothing.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');

/** The programs Flow shells out to, with what stops working without each. */
const PROGRAMS = [
  { name: 'node', why: 'every script Flow ships is Node' },
  { name: 'git', why: 'a project is found by asking git for its root' },
  { name: 'claude', why: 'Flow is a workflow for Claude Code' },
];

/**
 * Where a name resolves on PATH, or null.
 *
 * A PATH walk rather than spawning `which`: a broken symlink fails the execute
 * check here for the same reason it fails for the shell, and this costs no
 * process.
 */
function onPath(name) {
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    try {
      const full = path.join(dir, name);
      fs.accessSync(full, fs.constants.X_OK);
      return full;
    } catch {
      // Not here, or not executable. Either way the next directory decides.
    }
  }
  return null;
}

/** The 3 programs, resolved on PATH. */
function checkPrograms() {
  const problems = [];
  const found = [];
  for (const program of PROGRAMS) {
    if (onPath(program.name)) found.push(program.name);
    else problems.push(`${program.name} is not on PATH, and ${program.why}`);
  }
  return { name: 'programs', problems, summary: `${found.join(', ')} all resolve` };
}

/** The check, in the shape `flow doctor` renders. */
const checks = () => [checkPrograms()];

/** Every problem, as flat lines. */
const problems = () => checks().flatMap((check) => check.problems);

/**
 * Stop unless every prerequisite holds. `nothing` says what did not happen,
 * in the caller's own words, so the message ends on the state of the machine.
 */
function demand(nothing = 'nothing ran') {
  const found = problems();
  if (!found.length) return;
  throw new FlowError(
    `${found.length === 1 ? 'a prerequisite' : `${found.length} prerequisites`} of Flow's are not met, so ${nothing}:\n` +
    `${found.map((p) => `  ${p}`).join('\n')}\n` +
    '  Fix it, then run this again. flow doctor --prereq checks the same list.'
  );
}

module.exports = { PROGRAMS, onPath, checkPrograms, checks, problems, demand };
