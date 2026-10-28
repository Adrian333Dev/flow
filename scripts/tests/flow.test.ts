/**
 * `flow`: the ticket lifecycle, end to end against a real folder on disk.
 *
 * One walk rather than many isolated assertions: a ticket is created, listed,
 * moved through two statuses and archived, and every step reads the state the
 * step before it wrote. A break anywhere in the chain fails here.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, flow } from '../shared/testing.ts';
import { SHORT } from '../shared/cli.ts';

test('a ticket is created, moved and archived', () => {
  const dir = project('flow-lifecycle');

  const made = flow(dir, ['tickets', 'new', 'Split the parser']);
  assert.strictEqual(made.code, 0, made.stderr);

  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets'));
  assert.strictEqual(folders.length, 1);
  const id = `exp-${folders[0].match(/\d+/)![0]}`;
  assert.match(id, /^exp-\d+$/);

  const listed = flow(dir, ['tickets']);
  assert.strictEqual(listed.code, 0, listed.stderr);
  assert.match(listed.stdout, /exp-1-split-the-parser/);

  assert.strictEqual(flow(dir, ['tickets', 'start', id]).code, 0);
  const shown = flow(dir, ['tickets', 'get', id]);
  assert.match(shown.stdout, /in-progress/);

  assert.strictEqual(flow(dir, ['tickets', 'done', id]).code, 0);
  assert.ok(
    fs.existsSync(path.join(dir, '.flow', 'tickets', 'archive')),
    'a closed ticket moves to .flow/tickets/archive/'
  );
});

test('an id that does not exist fails rather than printing nothing', () => {
  const dir = project('flow-missing');
  const result = flow(dir, ['tickets', 'get', 'exp-999']);
  assert.notStrictEqual(result.code, 0);
  assert.match(result.stdout + result.stderr, /exp-999/);
});

test('a name is typed in full, never matched by its first letters', () => {
  const dir = project('flow-names');

  // No prefix matching anywhere: "ne" starts new and next and reaches neither,
  // so it is an unknown command.
  const short = flow(dir, ['ne']);
  assert.strictEqual(short.code, 1);
  assert.match(short.stderr, /^flow: unknown command "ne"\./);
  const verb = flow(dir, ['tickets', 'ne']);
  assert.strictEqual(verb.code, 1);
  assert.match(verb.stderr, /^flow: unknown command "tickets ne"\.\nflow tickets: /, 'the noun\'s help follows');
});

test('each noun typed alone lists, and bare flow prints the help', () => {
  const dir = project('flow-nouns');
  for (const noun of ['tickets', 'notes', 'settings', 'scorecard']) {
    const listed = flow(dir, [noun]);
    assert.strictEqual(listed.code, 0, `${noun}: ${listed.stderr}`);
    assert.doesNotMatch(listed.stderr, /unknown command/, noun);
  }
  // With no index yet, audit's list runs and asks for one.
  assert.match(flow(dir, ['audit']).stderr, /no audit index at .*Run flow audit index/s);
  const bare = flow(dir, []);
  assert.strictEqual(bare.code, 0, bare.stderr);
  assert.match(bare.stdout, /flow tickets new/);
});

test('every short form is unique, and none takes -h from help', () => {
  const forms = Object.values(SHORT);
  assert.strictEqual(new Set(forms).size, forms.length, 'two flags share a short form');
  assert.ok(!forms.includes('h'));
  for (const form of forms) assert.match(form, /^[a-z]{1,3}$/, form);

  // A known short form on a command without its flag names the long one.
  const wrong = flow(project('flow-short-wrong'), ['tickets', '-pa', 'exp-1']);
  assert.strictEqual(wrong.code, 1);
  assert.match(wrong.stderr, /flow tickets takes no --parent \(-pa\)/);
});

test('--help prints the surface without needing a project', () => {
  const dir = project('flow-help');
  const result = flow(dir, ['--help']);
  assert.strictEqual(result.code, 0, result.stderr);
  assert.match(result.stdout, /flow tickets new/);
  assert.match(result.stdout, /flow next/);
  assert.doesNotMatch(result.stdout, /flow scorecard/, 'paused until fw-308, and still runs when typed');
  assert.doesNotMatch(result.stdout, /--root|--no-bin|--no-clone|--tests/, 'hidden from a person, still run by tests and skills');
});

test('--help after a command prints that command alone, and runs nothing', () => {
  const dir = project('flow-command-help');
  const next = flow(dir, ['next', '--help']);
  assert.strictEqual(next.code, 0, next.stderr);
  assert.match(next.stdout, /^flow next +what to work on: the work started, then what could start\n +\[-al, --all\] \[-p, --project <prefix>\]\n$/);

  const on = flow(dir, ['settings', 'on', '-h']);
  assert.match(on.stdout, /^flow settings on <name> /);

  const made = flow(dir, ['tickets', 'new', 'Never made', '--help']);
  assert.match(made.stdout, /^flow tickets new /);
  assert.doesNotMatch(flow(dir, ['tickets']).stdout, /Never made/);
});
