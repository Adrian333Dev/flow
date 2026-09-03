'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run } = require('./helpers/scratch');
const frontmatter = require('../flow/lib/frontmatter');

function setup(name) {
  const dir = project(name);
  const home = path.join(dir, 'flow-home');
  fs.mkdirSync(home, { recursive: true });
  const env = { ...process.env, FLOW_HOME: home, FLOW_PROJECT: dir };
  const cases = (...args) => run('flow/flow.js', ['cases', ...args], { cwd: dir, env });
  return { dir, home, env, cases };
}

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
