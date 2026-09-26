'use strict';
/**
 * `flow setup`: the second half of putting Flow on a machine, after
 * `flow install` made its links.
 *
 * It opens a Claude Code session that reads the machine and writes one form,
 * a migration the user checks before anything outside `~/.flow/migrations/`
 * changes. `setup/machine.md` beside this folder is what that session follows,
 * and `setup/form.md` the form it fills in. Neither is a skill: the session
 * runs in safe mode, which loads no skill at all, Flow's included, so the text
 * reaches it as an appended system prompt instead.
 *
 * Safe mode, because it switches off the machine's own rules, skills, plugins
 * and hooks. A plugin such as superpowers tells Claude at the start of every
 * session to follow its own skills, and would argue with the setup that is
 * about to remove it.
 *
 * The permission mode is set too, because the user's own may be auto mode,
 * whose check refused the session's first write in the scratch session of
 * 2026-09-24. acceptEdits lets edits inside `~/.flow/` through, where every
 * file the session writes before the yes lives, and the 3 commands below run
 * without asking. Anything else asks.
 *
 * `flow install` calls `start` as its last step. Typed again, it carries on
 * a setup that stopped part way, since `~/.flow/run.json` says how far it got.
 *
 * `flow setup project` does the same for one project, typed inside it. That
 * session is a normal one, not safe mode: it needs Flow's rules and hooks,
 * which the machine's setup put in `~/.claude`. `--setting-sources user` and
 * `--strict-mcp-config` keep everything of the project's out, so nothing in
 * the project changes before the user's yes. `setup/project.md` is its text.
 *
 *   flow setup                   open the session
 *   flow setup check             what a finished install has, checked
 *   flow setup finish            stamp ~/.flow/version, the session's last step
 *   flow setup project           the same 3, for the project you are in
 *   flow setup project check
 *   flow setup project finish    stamp .flow/version
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/flow-repo');
const installed = require('../lib/installed');
const machine = require('../lib/machine');
const originals = require('../lib/originals');
const prereq = require('../lib/prereq');
const repos = require('../lib/repos');
const version = require('../lib/version');

const show = machine.shorten;
const root = { arg: '<dir>' };

/** The commands the session runs without asking. Each is Flow's own. */
const ALLOWED = [
  'Bash(flow setup:*)',
  'Bash(flow doctor:*)',
  'Bash(node ~/.flow/scripts/apply-migration.js:*)',
  // Flow's rules send every look at a folder through this, never ls.
  'Bash(util fs tree:*)',
];

/** What the project session runs without asking: the same, plus git's list of what it keeps. */
const PROJECT_ALLOWED = [...ALLOWED, 'Bash(git ls-files:*)'];

/** util's names, which util's own installer links beside Flow's. */
const UTIL_BIN = ['util', 'u'];

const runFile = (at) => path.join(at.flow, 'run.json');

function readRun(at) {
  try {
    return JSON.parse(fs.readFileSync(runFile(at), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Everything `flow install` puts on a machine that the session leans on, as
 * problem lines. Empty means ready.
 *
 * A missing piece stops the setup rather than being worked around: the
 * session that met no util on 2026-09-24 fell back to `cat` and carried on,
 * on a machine that was not what a user gets.
 */
function readiness(at) {
  const problems = [...prereq.problems()];
  const bin = path.join(at.base, '.local', 'bin');

  if (at.base === require('os').homedir()) {
    const dirs = (process.env.PATH || '').split(path.delimiter).map((d) => path.resolve(d || '.'));
    if (!dirs.includes(bin)) problems.push(`${show(bin)} is not on PATH, so flow and util do not run by name`);
  }
  for (const name of [...Object.keys(installed.BIN), ...UTIL_BIN]) {
    if (!fs.existsSync(path.join(bin, name))) problems.push(`${name} is not linked in ${show(bin)}`);
  }

  for (const name of Object.keys(repos.OWN)) {
    const dir = repos.ownClone(at.flow, name);
    if (!fs.existsSync(dir)) problems.push(`${name} is not cloned into ${show(dir)}`);
  }
  for (const entry of repos.sources(at.flow)) {
    const source = repos.parse(entry);
    const dir = repos.sourceDir(at.flow, source);
    if (!fs.existsSync(dir)) problems.push(`${source.id} is not cloned into ${show(dir)}`);
  }

  if (!flowRepo.isRepo(at) || !flowRepo.git(at.flow, ['remote', 'get-url', 'origin']).ok) {
    problems.push(`${show(at.flow)} has no repository to send your rules and notes to`);
  }
  return problems;
}

/** Flow's rule template, then the setup text. */
function prompt(clone) {
  const rules = fs.readFileSync(path.join(clone, 'home', 'AGENTS.md'), 'utf8').trim();
  const setup = fs.readFileSync(path.join(clone, 'scripts', 'flow', 'setup', 'machine.md'), 'utf8').trim();
  return `${rules}\n\n${setup}\n`;
}

/** One word of a shell line, quoted only where it needs it. */
const quote = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/**
 * Open the session, or print the line that opens it.
 *
 * Claude Code keeps only the last `--append-system-prompt-file` it is given,
 * which is why the rules and the setup text are joined into
 * `~/.flow/setup-prompt.md` rather than passed as 2 files. The file is
 * rewritten on every run, so a clone that moved on starts the newer text.
 *
 * The session opens only where somebody is watching a terminal and the
 * machine is the real one. Anywhere else, a test or `--root`, the line is
 * printed instead.
 */
function start(at, clone, rootFlag) {
  if (fs.existsSync(path.join(at.flow, 'version'))) {
    out('Flow is already set up on this machine, so there is nothing more to do.');
    return 0;
  }
  const problems = readiness(at);
  if (problems.length) {
    throw new FlowError(
      `the install is not finished, so setup has not started:\n${problems.map((p) => `  ${p}`).join('\n')}\n` +
      '  Run flow install, which puts every one of these in place, then flow setup.'
    );
  }

  const run = readRun(at);
  if (run && run.type !== 'setup-machine') {
    throw new FlowError(`${show(runFile(at))} says a ${run.type} run stopped part way. Finish that first.`);
  }
  if (!run) {
    // The folder is named here, where the time is at hand. The session has
    // no command it may run that tells it the time.
    const now = new Date();
    const migration = `machine/${originals.stamp(now, '-')}`;
    const fresh = { started: now.toISOString(), type: 'setup-machine', migration, step: 0 };
    fs.writeFileSync(runFile(at), JSON.stringify(fresh, null, 2) + '\n');
  }

  const file = path.join(at.flow, 'setup-prompt.md');
  fs.writeFileSync(file, prompt(clone));
  // --allowedTools takes several values, so a flag taking one comes after it
  // and ends the list before the first message.
  const args = [
    '--safe-mode',
    '--permission-mode', 'acceptEdits',
    '--add-dir', at.flow,
    '--allowedTools', ...ALLOWED,
    '--append-system-prompt-file', file,
    run ? 'Carry on setting up this machine.' : 'Set up this machine.',
  ];
  // From the home folder, so reading ~/.claude and ~/.agents asks nothing.
  const line = `cd ${quote(at.base)} && ${['claude', ...args].map(quote).join(' ')}`;

  if (rootFlag || !process.stdout.isTTY || !confirm.hasTerminal()) {
    out(`One step left: setting up this machine. Start it from a terminal:\n\n  ${line}`);
    return 0;
  }

  out(run
    ? 'Carrying on the setup that stopped part way. Claude Code opens now.\n'
    : 'One step left: setting up this machine. Claude Code opens now, reads what is already here,\n' +
      'and writes one form for you to check before anything changes.\n');
  // stdin from the terminal rather than inherited: under `curl | bash` it is
  // the pipe the script came down.
  const tty = fs.openSync('/dev/tty', 'r');
  const ran = spawnSync('claude', args, { cwd: at.base, stdio: [tty, 'inherit', 'inherit'] });
  fs.closeSync(tty);
  if (ran.error) {
    out(`Could not start claude: ${ran.error.message}. Start it yourself:\n\n  ${line}`);
    return 1;
  }
  return 0;
}

// ---------------------------------------------------------------- a project

/**
 * The project's root, git's top folder above where the command was typed, or
 * null outside a repository. FLOW_PROJECT stands in for where it was typed,
 * as it does in lib/root.js.
 */
function projectTop() {
  const found = flowRepo.git(process.env.FLOW_PROJECT || process.cwd(), ['rev-parse', '--show-toplevel']);
  return found.ok ? found.out : null;
}

/** Claude Code's memory for a project, in the folder it names after the path. */
const memoryDir = (at, project) =>
  path.join(at.claude, 'projects', project.replace(/[^A-Za-z0-9]/g, '-'), 'memory');

/** Why this project cannot be set up now, as problem lines. Empty means ready. */
function projectProblems(at, project) {
  const problems = [];
  if (!fs.existsSync(path.join(at.flow, 'version'))) {
    problems.push('Flow is not set up on this machine. Run flow setup first');
  }
  if (!project) problems.push('this folder is not a git repository. Run git init here first');
  const run = readRun(at);
  if (run && !(run.type === 'setup-project' && run.project === project)) {
    const where = run.project ? ` in ${show(run.project)}` : '';
    problems.push(`${show(runFile(at))} says a ${run.type} run${where} stopped part way. Finish that first`);
  }
  return problems;
}

/** Open the project's session, or print the line that opens it. `start` above says why. */
function startProject(at, clone, rootFlag) {
  const project = projectTop();
  if (project && fs.existsSync(path.join(project, '.flow', 'version'))) {
    out(`${show(project)} is already set up, so there is nothing more to do.`);
    return 0;
  }
  const problems = projectProblems(at, project);
  if (problems.length) {
    throw new FlowError(`this project cannot be set up yet:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  }

  const run = readRun(at);
  const memory = memoryDir(at, project);
  if (!run) {
    const now = new Date();
    const migration = `${originals.place(project)}/${originals.stamp(now, '-')}`;
    const fresh = { started: now.toISOString(), type: 'setup-project', project, memory, migration, step: 0 };
    fs.writeFileSync(runFile(at), JSON.stringify(fresh, null, 2) + '\n');
  }

  // Flow's rules load from ~/.claude/CLAUDE.md, so the prompt is the step file alone.
  const file = path.join(at.flow, 'setup-prompt.md');
  fs.copyFileSync(path.join(clone, 'scripts', 'flow', 'setup', 'project.md'), file);
  const args = [
    '--setting-sources', 'user',
    '--strict-mcp-config',
    '--permission-mode', 'acceptEdits',
    '--add-dir', at.flow,
    // A project Claude Code never opened has no memory folder to add.
    ...(fs.existsSync(memory) ? ['--add-dir', memory] : []),
    '--allowedTools', ...PROJECT_ALLOWED,
    '--append-system-prompt-file', file,
    run ? 'Carry on setting up this project.' : 'Set up this project.',
  ];
  const line = `cd ${quote(project)} && ${['claude', ...args].map(quote).join(' ')}`;

  if (rootFlag || !process.stdout.isTTY || !confirm.hasTerminal()) {
    out(`Setting up ${show(project)} runs in its own session. Start it from a terminal:\n\n  ${line}`);
    return 0;
  }
  out(run
    ? 'Carrying on the setup that stopped part way. Claude Code opens now.\n'
    : `Setting up ${show(project)}. Claude Code opens now, reads the project,\n` +
      'and writes one form for you to check before anything changes.\n');
  const tty = fs.openSync('/dev/tty', 'r');
  const ran = spawnSync('claude', args, { cwd: project, stdio: [tty, 'inherit', 'inherit'] });
  fs.closeSync(tty);
  if (ran.error) {
    out(`Could not start claude: ${ran.error.message}. Start it yourself:\n\n  ${line}`);
    return 1;
  }
  return 0;
}

/** `flow setup project check`: exit 0 where the project can be set up. */
function checkProject(at) {
  const project = projectTop();
  if (project && fs.existsSync(path.join(project, '.flow', 'version'))) {
    out(`${show(project)} is already set up`);
    return 1;
  }
  const problems = projectProblems(at, project);
  if (!problems.length) {
    out(`ready: ${show(project)} can be set up`);
    return 0;
  }
  out(`not ready:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  return 1;
}

/**
 * `flow setup project finish`: stamp the project's .flow/version and end the
 * run. The project comes from run.json, so it works from any folder.
 */
function finishProject(at, clone) {
  const run = readRun(at);
  if (!run || run.type !== 'setup-project') {
    throw new FlowError(`no project setup is running: ${show(runFile(at))} does not name one.`);
  }
  const newest = version.newest(clone);
  if (newest === null) throw new FlowError('CHANGELOG.md holds no entry, so there is no version to stamp.');
  const file = path.join(run.project, '.flow', 'version');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${newest}\n`);
  fs.rmSync(runFile(at));
  out(`stamped: ${show(file)} is ${newest}. This project is set up.`);
  return 0;
}

const actions = {};

actions.start = {
  anywhere: true,
  summary: 'open the Claude Code session that sets this machine up, or carry one on',
  flags: { root },
  run: ({ flags }) => start(machine.folders(flags.root), cloneRoot(), flags.root),
};

actions.check = {
  anywhere: true,
  summary: 'check the install left everything setup needs',
  flags: { root },
  run({ flags }) {
    const problems = readiness(machine.folders(flags.root));
    if (!problems.length) {
      out('ready: every program, name, clone and the repository are in place');
      return 0;
    }
    out(`not ready:\n${problems.map((p) => `  ${p}`).join('\n')}\n  Run flow install, which puts every one of these in place.`);
    return 1;
  },
};

actions.finish = {
  anywhere: true,
  summary: 'stamp ~/.flow/version and end the setup, its last step',
  flags: { root },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const run = readRun(at);
    if (!run || run.type !== 'setup-machine') {
      throw new FlowError(`no setup is running: ${show(runFile(at))} does not name one.`);
    }
    const newest = version.newest(cloneRoot());
    if (newest === null) throw new FlowError('CHANGELOG.md holds no entry, so there is no version to stamp.');
    fs.writeFileSync(path.join(at.flow, 'version'), `${newest}\n`);
    fs.rmSync(runFile(at));
    out(`stamped: ${show(path.join(at.flow, 'version'))} is ${newest}. This machine is set up.`);
    return 0;
  },
};

actions.project = {
  anywhere: true,
  args: '[check|finish]',
  summary: 'set up the project you are in: open its session, check it can start, or stamp .flow/version',
  flags: { root },
  run({ positional, flags }) {
    const at = machine.folders(flags.root);
    const [word, ...extra] = positional;
    if (extra.length || (word && !['check', 'finish'].includes(word))) {
      throw new FlowError('usage: flow setup project [check|finish]');
    }
    if (word === 'check') return checkProject(at);
    if (word === 'finish') return finishProject(at, cloneRoot());
    return startProject(at, cloneRoot(), flags.root);
  },
};

module.exports = {
  summary: 'set this machine up, or a project, through one form you check',
  default: 'start',
  actions,
  start,
};
