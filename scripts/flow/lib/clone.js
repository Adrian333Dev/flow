'use strict';
/**
 * Where the Flow clone sits on this machine.
 *
 * Nothing stores the path. `~/.local/bin/flow` is a symlink to
 * `<clone>/scripts/flow/flow.js`, and node resolves a symlink before the
 * script runs, so `__dirname` here is the real folder rather than the link.
 * Move the clone, re-point that one link, and every path built from this
 * moves with it.
 */

const path = require('path');

/** The clone root — 3 folders up from `scripts/flow/lib/`. */
const cloneRoot = () => path.resolve(__dirname, '..', '..', '..');

/** Every skill really lives under here, filed into a group folder. */
const skillsRoot = () => path.join(cloneRoot(), 'skills');

module.exports = { cloneRoot, skillsRoot };
