'use strict';
/**
 * `flow audit permissions`: the permission log, counted.
 *
 * The log's writer is the pane in Flow's mod, so a fixture stands in for it:
 * 2 month files holding the lines of both machines after a sync, out of
 * order, with one broken line between them. Each output is compared whole
 * against a literal, since a count that is off by one reads like any other.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run } = require('./helpers/scratch');

const GUARD = 'Writes into ~/.claude/settings.json, which could switch the guard off';
const DELETE = 'Deletes 14 files git cannot restore, under src/old';
const PUSH = 'Pushes 3 commits to origin/main';
const SAVE = 'Stages everything, commits it and pushes.';

const line = (at, where, session, source, headline, answer, rule = null) => JSON.stringify({
  at, project: where, session, agent: 'main', tool: 'Bash', source, headline,
  command: 'x', rule, answer, ms: 1,
});

/** A scratch project whose Flow home holds the permission log files given. */
function roots(name, files) {
  const dir = project(name);
  const home = path.join(dir, 'flow-home');
  for (const [file, lines] of Object.entries(files)) {
    const target = path.join(home, 'logs', 'permissions', file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, lines.join('\n') + '\n');
  }
  return { ...process.env, FLOW_HOME: home, FLOW_PROJECT: dir };
}

const permissions = (env, args = []) => run('flow.js', ['audit', 'permissions', ...args], { env });

const both = () => roots('audit-permissions', {
  // The laptop's first month.
  '2026-09.jsonl': [
    line('2026-09-30T08:00:00Z', 'flow-dev', '17da95cd', 'rule', SAVE, 'allow', 'Bash(util git save *)'),
    line('2026-09-30T08:05:00Z', 'flow-dev', '17da95cd', 'core', 'Writes .claude/skills/x/SKILL.md', 'auto-allow'),
  ],
  // After the sync: the laptop's new lines, a conflict marker, then the PC's
  // lines, which are older than the laptop's and were added last.
  '2026-10.jsonl': [
    line('2026-10-13T10:00:00Z', 'flow-dev', '17da95cd', 'rule', PUSH, 'allow', 'Bash(git push *)'),
    line('2026-10-13T10:01:00Z', 'flow-dev', '17da95cd', 'core', 'Writes .claude/skills/x/SKILL.md', 'auto-allow'),
    line('2026-10-13T10:02:00Z', 'flow-dev', '17da95cd', 'guard', DELETE, 'refuse'),
    line('2026-10-13T10:03:00Z', 'flow-dev', '17da95cd', 'guard', DELETE, 'note'),
    '<<<<<<< HEAD',
    line('2026-10-12T09:00:00Z', 'shop', 'aa11bb22', 'rule', PUSH, 'allow', 'Bash(git push *)'),
    line('2026-10-12T09:10:00Z', 'shop', 'aa11bb22', 'guard', GUARD, 'refuse'),
  ],
});

test('every month file is counted by source and headline, and the asks outside the target are listed', () => {
  const result = permissions(both());
  assert.strictEqual(result.code, 0, result.stderr);
  assert.strictEqual(result.stdout, [
    'permission log: 8 lines, 1 skipped (did not parse)',
    '6 asks · 2 auto-allowed',
    '',
    'BY SOURCE',
    'SOURCE  ASKS  AUTO-ALLOWED',
    'guard   3     0',
    'rule    3     0',
    'core    0     2',
    '',
    'BY HEADLINE',
    'ASKS  AUTO  HEADLINE',
    `2     0     ${DELETE}`,
    `2     0     ${PUSH}`,
    `1     0     ${SAVE}`,
    `1     0     ${GUARD}`,
    '0     2     Writes .claude/skills/x/SKILL.md',
    '',
    'THE TARGET: asks other than push and publish',
    '3 asks outside the list:',
    'AT                PROJECT   SOURCE  ANSWER  HEADLINE',
    `2026-10-12 09:10  shop      guard   refuse  ${GUARD}`,
    `2026-10-13 10:02  flow-dev  guard   refuse  ${DELETE}`,
    `2026-10-13 10:03  flow-dev  guard   note    ${DELETE}`,
    '',
  ].join('\n'));
});

test('a session is found by the start of its id', () => {
  const result = permissions(both(), ['17da']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.strictEqual(result.stdout, [
    'permission log: 6 lines, 1 skipped (did not parse)',
    '4 asks · 2 auto-allowed',
    '',
    'BY SOURCE',
    'SOURCE  ASKS  AUTO-ALLOWED',
    'guard   2     0',
    'rule    2     0',
    'core    0     2',
    '',
    'BY HEADLINE',
    'ASKS  AUTO  HEADLINE',
    `2     0     ${DELETE}`,
    `1     0     ${PUSH}`,
    `1     0     ${SAVE}`,
    '0     2     Writes .claude/skills/x/SKILL.md',
    '',
    'THE TARGET: asks other than push and publish',
    '2 asks outside the list:',
    'AT                PROJECT   SOURCE  ANSWER  HEADLINE',
    `2026-10-13 10:02  flow-dev  guard   refuse  ${DELETE}`,
    `2026-10-13 10:03  flow-dev  guard   note    ${DELETE}`,
    '',
  ].join('\n'));
});

test('a project narrows the counts, and one ask outside the target reads in the singular', () => {
  const result = permissions(both(), ['--project', 'shop']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.strictEqual(result.stdout, [
    'permission log: 2 lines, 1 skipped (did not parse)',
    '2 asks · 0 auto-allowed',
    '',
    'BY SOURCE',
    'SOURCE  ASKS  AUTO-ALLOWED',
    'guard   1     0',
    'rule    1     0',
    'core    0     0',
    '',
    'BY HEADLINE',
    'ASKS  AUTO  HEADLINE',
    `1     0     ${PUSH}`,
    `1     0     ${GUARD}`,
    '',
    'THE TARGET: asks other than push and publish',
    '1 ask outside the list:',
    'AT                PROJECT  SOURCE  ANSWER  HEADLINE',
    `2026-10-12 09:10  shop     guard   refuse  ${GUARD}`,
    '',
  ].join('\n'));
});

test('a date range keeps both ends, whatever order the lines sit in', () => {
  const env = both();
  const header = (args) => permissions(env, args).stdout.split('\n')[0];
  assert.strictEqual(header(['--since', '2026-10-13']), 'permission log: 4 lines, 1 skipped (did not parse)');
  assert.strictEqual(header(['--until', '2026-09-30']), 'permission log: 2 lines, 1 skipped (did not parse)');
  assert.strictEqual(header(['--since', '2026-10-12', '--until', '2026-10-12']), 'permission log: 2 lines, 1 skipped (did not parse)');
});

test('a session with no lines prints that plainly', () => {
  const result = permissions(both(), ['zzzz']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.strictEqual(result.stdout, [
    'permission log: 0 lines, 1 skipped (did not parse)',
    '0 asks · 0 auto-allowed',
    '',
    'THE TARGET: asks other than push and publish',
    '0 asks other than push and publish.',
    '',
  ].join('\n'));
});

test('a build with only a push ask meets the target', () => {
  const env = roots('audit-permissions-clean', {
    '2026-10.jsonl': [
      line('2026-10-13T10:00:00Z', 'shop', 'aa11bb22', 'rule', PUSH, 'allow', 'Bash(git push *)'),
      line('2026-10-13T10:01:00Z', 'shop', 'aa11bb22', 'core', 'Writes .claude/skills/x/SKILL.md', 'auto-allow'),
    ],
  });
  const result = permissions(env);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /^1 ask · 1 auto-allowed$/m);
  assert.match(result.stdout, /^0 asks other than push and publish\.$/m);
  assert.doesNotMatch(result.stdout, /outside the list/);
});

test('--limit cuts the headlines and the asks outside the target, and says how many there are', () => {
  const result = permissions(both(), ['--limit', '1']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /^1 of 5 headlines shown\. --limit 5 for all\.$/m);
  assert.match(result.stdout, /^1 of 3 shown\. --limit 3 for all\.$/m);
});

test('a missing log folder is an error, never a count of 0', () => {
  const env = roots('audit-permissions-missing', {});
  const result = permissions(env);
  assert.notStrictEqual(result.code, 0);
  assert.match(result.stderr, /no permission log at /);
  assert.strictEqual(result.stdout, '');
});
