'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run } = require('./helpers/scratch');
const frontmatter = require('../flow/lib/frontmatter');

/**
 * A scratch Flow home and a scratch Claude Code home. The session variables are
 * dropped, so a suite run inside a live session never reads that session's transcript.
 */
function setup(name, session = {}) {
  const dir = project(name);
  const home = path.join(dir, 'flow-home');
  const claude = path.join(dir, 'claude-home');
  fs.mkdirSync(home, { recursive: true });
  const env = { ...process.env, FLOW_HOME: home, FLOW_PROJECT: dir, CLAUDE_CONFIG_DIR: claude, ...session };
  if (!session.CLAUDE_CODE_SESSION_ID) delete env.CLAUDE_CODE_SESSION_ID;
  if (!session.CLAUDE_EFFORT) delete env.CLAUDE_EFFORT;
  const cases = (...args) => run('flow/flow.js', ['cases', ...args], { cwd: dir, env });
  return { dir, home, claude, env, cases };
}

const readOneCase = (issueDir) =>
  frontmatter.parse(fs.readFileSync(path.join(issueDir, fs.readdirSync(issueDir).find((f) => f.endsWith('.md'))), 'utf8'));

test('a case records the model of the last reply and the effort level', () => {
  const id = 'aaaa-1111';
  const { cases, home, claude } = setup('cases-model', { CLAUDE_CODE_SESSION_ID: id, CLAUDE_EFFORT: 'high' });

  // A /model switch mid-session: the last real reply wins, and a synthetic one is skipped.
  const lines = [
    { type: 'assistant', message: { model: 'claude-sonnet-5' } },
    { type: 'user', message: { content: 'switch' } },
    { type: 'assistant', message: { model: 'claude-opus-5' } },
    { type: 'assistant', message: { model: '<synthetic>' } },
  ];
  const transcripts = path.join(claude, 'projects', '-scratch');
  fs.mkdirSync(transcripts, { recursive: true });
  fs.writeFileSync(path.join(transcripts, `${id}.jsonl`), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');

  const r = cases('new', 'Wrote a wall of text', '--issue', 'too-long');
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /model: claude-opus-5, effort high/);

  const { data } = readOneCase(path.join(home, 'study-cases', 'too-long'));
  assert.strictEqual(data.model, 'claude-opus-5');
  assert.strictEqual(data.effort, 'high');
});

test('outside a Claude Code session, model and effort stay empty', () => {
  const { cases, home } = setup('cases-no-session');

  const r = cases('new', 'Recorded by hand', '--issue', 'by-hand');
  assert.strictEqual(r.code, 0, r.stderr);

  const { data } = readOneCase(path.join(home, 'study-cases', 'by-hand'));
  assert.strictEqual(data.model || '', '');
  assert.strictEqual(data.effort || '', '');
});

test('a case is created, listed, shown, and marked fixed', () => {
  const { cases, home } = setup('cases-lifecycle');

  const made = cases('new', 'Agent skipped the guard', '--issue', 'skipped-guards');
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /skipped-guards/);

  const listed = cases('ls');
  assert.strictEqual(listed.code, 0, listed.stderr);
  assert.match(listed.stdout, /agent-skipped-the-guard/);

  const issueDir = path.join(home, 'study-cases', 'skipped-guards');
  const files = fs.readdirSync(issueDir).filter((f) => f.endsWith('.md'));
  assert.strictEqual(files.length, 1);
  const slug = files[0].replace(/\.md$/, '');

  const shown = cases('get', slug);
  assert.strictEqual(shown.code, 0, shown.stderr);
  assert.match(shown.stdout, /skipped-guards/);

  const fixed = cases('edit', slug, '--status', 'fixed', '--by', 'guard.js');
  assert.strictEqual(fixed.code, 0, fixed.stderr);

  const fm = frontmatter.parse(fs.readFileSync(path.join(issueDir, files[0]), 'utf8'));
  assert.strictEqual(fm.data.status, 'fixed');
  assert.strictEqual(fm.data.fix, 'guard.js');
});

test('a near-match issue name refuses, and --force overrides', () => {
  const { cases } = setup('cases-near-match');

  const first = cases('new', 'Case one', '--issue', 'auth-failures');
  assert.strictEqual(first.code, 0, first.stderr);

  const near = cases('new', 'Case two', '--issue', 'auth-failure');
  assert.notStrictEqual(near.code, 0);
  assert.match(near.stderr, /auth-failures/);

  const forced = cases('new', 'Case two', '--issue', 'auth-failure', '--force');
  assert.strictEqual(forced.code, 0, forced.stderr);
});

test('flow cases issues lists each issue with its counts', () => {
  const { cases } = setup('cases-issues');

  cases('new', 'First of auth', '--issue', 'auth-failures');
  cases('new', 'Second of auth', '--issue', 'auth-failures');
  cases('new', 'First of perf', '--issue', 'performance-regressions');

  const r = cases('issues');
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /auth-failures/);
  assert.match(r.stdout, /performance-regressions/);
  assert.match(r.stdout, /2/);
});

test('flow cases new --body and --rule set the content', () => {
  const { cases, home } = setup('cases-body-rule');

  const r = cases('new', 'Missed a guard', '--issue', 'guard-skip',
    '--rule', 'Always check guards', '--body', 'The agent ran past the check.');
  assert.strictEqual(r.code, 0, r.stderr);

  const issueDir = path.join(home, 'study-cases', 'guard-skip');
  const file = fs.readdirSync(issueDir).find((f) => f.endsWith('.md'));
  const { data, body } = frontmatter.parse(fs.readFileSync(path.join(issueDir, file), 'utf8'));
  assert.strictEqual(data.rule, 'Always check guards');
  assert.match(body, /agent ran past/);
});

test('reopening a case clears the fix', () => {
  const { cases, home } = setup('cases-reopen');

  cases('new', 'Bug reappeared', '--issue', 'reopen-test');
  const issueDir = path.join(home, 'study-cases', 'reopen-test');
  const slug = fs.readdirSync(issueDir).find((f) => f.endsWith('.md')).replace(/\.md$/, '');

  cases('edit', slug, '--status', 'fixed', '--by', 'patch.js');
  const fixed = frontmatter.parse(fs.readFileSync(path.join(issueDir, slug + '.md'), 'utf8'));
  assert.strictEqual(fixed.data.status, 'fixed');
  assert.strictEqual(fixed.data.fix, 'patch.js');

  cases('edit', slug, '--status', 'open');
  const reopened = frontmatter.parse(fs.readFileSync(path.join(issueDir, slug + '.md'), 'utf8'));
  assert.strictEqual(reopened.data.status, 'open');
  assert.strictEqual(reopened.data.fix || '', '');
});
