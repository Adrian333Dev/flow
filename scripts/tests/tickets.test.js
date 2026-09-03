'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const frontmatter = require('../flow/lib/frontmatter');

const ticket = (dir) => {
  const base = path.join(dir, '.flow', 'tickets');
  const folders = fs.readdirSync(base).filter((f) => f !== 'archive');
  const files = folders.map((f) => path.join(base, f, 'ticket.md'));
  return folders.map((f, i) => ({
    id: f.split('-')[0],
    folder: f,
    ...frontmatter.parse(fs.readFileSync(files[i], 'utf8')),
  }));
};

const ticketFile = (dir, id) => {
  const base = path.join(dir, '.flow', 'tickets');
  const archive = path.join(base, 'archive');
  for (const root of [base, archive]) {
    if (!fs.existsSync(root)) continue;
    const hit = fs.readdirSync(root).find((f) => f.startsWith(id));
    if (hit) return path.join(root, hit, 'ticket.md');
  }
  return null;
};

test('flow new with type, priority, label, and parent', () => {
  const dir = project('tickets-new-flags');

  const r1 = flow(dir, ['new', 'Set up CI', '--type', 'chore', '--priority', 'high']);
  assert.strictEqual(r1.code, 0, r1.stderr);
  const [t1] = ticket(dir);
  assert.strictEqual(t1.data.type, 'chore');
  assert.strictEqual(t1.data.priority, 'high');

  const r2 = flow(dir, ['new', 'Lint config', '--parent', t1.id, '--label', 'lint']);
  assert.strictEqual(r2.code, 0, r2.stderr);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== t1.id);
  assert.strictEqual(child.data.parent, t1.id);
  assert.ok(child.folder.includes('lint'), `folder "${child.folder}" should contain "lint"`);
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
  const bad = flow(dir, ['new', 'Second ticket', '--deps', 't999']);
  assert.notStrictEqual(bad.code, 0);
  assert.match(bad.stderr, /t999/);
});

test('flow new with --from-groundwork moves the folder', () => {
  const dir = project('tickets-from-gw');
  const gwDir = path.join(dir, 'loose-groundwork');
  fs.mkdirSync(gwDir, { recursive: true });
  fs.writeFileSync(path.join(gwDir, 'map.md'), '# Map\nopen questions here\n');

  const r = flow(dir, ['new', 'Parse the config', '--from-groundwork', gwDir]);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.ok(!fs.existsSync(gwDir), 'original folder should be gone');

  const [t] = ticket(dir);
  const mapFile = path.join(dir, '.flow', 'tickets', t.folder, 'groundwork', 'map.md');
  assert.ok(fs.existsSync(mapFile), 'map.md should exist in ticket groundwork');
  assert.match(fs.readFileSync(mapFile, 'utf8'), /open questions/);
});

test('flow edit changes title, type, priority, and label', () => {
  const dir = project('tickets-edit');

  flow(dir, ['new', 'Old title', '--type', 'feature', '--priority', 'high']);
  const [t] = ticket(dir);

  flow(dir, ['edit', t.id, '--title', 'New title', '--type', 'chore', '--priority', 'low']);
  const edited = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(edited.data.title, 'New title');
  assert.strictEqual(edited.data.type, 'chore');
  assert.strictEqual(edited.data.priority, 'low');

  const r = flow(dir, ['edit', t.id, '--label', 'renamed']);
  assert.strictEqual(r.code, 0, r.stderr);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  assert.ok(folders.some((f) => f.includes('renamed')), `a folder should contain "renamed": ${folders}`);
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

test('flow dep --on adds a dependency and --off removes it', () => {
  const dir = project('tickets-dep');

  flow(dir, ['new', 'First']);
  flow(dir, ['new', 'Second']);
  const [t1, t2] = ticket(dir);

  flow(dir, ['dep', t2.id, '--on', t1.id]);
  const after = frontmatter.parse(fs.readFileSync(ticketFile(dir, t2.id), 'utf8'));
  assert.ok(after.data.deps.includes(t1.id), `deps should include ${t1.id}`);

  flow(dir, ['dep', t2.id, '--off', t1.id]);
  const removed = frontmatter.parse(fs.readFileSync(ticketFile(dir, t2.id), 'utf8'));
  assert.ok(!removed.data.deps || !removed.data.deps.includes(t1.id));
});

test('flow dep --on refuses to close a cycle', () => {
  const dir = project('tickets-dep-cycle');

  flow(dir, ['new', 'Alpha']);
  flow(dir, ['new', 'Beta']);
  const [a, b] = ticket(dir);

  flow(dir, ['dep', b.id, '--on', a.id]);
  const r = flow(dir, ['dep', a.id, '--on', b.id]);
  assert.notStrictEqual(r.code, 0);
  assert.match(r.stderr, /cycle/);
});

test('parking stores the resume status, and reviving restores it', () => {
  const dir = project('tickets-park');

  flow(dir, ['new', 'Build the widget', '--type', 'issue']);
  const [t] = ticket(dir);

  flow(dir, ['build', t.id]);
  flow(dir, ['park', t.id, '--reason', 'waiting on API']);

  const parked = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(parked.data.status, 'parked');
  assert.strictEqual(parked.data.resume, 'building');
  assert.match(parked.data.reason, /waiting on API/);

  flow(dir, ['build', t.id]);
  const revived = frontmatter.parse(fs.readFileSync(ticketFile(dir, t.id), 'utf8'));
  assert.strictEqual(revived.data.status, 'building');
  assert.strictEqual(revived.data.reason || '', '');
  assert.strictEqual(revived.data.resume || '', '');
});

test('flow done refuses on a parent with open children', () => {
  const dir = project('tickets-done-children');

  flow(dir, ['new', 'Parent feature']);
  const [p] = ticket(dir);
  flow(dir, ['new', 'Child task', '--parent', p.id, '--type', 'issue']);
  const all = ticket(dir);
  const child = all.find((t) => t.id !== p.id);

  flow(dir, ['build', p.id, '--force']);
  const blocked = flow(dir, ['done', p.id]);
  assert.notStrictEqual(blocked.code, 0);
  assert.match(blocked.stderr, /open child/);

  flow(dir, ['build', child.id]);
  flow(dir, ['done', child.id]);
  const ok = flow(dir, ['done', p.id]);
  assert.strictEqual(ok.code, 0, ok.stderr);
});

test('an unmet dep blocks pickup, and satisfying it unblocks', () => {
  const dir = project('tickets-dep-block');

  flow(dir, ['new', 'Dep target']);
  flow(dir, ['new', 'Blocked ticket']);
  const [t1, t2] = ticket(dir);

  flow(dir, ['dep', t2.id, '--on', t1.id]);
  const blocked = flow(dir, ['groundwork', t2.id]);
  assert.notStrictEqual(blocked.code, 0);
  assert.match(blocked.stderr, /blocked/);

  flow(dir, ['groundwork', t1.id]);
  flow(dir, ['build', t1.id]);
  flow(dir, ['done', t1.id]);

  const unblocked = flow(dir, ['groundwork', t2.id]);
  assert.strictEqual(unblocked.code, 0, unblocked.stderr);
});

test('flow drop requires --reason, refuses on dependents, --by repairs', () => {
  const dir = project('tickets-drop');

  flow(dir, ['new', 'Will drop']);
  flow(dir, ['new', 'Depends on it']);
  flow(dir, ['new', 'Replacement']);
  const [t1, t2, t3] = ticket(dir);

  flow(dir, ['dep', t2.id, '--on', t1.id]);

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

  flow(dir, ['dep', t2.id, '--on', t1.id]);
  flow(dir, ['dep', t3.id, '--on', t2.id]);

  const r = flow(dir, ['drop', t1.id, '--reason', 'abandoned', '--force']);
  assert.strictEqual(r.code, 0, r.stderr);

  for (const id of [t1.id, t2.id, t3.id]) {
    const fm = frontmatter.parse(fs.readFileSync(ticketFile(dir, id), 'utf8'));
    assert.strictEqual(fm.data.status, 'dropped', `${id} should be dropped`);
  }
});

test('moving to the current status is a no-op', () => {
  const dir = project('tickets-noop-move');

  flow(dir, ['new', 'Some work', '--type', 'issue']);
  const [t] = ticket(dir);

  flow(dir, ['build', t.id]);
  const r = flow(dir, ['build', t.id]);
  assert.strictEqual(r.code, 0);
  assert.match(r.stdout, /already/);
});

test('flow file stamps a closed ticket, and --force re-stamps', () => {
  const dir = project('tickets-file');

  flow(dir, ['new', 'Done thing', '--type', 'issue']);
  const [t] = ticket(dir);
  flow(dir, ['build', t.id]);
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
