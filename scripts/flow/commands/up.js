'use strict';
/**
 * `flow up`: bring Flow up to date, on this machine and in the project you are
 * in, with one word.
 *
 * It pulls the clone and its submodules, then compares version numbers. A
 * machine behind the newest `CHANGELOG.md` entry, or a project behind its
 * machine, gets a migration: a Claude Code session that reads every upgrade
 * guide between the 2 numbers, writes one form, `migration.md`, and changes
 * nothing before the user's yes. `setup/migrate.md` beside this folder is what
 * that session follows.
 *
 * A session this command opens, never a skill typed inside one, because of
 * the order. The pull comes first and the session opens after it, so the
 * newest migration steps always run. A skill would run the text loaded before
 * the pull, and every guide would need a way to say the old steps cannot
 * carry it.
 *
 * The session is a normal one: Flow's rules and hooks are already on this
 * machine, and nothing in a Flow project competes with them. The permission
 * mode and the allowed commands are set the way `flow setup` sets them, for
 * the reason that file gives.
 *
 * The machine goes first, since a project's number is compared with the
 * machine's. Typed inside a project that is behind too, the project's session
 * opens once the machine's has finished. A run that stopped part way is
 * carried on, with no pull, so the guides cannot change under it.
 *
 *   flow up            pull, then open the session for whatever is behind
 *   flow up check      the entries and guides the running migration covers
 *   flow up finish     stamp the version, the session's last step
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/flow-repo');
const machine = require('../lib/machine');
const migrations = require('../lib/migrations');
const originals = require('../lib/originals');
const prereq = require('../lib/prereq');
const version = require('../lib/version');

const show = machine.shorten;
const root = { arg: '<dir>' };

/** The commands the session runs without asking. Each is Flow's own, or reads. */
const ALLOWED = [
  'Bash(flow up:*)',
  'Bash(flow doctor:*)',
  'Bash(flow audit:*)',
  'Bash(node ~/.flow/scripts/apply-migration.js:*)',
  'Bash(util fs tree:*)',
  // The proof: a second session that loads the new files, answers once and exits.
  'Bash(claude -p:*)',
];

const runFile = (at) => path.join(at.flow, 'run.json');

function readRun(at) {
  const found = migrations.run(at);
  return found && !found.error ? found : null;
}

/**
 * The Flow project around where the command was typed: git's top folder,
 * holding a `.flow/`. Null anywhere else. FLOW_PROJECT stands in for where it
 * was typed, as it does in lib/root.js.
 */
function projectTop() {
  const found = flowRepo.git(process.env.FLOW_PROJECT || process.cwd(), ['rev-parse', '--show-toplevel']);
  return found.ok && fs.existsSync(path.join(found.out, '.flow')) ? found.out : null;
}

/**
 * What is behind, machine first: `{ project, from, to }`, with `project` null
 * for the machine. Null where nothing is. A project never stamped is left to
 * `flow setup project`, and `notes` says so.
 */
function behind(at, clone, project, notes) {
  const newest = version.newest(clone);
  const mine = version.applied(path.join(at.flow, 'version'));
  if (mine.state !== 'ok') {
    throw new FlowError(`${show(path.join(at.flow, 'version'))} does not hold a version. Run flow doctor.`);
  }
  if (mine.number < newest) return { project: null, from: mine.number, to: newest };
  if (!project) return null;

  const theirs = version.applied(path.join(project, '.flow', 'version'));
  if (theirs.state === 'missing') {
    notes.push(`${show(project)} was never set up. Run flow setup project inside it.`);
    return null;
  }
  if (theirs.state !== 'ok') throw new FlowError(`${show(project)}/.flow/version does not hold a version. Run flow doctor.`);
  if (theirs.number < mine.number) return { project, from: theirs.number, to: mine.number };
  return null;
}

/** Pull the clone and its submodules. A clone that cannot pull stops everything. */
function pull(clone) {
  const before = flowRepo.git(clone, ['rev-parse', '--short', 'HEAD']).out;
  const pulled = flowRepo.git(clone, ['pull', '--ff-only']);
  if (!pulled.ok) {
    throw new FlowError(`could not pull ${show(clone)}, so nothing was updated:\n  ${pulled.err.split('\n').join('\n  ')}`);
  }
  const subs = flowRepo.git(clone, ['submodule', 'update', '--init', '--recursive']);
  if (!subs.ok) throw new FlowError(`pulled, then could not update the submodules:\n  ${subs.err.split('\n').join('\n  ')}`);
  const after = flowRepo.git(clone, ['rev-parse', '--short', 'HEAD']).out;
  out(before === after ? 'Flow was already at its newest commit.' : `pulled Flow from ${before} to ${after}.`);
}

/** One word of a shell line, quoted only where it needs it. */
const quote = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/**
 * Open the session for the run in run.json. Returns false where it printed
 * the line instead, or claude would not start.
 */
function open(at, clone, run, { carryOn, printOnly }) {
  const file = path.join(at.flow, 'migrate-prompt.md');
  fs.copyFileSync(path.join(clone, 'scripts', 'flow', 'setup', 'migrate.md'), file);
  const place = run.project ? 'this project' : 'this machine';
  const args = [
    '--permission-mode', 'acceptEdits',
    '--add-dir', at.flow,
    '--allowedTools', ...ALLOWED,
    '--append-system-prompt-file', file,
    carryOn ? `Carry on bringing ${place} up to date.` : `Bring ${place} up to date.`,
  ];
  // The machine's session starts in the home folder, so reading ~/.claude asks nothing.
  const cwd = run.project || at.base;
  const line = `cd ${quote(cwd)} && ${['claude', ...args].map(quote).join(' ')}`;

  if (printOnly) {
    out(`Bringing ${run.project ? show(run.project) : 'this machine'} from entry ${run.from} to ${run.to} runs in its own session. Start it from a terminal:\n\n  ${line}`);
    return false;
  }
  out(carryOn
    ? 'Carrying on the update that stopped part way. Claude Code opens now.\n'
    : `Bringing ${run.project ? show(run.project) : 'this machine'} from entry ${run.from} to ${run.to}. Claude Code opens now,\n` +
      'reads what changed, and writes one form for you to check before anything changes.\n');
  const tty = fs.openSync('/dev/tty', 'r');
  const ran = spawnSync('claude', args, { cwd, stdio: [tty, 'inherit', 'inherit'] });
  fs.closeSync(tty);
  if (ran.error) {
    out(`Could not start claude: ${ran.error.message}. Start it yourself:\n\n  ${line}`);
    return false;
  }
  return true;
}

/** `flow up`. */
function up(at, clone, rootFlag) {
  if (!fs.existsSync(path.join(at.flow, 'version'))) {
    throw new FlowError('Flow is not set up on this machine. Run flow setup first.');
  }
  // A scratch machine never pulls the real clone, and never opens a session.
  const printOnly = Boolean(rootFlag) || !process.stdout.isTTY || !confirm.hasTerminal();

  let run = readRun(at);
  if (run && run.type !== 'migrate') {
    throw new FlowError(`${show(runFile(at))} says a ${run.type} run stopped part way. Finish that first: ${migrations.resume(run)}.`);
  }
  if (run) {
    if (!open(at, clone, run, { carryOn: true, printOnly })) return 0;
    if (readRun(at)) {
      out('The update stopped part way. flow up carries it on.');
      return 0;
    }
  } else if (!rootFlag) {
    pull(clone);
  }

  // The machine, then the project: at most 2 sessions, and never the same one twice.
  const project = projectTop();
  let last = null;
  for (;;) {
    const notes = [];
    const next = behind(at, clone, project, notes);
    if (!next) {
      const mine = version.applied(path.join(at.flow, 'version')).number;
      out([`Flow is up to date: this machine is at entry ${mine}${project && !notes.length ? `, and so is ${show(project)}` : ''}.`, ...notes].join('\n'));
      return 0;
    }
    if (last && last.project === next.project) {
      out(`${next.project ? show(next.project) : 'This machine'} is still at entry ${next.from}: the session ended without stamping it. Run flow up again.`);
      return 1;
    }
    last = next;

    const now = new Date();
    const migration = `${originals.place(next.project)}/${originals.stamp(now, '-')}`;
    run = { started: now.toISOString(), type: 'migrate', ...(next.project ? { project: next.project } : {}), migration, from: next.from, to: next.to, step: 0 };
    fs.writeFileSync(runFile(at), JSON.stringify(run, null, 2) + '\n');

    if (!open(at, clone, run, { carryOn: false, printOnly })) {
      if (!next.project && project && printOnly) out(`\nOnce it has finished, run flow up again in ${show(project)} for the project.`);
      return 0;
    }
    if (readRun(at)) {
      out('The update stopped part way. flow up carries it on.');
      return 0;
    }
  }
}

/**
 * `flow up check`: what the running migration covers. Each entry between the
 * 2 numbers, and the guide it names, which is what the session reads.
 */
function check(at, clone) {
  const run = readRun(at);
  if (!run || run.type !== 'migrate') {
    out(`not ready: no update is running. ${show(runFile(at))} does not name one. Type flow up in a terminal.`);
    return 1;
  }
  const missing = prereq.problems();
  if (missing.length) {
    out(`not ready:\n${missing.map((p) => `  ${p}`).join('\n')}`);
    return 1;
  }
  const lines = [`ready: ${run.project ? show(run.project) : 'this machine'} goes from entry ${run.from} to ${run.to}.`];
  const covered = version.entries(clone).filter((e) => e.number > run.from && e.number <= run.to).reverse();
  for (const entry of covered) {
    const guide = path.join(clone, 'upgrades', `${entry.number}.md`);
    lines.push(`  ${entry.number}, ${entry.date}: ${fs.existsSync(guide) ? guide : 'no guide, so nothing on disk changes for it'}`);
  }
  out(lines.join('\n'));
  return 0;
}

/** `flow up finish`: stamp the version the run reached, then end the run. */
function finish(at) {
  const run = readRun(at);
  if (!run || run.type !== 'migrate') {
    throw new FlowError(`no update is running: ${show(runFile(at))} does not name one.`);
  }
  const file = run.project ? path.join(run.project, '.flow', 'version') : path.join(at.flow, 'version');
  fs.writeFileSync(file, `${run.to}\n`);
  fs.rmSync(runFile(at));
  out(`stamped: ${show(file)} is ${run.to}. ${run.project ? 'This project' : 'This machine'} is up to date.`);
  return 0;
}

const actions = {};

actions.up = {
  section: 'setup',
  anywhere: true,
  args: '[check|finish]',
  summary: 'pull Flow, then bring this machine and this project up to date through one form each',
  flags: { root },
  run({ positional, flags }) {
    const at = machine.folders(flags.root);
    const [word, ...extra] = positional;
    if (extra.length || (word && !['check', 'finish'].includes(word))) {
      throw new FlowError('usage: flow up [check|finish]');
    }
    if (word === 'check') return check(at, cloneRoot());
    if (word === 'finish') return finish(at);
    return up(at, cloneRoot(), flags.root);
  },
};

module.exports = actions;
