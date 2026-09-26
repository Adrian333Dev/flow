'use strict';
/**
 * `apply-migration.js` and `flow restore`: a migration changes only what it
 * names, the first setup of a place records what was there before, and putting
 * that original back lands on the byte.
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
const folders = require('../flow/lib/machine').folders;
const originals = require('../flow/lib/originals');

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

/**
 * A migration, applied. Every run checks Flow's prerequisites before it writes
 * anything, and `env` is how a test takes one away.
 */
const applyAt = (dir, root, id, env = {}) =>
  run('apply-migration.js', [id, '--root', root], { cwd: dir, env: { ...process.env, ...env } });

/** One place's original, as the manifest on disk. */
const original = (root, proj = null) => originals.read(folders(root), proj);

/**
 * A migration folder holding migration.md and the files it writes under
 * files/, named for the time it was written: now, unless `when` says. `where`
 * is `machine` or a project's folder name. Returns its id.
 */
function migration(root, where, text, files = {}, when = new Date()) {
  const id = `${where}/${originals.stamp(when, '-')}`;
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

test('the first setup writes the original, and restoring it puts every path back', () => {
  const dir = project('original-machine');
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
  assert.match(applied.stdout, /Put this machine back with flow restore machine$/m);
  const logged = JSON.parse(read(path.join(root, '.flow', 'history.jsonl')).trim().split('\n').pop());
  assert.deepStrictEqual([logged.type, logged.id, logged.lines], ['setup-machine', id, 6]);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'new rules\n');
  assert.strictEqual(read(path.join(root, '.claude/rules/one.md')), 'rule one\n');
  assert.ok(!exists(path.join(root, '.claude/projects/-p/memory')), 'the memory folder is gone');
  assert.strictEqual(read(path.join(root, '.claude/archive/notes.md')), 'notes\n');
  assert.strictEqual(read(path.join(root, '.claude/settings.json')), 'new', 'the command ran from the root');
  assert.strictEqual(fs.readlinkSync(bin), '/new/clone/flow.js');

  const manifest = original(root);
  assert.strictEqual(manifest.closed, true, 'a setup shuts the window on its way out');
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
  const files = path.join(root, '.flow', 'originals', 'machine', 'files');
  assert.strictEqual(read(path.join(files, root, '.agents/AGENTS.md')), 'old rules\n', 'the original holds only what was there before');

  const again = applyAt(dir, root, id);
  assert.match(again.stderr, /is already applied/, 'an applied migration refuses a second apply');

  // Every later migration changes paths and records nothing: the window shut.
  // A folder name keeps whole seconds, so this one takes the next one along.
  const later = migration(root, 'machine', '---\ntype: migrate\n---\n- delete ~/.claude/archive/: tidied away\n', {}, new Date(Date.now() + 2000));
  assert.strictEqual(applyAt(dir, root, later).code, 0);
  assert.ok(!exists(path.join(root, '.claude/archive')));
  assert.strictEqual(original(root).entries.length, 7, 'the original never grows after the first setup');

  originals.restore(folders(root), null);
  const restored = JSON.parse(read(path.join(root, '.flow', 'history.jsonl')).trim().split('\n').pop());
  assert.deepStrictEqual([restored.type, restored.paths, restored.project], ['restore', 7, undefined]);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'old rules\n');
  assert.ok(!exists(path.join(root, '.claude/rules')), 'what the migration created is removed');
  assert.strictEqual(read(path.join(root, '.claude/projects/-p/memory/b.md')), 'memory b\n');
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n');
  assert.ok(!exists(path.join(root, '.claude/archive')), 'and so is the folder it made to hold them');
  assert.strictEqual(read(path.join(root, '.claude/settings.json')), '{"old": true}\n');
  assert.strictEqual(fs.readlinkSync(bin), '/old/clone/flow.js');

  // The original survives a restore, so the same restore runs again.
  write(root, '.agents/AGENTS.md', 'changed after the restore\n');
  originals.restore(folders(root), null);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'old rules\n', 'a second restore lands in the same state');
});

test('a migration with one bad line changes nothing', () => {
  const dir = project('original-refusals');
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

  assert.ok(!exists(path.join(root, '.flow/originals')), 'no refusal opened an original');
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n');
});

test('a file changed after the migration was written refuses the whole migration', () => {
  const dir = project('original-out-of-date');
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
  assert.ok(!exists(path.join(root, '.flow/originals')));
});

test('a project setup opens its own original, stops part-way, and carries on after a fix', () => {
  const dir = project('original-stopped');
  const root = path.join(dir, 'root');
  const proj = path.join(root, 'code', 'app');
  write(proj, 'CLAUDE.md', 'old project rules\n');
  write(proj, 'docs/work/one.md', 'one\n');

  const where = originals.place(proj);
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
  assert.match(first.stderr, new RegExp(`Carry on after a fix: apply-migration.js ${id}`));
  assert.strictEqual(read(path.join(proj, 'CLAUDE.md')), '@AGENTS.md\n', 'line 1 ran');
  assert.ok(exists(path.join(proj, 'docs/work/one.md')), 'line 3 did not');

  const stopped = original(root, proj);
  assert.strictEqual(stopped.closed, false, 'a run that stopped leaves the window open');
  assert.strictEqual(stopped.project, proj);

  fs.writeFileSync(path.join(proj, 'ready'), '');
  const second = applyAt(dir, root, id);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.strictEqual(read(path.join(proj, '.flow/tickets/one.md')), 'one\n');

  const done = original(root, proj);
  assert.strictEqual(done.closed, true);
  assert.deepStrictEqual(done.entries.map((e) => [path.relative(proj, e.path), e.type]), [
    ['CLAUDE.md', 'file'],
    ['docs/work', 'folder'],
    ['.flow', 'absent'],
  ]);

  originals.restore(folders(root), proj);
  const restored = JSON.parse(read(path.join(root, '.flow', 'history.jsonl')).trim().split('\n').pop());
  assert.deepStrictEqual([restored.type, restored.project], ['restore', proj], 'a project restore names the project');
  assert.strictEqual(read(path.join(proj, 'CLAUDE.md')), 'old project rules\n');
  assert.strictEqual(read(path.join(proj, 'docs/work/one.md')), 'one\n');
  assert.ok(!exists(path.join(proj, '.flow')), "restoring a project's original takes its whole .flow/");

  const after = applyAt(dir, root, id);
  assert.match(after.stderr, /is already applied/);
});

test('an edited migration refuses to carry on', () => {
  const dir = project('original-edited');
  const root = path.join(dir, 'root');
  machine(root);

  const text = '---\ntype: migrate\n---\n- delete ~/.claude/notes.md: x\n- run false: writes nothing\n';
  const id = migration(root, 'machine', text);
  const stopped = applyAt(dir, root, id);
  assert.notStrictEqual(stopped.code, 0);
  assert.ok(!exists(path.join(root, '.claude/notes.md')), 'line 1 ran');

  const file = path.join(root, '.flow', 'migrations', id, 'migration.md');
  fs.writeFileSync(file, text.replace('- run false: writes nothing\n', ''));
  const edited = applyAt(dir, root, id);
  assert.match(edited.stderr, /migration.md changed after line 1 of it ran/);

  fs.writeFileSync(file, text);
  const carried = applyAt(dir, root, id);
  assert.match(carried.stderr, /stopped at line 2 of 2/, 'put back as it was, it carries on from where it stopped');
});

test('flow restore lists the originals, and refuses to put one back unasked', () => {
  const dir = project('original-locks');
  const root = path.join(dir, 'root');
  machine(root);

  const empty = flowAt(dir, root, ['restore', 'ls']);
  assert.strictEqual(empty.code, 0, empty.stderr);
  assert.match(empty.stdout, /^no original\./);

  const id = migration(root, 'machine', '---\ntype: setup-machine\n---\n- delete ~/.claude/notes.md: x\n');
  assert.strictEqual(applyAt(dir, root, id).code, 0);

  const listed = flowAt(dir, root, ['restore', 'ls']);
  assert.match(listed.stdout, /^machine {2}1 paths {2}written \d{4}-\d\d-\d\dT\S+ {2}closed$/m);

  // Lock 1 refuses while a session is running, lock 2 where no terminal is
  // attached. A test process has no terminal, so one of the two always fires,
  // and neither ever reaches the files.
  const refused = flowAt(dir, root, ['restore', 'machine']);
  assert.notStrictEqual(refused.code, 0);
  assert.match(refused.stderr, /^flow: (Close these sessions first: |Run this in a terminal, and type restore when it asks\.)/);
  assert.ok(!exists(path.join(root, '.claude/notes.md')), 'nothing was put back');

  const missing = flowAt(dir, root, ['restore', 'project'], { FLOW_PROJECT: path.join(root, 'code', 'app') });
  assert.notStrictEqual(missing.code, 0);
});

// The stop the user asked for on 2026-09-21: a prerequisite that is not met
// stops the run, and the process that writes is where it is enforced, since a
// skill body can be skipped and this cannot.
test('a program Flow calls that is not on PATH stops the migration before anything changes', () => {
  const dir = project('apply-prereq');
  const root = path.join(dir, 'root');
  machine(root);

  const id = migration(root, 'machine', [
    '---', 'type: setup-machine', '---', '',
    '- write ~/.agents/AGENTS.md: the rules',
    '- delete ~/.claude/notes.md: out of the way',
    '',
  ].join('\n'), { [path.join(root, '.agents/AGENTS.md')]: 'new rules\n' });

  // A PATH holding nothing, so node, git and claude are all missing. The
  // script itself runs through the node that started the test.
  const refused = applyAt(dir, root, id, { PATH: path.join(dir, 'nothing-here') });
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /3 prerequisites of Flow's are not met, so nothing ran:/);
  assert.match(refused.stderr, /git is not on PATH, and a project is found by asking git for its root/);
  assert.match(refused.stderr, /flow doctor --prereq checks the same list/);
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'old rules\n', 'the write never happened');
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n', 'and neither did the delete');
  assert.strictEqual(original(root), null, 'the original was never opened either');

  assert.strictEqual(applyAt(dir, root, id).code, 0, 'with the programs back, the same migration goes through');
  assert.strictEqual(read(path.join(root, '.agents/AGENTS.md')), 'new rules\n');
});

// The 2 locks refuse every test process, so this one runs the command in
// process with both taken out, and answers the word itself.
test('a machine restore offers its projects first, and restore takes them all where machine takes one', () => {
  const confirm = require('../flow/lib/confirm');
  const restore = require('../flow/commands/restore');
  const kept = { noSessions: confirm.noSessions, word: confirm.word };
  const said = [];

  function place(name) {
    const dir = project(name);
    const root = path.join(dir, 'root');
    write(root, '.claude/notes.md', 'notes\n');
    const id = migration(root, 'machine', '---\ntype: setup-machine\n---\n- write ~/.claude/notes.md: x\n',
      { [path.join(root, '.claude/notes.md')]: 'Flow\'s notes\n' });
    assert.strictEqual(applyAt(dir, root, id).code, 0);
    const proj = path.join(root, 'code', 'shop');
    write(proj, 'CLAUDE.md', 'shop rules\n');
    const pid = migration(root, originals.place(proj), `---\ntype: setup-project\nproject: ${proj}\n---\n- write CLAUDE.md: x\n`,
      { [path.join(proj, 'CLAUDE.md')]: '@AGENTS.md\n' }, new Date(Date.now() + 1000));
    assert.strictEqual(applyAt(dir, root, pid).code, 0);
    return { root, proj };
  }

  const answering = (answer) => {
    confirm.noSessions = () => {};
    confirm.word = (wanted, lines) => {
      said.push({ wanted, lines });
      return answer;
    };
  };

  try {
    const all = place('restore-machine-all');
    answering('restore');
    assert.strictEqual(restore.actions.machine.run({ flags: { root: all.root } }), 0);
    assert.deepStrictEqual(said[0].wanted, ['restore', 'machine']);
    assert.match(said[0].lines.join('\n'), /Flow is also set up in shop\./);
    assert.strictEqual(read(path.join(all.proj, 'CLAUDE.md')), 'shop rules\n', 'the project went first');
    assert.strictEqual(read(path.join(all.root, '.claude/notes.md')), 'notes\n');

    const alone = place('restore-machine-alone');
    answering('machine');
    assert.strictEqual(restore.actions.machine.run({ flags: { root: alone.root } }), 0);
    assert.strictEqual(read(path.join(alone.proj, 'CLAUDE.md')), '@AGENTS.md\n', 'the project keeps Flow');
    assert.strictEqual(read(path.join(alone.root, '.claude/notes.md')), 'notes\n');

    const refused = place('restore-machine-no');
    answering(null);
    assert.strictEqual(restore.actions.machine.run({ flags: { root: refused.root } }), 1);
    assert.strictEqual(read(path.join(refused.root, '.claude/notes.md')), 'Flow\'s notes\n', 'no word, nothing put back');
  } finally {
    Object.assign(confirm, kept);
  }
});
