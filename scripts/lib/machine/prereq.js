'use strict';
/**
 * What has to be on a machine before Flow runs, checked by running it.
 *
 * A prerequisite is something Flow calls and never installs: the 4 programs it
 * shells out to, and a Claude Code recent enough for Flow. Everything Flow puts on a machine itself belongs to
 * `flow doctor`'s other checks, where a missing piece is repaired rather than
 * treated as a wall. util is one of those: `flow install` clones and links it.
 *
 * Two callers, and a failure stops both. The check each session Flow opens
 * runs first, `flow install --check` and `flow update --check`, runs this
 * list: one command with an exit code, in place of an agent typing shell lines and
 * reading them back. `apply-migration.js` runs the same list again before it
 * changes its first path, so a session that skipped its check still writes
 * nothing.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { FlowError } = require('../error');

/** The programs Flow shells out to, with what stops working without each. */
const PROGRAMS = [
  { name: 'node', why: 'every script Flow ships is Node' },
  { name: 'git', why: 'a project is found by asking git for its root' },
  { name: 'claude', why: 'Flow is a workflow for Claude Code' },
  { name: 'gh', why: 'your Flow home is kept in a private GitHub repository through it' },
];

/**
 * The oldest Claude Code Flow runs on. Raised when the release check finds Flow
 * relying on something newer. The README's Install section repeats it.
 */
const MIN_CLAUDE = '2.1.287';

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

/** The 4 programs, resolved on PATH. */
function checkPrograms() {
  const problems = [];
  const found = [];
  for (const program of PROGRAMS) {
    if (onPath(program.name)) found.push(program.name);
    else problems.push(`${program.name} is not on PATH, and ${program.why}`);
  }
  return { name: 'programs', problems, summary: `${found.join(', ')} all resolve` };
}

/** `2.1.288` as `[2, 1, 288]`, or null for anything else. */
function parseRelease(text) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(text || '');
  return match ? match.slice(1).map(Number) : null;
}

function olderThan(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

/**
 * Claude Code's release, against MIN_CLAUDE. A claude that is missing is
 * checkPrograms' problem, so it is skipped here. Output this cannot read
 * passes: the check exists to stop a release known to be too old, never to
 * stop every install the day Claude Code changes what it prints.
 */
function checkClaude() {
  const name = 'claude code';
  const full = onPath('claude');
  if (!full) return { name, problems: [], summary: 'not on PATH, named above' };
  const ran = spawnSync(full, ['--version'], { encoding: 'utf8', timeout: 10000 });
  const release = parseRelease(ran.stdout);
  if (!release) return { name, problems: [], summary: `claude --version printed nothing readable, so ${MIN_CLAUDE} or later is assumed` };
  const found = release.join('.');
  if (olderThan(release, parseRelease(MIN_CLAUDE))) {
    return { name, problems: [`Claude Code ${found} is older than ${MIN_CLAUDE}, the oldest release Flow runs on: run claude update`], summary: '' };
  }
  return { name, problems: [], summary: `${found}, and Flow needs ${MIN_CLAUDE} or later` };
}

/** The checks, in the shape `flow doctor` renders. */
const checks = () => [checkPrograms(), checkClaude()];

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

module.exports = { PROGRAMS, MIN_CLAUDE, onPath, checkPrograms, checkClaude, checks, problems, demand };
