'use strict';
/**
 * `session-check`: the SessionStart hook that names what needs attention.
 *
 * The newest entry comes off the real CHANGELOG.md, the way the hook reads it,
 * so a new entry never leaves these tests naming a number that moved.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { SCRATCH, REPO, run, write, skillFile } = require('./helpers/scratch');
const version = require('../flow/lib/version');

const NEWEST = version.newest(REPO);

/** A throwaway machine and one project inside it, each stamped or not. */
function place(name, opts = {}) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const home = path.join(dir, 'flow-home');
  const project = path.join(dir, 'project');
  const user = path.join(dir, 'user');
  fs.mkdirSync(user, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(path.join(project, '.flow'), { recursive: true });

  if (opts.machine !== undefined) fs.writeFileSync(path.join(home, 'version'), `${opts.machine}\n`);
  if (opts.project !== undefined) fs.writeFileSync(path.join(project, '.flow', 'version'), `${opts.project}\n`);
  if (opts.run) fs.writeFileSync(path.join(home, 'run.json'), JSON.stringify(opts.run));
  if (opts.note) fs.writeFileSync(path.join(home, 'skills-update.json'), JSON.stringify({ notes: [opts.note] }));
  if (opts.settings) fs.writeFileSync(path.join(home, 'settings.json'), JSON.stringify(opts.settings));
  return { home, project, user };
}

/**
 * The hook, handed the event Claude Code sends it. HOME and CLAUDE_CONFIG_DIR
 * move with FLOW_HOME: the hook makes skill links in Claude Code's folder.
 * The scratch folder sits inside Flow's own repository, so git stops at it.
 */
const check = ({ home, project, user }) => run('session-check.js', [], {
  input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd: project }),
  env: {
    ...process.env, FLOW_HOME: home, HOME: user, CLAUDE_CONFIG_DIR: path.join(user, '.claude'), GIT_CEILING_DIRECTORIES: SCRATCH,
  },
});

test('a current machine in a current project prints nothing at all', () => {
  const result = check(place('session-current', { machine: NEWEST, project: NEWEST }));
  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.code, 0);
});

test('a machine behind the changelog and a project behind its machine each name flow up', () => {
  const behind = check(place('session-behind', { machine: NEWEST - 1, project: NEWEST - 1 }));
  assert.match(behind.stdout, new RegExp(`Flow: this machine is at changelog entry ${NEWEST - 1}, and ${NEWEST} is the newest`));
  assert.match(behind.stdout, /Run flow up in a terminal to catch up\./);

  const project = check(place('session-project', { machine: NEWEST, project: NEWEST - 1 }));
  assert.match(project.stdout, new RegExp(`Flow: project is at changelog entry ${NEWEST - 1}, and this machine is at ${NEWEST}`));
  assert.match(project.stdout, /Run flow up in a terminal, inside it\./);
  assert.strictEqual(project.stdout.trim().split('\n').length, 1, 'the machine itself is current, so it says nothing');
});

test('a stopped run prints alone, and names the command that carries it on', () => {
  const result = check(place('session-stopped', {
    machine: NEWEST - 1,
    project: NEWEST - 1,
    run: { type: 'migrate', started: '2026-09-20T10:12:40.000Z', step: 4 },
  }));

  assert.strictEqual(result.stdout.trim().split('\n').length, 1, 'finishing the run is the only thing worth saying');
  assert.match(result.stdout, /a migrate run stopped after step 4/);
  assert.match(result.stdout, /To carry on, run flow up in a terminal/);
});

// A skill repository is a record of its own: it being behind is a pull,
// where Flow being behind is a migration. No clone is made here, so the hook
// prints what the last background run left and starts nothing.
test('a skill repository prints its own line, a stopped run included', () => {
  const current = check(place('session-skills', {
    machine: NEWEST,
    project: NEWEST,
    note: { state: 'behind', count: 2, skills: ['react', 'sql'], clone: 'domain-skills' },
  }));
  assert.strictEqual(current.stdout.trim().split('\n').length, 1, 'the machine and the project are fine');
  assert.match(current.stdout, /Flow: domain-skills is behind\. 2 skills changed: react, sql\./);

  const stopped = check(place('session-skills-run', {
    machine: NEWEST,
    project: NEWEST,
    run: { type: 'migrate', step: 2 },
    note: { state: 'dirty', files: 3, clone: 'domain-skills' },
  }));
  const lines = stopped.stdout.trim().split('\n');
  assert.strictEqual(lines.length, 2, 'a stopped run silences the version lines and not this one');
  assert.match(lines[0], /a migrate run stopped after step 2/);
  assert.match(lines[1], /has 3 uncommitted files/);
});

test('"sessionCheck": false silences a machine that needs every line', () => {
  const result = check(place('session-off', {
    machine: NEWEST - 1,
    run: { type: 'migrate', step: 2 },
    note: { state: 'dirty', files: 1, clone: 'domain-skills' },
    settings: { sessionCheck: false },
  }));

  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.code, 0);
});

// A switch made on another machine arrives as a settings line. The hook
// makes the link, and asks Claude Code to scan the skill folders again so
// the first prompt already has it.
test('a link the hook changed asks for a rescan, and a session with nothing to change prints nothing', () => {
  const at = place('session-relink', { machine: NEWEST, project: NEWEST });
  const source = path.join(at.home, 'repos', 'sources', 'Adrian333Dev_domain-skills');
  write(source, 'react/SKILL.md', skillFile('react'));
  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ skills: { react: 'on' } }));

  const first = check(at);
  assert.strictEqual(first.code, 0);
  assert.deepStrictEqual(JSON.parse(first.stdout), { hookSpecificOutput: { hookEventName: 'SessionStart', reloadSkills: true } });
  assert.strictEqual(fs.readlinkSync(path.join(at.user, '.claude', 'skills', 'react')), path.join(source, 'react'));

  const second = check(at);
  assert.strictEqual(second.stdout, '', 'the link is there, so there is nothing to scan');

  // A line to print rides along in the same answer.
  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ skills: {} }));
  fs.writeFileSync(path.join(at.home, 'version'), `${NEWEST - 1}\n`);
  const third = JSON.parse(check(at).stdout).hookSpecificOutput;
  assert.strictEqual(third.reloadSkills, true);
  assert.match(third.additionalContext, /^Flow: this machine is at changelog entry/);
  assert.ok(!fs.existsSync(path.join(at.user, '.claude', 'skills', 'react')), 'switched off, so unlinked');
});

// On a real machine ~/.flow sits in the home folder, so every folder under it
// has a `.flow/` above it. That one is the machine's, never a project's.
test('a folder under the home folder with no .flow of its own is not a project', () => {
  const dir = path.join(SCRATCH, 'session-home');
  fs.rmSync(dir, { recursive: true, force: true });
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  const playground = path.join(user, 'code', 'playground');
  fs.mkdirSync(playground, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'version'), `${NEWEST}\n`);
  const source = path.join(home, 'repos', 'sources', 'Adrian333Dev_domain-skills');
  write(source, 'react/SKILL.md', skillFile('react'));
  fs.writeFileSync(path.join(home, 'settings.json'), JSON.stringify({ skills: { react: 'on' } }));

  const at = { home, project: playground, user };
  assert.strictEqual(JSON.parse(check(at).stdout).hookSpecificOutput.reloadSkills, true);
  const link = path.join(user, '.claude', 'skills', 'react');
  assert.strictEqual(fs.readlinkSync(link), path.join(source, 'react'), 'on for the whole machine, so linked');

  const second = check(at);
  assert.strictEqual(second.stdout, '', 'the link stays, and the home folder is never read as a project');
  assert.strictEqual(fs.readlinkSync(link), path.join(source, 'react'));
});

test('a git repository with no .flow gets the setup line, shown to the user alone, unless a setting says not', () => {
  const at = place('session-setup-line', { machine: NEWEST });
  const shop = path.join(at.user, 'code', 'shop');
  fs.mkdirSync(path.join(shop, 'src'), { recursive: true });
  assert.strictEqual(spawnSync('git', ['init', '-q'], { cwd: shop }).status, 0);

  const output = JSON.parse(check({ ...at, project: path.join(shop, 'src') }).stdout);
  assert.strictEqual(output.systemMessage, 'Flow: not set up here. Run flow setup project to add it, or flow settings off setupReminder to stop this.');
  assert.strictEqual(output.hookSpecificOutput, undefined, 'nothing reaches the agent');

  const notes = path.join(at.user, 'notes');
  fs.mkdirSync(notes, { recursive: true });
  assert.strictEqual(check({ ...at, project: notes }).stdout, '', 'a folder git does not track');

  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ setupReminderSkip: ['~/code/shop'] }));
  assert.strictEqual(check({ ...at, project: path.join(shop, 'src') }).stdout, '', 'a skipped folder, and everything below it');

  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ setupReminder: false }));
  assert.strictEqual(check({ ...at, project: shop }).stdout, '', 'off everywhere');
});
