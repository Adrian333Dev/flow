'use strict';
/**
 * Everything the guard asks of the machine: the home folder, the
 * environment, the disk, git and `find`. The hook builds one world per
 * command and every judging file reads it as `ctx.world`, so the rest of
 * `lib/guard/` is text in, decision out, and touches nothing itself.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { git: run } = require('../git');

/** realpath that tolerates a path which does not exist yet. */
function real(p) {
  let abs = path.resolve(p);
  const tail = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(abs), ...tail);
    } catch {
      const parent = path.dirname(abs);
      if (parent === abs) return path.resolve(p);
      tail.unshift(path.basename(abs));
      abs = parent;
    }
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function git(dir, args) {
  const ran = run(dir, args);
  return ran.ok ? ran.raw : null;
}

/**
 * The files under `spec` that hold work no commit has, each `{ file, state }`:
 * `changed` for changed or staged, and with `untracked` also `new`, and
 * `ignored` for what git ignores. An ignored folder comes back whole, as one
 * entry that may hold `spec`. Null outside a git repository.
 */
function uncommitted(spec, untracked) {
  let anchor = isDir(spec) ? spec : path.dirname(spec);
  while (!fs.existsSync(anchor)) {
    const up = path.dirname(anchor);
    if (up === anchor) return null;
    anchor = up;
  }
  const top = git(anchor, ['rev-parse', '--show-toplevel']);
  if (top === null) return null;
  const rel = path.relative(top.trim(), spec) || '.';
  if (rel.startsWith('..')) return null;
  const listing = untracked ? ['--untracked-files=all', '--ignored=matching'] : ['--untracked-files=no'];
  const out = git(top.trim(), ['status', '--porcelain=v1', '-z', ...listing, '--', rel]);
  if (out === null) return null;
  const files = [];
  const entries = out.split('\0');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const xy = entry.slice(0, 2);
    if (xy[0] === 'R' || xy[0] === 'C') i++;
    if (xy === ' D' || xy === 'D ' || xy === 'DD') continue;
    const state = xy === '??' ? 'new' : xy === '!!' ? 'ignored' : 'changed';
    files.push({ file: path.join(top.trim(), entry.slice(3)), state });
  }
  return files;
}

/** Runs `find` with `args` from `cwd`. Only ever a dry run: the guard swaps every deleting action out first. */
function find(args, cwd) {
  const result = spawnSync('find', args, { cwd, encoding: 'utf8', timeout: 3000, maxBuffer: 64 * 1024 * 1024 });
  return { ok: !result.error && result.status === 0, stdout: result.stdout || '' };
}

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

/** The world as it stands now. The home folder is read here, per command, so a test's `HOME` holds. */
function world() {
  return {
    home: os.homedir(),
    env: (name) => process.env[name] ?? null,
    real,
    exists: (p) => fs.existsSync(p),
    isDir,
    uncommitted,
    find,
    readFile,
  };
}

module.exports = { world };
