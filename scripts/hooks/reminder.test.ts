/**
 * `reminder`: the UserPromptSubmit hook, and the switch every line Flow prints
 * by itself now answers to.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SCRATCH, run } from '../shared/testing.ts';

const LINE = 'Before replying, follow the rules.\n';

/** A throwaway ~/.flow holding the reminder, and whatever settings it is given. */
function flowHome(name, settings) {
  const dir = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'scripts', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'scripts', 'hooks', 'reminder.md'), LINE);
  if (settings) fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings));
  return dir;
}

const reminder = (home) => run('hooks/reminder.ts', [], { env: { ...process.env, FLOW_HOME: home } });

test('the reminder prints beside every message, and "reminder": false silences it', () => {
  const on = reminder(flowHome('reminder-on', null));
  assert.strictEqual(on.stdout, LINE, 'a machine with no settings file at all still gets it');
  assert.strictEqual(on.code, 0);

  const off = reminder(flowHome('reminder-off', { reminder: false }));
  assert.strictEqual(off.stdout, '');
  assert.strictEqual(off.code, 0);

  const both = flowHome('reminder-local', { reminder: true });
  fs.writeFileSync(path.join(both, 'settings.local.json'), JSON.stringify({ reminder: false }));
  assert.strictEqual(reminder(both).stdout, LINE, 'the local file holds paths, never a switch');
});

test('a missing reminder file prints nothing and still exits 0', () => {
  const dir = path.join(SCRATCH, 'reminder-missing', 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const result = reminder(dir);
  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.code, 0, 'exit 2 on UserPromptSubmit erases what the user typed');
});
