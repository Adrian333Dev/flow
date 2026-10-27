#!/usr/bin/env node
/**
 * session-check.ts: the SessionStart hook. `features/session-start/session-start.ts` says what
 * it checks and what it starts, and this file is the wiring.
 *
 * A line for the user alone goes out as `systemMessage`.
 *
 * Exit 2 on this event prints a notice the session ignores, so a failure here
 * is silence.
 */

import * as paths from '../shared/paths.ts';
import * as sessionStart from '../features/session-start/session-start.ts';
import * as hook from '../shared/hook.ts';

try {
  const at = paths.folders();
  // Run by hand, with no event on stdin, the working folder stands in.
  const cwd = (hook.event() || {}).cwd || process.cwd();
  const { reminder } = sessionStart.check(at, cwd);
  if (reminder) hook.reply({ systemMessage: reminder });

  sessionStart.startJobs(at, cwd);
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
