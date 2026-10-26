'use strict';
/**
 * `--json`: every command but install, update, init and sync prints its result
 * as JSON, and a refusal as `{"error": "..."}` on stdout.
 *
 * One test per command, each asserting the fields a reader leans on rather
 * than the whole object: the mod and the hooks read these, and a renamed field
 * is what would break them. The audit commands are tested beside their
 * fixtures, in audit.test.js and audit-permissions.test.js.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SCRATCH, project, run, flow } = require('./helpers/scratch');

/** `flow ... --json` in a scratch project, parsed. Fails the test on bad JSON. */
function asJson(dir, args, extra) {
  const ran = flow(dir, [...args, '--json'], extra);
  let data;
  try {
    data = JSON.parse(ran.stdout);
  } catch {
    assert.fail(`flow ${args.join(' ')} --json printed no JSON:\n${ran.stdout}${ran.stderr}`);
  }
  return { code: ran.code, data };
}

const ids = (records) => records.map((r) => r.id);

test('the help says --json once, a command without it refuses it, and a refusal prints as JSON', () => {
  const dir = project('json-cli');

  const help = flow(dir, ['--help']).stdout;
  assert.match(help, /^--json on every command but install, update, init and sync prints JSON\.$/m);
  assert.doesNotMatch(help, /\[--json\]/, 'never on a help line of its own');

  const install = flow(dir, ['install', '--json']);
  assert.strictEqual(install.code, 1);
  assert.match(install.stderr, /unknown flag "--json"/);

  const missing = asJson(dir, ['tickets', 'get', 'exp-99']);
  assert.strictEqual(missing.code, 1);
  assert.deepStrictEqual(Object.keys(missing.data), ['error']);
  assert.match(missing.data.error, /exp-99/);
});

test('flow tickets --json is flat, in tree order, with depth, at any depth and under --flat too', () => {
  const dir = project('json-tickets');
  flow(dir, ['tickets', 'new', 'Root']);
  flow(dir, ['tickets', 'new', 'Child', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Grandchild', '--parent', 'exp-2']);
  flow(dir, ['tickets', 'new', 'Leaf', '--parent', 'exp-3', '--label', 'deep']);
  flow(dir, ['tickets', 'new', 'Other']);

  const { code, data } = asJson(dir, ['tickets']);
  assert.strictEqual(code, 0);
  assert.deepStrictEqual(data.tickets.map((t) => [t.id, t.depth, t.parent]),
    [['exp-1', 0, ''], ['exp-2', 1, 'exp-1'], ['exp-3', 2, 'exp-2'], ['exp-4', 3, 'exp-3'], ['exp-5', 0, '']]);
  assert.deepStrictEqual(data.tickets[0].progress, { done: 0, total: 1 });
  assert.strictEqual(data.tickets[3].progress, null);
  for (const field of ['name', 'title', 'status', 'labels', 'deps', 'path', 'blockedBy']) assert.ok(field in data.tickets[0], field);

  assert.deepStrictEqual(asJson(dir, ['tickets', '--flat']).data.tickets, data.tickets, 'the same list under --flat');

  const filtered = asJson(dir, ['tickets', '--', 'label:deep']).data.tickets;
  assert.deepStrictEqual(filtered.map((t) => [t.id, t.depth]), [['exp-4', 0]], 'a child whose parent was filtered out is rooted');

  const subtree = asJson(dir, ['tickets', '--', 'parent:exp-2']).data.tickets;
  assert.deepStrictEqual(subtree.map((t) => [t.id, t.depth]), [['exp-2', 0], ['exp-3', 1], ['exp-4', 2]]);
});

test('flow tickets labels, check and get --json', () => {
  const dir = project('json-read');
  flow(dir, ['tickets', 'new', 'Alpha', '--label', 'ui,bug']);
  flow(dir, ['tickets', 'new', 'Beta', '--label', 'ui', '--deps', 'exp-1']);

  const labels = asJson(dir, ['tickets', 'labels', '--', 'label:ui']).data;
  assert.strictEqual(labels.tickets, 2);
  assert.deepStrictEqual(labels.labels, [{ label: 'bug', count: 1 }]);
  assert.deepStrictEqual(ids(labels.list), ['exp-1', 'exp-2']);

  const check = asJson(dir, ['tickets', 'check']);
  assert.strictEqual(check.code, 0);
  assert.strictEqual(check.data.ok, true);
  assert.deepStrictEqual(check.data.cycles, []);

  const get = asJson(dir, ['tickets', 'get', 'exp-1']).data;
  assert.strictEqual(get.id, 'exp-1');
  assert.deepStrictEqual(get.dependents, [{ id: 'exp-2', status: 'todo' }]);
  assert.ok('body' in get);
  const blocked = asJson(dir, ['tickets', 'get', 'exp-2']).data;
  assert.deepStrictEqual(blocked.blockedBy.map((b) => b.id), ['exp-1']);
});

test('flow tickets new, edit, rank, file, drop and move --json', () => {
  const dir = project('json-write');

  const made = asJson(dir, ['tickets', 'new', 'Alpha']).data;
  assert.strictEqual(made.ticket.id, 'exp-1');
  assert.strictEqual(made.ticket.status, 'todo');
  flow(dir, ['tickets', 'new', 'Beta']);
  flow(dir, ['tickets', 'new', 'Gamma']);

  const edited = asJson(dir, ['tickets', 'edit', 'exp-1', '--label', 'ui']).data;
  assert.deepStrictEqual(edited.ticket.labels, ['ui']);
  assert.ok(edited.changes.some((c) => c.field === 'labels'));

  const ranked = asJson(dir, ['tickets', 'rank', 'exp-3', '--first']).data;
  assert.strictEqual(ranked.ticket.id, 'exp-3');
  assert.strictEqual(ranked.renumbered, 2);

  flow(dir, ['tickets', 'start', 'exp-1']);
  flow(dir, ['tickets', 'done', 'exp-1']);
  const filed = asJson(dir, ['tickets', 'file', 'exp-1']).data;
  assert.deepStrictEqual(filed.filed.map((f) => f.id), ['exp-1']);
  assert.strictEqual(filed.unfiled, 0);

  const dropped = asJson(dir, ['tickets', 'drop', 'exp-2', '--reason', 'not needed']).data;
  assert.strictEqual(dropped.ticket.status, 'dropped');

  const moved = asJson(dir, ['tickets', 'move', 'exp-3', 'home']).data;
  assert.strictEqual(moved.moved.length, 1);
  assert.strictEqual(moved.moved[0].from, 'exp-3');
  assert.match(moved.moved[0].to, /^home-\d+$/);
});

test('the status verbs --json: todo, start, done and park', () => {
  const dir = project('json-status');
  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta', '--deps', 'exp-1']);

  const started = asJson(dir, ['tickets', 'start', 'exp-1']).data;
  assert.deepStrictEqual([started.ticket.id, started.from, started.to], ['exp-1', 'todo', 'in-progress']);

  const done = asJson(dir, ['tickets', 'done', 'exp-1']).data;
  assert.strictEqual(done.to, 'done');
  assert.deepStrictEqual(done.nowReady, ['exp-2']);

  const parked = asJson(dir, ['tickets', 'park', 'exp-2', '--reason', 'after the release']).data;
  assert.strictEqual(parked.ticket.reason, 'after the release');

  const back = asJson(dir, ['tickets', 'todo', 'exp-2']).data;
  assert.deepStrictEqual([back.from, back.to], ['parked', 'todo']);
});

test('flow next --json holds the tree, the whole ready list and the ticket to take', () => {
  const dir = project('json-next');
  flow(dir, ['tickets', 'new', 'Parent']);
  flow(dir, ['tickets', 'start', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Child', '--parent', 'exp-1']);
  for (const title of ['One', 'Two', 'Three', 'Four']) flow(dir, ['tickets', 'new', title]);
  flow(dir, ['tickets', 'new', 'Parked']);
  flow(dir, ['tickets', 'park', 'exp-7', '--reason', 'later']);

  const { data } = asJson(dir, ['next']);
  assert.strictEqual(data.project.prefix, 'exp');
  assert.deepStrictEqual(data.inProgress.map((t) => [t.id, t.depth]), [['exp-1', 0], ['exp-2', 1]]);
  assert.strictEqual(data.take, 'exp-2');
  assert.deepStrictEqual(ids(data.ready), ['exp-3', 'exp-4', 'exp-5', 'exp-6'], 'uncapped, where the text shows 3');
  assert.strictEqual(data.parked, 1);
});

test('flow notes --json: the list, new, get, drop and promote', () => {
  const dir = project('json-notes');

  const made = asJson(dir, ['notes', 'new', 'cache the index', '--label', 'perf']).data;
  assert.deepStrictEqual(made.note.labels, ['perf']);
  const name = made.note.name;

  assert.deepStrictEqual(asJson(dir, ['notes']).data.map((n) => n.name), [name]);
  assert.strictEqual(asJson(dir, ['notes', 'get', name]).data.note.text.trim(), 'cache the index');

  const promoted = asJson(dir, ['notes', 'promote', name]).data;
  assert.strictEqual(promoted.note, name);
  assert.strictEqual(promoted.ticket.id, 'exp-1');
  assert.ok(!('changes' in promoted), "only the promote's own result prints");

  const other = asJson(dir, ['notes', 'new', 'another']).data.note.name;
  assert.deepStrictEqual(asJson(dir, ['notes', 'drop', other]).data, { dropped: other });
});

test('flow settings --json: the list, and a switch', () => {
  const dir = path.join(SCRATCH, 'json-settings');
  fs.rmSync(dir, { recursive: true, force: true });
  const user = path.join(dir, 'user');
  const shop = path.join(user, 'code', 'shop');
  fs.mkdirSync(shop, { recursive: true });
  fs.mkdirSync(path.join(user, '.flow'), { recursive: true });
  assert.strictEqual(spawnSync('git', ['init', '-q'], { cwd: shop }).status, 0);
  const env = { ...process.env, HOME: user, FLOW_HOME: path.join(user, '.flow'), CLAUDE_CONFIG_DIR: path.join(user, '.claude') };
  delete env.FLOW_PROJECT;
  const settings = (...args) => JSON.parse(run('flow.js', ['settings', ...args, '--json'], { cwd: shop, env }).stdout);

  const all = settings();
  assert.deepStrictEqual(all.settings.find((s) => s.key === 'reminder'), {
    key: 'reminder', on: true, level: null, says: all.settings[0].says,
  });
  assert.ok(all.values.some((v) => v.key === 'wrapUpAt' && v.yours === null));

  assert.deepStrictEqual(settings('off', 'reminder', '--global'),
    { key: 'reminder', state: 'off', level: 'global', on: false, decidedBy: 'global' });
});

test('flow scorecard --json counts what the checks recorded', () => {
  const dir = project('json-scorecard');
  fs.mkdirSync(path.join(dir, 'checks'), { recursive: true });
  const env = { FLOW_CHECKS: path.join(dir, 'checks') };

  const { data } = asJson(dir, ['scorecard'], env);
  for (const field of ['brokenFiles', 'definedTwice', 'stale', 'violated', 'ready', 'neverApplied']) {
    assert.ok(Array.isArray(data[field]), field);
  }
  assert.strictEqual(data.checks, 0);
  assert.strictEqual(data.results, 0);
});

test('flow doctor --json: one entry per check, and a bare machine says it is not installed', () => {
  const dir = project('json-doctor');
  const bare = asJson(dir, ['doctor', '--root', path.join(dir, 'root'), '--no-bin']);
  assert.strictEqual(bare.code, 1);
  assert.deepStrictEqual(bare.data, { installed: false, checks: [], failed: 0, ran: 0 });

  const prereq = asJson(dir, ['doctor', '--prereq']).data;
  assert.strictEqual(prereq.installed, true);
  for (const check of prereq.checks) assert.deepStrictEqual(Object.keys(check), ['name', 'skipped', 'problems', 'notes', 'summary']);
});
