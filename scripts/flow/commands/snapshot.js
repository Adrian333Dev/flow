'use strict';
/**
 * `flow snapshot`: the copies taken before every migration on this machine,
 * and the way back from any of them. `lib/snapshots.js` holds the folder and
 * the reasoning.
 *
 * Restore needs no agent and no session, so it works from a plain shell after
 * a migration that broke Claude Code itself.
 *
 * Two of the 5 actions, on purpose. `new` is `apply-migration.js`, run by the
 * skill that wrote the migration. `get` is opening the folder: manifest.json
 * says what the run did, and names the migration that says what it meant.
 * `edit` has nothing to edit. `drop` waits for a rule saying when a snapshot
 * is old enough to lose, and until one exists the answer is never.
 */

const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/root');
const machine = require('../lib/machine');
const snapshots = require('../lib/snapshots');

const show = machine.shorten;
const root = { arg: '<dir>' };

const actions = {};

/**
 * Inside a project, its own snapshots alone, since those are the ones a
 * project's trouble comes from. The machine's are one --all away, and the
 * empty answer says so.
 */
actions.ls = {
  summary: 'every snapshot, newest first; inside a project, only its own',
  flags: { root, all: { bool: true } },
  run({ positional, flags, usage }) {
    if (positional.length) throw new FlowError(`${usage} takes no words. Restore one with flow snapshot restore <id>.`);
    const at = machine.folders(flags.root);

    let project = null;
    if (!flags.all) {
      try {
        project = projectRoot();
      } catch {
        // Not in a project, so every snapshot.
      }
    }

    const rows = snapshots.list(at).filter((s) => !project || s.project === project);
    if (!rows.length) {
      out(project ? `no snapshot of ${show(project)}. --all lists every one.` : 'no snapshots.');
      return 0;
    }

    const cells = rows.map((s) => [s.id, s.type, s.project ? show(s.project) : 'machine', s.state]);
    const widths = [0, 1, 2].map((i) => Math.max(...cells.map((c) => c[i].length)));
    for (const c of cells) out(c.map((v, i) => (i < 3 ? v.padEnd(widths[i]) : v)).join('  '));
    return 0;
  },
};

/**
 * Newest entry first, each path put back as it was before the migration first
 * touched it. The restore takes its own snapshot first, in a folder beside
 * the one it restores, so the restore itself can be undone.
 */
actions.restore = {
  args: '<id>',
  summary: 'put back every path a migration changed, after taking a snapshot of them',
  flags: { root },
  run({ positional, flags, usage }) {
    const [id, ...extra] = positional;
    if (!id || extra.length) throw new FlowError(`usage: ${usage} <id>, the id flow snapshot ls prints`);
    const at = machine.folders(flags.root);
    const dir = snapshots.folder(at, id);
    const source = snapshots.readManifest(dir);
    if (!source) throw new FlowError(`${id} holds no manifest.json, so there is nothing to put back.`);

    const undo = snapshots.newFolder(path.dirname(dir));
    const undoId = snapshots.idOf(at, undo);

    const manifest = { type: 'restore', project: source.project, taken: snapshots.stamp(), restores: id, finished: false, entries: [] };
    snapshots.saveManifest(undo, manifest);

    for (const entry of [...source.entries].reverse()) {
      snapshots.record(undo, manifest, entry.path);
      snapshots.putBack(dir, entry);
      out(`${entry.type === 'absent' ? 'removed' : 'put back'} ${show(entry.path)}`);
    }

    manifest.finished = true;
    snapshots.saveManifest(undo, manifest);
    snapshots.saveManifest(dir, { ...source, restoredBy: undoId });
    out(`restored ${id}. Undo the restore with flow snapshot restore ${undoId}`);
    return 0;
  },
};

module.exports = { summary: 'the copies taken before every migration, and the way back', default: 'ls', actions };
