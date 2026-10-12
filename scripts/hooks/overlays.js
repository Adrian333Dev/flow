#!/usr/bin/env node
'use strict';
/**
 * overlays.js: the hook that hands a skill the user's overlay.
 *
 * A skill exists once per machine and every project shares that copy, so the
 * user extends one by writing `~/.flow/skill-overlays/<name>.md`. This hook
 * adds that file to the agent's context each time the skill loads, for every
 * skill: Flow's, a standalone one, a plugin's. One folder serves every project.
 * A fact true for one project belongs in that project's `CLAUDE.md`.
 *
 * A skill loads 2 ways, and each has its own event:
 *
 *   UserPromptExpansion       the user typed it; the name is `command_name`
 *   PostToolUse on Skill      the agent loaded it, a subagent included; the
 *                             name is `tool_input.skill`
 *
 * The file is named for the skill without its plugin's prefix, so
 * `flow:execute` reads `execute.md` and `supabase:postgres` reads
 * `postgres.md`. A subagent whose definition preloads a skill through its
 * `skills:` line makes no Skill call and gets no overlay.
 *
 * Nothing here reads what the file holds. No overlay prints nothing, and so
 * does any error of its own: a missing overlay must never break a skill.
 */

const fs = require('fs');
const path = require('path');
const paths = require('../lib/paths');
const hook = require('../lib/hook');

/** The name a hook call carries, without a plugin's prefix, or null. */
function skillName(call) {
  const raw = call.hook_event_name === 'UserPromptExpansion'
    ? call.command_name
    : (call.tool_input || {}).skill;
  const name = String(raw || '').split(':').pop().trim();
  return /^[\w.-]+$/.test(name) ? name : null;
}

try {
  const call = hook.event() || {};
  const name = skillName(call);
  if (!name) process.exit(0);

  const file = path.join(paths.flowHome(), 'skill-overlays', `${name}.md`);
  if (!fs.existsSync(file)) process.exit(0);
  const body = fs.readFileSync(file, 'utf8').trim();
  if (!body) process.exit(0);

  hook.answer(call.hook_event_name, { additionalContext: `# Overlay\n\n${body}` });
} catch {
  // An overlay that cannot be read leaves the skill as it is.
}
