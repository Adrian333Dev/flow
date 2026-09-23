'use strict';
/**
 * `check-ticket`: the UserPromptExpansion hook that refuses a typed phase
 * skill on a machine or a project Flow was never set up in, and one whose
 * ticket id matches nothing.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
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

function check(name, args, dir, env = {}) {
  return run('check-ticket.js', [], {
    input: typed(name, args, dir),
    cwd: dir,
    env: { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: path.join(dir, 'flow-home'), ...env },
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

test('check-ticket blocks before the ticket check when setup never ran', () => {
  const dir = project('check-ticket-unset');

  fs.rmSync(path.join(dir, 'flow-home', 'version'));
  const machine = check('groundwork', '', dir);
  assert.strictEqual(machine.code, 0);
  assert.match(machine.stdout, /"decision":"block"/);
  assert.match(machine.stdout, /not set up on this machine\. Run flow install again\./);

  fs.writeFileSync(path.join(dir, 'flow-home', 'version'), '2026-09-20\n');
  fs.rmSync(path.join(dir, '.flow'), { recursive: true });
  const inProject = check('groundwork', 'write the map', dir);
  assert.strictEqual(inProject.code, 0);
  assert.match(inProject.stdout, /not a Flow project yet.*\/flow:setup-project/, 'a message with no ticket id still blocks');
});
