'use strict';
/**
 * `flow sync` and `lib/flow-repo.js`: `~/.flow/` as one private git
 * repository, which is the whole of how Flow reaches a second machine.
 *
 * The list of what never travels, the `.gitignore` written from it, the
 * refusals, and a round trip between 2 machines through a bare repository in
 * the scratch folder, standing in for GitHub. The second machine is a clone
 * of that repository: how a machine with its own `~/.flow/` joins one is not
 * built.
 */

const { test } = require('node:test');
const { spawnSync } = require('child_process');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run } = require('./helpers/scratch');
const repo = require('../flow/lib/flow-repo');
const folders = require('../flow/lib/machine').folders;

/** A set-up machine with nothing in ~/.flow/ but the version stamp. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const at = folders(root);
  fs.mkdirSync(at.flow, { recursive: true });
  fs.writeFileSync(path.join(at.flow, 'version'), '2026-09-20\n');
  return { dir, root, at };
}

test('what belongs to one machine is what the ignore file names', () => {
  const m = machine('sync-ignore');
  repo.writeIgnore(m.at);

  const lines = fs.readFileSync(path.join(m.at.flow, '.gitignore'), 'utf8')
    .split('\n').filter((l) => l && !l.startsWith('#'));

  assert.deepStrictEqual(lines, [
    'version',
    'run.json',
    'setup-prompt.md',
    'migrate-prompt.md',
    'originals/',
    'settings.local.json',
    'scripts',
    'references',
    'docs',
    'repos/',
    'history.jsonl',
    'install.log',
    'skills-update.json',
    'skills-update.lock',
    'wiki/*/downloads/',
  ]);
  assert.strictEqual(repo.isRepo(m.at), false, 'writing the ignore file makes no repository');
  assert.strictEqual(repo.changed(m.at), null, 'and nothing counts as changed');
});

test('sync on a ~/.flow that is not a repository says so and stops', () => {
  const m = machine('sync-bare');
  const refused = run('flow/flow.js', ['sync', '--root', m.root], { cwd: m.dir });

  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /is not a repository yet\. Run flow install and give it one\./);
});

test('sync refuses on a machine where setup never finished', () => {
  const m = machine('sync-unset');
  fs.rmSync(path.join(m.at.flow, 'version'));

  const refused = run('flow/flow.js', ['sync', '--root', m.root], { cwd: m.dir });
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /not set up on this machine\. Run flow setup\./);

  // A setup part way through runs flow commands of its own, and stamps the
  // version only at its end, so its run.json lets them through.
  fs.writeFileSync(path.join(m.at.flow, 'run.json'), JSON.stringify({ type: 'setup-machine', step: 5 }));
  const during = run('flow/flow.js', ['sync', '--root', m.root], { cwd: m.dir });
  assert.doesNotMatch(during.stderr, /not set up/);

  fs.writeFileSync(path.join(m.at.flow, 'run.json'), JSON.stringify({ type: 'migrate', step: 5 }));
  const migrating = run('flow/flow.js', ['sync', '--root', m.root], { cwd: m.dir });
  assert.match(migrating.stderr, /not set up on this machine/, 'only a setup passes');
});

test('the first sync sends to an empty remote, and each machine brings the other\'s work down', () => {
  const a = machine('sync-a');
  const remote = path.join(a.dir, 'remote.git');
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
  repo.start(a.at, remote);
  fs.writeFileSync(path.join(a.at.flow, 'workflow-notes.md'), 'from a\n');
  const sync = (m) => run('flow/flow.js', ['sync', '--root', m.root], { cwd: m.dir });

  const first = sync(a);
  assert.strictEqual(first.code, 0, first.stderr);
  assert.match(first.stdout, /^nothing new came down\.\nwent up: .+: 2 files$/m, 'the notes and the ignore file');

  const b = machine('sync-b');
  fs.rmSync(b.at.flow, { recursive: true });
  spawnSync('git', ['clone', '-q', remote, b.at.flow]);
  fs.writeFileSync(path.join(b.at.flow, 'version'), '2026-09-20\n');
  assert.match(sync(b).stdout, /^nothing new came down\.\nnothing changed here, so nothing went up\.$/m, 'version is ignored');

  fs.appendFileSync(path.join(b.at.flow, 'workflow-notes.md'), 'from b\n');
  assert.match(sync(b).stdout, /went up: .+: 1 file$/m);
  const back = sync(a);
  assert.match(back.stdout, /^came down: /m);
  assert.strictEqual(fs.readFileSync(path.join(a.at.flow, 'workflow-notes.md'), 'utf8'), 'from a\nfrom b\n');

  // The same file changed on both sides: the pull refuses, and says why.
  fs.appendFileSync(path.join(a.at.flow, 'workflow-notes.md'), 'again from a\n');
  assert.strictEqual(sync(a).code, 0);
  fs.appendFileSync(path.join(b.at.flow, 'workflow-notes.md'), 'again from b\n');
  const refused = sync(b);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /the pull would not fast-forward, so nothing came down:\n {2}error: Your local changes to the following files would be overwritten by merge:/);
  assert.match(fs.readFileSync(path.join(b.at.flow, 'workflow-notes.md'), 'utf8'), /again from b\n$/, 'nothing of b\'s was lost');
});
