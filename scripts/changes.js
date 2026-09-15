#!/usr/bin/env node
'use strict';
/**
 * changes.js: hands the parent what each subagent changed, as a diff per file
 * and the commands that changed them.
 *
 * A subagent saying "done" proves nothing, and neither does its list of files.
 * This hook records every change as it happens, under the id of the agent that
 * made it, so 3 workers editing at once each get only their own diff. The
 * parent never matches a change to a worker.
 *
 * Registered on 6 events, and flow/lib/changes.js holds the logic:
 *
 *   PreToolUse, PostToolUse, PostToolUseFailure on Edit, Write, Bash, mcp__*
 *                   each call's changes, filed under its agent
 *   SubagentStart   the snapshot the safety net compares against
 *   SubagentStop    the record, built and put in the outbox
 *   PostToolUse on Agent and SendMessage, with --wait
 *                   the waiter, which hands the record to the parent
 *
 * The waiter runs in the background with asyncRewake, because a background
 * subagent's Agent call returns the moment it launches, long before any change.
 * Exit code 2 wakes the parent. Claude Code shows the text as a "Stop hook
 * blocking error" from "PostToolUse:Agent", and the error in that label is
 * Claude Code's framing, not a failure.
 *
 * Silent wherever it has nothing to say: not a git repository, nothing changed,
 * any failure at all. A broken record must never take a tool call down with it.
 */

const fs = require('fs');
const changes = require('./flow/lib/changes');

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const result = changes.handle(data, { wait: process.argv.includes('--wait') });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.code || 0;
