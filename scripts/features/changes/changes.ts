/**
 * The change record: what each subagent changed, kept apart by agent id, so
 * workers running at the same time never share a diff.
 *
 * Every hook that fires inside a subagent carries `agent_id`, and a hook in the
 * main conversation carries none. So each change is filed under the id of the
 * agent that made it, at the moment it happens:
 *
 *   Edit, Write     the file is hashed just before the call and just after it
 *   Bash, mcp__*    the whole tree is snapshotted just before and just after
 *   a worker's run  one snapshot at its start and one at its finish, which
 *                   catches what no call explains: a command left running in
 *                   the background, an editor, a tool nothing hooks
 *
 * The main conversation is recorded only while a worker runs, so a change the
 * parent made is never handed to a worker.
 *
 * A snapshot is `git write-tree` against a throwaway index: every file in the
 * project at one moment, uncommitted work included, with the real index, the
 * files and HEAD untouched. Contents live in git's object store, so a record
 * holds hashes and costs a few bytes per change.
 *
 * On disk, under ~/.flow/changes/<session>/:
 *
 *   running/<agent>                 a worker that started and has not finished
 *   agents/<agent>/events.jsonl     one finished call per line, with the files it changed
 *   agents/<agent>/open/<call>.json a call that started and has not finished
 *   agents/<agent>/start.json       the snapshot taken when the worker started
 *   agents/<agent>/reported         when its last record was built
 *   outbox/<agent>.txt              a record nobody has handed to the parent yet
 *   names.json                      the name a worker was spawned with, to its id
 *
 * Records survive a restart, so a worker resumed after a crash hands over what
 * it changed before the crash too.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as settings from '../../shared/settings.ts';
import { repoRoot, snapshot, blobOf, changedPaths, relative } from './snapshot.ts';
import { safe, sessionDir, agentDir, sleep, now, saved, reportedAt, appendEvent, listDir, runningWorkers, markRunning, take, prune } from './session-files.ts';
import { buildRecord, LIMIT } from './record.ts';

// How long a finishing worker waits for the parent's waiter to take its
// record. Taken inside the window, the record reaches the parent together with
// the worker's "finished" notice.
const HANDOFF_MS = 2000;

// A record still in the outbox this long after it was built had no waiter: the
// user resumed the worker by typing to it. The parent's next call picks it up.
const ORPHAN_MS = 5000;

const WAIT_MS = 24 * 60 * 60 * 1000;
const POLL_MS = 250;

// ------------------------------------------------------------------ one call

const FILE_TOOLS = ['Edit', 'Write'];

function describeCall(data) {
  const input = data.tool_input || {};
  if (typeof input.command === 'string') return input.command;
  return `${data.tool_name} ${JSON.stringify(input)}`.slice(0, 200);
}

/** Record the moment before a call. Returns text for the parent, or ''. */
function beforeCall(data) {
  const agent = data.agent_id || 'main';
  const dir = sessionDir(data.session_id);

  let picked = '';
  if (agent === 'main') {
    // No folder means no worker has ever started in this session: the cheap
    // exit every ordinary call takes.
    if (!fs.existsSync(dir)) return '';
    picked = pickUp(dir);
    if (!runningWorkers(dir).length) return picked;
  } else {
    markRunning(dir, agent, false);
  }

  const root = repoRoot(data.cwd);
  if (!root) return picked;

  const open: Record<string, any> = { tool: data.tool_name, start: now() };
  if (FILE_TOOLS.includes(data.tool_name)) {
    const file = (data.tool_input || {}).file_path;
    if (!file) return picked;
    open.file = file;
    open.before = blobOf(root, file);
  } else {
    open.command = describeCall(data);
    open.tree = snapshot(root, dir);
  }
  settings.write(path.join(agentDir(dir, agent), 'open', `${safe(data.tool_use_id)}.json`), open);
  return picked;
}

/** The files a call changed, from what was stored before it. */
function finish(root, dir, open) {
  const event: Record<string, any> = { type: open.tree ? 'command' : 'edit', tool: open.tool, start: saved(open.start), end: now(), files: [] };
  if (open.tree) {
    event.command = open.command;
    event.files = changedPaths(root, open.tree, snapshot(root, dir));
  } else {
    const after = blobOf(root, open.file);
    if (after !== open.before) event.files = [{ path: relative(root, open.file), before: open.before, after }];
  }
  return event;
}

function afterCall(data) {
  const agent = data.agent_id || 'main';
  const dir = sessionDir(data.session_id);
  const file = path.join(agentDir(dir, agent), 'open', `${safe(data.tool_use_id)}.json`);
  const open = settings.read(file);
  if (!open.start) return;
  fs.rmSync(file, { force: true });
  const root = repoRoot(data.cwd);
  if (root) appendEvent(dir, agent, finish(root, dir, open));
}

// ------------------------------------------------------------------ one worker

function workerStarted(data) {
  const root = repoRoot(data.cwd);
  if (!root) return;
  prune();
  const dir = sessionDir(data.session_id);
  markRunning(dir, data.agent_id, true);
  settings.write(path.join(agentDir(dir, data.agent_id), 'start.json'), { at: now(), tree: snapshot(root, dir) });
}

function workerStopped(data) {
  const agent = data.agent_id;
  const dir = sessionDir(data.session_id);
  const root = repoRoot(data.cwd);
  const folder = agentDir(dir, agent);

  // A call whose after-hook never fired: a command still running in the
  // background, or a call interrupted. It closes now, against the tree as it is.
  const openFolder = path.join(folder, 'open');
  for (const name of listDir(openFolder)) {
    const open = settings.read(path.join(openFolder, name));
    fs.rmSync(path.join(openFolder, name), { force: true });
    if (open.start && root) appendEvent(dir, agent, finish(root, dir, open));
  }

  const text = root ? buildRecord(root, dir, agent, data.agent_type) : null;
  fs.rmSync(path.join(dir, 'running', safe(agent)), { force: true });

  // The outbox first, then `reported`: a waiter that sees `reported` move takes
  // one last look in the outbox, and has to find the record there.
  const outbox = path.join(dir, 'outbox', `${safe(agent)}.${text ? 'txt' : 'none'}`);
  fs.mkdirSync(path.dirname(outbox), { recursive: true });
  fs.writeFileSync(outbox, text || '');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'reported'), String(now()));

  // An empty record only tells the waiter to stop, and a waiter polls every
  // 250 ms, so it needs far less time.
  const deadline = now() + (text ? HANDOFF_MS : 2 * POLL_MS + 100);
  while (fs.existsSync(outbox) && now() < deadline) sleep(50);
  if (!fs.existsSync(outbox)) {
    // Taken. A moment more lets the record reach the parent ahead of the notice.
    sleep(300);
  } else if (!text) {
    fs.rmSync(outbox, { force: true });
  }
}

// ------------------------------------------------------------------ the parent

/** Records whose worker was resumed with no waiter: the user typed to it. */
function pickUp(dir) {
  const outbox = path.join(dir, 'outbox');
  const texts : string[] = [];
  for (const name of listDir(outbox)) {
    if (!name.endsWith('.txt')) continue;
    const file = path.join(outbox, name);
    try {
      if (Date.now() - fs.statSync(file).mtimeMs < ORPHAN_MS) continue;
    } catch {
      continue;
    }
    const text = take(file);
    if (text) texts.push(text);
  }
  return texts.join('\n\n');
}

/**
 * The waiter: started when the parent launches or messages a worker, it waits
 * for that worker's record and hands it over. Returns the exit code and the
 * text. Exit code 2 wakes the parent with the text, even when it sits idle.
 */
function waitForRecord(data) {
  const dir = sessionDir(data.session_id);
  const input = data.tool_input || {};
  const response = data.tool_response || {};
  const namesFile = path.join(dir, 'names.json');

  let id = response.agentId;
  if (data.tool_name === 'Agent' && id && input.name) {
    settings.write(namesFile, { ...settings.read(namesFile), [input.name]: id });
  }
  if (data.tool_name === 'SendMessage') {
    id = settings.read(namesFile)[input.to] || input.to;
  }
  if (!id || id === 'main') return { code: 0 };

  // A foreground run has already finished, so its record is there or never comes.
  const once = response.status === 'completed';
  const started = now();
  const outbox = path.join(dir, 'outbox', safe(id));
  const reported = path.join(agentDir(dir, id), 'reported');
  while (now() < started + WAIT_MS) {
    // Read before the outbox, so a record written just after this check is
    // still found below.
    const finished = reportedAt(reported) >= started;
    const text = take(`${outbox}.txt`);
    if (text) return { code: 2, text };
    if (take(`${outbox}.none`) !== null) return { code: 0 };
    // The worker finished and nothing is waiting: another waiter took it.
    if (once || finished) return { code: 0 };
    sleep(POLL_MS);
  }
  return { code: 0 };
}

/** One hook call, in and out. Never throws. */
function handle(data, { wait }: { wait?: boolean } = {}) {
  try {
    if (wait) {
      const { code, text } = waitForRecord(data);
      return { code, stderr: text || '' };
    }
    switch (data.hook_event_name) {
      case 'PreToolUse': {
        const text = beforeCall(data);
        if (!text) return { code: 0 };
        return {
          code: 0,
          stdout: JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: text } }) + '\n',
        };
      }
      case 'PostToolUse':
      case 'PostToolUseFailure':
        afterCall(data);
        return { code: 0 };
      case 'SubagentStart':
        workerStarted(data);
        return { code: 0 };
      case 'SubagentStop':
        workerStopped(data);
        return { code: 0 };
      default:
        return { code: 0 };
    }
  } catch {
    return { code: 0 };
  }
}

export { handle, sessionDir, LIMIT };
