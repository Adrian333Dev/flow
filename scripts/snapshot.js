#!/usr/bin/env node
'use strict';
/**
 * snapshot.js — hands the parent the diff of what a subagent changed.
 *
 * Registered twice on the Agent tool: PreToolUse with --before, PostToolUse
 * with --after. Reads the tool call as JSON on stdin, the same way guard.js
 * does, and pairs the two events by their shared tool_use_id.
 *
 * A snapshot is `git write-tree` against a throwaway index: it records the
 * whole working tree, dirty parts included, while the real index, the working
 * files and HEAD stay untouched. It writes objects and moves nothing.
 *
 * Two snapshots taken around one dispatch both contain whatever was already
 * dirty, so comparing them cancels it out and leaves exactly what the subagent
 * did. Plain `git diff` cannot separate that in a repo nobody commits.
 *
 * Why a hook rather than instructions in `execute`: the before-snapshot has to
 * be taken before the subagent exists, and a skill can be skipped at exactly
 * that moment. A hook cannot forget.
 *
 * Silent wherever it has nothing to say — not a git repo, no stored snapshot,
 * nothing changed, any failure at all. A hook that prints nothing changes
 * nothing, and a broken diff must never take a dispatch down with it.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Above this, the patch goes to a file and the parent gets the file list plus
// the path. Claude Code caps hook output at 10,000 characters and truncates
// past it; stopping first trades a truncated head for every filename.
const MAX_PATCH = 8000;

const STATE_DIR = path.join(os.tmpdir(), 'flow-snapshots');

const git = (args, cwd, env) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, ...env },
  });

/** The hash of a tree object holding every file as it stands right now. */
function snapshot(cwd) {
  const index = path.join(STATE_DIR, `index-${process.pid}-${Date.now()}`);
  try {
    git(['add', '-A'], cwd, { GIT_INDEX_FILE: index });
    return git(['write-tree'], cwd, { GIT_INDEX_FILE: index }).trim();
  } finally {
    fs.rmSync(index, { force: true });
  }
}

function emit(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: text,
    },
  }) + '\n');
}

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const cwd = data.cwd || process.cwd();
const id = data.tool_use_id;
if (!id) process.exit(0);

const statePath = path.join(STATE_DIR, `${id}.json`);

try {
  git(['rev-parse', '--git-dir'], cwd);
} catch {
  process.exit(0); // Not a git repo. Nothing to compare against.
}

try {
  if (process.argv[2] === '--before') {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify({ cwd, tree: snapshot(cwd) }));
    process.exit(0);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  fs.rmSync(statePath, { force: true });

  // The directory moved between the two events, so the pair describes two
  // different trees and any diff of them would be fiction.
  if (state.cwd !== cwd) process.exit(0);

  const after = snapshot(cwd);
  if (state.tree === after) process.exit(0);

  const patch = git(['diff-tree', '-p', '-r', state.tree, after], cwd);
  if (!patch.trim()) process.exit(0);

  if (patch.length <= MAX_PATCH) {
    emit(`The subagent changed these files:\n\n${patch}`);
    process.exit(0);
  }

  const patchPath = path.join(STATE_DIR, `${id}.patch`);
  fs.writeFileSync(patchPath, patch);
  const stat = git(['diff-tree', '-r', '--stat', state.tree, after], cwd);
  emit(
    `The subagent changed these files. The patch was too large to inline, so ` +
    `every file is listed here and the full patch is at ${patchPath} — read it ` +
    `for any file whose changes matter.\n\n${stat}`
  );
} catch {
  process.exit(0);
}
