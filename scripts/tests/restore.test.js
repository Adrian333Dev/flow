'use strict';
/**
 * `record-originals.js` and `flow restore`: a setup records every path it is
 * about to change into the place's original, and putting that original back
 * lands on the byte.
 *
 * Every run here targets a scratch root standing in for `~`. A test that
 * reached the real home folder would rewrite this machine. The changes a
 * setup session makes by hand are made here by the test, and
 * `originals.close` stands in for `--finish`, which `setup.test.js` covers.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const logs = require('../lib/logs/logs');
const fs = require('fs');
const path = require('path');
const { project, write, run } = require('./helpers/scratch');
const folders = require('../lib/paths').folders;
const originals = require('../lib/machine/originals');

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
  return run('flow.js', [...args, '--root', root], { cwd: dir, env: { ...process.env, ...env } });
}

/**
 * The paths recorded. Every run checks Flow's prerequisites before it records
 * anything, and `env` is how a test takes one away.
 */
const recordAt = (dir, root, list, env = {}) =>
  run('record-originals.js', [...list, '--root', root], { cwd: dir, env: { ...process.env, ...env } });

/** One place's original, as the manifest on disk. */
const original = (root, proj = null) => originals.read(folders(root), proj);

/** The run `flow install` or `flow init` writes before the session opens. */
function startRun(root, proj = null, type = proj ? 'setup-project' : 'setup-machine') {
  const migration = `${originals.place(proj)}/${originals.stamp(new Date(), '-')}`;
  write(path.join(root, '.flow'), 'run.json', JSON.stringify({ type, ...(proj ? { project: proj } : {}), migration, step: 7 }));
}

/** A setup, as its session runs it: record the file list, make the changes, then finish. */
function setUp(dir, root, proj, list, change) {
  startRun(root, proj);
  const recorded = recordAt(dir, root, list);
  assert.strictEqual(recorded.code, 0, recorded.stderr);
  change();
  originals.close(folders(root), proj);
  fs.rmSync(path.join(root, '.flow', 'run.json'));
}

/** What a small machine holds before any setup. */
function machine(root) {
  write(root, '.claude/CLAUDE.md', 'old rules\n');
  write(root, '.claude/settings.json', '{"old": true}\n');
  write(root, '.claude/projects/-p/memory/a.md', 'memory a\n');
  write(root, '.claude/projects/-p/memory/b.md', 'memory b\n');
  write(root, '.claude/notes.md', 'notes\n');
  fs.mkdirSync(path.join(root, '.local', 'bin'), { recursive: true });
  fs.symlinkSync('/old/clone/flow.js', path.join(root, '.local', 'bin', 'flow'));
}

/** The file list of the machine setup below, as the form would hold it. */
const MACHINE_LIST = [
  '~/.flow/CLAUDE.md',
  '~/.claude/CLAUDE.md',
  '~/.claude/rules/',
  '~/.claude/projects/-p/memory/',
  '~/.claude/notes.md',
  '~/.claude/archive/notes.md',
  '~/.claude/settings.json',
  '~/.local/bin/flow',
];

/** What the machine setup's session changes at go. */
function changeMachine(root) {
  write(root, '.claude/CLAUDE.md', 'new rules\n');
  write(root, '.claude/rules/one.md', 'rule one\n');
  fs.rmSync(path.join(root, '.claude/projects/-p/memory'), { recursive: true });
  fs.mkdirSync(path.join(root, '.claude/archive'));
  fs.renameSync(path.join(root, '.claude/notes.md'), path.join(root, '.claude/archive/notes.md'));
  write(root, '.claude/settings.json', 'new');
  const bin = path.join(root, '.local', 'bin', 'flow');
  fs.rmSync(bin);
  fs.symlinkSync('/new/clone/flow.js', bin);
}

test('a setup records every path in its file list once, and restoring the original puts every path back', () => {
  const dir = project('original-machine');
  const root = path.join(dir, 'root');
  machine(root);
  const bin = path.join(root, '.local', 'bin', 'flow');

  startRun(root);
  const recorded = recordAt(dir, root, MACHINE_LIST);
  assert.strictEqual(recorded.code, 0, recorded.stderr);
  assert.match(recorded.stdout, /^recorded 7 of 8 paths into \S+originals\/machine\. Left out: 1 inside \S+\.flow\.$/m);
  changeMachine(root);

  // A setup that stopped part way runs the command again, after some changes
  // landed. Each path keeps the copy from before the first change.
  const again = recordAt(dir, root, MACHINE_LIST);
  assert.match(again.stdout, /^recorded 0 of 8 paths .* 7 recorded already\.$/m);

  const manifest = original(root);
  assert.strictEqual(manifest.closed, false, 'the window stays open until --finish');
  assert.deepStrictEqual(manifest.entries.map((e) => [path.relative(root, e.path), e.type]), [
    ['.claude/CLAUDE.md', 'file'],
    ['.claude/rules', 'absent'],
    ['.claude/projects/-p/memory', 'folder'],
    ['.claude/notes.md', 'file'],
    ['.claude/archive', 'absent'],
    ['.claude/settings.json', 'file'],
    ['.local/bin/flow', 'link'],
  ]);
  assert.strictEqual(manifest.entries[6].target, '/old/clone/flow.js', 'a link is a row, never a copy');
  const files = path.join(root, '.flow', 'originals', 'machine', 'files');
  assert.strictEqual(read(path.join(files, root, '.claude/CLAUDE.md')), 'old rules\n', 'the original holds only what was there before');

  // Once closed, the original never grows: a later run records nothing.
  originals.close(folders(root), null);
  const closed = recordAt(dir, root, ['~/.claude/rules/one.md', '~/.claude/new.md']);
  assert.strictEqual(closed.code, 0, closed.stderr);
  assert.match(closed.stdout, /is closed, so nothing was recorded/);
  assert.strictEqual(original(root).entries.length, 7);

  originals.restore(folders(root), null);
  const restored = JSON.parse(read(logs.historyFile(path.join(root, '.flow'))).trim().split('\n').pop());
  assert.deepStrictEqual([restored.type, restored.paths, restored.project], ['restore', 7, undefined]);
  assert.strictEqual(read(path.join(root, '.claude/CLAUDE.md')), 'old rules\n');
  assert.ok(!exists(path.join(root, '.claude/rules')), 'what the setup created is removed');
  assert.strictEqual(read(path.join(root, '.claude/projects/-p/memory/b.md')), 'memory b\n');
  assert.strictEqual(read(path.join(root, '.claude/notes.md')), 'notes\n');
  assert.ok(!exists(path.join(root, '.claude/archive')), 'and so is the folder it made to hold them');
  assert.strictEqual(read(path.join(root, '.claude/settings.json')), '{"old": true}\n');
  assert.strictEqual(fs.readlinkSync(bin), '/old/clone/flow.js');

  // The original survives a restore, so the same restore runs again.
  write(root, '.claude/CLAUDE.md', 'changed after the restore\n');
  originals.restore(folders(root), null);
  assert.strictEqual(read(path.join(root, '.claude/CLAUDE.md')), 'old rules\n', 'a second restore lands in the same state');
});

test('record-originals refuses outside a setup, and refuses a path it cannot place, recording nothing', () => {
  const dir = project('original-refusals');
  const root = path.join(dir, 'root');
  machine(root);

  assert.match(recordAt(dir, root, ['~/.claude/notes.md']).stderr, /^record-originals: no setup is running: \S+run\.json names none, so nothing was recorded\.$/m);
  startRun(root, null, 'migrate');
  assert.match(recordAt(dir, root, ['~/.claude/notes.md']).stderr, /no setup is running/, 'an update records nothing');

  startRun(root);
  const relative = recordAt(dir, root, ['~/.claude/CLAUDE.md', 'notes.md']);
  assert.strictEqual(relative.code, 1);
  assert.match(relative.stderr, /"notes\.md" is relative, and a machine setup names no project/);
  assert.match(recordAt(dir, root, ['~/.flow/originals/']).stderr, /holds originals/);
  assert.match(recordAt(dir, root, ['~']).stderr, /holds migrations/, 'the home folder holds the Flow home');
  assert.match(recordAt(dir, root, []).stderr, /^record-originals: usage:/);

  assert.ok(!exists(path.join(root, '.flow/originals')), 'no refusal opened an original');
});

test("a project's first setup opens its own original, and records paths relative to the project", () => {
  const dir = project('original-project');
  const root = path.join(dir, 'root');
  const proj = path.join(root, 'code', 'app');
  write(proj, 'CLAUDE.md', 'old project rules\n');
  write(proj, 'docs/work/one.md', 'one\n');

  const where = originals.place(proj);
  assert.match(where, /^[^-].*-root-code-app$/, 'a project folder is its path, with no leading dash');
  startRun(root, proj);
  const recorded = recordAt(dir, root, ['CLAUDE.md', 'docs/work/', '.flow/tickets/']);
  assert.strictEqual(recorded.code, 0, recorded.stderr);
  assert.match(recorded.stdout, new RegExp(`^recorded 3 of 3 paths into \\S+originals/${where}\\.$`, 'm'));

  write(proj, 'CLAUDE.md', 'rules in Flow\'s layout\n');
  fs.mkdirSync(path.join(proj, '.flow'));
  fs.renameSync(path.join(proj, 'docs/work'), path.join(proj, '.flow/tickets'));

  const opened = original(root, proj);
  assert.strictEqual(opened.closed, false);
  assert.strictEqual(opened.project, proj);
  assert.deepStrictEqual(opened.entries.map((e) => [path.relative(proj, e.path), e.type]), [
    ['CLAUDE.md', 'file'],
    ['docs/work', 'folder'],
    ['.flow', 'absent'],
  ]);

  originals.close(folders(root), proj);
  originals.restore(folders(root), proj);
  const restored = JSON.parse(read(logs.historyFile(path.join(root, '.flow'))).trim().split('\n').pop());
  assert.deepStrictEqual([restored.type, restored.project], ['restore', proj], 'a project restore names the project');
  assert.strictEqual(read(path.join(proj, 'CLAUDE.md')), 'old project rules\n');
  assert.strictEqual(read(path.join(proj, 'docs/work/one.md')), 'one\n');
  assert.ok(!exists(path.join(proj, '.flow')), "restoring a project's original takes its whole .flow/");
});

test('flow restore lists the originals, and refuses to put one back unasked', () => {
  const dir = project('original-locks');
  const root = path.join(dir, 'root');
  machine(root);

  const empty = flowAt(dir, root, ['restore', 'ls']);
  assert.strictEqual(empty.code, 0, empty.stderr);
  assert.match(empty.stdout, /^no original\./);

  setUp(dir, root, null, ['~/.claude/notes.md'], () => fs.rmSync(path.join(root, '.claude/notes.md')));

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
// stops the setup, checked by the last command before the session's first
// change, since a session's own first step can be skipped.
test('a program Flow calls that is not on PATH stops the recording, so the session changes nothing', () => {
  const dir = project('record-prereq');
  const root = path.join(dir, 'root');
  machine(root);
  startRun(root);

  // A PATH holding nothing, so node, git, claude and gh are all missing. The
  // script itself runs through the node that started the test.
  const refused = recordAt(dir, root, ['~/.claude/CLAUDE.md'], { PATH: path.join(dir, 'nothing-here') });
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /4 prerequisites of Flow's are not met, so nothing was recorded:/);
  assert.match(refused.stderr, /git is not on PATH, and a project is found by asking git for its root/);
  assert.match(refused.stderr, /flow doctor --prereq checks the same list/);
  assert.strictEqual(original(root), null, 'the original was never opened');

  assert.strictEqual(recordAt(dir, root, ['~/.claude/CLAUDE.md']).code, 0, 'with the programs back, the same list records');
  assert.strictEqual(original(root).entries.length, 1);
});

test('a restore plans every path first, and marks each one put back that changed since', () => {
  const dir = project('restore-plan');
  const at = folders(path.join(dir, 'root'));
  const proj = path.join(dir, 'root', 'code', 'shop');
  write(proj, '.gitignore', 'node_modules\n');
  write(proj, 'README.md', 'shop\n');

  originals.start(at, proj);
  for (const p of ['CLAUDE.md', '.flow', '.gitignore', 'README.md']) originals.record(at, proj, path.join(proj, p));
  originals.close(at, proj);
  write(proj, 'CLAUDE.md', 'shop rules\n');
  write(proj, '.flow/tickets/1/ticket.md', 'a ticket\n');
  write(proj, 'README.md', 'shop, edited\n');

  assert.deepStrictEqual(originals.plan(at, proj).map((row) => [path.relative(proj, row.path), row.removed, Boolean(row.changed), row.folder]), [
    ['CLAUDE.md', true, false, false],
    ['.flow', true, false, true],
    ['.gitignore', false, false, false],
    ['README.md', false, true, false],
  ]);
});

test('a restore form reads its boxes strictly, and names the first line that is off', () => {
  const form = require('../lib/machine/restore-form');
  const parts = [{ heading: 'x', rows: [{ path: '/a', ticked: true }, { path: '/b', ticked: false }], name: (r) => r.path.slice(1) }];
  const text = form.render(parts);
  assert.match(text, /^- \[x\] `a`: put back\.$/m);
  assert.match(text, /^- \[ \] `b`: put back\.$/m);
  assert.deepStrictEqual([...form.parse(text, parts)], ['/a']);
  assert.deepStrictEqual([...form.parse(text.replace('[ ] `b`', '[X] `b`'), parts)], ['/a', '/b']);

  const fails = (edited, why) => assert.throws(() => form.parse(edited, parts), why);
  fails(text.replace('[x] `a`', '[y] `a`'), /line \d+ has \[y\]\. A box is \[x\] or \[ \]\./);
  fails(text.replace('`b`', '`c`'), /`c` is not a path this form was written with/);
  fails(text.replace(/^- \[ \] `b`.*$/m, ''), /has no box for `b`/);
  fails(`${text}- [x] \`a\`: again\n`, /`a` has a box already/);
  fails(text.replace('- [x] `a`', '- [x] a'), /is not a box/);
});

// The 2 locks refuse every test process, so these run the command in process
// with both taken out. The word is answered here, and `edit` stands in for the
// user changing the form before typing it.
function answering(said, ...answers) {
  const confirm = require('../lib/machine/confirm');
  const kept = { noSessions: confirm.noSessions, word: confirm.word };
  confirm.noSessions = () => {};
  confirm.word = (wanted, lines) => {
    const file = path.join(said.flow, 'restore.md');
    const next = answers.shift();
    said.push({ wanted, lines, form: read(file) });
    if (next && next.edit) fs.writeFileSync(file, next.edit(read(file)));
    return next ? next.word : null;
  };
  return () => Object.assign(confirm, kept);
}

/** A machine and one project, both through their first setups. */
function place(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  write(root, '.claude/notes.md', 'notes\n');
  setUp(dir, root, null, ['~/.claude/notes.md'], () => write(root, '.claude/notes.md', 'Flow\'s notes\n'));
  const proj = path.join(root, 'code', 'shop');
  write(proj, 'CLAUDE.md', 'shop rules\n');
  write(proj, 'AGENTS.md', 'rules for every agent\n');
  write(proj, '.gitignore', 'node_modules\n');
  setUp(dir, root, proj, ['CLAUDE.md', 'AGENTS.md', '.gitignore'], () => {
    write(proj, 'CLAUDE.md', 'rules in Flow\'s layout\n');
    fs.rmSync(path.join(proj, 'AGENTS.md'));
    write(proj, '.gitignore', 'node_modules\n.flow/\n');
  });
  const ticketSkill = (at, id) => write(path.join(at, id), 'SKILL.md', `---\nname: ${id}\n---\n<!-- flow: ticket ${id}, rewritten by flow on every ticket change -->\n`);
  ticketSkill(path.join(root, '.claude', 'skills'), 'home-4');
  ticketSkill(path.join(proj, '.claude', 'skills'), 'exp-47');
  return { root, proj };
}

test('a machine restore hands over one form, and the project keeps its knowledge unless ticked', () => {
  const restore = require('../commands/restore');
  const said = [];

  const plain = place('restore-machine-plain');
  said.flow = path.join(plain.root, '.flow');
  let undo = answering(said, { word: 'restore' });
  try {
    assert.strictEqual(restore.actions.machine.run({ flags: { root: plain.root } }), 0);
  } finally {
    undo();
  }
  const { lines, form } = said[0];
  assert.match(lines[0], /^Wrote \S*restore\.md: one box per path Flow changed on this machine, and shop\.$/);
  assert.match(form, /^## Flow's files in \S*shop$/m);
  assert.match(form, /^- \[x\] `\S*shop\/\.gitignore`: put back\. Changed since setup, so those changes are lost\.$/m);
  assert.match(form, /^- \[ \] `\S*shop\/CLAUDE\.md`: put back\. Changed since setup/m, "the project's knowledge starts unticked");
  assert.match(form, /^- \[x\] `\S*skills\/home-4\/`: deleted\. Flow wrote it to list one of your tickets\.$/m);
  assert.match(form, /^- \[x\] `\S*shop\/AGENTS\.md`: put back\./m, 'an AGENTS.md Flow removed goes back like any other path');
  assert.strictEqual(read(path.join(plain.proj, 'CLAUDE.md')), 'rules in Flow\'s layout\n', 'an unticked path stays as it is now');
  assert.strictEqual(read(path.join(plain.proj, 'AGENTS.md')), 'rules for every agent\n', 'a ticked path goes back');
  assert.strictEqual(read(path.join(plain.proj, '.gitignore')), 'node_modules\n');
  assert.strictEqual(read(path.join(plain.root, '.claude/notes.md')), 'notes\n');
  assert.ok(!exists(path.join(plain.root, '.claude', 'skills', 'home-4')), "the machine's ticket skill is gone");
  assert.ok(!exists(path.join(plain.proj, '.claude')), "the project's ticket skill went, and the folders it left empty");
  assert.ok(!exists(path.join(said.flow, 'restore.md')), 'the form is deleted once read');

  const edited = place('restore-machine-edited');
  said.length = 0;
  said.flow = path.join(edited.root, '.flow');
  undo = answering(said, {
    word: 'restore',
    edit: (text) => text.replace(/- \[ \] (`\S*CLAUDE\.md`)/, '- [x] $1').replace(/- \[x\] (`\S*notes\.md`)/, '- [ ] $1').replace(/- \[x\] (`\S*exp-47\/`)/, '- [ ] $1'),
  });
  try {
    assert.strictEqual(restore.actions.machine.run({ flags: { root: edited.root } }), 0);
  } finally {
    undo();
  }
  assert.strictEqual(read(path.join(edited.proj, 'CLAUDE.md')), 'shop rules\n', 'a ticked knowledge file goes back');
  assert.strictEqual(read(path.join(edited.root, '.claude/notes.md')), 'Flow\'s notes\n', 'an unticked machine path stays');
  assert.ok(exists(path.join(edited.proj, '.claude', 'skills', 'exp-47')), 'an unticked ticket skill stays');

  const broken = place('restore-machine-broken');
  said.length = 0;
  said.flow = path.join(broken.root, '.flow');
  undo = answering(said, { word: 'restore', edit: (text) => text.replace('- [x]', '- [y]') }, { word: 'restore', edit: (text) => text.replace('- [y]', '- [x]') });
  try {
    assert.strictEqual(restore.actions.machine.run({ flags: { root: broken.root } }), 0);
  } finally {
    undo();
  }
  assert.match(said[1].lines[0], /^restore\.md line \d+ has \[y\]\. A box is \[x\] or \[ \]\. Nothing was changed\. Fix the line and save\.$/);
  assert.strictEqual(read(path.join(broken.root, '.claude/notes.md')), 'notes\n', 'once fixed, the same run carries on');

  const refused = place('restore-machine-no');
  said.length = 0;
  said.flow = path.join(refused.root, '.flow');
  undo = answering(said);
  try {
    assert.strictEqual(restore.actions.machine.run({ flags: { root: refused.root } }), 1);
  } finally {
    undo();
  }
  assert.strictEqual(read(path.join(refused.root, '.claude/notes.md')), 'Flow\'s notes\n', 'no word, nothing put back');
  assert.ok(!exists(path.join(said.flow, 'restore.md')));
});

test('a project restore refuses while its ticked .flow/ holds tickets not sent to GitHub', () => {
  const restore = require('../commands/restore');
  const records = require('../lib/tickets/records');
  const { bareRepo } = require('./helpers/scratch');
  const { spawnSync } = require('child_process');
  const dir = project('restore-project-unsent');
  const root = path.join(dir, 'root');
  const at = folders(root);
  const proj = path.join(root, 'code', 'shop');
  const git = (...args) => spawnSync('git', ['-C', proj, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' });
  write(proj, 'README.md', 'shop\n');
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'one');
  git('remote', 'add', 'origin', bareRepo('restore-project-unsent'));
  fs.mkdirSync(at.flow, { recursive: true });

  originals.start(at, proj);
  originals.record(at, proj, path.join(proj, '.flow'));
  originals.close(at, proj);
  assert.ok(records.checkOut(proj).ok);
  write(proj, '.flow/tickets/1/ticket.md', 'a ticket\n');

  const said = [];
  said.flow = at.flow;
  const before = process.env.FLOW_PROJECT;
  process.env.FLOW_PROJECT = proj;
  const undo = answering(said, { word: 'restore' }, { word: 'restore', edit: (text) => text.replace('- [x] `.flow/`', '- [ ] `.flow/`') });
  try {
    assert.throws(() => restore.actions.project.run({ flags: { root } }), /\.flow holds ticket changes not yet sent to GitHub\. Nothing was changed\. Run flow sync inside \S*shop, then try again\./);
    assert.match(said[0].form, /^- \[x\] `\.flow\/`: deleted, with every ticket in it\. Tickets sent to GitHub stay on the project's flow branch\.$/m);
    assert.ok(exists(path.join(proj, '.flow/tickets/1/ticket.md')), 'the ticket is still there');

    assert.strictEqual(restore.actions.project.run({ flags: { root } }), 0, 'unticked, the .flow/ stays and nothing is checked');
    assert.ok(exists(path.join(proj, '.flow/tickets/1/ticket.md')));
  } finally {
    undo();
    if (before === undefined) delete process.env.FLOW_PROJECT;
    else process.env.FLOW_PROJECT = before;
  }
});
