'use strict';
/**
 * `flow overlays get` — the command every skill's last line runs.
 *
 * Its two silences matter more than its output. A skill loads in projects that
 * carry no overlay and in folders that are not projects at all, and neither may
 * put an error where the skill body goes.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { project, write, run, flow, REPO } = require('./helpers/scratch');

test('an overlay prints whole, and its absence prints nothing', () => {
  const dir = project('overlay-get');

  const missing = flow(dir, ['overlays', 'get', 'groundwork']);
  assert.strictEqual(missing.code, 0, missing.stderr);
  assert.strictEqual(missing.stdout, '', 'no overlay file means no output');

  write(dir, '.flow/overlays/groundwork.md', '## Overrides\n\nSkip phase 3 here.');

  const found = flow(dir, ['overlays', 'get', 'groundwork']);
  assert.strictEqual(found.code, 0, found.stderr);
  assert.strictEqual(found.stdout, '## Overrides\n\nSkip phase 3 here.\n');

  // get is the default, which is the form every skill's last line runs.
  const short = flow(dir, ['overlays', 'groundwork']);
  assert.strictEqual(short.code, 0, short.stderr);
  assert.strictEqual(short.stdout, found.stdout);
});

test('outside a git repository it prints nothing and succeeds', () => {
  const dir = project('overlay-no-repo');

  // The scratch folder sits inside the Flow repo, so git would find that one.
  // A ceiling stops the search below it, which is the state a skill invoked in
  // a loose folder actually meets.
  const result = run('flow/flow.js', ['overlays', 'get', 'groundwork'], {
    cwd: dir,
    env: { ...process.env, GIT_CEILING_DIRECTORIES: path.join(REPO, 'tmp') },
  });

  assert.strictEqual(result.code, 0, result.stderr);
  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.stderr, '');
});

test('a missing name and a path both fail', () => {
  const dir = project('overlay-bad-name');

  const bare = flow(dir, ['overlays', 'get']);
  assert.notStrictEqual(bare.code, 0);
  assert.match(bare.stderr, /usage: flow overlays get/);

  const traversal = flow(dir, ['overlays', 'get', '../../etc/passwd']);
  assert.notStrictEqual(traversal.code, 0);
  assert.match(traversal.stderr, /skill name, not a path/);
});
