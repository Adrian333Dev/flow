#!/usr/bin/env node
'use strict';
/**
 * apply-migration.js <id> [--root <dir>]: carry out a migration, copying each
 * path into a snapshot the moment before it changes. `flow/lib/migrations.js`
 * says what a migration is, and `flow/lib/snapshots.js` what a snapshot holds.
 *
 * /flow:setup-machine, /flow:setup-project and /flow:migrate run it, after the
 * user's yes and never before. It is not a flow command and not on PATH: bare
 * `flow <verb> <id>` acts on a ticket, and a migration typed by hand weeks
 * later changes the machine as it was then.
 *
 * It refuses, changing nothing, when a line cannot be read, when files/ lacks
 * a file a write line needs, when the migration is already applied, and when
 * a file a write or delete line names changed after the migration was written.
 *
 * A run that stops part-way, on a command that fails or a move with nothing
 * to move, keeps every copy it took. `flow snapshot restore <snapshot>` undoes
 * the lines already done. Running this again carries on from the line that
 * stopped, in the same snapshot: the one whose manifest names this migration,
 * unfinished and never restored. A migration edited in between refuses rather
 * than guessing which lines already ran.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out, parseArgs } = require('./flow/lib/cli');
const { FlowError } = require('./flow/lib/error');
const machine = require('./flow/lib/machine');
const migrations = require('./flow/lib/migrations');
const snapshots = require('./flow/lib/snapshots');

const show = machine.shorten;
const USAGE = 'apply-migration.js <id> [--root <dir>]';

/** One action line, carried out. Returns what to print. */
function change(dir, action, cwd) {
  const { verb } = action;

  if (verb === 'write') {
    snapshots.remove(action.path);
    snapshots.copyEntry(snapshots.mirror(dir, action.path), action.path);
    return `wrote ${show(action.path)}`;
  }

  if (verb === 'delete') {
    if (!snapshots.lstat(action.path)) return `already gone: ${show(action.path)}`;
    snapshots.remove(action.path);
    return `deleted ${show(action.path)}`;
  }

  if (verb === 'move') {
    if (!snapshots.lstat(action.from)) throw new Error(`${show(action.from)} does not exist`);
    if (snapshots.lstat(action.to)) throw new Error(`${show(action.to)} already exists`);
    fs.mkdirSync(path.dirname(action.to), { recursive: true });
    try {
      fs.renameSync(action.from, action.to);
    } catch (e) {
      // Another disk: rename cannot cross one, so copy, then remove.
      if (e.code !== 'EXDEV') throw e;
      snapshots.copyEntry(action.from, action.to, true);
      snapshots.remove(action.from);
    }
    return `moved ${show(action.from)} -> ${show(action.to)}`;
  }

  const ran = spawnSync('sh', ['-c', action.command], { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
  if (ran.error) throw ran.error;
  if (ran.status !== 0) throw new Error(`the command exited ${ran.status}`);
  return `ran ${action.command}`;
}

/** Every snapshot taken for this migration, newest first, with its manifest. */
function takenFor(parent, id) {
  let names = [];
  try {
    names = fs.readdirSync(parent);
  } catch {
    return [];
  }
  return names
    .sort()
    .reverse()
    .map((name) => ({ dir: path.join(parent, name), manifest: snapshots.readManifest(path.join(parent, name)) }))
    .filter((s) => s.manifest && s.manifest.migration === id);
}

function apply(argv) {
  const { positional, flags } = parseArgs(argv, { flags: { root: { arg: '<dir>' } }, usage: USAGE });
  const [id, ...extra] = positional;
  if (!id || extra.length) throw new FlowError(`usage: ${USAGE}, the id being the folder's path below ~/.flow/migrations/`);
  const at = machine.folders(flags.root);
  const dir = migrations.folder(at, id);
  const migration = migrations.read(dir, at);
  const lines = migration.actions.map((a) => a.line);

  const parent = path.join(snapshots.home(at), snapshots.place(migration.project));
  const earlier = takenFor(parent, id);
  const finished = earlier.find((s) => s.manifest.applied === s.manifest.lines.length);
  if (finished) {
    const snap = snapshots.idOf(at, finished.dir);
    const undone = finished.manifest.restoredBy;
    throw new FlowError(undone
      ? `${id} was applied in ${snap}, then restored by ${undone}. Apply it again with flow snapshot restore ${undone}.`
      : `${id} is already applied, in ${snap}. Undo it with flow snapshot restore ${snap}.`);
  }

  const open = earlier.find((s) => !s.manifest.restoredBy);
  let snap = open ? open.dir : null;
  let manifest = open ? open.manifest : null;
  if (manifest && JSON.stringify(manifest.lines) !== JSON.stringify(lines)) {
    const snapId = snapshots.idOf(at, snap);
    throw new FlowError(
      `migration.md changed after ${snapId} started it, so the lines already done are unknown.\n` +
      `  Put migration.md back as it was, or undo what ran with flow snapshot restore ${snapId}.`
    );
  }
  const nothing = manifest ? 'nothing more ran' : 'nothing ran';

  const todo = migration.actions.slice(manifest ? manifest.applied : 0);
  const missing = todo.filter((a) => a.verb === 'write' && !snapshots.lstat(snapshots.mirror(dir, a.path)));
  if (missing.length) {
    const names = missing.map((a) => `  ${show(snapshots.mirror(dir, a.path))}`).join('\n');
    throw new FlowError(`migration.md writes files that files/ does not hold, so ${nothing}:\n${names}`);
  }

  const changed = migrations.changedSince(migration, todo, manifest ? manifest.entries.map((e) => e.path) : []);
  if (changed.length) {
    const names = changed.slice(0, 20).map((p) => `  ${show(p)}`);
    if (changed.length > 20) names.push(`  and ${changed.length - 20} more`);
    throw new FlowError(
      `${changed.length === 1 ? 'a file' : `${changed.length} files`} changed after ${id} was written, so ${nothing}:\n` +
      `${names.join('\n')}\n  Write the migration again from the files as they are now.`
    );
  }

  if (!manifest) {
    snap = snapshots.newFolder(parent);
    manifest = { type: migration.type, project: migration.project, migration: id, taken: snapshots.stamp(), lines, applied: 0, entries: [] };
    snapshots.saveManifest(snap, manifest);
  }
  const snapId = snapshots.idOf(at, snap);

  const cwd = migration.project || at.base;
  for (const action of todo) {
    for (const p of migrations.touched(action)) snapshots.record(snap, manifest, p);
    try {
      out(change(dir, action, cwd));
    } catch (e) {
      throw new FlowError(
        `stopped at line ${manifest.applied + 1} of ${lines.length}, "${action.line}": ${e.message}.\n` +
        `  Undo what ran: flow snapshot restore ${snapId}\n  Carry on after a fix: apply-migration.js ${id}`
      );
    }
    manifest.applied += 1;
    snapshots.saveManifest(snap, manifest);
  }

  out(`applied ${id}, ${lines.length} lines. Undo it with flow snapshot restore ${snapId}`);
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
