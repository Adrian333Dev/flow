'use strict';
/**
 * Where everything Flow touches sits on this machine. Every path built from
 * the home folder, the Flow home, Claude Code's folder or the clone starts
 * here, so an override set once moves every reader with it.
 *
 *   ~/.agents  the plugin folder skills/flow/
 *   ~/.claude  what Claude Code reads. It reaches ~/.agents and ~/.flow
 *              through links, and holds no original of Flow's
 *   ~/.flow    the rule file CLAUDE.md, which flow sync carries, the clones in
 *              repos/, scripts/, references/, docs/ and the settings
 *
 * `~/.agents` holds the originals because the name belongs to no vendor.
 * Claude Code does not read it, so it gets a link.
 *
 * 3 overrides. FLOW_HOME moves the Flow home on its own and CLAUDE_CONFIG_DIR
 * Claude Code's folder, which is how a test points either somewhere else.
 * `--root <dir>` puts the whole machine under `<dir>` instead, which is how
 * the tests and lab/scripts/try.sh build one inside tmp/. One flag for all 3
 * folders, so no run can redirect some of them and write the rest into the
 * real home folder. It wins over both variables.
 *
 * The clone is found from this file. `~/.local/bin/flow` is a symlink to
 * `<clone>/scripts/flow.js`, and node resolves a symlink before the script
 * runs, so `__dirname` here is the real folder rather than the link. Move the
 * clone, re-point that one link, and every path built from it moves too.
 */

const os = require('os');
const path = require('path');

const flowHome = () => process.env.FLOW_HOME || path.join(os.homedir(), '.flow');

const claudeHome = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

/** The clone root: 2 folders up from `scripts/lib/`. */
const cloneRoot = () => path.resolve(__dirname, '..', '..');

/** Every skill really lives under here, filed into a group folder. */
const skillsRoot = () => path.join(cloneRoot(), 'skills');

/** The 3 folders, under `root` or under the home folder. */
function folders(root) {
  const base = path.resolve(root || os.homedir());
  return {
    base,
    agents: path.join(base, '.agents'),
    claude: !root && process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(base, '.claude'),
    flow: !root && process.env.FLOW_HOME ? path.resolve(process.env.FLOW_HOME) : path.join(base, '.flow'),
  };
}

/**
 * Called once per run with `--root`, before anything reads a path. `<root>`
 * stands in for `~`, so `~/.gitconfig` moves with it: the machine name
 * `flow install` saves there never reaches the real one.
 */
function useRoot(root) {
  if (!root) return;
  const base = path.resolve(root);
  if (base !== os.homedir()) process.env.GIT_CONFIG_GLOBAL = path.join(base, '.gitconfig');
}

/** `$HOME` and a leading `~` are what a settings file or a hook line holds instead of a path. */
const expandHome = (p) => p.replace(/^~(?=\/|$)/, os.homedir()).split('$HOME').join(os.homedir());

/** A path under the home folder, written with `~`, for output. */
const shorten = (p) => (p === os.homedir() || p.startsWith(os.homedir() + path.sep)
  ? '~' + p.slice(os.homedir().length)
  : p);

module.exports = { flowHome, claudeHome, cloneRoot, skillsRoot, folders, useRoot, expandHome, shorten };
