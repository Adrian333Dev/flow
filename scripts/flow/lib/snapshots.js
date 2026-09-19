'use strict';
/**
 * Snapshots: a copy of every path a migration changes, taken the moment
 * before it changes, so one command with no agent can put everything back.
 *
 *   ~/.flow/snapshots/<machine or project>/<date-time>/
 *   ├─ manifest.json   one entry per path copied, how far the run got, and
 *   │                  the migration it was taken for
 *   └─ files/          what each path held before, at files/<full path>
 *
 * `apply-migration.js` writes one, and `lib/migrations.js` says what a
 * migration is. A snapshot never holds the new version of anything, so
 * restoring one can only mean going back.
 *
 * The machine's snapshots sit in `machine/`. A project's sit in a folder named
 * for its full path, the way Claude Code names `~/.claude/projects/`: every
 * character that is not a letter or a digit becomes `-`. The leading dash is
 * dropped, since flow reads a word starting with `-` as a flag. 2 paths can
 * meet in one name, and the manifest's `project` keeps them apart.
 *
 * Restore walks the entries newest first. Each holds its path as it was just
 * before the run first changed it, so walking backwards lands on the state
 * before the run, whatever order the migration touched things in. A restore
 * takes a snapshot too, of every path it puts back, in a folder beside the one
 * it restores, so a restore can itself be undone.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');

const home = (at) => path.join(at.flow, 'snapshots');

/** The folder an id names below `base`, refused when the id climbs out. `what` names the tree. */
function inside(base, id, what) {
  const dir = path.resolve(base, id);
  if (!dir.startsWith(base + path.sep)) throw new FlowError(`"${id}" is not a ${what} id.`);
  if (!fs.existsSync(dir)) throw new FlowError(`no ${what} ${id} in ${base}.`);
  return dir;
}

const folder = (at, id) => inside(home(at), id, 'snapshot');

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

/** The folder a machine's or a project's snapshots and migrations sit in. */
const place = (project) => (project ? project.replace(/[^A-Za-z0-9]/g, '-').replace(/^-+/, '') : 'machine');

/** A new folder inside `parent`, named for now, with `-2` added on a clash. */
function newFolder(parent) {
  const named = path.join(parent, stamp(new Date(), '-'));
  let dir = named;
  for (let n = 2; fs.existsSync(dir); n++) dir = `${named}-${n}`;
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const idOf = (at, dir) => path.relative(home(at), dir).split(path.sep).join('/');

/** Where a path's copy sits inside a snapshot, or a migration's new version. */
const mirror = (dir, p) => path.join(dir, 'files', p);

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
 * A copy into a snapshot and back out keeps each file's time, so a restored
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

const manifestFile = (dir) => path.join(dir, 'manifest.json');

function readManifest(dir) {
  const file = manifestFile(dir);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

const saveManifest = (dir, manifest) =>
  fs.writeFileSync(manifestFile(dir), JSON.stringify(manifest, null, 2) + '\n');

/**
 * Copy a path into files/ and add its entry, once per path per run. The
 * manifest is saved before the change it guards, so a run killed mid-change
 * still has the entry that undoes it.
 *
 * A path that does not exist is recorded at its highest missing folder, so a
 * restore also removes the folders the run made to hold it.
 */
function record(dir, manifest, target) {
  const seen = (p) => manifest.entries.some((e) => e.path === p);
  if (seen(target)) return;
  let p = target;
  if (!lstat(p)) while (!lstat(path.dirname(p))) p = path.dirname(p);
  if (seen(p)) return;
  const stat = lstat(p);
  const entry = { path: p, type: 'absent' };
  if (stat && stat.isSymbolicLink()) Object.assign(entry, { type: 'link', target: fs.readlinkSync(p) });
  else if (stat) {
    entry.type = stat.isDirectory() ? 'folder' : 'file';
    copyEntry(p, mirror(dir, p), true);
  }
  manifest.entries.push(entry);
  saveManifest(dir, manifest);
}

/** Put one entry back the way it was recorded. */
function putBack(dir, entry) {
  remove(entry.path);
  if (entry.type === 'absent') return;
  fs.mkdirSync(path.dirname(entry.path), { recursive: true });
  if (entry.type === 'link') fs.symlinkSync(entry.target, entry.path);
  else copyEntry(mirror(dir, entry.path), entry.path, true);
}

// ---------------------------------------------------------------- listing

/** What a listing shows for one snapshot: what it was taken for, and how far it got. */
function describe(m) {
  const state = m.type === 'restore'
    ? (m.finished ? `undoes ${m.restores}` : `stopped part-way undoing ${m.restores}`)
    : `migration ${m.migration}, ` +
      (m.applied === m.lines.length ? 'applied' : `stopped after line ${m.applied} of ${m.lines.length}`);
  return { type: m.type, project: m.project, state: m.restoredBy ? `${state}, restored by ${m.restoredBy}` : state };
}

/**
 * Every snapshot, newest first. A folder holding a manifest is a snapshot,
 * and nothing below it is searched: its files/ holds copies of other folders,
 * never a snapshot.
 */
function list(at) {
  const found = [];
  const walk = (dir) => {
    let names;
    try {
      names = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    if (names.some((n) => n.name === 'manifest.json')) {
      found.push(dir);
      return;
    }
    for (const n of names) if (n.isDirectory()) walk(path.join(dir, n.name));
  };
  walk(home(at));
  return found
    .map((dir) => {
      const manifest = readManifest(dir);
      return { dir, id: idOf(at, dir), manifest, ...describe(manifest) };
    })
    .sort((a, b) => path.basename(b.dir).localeCompare(path.basename(a.dir)));
}

module.exports = {
  home,
  inside,
  folder,
  stamp,
  timeOf,
  place,
  newFolder,
  idOf,
  mirror,
  lstat,
  copyEntry,
  remove,
  readManifest,
  saveManifest,
  record,
  putBack,
  list,
};
