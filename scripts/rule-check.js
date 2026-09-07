#!/usr/bin/env node
'use strict';
/**
 * rule-check.js: the PreToolUse hook on Edit and Write.
 *
 * One hook, one script, every check. Recording, warning and blocking are the
 * same check at the same moment, and each check's own `tier` field decides
 * which of the three happens. No hook per rule, and no second script that only
 * warns.
 *
 * Where the checks live and what one must declare is in flow/lib/checks.js.
 * Where the counts go is flow/lib/scorecard.js. This file is the wiring.
 *
 * A warning the agent must read goes in `additionalContext`.
 * `permissionDecisionReason` reaches Claude only on a deny; on an allow it goes
 * to the terminal and nowhere else, so a warning written there is a warning
 * nobody acts on.
 *
 * When the rule's own file never loaded this session, the warning carries the
 * rule's whole text instead of its id. Path-scoped rules fire on a read, and
 * creating a file is not a read, so writing src/foo.ts in a session that opened
 * no .ts file leaves the TypeScript rules out of context entirely. That hole is
 * the reason this hook exists.
 *
 * It never returns "allow". guard.js takes the same line: a hook that only ever
 * denies or stays quiet cannot widen what the permission system already
 * allows, so a bug here fails safe.
 *
 * Unlike guard.js, a throw here falls through silently. guard.js is the last
 * thing standing between the agent and git, so it fails closed. This file
 * measures writing habits, and breaking every edit in the session over a bug in
 * one check would cost far more than the counts are worth.
 */

const fs = require('fs');
const path = require('path');
const checks = require('./flow/lib/checks');
const scorecard = require('./flow/lib/scorecard');

function read(stream) {
  try {
    return fs.readFileSync(stream, 'utf8');
  } catch {
    return '';
  }
}

/**
 * The text a check asked for.
 *
 * `added` is only what this edit introduces, which is what a rule about new
 * code wants. `file` is the whole file as it will read afterwards, which is
 * what a rule about the shape of a file wants, and it has to be reconstructed
 * for an Edit because the tool call carries a fragment.
 */
function contentFor(need, tool, input) {
  if (tool === 'Write') return typeof input.content === 'string' ? input.content : '';
  if (need === 'added') return typeof input.new_string === 'string' ? input.new_string : '';

  let before = '';
  try {
    before = fs.readFileSync(input.file_path, 'utf8');
  } catch {
    return typeof input.new_string === 'string' ? input.new_string : '';
  }
  const from = input.old_string;
  const to = typeof input.new_string === 'string' ? input.new_string : '';
  if (typeof from !== 'string' || !from) return before;
  return input.replace_all ? before.split(from).join(to) : before.replace(from, to);
}

function emit(payload) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...payload } }));
}

function main() {
  const call = JSON.parse(read(0));
  const tool = call.tool_name;
  if (tool !== 'Edit' && tool !== 'Write') return;

  const input = call.tool_input || {};
  const file = input.file_path;
  if (!file) return;

  const { checks: all } = checks.load();
  if (!all.length) return;

  const loaded = scorecard.loadedIn(call.session_id);
  const project = call.cwd ? path.basename(call.cwd) : '';
  const warnings = [];
  const blocks = [];

  for (const c of all) {
    let content;
    try {
      content = contentFor(c.needs, tool, input);
      if (!c.applies(file, content)) continue;
    } catch {
      // A check that throws on `applies` is broken, not violated. Skipping it
      // keeps one bad file from marking every edit as a violation.
      continue;
    }

    let ok;
    try {
      ok = c.check(file, content) !== false;
    } catch {
      continue;
    }

    scorecard.append(call.session_id, { kind: 'result', id: c.id, tier: c.tier, since: c.since, project, ok });
    if (ok || c.tier === 'measure') continue;

    // The agent already holds the rule when its file is in context, so the id
    // is enough. When it does not, telling it to go read the file costs a turn
    // and can be skipped; the text cannot.
    const rule = checks.rulePath(c.rule);
    const body = loaded.has(rule) ? null : checks.ruleText(rule, c.id);
    const line = body ? `${c.message}\n\n${body}` : `${c.message} (${c.id})`;
    (c.tier === 'block' ? blocks : warnings).push(line);
  }

  if (blocks.length) {
    emit({ permissionDecision: 'deny', permissionDecisionReason: blocks.join('\n\n') });
    return;
  }
  if (warnings.length) emit({ additionalContext: warnings.join('\n\n') });
}

try {
  main();
} catch {
  // Silence is the whole point. See the note at the top of the file.
}
