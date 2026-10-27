/**
 * The change record's files under ~/.flow/changes/<session>/ (the layout is in
 * changes.ts), and the clock they are stamped with.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as settings from '../../shared/settings.ts';
import * as paths from '../../shared/paths.ts';

// A worker marked running this long ago died without finishing: a crash, a
// power cut. The parent stops recording on its account.
const STALE_RUN_MS = 12 * 60 * 60 * 1000;

// A session folder untouched this long is deleted when the next worker starts.
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

const base = () => path.join(paths.flowHome(), 'changes');
const safe = (name) => String(name || 'unknown').replace(/[^A-Za-z0-9._-]/g, '-');
const sessionDir = (session) => path.join(base(), safe(session));
const agentDir = (dir, agent) => path.join(dir, 'agents', safe(agent));

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Milliseconds on the system's steady clock, for every time one hook process
 * compares with another's. The wall clock can step back when the system
 * corrects it: WSL2 does every 30 seconds or so, by about 2.5 seconds, and an
 * edit then looked older than the worker that made it. The steady clock never
 * steps, and every process on the machine reads the same one, on Linux, macOS
 * and Windows alike.
 */
const now = () => Number(process.hrtime.bigint() / 1000000n);

/**
 * A time read back from disk. The steady clock starts again at every boot, so
 * a time saved before a restart would read as the future. It counts as the
 * earliest time instead: older than anything since, and still after "never".
 */
const saved = (time) => (Number(time) > now() ? 1 : Number(time) || 0);

/** When an agent's last record was built, from its `reported` file. 0 for never. */
function reportedAt(file) {
  try {
    return saved(fs.readFileSync(file, 'utf8'));
  } catch {
    return 0;
  }
}

function readEvents(dir, agent) {
  const file = path.join(agentDir(dir, agent), 'events.jsonl');
  if (!fs.existsSync(file)) return [];
  const events : any[] = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      events.push({ ...event, start: saved(event.start), end: saved(event.end) });
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
  if (fresh || !fs.existsSync(file)) settings.write(file, { since: Date.now() });
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

export { safe, sessionDir, agentDir, sleep, now, saved, reportedAt, readEvents, appendEvent, listDir, runningWorkers, markRunning, take, prune };
