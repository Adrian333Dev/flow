#!/usr/bin/env node
'use strict';
/**
 * domain-pull.js: the domain-skills clone updating itself, in the background.
 *
 * The `SessionStart` hook starts this script detached and returns at once, so
 * the session never waits for the network. Nothing here prints: what it finds
 * goes into `~/.flow/skills-update.json`, which the next session reads.
 *
 * It is not a `flow` command, so it is never typed by hand.
 * `flow/lib/skills-update.js` holds the whole of what it does.
 */

const machine = require('./flow/lib/machine');
const update = require('./flow/lib/skills-update');

try {
  update.run(machine.folders());
} catch {
  // Nobody is watching this process. A skill one pull behind is not a failure.
}
