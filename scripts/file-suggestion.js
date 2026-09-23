#!/usr/bin/env node
'use strict';
/**
 * `fileSuggestion`: the list of paths Claude Code shows after `@`.
 *
 * Claude Code runs this on every keystroke after `@`, sends
 * `{"query": "src/comp"}` on stdin, and shows the first 15 paths printed. Its
 * own list leaves out every git-ignored file and ignores when a file changed.
 * This one walks the project itself and never reads `.gitignore`, so `.env`
 * and `tmp/` are offered, and it puts the most recently changed file first.
 *
 * A path matches when every word typed appears in it, ignoring case. A folder
 * on the fixed list below is never entered, and neither is one named in
 * `fileSuggestionIgnore`, read from all 3 levels and added together:
 *
 *   <project>/.flow/settings.json, ~/.flow/settings.local.json, ~/.flow/settings.json
 *
 *   "fileSuggestionIgnore": ["tmp", "lab/research"]
 *
 * An entry without a `/` is a name, skipped at any depth. One with a `/` is a
 * path from the project root.
 *
 * Speed is the whole design, since it runs per keystroke. Walking a tree of
 * 30,000 files takes 200 to 400 ms, so the walk runs once and is saved: every
 * path with its change time, in one cache file per project under the system's
 * temp folder. A keystroke reads that file, about 60 ms on 30,000 files, most
 * of it Node starting. The file is plain text, a line per path, so a keystroke
 * searches it whole for the first word and splits only the lines that hold it. A cache older than
 * FRESH is still answered from, and a detached copy of this script walks again
 * for the next keystroke, one at a time per project through a lock file. So a
 * file created a moment ago is missing for one keystroke at most.
 *
 * The very first `@` in a project has no cache and waits for the walk, so
 * that walk stops at BUDGET ms and saves what it found as already stale: the
 * next keystroke answers from it and starts the whole walk in the background.
 *
 * Where few paths match, their change times are read fresh, so the file you
 * saved a second ago tops the list without waiting for a walk. The walk stops
 * at LIMIT files, which keeps a huge tree from filling the cache. It walks
 * nearest the root first, so what it missed is the deepest, and typing the
 * whole path still reaches it without the list.
 *
 * It never fails loudly. Claude Code shows whatever this prints, so an error
 * past the walk prints the matches unsorted, and one before it prints nothing.
 */

const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const settings = require('./flow/lib/settings');

const SHOWN = 15;
const LIMIT = 50000;
const FRESH = 2000;
const RESTAT = 200;
const LOCK_EXPIRES = 30000;
const BUDGET = 250;

/** Folders no answer ever wants: version control, dependencies, build output. */
const SKIPPED = [
  '.git', 'node_modules', 'dist', 'build', 'out', 'coverage', '.next', 'target', '.venv', '__pycache__',
];

/** `fileSuggestionIgnore` from every level, as names and root-relative paths. */
function ignored(root) {
  const lists = [
    settings.read(settings.projectFile(root)).fileSuggestionIgnore,
    settings.read(settings.localFile()).fileSuggestionIgnore,
    settings.read(settings.globalFile()).fileSuggestionIgnore,
  ];
  const names = new Set(SKIPPED);
  const paths = new Set();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      const entry = raw.replace(/^\.\//, '').replace(/\/+$/, '');
      if (!entry) continue;
      (entry.includes('/') ? paths : names).add(entry);
    }
  }
  return { names, paths };
}

/**
 * Every file under the root, as `[root-relative path, change time]`, nearest
 * the root first. Stops at LIMIT files, or at `until`, a clock time, if given.
 * `whole` says whether it reached the end.
 */
function walk(root, skip, until = Infinity) {
  const found = [];
  const queue = [''];
  let seen = 0;
  let next = 0;
  for (; next < queue.length && seen < LIMIT && Date.now() < until; next++) {
    const rel = queue[next];
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const at = rel ? `${rel}/${e.name}` : e.name;
      if (skip.names.has(e.name) || skip.paths.has(at)) continue;
      if (e.isDirectory()) {
        queue.push(at);
        continue;
      }
      if (!e.isFile() && !e.isSymbolicLink()) continue;
      if (at.includes('\n')) continue;
      const changed = changedAt(root, at);
      if (changed < 0) continue;
      seen++;
      found.push([at, changed]);
    }
  }
  found.whole = next >= queue.length;
  return found;
}

/** A file's change time, or -1 for one gone or not a file. */
function changedAt(root, rel) {
  const stat = fs.statSync(path.join(root, rel), { throwIfNoEntry: false });
  return stat && stat.isFile() ? stat.mtimeMs : -1;
}

// ---------------------------------------------------------------- the cache

/**
 * One file per project, named for a hash of its path. The first line is the
 * project's path and the time of the walk; every other is a change time, a
 * tab and a path:
 *
 *   /home/me/code/app\t1790150400000
 *   1790150399512.3\tsrc/components/Button.tsx
 */
const cacheFile = (root) => path.join(os.tmpdir(), 'flow-file-suggestion',
  `${crypto.createHash('sha1').update(root).digest('hex').slice(0, 16)}.txt`);

/** The saved walk as `{ at, text }`, or null for none or another project's. */
function load(root) {
  let text;
  try {
    text = fs.readFileSync(cacheFile(root), 'utf8');
  } catch {
    return null;
  }
  const end = text.indexOf('\n');
  const [owner, at] = text.slice(0, end < 0 ? text.length : end).split('\t');
  return owner === root ? { at: Number(at) || 0, text } : null;
}

/**
 * Walk and save, through a temp file and a rename so a reader never sees half.
 * A walk cut short by `until` is saved with time 0, so it counts as stale.
 */
function build(root, until) {
  const files = walk(root, ignored(root), until);
  const at = files.whole || until === undefined ? Date.now() : 0;
  const lines = files.map(([rel, changed]) => `${changed}\t${rel}`);
  const text = [`${root}\t${at}`, ...lines].join('\n') + '\n';
  const file = cacheFile(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}`;
  fs.writeFileSync(temp, text);
  fs.renameSync(temp, file);
  return { at, text };
}

/** Start one detached walk for the next keystroke, unless one is running. */
function refresh(root) {
  const lock = `${cacheFile(root)}.lock`;
  try {
    const held = fs.statSync(lock, { throwIfNoEntry: false });
    if (held && Date.now() - held.mtimeMs < LOCK_EXPIRES) return;
    if (held) fs.rmSync(lock, { force: true });
    fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
  } catch {
    return;
  }
  const child = spawn(process.execPath, [__filename, '--build', root], { detached: true, stdio: 'ignore' });
  child.unref();
}

/** The detached walk: save, then free the lock whatever happened. */
function rebuild(root) {
  try {
    build(root);
  } finally {
    fs.rmSync(`${cacheFile(root)}.lock`, { force: true });
  }
}

// --------------------------------------------------------------- the answer

/**
 * Every saved line holding every word in its path, as `[path, change time]`.
 * The text is searched whole for the first word, so only the lines holding it
 * are split: lowercasing 30,000 paths one by one costs more than the search.
 */
function matching(text, words) {
  const body = text.indexOf('\n') + 1;
  const found = [];
  const take = (start, end) => {
    const line = text.slice(start, end);
    const tab = line.indexOf('\t');
    const rel = line.slice(tab + 1);
    const lower = rel.toLowerCase();
    if (rel && words.every((w) => lower.includes(w))) found.push([rel, Number(line.slice(0, tab))]);
  };
  if (!words.length) {
    for (let start = body; start < text.length;) {
      const end = text.indexOf('\n', start);
      take(start, end);
      start = end + 1;
    }
    return found;
  }
  const lower = text.toLowerCase();
  let last = -1;
  for (let i = lower.indexOf(words[0], body); i >= 0; i = lower.indexOf(words[0], i + 1)) {
    const start = lower.lastIndexOf('\n', i) + 1;
    if (start === last) continue;
    last = start;
    const end = lower.indexOf('\n', i);
    take(start, end);
    i = end;
  }
  return found;
}

/**
 * The paths holding every word, most recently changed first. Few matches get
 * their change times read fresh; many keep the ones the walk saved.
 */
function answer(root, text, words) {
  let found = matching(text, words);
  if (found.length <= RESTAT) {
    found = found.map(([rel]) => [rel, changedAt(root, rel)]).filter(([, at]) => at >= 0);
  }
  try {
    found.sort((a, b) => b[1] - a[1]);
  } catch {
    // Unsorted beats nothing.
  }
  return found.slice(0, SHOWN).map(([rel]) => rel);
}

function main() {
  if (process.argv[2] === '--build') return rebuild(process.argv[3]);

  let query = '';
  try {
    query = String(JSON.parse(fs.readFileSync(0, 'utf8')).query || '');
  } catch {
    // No query is the bare `@`: the newest files.
  }
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  let cache = load(root);
  try {
    if (!cache) cache = build(root, Date.now() + BUDGET);
    else if (Date.now() - cache.at > FRESH) refresh(root);
  } catch {
    if (!cache) return;
  }
  const shown = answer(root, cache.text, words);
  if (shown.length) process.stdout.write(shown.join('\n') + '\n');
}

if (require.main === module) main();

module.exports = { SKIPPED, LIMIT, FRESH, BUDGET, cacheFile, ignored, walk, matching, answer };
