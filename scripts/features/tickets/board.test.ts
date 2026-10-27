import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, write, flow } from '../../shared/testing.ts';
import * as frontmatter from '../../shared/frontmatter.ts';
import * as rank from './rank.ts';


// The id a ticket folder holds, `exp-1` for `1` and for the old `exp-1-pricing`.
const idOf = (folder) => `exp-${folder.match(/\d+/)[0]}`;

test('flow ls filters by a quoted query: label, parent and words', () => {
  const dir = project('board-ls-filters');

  flow(dir, ['tickets', 'new', 'Feature one']);
  flow(dir, ['tickets', 'new', 'Chore two', '--label', 'chore']);
  flow(dir, ['tickets', 'new', 'Issue three', '--label', 'bug']);

  const all = flow(dir, ['tickets']);
  assert.strictEqual(all.code, 0, all.stderr);
  assert.match(all.stdout, /exp-1-feature-one/);
  assert.match(all.stdout, /exp-2-chore-two/);

  const chores = flow(dir, ['tickets', '--', 'label:chore']);
  assert.match(chores.stdout, /chore-two/);
  assert.ok(!chores.stdout.includes('feature-one'));

  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const parentId = idOf(folders[0]);
  flow(dir, ['tickets', 'new', 'Child', '--parent', parentId]);

  const children = flow(dir, ['tickets', '--', `parent:${parentId}`]);
  assert.match(children.stdout, /-child/);
  assert.ok(!children.stdout.includes('chore-two'));

  const word = flow(dir, ['tickets', '--', 'issue']);
  assert.match(word.stdout, /issue-three/);
  assert.ok(!word.stdout.includes('chore-two'));
});

test('flow ls on a query: a comma is or, a repeated field is and', () => {
  const dir = project('board-ls-logic');
  flow(dir, ['tickets', 'new', 'Alpha', '--label', 'ui,bug']);
  flow(dir, ['tickets', 'new', 'Beta', '--label', 'api']);
  flow(dir, ['tickets', 'new', 'Gamma', '--label', 'ui']);

  const either = flow(dir, ['tickets', '--', 'label:ui,api']).stdout;
  assert.match(either, /alpha/);
  assert.match(either, /beta/);
  assert.match(either, /gamma/);

  const both = flow(dir, ['tickets', '--', 'label:ui label:bug']).stdout;
  assert.match(both, /alpha/);
  assert.doesNotMatch(both, /gamma/);
  assert.doesNotMatch(both, /beta/);

  assert.match(flow(dir, ['tickets', '--', 'label:ui label:bug']).stdout, /alpha/, 'loose words join into one query');
  assert.match(flow(dir, ['tickets', '--', 'label:never-used']).stdout, /no tickets\./);
});

test('flow ls hides done and dropped until a status term, and status:all shows every status', () => {
  const dir = project('board-ls-status');
  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  flow(dir, ['tickets', 'new', 'Gamma']);
  flow(dir, ['tickets', 'start', 'exp-1']);
  flow(dir, ['tickets', 'done', 'exp-1']);
  flow(dir, ['tickets', 'drop', 'exp-2', '--reason', 'no longer needed']);

  const open = flow(dir, ['tickets']);
  assert.strictEqual(open.code, 0, open.stderr);
  assert.match(open.stdout, /gamma/);
  assert.doesNotMatch(open.stdout, /alpha|beta/);
  assert.match(open.stdout, /2 done or dropped hidden: "status:all"/);

  const all = flow(dir, ['tickets', '--', 'status:all']).stdout;
  assert.match(all, /alpha/);
  assert.match(all, /beta/);
  assert.match(all, /gamma/);
  assert.doesNotMatch(all, /hidden/);

  const done = flow(dir, ['tickets', '--', 'status:done']).stdout;
  assert.match(done, /alpha/);
  assert.doesNotMatch(done, /gamma|beta/);

  const bad = flow(dir, ['tickets', '--', 'status:bogus']);
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /status:bogus is no status/);
});

test('flow ls "status:done filed:no" shows only done tickets without a filed date', () => {
  const dir = project('board-ls-unfiled');

  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const [id1, id2] = folders.map((f) => idOf(f));

  flow(dir, ['tickets', 'start', id1]);
  flow(dir, ['tickets', 'done', id1]);
  flow(dir, ['tickets', 'start', id2]);
  flow(dir, ['tickets', 'done', id2]);

  flow(dir, ['tickets', 'file', id1]);

  const unfiled = flow(dir, ['tickets', '--', 'status:done filed:no']);
  assert.strictEqual(unfiled.code, 0, unfiled.stderr);
  assert.match(unfiled.stdout, /beta/);
  assert.ok(!unfiled.stdout.includes('alpha'));

  const filed = flow(dir, ['tickets', '--', 'status:done filed:yes']);
  assert.match(filed.stdout, /alpha/);
  assert.ok(!filed.stdout.includes('beta'));
});

test('flow labels counts the other labels, lists the tickets at 10 or fewer, and hides closed ones', () => {
  const dir = project('board-labels');
  flow(dir, ['tickets', 'new', 'Alpha', '--label', 'flow-issue,rework-loop']);
  flow(dir, ['tickets', 'new', 'Beta', '--label', 'flow-issue,rework-loop,hook']);
  flow(dir, ['tickets', 'new', 'Gamma', '--label', 'flow-issue,wrong-output']);
  flow(dir, ['tickets', 'new', 'Delta', '--label', 'feature']);
  flow(dir, ['tickets', 'start', 'exp-3']);
  flow(dir, ['tickets', 'done', 'exp-3']);

  const issues = flow(dir, ['tickets', 'labels', '--', 'label:flow-issue']);
  assert.strictEqual(issues.code, 0, issues.stderr);
  assert.match(issues.stdout, /^2 tickets, 2 open, 1 done or dropped hidden: "status:all"$/m);
  assert.match(issues.stdout, /^more labels: rework-loop 2, hook 1$/m, 'the asked label is left out, the rest ranked by count');
  assert.match(issues.stdout, /exp-1 +todo +alpha/);
  assert.match(issues.stdout, /exp-2 +todo +beta/);
  assert.doesNotMatch(issues.stdout, /gamma|delta/);

  const every = flow(dir, ['tickets', 'labels', '--', 'label:flow-issue status:all']).stdout;
  assert.match(every, /^3 tickets, 2 open$/m);
  assert.match(every, /wrong-output 1/);
  assert.match(every, /gamma/);

  const drilled = flow(dir, ['tickets', 'labels', '--', 'label:flow-issue label:rework-loop']).stdout;
  assert.match(drilled, /^more labels: hook 1$/m);
});

test('flow labels lists no tickets above 10 and says how to narrow', () => {
  const dir = project('board-labels-many');
  for (let i = 1; i <= 11; i++) flow(dir, ['tickets', 'new', `Item ${i}`, '--label', 'bulk']);

  const wide = flow(dir, ['tickets', 'labels', '--', 'label:bulk']).stdout;
  assert.match(wide, /^11 tickets, 11 open$/m);
  assert.match(wide, /add a label: term to see the tickets/);
  assert.doesNotMatch(wide, /item-1\b/);
});

test('a new label one typo from an existing one is refused unless --force', () => {
  const dir = project('board-label-near-miss');
  flow(dir, ['tickets', 'new', 'Alpha', '--label', 'rework-loop']);

  const near = flow(dir, ['tickets', 'new', 'Beta', '--label', 'rework-lop']);
  assert.strictEqual(near.code, 1);
  assert.match(near.stderr, /"rework-lop" is one typo from the label "rework-loop"/);
  assert.match(near.stderr, /--force/);

  const forced = flow(dir, ['tickets', 'new', 'Beta', '--label', 'rework-lop', '--force']);
  assert.strictEqual(forced.code, 0, forced.stderr);

  const same = flow(dir, ['tickets', 'new', 'Gamma', '--label', 'rework-loop']);
  assert.strictEqual(same.code, 0, 'the existing label itself is no near miss');

  const short = flow(dir, ['tickets', 'new', 'Delta', '--label', 'ui']);
  const shorter = flow(dir, ['tickets', 'new', 'Eps', '--label', 'uj']);
  assert.strictEqual(short.code, 0, short.stderr);
  assert.strictEqual(shorter.code, 0, 'labels under 5 letters are never near misses');
});

test('flow next counts what waits for /flow:upkeep, and prints nothing where nothing waits', () => {
  const dir = project('board-next-waiting');
  flow(dir, ['tickets', 'new', 'Alpha']);
  const body = () => flow(dir, ['next']).stdout.split('\n').slice(1).join('\n');
  assert.doesNotMatch(body(), /waiting/);

  flow(dir, ['tickets', 'start', 'exp-1']);
  flow(dir, ['tickets', 'done', 'exp-1']);
  flow(dir, ['notes', 'new', 'use two spaces', '--label', 'profile']);
  flow(dir, ['notes', 'new', 'an idea', '--label', 'ui']);
  write(dir, '.flow/findings/a-lesson.md', 'a lesson\n');
  write(dir, '.flow/findings/scorecard.md', 'a wrong warning\n');
  write(dir, 'flow-home/wiki/tool/findings/another-lesson.md', 'another lesson\n');

  const waiting = flow(dir, ['next']).stdout.split('\n').find((l) => l.startsWith('waiting'));
  assert.strictEqual(waiting, 'waiting: 1 closed ticket, 1 note, 2 findings');

  flow(dir, ['tickets', 'file', 'exp-1']);
  const filed = flow(dir, ['next']).stdout.split('\n').find((l) => l.startsWith('waiting'));
  assert.strictEqual(filed, 'waiting: 1 note, 2 findings', 'a part at 0 is left out');
});

const ticketText = (dir, id) => {
  const folder = fs.readdirSync(path.join(dir, '.flow', 'tickets')).find((f) => f !== 'archive' && idOf(f) === id);
  return fs.readFileSync(path.join(dir, '.flow', 'tickets', folder as string, 'ticket.md'), 'utf8');
};

const rankOf = (dir, id) => {
  const { rank } = frontmatter.parse(ticketText(dir, id)).data;
  return rank === undefined ? undefined : Number(rank);
};

const position = (out, ...titles) => titles.map((title) => out.indexOf(title));

test('with no rank, tickets follow by id, and flow rank moves one', () => {
  const dir = project('board-rank-default');
  for (const title of ['Alpha', 'Beta', 'Gamma']) flow(dir, ['tickets', 'new', title]);

  const [a, b, c] = position(flow(dir, ['next']).stdout, 'alpha', 'beta', 'gamma');
  assert.ok(a < b && b < c, 'unranked tickets follow by id');

  const first = flow(dir, ['tickets', 'rank', 'exp-3', '--first']);
  assert.strictEqual(first.code, 0, first.stderr);
  assert.match(first.stdout, /numbered 2 other tickets too/, 'the first move numbers the group once');
  assert.deepStrictEqual(['exp-1', 'exp-2', 'exp-3'].map((id) => rankOf(dir, id)), [1000, 2000, 0]);
  const [a2, b2, c2] = position(flow(dir, ['next']).stdout, 'alpha', 'beta', 'gamma');
  assert.ok(c2 < a2 && a2 < b2, 'gamma first, then alpha, then beta');

  const after = flow(dir, ['tickets', 'rank', 'exp-3', '--after', 'exp-1']);
  assert.doesNotMatch(after.stdout, /numbered/, 'a later move writes the moved ticket only');
  assert.strictEqual(rankOf(dir, 'exp-3'), 1500);
  assert.strictEqual(rankOf(dir, 'exp-1'), 1000, 'no other ticket was touched');
  const [a3, c3, b3] = position(flow(dir, ['next']).stdout, 'alpha', 'gamma', 'beta');
  assert.ok(a3 < c3 && c3 < b3);
  assert.match(ticketText(dir, 'exp-3'), /^rank: 1500$/m, 'a rank is stored as a bare number');
});

test('a new ticket lands last, and flow tickets rank is what places it', () => {
  const dir = project('board-new-place');
  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  flow(dir, ['tickets', 'new', 'Gamma']);
  const [a, b, g] = position(flow(dir, ['next']).stdout, 'alpha', 'beta', 'gamma');
  assert.ok(a < b && b < g, 'a plain new ticket goes last');

  for (const place of [['--before', 'exp-2'], ['--after', 'exp-1'], ['--first']]) {
    const placed = flow(dir, ['tickets', 'new', 'Delta', ...place]);
    assert.strictEqual(placed.code, 1, place.join(' '));
    assert.match(placed.stderr, /unknown flag/);
  }
  assert.strictEqual(fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive').length, 3, 'a refusal creates no ticket');
});

test('flow rank refuses a closed ticket, a stranger, itself and no place', () => {
  const dir = project('board-rank-refuse');
  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  flow(dir, ['tickets', 'new', 'Child', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'start', 'exp-2']);
  flow(dir, ['tickets', 'done', 'exp-2']);

  assert.match(flow(dir, ['tickets', 'rank', 'exp-2', '--first']).stderr, /only open tickets have a place/);
  assert.match(flow(dir, ['tickets', 'rank', 'exp-1', '--before', 'exp-3']).stderr, /same parent/);
  assert.match(flow(dir, ['tickets', 'rank', 'exp-1', '--before', 'exp-1']).stderr, /beside itself/);
  assert.match(flow(dir, ['tickets', 'rank', 'exp-1']).stderr, /say where/);
});

test('children keep their own order, and sit where their parent sits', () => {
  const dir = project('board-rank-children');
  for (const title of ['Parent one', 'Parent two']) flow(dir, ['tickets', 'new', title]);
  flow(dir, ['tickets', 'new', 'Child a', '--parent', 'exp-2']);
  flow(dir, ['tickets', 'new', 'Child b', '--parent', 'exp-2']);
  flow(dir, ['tickets', 'new', 'Child c', '--parent', 'exp-1']);

  const flat = (title) => flow(dir, ['tickets']).stdout.indexOf(title);
  assert.ok(flat('child-c') < flat('child-a'), 'a child of the first parent comes before a child of the second');

  flow(dir, ['tickets', 'rank', 'exp-2', '--first']);
  assert.ok(flat('child-a') < flat('child-c'), 'moving the parent moves its children with it');

  flow(dir, ['tickets', 'rank', 'exp-4', '--before', 'exp-3']);
  assert.ok(flat('child-b') < flat('child-a'), 'a child moves among its siblings');
});

test('rank.place numbers the group once, halves a gap, and numbers again when the gap is gone', () => {
  const make = (id, value): any => ({ id, data: { rank: value, status: 'todo', parent: '' } });

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
  flow(dir, ['tickets', 'new', 'Tickets are ranked, labelled and searched']);
  flow(dir, ['tickets', 'new', 'Fix the login redirect', '--label', 'bug', '--body', 'The session cookie is dropped.']);

  const found = (...words) => flow(dir, ['tickets', '--', words.join(' ')]).stdout;
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

test('flow next prints parked tickets as a count, and ready tickets as name and labels', () => {
  const dir = project('board-next-parked');
  for (const title of ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']) flow(dir, ['tickets', 'new', title, '--label', 'feature']);
  flow(dir, ['tickets', 'park', 'exp-7', '--reason', 'after release one, a long reason']);

  const next = flow(dir, ['next']);
  assert.strictEqual(next.code, 0, next.stderr);
  assert.match(next.stdout, /^ready \(6\)\n(  exp-\d+-\S+ +feature\n){3}  and 3 more \(flow next --all\)$/m);
  assert.match(next.stdout, /^take: exp-1-one$/m);
  assert.match(next.stdout, /^1 parked$/m);
  assert.doesNotMatch(next.stdout, /long reason|STATUS|PARENT/);
  assert.match(flow(dir, ['next', '--all']).stdout, /exp-6-six/);
});

test('flow tickets hides parked tickets, with a count, until asked, and shows the reason when asked', () => {
  const dir = project('board-parked-hidden');
  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  flow(dir, ['tickets', 'park', 'exp-2', '--reason', 'after release one']);

  const ls = flow(dir, ['tickets']).stdout;
  assert.doesNotMatch(ls, /beta/);
  assert.match(ls, /1 parked hidden: "status:all"/);
  assert.match(flow(dir, ['tickets', '--', 'status:parked']).stdout, /beta +parked +.*after release one/);
});

test('flow next counts nothing it does not print', () => {
  const dir = project('board-next-counts');
  flow(dir, ['tickets', 'new', 'One']);
  flow(dir, ['tickets', 'new', 'Two']);
  const [id] = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive').map((f) => idOf(f));
  flow(dir, ['tickets', 'start', id]);

  const next = flow(dir, ['next']);
  assert.strictEqual(next.code, 0, next.stderr);
  assert.match(next.stdout, /^exp {2}\S+\nin progress\n {2}exp-1-one +in progress\n\n/);
});

test('flow next shows the work in progress above the ready list', () => {
  const dir = project('board-next-inflight');

  flow(dir, ['tickets', 'new', 'Ready ticket']);
  flow(dir, ['tickets', 'new', 'In progress']);
  flow(dir, ['tickets', 'start', 'exp-2']);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  const progressPos = r.stdout.indexOf('in progress\n');
  const readyPos = r.stdout.indexOf('ready-ticket');
  assert.ok(progressPos !== -1 && progressPos < readyPos, 'the tree comes before the ready list');
});

test('flow next draws the work in progress as a tree with every open child, and takes the first ready one in it', () => {
  const dir = project('board-next-tree');

  flow(dir, ['tickets', 'new', 'Pricing']);
  flow(dir, ['tickets', 'start', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Discounts', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Tiers', '--parent', 'exp-1', '--deps', 'exp-2']);
  flow(dir, ['tickets', 'new', 'Other work']);
  flow(dir, ['tickets', 'start', 'exp-4']);
  flow(dir, ['tickets', 'new', 'Elsewhere']);
  flow(dir, ['tickets', 'rank', 'exp-3', '--first']);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  const tree = r.stdout.slice(r.stdout.indexOf('in progress\n'), r.stdout.indexOf('ready'));
  assert.match(tree, /^ {2}exp-1-pricing +0\/2\n {2}├── exp-3-tiers +blocked by exp-2\n {2}└── exp-2-discounts *\n {2}exp-4-other-work +in progress\n/m);
  assert.match(r.stdout, /^ready \(1\)\n {2}exp-5-elsewhere/m, 'the ready list holds only what sits outside the tree');
  assert.match(r.stdout, /^take: exp-2-discounts$/m, 'the first ready ticket in the tree, never a blocked todo');
  assert.doesNotMatch(r.stdout, /^.*:.*:/m, 'one colon per line');
});

test('flow next shows blocked tickets when nothing is ready', () => {
  const dir = project('board-next-blocked');

  flow(dir, ['tickets', 'new', 'Blocker']);
  flow(dir, ['tickets', 'new', 'Blocked']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const [id1, id2] = folders.map((f) => idOf(f));

  flow(dir, ['tickets', 'edit', id2, '--deps', id1]);
  flow(dir, ['tickets', 'park', id1, '--reason', 'waiting on the vendor']);

  const r = flow(dir, ['next']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /nothing ready/);
  assert.match(r.stdout, /blocked/i);
});

test('flow tickets nests children under their parent to any depth', () => {
  const dir = project('board-tree');
  flow(dir, ['tickets', 'new', 'Parent feature']);
  flow(dir, ['tickets', 'new', 'Child', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Grandchild', '--parent', 'exp-2']);
  flow(dir, ['tickets', 'new', 'Leaf', '--parent', 'exp-3']);

  const r = flow(dir, ['tickets']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^exp-1-parent-feature +todo +- +0\/1\n.*└── exp-2-child .*\n.*└── exp-3-grandchild .*\n.*└── exp-4-leaf /m);
  assert.doesNotMatch(flow(dir, ['tickets', '--flat']).stdout, /[│├└]/, '--flat prints the plain table');
});

test('a query that filters out a parent still shows its children, rooted, with the parent named', () => {
  const dir = project('board-tree-orphan');
  flow(dir, ['tickets', 'new', 'Parent feature']);
  flow(dir, ['tickets', 'new', 'Child', '--parent', 'exp-1', '--label', 'ui']);
  flow(dir, ['tickets', 'new', 'Grandchild', '--parent', 'exp-2', '--label', 'ui']);

  const r = flow(dir, ['tickets', '--', 'label:ui']).stdout;
  assert.doesNotMatch(r, /parent-feature/);
  assert.match(r, /exp-2-child +todo +ui +0\/1, under exp-1\n.*└── exp-3-grandchild/);
});

test('flow check reports cycles, dangling deps, and dropped blockers', () => {
  const dir = project('board-check');

  // Dangling dep: write a ticket that depends on a non-existent id.
  write(dir, '.flow/tickets/exp-1-real/ticket.md',
    '---\nid: exp-1\ntitle: Real ticket\nstatus: todo\ntype: feature\ndeps: [exp-999]\n---\n\nBody.\n');

  const r = flow(dir, ['tickets', 'check']);
  assert.strictEqual(r.code, 1, 'check should exit 1 on problems');
  assert.match(r.stdout, /exp-999/);

  // Cycle: two tickets depending on each other.
  write(dir, '.flow/tickets/exp-2-alpha/ticket.md',
    '---\nid: exp-2\ntitle: Alpha\nstatus: todo\ntype: feature\ndeps: [exp-3]\n---\n\n');
  write(dir, '.flow/tickets/exp-3-beta/ticket.md',
    '---\nid: exp-3\ntitle: Beta\nstatus: todo\ntype: feature\ndeps: [exp-2]\n---\n\n');

  const r2 = flow(dir, ['tickets', 'check']);
  assert.strictEqual(r2.code, 1);
  assert.match(r2.stdout, /cycle/i);
});

test('flow check reports a status outside the 5', () => {
  const dir = project('board-check-status');

  write(dir, '.flow/tickets/exp-1-typo/ticket.md',
    '---\nid: exp-1\ntitle: typo\ndescription: A typo\nstatus: buildng\ndeps: []\n---\n\n');
  const r = flow(dir, ['tickets', 'check']);
  assert.strictEqual(r.code, 1, 'check should exit 1 on an unknown status');
  assert.match(r.stdout, /unknown statuses \(1\)/);
  assert.match(r.stdout, /exp-1 has status buildng/);

  write(dir, '.flow/tickets/exp-1-typo/ticket.md',
    '---\nid: exp-1\ntitle: typo\ndescription: A typo\nstatus: in-progress\ndeps: []\n---\n\n');
  const clean = flow(dir, ['tickets', 'check']);
  assert.strictEqual(clean.code, 0, clean.stdout);
});
