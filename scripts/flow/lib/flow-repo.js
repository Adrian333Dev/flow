'use strict';
/**
 * `~/.flow/` as one private git repository, which is how Flow reaches a second
 * machine.
 *
 * One repository, never one per folder. Everything of the user's that should
 * travel lives in `~/.flow/` already: the rules and profile, the workflow
 * notes, the study cases, the private skills, the wiki, and the tickets made
 * outside any project. A project travels through its own repository, and Flow
 * leaves it alone.
 *
 * What describes this machine alone never travels, and `IGNORED` below is that
 * list:
 *
 *   version       the migration this machine reached. Another machine's date
 *                 here claims migrations that never ran
 *   run.json      a half-finished run on this machine
 *   originals/    this machine's disk as it was before Flow. Putting another
 *                 machine's back would write its files over this one's
 *   settings.local.json   every setting holding a path, the clone included
 *   scripts, references   links into this machine's clone, which sits
 *                 somewhere else on the other machine
 *   a wiki tool's downloads   pages fetched once per machine
 *
 * A commit is named for the machine that made it, `desktop: 2 files`, so a
 * line in a note can be traced to where it was written.
 *
 * Nothing here runs by itself. `flow sync` is typed, and `flow install` sets
 * the repository up once. The user asked for the smallest version that works:
 * a download when a session opens and an upload when something changed are
 * both parked in `backlog.md`.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { FlowError } = require('./error');

/** What stays on the machine it was written on. */
const IGNORED = [
  '# What belongs to this machine alone.',
  'version',
  'run.json',
  'originals/',
  'settings.local.json',
  'scripts',
  'references',
  'wiki/*/downloads/',
  '',
].join('\n');

/** git in one folder, returning what it printed and whether it worked. */
function git(dir, args) {
  const ran = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

const isRepo = (at) => fs.existsSync(path.join(at.flow, '.git'));

/** This machine's name, from git's `util.machine`, which `util` reads too. */
function machineName(at) {
  const set = git(at.flow, ['config', '--get', 'util.machine']);
  return set.ok && set.out ? set.out : null;
}

/** Everything not committed, as `2 files` or null. */
function changed(at) {
  if (!isRepo(at)) return null;
  const status = git(at.flow, ['status', '--porcelain']);
  if (!status.ok || !status.out) return null;
  const count = status.out.split('\n').length;
  return `${count} file${count === 1 ? '' : 's'}`;
}

/** The `.gitignore`, written every run so a new machine-only path reaches it. */
function writeIgnore(at) {
  fs.mkdirSync(at.flow, { recursive: true });
  fs.writeFileSync(path.join(at.flow, '.gitignore'), IGNORED);
}

/**
 * Turn `~/.flow/` into a repository and point it at `remote`, or at a private
 * one `gh` makes when `remote` is `new`. Idempotent: an existing repository
 * keeps its history and only gains the remote.
 */
function start(at, remote) {
  writeIgnore(at);
  if (!isRepo(at)) {
    const made = git(at.flow, ['init', '-q', '-b', 'main']);
    if (!made.ok) throw new FlowError(`git init in ${at.flow} failed: ${made.err}`);
  }

  if (remote === 'new') {
    const name = `flow-${path.basename(at.base)}`;
    const gh = spawnSync('gh', ['repo', 'create', name, '--private', '--source', at.flow, '--remote', 'origin', '--push'], { cwd: at.flow, encoding: 'utf8' });
    if (gh.status !== 0) {
      throw new FlowError(`gh could not make the repository: ${(gh.stderr || '').trim()}\n  Make one on GitHub, then run flow install again and give its address.`);
    }
    return `made ${name} on GitHub, private`;
  }

  const existing = git(at.flow, ['remote', 'get-url', 'origin']);
  if (existing.ok && existing.out === remote) return `origin is already ${remote}`;
  const set = git(at.flow, ['remote', existing.ok ? 'set-url' : 'add', 'origin', remote]);
  if (!set.ok) throw new FlowError(`could not point origin at ${remote}: ${set.err}`);
  return `origin is ${remote}`;
}

/** Bring another machine's work down. Anything but a fast-forward stops. */
function load(at) {
  if (!isRepo(at)) throw new FlowError(`${at.flow} is not a repository yet. Run flow install and give it one.`);
  const pulled = git(at.flow, ['pull', '--ff-only', 'origin', 'main']);
  if (!pulled.ok) {
    throw new FlowError(`the pull would not fast-forward, so nothing came down:\n  ${pulled.err.split('\n')[0]}\n  Sort ${at.flow} out by hand, then run flow sync again.`);
  }
  return pulled.out.includes('Already up to date') ? null : pulled.out.split('\n')[0];
}

/** Send this machine's work up, named for the machine. Silent when nothing changed. */
function save(at) {
  if (!isRepo(at)) throw new FlowError(`${at.flow} is not a repository yet. Run flow install and give it one.`);
  const count = changed(at);
  if (!count) return null;
  const name = machineName(at) || path.basename(at.base);

  const staged = git(at.flow, ['add', '-A']);
  if (!staged.ok) throw new FlowError(`could not stage ${at.flow}: ${staged.err}`);
  const made = git(at.flow, ['commit', '-q', '-m', `${name}: ${count}`]);
  if (!made.ok) throw new FlowError(`could not commit ${at.flow}: ${made.err}`);
  const sent = git(at.flow, ['push', 'origin', 'main']);
  if (!sent.ok) throw new FlowError(`committed here, and the push failed:\n  ${sent.err.split('\n')[0]}`);
  return `${name}: ${count}`;
}

module.exports = { IGNORED, git, isRepo, machineName, changed, writeIgnore, start, load, save };
