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
 * would resolve to Flow itself, a Flow project too, and write into its
 * `.flow/`. FLOW_PROJECT names the project outright, and `flow()` below sets
 * it. GIT_CEILING_DIRECTORIES below covers every command run without it.
 *
 * Every scratch project is a machine Flow is already set up on. `flow` refuses
 * every command where `~/.flow/version` is missing and every project where
 * `.flow/` is, so a test that skipped both would prove only the refusal. The
 * refusals have their own test, in flow.test.js.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const version = require('../../lib/machine/version');

const SCRIPTS = path.resolve(__dirname, '..', '..');
const REPO = path.resolve(SCRIPTS, '..');
const SCRATCH = path.join(REPO, 'tmp', 'tests');

// git stops looking for a repository at tmp/tests/, so a scratch folder that
// is no repository resolves to none, never to this clone. A test once switched
// a skill on and synced tickets in the real project this way.
process.env.GIT_CEILING_DIRECTORIES = SCRATCH;

// Every clone Flow makes goes through `FLOW_GIT_BASE`, and no test reaches
// the network: by default it names a folder holding nothing, so a clone fails
// at once and says so. A test that wants a clone to work builds the
// repositories itself and points this at them.
process.env.FLOW_GIT_BASE = process.env.FLOW_GIT_BASE || `${path.join(SCRATCH, 'no-remote')}${path.sep}`;

// The same for the Flow home's repository, which is otherwise found and made
// on the signed-in GitHub account through gh. A test that installs points
// this at a bare repository of its own, `bareRepo()` below.
process.env.FLOW_HOME_REMOTE = process.env.FLOW_HOME_REMOTE || path.join(SCRATCH, 'no-remote', 'flow-home.git');

// Claude Code's own folder. Every `flow` command writing a ticket rewrites
// the ticket skills of ~/.flow/ in its `skills/`, so a test left on the real
// one would write there. Set outright, since no test may reach the real one.
process.env.CLAUDE_CONFIG_DIR = path.join(SCRATCH, 'claude-config');

// git's global config, where `flow install` saves the machine's name. `--root`
// moves it under the root, and this catches every run without one: a test
// once left `flow.machine = test-machine` in the real ~/.gitconfig, and the
// real install kept it without asking.
process.env.GIT_CONFIG_GLOBAL = path.join(SCRATCH, 'gitconfig');

// The name `flow install` offers a machine, fixed so no test asks the
// hardware, and PowerShell under WSL, what sort of computer this is.
process.env.FLOW_MACHINE_DEFAULT = process.env.FLOW_MACHINE_DEFAULT || 'test-machine';

/**
 * A fresh empty project folder, already in Flow, whose tickets are `exp-1`,
 * `exp-2`. `name` keeps tests apart. Its `.flow/` is a plain folder, on no
 * branch and linked to no Flow home, so no command here commits.
 */
function project(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, '.flow'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.flow', 'settings.json'), '{\n  "ticketPrefix": "exp"\n}\n');
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
 * The half of a machine `flow install` writes: the rule file, the one
 * line importing it, and the version stamp its last step leaves behind.
 *
 * `flow install` stopped writing all 3 on 2026-09-20, because the rule file is
 * written after the setup's survey, and a copy made before it holds nothing
 * of the user. A test that needs a finished machine does the setup's job here.
 */
function setupMachine(root) {
  const machine = require('../../lib/machine/machine');
  const at = require('../../lib/paths').folders(root);
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
 * A claude on PATH answering `--version` and `plugin list --json`, and
 * failing everything else.
 *
 * `list` is what the list prints. `safe` is what it prints while
 * CLAUDE_CODE_SAFE_MODE is set, as Claude Code 2.1.292 hides every synced
 * plugin then. `fails` makes the list exit 1 saying it, as a signed-out
 * Claude Code does. Each stub gets its own folder under `dir`, named by `name`.
 */
function claudeStub(dir, { list = [], safe = list, fails = null, name = 'claude-bin' } = {}) {
  const bin = path.join(dir, name);
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'list.json'), JSON.stringify(list));
  fs.writeFileSync(path.join(bin, 'list-safe.json'), JSON.stringify(safe));
  const listing = fails
    ? `echo ${JSON.stringify(fails)} >&2; exit 1`
    : 'if [ -n "$CLAUDE_CODE_SAFE_MODE" ]; then cat "$here/list-safe.json"; else cat "$here/list.json"; fi; exit 0';
  const file = path.join(bin, 'claude');
  fs.writeFileSync(file, [
    '#!/usr/bin/env bash',
    'here="$(dirname "$0")"',
    'if [ "$1" = "--version" ]; then echo "2.1.292 (Claude Code)"; exit 0; fi',
    `if [ "$1 $2 $3" = "plugin list --json" ]; then ${listing}; fi`,
    'exit 1',
    '',
  ].join('\n'));
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

/**
 * An empty bare repository standing in for the GitHub one `~/.flow/` lives
 * in, named to `flow install` through `FLOW_HOME_REMOTE`. Kept outside the test's own folder, so a test
 * counting what landed there counts only the install.
 */
function bareRepo(name) {
  const dir = path.join(SCRATCH, 'remotes', `${name}.git`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ran = spawnSync('git', ['init', '--quiet', '--bare', dir], { encoding: 'utf8' });
  if (ran.status !== 0) throw new Error(`git init --bare: ${ran.stderr}`);
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

/** `flow` against a scratch project, with the root override set, and `extra` added to its environment. */
function flow(dir, args, extra = {}) {
  const env = { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: path.join(dir, 'flow-home'), ...extra };
  return run('flow.js', args, { cwd: dir, env });
}

module.exports = {
  SCRIPTS, REPO, SCRATCH, project, setUp, setupMachine, utilStub, claudeStub, gitRepo, bareRepo, skillFile, pathWith, write, run, flow,
};
