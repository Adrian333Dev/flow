#!/usr/bin/env node
'use strict';
/**
 * skills-pull.js: every skill repository Flow cloned updating itself, in the
 * background, and the Flow home's repository fetched so the next session can
 * say another machine moved to a newer changelog entry.
 *
 * The `SessionStart` hook starts this script detached and returns at once, so
 * the session never waits for the network. Nothing here prints: what it finds
 * goes into `~/.flow/skills-update.json`, which the next session reads.
 *
 * It is not a `flow` command, so it is never typed by hand.
 * `flow/lib/skills-update.js` holds what it does to the skill repositories.
 * The Flow home is only fetched, never merged: `flow sync` is what brings it
 * down, and `flow/lib/flow-repo.js` reads the machine records the fetch left.
 */

const machine = require('./flow/lib/machine');
const flowRepo = require('./flow/lib/flow-repo');
const update = require('./flow/lib/skills-update');

const at = machine.folders();
try {
  if (flowRepo.fetchDue(at)) flowRepo.fetch(at);
} catch {
  // Offline, or signed out. The next session tries again.
}
try {
  update.run(at);
} catch {
  // Nobody is watching this process. A skill one pull behind is not a failure.
}
