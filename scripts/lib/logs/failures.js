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
 *
 * **An open issue** is a job that runs with nobody watching, whose last run
 * failed. Its lines carry `job`, which names it: `sync /home/me/code/shop`,
 * `sync ~/.flow`, `skills obra/superpowers`. The next run of the same job that
 * works adds a line closing it, `{"job":"sync ~/.flow","cleared":true}`, so an
 * issue goes away by itself once its cause is fixed. The status line counts
 * the open ones, and `flow doctor` lists them.
 */

const fs = require('fs');
const logs = require('./logs');

const NAME = 'failures';
const ERROR_CHARS = 500;

/** This month's file. */
const file = (home) => logs.monthFile(home, NAME);

/** One part of a command that runs something Flow built. */
function flowPart(part) {
  if (/\.flow\/scripts\/|skills\/flow\/skills\//.test(part)) return true;
  return /(^|\$\(\s*)(flow|fw|util|u)(\s|$)/.test(part);
}

/**
 * A shell command whose failure is Flow's: `flow`, `fw`, `util`, `u`, a
 * script under `~/.flow/scripts/`, or one bundled in a Flow skill. Every
 * other command is the agent's own business: a grep that finds nothing exits
 * with 1 and is no failure of anything.
 *
 * The hook sees one exit code for a whole compound command, never which part
 * set it. So the last part must be Flow's, and so must every part chained to
 * it with `&&`, bar a `cd`: any of those may be the one that stopped the
 * chain. `grep x && util fs tree` is the agent's, and so is `flow a && ls`,
 * a Flow failure missed rather than a guess.
 */
function flowCommand(command) {
  // Quoted text first, so a `|` inside a grep pattern splits nothing.
  const text = String(command || '').replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, (q) => q.replace(/[;&|\n]/g, ' '));
  const parts = text.split(/(&&|\|\||[;|\n])/).map((s) => s.trim());
  let i = parts.length - 1;
  while (i > 0 && !parts[i]) i -= 2;
  if (!flowPart(parts[i])) return false;
  for (i -= 2; i >= 0 && parts[i + 1] === '&&'; i -= 2) {
    if (!flowPart(parts[i]) && !/^cd(\s|$)/.test(parts[i])) return false;
  }
  return true;
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

/** Every line of one month's file that parses. */
function readLines(file) {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  return text.split('\n').flatMap((line) => {
    try {
      return line ? [JSON.parse(line)] : [];
    } catch {
      return [];
    }
  });
}

/**
 * Every open issue, oldest first: `{ job, count, since, error }`, where
 * `count` is the failures since the job last worked and `error` the newest.
 * Reads this month and the one before, so an issue a month old still shows.
 */
function open(home, now = new Date()) {
  const before = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lines = [before, now].flatMap((date) => readLines(logs.monthFile(home, NAME, date)));
  const jobs = new Map();
  for (const line of lines) {
    if (!line.job) continue;
    const had = jobs.get(line.job);
    jobs.delete(line.job);
    if (line.cleared) continue;
    jobs.set(line.job, had
      ? { ...had, count: had.count + 1, error: line.error }
      : { job: line.job, count: 1, since: line.at, error: line.error });
  }
  return [...jobs.values()];
}

/** A job worked: close its issue, where one is open. */
function cleared(home, job) {
  if (open(home).some((issue) => issue.job === job)) logs.append(home, NAME, { job, cleared: true });
}

module.exports = { NAME, ERROR_CHARS, file, record, open, cleared, flowCommand, fromHook };
