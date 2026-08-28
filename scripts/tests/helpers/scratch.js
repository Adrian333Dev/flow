'use strict';
/**
 * A throwaway project for a test to run a script against.
 *
 * Everything lands under tmp/, which is gitignored, so a test writes nothing
 * git will ever see. Each project is wiped and rebuilt on request rather than
 * reused: a test that inherits another test's tickets fails for reasons that
 * have nothing to do with what it is checking.
 *
 * No `git init`. `flow` finds the project root through `git rev-parse`, and
 * this folder sits inside the Flow repo, so an uninitialised scratch project
 * would resolve to Flow itself and write tickets into it. FLOW_PROJECT is the
 * documented override for exactly that, and `flow()` below sets it.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = path.resolve(__dirname, '..', '..');
const REPO = path.resolve(SCRIPTS, '..');
const SCRATCH = path.join(REPO, 'tmp', 'tests');

/** A fresh empty project folder. `name` keeps one test clear of another. */
function project(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Write a file inside a scratch project, creating the folders it needs. */
function write(dir, relative, body) {
  const target = path.join(dir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
  return target;
}

/**
 * Run one of Flow's scripts and hand back what it printed.
 *
 * Exit status comes back rather than throwing, because a non-zero exit is the
 * thing under test as often as the output is.
 */
function run(script, args = [], options = {}) {
  const { cwd = REPO, input, env } = options;
  const result = spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], {
    cwd,
    input,
    env: env || process.env,
    encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}

/** `flow` against a scratch project, with the root override set. */
function flow(dir, args) {
  return run('flow/flow.js', args, { cwd: dir, env: { ...process.env, FLOW_PROJECT: dir } });
}

module.exports = { SCRIPTS, REPO, SCRATCH, project, write, run, flow };
