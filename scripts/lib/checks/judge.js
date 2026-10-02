'use strict';
/**
 * One edit judged against every rule check: what `hooks/rule-check.js` runs
 * on each Edit and Write. Each check's own `tier` decides whether a failure
 * is recorded, warned about or blocked. Where the checks live and what one
 * must declare is `checks.js`, and where the counts go is `scorecard.js`.
 *
 * When the rule's own file never loaded this session, the warning carries the
 * rule's whole text instead of its id. Path-scoped rules fire on a read, and
 * creating a file is not a read, so writing src/foo.ts in a session that opened
 * no .ts file leaves the TypeScript rules out of context entirely. That hole is
 * the reason the hook exists.
 */

const fs = require('fs');
const path = require('path');
const { load, rulePath, ruleText } = require('./checks');
const scorecard = require('./scorecard');

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

/**
 * What the hook answers for a PreToolUse call: a deny naming each blocking
 * check, warnings as `additionalContext`, or null for nothing to say.
 */
function judge(call) {
  const tool = call.tool_name;
  if (tool !== 'Edit' && tool !== 'Write') return null;

  const input = call.tool_input || {};
  const file = input.file_path;
  if (!file) return null;

  const { checks: all } = load();
  if (!all.length) return null;

  const loaded = scorecard.loadedIn(call.session_id);
  const project = call.cwd ? path.basename(call.cwd) : '';

  // Which model wrote the line matters as much as which rule it broke, and a
  // count is impossible to backfill. PreToolUse carries the effort level and
  // not the model: `model` reaches a hook on SessionStart alone, where it can
  // be omitted and where a later /model switch is invisible. Recording effort
  // now costs nothing; the model waits for a sensor that survives the switch.
  const effort = call.effort ? call.effort.level : null;
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

    scorecard.append(call.session_id, { kind: 'result', id: c.id, tier: c.tier, since: c.since, project, effort, ok });
    if (ok || c.tier === 'measure') continue;

    // The agent already holds the rule when its file is in context, so the id
    // is enough. When it does not, telling it to go read the file costs a turn
    // and can be skipped; the text cannot.
    const rule = rulePath(c.rule);
    const body = loaded.has(rule) ? null : ruleText(rule, c.id);
    const line = body ? `${c.message}\n\n${body}` : `${c.message} (${c.id})`;
    (c.tier === 'block' ? blocks : warnings).push(line);
  }

  if (blocks.length) return { permissionDecision: 'deny', permissionDecisionReason: blocks.join('\n\n') };
  if (warnings.length) return { additionalContext: warnings.join('\n\n') };
  return null;
}

module.exports = { judge };
