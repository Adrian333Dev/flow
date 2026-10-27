import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, flow, write, run } from '../../shared/testing.ts';

const home = (dir: string) => path.join(dir, 'flow-home');
const own = (dir: string, name = '') => path.join(dir, '.flow', 'findings', name);
const wiki = (dir: string, subject: string, name = '') => path.join(home(dir), 'wiki', subject, 'findings', name);
const listed = (dir: string, query?: string) => JSON.parse(flow(dir, ['findings', ...(query === undefined ? [] : ['--', query]), '--json']).stdout);
const names = (dir: string, query?: string): string[] => listed(dir, query).map((f: { name: string }) => f.name);

// The fw-205 / fw-207 pair the bars were tuned on: one lesson filed twice, 14 minutes apart.
const FIRST = [
  'Edited `types/index.d.ts` and `hooks/register.ts` in `mods/flow-session` (fw-205). `claude plugin test` passed 254 of 254.',
  '`npx --no-install tsc --noEmit -p .` found no `tsc`: the folder has no `node_modules/.bin`.',
  'A type error in a mod edit shows nowhere. Read the diff against the types by hand, and run the real mod once.',
].join('\n\n');
const SECOND_TITLE = 'plugin test runs no typecheck on mod types';
const SECOND = [
  '`claude plugin test` in `mods/flow-session` runs the tests and runs no typecheck. A hook edited against `types/index.d.ts`',
  'can pass 268 tests and still be wrong for the types. fw-207 added a field in the `session.measure` hook, and nothing checked it.',
  'After a mod hook edit that touches a typed event, run a typecheck by hand (`tsc --noEmit`) before calling it done.',
].join(' ');

/** A project holding the first of the pair and a few unrelated findings, as a real folder does. */
function seeded(name: string) {
  const dir = project(name);
  const file = (n: string, body: string) => write(dir, `.flow/findings/${n}.md`, `---\nlabels: [testing]\nupdated: 2026-10-19 10:00\n---\n\n${body}\n`);
  file('mod-has-no-typecheck-plugin-test-only', FIRST);
  file('grep-r-misses-the-linked-tickets-folder', '`.flow/tickets` is a link. `grep -r` does not follow a link it meets while walking, so a search from the repo root never reads a ticket.');
  file('a-bash-cd-moves-the-users-own-shell', 'The Bash tool keeps its working directory between calls, and the user\'s `!` commands run in that same directory.');
  file('pkill-f-kills-its-own-shell', '`pkill -f pattern` matches the shell running it, since the pattern is in its own command line.');
  return dir;
}

test('new refuses a finding with no home, and a title outside 4 to 8 words', () => {
  const dir = project('findings-refuse');
  const none = flow(dir, ['findings', 'new', 'the cache is never cleared']);
  assert.strictEqual(none.code, 1);
  assert.match(none.stderr, /say where the finding belongs/);
  assert.match(none.stderr, /--project exp {3}a fact of this project/);

  assert.match(flow(dir, ['findings', 'new', 'cache never cleared', '-p', 'exp']).stderr, /is 3 words: a finding's title is its claim in 4 to 8 words/);
  assert.match(flow(dir, ['findings', 'new', 'one two three four five six seven eight nine', '-p', 'exp']).stderr, /is 9 words/);
  assert.match(flow(dir, ['findings', 'new', 'the cache is never cleared', '-p', 'exp', '--wiki', 'node']).stderr, /give --wiki or --project, not both/);
  assert.ok(!fs.existsSync(own(dir)), 'no refusal wrote a file');
});

test('new writes the file named for the claim, with labels and updated only', () => {
  const dir = project('findings-new');
  const r = flow(dir, ['findings', 'new', 'The cache is never cleared on restart', '-p', 'exp', '--label', 'cache-life', '--body', 'Seen on 2026-10-27: the cache survives a restart.']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /filed .*\.flow\/findings\/the-cache-is-never-cleared-on-restart\.md/);
  assert.match(r.stdout, /labels in use: cache-life \(1\)/);
  const text = fs.readFileSync(own(dir, 'the-cache-is-never-cleared-on-restart.md'), 'utf8');
  assert.match(text, /^---\nlabels: \[cache-life\]\nupdated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}\n---\n\nSeen on 2026-10-27: the cache survives a restart\.\n$/);

  const again = flow(dir, ['findings', 'new', 'The cache is never cleared on restart', '-p', 'exp', '--force']);
  assert.match(again.stderr, /exists: rewrite it in place/);
});

test('the second of the fw-205 / fw-207 pair is refused, naming the first; --force files it', () => {
  const dir = seeded('findings-duplicate');
  const r = flow(dir, ['findings', 'new', SECOND_TITLE, '-p', 'exp', '--body', SECOND]);
  assert.strictEqual(r.code, 1, r.stdout);
  assert.match(r.stderr, /not filed: a finding says nearly the same/);
  assert.match(r.stderr, /mod-has-no-typecheck-plugin-test-only\.md {3}testing/);
  assert.ok(!fs.existsSync(own(dir, 'plugin-test-runs-no-typecheck-on-mod-types.md')));

  const forced = flow(dir, ['findings', 'new', SECOND_TITLE, '-p', 'exp', '--body', SECOND, '--force']);
  assert.strictEqual(forced.code, 0, forced.stderr);
  assert.match(forced.stdout, /close findings:\n {2}.*mod-has-no-typecheck-plugin-test-only\.md/);
});

test('an unrelated finding files silently', () => {
  const dir = seeded('findings-unrelated');
  const r = flow(dir, ['findings', 'new', 'Safari drops the session cookie after login', '-p', 'exp', '--body', 'A cookie set without SameSite is gone after the OAuth redirect in Safari 18.']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /close findings/);
});

test('a tool fact names the wiki folder that may own it, and --wiki writes a stub index', () => {
  const dir = project('findings-wiki');
  write(home(dir), 'wiki/tmux/index.md', '# tmux\n\nTerminal multiplexer. In use: 3.4.\n');
  const r = flow(dir, ['findings', 'new', 'tmux loses the pane title on detach', '-p', 'home']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /filed .*flow-home\/findings\/tmux-loses-the-pane-title-on-detach\.md/);
  assert.match(r.stdout, /wiki folders that may own it: tmux/);

  const made = flow(dir, ['findings', 'new', 'systemd timers skip a missed run', '--wiki', 'systemd']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.ok(fs.existsSync(wiki(dir, 'systemd', 'systemd-timers-skip-a-missed-run.md')));
  assert.match(fs.readFileSync(path.join(home(dir), 'wiki', 'systemd', 'index.md'), 'utf8'), /^# systemd\n/);
  assert.match(made.stdout, /wrote a stub/);
  assert.doesNotMatch(made.stdout, /may own it/, 'a finding already in the wiki names no folder');
});

test('the list reads this project, home and the wiki; a query narrows by place and label, and words rank', () => {
  const dir = seeded('findings-list');
  write(home(dir), 'findings/the-user-reads-replies-on-a-phone.md', '---\nlabels: [user-preference]\n---\n\nShort lines.\n');
  write(home(dir), 'wiki/node/findings/node-strips-types-from-ts-files.md', 'Node 24 runs a .ts file with type imports only.\n');

  assert.strictEqual(names(dir).length, 6);
  assert.deepStrictEqual(names(dir, 'project:home'), ['the-user-reads-replies-on-a-phone']);
  assert.deepStrictEqual(names(dir, 'wiki:node'), ['node-strips-types-from-ts-files']);
  assert.deepStrictEqual(names(dir, 'wiki:node project:home').sort(), ['node-strips-types-from-ts-files', 'the-user-reads-replies-on-a-phone']);
  assert.deepStrictEqual(names(dir, 'label:user-preference'), ['the-user-reads-replies-on-a-phone']);
  assert.strictEqual(names(dir, 'typecheck mod')[0], 'mod-has-no-typecheck-plugin-test-only');

  const [first] = listed(dir, 'wiki:node');
  assert.deepStrictEqual(Object.keys(first), ['name', 'path', 'wiki', 'labels', 'updated']);
  const text = flow(dir, ['findings', '--', 'label:testing']).stdout.trim().split('\n');
  assert.strictEqual(text.length, 4);
  assert.match(text[0], /\.flow\/findings\/[a-z-]+\.md {3}testing$/);
});

test('edit renames a finding and rewrites its citations; --label sets the labels', () => {
  const dir = seeded('findings-edit');
  write(dir, 'docs/notes.md', 'See `.flow/findings/pkill-f-kills-its-own-shell.md` and pkill-f-kills-its-own-shell.md.\n');
  write(home(dir), 'notes/kill.md', '---\nproject: exp\n---\n\nRead .flow/findings/pkill-f-kills-its-own-shell.md first.\n');

  const r = flow(dir, ['findings', 'edit', 'pkill-f-kills-its-own-shell', '--title', 'pkill -f matches the shell running it', '--label', 'shell-traps']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /renamed pkill-f-kills-its-own-shell → pkill-f-matches-the-shell-running-it/);
  assert.match(r.stdout, /citations rewritten in 2 files/);
  assert.ok(!fs.existsSync(own(dir, 'pkill-f-kills-its-own-shell.md')));
  const moved = fs.readFileSync(own(dir, 'pkill-f-matches-the-shell-running-it.md'), 'utf8');
  assert.match(moved, /^---\nlabels: \[shell-traps\]\nupdated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}\n---\n/);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'docs', 'notes.md'), 'utf8'),
    'See `.flow/findings/pkill-f-matches-the-shell-running-it.md` and pkill-f-matches-the-shell-running-it.md.\n');
  assert.match(fs.readFileSync(path.join(home(dir), 'notes', 'kill.md'), 'utf8'), /pkill-f-matches-the-shell-running-it\.md first/);

  // A label change leaves `updated` alone: it dates the claim.
  assert.strictEqual(flow(dir, ['findings', 'edit', 'grep-r-misses-the-linked-tickets-folder', '--label', 'code-search']).code, 0);
  assert.match(fs.readFileSync(own(dir, 'grep-r-misses-the-linked-tickets-folder.md'), 'utf8'), /labels: \[code-search\]\nupdated: 2026-10-19 10:00\n/);

  assert.match(flow(dir, ['findings', 'edit', 'nothing-here', '--label', 'x']).stderr, /no finding "nothing-here"/);
  assert.match(flow(dir, ['findings', 'edit', 'a-bash-cd-moves-the-users-own-shell']).stderr, /nothing to change/);
});

test('a name 2 findings share is refused without the path, and a rename keeps the namesake\'s citations', () => {
  const dir = seeded('findings-namesake');
  write(home(dir), 'wiki/bash/findings/pkill-f-kills-its-own-shell.md', 'The same lesson, filed for bash.\n');
  write(dir, 'docs/both.md', 'wiki/bash/findings/pkill-f-kills-its-own-shell.md and .flow/findings/pkill-f-kills-its-own-shell.md\n');

  assert.match(flow(dir, ['findings', 'edit', 'pkill-f-kills-its-own-shell', '--label', 'x']).stderr, /2 findings are named pkill-f-kills-its-own-shell: give the path/);
  const r = flow(dir, ['findings', 'edit', own(dir, 'pkill-f-kills-its-own-shell.md'), '--title', 'pkill -f matches the shell running it']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'docs', 'both.md'), 'utf8'),
    'wiki/bash/findings/pkill-f-kills-its-own-shell.md and .flow/findings/pkill-f-matches-the-shell-running-it.md\n');
});

test('the stamp hook sets updated on a finding edited by hand, and leaves other files alone', () => {
  const dir = project('findings-stamp');
  const finding = write(dir, '.flow/findings/hand-written-finding-with-no-header.md', 'The claim.\n');
  const other = write(dir, 'docs/page.md', 'A page.\n');
  const env = { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: home(dir) };
  for (const file of [finding, other]) {
    const r = run('hooks/findings-stamp.ts', [], { input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file } }), env });
    assert.strictEqual(r.code, 0, r.stderr);
  }
  assert.match(fs.readFileSync(finding, 'utf8'), /^---\nupdated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}\n---\n\nThe claim\.\n$/);
  assert.strictEqual(fs.readFileSync(other, 'utf8'), 'A page.\n');
});
