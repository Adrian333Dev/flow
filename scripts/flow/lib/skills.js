'use strict';
/**
 * The skill catalog, what installs, and what a session is shown of each one.
 *
 * A skill is a folder holding `SKILL.md`, filed 1 level deep under a group:
 * `skills/phases/groundwork/`. The group files it and decides one thing:
 * `drafts/` does not install, and every other group does.
 *
 * Flow's own skills have no list of names. A list is a hand-maintained copy of
 * what the tree already says, and it can only ever be wrong; a group folder is
 * visible on disk, cannot drift, and adding a skill to it is a `mkdir`.
 *
 * Installing and being shown are separate questions. Every skill outside
 * `drafts/` installs, and every one of them is shown in every session. There
 * is no per-skill off switch: `skillOverrides` does not reach a plugin's
 * skills, and `claude plugin disable flow@skills-dir` takes the whole set.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { FlowError } = require('./error');
const { skillsRoot } = require('./clone');

/** The one group `flow install` skips. A skill starts here and graduates by `mv`. */
const DRAFTS = 'drafts';

/**
 * The name every Flow skill is typed under: `/flow:groundwork`.
 *
 * It comes from one file rather than from any folder in this clone. A folder
 * holding `.claude-plugin/plugin.json` is a plugin, and every skill below that
 * file is offered as `<plugin name>:<skill name>`. Claude Code reads the file
 * because the format is its own; Codex reads the same file, which is why one
 * tree serves both. So every folder and every frontmatter `name` in this clone
 * stays bare.
 *
 * The harnesses look for it in different places, so it sits in 2:
 *
 *   skills/.claude-plugin/plugin.json   the one in this clone. Codex follows a
 *                                       skill's link to its real folder, then
 *                                       looks above that folder, so it finds
 *                                       this one
 *   <plugin folder>/.claude-plugin/     a copy `flow install` writes every run.
 *                                       Claude Code looks above the link
 */
const PLUGIN = 'flow';

/**
 * The plugin folder, a real folder in `~/.agents/skills/`. Codex reads that
 * skills folder and Claude Code does not, so Claude Code reaches the plugin
 * through `pluginLink`, and there is still one copy of the folder.
 */
const pluginDir = (agents) => path.join(agents, 'skills', PLUGIN);

/** Where the per-skill links go. `skills/` is where a plugin keeps its skills. */
const linkDir = (agents) => path.join(pluginDir(agents), 'skills');

/** The manifest in the clone, above every skill's real folder. */
const manifestSource = () => path.join(skillsRoot(), '.claude-plugin', 'plugin.json');

/** Its copy in the plugin folder, copied rather than linked: Codex ignores a symlinked one. */
const manifestFile = (agents) => path.join(pluginDir(agents), '.claude-plugin', 'plugin.json');

/** The link in `~/.claude/skills/` that shows Claude Code the plugin folder. */
const pluginLink = (claude) => path.join(claude, 'skills', PLUGIN);

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
 * A name is the whole identity (it is the filename of every link) so two
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
    const lines = [...clashes].map(([name, groups]) => `  ${name}: ${groups.join(', ')}`);
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
    `  The skills: ${[...all.keys()].sort().join(', ')}`
  );
}

/** Everything `flow install` links. Pass drafts to include the group it skips. */
function installable({ drafts = false } = {}) {
  return [...catalog().values()].filter((s) => drafts || s.group !== DRAFTS);
}

/** Where Claude Code keeps this machine's config. The scratch session moves it. */
const configDir = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

module.exports = {
  DRAFTS, PLUGIN, catalog, configDir, find, installable, linkDir, manifestFile, manifestSource, pluginDir, pluginLink, subdirs,
};
