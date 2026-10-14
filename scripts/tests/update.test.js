'use strict';
/**
 * `flow update`: pulls the Flow clone, then runs the pulled `flow install`.
 *
 * The clone is built from a scratch upstream whose `scripts/flow.js` is a stub
 * writing its arguments to a file, so the test sees which install ran and with
 * what, without installing anything.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { project, flow, gitRepo, write } = require('./helpers/scratch');
const failures = require('../lib/logs/failures');

const STUB = "require('fs').writeFileSync(process.env.STUB_OUT, process.argv.slice(2).join(' '));\n";

/** A commit in `dir` adding `file`. */
function commit(dir, file, body) {
  write(dir, file, body);
  for (const args of [['add', '-A'], ['commit', '--quiet', '-m', file]]) {
    const ran = spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], { cwd: dir, encoding: 'utf8' });
    assert.strictEqual(ran.status, 0, ran.stderr);
  }
}

/** A machine under `root` whose `repos/flow` is a clone of a scratch upstream. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const upstream = gitRepo(path.join(dir, 'upstream'), { 'scripts/flow.js': STUB });
  const clone = path.join(root, '.flow', 'repos', 'flow');
  fs.mkdirSync(path.dirname(clone), { recursive: true });
  const cloned = spawnSync('git', ['clone', '--quiet', upstream, clone], { encoding: 'utf8' });
  assert.strictEqual(cloned.status, 0, cloned.stderr);
  const out = path.join(dir, 'ran.txt');
  const update = () => flow(dir, ['update', '--root', root, '--no-bin', '--no-clone'], { STUB_OUT: out });
  const logged = () => fs.readFileSync(failures.file(path.join(root, '.flow')), 'utf8').trim().split('\n').map(JSON.parse);
  const marker = path.join(root, '.flow', 'logs', 'setup-pending');
  return { dir, root, upstream, clone, out, marker, update, logged };
}

test('update pulls the clone, owes the setup session, and runs the pulled install with the same flags', () => {
  const m = machine('update-pulls');
  commit(m.upstream, 'scripts/added.txt', 'new\n');

  const ran = m.update();
  assert.strictEqual(ran.code, 0, ran.stderr);
  assert.match(ran.stdout, /^pulled Flow from [0-9a-f]+ to [0-9a-f]+\.$/m);
  assert.ok(fs.existsSync(path.join(m.clone, 'scripts', 'added.txt')), 'the new file arrived');
  assert.strictEqual(fs.readFileSync(m.out, 'utf8'), `install --root ${m.root} --no-bin --no-clone`);
  assert.ok(fs.existsSync(m.marker), 'a session is owed on every update');
});

test('update with nothing new still runs the install', () => {
  const m = machine('update-same');
  const ran = m.update();
  assert.strictEqual(ran.code, 0, ran.stderr);
  assert.match(ran.stdout, /Flow was already at its newest commit\./);
  assert.ok(fs.existsSync(m.out), 'the install ran');
});

test('a pull that cannot fast-forward stops with git\'s message, owes nothing and logs one line', () => {
  const m = machine('update-diverged');
  commit(m.upstream, 'scripts/theirs.txt', 'upstream\n');
  commit(m.clone, 'scripts/mine.txt', 'local\n');

  const ran = m.update();
  assert.strictEqual(ran.code, 1);
  assert.match(ran.stderr, /could not pull .*repos\/flow, so nothing was updated:\n  .*fast-forward/s);
  assert.ok(!fs.existsSync(m.out), 'the install did not run');
  assert.ok(!fs.existsSync(m.marker), 'no session is owed');
  assert.ok(m.logged().some((f) => f.source === 'update' && /could not pull/.test(f.error)));
});

test('update refuses a clone that is a link to another checkout, and a missing clone', () => {
  const m = machine('update-refuses');
  const other = path.join(m.dir, 'dev-checkout');
  fs.mkdirSync(other, { recursive: true });
  fs.rmSync(m.clone, { recursive: true, force: true });
  fs.symlinkSync(other, m.clone);

  const linked = m.update();
  assert.strictEqual(linked.code, 1);
  assert.match(linked.stderr, /repos\/flow is a link to .*dev-checkout, a checkout of your own/);

  fs.unlinkSync(m.clone);
  const missing = m.update();
  assert.strictEqual(missing.code, 1);
  assert.match(missing.stderr, /repos\/flow does not exist/);

  assert.ok(!fs.existsSync(m.out), 'no install ran');
  assert.ok(!fs.existsSync(m.marker), 'no session is owed');
  assert.strictEqual(m.logged().filter((f) => f.source === 'update').length, 2, 'one line each');
});
