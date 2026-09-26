'use strict';
/**
 * Flow's version: the number of a CHANGELOG.md entry.
 *
 * An entry is numbered, and that number is the version. `## 12, 2026-11-02` is
 * version 12. A machine keeps the number of the newest entry it applied in
 * ~/.flow/version, a project keeps its own in .flow/version, and a migration
 * is every entry above that number. `upgrades/12.md` in the clone says what
 * the step from 11 to 12 does to a machine.
 *
 * There is no 1.4.2 here. Flow is a clone the user pulls, with no registry and
 * nobody pinning a range, so a counter is the whole of it.
 */

const fs = require('fs');
const path = require('path');

/** `## 12, 2026-11-02`, one per entry, at the start of a line. */
const ENTRY = /^## (\d+), (\d{4}-\d\d-\d\d)\s*$/gm;

/**
 * Every entry the changelog holds, highest number first.
 *
 * Sorted rather than trusted in file order: the file is written newest first,
 * and an entry pasted into the wrong place would otherwise move a machine
 * backwards without anything saying so.
 */
function entries(clone) {
  let text;
  try {
    text = fs.readFileSync(path.join(clone, 'CHANGELOG.md'), 'utf8');
  } catch {
    return [];
  }
  return [...text.matchAll(ENTRY)]
    .map((m) => ({ number: Number(m[1]), date: m[2] }))
    .sort((a, b) => b.number - a.number);
}

/** The newest entry's number, or null where the changelog holds none. */
function newest(clone) {
  const [first] = entries(clone);
  return first ? first.number : null;
}

/**
 * A one-line version file read as a number: ~/.flow/version for the machine,
 * .flow/version inside a project.
 *
 * Three states rather than a number or null, because the fix differs for each.
 * A missing file means the setup never reached its last step, which is what
 * stamps it. A file holding anything else was written by something that is not
 * Flow.
 */
function applied(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8').trim();
  } catch {
    return { state: 'missing' };
  }
  return /^\d+$/.test(text) ? { state: 'ok', number: Number(text) } : { state: 'unreadable', text };
}

module.exports = { entries, newest, applied };
