'use strict';
/**
 * `~/.flow/history.jsonl`: one line per change Flow makes to this machine, so
 * a confusing state can be traced back to what did it.
 *
 * Added to and never rewritten, the way `changes.js` keeps its events. It
 * stays on this machine, named in `~/.flow/.gitignore`: 2 machines adding to
 * one shared file would clash at every `flow sync`.
 *
 *   {"at":"…","type":"clone","source":"mattpocock/skills","commit":"4f2a91c"}
 *   {"at":"…","type":"skill","name":"grill-me","state":"on","level":"machine","by":"flow skills on"}
 *
 * Writing it never fails the change it records.
 */

const fs = require('fs');
const path = require('path');
const settings = require('./settings');

const FILE = 'history.jsonl';

const file = (home) => path.join(home || settings.flowHome(), FILE);

function record(home, entry) {
  try {
    fs.mkdirSync(path.dirname(file(home)), { recursive: true });
    fs.appendFileSync(file(home), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
  } catch {
    // A log that cannot be written is not a reason to undo the change.
  }
}

module.exports = { FILE, file, record };
