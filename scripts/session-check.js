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
 * skill repositories' own news. `flow doctor` stays the full check, since it
 * runs both test suites and takes seconds.
 *
 * It makes every skill link match the settings, the step every `flow skills`
 * command runs, so a switch made on another machine or pulled with a project
 * applies here. When that changed a link it asks Claude Code to scan the skill
 * folders again (`reloadSkills`), so the first prompt already sees the change.
 *
 * The one thing it starts is scripts/skills-pull.js, detached, which brings
 * every skill repository up to date in the background. Starting a process is
 * not waiting for one: the hook returns before the pull has reached the
 * network, and what the pull finds is printed by the session after it.
 *
 * In a git repository with no `.flow/` it also suggests `flow setup project`,
 * to the user alone. `setupReminder()` holds the rules.
 *
 * `"sessionCheck": false` in ~/.flow/settings.json silences it. Exit 2 on this
 * event prints a notice the session ignores, so a failure here is silence.
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { cloneRoot } = require('./flow/lib/clone');
const machine = require('./flow/lib/machine');
const migrations = require('./flow/lib/migrations');
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

  if (mine.state === 'missing') {
    out.push('this machine carries no version stamp, so flow setup never reached its last step. Run flow setup.');
  } else if (mine.state === 'unreadable') {
    out.push(`~/.flow/version holds "${mine.text}", and it holds one changelog entry number and nothing else. Run flow doctor.`);
  } else if (newest !== null && mine.number > newest) {
    out.push(`this machine is at entry ${mine.number} and the changelog stops at ${newest}, so the clone moved backwards. Run flow doctor.`);
  } else if (newest !== null && mine.number < newest) {
    out.push(`this machine is at changelog entry ${mine.number}, and ${newest} is the newest. Run flow up in a terminal to catch up.`);
  }

  const root = projectRoot(cwd, at);
  if (!root) return out;

  const name = path.basename(root);
  const theirs = version.applied(path.join(root, '.flow', 'version'));
  if (theirs.state === 'missing') {
    out.push(`${name} carries no version stamp, so flow setup project never reached its last step. Type flow setup project.`);
  } else if (theirs.state === 'unreadable') {
    out.push(`${name}/.flow/version holds "${theirs.text}", and it holds one changelog entry number and nothing else. Run flow doctor.`);
  } else if (mine.state === 'ok' && theirs.number < mine.number) {
    out.push(`${name} is at changelog entry ${theirs.number}, and this machine is at ${mine.number}. Run flow up in a terminal, inside it.`);
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

/**
 * The line suggesting `flow setup project`, or null.
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
  if (!settings.prints('setupReminder') || projectRoot(cwd, at)) return null;
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' });
  if (git.status !== 0) return null;
  const repo = real(git.stdout.trim());
  if (repo === real(at.base) || repo === real(at.flow)) return null;

  const here = real(cwd);
  const skip = [].concat(settings.readGlobal().setupReminderSkip || [])
    .filter((entry) => typeof entry === 'string')
    .map((entry) => real(entry.replace(/^~(?=\/|$)/, at.base)));
  if (skip.some((dir) => here === dir || here.startsWith(dir + path.sep))) return null;

  return 'Flow: not set up here. Run flow setup project to add it, or flow settings off setupReminder to stop this.';
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
  if (!update.due(at)) return;
  const child = spawn(process.execPath, [path.join(__dirname, 'skills-pull.js')], {
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
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
