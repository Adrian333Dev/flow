/**
 * What a ticket records about the work done on it: the code branch its work
 * merges into, and `history.md`, one line per status move.
 *
 *   branch: feature/budgets                       in ticket.md, written once
 *
 *   2026-09-29 14:02  todo → building  a1b2c3d4-…  "Budget page"  feature/budgets
 *   2026-09-30 09:40  review → done     e5f6a7b8-…  "Budget tests"  feature/budgets
 *
 * Tickets live on the branch `flow`, apart from the code, so nothing else says
 * which code branch a ticket's work is on, or which sessions worked on it.
 * `history.md` sits in the ticket's folder rather than in commit messages, so
 * it travels with `flow tickets move` and exists where `.flow/` is a plain folder.
 *
 * The session is Claude Code's, read from `CLAUDE_CODE_SESSION_ID`, which
 * Claude Code sets for every command it runs. Its title is the last one in the
 * session's transcript: a `/rename` wins over the one Claude Code made up. A
 * command typed in a terminal outside a session writes `-` for both.
 *
 * Writing a line never fails the move it records.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as paths from '../../shared/paths.ts';
import * as store from './store.ts';
import { git } from '../../shared/git.ts';

/** The code branch checked out in `root`, or '' at home, outside git, or on a detached checkout. */
function currentBranch(root) {
  if (store.isHome(root)) return '';
  // `symbolic-ref` names a branch with no commit yet, and fails on a detached checkout.
  const ran = git(root, ['symbolic-ref', '--short', '-q', 'HEAD']);
  return ran.ok ? ran.out : '';
}

/**
 * The branch a project's work merges into by default: the remote's, else
 * `main` or `master` where one exists, else the one checked out.
 */
function defaultBranch(root) {
  const remote = git(root, ['symbolic-ref', '--short', '-q', 'refs/remotes/origin/HEAD']);
  if (remote.ok && remote.out) return remote.out.replace(/^origin\//, '');
  for (const name of ['main', 'master']) {
    if (git(root, ['show-ref', '--verify', '-q', `refs/heads/${name}`]).ok) return name;
  }
  return currentBranch(root);
}

/** The folder Claude Code keeps its transcripts in, one subfolder per project. */
const projectsDir = () => path.join(paths.claudeHome(), 'projects');

/** The session's title from its transcript, or '' where none is found. */
function sessionTitle(session) {
  if (!/^[\w-]+$/.test(session)) return '';
  let folders;
  try {
    folders = fs.readdirSync(projectsDir());
  } catch {
    return '';
  }
  for (const folder of folders) {
    const file = path.join(projectsDir(), folder, `${session}.jsonl`);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const last = (key) => {
      const all = [...text.matchAll(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`, 'g'))];
      return all.length ? JSON.parse(`"${all[all.length - 1][1]}"`) : '';
    };
    return last('customTitle') || last('aiTitle');
  }
  return '';
}

/** Add one line to the ticket's `history.md`. `move` is `todo → building`. */
function append(t, move) {
  try {
    const session = process.env.CLAUDE_CODE_SESSION_ID || '';
    const title = session ? sessionTitle(session) : '';
    const line = [
      store.now().slice(0, 16),
      move.padEnd(16),
      session || '-',
      title ? JSON.stringify(title) : '-',
      currentBranch(t.root) || '-',
    ].join('  ');
    store.appendHistory(t, line);
  } catch {
    // The move already happened; a missing history line never undoes it.
  }
}

/**
 * Write the ticket's `branch:` the first time work starts on it, only where
 * that branch is not the default one: an absent `branch:` means the default,
 * so the record holds only what differs. Returns true when the field changed,
 * so the caller writes the ticket.
 */
function claimBranch(t) {
  if (t.data.branch) return false;
  const branch = currentBranch(t.root);
  if (!branch || branch === defaultBranch(t.root)) return false;
  t.data.branch = branch;
  return true;
}

export { currentBranch, defaultBranch, sessionTitle, append, claimBranch };
