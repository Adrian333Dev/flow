/**
 * The names `flow install` makes in `~/.local/bin`, read by `flow install` and
 * `flow doctor`.
 */

import path from 'node:path';

/**
 * The names you type, against the one script both of them run.
 *
 * `fw` is the second name because `flow` is typed all day. `util` and `u`
 * are util's own, made by `util install` from `~/.flow/repos/util/`, which
 * `flow install` runs.
 */
const BIN = {
  flow: path.join('scripts', 'flow.ts'),
  fw: path.join('scripts', 'flow.ts'),
};

export { BIN };
