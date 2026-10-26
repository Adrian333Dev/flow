'use strict';
/**
 * The named queries: the shapes asked for often enough to have a name.
 *
 * Every one of them narrows. A session holds tens of thousands of events and
 * no answer is found by loading them into context: the whole point of the
 * index is that a question returns 40 rows and a line range, and the line
 * range is what `flow audit read` opens.
 *
 * `flow audit sql` sits underneath all of it for everything unnamed. These are
 * a starting set, not a fixed report.
 *
 * Each view is 2 functions: `<view>Data` returns the index's own rows, the
 * columns named as `flow audit schema` lists them, which `--json` prints; the
 * view itself draws its text from them.
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

/**
 * The project folder name is the working directory with its separators
 * flattened, so it reads better with the leading path thrown away.
 */
const projectName = (p) => String(p || '').replace(/^-+/, '').split('-').pop() || String(p || '');

// ---------------------------------------------------------------- lookup

/**
 * Resolves a session by a prefix of its id, the way git resolves a commit.
 * A prefix matching two sessions refuses rather than picking one.
 */
function findSession(db, id) {
  if (!id) throw new FlowError('name a session, listed by flow audit.');
  const rows = db.prepare('SELECT * FROM session WHERE id LIKE ? ORDER BY id').all(id + '%');
  if (rows.length === 1) return rows[0];
  if (rows.length === 0) {
    throw new FlowError(
      `no session starting "${id}".\n` +
      '  flow audit lists what is indexed, and flow audit index adds what is new.'
    );
  }
  throw new FlowError(
    `"${id}" matches ${rows.length} sessions: ${rows.map((r) => short(r.id)).join(', ')}.`
  );
}

// ---------------------------------------------------------------- coverage

/**
 * One line per machine: the sessions the index holds from it, and its newest
 * day. It opens every answer, so a split between machines never misleads a
 * reader. Empty where nothing is indexed.
 */
function coverageData(db) {
  return db.prepare(`SELECT COALESCE(machine, 'unnamed') machine, COUNT(*) sessions,
    MAX(COALESCE(ended_at, started_at)) newest FROM session
    GROUP BY 1 ORDER BY newest DESC`).all();
}

function coverage(db) {
  return coverageData(db)
    .map((r) => `${r.machine}: ${r.sessions} ${r.sessions === 1 ? 'session' : 'sessions'}, newest ${day(r.newest)}`)
    .join('\n');
}

// ---------------------------------------------------------------- listings

function sessionsData(db, { project = null, limit = 30, since = null } = {}) {
  const where = [];
  const args = [];
  if (project) { where.push('project LIKE ?'); args.push('%' + project + '%'); }
  if (since) { where.push('ended_at >= ?'); args.push(since); }
  return {
    sessions: db.prepare(`SELECT * FROM session
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY COALESCE(ended_at, started_at) DESC LIMIT ?`).all(...args, limit),
  };
}

function sessions(db, options) {
  const rows = sessionsData(db, options).sessions;
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
function sessionData(db, id) {
  const s = findSession(db, id);
  return {
    session: s,
    segments: db.prepare('SELECT * FROM segment WHERE session_id = ? ORDER BY ordinal').all(s.id),
    tools: db.prepare(`SELECT name, COUNT(*) calls, SUM(is_error) errors, SUM(result_bytes) result_bytes
      FROM tool_call WHERE session_id = ? GROUP BY name ORDER BY calls DESC LIMIT 12`).all(s.id),
    files: db.prepare(`SELECT path, COUNT(*) touches, SUM(type = 'read') reads,
      SUM(type IN ('edit','write')) writes FROM file_touch WHERE session_id = ?
      GROUP BY path ORDER BY touches DESC LIMIT 12`).all(s.id),
    heaviest_turns: db.prepare(`SELECT ordinal, segment_id, first_line, last_line, output_tokens,
      cache_read, tool_calls, prompt FROM turn WHERE session_id = ?
      ORDER BY cache_read DESC LIMIT 8`).all(s.id),
  };
}

function session(db, id) {
  const { session: s, segments: segs, tools, files, heaviest_turns: costly } = sessionData(db, id);
  const out = [];

  out.push(`${s.id}`);
  out.push(`  project     ${projectName(s.project)}   ${s.cwd || ''}`);
  out.push(`  branch      ${s.git_branch || '-'}   Claude Code ${s.version || '-'}`);
  out.push(`  ran         ${day(s.started_at)} ${clock(s.started_at)} → ${day(s.ended_at)} ${clock(s.ended_at)}`);
  out.push(`  size        ${s.events} events · ${s.segments} segments · ${s.turns} turns · ${s.tool_calls} tool calls · ${s.errors} errors`);
  out.push(`  spend       ${money(s.cost_usd)} · out ${num(s.output_tokens)} · cache read ${num(s.cache_read)} · cache write ${num(s.cache_write)}`);

  out.push('', 'SEGMENTS: one unbroken context window each');
  out.push(table(
    ['#', 'LINES', 'TURNS', 'ENDED', 'TRIGGER', 'BEFORE', 'AFTER', 'DROPPED'],
    segs.map((g) => [
      g.ordinal, `${g.first_line}-${g.last_line}`, g.turns, g.ended_by || '-',
      g.trigger || '-', num(g.pre_tokens), num(g.post_tokens), num(g.dropped_tokens),
    ])
  ));

  out.push('', 'TOOLS');
  out.push(table(['TOOL', 'CALLS', 'ERRORS', 'RETURNED'],
    tools.map((t) => [t.name, t.calls, t.errors || 0, bytes(t.result_bytes)])));

  out.push('', 'FILES: every route into context, exact and parsed alike');
  out.push(table(['TOUCHES', 'READS', 'WRITES', 'PATH'],
    files.map((f) => [f.touches, f.reads, f.writes, f.path])));

  out.push('', 'HEAVIEST TURNS: by context read, which is what a turn actually costs');
  out.push(table(['TURN', 'LINES', 'TOOLS', 'OUT', 'CACHE', 'PROMPT'],
    costly.map((t) => [
      t.ordinal, `${t.first_line}-${t.last_line}`, t.tool_calls,
      num(t.output_tokens), num(t.cache_read), trim(t.prompt, 60),
    ])));

  out.push('', `read one: flow audit read ${short(s.id)} --turns ${costly.length ? costly[0].ordinal : 1}`);
  return out.join('\n');
}

/**
 * The turn list. LINES is the column that matters: it is what `flow audit
 * read` takes, and it is why the index stores a line number per event.
 */
function turnsData(db, id, { limit = 60, from = null } = {}) {
  const s = findSession(db, id);
  return {
    session: s.id,
    turns: db.prepare(`SELECT t.*, g.ordinal seg FROM turn t
      LEFT JOIN segment g ON g.id = t.segment_id
      WHERE t.session_id = ? AND t.ordinal >= ? ORDER BY t.ordinal LIMIT ?`)
      .all(s.id, from || 0, limit),
  };
}

function turns(db, id, options) {
  const { session: sid, turns: rows } = turnsData(db, id, options);
  if (!rows.length) return `${short(sid)} has no turns in that range.`;

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

/**
 * One session's metrics, or the sum across the sessions a query names. The
 * session's own row, or `sessions` counted with the summed columns, plus the
 * tools called.
 */
function summaryData(db, { session: id = null, project = null, since = null } = {}) {
  const toolsOf = (clause, ...args) => db.prepare(`SELECT name, COUNT(*) calls, SUM(is_error) errors
    FROM tool_call WHERE session_id ${clause} GROUP BY name ORDER BY calls DESC`).all(...args);

  if (id) {
    const s = findSession(db, id);
    const files = db.prepare('SELECT COUNT(DISTINCT path) n FROM file_touch WHERE session_id = ?').get(s.id).n;
    return { session: s, files, tools: toolsOf('= ?', s.id) };
  }

  const where = [];
  const args = [];
  if (project) { where.push('project LIKE ?'); args.push('%' + project + '%'); }
  if (since) { where.push('ended_at >= ?'); args.push(since); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const totals = db.prepare(`SELECT COUNT(*) sessions, TOTAL(turns) turns, TOTAL(tool_calls) tool_calls,
    TOTAL(errors) errors, TOTAL(cost_usd) cost_usd, TOTAL(output_tokens) output_tokens,
    TOTAL(cache_read) cache_read FROM session ${clause}`).get(...args);
  return { totals, tools: totals.sessions ? toolsOf(`IN (SELECT id FROM session ${clause})`, ...args) : [] };
}

function summary(db, options = {}) {
  const data = summaryData(db, options);
  const toolLine = () => data.tools.map((t) => `${t.name} ${t.calls}${t.errors ? ` (${t.errors} err)` : ''}`).join('  ');

  if (data.session) {
    const s = data.session;
    const lines = [
      `${short(s.id)}  ${projectName(s.project)}  ${day(s.started_at)} ${clock(s.started_at)} → ${day(s.ended_at)} ${clock(s.ended_at)}`,
      `${s.turns} turns · ${s.segments} segments · ${s.tool_calls} tools · ${s.errors} errors · ${data.files} files · ${money(s.cost_usd)}`,
      `out ${num(s.output_tokens)} · cache read ${num(s.cache_read)} · cache write ${num(s.cache_write)}`,
    ];
    if (data.tools.length) lines.push('', toolLine());
    return lines.join('\n');
  }

  const t = data.totals;
  if (!t.sessions) return 'no sessions matched.';
  const lines = [
    `${t.sessions} sessions · ${t.turns} turns · ${t.tool_calls} tools · ${t.errors} errors · ${money(t.cost_usd)}`,
    `out ${num(t.output_tokens)} · cache read ${num(t.cache_read)}`,
  ];
  if (data.tools.length) lines.push('', toolLine());
  return lines.join('\n');
}

function timelineData(db, id, { limit = 500 } = {}) {
  const s = findSession(db, id);
  return {
    session: s.id,
    total: db.prepare('SELECT COUNT(*) n FROM tool_call WHERE session_id = ?').get(s.id).n,
    calls: db.prepare(`SELECT c.*, t.ordinal turn FROM tool_call c
      LEFT JOIN turn t ON t.id = c.turn_id
      WHERE c.session_id = ? ORDER BY c.id LIMIT ?`).all(s.id, limit),
  };
}

function timeline(db, id, options) {
  const { session: sid, total, calls: rows } = timelineData(db, id, options);
  if (!rows.length) return `${short(sid)} has no tool calls.`;

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

// The tools that change a file, for marking where a session's work began.
const EDITS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];

/**
 * The context size at each request: everything the model read before it
 * answered, cached or not. The first request that edits a file is marked,
 * since how full the context already was when the work began is the question
 * a study of a session asks first.
 */
function contextData(db, id, { limit = 200 } = {}) {
  const s = findSession(db, id);
  const size = (r) => (r.input_tokens || 0) + (r.cache_read || 0) + (r.cache_write || 0);
  const requests = db.prepare(`SELECT r.*, t.ordinal turn,
      (SELECT group_concat(name, ' ') FROM tool_call c WHERE c.request_id = r.id) tools
    FROM request r LEFT JOIN turn t ON t.id = r.turn_id
    WHERE r.session_id = ? ORDER BY r.line LIMIT ?`).all(s.id, limit).map((r) => ({ ...r, context: size(r) }));

  const edit = db.prepare(`SELECT r.*, t.ordinal turn FROM request r
    JOIN tool_call c ON c.request_id = r.id LEFT JOIN turn t ON t.id = r.turn_id
    WHERE r.session_id = ? AND c.name IN (${EDITS.map(() => '?').join(',')})
    ORDER BY r.line LIMIT 1`).get(s.id, ...EDITS);
  const { total, peak } = db.prepare(`SELECT COUNT(*) total,
    MAX(input_tokens + cache_read + cache_write) peak FROM request WHERE session_id = ?`).get(s.id);
  const first_edit = edit ? {
    request_id: edit.id,
    request: db.prepare('SELECT COUNT(*) n FROM request WHERE session_id = ? AND line <= ?').get(s.id, edit.line).n,
    turn: edit.turn, line: edit.line, context: size(edit),
  } : null;
  return { session: s.id, total, peak, first_edit, requests };
}

function context(db, id, options) {
  const { session: sid, total, peak, first_edit: edit, requests: rows } = contextData(db, id, options);
  if (!rows.length) return `${short(sid)} has no requests.`;

  const out = [];
  if (edit) {
    out.push(`first edit: request ${edit.request}, turn ${edit.turn ?? '-'}, line ${edit.line}, context ${num(edit.context)}`);
  } else {
    out.push('no file edited in this session');
  }
  out.push(`peak: ${num(peak)} · ${total} requests`, '');
  out.push(table(
    ['#', 'TURN', 'LINE', 'AT', 'CONTEXT', 'OUT', 'TOOLS', ''],
    rows.map((r, i) => [
      i + 1, r.turn ?? '-', r.line, clock(r.timestamp), num(r.context), num(r.output_tokens),
      trim(r.tools, 40) || '-', edit && r.id === edit.request_id ? '← first edit' : '',
    ])
  ));
  if (total > rows.length) out.push(`\n${rows.length} of ${total} shown. --limit ${total} for all.`);
  return out.join('\n');
}

// ---------------------------------------------------------------- open sql

// A query that writes would corrupt an index nothing re-derives on demand, and
// the whole surface is a reader. PRAGMA is refused with the rest: it can turn
// writing back on. `replace` is refused as a statement (REPLACE INTO) and
// allowed as the string function, which is always followed by a parenthesis.
const READ_ONLY = /^\s*(select|with)\b/i;
const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum)\b|\breplace\b(?!\s*\()/i;

function sqlData(db, text) {
  if (!text) throw new FlowError('flow audit sql needs a query, in quotes.');
  if (!READ_ONLY.test(text) || FORBIDDEN.test(text)) {
    throw new FlowError(
      'flow audit sql runs SELECT and WITH only.\n' +
      '  The index is derived: rebuild it with flow audit index rather than editing it.'
    );
  }

  let rows;
  try {
    rows = db.prepare(text).all();
  } catch (err) {
    throw new FlowError(`flow audit sql: ${err.message}\n  flow audit schema lists the tables and columns.`);
  }
  return { rows };
}

function sql(db, text) {
  const { rows } = sqlData(db, text);
  if (!rows.length) return 'no rows.';
  const headers = Object.keys(rows[0]);
  return table(
    headers.map((h) => h.toUpperCase()),
    rows.map((r) => headers.map((h) => (r[h] == null ? '-' : String(r[h]))))
  );
}

/** The tables and their columns, so a query can be written without this file. */
function schemaData(db) {
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();
  return {
    tables: tables.map((t) => ({ name: t.name, columns: db.prepare(`PRAGMA table_info(${t.name})`).all().map((c) => c.name) })),
  };
}

const schema = (db) => schemaData(db).tables.map((t) => `${t.name}(${t.columns.join(', ')})`).join('\n');

module.exports = {
  coverage, sessions, session, turns, summary, timeline, context, sql, schema, findSession,
  coverageData, sessionsData, sessionData, turnsData, summaryData, timelineData, contextData, sqlData, schemaData,
  num, bytes, ms, money, short, trim,
};
