'use strict';
/**
 * `flow audit` — what Claude Code did, read back after the fact.
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
 *   flow audit sessions|sql                 counts, costs, open queries
 *   flow audit read <id> --turns 412-460    the conversation, bounded
 *
 * Nothing is recorded by Flow. `~/.claude/projects/<project>/<session>.jsonl`
 * is written by Claude Code whether Flow is installed or not, and every
 * command here only reads it. The index is derived and rebuildable: delete it
 * and `flow audit index` writes it again.
 *
 * It works with no ticket and outside any project. A run — the piece of work a
 * ticket names — is optional everywhere, which is what makes that true.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const store = require('../lib/audit/store');
const scan = require('../lib/audit/scan');
const query = require('../lib/audit/query');
const reader = require('../lib/audit/read');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');

const actions = {};

const opened = (readonly) => store.open({ readonly });

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
    if (flags.rebuild) {
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

    const started = Date.now();
    const db = opened(false);
    const result = scan.indexAll(db, root, {
      project: flags.project || null,
      onFile: flags.quiet ? null : (entry, added) => {
        if (added.skipped || !added.lines) return;
        out(`  ${query.short(entry.sessionId)}  ${entry.project}  +${added.lines} lines`);
      },
    });

    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    out(`${result.files} transcripts read, ${result.skipped} unchanged, ` +
        `${result.lines} new lines, ${result.sessions.size} sessions — ${seconds}s`);
    out(store.dbPath());
    return 0;
  },
};

// ---------------------------------------------------------------- reading

actions.sessions = {
  summary: 'every session indexed, newest first',
  flags: {
    project: { arg: '<name>' },
    since: { arg: '<date>' },
    limit: { arg: '<n>' },
  },
  run({ flags }) {
    out(query.sessions(opened(true), {
      project: flags.project || null,
      since: flags.since || null,
      limit: Number(flags.limit || 30),
    }));
    return 0;
  },
};

actions.session = {
  args: '<id>',
  summary: 'one session in full — segments, tools, files, heaviest turns',
  run({ positional, usage }) {
    out(query.session(opened(true), one(positional, usage, 'session id')));
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
    out(query.turns(opened(true), one(positional, usage, 'session id'), {
      from: flags.from ? Number(flags.from) : null,
      limit: Number(flags.limit || 60),
    }));
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
    out(reader.read(opened(true), one(positional, usage, 'session id'), {
      range: flags.turns,
      full: flags.full,
      thinking: flags.thinking,
    }));
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
    out(query.summary(opened(true), {
      session: id || null,
      project: flags.project || null,
      since: flags.since || null,
    }));
    return 0;
  },
};

actions.timeline = {
  args: '<id>',
  summary: 'every tool call in one session, in order',
  flags: { limit: { arg: '<n>' } },
  run({ positional, usage, flags }) {
    out(query.timeline(opened(true), one(positional, usage, 'session id'), {
      limit: Number(flags.limit || 500),
    }));
    return 0;
  },
};

actions.sql = {
  args: '<query>',
  summary: 'any question the named ones do not cover',
  run({ positional, usage }) {
    out(query.sql(opened(true), one(positional, usage, 'query — quote it')));
    return 0;
  },
};

actions.schema = {
  summary: 'the tables and their columns, for writing a query',
  run() {
    out(query.schema(opened(true)));
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
 * text — worth it for the few sessions a study case rests on, and for nothing
 * else. This is that escape hatch.
 */
actions.keep = {
  args: '<id>',
  summary: 'archive one transcript before Claude Code sweeps it',
  run({ positional, usage }) {
    const db = opened(true);
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
  default: 'session',
  actions,
};
