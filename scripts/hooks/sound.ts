#!/usr/bin/env node
/**
 * sound.ts: the Stop and Notification hook that plays a notification sound.
 *
 *   sound.ts               plays the sound for the event on stdin
 *   sound.ts <sound>       plays that sound, `permission` or `done`: the
 *                          permissions mod, which has no stdin to give
 *
 * `features/sound/sound.ts` picks the sound and the player. Settings run this
 * hook async, so the second or two of playing never holds up a turn.
 *
 * Prints nothing and always exits 0: a sound that cannot play is no reason
 * to disturb the session.
 */

import { spawnSync } from 'node:child_process';
import * as sound from '../features/sound/sound.ts';
import * as hook from '../shared/hook.ts';

try {
  const play = sound.command(process.argv[2] || sound.soundFor(hook.event()));
  if (play) spawnSync(play.program, play.args, { stdio: 'ignore', timeout: 10000 });
} catch {
  // Silence is the fallback for every failure.
}
