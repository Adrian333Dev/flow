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
 *
 * Every scratch project is a machine Flow is already set up on. `flow` refuses
 * every command where `~/.flow/version` is missing and every project where
 * `.flow/` is, so a test that skipped both would prove only the refusal. The
 * refusals have their own test, in flow.test.js.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const version = require('../../flow/lib/version');

const SCRIPTS = path.resolve(__dirname, '..', '..');
const REPO = path.resolve(SCRIPTS, '..');
const SCRATCH = path.join(REPO, 'tmp', 'tests');

/** A fresh empty project folder, already in Flow. `name` keeps tests apart. */
function project(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, '.flow'), { recursive: true });
  setUp(path.join(dir, 'flow-home'));
  return dir;
}

/**
 * A ~/.flow/ that a setup finished in: the version stamp is what says so. It
 * holds the number of the newest CHANGELOG.md entry the machine applied, read
 * off the changelog rather than written in, so a new entry never leaves the
 * suite reporting a machine behind.
 */
function setUp(home) {
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'version'), `${version.newest(REPO)}\n`);
  return home;
}

/**
 * The half of a machine `/flow:setup-machine` writes: the rule file, the one
 * line importing it, the link Codex reads, and the version stamp its last step
 * leaves behind.
 *
 * `flow install` stopped writing all 3 on 2026-09-20, because the rule file is
 * written after that skill's interview and a copy made before it holds nothing
 * of the user. A test that needs a finished machine does the skill's job here.
 */
function setupMachine(root) {
  const machine = require('../../flow/lib/machine');
  const at = machine.folders(root);
  const rules = path.join(at.agents, 'AGENTS.md');

  fs.mkdirSync(at.agents, { recursive: true });
  fs.copyFileSync(path.join(REPO, 'home', 'AGENTS.md'), rules);

  fs.mkdirSync(at.claude, { recursive: true });
  fs.writeFileSync(path.join(at.claude, 'CLAUDE.md'), `${machine.importLine(REPO, at.base)}\n`);

  fs.mkdirSync(at.codex, { recursive: true });
  fs.rmSync(path.join(at.codex, 'AGENTS.md'), { force: true });
  fs.symlinkSync(rules, path.join(at.codex, 'AGENTS.md'));

  setUp(at.flow);
  return rules;
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
  const env = { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: path.join(dir, 'flow-home') };
  return run('flow/flow.js', args, { cwd: dir, env });
}

module.exports = { SCRIPTS, REPO, SCRATCH, project, setUp, setupMachine, write, run, flow };
