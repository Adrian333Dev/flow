'use strict';
/**
 * The named queries: the shapes asked for often enough to have a name.
 *
 * Every one of them narrows. A session holds tens of thousands of events and
 * no answer is found by loading them into context — the whole point of the
 * index is that a question returns 40 rows and a line range, and the line
 * range is what `flow audit read` opens.
 *
 * `flow audit sql` sits underneath all of it for everything unnamed. These are
 * a starting set, not a fixed report.
 */

const { table } = require('../render');
const { FlowError } = require('../error');

// ---------------------------------------------------------------- units

const num = (n) => {
  const v = Number(n || 0);
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'G';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'k';
  return String(v);
};

const bytes = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' MB';
  if (v >= 1e3) return Math.round(v / 1e3) + ' kB';
  return v + ' B';
};

const ms = (n) => {
  if (!n) return '-';
  const s = Math.round(Number(n) / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`;
};

const money = (n) => (n == null ? '-' : '$' + Number(n).toFixed(2));
const day = (t) => (t ? String(t).slice(0, 10) : '-');
const clock = (t) => (t ? String(t).slice(11, 16) : '-');
const short = (id) => String(id || '').slice(0, 8);
const trim = (s, n) => (s == null ? '' : String(s).replace(/\s+/g, ' ').trim().slice(0, n));

// The project folder name is the working directory with its separators
// flattened, so it reads better with the leading path thrown away.
const projectName = (p) => String(p || '').replace(/^-+/, '').split('-').pop() || String(p || '');

// ---------------------------------------------------------------- lookup

/**
 * Resolves a session by a prefix of its id, the way git resolves a commit.
 * A prefix matching two sessions refuses rather than picking one.
 */
function findSession(db, id) {
  if (!id) throw new FlowError('name a session — flow audit sessions lists them.');
  const rows = db.prepare('SELECT * FROM session WHERE id LIKE ? ORDER BY id').all(id + '%');
  if (rows.length === 1) return rows[0];
  if (rows.length === 0) {
    throw new FlowError(
      `no session starting "${id}".\n` +
      '  flow audit sessions lists what is indexed; flow audit index adds what is new.'
    );
  }
  throw new FlowError(
    `"${id}" matches ${rows.length} sessions: ${rows.map((r) => short(r.id)).join(', ')}.`
  );
}

// ---------------------------------------------------------------- listings

function sessions(db, { project = null, limit = 30, since = null } = {}) {
  const where = [];
  const args = [];
  if (project) { where.push('project LIKE ?'); args.push('%' + project + '%'); }
  if (since) { where.push('ended_at >= ?'); args.push(since); }
  const rows = db.prepare(`SELECT * FROM session
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY COALESCE(ended_at, started_at) DESC LIMIT ?`).all(...args, limit);

  if (!rows.length) return 'no sessions indexed. Run flow audit index.';

  return table(
    ['SESSION', 'PROJECT', 'FROM', 'TO', 'SEG', 'TURNS', 'TOOLS', 'ERR', 'OUT', 'CACHE', 'COST'],
    rows.map((r) => [
      short(r.id), projectName(r.project), day(r.started_at), day(r.ended_at),
      r.segments, r.turns, r.tool_calls, r.errors || 0,
      num(r.output_tokens), num(r.cache_read), money(r.cost_usd),
    ])
  );
}

/**
 * One session in full. Five listings rather than one: what it cost, how the
 * context broke, which tools ran, which files moved, and where the expensive
 * turns are. The last is the one that usually decides where to read.
 */
function session(db, id) {
  const s = findSession(db, id);
  const out = [];

  out.push(`${s.id}`);
  out.push(`  project     ${projectName(s.project)}   ${s.cwd || ''}`);
  out.push(`  branch      ${s.git_branch || '-'}   Claude Code ${s.version || '-'}`);
  out.push(`  ran         ${day(s.started_at)} ${clock(s.started_at)} → ${day(s.ended_at)} ${clock(s.ended_at)}`);
  out.push(`  size        ${s.events} events · ${s.segments} segments · ${s.turns} turns · ${s.tool_calls} tool calls · ${s.errors} errors`);
  out.push(`  spend       ${money(s.cost_usd)} · out ${num(s.output_tokens)} · cache read ${num(s.cache_read)} · cache write ${num(s.cache_write)}`);

  const segs = db.prepare('SELECT * FROM segment WHERE session_id = ? ORDER BY ordinal').all(s.id);
  out.push('', 'SEGMENTS — one unbroken context window each');
  out.push(table(
    ['#', 'LINES', 'TURNS', 'ENDED', 'TRIGGER', 'BEFORE', 'AFTER', 'DROPPED'],
    segs.map((g) => [
      g.ordinal, `${g.first_line}-${g.last_line}`, g.turns, g.ended_by || '-',
      g.trigger || '-', num(g.pre_tokens), num(g.post_tokens), num(g.dropped_tokens),
    ])
  ));

  const tools = db.prepare(`SELECT name, COUNT(*) n, SUM(is_error) err, SUM(result_bytes) b
    FROM tool_call WHERE session_id = ? GROUP BY name ORDER BY n DESC LIMIT 12`).all(s.id);
  out.push('', 'TOOLS');
  out.push(table(['TOOL', 'CALLS', 'ERRORS', 'RETURNED'],
    tools.map((t) => [t.name, t.n, t.err || 0, bytes(t.b)])));

  const files = db.prepare(`SELECT path, COUNT(*) n, SUM(kind = 'read') reads,
    SUM(kind IN ('edit','write')) writes FROM file_touch WHERE session_id = ?
    GROUP BY path ORDER BY n DESC LIMIT 12`).all(s.id);
  out.push('', 'FILES — every route into context, exact and parsed alike');
  out.push(table(['TOUCHES', 'READS', 'WRITES', 'PATH'],
    files.map((f) => [f.n, f.reads, f.writes, f.path])));

  const costly = db.prepare(`SELECT ordinal, segment_id, first_line, last_line, output_tokens,
    cache_read, tool_calls, prompt FROM turn WHERE session_id = ?
    ORDER BY cache_read DESC LIMIT 8`).all(s.id);
  out.push('', 'HEAVIEST TURNS — by context read, which is what a turn actually costs');
  out.push(table(['TURN', 'LINES', 'TOOLS', 'OUT', 'CACHE', 'PROMPT'],
    costly.map((t) => [
      t.ordinal, `${t.first_line}-${t.last_line}`, t.tool_calls,
      num(t.output_tokens), num(t.cache_read), trim(t.prompt, 60),
    ])));

  out.push('', `read one: flow audit read ${short(s.id)} --turns ${costly.length ? costly[0].ordinal : 1}`);
  return out.join('\n');
}

/**
 * The turn list. LINES is the column that matters — it is what `flow audit
 * read` takes, and it is why the index stores a line number per event.
 */
function turns(db, id, { limit = 60, from = null } = {}) {
  const s = findSession(db, id);
  const rows = db.prepare(`SELECT t.*, g.ordinal seg FROM turn t
    LEFT JOIN segment g ON g.id = t.segment_id
    WHERE t.session_id = ? AND t.ordinal >= ? ORDER BY t.ordinal LIMIT ?`)
    .all(s.id, from || 0, limit);

  if (!rows.length) return `${short(s.id)} has no turns in that range.`;

  return table(
    ['TURN', 'SEG', 'LINES', 'AT', 'TOOK', 'TOOLS', 'ERR', 'OUT', 'CACHE', 'SOURCE', 'PROMPT'],
    rows.map((t) => [
      t.ordinal, t.seg ?? '-', `${t.first_line}-${t.last_line}`, clock(t.started_at),
      ms(t.duration_ms), t.tool_calls, t.errors || 0, num(t.output_tokens),
      num(t.cache_read), t.source || '-', trim(t.prompt, 60),
    ])
  );
}

// ---------------------------------------------------------------- summary + timeline

function summary(db, { session: id = null, project = null, since = null } = {}) {
  if (id) {
    const s = findSession(db, id);
    const toolRows = db.prepare(`SELECT name, COUNT(*) n, SUM(is_error) err
      FROM tool_call WHERE session_id = ? GROUP BY name ORDER BY n DESC`).all(s.id);
    const fileCount = db.prepare(`SELECT COUNT(DISTINCT path) n FROM file_touch WHERE session_id = ?`).get(s.id);

    const lines = [
      `${short(s.id)}  ${projectName(s.project)}  ${day(s.started_at)} ${clock(s.started_at)} → ${day(s.ended_at)} ${clock(s.ended_at)}`,
      `${s.turns} turns · ${s.segments} segments · ${s.tool_calls} tools · ${s.errors} errors · ${fileCount.n} files · ${money(s.cost_usd)}`,
      `out ${num(s.output_tokens)} · cache read ${num(s.cache_read)} · cache write ${num(s.cache_write)}`,
    ];
    if (toolRows.length) {
      lines.push('');
      lines.push(toolRows.map((t) => `${t.name} ${t.n}${t.err ? ` (${t.err} err)` : ''}`).join('  '));
    }
    return lines.join('\n');
  }

  const where = [];
  const args = [];
  if (project) { where.push('project LIKE ?'); args.push('%' + project + '%'); }
  if (since) { where.push('ended_at >= ?'); args.push(since); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(`SELECT * FROM session ${clause}
    ORDER BY COALESCE(ended_at, started_at) DESC`).all(...args);
  if (!rows.length) return 'no sessions matched.';

  const totals = { turns: 0, tools: 0, errors: 0, cost: 0, output: 0, cache: 0 };
  for (const r of rows) {
    totals.turns += r.turns || 0;
    totals.tools += r.tool_calls || 0;
    totals.errors += r.errors || 0;
    totals.cost += r.cost_usd || 0;
    totals.output += r.output_tokens || 0;
    totals.cache += r.cache_read || 0;
  }

  const toolRows = db.prepare(`SELECT name, COUNT(*) n, SUM(is_error) err
    FROM tool_call WHERE session_id IN (SELECT id FROM session ${clause})
    GROUP BY name ORDER BY n DESC`).all(...args);

  const lines = [
    `${rows.length} sessions · ${totals.turns} turns · ${totals.tools} tools · ${totals.errors} errors · ${money(totals.cost)}`,
    `out ${num(totals.output)} · cache read ${num(totals.cache)}`,
  ];
  if (toolRows.length) {
    lines.push('');
    lines.push(toolRows.map((t) => `${t.name} ${t.n}${t.err ? ` (${t.err} err)` : ''}`).join('  '));
  }
  return lines.join('\n');
}

function timeline(db, id, { limit = 500 } = {}) {
  const s = findSession(db, id);
  const rows = db.prepare(`SELECT c.*, t.ordinal turn FROM tool_call c
    LEFT JOIN turn t ON t.id = c.turn_id
    WHERE c.session_id = ? ORDER BY c.id LIMIT ?`).all(s.id, limit);

  if (!rows.length) return `${short(s.id)} has no tool calls.`;

  const total = db.prepare('SELECT COUNT(*) n FROM tool_call WHERE session_id = ?').get(s.id).n;
  const out = [table(
    ['TURN', 'TOOL', 'OK', 'CALL'],
    rows.map((c) => [
      c.turn ?? '-', c.name,
      c.is_error ? 'ERR' : 'ok',
      trim(c.summary, 120),
    ])
  )];
  if (total > rows.length) out.push(`\n${rows.length} of ${total} shown. --limit ${total} for all.`);
  return out.join('');
}

// ---------------------------------------------------------------- open sql

// A query that writes would corrupt an index nothing re-derives on demand, and
// the whole surface is a reader. PRAGMA is refused with the rest: it can turn
// writing back on.
const READ_ONLY = /^\s*(select|with)\b/i;
const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|replace|attach|detach|pragma|vacuum)\b/i;

function sql(db, text) {
  if (!text) throw new FlowError('flow audit sql needs a query, in quotes.');
  if (!READ_ONLY.test(text) || FORBIDDEN.test(text)) {
    throw new FlowError(
      'flow audit sql runs SELECT and WITH only.\n' +
      '  The index is derived — rebuild it with flow audit index rather than editing it.'
    );
  }

  const rows = db.prepare(text).all();
  if (!rows.length) return 'no rows.';
  const headers = Object.keys(rows[0]);
  return table(
    headers.map((h) => h.toUpperCase()),
    rows.map((r) => headers.map((h) => (r[h] == null ? '-' : String(r[h]))))
  );
}

/** The tables and their columns, so a query can be written without this file. */
function schema(db) {
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();
  const out = [];
  for (const t of tables) {
    const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
    out.push(`${t.name}(${cols.map((c) => c.name).join(', ')})`);
  }
  return out.join('\n');
}

module.exports = {
  sessions, session, turns, summary, timeline, sql, schema, findSession,
  num, bytes, ms, money, short, trim,
};
