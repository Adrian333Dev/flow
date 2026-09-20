'use strict';
/**
 * `flow sync`: bring the other machine's `~/.flow/` down, then send this one
 * up.
 *
 * `~/.flow/` is one private git repository, and that repository is the whole
 * of how Flow reaches a second machine: the rules, the workflow notes, the
 * study cases, the private skills, the wiki and the tickets that belong to no
 * project all live in it already. A project travels through its own
 * repository, and Flow leaves it alone.
 *
 * Typed, never automatic. The user asked for the smallest version that works,
 * so nothing downloads when a session opens and nothing uploads when a file
 * changes. Both of those are parked in `backlog.md`.
 *
 * Down before up, because a pull that is not a fast-forward stops everything:
 * the 2 machines have diverged, and a commit made here first would only add a
 * merge to sort out by hand.
 *
 * `lib/flow-repo.js` holds the repository, the commit named for the machine,
 * and the list of what never travels.
 */

const { out } = require('../lib/cli');
const machine = require('../lib/machine');
const repo = require('../lib/flow-repo');

const actions = {};

actions.sync = {
  section: 'setup',
  summary: 'bring ~/.flow/ down from the other machine, then send this one up',
  flags: { root: { arg: '<dir>' } },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const came = repo.load(at);
    out(came ? `came down: ${came}` : 'nothing new came down.');
    const sent = repo.save(at);
    out(sent ? `went up: ${sent}` : 'nothing changed here, so nothing went up.');
    return 0;
  },
};

module.exports = actions;
