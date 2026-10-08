'use strict';
/**
 * The sessions Flow opens: the half of putting Flow on a machine or a project
 * that reads what is already there, and the run file each one keeps.
 * `flow install`, `flow init` and `flow update` call into this file, and it
 * has no command of its own.
 *
 * `start` opens a Claude Code session that reads the machine and writes one
 * form, a migration the user checks before anything outside
 * `~/.flow/migrations/` changes. `sessions/machine.md` is what that session
 * follows, and `templates/setup-machine.md` the form it fills in. Neither is a
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
 * the user's yes. `sessions/project.md` is its text.
 *
 *   flow install            the links, then this session
 *   flow install --check    what a finished install has, checked
 *   flow install --finish   stamp ~/.flow/version and close the original, the session's last step
 *   flow init               the project's session, where one is needed
 *   flow init --check
 *   flow init --finish      stamp .flow/version and close the project's original
 *
 * `~/.flow/run.json` is the run going on right now, or nothing. Each of
 * `flow install`, `flow init` and `flow update` writes it before its first
 * step, rewrites the step it just finished, and deletes it at the last one.
 * So the file sitting on disk means a run never finished, and the machine is
 * part way through a change. It holds when the run started, its `type`, the
 * migration folder it opened, and the last step that finished. Reading it
 * takes no agent and no session, which is the point: `flow doctor` reports
 * it before anything else.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('./cli');
const confirm = require('./machine/confirm');
const { FlowError } = require('./error');
const flowRepo = require('./machine/flow-repo');
const installed = require('./machine/installed');
const logs = require('./logs/logs');
const originals = require('./machine/originals');
const prereq = require('./machine/prereq');
const records = require('./tickets/records');
const repos = require('./skills/repos');
const version = require('./machine/version');
const paths = require('./paths');
const projects = require('./project');
const { git } = require('./git');

const show = paths.shorten;

/** The commands the project's session runs without asking. Each is Flow's own. */
const SHARED = [
  'Bash(flow doctor:*)',
  'Bash(node ~/.flow/scripts/record-originals.js:*)',
  // Flow's rules send every look at a folder through this, never ls.
  'Bash(util fs tree:*)',
];

/**
 * What the project session runs without asking: its own command, git's list of
 * what the project keeps, and the skills it switches on at go.
 */
const PROJECT_ALLOWED = ['Bash(flow init:*)', ...SHARED, 'Bash(git ls-files:*)', 'Bash(flow skills on:*)'];

/** util's names, which util's own installer links beside Flow's. */
const UTIL_BIN = ['util', 'u'];

// ---------------------------------------------------------------- the run

const runFile = (at) => path.join(at.flow, 'run.json');

/**
 * The run as written, with `file` added: null where there is none, and
 * `{ file, error }` where the file does not parse, which `flow doctor` and
 * the session-start hook each report.
 */
function inspectRun(at) {
  const file = runFile(at);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  try {
    return { file, ...JSON.parse(text) };
  } catch (e) {
    return { file, error: e.message };
  }
}

/** The run under way, or null where there is none or its file does not parse. */
function readRun(at) {
  const found = inspectRun(at);
  return found && !found.error ? found : null;
}

/** Start a run. The migration folder is named here, where the time is at hand. */
function writeRun(at, run) {
  fs.writeFileSync(runFile(at), JSON.stringify(run, null, 2) + '\n');
}

/**
 * End the run: run.json, and the prompt and settings the session started on,
 * which nothing reads after the session opens and the next launch writes again.
 */
function endRun(at) {
  fs.rmSync(runFile(at));
  for (const name of ['setup-prompt.md', 'setup-settings.json', 'migrate-prompt.md']) {
    fs.rmSync(path.join(at.flow, name), { force: true });
  }
}

/**
 * The end of a setup that changed something: close the place's original, and
 * log the setup. Here rather than in `record-originals.js`, which runs before
 * the first change, and a stopped run keeps its window open to record again.
 */
function closeSetup(at, run) {
  const project = run.project || null;
  originals.close(at, project);
  logs.recordHistory(at.flow, { type: run.type, id: run.migration, ...(project ? { project } : {}) });
}

// ---------------------------------------------------------------- the steps

/**
 * The 2 steps a session runs on itself, as flags of the command that opened
 * it: `--check` before it writes anything, `--finish` as its last step.
 */
const STEP_FLAGS = { check: { bool: true }, finish: { bool: true } };

/** `check`, `finish`, or null for the command itself. Refuses both, and any word. */
function stepOf(positional, flags, usage) {
  if (positional.length) throw new FlowError(`usage: ${usage}`);
  if (flags.check && flags.finish) throw new FlowError('--check or --finish, not both.');
  return flags.check ? 'check' : flags.finish ? 'finish' : null;
}

// ---------------------------------------------------------------- the session

/** One word of a shell line, quoted only where it needs it. */
const quote = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/**
 * Open a Claude Code session in `cwd`, or print the line that opens it.
 *
 * The session opens only where somebody is watching a terminal and the
 * machine is the real one. Anywhere else, a test or `--root`, `instead` is
 * printed with the line. `opening` is what prints before it opens. Returns
 * `ran`, `printed`, or `failed` where claude would not start.
 */
function openSession(cwd, args, { printOnly, opening, instead }) {
  const line = `cd ${quote(cwd)} && ${['claude', ...args].map(quote).join(' ')}`;
  if (printOnly || !process.stdout.isTTY || !confirm.hasTerminal()) {
    out(`${instead}:\n\n  ${line}`);
    return 'printed';
  }
  out(opening);
  // stdin from the terminal rather than inherited: under `curl | bash` it is
  // the pipe the script came down.
  const tty = fs.openSync('/dev/tty', 'r');
  const ran = spawnSync('claude', args, { cwd, stdio: [tty, 'inherit', 'inherit'] });
  fs.closeSync(tty);
  if (ran.error) {
    out(`Could not start claude: ${ran.error.message}. Start it yourself:\n\n  ${line}`);
    return 'failed';
  }
  return 'ran';
}

// ---------------------------------------------------------------- the machine

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

  if (!flowRepo.isRepo(at) || !git(at.flow, ['remote', 'get-url', 'origin']).ok) {
    problems.push(`${show(at.flow)} has no repository to send your rules and notes to`);
  }
  return problems;
}

/** Flow's rule template, then the setup text. */
function prompt(clone) {
  const rules = fs.readFileSync(path.join(clone, 'home', 'CLAUDE.md'), 'utf8').trim();
  const setup = fs.readFileSync(path.join(clone, 'scripts', 'sessions', 'machine.md'), 'utf8').trim();
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

/**
 * Open the machine's session, or print the line that opens it.
 *
 * Claude Code keeps only the last `--append-system-prompt-file` it is given,
 * which is why the rules and the setup text are joined into
 * `~/.flow/setup-prompt.md` rather than passed as 2 files. The file is
 * rewritten on every run, so a clone that moved on starts the newer text.
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
    // The session has no command it may run that tells it the time.
    const now = new Date();
    writeRun(at, { started: now.toISOString(), type: 'setup-machine', migration: `machine/${originals.stamp(now, '-')}`, step: 0 });
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
  const opened = openSession(at.base, args, {
    printOnly: rootFlag,
    instead: 'One step left: setting up this machine. Start it from a terminal',
    opening: run
      ? 'Carrying on the setup that stopped part way. Claude Code opens now.\n'
      : 'One step left: setting up this machine. Claude Code opens now, reads what is already here,\n' +
        'and writes one form for you to check before anything changes.\n',
  });
  return opened === 'failed' ? 1 : 0;
}

// ---------------------------------------------------------------- a project

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
  const project = projects.top();
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
    writeRun(at, {
      started: now.toISOString(), type: 'setup-project', project, memory, migration, step: 0, ...(memoryOnly ? { memoryOnly } : {}),
    });
  }
  const task = memoryOnly
    ? [`Fold this machine's old memory into this project.`, `Carry on folding this machine's old memory into this project.`]
    : ['Set up this project.', 'Carry on setting up this project.'];

  // Flow's rules load from ~/.claude/CLAUDE.md, so the prompt is the step file alone.
  const file = path.join(at.flow, 'setup-prompt.md');
  fs.copyFileSync(path.join(clone, 'scripts', 'sessions', 'project.md'), file);
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
  const what = memoryOnly ? `Folding this machine's old memory into ${show(project)}` : `Setting up ${show(project)}`;
  const opened = openSession(project, args, {
    printOnly: rootFlag,
    instead: `${what} runs in its own session. Start it from a terminal`,
    opening: run
      ? 'Carrying on the setup that stopped part way. Claude Code opens now.\n'
      : `${what}. Claude Code opens now, reads ${memoryOnly ? 'the memory' : 'the project'},\n` +
        'and writes one form for you to check before anything changes.\n',
  });
  return opened === 'failed' ? 1 : 0;
}

/** `flow init --check`: exit 0 where the project can be set up. */
function checkProject(at) {
  const project = projects.top();
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
 * `flow init --finish`: stamp the project's .flow/version, close its original
 * and end the run. The project comes from run.json, so it works from any folder.
 */
function finishProject(at, clone) {
  const run = readRun(at);
  if (!run || run.type !== 'setup-project') {
    throw new FlowError(`no project setup is running: ${show(runFile(at))} does not name one.`);
  }
  // The project was set up already, and its stamp is flow update's to move.
  if (run.memoryOnly) {
    closeSetup(at, run);
    endRun(at);
    out(`folded in: this machine's old memory for ${show(run.project)}.`);
    return 0;
  }
  const file = path.join(run.project, '.flow', 'version');
  const newest = version.stamp(file, clone);
  records.commit(run.project, 'flow init --finish');
  records.syncLater(run.project, at.flow);
  closeSetup(at, run);
  endRun(at);
  out(`stamped: ${show(file)} is ${newest}. This project is set up.`);
  return 0;
}

/** `flow install --check`: exit 0 where the install left everything the session leans on. */
function check(at) {
  const problems = readiness(at);
  if (!problems.length) {
    out('ready: every program, name, clone and the repository are in place');
    return 0;
  }
  out(`not ready:\n${problems.map((p) => `  ${p}`).join('\n')}\n  Run flow install, which puts every one of these in place.`);
  return 1;
}

/** `flow install --finish`: stamp ~/.flow/version, close the original and end the session, its last step. */
function finish(at) {
  const run = readRun(at);
  if (!run || run.type !== 'setup-machine') {
    throw new FlowError(`no setup is running: ${show(runFile(at))} does not name one.`);
  }
  const newest = version.stamp(path.join(at.flow, 'version'), paths.cloneRoot());
  // The record the other machines read, sent up by the next flow sync.
  flowRepo.writeRecord(at, newest);
  closeSetup(at, run);
  endRun(at);
  out(`stamped: ${show(path.join(at.flow, 'version'))} is ${newest}. This machine is set up.`);
  return 0;
}

module.exports = {
  runFile, inspectRun, readRun, writeRun, endRun, openSession, STEP_FLAGS, stepOf,
  start, readiness, check, finish, memoryDir, holdsFiles,
  startProject, checkProject, finishProject, PROJECT_ALLOWED,
};
