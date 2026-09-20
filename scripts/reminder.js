#!/usr/bin/env node
'use strict';
/**
 * reminder.js: the UserPromptSubmit hook.
 *
 * Claude Code puts whatever this prints to standard output beside the message
 * the user just sent. The rules for writing a reply sit at the end of a long
 * file loaded once, at the start of a session, so by turn 15 they are far
 * behind the conversation. A line arriving with the message puts them back in
 * front of the agent.
 *
 * The text lives in references/reminder.md, reached through the symlink
 * ~/.flow/references, so changing the line stays one edit and no code.
 *
 * The hook ran `cat` over that file until 2026-09-20. A bare `cat` cannot read
 * a setting, and every line Flow prints by itself now answers to one:
 * `"reminder": false` in ~/.flow/settings.json silences this one.
 *
 * Nothing here ever exits non-zero. Exit 2 on this event rejects the prompt
 * and erases what the user typed, so a missing file prints nothing instead.
 */

const fs = require('fs');
const path = require('path');
const settings = require('./flow/lib/settings');

if (settings.prints('reminder')) {
  try {
    const file = path.join(settings.flowHome(), 'references', 'reminder.md');
    process.stdout.write(fs.readFileSync(file, 'utf8'));
  } catch {
    // A reminder nobody can read is a reminder nobody gets. Never a failure.
  }
}
