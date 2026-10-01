#!/usr/bin/env node
'use strict';
/**
 * check-ticket.js: the UserPromptExpansion hook that refuses a typed skill
 * where Flow was never set up.
 *
 * Claude Code fires this when the user types a slash command, before the
 * skill's text is built. It is registered for the 4 phase skills and
 * /flow:start, the ones that work on tickets.
 *
 * It blocks 2 things. The machine check runs first, whatever was typed: a
 * machine where `flow install` never finished has no rules loaded and no other
 * hook installed, so this is the only gate a typed skill passes through.
 *
 * The project check runs only for /flow:start with nothing after it, which
 * shows the project's board. A phase skill works in any folder, since outside
 * a project it keeps its ticket in ~/.flow/tickets/, so groundwork in an empty
 * folder gets through. Both messages come from flow's own libraries rather
 * than a copy here.
 *
 * A ticket reaches a phase skill through its own skill, `/flow:execute
 * /exp-47`, which only lists tickets that exist: lib/ticket-skills.js. An id
 * typed as text is the agent's to look up, so nothing here reads one.
 *
 * Any error of its own stays silent, because a guard that breaks every typed
 * skill costs more than it saves.
 */

const fs = require('fs');
const { FlowError } = require('./flow/lib/error');
const machine = require('./flow/lib/machine');
const { projectRoot } = require('./flow/lib/root');

const block = (reason) => process.stdout.write(JSON.stringify({ decision: 'block', reason }));

try {
  const call = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (call.cwd) process.chdir(call.cwd);

  const board = !String(call.command_args || '').trim() && /(^|:)start$/.test(String(call.command_name || ''));

  machine.requireSetup();
  if (board) projectRoot();
} catch (e) {
  // Only flow's own refusal blocks, since it carries the message to show.
  if (e instanceof FlowError) block(e.message);
}
