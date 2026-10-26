'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const frontmatter = require('../lib/frontmatter');

const store = require('../lib/tickets/store');

// The files hold bare numbers; a test reads the ids in full, as the commands print them.
const full = (v) => (Array.isArray(v) ? v.map(full) : store.normalizeId(v, 'exp') || v);

const parseFull = (text) => {
  const read = frontmatter.parse(text);
  for (const key of ['id', 'was', 'parent', 'deps']) if (read.data[key]) read.data[key] = full(read.data[key]);
  return read;
};

const ticket = (dir) => {
  const base = path.join(dir, '.flow', 'tickets');
  const folders = fs.readdirSync(base).filter((f) => f !== 'archive');
  const files = folders.map((f) => path.join(base, f, 'ticket.md'));
  return folders.map((f, i) => ({ id: full(store.idOfFolder(f)), folder: f, ...parseFull(fs.readFileSync(files[i], 'utf8')) }));
};

const ticketFile = (dir, id) => {
  const base = path.join(dir, '.flow', 'tickets');
  const archive = path.join(base, 'archive');
  const number = id.match(/\d+$/)[0];
  for (const root of [base, archive]) {
    if (!fs.existsSync(root)) continue;
    const hit = fs.readdirSync(root).find((f) => [id, number].some((x) => f === x || f.startsWith(`${x}-`)));
    if (hit) return path.join(root, hit, 'ticket.md');
  }
  return null;
};

test('flow new with labels and parent, and no type or priority', () => {
  const dir = project('tickets-new-flags');

  const r1 = flow(dir, ['tickets', 'new', 'Set up CI', '--label', 'chore,urgent']);
  assert.strictEqual(r1.code, 0, r1.stderr);
  const [t1] = ticket(dir);
  assert.deepStrictEqual(t1.data.labels, ['chore', 'urgent']);
  assert.strictEqual(t1.data.type, undefined);
  assert.strictEqual(t1.data.priority, undefined);
  assert.strictEqual(t1.data.rank, undefined, 'a new ticket carries no rank');
  assert.notStrictEqual(flow(dir, ['tickets', 'new', 'Typed', '--type', 'chore']).code, 0, '--type is gone');
  assert.notStrictEqual(flow(dir, ['tickets', 'new', 'Prioritised', '--priority', 'high']).code, 0, '--priority is gone');

  const r2 = flow(dir, ['tickets', 'new', 'Lint config', '--parent', t1.id, '--label', 'lint,post-v1']);
  assert.strictEqual(r2.code, 0, r2.stderr);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== t1.id);
  assert.strictEqual(child.data.parent, t1.id);
  assert.deepStrictEqual(child.data.labels, ['lint', 'post-v1']);
  assert.strictEqual(child.folder, String(store.idNumber(child.id)), 'a new ticket\'s folder is its number alone');
  assert.strictEqual(child.data.title, 'lint-config');
  assert.strictEqual(child.data.description, 'Lint config');
});

test('flow new with --body sets the ticket body', () => {
  const dir = project('tickets-new-body');

  const r = flow(dir, ['tickets', 'new', 'Write docs', '--body', 'Cover every flag.']);
  assert.strictEqual(r.code, 0, r.stderr);
  const [t] = ticket(dir);
  assert.match(t.body, /Cover every flag/);
});

test('flow new with --deps validates that each dep exists', () => {
  const dir = project('tickets-new-deps');

  flow(dir, ['tickets', 'new', 'First ticket']);
  const bad = flow(dir, ['tickets', 'new', 'Second ticket', '--deps', 'exp-999']);
  assert.notStrictEqual(bad.code, 0);
  assert.match(bad.stderr, /exp-999/);
});

test('a deleted ticket keeps its number: the counter gives out the next one up', () => {
  const dir = project('tickets-counter-delete');
  flow(dir, ['tickets', 'new', 'First']);
  flow(dir, ['tickets', 'new', 'Second']);
  assert.strictEqual(fs.readFileSync(path.join(dir, '.flow', 'ticket-counter'), 'utf8'), '2\n');

  fs.rmSync(path.dirname(ticketFile(dir, 'exp-2')), { recursive: true });
  const r = flow(dir, ['tickets', 'new', 'Third']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^created exp-3-third$/m);
});

test('a ticket moved away keeps its number in the place it left', () => {
  const dir = project('tickets-counter-move');
  flow(dir, ['tickets', 'new', 'First']);
  flow(dir, ['tickets', 'new', 'Second']);
  const moved = flow(dir, ['tickets', 'move', 'exp-2', 'home']);
  assert.strictEqual(moved.code, 0, moved.stderr);

  assert.match(flow(dir, ['tickets', 'new', 'Third']).stdout, /^created exp-3-third$/m);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'flow-home', 'ticket-counter'), 'utf8'), '1\n');
});

test('a place with no counter starts from its highest ticket', () => {
  const dir = project('tickets-counter-missing');
  flow(dir, ['tickets', 'new', 'First']);
  flow(dir, ['tickets', 'new', 'Second']);
  fs.rmSync(path.join(dir, '.flow', 'ticket-counter'));

  assert.match(flow(dir, ['tickets', 'new', 'Third']).stdout, /^created exp-3-third$/m);
  assert.strictEqual(fs.readFileSync(path.join(dir, '.flow', 'ticket-counter'), 'utf8'), '3\n');
});

test('a folder offers its whole name as the prefix where it fits, else its first 3 letters', () => {
  const store = require('../lib/tickets/store');
  assert.strictEqual(store.offerWord('/code/shop'), 'shop');
  assert.strictEqual(store.offerWord('/code/my-app'), 'myapp');
  assert.strictEqual(store.offerWord('/code/expense-tracker'), 'exp');
  assert.strictEqual(store.offerWord('/code/x1'), 'flow');
  assert.strictEqual(store.offerWord('/code/home'), 'hom', 'a reserved word is stepped round');
  assert.strictEqual(store.offerWord('/code/global'), 'glo');
  assert.strictEqual(store.offerWord('/code/all'), 'flow');
  assert.strictEqual(store.offerWord('/code/here'), 'her');
});

test('home, global, all and here cannot be a prefix, and global names home', () => {
  const store = require('../lib/tickets/store');
  for (const word of ['home', 'global', 'all', 'here']) assert.match(store.badWord(word), /so no project can take it/, word);
  assert.match(store.badWord('global'), /now named "home"/);
  assert.strictEqual(store.badWord('exp'), null);
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

test('flow edit changes title, description and labels', () => {
  const dir = project('tickets-edit');

  flow(dir, ['tickets', 'new', 'Old description']);
  const [t] = ticket(dir);

  flow(dir, ['tickets', 'edit', t.id, '--title', 'new-title']);
  const edited = parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(edited.data.title, 'new-title');
  assert.strictEqual(edited.data.description, 'Old description', 'a rename leaves the description');
  assert.deepStrictEqual(ticket(dir).map((x) => x.folder), [t.folder], 'a rename moves no folder');

  flow(dir, ['tickets', 'edit', t.id, '--description', 'A better sentence']);
  const reworded = parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(reworded.data.description, 'A better sentence');
  assert.strictEqual(reworded.data.title, 'new-title', 'editing the description leaves the title');

  assert.notStrictEqual(flow(dir, ['tickets', 'edit', t.id, '--type', 'chore']).code, 0, '--type is gone');
  assert.notStrictEqual(flow(dir, ['tickets', 'edit', t.id, '--priority', 'low']).code, 0, '--priority is gone');

  const labelsOf = () => parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8')).data.labels || [];
  const r = flow(dir, ['tickets', 'edit', t.id, '--label', 'ui,api']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.deepStrictEqual(labelsOf(), ['ui', 'api']);

  flow(dir, ['tickets', 'edit', t.id, '--label', 'api']);
  assert.deepStrictEqual(labelsOf(), ['api'], 'the list is replaced, never added to');
  flow(dir, ['tickets', 'edit', t.id, '--label', '']);
  assert.deepStrictEqual(labelsOf(), []);
});

test('flow edit --activity sets the kind of work on an in-progress ticket, and any status move clears it', () => {
  const dir = project('tickets-activity');
  flow(dir, ['tickets', 'new', 'Build the widget']);
  const activityOf = () => parseFull(fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8')).data.activity || '';

  const early = flow(dir, ['tickets', 'edit', 'exp-1', '--activity', 'build']);
  assert.strictEqual(early.code, 1, 'a todo ticket has no activity');
  assert.match(early.stderr, /only an in-progress ticket/);

  flow(dir, ['tickets', 'start', 'exp-1']);
  const set = flow(dir, ['tickets', 'edit', 'exp-1', '--activity', 'BUILD']);
  assert.strictEqual(set.code, 0, set.stderr);
  assert.match(set.stdout, /activity: - → build/);
  assert.strictEqual(activityOf(), 'build', 'stored in lowercase');
  assert.match(flow(dir, ['tickets', 'get', 'exp-1']).stdout, /^activity: +build$/m);

  for (const bad of ['two words', 'design1', 'toolongword', 'a-b']) {
    const r = flow(dir, ['tickets', 'edit', 'exp-1', '--activity', bad]);
    assert.strictEqual(r.code, 1, bad);
    assert.match(r.stderr, /cannot be an activity/);
  }
  assert.strictEqual(activityOf(), 'build', 'a refusal changes nothing');

  flow(dir, ['tickets', 'edit', 'exp-1', '--activity', '']);
  assert.strictEqual(activityOf(), '', 'an empty value clears it');
  assert.doesNotMatch(flow(dir, ['tickets', 'get', 'exp-1']).stdout, /^activity:/m);

  flow(dir, ['tickets', 'edit', 'exp-1', '--activity', 'debug']);
  flow(dir, ['tickets', 'park', 'exp-1', '--reason', 'later']);
  assert.strictEqual(activityOf(), '', 'parking clears it');
  flow(dir, ['tickets', 'start', 'exp-1']);
  flow(dir, ['tickets', 'edit', 'exp-1', '--activity', 'proto']);
  flow(dir, ['tickets', 'done', 'exp-1']);
  assert.strictEqual(activityOf(), '', 'done clears it');
});

test('flow start --activity names the work at pickup, also on a ticket already in progress', () => {
  const dir = project('tickets-start-activity');
  flow(dir, ['tickets', 'new', 'Build the widget']);
  const data = () => parseFull(fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8')).data;

  const bad = flow(dir, ['tickets', 'start', 'exp-1', '--activity', 'two words']);
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /cannot be an activity/);
  assert.strictEqual(data().status, 'todo', 'a refused word moves nothing');

  const started = flow(dir, ['tickets', 'start', 'exp-1', '--activity', 'Design']);
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /activity: design/);
  assert.strictEqual(data().status, 'in-progress');
  assert.strictEqual(data().activity, 'design');

  const again = flow(dir, ['tickets', 'start', 'exp-1', '--activity', 'build']);
  assert.strictEqual(again.code, 0, again.stderr);
  assert.match(again.stdout, /already in-progress/);
  assert.strictEqual(data().activity, 'build', 'a resumed ticket takes the new word');

  flow(dir, ['tickets', 'start', 'exp-1']);
  assert.strictEqual(data().activity, 'build', 'a start with no word leaves it');
  flow(dir, ['tickets', 'park', 'exp-1', '--reason', 'later']);
  flow(dir, ['tickets', 'start', 'exp-1']);
  assert.strictEqual(data().activity || '', '', 'a pickup with no word starts clear');
});

test('flow edit --parent detects and refuses a cycle', () => {
  const dir = project('tickets-edit-cycle');

  flow(dir, ['tickets', 'new', 'Parent']);
  const [p] = ticket(dir);
  flow(dir, ['tickets', 'new', 'Child', '--parent', p.id]);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== p.id);

  const r = flow(dir, ['tickets', 'edit', p.id, '--parent', child.id]);
  assert.notStrictEqual(r.code, 0);
  assert.match(r.stderr, /ancestor/);
});

test('flow edit --deps replaces the whole list, and an empty value clears it', () => {
  const dir = project('tickets-dep');

  flow(dir, ['tickets', 'new', 'First']);
  flow(dir, ['tickets', 'new', 'Second']);
  flow(dir, ['tickets', 'new', 'Third']);
  const [t1, t2, t3] = ticket(dir);
  const deps = () => parseFull(fs.readFileSync(ticketFile(dir, t3.id), 'utf8')).data.deps || [];

  const set = flow(dir, ['tickets', 'edit', t3.id, '--deps', `${t1.id},${t2.id}`]);
  assert.strictEqual(set.code, 0, set.stderr);
  assert.match(set.stdout, new RegExp(`deps: \\[\\] → \\[${t1.id}, ${t2.id}\\]`));
  assert.deepStrictEqual(deps(), [t1.id, t2.id]);

  flow(dir, ['tickets', 'edit', t3.id, '--deps', t2.id]);
  assert.deepStrictEqual(deps(), [t2.id], 'the list is replaced, never added to');

  flow(dir, ['tickets', 'edit', t3.id, '--deps', '']);
  assert.deepStrictEqual(deps(), []);

  const missing = flow(dir, ['tickets', 'edit', t3.id, '--deps', 'tst-99']);
  assert.strictEqual(missing.code, 1);
  assert.match(missing.stderr, /--deps names \S+-99, which does not exist\./);
  assert.strictEqual(flow(dir, ['dep', t3.id, '--on', t1.id]).code, 1, 'flow dep is gone');
});

test('flow edit --deps refuses to close a cycle', () => {
  const dir = project('tickets-dep-cycle');

  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  const [a, b] = ticket(dir);

  flow(dir, ['tickets', 'edit', b.id, '--deps', a.id]);
  const r = flow(dir, ['tickets', 'edit', a.id, '--deps', b.id]);
  assert.notStrictEqual(r.code, 0);
  assert.match(r.stderr, /cycle/);
  assert.match(flow(dir, ['tickets', 'edit', a.id, '--deps', a.id]).stderr, /cannot depend on itself/);
});

test('parking stores the resume status, and reviving restores it', () => {
  const dir = project('tickets-park');

  flow(dir, ['tickets', 'new', 'Build the widget']);
  const [t] = ticket(dir);

  flow(dir, ['tickets', 'start', t.id]);
  flow(dir, ['tickets', 'park', t.id, '--reason', 'waiting on API']);

  const parked = parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(parked.data.status, 'parked');
  assert.strictEqual(parked.data.resume, 'in-progress');
  assert.match(parked.data.reason, /waiting on API/);

  flow(dir, ['tickets', 'start', t.id]);
  const revived = parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(revived.data.status, 'in-progress');
  assert.strictEqual(revived.data.reason || '', '');
  assert.strictEqual(revived.data.resume || '', '');
});

test('a field Flow does not know survives a move', () => {
  const dir = project('tickets-unknown-field');

  flow(dir, ['tickets', 'new', 'Build the widget']);
  const [t] = ticket(dir);
  const file = ticketFile(dir, t.id);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^---\n/, '---\nassignee: sam\nlabels: [ui, api]\n'));

  flow(dir, ['tickets', 'start', t.id]);
  const moved = parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(moved.data.status, 'in-progress');
  assert.strictEqual(moved.data.assignee, 'sam');
  assert.deepStrictEqual(moved.data.labels, ['ui', 'api']);
});

test('flow done refuses on a parent with open children', () => {
  const dir = project('tickets-done-children');

  flow(dir, ['tickets', 'new', 'Parent feature']);
  const [p] = ticket(dir);
  flow(dir, ['tickets', 'new', 'Child task', '--parent', p.id]);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== p.id);

  flow(dir, ['tickets', 'start', p.id, '--force']);
  const blocked = flow(dir, ['tickets', 'done', p.id]);
  assert.notStrictEqual(blocked.code, 0);
  assert.match(blocked.stderr, /open child/);

  flow(dir, ['tickets', 'start', child.id]);
  flow(dir, ['tickets', 'done', child.id]);
  const ok = flow(dir, ['tickets', 'done', p.id]);
  assert.strictEqual(ok.code, 0, ok.stderr);
});

test('flow tickets get says a parent with open children is blocked on them, and ready once they close', () => {
  const dir = project('tickets-get-children');
  flow(dir, ['tickets', 'new', 'Parent feature']);
  const [p] = ticket(dir);
  flow(dir, ['tickets', 'new', 'Child task', '--parent', p.id]);
  const child = ticket(dir).find((t) => t.id !== p.id);

  assert.match(flow(dir, ['tickets', 'get', p.id]).stdout, new RegExp(`blocked: {4}open children come first: ${child.id}\\n`));
  flow(dir, ['tickets', 'start', child.id]);
  flow(dir, ['tickets', 'done', child.id]);
  assert.match(flow(dir, ['tickets', 'get', p.id]).stdout, /ready: {6}yes\n/);
});

test('an unmet dep blocks pickup, and only done unblocks', () => {
  const dir = project('tickets-dep-block');

  flow(dir, ['tickets', 'new', 'Dep target']);
  flow(dir, ['tickets', 'new', 'Blocked ticket']);
  const [t1, t2] = ticket(dir);

  flow(dir, ['tickets', 'edit', t2.id, '--deps', t1.id]);
  const blocked = flow(dir, ['tickets', 'start', t2.id]);
  assert.notStrictEqual(blocked.code, 0);
  assert.match(blocked.stderr, /blocked/);

  flow(dir, ['tickets', 'start', t1.id]);
  const stillBlocked = flow(dir, ['tickets', 'start', t2.id]);
  assert.notStrictEqual(stillBlocked.code, 0, 'a dependency in progress does not clear');
  assert.match(stillBlocked.stderr, /is in-progress/);

  flow(dir, ['tickets', 'done', t1.id]);

  const unblocked = flow(dir, ['tickets', 'start', t2.id]);
  assert.strictEqual(unblocked.code, 0, unblocked.stderr);
});

test('a new ticket with any label starts todo, and says how to pick it up', () => {
  const dir = project('tickets-new-todo');

  for (const label of ['feature', 'bug', 'topic', 'research', 'v1']) {
    const r = flow(dir, ['tickets', 'new', `A ${label}`, '--label', label]);
    assert.strictEqual(r.code, 0, r.stderr);
    assert.match(r.stdout, /pick up with: flow tickets start exp-\d+/);
  }
  for (const t of ticket(dir)) assert.strictEqual(t.data.status, 'todo', `${t.id} should start todo`);
});

test('flow start reopens a done ticket, taking it out of the archive', () => {
  const dir = project('tickets-reopen');

  flow(dir, ['tickets', 'new', 'Finished work']);
  const [t] = ticket(dir);
  flow(dir, ['tickets', 'start', t.id]);
  flow(dir, ['tickets', 'done', t.id]);
  assert.match(ticketFile(dir, t.id), /archive/);

  const r = flow(dir, ['tickets', 'start', t.id]);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.doesNotMatch(ticketFile(dir, t.id), /archive/);
  assert.strictEqual(parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8')).data.status, 'in-progress');
});

test('a parked ticket needs a reason, and comes back by flow todo or flow start', () => {
  const dir = project('tickets-park-back');

  flow(dir, ['tickets', 'new', 'Waits on the vendor']);
  const [t] = ticket(dir);
  const status = () => parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8')).data;

  const bare = flow(dir, ['tickets', 'park', t.id]);
  assert.notStrictEqual(bare.code, 0);
  assert.match(bare.stderr, /reason/);

  flow(dir, ['tickets', 'park', t.id, '--reason', 'vendor ships in Q3']);
  assert.strictEqual(status().status, 'parked');
  assert.strictEqual(status().resume, 'todo');
  assert.match(flow(dir, ['tickets', 'get', t.id]).stdout, /pick up with: flow tickets todo /);

  flow(dir, ['tickets', 'todo', t.id]);
  assert.strictEqual(status().status, 'todo');
  flow(dir, ['tickets', 'start', t.id]);
  flow(dir, ['tickets', 'park', t.id, '--reason', 'blocked again']);
  assert.match(flow(dir, ['tickets', 'get', t.id]).stdout, /pick up with: flow tickets start /);

  assert.strictEqual(flow(dir, ['tickets', 'start', t.id]).code, 0);
  assert.strictEqual(status().status, 'in-progress');
});

test('the commands of the 8 statuses are gone', () => {
  const dir = project('tickets-old-commands');
  flow(dir, ['tickets', 'new', 'Anything']);

  for (const old of ['groundwork', 'plan', 'build', 'review']) {
    assert.notStrictEqual(flow(dir, [old, 'exp-1']).code, 0, `flow ${old} should refuse`);
  }
  assert.strictEqual(parseFull(fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8')).data.status, 'todo');
});

test('flow drop requires --reason, refuses on dependents, --by repairs', () => {
  const dir = project('tickets-drop');

  flow(dir, ['tickets', 'new', 'Will drop']);
  flow(dir, ['tickets', 'new', 'Depends on it']);
  flow(dir, ['tickets', 'new', 'Replacement']);
  const [t1, t2, t3] = ticket(dir);

  flow(dir, ['tickets', 'edit', t2.id, '--deps', t1.id]);

  const noReason = flow(dir, ['tickets', 'drop', t1.id]);
  assert.notStrictEqual(noReason.code, 0);
  assert.match(noReason.stderr, /reason/);

  const hasDeps = flow(dir, ['tickets', 'drop', t1.id, '--reason', 'obsolete']);
  assert.notStrictEqual(hasDeps.code, 0);
  assert.match(hasDeps.stderr, /dependent/);

  const repaired = flow(dir, ['tickets', 'drop', t1.id, '--reason', 'obsolete', '--by', t3.id]);
  assert.strictEqual(repaired.code, 0, repaired.stderr);

  const t2After = parseFull(fs.readFileSync(ticketFile(dir, t2.id), 'utf8'));
  assert.ok(t2After.data.deps.includes(t3.id), `deps should now include ${t3.id}`);
  assert.ok(!t2After.data.deps.includes(t1.id), `deps should no longer include ${t1.id}`);
});

test('flow drop --force cascades to transitive dependents', () => {
  const dir = project('tickets-drop-force');

  flow(dir, ['tickets', 'new', 'Root']);
  flow(dir, ['tickets', 'new', 'Middle']);
  flow(dir, ['tickets', 'new', 'Leaf']);
  const [t1, t2, t3] = ticket(dir);

  flow(dir, ['tickets', 'edit', t2.id, '--deps', t1.id]);
  flow(dir, ['tickets', 'edit', t3.id, '--deps', t2.id]);

  const r = flow(dir, ['tickets', 'drop', t1.id, '--reason', 'abandoned', '--force']);
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

  flow(dir, ['tickets', 'new', 'Some work']);
  const [t] = ticket(dir);

  flow(dir, ['tickets', 'start', t.id]);
  const r = flow(dir, ['tickets', 'start', t.id]);
  assert.strictEqual(r.code, 0);
  assert.match(r.stdout, /already/);
});

test('flow file stamps a closed ticket, and --force re-stamps', () => {
  const dir = project('tickets-file');

  flow(dir, ['tickets', 'new', 'Done thing']);
  const [t] = ticket(dir);
  flow(dir, ['tickets', 'start', t.id]);
  flow(dir, ['tickets', 'done', t.id]);

  const filed = flow(dir, ['tickets', 'file', t.id]);
  assert.strictEqual(filed.code, 0, filed.stderr);
  const fm1 = parseFull(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.ok(fm1.data.filed, 'filed date should be set');

  const again = flow(dir, ['tickets', 'file', t.id]);
  assert.match(again.stdout, /already filed/);

  const forced = flow(dir, ['tickets', 'file', t.id, '--force']);
  assert.strictEqual(forced.code, 0, forced.stderr);
  assert.match(forced.stdout, /filed/);
});

test('a bare id or a ticket action is no command, and flow tickets get needs an id', () => {
  const dir = project('tickets-needs-id');
  flow(dir, ['tickets', 'new', 'Export the login page']);

  for (const args of [['get', 'exp-1'], ['exp-1'], ['start', 'exp-1']]) {
    const r = flow(dir, args);
    assert.strictEqual(r.code, 1, `flow ${args.join(' ')}`);
    assert.match(r.stderr, new RegExp(`^flow: unknown command "${args[0]}"\\.`));
    assert.match(r.stderr, /flow tickets get <id>/, 'the whole help follows');
  }
  const bare = flow(dir, ['tickets', 'get']);
  assert.strictEqual(bare.code, 1);
  assert.match(bare.stderr, /flow tickets get/);
});

test('flow tickets get still counts the questions of an old ticket\'s map', () => {
  const dir = project('tickets-map-count');

  const created = flow(dir, ['tickets', 'new', 'Split the parser']);
  assert.strictEqual(created.code, 0, created.stderr);
  const [t] = ticket(dir);

  // A new ticket holds no map, so the line stays away until an old one has it.
  const fresh = flow(dir, ['tickets', 'get', t.id]);
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

  const worked = flow(dir, ['tickets', 'get', t.id]);
  assert.strictEqual(worked.code, 0, worked.stderr);
  assert.match(worked.stdout, /^map: +groundwork\/map\.md +2\/4 answered$/m);
});

test('a new ticket is the index and its sections', () => {
  const dir = project('tickets-one-file');

  const r = flow(dir, ['tickets', 'new', 'Split the parser']);
  assert.strictEqual(r.code, 0, r.stderr);
  const [t] = ticket(dir);
  assert.deepStrictEqual(fs.readdirSync(path.join(dir, '.flow', 'tickets', t.folder)).sort(), ['context.md', 'ticket.md']);
  assert.doesNotMatch(r.stdout, /map\.md/);
  assert.match(flow(dir, ['tickets', 'get', t.id]).stdout, /^context: +context\.md +Loose$/m);
});

test('flow tickets get counts ## Questions and ## Tasks, and lists decisions/', () => {
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

  flow(dir, ['tickets', 'new', 'Split the parser', '--body', body]);
  const [t] = ticket(dir);
  write(dir, `.flow/tickets/${t.folder}/decisions/seam.md`, '# Seam\n');
  write(dir, `.flow/tickets/${t.folder}/context.md`, '## 0\n\nThe seam.\n\n## 0.0\n\n## Loose\n');

  const shown = flow(dir, ['tickets', 'get', t.id]).stdout;
  assert.match(shown, /^questions: +1\/2 answered$/m);
  assert.match(shown, /^tasks: +1\/2 done$/m);
  assert.match(shown, /^context: +context\.md +0, 0\.0, Loose$/m);
  assert.match(shown, /^decisions: +decisions\/seam\.md$/m);
});

test('flow done ticks a child\'s line in the parent\'s ## Tasks, and a reopen clears it', () => {
  const dir = project('tickets-tick');
  const tasks = ['## Tasks', '', '- [ ] exp-2: First child', '- [ ] **exp-3**: Second child, after exp-2'].join('\n');
  flow(dir, ['tickets', 'new', 'Parent', '--body', tasks]);
  flow(dir, ['tickets', 'new', 'First child', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Second child', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Third child', '--parent', 'exp-1']);
  const parent = () => fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8');

  flow(dir, ['tickets', 'start', 'exp-2']);
  const done = flow(dir, ['tickets', 'done', 'exp-2']);
  assert.match(done.stdout, /ticked in exp-1's ## Tasks/);
  assert.match(parent(), /- \[x\] exp-2: First child/);
  assert.match(parent(), /- \[ \] \*\*exp-3\*\*/, 'a mention of exp-2 on another line ticks nothing');

  flow(dir, ['tickets', 'start', 'exp-3']);
  flow(dir, ['tickets', 'done', 'exp-3']);
  assert.match(parent(), /- \[x\] \*\*exp-3\*\*/);

  assert.match(flow(dir, ['tickets', 'start', 'exp-2']).stdout, /cleared in exp-1's ## Tasks/);
  assert.match(parent(), /- \[ \] exp-2: First child/);

  flow(dir, ['tickets', 'start', 'exp-4']);
  assert.match(flow(dir, ['tickets', 'done', 'exp-4']).stdout, /exp-1 has no line for exp-4 in its ## Tasks/);
});

test('flow ls "label:…" shows one set, and a label is free but plainly spelled', () => {
  const dir = project('tickets-labels');
  flow(dir, ['tickets', 'new', 'Alpha', '--label', 'v1']);
  flow(dir, ['tickets', 'new', 'Beta', '--label', 'v1,post-v1']);
  flow(dir, ['tickets', 'new', 'Gamma']);

  const listed = flow(dir, ['tickets', '--', 'label:v1']).stdout;
  assert.match(listed, /exp-1/);
  assert.match(listed, /exp-2/);
  assert.doesNotMatch(listed, /exp-3/);
  assert.match(flow(dir, ['tickets', '--', 'label:never-used']).stdout, /no tickets\./);
  assert.match(flow(dir, ['tickets', 'get', 'exp-2']).stdout, /^labels: +v1, post-v1$/m);

  const bad = flow(dir, ['tickets', 'new', 'Delta', '--label', 'Has Space']);
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /cannot be a label/);
});

test('park takes one ticket, and revive is no command: moving a label\'s tickets waits for flow groups', () => {
  const dir = project('tickets-label-park');
  flow(dir, ['tickets', 'new', 'Later one', '--label', 'post-v1']);

  const byLabel = flow(dir, ['tickets', 'park', '--label', 'post-v1', '--reason', 'x']);
  assert.strictEqual(byLabel.code, 1);
  assert.match(byLabel.stderr, /unknown flag "--label"/);
  assert.strictEqual(flow(dir, ['tickets', 'revive', '--label', 'post-v1']).code, 1);
  assert.strictEqual(parseFull(fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8')).data.status, 'todo');
});

test('flow new cuts the title from the description', () => {
  const dir = project('tickets-title-cut');

  const colon = flow(dir, ['tickets', 'new', "Safari's cookie lost: the session cookie is gone after login"]);
  assert.match(colon.stdout, /^created exp-1-safaris-cookie-lost$/m);
  const plain = flow(dir, ['tickets', 'new', 'Export the login page to a CSV file']);
  assert.match(plain.stdout, /^created exp-2-export-the-login-page$/m);
  const long = flow(dir, ['tickets', 'new', 'Reconfigure internationalisation infrastructure provisioning: details']);
  assert.match(long.stdout, /^created exp-3-reconfigure-internationalisation$/m);
  const none = flow(dir, ['tickets', 'new', '!!!']);
  assert.strictEqual(none.code, 1);
  assert.match(none.stderr, /cannot be a title/);
});

test('new takes the description alone, edit refuses a title that is not hyphenated words, and a rename never moves the folder', () => {
  const dir = project('tickets-title');

  const titled = flow(dir, ['tickets', 'new', 'Export the login page', '--title', 'login-export']);
  assert.strictEqual(titled.code, 1);
  assert.match(titled.stderr, /unknown flag "--title"/);
  const loose = flow(dir, ['tickets', 'new', 'Export', 'the', 'login', 'page']);
  assert.strictEqual(loose.code, 1, 'loose words are a description the shell split');
  assert.ok(!fs.existsSync(path.join(dir, '.flow', 'tickets')), 'a refusal makes no ticket');

  const made = flow(dir, ['tickets', 'new', 'Export the login page']);
  assert.match(made.stdout, /^created exp-1-export-the-login-page$/m);
  assert.match(made.stdout, /tickets\/1\/ticket\.md/);

  flow(dir, ['tickets', 'edit', 'exp-1', '--title', 'login-csv']);
  assert.strictEqual(flow(dir, ['tickets', 'edit', 'exp-1', '--title', 'Bad Title']).code, 1);
  assert.deepStrictEqual(ticket(dir).map((t) => t.folder), ['1']);
  assert.match(flow(dir, ['tickets']).stdout, /exp-1-login-csv/);
});

test('flow tickets get reads only the id part of what is typed, and flow ls finds a ticket by its words', () => {
  const dir = project('tickets-lookup');
  flow(dir, ['tickets', 'new', 'Export the login page']);
  flow(dir, ['tickets', 'new', 'Something else']);

  assert.match(flow(dir, ['tickets', 'get', 'exp-1-an-old-name']).stdout, /^exp-1-export-the-login-page$/m);
  assert.match(flow(dir, ['tickets', 'get', 'EXP-1-login-export']).stdout, /^exp-1-export-the-login-page$/m);
  assert.match(flow(dir, ['tickets', '--', 'sentence login']).stdout, /no tickets/);
  assert.match(flow(dir, ['tickets', '--', 'export page']).stdout, /exp-1-export-the-login-page/, 'a word of the description finds it');
});

test('parking a blocked todo ticket works, and starting it still refuses', () => {
  const dir = project('tickets-park-blocked');
  flow(dir, ['tickets', 'new', 'First']);
  flow(dir, ['tickets', 'new', 'Second', '--deps', 'exp-1']);

  assert.strictEqual(flow(dir, ['tickets', 'park', 'exp-2', '--reason', 'later']).code, 0);
  assert.strictEqual(flow(dir, ['tickets', 'todo', 'exp-2']).code, 0);
  assert.strictEqual(flow(dir, ['tickets', 'start', 'exp-2']).code, 1, 'a pickup still meets the dep');
});

test('a ticket is stored without its prefix: folder, id, parent and deps hold the number', () => {
  const dir = project('tickets-bare');
  flow(dir, ['tickets', 'new', 'Parent']);
  flow(dir, ['tickets', 'new', 'Child', '--parent', 'exp-1', '--deps', 'exp-1']);

  const file = path.join(dir, '.flow', 'tickets', '2', 'ticket.md');
  const raw = frontmatter.parse(fs.readFileSync(file, 'utf8')).data;
  assert.strictEqual(raw.id, '2');
  assert.strictEqual(raw.parent, '1');
  assert.deepStrictEqual(raw.deps, ['1']);
  assert.match(fs.readFileSync(file, 'utf8'), /^id: 2$/m, 'a number is written bare, never quoted');
  assert.match(flow(dir, ['tickets', 'get', 'exp-2']).stdout, /^exp-2-child$/m, 'the commands still print the full id');
});

test('a ticket whose files still hold the project word is read, and the next write stores it bare', () => {
  const dir = project('tickets-old-form');
  write(dir, '.flow/tickets/exp-1-parser/ticket.md', '---\nid: exp-1\ntitle: parser\nstatus: todo\n---\n\nbody\n');
  write(dir, '.flow/tickets/exp-2/ticket.md', '---\nid: exp-2\ntitle: tests\nstatus: todo\nparent: exp-1\ndeps: [exp-1]\n---\n\nbody\n');

  assert.match(flow(dir, ['tickets', 'get', 'exp-2']).stdout, /^exp-2-tests$/m);
  assert.strictEqual(flow(dir, ['tickets', 'edit', 'exp-2', '--title', 'parser-tests']).code, 0);
  const raw = frontmatter.parse(fs.readFileSync(path.join(dir, '.flow', 'tickets', 'exp-2', 'ticket.md'), 'utf8')).data;
  assert.deepStrictEqual([raw.id, raw.parent, raw.deps], ['2', '1', ['1']]);
});

test('a project that changes its prefix keeps every ticket, tick-off and dependency', () => {
  const dir = project('tickets-prefix-change');
  flow(dir, ['tickets', 'new', 'Parent']);
  flow(dir, ['tickets', 'new', 'First', '--parent', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Second', '--parent', 'exp-1', '--deps', 'exp-2']);
  const parentFile = path.join(dir, '.flow', 'tickets', '1', 'ticket.md');
  fs.appendFileSync(parentFile, '\n## Tasks\n\n- [ ] exp-2: First\n- [ ] exp-3: Second\n');
  write(dir, '.flow/settings.json', '{\n  "ticketPrefix": "abc"\n}\n');

  const listed = flow(dir, ['tickets']).stdout;
  for (const id of ['abc-1', 'abc-2', 'abc-3']) assert.match(listed, new RegExp(id), `${id} is listed`);
  assert.match(flow(dir, ['tickets', 'get', 'abc-3']).stdout, /deps:\s+abc-2/, 'the dependency follows the new word');
  assert.strictEqual(flow(dir, ['tickets', 'start', 'abc-3']).code, 1, 'abc-3 still waits for abc-2');

  assert.strictEqual(flow(dir, ['tickets', 'start', 'abc-2']).code, 0);
  const done = flow(dir, ['tickets', 'done', 'abc-2']);
  assert.match(done.stdout, /ticked in abc-1's ## Tasks/, 'the old word on the line is ignored');
  assert.match(fs.readFileSync(parentFile, 'utf8'), /- \[x\] exp-2: First/);
  assert.strictEqual(flow(dir, ['tickets', 'start', 'abc-3']).code, 0, 'the dependency is met');
});
