'use strict';
/**
 * Uncommitted work, moved between two machines.
 *
 * Committed work already travels through the remote. Work that is only edited,
 * or not added at all, has no route, so switching machines either loses it or
 * forces a junk commit. This group gives it one.
 *
 * The mechanism, in full: build a commit holding everything in the project
 * folder, hang it off the commit you are on, and write its name into a label
 * under refs/unfinished/ — a place git never looks on its own. The label is not
 * a branch, so it never shows up in `git branch`, nothing switches to it, and
 * committing does not move it. Push the label and the other machine can fetch
 * it. Nothing about the branch, the staging area or the files on disk changes
 * while a copy is made.
 *
 * One label per machine per branch, so two machines can never overwrite each
 * other. Only the newest copy is kept, which is what makes the push a forced
 * one — safe here because one machine writes each label and nothing reads it as
 * history.
 *
 * references/work-sync.md explains what a copy is and why the label sits
 * outside refs/heads/.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const render = require('../lib/render');
const { projectRoot } = require('../lib/root');

/** Labels live here. Outside refs/heads/, which is the only place git acts on. */
const NS = 'refs/unfinished';

/** What was in the folder just before a restore overwrote it. Local, never pushed. */
const BACKUP_NS = 'refs/unfinished-backup';

const SHOWN = 12;

// ------------------------------------------------------------------ running git

/**
 * Every git call in this file goes through here. Two forms: `git(args)` throws
 * a readable failure, `git.try(args)` hands back the exit code so the caller can
 * treat a non-zero as an answer — which it is for `apply`, where conflicts are
 * the expected outcome rather than a fault.
 */
function runner(root) {
  function attempt(args, opts = {}) {
    try {
      const stdout = execFileSync('git', args, {
        cwd: root,
        encoding: opts.binary ? 'buffer' : 'utf8',
        maxBuffer: 512 * 1024 * 1024,
        input: opts.input,
        env: opts.env ? { ...process.env, ...opts.env } : process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { ok: true, code: 0, stdout, stderr: '' };
    } catch (e) {
      return {
        ok: false,
        code: e.status == null ? 1 : e.status,
        stdout: e.stdout || (opts.binary ? Buffer.alloc(0) : ''),
        stderr: String(e.stderr || e.message || '').trim(),
      };
    }
  }

  const git = (args, opts) => {
    const r = attempt(args, opts);
    if (!r.ok) throw new FlowError(`git ${args[0]} failed:\n${indent(r.stderr)}`);
    return opts && opts.binary ? r.stdout : String(r.stdout).trim();
  };
  git.try = attempt;
  return git;
}

const indent = (text) => String(text).split('\n').map((l) => `  ${l}`).join('\n');
const lines = (text) => String(text).split('\n').map((l) => l.trim()).filter(Boolean);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ------------------------------------------------------------------ the project

/**
 * The two shapes a repository can be in where a copy has nothing to hang off.
 * Both refuse here rather than producing a broken label: a commit needs a parent
 * to be a set of edits rather than a naked tree, and a label needs a branch name
 * to be filed under.
 */
function context() {
  const root = projectRoot();
  const git = runner(root);

  const head = git.try(['rev-parse', '--verify', 'HEAD']);
  if (!head.ok) {
    throw new FlowError(
      'this repository has no commits yet, so a copy has nothing to hang off.\n' +
      '  Make the first commit, then send.'
    );
  }

  const branch = git.try(['symbolic-ref', '--quiet', '--short', 'HEAD']);
  if (!branch.ok || !String(branch.stdout).trim()) {
    throw new FlowError(
      'HEAD is not on a branch, so there is no name to file the copy under.\n' +
      '  Check out a branch first, then send.'
    );
  }

  return {
    root,
    git,
    gitDir: git(['rev-parse', '--absolute-git-dir']),
    head: String(head.stdout).trim(),
    branch: String(branch.stdout).trim(),
    machine: machineName(git),
  };
}

const UNNAMED =
  'this machine has no name, and every stored copy is filed under one.\n' +
  '  Name it, once:  git config --global flow.machine desktop\n' +
  '  Give the other machine a different name, or the two overwrite each other.';

/**
 * Set by hand, once per machine, and never guessed.
 *
 * The name decides which label a copy is filed under, so two machines that
 * answer to the same one share a slot and overwrite each other every send —
 * with no error, because from the outside it looks like one machine sending
 * twice. The hostname was the first design and was dropped for exactly that:
 * WSL hands out defaults like `me`, which both machines would report.
 *
 * Absent is not an error here. `ls` only needs the name to mark which row is
 * this machine, and refusing to list what is stored would be a strange way to
 * ask for a setting. The commands that write something call `requireMachine`.
 */
function machineName(git) {
  const configured = git.try(['config', '--get', 'flow.machine']);
  const raw = process.env.FLOW_MACHINE || (configured.ok ? String(configured.stdout).trim() : '');
  if (!raw) return null;

  const slug = String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) throw new FlowError(`"${raw}" has no letters or digits in it, so it cannot name a machine.`);
  return slug;
}

function requireMachine(ctx) {
  if (!ctx.machine) throw new FlowError(UNNAMED);
  return ctx.machine;
}

/** The branch's own remote, or origin, or the only one there is. */
function remoteOf(git, branch) {
  const configured = git.try(['config', '--get', `branch.${branch}.remote`]);
  if (configured.ok && String(configured.stdout).trim()) return String(configured.stdout).trim();
  const all = git.try(['remote']);
  const list = all.ok ? lines(all.stdout) : [];
  return list.includes('origin') ? 'origin' : list[0] || null;
}

/** Gitignored paths that travel anyway, one per line, blank lines and # skipped. */
function includePaths(root) {
  const file = path.join(root, '.flow-include');
  if (!fs.existsSync(file)) return [];
  return lines(fs.readFileSync(file, 'utf8')).filter((l) => !l.startsWith('#'));
}

// ------------------------------------------------------------------ making one

/**
 * The whole send, minus the push. Not one of these touches the project folder
 * or the real staging area:
 *
 *   GIT_INDEX_FILE  points git at a scratch staging list, so `add` fills that
 *                   instead of the one `git status` reads
 *   add -A          every file that is not ignored, deletions included
 *   add -f          each .flow-include path, ignored or not
 *   write-tree      turns the scratch list into a stored folder listing
 *   commit-tree     wraps that listing in a commit, parented on where you are
 *
 * The scratch list is deleted on the way out, including when something throws.
 */
function buildCopy(ctx, message) {
  const { git, root, gitDir, head } = ctx;
  const index = path.join(gitDir, `flow-index-${process.pid}`);
  const env = { GIT_INDEX_FILE: index };

  try {
    git(['add', '-A'], { env });

    const refused = [];
    for (const p of includePaths(root)) {
      if (!git.try(['add', '-f', '--', p], { env }).ok) refused.push(p);
    }

    const tree = git(['write-tree'], { env });
    const copy = git(['commit-tree', '-p', head, '-m', message, tree]);
    return { copy, tree, refused, nested: nestedRepos(git, tree) };
  } finally {
    fs.rmSync(index, { force: true });
  }
}

/**
 * A folder with its own .git inside it records as a pointer and nothing else —
 * git stores the inner commit's name, not the inner files, and that name means
 * nothing on the other machine. Worth saying out loud at send time, because the
 * files look included right up until they are missing.
 */
function nestedRepos(git, tree) {
  const listing = git.try(['ls-tree', '-r', tree]);
  if (!listing.ok) return [];
  return lines(listing.stdout)
    .filter((l) => l.split(/\s+/)[1] === 'commit')
    .map((l) => l.split('\t').slice(1).join('\t'));
}

const changedFiles = (git, from, to) => lines(git(['diff', '--name-only', from, to]));

/**
 * For a listing, where one copy whose parent never arrived must not take the
 * whole table down with it.
 */
function countFiles(git, copy) {
  const r = git.try(['diff', '--name-only', `${copy}^`, copy]);
  return r.ok ? plural(lines(r.stdout).length, 'file') : 'unreadable';
}

const treeOf = (git, commit) => git(['rev-parse', `${commit}^{tree}`]);

// ------------------------------------------------------------------ reading them

/** Every label under refs/unfinished/, local and already fetched. */
function readCopies(git) {
  const format = '%(refname)%09%(objectname)%09%(committerdate:unix)';
  const listing = git.try(['for-each-ref', `--format=${format}`, NS]);
  if (!listing.ok) return [];

  return lines(listing.stdout).map((row) => {
    const [refname, copy, when] = row.split('\t');
    const rest = refname.slice(NS.length + 1);
    const cut = rest.indexOf('/');
    return {
      ref: refname,
      copy,
      when: Number(when) * 1000,
      machine: cut === -1 ? rest : rest.slice(0, cut),
      branch: cut === -1 ? '' : rest.slice(cut + 1),
    };
  }).filter((c) => c.branch);
}

/**
 * --prune is what makes a drop on the other machine take effect here. Without
 * it a deleted label survives locally forever and `ls` keeps offering a copy
 * that no longer exists anywhere else. The refspec bounds the pruning to
 * refs/unfinished/, so no branch is ever touched by it.
 */
function fetchCopies(git, remote) {
  if (!remote) return null;
  const r = git.try(['fetch', '--force', '--prune', remote, `${NS}/*:${NS}/*`]);
  return r.ok ? null : `could not reach ${remote} — showing whatever was already fetched.`;
}

function age(ms) {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 48) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

// ------------------------------------------------------------------ the commands

const actions = {};

actions.send = {
  summary: 'store this folder\'s uncommitted work where the other machine can reach it',
  flags: {
    clear: { bool: true },
    message: { arg: '"<text>"' },
  },
  run({ flags }) {
    const ctx = context();
    const { git, branch, head } = ctx;
    const machine = requireMachine(ctx);
    const ref = `${NS}/${machine}/${branch}`;

    const built = buildCopy(ctx, flags.message || `unfinished: ${machine}/${branch}`);
    if (built.tree === treeOf(git, head)) {
      throw new FlowError(`nothing uncommitted on ${branch} — the folder already matches the last commit.`);
    }
    git(['update-ref', ref, built.copy]);

    const files = changedFiles(git, head, built.copy);
    out(`${plural(files.length, 'file')} stored as ${ref}`);
    for (const f of files.slice(0, SHOWN)) out(`  ${f}`);
    if (files.length > SHOWN) out(`  and ${files.length - SHOWN} more`);

    if (built.refused.length) {
      out(`\n.flow-include named ${plural(built.refused.length, 'path')} git would not add:`);
      for (const p of built.refused) out(`  ${p}`);
    }
    if (built.nested.length) {
      out(`\n${plural(built.nested.length, 'path')} here holds its own git repository, so only a pointer travelled:`);
      for (const p of built.nested) out(`  ${p}`);
      out('  The files inside will not arrive. Push those repositories separately.');
    }

    const remote = remoteOf(git, branch);
    if (!remote) {
      out('\nThis repository has no remote, so the copy stayed on this machine.');
      out('  Add one, then send again.');
      return 1;
    }

    const push = git.try(['push', '--force', remote, `${built.copy}:${ref}`]);
    if (!push.ok) {
      out(`\nThe copy is stored here, but ${remote} refused it:`);
      out(indent(push.stderr));
      out(`\n  Nothing is lost — the copy is at ${ref} on this machine.`);
      return 1;
    }
    out(`\npushed to ${remote}`);

    if (flags.clear) clearFolder(git);
    out(`\nOn the other machine:  flow work get`);
    return 0;
  },
};

/**
 * Deliberately git's own stash rather than a reset, so the sweep is undoable
 * with a command the user already knows and a second copy survives locally.
 */
function clearFolder(git) {
  const stash = git.try(['stash', 'push', '--include-untracked', '-m', 'flow work send --clear']);
  if (!stash.ok) {
    out('\nThe folder could not be cleared:');
    out(indent(stash.stderr));
    return;
  }
  out('\nThe folder is clean, so a branch switch works now.');
  out('  put it back here:  git stash pop');
  out('  Gitignored files were left alone — git stash does not sweep those.');
}

actions.get = {
  args: '[<machine>]',
  summary: 'replay a stored copy onto the folder here',
  run({ positional }) {
    const ctx = context();
    const { git, branch, head } = ctx;
    const machine = requireMachine(ctx);

    const warning = fetchCopies(git, remoteOf(git, branch));
    if (warning) out(`${warning}\n`);

    const pick = chooseCopy(readCopies(git), { branch, machine, wanted: positional[0] });
    if (pick.ownLabel) {
      // Either this folder was re-cloned, or both machines are named the same
      // and have been overwriting one label all along.
      out(`The only copy of ${branch} is the one this machine made, filed under ${machine}.`);
      out(`If the other machine is also called ${machine}, rename one of them:`);
      out('  git config --global flow.machine laptop\n');
    }

    // Insurance, before anything overwrites a file. Local only: it exists to be
    // recovered from within the next minute, not to travel.
    const backupRef = `${BACKUP_NS}/${branch}`;
    const before = buildCopy(ctx, `before flow work get, on ${machine}/${branch}`);
    const hadWork = before.tree !== treeOf(git, head);
    if (hadWork) git(['update-ref', backupRef, before.copy]);

    const parent = git(['rev-parse', `${pick.copy}^`]);
    const patch = git(['diff', '--binary', parent, pick.copy], { binary: true });
    if (!patch.length) throw new FlowError(`${pick.ref} holds no changes.`);

    // --3way is the whole point. Plain apply is all-or-nothing and refuses the
    // moment one line moved; --3way merges instead, and writes the ordinary
    // <<<<<<< markers where it cannot decide. VS Code opens those as usual.
    const applied = git.try(['apply', '--3way'], { input: patch });
    const conflicted = lines(git(['diff', '--name-only', '--diff-filter=U']));

    if (!applied.ok && !conflicted.length) {
      out(`${pick.ref} would not apply:`);
      out(indent(applied.stderr));
      if (hadWork) out(`\nWhat was in the folder before this ran is stored at ${backupRef}.`);
      return 1;
    }

    const files = changedFiles(git, parent, pick.copy);
    out(`${plural(files.length, 'file')} replayed from ${pick.machine} onto ${branch}`);

    if (conflicted.length) {
      out(`\n${plural(conflicted.length, 'file')} came back with conflict markers:`);
      for (const f of conflicted) out(`  ${f}`);
      out('\nThe branch moved since the copy was made, and these lines changed on both sides.');
      out('Open one in VS Code for the usual conflict editor, then mark it settled:');
      out('  git add <file>');
    }

    // --3way stages everything it applies. What you left on the other machine
    // was mid-edit, so it belongs in the working tree and not the staging area,
    // and `git status` after a restore should read the way it did before you
    // sent. A conflict is the exception: unstaging there would throw away the
    // unmerged state that the conflict editor reads.
    if (!conflicted.length) {
      git(['reset', '--quiet']);
    } else {
      // `diff --cached` reports unmerged paths as well as staged ones, so the
      // conflicted files have to come back out or they get counted twice —
      // once as a conflict and again as a clean merge.
      const staged = lines(git(['diff', '--cached', '--name-only'])).filter((f) => !conflicted.includes(f));
      if (staged.length) {
        out(`\n${plural(staged.length, 'file')} merged cleanly and ${staged.length === 1 ? 'sits' : 'sit'} staged.`);
        out('Leave the staging area alone until every conflict is settled.');
      }
    }

    if (hadWork) out(`\nWhat was in the folder before this ran:  ${backupRef}`);
    out(`\nWhen you are done with the copy:  flow work drop ${pick.machine}`);
    return conflicted.length ? 1 : 0;
  },
};

/**
 * Which copy to replay. The other machine's is what you almost always want, so
 * that is the default and this machine's own is only used when it is the only
 * one — the case where the folder was re-cloned. More than one candidate refuses
 * and lists them rather than guessing.
 */
function chooseCopy(copies, { branch, machine, wanted }) {
  const here = copies.filter((c) => c.branch === branch);
  if (!here.length) {
    const elsewhere = copies.length ? `\n  Stored on other branches: ${[...new Set(copies.map((c) => c.branch))].join(', ')}` : '';
    throw new FlowError(`no stored copy for ${branch}.${elsewhere}`);
  }

  if (wanted) {
    const exact = here.filter((c) => c.machine === wanted);
    const hits = exact.length ? exact : here.filter((c) => c.machine.startsWith(wanted));
    if (!hits.length) throw new FlowError(`no copy from "${wanted}" on ${branch} — there is one from ${here.map((c) => c.machine).join(', ')}.`);
    if (hits.length > 1) throw new FlowError(`"${wanted}" matches ${hits.map((c) => c.machine).join(', ')} — name one in full.`);
    return hits[0];
  }

  const others = here.filter((c) => c.machine !== machine);
  const pool = others.length ? others : here;
  if (pool.length > 1) {
    throw new FlowError(
      `${pool.length} machines have a copy of ${branch} — name one:\n` +
      pool.map((c) => `  flow work get ${c.machine}   (${age(c.when)})`).join('\n')
    );
  }
  return { ...pool[0], ownLabel: !others.length };
}

actions.ls = {
  summary: 'every stored copy — machine, branch, age, file count',
  flags: { offline: { bool: true } },
  run({ flags }) {
    const ctx = context();
    const { git, branch, machine } = ctx;

    if (!flags.offline) {
      const warning = fetchCopies(git, remoteOf(git, branch));
      if (warning) out(`${warning}\n`);
    }

    const copies = readCopies(git);
    if (!copies.length) {
      out('no stored copies.');
      out(machine
        ? '  Make one:  flow work send'
        : '  Name this machine first:  git config --global flow.machine desktop');
      return 0;
    }

    copies.sort((a, b) => b.when - a.when);
    const rows = copies.map((c) => [
      c.machine === machine ? `${c.machine} (here)` : c.machine,
      c.branch === branch ? `${c.branch} *` : c.branch,
      age(c.when),
      countFiles(git, c.copy),
    ]);
    out(render.table(['machine', 'branch', 'age', 'holds'], rows));
    out(`\n${copies.length} stored ${copies.length === 1 ? 'copy' : 'copies'}. * is the branch you are on.`);

    if (!machine) out('\nThis machine has no name yet, so no row is marked as its own.\n  Name it:  git config --global flow.machine desktop');

    const backup = git.try(['rev-parse', '--verify', '--quiet', `${BACKUP_NS}/${branch}`]);
    if (backup.ok && String(backup.stdout).trim()) {
      out(`\nA restore on ${branch} saved what was here first, at ${BACKUP_NS}/${branch}.`);
    }
    return 0;
  },
};

actions.drop = {
  args: '[<machine>]',
  summary: 'delete a stored copy, here and on the remote',
  flags: { all: { bool: true } },
  run({ positional, flags }) {
    const ctx = context();
    const { git, branch } = ctx;
    const machine = requireMachine(ctx);

    const here = readCopies(git).filter((c) => c.branch === branch);
    if (!here.length) throw new FlowError(`no stored copy for ${branch}.`);

    let targets;
    if (flags.all) {
      targets = here;
    } else {
      const wanted = positional[0] || machine;
      targets = here.filter((c) => c.machine === wanted);
      if (!targets.length) targets = here.filter((c) => c.machine.startsWith(wanted));
      if (!targets.length) {
        throw new FlowError(
          `no copy from "${wanted}" on ${branch} — there is one from ${here.map((c) => c.machine).join(', ')}.\n` +
          '  Every one of them:  flow work drop --all'
        );
      }
      if (targets.length > 1) throw new FlowError(`"${wanted}" matches ${targets.map((c) => c.machine).join(', ')} — name one in full.`);
    }

    const remote = remoteOf(git, branch);
    for (const c of targets) {
      git(['update-ref', '-d', c.ref]);
      if (remote) {
        const pushed = git.try(['push', remote, '--delete', c.ref]);
        out(pushed.ok ? `dropped ${c.ref}` : `dropped ${c.ref} here; ${remote} still has it:\n${indent(pushed.stderr)}`);
      } else {
        out(`dropped ${c.ref}`);
      }
    }
    return 0;
  },
};

module.exports = { summary: 'uncommitted work, moved between machines', actions };
