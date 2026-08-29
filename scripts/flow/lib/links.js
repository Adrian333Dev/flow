'use strict';
/**
 * Symlinks, and the 1 rule about them: Flow links per item, never per folder.
 *
 * `~/.claude/skills/` and `agents/` hold entries Flow does not own — other
 * catalogs, hand-written ones. A folder link would evict every one of them and
 * block new ones, so each entry gets its own link.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');

/**
 * Point a link at a target, replacing whatever link sat there.
 *
 * An existing link is removed rather than followed, so re-running never nests
 * a link inside the folder it already points at. A real file or folder in the
 * way is somebody else's, and refuses.
 */
function link(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  let existing;
  try {
    existing = fs.lstatSync(to);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  if (existing) {
    if (!existing.isSymbolicLink()) {
      throw new FlowError(`${to} is a real file, not a link — Flow will not replace it.`);
    }
    fs.unlinkSync(to);
  }
  fs.symlinkSync(from, to);
}

/**
 * Drop links into the clone that no longer resolve, left behind by a rename or
 * a delete. Only ever a broken link whose target is inside the clone — never a
 * real file, and never somebody else's link.
 */
function pruneDead(dir, clone) {
  const gone = [];
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return gone;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    let target;
    try {
      if (!fs.lstatSync(full).isSymbolicLink()) continue;
      target = fs.readlinkSync(full);
    } catch {
      continue;
    }
    if (!target.startsWith(clone + path.sep)) continue;
    if (fs.existsSync(full)) continue;
    fs.unlinkSync(full);
    gone.push(name);
  }
  return gone;
}

/** Every `*.md` in a folder, sorted — how commands and agents are named. */
function markdownFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  } catch {
    return [];
  }
}

module.exports = { link, pruneDead, markdownFiles };
