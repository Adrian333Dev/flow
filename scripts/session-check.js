#!/usr/bin/env node
'use strict';
/**
 * session-check.js: the SessionStart hook.
 *
 * One line at the top of a session when this machine or this project needs
 * attention, and nothing at all when neither does. Claude Code adds what a
 * SessionStart hook prints into the session's context, so the line reaches the
 * agent and the user at the same moment.
 *
 * It reads 4 files and waits for nothing: ~/.flow/run.json, ~/.flow/version,
 * the project's .flow/version, and ~/.flow/skills-update.json, which is the
 * skill repositories' own news. It also reads the other machines' records
 * from the Flow home's last fetch, which git holds on disk. `flow doctor` stays the full check, since it
 * runs both test suites and takes seconds.
 *
 * It makes every skill link match the settings, the step every `flow skills`
 * command runs, so a switch made on another machine or pulled with a project
 * applies here. When that changed a link it asks Claude Code to scan the skill
 * folders again (`reloadSkills`), so the first prompt already sees the change.
 *
 * It starts 2 things, both detached. scripts/skills-pull.js brings every skill
 * repository up to date in the background, and fetches the Flow home's
 * repository so a machine another one moved ahead of says so. In a project on
 * a `flow` branch, scripts/records-sync.js pulls the tickets and sends what
 * this machine left unsent. Starting a process is not waiting for one: the
 * hook returns before either has reached the network, and what the skills
 * pull finds is printed by the session after it.
 *
 * In a git repository with no `.flow/` it also suggests `flow init`,
 * to the user alone, and in a project set up elsewhere whose old Claude Code
 * memory sits on this machine. `setupReminder()` holds the rules.
 *
 * `"sessionCheck": false` in ~/.flow/settings.json silences it. Exit 2 on this
 * event prints a notice the session ignores, so a failure here is silence.
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { cloneRoot } = require('./flow/lib/clone');
const flowRepo = require('./flow/lib/flow-repo');
const machine = require('./flow/lib/machine');
const migrations = require('./flow/lib/migrations');
const records = require('./flow/lib/records');
const settings = require('./flow/lib/settings');
const links = require('./flow/lib/skill-links');
const skills = require('./flow/lib/skills');
const update = require('./flow/lib/skills-update');
const version = require('./flow/lib/version');

/**
 * The nearest folder at or above `from` holding a `.flow/`, or null.
 *
 * `lib/root.js` asks git for the project root and refuses outside one. A hook
 * fires wherever the user opened the session, so a walk up the tree is the
 * whole of it here: no git, no refusal, and a folder with no `.flow/` above it
 * is simply not a project.
 *
 * The home folder is never one. Its `.flow/` is the machine's, so a session
 * opened anywhere under it would otherwise count the home folder as the
 * project, read the global settings as the project's, and take down every
 * skill link they had just made.
 */
function projectRoot(from, at) {
  let dir = path.resolve(from);
  for (;;) {
    const flow = path.join(dir, '.flow');
    if (dir !== at.base && flow !== at.flow && fs.existsSync(flow)) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/**
 * The run that never finished, which is the only version line printed.
 *
 * Every other one reads a version stamp that the stopped run was in the middle
 * of moving, so finishing the run is the only thing worth saying about Flow's
 * own version. The skill repositories' lines are a separate record and still print.
 */
function stoppedRun(at) {
  const found = migrations.run(at);
  if (!found) return null;
  if (found.error) return `${migrations.runFile(at)} does not parse, and a run wrote it. Run flow doctor.`;

  const step = found.step ? `after step ${found.step}` : 'before its first step';
  return `a ${found.type || 'Flow'} run stopped ${step}, so this machine is part way through a change. ` +
    `To carry on, ${migrations.resume(found)} in a terminal. flow doctor names the way back.`;
}

/** What needs attention, one line each, empty where nothing does. */
function attention(at, cwd) {
  const stopped = stoppedRun(at);
  if (stopped) return [stopped];

  const out = [];
  const newest = version.newest(cloneRoot());
  const mine = version.applied(path.join(at.flow, 'version'));
  // Another machine's record, from the last fetch: no network here.
  const other = mine.state === 'ok' ? flowRepo.ahead(at, mine.number) : null;

  if (mine.state === 'missing') {
    out.push('this machine carries no version stamp, so flow install never reached its last step. Run flow install.');
  } else if (mine.state === 'unreadable') {
    out.push(`~/.flow/version holds "${mine.text}", and it holds one changelog entry number and nothing else. Run flow doctor.`);
  } else if (newest !== null && mine.number > newest) {
    out.push(`this machine is at entry ${mine.number} and the changelog stops at ${newest}, so the clone moved backwards. Run flow doctor.`);
  } else if (other) {
    out.push(`${other.name} is on changelog entry ${other.number}, and this machine is on ${mine.number}, so flow sync waits. Run flow update in a terminal.`);
  } else if (newest !== null && mine.number < newest) {
    out.push(`this machine is at changelog entry ${mine.number}, and ${newest} is the newest. Run flow update in a terminal to catch up.`);
  }

  const root = projectRoot(cwd, at);
  if (!root) return out;

  const name = path.basename(root);
  const theirs = version.applied(path.join(root, '.flow', 'version'));
  if (theirs.state === 'missing') {
    out.push(`${name} carries no version stamp, so flow init never reached its last step. Type flow init.`);
  } else if (theirs.state === 'unreadable') {
    out.push(`${name}/.flow/version holds "${theirs.text}", and it holds one changelog entry number and nothing else. Run flow doctor.`);
  } else if (mine.state === 'ok' && theirs.number < mine.number) {
    out.push(`${name} is at changelog entry ${theirs.number}, and this machine is at ${mine.number}. Run flow update in a terminal, inside it.`);
  } else if (mine.state === 'ok' && theirs.number > mine.number) {
    out.push(`${name} is at entry ${theirs.number} and this machine is at ${mine.number}, so the project is ahead of the machine. Run flow doctor.`);
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
  const root = projectRoot(cwd, at);
  if (root) {
    if (version.applied(path.join(root, '.flow', 'version')).state !== 'ok') return null;
    const memory = path.join(skills.configDir(), 'projects', root.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
    let held = [];
    try {
      held = fs.readdirSync(memory);
    } catch {
      // No memory for this project on this machine.
    }
    return held.length ? 'Flow: old Claude Code memory here. Run flow init to fold it in.' : null;
  }

  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' });
  if (git.status !== 0) return null;
  const repo = real(git.stdout.trim());
  if (repo === real(at.base) || repo === real(at.flow)) return null;
  return 'Flow: not set up here. Run flow init to add it, or flow settings off setupReminder to stop this.';
}

/**
 * Make every skill link match the settings. Returns whether a link changed,
 * which is when the skill folders need scanning again.
 */
function relink(at, cwd) {
  const done = links.apply({ home: at.flow, root: projectRoot(cwd, at), claude: skills.configDir(), agents: at.agents });
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
  const child = spawn(process.execPath, [path.join(__dirname, 'skills-pull.js')], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

/**
 * Bring the project's tickets up to date, and send what this machine left
 * unsent, without waiting: `records-sync.js` runs the pull and the push on the
 * project's `flow` branch, detached. A local project, or a folder with no
 * branch, starts nothing.
 */
function startRecordsPull(at, cwd) {
  const root = projectRoot(cwd, at);
  if (!root || !records.onBranch(root)) return;
  const child = spawn(process.execPath, [path.join(__dirname, 'records-sync.js'), '--project', root, '--now'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

try {
  const at = machine.folders();
  let cwd = process.cwd();
  try {
    cwd = JSON.parse(fs.readFileSync(0, 'utf8')).cwd || cwd;
  } catch {
    // Run by hand, with no event on stdin. The working folder stands in.
  }

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

  const text = lines.map((line) => `Flow: ${line}`).join('\n');
  if (reload || reminder) {
    const said = { hookEventName: 'SessionStart' };
    if (reload) said.reloadSkills = true;
    if (text) said.additionalContext = text;
    const output = reload || text ? { hookSpecificOutput: said } : {};
    if (reminder) output.systemMessage = reminder;
    process.stdout.write(JSON.stringify(output) + '\n');
  } else if (text) {
    process.stdout.write(text + '\n');
  }

  startPull(at);
  startRecordsPull(at, cwd);
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
