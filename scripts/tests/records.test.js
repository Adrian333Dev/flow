'use strict';
/**
 * A project's tickets on the branch `flow`: `flow init` making it and a
 * teammate joining it, a clash on one number, the commits the commands make,
 * `flow move`, a project whose tickets live in the private Flow home, and what
 * a ticket records about the work on it.
 *
 * Every test runs real git against a bare repository standing in for the
 * remote, with 2 clones standing in for 2 people.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SCRATCH, project, setUp, write, run, flow } = require('./helpers/scratch');
const records = require('../flow/lib/records');
const store = require('../flow/lib/store');

/** git in `dir`, with a name to commit under. Returns the trimmed output. */
function git(dir, ...args) {
  const ran = spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd: dir, encoding: 'utf8' });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

/**
 * A remote holding one commit of code, and a machine Flow is set up on.
 * `clone(name)` makes a person's clone of it, and `in(dir)` runs `flow` there.
 */
function team(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const remote = path.join(dir, 'remote.git');
  const home = setUp(path.join(dir, 'flow-home'));
  git(dir, 'init', '--quiet', '--bare', '--initial-branch=main', remote);

  const first = path.join(dir, 'first');
  write(first, 'app.js', 'console.log(1);\n');
  git(first, 'init', '--quiet', '--initial-branch=main');
  git(first, 'add', '-A');
  git(first, 'commit', '--quiet', '-m', 'code');
  git(first, 'push', '--quiet', remote, 'main');

  const env = { ...process.env, FLOW_HOME: home, GIT_CEILING_DIRECTORIES: dir };
  delete env.FLOW_PROJECT;
  const clone = (who) => {
    git(dir, 'clone', '--quiet', remote, who);
    return path.join(dir, who);
  };
  const inside = (cwd, ...args) => run('flow/flow.js', args, { cwd, env });
  // With no terminal to ask in, flow init takes the template over the session.
  const init = (cwd, ...args) => inside(cwd, 'init', ...args);
  return { dir, remote, home, env, clone, in: inside, init };
}

const idsIn = (dir) => fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive').sort();

test('flow init makes the branch flow, and a teammate\'s flow init joins it', () => {
  const t = team('records-init');
  const ana = t.clone('ana');
  const made = t.init(ana, '--prefix', 'exp');
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /a new flow branch, sharing no history with the code/);
  assert.match(made.stdout, /^wrote: AGENTS\.md$/m);

  assert.strictEqual(git(path.join(ana, '.flow'), 'rev-parse', '--abbrev-ref', 'HEAD').out, 'flow');
  assert.ok(!git(ana, 'merge-base', 'main', 'flow').ok, 'no history shared with the code');
  assert.match(fs.readFileSync(path.join(ana, '.gitignore'), 'utf8'), /^\.flow\/$/m);
  assert.strictEqual(git(path.join(ana, '.flow'), 'log', '-1', '--format=%s').out, 'flow init');
  assert.strictEqual(git(ana, 'status', '--porcelain', '--', '.flow').out, '', 'every code branch ignores .flow/');

  assert.ok(records.sync(ana).ok);
  assert.ok(git(t.remote, 'rev-parse', '--verify', 'flow').ok, 'the branch reached the remote');

  const ben = t.clone('ben');
  const joined = t.in(ben, 'init');
  assert.strictEqual(joined.code, 0, joined.stderr);
  assert.match(joined.stdout, /the flow branch someone already made, checked out/);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(ben, '.flow', 'settings.json'), 'utf8')), { ticketPrefix: 'exp' });
});

test('offline, flow new makes no ticket, and gives out no number', () => {
  const t = team('records-offline');
  const ana = t.clone('ana');
  t.init(ana, '--prefix', 'exp');
  records.sync(ana);

  const away = `${t.remote}.away`;
  fs.renameSync(t.remote, away);
  const offline = t.in(ana, 'new', 'Export csv');
  fs.renameSync(away, t.remote);
  assert.strictEqual(offline.code, 1);
  assert.match(offline.stderr, /no ticket was made: the remote did not take it\. git said: fatal: .*does not appear to be a git repository/);
  assert.deepStrictEqual(idsIn(ana), []);
  assert.strictEqual(git(path.join(ana, '.flow'), 'status', '--porcelain').out, '', 'nothing left behind');

  assert.match(t.in(ana, 'new', 'Export csv').stdout, /created exp-1/);
});

test('flow init stops before making anything where the remote refuses a push, and offers --private', () => {
  const t = team('records-refused');
  const ana = t.clone('ana');
  git(ana, 'remote', 'set-url', 'origin', path.join(t.dir, 'nowhere.git'));
  const refused = t.in(ana, 'init', '--prefix', 'exp');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /the remote refuses a push from this clone, .*git said: fatal: /);
  assert.match(refused.stderr, /flow init --private/);
  assert.ok(!fs.existsSync(path.join(ana, '.flow')), 'no .flow/');
  assert.ok(!fs.existsSync(path.join(ana, '.gitignore')), 'no .gitignore line');
  assert.ok(!git(ana, 'rev-parse', '--verify', 'flow').ok, 'no branch');
});

test('2 people taking one number in the same moment: the second is renumbered before anyone sees it', () => {
  const t = team('records-clash');
  const ana = t.clone('ana');
  t.init(ana, '--prefix', 'exp');
  records.sync(ana);
  const ben = t.clone('ben');
  t.in(ben, 'init');

  // Ben's number is taken before Ana's push lands, as when both type flow new at once.
  const mine = store.createTicket(ben, { title: 'Export csv' });
  assert.match(t.in(ana, 'new', 'Login page').stdout, /created exp-1/);
  const claimed = records.claim(ben, mine.id);
  assert.ok(claimed.ok, claimed.why);
  assert.strictEqual(claimed.id, 'exp-2');
  assert.deepStrictEqual(idsIn(ben), ['exp-1-login-page', 'exp-2-export-csv']);
  assert.doesNotMatch(t.in(ben, 'exp-2').stdout, /^was:/m, 'nobody saw exp-1 on it');
});

test('each command that changes a ticket commits it, and flow runs from inside .flow/', () => {
  const t = team('records-commits');
  const ana = t.clone('ana');
  t.init(ana, '--prefix', 'exp');
  t.in(ana, 'new', 'Login page');

  const moved = t.in(ana, 'groundwork', 'exp-1');
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.strictEqual(git(path.join(ana, '.flow'), 'log', '-1', '--format=%s').out, 'exp-1: todo → groundwork');

  const inside = t.in(path.join(ana, '.flow', 'tickets'), 'exp-1');
  assert.strictEqual(inside.code, 0, inside.stderr);
  assert.match(inside.stdout, /^exp-1  Login page$/m);
});

test('flow init --private links .flow/ into the Flow home, hidden from git, and writes the rule files as the branch does', () => {
  const t = team('records-private-init');
  const ana = t.clone('ana');
  const made = t.in(ana, 'init', '--private', '--prefix', 'exp');
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /private, in your Flow home/);
  assert.match(made.stdout, /^wrote: AGENTS\.md$/m);
  assert.ok(fs.existsSync(path.join(ana, 'CLAUDE.md')));

  const dir = path.join(t.home, 'projects', 'ana');
  assert.strictEqual(fs.readlinkSync(path.join(ana, '.flow')), dir);
  assert.match(fs.readFileSync(path.join(ana, '.git', 'info', 'exclude'), 'utf8'), /^\.flow$/m);
  assert.doesNotMatch(fs.readFileSync(path.join(ana, '.gitignore'), 'utf8'), /^\.flow/m, 'no .flow/ line');
  assert.match(t.in(ana, 'new', 'Try it').stdout, /created exp-1/);
  assert.ok(fs.existsSync(path.join(dir, 'tickets')), 'the ticket landed in the Flow home folder');
  assert.strictEqual(git(ana, 'status', '--porcelain', '--', '.flow').out, '', 'git never sees .flow');
  assert.ok(!git(ana, 'rev-parse', '--verify', 'flow').ok, 'no branch');
});

test('flow init --private: the folder carries the repository, so another clone of it joins the same tickets', () => {
  const t = team('records-home');
  const ana = t.clone('ana');
  assert.strictEqual(t.in(ana, 'init', '--private', '--prefix', 'exp').code, 0);
  t.in(ana, 'new', 'Login page');
  const dir = path.join(t.home, 'projects', 'ana');
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8')).repository, t.remote);

  const ben = t.clone('ben');
  const joined = t.in(ben, 'init');
  assert.strictEqual(joined.code, 0, joined.stderr);
  assert.match(joined.stdout, /where another machine put this project's tickets/);
  assert.strictEqual(fs.readlinkSync(path.join(ben, '.flow')), dir);
  assert.match(t.in(ben, 'exp-1').stdout, /Login page/);
});

test('flow init in a public repository puts the tickets in the Flow home when no terminal can answer', () => {
  const t = team('records-public');
  const ana = t.clone('ana');
  const made = run('flow/flow.js', ['init', '--prefix', 'exp'], { cwd: ana, env: { ...t.env, FLOW_VISIBILITY: 'public' } });
  assert.strictEqual(made.code, 0, made.stderr);
  assert.ok(fs.lstatSync(path.join(ana, '.flow')).isSymbolicLink());
  assert.ok(!git(ana, 'rev-parse', '--verify', 'flow').ok, 'no branch to publish');

  const other = team('records-private');
  const priv = other.clone('ben');
  const branch = run('flow/flow.js', ['init', '--prefix', 'exp'], { cwd: priv, env: { ...other.env, FLOW_VISIBILITY: 'private' } });
  assert.strictEqual(branch.code, 0, branch.stderr);
  assert.ok(records.onBranch(priv), 'a private repository gets the branch with no question');
});

test('the remote reads the same in every form git holds it', () => {
  const t = team('records-remote-forms');
  const ana = t.clone('ana');
  const place = require('../flow/lib/records-place');
  for (const url of ['git@github.com:Owner/Repo.git', 'https://github.com/owner/repo', 'ssh://git@github.com/owner/repo.git']) {
    git(ana, 'remote', 'set-url', 'origin', url);
    assert.strictEqual(place.repositoryOf(ana), 'github.com/owner/repo', url);
  }
});

test('flow store moves the tickets from the branch to the Flow home, and back', () => {
  const t = team('records-store');
  const ana = t.clone('ana');
  t.init(ana, '--prefix', 'exp');
  t.in(ana, 'new', 'Login page');
  assert.match(t.in(ana, 'store').stdout, /live on the project's flow branch/);

  const home = t.in(ana, 'store', 'private');
  assert.strictEqual(home.code, 0, home.stderr);
  assert.match(home.stdout, /git push origin --delete flow/);
  assert.ok(git(ana, 'rev-parse', '--verify', 'flow').ok, 'the branch stays');
  assert.match(t.in(ana, 'store').stdout, /live in your Flow home/);
  t.in(ana, 'new', 'Export csv');

  assert.ok(fs.existsSync(path.join(t.home, 'projects', 'ana', 'tickets')));

  const back = t.in(ana, 'store', 'branch');
  assert.strictEqual(back.code, 0, back.stderr);
  assert.ok(records.onBranch(ana));
  assert.deepStrictEqual(idsIn(ana), ['exp-1-login-page', 'exp-2-export-csv']);
  assert.ok(!fs.existsSync(path.join(t.home, 'projects', 'ana')), 'the Flow home folder went with the move');
  assert.strictEqual(git(path.join(ana, '.flow'), 'status', '--porcelain').out, '', 'committed');
  assert.ok(!('repository' in JSON.parse(fs.readFileSync(path.join(ana, '.flow', 'settings.json'), 'utf8'))));
});

test('flow store refuses to move onto a branch holding a ticket the move would delete', () => {
  const t = team('records-store-refused');
  const ana = t.clone('ana');
  t.init(ana, '--prefix', 'exp');
  t.in(ana, 'new', 'Login page');
  records.sync(ana);
  const ben = t.clone('ben');
  t.in(ben, 'init');
  t.in(ana, 'store', 'private');

  // A teammate still on the branch adds a ticket the Flow home never saw.
  assert.match(t.in(ben, 'new', 'Export csv').stdout, /created exp-2/);
  git(ana, 'fetch', '-q', '--force', 'origin', 'flow:flow');

  const refused = t.in(ana, 'store', 'branch');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /would be deleted: exp-2-export-csv/);
  assert.ok(fs.lstatSync(path.join(ana, '.flow')).isSymbolicLink(), 'the link is back');
  assert.match(t.in(ana, 'exp-1').stdout, /Login page/);
});

test('flow move takes tickets home, rewrites their links, keeps was, and carries ignored files', () => {
  const dir = project('records-move');
  flow(dir, ['new', 'Parser']);
  flow(dir, ['new', 'Parser tests', '--deps', 'exp-1']);
  flow(dir, ['new', 'Unrelated']);
  const folder = fs.readdirSync(path.join(dir, '.flow', 'tickets')).find((f) => f.startsWith('exp-1-'));
  write(path.join(dir, '.flow', 'tickets', folder), 'protos/speed/node_modules/lib.js', 'x\n');

  const refused = flow(dir, ['move', 'exp-2', 'home']);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /exp-1/, 'names the ticket the link would leave behind');

  const moved = flow(dir, ['move', 'exp-1', 'exp-2', 'home']);
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.match(moved.stdout, /^exp-1 → home-1 {3}Parser$/m);
  assert.match(moved.stdout, /^exp-2 → home-2 {3}Parser tests$/m);
  assert.deepStrictEqual(idsIn(dir), ['exp-3-unrelated']);

  const home = path.join(dir, 'flow-home', 'tickets');
  const second = fs.readFileSync(path.join(home, 'home-2-parser-tests', 'ticket.md'), 'utf8');
  assert.match(second, /^deps: \[home-1\]$/m);
  assert.match(second, /^was: exp-2$/m);
  assert.ok(fs.existsSync(path.join(home, 'home-1-parser', 'protos', 'speed', 'node_modules', 'lib.js')));

  // From inside the project, the old id and the home id both reach it.
  assert.match(flow(dir, ['exp-1']).stdout, /^home-1  Parser$/m);
  assert.match(flow(dir, ['home-2']).stdout, /^home-2  Parser tests$/m);
});

test('a ticket records its code branch when building starts, and a history line per move and handoff', () => {
  const t = team('records-history');
  const ana = t.clone('ana');
  t.init(ana, '--prefix', 'exp');
  t.in(ana, 'new', 'Budget page', '--type', 'issue');
  git(ana, 'checkout', '-q', '-b', 'feature/budgets');

  const env = { ...process.env, FLOW_HOME: t.home, CLAUDE_CODE_SESSION_ID: 'abc-123', CLAUDE_CONFIG_DIR: path.join(t.dir, 'claude') };
  delete env.FLOW_PROJECT;
  write(path.join(t.dir, 'claude', 'projects', 'p'), 'abc-123.jsonl',
    '{"type":"ai-title","aiTitle":"Made up"}\n{"type":"custom-title","customTitle":"Budget \\"work\\""}\n');
  const as = (...args) => run('flow/flow.js', args, { cwd: ana, env });

  assert.strictEqual(as('build', 'exp-1').code, 0);
  assert.strictEqual(as('handoff', 'exp-1').code, 0);
  const dir = path.join(ana, '.flow', 'tickets', 'exp-1-budget-page');
  assert.match(fs.readFileSync(path.join(dir, 'ticket.md'), 'utf8'), /^branch: feature\/budgets$/m);
  const lines = fs.readFileSync(path.join(dir, 'history.md'), 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 2);
  assert.match(lines[0], /^\d{4}-\d\d-\d\d \d\d:\d\d  todo → building\s+abc-123  "Budget \\"work\\""  feature\/budgets$/);
  assert.match(lines[1], /  handoff\s+abc-123  /);
  assert.strictEqual(git(path.join(ana, '.flow'), 'log', '-1', '--format=%s').out, 'exp-1: handoff');

  git(ana, 'checkout', '-q', 'main');
  assert.match(t.in(ana, 'exp-1').stdout, /^branch:\s+feature\/budgets   \(checked out here: main\)$/m);
});
