/**
 * The setup session: the one Claude Code session that finishes a machine's
 * setup, because two jobs need judgment a script cannot make. The old
 * `~/.claude/CLAUDE.md` holds rules Flow's own may already cover, and
 * `~/.claude/settings.json` holds keys that may conflict with Flow's. Code
 * never edits either file. `sessions/setup.md` is what the session follows.
 *
 * The session is owed, then done. `~/.flow/logs/setup-pending` is the marker:
 * `flow install` writes it when `~/.claude/CLAUDE.md` was not yet Flow's
 * link, `flow update` writes it on every run, and the session deletes it as
 * its last step. `flow install` opens the session while the marker stands.
 * Owing one copies `settings.json` into `~/.flow/logs/before/`, and a real
 * `CLAUDE.md` moves there, so a bad edit can be undone.
 *
 * The session runs in safe mode: the machine's own rules, plugins and hooks
 * stay unloaded, and Flow's rule file would hold the session to its
 * propose-then-approve turn. Its permissions come in through `--settings`
 * for that session alone.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { out } from '../../shared/cli.ts';
import * as confirm from './confirm.ts';
import * as logs from '../logs/logs.ts';
import { link } from './links.ts';
import * as paths from '../../shared/paths.ts';

const show = paths.shorten;

const pendingFile = (at) => path.join(logs.dir(at.flow), 'setup-pending');
const beforeDir = (at) => path.join(logs.dir(at.flow), 'before');

/** True while a session is owed. */
const isPending = (at) => fs.existsSync(pendingFile(at));

/**
 * Owe a session. Copies `settings.json` into `before/` and writes the marker.
 * Does nothing where one is owed already, so `before/` keeps the files as they
 * were ahead of the first attempt.
 */
function markPending(at) {
  if (isPending(at)) return;
  fs.mkdirSync(beforeDir(at), { recursive: true });
  const settings = path.join(at.claude, 'settings.json');
  if (fs.existsSync(settings)) fs.copyFileSync(settings, path.join(beforeDir(at), 'settings.json'));
  fs.writeFileSync(pendingFile(at), `${new Date().toISOString()}\n`);
}

/**
 * Make `~/.claude/CLAUDE.md` a link to `~/.flow/CLAUDE.md`. Anything else
 * there owes a session: a real file moves into `before/` for the session to
 * harvest, and a missing or wrong link is replaced. Returns the report lines.
 */
function linkRules(at) {
  const rules = path.join(at.flow, 'CLAUDE.md');
  const to = path.join(at.claude, 'CLAUDE.md');
  if (!fs.existsSync(rules)) return [`could not link ${show(to)}: ${show(rules)} does not exist. Run flow install again.`];

  let found: fs.Stats | null = null;
  try {
    found = fs.lstatSync(to);
  } catch {
    // Nothing there yet.
  }
  if (found && found.isSymbolicLink() && fs.readlinkSync(to) === rules) return [];

  markPending(at);
  const lines: string[] = [];
  if (found && !found.isSymbolicLink()) {
    const saved = path.join(beforeDir(at), 'CLAUDE.md');
    fs.mkdirSync(beforeDir(at), { recursive: true });
    fs.copyFileSync(to, saved);
    fs.unlinkSync(to);
    lines.push(`moved: ${show(to)} to ${show(saved)}`);
  }
  link(rules, to);
  lines.push(`linked: ${show(to)}`);
  return lines;
}

/** The session's permissions: Flow's own lists, with auto mode off, for that session alone. */
function sessionSettings(clone) {
  const flow = JSON.parse(fs.readFileSync(path.join(clone, 'home', 'settings.json'), 'utf8'));
  const { allow, ask, deny } = flow.permissions;
  return { permissions: { allow, ask, deny }, disableAutoMode: 'disable' };
}

/** One word of a shell line, quoted only where it needs it. */
const quote = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/**
 * Open the session while one is owed, or print the line that opens it.
 *
 * It opens only where somebody watches a terminal and the machine is the real
 * one. `printOnly` is a test or a `--root`. Returns `none`, `ran`, `printed` or
 * `failed`, and prints a line where the session ended with its marker standing.
 */
function open(at, clone, { printOnly }) {
  if (!isPending(at)) return 'none';

  const file = path.join(at.flow, 'setup-prompt.md');
  fs.copyFileSync(path.join(clone, 'scripts', 'sessions', 'setup.md'), file);
  const settings = path.join(at.flow, 'setup-settings.json');
  fs.writeFileSync(settings, JSON.stringify(sessionSettings(clone), null, 2) + '\n');
  const args = [
    '--safe-mode',
    '--permission-mode', 'acceptEdits',
    '--add-dir', at.flow,
    '--settings', settings,
    '--append-system-prompt-file', file,
    'Finish setting up this machine.',
  ];

  // From the home folder, so reading ~/.claude asks nothing.
  const line = `cd ${quote(at.base)} && ${['claude', ...args].map(quote).join(' ')}`;
  if (printOnly || !process.stdout.isTTY || !confirm.hasTerminal()) {
    out(`One step left: finishing the setup of this machine. Start it from a terminal:\n\n  ${line}`);
    return 'printed';
  }
  out('\nOne step left: Claude Code opens now to sort your old rules against the ones Flow ships and fix settings.json.\n');
  // stdin from the terminal rather than inherited: under `curl | bash` it is
  // the pipe the script came down.
  const tty = fs.openSync('/dev/tty', 'r');
  const ran = spawnSync('claude', args, { cwd: at.base, stdio: [tty, 'inherit', 'inherit'] });
  fs.closeSync(tty);
  if (ran.error) {
    out(`Could not start claude: ${ran.error.message}. Start it yourself:\n\n  ${line}`);
    return 'failed';
  }
  if (isPending(at)) out('The setup session ended before it finished. Run flow install to open it again.');
  return 'ran';
}

export { pendingFile, beforeDir, isPending, markPending, linkRules, open };
