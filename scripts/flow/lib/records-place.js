'use strict';
/**
 * Where a project's tickets live. 2 places, and a switch on the second:
 *
 *   branch        `.flow/` is a checkout of the project's branch `flow`, pushed
 *                 with the repository. Everyone who can read the repository
 *                 reads the tickets. lib/records.js keeps it
 *   home          `.flow/` is a link to ~/.flow/projects/<name>/, in the
 *                 private Flow home. `flow sync` carries it to the user's
 *                 other machines, and nobody else sees it
 *   machine       the same link, to ~/.flow/projects-local/<name>/, which the
 *                 Flow home's own ignore list keeps on this machine
 *
 * A plain `.flow/` folder, from before the Flow home held projects, reads as
 * `folder`: it never leaves the clone, the way `machine` doesn't.
 *
 * The link and the folder name are this machine's. What ties a folder to its
 * project on every machine is `repository` in the folder's settings.json, the
 * project's remote written as `github.com/owner/repo`, so a second machine's
 * `flow init` finds the folder the first one made.
 */

const fs = require('fs');
const path = require('path');
const flowRepo = require('./flow-repo');
const records = require('./records');
const settings = require('./settings');

const PROJECTS = 'projects';
const LOCAL = 'projects-local';

const git = flowRepo.git;

/** The folder a place keeps its project folders in. */
const shelf = (home, machineOnly) => path.join(home, machineOnly ? LOCAL : PROJECTS);

/**
 * The remote, as `github.com/owner/repo`, whatever form git holds it in:
 * `git@github.com:owner/repo.git` and `https://github.com/owner/repo` read the
 * same. A remote on disk stays a path. Null with no remote.
 */
function repositoryOf(root) {
  const url = git(root, ['remote', 'get-url', records.REMOTE]);
  if (!url.ok || !url.out) return null;
  const raw = url.out.trim();
  if (/^(\/|\.|[A-Za-z]:\\)/.test(raw) || raw.startsWith('file://')) {
    return path.resolve(root, raw.replace(/^file:\/\//, ''));
  }
  return raw
    .replace(/^[a-z+]+:\/\//i, '')
    .replace(/^[^@/]+@/, '')
    .replace(/^([^/:]+):(?!\d)/, '$1/')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

/**
 * Whether the project's repository is public: `public`, `private` or
 * `internal` from GitHub, `unknown` where gh could not tell, `other` for a
 * remote that isn't on GitHub, `none` with no remote. `FLOW_VISIBILITY`
 * stands in for GitHub in the tests, and is never a setting.
 */
function visibility(root) {
  if (process.env.FLOW_VISIBILITY) return process.env.FLOW_VISIBILITY;
  const repo = repositoryOf(root);
  if (!repo) return 'none';
  const github = /^github\.com\/([^/]+\/[^/]+)$/.exec(repo);
  if (!github) return 'other';
  const asked = flowRepo.gh(['repo', 'view', github[1], '--json', 'visibility', '-q', '.visibility']);
  return asked.ok && asked.out ? asked.out.toLowerCase() : 'unknown';
}

/**
 * Where this project's tickets live now: `{ type, dir }`, with `type` one of
 * `branch`, `home`, `machine` or `folder`. Null where `.flow/` is missing.
 */
function placeOf(root, home = settings.flowHome()) {
  const link = path.join(root, '.flow');
  let stat;
  try {
    stat = fs.lstatSync(link);
  } catch {
    return null;
  }
  if (stat.isSymbolicLink()) {
    const dir = path.resolve(root, fs.readlinkSync(link));
    const parent = path.dirname(dir);
    if (parent === path.resolve(shelf(home, false))) return { type: 'home', dir };
    if (parent === path.resolve(shelf(home, true))) return { type: 'machine', dir };
    return { type: 'folder', dir };
  }
  return { type: records.onBranch(root) ? 'branch' : 'folder', dir: link };
}

/** The Flow home folder already holding this project's tickets, found by its repository, or null. */
function findFolder(root, home = settings.flowHome()) {
  const repo = repositoryOf(root);
  if (!repo) return null;
  for (const machineOnly of [false, true]) {
    const dir = shelf(home, machineOnly);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      const saved = settings.read(path.join(dir, name, 'settings.json')).repository;
      if (saved === repo) return path.join(dir, name);
    }
  }
  return null;
}

/** A new folder name for this project on the shelf: the project folder's name, then `-2`, `-3` where taken. */
function newFolder(root, machineOnly, home = settings.flowHome()) {
  const dir = shelf(home, machineOnly);
  const base = path.basename(path.resolve(root)).toLowerCase().replace(/[^a-z0-9._-]+/g, '-') || 'project';
  const taken = (name) => fs.existsSync(path.join(shelf(home, false), name)) || fs.existsSync(path.join(shelf(home, true), name));
  let name = base;
  for (let n = 2; taken(name); n++) name = `${base}-${n}`;
  return path.join(dir, name);
}

/** Point `.flow/` at `dir`, and hide the link from git in this clone alone. */
function link(root, dir) {
  const at = path.join(root, '.flow');
  fs.mkdirSync(dir, { recursive: true });
  fs.rmSync(at, { force: true });
  fs.symlinkSync(dir, at);
  exclude(root);
}

/**
 * List `.flow` in `.git/info/exclude`, git's ignore list for one clone, which
 * is never committed. Without the slash, so it matches the link as well as a
 * folder.
 */
function exclude(root) {
  const common = git(root, ['rev-parse', '--git-common-dir']).out || '.git';
  const file = path.resolve(root, common, 'info', 'exclude');
  const had = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (had.split('\n').some((l) => ['.flow', '/.flow'].includes(l.trim()))) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${had}${had && !had.endsWith('\n') ? '\n' : ''}# Flow: this clone's tickets live outside the repository\n.flow\n`);
}

/** Write the project's repository into the folder's settings, so another machine finds the folder. */
function remember(root, dir) {
  const repo = repositoryOf(root);
  if (!repo) return;
  const file = path.join(dir, 'settings.json');
  const saved = settings.read(file);
  if (saved.repository !== repo) settings.write(file, { ...saved, repository: repo });
}

/** Copy every file of `from` into `to`, leaving out git's own `.git`. */
function copyRecords(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from)) {
    if (entry === '.git') continue;
    fs.cpSync(path.join(from, entry), path.join(to, entry), { recursive: true, verbatimSymlinks: true });
  }
}

/** The ticket folders under `dir`, active and archived, by folder name. */
function ticketFolders(dir) {
  const names = [];
  for (const sub of ['tickets', path.join('tickets', 'archive')]) {
    const at = path.join(dir, sub);
    if (!fs.existsSync(at)) continue;
    for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'archive' && fs.existsSync(path.join(at, entry.name, 'ticket.md'))) names.push(entry.name);
    }
  }
  return names;
}

module.exports = {
  PROJECTS, LOCAL, shelf, repositoryOf, visibility, placeOf, findFolder, newFolder, link, exclude, remember, copyRecords, ticketFolders,
};
