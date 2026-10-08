'use strict';
/**
 * The scorecard store: one file per session under ~/.flow/logs/scorecards/, holding
 * one JSON object per line.
 *
 * Append only. Two hooks can fire close enough together that a read, change and
 * write back loses one of them, and the thing lost is a count nobody notices is
 * missing. Appending a line has no such race.
 *
 * Two kinds of line share one file, told apart by `type`:
 *
 *   result  one check ran against one edit, and whether the rule held
 *   loaded  one CLAUDE.md or rule file entered context
 *
 * They live together because the question that needs both is asked per session:
 * a warning names the rule id when its file is loaded, and carries the rule's
 * whole text when it is not.
 *
 * Every result records the project it happened in and the effort level it ran
 * at. The project answers "violated here and nowhere else", which is the signal
 * that a global rule should have been scoped to one project. The effort answers
 * whether a rule holds when the model is thinking less. Both are free to record
 * now and impossible to backfill.
 *
 * A session that edits nothing writes no file, so every reader here treats a
 * missing one as empty rather than an error.
 */

const fs = require('fs');
const path = require('path');
const logs = require('../logs/logs');

const dir = () => path.join(logs.dir(), 'scorecards');

/** A session id is a filename, so anything strange in it is flattened first. */
const sessionFile = (sessionId) =>
  path.join(dir(), `${String(sessionId || 'unknown').replace(/[^A-Za-z0-9._-]/g, '-')}.jsonl`);

/**
 * Add one line. Never throws: this runs inside a hook, and a failure to record
 * a count must not stop the edit that triggered it.
 */
function append(sessionId, record) {
  try {
    fs.mkdirSync(dir(), { recursive: true });
    fs.appendFileSync(sessionFile(sessionId), JSON.stringify({ at: new Date().toISOString(), ...record }) + '\n');
    return true;
  } catch {
    return false;
  }
}

/** Every line in one session's file. A half-written last line is skipped. */
function readSession(sessionId) {
  const file = sessionFile(sessionId);
  if (!fs.existsSync(file)) return [];
  return parse(fs.readFileSync(file, 'utf8'));
}

/** Every line across every session, oldest file first. */
function readAll() {
  const root = dir();
  if (!fs.existsSync(root)) return [];
  const rows = [];
  for (const name of fs.readdirSync(root).sort()) {
    if (!name.endsWith('.jsonl')) continue;
    rows.push(...parse(fs.readFileSync(path.join(root, name), 'utf8')));
  }
  return rows;
}

/** A line written before 2026-10-08 says `kind`: read it as `type` until those files age out. */
function upgrade(row) {
  if (row.type || !row.kind) return row;
  const { kind, ...rest } = row;
  return { type: kind, ...rest };
}

function parse(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      rows.push(upgrade(JSON.parse(line)));
    } catch {
      // A line written while the process died. One lost count is not worth
      // refusing to read the other nine hundred.
    }
  }
  return rows;
}

/** The instruction files this session has loaded, as a set of absolute paths. */
function loadedIn(sessionId) {
  return new Set(readSession(sessionId).filter((r) => r.type === 'loaded').map((r) => r.file));
}

module.exports = { dir, sessionFile, append, readSession, readAll, loadedIn };
