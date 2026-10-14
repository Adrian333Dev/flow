'use strict';
/**
 * `flow restore`: put a machine or a project back the way it was before Flow.
 *
 * One original per place, written once and never added to, so there is no id
 * to look up and no date to read: `flow restore machine` and
 * `flow restore project` are the whole surface. `lib/machine/originals.js` holds the
 * folder and the reasoning.
 *
 * It needs no agent and no session, so it works from a plain shell after a
 * migration that broke Claude Code itself. `lib/machine/confirm.js` holds the locks,
 * and the agent fails 2 of them: a running session refuses the command, and
 * the word has to be typed at a terminal the agent does not have.
 *
 * The original survives, so a restore runs again and lands in the same place.
 * Restoring the machine deletes `~/.local/bin/flow` along with everything else
 * `flow install` made, which is why the last line says how to put Flow back.
 * It leaves `~/.flow/` alone: only `flow uninstall` deletes that.
 *
 * Neither puts everything back blind. Each writes a form, `~/.flow/restore.md`,
 * with one box per path, and the user unticks what stays as it is now before
 * typing the word. A project's knowledge, its `CLAUDE.md` and `docs/`, starts
 * unticked. `lib/machine/restore-form.js` holds the form and the
 * strict reading of it, and the ticket skills, which no original holds.
 *
 * A machine restore puts its projects in the same form. Once `flow` is gone
 * from PATH a project's restore is typed through the script's path in
 * `~/.flow/`, which nobody remembers, so the projects are offered while
 * `flow` still exists.
 */

const path = require('path');
const { out, joinAnd } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/project');
const confirm = require('../lib/machine/confirm');
const machine = require('../lib/machine/machine');
const originals = require('../lib/machine/originals');
const form = require('../lib/machine/restore-form');
const paths = require('../lib/paths');

const show = paths.shorten;
const root = { arg: '<dir>', hidden: true };

const actions = {};

actions.ls = {
  anywhere: true,
  summary: 'the originals on this machine, and how many paths each holds',
  flags: { root },
  run({ positional, flags, usage }) {
    if (positional.length) throw new FlowError(`${usage} takes no words. Put one back with flow restore machine or flow restore project.`);
    const at = paths.folders(flags.root);
    const rows = originals.list(at);
    if (!rows.length) {
      out('no original. flow install writes the machine\'s, and flow init a project\'s.');
      return 0;
    }
    for (const { manifest } of rows) {
      const where = manifest.project ? show(manifest.project) : 'machine';
      const state = manifest.closed ? 'closed' : 'still being written';
      out(`${where}  ${manifest.entries.length} paths  written ${manifest.written}  ${state}`);
    }
    return 0;
  },
};

/** Print each path one place's restore changed. */
const report = (at, project, ticked) => form.apply(at, project, ticked).forEach((line) => out(line));

actions.machine = {
  anywhere: true,
  summary: 'put this machine back as it was before Flow, and any of its projects, leaving ~/.flow/ alone',
  flags: { root },
  run({ flags }) {
    const at = paths.folders(flags.root);
    const found = originals.read(at);
    if (!found) throw new FlowError('No original of this machine. Nothing to put back.');
    confirm.noSessions();

    const projects = originals.list(at).filter((row) => row.manifest.project).map((row) => row.manifest.project);
    const parts = [...projects.flatMap((p) => form.sections(at, p)), ...form.sections(at, null)];
    const where = projects.length ? `this machine, and ${joinAnd(projects.map((p) => path.basename(p)))}` : 'this machine';
    const ticked = form.ask(at, 'restore', parts, [], [`one box per path Flow changed on ${where}.`]);
    if (!ticked) {
      out('\nnothing was put back.');
      return 1;
    }
    form.refuseUnsent(projects, ticked);

    out('');
    for (const project of projects) report(at, project, ticked);
    report(at, null, ticked);
    const later = `node ${show(path.join(at.flow, 'scripts', 'flow.js'))} restore project`;
    const kept = projects.filter((p) => form.keepsFlow(p, ticked));
    if (kept.length) out(`\n${joinAnd(kept.map((p) => path.basename(p)))} still hold${kept.length === 1 ? 's' : ''} Flow. Put ${kept.length === 1 ? 'it' : 'each one'} back from inside it with ${later}`);
    if (ticked.has(path.join(at.base, '.local', 'bin', 'flow'))) out(`\nflow and fw went with them. Put Flow back with node ${paths.cloneRoot()}/scripts/flow.js install`);
    return 0;
  },
};

actions.project = {
  anywhere: true,
  summary: 'put this project back as it was before Flow, its own knowledge kept unless you say',
  flags: { root },
  run({ flags }) {
    const at = paths.folders(flags.root);
    const project = projectRoot();
    const found = originals.read(at, project);
    if (!found) throw new FlowError(`No original of ${show(project)}. Nothing to put back.`);
    confirm.noSessions();

    const ticked = form.ask(at, 'restore', form.sections(at, project, true), [], [`one box per path Flow changed in ${show(project)}.`]);
    if (!ticked) {
      out('\nnothing was put back.');
      return 1;
    }
    form.refuseUnsent([project], ticked);
    out('');
    report(at, project, ticked);
    if (!form.keepsFlow(project, ticked)) out('\nIts .flow/ went with them. Put the project back into Flow with flow init');
    return 0;
  },
};

module.exports = { summary: 'put a machine or a project back as it was before Flow', default: 'ls', actions };
