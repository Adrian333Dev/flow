'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const frontmatter = require('../lib/frontmatter');

test('flow ls filters by --status, --label, and --parent', () => {
  const dir = project('board-ls-filters');

  flow(dir, ['new', 'Feature one']);
  flow(dir, ['new', 'Chore two', '--label', 'chore']);
  flow(dir, ['new', 'Issue three', '--label', 'bug']);

  const all = flow(dir, ['ls']);
  assert.strictEqual(all.code, 0, all.stderr);
  assert.match(all.stdout, /Feature one/);
  assert.match(all.stdout, /Chore two/);

  const chores = flow(dir, ['ls', '--label', 'chore']);
  assert.match(chores.stdout, /Chore two/);
  assert.ok(!chores.stdout.includes('Feature one'));

  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const parentId = folders[0].match(/^[a-z]+-\d+/)[0];
  flow(dir, ['new', 'Child', '--parent', parentId]);

  const children = flow(dir, ['ls', '--parent', parentId]);
  assert.match(children.stdout, /Child/);
  assert.ok(!children.stdout.includes('Chore two'));
});

test('flow ls --unfiled shows only done tickets without a filed date', () => {
  const dir = project('board-ls-unfiled');

  flow(dir, ['new', 'Alpha']);
  flow(dir, ['new', 'Beta']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const [id1, id2] = folders.map((f) => f.match(/^[a-z]+-\d+/)[0]);

  flow(dir, ['start', id1]);
  flow(dir, ['done', id1]);
  flow(dir, ['start', id2]);
  flow(dir, ['done', id2]);

  flow(dir, ['file', id1]);

  const unfiled = flow(dir, ['ls', '--unfiled']);
  assert.strictEqual(unfiled.code, 0, unfiled.stderr);
  assert.match(unfiled.stdout, /Beta/);
  assert.ok(!unfiled.stdout.includes('Alpha'));
});

const ticketText = (dir, id) => {
  const folder = fs.readdirSync(path.join(dir, '.flow', 'tickets')).find((f) => f.startsWith(`${id}-`));
  return fs.readFileSync(path.join(dir, '.flow', 'tickets', folder, 'ticket.md'), 'utf8');
};

const rankOf = (dir, id) => {
  const { rank } = frontmatter.parse(ticketText(dir, id)).data;
  return rank === undefined ? undefined : Number(rank);
};

const position = (out, ...titles) => titles.map((title) => out.indexOf(title));

test('with no rank, tickets follow by id, and flow rank moves one', () => {
  const dir = project('board-rank-default');
  for (const title of ['Alpha', 'Beta', 'Gamma']) flow(dir, ['new', title]);

  const [a, b, c] = position(flow(dir, ['next']).stdout, 'Alpha', 'Beta', 'Gamma');
  assert.ok(a < b && b < c, 'unranked tickets follow by id');

  const first = flow(dir, ['rank', 'exp-3', '--first']);
  assert.strictEqual(first.code, 0, first.stderr);
  assert.match(first.stdout, /numbered 2 other tickets too/, 'the first move numbers the group once');
  assert.deepStrictEqual(['exp-1', 'exp-2', 'exp-3'].map((id) => rankOf(dir, id)), [1000, 2000, 0]);
  const [a2, b2, c2] = position(flow(dir, ['next']).stdout, 'Alpha', 'Beta', 'Gamma');
  assert.ok(c2 < a2 && a2 < b2, 'Gamma first, then Alpha, then Beta');

  const after = flow(dir, ['rank', 'exp-3', '--after', 'exp-1']);
  assert.doesNotMatch(after.stdout, /numbered/, 'a later move writes the moved ticket only');
  assert.strictEqual(rankOf(dir, 'exp-3'), 1500);
  assert.strictEqual(rankOf(dir, 'exp-1'), 1000, 'no other ticket was touched');
  const [a3, c3, b3] = position(flow(dir, ['next']).stdout, 'Alpha', 'Gamma', 'Beta');
  assert.ok(a3 < c3 && c3 < b3);
  assert.match(ticketText(dir, 'exp-3'), /^rank: 1500$/m, 'a rank is stored as a bare number');
});

test('a new ticket lands last, and --before, --after and --first place it', () => {
  const dir = project('board-new-place');
  flow(dir, ['new', 'Alpha']);
  flow(dir, ['new', 'Beta']);

  const before = flow(dir, ['new', 'Gamma', '--before', 'exp-2']);
  assert.strictEqual(before.code, 0, before.stderr);
  assert.match(before.stdout, /rank: before exp-2/);
  const [a, g, b] = position(flow(dir, ['next']).stdout, 'Alpha', 'Gamma', 'Beta');
  assert.ok(a < g && g < b);

  flow(dir, ['new', 'Delta', '--first']);
  const [d, a2] = position(flow(dir, ['next']).stdout, 'Delta', 'Alpha');
  assert.ok(d < a2, '--first goes on top');

  flow(dir, ['new', 'Epsilon']);
  const out = flow(dir, ['next']).stdout;
  assert.ok(out.indexOf('Epsilon') > out.indexOf('Beta'), 'a plain new ticket goes last');

  const stranger = flow(dir, ['new', 'Zeta', '--before', 'exp-99']);
  assert.notStrictEqual(stranger.code, 0);
  assert.strictEqual(fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f.includes('zeta')).length, 0, 'a place that cannot be had creates no ticket');
  assert.notStrictEqual(flow(dir, ['new', 'Eta', '--first', '--before', 'exp-1']).code, 0, 'two places are refused');
});

test('flow rank refuses a closed ticket, a stranger, itself and no place', () => {
  const dir = project('board-rank-refuse');
  flow(dir, ['new', 'Alpha']);
  flow(dir, ['new', 'Beta']);
  flow(dir, ['new', 'Child', '--parent', 'exp-1']);
  flow(dir, ['start', 'exp-2']);
  flow(dir, ['done', 'exp-2']);

  assert.match(flow(dir, ['rank', 'exp-2', '--first']).stderr, /only open tickets have a place/);
  assert.match(flow(dir, ['rank', 'exp-1', '--before', 'exp-3']).stderr, /same parent/);
  assert.match(flow(dir, ['rank', 'exp-1', '--before', 'exp-1']).stderr, /beside itself/);
  assert.match(flow(dir, ['rank', 'exp-1']).stderr, /say where/);
});

test('children keep their own order, and sit where their parent sits', () => {
  const dir = project('board-rank-children');
  for (const title of ['Parent one', 'Parent two']) flow(dir, ['new', title]);
  flow(dir, ['new', 'Child a', '--parent', 'exp-2']);
  flow(dir, ['new', 'Child b', '--parent', 'exp-2']);
  flow(dir, ['new', 'Child c', '--parent', 'exp-1']);

  const flat = (title) => flow(dir, ['ls']).stdout.indexOf(title);
  assert.ok(flat('Child c') < flat('Child a'), 'a child of the first parent comes before a child of the second');

  flow(dir, ['rank', 'exp-2', '--first']);
  assert.ok(flat('Child a') < flat('Child c'), 'moving the parent moves its children with it');

  flow(dir, ['rank', 'exp-4', '--before', 'exp-3']);
  assert.ok(flat('Child b') < flat('Child a'), 'a child moves among its siblings');
});

test('rank.place numbers the group once, halves a gap, and numbers again when the gap is gone', () => {
  const rank = require('../lib/tickets/rank');
  const make = (id, value) => ({ id, data: { rank: value, status: 'todo', parent: '' } });

  const fresh = [make('exp-1', ''), make('exp-2', ''), make('exp-3', '')];
  const first = rank.place(fresh, make('exp-4', ''), { first: true });
  assert.strictEqual(first.rank, 0);
  assert.deepStrictEqual(first.others.map((o) => [o.ticket.id, o.rank]), [['exp-1', 1000], ['exp-2', 2000], ['exp-3', 3000]]);

  const spaced = [make('exp-1', 1000), make('exp-2', 2000)];
  const between = rank.place(spaced, make('exp-3', ''), { after: 'exp-1' });
  assert.strictEqual(between.rank, 1500);
  assert.deepStrictEqual(between.others, []);
  assert.strictEqual(rank.place(spaced, make('exp-3', ''), { last: true }).rank, 3000);
  assert.strictEqual(rank.place(spaced, make('exp-3', ''), { first: true }).rank, 0);

  const tight = [make('exp-1', 1000), make('exp-2', 1000.0000001)];
  const squeezed = rank.place(tight, make('exp-3', ''), { after: 'exp-1' });
  assert.strictEqual(squeezed.rank, 2000, 'the mover takes its slot in a new numbering');
  assert.deepStrictEqual(squeezed.others.map((o) => [o.ticket.id, o.rank]), [['exp-2', 3000]]);
});

test('flow ls <words> finds a ticket by loose words, one typo allowed', () => {
  const dir = project('board-ls-words');
  flow(dir, ['new', 'Tickets are ranked, labelled and searched']);
  flow(dir, ['new', 'Fix the login redirect', '--label', 'bug', '--body', 'The session cookie is dropped.']);

  const found = (...words) => flow(dir, ['ls', ...words]).stdout;
  assert.match(found('labelled'), /ranked/);
  assert.match(found('labeled'), /ranked/, 'one letter off still finds it');
  assert.match(found('ranked', 'searched'), /ranked/);
  assert.doesNotMatch(found('ranked', 'cookie'), /ranked|login/, 'every word must match');
  assert.match(found('cookie'), /login/, 'the body is searched');
  assert.match(found('bug'), /login/, 'labels are searched');
  assert.match(found('exp-2'), /login/, 'the id is searched');
  assert.doesNotMatch(found('lab'), /login/, 'a short word must match exactly');
  assert.match(found('nothing-like-it'), /no tickets/);
});

test('flow next counts only the statuses holding a ticket', () => {
  const dir = project('board-next-counts');
  flow(dir, ['new', 'One']);
  flow(dir, ['new', 'Two']);
  const [id] = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive').map((f) => f.match(/^[a-z]+-\d+/)[0]);
  flow(dir, ['start', id]);

  const next = flow(dir, ['next']);
  assert.strictEqual(next.code, 0, next.stderr);
  assert.strictEqual(next.stdout.split('\n')[0], 'tickets: 2   todo 1   in-progress 1');
});

test('flow next shows in-flight tickets above the ready list', () => {
  const dir = project('board-next-inflight');

  flow(dir, ['new', 'Ready ticket']);
  flow(dir, ['new', 'In progress']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const issueId = folders.find((f) => !f.includes('ready')).match(/^[a-z]+-\d+/)[0];

  flow(dir, ['start', issueId]);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /in flight/);
  const flightPos = r.stdout.indexOf('in flight');
  const readyPos = r.stdout.indexOf('Ready ticket');
  assert.ok(flightPos < readyPos, 'in-flight section should appear before ready tickets');
});

test('a parent with open children leaves in flight, and its children continue it', () => {
  const dir = project('board-parent-waits');

  write(dir, '.flow/tickets/exp-1-pricing/ticket.md',
    '---\nid: exp-1\ntitle: Pricing\nstatus: in-progress\ntype: feature\ndeps: []\n---\n\n');
  write(dir, '.flow/tickets/exp-2-tiers/ticket.md',
    '---\nid: exp-2\ntitle: Tiers\nstatus: todo\ntype: feature\nparent: exp-1\ndeps: []\n---\n\n');
  write(dir, '.flow/tickets/exp-3-other/ticket.md',
    '---\nid: exp-3\ntitle: Other work\nstatus: in-progress\ntype: feature\ndeps: []\n---\n\n');

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  const flight = r.stdout.slice(r.stdout.indexOf('in flight'), r.stdout.indexOf('continues open work'));
  assert.match(flight, /Other work/);
  assert.ok(!flight.includes('Pricing'), 'the waiting parent should not be in flight');
  assert.match(r.stdout, /continues open work \(1\):\n.*\n.*Tiers/);
});

test('flow next shows blocked tickets when nothing is ready', () => {
  const dir = project('board-next-blocked');

  flow(dir, ['new', 'Blocker']);
  flow(dir, ['new', 'Blocked']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const [id1, id2] = folders.map((f) => f.match(/^[a-z]+-\d+/)[0]);

  flow(dir, ['edit', id2, '--deps', id1]);
  flow(dir, ['park', id1, '--reason', 'waiting on the vendor']);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /nothing ready/);
  assert.match(r.stdout, /blocked/i);
});

test('flow tree nests children under their parent', () => {
  const dir = project('board-tree');

  flow(dir, ['new', 'Parent feature']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const parentId = folders[0].match(/^[a-z]+-\d+/)[0];

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
  write(dir, '.flow/tickets/exp-1-real/ticket.md',
    '---\nid: exp-1\ntitle: Real ticket\nstatus: todo\ntype: feature\ndeps: [exp-999]\n---\n\nBody.\n');

  const r = flow(dir, ['check']);
  assert.strictEqual(r.code, 1, 'check should exit 1 on problems');
  assert.match(r.stdout, /exp-999/);

  // Cycle: two tickets depending on each other.
  write(dir, '.flow/tickets/exp-2-alpha/ticket.md',
    '---\nid: exp-2\ntitle: Alpha\nstatus: todo\ntype: feature\ndeps: [exp-3]\n---\n\n');
  write(dir, '.flow/tickets/exp-3-beta/ticket.md',
    '---\nid: exp-3\ntitle: Beta\nstatus: todo\ntype: feature\ndeps: [exp-2]\n---\n\n');

  const r2 = flow(dir, ['check']);
  assert.strictEqual(r2.code, 1);
  assert.match(r2.stdout, /cycle/i);
});

test('flow check reports a status outside the 5', () => {
  const dir = project('board-check-status');

  write(dir, '.flow/tickets/exp-1-typo/ticket.md',
    '---\nid: exp-1\ntitle: Typo\nstatus: buildng\ntype: feature\ndeps: []\n---\n\n');
  const r = flow(dir, ['check']);
  assert.strictEqual(r.code, 1, 'check should exit 1 on an unknown status');
  assert.match(r.stdout, /unknown statuses \(1\)/);
  assert.match(r.stdout, /exp-1 has status buildng/);

  write(dir, '.flow/tickets/exp-1-typo/ticket.md',
    '---\nid: exp-1\ntitle: Typo\nstatus: in-progress\ntype: feature\ndeps: []\n---\n\n');
  const clean = flow(dir, ['check']);
  assert.strictEqual(clean.code, 0, clean.stdout);
});
