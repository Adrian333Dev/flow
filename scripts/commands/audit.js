'use strict';
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
 *   flow audit ls|sql                       counts, costs, open queries
 *   flow audit read <id> --turns 412-460    the conversation, bounded
 *   flow audit permissions [id]             the permission asks, counted
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

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const store = require('../lib/audit/database');
const scan = require('../lib/audit/scan');
const query = require('../lib/audit/query');
const reader = require('../lib/audit/read');
const permissions = require('../lib/audit/permissions');
const flowRepo = require('../lib/machine/flow-repo');
const paths = require('../lib/paths');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');

const actions = {};

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

const STALE_MS = 30 * 60 * 1000;

const one = (positional, usage, what) => {
  const [value, ...extra] = positional;
  if (extra.length) throw new FlowError(`${usage} takes one ${what}.`);
  return value;
};

// ---------------------------------------------------------------- building

/**
 * Walks every transcript and fills the index from what it has not read yet.
 *
 * Cheap to repeat. A transcript only ever grows, so the second run over a
 * 61 MB file reads whatever was appended since the first, and a file nothing
 * appended to is skipped without being opened.
 */
actions.index = {
  summary: 'read new transcript lines into the index',
  flags: {
    project: { arg: '<name>' },
    rebuild: { bool: true },
    quiet: { bool: true },
  },
  run({ flags }) {
    const started = Date.now();
    const result = build({
      project: flags.project || null,
      rebuild: flags.rebuild,
      onFile: flags.quiet ? null : (entry, added) => {
        if (added.skipped || !added.lines) return;
        out(`  ${query.short(entry.sessionId)}  ${entry.project}  +${added.lines} lines`);
      },
    });

    const seconds = ((Date.now() - started) / 1000).toFixed(1);
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
function build({ project, rebuild = false, onFile = null }) {
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
    let indexed = null;
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

actions.ls = {
  summary: 'every session indexed, newest first',
  flags: {
    project: { arg: '<name>' },
    since: { arg: '<date>' },
    limit: { arg: '<n>' },
  },
  run({ positional, flags, usage }) {
    // The group's default, so an id typed the old way lands here and would list everything.
    if (positional.length) throw new FlowError(`${usage} takes no session id: \`flow audit get ${positional[0]}\` shows one.`);
    const db = reading();
    out(answer(db, query.sessions(db, {
      project: flags.project || null,
      since: flags.since || null,
      limit: Number(flags.limit || 30),
    })));
    return 0;
  },
};

actions.get = {
  args: '<id>',
  summary: 'one session in full, segments, tools, files, heaviest turns',
  run({ positional, usage }) {
    const db = reading();
    out(answer(db, query.session(db, one(positional, usage, 'session id'))));
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
    out(answer(db, query.turns(db, one(positional, usage, 'session id'), {
      from: flags.from ? Number(flags.from) : null,
      limit: Number(flags.limit || 60),
    })));
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
    out(answer(db, reader.read(db, one(positional, usage, 'session id'), {
      range: flags.turns,
      full: flags.full,
      thinking: flags.thinking,
    })));
    return 0;
  },
};

actions.summary = {
  args: '[id]',
  summary: 'compact metrics for one session, or an aggregate across many',
  flags: {
    project: { arg: '<name>' },
    since: { arg: '<date>' },
  },
  run({ positional, flags }) {
    const [id] = positional;
    const db = reading();
    out(answer(db, query.summary(db, {
      session: id || null,
      project: flags.project || null,
      since: flags.since || null,
    })));
    return 0;
  },
};

actions.timeline = {
  args: '<id>',
  summary: 'every tool call in one session, in order',
  flags: { limit: { arg: '<n>' } },
  run({ positional, usage, flags }) {
    const db = reading();
    out(answer(db, query.timeline(db, one(positional, usage, 'session id'), {
      limit: Number(flags.limit || 500),
    })));
    return 0;
  },
};

actions.context = {
  args: '<id>',
  summary: 'the context size at each request, marking the first edit',
  flags: { limit: { arg: '<n>' } },
  run({ positional, usage, flags }) {
    const db = reading();
    out(answer(db, query.context(db, one(positional, usage, 'session id'), {
      limit: Number(flags.limit || 200),
    })));
    return 0;
  },
};

actions.permissions = {
  args: '[id]',
  summary: 'the permission asks, counted by source and headline',
  flags: {
    project: { arg: '<name>' },
    since: { arg: '<date>' },
    until: { arg: '<date>' },
    limit: { arg: '<n>' },
  },
  run({ positional, flags, usage }) {
    out(permissions.view({
      id: one(positional, usage, 'session id') || null,
      project: flags.project || null,
      since: flags.since || null,
      until: flags.until || null,
      limit: Number(flags.limit || 20),
    }));
    return 0;
  },
};

actions.sql = {
  args: '<query>',
  summary: 'any question the named ones do not cover',
  run({ positional, usage }) {
    const db = reading();
    out(answer(db, query.sql(db, one(positional, usage, 'query: quote it'))));
    return 0;
  },
};

actions.schema = {
  summary: 'the tables and their columns, for writing a query',
  run() {
    out(query.schema(reading()));
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
    const rows = db.prepare('SELECT path FROM transcript WHERE session_id = ?').all(session.id);
    if (!rows.length) throw new FlowError(`no transcript on disk for ${query.short(session.id)}.`);

    const dir = path.join(store.auditDir(), 'kept');
    fs.mkdirSync(dir, { recursive: true });

    for (const row of rows) {
      if (!fs.existsSync(row.path)) {
        out(`  gone: ${row.path}`);
        continue;
      }
      const target = path.join(dir, path.basename(row.path) + '.gz');
      fs.writeFileSync(target, zlib.gzipSync(fs.readFileSync(row.path)));
      const size = fs.statSync(target).size;
      out(`  ${target}  ${query.bytes(size)}`);
    }
    return 0;
  },
};

actions.where = {
  summary: 'the two paths this reads and writes',
  run() {
    out(`transcripts  ${store.projectsDir()}`);
    out(`index        ${store.dbPath()}`);
    return 0;
  },
};

module.exports = {
  summary: 'what Claude Code did, read back after the fact',
  default: 'ls',
  actions,
};
