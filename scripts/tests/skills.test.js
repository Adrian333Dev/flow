'use strict';
/**
 * `flow skills` and `flow install`: what installs, and what a session is shown.
 *
 * Every install here targets a scratch folder and passes --no-bin. A test that
 * wrote into ~/.claude, ~/.flow or ~/.local/bin would install Flow on the
 * machine running it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, run, flow, REPO } = require('./helpers/scratch');

const linkTarget = (p) => fs.readlinkSync(p);

/** `flow` with both config roots pointed at scratch folders. */
const skillsLs = (dir, configDir, args = []) => run('flow/flow.js', ['skills', 'ls', ...args], {
  cwd: dir,
  env: { ...process.env, FLOW_PROJECT: dir, CLAUDE_CONFIG_DIR: configDir },
});

test('a skill lists with its state, and a project overrides the machine', () => {
  const dir = project('skills-state');
  const configDir = path.join(dir, 'config');
  write(dir, 'config/settings.json', JSON.stringify({ skillOverrides: { 'web-pages': 'off' } }));

  const machineOff = skillsLs(dir, configDir);
  assert.strictEqual(machineOff.code, 0, machineOff.stderr);
  assert.match(machineOff.stdout, /web-pages\s+stack\s+off\s+machine/);
  assert.match(machineOff.stdout, /groundwork\s+phases\s+on\s+default/,
    'a skill nobody names is on');

  // A project setting `on` restores a skill the machine turned off. The two
  // objects merge key by key, which is what makes stack-off-by-default usable.
  write(dir, '.claude/settings.json', JSON.stringify({ skillOverrides: { 'web-pages': 'on' } }));

  const projectOn = skillsLs(dir, configDir);
  assert.match(projectOn.stdout, /web-pages\s+stack\s+on\s+project/);
  assert.match(projectOn.stdout, /groundwork\s+phases\s+on\s+default/,
    'a skill the project never names keeps the machine answer');
});

test('--group and --hidden narrow the list', () => {
  const dir = project('skills-filters');
  const configDir = path.join(dir, 'config');
  write(dir, 'config/settings.json', JSON.stringify({ skillOverrides: { 'web-pages': 'off' } }));

  const oneGroup = skillsLs(dir, configDir, ['--group', 'stack']);
  assert.strictEqual(oneGroup.code, 0, oneGroup.stderr);
  assert.match(oneGroup.stdout, /web-pages\s+stack/);
  assert.ok(!/groundwork/.test(oneGroup.stdout), '--group drops every other group');

  // A skill the session is already shown needs no listing; --hidden is the
  // question "what else exists", which is the only one worth a command.
  const hidden = skillsLs(dir, configDir, ['--hidden']);
  assert.match(hidden.stdout, /web-pages\s+stack\s+off\s+machine/);
  assert.ok(!/groundwork/.test(hidden.stdout), '--hidden drops what is on');

  // Both together, and the empty result says so rather than printing a header.
  const none = skillsLs(dir, configDir, ['--group', 'phases', '--hidden']);
  assert.strictEqual(none.code, 0, none.stderr);
  assert.match(none.stdout, /no skills match/);

  // A group that does not exist refuses, naming the ones that do. A silent
  // empty list here reads exactly like a group with nothing in it.
  const bad = skillsLs(dir, configDir, ['--group', 'nope']);
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /unknown group "nope"/);
  assert.match(bad.stderr, /phases/);
});

// The one behaviour that needs a skill on disk: a group folder is the whole
// mechanism, so faking it anywhere else would test nothing.
test('a skill in drafts/ neither installs nor reports as installed', () => {
  const dir = project('skills-drafts');
  const home = path.join(dir, 'home');
  const flowHome = path.join(dir, 'flow');
  const draft = path.join(REPO, 'skills', 'drafts', 'test-only-draft');

  fs.mkdirSync(draft, { recursive: true });
  fs.writeFileSync(path.join(draft, 'SKILL.md'),
    '---\nname: test-only-draft\ndescription: A draft written by the test suite.\n---\n');
  try {
    const listed = flow(dir, ['skills', 'ls']);
    assert.match(listed.stdout, /test-only-draft\s+drafts\s+not installed/);

    flow(dir, ['install', '--home', home, '--flow-home', flowHome, '--no-bin']);
    assert.ok(!fs.existsSync(path.join(home, 'skills', 'test-only-draft')),
      'a draft is skipped by the linker');
    assert.ok(fs.existsSync(path.join(home, 'skills', 'groundwork')),
      'every other group still links');

    flow(dir, ['install', '--home', home, '--flow-home', flowHome, '--no-bin', '--drafts']);
    assert.ok(fs.existsSync(path.join(home, 'skills', 'test-only-draft')),
      '--drafts links it, which is what the scratch session passes');
  } finally {
    fs.rmSync(draft, { recursive: true, force: true });
  }
});

test('install builds a whole config, is idempotent, and prunes a dead link', () => {
  const dir = project('install-home');
  const home = path.join(dir, 'home');
  const flowHome = path.join(dir, 'flow');

  const first = flow(dir, ['install', '--home', home, '--flow-home', flowHome, '--no-bin']);
  assert.strictEqual(first.code, 0, first.stderr);

  assert.strictEqual(
    linkTarget(path.join(home, 'skills', 'groundwork')),
    path.join(REPO, 'skills', 'phases', 'groundwork')
  );
  // scripts and references live under the second root: Claude Code reads
  // neither, and the hooks and skills name both by path.
  assert.strictEqual(linkTarget(path.join(flowHome, 'scripts')), path.join(REPO, 'scripts'));
  assert.strictEqual(
    linkTarget(path.join(flowHome, 'references')),
    path.join(REPO, 'references')
  );
  assert.ok(!fs.existsSync(path.join(home, 'scripts')), 'scripts no longer land under ~/.claude');
  assert.strictEqual(
    linkTarget(path.join(home, 'skills', 'start')),
    path.join(REPO, 'skills', 'tools', 'start'),
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

  const second = flow(dir, ['install', '--home', home, '--flow-home', flowHome, '--no-bin']);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.match(second.stdout, /unlinked \(gone\): skills\/write-tickets/);
  assert.ok(fs.existsSync(path.join(home, 'skills', 'groundwork')), 'still linked after a re-run');
  assert.match(second.stdout, /kept: CLAUDE.md/, 'a CLAUDE.md already there is never overwritten');
});

test('install never reaches outside the two roots it was given', () => {
  const dir = project('install-scoped');
  const home = path.join(dir, 'home');
  const flowHome = path.join(dir, 'flow');
  flow(dir, ['install', '--home', home, '--flow-home', flowHome, '--no-bin']);

  // Both roots are asserted, because the install spans both. Checking only
  // --home would pass while every script and reference landed in the real
  // ~/.flow, which is the accident the second flag exists to stop.
  const reached = fs.readdirSync(dir).sort();
  assert.deepStrictEqual(reached, ['flow', 'home'], 'nothing lands beside the two roots');
});

test('install refuses one config root without the other', () => {
  const dir = project('install-half');
  const home = path.join(dir, 'home');

  // The accident this stops: --home alone redirects what Claude Code reads and
  // leaves scripts/ and references/ pointing at the real ~/.flow, so a scratch
  // run installs half of Flow on the machine without saying so.
  const half = flow(dir, ['install', '--home', home, '--no-bin']);
  assert.notStrictEqual(half.code, 0, 'a half-redirected install fails');
  assert.match(half.stderr + half.stdout, /--home was passed without --flow-home/);
  assert.deepStrictEqual(fs.readdirSync(dir), [], 'nothing was written before the refusal');
});
