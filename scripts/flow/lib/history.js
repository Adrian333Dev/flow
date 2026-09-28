'use strict';
/**
 * `~/.flow/logs/history/<month>.jsonl`: one line per change Flow makes to this
 * machine, so a confusing state can be traced back to what did it.
 *
 * Added to and never rewritten, the way `changes.js` keeps its events. It
 * stays on this machine with the rest of `logs/`: 2 machines adding to one
 * shared file would clash at every `flow sync`.
 *
 *   {"at":"…","type":"clone","source":"mattpocock/skills","commit":"4f2a91c"}
 *   {"at":"…","type":"skill","name":"grill-me","state":"on","level":"machine","by":"flow skills on"}
 *
 * Writing it never fails the change it records.
 */

const logs = require('./logs');

const NAME = 'history';

/** This month's file. */
const file = (home) => logs.monthFile(home, NAME);

function record(home, entry) {
  logs.append(home, NAME, entry);
}

module.exports = { NAME, file, record };
