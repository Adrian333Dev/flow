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
 */

const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { cloneRoot } = require('../lib/clone');
const { projectRoot } = require('../lib/root');
const confirm = require('../lib/confirm');
const machine = require('../lib/machine');
const originals = require('../lib/originals');

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
      out('no original. flow install writes the machine\'s, and flow setup project a project\'s.');
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

/** The body of both restores: the 2 locks, the word, then every path. */
function putBack(at, project, { what, after }) {
  const found = originals.read(at, project);
  if (!found) {
    throw new FlowError(project
      ? `No original of ${show(project)}. Nothing to put back.`
      : 'No original of this machine. Nothing to put back.');
  }
  confirm.noSessions();

  const lines = [`Puts ${found.entries.length} paths in ${what} back as they were before Flow.`];
  if (!confirm.word('restore', lines)) {
    out('\nnothing was put back.');
    return 1;
  }

  out('');
  for (const done of originals.restore(at, project)) {
    out(`${done.removed ? 'removed' : 'put back'} ${show(done.path)}`);
  }
  out(after);
  return 0;
}

actions.machine = {
  anywhere: true,
  summary: 'put this machine back as it was before Flow, leaving ~/.flow/ alone',
  flags: { root },
  run({ flags }) {
    const at = machine.folders(flags.root);
    return putBack(at, null, {
      what: 'this machine',
      after: `\nflow and fw went with them. Put Flow back with node ${cloneRoot()}/scripts/flow/flow.js install`,
    });
  },
};

actions.project = {
  anywhere: true,
  summary: 'put this project back as it was before Flow, .flow/ deleted with it',
  flags: { root },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const project = projectRoot();
    return putBack(at, project, {
      what: show(project),
      after: '\nIts .flow/ went with them. Put the project back into Flow with flow setup project',
    });
  },
};

module.exports = { summary: 'put a machine or a project back as it was before Flow', default: 'ls', actions };
