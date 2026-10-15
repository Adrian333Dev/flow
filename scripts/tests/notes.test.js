'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { project, flow, SCRIPTS } = require('./helpers/scratch');

// Every project's notes share the Flow home's folder: in a test, `flow-home/` of the scratch project.
const notesOf = (dir) => path.join(dir, 'flow-home', 'notes');
const listed = (dir, ...args) => JSON.parse(flow(dir, ['notes', ...args]).stdout);
const names = (dir, ...args) => listed(dir, ...args).map((n) => n.name);
const skillsOf = (dir) => path.join(dir, '.claude', 'skills');

// Notes are listed newest change first, and the file clock is only so fine.
const settle = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);

test('flow note creates a file named for its words, and flow notes prints it as JSON', () => {
  const dir = project('notes-create');
  const made = flow(dir, ['note', 'try', 'X', 'in', 'the', 'board', '--label', 'board']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /created try-x-in-the-board/);

  assert.deepStrictEqual(fs.readdirSync(notesOf(dir)), ['try-x-in-the-board.md']);
  const file = fs.readFileSync(path.join(notesOf(dir), 'try-x-in-the-board.md'), 'utf8');
  assert.match(file, /^---\ndate: \d{4}-\d{2}-\d{2}\nlabels: \[board\]\nproject: notes-create\n---\n\ntry X in the board\n$/);

  const [note] = listed(dir);
  assert.deepStrictEqual(Object.keys(note), ['name', 'title', 'date', 'project', 'labels', 'path', 'text']);
  assert.strictEqual(note.name, 'try-x-in-the-board');
  assert.strictEqual(note.title, 'try X in the board');
  assert.strictEqual(note.project, 'notes-create');
  assert.strictEqual(note.path, path.join(notesOf(dir), 'try-x-in-the-board.md'));
  assert.deepStrictEqual(note.labels, ['board']);
  assert.strictEqual(note.text, 'try X in the board');
});

test('flow note with no text prints usage, and flow notes new takes quoted text', () => {
  const dir = project('notes-usage');
  const none = flow(dir, ['note']);
  assert.strictEqual(none.code, 1);
  assert.match(none.stderr, /usage: flow note/);

  assert.strictEqual(flow(dir, ['notes', 'new', 'Second: with a colon']).code, 0);
  assert.strictEqual(listed(dir)[0].text, 'Second: with a colon');
});

test('the title is the words before a colon, else the first line', () => {
  const dir = project('notes-title');
  const long = 'The board gets a notes page with a full editor, create, edit, delete and insert: into the prompt';
  flow(dir, ['notes', 'new', 'Board notes page: the board gets a notes page']);
  flow(dir, ['notes', 'new', 'Short title\n\nThe body starts here: with its own colon.']);
  flow(dir, ['notes', 'new', long]);
  flow(dir, ['notes', 'new', 'see https://example.com/page for the idea']);

  const byText = Object.fromEntries(listed(dir).map((n) => [n.text.slice(0, 12), n]));
  assert.strictEqual(byText['Board notes '].title, 'Board notes page');
  assert.strictEqual(byText['Short title\n'].title, 'Short title');
  assert.strictEqual(byText['The board ge'].title, long, 'a colon past 60 characters belongs to the sentence');
  assert.strictEqual(byText['see https://'].title, 'see https://example.com/page for the idea', 'a colon not followed by a space is not a split');

  assert.deepStrictEqual(names(dir).sort(), [
    'board-notes-page',
    'see-https-example-com-page-for-the-idea',
    'short-title',
    'the-board-gets-a-notes-page-with-a-full-editor',
  ]);
});

test('a second note with the same words gets -2, then -3', () => {
  const dir = project('notes-duplicates');
  for (let i = 0; i < 3; i++) assert.strictEqual(flow(dir, ['note', 'cache the parse']).code, 0);
  assert.deepStrictEqual(fs.readdirSync(notesOf(dir)).sort(), ['cache-the-parse-2.md', 'cache-the-parse-3.md', 'cache-the-parse.md']);
});

test('a list shows the newest change first, and a query narrows it', () => {
  const dir = project('notes-query');
  flow(dir, ['note', 'first idea about parsers', '--label', 'parser']);
  settle();
  flow(dir, ['note', 'second idea about the board', '--label', 'board,ui']);
  settle();
  flow(dir, ['note', 'third idea about parsers']);
  assert.deepStrictEqual(names(dir), ['third-idea-about-parsers', 'second-idea-about-the-board', 'first-idea-about-parsers']);

  // Editing the file moves it to the top.
  settle();
  const file = path.join(notesOf(dir), 'first-idea-about-parsers.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8'));
  assert.strictEqual(names(dir)[0], 'first-idea-about-parsers');

  assert.deepStrictEqual(names(dir, 'label:board'), ['second-idea-about-the-board']);
  assert.deepStrictEqual(names(dir, 'label:parser,ui').sort(), ['first-idea-about-parsers', 'second-idea-about-the-board']);
  assert.deepStrictEqual(names(dir, 'parsers').sort(), ['first-idea-about-parsers', 'third-idea-about-parsers']);
  assert.deepStrictEqual(names(dir, 'parsers board'), []);
  assert.deepStrictEqual(names(dir, 'label:parser parsers'), ['first-idea-about-parsers']);
  assert.deepStrictEqual(names(dir, 'UI'), ['second-idea-about-the-board'], 'a word also reads the labels');

  const loose = flow(dir, ['notes', 'parsers', 'board']);
  assert.strictEqual(loose.code, 1);
  assert.match(loose.stderr, /one quoted query/);
});

test('a query reads the project: here and global by default, all or a name on request', () => {
  const dir = project('notes-projects');
  flow(dir, ['note', 'a note of here']);
  flow(dir, ['note', 'a note of nowhere', '--project', 'global']);
  flow(dir, ['note', 'a note of another', '--project', 'other-app']);

  assert.deepStrictEqual(names(dir).sort(), ['a-note-of-here', 'a-note-of-nowhere']);
  assert.deepStrictEqual(names(dir, 'project:all').sort(), ['a-note-of-another', 'a-note-of-here', 'a-note-of-nowhere']);
  assert.deepStrictEqual(names(dir, 'project:other-app'), ['a-note-of-another']);
  assert.deepStrictEqual(names(dir, 'project:here'), ['a-note-of-here']);
  assert.deepStrictEqual(names(dir, 'project:here,other-app').sort(), ['a-note-of-another', 'a-note-of-here']);
  assert.deepStrictEqual(names(dir, 'project:all another'), ['a-note-of-another']);
  assert.deepStrictEqual(names(dir, 'other-app project:all'), ['a-note-of-another'], 'a word reads the project too');

  assert.match(flow(dir, ['note', 'x', '--project', 'all']).stderr, /cannot be a project/);
});

test('outside a project the query still works for global and all', () => {
  const dir = project('notes-outside');
  flow(dir, ['note', 'a note of here']);
  flow(dir, ['note', 'a global one', '--project', 'global']);
  // A folder with no `.flow/` is no Flow project.
  const bare = path.join(dir, 'bare');
  fs.mkdirSync(bare);
  const run = (...args) => JSON.parse(flow(dir, ['notes', ...args], { FLOW_PROJECT: bare }).stdout);
  assert.deepStrictEqual(run('project:all').map((n) => n.name).sort(), ['a-global-one', 'a-note-of-here']);
  assert.deepStrictEqual(run().map((n) => n.name), ['a-global-one'], 'here matches nothing outside a project');
});

test('a note is named by its whole file name or its path', () => {
  const dir = project('notes-refs');
  flow(dir, ['note', 'remember the retry']);
  flow(dir, ['note', 'remember the cache']);

  const whole = flow(dir, ['notes', 'get', 'remember-the-retry']);
  assert.strictEqual(whole.code, 0, whole.stderr);
  assert.match(whole.stdout, /remember-the-retry\.md/);
  assert.match(whole.stdout, /remember the retry/);
  assert.match(flow(dir, ['notes', 'get', 'remember-the-retry.md']).stdout, /remember the retry/);

  const part = flow(dir, ['notes', 'get', 'retry']);
  assert.strictEqual(part.code, 1);
  assert.match(part.stderr, /no note "retry"/);

  const [first] = listed(dir, 'cache');
  assert.match(flow(dir, ['notes', 'get', first.path]).stdout, /remember the cache/);
  assert.match(flow(dir, ['notes', 'get', '/elsewhere/x.md']).stderr, /is not a note/);
});

test('flow notes drop deletes a note', () => {
  const dir = project('notes-drop');
  flow(dir, ['note', 'remember the retry']);
  assert.strictEqual(flow(dir, ['notes', 'drop', 'remember-the-retry']).code, 0);
  assert.deepStrictEqual(listed(dir), []);
  assert.match(flow(dir, ['notes', 'get', 'remember-the-retry']).stderr, /no note/);
});

test('flow notes promote makes a ticket from the note and removes the note', () => {
  const dir = project('notes-promote');
  flow(dir, ['note', 'Cache the parse: it is slow on big files', '--label', 'perf']);
  const r = flow(dir, ['notes', 'promote', 'cache-the-parse']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /promoted cache-the-parse → exp-1/);

  assert.deepStrictEqual(listed(dir), []);
  const ticket = fs.readFileSync(path.join(dir, '.flow', 'tickets', 'exp-1', 'ticket.md'), 'utf8');
  assert.match(ticket, /labels: \[perf\]/);
  assert.match(ticket, /Cache the parse: it is slow on big files/);
});

test('promote refuses a note of another project and says where to run it', () => {
  const dir = project('notes-promote-other');
  flow(dir, ['note', 'Belongs elsewhere', '--project', 'other-app']);
  flow(dir, ['note', 'Belongs nowhere', '--project', 'global']);
  const other = flow(dir, ['notes', 'promote', 'belongs-elsewhere']);
  assert.strictEqual(other.code, 1);
  assert.match(other.stderr, /belongs to other-app, not notes-promote-other: run promote inside other-app/);
  assert.match(flow(dir, ['notes', 'promote', 'belongs-nowhere']).stderr, /run promote in ~\/\.flow/);
  assert.deepStrictEqual(names(dir, 'project:all').sort(), ['belongs-elsewhere', 'belongs-nowhere']);
});

test('a note gets no skill, and a parked ticket keeps its own', () => {
  const dir = project('notes-skills');
  flow(dir, ['note', 'Add a notes page to the board']);
  flow(dir, ['new', 'Parser', '--title', 'parser']);
  flow(dir, ['park', 'exp-1', '--reason', 'waiting']);
  assert.deepStrictEqual(fs.readdirSync(skillsOf(dir)), ['exp-1']);
});

test('a note made in the Flow home is global, and a project lists it', () => {
  const dir = project('notes-home');
  // As FLOW_PROJECT=$HOME names it: the folder whose `.flow/` is the Flow home.
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  fs.mkdirSync(home, { recursive: true });
  // Its own Claude Code folder: the shared one is wiped by other test files running at the same time.
  const claude = path.join(dir, 'claude');
  const r = flow(dir, ['note', 'never write kind', '--label', 'profile'], { FLOW_PROJECT: user, FLOW_HOME: home, CLAUDE_CONFIG_DIR: claude });
  assert.strictEqual(r.code, 0, r.stderr);
  const file = path.join(home, 'notes', 'never-write-kind.md');
  assert.match(fs.readFileSync(file, 'utf8'), /project: global/);
  assert.ok(!fs.existsSync(path.join(claude, 'skills', 'home-note-1')), 'no skill for a note');

  fs.mkdirSync(path.join(dir, 'flow-home', 'notes'), { recursive: true });
  fs.copyFileSync(file, path.join(dir, 'flow-home', 'notes', 'never-write-kind.md'));
  assert.deepStrictEqual(names(dir), ['never-write-kind'], 'a project sees the global notes');
});

test('2 notes created at the same moment both survive, even with the same words', async () => {
  const dir = project('notes-parallel');
  const env = { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: path.join(dir, 'flow-home') };
  const add = (text) => new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(SCRIPTS, 'flow.js'), 'note', text], { cwd: dir, env });
    child.on('close', resolve);
  });
  const codes = await Promise.all([add('from one session'), add('from another session'), add('same words'), add('same words')]);
  assert.deepStrictEqual(codes, [0, 0, 0, 0]);

  const found = listed(dir);
  assert.strictEqual(found.length, 4);
  assert.deepStrictEqual(found.map((n) => n.name).sort(), ['from-another-session', 'from-one-session', 'same-words', 'same-words-2']);
});
