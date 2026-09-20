#!/usr/bin/env node
'use strict';
/**
 * apply-migration.js <id> [--root <dir>]: carry out a migration, recording
 * each path in the place's original the moment before it changes, while that
 * original's window is open. `flow/lib/migrations.js` says what a migration
 * is, and `flow/lib/originals.js` what an original holds and when it closes.
 *
 * /flow:setup-machine, /flow:setup-project and /flow:migrate run it, after the
 * user's yes and never before. It is not a flow command and not on PATH: bare
 * `flow <verb> <id>` acts on a ticket, and a migration typed by hand weeks
 * later changes the machine as it was then.
 *
 * The first setup of a place is the one run that writes an original. A
 * setup-machine migration adds to the one `flow install` opened, a
 * setup-project migration opens the project's, and the last thing either does
 * is close it. Every later migration changes paths and records nothing, so a
 * machine's original always holds the state from before Flow rather than the
 * state before the newest change. Undoing one migration is parked.
 *
 * How far a run got lives in applied.json beside migration.md, holding the
 * action lines as they were and the count already done. A run that stops
 * part-way, on a command that fails or a move with nothing to move, leaves it
 * there, and running this again carries on from the line that stopped. A
 * migration edited in between refuses rather than guessing which lines ran.
 *
 * It refuses, changing nothing, when a line cannot be read, when files/ lacks
 * a file a write line needs, when the migration is already applied, when a
 * file a write or delete line names changed after the migration was written,
 * and when a prerequisite of Flow's is not met. The last one is checked here
 * rather than trusted to a skill's first step, because this is the process
 * that writes: a machine left between two versions is the thing being avoided.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out, parseArgs } = require('./flow/lib/cli');
const { FlowError } = require('./flow/lib/error');
const machine = require('./flow/lib/machine');
const migrations = require('./flow/lib/migrations');
const originals = require('./flow/lib/originals');
const prereq = require('./flow/lib/prereq');

const show = machine.shorten;
const USAGE = 'apply-migration.js <id> [--root <dir>]';

/** The 2 types that write an original. Everything after them records nothing. */
const SETUP = { 'setup-machine': true, 'setup-project': true };

/** One action line, carried out. Returns what to print. */
function change(dir, action, cwd) {
  const { verb } = action;

  if (verb === 'write') {
    originals.remove(action.path);
    originals.copyEntry(originals.mirror(dir, action.path), action.path);
    return `wrote ${show(action.path)}`;
  }

  if (verb === 'delete') {
    if (!originals.lstat(action.path)) return `already gone: ${show(action.path)}`;
    originals.remove(action.path);
    return `deleted ${show(action.path)}`;
  }

  if (verb === 'move') {
    if (!originals.lstat(action.from)) throw new Error(`${show(action.from)} does not exist`);
    if (originals.lstat(action.to)) throw new Error(`${show(action.to)} already exists`);
    fs.mkdirSync(path.dirname(action.to), { recursive: true });
    try {
      fs.renameSync(action.from, action.to);
    } catch (e) {
      // Another disk: rename cannot cross one, so copy, then remove.
      if (e.code !== 'EXDEV') throw e;
      originals.copyEntry(action.from, action.to, true);
      originals.remove(action.from);
    }
    return `moved ${show(action.from)} -> ${show(action.to)}`;
  }

  const ran = spawnSync('sh', ['-c', action.command], { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
  if (ran.error) throw ran.error;
  if (ran.status !== 0) throw new Error(`the command exited ${ran.status}`);
  return `ran ${action.command}`;
}

/** How far a run got, beside migration.md. Null before the first line runs. */
const progressFile = (dir) => path.join(dir, 'applied.json');

function readProgress(dir) {
  const file = progressFile(dir);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

const saveProgress = (dir, progress) =>
  fs.writeFileSync(progressFile(dir), JSON.stringify(progress, null, 2) + '\n');

/** The command that puts this place back, or null where no original exists. */
function wayBack(at, project) {
  const found = originals.read(at, project);
  return found ? `flow restore ${project ? 'project' : 'machine'}` : null;
}

function apply(argv) {
  const { positional, flags } = parseArgs(argv, { flags: { root: { arg: '<dir>' } }, usage: USAGE });
  const [id, ...extra] = positional;
  if (!id || extra.length) throw new FlowError(`usage: ${USAGE}, the id being the folder's path below ~/.flow/migrations/`);
  const at = machine.folders(flags.root);
  const dir = migrations.folder(at, id);
  const migration = migrations.read(dir, at);
  const lines = migration.actions.map((a) => a.line);
  const { project, type } = migration;

  const progress = readProgress(dir);
  if (progress && JSON.stringify(progress.lines) !== JSON.stringify(lines)) {
    throw new FlowError(
      `migration.md changed after line ${progress.applied} of it ran, so the lines already done are unknown.\n` +
      '  Put migration.md back as it was, then run this again.'
    );
  }
  if (progress && progress.applied === lines.length) {
    const back = wayBack(at, project);
    throw new FlowError(`${id} is already applied.${back ? `\n  Put this ${project ? 'project' : 'machine'} back as it was before Flow: ${back}` : ''}`);
  }
  const nothing = progress ? 'nothing more ran' : 'nothing ran';

  const todo = migration.actions.slice(progress ? progress.applied : 0);
  const missing = todo.filter((a) => a.verb === 'write' && !originals.lstat(originals.mirror(dir, a.path)));
  if (missing.length) {
    const names = missing.map((a) => `  ${show(originals.mirror(dir, a.path))}`).join('\n');
    throw new FlowError(`migration.md writes files that files/ does not hold, so ${nothing}:\n${names}`);
  }

  const changed = migrations.changedSince(migration, todo, progress ? progress.touched : []);
  if (changed.length) {
    const names = changed.slice(0, 20).map((p) => `  ${show(p)}`);
    if (changed.length > 20) names.push(`  and ${changed.length - 20} more`);
    throw new FlowError(
      `${changed.length === 1 ? 'a file' : `${changed.length} files`} changed after ${id} was written, so ${nothing}:\n` +
      `${names.join('\n')}\n  Write the migration again from the files as they are now.`
    );
  }

  // Last, because the other refusals name the migration and this one names the
  // machine. lib/prereq.js holds the list and what each failure costs.
  prereq.demand(nothing);

  // The first setup of a place is the one run allowed to open its original.
  // install.js opens the machine's, so this is where a project's begins.
  if (SETUP[type] && !originals.read(at, project)) originals.start(at, project);

  const state = progress || { lines, applied: 0, touched: [] };
  const cwd = project || at.base;
  for (const action of todo) {
    for (const p of migrations.touched(action)) {
      originals.record(at, project, p);
      if (!state.touched.includes(p)) state.touched.push(p);
    }
    saveProgress(dir, state);
    try {
      out(change(dir, action, cwd));
    } catch (e) {
      throw new FlowError(
        `stopped at line ${state.applied + 1} of ${lines.length}, "${action.line}": ${e.message}.\n` +
        `  Carry on after a fix: apply-migration.js ${id}`
      );
    }
    state.applied += 1;
    saveProgress(dir, state);
  }

  if (SETUP[type]) originals.close(at, project);
  const back = wayBack(at, project);
  out(`applied ${id}, ${lines.length} lines.${back ? ` Put this ${project ? 'project' : 'machine'} back with ${back}` : ''}`);
  return 0;
}

try {
  process.exitCode = apply(process.argv.slice(2));
} catch (e) {
  if (e instanceof FlowError) {
    process.stderr.write(`apply-migration: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
