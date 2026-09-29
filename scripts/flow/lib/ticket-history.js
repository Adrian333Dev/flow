'use strict';
/**
 * What a ticket records about the work done on it: the code branch it is
 * built on, and `history.md`, one line per status move or handoff.
 *
 *   branch: feature/budgets                       in ticket.md, written once
 *
 *   2026-09-29 14:02  todo → building  a1b2c3d4-…  "Budget page"  feature/budgets
 *   2026-09-30 09:40  handoff          e5f6a7b8-…  "Budget tests"  feature/budgets
 *
 * Tickets live on the branch `flow`, apart from the code, so nothing else says
 * which code branch a ticket's work is on, or which sessions worked on it.
 * `history.md` sits in the ticket's folder rather than in commit messages, so
 * it travels with `flow move` and exists where `.flow/` is a plain folder.
 *
 * The session is Claude Code's, read from `CLAUDE_CODE_SESSION_ID`, which
 * Claude Code sets for every command it runs. Its title is the last one in the
 * session's transcript: a `/rename` wins over the one Claude Code made up. A
 * command typed in a terminal outside a session writes `-` for both.
 *
 * Writing a line never fails the move it records.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const store = require('./store');

const FILE = 'history.md';

/** The code branch checked out in `root`, or '' at home, outside git, or on a detached checkout. */
function currentBranch(root) {
  if (store.isHome(root)) return '';
  // `symbolic-ref` names a branch with no commit yet, and fails on a detached checkout.
  const ran = spawnSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return ran.status === 0 ? ran.stdout.trim() : '';
}

/** The folder Claude Code keeps its transcripts in, one subfolder per project. */
const projectsDir = () => path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');

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

/** Add one line to the ticket's `history.md`. `move` is `todo → building` or `handoff`. */
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
    fs.appendFileSync(path.join(t.dir, FILE), `${line}\n`);
  } catch {
    // The move already happened; a missing history line never undoes it.
  }
}

/**
 * Write the ticket's `branch:` the first time work starts on it. Returns true
 * when the field changed, so the caller writes the ticket.
 */
function claimBranch(t) {
  if (t.data.branch) return false;
  const branch = currentBranch(t.root);
  if (!branch) return false;
  t.data.branch = branch;
  return true;
}

module.exports = { FILE, currentBranch, sessionTitle, append, claimBranch };
