'use strict';
/**
 * The original: every path as it was before Flow first touched it.
 *
 *   ~/.flow/originals/<machine or project>/
 *   ├─ manifest.json   one entry per path, and whether the window is closed
 *   └─ files/          what each path held before, at files/<full path>
 *
 * One original per place, and the folder's name is the place, so nothing has
 * to read a date to find it. `machine` is this machine. A project's folder is
 * named for its full path, the way Claude Code names `~/.claude/projects/`:
 * every character that is not a letter or a digit becomes `-`, and the leading
 * dash is dropped, since flow reads a word starting with `-` as a flag. 2 paths
 * can meet in one name, and the manifest's `project` keeps them apart.
 *
 * **It is written in one window and never added to.** `flow install` opens the
 * machine's and records every path it is about to create. The first
 * `flow setup` adds each path its migration changes, and closing the
 * window is the last thing that run does. A project's window opens and closes
 * inside its first /flow:setup-project. After that `record` is a no-op, so a
 * migration months later cannot mistake today's file for the state from before
 * Flow. The user ruled copy-on-first-touch out on 2026-09-20 for exactly that
 * reason: a path created after setup is not part of the original.
 *
 * A path that was not there is recorded `absent`, so putting the original back
 * deletes it. That is why restoring a project's original deletes its whole
 * `.flow/`, which the user ruled correct on 2026-09-19.
 *
 * Nothing under `~/.flow/` is ever recorded. Only `flow uninstall` deletes that
 * folder, so putting the machine's original back leaves the user's notes,
 * tickets and study cases where they are.
 *
 * What it is for: the first week or two, where the user tries Flow and regrets
 * it. Undoing one migration is a different job and is parked, so nothing here
 * dates a copy, chains a restore or holds a second version of anything.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');

const home = (at) => path.join(at.flow, 'originals');

/** The folder a machine's or a project's files sit in, here and under migrations/. */
const place = (project) => (project ? project.replace(/[^A-Za-z0-9]/g, '-').replace(/^-+/, '') : 'machine');

/** One place's folder. It may not exist: `read` answers that. */
const dir = (at, project) => path.join(home(at), place(project));

/** The folder an id names below `base`, refused when the id climbs out. `what` names the tree. */
function inside(base, id, what) {
  const found = path.resolve(base, id);
  if (!found.startsWith(base + path.sep)) throw new FlowError(`"${id}" is not a ${what} id.`);
  if (!fs.existsSync(found)) throw new FlowError(`no ${what} ${id} in ${base}.`);
  return found;
}

/** Local time, as a folder name (`2026-09-18T21-30-05`) or as a field. */
function stamp(date = new Date(), sep = ':') {
  const p = (n) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  return `${day}T${[p(date.getHours()), p(date.getMinutes()), p(date.getSeconds())].join(sep)}`;
}

/** A folder name stamp() made, back to its time. `-2` after it is allowed. */
function timeOf(name) {
  const m = name.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d)-(\d\d)-(\d\d)(-\d+)?$/);
  return m ? new Date(m[1], m[2] - 1, m[3], m[4], m[5], m[6]) : null;
}

/** Where a path's copy sits inside an original, or a migration's new version. */
const mirror = (base, p) => path.join(base, 'files', p);

// ---------------------------------------------------------------- copying

function lstat(p) {
  try {
    return fs.lstatSync(p);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

/**
 * A file, a folder or a link, copied as itself. A link is never followed.
 *
 * A copy into the original and back out keeps each file's time, so a restored
 * file does not read as changed since a migration was written. A migration's
 * write takes the time it happens, so a migration written before it does.
 */
function copyEntry(from, to, keepTime = false) {
  const stat = lstat(from);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (stat.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(from), to);
  else fs.cpSync(from, to, { recursive: true, verbatimSymlinks: true, preserveTimestamps: keepTime });
}

const remove = (p) => fs.rmSync(p, { recursive: true, force: true });

// ---------------------------------------------------------------- the manifest

const manifestFile = (base) => path.join(base, 'manifest.json');

function readManifest(base) {
  const file = manifestFile(base);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

const saveManifest = (base, manifest) =>
  fs.writeFileSync(manifestFile(base), JSON.stringify(manifest, null, 2) + '\n');

/** One place's original, or null where none was ever written. */
const read = (at, project) => readManifest(dir(at, project));

/**
 * Open the window, or hand back the one already open. Called twice, the second
 * call adds to the first original rather than starting a second.
 */
function start(at, project = null) {
  const base = dir(at, project);
  const found = readManifest(base);
  if (found) return { base, manifest: found };
  fs.mkdirSync(base, { recursive: true });
  const manifest = { place: place(project), project, written: stamp(), closed: false, entries: [] };
  saveManifest(base, manifest);
  return { base, manifest };
}

/** Shut the window for good. Every later record is a no-op. */
function close(at, project = null) {
  const base = dir(at, project);
  const manifest = readManifest(base);
  if (!manifest || manifest.closed) return false;
  saveManifest(base, { ...manifest, closed: true });
  return true;
}

/**
 * Copy a path into files/ and add its entry, once per path. Silent where no
 * window was opened or where it is closed, so every caller records
 * unconditionally and the window alone decides.
 *
 * A path that does not exist is recorded at its highest missing folder, so
 * putting the original back also removes the folders Flow made to hold it.
 */
function record(at, project, target) {
  if (target === at.flow || target.startsWith(at.flow + path.sep)) return false;
  const base = dir(at, project);
  const manifest = readManifest(base);
  if (!manifest || manifest.closed) return false;

  const seen = (p) => manifest.entries.some((e) => e.path === p);
  if (seen(target)) return false;
  let p = target;
  if (!lstat(p)) while (!lstat(path.dirname(p))) p = path.dirname(p);
  if (seen(p)) return false;

  const stat = lstat(p);
  const entry = { path: p, type: 'absent' };
  if (stat && stat.isSymbolicLink()) Object.assign(entry, { type: 'link', target: fs.readlinkSync(p) });
  else if (stat) {
    entry.type = stat.isDirectory() ? 'folder' : 'file';
    copyEntry(p, mirror(base, p), true);
  }
  manifest.entries.push(entry);
  saveManifest(base, manifest);
  return true;
}

/** Put one entry back the way it was recorded. */
function putBack(base, entry) {
  remove(entry.path);
  if (entry.type === 'absent') return;
  fs.mkdirSync(path.dirname(entry.path), { recursive: true });
  if (entry.type === 'link') fs.symlinkSync(entry.target, entry.path);
  else copyEntry(mirror(base, entry.path), entry.path, true);
}

/**
 * Put a whole place back, newest entry first. The original itself survives, so
 * the same restore runs again and lands in the same state.
 */
function restore(at, project = null) {
  const base = dir(at, project);
  const manifest = readManifest(base);
  if (!manifest) return null;
  const done = [];
  for (const entry of [...manifest.entries].reverse()) {
    putBack(base, entry);
    done.push({ path: entry.path, removed: entry.type === 'absent' });
  }
  return done;
}

/** Every original on this machine, the machine's first. */
function list(at) {
  let names = [];
  try {
    names = fs.readdirSync(home(at)).sort();
  } catch {
    return [];
  }
  return names
    .map((name) => ({ name, manifest: readManifest(path.join(home(at), name)) }))
    .filter((row) => row.manifest)
    .sort((a, b) => Number(b.name === 'machine') - Number(a.name === 'machine') || a.name.localeCompare(b.name));
}

module.exports = {
  home,
  place,
  dir,
  inside,
  stamp,
  timeOf,
  mirror,
  lstat,
  copyEntry,
  remove,
  readManifest,
  saveManifest,
  read,
  start,
  close,
  record,
  putBack,
  restore,
  list,
};
