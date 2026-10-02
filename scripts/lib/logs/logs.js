'use strict';
/**
 * `~/.flow/logs/`: what happened on this machine, added to and never rewritten.
 *
 *   install.log                   every line of the last `flow install`
 *   history/<year>-<month>.jsonl  every change Flow made to this machine
 *   failures/<year>-<month>.jsonl every failure of something Flow built or chose
 *   scorecards/<session>.jsonl    every rule check a session ran
 *
 * A log that grows gets one file per month, and the writer starts the new
 * month's file on its first line. The month in the name is the whole archive:
 * nothing moves an old file and nothing trims one. The newest file is the
 * current month.
 *
 * The folder stays on this machine, named once in `~/.flow/.gitignore`.
 *
 * Writing a line never fails the work it records.
 */

const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const paths = require('../paths');

const DIR = 'logs';

const dir = (home) => path.join(home || paths.flowHome(), DIR);

/** `2026-09`, from the local clock, which is the month the user sees. */
function month(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** This month's file of one log. */
const monthFile = (home, name, date) => path.join(dir(home), name, `${month(date)}.jsonl`);

/** Add one line to this month's file of one log. */
function append(home, name, entry) {
  try {
    const file = monthFile(home, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
    return true;
  } catch {
    return false;
  }
}

/**
 * `history/`: one line per change Flow makes to this machine, so a confusing
 * state can be traced back to what did it.
 *
 *   {"at":"…","type":"clone","source":"mattpocock/skills","commit":"4f2a91c"}
 *   {"at":"…","type":"skill","name":"grill-me","state":"on","level":"machine","by":"flow skills on"}
 */
const historyFile = (home) => monthFile(home, 'history');

function recordHistory(home, entry) {
  append(home, 'history', entry);
}

module.exports = { DIR, dir, month, monthFile, append, historyFile, recordHistory };
