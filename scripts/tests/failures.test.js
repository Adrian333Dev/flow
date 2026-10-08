'use strict';
/**
 * The failure log: which hook calls become a line, the line's shape, and the
 * one file per month under ~/.flow/logs/failures/.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { SCRATCH, run } = require('./helpers/scratch');
const failures = require('../lib/logs/failures');
const logs = require('../lib/logs/logs');

function flowHome(name) {
  const dir = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  return dir;
}

const hook = (home, call) =>
  run('hooks/failures.js', [], { env: { ...process.env, FLOW_HOME: home }, input: JSON.stringify(call) });

const read = (home) => {
  const file = failures.file(home);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse) : [];
};

const failed = (tool, input, extra = {}) => ({
  hook_event_name: 'PostToolUseFailure', session_id: 's1', cwd: '/home/me/code/shop',
  tool_name: tool, tool_input: input, tool_use_id: 'toolu_01', error: 'Exit code 1', ...extra,
});

test('a Flow command, a bundled script and an MCP tool are logged, with where to find them', () => {
  const home = flowHome('failures-kept');
  for (const call of [
    failed('Bash', { command: 'flow sync' }),
    failed('Bash', { command: 'bash ~/.agents/skills/flow/skills/research/scripts/context7.sh ask next.js "x"' }),
    failed('Bash', { command: 'cd /x && util fs tree docs' }),
    failed('mcp__supabase__list_tables', { schema: 'public' }, { error: '401 Unauthorized' }),
  ]) {
    const ran = hook(home, call);
    assert.strictEqual(ran.code, 0);
    assert.strictEqual(ran.stdout, '', 'the log is never for the agent');
  }
  const lines = read(home);
  assert.deepStrictEqual(lines.map((l) => l.what), [
    'flow sync',
    'bash ~/.agents/skills/flow/skills/research/scripts/context7.sh ask next.js "x"',
    'cd /x && util fs tree docs',
    'mcp__supabase__list_tables',
  ]);
  const [first] = lines;
  assert.deepStrictEqual(
    [first.source, first.error, first.project, first.session, first.call],
    ['hook', 'Exit code 1', '/home/me/code/shop', 's1', 'toolu_01'],
  );
  assert.ok(first.at, 'every line carries its time');
});

test('the agent\'s own commands, an interrupt and a built-in tool are never logged', () => {
  const home = flowHome('failures-skipped');
  for (const call of [
    failed('Bash', { command: 'grep -rn nothing src' }),
    failed('Bash', { command: 'npm test' }),
    failed('Bash', { command: 'git log --flow-oneline' }),
    failed('Bash', { command: 'flow sync' }, { is_interrupt: true }),
    failed('Read', { file_path: '/missing' }),
  ]) hook(home, call);
  assert.deepStrictEqual(read(home), []);
});

test('a compound command is Flow\'s only where Flow\'s part could have set the exit code', () => {
  const is = (command) => failures.flowCommand(command);
  assert.ok(is('cd /x && util fs tree docs'));
  assert.ok(is('ls; flow sync'));
  assert.ok(is('git status | flow get fw-1'));
  assert.ok(is('node "$HOME/.flow/scripts/hooks/x.js" && flow doctor'));
  assert.ok(!is('util fs tree lab; ls .flow/research'), 'the ls set the exit code');
  assert.ok(!is('grep -n "^#" a.md && git diff --stat && util fs tree scripts'), 'the grep may have stopped the chain');
  assert.ok(!is('grep "flow|fw" a.md'), 'a | inside quotes splits nothing');
  assert.ok(!is('flow sync && ls'));
});

test('an API error that ends a turn is logged', () => {
  const home = flowHome('failures-api');
  hook(home, { hook_event_name: 'StopFailure', session_id: 's2', cwd: '/p', error: 'rate_limit', error_details: '429 Too Many Requests' });
  const [line] = read(home);
  assert.deepStrictEqual([line.what, line.error, line.session], ['api', 'rate_limit: 429 Too Many Requests', 's2']);
});

test('a long error is cut, and each month gets its own file', () => {
  const home = flowHome('failures-month');
  failures.record(home, { source: 'sync', what: 'flow sync', error: 'x'.repeat(2000) });
  const [line] = read(home);
  assert.strictEqual(line.error.length, failures.ERROR_CHARS + 1);
  assert.strictEqual(path.relative(home, failures.file(home)), path.join('logs', 'failures', `${logs.month()}.jsonl`));
  assert.strictEqual(logs.month(new Date(2026, 0, 5)), '2026-01');
});

test('a hook call it cannot read writes nothing and exits 0', () => {
  const home = flowHome('failures-garbage');
  const ran = run('hooks/failures.js', [], { env: { ...process.env, FLOW_HOME: home }, input: 'not json' });
  assert.strictEqual(ran.code, 0);
  assert.ok(!fs.existsSync(logs.dir(home)));
});

test('a background job that failed stays an open issue until the same job works again', () => {
  const home = flowHome('failures-open');
  failures.record(home, { source: 'records', what: 'sync /p', job: 'sync /p', error: 'merge conflict' });
  failures.record(home, { source: 'records', what: 'sync /p', job: 'sync /p', error: 'merge conflict, again' });
  failures.record(home, { source: 'skills-pull', what: 'git fetch in a/b', job: 'skills a/b', error: 'denied' });
  failures.record(home, { source: 'hook', what: 'flow new', error: 'x' });

  const open = failures.open(home);
  assert.deepStrictEqual(open.map((i) => [i.job, i.count, i.error]),
    [['sync /p', 2, 'merge conflict, again'], ['skills a/b', 1, 'denied']], 'a line with no job is never an issue');

  failures.cleared(home, 'sync /p');
  failures.cleared(home, 'sync /elsewhere');
  assert.deepStrictEqual(failures.open(home).map((i) => i.job), ['skills a/b']);
  assert.strictEqual(read(home).filter((l) => l.cleared).length, 1, 'a job with nothing open writes no line');

  const line = run('flow.js', ['status-line'], { env: { ...process.env, FLOW_HOME: home }, input: '{}' });
  assert.strictEqual(line.stdout, '⚠ 1 Flow issue: ask Claude to fix them\n');
});
