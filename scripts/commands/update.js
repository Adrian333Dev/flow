'use strict';
/**
 * `flow update`: pull Flow's own clone, then run `flow install` again from the
 * pulled files.
 *
 * That is the whole of updating a machine: no version number and no migration.
 * The second install makes every link and file the new commit names, and owes
 * the setup session, which fixes `settings.json` (`lib/machine/setup-session.js`).
 * `update` marks the session owed before the install runs, since a pull may
 * have changed the template the session reads.
 *
 * The install runs as a new process: the pulled `install.js` is the one that
 * knows the new commit, and this process still holds the old one in memory.
 *
 * A clone that is a link is the checkout somebody develops Flow in. `update`
 * refuses it and never pulls it: their branch and uncommitted work are theirs.
 * A pull that fails stops with git's message and writes one failure-log line.
 * No submodules are updated, since a machine that only uses Flow has no `lab/`.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const failures = require('../lib/logs/failures');
const setupSession = require('../lib/machine/setup-session');
const repos = require('../lib/skills/repos');
const paths = require('../lib/paths');
const { git } = require('../lib/git');

const show = paths.shorten;
const actions = {};

actions.update = {
  section: 'setup',
  summary: "pull Flow's clone, then run flow install again",
  flags: {
    root: { arg: '<dir>', hidden: true },
    'no-bin': { bool: true, hidden: true },
    'no-clone': { bool: true, hidden: true },
  },
  run: ({ flags }) => {
    const at = paths.folders(flags.root);
    try {
      return perform(flags, at);
    } catch (e) {
      failures.record(at.flow, { source: 'update', what: 'flow update', error: e.message });
      throw e;
    }
  },
};

function perform(flags, at) {
  const clone = repos.flowClone(at.flow);
  pull(clone);
  setupSession.markPending(at);

  const passed = [];
  if (flags.root) passed.push('--root', flags.root);
  if (flags['no-bin']) passed.push('--no-bin');
  if (flags['no-clone']) passed.push('--no-clone');
  const ran = spawnSync(process.execPath, [path.join(clone, 'scripts', 'flow.js'), 'install', ...passed], { stdio: 'inherit' });
  if (ran.error) throw new FlowError(`could not run flow install from ${show(clone)}: ${ran.error.message}`);
  return ran.status === null ? 1 : ran.status;
}

/** Fast-forward the clone, or throw with git's own message. */
function pull(clone) {
  let found = null;
  try {
    found = fs.lstatSync(clone);
  } catch {
    // No clone here.
  }
  if (!found) {
    throw new FlowError(`${show(clone)} does not exist, so there is nothing to update. Run flow install from a clone of Flow first.`);
  }
  if (found.isSymbolicLink()) {
    throw new FlowError(`${show(clone)} is a link to ${fs.readlinkSync(clone)}, a checkout of your own that update leaves alone. ` +
      'Pull it yourself, then run flow install.');
  }

  const before = repos.head(clone);
  const pulled = git(clone, ['pull', '--ff-only']);
  if (!pulled.ok) {
    throw new FlowError(`could not pull ${show(clone)}, so nothing was updated:\n  ${pulled.err.split('\n').join('\n  ')}`);
  }
  const after = repos.head(clone);
  out(before === after ? 'Flow was already at its newest commit.' : `pulled Flow from ${before} to ${after}.`);
}

module.exports = actions;
