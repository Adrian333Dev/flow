'use strict';
/**
 * Where a project's tickets live. 2 places:
 *
 *   branch        `.flow/` is a checkout of the project's branch `flow`, pushed
 *                 with the repository. Everyone who can read the repository
 *                 reads the tickets. lib/tickets/records.js keeps it
 *   home          `.flow/` is a link to ~/.flow/projects/<name>/, in the
 *                 private Flow home, from `flow init --private`. `flow sync`
 *                 carries it to the user's other machines, and nobody else
 *                 sees it
 *
 * A plain `.flow/` folder, from before the Flow home held projects, reads as
 * `folder`: it never leaves the clone.
 *
 * The link and the folder name are this machine's. What ties a folder to its
 * project on every machine is `repository` in the folder's settings.json, the
 * project's remote written as `github.com/owner/repo`, so a second machine's
 * `flow init` finds the folder the first one made.
 */

const fs = require('fs');
const path = require('path');
const records = require('./records');
const settings = require('../settings');
const paths = require('../paths');
const { git, gh } = require('../git');

const PROJECTS = 'projects';

/** The lines Flow adds to the project's `.gitignore`. */
const IGNORE_LINES = [
  '',
  '# Flow: .flow/ holds the tickets, checked out from the branch "flow", which',
  '# shares no history with the code. Every branch sees the same tickets, and',
  '# none of them is ever merged in.',
  '.flow/',
];

/** The folder the Flow home keeps its project folders in. */
const shelf = (home) => path.join(home, PROJECTS);

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
  const asked = gh(['repo', 'view', github[1], '--json', 'visibility', '-q', '.visibility']);
  return asked.ok && asked.out ? asked.out.toLowerCase() : 'unknown';
}

/**
 * Where this project's tickets live now: `{ type, dir }`, with `type` one of
 * `branch`, `home` or `folder`. Null where `.flow/` is missing.
 */
function placeOf(root, home = paths.flowHome()) {
  const link = path.join(root, '.flow');
  let stat;
  try {
    stat = fs.lstatSync(link);
  } catch {
    return null;
  }
  if (stat.isSymbolicLink()) {
    const dir = path.resolve(root, fs.readlinkSync(link));
    return { type: path.dirname(dir) === path.resolve(shelf(home)) ? 'home' : 'folder', dir };
  }
  return { type: records.onBranch(root) ? 'branch' : 'folder', dir: link };
}

/** The Flow home folder already holding this project's tickets, found by its repository, or null. */
function findFolder(root, home = paths.flowHome()) {
  const repo = repositoryOf(root);
  const dir = shelf(home);
  if (!repo || !fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir).sort()) {
    const saved = settings.read(path.join(dir, name, 'settings.json')).repository;
    if (saved === repo) return path.join(dir, name);
  }
  return null;
}

/** A new folder for this project in the Flow home: the project folder's name, then `-2`, `-3` where taken. */
function newFolder(root, home = paths.flowHome()) {
  const dir = shelf(home);
  const base = path.basename(path.resolve(root)).toLowerCase().replace(/[^a-z0-9._-]+/g, '-') || 'project';
  let name = base;
  for (let n = 2; fs.existsSync(path.join(dir, name)); n++) name = `${base}-${n}`;
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

/** This clone's `.git/info/exclude`, which a worktree shares with its main clone. */
function excludeFile(root) {
  const common = git(root, ['rev-parse', '--git-common-dir']).out || '.git';
  return path.resolve(root, common, 'info', 'exclude');
}

/**
 * List `.flow` in `.git/info/exclude`, git's ignore list for one clone, which
 * is never committed. Without the slash, so it matches the link as well as a
 * folder.
 */
function exclude(root) {
  const file = excludeFile(root);
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

/** Add Flow's lines to `.gitignore`, keeping every line already there. */
function addIgnore(project) {
  const file = path.join(project, '.gitignore');
  const had = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const lines = new Set(had.split('\n').map((l) => l.trim()));
  if (lines.has('.flow/') || lines.has('.flow')) return false;
  fs.writeFileSync(file, `${had}${had && !had.endsWith('\n') ? '\n' : ''}${IGNORE_LINES.join('\n').replace(/^\n/, had ? '\n' : '')}\n`);
  return true;
}

module.exports = {
  PROJECTS, shelf, repositoryOf, visibility, placeOf, findFolder, newFolder, link, exclude, excludeFile, remember,
  copyRecords, ticketFolders, addIgnore,
};
