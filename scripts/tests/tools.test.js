'use strict';
/**
 * `ptree`, `fmerge` and `guard` — one file, because each is a single script
 * with a small surface, and splitting them buys three headers and no clarity.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { project, write, run } = require('./helpers/scratch');

test('ptree prints each entry with its own description', () => {
  const dir = project('ptree-tree');
  write(dir, 'src/parser.js', '// description: Splits the input into tokens.\n');
  write(dir, 'notes.md', '# Notes\n');
  write(dir, 'node_modules/junk/index.js', 'module.exports = 1;\n');

  const result = run('ptree.js', [dir]);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /parser\.js/);
  assert.match(result.stdout, /Splits the input into tokens/);
  assert.doesNotMatch(result.stdout, /node_modules/, 'node_modules is hidden by default');
});

test('fmerge fences each file under its path, and honours a line range', () => {
  const dir = project('fmerge-merge');
  write(dir, 'a.js', 'one\ntwo\nthree\nfour\n');
  write(dir, 'b.md', '# heading\n');

  const whole = run('fmerge.js', [`${dir}/a.js`, `${dir}/b.md`]);
  assert.strictEqual(whole.code, 0, whole.stderr);
  assert.match(whole.stdout, /```javascript .*a\.js/);
  assert.match(whole.stdout, /```markdown .*b\.md/);
  assert.match(whole.stdout, /three/);

  const sliced = run('fmerge.js', [`${dir}/a.js:2-3`]);
  assert.strictEqual(sliced.code, 0, sliced.stderr);
  assert.match(sliced.stdout, /two/);
  assert.doesNotMatch(sliced.stdout, /four/, 'a range stops where it says it stops');
});

/** The shape Claude Code hands a PreToolUse hook on stdin. */
function toolCall(command, cwd) {
  return JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd });
}

test('guard denies a git write, passes a git read, and asks about an outside delete', () => {
  const dir = project('guard-verdicts');

  const write_ = run('guard.js', [], { input: toolCall('git commit -m "x"', dir) });
  assert.match(write_.stdout, /"permissionDecision":"deny"/);

  const read = run('guard.js', [], { input: toolCall('git status --porcelain', dir) });
  assert.strictEqual(read.stdout.trim(), '', 'a read gets no verdict at all');

  const inside = run('guard.js', [], { input: toolCall('rm -rf build', dir) });
  assert.strictEqual(inside.stdout.trim(), '');

  const outside = run('guard.js', [], { input: toolCall('rm -rf /tmp/somewhere-else', dir) });
  assert.match(outside.stdout, /"permissionDecision":"ask"/);
});

test('guard denies an unknown git subcommand rather than letting it through', () => {
  const dir = project('guard-unknown');
  const result = run('guard.js', [], { input: toolCall('git frobnicate --all', dir) });
  assert.match(result.stdout, /"permissionDecision":"deny"/);
});
