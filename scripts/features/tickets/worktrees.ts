/**
 * A ticket's worktree, found and never made. The agent makes one on the user's
 * word, with `EnterWorktree` or `git worktree add`, in a folder named for the
 * ticket (`fw-342-worktree-on-demand`), and merges it on the user's word with
 * `util git save -w` or plain git: `guides/worktrees.md`.
 *
 * Flow's part is the guard. `flow tickets done` and a drop refuse while the
 * ticket's worktree holds uncommitted or unmerged work, so nothing the user has
 * not seen is closed over. `flow doctor` lists worktrees whose ticket closed.
 * Nothing here commits, merges or removes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { FlowError } from '../../shared/error.ts';
import { git } from '../../shared/git.ts';
import * as statuses from './statuses.ts';
import { defaultBranch } from './ticket-history.ts';
import type { Ticket } from './types.ts';

/** The folders `git worktree list` knows, each with the branch it has checked out. */
function listed(root: string) {
  const found: { folder: string; branch: string }[] = [];
  for (const block of git(root, ['worktree', 'list', '--porcelain']).out.split('\n\n')) {
    const folder = /^worktree (.+)$/m.exec(block)?.[1];
    if (folder) found.push({ folder, branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] || '' });
  }
  return found;
}

/** The ticket's worktree: the folder `git worktree list` knows, named for the ticket's id. */
function find(t: Ticket, root: string) {
  const named = new RegExp(`^${t.id}(?:-|$)`);
  const main = path.resolve(root);
  return listed(root).find((w) => path.resolve(w.folder) !== main && named.test(path.basename(w.folder))) || null;
}

/** What the ticket's worktree holds that no branch has yet, one phrase each. Empty where it holds nothing or there is none. */
function unfinished(t: Ticket, root: string) {
  const found = find(t, root);
  if (!found || !fs.existsSync(found.folder)) return [];
  const held: string[] = [];
  const dirty = git(found.folder, ['status', '--porcelain']).out;
  if (dirty) held.push(`${dirty.split('\n').length} uncommitted file${dirty.includes('\n') ? 's' : ''}`);
  // A ticket started from inside its worktree records that worktree's branch as its `branch:`.
  const base = t.data.branch && t.data.branch !== found.branch ? t.data.branch : defaultBranch(root);
  const ahead = git(found.folder, ['rev-list', '--count', `${base}..HEAD`]);
  if (!ahead.ok) held.push(`commits that could not be compared with ${base}`);
  else if (ahead.out !== '0') held.push(`${ahead.out} commit${ahead.out === '1' ? '' : 's'} not in ${base}`);
  return held;
}

/**
 * Refuse a ticket reaching `done` or `dropped` while its worktree holds
 * uncommitted or unmerged work. A park leaves the worktree as it is.
 */
function refuseWhileUnfinished(t: Ticket, root: string, status: string) {
  if (!statuses.TERMINAL.has(status)) return;
  const held = unfinished(t, root);
  if (!held.length) return;
  const folder = find(t, root)!.folder;
  throw new FlowError(
    `${t.id}'s worktree ${folder} holds ${held.join(' and ')}.\n` +
    `  The user merges it with util git save -w (~/.flow/guides/worktrees.md), or throws it away, then run ${status === 'done' ? 'done' : 'drop'} again.`
  );
}

/** The worktrees named for a ticket that is closed or gone. */
function leftover(root: string, tickets: Ticket[], prefix: string) {
  const ticketName = new RegExp(`^${prefix}-(\\d+)(?:-|$)`);
  const main = path.resolve(root);
  const found: { folder: string; why: string }[] = [];
  for (const { folder } of listed(root)) {
    const number = ticketName.exec(path.basename(folder))?.[1];
    if (!number || path.resolve(folder) === main) continue;
    const t = tickets.find((x) => x.id === `${prefix}-${number}`);
    if (!t) found.push({ folder, why: 'its ticket is gone' });
    else if (statuses.TERMINAL.has(t.data.status)) found.push({ folder, why: `${t.id} is ${t.data.status}` });
  }
  return found;
}

export { find, unfinished, refuseWhileUnfinished, leftover };
