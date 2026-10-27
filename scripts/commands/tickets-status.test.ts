import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, flow } from '../shared/testing.ts';
import * as frontmatter from '../shared/frontmatter.ts';
import { parseFull, ticket, ticketFile } from '../features/tickets/testing.ts';

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

test('flow done refuses on a parent with open children', () => {
  const dir = project('tickets-done-children');

  flow(dir, ['tickets', 'new', 'Parent feature']);
  const [p] = ticket(dir);
  flow(dir, ['tickets', 'new', 'Child task', '--parent', p.id]);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== p.id)!;

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
  const child = ticket(dir).find((t) => t.id !== p.id)!;

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

test('park takes one ticket, and revive is no command: moving a label\'s tickets waits for flow groups', () => {
  const dir = project('tickets-label-park');
  flow(dir, ['tickets', 'new', 'Later one', '--label', 'post-v1']);

  const byLabel = flow(dir, ['tickets', 'park', '--label', 'post-v1', '--reason', 'x']);
  assert.strictEqual(byLabel.code, 1);
  assert.match(byLabel.stderr, /unknown flag "--label"/);
  assert.strictEqual(flow(dir, ['tickets', 'revive', '--label', 'post-v1']).code, 1);
  assert.strictEqual(parseFull(fs.readFileSync(ticketFile(dir, 'exp-1'), 'utf8')).data.status, 'todo');
});

test('parking a blocked todo ticket works, and starting it still refuses', () => {
  const dir = project('tickets-park-blocked');
  flow(dir, ['tickets', 'new', 'First']);
  flow(dir, ['tickets', 'new', 'Second', '--deps', 'exp-1']);

  assert.strictEqual(flow(dir, ['tickets', 'park', 'exp-2', '--reason', 'later']).code, 0);
  assert.strictEqual(flow(dir, ['tickets', 'todo', 'exp-2']).code, 0);
  assert.strictEqual(flow(dir, ['tickets', 'start', 'exp-2']).code, 1, 'a pickup still meets the dep');
});

