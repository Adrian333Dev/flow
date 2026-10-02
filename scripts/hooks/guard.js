#!/usr/bin/env node
'use strict';
/**
 * guard.js: the PreToolUse hook on Bash, and the one check between Claude and
 * a dangerous shell command. `lib/guard/judge.js` judges the command, and
 * this file is the wiring.
 *
 * Flow's settings allow every shell command. The guard reads each one before
 * it runs, and answers "ask" when it finds one of 5 kinds of harm, one file
 * each in `lib/guard/`:
 *
 *   1. losing work on this machine: a delete outside the project, a delete of
 *      files git cannot give back, a delete aimed at a variable, and the git
 *      commands that throw work away
 *   2. sending things off the machine: curl or wget sending data, a copy to
 *      another host, ssh
 *   3. touching shared systems: a deploy or cloud tool doing more than read,
 *      a database drop
 *   4. changing the machine outside the project: a global install, a
 *      scheduled job or background service, killing programs by name, a write
 *      into ~/.ssh, a shell startup file or the global git settings
 *   5. running outside code, or switching Flow off: a download run straight
 *      away, an npx of a package the project lacks, a write into ~/.claude,
 *      ~/.flow, ~/.agents or a project's .claude/settings*.json
 *
 * Otherwise it stays silent and the command runs. It never answers "allow".
 *
 * It cannot see inside a script: `node -e`, `python3 -c`, or a file Claude
 * wrote and then runs. It catches the forms Claude writes, and is no wall.
 *
 * It only ever sees what the agent runs. A command typed behind `!` reaches no
 * hook. This file installs to ~/.claude/ and runs in every directory, so only
 * a rule that holds everywhere belongs here.
 */

const hook = require('../lib/hook');
const { judge } = require('../lib/guard/judge');
const { world } = require('../lib/guard/world');

const data = hook.event();
const command = data && data.tool_input && data.tool_input.command;
if (typeof command === 'string' && command.trim()) {
  const reason = judge(command, data.cwd || process.cwd(), world());
  if (reason) hook.answer('PreToolUse', { permissionDecision: 'ask', permissionDecisionReason: reason });
}
