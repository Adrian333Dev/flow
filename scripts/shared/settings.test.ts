/**
 * `flow settings`: the on/off settings Flow reads, switched for one folder or
 * for every project (`--global`). Each test builds a scratch machine with a home folder
 * holding one git repository, so a folder switch has a folder to name.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRATCH, run } from './testing.ts';

function place(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  const shop = path.join(user, 'code', 'shop');
  fs.mkdirSync(shop, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  assert.strictEqual(spawnSync('git', ['init', '-q'], { cwd: shop }).status, 0);

  const env: NodeJS.ProcessEnv = {
    ...process.env, HOME: user, FLOW_HOME: home, CLAUDE_CONFIG_DIR: path.join(user, '.claude'), GIT_CEILING_DIRECTORIES: SCRATCH,
  };
  delete env.FLOW_PROJECT;
  const flow = (...args) => run('flow.ts', ['settings', ...args], { cwd: shop, env });
  const session = () => run('hooks/session-check.ts', [], {
    input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd: shop }), env,
  });
  return { user, home, shop, flow, session };
}

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('off with no flag stops the setup line in this repository alone, and on brings it back', () => {
  const at = place('settings-folder');
  assert.match(JSON.parse(at.session().stdout).systemMessage, /flow settings off setupReminder/);

  const off = at.flow('off', 'setupReminder');
  assert.strictEqual(off.code, 0, off.stderr);
  assert.strictEqual(off.stdout, 'off: setupReminder, this folder.\n');
  assert.deepStrictEqual(read(path.join(at.home, 'settings.local.json')), { setupReminderSkip: ['~/code/shop'] });
  assert.strictEqual(at.session().stdout, '', 'the line is gone here');
  assert.match(at.flow().stdout, /setupReminder\s+off\s+this folder/);

  at.flow('on', 'setupReminder');
  assert.deepStrictEqual(read(path.join(at.home, 'settings.local.json')), {}, 'the emptied list goes too');
  assert.match(JSON.parse(at.session().stdout).systemMessage, /not set up here/);
});

test('--global writes the shared file, and the local file switches nothing', () => {
  const at = place('settings-levels');
  const off = at.flow('off', 'reminder', '--global');
  assert.strictEqual(off.stdout, 'off: reminder, everywhere.\n');
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')), { reminder: false });
  assert.match(at.flow().stdout, /reminder\s+off\s+everywhere/);

  // settings.local.json holds paths: a switch written there by hand does nothing.
  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ reminder: true }));
  assert.match(at.flow().stdout, /reminder\s+off\s+everywhere/);

  const reset = at.flow('reset', 'reminder', '--global');
  assert.strictEqual(reset.stdout, 'reset: reminder, everywhere.\nreminder is now on here.\n');
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')), {}, 'the line is gone');

  // A folder that says off still wins over on everywhere.
  at.flow('off', 'setupReminder');
  const back = at.flow('on', 'setupReminder', '--global');
  assert.match(back.stdout, /setupReminder is still off here, since this folder says so\./);

  const machine = at.flow('on', 'reminder', '--machine');
  assert.strictEqual(machine.code, 1);
  assert.match(machine.stderr, /unknown flag "--machine", one of: --global/);
});

test('ls shows each number setting beside its default, and yours once a file sets it', () => {
  const at = place('settings-values');
  assert.match(at.flow().stdout, /^value\s+default\s+yours\s*$/m);
  assert.match(at.flow().stdout, /^wrapUpAt\s+170000\s{2,}the conversation size/m, 'nothing set: yours is blank');

  fs.writeFileSync(path.join(at.home, 'settings.json'), JSON.stringify({ wrapUpAt: 200000 }));
  assert.match(at.flow().stdout, /^wrapUpAt\s+170000\s+200000\s+the conversation size/m);

  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ wrapUpAt: 120000 }));
  assert.match(at.flow().stdout, /^wrapUpAt\s+170000\s+120000\s/m, 'the local file wins');

  assert.match(at.flow().stdout, /^keepWarmLead\s+3\s{2,}minutes before/m);
  assert.match(at.flow().stdout, /^keepWarmMaxIdle\s+4\s{2,}hours after/m);
});

test('a setting with no folder list, and a word naming no setting, each refuse and say what works', () => {
  const at = place('settings-refusals');
  const folder = at.flow('off', 'reminder');
  assert.strictEqual(folder.code, 1);
  assert.match(folder.stderr, /reminder has no per-folder switch\. Add --global to switch it everywhere\./);

  const unknown = at.flow('off', 'reminders', '--global');
  assert.match(unknown.stderr, /no setting "reminders", one of: reminder, sessionCheck, setupReminder, wrapUp/);
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.json')), 'nothing written');
});
