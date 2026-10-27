/**
 * A project's tickets on the branch `flow`, which `flow init` no longer makes
 * and `features/tickets/records.ts` still serves: a clash on one number and the
 * commits the commands make. Also `flow init` linking `.flow/` into the
 * private Flow home, `flow move`, and what a ticket records about the work on
 * it.
 *
 * Every test runs real git against a bare repository standing in for the
 * remote, with 2 clones standing in for 2 people.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRATCH, project, write, run, flow } from '../../shared/testing.ts';
import * as records from './records.ts';
import * as store from './store.ts';
import * as failures from '../logs/failures.ts';
import * as repo from '../machine/flow-repo.ts';
import { git as gitIn } from '../../shared/git.ts';
import * as place from './records-place.ts';

/** git in `dir`, with a name to commit under. Returns the trimmed output. */
function git(dir, ...args) {
  const ran = spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd: dir, encoding: 'utf8' });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

/**
 * A remote holding one commit of code, and a machine Flow is set up on.
 * `clone(name)` makes a person's clone of it, `in(dir)` runs `flow` there, and
 * `branch(dir, prefix)` puts the branch `flow` at its `.flow/`.
 */
function team(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const remote = path.join(dir, 'remote.git');
  const home = path.join(dir, 'flow-home');
  fs.mkdirSync(home, { recursive: true });
  git(dir, 'init', '--quiet', '--bare', '--initial-branch=main', remote);

  const first = path.join(dir, 'first');
  write(first, 'app.js', 'console.log(1);\n');
  git(first, 'init', '--quiet', '--initial-branch=main');
  git(first, 'add', '-A');
  git(first, 'commit', '--quiet', '-m', 'code');
  git(first, 'push', '--quiet', remote, 'main');

  const env: NodeJS.ProcessEnv = { ...process.env, FLOW_HOME: home, GIT_CEILING_DIRECTORIES: dir };
  delete env.FLOW_PROJECT;
  const clone = (who) => {
    git(dir, 'clone', '--quiet', remote, who);
    return path.join(dir, who);
  };
  const inside = (cwd, ...args) => run('flow.ts', args, { cwd, env });
  // What `flow init` did before the Flow home became its only place: the
  // branch checked out at `.flow/`, and seeded with the prefix where it is new.
  const branch = (cwd, prefix?: string) => {
    fs.rmSync(path.join(cwd, '.flow'), { recursive: true, force: true });
    const checked = records.checkOut(cwd);
    assert.ok(checked.ok, checked.why);
    if (checked.joined) return;
    fs.mkdirSync(path.join(cwd, '.flow', 'tickets'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.flow', 'settings.json'), JSON.stringify({ ticketPrefix: prefix }));
    records.commit(cwd, 'flow init');
  };
  return { dir, remote, home, env, clone, in: inside, branch };
}

const idsIn = (dir) => fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive').sort();

test('offline, flow new makes no ticket, and gives out no number', () => {
  const t = team('records-offline');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  records.sync(ana);

  const away = `${t.remote}.away`;
  fs.renameSync(t.remote, away);
  const offline = t.in(ana, 'tickets', 'new', 'Export csv');
  fs.renameSync(away, t.remote);
  assert.strictEqual(offline.code, 1);
  assert.match(offline.stderr, /no ticket was made: the remote did not take it\. git said: fatal: .*does not appear to be a git repository/);
  assert.deepStrictEqual(idsIn(ana), []);
  assert.strictEqual(git(path.join(ana, '.flow'), 'status', '--porcelain').out, '', 'nothing left behind');

  assert.match(t.in(ana, 'tickets', 'new', 'Export csv').stdout, /created exp-1/);
});

test('a push the server refuses stops flow new at once, with the server\'s words', () => {
  const t = team('records-server-refused');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  records.sync(ana);

  // git answers `! [remote rejected]`, as GitHub did in its outage of 2026-10-07.
  const hook = path.join(t.remote, 'hooks', 'pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\necho "Internal Server Error" >&2\nexit 1\n', { mode: 0o755 });
  const refused = t.in(ana, 'tickets', 'new', 'Export csv');
  fs.rmSync(hook);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /git said: remote: Internal Server Error/);
  assert.doesNotMatch(refused.stderr, /refused 5 times/);
  assert.deepStrictEqual(idsIn(ana), []);
});

test('2 people taking one number in the same moment: the second makes no ticket, leaves no trace, and runs flow new again', () => {
  const t = team('records-clash');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  records.sync(ana);
  const ben = t.clone('ben');
  t.branch(ben);

  // Ben's number is taken before Ana's push lands, as when both type flow new at once.
  const mine = store.createTicket(ben, { title: 'export-csv', description: 'Export csv' });
  assert.match(t.in(ana, 'tickets', 'new', 'Login page').stdout, /created exp-1-login-page/);
  const claimed = records.claim(ben, mine.id);
  assert.strictEqual(claimed.ok, false);
  assert.strictEqual(claimed.why, 'another machine took exp-1 first. Run it again.');

  // What `flow new` does next: takes the ticket back. No later pull replays it.
  store.remove(mine);
  records.commit(ben, 'exp-1: taken back, never sent');
  assert.ok(records.sync(ben).ok, 'the next sync is not stuck on the lost number');
  assert.deepStrictEqual(idsIn(ben), ['1']);
  assert.match(t.in(ben, 'tickets', 'new', 'Export csv').stdout, /created exp-2-export-csv/);
});

test('2 people giving out different counts at once: the second makes no ticket, and the counter keeps the higher', () => {
  const t = team('records-counter-clash');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  records.sync(ana);
  const ben = t.clone('ben');
  t.branch(ben);

  // Ben's counter goes to 1 while Ana's goes to 2: both changed its one line.
  const mine = store.createTicket(ben, { title: 'export-csv', description: 'Export csv' });
  t.in(ana, 'tickets', 'new', 'Login page');
  t.in(ana, 'tickets', 'new', 'Logout');
  const claimed = records.claim(ben, mine.id);
  assert.strictEqual(claimed.ok, false);
  assert.match(claimed.why, /another machine took exp-1 first/);

  store.remove(mine);
  records.commit(ben, 'exp-1: taken back, never sent');
  assert.ok(records.sync(ben).ok);
  assert.match(t.in(ben, 'tickets', 'new', 'Export csv').stdout, /created exp-3-export-csv/);
  assert.strictEqual(fs.readFileSync(path.join(ben, '.flow', 'ticket-counter'), 'utf8'), '3\n');
});

test('each command that changes a ticket commits it, and flow runs from inside .flow/', () => {
  const t = team('records-commits');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  t.in(ana, 'tickets', 'new', 'Login page');

  const moved = t.in(ana, 'tickets', 'start', 'exp-1');
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.strictEqual(git(path.join(ana, '.flow'), 'log', '-1', '--format=%s').out, 'exp-1: todo → in-progress');

  const inside = t.in(path.join(ana, '.flow', 'tickets'), 'tickets', 'get', 'exp-1');
  assert.strictEqual(inside.code, 0, inside.stderr);
  assert.match(inside.stdout, /^exp-1-login-page$/m);
});

test('a save syncs its objects to disk, so a crash right after it leaves no empty object', () => {
  const t = team('records-fsync');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  t.in(ana, 'tickets', 'new', 'Login page');

  // A post-commit hook runs even under --no-verify, and sees the -c settings of the commit that ran it.
  const seen = path.join(t.dir, 'fsync-seen');
  const hook = path.join(ana, '.git', 'hooks', 'post-commit');
  fs.writeFileSync(hook, `#!/bin/sh\ngit config --get core.fsync > '${seen}'\n`, { mode: 0o755 });
  const moved = t.in(ana, 'tickets', 'start', 'exp-1');
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.strictEqual(fs.readFileSync(seen, 'utf8').trim(), 'committed');
  assert.ok(!git(ana, 'config', '--get', 'core.fsync').ok, 'the repository\'s own config is untouched');
});

test('a save git refuses says so, and stays an open issue until a save works', () => {
  const t = team('records-unsaved');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  t.in(ana, 'tickets', 'new', 'Login page');

  // What a crash left behind: the branch pointing at a commit whose object never reached the disk.
  const ref = path.join(ana, '.git', 'refs', 'heads', 'flow');
  const good = fs.readFileSync(ref, 'utf8');
  fs.writeFileSync(ref, `${'1'.repeat(40)}\n`);
  const broken = t.in(ana, 'tickets', 'start', 'exp-1');
  assert.match(broken.stderr, /the tickets in .*\.flow were not saved: (fatal|error): /);
  const job = `save ${path.resolve(ana)}`;
  assert.ok(failures.open(t.home).some((issue) => issue.job === job), 'the failure log holds an open issue');

  fs.writeFileSync(ref, good);
  const fixed = t.in(ana, 'tickets', 'todo', 'exp-1');
  assert.strictEqual(fixed.code, 0, fixed.stderr);
  assert.doesNotMatch(fixed.stderr, /not saved/);
  assert.ok(!failures.open(t.home).some((issue) => issue.job === job), 'the next save that works closes it');
});

test('flow init links .flow/ into the Flow home, hidden from git, and writes the rule files', () => {
  const t = team('records-private-init');
  const ana = t.clone('ana');
  const made = t.in(ana, 'init', '--prefix', 'exp');
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /private, in your Flow home/);
  assert.match(made.stdout, /^wrote: CLAUDE\.md$/m);
  assert.ok(fs.existsSync(path.join(ana, 'CLAUDE.md')));

  const dir = path.join(t.home, 'projects', 'ana');
  assert.strictEqual(fs.readlinkSync(path.join(ana, '.flow')), dir);
  assert.match(fs.readFileSync(path.join(ana, '.git', 'info', 'exclude'), 'utf8'), /^\.flow$/m);
  assert.ok(!fs.existsSync(path.join(ana, '.gitignore')) || !/^\.flow/m.test(fs.readFileSync(path.join(ana, '.gitignore'), 'utf8')), 'no .flow/ line');
  assert.match(t.in(ana, 'tickets', 'new', 'Try it').stdout, /created exp-1/);
  assert.ok(fs.existsSync(path.join(dir, 'tickets')), 'the ticket landed in the Flow home folder');
  assert.strictEqual(git(ana, 'status', '--porcelain', '--', '.flow').out, '', 'git never sees .flow');
  assert.ok(!git(ana, 'rev-parse', '--verify', 'flow').ok, 'no branch');
});

test('flow init keeps a file the project already has, and adds Flow\'s lines to its .gitignore', () => {
  const t = team('records-keeps-files');
  const ana = t.clone('ana');
  fs.writeFileSync(path.join(ana, '.gitignore'), 'dist/\n');
  fs.writeFileSync(path.join(ana, 'CLAUDE.md'), 'my own rules\n');
  const made = t.in(ana, 'init', '--prefix', 'exp');
  assert.strictEqual(made.code, 0, made.stderr);

  assert.strictEqual(fs.readFileSync(path.join(ana, 'CLAUDE.md'), 'utf8'), 'my own rules\n');
  assert.match(fs.readFileSync(path.join(ana, '.gitignore'), 'utf8'), /^dist\/\n/);
  assert.doesNotMatch(made.stdout, /^wrote: CLAUDE\.md$/m);

  const again = t.in(ana, 'init');
  assert.strictEqual(again.code, 0, again.stderr);
  assert.match(again.stdout, /already a Flow project/);
});

test('flow init on a second machine syncs the Flow home first, so it joins the private folder the first machine made', () => {
  const t = team('records-second-machine');
  const remote = path.join(t.dir, 'flow-home.git');
  git(t.dir, 'init', '--quiet', '--bare', '--initial-branch=main', remote);
  const machineAt = (home, name) => {
    const at = { flow: home, base: path.dirname(home) };
    repo.connect(at, remote);
    gitIn(home, ['config', 'flow.machine', name]);
    return at;
  };

  const desk = machineAt(t.home, 'desk');
  repo.writeIgnore(desk);
  repo.sync(desk);
  fs.mkdirSync(path.join(t.dir, 'laptop-home'), { recursive: true });
  const laptop = machineAt(path.join(t.dir, 'laptop-home'), 'laptop');
  repo.inspect(laptop);
  repo.join(laptop);

  // The desk's flow init sends the new folder up by itself, in the background.
  const ana = t.clone('ana');
  assert.strictEqual(t.in(ana, 'init', '--prefix', 'exp').code, 0);
  const sent = () => git(t.dir, '--git-dir', remote, 'cat-file', '-e', 'main:projects/ana/settings.json').ok;
  for (let waited = 0; !sent() && waited < 100; waited++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  assert.ok(sent(), "the desk's project folder reached the Flow home's remote");

  const ben = t.clone('ben');
  const env = { ...t.env, FLOW_HOME: laptop.flow };
  const joined = run('flow.ts', ['init'], { cwd: ben, env });
  assert.strictEqual(joined.code, 0, joined.stderr);
  assert.match(joined.stdout, /where another machine put this project's tickets/);
  assert.strictEqual(fs.readlinkSync(path.join(ben, '.flow')), path.join(laptop.flow, 'projects', 'ana'));
  assert.ok(!git(ben, 'rev-parse', '--verify', 'flow').ok, 'no branch');
});

test('flow init: the folder carries the repository, so another clone of it joins the same tickets', () => {
  const t = team('records-home');
  const ana = t.clone('ana');
  assert.strictEqual(t.in(ana, 'init', '--prefix', 'exp').code, 0);
  t.in(ana, 'tickets', 'new', 'Login page');
  const dir = path.join(t.home, 'projects', 'ana');
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8')).repository, t.remote);

  const ben = t.clone('ben');
  const joined = t.in(ben, 'init');
  assert.strictEqual(joined.code, 0, joined.stderr);
  assert.match(joined.stdout, /where another machine put this project's tickets/);
  assert.strictEqual(fs.readlinkSync(path.join(ben, '.flow')), dir);
  assert.match(t.in(ben, 'tickets', 'get', 'exp-1').stdout, /Login page/);
});

test('the remote reads the same in every form git holds it', () => {
  const t = team('records-remote-forms');
  const ana = t.clone('ana');
  for (const url of ['git@github.com:Owner/Repo.git', 'https://github.com/owner/repo', 'ssh://git@github.com/owner/repo.git']) {
    git(ana, 'remote', 'set-url', 'origin', url);
    assert.strictEqual(place.repositoryOf(ana), 'github.com/owner/repo', url);
  }
});

test('flow move takes tickets home, rewrites their links, keeps was, and carries ignored files', () => {
  const dir = project('records-move');
  flow(dir, ['tickets', 'new', 'Parser']);
  flow(dir, ['tickets', 'new', 'Parser tests', '--deps', 'exp-1']);
  flow(dir, ['tickets', 'new', 'Unrelated']);
  const folder = '1';
  write(path.join(dir, '.flow', 'tickets', folder), 'protos/speed/node_modules/lib.js', 'x\n');

  const refused = flow(dir, ['tickets', 'move', 'exp-2', 'home']);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /exp-1/, 'names the ticket the link would leave behind');

  const moved = flow(dir, ['tickets', 'move', 'exp-1,exp-2', 'home']);
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.match(moved.stdout, /^exp-1 → home-1-parser$/m);
  assert.match(moved.stdout, /^exp-2 → home-2-parser-tests$/m);
  assert.deepStrictEqual(idsIn(dir), ['3']);

  const home = path.join(dir, 'flow-home', 'tickets');
  const second = fs.readFileSync(path.join(home, '2', 'ticket.md'), 'utf8');
  assert.match(second, /^deps: \[1\]$/m);
  assert.match(second, /^was: exp-2$/m);
  assert.ok(fs.existsSync(path.join(home, '1', 'protos', 'speed', 'node_modules', 'lib.js')));

  // From inside the project, the old id and the home id both reach it.
  assert.match(flow(dir, ['tickets', 'get', 'exp-1']).stdout, /^home-1-parser$/m);
  assert.match(flow(dir, ['tickets', 'get', 'home-2']).stdout, /^home-2-parser-tests$/m);
});

test('a ticket records its code branch when work starts, and a history line per move', () => {
  const t = team('records-history');
  const ana = t.clone('ana');
  t.branch(ana, 'exp');
  t.in(ana, 'tickets', 'new', 'Budget page');
  git(ana, 'checkout', '-q', '-b', 'feature/budgets');

  const env: NodeJS.ProcessEnv = { ...process.env, FLOW_HOME: t.home, CLAUDE_CODE_SESSION_ID: 'abc-123', CLAUDE_CONFIG_DIR: path.join(t.dir, 'claude') };
  delete env.FLOW_PROJECT;
  write(path.join(t.dir, 'claude', 'projects', 'p'), 'abc-123.jsonl',
    '{"type":"ai-title","aiTitle":"Made up"}\n{"type":"custom-title","customTitle":"Budget \\"work\\""}\n');
  const as = (...args) => run('flow.ts', args, { cwd: ana, env });

  assert.strictEqual(as('tickets', 'start', 'exp-1').code, 0);
  const dir = path.join(ana, '.flow', 'tickets', '1');
  assert.match(fs.readFileSync(path.join(dir, 'ticket.md'), 'utf8'), /^branch: feature\/budgets$/m);
  const lines = fs.readFileSync(path.join(dir, 'history.md'), 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 1);
  assert.match(lines[0], /^\d{4}-\d\d-\d\d \d\d:\d\d  todo → in-progress\s+abc-123  "Budget \\"work\\""  feature\/budgets$/);
  assert.strictEqual(git(path.join(ana, '.flow'), 'log', '-1', '--format=%s').out, 'exp-1: todo → in-progress');

  git(ana, 'checkout', '-q', 'main');
  assert.match(t.in(ana, 'tickets', 'get', 'exp-1').stdout, /^branch:\s+feature\/budgets   \(checked out here: main\)$/m);
});
