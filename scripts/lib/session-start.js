'use strict';
/**
 * What the SessionStart hook does: one line at the top of a session when this
 * machine or this project needs attention, and nothing at all when neither
 * does. `hooks/session-check.js` is the wiring.
 *
 * It reads 4 files and waits for nothing: ~/.flow/run.json, ~/.flow/version,
 * the project's .flow/version, and ~/.flow/skills-update.json, which is the
 * skill repositories' own news. It also reads the other machines' records
 * from the Flow home's last fetch, which git holds on disk. `flow doctor`
 * stays the full check, since it runs both test suites and takes seconds.
 *
 * It makes every skill link match the settings, the step every `flow skills`
 * command runs, so a switch made on another machine or pulled with a project
 * applies here. It makes the ticket skills match the tickets too, which a
 * ticket edited by hand or pulled from another machine needs:
 * `tickets/ticket-skills.js`. When either changed a skill it asks Claude Code
 * to scan the skill folders again (`reloadSkills`), so the first prompt
 * already sees the change.
 *
 * It starts 2 jobs, both detached. `jobs/skills-pull.js` brings every skill
 * repository up to date in the background, and fetches the Flow home's
 * repository so a machine another one moved ahead of says so. In a project on
 * a `flow` branch, `jobs/records-sync.js` pulls the tickets and sends what
 * this machine left unsent, and in a project linked into the Flow home it
 * syncs the Flow home. Starting a process is not waiting for one: the hook
 * returns before either has reached the network, and what the skills pull
 * finds is printed by the session after it.
 *
 * In a git repository with no `.flow/` it also suggests `flow init`, to the
 * user alone, and in a project set up elsewhere whose old Claude Code memory
 * sits on this machine. `setupReminder()` holds the rules.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const flowRepo = require('./machine/flow-repo');
const migrations = require('./machine/migrations');
const version = require('./machine/version');
const records = require('./tickets/records');
const ticketSkills = require('./tickets/ticket-skills');
const links = require('./skills/skill-links');
const update = require('./skills/skills-update');
const settings = require('./settings');
const paths = require('./paths');
const setup = require('./setup');
const project = require('./project');
const git = require('./git');

/**
 * The run that never finished, which is the only version line printed.
 *
 * Every other one reads a version stamp that the stopped run was in the middle
 * of moving, so finishing the run is the only thing worth saying about Flow's
 * own version. The skill repositories' lines are a separate record and still print.
 */
function stoppedRun(at) {
  const found = setup.inspectRun(at);
  if (!found) return null;
  if (found.error) return `${setup.runFile(at)} does not parse, and a run wrote it. Run flow doctor.`;

  const step = found.step ? `after step ${found.step}` : 'before its first step';
  return `a ${found.type || 'Flow'} run stopped ${step}. ` +
    `To carry on, ${migrations.resume(found)} in a terminal. flow doctor names the way back.`;
}

/** What needs attention, one line each, empty where nothing does. */
function attention(at, cwd) {
  const stopped = stoppedRun(at);
  if (stopped) return [stopped];

  const out = [];
  const newest = version.newest(paths.cloneRoot());
  const mine = version.applied(path.join(at.flow, 'version'));
  // Another machine's record, from the last fetch: no network here.
  const other = mine.state === 'ok' ? flowRepo.ahead(at, mine.number) : null;

  if (mine.state === 'missing') {
    out.push('flow install never finished on this machine. Run flow install.');
  } else if (mine.state === 'unreadable') {
    out.push(`~/.flow/version holds "${mine.text}" in place of a changelog entry number. Run flow doctor.`);
  } else if (newest !== null && mine.number > newest) {
    out.push(`this machine is at entry ${mine.number} and the changelog stops at ${newest}. Run flow doctor.`);
  } else if (other) {
    out.push(`${other.name} is on changelog entry ${other.number}, and this machine is on ${mine.number}. Run flow update in a terminal.`);
  } else if (newest !== null && mine.number < newest) {
    out.push(`this machine is at changelog entry ${mine.number}, and ${newest} is the newest. Run flow update in a terminal.`);
  }

  const root = project.around(cwd, at);
  if (!root) return out;

  const name = path.basename(root);
  const theirs = version.applied(path.join(root, '.flow', 'version'));
  if (theirs.state === 'missing') {
    out.push(`flow init never finished in ${name}. Run flow init.`);
  } else if (theirs.state === 'unreadable') {
    out.push(`${name}/.flow/version holds "${theirs.text}" in place of a changelog entry number. Run flow doctor.`);
  } else if (mine.state === 'ok' && theirs.number < mine.number) {
    out.push(`${name} is at changelog entry ${theirs.number}, and this machine is at ${mine.number}. Run flow update in a terminal, inside it.`);
  } else if (mine.state === 'ok' && theirs.number > mine.number) {
    out.push(`${name} is at entry ${theirs.number} and this machine is at ${mine.number}. Run flow doctor.`);
  }
  return out;
}

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
 * In a project already set up, the same command folds in the Claude Code
 * memory this machine kept for it from before Flow, which a project set up on
 * another machine never had read. That line is the second case here.
 *
 * It goes out as `systemMessage`, which Claude Code shows the user, because
 * the agent has nothing to do about it.
 */
function setupReminder(at, cwd) {
  if (!settings.prints('setupReminder') || skipped(at, cwd)) return null;
  const root = project.around(cwd, at);
  if (root) {
    if (version.applied(path.join(root, '.flow', 'version')).state !== 'ok') return null;
    const memory = path.join(paths.claudeHome(), 'projects', root.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
    let held = [];
    try {
      held = fs.readdirSync(memory);
    } catch {
      // No memory for this project on this machine.
    }
    return held.length ? 'Flow: old Claude Code memory here. Run flow init to fold it in.' : null;
  }

  const top = git.top(cwd);
  if (!top) return null;
  const repo = real(top);
  if (repo === real(at.base) || repo === real(at.flow)) return null;
  return 'Flow: not set up here. Run flow init to set it up on this computer, or flow settings off setupReminder to stop this.';
}

/**
 * Make every skill link match the settings. Returns whether a link changed,
 * which is when the skill folders need scanning again.
 */
function relink(at, cwd) {
  const done = links.apply({ home: at.flow, root: project.around(cwd, at), claude: paths.claudeHome(), agents: at.agents });
  return done.changed.length > 0;
}

/**
 * Send every skill repository to look for new work, without waiting for it.
 *
 * Detached with no output anywhere, so the session is never held by a network
 * call and never sees what the pull printed. `skills-update.js` decides
 * whether there is anything to do at all.
 *
 * `"sessionCheck": false` silences the lines above and not this: the skills
 * are what an agent reads in a project, so a quiet machine still wants them
 * current. `"skillsAutoUpdate": false` is the key that stops the pull.
 */
function startPull(at) {
  if (!update.due(at) && !flowRepo.fetchDue(at)) return;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'jobs', 'skills-pull.js')], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

/**
 * Bring the project's tickets up to date, and send what this machine left
 * unsent, without waiting: `records-sync.js` runs it detached. On the
 * project's `flow` branch it pulls and pushes the branch. Where `.flow/` links
 * into the Flow home it syncs the Flow home. A folder with neither starts
 * nothing.
 */
function startRecordsPull(at, cwd) {
  const root = project.around(cwd, at);
  if (!root) return;
  let args = null;
  if (records.onBranch(root)) args = ['--project', root, '--now'];
  else if (records.linkedAt(root)) args = ['--home', '--in', root, '--now'];
  if (!args) return;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'jobs', 'records-sync.js'), ...args], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

/**
 * What the session opens with: `lines` for the agent, `reminder` for the user
 * alone, and `reload` where a skill changed. `"sessionCheck": false` in
 * ~/.flow/settings.json silences the first 2, and never the links.
 */
function check(at, cwd) {
  const lines = [];
  let reminder = null;
  if (settings.prints('sessionCheck')) {
    reminder = setupReminder(at, cwd);
    lines.push(...attention(at, cwd));
    // The repositories' news is a record of its own: a skill being behind is
    // a pull, where Flow being behind is a migration.
    lines.push(...update.lines(update.readNote(at)));
  }

  let reload = false;
  try {
    reload = relink(at, cwd);
  } catch {
    // A link that cannot be made is flow doctor's to report, never a session's.
  }
  try {
    if (ticketSkills.sync({ project: project.around(cwd, at), claude: paths.claudeHome() })) reload = true;
  } catch {
    // The same: a ticket skill that cannot be written never stops a session.
  }
  return { lines: lines.map((line) => `Flow: ${line}`), reminder, reload };
}

/** Start the 2 background jobs, where either is due. */
function startJobs(at, cwd) {
  startPull(at);
  startRecordsPull(at, cwd);
}

module.exports = { check, startJobs };
