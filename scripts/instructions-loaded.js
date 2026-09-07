#!/usr/bin/env node
'use strict';
/**
 * instructions-loaded.js: the InstructionsLoaded hook.
 *
 * Claude Code fires this whenever a CLAUDE.md or a .claude/rules/*.md file
 * enters context: at session start for the files loaded eagerly, and again
 * later when a path-scoped rule matches something the agent read. It fires once
 * more with load_reason "compact" after a compaction, so the record survives
 * one.
 *
 * All this file does is write down which files arrived. rule-check.js reads
 * that list back: a warning names the rule id when the rule's own file is in
 * context, and carries the rule's whole text when it is not.
 *
 * The event has no decision control at all. Claude Code discards whatever this
 * prints and ignores the exit code, so there is nothing to return and no way to
 * fail loudly. It records or it does not.
 */

const fs = require('fs');
const scorecard = require('./flow/lib/scorecard');

try {
  const call = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (call.file_path) {
    scorecard.append(call.session_id, {
      kind: 'loaded',
      file: call.file_path,
      memory: call.memory_type || '',
      why: call.load_reason || '',
    });
  }
} catch {
  // Nothing reads an error from here, so there is nothing useful to do with one.
}
