'use strict';
/**
 * What the SessionStart hook does: make the ticket skills match the tickets,
 * start the background sync, and suggest `flow init` where a repository has no
 * `.flow/`. `hooks/session-check.js` is the wiring.
 *
 * It waits for nothing. `flow doctor` stays the full check, since it runs both
 * test suites and takes seconds.
 *
 * It makes the ticket skills match the tickets, which a ticket edited by hand
 * or pulled from another machine needs: `tickets/ticket-skills.js`. When that
 * changed a skill it asks Claude Code to scan the skill folders again
 * (`reloadSkills`), so the first prompt already sees the change.
 *
 * It starts one job, detached. In a project linked into the Flow home,
 * `jobs/records-sync.js` syncs the Flow home. Starting a process is not
 * waiting for one: the hook returns before it has reached the network.
 *
 * In a git repository with no `.flow/` it also suggests `flow init`, to the
 * user alone. `setupReminder()` holds the rules.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const records = require('./tickets/records');
const ticketSkills = require('./tickets/ticket-skills');
const settings = require('./settings');
const paths = require('./paths');
const project = require('./project');
const git = require('./git');

/** A path with its links followed, or the path itself where it does not exist. */
function real(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** Whether `cwd` sits in a folder `"setupReminderSkip"` lists, or below one. */
function skipped(at, cwd) {
  const here = real(cwd);
  return [].concat(settings.readGlobal().setupReminderSkip || [])
    .filter((entry) => typeof entry === 'string')
    .map((entry) => real(entry.replace(/^~(?=\/|$)/, at.base)))
    .some((dir) => here === dir || here.startsWith(dir + path.sep));
}

/**
 * The line suggesting `flow init`, or null.
 *
 * It needs a git repository, since not every folder is a project and a folder
 * git does not track rarely becomes one. The home folder and `~/.flow/` are
 * repositories that are never projects. `"setupReminder": false` turns the
 * line off, and `"setupReminderSkip"` lists folders it never shows in, each
 * with everything below it. `flow settings` writes both.
 *
 * It goes out as `systemMessage`, which Claude Code shows the user, because
 * the agent has nothing to do about it.
 */
function setupReminder(at, cwd) {
  if (!settings.prints('setupReminder') || skipped(at, cwd)) return null;
  if (project.around(cwd, at)) return null;

  const top = git.top(cwd);
  if (!top) return null;
  const repo = real(top);
  if (repo === real(at.base) || repo === real(at.flow)) return null;
  return 'Flow: not set up here. Run flow init to set it up on this computer, or flow settings off setupReminder to stop this.';
}

/**
 * Bring the project's tickets up to date, and send what this machine left
 * unsent, without waiting: `records-sync.js` runs it detached. Where `.flow/`
 * links into the Flow home it syncs the Flow home. A folder without that link
 * starts nothing.
 */
function startRecordsPull(at, cwd) {
  const root = project.around(cwd, at);
  if (!root || !records.linkedAt(root)) return;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'jobs', 'records-sync.js'), '--home', '--in', root, '--now'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

/**
 * What the session opens with: `reminder` for the user alone, and `reload`
 * where a skill changed. `"sessionCheck": false` in ~/.flow/settings.json
 * silences the reminder, and never the ticket skills.
 */
function check(at, cwd) {
  let reminder = null;
  if (settings.prints('sessionCheck')) reminder = setupReminder(at, cwd);

  let reload = false;
  try {
    reload = ticketSkills.sync({ project: project.around(cwd, at), claude: paths.claudeHome() });
  } catch {
    // A ticket skill that cannot be written never stops a session.
  }
  return { reminder, reload };
}

/** Start the background job, where one is due. */
function startJobs(at, cwd) {
  startRecordsPull(at, cwd);
}

module.exports = { check, startJobs };
