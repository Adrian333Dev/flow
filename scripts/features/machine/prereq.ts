/**
 * What has to be on a machine before Flow runs, checked by running it.
 *
 * A prerequisite is something Flow calls and never installs: the 6 programs it
 * shells out to, and a Claude Code recent enough for Flow. Everything Flow puts on a machine itself belongs to
 * `flow doctor`'s other checks, where a missing piece is repaired rather than
 * treated as a wall. util is one of those: `flow install` clones and links it.
 *
 * `flow doctor` is the one caller: whole, or alone through `--prereq`, which
 * works before Flow is installed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { FlowError } from '../../shared/error.ts';

/** The programs Flow shells out to, with what stops working without each. */
const PROGRAMS = [
  { name: 'node', why: 'every script Flow ships is Node' },
  { name: 'git', why: 'a project is found by asking git for its root' },
  { name: 'claude', why: 'Flow is a workflow for Claude Code' },
  { name: 'gh', why: 'your Flow home is kept in a private GitHub repository through it' },
  { name: 'pnpm', why: "the scripts' type check (TypeScript) installs and runs through it" },
  { name: 'rg', why: 'flow tickets delete searches for mentions of the ticket with ripgrep' },
];

/**
 * The newest Claude Code release read against Flow (line 1 of
 * `.flow/research/claude-code/releases-read-against-flow.md`), and so the oldest
 * Flow runs on. Raised with each release check. The README's Install section
 * repeats it.
 */
const MIN_CLAUDE = '2.1.310';

/**
 * The oldest Node that runs Flow's TypeScript scripts directly. Type stripping
 * is stable from 24.12.0; 24.3.0 to 24.11 run it but print an experimental
 * warning to stderr on every hook.
 */
const MIN_NODE = '24.12.0';

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

/** The 6 programs, resolved on PATH. */
function checkPrograms() {
  const problems : string[] = [];
  const found : string[] = [];
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
 * stop every install the day Claude Code changes what it prints. A release
 * newer than MIN_CLAUDE is a note, never a problem: nobody has read it against
 * Flow yet, and it may still work.
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
  const notes = olderThan(parseRelease(MIN_CLAUDE), release)
    ? [`Claude Code ${found} is newer than ${MIN_CLAUDE}, the newest release read against Flow: run the release check`]
    : [];
  return { name, problems: [], notes, summary: `${found}, and Flow needs ${MIN_CLAUDE} or later` };
}

/**
 * The `node` on PATH, the one every hook starts, against MIN_NODE. Judged like
 * checkClaude: missing is checkPrograms' problem, and unreadable output passes.
 */
function checkNode() {
  const name = 'node';
  const full = onPath('node');
  if (!full) return { name, problems: [], summary: 'not on PATH, named above' };
  const ran = spawnSync(full, ['--version'], { encoding: 'utf8', timeout: 10000 });
  const release = parseRelease(ran.stdout);
  if (!release) return { name, problems: [], summary: `node --version printed nothing readable, so ${MIN_NODE} or later is assumed` };
  const found = release.join('.');
  if (olderThan(release, parseRelease(MIN_NODE))) {
    return { name, problems: [`Node ${found} is older than ${MIN_NODE}, the oldest release that runs Flow's TypeScript scripts: install a newer Node`], summary: '' };
  }
  return { name, problems: [], summary: `${found}, and Flow needs ${MIN_NODE} or later` };
}

/** The checks, in the shape `flow doctor` renders. */
const checks = () => [checkPrograms(), checkNode(), checkClaude()];

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

export { PROGRAMS, MIN_CLAUDE, MIN_NODE, onPath, checkPrograms, checkNode, checkClaude, checks, problems, demand };
