/**
 * The sound a session plays when it needs the user: one when the agent
 * finishes its reply, another when it asks permission.
 *
 *   Stop                                     done
 *   the permissions mod opening its dialog   permission
 *   Notification permission_prompt           permission
 *
 * Every ask goes to the permissions mod's dialog, which plays the sound as it
 * opens. Claude Code's own prompt shows only where that dialog fails, and its
 * `permission_prompt` waits about 6 seconds with nothing typed. Its
 * PermissionRequest event would be at once, but it also fires on every refusal
 * made in the mod's dialog, which would play the sound a second time.
 * `idle_prompt` gets no sound: it fires 60 seconds after the Stop that
 * already played one.
 *
 * Under WSL the sound comes from Windows, through powershell.exe, since WSL
 * has no sound device of its own. Elsewhere it comes from the freedesktop
 * sound theme, through PipeWire or PulseAudio. No player or no file means
 * silence, never a failure.
 *
 * `"sound": false` in ~/.flow/settings.json turns both off.
 */

import fs from 'node:fs';
import { onPath } from '../machine/prereq.ts';
import * as settings from '../../shared/settings.ts';

/** Each sound by platform: a file in `%windir%\Media`, and a freedesktop theme file. */
const SOUNDS = {
  done: { windows: 'Windows Notify Email.wav', linux: 'complete.oga' },
  permission: { windows: 'Windows Ding.wav', linux: 'message-new-instant.oga' },
};

const THEME = '/usr/share/sounds/freedesktop/stereo';

/** Which sound an event plays, or null for one that plays none. */
function soundFor(input): keyof typeof SOUNDS | null {
  if (input?.hook_event_name === 'Stop') return input.stop_hook_active ? null : 'done';
  if (input?.hook_event_name === 'Notification' && input.notification_type === 'permission_prompt') return 'permission';
  return null;
}

/**
 * The command that plays a sound here, or null for silence. `sound` is a key
 * of SOUNDS: the hook's event picks it, or the permissions mod names it.
 * `find` and `exists` stand in for the PATH and the disk in tests.
 */
function command(sound: string | null, { home = undefined as string | undefined, find = onPath, exists = fs.existsSync } = {}) {
  if (!sound || !Object.hasOwn(SOUNDS, sound) || !settings.prints('sound', home)) return null;

  const powershell = find('powershell.exe');
  if (powershell) {
    // PlaySync, since Play returns at once and the process would exit before the sound.
    const file = `$env:windir + '\\Media\\${SOUNDS[sound].windows}'`;
    return { program: powershell, args: ['-NoProfile', '-NonInteractive', '-Command', `(New-Object Media.SoundPlayer (${file})).PlaySync()`] };
  }

  const file = `${THEME}/${SOUNDS[sound].linux}`;
  const player = find('pw-play') || find('paplay');
  return player && exists(file) ? { program: player, args: [file] } : null;
}

export { SOUNDS, soundFor, command };
