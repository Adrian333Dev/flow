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
const { SCRATCH, REPO, run } = require('./helpers/scratch');
const version = require('../flow/lib/version');

const NEWEST = version.newest(REPO);

/** A throwaway machine and one project inside it, each stamped or not. */
function place(name, opts = {}) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const home = path.join(dir, 'flow-home');
  const project = path.join(dir, 'project');
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(path.join(project, '.flow'), { recursive: true });

  if (opts.machine !== undefined) fs.writeFileSync(path.join(home, 'version'), `${opts.machine}\n`);
  if (opts.project !== undefined) fs.writeFileSync(path.join(project, '.flow', 'version'), `${opts.project}\n`);
  if (opts.run) fs.writeFileSync(path.join(home, 'run.json'), JSON.stringify(opts.run));
  if (opts.note) fs.writeFileSync(path.join(home, 'skills-update.json'), JSON.stringify(opts.note));
  if (opts.settings) fs.writeFileSync(path.join(home, 'settings.json'), JSON.stringify(opts.settings));
  return { home, project };
}

/** The hook, handed the event Claude Code sends it. */
const check = ({ home, project }) => run('session-check.js', [], {
  input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd: project }),
  env: { ...process.env, FLOW_HOME: home },
});

test('a current machine in a current project prints nothing at all', () => {
  const result = check(place('session-current', { machine: NEWEST, project: NEWEST }));
  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.code, 0);
});

test('a machine behind the changelog and a project behind its machine each name /flow:migrate', () => {
  const behind = check(place('session-behind', { machine: NEWEST - 1, project: NEWEST - 1 }));
  assert.match(behind.stdout, new RegExp(`Flow: this machine is at changelog entry ${NEWEST - 1}, and ${NEWEST} is the newest`));
  assert.match(behind.stdout, /Type \/flow:migrate to catch up\./);

  const project = check(place('session-project', { machine: NEWEST, project: NEWEST - 1 }));
  assert.match(project.stdout, new RegExp(`Flow: project is at changelog entry ${NEWEST - 1}, and this machine is at ${NEWEST}`));
  assert.match(project.stdout, /Type \/flow:migrate here\./);
  assert.strictEqual(project.stdout.trim().split('\n').length, 1, 'the machine itself is current, so it says nothing');
});

test('a stopped run prints alone, and names the skill that carries it on', () => {
  const result = check(place('session-stopped', {
    machine: NEWEST - 1,
    project: NEWEST - 1,
    run: { type: 'migrate', started: '2026-09-20T10:12:40.000Z', step: 4 },
  }));

  assert.strictEqual(result.stdout.trim().split('\n').length, 1, 'finishing the run is the only thing worth saying');
  assert.match(result.stdout, /a migrate run stopped after step 4/);
  assert.match(result.stdout, /Type \/flow:migrate to carry on/);
});

// The domain-skills clone is a record of its own: it being behind is a pull,
// where Flow being behind is a migration. No clone is set here, so the hook
// prints what the last background run left and starts nothing.
test('the domain-skills clone prints its own line, a stopped run included', () => {
  const current = check(place('session-skills', {
    machine: NEWEST,
    project: NEWEST,
    note: { state: 'behind', count: 2, skills: ['react', 'sql'], clone: '/home/me/code/domain-skills' },
  }));
  assert.strictEqual(current.stdout.trim().split('\n').length, 1, 'the machine and the project are fine');
  assert.match(current.stdout, /Flow: \/home\/me\/code\/domain-skills is behind\. 2 domain skills changed: react, sql\./);

  const stopped = check(place('session-skills-run', {
    machine: NEWEST,
    project: NEWEST,
    run: { type: 'migrate', step: 2 },
    note: { state: 'dirty', files: 3, clone: '/home/me/code/domain-skills' },
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
    note: { state: 'dirty', files: 1, clone: '/home/me/code/domain-skills' },
    settings: { sessionCheck: false },
  }));

  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.code, 0);
});
