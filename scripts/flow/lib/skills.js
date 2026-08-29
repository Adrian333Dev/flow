'use strict';
/**
 * The skill catalog, and the 2 lists that decide where each one installs.
 *
 * A skill is a folder holding `SKILL.md`, filed 1 level deep under a group —
 * `skills/phases/groundwork/`. The group files it and decides nothing else, so
 * nothing outside this file reads one: a list names a skill, and a link is
 * named for the skill.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');
const { cloneRoot, skillsRoot } = require('./clone');

/** `home/skills` — what links into `~/.claude/skills/`, committed with Flow. */
const globalList = () => path.join(cloneRoot(), 'home', 'skills');

/** `.claude/flow/skills` — what links into this project, committed with it. */
const projectList = (root) => path.join(root, '.claude', 'flow', 'skills');

/** Where a project's links go. */
const projectLinks = (root) => path.join(root, '.claude', 'skills');

const subdirs = (dir) => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
};

/**
 * One name per line, `#` for a comment, matching `.flow-include`.
 *
 * A list carries names and never paths, because the machine reading it keeps
 * its clone somewhere else. A missing list is an empty one — a project that
 * uses no Flow skill has nothing to write down.
 */
function readList(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw new FlowError(`${file} could not be read — ${e.message}`);
  }
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

/** Append a name, leaving whatever comment header the file already carries. */
function addToList(file, name) {
  const existing = readList(file);
  if (existing.includes(name)) return false;
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch { /* a list that does not exist yet starts here */ }
  if (text && !text.endsWith('\n')) text += '\n';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text + name + '\n');
  return true;
}

/**
 * Every skill in the clone, keyed by name.
 *
 * A name is the whole identity — it is the filename of every link — so two
 * skills sharing one across groups is a collision rather than a preference.
 * Refusing here surfaces it on the next command instead of the day one link
 * silently overwrites the other.
 */
function catalog() {
  const root = skillsRoot();
  const found = new Map();
  const clashes = new Map();

  for (const group of subdirs(root)) {
    for (const name of subdirs(path.join(root, group))) {
      const dir = path.join(root, group, name);
      if (!fs.existsSync(path.join(dir, 'SKILL.md'))) continue;
      if (found.has(name)) {
        clashes.set(name, [found.get(name).group, group]);
        continue;
      }
      found.set(name, { name, group, dir });
    }
  }

  if (clashes.size) {
    const lines = [...clashes].map(([name, groups]) => `  ${name} — ${groups.join(', ')}`);
    throw new FlowError(
      'two skills share a name, and a link is named for the skill:\n' +
      lines.join('\n') +
      '\nRename one. The group files a skill and never separates two of them.'
    );
  }
  return found;
}

/** One skill by name, or a refusal naming what does exist. */
function find(name) {
  const all = catalog();
  const hit = all.get(name);
  if (hit) return hit;
  throw new FlowError(
    `no skill named "${name}" in ${skillsRoot()}.\n` +
    `  See them all: flow skills ls`
  );
}

module.exports = {
  globalList, projectList, projectLinks, readList, addToList, catalog, find, subdirs,
};
