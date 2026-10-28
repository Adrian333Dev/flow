#!/usr/bin/env node
/**
 * reminder.ts: the UserPromptSubmit hook.
 *
 * Claude Code puts whatever this prints to standard output beside the message
 * the user just sent. The rules for writing a reply sit at the end of a long
 * file loaded once, at the start of a session, so by turn 15 they are far
 * behind the conversation. A line arriving with the message puts them back in
 * front of the agent.
 *
 * The text lives beside this file, one version per file in reminders/,
 * reached through the symlink ~/.flow/scripts, so changing the line stays one
 * edit and no code. `"reminder"` in ~/.flow/settings.json picks the version,
 * or `false` silences it (features/reminder/versions.ts).
 *
 * Nothing here ever exits non-zero. Exit 2 on this event rejects the prompt
 * and erases what the user typed, so a missing file prints nothing instead.
 */

import fs from 'node:fs';
import * as versions from '../features/reminder/versions.ts';

const file = versions.file();
if (file) {
  try {
    process.stdout.write(fs.readFileSync(file, 'utf8'));
  } catch {
    // A reminder nobody can read is a reminder nobody gets. Never a failure.
  }
}
