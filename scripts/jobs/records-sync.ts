#!/usr/bin/env node
/**
 * records-sync.ts: saves and sends a project's tickets, and ~/.flow/, in the
 * background.
 *
 * A project's tickets live on its `flow` branch, checked out at `.flow/`, and
 * `features/tickets/records.ts` holds how. This script is who runs it when no command was
 * typed:
 *
 *   --project <root> --now   commit, pull, push that project. A status move
 *                            and the session start run it, detached
 *   --home --now             `flow sync`'s save for ~/.flow/, the same
 *                            checkpoint for the tickets that belong to no project
 *   --home --in <root> --now   the same, for a project whose `.flow/` links into
 *                            the Flow home, renumbering its clashes after
 *   --hook stop              the Stop hook, run with `async`, after every reply.
 *                            Sends only where something changed and the last
 *                            send was 30 minutes ago or more, so the user's own
 *                            edits leave the machine within half an hour
 *   --hook end               the SessionEnd hook. Claude Code gives it 1.5
 *                            seconds, so it starts a detached run and returns
 *
 * Offline, a run fails quietly and the next checkpoint tries again. Every
 * other failure goes to the failure log as an open issue, which the status
 * line counts, and the next run that works closes it: features/logs/failures.ts.
 */

import path from 'node:path';
import { spawn } from 'node:child_process';
import * as records from '../features/tickets/records.ts';
import * as repo from '../features/machine/flow-repo.ts';
import * as failures from '../features/logs/failures.ts';
import * as settings from '../shared/settings.ts';
import * as paths from '../shared/paths.ts';
import * as hook from '../shared/hook.ts';
import { git } from '../shared/git.ts';

const DUE_AFTER = 30 * 60 * 1000;

/** The Flow home's sync, as the failure log names the job. */
const HOME_JOB = 'sync ~/.flow';

/** When each place last sent, `~/.flow/records-sync.json`. It describes this machine alone, so it never travels. */
const stampFile = (at) => path.join(at.flow, 'records-sync.json');

function lastSent(at, key) {
  return Number(settings.read(stampFile(at))[key] || 0);
}

function markSent(at, key) {
  const stamps = settings.read(stampFile(at));
  stamps[key] = Date.now();
  settings.write(stampFile(at), stamps);
}

function syncProject(at, root) {
  const job = `sync ${root}`;
  const done = records.sync(root, 'saved');
  if (done.ok) {
    markSent(at, root);
    failures.cleared(at.flow, job);
  } else if (!done.offline) {
    failures.record(at.flow, { source: 'records', what: job, job, error: done.why || 'failed' });
  }
  return done;
}

/** `flow sync`'s own save. */
function syncHome(at, linked) {
  if (!repo.isRepo(at)) return;
  try {
    repo.syncHome(at, linked);
    markSent(at, 'home');
    failures.cleared(at.flow, HOME_JOB);
  } catch (e: any) {
    if (!/could not read from remote|unable to access|could not resolve/i.test(e.message)) {
      failures.record(at.flow, { source: 'records', what: HOME_JOB, job: HOME_JOB, error: e.message });
    }
  }
}

/** Something in `.flow/` not yet sent: uncommitted, or committed and not pushed. */
function waiting(root) {
  const dir = path.join(root, '.flow');
  if (git(dir, ['status', '--porcelain']).out) return true;
  if (!records.remoteHasBranch(dir)) return true;
  return Number(git(dir, ['rev-list', '--count', `${records.REMOTE}/${records.BRANCH}..HEAD`]).out || '0') > 0;
}

/** Start this script again, detached, so the caller returns at once. */
function later(args) {
  const child = spawn(process.execPath, [import.meta.filename, ...args], { detached: true, stdio: 'ignore' });
  child.unref();
}

try {
  const at = paths.folders();
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const value = (name) => args[args.indexOf(name) + 1];

  if (flag('--project')) {
    syncProject(at, path.resolve(value('--project')));
  } else if (flag('--home')) {
    syncHome(at, flag('--in') ? path.resolve(value('--in')) : null);
  } else if (flag('--hook')) {
    const event = hook.event() || {};
    const root = records.projectAt(event.cwd || process.cwd());
    const linked = records.linkedAt(event.cwd || process.cwd());
    if (value('--hook') === 'end') {
      if (root) later(['--project', root, '--now']);
      later(['--home', ...(linked ? ['--in', linked] : []), '--now']);
    } else if (value('--hook') === 'stop') {
      if (root && waiting(root) && Date.now() - lastSent(at, root) >= DUE_AFTER) syncProject(at, root);
      if (repo.changed(at) && Date.now() - lastSent(at, 'home') >= DUE_AFTER) syncHome(at, linked);
    }
  }
} catch {
  // A background save never breaks a session. The next checkpoint tries again.
}
