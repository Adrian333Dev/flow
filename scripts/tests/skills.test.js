'use strict';
/**
 * `flow skills` and `flow install` — the list, the links, and what happens when
 * a list names a skill that is gone.
 *
 * Every install here targets a scratch folder and passes --no-bin. A test that
 * wrote into ~/.claude or ~/.local/bin would install Flow on the machine
 * running it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow, REPO } = require('./helpers/scratch');

const linkTarget = (p) => fs.readlinkSync(p);

test('every skill lists, and every one of them is global', () => {
  const dir = project('skills-walk');

  const listed = flow(dir, ['skills', 'ls']);
  assert.strictEqual(listed.code, 0, listed.stderr);
  assert.match(listed.stdout, /groundwork\s+phases\s+global/);
  assert.match(listed.stdout, /web-pages\s+stack\s+global/, 'a stack skill installs like the rest');
  assert.ok(!/\s-\s*$/m.test(listed.stdout), 'no skill is left uninstalled');
});

// Every Flow skill is global, so `add` refuses all 12 and the message has to
// point at what does change a project: skillOverrides, which is not a link.
test('a global name refuses in a project, and says what to set instead', () => {
  const dir = project('skills-global-clash');
  const result = flow(dir, ['skills', 'add', 'web-pages']);
  assert.notStrictEqual(result.code, 0);
  assert.match(result.stderr, /already installed globally/);
  assert.match(result.stderr, /skillOverrides/);
});

test('sync warns about a name whose skill is gone, and links the rest', () => {
  const dir = project('skills-stale-name');
  write(dir, '.claude/flow/skills', 'web-pages\nwrite-tickets\n');

  const result = flow(dir, ['skills', 'sync']);
  assert.strictEqual(result.code, 0, 'one stale line never blocks a clone');
  assert.match(result.stdout, /linked: web-pages/);
  assert.match(result.stderr, /"write-tickets".*no skill has that name/);
});

test('an unknown skill name fails and says where to look', () => {
  const dir = project('skills-unknown');
  const result = flow(dir, ['skills', 'get', 'nonesuch']);
  assert.notStrictEqual(result.code, 0);
  assert.match(result.stderr, /no skill named "nonesuch"/);
  assert.match(result.stderr, /flow skills ls/);
});

test('install builds a whole config, is idempotent, and prunes a dead link', () => {
  const dir = project('install-home');
  const home = path.join(dir, 'home');

  const first = flow(dir, ['install', '--home', home, '--no-bin']);
  assert.strictEqual(first.code, 0, first.stderr);

  assert.strictEqual(
    linkTarget(path.join(home, 'skills', 'groundwork')),
    path.join(REPO, 'skills', 'phases', 'groundwork')
  );
  assert.strictEqual(linkTarget(path.join(home, 'scripts')), path.join(REPO, 'scripts'));
  assert.strictEqual(
    linkTarget(path.join(home, 'flow', 'references')),
    path.join(REPO, 'references')
  );
  assert.strictEqual(
    linkTarget(path.join(home, 'skills', 'start')),
    path.join(REPO, 'skills', 'commands', 'start'),
    'a typed-only skill installs like any other'
  );
  assert.strictEqual(
    linkTarget(path.join(home, 'skills', 'web-pages')),
    path.join(REPO, 'skills', 'stack', 'web-pages'),
    'every skill installs, including the one most projects never show the model'
  );
  assert.ok(!fs.existsSync(path.join(home, 'commands')), 'nothing links a commands folder any more');
  assert.ok(fs.existsSync(path.join(home, 'CLAUDE.md')), 'the global rules are copied, not linked');
  assert.match(first.stdout, /merge/, 'settings are left for a human to merge');

  // A skill renamed in the clone leaves a link pointing at nothing.
  fs.symlinkSync(path.join(REPO, 'skills', 'phases', 'write-tickets'),
    path.join(home, 'skills', 'write-tickets'));

  const second = flow(dir, ['install', '--home', home, '--no-bin']);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.match(second.stdout, /unlinked \(gone\): skills\/write-tickets/);
  assert.ok(fs.existsSync(path.join(home, 'skills', 'groundwork')), 'still linked after a re-run');
  assert.match(second.stdout, /kept: CLAUDE.md/, 'a CLAUDE.md already there is never overwritten');
});

test('install never reaches outside the folder it was given', () => {
  const dir = project('install-scoped');
  const home = path.join(dir, 'home');
  flow(dir, ['install', '--home', home, '--no-bin']);

  const reached = fs.readdirSync(dir).sort();
  assert.deepStrictEqual(reached, ['home'], 'nothing lands beside the target config');
});
