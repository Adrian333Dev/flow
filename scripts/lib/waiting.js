'use strict';
/**
 * What waits for `/flow:upkeep`: closed tickets nobody has filed, the notes
 * capture inferred (labelled `profile` or `rule`) for this project and the
 * global place, and the findings not yet folded into a page. `flow next`
 * prints the count, so a sweep owed shows at every start.
 */

const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const notes = require('./notes');
const store = require('./tickets/store');

// The labels capture gives a correction it inferred, which only a sweep accepts.
const INFERRED = ['profile', 'rule'];

/** The `.md` files of one folder, none where it is missing. */
function markdown(dir) {
  try {
    return fs.readdirSync(dir).filter((name) => name.endsWith('.md') && !name.startsWith('.'));
  } catch {
    return [];
  }
}

/** This project's findings, `scorecard.md` excepted, and every wiki folder's. */
function findings(root) {
  const own = markdown(path.join(root, '.flow', 'findings')).filter((name) => name !== 'scorecard.md').length;
  const wiki = path.join(paths.flowHome(), 'wiki');
  let folders = [];
  try {
    folders = fs.readdirSync(wiki, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    // no wiki yet
  }
  return folders.reduce((sum, d) => sum + markdown(path.join(wiki, d.name, 'findings')).length, own);
}

/** `{ tickets, notes, findings }`: how many of each wait. `tickets` is what the project holds. */
function count(root, tickets) {
  const mine = [notes.projectOf(root).toLowerCase(), store.HOME_WORD];
  return {
    tickets: tickets.filter((t) => t.data.status === 'done' && !t.data.filed).length,
    notes: notes.readNotes().filter((n) => n.data.labels.some((l) => INFERRED.includes(l)) && mine.includes(n.data.project.toLowerCase())).length,
    findings: findings(root),
  };
}

module.exports = { count };
