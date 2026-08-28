'use strict';
/**
 * `flow` — the ticket lifecycle, end to end against a real folder on disk.
 *
 * One walk rather than many isolated assertions: a ticket is created, listed,
 * moved through two statuses and archived, and every step reads the state the
 * step before it wrote. A break anywhere in the chain fails here.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, flow } = require('./helpers/scratch');

test('a ticket is created, moved and archived', () => {
  const dir = project('flow-lifecycle');

  const made = flow(dir, ['new', 'Split the parser', '--type', 'chore']);
  assert.strictEqual(made.code, 0, made.stderr);

  const folders = fs.readdirSync(path.join(dir, 'docs', 'tickets'));
  assert.strictEqual(folders.length, 1);
  const id = folders[0].split('-')[0];
  assert.match(id, /^t\d+$/);

  const listed = flow(dir, ['ls']);
  assert.strictEqual(listed.code, 0, listed.stderr);
  assert.match(listed.stdout, /Split the parser/);

  assert.strictEqual(flow(dir, ['build', id]).code, 0);
  const shown = flow(dir, [id]);
  assert.match(shown.stdout, /building/);

  assert.strictEqual(flow(dir, ['done', id]).code, 0);
  assert.ok(
    fs.existsSync(path.join(dir, 'docs', 'tickets', 'archive')),
    'a closed ticket moves to docs/tickets/archive/'
  );
});

test('an id that does not exist fails rather than printing nothing', () => {
  const dir = project('flow-missing');
  const result = flow(dir, ['t999']);
  assert.notStrictEqual(result.code, 0);
  assert.match(result.stdout + result.stderr, /t999/);
});

test('--help prints the surface without needing a project', () => {
  const dir = project('flow-help');
  const result = flow(dir, ['--help']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /flow new/);
  assert.match(result.stdout, /flow next/);
});
