'use strict';
/**
 * `compact-check`: the hook that refuses `/compact`, unless the user's
 * settings allow it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { SCRATCH, run } = require('./helpers/scratch');

/** A ~/.flow holding whatever settings it is given. */
function flowHome(name, settings) {
  const dir = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (settings) fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings));
  return dir;
}

const input = JSON.stringify({ hook_event_name: 'PreCompact', trigger: 'manual', custom_instructions: null });
const check = (home) => run('compact-check.js', [], { input, env: { ...process.env, FLOW_HOME: home } });

test('/compact is refused with the way Flow ends a conversation instead', () => {
  const refused = check(flowHome('compact-refused'));
  assert.strictEqual(refused.code, 2);
  assert.match(refused.stderr, /Run \/flow:handoff, then \/clear\./);
});

test('"compact": true lets /compact run', () => {
  const allowed = check(flowHome('compact-allowed', { compact: true }));
  assert.strictEqual(allowed.code, 0);
  assert.strictEqual(allowed.stderr, '');
});
