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
 * `lib/skills/skills-update.js` holds what it does to the skill repositories.
 * The Flow home is only fetched, never merged: `flow sync` is what brings it
 * down, and `lib/machine/flow-repo.js` reads the machine records the fetch left.
 */

const machine = require('../lib/machine/machine');
const flowRepo = require('../lib/machine/flow-repo');
const update = require('../lib/skills/skills-update');
const paths = require('../lib/paths');

const at = paths.folders();
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
