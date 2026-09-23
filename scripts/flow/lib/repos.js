'use strict';
/**
 * The clones Flow keeps on a machine, every one under `~/.flow/repos/`.
 *
 *   repos/flow/                     Flow's own clone, or a link to it where
 *                                   the user keeps it somewhere else
 *   repos/util/                     util, whose `util` and `u` Flow links
 *   repos/toolbox/                  the catalog /flow:research reads, never
 *                                   pulled, since the library replaces it
 *   repos/sources/<owner>_<repo>/   one per skill repository in `sources`
 *
 * `flow install` makes every one that is missing, and nothing else clones. A
 * command that finds one missing says so and names `flow install`, which
 * changes nothing that already exists.
 *
 * `sources` sits in `~/.flow/settings.json`, so every machine gets the same
 * list through `flow sync`. With no key the list is the domain-skills
 * repository alone, which is all domain skills are: the first source.
 *
 * `FLOW_GIT_BASE` stands in for `https://github.com/`, so a test clones from
 * folders on disk and never from the network.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { FlowError } = require('./error');
const settings = require('./settings');

const DEFAULT_SOURCES = ['Adrian333Dev/domain-skills'];

/** The 2 clones Flow makes for itself, beside the sources. */
const OWN = { util: 'Adrian333Dev/util', toolbox: 'Adrian333Dev/toolbox' };

const base = () => process.env.FLOW_GIT_BASE || 'https://github.com/';

const dir = (home) => path.join(home || settings.flowHome(), 'repos');
const flowClone = (home) => path.join(dir(home), 'flow');
const ownClone = (home, name) => path.join(dir(home), name);

/**
 * One `sources` entry as its parts. `owner/repo` is GitHub, and anything else
 * is a git address whose last 2 folders name the owner and the repository.
 */
function parse(entry) {
  const text = String(entry || '').trim();
  const short = /^[\w.-]+\/[\w.-]+$/.test(text);
  const parts = text.replace(/\.git$/, '').replace(/\/+$/, '').split(/[/:]/).filter(Boolean);
  if (parts.length < 2) throw new FlowError(`"${text}" is not a repository: write owner/repo, or a git address.`);
  const [owner, repo] = parts.slice(-2);
  return {
    entry: text,
    owner,
    repo,
    id: `${owner}/${repo}`,
    url: short ? `${base()}${text}` : text,
    folder: `${owner}_${repo}`,
  };
}

/** The repositories skills come from, as written in `~/.flow/settings.json`. */
function sources(home) {
  const listed = settings.read(settings.globalFile(home)).sources;
  return Array.isArray(listed) ? listed.filter((s) => typeof s === 'string' && s.trim()) : [...DEFAULT_SOURCES];
}

function writeSources(home, list) {
  const file = settings.globalFile(home);
  settings.write(file, { ...settings.read(file), sources: list });
}

const sourceDir = (home, source) => path.join(dir(home), 'sources', source.folder);

/**
 * The name a source goes by in `ls` and in `--source`: the repository's own,
 * or `owner/repo` where 2 sources share it.
 */
function names(list) {
  const parsed = list.map(parse);
  const count = new Map();
  for (const s of parsed) count.set(s.repo, (count.get(s.repo) || 0) + 1);
  return parsed.map((s) => ({ ...s, name: count.get(s.repo) > 1 ? s.id : s.repo }));
}

/** git in one folder, returning what it printed and whether it worked. */
function git(cwd, args) {
  const ran = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

/** The short commit a clone sits at, or null. */
const head = (at) => {
  const found = git(at, ['rev-parse', '--short', 'HEAD']);
  return found.ok ? found.out : null;
};

/**
 * Clone the newest commit only. It lands in a folder beside the target and is
 * renamed once whole, so a clone stopped halfway never looks like a clone.
 */
function clone(url, to) {
  const part = `${to}.part-${process.pid}`;
  fs.rmSync(part, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const ran = git(path.dirname(to), ['clone', '--depth', '1', '--quiet', url, part]);
  if (!ran.ok) {
    fs.rmSync(part, { recursive: true, force: true });
    return { ok: false, why: ran.err.split('\n').filter(Boolean).pop() || 'git clone failed' };
  }
  fs.renameSync(part, to);
  return { ok: true, commit: head(to) };
}

module.exports = {
  DEFAULT_SOURCES, OWN, base, dir, flowClone, ownClone, parse, sources, writeSources, sourceDir, names, git, head, clone,
};
