/**
 * `sound`: which event plays which sound, through which player, and the
 * switch that silences both. Nothing here plays a sound.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SCRATCH } from '../../../shared/testing.ts';
import { command, soundFor } from '../sound.ts';

/** A throwaway ~/.flow holding whatever settings it is given. */
function flowHome(name: string, settings: object | null) {
  const dir = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (settings) fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings));
  return dir;
}

/** A PATH holding only the programs named. */
const only = (...names: string[]) => (name: string) => (names.includes(name) ? `/bin/${name}` : null);

test('a finished reply and a waiting permission prompt each play their own sound, and nothing else plays', () => {
  assert.strictEqual(soundFor({ hook_event_name: 'Stop', stop_hook_active: false }), 'done');
  assert.strictEqual(soundFor({ hook_event_name: 'Notification', notification_type: 'permission_prompt' }), 'permission');
  assert.strictEqual(soundFor({ hook_event_name: 'Stop', stop_hook_active: true }), null, 'a Stop hook keeping the agent going is no finished reply');
  assert.strictEqual(soundFor({ hook_event_name: 'Notification', notification_type: 'idle_prompt' }), null);
  assert.strictEqual(soundFor(null), null, 'a hook run by hand');
});

test('under WSL the sound comes from Windows, elsewhere from the freedesktop theme', () => {
  const home = flowHome('sound-on', null);

  const windows = command('permission', { home, find: only('powershell.exe', 'paplay') });
  assert.ok(windows);
  assert.strictEqual(windows.program, '/bin/powershell.exe');
  assert.match(windows.args.join(' '), /Windows Ding\.wav'\)\)\.PlaySync\(\)$/);

  const linux = command('done', { home, find: only('paplay'), exists: () => true });
  assert.deepStrictEqual(linux, { program: '/bin/paplay', args: ['/usr/share/sounds/freedesktop/stereo/complete.oga'] });

  assert.strictEqual(command('done', { home, find: only(), exists: () => true }), null, 'no player is silence');
  assert.strictEqual(command('done', { home, find: only('paplay'), exists: () => false }), null, 'no sound theme is silence');
  assert.strictEqual(command('toString', { home, find: only('powershell.exe') }), null, 'a name that is no sound');
});

test('"sound": false silences both sounds', () => {
  const home = flowHome('sound-off', { sound: false });
  const find = only('powershell.exe');
  assert.strictEqual(command('done', { home, find }), null);
  assert.strictEqual(command('permission', { home, find }), null);
});
