#!/usr/bin/env node
'use strict';
/**
 * session-check.js: the SessionStart hook. `lib/session-start.js` says what
 * it checks and what it starts, and this file is the wiring.
 *
 * Claude Code adds what a SessionStart hook prints into the session's
 * context, so a line reaches the agent and the user at the same moment. A
 * line for the user alone goes out as `systemMessage`.
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
  const { lines, reminder, reload } = sessionStart.check(at, cwd);

  const text = lines.join('\n');
  if (reload || reminder) {
    const said = { hookEventName: 'SessionStart' };
    if (reload) said.reloadSkills = true;
    if (text) said.additionalContext = text;
    const output = reload || text ? { hookSpecificOutput: said } : {};
    if (reminder) output.systemMessage = reminder;
    hook.reply(output);
  } else if (text) {
    process.stdout.write(text + '\n');
  }

  sessionStart.startJobs(at, cwd);
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
