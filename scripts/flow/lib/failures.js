'use strict';
/**
 * `~/.flow/logs/failures/<month>.jsonl`: one line per failure of something
 * Flow built or chose, so a broken piece can be looked into after the session
 * that hit it is gone.
 *
 * 3 writers, one line shape:
 *
 *   failures.js, the hook   an MCP tool, a Flow command or a bundled script
 *                           the agent ran, and an API error that ended a turn
 *   Flow's own scripts      what runs where no hook sees it: the install, the
 *                           background pull of skill repositories, flow sync
 *   the agent               what no hook can see, such as a subagent whose
 *                           change record never came
 *
 *   {"at":"…","source":"hook","what":"mcp__supabase__list_tables","error":"401 Unauthorized",
 *    "project":"/home/me/code/shop","session":"b81748eb-…","call":"toolu_01…"}
 *
 * A line from a session names the session and the tool call, which point into
 * the transcript under `~/.claude/projects/`, where the whole failure is. The
 * line carries the first 500 characters of the error, enough to group repeats.
 */

const logs = require('./logs');

const NAME = 'failures';
const ERROR_CHARS = 500;

/** This month's file. */
const file = (home) => logs.monthFile(home, NAME);

/**
 * A shell command that runs something Flow built: `flow`, `fw`, `util`, `u`,
 * a script under `~/.flow/scripts/`, or one bundled in a Flow skill. Every
 * other command is the agent's own business: a grep that finds nothing exits
 * with 1 and is no failure of anything.
 */
function flowCommand(command) {
  const text = String(command || '');
  if (/\.flow\/scripts\/|skills\/flow\/skills\//.test(text)) return true;
  return /(^|[;&|(]\s*|\$\(\s*)(flow|fw|util|u)(\s|$)/.test(text.trim());
}

/**
 * The line a hook call becomes, or null where the call is not Flow's to log.
 *
 *   PostToolUseFailure   an MCP tool, or a shell command running Flow's own,
 *                        never one the user interrupted
 *   StopFailure          every API error that ended a turn
 */
function fromHook(call) {
  const where = { project: call.cwd || '', session: call.session_id || '' };
  if (call.agent_id) where.agent = call.agent_id;
  if (call.hook_event_name === 'StopFailure') {
    const error = [call.error, call.error_details].filter(Boolean).join(': ');
    return { source: 'hook', what: 'api', error, ...where };
  }
  if (call.hook_event_name !== 'PostToolUseFailure' || call.is_interrupt) return null;
  const tool = String(call.tool_name || '');
  const command = tool === 'Bash' ? (call.tool_input || {}).command : null;
  if (!tool.startsWith('mcp__') && !flowCommand(command)) return null;
  return { source: 'hook', what: command || tool, error: call.error || '', ...where, call: call.tool_use_id || '' };
}

function record(home, entry) {
  const error = String(entry.error || '');
  logs.append(home, NAME, { ...entry, error: error.length > ERROR_CHARS ? `${error.slice(0, ERROR_CHARS)}…` : error });
}

module.exports = { NAME, ERROR_CHARS, file, record, flowCommand, fromHook };
