'use strict';
/**
 * `check-ticket`: the UserPromptExpansion hook that refuses a typed phase
 * skill whose ticket id matches nothing.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { project, run, flow } = require('./helpers/scratch');

/** The shape Claude Code hands a UserPromptExpansion hook on stdin. */
function typed(command_name, command_args, cwd) {
  return JSON.stringify({
    hook_event_name: 'UserPromptExpansion',
    expansion_type: 'slash_command',
    command_name,
    command_args,
    cwd,
    prompt: `/${command_name} ${command_args}`.trim(),
  });
}

function check(name, args, dir) {
  return run('check-ticket.js', [], {
    input: typed(name, args, dir),
    cwd: dir,
    env: { ...process.env, FLOW_PROJECT: dir },
  });
}

test('check-ticket blocks an id that matches nothing, bare or with a label, and says which', () => {
  const dir = project('check-ticket-miss');
  for (const args of ['t999', 't999-old-label', 't999 and some text']) {
    const result = check('groundwork', args, dir);
    assert.strictEqual(result.code, 0);
    assert.match(result.stdout, /"decision":"block"/, `no block for "${args}"`);
    assert.match(result.stdout, /t999/);
  }
});

test('check-ticket passes a real id, free text, an id followed by text, and nothing', () => {
  const dir = project('check-ticket-pass');
  const made = flow(dir, ['new', 'a ticket to find']);
  assert.strictEqual(made.code, 0, made.stderr);
  const id = made.stdout.match(/t\d+/)[0];

  const label = made.stdout.match(/t\d+-[a-z-]+/)[0];
  for (const args of [id, label, `${id} focus on the auth part`, 'write the map for the login flow', '47', '']) {
    const result = check('groundwork', args, dir);
    assert.strictEqual(result.code, 0);
    assert.strictEqual(result.stdout.trim(), '', `no verdict for "${args}"`);
  }
});
