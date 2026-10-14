'use strict';
/**
 * The names `flow install` makes in `~/.local/bin`, read by `flow install` and
 * `flow doctor`.
 */

const path = require('path');

/**
 * The names you type, against the one script both of them run.
 *
 * `fw` is the second name because `flow` is typed all day. `util` and `u`
 * are util's own, made by `util install` from `~/.flow/repos/util/`, which
 * `flow install` runs.
 */
const BIN = {
  flow: path.join('scripts', 'flow.js'),
  fw: path.join('scripts', 'flow.js'),
};

module.exports = { BIN };
