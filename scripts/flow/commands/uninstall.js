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
 * What goes back is the user's choice: the same form as `flow restore`,
 * `lib/restore-form.js`, with one box per path in every original. A project's
 * `AGENTS.md`, `CLAUDE.md` and `docs/` start unticked, so its knowledge stays.
 * Deleting `~/.flow/` and the clone has no box: that is what uninstalling is.
 *
 * Before `~/.flow/` goes, every link into it goes too: a source's skill in
 * `~/.claude/skills/` or a project's, and util's names in `~/.local/bin/`.
 *
 * `~/.flow/` is checked the same way before anything runs. What syncs from it,
 * study cases, notes and tickets, is on no other machine until `flow sync`
 * sends it, so unsent work there stops the whole uninstall.
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
const { out, joinAnd } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/flow-repo');
const { git } = flowRepo;
const installed = require('../lib/installed');
const machine = require('../lib/machine');
const originals = require('../lib/originals');
const form = require('../lib/restore-form');
const ticketSkills = require('../lib/ticket-skills');

const show = machine.shorten;

/**
 * What a repository still holds that nothing else does, or null when it can
 * go.
 *
 * Both checks are reads. A clone that is not a repository at all is kept too:
 * nothing here can tell what is in it.
 */
function holds(repo) {
  const status = git(repo, ['status', '--porcelain']);
  if (!status.ok) return 'it is not a git clone, so nothing here can say what is in it';
  if (status.out) {
    const n = status.out.split('\n').length;
    return `${n} file${n === 1 ? ' is' : 's are'} changed and not committed`;
  }
  const unpushed = git(repo, ['log', '--branches', '--not', '--remotes', '--oneline']);
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

    // ~/.flow/ is deleted whole, and its study cases, notes and tickets exist
    // nowhere else until flow sync sends them. A folder with no remote has
    // nowhere to send them, so it is not held up.
    if (flowRepo.isRepo(at) && git(at.flow, ['remote', 'get-url', 'origin']).ok) {
      const unsent = holds(at.flow);
      if (unsent) throw new FlowError(`${show(at.flow)} holds work no other machine has: ${unsent}. Nothing was removed. Run flow sync, then uninstall again.`);
    }
    confirm.noSessions();

    const projects = originals.list(at).filter((row) => row.manifest.project);
    const mine = originals.read(at);

    // A rooted machine is a scratch one built inside tmp/, and it does not own
    // the clone it was built from. Only a real machine can take the clone with
    // it.
    const keepClone = flags.root ? 'it belongs to this machine, not to --root' : holds(clone);

    const parts = [...projects.flatMap((row) => form.sections(at, row.manifest.project)), ...(mine ? form.sections(at, null) : [])];
    const always = [
      ...(mine ? [] : ['Every path Flow made on this machine is removed. This machine has no original, so what those paths held before Flow is gone.']),
      `${show(at.flow)} is deleted.`,
      keepClone ? `${show(clone)} stays: ${keepClone}.` : `${show(clone)} is deleted.`,
    ];
    const places = [...projects.map((row) => path.basename(row.manifest.project)), 'this machine'];
    const ticked = form.ask(at, 'uninstall', parts, always, [
      `one box per path Flow changed in ${joinAnd(places)}.`,
      `Then ${show(at.flow)}${keepClone ? ' is' : ` and ${show(clone)} are`} deleted.`,
    ]);
    if (!ticked) {
      out('\nnothing was removed.');
      return 1;
    }
    form.refuseUnsent(projects.map((row) => row.manifest.project), ticked);

    out('');
    const skillDirs = [at.claude, ...projects.map((row) => path.join(row.manifest.project, '.claude'))]
      .map((d) => path.join(d, 'skills'));
    for (const row of projects) form.apply(at, row.manifest.project, ticked).forEach((line) => out(line));
    if (mine) {
      form.apply(at, null, ticked).forEach((line) => out(line));
    } else {
      // No original holds the ticket skills, and with no form box for them
      // nothing below would take them away.
      for (const folder of ticketSkills.removeAll([skillDirs[0]])) out(`removed ${show(folder)}`);
      for (const line of installed.strip(clone, at, { bin })) out(line);
    }

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
