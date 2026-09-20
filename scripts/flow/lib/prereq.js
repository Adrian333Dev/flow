'use strict';
/**
 * What has to be on a machine before Flow runs, checked by running it.
 *
 * A prerequisite is something Flow calls and never installs: the 3 programs it
 * shells out to, and the 3 util commands. Everything Flow puts on a machine
 * itself belongs to `flow doctor`'s other checks, where a missing piece is
 * repaired rather than treated as a wall.
 *
 * Two callers, and a failure stops both. `flow doctor --prereq` is step 0 of
 * /flow:setup-machine, /flow:setup-project and /flow:migrate: one command with
 * an exit code, in place of a skill typing shell lines and reading them back.
 * `apply-migration.js` runs the same list again before it changes its first
 * path, so a skill that skipped step 0 still writes nothing.
 *
 * **Checked by running, never by reading the commit a submodule pins.** The
 * pin names the version checked out, and the 2 come apart the moment the user
 * edits util.
 *
 * Two things are deliberately absent. The domain-skills clone, because Flow
 * never calls it: a machine with no clone sets Flow up like any other and adds
 * domain skills the day it has one. `lab/toolbox`, because it is temporary and
 * gets replaced whole, so a check written against it dies with it.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { FlowError } = require('./error');
const { expandHome } = require('./machine');

/** The programs Flow shells out to, with what stops working without each. */
const PROGRAMS = [
  { name: 'node', why: 'every script Flow ships is Node' },
  { name: 'git', why: 'a project is found by asking git for its root' },
  { name: 'claude', why: 'Flow is a workflow for Claude Code' },
];

/**
 * The util commands Flow calls, and the only hand-maintained list Flow has.
 *
 * Nothing anywhere declares this dependency, so the list is written out, and
 * the caller beside each entry says what stops working when it fails.
 */
const UTIL_COMMANDS = [
  { name: 'fs tree', callers: 'home/AGENTS.md, in tree-for-structure' },
  { name: 'fs merge', callers: 'home/AGENTS.md, in merge-for-bulk-reads' },
  { name: 'fs open', callers: 'flow get --files, through tickets.js' },
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

/**
 * The util commands, proved by running each one.
 *
 * `--help` rather than reading util's registry: it exits 0 only when the
 * command resolved and ran, so it catches a util clone too old to carry the
 * command as well as one that was never registered. Re-deriving util's own
 * resolution rules inside Flow would drift from them instead.
 */
function checkUtil() {
  const problems = [];
  for (const command of UTIL_COMMANDS) {
    const run = spawnSync('util', [...command.name.split(' '), '--help'], { stdio: 'ignore' });
    if (run.error && run.error.code === 'ENOENT') {
      return {
        name: 'util',
        problems: ['util is not on PATH at all, so none of the 3 commands Flow calls can run'],
      };
    }
    if (run.status !== 0) problems.push(`util ${command.name} does not run, and it is called by ${command.callers}`);
  }

  // A failure above is nearly always the registry rather than the command,
  // because nothing is built into util: it reads ~/.util/sources and every
  // command comes out of a directory named there.
  if (problems.length) problems.push(...registryDiagnosis());

  return { name: 'util', problems, summary: `${UTIL_COMMANDS.map((c) => c.name).join(', ')} all run` };
}

/** Why a util command is missing, read off util's own source registry. */
function registryDiagnosis() {
  const file = path.join(process.env.UTIL_HOME || path.join(os.homedir(), '.util'), 'sources');
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [`${file} does not exist, so no source is registered: run util install`];
  }
  const paths = text.split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(expandHome);
  if (!paths.length) return [`${file} is empty, so no source is registered: run util install`];
  const gone = paths.filter((p) => !fs.existsSync(p));
  if (gone.length) return gone.map((p) => `${file} names ${p}, which does not exist: util source drop it, or re-run util install`);
  return [`${file} names ${paths.length} live source(s), so the command itself is missing from util's clone`];
}

/** Both checks, in the shape `flow doctor` renders. */
const checks = () => [checkPrograms(), checkUtil()];

/** Every problem across both checks, as flat lines. */
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

module.exports = { PROGRAMS, UTIL_COMMANDS, onPath, checkPrograms, checkUtil, checks, problems, demand };
