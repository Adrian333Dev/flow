#!/usr/bin/env node
'use strict';
/**
 * records-sync.js: saves and sends a project's tickets, and ~/.flow/, in the
 * background.
 *
 * A project's tickets live on its `flow` branch, checked out at `.flow/`, and
 * `lib/records.js` holds how. This script is who runs it when no command was
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
 * other failure goes to the failure log, never to the session.
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const machine = require('./flow/lib/machine');
const records = require('./flow/lib/records');
const repo = require('./flow/lib/flow-repo');
const failures = require('./flow/lib/failures');
const settings = require('./flow/lib/settings');
const version = require('./flow/lib/version');

const DUE_AFTER = 30 * 60 * 1000;

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
  const done = records.sync(root, 'saved');
  if (done.ok) markSent(at, root);
  else if (!done.offline) failures.record(at.flow, { source: 'records', what: `sync ${root}`, error: done.why || 'failed' });
  return done;
}

/** `flow sync`'s own save. A machine another one moved ahead of waits for `flow update`, as `flow sync` does. */
function syncHome(at, linked) {
  if (!repo.isRepo(at)) return;
  const mine = version.applied(path.join(at.flow, 'version'));
  try {
    const { theirs } = repo.sync(at, mine.state === 'ok' ? mine.number : 0);
    records.renumber(at.flow, theirs || 'origin/main');
    if (linked) records.renumber(linked, theirs || 'origin/main');
    markSent(at, 'home');
  } catch (e) {
    if (!/could not read from remote|unable to access|could not resolve/i.test(e.message)) {
      failures.record(at.flow, { source: 'records', what: 'sync ~/.flow', error: e.message });
    }
  }
}

/** Something in `.flow/` not yet sent: uncommitted, or committed and not pushed. */
function waiting(root) {
  const dir = path.join(root, '.flow');
  const git = (args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  if ((git(['status', '--porcelain']).stdout || '').trim()) return true;
  if (!records.remoteHasBranch(dir)) return true;
  return Number((git(['rev-list', '--count', `${records.REMOTE}/${records.BRANCH}..HEAD`]).stdout || '0').trim()) > 0;
}

/** Start this script again, detached, so the caller returns at once. */
function later(args) {
  const child = spawn(process.execPath, [__filename, ...args], { detached: true, stdio: 'ignore' });
  child.unref();
}

function readHook() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

try {
  const at = machine.folders();
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const value = (name) => args[args.indexOf(name) + 1];

  if (flag('--project')) {
    syncProject(at, path.resolve(value('--project')));
  } else if (flag('--home')) {
    syncHome(at, flag('--in') ? path.resolve(value('--in')) : null);
  } else if (flag('--hook')) {
    const event = readHook();
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
