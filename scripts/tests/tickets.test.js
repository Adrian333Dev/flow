'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const frontmatter = require('../lib/frontmatter');

const ticket = (dir) => {
  const base = path.join(dir, '.flow', 'tickets');
  const folders = fs.readdirSync(base).filter((f) => f !== 'archive');
  const files = folders.map((f) => path.join(base, f, 'ticket.md'));
  return folders.map((f, i) => ({
    id: f.match(/^[a-z]+-\d+/)[0],
    folder: f,
    ...frontmatter.parse(fs.readFileSync(files[i], 'utf8')),
  }));
};

const ticketFile = (dir, id) => {
  const base = path.join(dir, '.flow', 'tickets');
  const archive = path.join(base, 'archive');
  for (const root of [base, archive]) {
    if (!fs.existsSync(root)) continue;
    const hit = fs.readdirSync(root).find((f) => f.startsWith(`${id}-`));
    if (hit) return path.join(root, hit, 'ticket.md');
  }
  return null;
};

test('flow new with labels and parent, and no type or priority', () => {
  const dir = project('tickets-new-flags');

  const r1 = flow(dir, ['new', 'Set up CI', '--label', 'chore,urgent']);
  assert.strictEqual(r1.code, 0, r1.stderr);
  const [t1] = ticket(dir);
  assert.deepStrictEqual(t1.data.labels, ['chore', 'urgent']);
  assert.strictEqual(t1.data.type, undefined);
  assert.strictEqual(t1.data.priority, undefined);
  assert.strictEqual(t1.data.rank, undefined, 'a new ticket carries no rank');
  assert.notStrictEqual(flow(dir, ['new', 'Typed', '--type', 'chore']).code, 0, '--type is gone');
  assert.notStrictEqual(flow(dir, ['new', 'Prioritised', '--priority', 'high']).code, 0, '--priority is gone');

  const r2 = flow(dir, ['new', 'Lint config', '--parent', t1.id, '--label', 'lint,post-v1']);
  assert.strictEqual(r2.code, 0, r2.stderr);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== t1.id);
  assert.strictEqual(child.data.parent, t1.id);
  assert.deepStrictEqual(child.data.labels, ['lint', 'post-v1']);
  assert.ok(child.folder.includes('lint-config'), `folder "${child.folder}" is named from the title`);
});

test('flow new with --body sets the ticket body', () => {
  const dir = project('tickets-new-body');

  const r = flow(dir, ['new', 'Write docs', '--body', 'Cover every flag.']);
  assert.strictEqual(r.code, 0, r.stderr);
  const [t] = ticket(dir);
  assert.match(t.body, /Cover every flag/);
});

test('flow new with --deps validates that each dep exists', () => {
  const dir = project('tickets-new-deps');

  flow(dir, ['new', 'First ticket']);
  const bad = flow(dir, ['new', 'Second ticket', '--deps', 'exp-999']);
  assert.notStrictEqual(bad.code, 0);
  assert.match(bad.stderr, /exp-999/);
});

test('a deleted ticket keeps its number: the counter gives out the next one up', () => {
  const dir = project('tickets-counter-delete');
  flow(dir, ['new', 'First']);
  flow(dir, ['new', 'Second']);
  assert.strictEqual(fs.readFileSync(path.join(dir, '.flow', 'ticket-counter'), 'utf8'), '2\n');

  fs.rmSync(path.dirname(ticketFile(dir, 'exp-2')), { recursive: true });
  const r = flow(dir, ['new', 'Third']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^created exp-3 /m);
});

test('a ticket moved away keeps its number in the place it left', () => {
  const dir = project('tickets-counter-move');
  flow(dir, ['new', 'First']);
  flow(dir, ['new', 'Second']);
  const moved = flow(dir, ['move', 'exp-2', 'home']);
  assert.strictEqual(moved.code, 0, moved.stderr);

  assert.match(flow(dir, ['new', 'Third']).stdout, /^created exp-3 /m);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'flow-home', 'ticket-counter'), 'utf8'), '1\n');
});

test('a place with no counter starts from its highest ticket', () => {
  const dir = project('tickets-counter-missing');
  flow(dir, ['new', 'First']);
  flow(dir, ['new', 'Second']);
  fs.rmSync(path.join(dir, '.flow', 'ticket-counter'));

  assert.match(flow(dir, ['new', 'Third']).stdout, /^created exp-3 /m);
  assert.strictEqual(fs.readFileSync(path.join(dir, '.flow', 'ticket-counter'), 'utf8'), '3\n');
});

test('a folder offers its whole name as the prefix where it fits, else its first 3 letters', () => {
  const store = require('../lib/tickets/store');
  assert.strictEqual(store.offerWord('/code/shop'), 'shop');
  assert.strictEqual(store.offerWord('/code/my-app'), 'myapp');
  assert.strictEqual(store.offerWord('/code/expense-tracker'), 'exp');
  assert.strictEqual(store.offerWord('/code/x1'), 'flow');
  assert.strictEqual(store.offerWord('/code/home'), 'flow');
});

test('a folder on another disk is copied across, then deleted', () => {
  const store = require('../lib/tickets/store');
  const dir = project('tickets-move-other-disk');
  const from = path.dirname(write(dir, 'elsewhere/exp-1-parser/ticket.md', '# Parser\n'));
  const to = path.join(dir, 'there', 'exp-1-parser');
  fs.mkdirSync(path.dirname(to), { recursive: true });

  // A real second filesystem is not available to a test, so the rename fails
  // the way it does across disks.
  const rename = fs.renameSync;
  fs.renameSync = () => { throw Object.assign(new Error('cross-device link'), { code: 'EXDEV' }); };
  try {
    store.moveFolder(from, to);
  } finally {
    fs.renameSync = rename;
  }

  assert.ok(!fs.existsSync(from), 'the original folder is gone');
  assert.match(fs.readFileSync(path.join(to, 'ticket.md'), 'utf8'), /Parser/);
});

test('flow edit changes title and labels', () => {
  const dir = project('tickets-edit');

  flow(dir, ['new', 'Old title']);
  const [t] = ticket(dir);

  flow(dir, ['edit', t.id, '--title', 'New title']);
  const edited = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(edited.data.title, 'New title');
  assert.notStrictEqual(flow(dir, ['edit', t.id, '--type', 'chore']).code, 0, '--type is gone');
  assert.notStrictEqual(flow(dir, ['edit', t.id, '--priority', 'low']).code, 0, '--priority is gone');

  const labelsOf = () => frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8')).data.labels || [];
  const r = flow(dir, ['edit', t.id, '--label', 'ui,api']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.deepStrictEqual(labelsOf(), ['ui', 'api']);

  flow(dir, ['edit', t.id, '--label', 'api']);
  assert.deepStrictEqual(labelsOf(), ['api'], 'the list is replaced, never added to');
  flow(dir, ['edit', t.id, '--label', '']);
  assert.deepStrictEqual(labelsOf(), []);
});

test('flow edit --parent detects and refuses a cycle', () => {
  const dir = project('tickets-edit-cycle');

  flow(dir, ['new', 'Parent']);
  const [p] = ticket(dir);
  flow(dir, ['new', 'Child', '--parent', p.id]);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== p.id);

  const r = flow(dir, ['edit', p.id, '--parent', child.id]);
  assert.notStrictEqual(r.code, 0);
  assert.match(r.stderr, /ancestor/);
});

test('flow edit --deps replaces the whole list, and an empty value clears it', () => {
  const dir = project('tickets-dep');

  flow(dir, ['new', 'First']);
  flow(dir, ['new', 'Second']);
  flow(dir, ['new', 'Third']);
  const [t1, t2, t3] = ticket(dir);
  const deps = () => frontmatter.parse(fs.readFileSync(ticketFile(dir, t3.id), 'utf8')).data.deps || [];

  const set = flow(dir, ['edit', t3.id, '--deps', `${t1.id},${t2.id}`]);
  assert.strictEqual(set.code, 0, set.stderr);
  assert.match(set.stdout, new RegExp(`deps: \\[\\] → \\[${t1.id}, ${t2.id}\\]`));
  assert.deepStrictEqual(deps(), [t1.id, t2.id]);

  flow(dir, ['edit', t3.id, '--deps', t2.id]);
  assert.deepStrictEqual(deps(), [t2.id], 'the list is replaced, never added to');

  flow(dir, ['edit', t3.id, '--deps', '']);
  assert.deepStrictEqual(deps(), []);

  const missing = flow(dir, ['edit', t3.id, '--deps', 'tst-99']);
  assert.strictEqual(missing.code, 1);
  assert.match(missing.stderr, /--deps names \S+-99, which does not exist\./);
  assert.strictEqual(flow(dir, ['dep', t3.id, '--on', t1.id]).code, 1, 'flow dep is gone');
});

test('flow edit --deps refuses to close a cycle', () => {
  const dir = project('tickets-dep-cycle');

  flow(dir, ['new', 'Alpha']);
  flow(dir, ['new', 'Beta']);
  const [a, b] = ticket(dir);

  flow(dir, ['edit', b.id, '--deps', a.id]);
  const r = flow(dir, ['edit', a.id, '--deps', b.id]);
  assert.notStrictEqual(r.code, 0);
  assert.match(r.stderr, /cycle/);
  assert.match(flow(dir, ['edit', a.id, '--deps', a.id]).stderr, /cannot depend on itself/);
});

test('parking stores the resume status, and reviving restores it', () => {
  const dir = project('tickets-park');

  flow(dir, ['new', 'Build the widget']);
  const [t] = ticket(dir);

  flow(dir, ['start', t.id]);
  flow(dir, ['park', t.id, '--reason', 'waiting on API']);

  const parked = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(parked.data.status, 'parked');
  assert.strictEqual(parked.data.resume, 'in-progress');
  assert.match(parked.data.reason, /waiting on API/);

  flow(dir, ['start', t.id]);
  const revived = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(revived.data.status, 'in-progress');
  assert.strictEqual(revived.data.reason || '', '');
  assert.strictEqual(revived.data.resume || '', '');
});

test('a field Flow does not know survives a move', () => {
  const dir = project('tickets-unknown-field');

  flow(dir, ['new', 'Build the widget']);
  const [t] = ticket(dir);
  const file = ticketFile(dir, t.id);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^---\n/, '---\nassignee: sam\nlabels: [ui, api]\n'));

  flow(dir, ['start', t.id]);
  const moved = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(moved.data.status, 'in-progress');
  assert.strictEqual(moved.data.assignee, 'sam');
  assert.deepStrictEqual(moved.data.labels, ['ui', 'api']);
});

test('flow done refuses on a parent with open children', () => {
  const dir = project('tickets-done-children');

  flow(dir, ['new', 'Parent feature']);
  const [p] = ticket(dir);
  flow(dir, ['new', 'Child task', '--parent', p.id]);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== p.id);

  flow(dir, ['start', p.id, '--force']);
  const blocked = flow(dir, ['done', p.id]);
  assert.notStrictEqual(blocked.code, 0);
  assert.match(blocked.stderr, /open child/);

  flow(dir, ['start', child.id]);
  flow(dir, ['done', child.id]);
  const ok = flow(dir, ['done', p.id]);
  assert.strictEqual(ok.code, 0, ok.stderr);
});

test('flow get says a parent with open children is blocked on them, and ready once they close', () => {
  const dir = project('tickets-get-children');
  flow(dir, ['new', 'Parent feature']);
  const [p] = ticket(dir);
  flow(dir, ['new', 'Child task', '--parent', p.id]);
  const child = ticket(dir).find((t) => t.id !== p.id);

  assert.match(flow(dir, ['get', p.id]).stdout, new RegExp(`blocked: {4}open children come first: ${child.id}\\n`));
  flow(dir, ['start', child.id]);
  flow(dir, ['done', child.id]);
  assert.match(flow(dir, ['get', p.id]).stdout, /ready: {6}yes\n/);
});

test('an unmet dep blocks pickup, and only done unblocks', () => {
  const dir = project('tickets-dep-block');

  flow(dir, ['new', 'Dep target']);
  flow(dir, ['new', 'Blocked ticket']);
  const [t1, t2] = ticket(dir);

  flow(dir, ['edit', t2.id, '--deps', t1.id]);
  const blocked = flow(dir, ['start', t2.id]);
  assert.notStrictEqual(blocked.code, 0);
  assert.match(blocked.stderr, /blocked/);

  flow(dir, ['start', t1.id]);
  const stillBlocked = flow(dir, ['start', t2.id]);
  assert.notStrictEqual(stillBlocked.code, 0, 'a dependency in progress does not clear');
  assert.match(stillBlocked.stderr, /is in-progress/);

  flow(dir, ['done', t1.id]);

  const unblocked = flow(dir, ['start', t2.id]);
  assert.strictEqual(unblocked.code, 0, unblocked.stderr);
});

test('a new ticket with any label starts todo, and says how to pick it up', () => {
  const dir = project('tickets-new-todo');

  for (const label of ['feature', 'bug', 'topic', 'research', 'v1']) {
    const r = flow(dir, ['new', `A ${label}`, '--label', label]);
    assert.strictEqual(r.code, 0, r.stderr);
    assert.match(r.stdout, /pick up with: flow start exp-\d+/);
  }
  for (const t of ticket(dir)) assert.strictEqual(t.data.status, 'todo', `${t.id} should start todo`);
});

test('flow start reopens a done ticket, taking it out of the archive', () => {
  const dir = project('tickets-reopen');

  flow(dir, ['new', 'Finished work']);
  const [t] = ticket(dir);
  flow(dir, ['start', t.id]);
  flow(dir, ['done', t.id]);
  assert.match(ticketFile(dir, t.id), /archive/);

  const r = flow(dir, ['start', t.id]);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.doesNotMatch(ticketFile(dir, t.id), /archive/);
  assert.strictEqual(frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8')).data.status, 'in-progress');
});

test('a parked ticket needs a reason, and comes back by flow todo or flow start', () => {
  const dir = project('tickets-park-back');

  flow(dir, ['new', 'Waits on the vendor']);
  const [t] = ticket(dir);
  const status = () => frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8')).data;

  const bare = flow(dir, ['park', t.id]);
  assert.notStrictEqual(bare.code, 0);
  assert.match(bare.stderr, /reason/);

  flow(dir, ['park', t.id, '--reason', 'vendor ships in Q3']);
  assert.strictEqual(status().status, 'parked');
  assert.strictEqual(status().resume, 'todo');
  assert.match(flow(dir, [t.id]).stdout, /pick up with: flow todo /);

  flow(dir, ['todo', t.id]);
  assert.strictEqual(status().status, 'todo');
  flow(dir, ['start', t.id]);
  flow(dir, ['park', t.id, '--reason', 'blocked again']);
  assert.match(flow(dir, [t.id]).stdout, /pick up with: flow start /);

  assert.strictEqual(flow(dir, ['start', t.id]).code, 0);
  assert.strictEqual(status().status, 'in-progress');
});

test('the commands of the 8 statuses are gone', () => {
  const dir = project('tickets-old-commands');
  flow(dir, ['new', 'Anything']);

  for (const old of ['groundwork', 'plan', 'build', 'review']) {
    assert.notStrictEqual(flow(dir, [old, 'exp-1']).code, 0, `flow ${old} should refuse`);
  }
  assert.strictEqual(frontmatter.parse(fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8')).data.status, 'todo');
});

test('flow drop requires --reason, refuses on dependents, --by repairs', () => {
  const dir = project('tickets-drop');

  flow(dir, ['new', 'Will drop']);
  flow(dir, ['new', 'Depends on it']);
  flow(dir, ['new', 'Replacement']);
  const [t1, t2, t3] = ticket(dir);

  flow(dir, ['edit', t2.id, '--deps', t1.id]);

  const noReason = flow(dir, ['drop', t1.id]);
  assert.notStrictEqual(noReason.code, 0);
  assert.match(noReason.stderr, /reason/);

  const hasDeps = flow(dir, ['drop', t1.id, '--reason', 'obsolete']);
  assert.notStrictEqual(hasDeps.code, 0);
  assert.match(hasDeps.stderr, /dependent/);

  const repaired = flow(dir, ['drop', t1.id, '--reason', 'obsolete', '--by', t3.id]);
  assert.strictEqual(repaired.code, 0, repaired.stderr);

  const t2After = frontmatter.parse(fs.readFileSync(ticketFile(dir, t2.id), 'utf8'));
  assert.ok(t2After.data.deps.includes(t3.id), `deps should now include ${t3.id}`);
  assert.ok(!t2After.data.deps.includes(t1.id), `deps should no longer include ${t1.id}`);
});

test('flow drop --force cascades to transitive dependents', () => {
  const dir = project('tickets-drop-force');

  flow(dir, ['new', 'Root']);
  flow(dir, ['new', 'Middle']);
  flow(dir, ['new', 'Leaf']);
  const [t1, t2, t3] = ticket(dir);

  flow(dir, ['edit', t2.id, '--deps', t1.id]);
  flow(dir, ['edit', t3.id, '--deps', t2.id]);

  const r = flow(dir, ['drop', t1.id, '--reason', 'abandoned', '--force']);
  assert.strictEqual(r.code, 0, r.stderr);

  for (const id of [t1.id, t2.id, t3.id]) {
    const file = ticketFile(dir, id);
    const fm = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    assert.strictEqual(fm.data.status, 'dropped', `${id} should be dropped`);
    const history = fs.readFileSync(path.join(path.dirname(file), 'history.md'), 'utf8');
    assert.match(history, /todo → dropped/, `${id} should record the drop in history.md`);
  }
});

test('moving to the current status is a no-op', () => {
  const dir = project('tickets-noop-move');

  flow(dir, ['new', 'Some work']);
  const [t] = ticket(dir);

  flow(dir, ['start', t.id]);
  const r = flow(dir, ['start', t.id]);
  assert.strictEqual(r.code, 0);
  assert.match(r.stdout, /already/);
});

test('flow file stamps a closed ticket, and --force re-stamps', () => {
  const dir = project('tickets-file');

  flow(dir, ['new', 'Done thing']);
  const [t] = ticket(dir);
  flow(dir, ['start', t.id]);
  flow(dir, ['done', t.id]);

  const filed = flow(dir, ['file', t.id]);
  assert.strictEqual(filed.code, 0, filed.stderr);
  const fm1 = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.ok(fm1.data.filed, 'filed date should be set');

  const again = flow(dir, ['file', t.id]);
  assert.match(again.stdout, /already filed/);

  const forced = flow(dir, ['file', t.id, '--force']);
  assert.strictEqual(forced.code, 0, forced.stderr);
  assert.match(forced.stdout, /filed/);
});

test('flow get needs an id: the board is flow next', () => {
  const dir = project('tickets-get-needs-id');
  const r = flow(dir, ['get']);
  assert.strictEqual(r.code, 1);
  assert.match(r.stderr, /takes a ticket id.*The board is flow next/);
});

test('flow <id> still counts the questions of an old ticket\'s map', () => {
  const dir = project('tickets-map-count');

  const created = flow(dir, ['new', 'Split the parser']);
  assert.strictEqual(created.code, 0, created.stderr);
  const [t] = ticket(dir);

  // A new ticket holds no map, so the line stays away until an old one has it.
  const fresh = flow(dir, ['get', t.id]);
  assert.strictEqual(fresh.code, 0, fresh.stderr);
  assert.doesNotMatch(fresh.stdout, /^map:/m, 'no map is no count');

  write(dir, `.flow/tickets/${t.folder}/groundwork/map.md`, [
    '# Split the parser: groundwork',
    '',
    '- [x] 0: Where the seam goes',
    '  - [x] 0.0: does the tokenizer own whitespace?',
    '  - [ ] 0.1: what happens to the error positions?',
    '- [ ] 1: is the builder streaming?',
    '',
  ].join('\n'));

  const worked = flow(dir, ['get', t.id]);
  assert.strictEqual(worked.code, 0, worked.stderr);
  assert.match(worked.stdout, /^map: +groundwork\/map\.md +2\/4 answered$/m);
});

test('a new ticket is one file', () => {
  const dir = project('tickets-one-file');

  const r = flow(dir, ['new', 'Split the parser']);
  assert.strictEqual(r.code, 0, r.stderr);
  const [t] = ticket(dir);
  assert.deepStrictEqual(fs.readdirSync(path.join(dir, '.flow', 'tickets', t.folder)), ['ticket.md']);
  assert.doesNotMatch(r.stdout, /map\.md/);
});

test('flow <id> counts ## Questions and ## Tasks, and lists decisions/', () => {
  const dir = project('tickets-lists');
  const body = [
    'What it is for.', '',
    '## Questions', '',
    '- [x] 0: Where does the seam go?',
    '  - [ ] 0.0: what about the error positions?',
    '<!-- - [ ] an example inside a comment -->', '',
    '## Tasks', '',
    '1. [x] **Cut the parser**: `parser.js`',
    '      - [ ] a sub-check the build added',
    '2. [ ] **Wire the builder**', '',
    '## State', '',
    '- [ ] not a task',
  ].join('\n');

  flow(dir, ['new', 'Split the parser', '--body', body]);
  const [t] = ticket(dir);
  write(dir, `.flow/tickets/${t.folder}/decisions/seam.md`, '# Seam\n');

  const shown = flow(dir, ['get', t.id]).stdout;
  assert.match(shown, /^questions: +1\/2 answered$/m);
  assert.match(shown, /^tasks: +1\/2 done$/m);
  assert.match(shown, /^decisions: +decisions\/seam\.md$/m);
});

test('flow done ticks a child\'s line in the parent\'s ## Tasks, and a reopen clears it', () => {
  const dir = project('tickets-tick');
  const tasks = ['## Tasks', '', '- [ ] exp-2: First child', '- [ ] **exp-3**: Second child, after exp-2'].join('\n');
  flow(dir, ['new', 'Parent', '--body', tasks]);
  flow(dir, ['new', 'First child', '--parent', 'exp-1']);
  flow(dir, ['new', 'Second child', '--parent', 'exp-1']);
  flow(dir, ['new', 'Third child', '--parent', 'exp-1']);
  const parent = () => fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8');

  flow(dir, ['start', 'exp-2']);
  const done = flow(dir, ['done', 'exp-2']);
  assert.match(done.stdout, /ticked in exp-1's ## Tasks/);
  assert.match(parent(), /- \[x\] exp-2: First child/);
  assert.match(parent(), /- \[ \] \*\*exp-3\*\*/, 'a mention of exp-2 on another line ticks nothing');

  flow(dir, ['start', 'exp-3']);
  flow(dir, ['done', 'exp-3']);
  assert.match(parent(), /- \[x\] \*\*exp-3\*\*/);

  assert.match(flow(dir, ['start', 'exp-2']).stdout, /cleared in exp-1's ## Tasks/);
  assert.match(parent(), /- \[ \] exp-2: First child/);

  flow(dir, ['start', 'exp-4']);
  assert.match(flow(dir, ['done', 'exp-4']).stdout, /exp-1 has no line for exp-4 in its ## Tasks/);
});

test('flow ls --label shows one set, and a label is free but plainly spelled', () => {
  const dir = project('tickets-labels');
  flow(dir, ['new', 'Alpha', '--label', 'v1']);
  flow(dir, ['new', 'Beta', '--label', 'v1,post-v1']);
  flow(dir, ['new', 'Gamma']);

  const listed = flow(dir, ['ls', '--label', 'v1']).stdout;
  assert.match(listed, /exp-1/);
  assert.match(listed, /exp-2/);
  assert.doesNotMatch(listed, /exp-3/);
  assert.match(flow(dir, ['ls', '--label', 'never-used']).stdout, /no tickets\./);
  assert.match(flow(dir, ['get', 'exp-2']).stdout, /^labels: +v1, post-v1$/m);

  const bad = flow(dir, ['new', 'Delta', '--label', 'Has Space']);
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /cannot be a label/);
});

test('flow park --label parks every open ticket carrying it, and flow revive brings them back', () => {
  const dir = project('tickets-label-park');
  flow(dir, ['new', 'Later one', '--label', 'post-v1']);
  flow(dir, ['new', 'Later two', '--label', 'post-v1,v2', '--deps', 'exp-1']);
  flow(dir, ['new', 'Now', '--label', 'v1']);
  flow(dir, ['start', 'exp-1']);
  const state = (id) => frontmatter.parse(fs.readFileSync(ticketFile(dir, id), 'utf8')).data;

  const none = flow(dir, ['park', '--label', 'nope', '--reason', 'x']);
  assert.strictEqual(none.code, 0, none.stderr);
  assert.match(none.stdout, /no open ticket carries nope\. Labels in use: post-v1, v1, v2\./);
  assert.strictEqual(flow(dir, ['park', 'exp-3', '--label', 'v1', '--reason', 'x']).code, 1);

  const parked = flow(dir, ['park', '--label', 'post-v1', '--reason', 'after V1 ships']);
  assert.strictEqual(parked.code, 0, parked.stderr);
  assert.match(parked.stdout, /parked 2 tickets labelled post-v1: after V1 ships/);
  assert.deepStrictEqual([state('exp-1').status, state('exp-1').resume], ['parked', 'in-progress']);
  assert.deepStrictEqual([state('exp-2').status, state('exp-2').resume], ['parked', 'todo']);
  assert.strictEqual(state('exp-3').status, 'todo', 'a ticket without the label stays');

  const back = flow(dir, ['revive', '--label', 'post-v1']);
  assert.strictEqual(back.code, 0, back.stderr);
  assert.strictEqual(state('exp-1').status, 'in-progress');
  assert.strictEqual(state('exp-2').status, 'todo');
  assert.strictEqual(state('exp-2').reason || '', '');
});

test('parking a blocked todo ticket works, and starting it still refuses', () => {
  const dir = project('tickets-park-blocked');
  flow(dir, ['new', 'First']);
  flow(dir, ['new', 'Second', '--deps', 'exp-1']);

  assert.strictEqual(flow(dir, ['park', 'exp-2', '--reason', 'later']).code, 0);
  assert.strictEqual(flow(dir, ['todo', 'exp-2']).code, 0);
  assert.strictEqual(flow(dir, ['start', 'exp-2']).code, 1, 'a pickup still meets the dep');
});
