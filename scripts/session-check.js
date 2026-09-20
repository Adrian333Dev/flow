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
 * It reads 3 files and runs nothing: ~/.flow/run.json, ~/.flow/version and the
 * project's .flow/version. `flow doctor` stays the full check, since it runs
 * both test suites and takes seconds.
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
const { cloneRoot } = require('./flow/lib/clone');
const machine = require('./flow/lib/machine');
const migrations = require('./flow/lib/migrations');
const settings = require('./flow/lib/settings');
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
 * The run that never finished, which prints alone.
 *
 * Every other line reads a version stamp that the stopped run was in the
 * middle of moving, so finishing the run is the only thing worth saying.
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

try {
  if (settings.prints('sessionCheck')) {
    let cwd = process.cwd();
    try {
      cwd = JSON.parse(fs.readFileSync(0, 'utf8')).cwd || cwd;
    } catch {
      // Run by hand, with no event on stdin. The working folder stands in.
    }
    const lines = attention(machine.folders(), cwd);
    if (lines.length) process.stdout.write(lines.map((line) => `Flow: ${line}`).join('\n') + '\n');
  }
} catch {
  // A session opens whatever this finds. Silence is the whole fallback.
}
