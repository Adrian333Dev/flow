#!/usr/bin/env node
'use strict';
/**
 * check-ticket.js: the UserPromptExpansion hook that refuses a bare
 * /flow:start outside a Flow project.
 *
 * Claude Code fires this when the user types a slash command, before the
 * skill's text is built. It is registered for the 4 phase skills and
 * /flow:start, the ones that work on tickets.
 *
 * The check runs only for /flow:start with nothing after it, which shows the
 * project's board. A phase skill works in any folder, since outside a project
 * it keeps its ticket in ~/.flow/tickets/, so groundwork in an empty folder
 * gets through. The message comes from flow's own library rather than a copy
 * here.
 *
 * A ticket reaches a phase skill through its own skill, `/flow:execute
 * /exp-47`, which only lists tickets that exist: lib/tickets/ticket-skills.js. An id
 * typed as text is the agent's to look up, so nothing here reads one.
 *
 * Any error of its own stays silent, because a guard that breaks every typed
 * skill costs more than it saves.
 */

const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/project');
const hook = require('../lib/hook');

try {
  const call = hook.event();
  if (call.cwd) process.chdir(call.cwd);

  const board = !String(call.command_args || '').trim() && /(^|:)start$/.test(String(call.command_name || ''));

  if (board) projectRoot();
} catch (e) {
  // Only flow's own refusal blocks, since it carries the message to show.
  if (e instanceof FlowError) hook.reply({ decision: 'block', reason: e.message });
}
