/**
 * The audit database: where it lives, and the shape it holds.
 *
 * Every row here is derived from a transcript Claude Code wrote anyway. While
 * the transcript is on disk, deleting the file and running `flow audit index`
 * writes it again. Once Claude Code sweeps a transcript, its rows are the only
 * copy, which is why a rebuild carries them over. That allows the schema to
 * change without a migration: bump SCHEMA and the next index rebuilds.
 *
 * Machine-local by design. It describes work that happened on one machine, and
 * `~/.flow` is synced between two, so `audit/` is excluded from that sync.
 *
 * Group every query by segment, never by session. A piece of work that crossed
 * 2 context boundaries is always 3 segments, but 1 session where it compacted
 * and 3 where it cleared, so a session count means whatever the user happened
 * to type. The levels, smallest first: turn (one prompt and what it caused),
 * segment (one context window), session (Claude Code's id, used to join rows
 * and nothing else), run (the piece of work, below). `--resume` and
 * `--continue` keep the id and append to the same file; `/branch` and
 * `--fork-session` start a new one.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as paths from '../../shared/paths.ts';
import { DatabaseSync } from 'node:sqlite';
import { FlowError } from '../../shared/error.ts';

// Bumping this rebuilds the file on the next index. A row is derived from a
// transcript, so a rebuild costs time, except for a session whose transcript
// Claude Code has swept: `rebuild` carries those rows over.
const SCHEMA = 11;

const auditDir = () => path.join(paths.flowHome(), 'audit');
const dbPath = () => path.join(auditDir(), 'audit.db');

/** Where Claude Code keeps its transcripts. */
const projectsDir = () => path.join(paths.claudeHome(), 'projects');

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
  type        TEXT NOT NULL,          -- session | subagent
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
  machine       TEXT,                 -- the name flow install saved; transcripts carry none
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
  prompt     TEXT,                    -- the opening text, whole
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

-- One request to the model, and the only place tokens are counted. Claude
-- Code writes a reply as one transcript line per content block, each repeating
-- the reply's whole usage, so a row is one message id, never one line. Summed
-- per line, a session's cache read came out 2.2 times too high. Each count is
-- the largest any line carried: a reply opening with thinking writes its first
-- line mid-stream, and kept, that line read 644 output tokens where 12,364 ran.
CREATE TABLE request (
  id              INTEGER PRIMARY KEY,
  session_id      TEXT NOT NULL,
  turn_id         INTEGER,
  segment_id      INTEGER,
  message_id      TEXT,
  line            INTEGER,
  timestamp       TEXT,
  model           TEXT,
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  thinking_tokens INTEGER DEFAULT 0,
  cache_read      INTEGER DEFAULT 0,
  cache_write     INTEGER DEFAULT 0,
  UNIQUE (session_id, message_id)
);

CREATE TABLE tool_call (
  id           INTEGER PRIMARY KEY,
  session_id   TEXT NOT NULL,
  turn_id      INTEGER,
  segment_id   INTEGER,
  request_id   INTEGER,
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
  type         TEXT,                  -- read | write | edit | list
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
-- A hook that writes runs from SessionStart has to update a session's row:
-- SessionStart fires on compaction too, with source compact.
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
CREATE INDEX request_session ON request (session_id, line);
CREATE INDEX request_turn    ON request (turn_id);
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
  rebuild();
  return new DatabaseSync(file);
}

// Tables whose rows belong to one session. A kept row is copied by column
// name, so a column the new schema lacks is dropped and a new one starts empty.
const BY_SESSION = [
  ['session', 'id'], ['transcript', 'session_id'], ['segment', 'session_id'],
  ['turn', 'session_id'], ['event', 'session_id'], ['request', 'session_id'],
  ['tool_call', 'session_id'], ['file_touch', 'session_id'], ['run_session', 'session_id'],
];

const clear = (file: string) => { for (const suffix of ['', '-wal', '-shm']) fs.rmSync(file + suffix, { force: true }); };

/** The session ids none of whose transcripts is on disk, read from an old index. [] when it cannot be read. */
function sweptSessions(db: DatabaseSync, file: string): string[] {
  try {
    db.prepare('ATTACH DATABASE ? AS old').run(file);
    const rows = db.prepare('SELECT session_id, path FROM old.transcript').all() as { session_id: string; path: string }[];
    const alive = new Set(rows.filter((t) => fs.existsSync(t.path)).map((t) => t.session_id));
    return [...new Set(rows.map((t) => t.session_id))].filter((id) => !alive.has(id));
  } catch {
    return [];
  }
}

/**
 * Writes the database again from the transcripts on disk. A session whose
 * transcripts Claude Code has already swept cannot be read back, so its rows
 * are the only copy: they are carried into the new file first, ids unchanged
 * because rows point at each other by id. The new file is built beside the old
 * one and replaces it last, so a failure leaves the old index as it was.
 */
function rebuild() {
  const file = dbPath();
  const next = file + '.next';
  clear(next);
  const db = create(next);

  const swept = fs.existsSync(file) ? sweptSessions(db, file) : [];
  if (swept.length) {
    try {
      db.exec('CREATE TEMP TABLE swept (id TEXT PRIMARY KEY)');
      const add = db.prepare('INSERT INTO swept (id) VALUES (?)');
      for (const id of swept) add.run(id);

      const columnsOf = (schema: string, table: string) =>
        (db.prepare(`PRAGMA ${schema}.table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
      const carry = (table: string, where: string) => {
        const before = new Set(columnsOf('old', table));
        const columns = columnsOf('main', table).filter((c) => before.has(c)).join(', ');
        if (columns) db.exec(`INSERT INTO main.${table} (${columns}) SELECT ${columns} FROM old.${table} WHERE ${where}`);
      };
      for (const [table, key] of BY_SESSION) carry(table, `${key} IN (SELECT id FROM swept)`);
      carry('run', 'id IN (SELECT run_id FROM main.run_session)');
    } catch (err) {
      db.close();
      clear(next);
      throw new FlowError(
        `could not carry the swept sessions into the new audit index: ${(err as Error).message}\n` +
        `  The old index at ${file} is untouched.`
      );
    }
  }

  db.close();
  clear(file);
  fs.renameSync(next, file);
}

/** Notes the time of a full index run, which `indexedAt` reads back. */
function markIndexed(db) {
  db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('indexed_at', new Date().toISOString());
}

/** The time of the last full index run as a date, or null when none is noted. */
function indexedAt(db) {
  const value = db.prepare('SELECT value FROM meta WHERE key = ?').get('indexed_at')?.value;
  return value ? new Date(value) : null;
}

export { open, rebuild, dbPath, auditDir, projectsDir, markIndexed, indexedAt, SCHEMA };
