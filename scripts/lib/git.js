'use strict';
/**
 * git and gh, run the one way Flow runs them.
 *
 * Every call names its folder, so the variables that point git at another
 * repository are dropped: a hook fired from inside a git hook would otherwise
 * inherit `GIT_DIR` and read the wrong one. Never a password prompt either: a
 * remote with no stored sign-in fails instead of waiting on a terminal nobody
 * may be watching.
 *
 * Nothing throws. A call returns what it printed and whether it worked, and
 * the caller decides what a failure means.
 */

const { spawnSync } = require('child_process');

const DROPPED = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'];

function environment(extra) {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  for (const key of DROPPED) delete env[key];
  return { ...env, ...extra };
}

/**
 * `{ ok, out, err, raw }`: `out` and `err` trimmed, `raw` the output as
 * printed, for a caller parsing it byte for byte.
 */
function result(ran) {
  const raw = ran.stdout || '';
  return { ok: ran.status === 0, out: raw.trim(), err: (ran.stderr || '').trim(), raw };
}

/** git in `dir`. `env` adds variables, `input` is written to its stdin. */
function git(dir, args, { env, input } = {}) {
  return result(spawnSync('git', args, {
    cwd: dir, input, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: environment(env),
  }));
}

/** gh, the same way. `missing` says gh is not on PATH at all. */
function gh(args, { input } = {}) {
  const ran = spawnSync('gh', args, { input, encoding: 'utf8' });
  if (ran.error) return { ok: false, out: '', err: 'gh is not installed', raw: '', missing: true };
  return result(ran);
}

/** The top folder of the repository around `dir`, or null outside one. */
function top(dir) {
  const found = git(dir, ['rev-parse', '--show-toplevel']);
  return found.ok ? found.out : null;
}

module.exports = { git, gh, top };
