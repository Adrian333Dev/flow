'use strict';
/**
 * `flow uninstall`: take Flow off this machine, and leave every project and
 * the machine itself as they were before it.
 *
 * It puts each project's original back, then the machine's, then deletes
 * `~/.flow/` and the clone. It runs all of that itself rather than telling the
 * user to run `flow restore` first: putting the machine's original back
 * deletes `~/.local/bin/flow`, so a second command would have nothing left to
 * type.
 *
 * The projects come out of the originals themselves. Each project's manifest
 * holds the project's full path, so nothing has to keep a list of where Flow
 * was ever set up.
 *
 * A machine with no original is still covered, which matters for a machine set
 * up before originals existed: `lib/installed.js` lists every path Flow owns,
 * and its `strip` removes each one, plus Flow's own lines from the 2 files
 * that are the user's.
 *
 * Before `~/.flow/` goes, every link into it goes too: a source's skill in
 * `~/.claude/skills/` or a project's, and util's names in `~/.local/bin/`.
 *
 * The clone is deleted last, and only when git says it holds nothing the user
 * would lose: uncommitted changes or commits no remote has stop it, and the
 * path is printed instead. Deleting a clone with a day's work in it is not an
 * uninstall, it is a data loss.
 *
 * The locks are `lib/confirm.js`: every session closed, and the word
 * `uninstall` typed at a terminal. There is no flag that skips either, so this
 * cannot run from a pasted line or out of shell history.
 */

const path = require('path');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const { git } = require('../lib/flow-repo');
const installed = require('../lib/installed');
const machine = require('../lib/machine');
const originals = require('../lib/originals');

const show = machine.shorten;

/** `a, b and c`, so the question reads as a sentence. */
function list(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * What the clone still holds that nothing else does, or null when it can go.
 *
 * Both checks are reads. A clone that is not a repository at all is kept too:
 * nothing here can tell what is in it.
 */
function cloneHolds(clone) {
  const status = git(clone, ['status', '--porcelain']);
  if (!status.ok) return 'it is not a git clone, so nothing here can say what is in it';
  if (status.out) {
    const n = status.out.split('\n').length;
    return `${n} file${n === 1 ? ' is' : 's are'} changed and not committed`;
  }
  const unpushed = git(clone, ['log', '--branches', '--not', '--remotes', '--oneline']);
  if (unpushed.ok && unpushed.out) {
    const n = unpushed.out.split('\n').length;
    return `${n} commit${n === 1 ? ' is' : 's are'} on no remote`;
  }
  return null;
}

const actions = {};

actions.uninstall = {
  section: 'setup',
  anywhere: true,
  summary: 'put every project and this machine back, then delete ~/.flow/ and the clone',
  flags: { root: { arg: '<dir>' } },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const clone = cloneRoot();
    const bin = path.join(at.base, '.local', 'bin');
    confirm.noSessions();

    const projects = originals.list(at).filter((row) => row.manifest.project);
    const mine = originals.read(at);

    // A rooted machine is a scratch one built inside tmp/, and it does not own
    // the clone it was built from. Only a real machine can take the clone with
    // it.
    const keepClone = flags.root ? 'it belongs to this machine, not to --root' : cloneHolds(clone);

    const places = [...projects.map((row) => path.basename(row.manifest.project)), 'this machine'];
    const lines = [
      `${mine ? 'Restores' : 'Strips Flow from'} ${list(places)}, then deletes ${show(at.flow)}` +
      `${keepClone ? '.' : ` and ${show(clone)}.`}`,
    ];
    if (!mine) lines.push('This machine has no original, so what those paths held before Flow is gone.');
    if (keepClone) lines.push(`${show(clone)} stays: ${keepClone}.`);

    if (!confirm.word('uninstall', lines)) {
      out('\nnothing was removed.');
      return 1;
    }

    out('');
    for (const row of projects) {
      for (const done of originals.restore(at, row.manifest.project)) {
        out(`${done.removed ? 'removed' : 'put back'} ${show(done.path)}`);
      }
    }
    if (mine) {
      for (const done of originals.restore(at)) {
        out(`${done.removed ? 'removed' : 'put back'} ${show(done.path)}`);
      }
    } else {
      for (const line of installed.strip(clone, at, { bin })) out(line);
    }

    const skillDirs = [at.claude, ...projects.map((row) => path.join(row.manifest.project, '.claude'))]
      .map((d) => path.join(d, 'skills'));
    for (const line of installed.unlinkInto(at.flow, [...skillDirs, bin])) out(line);
    originals.remove(at.flow);
    out(`removed ${show(at.flow)}`);

    if (keepClone) {
      out(`\n${show(clone)} is still here: ${keepClone}.\n  Delete it yourself once you have what you want: rm -rf ${clone}`);
    } else {
      originals.remove(clone);
      out(`removed ${show(clone)}`);
    }
    out('\nFlow is off this machine.');
    return 0;
  },
};

module.exports = actions;
