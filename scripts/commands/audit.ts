/**
 * `flow audit`: what Claude Code did, read back after the fact.
 *
 * A log, never a fixed report. What counts as a problem is not known before
 * the question is asked, so nothing here ranks or scores: it narrows. The
 * index answers in rows and line numbers, and the line numbers are what open
 * the conversation itself when the rows are not enough.
 *
 * Three tools, in the order they cost:
 *
 *   flow audit summary [id]                 compact metrics, one screen
 *   flow audit timeline <id>                every tool call, in order
 *   flow audit context <id>                 the context size at each request
 *   flow audit, flow audit sql "<sql>"      counts, costs, open queries
 *   flow audit read <id> --turns 412-460    the conversation, bounded
 *   flow audit permissions [id]             the permission asks, counted
 *
 * Narrowing is a query after `--`: `flow audit -- "project:shop since:2026-10-01"`.
 * Its terms are `project:`, `since:` and `until:`, each taking one value.
 *
 * Nothing is recorded by Flow. `~/.claude/projects/<project>/<session>.jsonl`
 * is written by Claude Code whether Flow is installed or not, and every
 * command here only reads it. The index is derived and rebuildable: delete it
 * and `flow audit index` writes it again. `permissions` alone skips the index
 * and reads the log Flow's mod keeps in `~/.flow/logs/permissions/`.
 *
 * A transcript names no machine, so each session is tagged with the one that
 * indexed it, and every answer from the index opens with one coverage line per
 * machine. Copies of another machine's sessions then never pass as the whole.
 *
 * It works with no ticket and outside any project. A run (the piece of work a
 * ticket names) is optional everywhere, which is what makes that true.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as store from '../features/audit/database.ts';
import * as scan from '../features/audit/scan.ts';
import * as query from '../features/audit/query.ts';
import * as reader from '../features/audit/read.ts';
import * as terms from '../shared/query.ts';
import * as permissions from '../features/audit/permissions.ts';
import * as flowRepo from '../features/machine/flow-repo.ts';
import * as paths from '../shared/paths.ts';
import { out, json, jsonMode } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import { FlowError } from '../shared/error.ts';

const actions: Record<string, Action> = {};

const opened = (readonly) => store.open({ readonly });

/** The name `flow install` saved for this machine, or `unnamed` before Flow is set up. */
const thisMachine = () => flowRepo.machineName(paths.folders()) || 'unnamed';

/** How long ago the index was last read, as `12 min ago`. */
const ago = (date) => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
};

/** An answer from the index, opened by the coverage line and the index's age. */
const answer = (db, text) => {
  const covered = query.coverage(db);
  if (!covered) return text;
  const indexed = store.indexedAt(db);
  return `${covered}${indexed ? `\nindex read ${ago(indexed)}` : ''}\n\n${text}`;
};

/**
 * Prints an answer from the index: its text, or under `--json` its rows with
 * the coverage and the index's age. Each side is computed only when printed.
 */
const reply = (db, text, data) => {
  if (!jsonMode()) return out(answer(db, text()));
  const indexed = store.indexedAt(db);
  json({ coverage: query.coverageData(db), indexedAt: indexed ? indexed.toISOString() : null, ...data() });
};

const STALE_MS = 30 * 60 * 1000;

const one = (positional, usage, what) => {
  const [value, ...extra] = positional;
  if (extra.length) throw new FlowError(`${usage} takes one ${what}.`);
  return value;
};

/**
 * The narrowing a query names, as `{ project, since, until }`, each null when
 * absent. Only the fields an action reads are legal, each with one value, and
 * a loose word has nothing to search, so both are refused.
 */
function narrowing(text, fields, usage) {
  const found = { project: null, since: null, until: null };
  for (const term of terms.parse(text, fields, { keepCase: true })) {
    if (!term.field) throw new FlowError(`${usage} searches no words: its terms are ${fields.map((f) => `${f}:`).join(', ')}.`);
    if (term.values.length > 1) throw new FlowError(`${term.field}: takes one value.`);
    found[term.field] = term.values[0];
  }
  return found;
}

const QUERY_ARGS = '[-- "<query>"]';

// ---------------------------------------------------------------- building

/**
 * Walks every transcript and fills the index from what it has not read yet.
 *
 * Cheap to repeat. A transcript only ever grows, so the second run over a
 * 61 MB file reads whatever was appended since the first, and a file nothing
 * appended to is skipped without being opened.
 */
actions.index = {
  args: QUERY_ARGS,
  summary: 'read new transcript lines into the index; "project:shop" reads one project',
  query: true,
  flags: {
    rebuild: { bool: true },
    quiet: { bool: true },
  },
  run({ flags, query: text, usage }) {
    const started = Date.now();
    const result = build({
      project: narrowing(text, ['project'], usage).project,
      rebuild: flags.rebuild,
      onFile: flags.quiet ? null : (entry, added) => {
        if (added.skipped || !added.lines) return;
        out(`  ${query.short(entry.sessionId)}  ${entry.project}  +${added.lines} lines`);
      },
    });

    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    json({ files: result.files, skipped: result.skipped, lines: result.lines, sessions: result.sessions.size, seconds: Number(seconds), index: store.dbPath() });
    out(`${result.files} transcripts read, ${result.skipped} unchanged, ` +
        `${result.lines} new lines, ${result.sessions.size} sessions: ${seconds}s`);
    out(store.dbPath());
    return 0;
  },
};

/**
 * Reads new transcript lines into the index. A run over one project leaves the
 * other projects behind, so only a full run notes its time in `indexed_at`.
 */
function build({ project, rebuild = false, onFile = null }: { project: string | null; rebuild?: boolean; onFile?: ((entry: any, added: any) => void) | null }) {
  if (rebuild) {
    for (const suffix of ['', '-wal', '-shm']) {
      fs.rmSync(store.dbPath() + suffix, { force: true });
    }
  }

  const root = store.projectsDir();
  if (!fs.existsSync(root)) {
    throw new FlowError(
      `no transcripts at ${root}.\n` +
      '  That is where Claude Code keeps them; CLAUDE_CONFIG_DIR moves it.'
    );
  }

  const db = opened(false);
  try {
    const result = scan.indexAll(db, root, { project, machine: thisMachine(), onFile });
    if (!project) store.markIndexed(db);
    return result;
  } finally {
    db.close();
  }
}

/**
 * Opens the index for a read, first refreshing it when the last full run is
 * over 30 minutes old. A refresh that fails (another session is writing) leaves
 * the index as it was. A missing index stays missing: its first build reads
 * every transcript, so it is a command of its own.
 */
function reading() {
  if (fs.existsSync(store.dbPath())) {
    let indexed: Date | null = null;
    try {
      const db = opened(true);
      indexed = store.indexedAt(db);
      db.close();
    } catch { /* an older schema: the refresh below rebuilds it */ }
    if (!indexed || Date.now() - indexed.getTime() > STALE_MS) {
      try { build({ project: null }); } catch { /* read what is there */ }
    }
  }
  return opened(true);
}

// ---------------------------------------------------------------- reading

/** `flow audit`, typed alone or with a query. */
const listing = {
  args: QUERY_ARGS,
  summary: 'every session indexed, newest first; "project:shop since:2026-10-01" narrows it',
  query: true,
  flags: { limit: { arg: '<n>' } },
  run({ flags, query: text, usage }) {
    const { project, since } = narrowing(text, ['project', 'since'], usage);
    const db = reading();
    const options = { project, since, limit: Number(flags.limit || 30) };
    reply(db, () => query.sessions(db, options), () => query.sessionsData(db, options));
    return 0;
  },
};

actions.get = {
  args: '<id>',
  summary: 'one session in full, segments, tools, files, heaviest turns',
  run({ positional, usage }) {
    const db = reading();
    const id = one(positional, usage, 'session id');
    reply(db, () => query.session(db, id), () => query.sessionData(db, id));
    return 0;
  },
};

/**
 * The turn list, and the LINES column is why it exists: it is what `read`
 * takes. Reaching turn 412 by any other route means parsing the whole file.
 */
actions.turns = {
  args: '<id>',
  summary: 'the turns of one session, with the line range of each',
  flags: { from: { arg: '<turn>' }, limit: { arg: '<n>' } },
  run({ positional, flags, usage }) {
    const db = reading();
    const id = one(positional, usage, 'session id');
    const options = { from: flags.from ? Number(flags.from) : null, limit: Number(flags.limit || 60) };
    reply(db, () => query.turns(db, id, options), () => query.turnsData(db, id, options));
    return 0;
  },
};

actions.read = {
  args: '<id>',
  summary: 'the conversation itself, for a range of turns',
  flags: {
    turns: { arg: '<from-to>', required: true, missing: '--turns is required: reading a whole session never fits.' },
    full: { bool: true },
    thinking: { bool: true },
  },
  run({ positional, flags, usage }) {
    const db = reading();
    const id = one(positional, usage, 'session id');
    const options = { range: flags.turns, full: flags.full, thinking: flags.thinking };
    reply(db, () => reader.read(db, id, options), () => reader.readData(db, id, options));
    return 0;
  },
};

actions.summary = {
  args: `[id] ${QUERY_ARGS}`,
  summary: 'compact metrics for one session, or an aggregate across many',
  query: 'beside',
  run({ positional, query: text, usage }) {
    const { project, since } = narrowing(text, ['project', 'since'], usage);
    const db = reading();
    const options = { session: one(positional, usage, 'session id') || null, project, since };
    reply(db, () => query.summary(db, options), () => query.summaryData(db, options));
    return 0;
  },
};

actions.timeline = {
  args: '<id>',
  summary: 'every tool call in one session, in order',
  flags: { limit: { arg: '<n>' } },
  run({ positional, usage, flags }) {
    const db = reading();
    const id = one(positional, usage, 'session id');
    const options = { limit: Number(flags.limit || 500) };
    reply(db, () => query.timeline(db, id, options), () => query.timelineData(db, id, options));
    return 0;
  },
};

actions.context = {
  args: '<id>',
  summary: 'the context size at each request, marking the first edit',
  flags: { limit: { arg: '<n>' } },
  run({ positional, usage, flags }) {
    const db = reading();
    const id = one(positional, usage, 'session id');
    const options = { limit: Number(flags.limit || 200) };
    reply(db, () => query.context(db, id, options), () => query.contextData(db, id, options));
    return 0;
  },
};

actions.permissions = {
  args: `[id] ${QUERY_ARGS}`,
  summary: 'the permission asks, counted by source and headline',
  query: 'beside',
  flags: { limit: { arg: '<n>' } },
  run({ positional, flags, query: text, usage }) {
    const options = {
      id: one(positional, usage, 'session id') || null,
      ...narrowing(text, ['project', 'since', 'until'], usage),
    };
    if (jsonMode()) json(permissions.viewData(options));
    else out(permissions.view({ ...options, limit: Number(flags.limit || 20) }));
    return 0;
  },
};

actions.sql = {
  args: '"<sql>"',
  summary: 'any question the named ones do not cover',
  run({ positional, usage }) {
    const [sql, ...extra] = positional;
    if (!sql) throw new FlowError(`${usage} needs the SQL, quoted: ${usage} "SELECT count(*) FROM session".`);
    if (extra.length) throw new FlowError(`quote the SQL: ${usage} "${positional.join(' ')}"`);
    const db = reading();
    reply(db, () => query.sql(db, sql), () => query.sqlData(db, sql));
    return 0;
  },
};

actions.schema = {
  summary: 'the tables and their columns, for writing a query',
  run() {
    const db = reading();
    json(query.schemaData(db));
    out(query.schema(db));
    return 0;
  },
};

// ---------------------------------------------------------------- keeping

/**
 * Copies one transcript into the archive, compressed.
 *
 * Nothing is copied in bulk, and that is a decision rather than an omission.
 * The transcripts are 241 MB on this machine and grow monthly, gzip only cuts
 * them to a third, and the index already survives the sweep with every derived
 * fact in it. What a bulk copy buys is asking a *new* question of old chat
 * text: worth it for the few sessions a study case rests on, and for nothing
 * else. This is that escape hatch.
 */
actions.keep = {
  args: '<id>',
  summary: 'archive one transcript before Claude Code sweeps it',
  run({ positional, usage }) {
    const db = reading();
    const session = query.findSession(db, one(positional, usage, 'session id'));
    const rows = db.prepare('SELECT path FROM transcript WHERE session_id = ?').all(session.id) as { path: string }[];
    if (!rows.length) throw new FlowError(`no transcript on disk for ${query.short(session.id)}.`);

    const dir = path.join(store.auditDir(), 'kept');
    fs.mkdirSync(dir, { recursive: true });
    const kept: { path: string; bytes: number }[] = [];
    const gone: string[] = [];

    for (const row of rows) {
      if (!fs.existsSync(row.path)) {
        gone.push(row.path);
        out(`  gone: ${row.path}`);
        continue;
      }
      const target = path.join(dir, path.basename(row.path) + '.gz');
      fs.writeFileSync(target, zlib.gzipSync(fs.readFileSync(row.path)));
      const size = fs.statSync(target).size;
      kept.push({ path: target, bytes: size });
      out(`  ${target}  ${query.bytes(size)}`);
    }
    json({ kept, gone });
    return 0;
  },
};

actions.where = {
  summary: 'the two paths this reads and writes',
  run() {
    json({ transcripts: store.projectsDir(), index: store.dbPath() });
    out(`transcripts  ${store.projectsDir()}`);
    out(`index        ${store.dbPath()}`);
    return 0;
  },
};

export default {
  summary: 'what Claude Code did, read back after the fact',
  list: listing,
  actions,
};
