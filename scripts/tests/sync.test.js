'use strict';
/**
 * `flow sync` and `lib/flow-repo.js`: `~/.flow/` as one private git
 * repository, which is the whole of how Flow reaches a second machine.
 *
 * What is tested here is the part that runs no git command: the list of what
 * never travels, the `.gitignore` written from it, and the refusal on a
 * `~/.flow/` that was never made a repository. Sending and bringing down are
 * not covered, and are named as a gap in `lab/context/handoff.md`.
 */

const { test } = require('node:test');
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
    'originals/',
    'settings.local.json',
    'scripts',
    'references',
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
  assert.match(refused.stderr, /not set up on this machine.*\/flow:setup-machine/);
});
