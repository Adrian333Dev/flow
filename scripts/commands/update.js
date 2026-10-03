'use strict';
/**
 * `flow update`: bring Flow up to date, on this machine and in the project you are
 * in, with one word.
 *
 * It pulls the clone and its submodules, then compares version numbers. A
 * machine behind the newest `CHANGELOG.md` entry, or a project behind its
 * machine, gets a migration: a Claude Code session that reads every upgrade
 * guide between the 2 numbers, writes one form, `migration.md`, and changes
 * nothing before the user's yes. `sessions/migrate.md` is what that session
 * follows.
 *
 * A session this command opens, never a skill typed inside one, because of
 * the order. The pull comes first and the session opens after it, so the
 * newest migration steps always run. A skill would run the text loaded before
 * the pull, and every guide would need a way to say the old steps cannot
 * carry it.
 *
 * The session is a normal one: Flow's rules and hooks are already on this
 * machine, and nothing in a Flow project competes with them. The permission
 * mode and the allowed commands are set the way `flow install` sets them, for
 * the reason that file gives.
 *
 * The machine goes first, since a project's number is compared with the
 * machine's. Typed inside a project that is behind too, the project's session
 * opens once the machine's has finished. A run that stopped part way is
 * carried on, with no pull, so the guides cannot change under it.
 *
 *   flow update            pull, then open the session for whatever is behind
 *   flow update --check    the entries and guides the running migration covers
 *   flow update --finish   stamp the version, the session's last step
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/machine/flow-repo');
const machine = require('../lib/machine/machine');
const migrations = require('../lib/machine/migrations');
const originals = require('../lib/machine/originals');
const prereq = require('../lib/machine/prereq');
const version = require('../lib/machine/version');
const paths = require('../lib/paths');
const setup = require('../lib/setup');
const projects = require('../lib/project');
const { git } = require('../lib/git');

const show = paths.shorten;
const root = { arg: '<dir>', hidden: true };

/** The commands the session runs without asking. Each is Flow's own, or reads. */
const ALLOWED = [
  'Bash(flow update:*)',
  'Bash(flow doctor:*)',
  'Bash(flow audit:*)',
  'Bash(node ~/.flow/scripts/apply-migration.js:*)',
  'Bash(util fs tree:*)',
  // The proof: a second session that loads the new files, answers once and exits.
  'Bash(claude -p:*)',
];

/**
 * What is behind, machine first: `{ project, from, to }`, with `project` null
 * for the machine. Null where nothing is. A project never stamped is left to
 * `flow init`, and `notes` says so.
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
    notes.push(`${show(project)} was never set up. Run flow init inside it.`);
    return null;
  }
  if (theirs.state !== 'ok') throw new FlowError(`${show(project)}/.flow/version does not hold a version. Run flow doctor.`);
  if (theirs.number < mine.number) return { project, from: theirs.number, to: mine.number };
  return null;
}

/**
 * Pull the clone and its submodules. A clone that cannot pull stops everything.
 * A clone `flow install` switched to a release sits on its tag, off any
 * branch, so it goes back to `main` first.
 */
function pull(clone) {
  const before = git(clone, ['rev-parse', '--short', 'HEAD']).out;
  if (!git(clone, ['symbolic-ref', '-q', 'HEAD']).ok) {
    const back = git(clone, ['checkout', '-q', 'main']);
    if (!back.ok) throw new FlowError(`could not put ${show(clone)} back on main, so nothing was updated:\n  ${back.err}`);
  }
  const pulled = git(clone, ['pull', '--ff-only']);
  if (!pulled.ok) {
    throw new FlowError(`could not pull ${show(clone)}, so nothing was updated:\n  ${pulled.err.split('\n').join('\n  ')}`);
  }
  const subs = git(clone, ['submodule', 'update', '--init', '--recursive']);
  if (!subs.ok) throw new FlowError(`pulled, then could not update the submodules:\n  ${subs.err.split('\n').join('\n  ')}`);
  const after = git(clone, ['rev-parse', '--short', 'HEAD']).out;
  out(before === after ? 'Flow was already at its newest commit.' : `pulled Flow from ${before} to ${after}.`);
}

/**
 * Open the session for the run in run.json. Returns what
 * `setup.openSession` does: `ran`, `printed` or `failed`.
 */
function open(at, clone, run, { carryOn, printOnly }) {
  const file = path.join(at.flow, 'migrate-prompt.md');
  fs.copyFileSync(path.join(clone, 'scripts', 'sessions', 'migrate.md'), file);
  const place = run.project ? 'this project' : 'this machine';
  const args = [
    '--permission-mode', 'acceptEdits',
    '--add-dir', at.flow,
    '--allowedTools', ...ALLOWED,
    '--append-system-prompt-file', file,
    carryOn ? `Carry on bringing ${place} up to date.` : `Bring ${place} up to date.`,
  ];
  const what = `Bringing ${run.project ? show(run.project) : 'this machine'} from entry ${run.from} to ${run.to}`;
  // The machine's session starts in the home folder, so reading ~/.claude asks nothing.
  return setup.openSession(run.project || at.base, args, {
    printOnly,
    instead: `${what} runs in its own session. Start it from a terminal`,
    opening: carryOn
      ? 'Carrying on the update that stopped part way. Claude Code opens now.\n'
      : `${what}. Claude Code opens now,\nreads what changed, and writes one form for you to check before anything changes.\n`,
  });
}

/** `flow update`. */
function up(at, clone, rootFlag) {
  machine.requireSetup(rootFlag);
  // A scratch machine never pulls the real clone, and never opens a session.
  const printOnly = Boolean(rootFlag);

  let run = setup.readRun(at);
  if (run && run.type !== 'migrate') {
    throw new FlowError(`${show(setup.runFile(at))} says a ${run.type} run stopped part way. Finish that first: ${migrations.resume(run)}.`);
  }
  if (run) {
    if (open(at, clone, run, { carryOn: true, printOnly }) !== 'ran') return 0;
    if (setup.readRun(at)) {
      out('The update stopped part way. flow update carries it on.');
      return 0;
    }
  } else if (!rootFlag) {
    pull(clone);
  }

  // The machine, then the project: at most 2 sessions, and never the same one twice.
  const project = projects.around();
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
      out(`${next.project ? show(next.project) : 'This machine'} is still at entry ${next.from}: the session ended without stamping it. Run flow update again.`);
      return 1;
    }
    last = next;

    const now = new Date();
    const migration = `${originals.place(next.project)}/${originals.stamp(now, '-')}`;
    run = { started: now.toISOString(), type: 'migrate', ...(next.project ? { project: next.project } : {}), migration, from: next.from, to: next.to, step: 0 };
    setup.writeRun(at, run);

    const opened = open(at, clone, run, { carryOn: false, printOnly });
    if (opened !== 'ran') {
      if (opened === 'printed' && !next.project && project) out(`\nOnce it has finished, run flow update again in ${show(project)} for the project.`);
      return 0;
    }
    if (setup.readRun(at)) {
      out('The update stopped part way. flow update carries it on.');
      return 0;
    }
  }
}

/**
 * `flow update --check`: what the running migration covers. Each entry between the
 * 2 numbers, and the guide it names, which is what the session reads.
 */
function check(at, clone) {
  const run = setup.readRun(at);
  if (!run || run.type !== 'migrate') {
    out(`not ready: no update is running. ${show(setup.runFile(at))} does not name one. Type flow update in a terminal.`);
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

/** `flow update --finish`: stamp the version the run reached, then end the run. */
function finish(at, clone) {
  const run = setup.readRun(at);
  if (!run || run.type !== 'migrate') {
    throw new FlowError(`no update is running: ${show(setup.runFile(at))} does not name one.`);
  }
  const file = run.project ? path.join(run.project, '.flow', 'version') : path.join(at.flow, 'version');
  version.stamp(file, clone, run.to);
  // The other machines read this record, and sync nothing until they match it.
  // The README is rewritten with it, so a new release's wording goes up with
  // the next sync.
  if (!run.project) {
    flowRepo.writeRecord(at, run.to);
    flowRepo.writeReadme(at);
  }
  setup.endRun(at);
  out(`stamped: ${show(file)} is ${run.to}. ${run.project ? 'This project' : 'This machine'} is up to date.`);
  return 0;
}

const actions = {};

actions.update = {
  section: 'setup',
  anywhere: true,
  summary: 'pull Flow, then bring this machine and this project up to date through one form each; --check and --finish are that session\'s own steps',
  flags: { ...setup.STEP_FLAGS, root },
  run({ positional, flags }) {
    const at = paths.folders(flags.root);
    const word = setup.stepOf(positional, flags, 'flow update [--check|--finish]');
    if (word === 'check') return check(at, paths.cloneRoot());
    if (word === 'finish') return finish(at, paths.cloneRoot());
    return up(at, paths.cloneRoot(), flags.root);
  },
};

module.exports = actions;
