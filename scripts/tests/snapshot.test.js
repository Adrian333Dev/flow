'use strict';
/**
 * `apply-migration.js` and `flow snapshot`: a migration changes only what it
 * names, copies each path before changing it, and restores to the byte.
 *
 * Every run here targets a scratch root standing in for `~`. A test that
 * reached the real home folder would rewrite this machine.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { project, write, run } = require('./helpers/scratch');
const { stamp, place } = require('../flow/lib/snapshots');

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
};

/** `flow` with a scratch root, from a scratch folder. `env` adds to the real one. */
function flowAt(dir, root, args, env = {}) {
  return run('flow/flow.js', [...args, '--root', root], { cwd: dir, env: { ...process.env, ...env } });
}

const applyAt = (dir, root, id) => run('apply-migration.js', [id, '--root', root], { cwd: dir });

/** The snapshot id a run or a restore printed in its restore command. */
const snapshotIn = (text) => text.match(/flow snapshot restore ([\w/-]+)/)[1];

/**
 * A migration folder holding migration.md and the files it writes under
 * files/, named for the time it was written: now, unless `when` says. `where`
 * is `machine` or a project's folder name. Returns its id.
 */
function migration(root, where, text, files = {}, when = new Date()) {
  const id = `${where}/${stamp(when, '-')}`;
  const dir = path.join(root, '.flow', 'migrations', id);
  write(dir, 'migration.md', text);
  for (const [p, body] of Object.entries(files)) write(dir, path.join('files', p), body);
  return id;
}

/** What a small machine holds before any migration. */
function machine(root) {
  write(root, '.agents/AGENTS.md', 'old rules\n');
  write(root, '.claude/settings.json', '{"old": true}\n');
  write(root, '.claude/projects/-p/memory/a.md', 'memory a\n');
  write(root, '.claude/projects/-p/memory/b.md', 'memory b\n');
  write(root, '.claude/notes.md', 'notes\n');
  fs.mkdirSync(path.join(root, '.local', 'bin'), { recursive: true });
  fs.symlinkSync('/old/clone/flow.js', path.join(root, '.local', 'bin', 'flow'));
}

test('a migration changes what it names, and restore puts every path back', () => {
  const dir = project('snapshot-machine');
  const root = path.join(dir, 'root');
  machine(root);
  const bin = path.join(root, '.local', 'bin', 'flow');

  const id = migration(root, 'machine', [
    '---', 'type: setup-machine', '---', '',
    '# The migration', '',
    'Prose between the lines is for the user and is never read.', '',
    '- write ~/.agents/AGENTS.md: Flow\'s rules, your 2 sections kept',
    '- write `~/.claude/rules/`: a folder that did not exist',
    '- delete ~/.claude/projects/-p/memory/: 2 files, carried into the project',
    '- move ~/.claude/notes.md -> ~/.claude/archive/notes.md: out of the way',
    '- run printf new > .claude/settings.json: writes ~/.claude/settings.json',
    '- write ~/.local/bin/flow: the link, pointed at the new clone',
    '',
  ].join('\n'), {
    [path.join(root, '.agents/AGENTS.md')]: 'new rules\n',
    [path.join(root, '.claude/rules/one.md')]: 'rule one\n',
  });
  const newLink = path.join(root, '.flow', 'migrations', id, 'files', root, '.local', 'bin', 'flow');
  fs.mkdirSync(path.dirname(newLink), { recursive: true });
  fs.symlinkSync('/new/clone/flow.js', newLink);

  const applied = applyAt(dir, root, id);
  assert.strictEqual(applied.code, 0, applied.stderr);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'new rules\n');
  assert.strictEqual(read(path.join(root, '.claude/rules/one.md')), 'rule one\n');
  assert.ok(!exists(path.join(root, '.claude/projects/-p/memory')), 'the memory folder is gone');
  assert.strictEqual(read(path.join(root, '.claude/archive/notes.md')), 'notes\n');
  assert.strictEqual(read(path.join(root, '.claude/settings.json')), 'new', 'the command ran from the root');
  assert.strictEqual(fs.readlinkSync(bin), '/new/clone/flow.js');

  const snap = snapshotIn(applied.stdout);
  assert.match(snap, /^machine\//, 'a machine migration snapshots into machine/');
  const manifest = JSON.parse(read(path.join(root, '.flow', 'snapshots', snap, 'manifest.json')));
  assert.strictEqual(manifest.migration, id);
  assert.deepStrictEqual(manifest.entries.map((e) => [path.relative(root, e.path), e.type]), [
    ['.agents/AGENTS.md', 'file'],
    ['.claude/rules', 'absent'],
    ['.claude/projects/-p/memory', 'folder'],
    ['.claude/notes.md', 'file'],
    ['.claude/archive', 'absent'],
    ['.claude/settings.json', 'file'],
    ['.local/bin/flow', 'link'],
  ]);
  assert.strictEqual(manifest.entries[6].target, '/old/clone/flow.js', 'a link is a row, never a copy');
  assert.strictEqual(manifest.applied, 6);
  assert.strictEqual(read(path.join(root, '.flow', 'snapshots', snap, 'files', root, '.agents/AGENTS.md')), 'old rules\n', 'a snapshot holds only the copy from before');

  const again = applyAt(dir, root, id);
  assert.match(again.stderr, /is already applied/, 'an applied migration refuses a second apply');

  const restored = flowAt(dir, root, ['snapshot', 'restore', snap]);
  assert.strictEqual(restored.code, 0, restored.stderr);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'old rules\n');
  assert.ok(!exists(path.join(root, '.claude/rules')), 'what the migration created is removed');
  assert.strictEqual(read(path.join(root, '.claude/projects/-p/memory/b.md')), 'memory b\n');
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n');
  assert.ok(!exists(path.join(root, '.claude/archive')), 'and so is the folder it made to hold them');
  assert.strictEqual(read(path.join(root, '.claude/settings.json')), '{"old": true}\n');
  assert.strictEqual(fs.readlinkSync(bin), '/old/clone/flow.js');

  // The restore took its own snapshot, so undoing it brings the migration back.
  const undoId = snapshotIn(restored.stdout);
  const redo = flowAt(dir, root, ['snapshot', 'restore', undoId]);
  assert.strictEqual(redo.code, 0, redo.stderr);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'new rules\n');
  assert.strictEqual(fs.readlinkSync(bin), '/new/clone/flow.js');
  const redoId = snapshotIn(redo.stdout);

  const listed = flowAt(dir, root, ['snapshot', 'ls', '--all']).stdout.trim().split('\n');
  assert.deepStrictEqual(listed.map((l) => l.split(' ')[0]), [redoId, undoId, snap], 'newest first');
  assert.match(listed[2], new RegExp(`^${snap}\\s+setup-machine\\s+machine\\s+migration ${id}, applied, restored by ${undoId}$`));
  assert.match(listed[1], new RegExp(`^${undoId}\\s+restore\\s+machine\\s+undoes ${snap}, restored by ${redoId}$`));
});

test('a migration with one bad line changes nothing', () => {
  const dir = project('snapshot-refusals');
  const root = path.join(dir, 'root');
  machine(root);
  const attempt = (where, text, files) => applyAt(dir, root, migration(root, where, text, files));

  const missing = attempt('no-new-file', '---\ntype: migrate\n---\n- delete ~/.claude/notes.md: x\n- write ~/.agents/AGENTS.md: x\n');
  assert.notStrictEqual(missing.code, 0);
  assert.match(missing.stderr, /files\/ does not hold/);
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n', 'the delete before it never ran');

  const untyped = attempt('no-type', '- delete ~/.claude/notes.md: x\n');
  assert.match(untyped.stderr, /needs a type/);

  const relative = attempt('relative', '---\ntype: migrate\n---\n- delete notes.md: x\n');
  assert.match(relative.stderr, /relative, and the migration names no project/);

  const own = attempt('own-folder', '---\ntype: migrate\n---\n- delete ~/.flow/: x\n');
  assert.match(own.stderr, /a migration may not touch it/);

  const silent = attempt('no-command-paths', '---\ntype: migrate\n---\n- run rm -rf ~/.claude\n');
  assert.match(silent.stderr, /must name what the command writes/);

  write(root, '.flow/migrations/machine/latest/migration.md', '---\ntype: migrate\n---\n- delete ~/.claude/notes.md: x\n');
  const untimed = applyAt(dir, root, 'machine/latest');
  assert.match(untimed.stderr, /named for the time it was written/);

  assert.ok(!exists(path.join(root, '.flow/snapshots')), 'no refusal took a snapshot');
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n');
});

test('a file changed after the migration was written refuses the whole migration', () => {
  const dir = project('snapshot-out-of-date');
  const root = path.join(dir, 'root');
  machine(root);

  const id = migration(root, 'machine', [
    '---', 'type: migrate', '---',
    '- write ~/.agents/AGENTS.md: x',
    '- delete ~/.claude/projects/-p/memory/: x',
    '- move ~/.claude/notes.md -> ~/.claude/archive/notes.md: x',
    '- run true: writes ~/.claude/settings.json',
    '- write ~/.local/bin/flow: x',
    '',
  ].join('\n'), {
    [path.join(root, '.agents/AGENTS.md')]: 'new rules\n',
    [path.join(root, '.local/bin/flow')]: 'a file this time\n',
  }, new Date(Date.now() - 60 * 60 * 1000));

  const stale = applyAt(dir, root, id);
  assert.notStrictEqual(stale.code, 0);
  const named = stale.stderr.split('\n')
    .filter((l) => /^  [~/]/.test(l))
    .map((l) => path.relative(root, l.trim().replace(/^~/, os.homedir())));
  assert.deepStrictEqual(named, [
    '.agents/AGENTS.md',
    '.claude/projects/-p/memory/a.md',
    '.claude/projects/-p/memory/b.md',
  ], 'every file inside a folder counts; a move, a run and a link do not');
  assert.match(stale.stderr, /^apply-migration: 3 files changed after machine\/\S+ was written, so nothing ran:/);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'old rules\n');
  assert.ok(!exists(path.join(root, '.flow/snapshots')));
});

test('a migration that stops part-way restores what ran, or carries on after a fix', () => {
  const dir = project('snapshot-stopped');
  const root = path.join(dir, 'root');
  const proj = path.join(root, 'code', 'app');
  write(proj, 'CLAUDE.md', 'old project rules\n');
  write(proj, 'docs/work/one.md', 'one\n');

  const where = place(proj);
  assert.match(where, /^[^-].*-root-code-app$/, 'a project folder is its path, with no leading dash');
  const id = migration(root, where, [
    '---', 'type: setup-project', 'project: ~/code/app', '---',
    '- write CLAUDE.md: the import line',
    '- run test -f ready: writes nothing',
    '- move docs/work/ -> .flow/tickets/: the old work, as tickets',
    '',
  ].join('\n'), { [path.join(proj, 'CLAUDE.md')]: '@AGENTS.md\n' });

  const first = applyAt(dir, root, id);
  assert.notStrictEqual(first.code, 0);
  assert.match(first.stderr, /stopped at line 2 of 3/);
  assert.strictEqual(read(path.join(proj, 'CLAUDE.md')), '@AGENTS.md\n', 'line 1 ran');
  assert.ok(exists(path.join(proj, 'docs/work/one.md')), 'line 3 did not');
  const snap = snapshotIn(first.stderr);
  assert.ok(snap.startsWith(`${where}/`), 'the snapshot sits in the same folder name as the migration');

  const inside = flowAt(dir, root, ['snapshot', 'ls'], { FLOW_PROJECT: proj });
  assert.match(inside.stdout, new RegExp(`^${snap}\\s+setup-project\\s+\\S*code/app\\s+migration ${id}, stopped after line 1 of 3$`, 'm'));

  fs.writeFileSync(path.join(proj, 'ready'), '');
  const second = applyAt(dir, root, id);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.strictEqual(snapshotIn(second.stdout), snap, 'the rerun carried on in the same snapshot');
  assert.strictEqual(read(path.join(proj, '.flow/tickets/one.md')), 'one\n');

  const back = flowAt(dir, root, ['snapshot', 'restore', snap]);
  assert.strictEqual(back.code, 0, back.stderr);
  assert.strictEqual(read(path.join(proj, 'CLAUDE.md')), 'old project rules\n');
  assert.strictEqual(read(path.join(proj, 'docs/work/one.md')), 'one\n');
  assert.ok(!exists(path.join(proj, '.flow')));
  assert.ok(snapshotIn(back.stdout).startsWith(`${where}/`), 'the restore sits beside the snapshot it restores');

  const after = applyAt(dir, root, id);
  assert.match(after.stderr, /was applied in \S+, then restored by \S+\. Apply it again with flow snapshot restore /);
});

test('an edited migration refuses to carry on, a restored one starts over, and ls inside a project shows its own', () => {
  const dir = project('snapshot-edited');
  const root = path.join(dir, 'root');
  machine(root);
  const proj = path.join(root, 'code', 'app');
  write(proj, 'CLAUDE.md', 'rules\n');

  const text = '---\ntype: migrate\n---\n- delete ~/.claude/notes.md: x\n- run false: writes nothing\n';
  const id = migration(root, 'machine', text);
  const stopped = applyAt(dir, root, id);
  assert.notStrictEqual(stopped.code, 0);
  const snap = snapshotIn(stopped.stderr);

  const file = path.join(root, '.flow', 'migrations', id, 'migration.md');
  fs.writeFileSync(file, text.replace('- run false: writes nothing\n', ''));
  const edited = applyAt(dir, root, id);
  assert.match(edited.stderr, /migration.md changed after/);

  // The restore puts notes.md back with its old time, so the migration is
  // not out of date, and the run starts over in a new snapshot.
  assert.strictEqual(flowAt(dir, root, ['snapshot', 'restore', snap]).code, 0);
  const fresh = applyAt(dir, root, id);
  assert.strictEqual(fresh.code, 0, fresh.stderr);
  assert.notStrictEqual(snapshotIn(fresh.stdout), snap);
  assert.ok(!exists(path.join(root, '.claude/notes.md')));

  const projectRun = applyAt(dir, root, migration(root, place(proj), '---\ntype: migrate\nproject: ~/code/app\n---\n- delete CLAUDE.md: x\n'));
  assert.strictEqual(projectRun.code, 0, projectRun.stderr);
  const inside = flowAt(dir, root, ['snapshot'], { FLOW_PROJECT: proj });
  assert.match(inside.stdout, /\s+migrate\s+\S+code\/app\s+migration \S+, applied$/m);
  assert.doesNotMatch(inside.stdout, /^machine\//m, 'the machine runs are left out');

  const all = flowAt(dir, root, ['snapshot', 'ls', '--all'], { FLOW_PROJECT: proj });
  assert.match(all.stdout, new RegExp(`^${snap}\\s+migrate\\s+machine\\s+migration ${id}, stopped after line 1 of 2, restored by `, 'm'));
  assert.strictEqual(all.stdout.trim().split('\n').length, 4, '2 machine runs, the restore and the project run');
});
