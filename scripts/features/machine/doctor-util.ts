/** The `flow doctor` checks of the tools beside Flow: util's commands, and both test suites. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as paths from '../../shared/paths.ts';
import { inspect } from './doctor-install.ts';

/**
 * The util commands Flow calls, and the only hand-maintained list Flow has.
 *
 * Nothing anywhere declares this dependency, so the list is written out, and
 * the caller beside each entry says what stops working when it fails.
 */
const UTIL_COMMANDS = [
  { name: 'fs tree', callers: 'home/CLAUDE.md, in tree-for-structure' },
];

/**
 * The util commands, proved by running each one.
 *
 * `--help` rather than reading util's registry: it exits 0 only when the
 * command resolved and ran, so it catches a util clone too old to carry the
 * command as well as one that was never registered. Re-deriving util's own
 * resolution rules inside Flow would drift from them instead.
 */
function checkUtil() {
  const problems : string[] = [];
  for (const command of UTIL_COMMANDS) {
    const run = runUtil(command.name);
    if (run.error && run.error.code === 'ENOENT') {
      return {
        name: 'util',
        problems: ['util is not on PATH at all, so the util commands Flow calls cannot run'],
      };
    }
    // A null status means the process never ran to an exit: the system
    // refused to start it, or killed it, which a busy machine does. That says
    // nothing about util, so it is not counted.
    if (run.status !== null && run.status !== 0) {
      problems.push(`util ${command.name} does not run, and it is called by ${command.callers}`);
    }
  }

  // A failure above is nearly always the registry rather than the command,
  // because nothing is built into util: it reads ~/.util/sources and every
  // command comes out of a directory named there.
  if (problems.length) problems.push(...registryDiagnosis());

  return { name: 'util', problems, summary: `${UTIL_COMMANDS.map((c) => c.name).join(', ')} ${UTIL_COMMANDS.length === 1 ? 'runs' : 'all run'}` };
}

/**
 * One util command's `--help`, retried up to 3 times while the process never
 * reaches an exit of its own, 200ms apart. Missing util is not retried.
 */
function runUtil(name) {
  let run;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    run = spawnSync('util', [...name.split(' '), '--help'], { stdio: 'ignore' });
    if (run.status !== null || (run.error && run.error.code === 'ENOENT')) break;
  }
  return run;
}

/** Why a util command is missing, read off util's own source registry. */
function registryDiagnosis() {
  const file = path.join(process.env.UTIL_HOME || path.join(os.homedir(), '.util'), 'sources');
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [`${file} does not exist, so no source is registered: run flow install`];
  }
  const listed = text.split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(paths.expandHome);
  if (!listed.length) return [`${file} is empty, so no source is registered: run flow install`];
  const gone = listed.filter((p) => !fs.existsSync(p));
  if (gone.length) return gone.map((p) => `${file} names ${p}, which does not exist: run flow install`);
  return [`${file} names ${listed.length} live source(s), so the command itself is missing from util's clone: run flow install`];
}

/**
 * Both suites, run rather than trusted.
 *
 * util's clone is found by resolving the name on PATH, because Flow has no
 * other way to know where it sits: it is a separate repository the user clones
 * wherever they like.
 */
function checkTests(clone, { bin }) {
  const problems : string[] = [];
  const ran : string[] = [];

  const suite = (dir) => spawnSync(process.execPath, ['--test', '**/*.test.ts'], { cwd: dir, stdio: 'ignore' });

  if (suite(path.join(clone, 'scripts')).status === 0) ran.push('flow');
  else problems.push(`the flow suite fails: run npm test in ${path.join(clone, 'scripts')}`);

  const util = bin ? inspect(path.join(bin, 'util')) : { state: 'missing' };
  if (util.state !== 'ok') {
    problems.push('util is not linked, so its suite could not be found');
  } else {
    const utilClone = path.dirname(util.target!);
    if (suite(utilClone).status === 0) ran.push('util');
    else problems.push(`the util suite fails: run npm test in ${utilClone}`);
  }

  return { name: 'tests', problems, summary: `${ran.join(' and ')} suites pass` };
}

export { checkUtil, checkTests };
