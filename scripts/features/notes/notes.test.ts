import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { project, flow, write, SCRIPTS } from '../../shared/testing.ts';

// Every project's notes share the Flow home's folder: in a test, `flow-home/` of the scratch project.
const notesOf = (dir) => path.join(dir, 'flow-home', 'notes');

/** A second project with the prefix `bee`, registered in `dir`'s Flow home by its first ticket. */
function other(dir) {
  const bee = project(`${path.basename(dir)}-bee`);
  write(bee, '.flow/settings.json', '{\n  "ticketPrefix": "bee"\n}\n');
  const made = flow(bee, ['tickets', 'new', 'Thing'], { FLOW_HOME: path.join(dir, 'flow-home') });
  assert.strictEqual(made.code, 0, made.stderr);
  return bee;
}
const asked = (query?: string) => (query === undefined ? [] : ['--', query]);
const listed = (dir: string, query?: string) => JSON.parse(flow(dir, ['notes', ...asked(query)]).stdout);
const names = (dir: string, query?: string): string[] => listed(dir, query).map((n: { name: string }) => n.name);

// Notes are listed newest change first. A test sets the file times itself: waiting on the clock failed once in a full run.
const changedAgo = (dir, name, seconds) => {
  const at = new Date(Date.now() - seconds * 1000);
  fs.utimesSync(path.join(notesOf(dir), `${name}.md`), at, at);
};

test('flow note creates a file named for its words, and flow notes prints it as JSON', () => {
  const dir = project('notes-create');
  const made = flow(dir, ['notes', 'new', 'try X in the board', '--label', 'board']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /created try-x-in-the-board/);

  assert.deepStrictEqual(fs.readdirSync(notesOf(dir)), ['try-x-in-the-board.md']);
  const file = fs.readFileSync(path.join(notesOf(dir), 'try-x-in-the-board.md'), 'utf8');
  assert.match(file, /^---\ndate: \d{4}-\d{2}-\d{2}\nlabels: \[board\]\nproject: exp\n---\n\ntry X in the board\n$/);

  const [note] = listed(dir);
  assert.deepStrictEqual(Object.keys(note), ['name', 'title', 'date', 'project', 'labels', 'path', 'text']);
  assert.strictEqual(note.name, 'try-x-in-the-board');
  assert.strictEqual(note.title, 'try X in the board');
  assert.strictEqual(note.project, 'exp', 'a note names its project by prefix');
  assert.strictEqual(note.path, path.join(notesOf(dir), 'try-x-in-the-board.md'));
  assert.deepStrictEqual(note.labels, ['board']);
  assert.strictEqual(note.text, 'try X in the board');
});

test('flow note with no text prints usage, and flow notes new takes quoted text', () => {
  const dir = project('notes-usage');
  const none = flow(dir, ['notes', 'new']);
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
  for (let i = 0; i < 3; i++) assert.strictEqual(flow(dir, ['notes', 'new', 'cache the parse']).code, 0);
  assert.deepStrictEqual(fs.readdirSync(notesOf(dir)).sort(), ['cache-the-parse-2.md', 'cache-the-parse-3.md', 'cache-the-parse.md']);
});

test('a list shows the newest change first, and a query narrows it', () => {
  const dir = project('notes-query');
  flow(dir, ['notes', 'new', 'first idea about parsers', '--label', 'parser']);
  flow(dir, ['notes', 'new', 'second idea about the board', '--label', 'board,ui']);
  flow(dir, ['notes', 'new', 'third idea about parsers']);
  changedAgo(dir, 'first-idea-about-parsers', 30);
  changedAgo(dir, 'second-idea-about-the-board', 20);
  changedAgo(dir, 'third-idea-about-parsers', 10);
  assert.deepStrictEqual(names(dir), ['third-idea-about-parsers', 'second-idea-about-the-board', 'first-idea-about-parsers']);

  // A newer change moves a note to the top.
  changedAgo(dir, 'first-idea-about-parsers', 0);
  assert.strictEqual(names(dir)[0], 'first-idea-about-parsers');

  assert.deepStrictEqual(names(dir, 'label:board'), ['second-idea-about-the-board']);
  assert.deepStrictEqual(names(dir, 'label:parser,ui').sort(), ['first-idea-about-parsers', 'second-idea-about-the-board']);
  assert.deepStrictEqual(names(dir, 'parsers').sort(), ['first-idea-about-parsers', 'third-idea-about-parsers']);
  assert.deepStrictEqual(names(dir, 'parsers board'), []);
  assert.deepStrictEqual(names(dir, 'label:parser parsers'), ['first-idea-about-parsers']);
  assert.deepStrictEqual(names(dir, 'UI'), ['second-idea-about-the-board'], 'a word also reads the labels');

  const loose = flow(dir, ['notes', '--', 'parsers', 'board']);
  assert.strictEqual(loose.code, 1);
  assert.match(loose.stderr, /quote the query: flow notes -- "parsers board"/);

  // A query equal to an action's name still searches once it follows `--`.
  flow(dir, ['notes', 'new', 'a new parser']);
  assert.deepStrictEqual(names(dir, 'new'), ['a-new-parser']);
  const bare = flow(dir, ['notes', 'new']);
  assert.strictEqual(bare.code, 1, 'flow notes new asks for its text');

  const verb = flow(dir, ['notes', 'parsers']);
  assert.strictEqual(verb.code, 1, 'a word after the noun is an action');
  assert.match(verb.stderr, /unknown command "notes parsers"/);
});

test('a query reads the project: here and home by default, all or a prefix on request', () => {
  const dir = project('notes-projects');
  other(dir);
  flow(dir, ['notes', 'new', 'a note of here']);
  flow(dir, ['notes', 'new', 'a note of nowhere', '--project', 'home']);
  flow(dir, ['notes', 'new', 'a note of another', '-p', 'bee']);

  assert.deepStrictEqual(names(dir).sort(), ['a-note-of-here', 'a-note-of-nowhere']);
  assert.deepStrictEqual(names(dir, 'project:all').sort(), ['a-note-of-another', 'a-note-of-here', 'a-note-of-nowhere']);
  assert.deepStrictEqual(names(dir, 'project:bee'), ['a-note-of-another']);
  assert.deepStrictEqual(names(dir, 'project:home'), ['a-note-of-nowhere']);
  assert.deepStrictEqual(names(dir, 'project:here'), ['a-note-of-here']);
  assert.deepStrictEqual(names(dir, 'project:here,bee').sort(), ['a-note-of-another', 'a-note-of-here']);
  assert.deepStrictEqual(names(dir, 'project:all another'), ['a-note-of-another']);
  assert.deepStrictEqual(names(dir, 'bee project:all'), ['a-note-of-another'], 'a word reads the project too');
});

test('a note names its project by prefix: global, a folder name, all and an unknown prefix are refused', () => {
  const dir = project('notes-refuse');
  const bee = other(dir);

  const global = flow(dir, ['notes', 'new', 'x', '--project', 'global']);
  assert.strictEqual(global.code, 1);
  assert.match(global.stderr, /"global" is now named "home"/);

  const folder = flow(dir, ['notes', 'new', 'x', '--project', path.basename(bee)]);
  assert.strictEqual(folder.code, 1);
  assert.match(folder.stderr, /is not a project prefix\. --project takes the prefix of a project/);
  assert.match(folder.stderr, /has the prefix bee/);

  assert.match(flow(dir, ['notes', 'new', 'x', '--project', 'all']).stderr, /is not a project prefix/);
  assert.match(flow(dir, ['notes', 'new', 'x', '--project', 'zzz']).stderr, /no project on this machine has the prefix "zzz"/);
  assert.deepStrictEqual(fs.existsSync(notesOf(dir)) ? fs.readdirSync(notesOf(dir)) : [], [], 'no refusal made a note');

  assert.match(flow(dir, ['notes', '--', 'project:global']).stderr, /"global" is now named "home"/);
  assert.match(flow(dir, ['notes', '--', 'project:my-app']).stderr, /project:my-app is not a project prefix/);
  assert.strictEqual(flow(dir, ['notes', '--', 'project:zzz']).code, 0, 'a prefix this machine does not know still reads: notes travel, the registry does not');
});

test('outside a project the query still works for home and all', () => {
  const dir = project('notes-outside');
  flow(dir, ['notes', 'new', 'a note of here']);
  flow(dir, ['notes', 'new', 'a home one', '--project', 'home']);
  // A folder with no `.flow/` is no Flow project.
  const bare = path.join(dir, 'bare');
  fs.mkdirSync(bare);
  const run = (query?: string) => JSON.parse(flow(dir, ['notes', ...asked(query)], { FLOW_PROJECT: bare }).stdout);
  assert.deepStrictEqual(run('project:all').map((n) => n.name).sort(), ['a-home-one', 'a-note-of-here']);
  assert.deepStrictEqual(run().map((n) => n.name), ['a-home-one'], 'here matches nothing outside a project');
});

test('a note is named by its whole file name or its path', () => {
  const dir = project('notes-refs');
  flow(dir, ['notes', 'new', 'remember the retry']);
  flow(dir, ['notes', 'new', 'remember the cache']);

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
  flow(dir, ['notes', 'new', 'remember the retry']);
  assert.strictEqual(flow(dir, ['notes', 'drop', 'remember-the-retry']).code, 0);
  assert.deepStrictEqual(listed(dir), []);
  assert.match(flow(dir, ['notes', 'get', 'remember-the-retry']).stderr, /no note/);
});

test('flow notes promote makes a ticket from the note and removes the note', () => {
  const dir = project('notes-promote');
  flow(dir, ['notes', 'new', 'Cache the parse: it is slow on big files', '--label', 'perf']);
  const r = flow(dir, ['notes', 'promote', 'cache-the-parse']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /promoted cache-the-parse → exp-1/);

  assert.deepStrictEqual(listed(dir), []);
  const ticket = fs.readFileSync(path.join(dir, '.flow', 'tickets', '1', 'ticket.md'), 'utf8');
  assert.match(ticket, /labels: \[perf\]/);
  assert.match(ticket, /Cache the parse: it is slow on big files/);
});

test('promote refuses a note of another project and says where to run it', () => {
  const dir = project('notes-promote-other');
  other(dir);
  flow(dir, ['notes', 'new', 'Belongs elsewhere', '--project', 'bee']);
  flow(dir, ['notes', 'new', 'Belongs nowhere', '--project', 'home']);
  const refused = flow(dir, ['notes', 'promote', 'belongs-elsewhere']);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /belongs to bee, not exp: run promote inside the project with the prefix bee/);
  assert.match(flow(dir, ['notes', 'promote', 'belongs-nowhere']).stderr, /run promote in ~\/\.flow/);
  assert.deepStrictEqual(names(dir, 'project:all').sort(), ['belongs-elsewhere', 'belongs-nowhere']);
});

test('a note made in the Flow home is home, and a project lists it', () => {
  const dir = project('notes-home');
  // As FLOW_PROJECT=$HOME names it: the folder whose `.flow/` is the Flow home.
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  fs.mkdirSync(home, { recursive: true });
  // Its own Claude Code folder: the shared one is wiped by other test files running at the same time.
  const claude = path.join(dir, 'claude');
  const r = flow(dir, ['notes', 'new', 'never write kind', '--label', 'profile'], { FLOW_PROJECT: user, FLOW_HOME: home, CLAUDE_CONFIG_DIR: claude });
  assert.strictEqual(r.code, 0, r.stderr);
  const file = path.join(home, 'notes', 'never-write-kind.md');
  assert.match(fs.readFileSync(file, 'utf8'), /project: home/);

  fs.mkdirSync(path.join(dir, 'flow-home', 'notes'), { recursive: true });
  fs.copyFileSync(file, path.join(dir, 'flow-home', 'notes', 'never-write-kind.md'));
  assert.deepStrictEqual(names(dir), ['never-write-kind'], 'a project sees the home notes');
});

test('2 notes created at the same moment both survive, even with the same words', async () => {
  const dir = project('notes-parallel');
  const env = { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: path.join(dir, 'flow-home') };
  const add = (text) => new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(SCRIPTS, 'flow.ts'), 'notes', 'new', text], { cwd: dir, env });
    child.on('close', resolve);
  });
  const codes = await Promise.all([add('from one session'), add('from another session'), add('same words'), add('same words')]);
  assert.deepStrictEqual(codes, [0, 0, 0, 0]);

  const found = listed(dir);
  assert.strictEqual(found.length, 4);
  assert.deepStrictEqual(found.map((n) => n.name).sort(), ['from-another-session', 'from-one-session', 'same-words', 'same-words-2']);
});
