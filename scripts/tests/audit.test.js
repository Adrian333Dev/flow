'use strict';
/**
 * `flow audit` — the reader, against a transcript built line by line.
 *
 * A hand-built transcript rather than a real one: the assertions here are
 * about the derivations, and a real session cannot be asserted against without
 * restating what it holds. The shapes are copied from what Claude Code
 * actually writes — verified 2026-09-02 against version 2.1.258 — so a change
 * to the format breaks this file rather than passing quietly.
 *
 * The incremental walk is the case worth guarding. It resumes from a byte
 * offset, so the failure it can have is double-counting an appended tail, and
 * nothing about the output would look wrong.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run } = require('./helpers/scratch');

const CWD = '/home/me/code/demo';
const SESSION = '11111111-2222-3333-4444-555555555555';
const PROJECT = '-home-me-code-demo';

let clock = Date.parse('2026-09-02T10:00:00.000Z');
const stamp = () => new Date((clock += 1000)).toISOString();

const base = (type, extra) => ({
  parentUuid: null, isSidechain: false, type, uuid: `u${clock}`, timestamp: stamp(),
  userType: 'external', entrypoint: 'cli', cwd: CWD, sessionId: SESSION,
  version: '2.1.258', gitBranch: 'main', ...extra,
});

const prompt = (promptId, text) =>
  base('user', { promptId, promptSource: 'typed', message: { role: 'user', content: text } });

const says = (text, usage = {}) => base('assistant', {
  message: {
    model: 'claude-opus-5', role: 'assistant', content: [{ type: 'text', text }],
    usage: { input_tokens: 5, output_tokens: 100, cache_read_input_tokens: 2000, cache_creation_input_tokens: 50, ...usage },
  },
});

const calls = (id, name, input) => base('assistant', {
  message: {
    model: 'claude-opus-5', role: 'assistant',
    content: [{ type: 'tool_use', id, name, input }],
    usage: { input_tokens: 1, output_tokens: 20, cache_read_input_tokens: 1000, cache_creation_input_tokens: 10 },
  },
});

const returns = (id, promptId, result, isError = false) => base('user', {
  promptId,
  message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: 'ok', is_error: isError }] },
  toolUseResult: result,
});

const compaction = (pre, post) => base('system', {
  subtype: 'compact_boundary', isMeta: true, content: 'Conversation compacted',
  compactMetadata: { trigger: 'manual', preTokens: pre, postTokens: post, cumulativeDroppedTokens: pre - post, durationMs: 4000 },
});

/** The transcript both halves of the incremental test are built from. */
function firstHalf() {
  return [
    prompt('p1', 'read the layout'),
    calls('t1', 'Read', { file_path: `${CWD}/docs/layout.md` }),
    returns('t1', 'p1', { type: 'text', file: { filePath: `${CWD}/docs/layout.md`, content: 'body', startLine: 1, numLines: 40, totalLines: 90 } }),
    calls('t2', 'Bash', { command: "cat notes.md && sed -n '10,20p' docs/layout.md" }),
    returns('t2', 'p1', { stdout: 'text', stderr: '', interrupted: false, isImage: false }),
    says('here is the layout'),
    base('attachment', { attachment: { type: 'nested_memory', path: `${CWD}/CLAUDE.md`, displayPath: 'CLAUDE.md', content: 'rules' } }),
    base('system', { subtype: 'turn_duration', isMeta: true, durationMs: 61000, messageCount: 7 }),
  ];
}

function secondHalf() {
  return [
    compaction(190000, 15000),
    base('user', { promptId: 'p2', isCompactSummary: true, isVisibleInTranscriptOnly: true, message: { role: 'user', content: 'This session is being continued…' } }),
    prompt('p3', 'now write the file'),
    calls('t3', 'Write', { file_path: `${CWD}/out.md`, content: 'x' }),
    returns('t3', 'p3', { type: 'create', filePath: `${CWD}/out.md`, content: 'x', structuredPatch: [{ newStart: 1, newLines: 3 }] }),
    // A heredoc body is prose, and prose parses as commands unless it is
    // stripped: `tail the log` once recorded a file named `the`.
    calls('t4', 'Bash', { command: "cat > guide.md <<'EOF'\ntail the log and see\nEOF" }),
    returns('t4', 'p3', { stdout: '', stderr: '', interrupted: false, isImage: false }),
    calls('t5', 'Grep', { pattern: 'x' }),
    returns('t5', 'p3', 'Error: nothing matched', true),
    says('done'),
  ];
}

const asLines = (events) => events.map((e) => JSON.stringify(e)).join('\n') + '\n';

/** A scratch pair of roots: transcripts to read, and an index to write. */
function roots(name) {
  const dir = project(name);
  const claude = path.join(dir, 'claude');
  const home = path.join(dir, 'flow-home');
  const file = path.join(claude, 'projects', PROJECT, `${SESSION}.jsonl`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return {
    dir,
    file,
    env: { ...process.env, CLAUDE_CONFIG_DIR: claude, FLOW_HOME: home, FLOW_PROJECT: dir },
  };
}

const audit = (env, args) => run('flow/flow.js', ['audit', ...args], { env });

test('a transcript becomes sessions, segments, turns, tools and file touches', () => {
  const { file, env } = roots('audit-shape');
  fs.writeFileSync(file, asLines([...firstHalf(), ...secondHalf()]));

  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const rows = (sql) => audit(env, ['sql', sql]).stdout;

  // Two segments: the compaction ends the first, the file ends the second.
  assert.match(rows('SELECT ordinal, ended_by, trigger, pre_tokens FROM segment ORDER BY ordinal'), /1 +compact +manual +190000/);
  assert.match(rows('SELECT ordinal, ended_by FROM segment ORDER BY ordinal'), /2 +end/);

  // Three turns, and the compaction summary is one of them.
  assert.match(rows("SELECT COUNT(*) n FROM turn"), /\b3\b/);
  assert.match(rows("SELECT ordinal, source FROM turn WHERE source = 'compact'"), /2 +compact/);

  // A turn carries what the assistant spent inside it, from the usage blocks.
  assert.match(rows("SELECT output_tokens FROM turn WHERE prompt_id = 'p1'"), /140/);
  assert.match(rows("SELECT duration_ms, messages FROM turn WHERE prompt_id = 'p1'"), /61000 +7/);

  // Every tool call finds its result, including the errored one.
  assert.match(rows('SELECT COUNT(*) n FROM tool_call WHERE result_line IS NOT NULL'), /\b5\b/);
  assert.match(rows("SELECT name, is_error FROM tool_call WHERE is_error = 1"), /Grep +1/);
});

test('a file is attributed by every route, and confidence says which', () => {
  const { file, env } = roots('audit-files');
  fs.writeFileSync(file, asLines([...firstHalf(), ...secondHalf()]));
  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const touches = audit(env, ['sql',
    'SELECT path, given, kind, confidence, via, start_line, end_line FROM file_touch ORDER BY id']).stdout;

  // The Read tool reports its own line range even though the call passed none.
  assert.match(touches, new RegExp(`${CWD}/docs/layout.md.+read +exact +Read +1 +40`));
  // A relative path is resolved against the directory the event ran in, so one
  // file is one row rather than two.
  assert.match(touches, new RegExp(`${CWD}/notes.md +notes.md +read +parsed +bash:cat`));
  assert.match(touches, /bash:sed +10 +20/);
  // An attachment enters context with no tool call at all.
  assert.match(touches, new RegExp(`${CWD}/CLAUDE.md.+declared +attachment:nested_memory`));
  assert.match(touches, new RegExp(`${CWD}/out.md.+write +exact +Write`));

  // Nothing from inside the heredoc body.
  assert.doesNotMatch(touches, /\bthe\b *\|/);
  assert.strictEqual(audit(env, ['sql', "SELECT COUNT(*) n FROM file_touch WHERE path LIKE '%/the'"]).stdout.trim().split('\n').pop().trim(), '0');
});

test('indexing an appended transcript matches indexing it whole', () => {
  const whole = roots('audit-whole');
  fs.writeFileSync(whole.file, asLines([...firstHalf(), ...secondHalf()]));
  assert.strictEqual(audit(whole.env, ['index', '--quiet']).code, 0);

  const grown = roots('audit-grown');
  fs.writeFileSync(grown.file, asLines(firstHalf()));
  assert.strictEqual(audit(grown.env, ['index', '--quiet']).code, 0);
  fs.appendFileSync(grown.file, asLines(secondHalf()));

  const second = audit(grown.env, ['index', '--quiet']);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.match(second.stdout, /1 transcripts read/);

  const counts = 'SELECT (SELECT COUNT(*) FROM event) e, (SELECT COUNT(*) FROM turn) t, ' +
    '(SELECT COUNT(*) FROM segment) s, (SELECT COUNT(*) FROM tool_call) c, ' +
    '(SELECT COUNT(*) FROM file_touch) f, (SELECT SUM(output_tokens) FROM turn) o';
  assert.strictEqual(audit(grown.env, ['sql', counts]).stdout, audit(whole.env, ['sql', counts]).stdout);

  // And a file nothing appended to is not opened again.
  const third = audit(grown.env, ['index', '--quiet']);
  assert.match(third.stdout, /0 transcripts read, 1 unchanged/);
});

test('read takes a turn range and refuses to take a session', () => {
  const { file, env } = roots('audit-read');
  fs.writeFileSync(file, asLines([...firstHalf(), ...secondHalf()]));
  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const slice = audit(env, ['read', SESSION.slice(0, 8), '--turns', '1']);
  assert.strictEqual(slice.code, 0, slice.stderr);
  assert.match(slice.stdout, /read the layout/);
  assert.match(slice.stdout, /→ Read/);
  assert.doesNotMatch(slice.stdout, /now write the file/);

  const unbounded = audit(env, ['read', SESSION.slice(0, 8)]);
  assert.notStrictEqual(unbounded.code, 0);
  assert.match(unbounded.stderr, /--turns is required/);

  const missing = audit(env, ['read', SESSION.slice(0, 8), '--turns', '99']);
  assert.notStrictEqual(missing.code, 0);
  assert.match(missing.stderr, /has no turns 99-99/);
});

test('sql reads and never writes', () => {
  const { file, env } = roots('audit-sql');
  fs.writeFileSync(file, asLines(firstHalf()));
  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const write = audit(env, ['sql', 'DELETE FROM event']);
  assert.notStrictEqual(write.code, 0);
  assert.match(write.stderr, /SELECT and WITH only/);

  const sneaky = audit(env, ['sql', 'SELECT 1; PRAGMA writable_schema = 1']);
  assert.notStrictEqual(sneaky.code, 0);

  assert.strictEqual(audit(env, ['sql', 'SELECT COUNT(*) n FROM event']).code, 0);
});

test('summary shows compact metrics for one session', () => {
  const { file, env } = roots('audit-summary');
  fs.writeFileSync(file, asLines([...firstHalf(), ...secondHalf()]));
  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const result = audit(env, ['summary', SESSION.slice(0, 8)]);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /3 turns/);
  assert.match(result.stdout, /5 tools/);
  assert.match(result.stdout, /1 errors/);
  assert.match(result.stdout, /Read \d/);
  assert.match(result.stdout, /Bash \d/);
});

test('summary without an id aggregates across sessions', () => {
  const { file, env } = roots('audit-summary-all');
  fs.writeFileSync(file, asLines([...firstHalf(), ...secondHalf()]));
  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const result = audit(env, ['summary']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /1 sessions/);
  assert.match(result.stdout, /5 tools/);
});

test('timeline lists every tool call in a session', () => {
  const { file, env } = roots('audit-timeline');
  fs.writeFileSync(file, asLines([...firstHalf(), ...secondHalf()]));
  assert.strictEqual(audit(env, ['index', '--quiet']).code, 0);

  const result = audit(env, ['timeline', SESSION.slice(0, 8)]);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /Read\s+ok/);
  assert.match(result.stdout, /Bash\s+ok/);
  assert.match(result.stdout, /Write\s+ok/);
  assert.match(result.stdout, /Grep\s+ERR/);
});

test('a query against a missing index says how to build one', () => {
  const { env } = roots('audit-empty');
  const result = audit(env, ['sessions']);
  assert.notStrictEqual(result.code, 0);
  assert.match(result.stderr, /flow audit index/);
});
