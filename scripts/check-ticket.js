#!/usr/bin/env node
'use strict';
/**
 * check-ticket.js: the UserPromptExpansion hook that refuses a typed skill
 * whose ticket id matches nothing.
 *
 * Claude Code fires this when the user types a slash command, before the
 * skill's text is built. It is registered for the 4 phase skills and /flow:start,
 * the ones that take a ticket id. A phase skill loads the ticket through its
 * own first line, so a bad id would otherwise print a refusal and then load
 * the whole skill on top of it, hundreds of lines spent on a typo.
 *
 * It blocks 3 things, and the 2 setup checks run first, whatever was typed. A
 * machine where `flow setup` never finished has no rules loaded and no
 * other hook installed, so this is the only gate a typed skill passes through.
 * A project flow setup project never ran in is the same case one level down.
 * Both messages come from flow's own libraries rather than a copy here.
 *
 * Then the ticket. The first word typed is the only thing judged. A word that
 * is not shaped like a ticket id passes untouched, so free text after the skill
 * name is never inspected. Shaped like an id means `t` then a digit, the same
 * test the skill's own first line runs, so `t047`, `t47` and the folder name
 * `t047-parser-split` are all checked with `flow get`, which exits 1 when
 * nothing matches. On that exit the expansion is blocked and flow's own
 * message is shown to the user.
 *
 * It only ever blocks on a confirmed miss. Any error of its own stays silent,
 * because a typo guard that breaks every typed skill costs more than it saves.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const machine = require('./flow/lib/machine');
const { projectRoot } = require('./flow/lib/root');

const ID = /^t\d/;

const block = (reason) => process.stdout.write(JSON.stringify({ decision: 'block', reason }));

/** The machine, then the project. Returns the refusal to show, or null. */
function notSetUp() {
  try {
    machine.requireSetup();
    projectRoot();
    return null;
  } catch (e) {
    return e.message;
  }
}

try {
  const call = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (call.cwd) process.chdir(call.cwd);

  const refusal = notSetUp();
  if (refusal) {
    block(refusal);
    process.exit(0);
  }

  const first = String(call.command_args || '').trim().split(/\s+/)[0] || '';
  if (ID.test(first)) {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'flow', 'flow.js'), 'get', first], {
      cwd: call.cwd || process.cwd(),
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      block((result.stderr || result.stdout || '').trim() || `flow: no ticket matches "${first}".`);
    }
  }
} catch {
  // A guard against typos never gets to break a typed skill.
}
