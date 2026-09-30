'use strict';
/**
 * `check-ticket`: the UserPromptExpansion hook that refuses a typed phase
 * skill on a machine or a project Flow was never set up in.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run } = require('./helpers/scratch');

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

test('check-ticket blocks when setup never ran, and a bare /flow:start outside a project', () => {
  const dir = project('check-ticket-unset');

  fs.rmSync(path.join(dir, 'flow-home', 'version'));
  const machine = check('groundwork', '', dir);
  assert.strictEqual(machine.code, 0);
  assert.match(machine.stdout, /"decision":"block"/);
  assert.match(machine.stdout, /not set up on this machine\. Run flow install\./);

  fs.writeFileSync(path.join(dir, 'flow-home', 'version'), '2026-09-20\n');
  fs.rmSync(path.join(dir, '.flow'), { recursive: true });
  const board = check('flow:start', '', dir);
  assert.strictEqual(board.code, 0);
  assert.match(board.stdout, /not a Flow project yet.*flow init/);
});

test('check-ticket passes a phase skill, free text, a typed id and a path outside a Flow project', () => {
  const dir = project('check-ticket-loose');
  fs.rmSync(path.join(dir, '.flow'), { recursive: true });
  for (const [name, args] of [['groundwork', 'write the map for pricing'], ['groundwork', ''], ['execute', 'exp-999'], ['flow:start', 'notes/handoff.md'], ['debug', '']]) {
    const result = check(name, args, dir);
    assert.strictEqual(result.code, 0);
    assert.strictEqual(result.stdout.trim(), '', `blocked /${name} ${args}`);
  }
});
