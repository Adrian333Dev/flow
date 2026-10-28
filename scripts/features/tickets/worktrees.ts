/**
 * Each ticket's code built in its own git worktree, on its own branch, so 2
 * sessions on 2 tickets never edit one checkout or run each other's tests.
 *
 *   .claude/worktrees/fw-317-ticket-worktrees/    folder and branch, one name
 *
 * `flow tickets start --activity build|debug` makes the worktree from the
 * ticket's `branch:` (the default branch where it has none) and writes the name
 * as `worktree:`. `flow tickets done` commits what the worktree holds, rebases
 * it onto `branch:`, fast-forwards that branch, and deletes the folder and the
 * ticket's branch. A drop deletes the folder and keeps the branch, so no code
 * is lost. A park leaves both.
 *
 * What a project needs beyond its tracked files is its own business: the
 * gitignored files `.worktreeinclude` names are copied, submodules checked
 * out, and the committed `.worktree/create` and `.worktree/remove` run where
 * present, for a database copy, a port, anything a list could not hold.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { FlowError } from '../../shared/error.ts';
import { git, DURABLE } from '../../shared/git.ts';
import * as store from './store.ts';
import * as statuses from './statuses.ts';
import { defaultBranch } from './ticket-history.ts';
import { link, placeOf, exclude } from './records-place.ts';
import type { Ticket } from './types.ts';

const FOLDER = path.join('.claude', 'worktrees');
const ACTIVITIES = new Set(['build', 'debug']);

const folderOf = (root: string, name: string) => path.join(root, FOLDER, name);

/** The branch the ticket merges into. */
const baseOf = (t: Ticket, root: string) => t.data.branch || defaultBranch(root);

/** Whether `root` is the top of a git repository that is not the Flow home. */
function isRepository(root: string) {
  if (store.isHome(root)) return false;
  const found = git(root, ['rev-parse', '--show-toplevel']);
  return found.ok && fs.realpathSync(found.out) === fs.realpathSync(root);
}

/** Whether a ticket moving into, or resuming, this activity is built in a worktree. */
const wanted = (t: Ticket, root: string, activity: string) =>
  t.data.status === 'in-progress' && ACTIVITIES.has(activity) && isRepository(root);

/** The folders `git worktree list` knows, each with the branch it has checked out. */
function listed(root: string) {
  const found: { folder: string; branch: string }[] = [];
  for (const block of git(root, ['worktree', 'list', '--porcelain']).out.split('\n\n')) {
    const folder = /^worktree (.+)$/m.exec(block)?.[1];
    if (folder) found.push({ folder, branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] || '' });
  }
  return found;
}

const hasBranch = (root: string, name: string) => git(root, ['show-ref', '--verify', '-q', `refs/heads/${name}`]).ok;

/** Run the project's `.worktree/<script>` in `folder`, where it exists. A failure throws what it printed. */
function runScript(folder: string, script: string) {
  const file = path.join(folder, '.worktree', script);
  if (!fs.existsSync(file)) return false;
  const ran = spawnSync(file, [], { cwd: folder, encoding: 'utf8' });
  if (ran.status !== 0) {
    const said = [ran.stdout, ran.stderr, ran.error?.message].filter(Boolean).join('\n').trim();
    throw new FlowError(`.worktree/${script} failed in ${folder}:\n${said}`);
  }
  return true;
}

/** The gitignored files of the main checkout that `.worktreeinclude` names, copied into `folder`. */
function copyIncluded(root: string, folder: string) {
  if (!fs.existsSync(path.join(root, '.worktreeinclude'))) return 0;
  const named = git(root, ['ls-files', '-o', '-i', '-z', '--exclude-from=.worktreeinclude']).raw.split('\0').filter(Boolean);
  if (!named.length) return 0;
  // Claude Code's rule for the same file: a tracked or a merely untracked file
  // is never copied, only one git ignores.
  const ignored = git(root, ['check-ignore', '-z', '--stdin'], { input: named.join('\0') }).raw.split('\0').filter(Boolean);
  for (const file of ignored) {
    fs.mkdirSync(path.dirname(path.join(folder, file)), { recursive: true });
    fs.cpSync(path.join(root, file), path.join(folder, file), { recursive: true, verbatimSymlinks: true });
  }
  return ignored.length;
}

/**
 * The branch a child's worktree starts from: its own `branch:`, else its
 * parent's worktree branch while that still exists, so the child builds on
 * the parent's unmerged work.
 */
function claimBase(t: Ticket, tickets: Ticket[], root: string) {
  if (t.data.branch) return;
  const parent = tickets.find((x) => x.id === t.data.parent);
  if (parent?.data.worktree && hasBranch(root, parent.data.worktree)) t.data.branch = parent.data.worktree;
}

/**
 * Make the ticket's worktree, or find the one it has. Returns the lines to
 * print, or null where the ticket is built in the main checkout. The ticket
 * is written as soon as its `worktree:` is known, so a project script failing
 * later leaves the worktree recorded and reused on the next start.
 */
function ensure(t: Ticket, tickets: Ticket[], root: string, activity: string) {
  if (!wanted(t, root, activity)) return null;
  const name = t.data.worktree || store.nameOf(t);
  const folder = folderOf(root, name);
  exclude(root, '/.claude/worktrees/', "each ticket's worktree", ['.claude/worktrees/', '/.claude/worktrees/']);
  git(root, ['worktree', 'prune']);
  if (listed(root).some((w) => path.resolve(w.folder) === path.resolve(folder))) return [`worktree: ${folder}`];

  claimBase(t, tickets, root);
  const base = baseOf(t, root);
  const args = hasBranch(root, name) ? [name] : ['-b', name, base];
  const added = git(root, ['worktree', 'add', '--quiet', folder, ...args]);
  if (!added.ok) throw new FlowError(`could not make the worktree for ${t.id}:\n${added.err}`);
  t.data.worktree = name;
  store.writeTicket(t);

  const place = placeOf(root);
  if (place && !fs.existsSync(path.join(folder, '.flow'))) link(folder, place.dir);
  const copied = copyIncluded(root, folder);
  if (fs.existsSync(path.join(folder, '.gitmodules'))) {
    const subs = git(folder, ['submodule', 'update', '--init', '--recursive']);
    if (!subs.ok) throw new FlowError(`could not check out the submodules in ${folder}:\n${subs.err}`);
  }
  const created = runScript(folder, 'create');

  const lines = [`worktree: ${folder}`, `      new branch ${name} from ${base}`];
  if (copied) lines.push(`      copied ${copied} file${copied === 1 ? '' : 's'} named in .worktreeinclude`);
  if (created) lines.push('      ran .worktree/create');
  if (git(root, ['status', '--porcelain']).out) {
    lines.push(`      the main checkout has uncommitted changes; the worktree starts from the last commit of ${base}, without them`);
  }
  return lines;
}

/** Commit whatever the worktree holds, as one commit named for the ticket. */
function commitAll(t: Ticket, folder: string) {
  git(folder, ['add', '-A']);
  if (git(folder, ['diff', '--cached', '--quiet']).ok) return false;
  const made = git(folder, [...DURABLE, 'commit', '--quiet', '--no-verify', '-m', store.nameOf(t)]);
  if (!made.ok) throw new FlowError(`could not commit the work in ${folder}:\n${made.err || made.out}`);
  return true;
}

/** Take the folder away, after the project's `.worktree/remove`. */
function removeFolder(root: string, folder: string) {
  runScript(folder, 'remove');
  const removed = git(root, ['worktree', 'remove', '--force', folder]);
  if (!removed.ok) throw new FlowError(`could not remove the worktree ${folder}:\n${removed.err}`);
}

/** Move `base` up to `name`, in the checkout that has it out, else as a ref alone. */
function fastForward(root: string, base: string, name: string) {
  const out = listed(root).find((w) => w.branch === base);
  if (out) {
    const merged = git(out.folder, [...DURABLE, 'merge', '--ff-only', '--quiet', name]);
    // Another ticket merging first moves `base` on: the next run rebases again.
    if (!merged.ok) throw new FlowError(`could not move ${base} up to ${name} in ${out.folder}:\n${merged.err}\n  Clear what git names, then run done again.`);
    return;
  }
  const old = git(root, ['rev-parse', `refs/heads/${base}`]).out;
  const now = git(root, ['rev-parse', `refs/heads/${name}`]).out;
  if (!git(root, ['merge-base', '--is-ancestor', old, now]).ok) throw new FlowError(`${base} moved while ${name} was rebased; run done again.`);
  git(root, ['update-ref', `refs/heads/${base}`, now, old]);
}

/**
 * Close the worktree of a ticket reaching `done` or `dropped`, before the
 * status moves, so a conflict stops the move. Returns the lines to print, or
 * null where the ticket has no worktree on disk.
 */
function finish(t: Ticket, root: string, status: string) {
  const name = t.data.worktree;
  if (!name || !statuses.TERMINAL.has(status)) return null;
  const folder = folderOf(root, name);
  if (!fs.existsSync(folder)) return null;

  if (status !== 'done') {
    const committed = commitAll(t, folder);
    removeFolder(root, folder);
    return [`worktree: removed ${FOLDER}/${name}; the branch ${name} keeps its work${committed ? ', committed' : ''}`];
  }

  for (const step of ['rebase-merge', 'rebase-apply']) {
    if (fs.existsSync(git(folder, ['rev-parse', '--path-format=absolute', '--git-path', step]).out)) {
      throw new FlowError(`a rebase is still under way in ${folder}. Finish it there with git rebase --continue, then run done again.`);
    }
  }
  commitAll(t, folder);
  const base = baseOf(t, root);
  const rebased = git(folder, [...DURABLE, 'rebase', '--quiet', base]);
  if (!rebased.ok) {
    const files = git(folder, ['diff', '--name-only', '--diff-filter=U']).out;
    if (!files) throw new FlowError(`could not rebase ${name} onto ${base}:\n${rebased.err}`);
    throw new FlowError(
      `${name} conflicts with ${base} in:\n${files.split('\n').map((f) => `  ${f}`).join('\n')}\n` +
      `  Fix them in ${folder}, then git add them and git rebase --continue, then run done again.`
    );
  }
  fastForward(root, base, name);
  removeFolder(root, folder);
  git(root, ['branch', '-d', '--quiet', name]);
  return [`worktree: merged ${name} into ${base}, removed ${FOLDER}/${name}`];
}

/** The folders under `.claude/worktrees/` named for a ticket that is closed or gone. */
function orphans(root: string, tickets: Ticket[], prefix: string) {
  const dir = path.join(root, FOLDER);
  if (!fs.existsSync(dir)) return [];
  const ticketName = new RegExp(`^${prefix}-(\\d+)(?:-|$)`);
  const found: { name: string; why: string }[] = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const number = ticketName.exec(name)?.[1];
    if (!number) continue;
    const t = tickets.find((x) => x.data.worktree === name) || tickets.find((x) => x.id === `${prefix}-${number}`);
    if (!t) found.push({ name, why: 'its ticket is gone' });
    else if (statuses.TERMINAL.has(t.data.status)) found.push({ name, why: `${t.id} is ${t.data.status}` });
  }
  return found;
}

export { FOLDER, folderOf, ensure, finish, orphans };
