#!/usr/bin/env node
'use strict';
/**
 * session-check.js: the SessionStart hook. `lib/session-start.js` says what
 * it checks and what it starts, and this file is the wiring.
 *
 * A line for the user alone goes out as `systemMessage`, and a skill change
 * asks Claude Code to scan the skill folders again.
 *
 * Exit 2 on this event prints a notice the session ignores, so a failure here
 * is silence.
 */

const paths = require('../lib/paths');
const sessionStart = require('../lib/session-start');
const hook = require('../lib/hook');

try {
  const at = paths.folders();
  // Run by hand, with no event on stdin, the working folder stands in.
  const cwd = (hook.event() || {}).cwd || process.cwd();
  const { reminder, reload } = sessionStart.check(at, cwd);

  if (reload || reminder) {
    const output = {};
    if (reload) output.hookSpecificOutput = { hookEventName: 'SessionStart', reloadSkills: true };
    if (reminder) output.systemMessage = reminder;
    hook.reply(output);
  }

  sessionStart.startJobs(at, cwd);
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
