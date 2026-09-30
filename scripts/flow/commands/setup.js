'use strict';
/**
 * The setup sessions: the half of putting Flow on a machine or a project that
 * reads what is already there. `flow install` and `flow init` call into this
 * file, and it has no command of its own.
 *
 * `start` opens a Claude Code session that reads the machine and writes one
 * form, a migration the user checks before anything outside
 * `~/.flow/migrations/` changes. `setup/machine.md` beside this folder is what
 * that session follows, and `setup/form.md` the form it fills in. Neither is a
 * skill: the session runs in safe mode, which loads no skill at all, Flow's
 * included, so the text reaches it as an appended system prompt instead.
 *
 * Safe mode, because it switches off the machine's own rules, skills, plugins
 * and hooks. A plugin such as superpowers tells Claude at the start of every
 * session to follow its own skills, and would argue with the setup that is
 * about to remove it.
 *
 * The permissions come in for the session alone, through `--settings`:
 * acceptEdits, every shell command, and auto mode off. `sessionSettings`
 * says why.
 *
 * `flow install` calls `start` as its last step. Typed again, it carries on
 * a setup that stopped part way, since `~/.flow/run.json` says how far it got.
 *
 * `startProject` does the same for one project, where `flow init` finds files
 * competing with Flow's rules. In a project already set up, on another
 * machine as a rule, it folds in only the Claude Code memory this machine
 * kept for it from before Flow. That session is a normal one, not safe mode:
 * it needs Flow's rules and hooks, which the machine's setup put in
 * `~/.claude`. `--setting-sources user` and `--strict-mcp-config` keep
 * everything of the project's out, so nothing in the project changes before
 * the user's yes. `setup/project.md` is its text.
 *
 *   flow install          the links, then this session
 *   flow install check    what a finished install has, checked
 *   flow install finish   stamp ~/.flow/version, the session's last step
 *   flow init             the project's session, where one is needed
 *   flow init check
 *   flow init finish      stamp .flow/version
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
const records = require('../lib/records');
const repos = require('../lib/repos');
const version = require('../lib/version');

const show = machine.shorten;

/** The commands the project's session runs without asking. Each is Flow's own. */
const SHARED = [
  'Bash(flow doctor:*)',
  'Bash(node ~/.flow/scripts/apply-migration.js:*)',
  // Flow's rules send every look at a folder through this, never ls.
  'Bash(util fs tree:*)',
];

/** What the project session runs without asking: its own command, and git's list of what the project keeps. */
const PROJECT_ALLOWED = ['Bash(flow init:*)', ...SHARED, 'Bash(git ls-files:*)'];

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

/**
 * The machine session's permissions, for that session alone: Flow's own
 * allow, ask and deny lists, and auto mode off. The machine's settings file is
 * left as it is until the migration the user approves rewrites it.
 *
 * Every shell command runs unasked, as in any Flow session, since the agent
 * writes a different command on every machine and no short list covers them.
 * Safe mode turns the guard off with every other hook, which costs little
 * here: acceptEdits already lets the session write anywhere in the home
 * folder, and `flow install` recorded the machine's original first.
 *
 * Auto mode's check sees the action without the conversation, and blocked
 * this session's first write to `run.json` on 2026-09-24 as Claude changing
 * its own setup. Turned off here, it also leaves the prompts that remain.
 */
function sessionSettings(clone) {
  const flow = JSON.parse(fs.readFileSync(path.join(clone, 'home', 'settings.json'), 'utf8'));
  const { allow, ask, deny } = flow.permissions;
  return { permissions: { allow, ask, deny }, disableAutoMode: 'disable' };
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
      '  Run flow install again, which puts every one of these in place, then opens the session.'
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
  const settings = path.join(at.flow, 'setup-settings.json');
  fs.writeFileSync(settings, JSON.stringify(sessionSettings(clone), null, 2) + '\n');
  const args = [
    '--safe-mode',
    '--permission-mode', 'acceptEdits',
    '--add-dir', at.flow,
    '--settings', settings,
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

/** Whether a folder holds anything: an empty memory folder has nothing to fold in. */
function holdsFiles(dir) {
  try {
    return fs.readdirSync(dir).length > 0;
  } catch {
    return false;
  }
}

/**
 * What a project needs, where `flow init` is typed: `setup`, the
 * whole setup; `memory`, only this machine's old Claude Code memory folded
 * into a project set up already, which happens when it was set up on another
 * machine; or null, nothing at all.
 */
function projectNeeds(at, project) {
  if (!project || !fs.existsSync(path.join(project, '.flow', 'version'))) return 'setup';
  return holdsFiles(memoryDir(at, project)) ? 'memory' : null;
}

/** Why this project cannot be set up now, as problem lines. Empty means ready. */
function projectProblems(at, project) {
  const problems = [];
  if (!fs.existsSync(path.join(at.flow, 'version'))) {
    problems.push('Flow is not set up on this machine. Run flow install first');
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
  const needs = projectNeeds(at, project);
  if (!needs) {
    out(`${show(project)} is already set up, so there is nothing more to do.`);
    return 0;
  }
  const problems = projectProblems(at, project);
  if (problems.length) {
    throw new FlowError(`this project cannot be set up yet:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  }

  const run = readRun(at);
  const memory = memoryDir(at, project);
  const memoryOnly = run ? Boolean(run.memoryOnly) : needs === 'memory';
  if (!run) {
    const now = new Date();
    const migration = `${originals.place(project)}/${originals.stamp(now, '-')}`;
    const fresh = { started: now.toISOString(), type: 'setup-project', project, memory, migration, step: 0 };
    if (memoryOnly) fresh.memoryOnly = true;
    fs.writeFileSync(runFile(at), JSON.stringify(fresh, null, 2) + '\n');
  }
  const task = memoryOnly
    ? [`Fold this machine's old memory into this project.`, `Carry on folding this machine's old memory into this project.`]
    : ['Set up this project.', 'Carry on setting up this project.'];

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
    run ? task[1] : task[0],
  ];
  const line = `cd ${quote(project)} && ${['claude', ...args].map(quote).join(' ')}`;

  const what = memoryOnly ? `Folding this machine's old memory into ${show(project)}` : `Setting up ${show(project)}`;
  if (rootFlag || !process.stdout.isTTY || !confirm.hasTerminal()) {
    out(`${what} runs in its own session. Start it from a terminal:\n\n  ${line}`);
    return 0;
  }
  out(run
    ? 'Carrying on the setup that stopped part way. Claude Code opens now.\n'
    : `${what}. Claude Code opens now, reads ${memoryOnly ? 'the memory' : 'the project'},\n` +
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

/** `flow init check`: exit 0 where the project can be set up. */
function checkProject(at) {
  const project = projectTop();
  const needs = projectNeeds(at, project);
  if (!needs) {
    out(`${show(project)} is already set up`);
    return 1;
  }
  const problems = projectProblems(at, project);
  if (!problems.length) {
    out(needs === 'memory'
      ? `ready: ${show(project)} is set up, and this machine's old memory for it can be folded in`
      : `ready: ${show(project)} can be set up`);
    return 0;
  }
  out(`not ready:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  return 1;
}

/**
 * End the run: run.json, and the prompt the session started on, which nothing
 * reads after the session opens and the next launch writes again.
 */
function endRun(at) {
  fs.rmSync(runFile(at));
  fs.rmSync(path.join(at.flow, 'setup-prompt.md'), { force: true });
  fs.rmSync(path.join(at.flow, 'setup-settings.json'), { force: true });
}

/**
 * `flow init finish`: stamp the project's .flow/version and end the
 * run. The project comes from run.json, so it works from any folder.
 */
function finishProject(at, clone) {
  const run = readRun(at);
  if (!run || run.type !== 'setup-project') {
    throw new FlowError(`no project setup is running: ${show(runFile(at))} does not name one.`);
  }
  // The project was set up already, and its stamp is flow update's to move.
  if (run.memoryOnly) {
    endRun(at);
    out(`folded in: this machine's old memory for ${show(run.project)}.`);
    return 0;
  }
  const newest = version.newest(clone);
  if (newest === null) throw new FlowError('CHANGELOG.md holds no entry, so there is no version to stamp.');
  const file = path.join(run.project, '.flow', 'version');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${newest}\n`);
  records.commit(run.project, 'flow init finish');
  records.syncLater(run.project, at.flow);
  endRun(at);
  out(`stamped: ${show(file)} is ${newest}. This project is set up.`);
  return 0;
}

/** `flow install check`: exit 0 where the install left everything the session leans on. */
function check(at) {
  const problems = readiness(at);
  if (!problems.length) {
    out('ready: every program, name, clone and the repository are in place');
    return 0;
  }
  out(`not ready:\n${problems.map((p) => `  ${p}`).join('\n')}\n  Run flow install, which puts every one of these in place.`);
  return 1;
}

/** `flow install finish`: stamp ~/.flow/version and end the session, its last step. */
function finish(at) {
  const run = readRun(at);
  if (!run || run.type !== 'setup-machine') {
    throw new FlowError(`no setup is running: ${show(runFile(at))} does not name one.`);
  }
  const newest = version.newest(cloneRoot());
  if (newest === null) throw new FlowError('CHANGELOG.md holds no entry, so there is no version to stamp.');
  fs.writeFileSync(path.join(at.flow, 'version'), `${newest}\n`);
  // The record the other machines read, sent up by the next flow sync.
  flowRepo.writeRecord(at, newest);
  endRun(at);
  out(`stamped: ${show(path.join(at.flow, 'version'))} is ${newest}. This machine is set up.`);
  return 0;
}

module.exports = {
  start, readiness, check, finish, readRun, runFile, projectTop, memoryDir, holdsFiles, quote,
  startProject, checkProject, finishProject, PROJECT_ALLOWED,
};
