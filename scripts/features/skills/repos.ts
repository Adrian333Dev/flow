/**
 * The clones Flow keeps on a machine, every one under `~/.flow/repos/`.
 *
 *   repos/flow/                     Flow's own clone, or a link to it where
 *                                   the user keeps it somewhere else
 *   repos/util/                     util, whose `util` and `u` Flow links
 *
 * `flow install` makes every one that is missing, and nothing else clones. A
 * command that finds one missing says so and names `flow install`, which
 * changes nothing that already exists.
 *
 * `FLOW_GIT_BASE` stands in for `https://github.com/`, so a test clones from
 * folders on disk and never from the network.
 */

import fs from 'node:fs';
import path from 'node:path';
import { FlowError } from '../../shared/error.ts';
import * as paths from '../../shared/paths.ts';
import { git } from '../../shared/git.ts';

/** The clones Flow makes for itself. */
const OWN = { util: 'Adrian333Dev/util' };

const base = () => process.env.FLOW_GIT_BASE || 'https://github.com/';

const dir = (home) => path.join(home || paths.flowHome(), 'repos');
const flowClone = (home) => path.join(dir(home), 'flow');
const ownClone = (home, name) => path.join(dir(home), name);

/**
 * One repository entry as its parts. `owner/repo` is GitHub, and anything else
 * is a git address whose last 2 folders name the owner and the repository.
 */
function parse(entry) {
  const text = String(entry || '').trim();
  const short = /^[\w.-]+\/[\w.-]+$/.test(text);
  const parts = text.replace(/\.git$/, '').replace(/\/+$/, '').split(/[/:]/).filter(Boolean);
  if (parts.length < 2) throw new FlowError(`"${text}" is not a repository: write owner/repo, or a git address.`);
  const [owner, repo] = parts.slice(-2);
  return {
    entry: text,
    owner,
    repo,
    id: `${owner}/${repo}`,
    url: short ? `${base()}${text}` : text,
    folder: `${owner}_${repo}`,
  };
}

/** The short commit a clone sits at, or null. */
const head = (at) => {
  const found = git(at, ['rev-parse', '--short', 'HEAD']);
  return found.ok ? found.out : null;
};

/**
 * Clone the newest commit only. It lands in a folder beside the target and is
 * renamed once whole, so a clone stopped halfway never looks like a clone.
 */
function clone(url, to) {
  const part = `${to}.part-${process.pid}`;
  fs.rmSync(part, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const ran = git(path.dirname(to), ['clone', '--depth', '1', '--quiet', url, part]);
  if (!ran.ok) {
    fs.rmSync(part, { recursive: true, force: true });
    return { ok: false, why: ran.err.split('\n').filter(Boolean).pop() || 'git clone failed' };
  }
  fs.renameSync(part, to);
  return { ok: true, commit: head(to) };
}

export { OWN, base, dir, flowClone, ownClone, parse, head, clone };
