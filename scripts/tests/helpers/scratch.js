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

// Every clone Flow makes goes through `FLOW_GIT_BASE`, and no test reaches
// the network: by default it names a folder holding nothing, so a clone fails
// at once and says so. A test that wants a clone to work builds the
// repositories itself and points this at them.
process.env.FLOW_GIT_BASE = process.env.FLOW_GIT_BASE || `${path.join(SCRATCH, 'no-remote')}${path.sep}`;

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
 * line importing it, and the version stamp its last step leaves behind.
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

  setUp(at.flow);
  return rules;
}

/**
 * A util on PATH answering the 3 commands Flow calls, or refusing every one.
 *
 * Every script that checks a prerequisite runs the real `util`, and the real
 * one is a submodule a fresh checkout may not have. What is under test is the
 * probe Flow makes, never util's own commands, so the probe gets a stub to
 * answer it. `pathWith` puts it in front of whatever this machine has.
 */
function utilStub(dir, { works = true } = {}) {
  const bin = path.join(dir, works ? 'bin' : 'bin-broken');
  fs.mkdirSync(bin, { recursive: true });
  const file = path.join(bin, 'util');
  fs.writeFileSync(file, works
    ? '#!/usr/bin/env bash\ncase "$1 $2" in\n  "fs tree"|"fs merge"|"fs open") exit 0 ;;\nesac\nexit 1\n'
    : '#!/usr/bin/env bash\nexit 1\n');
  fs.chmodSync(file, 0o755);
  return bin;
}

/**
 * A git repository on disk holding `files`, `{ 'react/SKILL.md': text }`,
 * committed once. A test clones it through `FLOW_GIT_BASE` in place of GitHub.
 */
function gitRepo(dir, files) {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [name, body] of Object.entries(files)) write(dir, name, body);
  const git = (...args) => {
    const ran = spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
      { cwd: dir, encoding: 'utf8' });
    if (ran.status !== 0) throw new Error(`git ${args.join(' ')}: ${ran.stderr}`);
  };
  git('init', '--quiet', '--initial-branch=main');
  git('add', '-A');
  git('commit', '--quiet', '-m', 'first');
  return dir;
}

/** A skill's SKILL.md, with the frontmatter every source expects. */
const skillFile = (name, description = `The ${name} skill.`) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\nBody.\n`;

/** PATH with one folder in front of this machine's. */
const pathWith = (bin) => `${bin}${path.delimiter}${process.env.PATH}`;

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

module.exports = {
  SCRIPTS, REPO, SCRATCH, project, setUp, setupMachine, utilStub, gitRepo, skillFile, pathWith, write, run, flow,
};
