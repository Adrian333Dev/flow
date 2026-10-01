'use strict';
/**
 * `flow restore`: put a machine or a project back the way it was before Flow.
 *
 * One original per place, written once and never added to, so there is no id
 * to look up and no date to read: `flow restore machine` and
 * `flow restore project` are the whole surface. `lib/originals.js` holds the
 * folder and the reasoning.
 *
 * It needs no agent and no session, so it works from a plain shell after a
 * migration that broke Claude Code itself. `lib/confirm.js` holds the locks,
 * and the agent fails 2 of them: a running session refuses the command, and
 * the word has to be typed at a terminal the agent does not have.
 *
 * The original survives, so a restore runs again and lands in the same place.
 * Restoring the machine deletes `~/.local/bin/flow` along with everything else
 * `flow install` made, which is why the last line says how to put Flow back.
 * It leaves `~/.flow/` alone: only `flow uninstall` deletes that.
 *
 * The ticket skills go too, listed in the prompt with the rest: no original
 * holds them, since `flow` writes them after the window shuts.
 *
 * A machine restore offers every project first. Once `flow` is gone from PATH
 * a project's restore is typed through the script's path in `~/.flow/`, which
 * nobody remembers, so the word `restore` puts the projects back in the same
 * run and `machine` takes the machine alone.
 */

const path = require('path');
const { out, joinAnd } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { cloneRoot } = require('../lib/clone');
const { projectRoot } = require('../lib/root');
const confirm = require('../lib/confirm');
const machine = require('../lib/machine');
const originals = require('../lib/originals');
const ticketSkills = require('../lib/ticket-skills');

const show = machine.shorten;
const root = { arg: '<dir>' };

const actions = {};

actions.ls = {
  anywhere: true,
  summary: 'the originals on this machine, and how many paths each holds',
  flags: { root },
  run({ positional, flags, usage }) {
    if (positional.length) throw new FlowError(`${usage} takes no words. Put one back with flow restore machine or flow restore project.`);
    const at = machine.folders(flags.root);
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

/**
 * The prompt's first lines: the count, then one line per path saying what the
 * restore does to it, so nobody types the word blind. A project's paths are
 * shown from inside it.
 */
function listing(at, project) {
  const skills = ticketSkills.findAll([skillsDir(at, project)]).map((p) => ({ path: p, removed: true, folder: true }));
  const rows = [...originals.plan(at, project), ...skills];
  const where = project ? `in ${show(project)}` : 'on this machine';
  const name = (row) => (project ? path.relative(project, row.path) : show(row.path)) + (row.folder ? '/' : '');
  const width = Math.max(...rows.map((row) => name(row).length));
  return [
    `Puts ${rows.length === 1 ? '1 path' : `${rows.length} paths`} ${where} back as ${rows.length === 1 ? 'it was' : 'they were'} before Flow.`,
    ...rows.map((row) => `  ${name(row).padEnd(width)}  ${row.removed ? 'deleted' : 'put back'}${row.changed ? ', changed since' : ''}`),
  ];
}

/** Print each path a restore touched. */
function report(done) {
  for (const entry of done) out(`${entry.removed ? 'removed' : 'put back'} ${show(entry.path)}`);
}

/** The folder a place's ticket skills sit in: `lib/ticket-skills.js`. */
const skillsDir = (at, project) => (project ? ticketSkills.folderOf(project) : path.join(at.claude, 'skills'));

/**
 * Put one place back: its ticket skills first, which no original holds, then
 * every path the original does.
 */
function putBack(at, project = null) {
  for (const p of ticketSkills.clear(skillsDir(at, project), project)) out(`removed ${show(p)}`);
  report(originals.restore(at, project));
}

actions.machine = {
  anywhere: true,
  summary: 'put this machine back as it was before Flow, its projects first if you say so, leaving ~/.flow/ alone',
  flags: { root },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const found = originals.read(at);
    if (!found) throw new FlowError('No original of this machine. Nothing to put back.');
    confirm.noSessions();

    const projects = originals.list(at).filter((row) => row.manifest.project).map((row) => row.manifest.project);
    const names = joinAnd(projects.map((p) => path.basename(p)));
    const later = `node ${show(path.join(at.flow, 'scripts', 'flow', 'flow.js'))} restore project`;
    const lines = listing(at);
    if (projects.length) {
      lines.push(
        `Flow is also set up in ${names}.`,
        `  restore  puts ${projects.length === 1 ? 'it' : 'each one'} back first, then this machine.`,
        `  machine  puts back this machine alone. flow leaves PATH, so ${names} keep${projects.length === 1 ? 's' : ''} Flow's files until you run, inside each:`,
        `           ${later}`,
      );
    }
    const answer = confirm.word(projects.length ? ['restore', 'machine'] : 'restore', lines);
    if (!answer) {
      out('\nnothing was put back.');
      return 1;
    }

    out('');
    if (answer === 'restore') for (const project of projects) putBack(at, project);
    putBack(at);
    if (answer === 'machine' && projects.length) out(`\n${names} still hold${projects.length === 1 ? 's' : ''} Flow. Put ${projects.length === 1 ? 'it' : 'each one'} back from inside it with ${later}`);
    out(`\nflow and fw went with them. Put Flow back with node ${cloneRoot()}/scripts/flow/flow.js install`);
    return 0;
  },
};

actions.project = {
  anywhere: true,
  summary: 'put this project back as it was before Flow, .flow/ deleted with it',
  flags: { root },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const project = projectRoot();
    const found = originals.read(at, project);
    if (!found) throw new FlowError(`No original of ${show(project)}. Nothing to put back.`);
    confirm.noSessions();

    if (!confirm.word('restore', listing(at, project))) {
      out('\nnothing was put back.');
      return 1;
    }
    out('');
    putBack(at, project);
    out('\nIts .flow/ went with them. Put the project back into Flow with flow init');
    return 0;
  },
};

module.exports = { summary: 'put a machine or a project back as it was before Flow', default: 'ls', actions };
