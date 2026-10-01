#!/usr/bin/env node
'use strict';
/**
 * compact-check.js: the PreCompact hook, registered for `/compact` typed by
 * the user.
 *
 * Refuses it. Compacting swaps the conversation for Claude Code's summary of
 * it, and Flow ends a long conversation differently: /flow:handoff writes
 * what the next session needs, and /clear starts that session. Exit 2 blocks
 * the compaction, and Claude Code shows what this prints to the user.
 *
 * `"compact": true` in ~/.flow/settings.json lets `/compact` run. Automatic
 * compaction is a setting of Claude Code's own, `autoCompactEnabled`, which
 * Flow's settings turn off, so this hook never sees it.
 */

const settings = require('./flow/lib/settings');

try {
  if (settings.readGlobal().compact === true) process.exit(0);
} catch {
  // An unreadable settings file refuses, the way a missing one does.
}
process.stderr.write('Flow does not compact. Run /flow:handoff, then /clear. "compact": true in ~/.flow/settings.json allows /compact.\n');
process.exit(2);
