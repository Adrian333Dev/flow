'use strict';
/**
 * The audit database: where it lives, and the shape it holds.
 *
 * Every row here is derived from a transcript Claude Code wrote anyway.
 * Nothing is authoritative — delete the file and `flow audit index` writes it
 * again from the same source. That is what allows the schema to change without
 * a migration: bump SCHEMA and the next index rebuilds.
 *
 * Machine-local by design. It describes work that happened on one machine, and
 * `~/.flow` is synced between two, so `audit/` is excluded from that sync.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { FlowError } = require('../error');

// Bumping this throws the file away on the next index. Every row is derived,
// so the cost of a rebuild is time, never data.
const SCHEMA = 6;

// FLOW_HOME mirrors the rest of flow: the default is the installed location,
// and an override exists so the tool can be exercised without writing to it.
const flowHome = () => process.env.FLOW_HOME || path.join(os.homedir(), '.flow');
const auditDir = () => path.join(flowHome(), 'audit');
const dbPath = () => path.join(auditDir(), 'audit.db');

/**
 * Where Claude Code keeps its transcripts. CLAUDE_CONFIG_DIR is its own
 * variable, not one Flow invents, so honouring it costs nothing and makes the
 * tests point somewhere harmless.
 */
const claudeHome = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const projectsDir = () => path.join(claudeHome(), 'projects');

const DDL = `
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- The reader's bookmark, one row per file it has walked. Transcripts only ever
-- grow, so the next run reads from bytes_read instead of parsing 61 MB again.
-- inode catches a file replaced rather than extended, which resets the row.
CREATE TABLE transcript (
  path        TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  project     TEXT NOT NULL,
  kind        TEXT NOT NULL,          -- session | subagent
  agent_of    TEXT,                   -- parent session id, for a subagent
  bytes_read  INTEGER NOT NULL DEFAULT 0,
  lines_read  INTEGER NOT NULL DEFAULT 0,
  inode       INTEGER,
  size        INTEGER,
  mtime       INTEGER,
  open_turn   INTEGER,                -- the turn a partial file stopped inside
  open_seg    INTEGER,                -- and the segment, and the prompt that opened it
  open_prompt TEXT,
  indexed_at  TEXT
);

-- One row per session id, not per file: /cd moves storage mid-session, so one
-- id can own transcripts under two project folders.
CREATE TABLE session (
  id            TEXT PRIMARY KEY,
  project       TEXT,
  cwd           TEXT,
  git_branch    TEXT,
  version       TEXT,
  slug          TEXT,
  started_at    TEXT,
  ended_at      TEXT,
  events        INTEGER DEFAULT 0,
  turns         INTEGER DEFAULT 0,
  segments      INTEGER DEFAULT 0,
  tool_calls    INTEGER DEFAULT 0,
  errors        INTEGER DEFAULT 0,
  cost_usd      REAL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  cache_read    INTEGER,
  cache_write   INTEGER,
  lines_added   INTEGER,
  lines_removed INTEGER,
  duration_ms   INTEGER,
  api_ms        INTEGER,
  tool_ms       INTEGER
);

-- One unbroken context window. A compaction ends one and starts the next
-- inside the same session; /clear ends the session, so its last segment ends
-- with the file. Same unit either way, which is the whole point of it.
CREATE TABLE segment (
  id         INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  ordinal    INTEGER NOT NULL,
  first_line INTEGER,
  last_line  INTEGER,
  started_at TEXT,
  ended_at   TEXT,
  ended_by   TEXT,                    -- compact | end
  trigger    TEXT,                    -- manual | auto, when a compaction ended it
  pre_tokens      INTEGER,
  post_tokens     INTEGER,
  dropped_tokens  INTEGER,
  compact_ms      INTEGER,
  turns      INTEGER DEFAULT 0
);

-- One prompt and everything it caused. promptId is carried only by user lines,
-- so a turn runs from one to the next in file order.
CREATE TABLE turn (
  id         INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  segment_id INTEGER,
  prompt_id  TEXT,
  ordinal    INTEGER,
  first_line INTEGER,
  last_line  INTEGER,
  started_at TEXT,
  ended_at   TEXT,
  duration_ms INTEGER,                -- system/turn_duration
  messages   INTEGER,
  source     TEXT,                    -- typed | queued | compact | tool
  prompt     TEXT,                    -- the opening text, trimmed
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  thinking_tokens INTEGER DEFAULT 0,
  cache_read    INTEGER DEFAULT 0,
  cache_write   INTEGER DEFAULT 0,
  tool_calls INTEGER DEFAULT 0,
  errors     INTEGER DEFAULT 0
);

-- One row per transcript line, carrying the line number in the file. That
-- number is what makes reading one turn cost nothing: without it, reaching
-- turn 412 means re-parsing the whole transcript, which is the exact waste the
-- audit exists to catch.
CREATE TABLE event (
  id          INTEGER PRIMARY KEY,
  session_id  TEXT NOT NULL,
  transcript  TEXT NOT NULL,
  line        INTEGER NOT NULL,
  offset      INTEGER NOT NULL,
  bytes       INTEGER NOT NULL,
  uuid        TEXT,
  parent_uuid TEXT,
  type        TEXT,
  subtype     TEXT,
  timestamp   TEXT,
  turn_id     INTEGER,
  segment_id  INTEGER,
  sidechain   INTEGER DEFAULT 0,
  model       TEXT
);

CREATE TABLE tool_call (
  id           INTEGER PRIMARY KEY,
  session_id   TEXT NOT NULL,
  turn_id      INTEGER,
  segment_id   INTEGER,
  tool_use_id  TEXT,
  name         TEXT,
  summary      TEXT,                  -- the one-line handle: a command, a path, a query
  input        TEXT,                  -- JSON, as called
  input_bytes  INTEGER,
  call_line    INTEGER,
  result_line  INTEGER,
  result_bytes INTEGER,
  is_error     INTEGER DEFAULT 0,
  duration_ms  INTEGER
);

-- Content entering or leaving context, by path. Attribution is best-effort and
-- says so: confidence records how the path was learnt, so a query can demand
-- exact and get only what the tool itself reported.
CREATE TABLE file_touch (
  id           INTEGER PRIMARY KEY,
  session_id   TEXT NOT NULL,
  turn_id      INTEGER,
  segment_id   INTEGER,
  tool_call_id INTEGER,
  line         INTEGER,
  path         TEXT,                  -- absolute, resolved against the session cwd
  given        TEXT,                  -- exactly as the command or attachment wrote it
  kind         TEXT,                  -- read | write | edit | list
  start_line   INTEGER,
  end_line     INTEGER,
  total_lines  INTEGER,
  bytes        INTEGER,
  confidence   TEXT,                  -- exact | parsed | declared
  via          TEXT                   -- Read | Edit | bash:cat | util fs merge | attachment:file
);

-- A run is the piece of work, which Flow supplies and Claude Code knows
-- nothing about. Both tables stay empty with no project, and every query
-- treats run as optional. That is what makes the audit work with no ticket.
CREATE TABLE run (
  id        INTEGER PRIMARY KEY,
  key       TEXT UNIQUE,
  project   TEXT,
  ticket    TEXT,
  title     TEXT,
  opened_at TEXT,
  closed_at TEXT
);

CREATE TABLE run_session (
  run_id     INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  PRIMARY KEY (run_id, session_id)
);

CREATE INDEX event_session   ON event (session_id, line);
CREATE INDEX event_turn      ON event (turn_id);
CREATE INDEX event_type      ON event (type, subtype);
CREATE INDEX turn_session    ON turn (session_id, ordinal);
CREATE INDEX segment_session ON segment (session_id, ordinal);
CREATE INDEX tool_turn       ON tool_call (turn_id);
CREATE INDEX tool_name       ON tool_call (name);
CREATE INDEX tool_session    ON tool_call (session_id);
CREATE INDEX touch_path      ON file_touch (path);
CREATE INDEX touch_turn      ON file_touch (turn_id);
CREATE INDEX touch_session   ON file_touch (session_id);
`;

function create(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(DDL);
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('schema', String(SCHEMA));
  return db;
}

/**
 * Opens the database, building it when it is absent and rebuilding it when the
 * schema has moved on. `readonly` refuses to do either: a query should fail
 * loudly against a missing index rather than silently report zero rows.
 */
function open({ readonly = false } = {}) {
  const file = dbPath();

  if (!fs.existsSync(file)) {
    if (readonly) {
      throw new FlowError(
        `no audit index at ${file}.\n` +
        '  Run flow audit index to build one.'
      );
    }
    return create(file);
  }

  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  let version = 0;
  try {
    version = Number(db.prepare('SELECT value FROM meta WHERE key = ?').get('schema')?.value || 0);
  } catch {
    version = 0;
  }
  if (version === SCHEMA) return db;

  if (readonly) {
    throw new FlowError(
      `the audit index was built by an older schema (${version || 'unknown'}, now ${SCHEMA}).\n` +
      '  Run flow audit index to rebuild it.'
    );
  }

  db.close();
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(file + suffix, { force: true });
  return create(file);
}

module.exports = { open, dbPath, auditDir, projectsDir, claudeHome, flowHome, SCHEMA };
