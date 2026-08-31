'use strict';
/**
 * The skill catalog, what installs, and what a session is shown of each one.
 *
 * A skill is a folder holding `SKILL.md`, filed 1 level deep under a group —
 * `skills/phases/groundwork/`. The group files it and decides one thing:
 * `drafts/` does not install, and every other group does.
 *
 * There is no list of skill names anywhere. A list is a hand-maintained copy of
 * what the tree already says, and it can only ever be wrong; a group folder is
 * visible on disk, cannot drift, and adding a skill to it is a `mkdir`.
 *
 * Installing and being shown are separate questions. Every skill outside
 * `drafts/` installs, and `skillOverrides` decides what a session pays for it.
 * A skill set to `off` costs nothing in context, so there is no case for
 * leaving one uninstalled.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { FlowError } = require('./error');
const { skillsRoot } = require('./clone');

/** The one group `flow install` skips. A skill starts here and graduates by `mv`. */
const DRAFTS = 'drafts';

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

/** Everything `flow install` links. Pass drafts to include the group it skips. */
function installable({ drafts = false } = {}) {
  return [...catalog().values()].filter((s) => drafts || s.group !== DRAFTS);
}

/** Where Claude Code keeps this machine's config. The scratch session moves it. */
const configDir = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

function readOverrides(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw new FlowError(`${file} could not be read — ${e.message}`);
  }
  try {
    return JSON.parse(text).skillOverrides || {};
  } catch (e) {
    throw new FlowError(`${file} is not valid JSON — ${e.message}`);
  }
}

/**
 * What each skill is set to here, and which file set it.
 *
 * A name nobody mentions is `on`: Claude Code shows a skill it was told nothing
 * about. The project's file beats the machine's key by key rather than
 * replacing the object, so a project `on` restores a skill the machine turned
 * off — verified against Claude Code 2.1.251 on 2026-08-29.
 */
function states(root) {
  const machine = readOverrides(path.join(configDir(), 'settings.json'));
  const project = root ? readOverrides(path.join(root, '.claude', 'settings.json')) : {};
  return (name) => {
    if (name in project) return { state: project[name], setBy: 'project' };
    if (name in machine) return { state: machine[name], setBy: 'machine' };
    return { state: 'on', setBy: 'default' };
  };
}

module.exports = { DRAFTS, catalog, find, installable, states, subdirs };
