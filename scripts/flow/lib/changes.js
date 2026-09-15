'use strict';
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

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const settings = require('./settings');

// Claude Code caps hook output at 10,000 characters and cuts past it.
const LIMIT = 9000;

// A worker marked running this long ago died without finishing: a crash, a
// power cut. The parent stops recording on its account.
const STALE_RUN_MS = 12 * 60 * 60 * 1000;

// A session folder untouched this long is deleted when the next worker starts.
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

// How long a finishing worker waits for the parent's waiter to take its
// record. Taken inside the window, the record reaches the parent together with
// the worker's "finished" notice.
const HANDOFF_MS = 2000;

// A record still in the outbox this long after it was built had no waiter: the
// user resumed the worker by typing to it. The parent's next call picks it up.
const ORPHAN_MS = 5000;

const WAIT_MS = 24 * 60 * 60 * 1000;
const POLL_MS = 250;

const base = () => path.join(settings.flowHome(), 'changes');
const safe = (name) => String(name || 'unknown').replace(/[^A-Za-z0-9._-]/g, '-');
const sessionDir = (session) => path.join(base(), safe(session));
const agentDir = (dir, agent) => path.join(dir, 'agents', safe(agent));

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// ------------------------------------------------------------------ git

function git(args, cwd, { env, input } = {}) {
  return execFileSync('git', args, {
    cwd,
    input,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', ...env },
  });
}

function repoRoot(cwd) {
  try {
    return git(['rev-parse', '--show-toplevel'], cwd).trim();
  } catch {
    return null;
  }
}

/**
 * The tree holding every file as it stands right now. The throwaway index
 * starts as a copy of the real one, so git re-reads only the files that changed.
 */
function snapshot(root, dir) {
  const scratch = path.join(dir, 'scratch');
  fs.mkdirSync(scratch, { recursive: true });
  const index = path.join(scratch, `index-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    const real = path.resolve(root, git(['rev-parse', '--git-path', 'index'], root).trim());
    if (fs.existsSync(real)) fs.copyFileSync(real, index);
    git(['add', '-A'], root, { env: { GIT_INDEX_FILE: index } });
    return git(['write-tree'], root, { env: { GIT_INDEX_FILE: index } }).trim();
  } finally {
    fs.rmSync(index, { force: true });
  }
}

/** The file's content stored as a blob, or null where no file is. */
function blobOf(root, file) {
  try {
    if (!fs.statSync(file).isFile()) return null;
    if (outside(root, file)) return git(['hash-object', '-w', '--no-filters', '--stdin'], root, { input: fs.readFileSync(file) }).trim();
    return git(['hash-object', '-w', '--', file], root).trim();
  } catch {
    return null;
  }
}

const outside = (root, file) => {
  const rel = path.relative(root, file);
  return rel.startsWith('..') || path.isAbsolute(rel);
};

/** Every file that differs between 2 trees, as { path, before, after }. */
function changedPaths(root, from, to) {
  const out = git(['diff-tree', '-r', '-z', '--no-renames', from, to], root);
  const parts = out.split('\0');
  const files = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    if (!parts[i].startsWith(':')) continue;
    const [oldMode, newMode, before, after] = parts[i].slice(1).split(' ');
    // A submodule's entry names a commit, which has no lines to show.
    if (oldMode === '160000' || newMode === '160000') continue;
    files.push({ path: parts[i + 1], before: /^0+$/.test(before) ? null : before, after: /^0+$/.test(after) ? null : after });
  }
  return files;
}

/** A tree holding the given paths at the given blobs, and nothing else. */
function treeOf(root, dir, entries) {
  const scratch = path.join(dir, 'scratch');
  fs.mkdirSync(scratch, { recursive: true });
  const index = path.join(scratch, `diff-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    const lines = entries.map((e) => `100644 ${e.blob}\t${e.path}\n`).join('');
    git(['update-index', '--add', '--index-info'], root, { env: { GIT_INDEX_FILE: index }, input: lines });
    return git(['write-tree'], root, { env: { GIT_INDEX_FILE: index } }).trim();
  } finally {
    fs.rmSync(index, { force: true });
  }
}

/** One diff chunk per file. A deleted file shows its header alone. */
function diffChunks(root, dir, items) {
  const inside = items.filter((i) => !path.isAbsolute(i.path));
  const chunks = [];
  if (inside.length) {
    const from = treeOf(root, dir, inside.filter((i) => i.before).map((i) => ({ path: i.path, blob: i.before })));
    const to = treeOf(root, dir, inside.filter((i) => i.after).map((i) => ({ path: i.path, blob: i.after })));
    const patch = git(['diff-tree', '-p', '-r', '-D', '--no-renames', from, to], root);
    for (const text of patch.split(/^(?=diff --git )/m)) if (text.trim()) chunks.push(chunk(text));
  }
  for (const item of items.filter((i) => path.isAbsolute(i.path))) {
    const lines = item.after ? '' : ' (deleted)';
    chunks.push({ text: `outside the project: ${item.path}${lines}\n`, added: 0, removed: 0, name: item.path });
  }
  return chunks;
}

function chunk(text) {
  let added = 0;
  let removed = 0;
  for (const line of text.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++;
    if (line.startsWith('-') && !line.startsWith('---')) removed++;
  }
  const name = (text.match(/^diff --git a\/(.*?) b\//) || [])[1] || '';
  return { text, added, removed, name };
}

// ------------------------------------------------------------------ the store

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

function readEvents(dir, agent) {
  const file = path.join(agentDir(dir, agent), 'events.jsonl');
  if (!fs.existsSync(file)) return [];
  const events = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // A line cut short by a crash. The rest of the record still stands.
    }
  }
  return events;
}

function appendEvent(dir, agent, event) {
  if (!event.files.length) return;
  const folder = agentDir(dir, agent);
  fs.mkdirSync(folder, { recursive: true });
  fs.appendFileSync(path.join(folder, 'events.jsonl'), JSON.stringify(event) + '\n');
}

function listDir(folder) {
  try {
    return fs.readdirSync(folder);
  } catch {
    return [];
  }
}

function runningWorkers(dir) {
  const folder = path.join(dir, 'running');
  return listDir(folder).filter((name) => {
    try {
      return Date.now() - fs.statSync(path.join(folder, name)).mtimeMs < STALE_RUN_MS;
    } catch {
      return false;
    }
  });
}

function markRunning(dir, agent, fresh) {
  const file = path.join(dir, 'running', safe(agent));
  if (fresh || !fs.existsSync(file)) writeJson(file, { since: Date.now() });
}

/** Take a record out of the outbox. Rename first, so 2 takers never both win. */
function take(file) {
  const claimed = `${file}.taken-${process.pid}`;
  try {
    fs.renameSync(file, claimed);
  } catch {
    return null;
  }
  const text = fs.readFileSync(claimed, 'utf8');
  fs.rmSync(claimed, { force: true });
  return text;
}

function prune() {
  for (const name of listDir(base())) {
    const folder = path.join(base(), name);
    try {
      if (Date.now() - fs.statSync(folder).mtimeMs > KEEP_MS) fs.rmSync(folder, { recursive: true, force: true });
    } catch {
      // Another hook deleted it first.
    }
  }
}

// ------------------------------------------------------------------ one call

const FILE_TOOLS = ['Edit', 'Write'];

function relative(root, file) {
  return outside(root, file) ? path.resolve(file) : path.relative(root, file).split(path.sep).join('/');
}

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

  const open = { tool: data.tool_name, start: Date.now() };
  if (FILE_TOOLS.includes(data.tool_name)) {
    const file = (data.tool_input || {}).file_path;
    if (!file) return picked;
    open.file = file;
    open.before = blobOf(root, file);
  } else {
    open.command = describeCall(data);
    open.tree = snapshot(root, dir);
  }
  writeJson(path.join(agentDir(dir, agent), 'open', `${safe(data.tool_use_id)}.json`), open);
  return picked;
}

/** The files a call changed, from what was stored before it. */
function finish(root, dir, open) {
  const event = { type: open.tree ? 'command' : 'edit', tool: open.tool, start: open.start, end: Date.now(), files: [] };
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
  const open = readJson(file);
  if (!open) return;
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
  writeJson(path.join(agentDir(dir, data.agent_id), 'start.json'), { at: Date.now(), tree: snapshot(root, dir) });
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
    const open = readJson(path.join(openFolder, name));
    fs.rmSync(path.join(openFolder, name), { force: true });
    if (open && root) appendEvent(dir, agent, finish(root, dir, open));
  }

  const text = root ? buildRecord(root, dir, agent, data.agent_type) : null;
  fs.rmSync(path.join(dir, 'running', safe(agent)), { force: true });

  // The outbox first, then `reported`: a waiter that sees `reported` move takes
  // one last look in the outbox, and has to find the record there.
  const outbox = path.join(dir, 'outbox', `${safe(agent)}.${text ? 'txt' : 'none'}`);
  fs.mkdirSync(path.dirname(outbox), { recursive: true });
  fs.writeFileSync(outbox, text || '');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'reported'), String(Date.now()));

  // An empty record only tells the waiter to stop, and a waiter polls every
  // 250 ms, so it needs far less time.
  const deadline = Date.now() + (text ? HANDOFF_MS : 2 * POLL_MS + 100);
  while (fs.existsSync(outbox) && Date.now() < deadline) sleep(50);
  if (!fs.existsSync(outbox)) {
    // Taken. A moment more lets the record reach the parent ahead of the notice.
    sleep(300);
  } else if (!text) {
    fs.rmSync(outbox, { force: true });
  }
}

/**
 * What this worker changed since its last record, as text for the parent.
 * Null when it changed nothing.
 */
function buildRecord(root, dir, agent, type) {
  const folder = agentDir(dir, agent);
  const since = Number(readJson(path.join(folder, 'reported'))) || 0;
  const mine = readEvents(dir, agent).filter((e) => e.end > since);
  const others = listDir(path.join(dir, 'agents'))
    .filter((name) => name !== safe(agent))
    .flatMap((name) => readEvents(dir, name));

  const items = [];

  const byPath = new Map();
  for (const event of mine) {
    for (const file of event.files) {
      // A command's snapshot also sees what another agent wrote while it ran.
      // A change another agent's own call accounts for exactly is theirs.
      const theirs = event.type === 'command' && others.some((o) => o.start <= event.end && o.end >= event.start &&
        o.files.some((f) => f.path === file.path && f.before === file.before && f.after === file.after));
      if (theirs) continue;
      if (!byPath.has(file.path)) byPath.set(file.path, []);
      byPath.get(file.path).push({ ...file, start: event.start, end: event.end });
    }
  }

  for (const [file, changes] of byPath) {
    const first = changes[0];
    const last = changes[changes.length - 1];
    const shared = others.some((o) => o.start <= last.end && o.end >= first.start && o.files.some((f) => f.path === file));
    if (!shared) {
      if (first.before !== last.after) items.push({ path: file, before: first.before, after: last.after, group: 'own' });
      continue;
    }
    changes.forEach((c, n) => items.push({ path: file, before: c.before, after: c.after, group: `shared-${file}-${n}` }));
  }

  // The safety net: a file that changed during the run with no call behind it.
  const start = readJson(path.join(folder, 'start.json'));
  fs.rmSync(path.join(folder, 'start.json'), { force: true });
  if (start && start.at > since) {
    const touched = new Set([...mine, ...others].filter((e) => e.end >= start.at).flatMap((e) => e.files.map((f) => f.path)));
    for (const file of changedPaths(root, start.tree, snapshot(root, dir))) {
      if (!touched.has(file.path)) items.push({ ...file, group: 'unexplained' });
    }
  }

  if (!items.length) return null;
  return render(root, dir, folder, agent, type, mine, items);
}

function render(root, dir, folder, agent, type, mine, items) {
  const sections = [];
  const groups = [...new Set(items.map((i) => i.group))];
  for (const group of groups) {
    const chunks = diffChunks(root, dir, items.filter((i) => i.group === group));
    if (group === 'unexplained') {
      sections.push({ note: 'Changed while this subagent ran, by no tool call a hook saw: a command left running, an editor, or another tool.', chunks });
    } else if (group.startsWith('shared-')) {
      sections.push({ note: 'Another agent changed this file in the same window. This is one change of this subagent\'s own.', chunks });
    } else {
      sections.push({ note: '', chunks });
    }
  }

  const files = new Set(items.map((i) => i.path));
  const commands = mine
    .filter((e) => e.type === 'command' && e.files.some((f) => files.has(f.path)))
    .map((e) => `- \`${e.command.split('\n')[0].slice(0, 160)}\`: ${e.files.map((f) => f.path + (f.after ? '' : ' (deleted)')).join(', ')}`);

  const head = [
    `Flow's change record for subagent ${agent}${type ? ` (${type})` : ''}. The changes.js hook built it from what the subagent's own tool calls did to the files, not from its report.`,
    '',
    `${files.size} ${files.size === 1 ? 'file' : 'files'} changed.`,
  ];
  if (commands.length) head.push('', 'Commands that changed files:', ...commands);

  const full = [...head, '', ...sections.flatMap((s) => [s.note, ...s.chunks.map((c) => c.text)].filter(Boolean))].join('\n');
  if (full.length <= LIMIT) return full;

  // Too long for one hook message. The longest diffs shrink to their line
  // counts first, and the whole patch goes to a file the parent can read.
  const patchFile = path.join(folder, `record-${Date.now()}.patch`);
  fs.writeFileSync(patchFile, full);
  const all = sections.flatMap((s) => s.chunks).sort((a, b) => b.text.length - a.text.length);
  const budget = LIMIT - head.join('\n').length - 400;
  let size = all.reduce((n, c) => n + c.text.length, 0);
  for (const c of all) {
    if (size <= budget) break;
    size -= c.text.length;
    c.text = `${c.name}: +${c.added} -${c.removed}, diff left out for length\n`;
    size += c.text.length;
  }
  let body = sections.flatMap((s) => [s.note, ...s.chunks.map((c) => c.text)].filter(Boolean)).join('\n');
  if (body.length > budget) body = `${body.slice(0, budget)}\n…`;
  return [...head, '', `The whole diff is in ${patchFile}.`, '', body].join('\n');
}

// ------------------------------------------------------------------ the parent

/** Records whose worker was resumed with no waiter: the user typed to it. */
function pickUp(dir) {
  const outbox = path.join(dir, 'outbox');
  const texts = [];
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
    writeJson(namesFile, { ...(readJson(namesFile) || {}), [input.name]: id });
  }
  if (data.tool_name === 'SendMessage') {
    id = (readJson(namesFile) || {})[input.to] || input.to;
  }
  if (!id || id === 'main') return { code: 0 };

  // A foreground run has already finished, so its record is there or never comes.
  const once = response.status === 'completed';
  const started = Date.now();
  const outbox = path.join(dir, 'outbox', safe(id));
  const reported = path.join(agentDir(dir, id), 'reported');
  while (Date.now() < started + WAIT_MS) {
    // Read before the outbox, so a record written just after this check is
    // still found below.
    const finished = (Number(readJson(reported)) || 0) >= started;
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
function handle(data, { wait } = {}) {
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

module.exports = { handle, sessionDir, LIMIT };
