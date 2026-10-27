/**
 * Snapshots of a project's files in git's object store, and the diffs between
 * them. Nothing here touches the real index, the files or HEAD.
 */

import fs from 'node:fs';
import path from 'node:path';
import { git as run } from '../../shared/git.ts';

/** git's output as printed, throwing on a failure. Never takes a lock a user's git would trip on. */
function git(args, cwd, { env, input }: { env?: NodeJS.ProcessEnv; input?: string | Buffer } = {}) {
  const ran = run(cwd, args, { env: { GIT_OPTIONAL_LOCKS: '0', ...env }, input });
  if (!ran.ok) throw new Error(ran.err || `git ${args[0]} failed`);
  return ran.raw;
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
 *
 * The copy keeps the real index's modified time. git trusts a file whose size
 * and time match its entry, to the second, and re-reads one changed in the
 * same second as the index was written. A copy dated now loses that check, so
 * an edit of the same size in the same second as the commit went unseen.
 */
function snapshot(root, dir) {
  const scratch = path.join(dir, 'scratch');
  fs.mkdirSync(scratch, { recursive: true });
  const index = path.join(scratch, `index-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    const real = path.resolve(root, git(['rev-parse', '--git-path', 'index'], root).trim());
    if (fs.existsSync(real)) {
      fs.copyFileSync(real, index);
      const { atime, mtime } = fs.statSync(real);
      fs.utimesSync(index, atime, mtime);
    }
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
  const files : any[] = [];
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
  const chunks : any[] = [];
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

function relative(root, file) {
  return outside(root, file) ? path.resolve(file) : path.relative(root, file).split(path.sep).join('/');
}

export { repoRoot, snapshot, blobOf, changedPaths, diffChunks, relative };
