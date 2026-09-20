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
 * domain-skills clone's own news. `flow doctor` stays the full check, since it
 * runs both test suites and takes seconds.
 *
 * The one thing it starts is scripts/domain-pull.js, detached, which brings
 * that clone up to date in the background. Starting a process is not waiting
 * for one: the hook returns before the pull has reached the network, and what
 * the pull finds is printed by the session after it.
 *
 * It is also how /flow:migrate gets named at all. That skill is typed and
 * never model-invoked, so its description stays out of every session, and
 * nothing else would tell the user the command exists.
 *
 * `"sessionCheck": false` in ~/.flow/settings.json silences it. Exit 2 on this
 * event prints a notice the session ignores, so a failure here is silence.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { cloneRoot } = require('./flow/lib/clone');
const machine = require('./flow/lib/machine');
const migrations = require('./flow/lib/migrations');
const settings = require('./flow/lib/settings');
const update = require('./flow/lib/skills-update');
const version = require('./flow/lib/version');

/**
 * The nearest folder at or above `from` holding a `.flow/`, or null.
 *
 * `lib/root.js` asks git for the project root and refuses outside one. A hook
 * fires wherever the user opened the session, so a walk up the tree is the
 * whole of it here: no git, no refusal, and a folder with no `.flow/` above it
 * is simply not a project.
 */
function projectRoot(from) {
  let dir = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(dir, '.flow'))) return dir;
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
 * own version. The domain-skills line is a separate record and still prints.
 */
function stoppedRun(at) {
  const found = migrations.run(at);
  if (!found) return null;
  if (found.error) return `${migrations.runFile(at)} does not parse, and a run wrote it. Run flow doctor.`;

  const step = found.step ? `after step ${found.step}` : 'before its first step';
  const skill = migrations.TYPES.includes(found.type) ? `/flow:${found.type}` : 'the skill that wrote it';
  return `a ${found.type || 'Flow'} run stopped ${step}, so this machine is part way through a change. ` +
    `Type ${skill} to carry on, or run flow doctor for the way back.`;
}

/** What needs attention, one line each, empty where nothing does. */
function attention(at, cwd) {
  const stopped = stoppedRun(at);
  if (stopped) return [stopped];

  const out = [];
  const newest = version.newest(cloneRoot());
  const mine = version.applied(path.join(at.flow, 'version'));

  if (mine.state === 'missing') {
    out.push('this machine carries no version stamp, so /flow:setup-machine never reached its last step. Type /flow:setup-machine.');
  } else if (mine.state === 'unreadable') {
    out.push(`~/.flow/version holds "${mine.text}", and it holds one changelog entry number and nothing else. Run flow doctor.`);
  } else if (newest !== null && mine.number > newest) {
    out.push(`this machine is at entry ${mine.number} and the changelog stops at ${newest}, so the clone moved backwards. Run flow doctor.`);
  } else if (newest !== null && mine.number < newest) {
    out.push(`this machine is at changelog entry ${mine.number}, and ${newest} is the newest. Type /flow:migrate to catch up.`);
  }

  const root = projectRoot(cwd);
  if (!root) return out;

  const name = path.basename(root);
  const theirs = version.applied(path.join(root, '.flow', 'version'));
  if (theirs.state === 'missing') {
    out.push(`${name} carries no version stamp, so /flow:setup-project never reached its last step. Type /flow:setup-project.`);
  } else if (theirs.state === 'unreadable') {
    out.push(`${name}/.flow/version holds "${theirs.text}", and it holds one changelog entry number and nothing else. Run flow doctor.`);
  } else if (mine.state === 'ok' && theirs.number < mine.number) {
    out.push(`${name} is at changelog entry ${theirs.number}, and this machine is at ${mine.number}. Type /flow:migrate here.`);
  } else if (mine.state === 'ok' && theirs.number > mine.number) {
    out.push(`${name} is at entry ${theirs.number} and this machine is at ${mine.number}, so the project is ahead of the machine. Run flow doctor.`);
  }
  return out;
}

/**
 * Send the domain-skills clone to look for new work, without waiting for it.
 *
 * Detached with no output anywhere, so the session is never held by a network
 * call and never sees what the pull printed. `skills-update.js` decides
 * whether there is anything to do at all.
 *
 * `"sessionCheck": false` silences the lines above and not this: the skills
 * are what an agent reads in a project, so a quiet machine still wants them
 * current. `"domainSkillsAutoUpdate": false` is the key that stops the pull.
 */
function startPull(at) {
  if (!update.due(at)) return;
  const child = spawn(process.execPath, [path.join(__dirname, 'domain-pull.js')], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

try {
  const at = machine.folders();

  if (settings.prints('sessionCheck')) {
    let cwd = process.cwd();
    try {
      cwd = JSON.parse(fs.readFileSync(0, 'utf8')).cwd || cwd;
    } catch {
      // Run by hand, with no event on stdin. The working folder stands in.
    }
    const lines = attention(at, cwd);

    // The clone's news is a record of its own: a domain skill being behind is
    // a pull, where Flow being behind is a migration.
    const skills = update.line(update.readNote(at));
    if (skills) lines.push(skills);

    if (lines.length) process.stdout.write(lines.map((line) => `Flow: ${line}`).join('\n') + '\n');
  }

  startPull(at);
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
