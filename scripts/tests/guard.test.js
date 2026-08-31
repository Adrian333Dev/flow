'use strict';
/**
 * `guard` — the PreToolUse hook that vets a Bash call before it runs.
 *
 * `ptree` and `fmerge` were tested here too, until 2026-08-30 moved both into
 * the `util` repo as `fs tree` and `fs merge`. Their tests moved with them.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { project, run } = require('./helpers/scratch');

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
