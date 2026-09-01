'use strict';
/**
 * `guard` — the PreToolUse hook that vets a Bash call before it runs.
 *
 * `ptree` and `fmerge` were tested here too, until 2026-08-30 moved both into
 * the `util` repo as `fs tree` and `fs merge`. Their tests moved with them.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { project, run } = require('./helpers/scratch');

/** The shape Claude Code hands a PreToolUse hook on stdin. */
function toolCall(command, cwd) {
  return JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd });
}

test('guard denies a git write, passes a git read, and asks about an outside delete', () => {
  const dir = project('guard-verdicts');

  const write_ = run('guard.js', [], { input: toolCall('git commit -m "x"', dir) });
  assert.match(write_.stdout, /"permissionDecision":"deny"/);

  const read = run('guard.js', [], { input: toolCall('git status --porcelain', dir) });
  assert.strictEqual(read.stdout.trim(), '', 'a read gets no verdict at all');

  const inside = run('guard.js', [], { input: toolCall('rm -rf build', dir) });
  assert.strictEqual(inside.stdout.trim(), '');

  const outside = run('guard.js', [], { input: toolCall('rm -rf /tmp/somewhere-else', dir) });
  assert.match(outside.stdout, /"permissionDecision":"ask"/);
});

test('guard denies an unknown git subcommand rather than letting it through', () => {
  const dir = project('guard-unknown');
  const result = run('guard.js', [], { input: toolCall('git frobnicate --all', dir) });
  assert.match(result.stdout, /"permissionDecision":"deny"/);
});

// ------------------------------------------------------------- the git mode

const fs = require('node:fs');
const path = require('node:path');
const { SCRATCH } = require('./helpers/scratch');

/** A throwaway ~/.flow holding one git entry, or none. */
function flowHome(name, entry) {
  const dir = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (entry) fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({ git: entry }));
  return dir;
}

const hours = (n) => new Date(Date.now() + n * 3600e3).toISOString();

/** The verdict, as one word. `silent` is the hook declining to decide. */
function verdict(command, { home, session = 'S1', cwd }) {
  const input = JSON.stringify({
    tool_name: 'Bash', session_id: session, cwd, tool_input: { command },
  });
  const result = run('guard.js', [], { input, env: { ...process.env, FLOW_HOME: home } });
  if (!result.stdout.trim()) return 'silent';
  return JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
}

test('git writes deny by default and run once the mode says allow', () => {
  const dir = project('guard-git-mode');

  const off = flowHome('guard-git-mode', null);
  assert.strictEqual(verdict('git commit -m x', { home: off, cwd: dir }), 'deny');
  assert.strictEqual(verdict('git status', { home: off, cwd: dir }), 'silent', 'a read never depends on the mode');

  const on = flowHome('guard-git-mode', { mode: 'allow', until: hours(1), session: 'S1' });
  assert.strictEqual(verdict('git commit -m x', { home: on, cwd: dir }), 'silent');
  assert.strictEqual(verdict('git commit -m x', { home: on, cwd: dir, session: 'OTHER' }), 'deny',
    'a session entry governs that session only');

  const ask = flowHome('guard-git-mode', { mode: 'ask', until: hours(1) });
  assert.strictEqual(verdict('git commit -m x', { home: ask, cwd: dir }), 'ask');
});

test('a destructive git command asks even while writes are allowed', () => {
  const dir = project('guard-git-destructive');
  const on = flowHome('guard-git-destructive', { mode: 'allow', until: hours(1) });

  for (const command of [
    'git push --force origin main',
    'git push -f',
    'git reset --hard HEAD~1',
    'git clean -fd',
    'git rebase main',
    'git branch -D old',
    'git worktree remove --force ../x',
  ]) {
    assert.strictEqual(verdict(command, { home: on, cwd: dir }), 'ask', command);
  }

  assert.strictEqual(verdict('git log --grep=clean', { home: on, cwd: dir }), 'silent',
    'the destructive list reads the subcommand, not the whole line');
});

test('an expired entry means off, and the guard deletes it', () => {
  const dir = project('guard-git-expiry');
  const home = flowHome('guard-git-expiry', { mode: 'allow', until: hours(-1) });
  const file = path.join(home, 'settings.json');

  assert.strictEqual(verdict('git commit -m x', { home, cwd: dir }), 'deny');
  assert.strictEqual(fs.existsSync(file), false, 'nothing else was in the file, so the file goes too');
});

test('the agent cannot turn the switch on, and env cannot hide a git command', () => {
  const dir = project('guard-git-self');
  const off = flowHome('guard-git-self', null);

  assert.strictEqual(verdict('flow git allow', { home: off, cwd: dir }), 'deny');
  assert.strictEqual(verdict('fw git ask --for 2h', { home: off, cwd: dir }), 'deny');
  assert.strictEqual(verdict('flow git off', { home: off, cwd: dir }), 'silent', 'turning it off is never the problem');

  // `env` used to leave `env` as the program, so the git check never ran.
  assert.strictEqual(verdict('env FLOW=1 git tag -f v1', { home: off, cwd: dir }), 'deny');
  assert.strictEqual(verdict('FLOW=1 git commit -m x', { home: off, cwd: dir }), 'deny',
    'the mode comes from the guard\'s own environment, never from the command');
});

test('git worktree is instructed, so it runs whatever the mode says', () => {
  const dir = project('guard-git-worktree');
  const off = flowHome('guard-git-worktree', null);
  assert.strictEqual(verdict('git worktree add ../side', { home: off, cwd: dir }), 'silent');
  assert.strictEqual(verdict('git worktree list', { home: off, cwd: dir }), 'silent');
});
