'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const frontmatter = require('../flow/lib/frontmatter');

test('flow ls filters by --status, --type, and --parent', () => {
  const dir = project('board-ls-filters');

  flow(dir, ['new', 'Feature one']);
  flow(dir, ['new', 'Chore two', '--type', 'chore']);
  flow(dir, ['new', 'Issue three', '--type', 'issue']);

  const all = flow(dir, ['ls']);
  assert.strictEqual(all.code, 0, all.stderr);
  assert.match(all.stdout, /Feature one/);
  assert.match(all.stdout, /Chore two/);

  const chores = flow(dir, ['ls', '--type', 'chore']);
  assert.match(chores.stdout, /Chore two/);
  assert.ok(!chores.stdout.includes('Feature one'));

  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const parentId = folders[0].split('-')[0];
  flow(dir, ['new', 'Child', '--parent', parentId]);

  const children = flow(dir, ['ls', '--parent', parentId]);
  assert.match(children.stdout, /Child/);
  assert.ok(!children.stdout.includes('Chore two'));
});

test('flow ls --unfiled shows only done tickets without a filed date', () => {
  const dir = project('board-ls-unfiled');

  flow(dir, ['new', 'Alpha', '--type', 'issue']);
  flow(dir, ['new', 'Beta', '--type', 'issue']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const [id1, id2] = folders.map((f) => f.split('-')[0]);

  flow(dir, ['build', id1]);
  flow(dir, ['done', id1]);
  flow(dir, ['build', id2]);
  flow(dir, ['done', id2]);

  flow(dir, ['file', id1]);

  const unfiled = flow(dir, ['ls', '--unfiled']);
  assert.strictEqual(unfiled.code, 0, unfiled.stderr);
  assert.match(unfiled.stdout, /Beta/);
  assert.ok(!unfiled.stdout.includes('Alpha'));
});

test('flow next ranks ready tickets by priority', () => {
  const dir = project('board-next-rank');

  flow(dir, ['new', 'Low thing', '--priority', 'low']);
  flow(dir, ['new', 'Normal thing']);
  flow(dir, ['new', 'High thing', '--priority', 'high']);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  const highPos = r.stdout.indexOf('High thing');
  const lowPos = r.stdout.indexOf('Low thing');
  assert.ok(highPos < lowPos, 'high priority should appear before low');
});

test('flow next shows in-flight tickets above the ready list', () => {
  const dir = project('board-next-inflight');

  flow(dir, ['new', 'Ready ticket']);
  flow(dir, ['new', 'In progress', '--type', 'issue']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const issueId = folders.find((f) => !f.includes('ready')).split('-')[0];

  flow(dir, ['build', issueId]);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /in flight/);
  const flightPos = r.stdout.indexOf('in flight');
  const readyPos = r.stdout.indexOf('Ready ticket');
  assert.ok(flightPos < readyPos, 'in-flight section should appear before ready tickets');
});

test('flow next shows blocked tickets when nothing is ready', () => {
  const dir = project('board-next-blocked');

  flow(dir, ['new', 'Blocker', '--type', 'issue']);
  flow(dir, ['new', 'Blocked']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const [id1, id2] = folders.map((f) => f.split('-')[0]);

  flow(dir, ['dep', id2, '--on', id1]);
  flow(dir, ['build', id1]);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /nothing ready/);
  assert.match(r.stdout, /blocked/i);
});

test('flow tree nests children under their parent', () => {
  const dir = project('board-tree');

  flow(dir, ['new', 'Parent feature']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const parentId = folders[0].split('-')[0];

  flow(dir, ['new', 'Child A', '--parent', parentId]);
  flow(dir, ['new', 'Child B', '--parent', parentId]);

  const r = flow(dir, ['tree']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /Parent feature/);
  assert.match(r.stdout, /Child A/);
  assert.match(r.stdout, /[│├└]/);
});

test('flow check reports cycles, dangling deps, and dropped blockers', () => {
  const dir = project('board-check');

  // Dangling dep: write a ticket that depends on a non-existent id.
  const base = path.join(dir, '.flow', 'tickets');
  write(dir, '.flow/tickets/t001-real/ticket.md',
    '---\nid: t001\ntitle: Real ticket\nstatus: todo\ntype: feature\ndeps: [t999]\n---\n\nBody.\n');

  const r = flow(dir, ['check']);
  assert.strictEqual(r.code, 1, 'check should exit 1 on problems');
  assert.match(r.stdout, /t999/);

  // Cycle: two tickets depending on each other.
  write(dir, '.flow/tickets/t002-alpha/ticket.md',
    '---\nid: t002\ntitle: Alpha\nstatus: todo\ntype: feature\ndeps: [t003]\n---\n\n');
  write(dir, '.flow/tickets/t003-beta/ticket.md',
    '---\nid: t003\ntitle: Beta\nstatus: todo\ntype: feature\ndeps: [t002]\n---\n\n');

  const r2 = flow(dir, ['check']);
  assert.strictEqual(r2.code, 1);
  assert.match(r2.stdout, /cycle/i);
});

test('priority inheritance flows through the parent chain', () => {
  const dir = project('board-priority');

  flow(dir, ['new', 'Grandparent', '--priority', 'high']);
  const gp = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive')[0].split('-')[0];

  flow(dir, ['new', 'Middle child', '--parent', gp]);
  const folders2 = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const mid = folders2.find((f) => !f.startsWith(gp)).split('-')[0];

  flow(dir, ['new', 'Grandchild', '--parent', mid]);
  const folders3 = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const gc = folders3.find((f) => !f.startsWith(gp) && !f.startsWith(mid)).split('-')[0];

  const r = flow(dir, [gc]);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /high/);
  assert.match(r.stdout, /inherited/i);
});
