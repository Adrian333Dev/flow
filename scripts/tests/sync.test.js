'use strict';
/**
 * `flow sync` and `lib/machine/flow-repo.js`: `~/.flow/` as one private git
 * repository, which is the whole of how Flow reaches another machine.
 *
 * The list of what never travels, the `.gitignore` written from it, the
 * refusals, a second machine joining through `flow install`, the machine
 * records, and round trips through a bare repository in the scratch folder,
 * standing in for GitHub.
 *
 * Each machine is named in its own repository's git config, since the name
 * otherwise comes from this computer's global one and every scratch machine
 * would share it.
 */

const { test } = require('node:test');
const { spawnSync } = require('child_process');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run, flow, bareRepo, REPO } = require('./helpers/scratch');
const repo = require('../lib/machine/flow-repo');
const { git } = require('../lib/git');
const folders = require('../lib/paths').folders;
const version = require('../lib/machine/version');

const NEWEST = version.newest(REPO);

/** A set-up machine with nothing in ~/.flow/ but the version stamp. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const at = folders(root);
  fs.mkdirSync(at.flow, { recursive: true });
  fs.writeFileSync(path.join(at.flow, 'version'), `${NEWEST}\n`);
  return { dir, root, at, name };
}

/** Connect a machine to `remote` and give it its own name. */
function connect(m, remote) {
  repo.connect(m.at, remote);
  git(m.at.flow, ['config', 'flow.machine', m.name]);
}

const sync = (m) => run('flow.js', ['sync', '--root', m.root], { cwd: m.dir });
const read = (file) => fs.readFileSync(file, 'utf8');

test('what belongs to one machine is what the ignore file names, at the top of ~/.flow/ alone', () => {
  const m = machine('sync-ignore');
  repo.writeIgnore(m.at);

  const lines = read(path.join(m.at.flow, '.gitignore')).split('\n').filter((l) => l && !l.startsWith('#'));
  assert.deepStrictEqual(lines, [
    '/version',
    '/run.json',
    '/setup-prompt.md',
    '/setup-settings.json',
    '/migrate-prompt.md',
    '/originals/',
    '/restore.md',
    '/settings.local.json',
    '/scripts',
    '/references',
    '/docs',
    '/repos/',
    '/logs/',
    '/skills-update.json',
    '/skills-update.lock',
    '/records-sync.json',
    '/status-line.json',
    '/audit/',
    '/changes/',
    '/wiki/*/downloads/',
    'node_modules/',
  ]);
  assert.strictEqual(repo.isRepo(m.at), false, 'writing the ignore file makes no repository');
  assert.strictEqual(repo.changed(m.at), null, 'and nothing counts as changed');

  // A private project's stamp and a prototype's docs/ travel, though their
  // names match a line: every line but node_modules/ holds at the top alone.
  connect(m, bareRepo('sync-ignore-remote'));
  const ignored = (rel) => git(m.at.flow, ['check-ignore', '-q', '--no-index', rel]).ok;
  assert.ok(ignored('version'));
  assert.ok(ignored('docs/manual/README.md'));
  assert.ok(ignored('projects/shop/tickets/exp-3-tts/protos/a/node_modules/x.js'));
  assert.ok(!ignored('projects/shop/version'), "a private project's stamp travels");
  assert.ok(!ignored('projects/shop/tickets/exp-3-tts/protos/a/docs/notes.md'));
  assert.ok(!ignored('projects/shop/tickets/exp-3-tts/protos/a/scripts/run.sh'));
});

test('sync on a ~/.flow that is not a repository says so and stops', () => {
  const m = machine('sync-bare');
  const refused = sync(m);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /is not a repository yet\. Run flow install, which connects it\./);
});

test('sync refuses on a machine where setup never finished', () => {
  const m = machine('sync-unset');
  fs.rmSync(path.join(m.at.flow, 'version'));

  const refused = sync(m);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /not set up on this machine\. Run flow install\./);

  // A setup part way through runs flow commands of its own, and stamps the
  // version only at its end, so its run.json lets them through.
  fs.writeFileSync(path.join(m.at.flow, 'run.json'), JSON.stringify({ type: 'setup-machine', step: 5 }));
  assert.doesNotMatch(sync(m).stderr, /not set up/);

  fs.writeFileSync(path.join(m.at.flow, 'run.json'), JSON.stringify({ type: 'migrate', step: 5 }));
  assert.match(sync(m).stderr, /not set up on this machine/, 'only a setup passes');
});

test('2 machines send and merge their work, and the same lines changed on both stop the sync', () => {
  const remote = bareRepo('sync-pair');
  const a = machine('sync-a');
  connect(a, remote);
  repo.writeIgnore(a.at);
  fs.writeFileSync(path.join(a.at.flow, 'workflow-notes.md'), 'from a\n');
  fs.writeFileSync(path.join(a.at.flow, 'AGENTS.md'), 'rules\n');

  const first = sync(a);
  assert.strictEqual(first.code, 0, first.stderr);
  assert.strictEqual(first.stdout, 'nothing new came down.\nwent up: sync-a: 3 files\n', 'the notes, the rules and the ignore file');

  const b = machine('sync-b');
  connect(b, remote);
  assert.deepStrictEqual(repo.inspect(b.at, NEWEST), { state: 'join', files: 3, from: [], taken: [] });
  repo.join(b.at);
  assert.strictEqual(sync(b).stdout, 'nothing new came down.\nnothing changed here, so nothing went up.\n', 'version is ignored');

  // Different files on each side, then the same file at different lines.
  fs.appendFileSync(path.join(b.at.flow, 'workflow-notes.md'), 'from b\n');
  fs.writeFileSync(path.join(a.at.flow, 'AGENTS.md'), 'rules, edited on a\n');
  assert.match(sync(b).stdout, /went up: sync-b: 1 file$/m);
  const merged = sync(a);
  assert.strictEqual(merged.code, 0, merged.stderr);
  assert.strictEqual(merged.stdout, 'came down: 1 file\nwent up: sync-a: 1 file\n');
  assert.strictEqual(read(path.join(a.at.flow, 'workflow-notes.md')), 'from a\nfrom b\n');
  assert.strictEqual(sync(b).stdout, 'came down: 1 file\nnothing changed here, so nothing went up.\n');
  assert.strictEqual(read(path.join(b.at.flow, 'AGENTS.md')), 'rules, edited on a\n');

  // The same lines on both sides: the merge is undone, and b keeps its line.
  fs.appendFileSync(path.join(a.at.flow, 'workflow-notes.md'), 'again from a\n');
  assert.strictEqual(sync(a).code, 0);
  fs.appendFileSync(path.join(b.at.flow, 'workflow-notes.md'), 'again from b\n');
  const refused = sync(b);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /another machine changed the same lines of workflow-notes\.md, so nothing came down and nothing went up\./);
  assert.match(read(path.join(b.at.flow, 'workflow-notes.md')), /again from b\n$/, 'nothing of b\'s was lost');
  assert.strictEqual(git(b.at.flow, ['status', '--porcelain']).out, '', 'no merge is left half done');
});

test('a project linked into the Flow home travels with it, and a number 2 machines took is renumbered', () => {
  const remote = bareRepo('sync-linked');
  const a = machine('sync-linked-a');
  connect(a, remote);
  repo.writeIgnore(a.at);
  assert.strictEqual(sync(a).code, 0);
  const b = machine('sync-linked-b');
  connect(b, remote);
  repo.inspect(b.at, NEWEST);
  repo.join(b.at);

  // The same project cloned on both machines, its .flow/ linked into each Flow home.
  const clone = (m) => {
    const dir = path.join(m.dir, 'app');
    const records = path.join(m.at.flow, 'projects', 'app');
    fs.mkdirSync(path.join(records, 'tickets'), { recursive: true });
    fs.writeFileSync(path.join(records, 'settings.json'), '{\n  "ticketPrefix": "exp",\n  "repository": "github.com/someone/app"\n}\n');
    fs.mkdirSync(dir, { recursive: true });
    fs.symlinkSync(records, path.join(dir, '.flow'));
    return dir;
  };
  const appA = clone(a);
  const env = (m, dir) => ({ ...process.env, FLOW_HOME: m.at.flow, FLOW_PROJECT: dir });
  const inApp = (m, dir, args) => run('flow.js', args, { cwd: dir, env: env(m, dir) });
  inApp(a, appA, ['new', 'Login page']);
  assert.match(inApp(a, appA, ['sync', '--root', a.root]).stdout, /went up/);

  // b pulls the folder, links to it, and takes a number a has since taken too.
  assert.strictEqual(sync(b).code, 0);
  const appB = path.join(b.dir, 'app');
  fs.mkdirSync(appB, { recursive: true });
  fs.symlinkSync(path.join(b.at.flow, 'projects', 'app'), path.join(appB, '.flow'));
  inApp(a, appA, ['new', 'Export csv']);
  assert.strictEqual(inApp(a, appA, ['sync', '--root', a.root]).code, 0);
  assert.match(inApp(b, appB, ['new', 'Dark mode']).stdout, /created exp-2/);

  const synced = inApp(b, appB, ['sync', '--root', b.root]);
  assert.strictEqual(synced.code, 0, synced.stderr);
  assert.match(synced.stdout, /exp-2 is now exp-3: another machine took exp-2 first\./);
  assert.match(inApp(b, appB, ['exp-3']).stdout, /Dark mode/);
  assert.match(inApp(b, appB, ['exp-2']).stdout, /Export csv/);
});

test('a machine behind another machine\'s record syncs nothing until it catches up', () => {
  const remote = bareRepo('sync-records');
  const a = machine('sync-ahead');
  connect(a, remote);
  repo.writeIgnore(a.at);
  repo.writeRecord(a.at, NEWEST + 1);
  assert.strictEqual(sync(a).code, 0);

  const b = machine('sync-behind');
  connect(b, remote);
  // The Flow home is on an entry this clone does not have, so nothing comes down.
  assert.deepStrictEqual(repo.inspect(b.at, NEWEST), { state: 'version', home: NEWEST + 1, name: 'sync-ahead' });
  assert.ok(!fs.existsSync(path.join(b.at.flow, 'machines')));
  assert.deepStrictEqual(repo.inspect(b.at, NEWEST + 1).taken, ['sync-ahead']);
  repo.join(b.at);

  fs.writeFileSync(path.join(b.at.flow, 'workflow-notes.md'), 'from b\n');
  const refused = sync(b);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, new RegExp(`your Flow home is on changelog entry ${NEWEST + 1}, since sync-ahead moved to it, and this machine is on ${NEWEST}\\. Nothing was synced\\. Run flow update first\\.`));
  assert.strictEqual(git(b.at.flow, ['rev-list', '--count', 'HEAD']).out, '1', 'nothing was committed');

  // The session check reads the same record, from the fetch alone.
  assert.deepStrictEqual(repo.ahead(b.at, NEWEST), { name: 'sync-ahead', number: NEWEST + 1 });
  assert.strictEqual(repo.ahead(b.at, NEWEST + 1), null);

  repo.writeRecord(b.at, NEWEST + 1);
  fs.writeFileSync(path.join(b.at.flow, 'version'), `${NEWEST + 1}\n`);
  const level = sync(b);
  assert.strictEqual(level.code, 0, level.stderr);
  assert.match(level.stdout, /went up: sync-behind: 2 files/);
  assert.deepStrictEqual(JSON.parse(read(path.join(b.at.flow, 'machines', 'sync-behind.json'))).flowVersion, NEWEST + 1);
});

test('a second machine joins through flow install, and a repository that is not a Flow home is refused', () => {
  const remote = bareRepo('sync-install');
  const a = machine('sync-first');
  connect(a, remote);
  repo.writeIgnore(a.at);
  repo.writeRecord(a.at, NEWEST);
  fs.writeFileSync(path.join(a.at.flow, 'AGENTS.md'), 'rules from the first machine\n');
  fs.mkdirSync(path.join(a.at.flow, 'study-cases', 'guessing'), { recursive: true });
  fs.writeFileSync(path.join(a.at.flow, 'study-cases', 'guessing', 'one.md'), 'a case\n');
  assert.strictEqual(sync(a).code, 0);

  const dir = project('sync-second');
  const root = path.join(dir, 'root');
  const install = () => flow(dir, ['install', '--root', root, '--no-bin', '--no-clone'], { FLOW_HOME_REMOTE: remote });
  const joined = install();
  assert.strictEqual(joined.code, 0, joined.stdout + joined.stderr);
  assert.match(joined.stdout, /joined: 4 files from sync-first, your Flow home as your other machine last sent it/);
  assert.match(joined.stdout, /One step left: setting up this machine/, 'setup still runs, for this machine\'s own ~\/.claude');
  const home = path.join(root, '.flow');
  assert.strictEqual(read(path.join(home, 'AGENTS.md')), 'rules from the first machine\n');
  assert.strictEqual(read(path.join(home, 'study-cases', 'guessing', 'one.md')), 'a case\n');
  assert.strictEqual(git(home, ['status', '--porcelain']).out, '', 'the ignore file matches the one that came down');

  const again = install();
  assert.doesNotMatch(again.stdout, /joined:/, 'a machine that has its files never joins twice');

  // Files of its own in the way: nothing comes down over them.
  const third = project('sync-third');
  const thirdRoot = path.join(third, 'root');
  fs.mkdirSync(path.join(thirdRoot, '.flow'), { recursive: true });
  fs.writeFileSync(path.join(thirdRoot, '.flow', 'AGENTS.md'), 'rules of its own\n');
  const blocked = flow(third, ['install', '--root', thirdRoot, '--no-bin', '--no-clone'], { FLOW_HOME_REMOTE: remote });
  assert.strictEqual(blocked.code, 1);
  assert.match(blocked.stdout, /stopped: .*\.flow already holds AGENTS\.md, and your other machine's copies would go on top of them\./);
  assert.strictEqual(read(path.join(thirdRoot, '.flow', 'AGENTS.md')), 'rules of its own\n');

  // A repository of the user's that happens to carry the name.
  const other = bareRepo('sync-not-flow');
  const work = path.join(dir, 'not-flow');
  fs.mkdirSync(work, { recursive: true });
  const inWork = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: work });
  inWork('init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(work, 'README.md'), 'a website\n');
  inWork('add', '-A');
  inWork('commit', '-q', '-m', 'site');
  inWork('push', '-q', other, 'main');
  const fourth = project('sync-fourth');
  const refused = flow(fourth, ['install', '--root', path.join(fourth, 'root'), '--no-bin', '--no-clone'], { FLOW_HOME_REMOTE: other });
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stdout, /stopped: .*sync-not-flow\.git holds something other than a Flow home, so nothing came down\./);
});

test('install stops when the Flow home is on another release and this clone is one somebody works in', () => {
  const remote = bareRepo('sync-release');
  const a = machine('sync-release-a');
  connect(a, remote);
  repo.writeIgnore(a.at);
  repo.writeRecord(a.at, NEWEST + 1);
  assert.strictEqual(sync(a).code, 0);

  const dir = project('sync-release-b');
  const root = path.join(dir, 'root');
  const stopped = flow(dir, ['install', '--root', root, '--no-bin', '--no-clone'], { FLOW_HOME_REMOTE: remote });
  assert.strictEqual(stopped.code, 1);
  assert.match(stopped.stdout, new RegExp(`stopped: your Flow home is on changelog entry ${NEWEST + 1}, since sync-release-a is on it, and this Flow is on ${NEWEST}\\. Switch .* to v${NEWEST + 1}, then run flow install again\\.`));
  assert.ok(!fs.existsSync(path.join(root, '.flow', 'machines')), 'nothing came down');
});

test('a clone moves to the release a Flow home is on', () => {
  const dir = project('sync-switch');
  const origin = path.join(dir, 'origin');
  fs.mkdirSync(origin, { recursive: true });
  const git = (cwd, ...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd, encoding: 'utf8' });
  git(origin, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(origin, 'CHANGELOG.md'), '## 1, 2026-09-20\n');
  git(origin, 'add', '-A');
  git(origin, 'commit', '-q', '-m', 'one');
  git(origin, 'tag', 'v1');
  fs.writeFileSync(path.join(origin, 'CHANGELOG.md'), '## 2, 2026-10-01\n\n## 1, 2026-09-20\n');
  git(origin, 'commit', '-qam', 'two');

  const clone = path.join(dir, 'clone');
  git(dir, 'clone', '-q', origin, clone);
  assert.strictEqual(version.newest(clone), 2);
  assert.strictEqual(repo.switchClone(clone, 1), null);
  assert.strictEqual(version.newest(clone), 1);
  assert.match(repo.switchClone(clone, 7), /could not fetch v7/);
});

test('the first install starts the Flow home, so a second machine joins it before the first ever syncs', () => {
  const remote = bareRepo('sync-start');
  const install = (name) => {
    const dir = project(name);
    const root = path.join(dir, 'root');
    return { root, dir, ran: flow(dir, ['install', '--root', root, '--no-bin', '--no-clone'], { FLOW_HOME_REMOTE: remote }) };
  };

  const first = install('sync-start-a');
  assert.strictEqual(first.ran.code, 0, first.ran.stdout + first.ran.stderr);
  assert.match(first.ran.stdout, /named: this machine is test-machine\n/);
  assert.match(first.ran.stdout, /started: your Flow home, sent up so your other machines join it/);
  const sent = (ref) => git(first.root + '/.flow', ['ls-tree', '-r', '--name-only', ref]).out.split('\n');
  assert.deepStrictEqual(sent('HEAD'), ['.gitignore', 'README.md', 'machines/test-machine.json'], 'the first commit');

  // The name the first machine claimed is taken, so the second is offered the next.
  const second = install('sync-start-b');
  assert.strictEqual(second.ran.code, 0, second.ran.stdout + second.ran.stderr);
  assert.match(second.ran.stdout, /named: this machine is test-machine-2\n/);
  assert.match(second.ran.stdout, /joined: 3 files from test-machine, your Flow home as your other machine last sent it/);
  assert.doesNotMatch(second.ran.stdout, /started:/);
  assert.match(git(second.root + '/.flow', ['ls-tree', '-r', '--name-only', 'origin/main']).out,
    /machines\/test-machine-2\.json/, 'the second machine\'s record went up at install');

  // Both write on their own, then meet: one history, so the merge goes through.
  const a = { root: first.root, dir: first.dir };
  const b = { root: second.root, dir: second.dir };
  for (const m of [a, b]) fs.writeFileSync(path.join(m.root, '.flow', 'version'), `${NEWEST}\n`);
  fs.writeFileSync(path.join(a.root, '.flow', 'workflow-notes.md'), 'from a\n');
  fs.mkdirSync(path.join(b.root, '.flow', 'study-cases'), { recursive: true });
  fs.writeFileSync(path.join(b.root, '.flow', 'study-cases', 'one.md'), 'from b\n');
  assert.strictEqual(sync(a).code, 0);
  const met = sync(b);
  assert.strictEqual(met.code, 0, met.stderr);
  assert.match(met.stdout, /^came down: 1 file$/m);
});

test('a rebuilt computer that keeps its name joins again, with nothing new to send', () => {
  const remote = bareRepo('sync-rebuilt');
  const a = machine('sync-rebuilt-first');
  connect(a, remote);
  repo.writeIgnore(a.at);
  repo.writeRecord(a.at, NEWEST);
  assert.strictEqual(sync(a).code, 0);

  // The same computer, its disk wiped, its global git config kept.
  const dir = project('sync-rebuilt-again');
  const root = path.join(dir, 'root');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, '.gitconfig'), `[flow]\n\tmachine = ${a.name}\n`);
  const joined = flow(dir, ['install', '--root', root, '--no-bin', '--no-clone'], { FLOW_HOME_REMOTE: remote });
  assert.strictEqual(joined.code, 0, joined.stdout + joined.stderr);
  assert.match(joined.stdout, /joined: /);
  assert.doesNotMatch(joined.stdout, /not sent:/);
});
