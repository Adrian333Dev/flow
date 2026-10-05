#!/usr/bin/env node
'use strict';
/**
 * guard.js: the PreToolUse hook on Bash and Read, and the one check between
 * Claude and a dangerous shell command. `lib/guard/judge.js` judges the
 * command, and this file is the wiring.
 *
 * Flow's settings allow every shell command. The guard reads each one before
 * it runs, and answers "ask" when it finds one of 6 kinds of harm, one file
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
 *   6. reading a secret into the conversation: a private key, a cloud or
 *      GitHub login, a .env file. The Read tool's reads are judged here too.
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
const { secretRead } = require('../lib/guard/secrets');

const data = hook.event();
const input = (data && data.tool_input) || {};
const cwd = (data && data.cwd) || process.cwd();
let reason = null;
if (data && data.tool_name === 'Read') {
  if (typeof input.file_path === 'string') reason = secretRead(input.file_path, cwd, world());
} else if (typeof input.command === 'string' && input.command.trim()) {
  reason = judge(input.command, cwd, world());
}
if (reason) hook.answer('PreToolUse', { permissionDecision: 'ask', permissionDecisionReason: reason });
