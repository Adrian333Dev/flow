/**
 * Where a project's tickets live: `.flow/` is a link to
 * ~/.flow/projects/<name>/, in the private Flow home, from `flow init`.
 * `flow sync` carries it to the user's other machines, and nobody else sees it.
 *
 * Two older places still read, and neither is made any more. A plain `.flow/`
 * folder reads as `folder`: it never leaves the clone. A checkout of the
 * project's branch `flow` reads as `branch`: features/tickets/records.ts keeps it.
 *
 * The link and the folder name are this machine's. What ties a folder to its
 * project on every machine is `repository` in the folder's settings.json, the
 * project's remote written as `github.com/owner/repo`, so a second machine's
 * `flow init` finds the folder the first one made.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as records from './records.ts';
import * as settings from '../../shared/settings.ts';
import * as paths from '../../shared/paths.ts';
import { git } from '../../shared/git.ts';

const PROJECTS = 'projects';

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
 * List `line` in `.git/info/exclude`, git's ignore list for one clone, which
 * is never committed, under the comment `why`. `.flow` goes without the
 * slash, so it matches the link as well as a folder. `same` are the spellings
 * already counting as listed.
 */
function exclude(root, line = '.flow', why = "this clone's tickets live outside the repository", same = ['.flow', '/.flow']) {
  const file = excludeFile(root);
  const had = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (had.split('\n').some((l) => same.includes(l.trim()))) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${had}${had && !had.endsWith('\n') ? '\n' : ''}# Flow: ${why}\n${line}\n`);
}

/** Write the project's repository into the folder's settings, so another machine finds the folder. */
function remember(root, dir) {
  const repo = repositoryOf(root);
  if (!repo) return;
  const file = path.join(dir, 'settings.json');
  const saved = settings.read(file);
  if (saved.repository !== repo) settings.write(file, { ...saved, repository: repo });
}

export { PROJECTS, shelf, repositoryOf, placeOf, findFolder, newFolder, link, exclude, excludeFile, remember };
