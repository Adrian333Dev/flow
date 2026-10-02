'use strict';
/**
 * `flow status-line`: the session's ticket and its status, read off what
 * Claude Code hands a status line on stdin.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { project, flow, run } = require('./helpers/scratch');

/** A project in a git repository, so the status line finds it from its folder. */
function repoProject(name) {
  const dir = project(name);
  spawnSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

/** A transcript line as Claude Code writes a typed skill. */
const typed = (name, args = '') => `${JSON.stringify({
  type: 'user', timestamp: '2026-10-01T10:00:00Z',
  message: { role: 'user', content: `<command-name>${name}</command-name>\n<command-args>${args}</command-args>` },
})}\n`;

function statusLine(dir, data, args = []) {
  return run('flow.js', ['status-line', ...args], {
    cwd: dir,
    input: JSON.stringify(data),
    env: { ...process.env, FLOW_HOME: path.join(dir, 'flow-home'), FLOW_PROJECT: '' },
  });
}

test('the ticket the user typed a skill for, with its status, and the size with --context', () => {
  const dir = repoProject('status-line-typed');
  flow(dir, ['new', 'Login page']);
  flow(dir, ['new', 'Export csv']);
  flow(dir, ['build', 'exp-2']);
  const transcript = path.join(dir, 'session.jsonl');
  fs.writeFileSync(transcript, typed('/exp-1'));
  const data = {
    session_id: 's1', cwd: dir, transcript_path: transcript,
    context_window: { current_usage: { input_tokens: 1000, cache_read_input_tokens: 90000, cache_creation_input_tokens: 7000 } },
  };

  assert.strictEqual(statusLine(dir, data).stdout, 'exp-1 todo\n');
  fs.appendFileSync(transcript, typed('/flow:execute', '/exp-2'));
  assert.strictEqual(statusLine(dir, data, ['--context']).stdout, 'exp-2 building · 98k of 150k\n');
  assert.strictEqual(statusLine(dir, data).stdout, 'exp-2 building\n', 'read from where it stopped, and kept');
});

test('a ticket a skill moved for this session, where none was typed', () => {
  const dir = repoProject('status-line-history');
  flow(dir, ['new', 'Crash on save', '--type', 'issue']);
  flow(dir, ['build', 'exp-1'], { CLAUDE_CODE_SESSION_ID: 's2' });
  const transcript = path.join(dir, 'session.jsonl');
  fs.writeFileSync(transcript, '');
  assert.strictEqual(statusLine(dir, { session_id: 's2', cwd: dir, transcript_path: transcript }).stdout, 'exp-1 building\n');
});

test('nothing outside a project, before a ticket is picked, or on input it cannot read', () => {
  const dir = repoProject('status-line-empty');
  assert.strictEqual(statusLine(dir, { session_id: 's3', cwd: path.dirname(dir) }).stdout.trim(), '');
  assert.strictEqual(statusLine(dir, { session_id: 's3', cwd: dir }).stdout, '\n');
  const broken = run('flow.js', ['status-line'], { cwd: dir, input: 'not json' });
  assert.strictEqual(broken.code, 0);
  assert.strictEqual(broken.stdout, '\n');
});
