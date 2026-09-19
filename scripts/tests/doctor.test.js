'use strict';
/**
 * `flow doctor`: a real install, verified, then broken in every way it checks.
 *
 * Every check runs against a scratch machine built by `flow install` itself,
 * rather than a second arrangement assembled here. A test that builds its own
 * idea of an installed machine passes while the real install writes something
 * else entirely.
 *
 * `util` is a stub on PATH. What is under test is the probe doctor makes, not
 * util's own commands, and the real clone is a submodule that a fresh checkout
 * may not have.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { REPO, project, run } = require('./helpers/scratch');

/** A scratch machine: installed under one root in tmp/, settings merged by hand. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const home = path.join(root, '.claude');
  const flowHome = path.join(root, '.flow');

  const installed = run('flow/flow.js', ['install', '--root', root, '--no-bin']);
  assert.strictEqual(installed.code, 0, installed.stderr);

  // `flow install` stops short of settings.json on purpose, so the merge a real
  // machine does by hand happens here, with the hook paths pointed at this tree.
  const template = fs.readFileSync(path.join(REPO, 'home', 'settings.json'), 'utf8');
  fs.writeFileSync(
    path.join(home, 'settings.json'),
    template.split('$HOME/.flow').join(flowHome)
  );

  return { dir, root, home, flowHome };
}

/** A util on PATH answering the 3 commands Flow calls, or refusing every one. */
function utilStub(dir, { works = true } = {}) {
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  const file = path.join(bin, 'util');
  fs.writeFileSync(file, works
    ? '#!/usr/bin/env bash\ncase "$1 $2" in\n  "fs tree"|"fs merge"|"fs open") exit 0 ;;\nesac\nexit 1\n'
    : '#!/usr/bin/env bash\nexit 1\n');
  fs.chmodSync(file, 0o755);
  return bin;
}

/** Doctor against a scratch machine, with a stub util in front of the real PATH. */
function doctor(m, { bin, utilHome } = {}) {
  const env = { ...process.env };
  if (bin) env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;
  if (utilHome) env.UTIL_HOME = utilHome;
  const args = ['doctor', '--root', m.root, '--no-bin', '--no-tests'];
  return run('flow/flow.js', args, { env });
}

test('a fresh install passes every check', () => {
  const m = machine('doctor-clean');
  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 0, report.stdout + report.stderr);
  assert.match(report.stdout, /nothing to fix\./);
  assert.match(report.stdout, /util: fs tree, fs merge, fs open all run/);
  assert.match(report.stdout, /11 hooks registered, every file they name on disk, sessions start in "default" mode/);
});

test('a machine with nothing installed says so once, rather than failing every check', () => {
  const dir = project('doctor-bare');
  const report = run('flow/flow.js', ['doctor', '--root', path.join(dir, 'root'), '--no-bin']);

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /Flow is not installed here/);
  assert.doesNotMatch(report.stdout, /^fail/m, 'the empty case is one message, not 20 failures');
});

test('a missing link, a missing hook, a stale override and a dead path are each named', () => {
  const m = machine('doctor-broken');

  // Named off the tree rather than written in: a skill gets renamed, and a test
  // naming one by hand starts passing for the wrong reason on the day it does.
  const linked = path.join(m.root, '.agents', 'skills', 'flow', 'skills');
  const [skill] = fs.readdirSync(linked).sort();
  fs.unlinkSync(path.join(linked, skill));

  const settingsFile = path.join(m.home, 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  delete settings.hooks.InstructionsLoaded;
  settings.skillOverrides[skill] = 'off';
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));

  const references = path.join(m.flowHome, 'references');
  fs.unlinkSync(references);
  fs.symlinkSync(path.join(m.dir, 'gone'), references);

  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, new RegExp(`skills/${skill} is not linked: run flow install`));
  assert.match(report.stdout, /no InstructionsLoaded hook running instructions-loaded\.js/);
  assert.match(report.stdout, new RegExp(`skillOverrides names "${skill}", a Flow skill, and does nothing`));
  assert.match(report.stdout, /references points at .*gone, which is gone/);
});

test('a settings.json with no starting mode fails, and one starting in another mode gets a note', () => {
  const m = machine('doctor-mode');
  const settingsFile = path.join(m.home, 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  const bin = utilStub(m.dir);

  delete settings.permissions.defaultMode;
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  const missing = doctor(m, { bin });

  assert.strictEqual(missing.code, 1);
  assert.match(missing.stdout, /permissions\.defaultMode is not set, so a session on a Pro, Max or Team plan starts in auto mode/);

  settings.permissions.defaultMode = 'auto';
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  const chosen = doctor(m, { bin });

  assert.strictEqual(chosen.code, 0, chosen.stdout + chosen.stderr);
  assert.match(chosen.stdout, /note  settings\.json: permissions\.defaultMode is "auto", and Flow's template starts every session in "default"/);
});

test('a util that does not run is diagnosed against its source registry', () => {
  const m = machine('doctor-util');
  const utilHome = path.join(m.dir, 'util-home');
  fs.mkdirSync(utilHome, { recursive: true });

  const report = doctor(m, { bin: utilStub(m.dir, { works: false }), utilHome });

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /util fs open does not run, and it is called by flow get --files/);
  assert.match(report.stdout, /no source is registered: run util install/);
});

test('a CLAUDE.md with no import, a missing Codex link and an override file are each named', () => {
  const m = machine('doctor-rules');

  fs.writeFileSync(path.join(m.home, 'CLAUDE.md'), 'My own rules.\n');
  fs.unlinkSync(path.join(m.root, '.codex', 'AGENTS.md'));
  fs.writeFileSync(path.join(m.root, '.codex', 'AGENTS.override.md'), 'Other rules.\n');

  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /CLAUDE\.md does not import the rules/);
  assert.match(report.stdout, /AGENTS\.md is not linked: run flow install/);
  assert.match(report.stdout, /AGENTS\.override\.md exists, and Codex reads it in place of AGENTS\.md/);
});

test('a plugin folder reached through a broken link is named', () => {
  const m = machine('doctor-plugin-link');

  const pluginLink = path.join(m.home, 'skills', 'flow');
  fs.unlinkSync(pluginLink);
  fs.symlinkSync(path.join(m.dir, 'gone'), pluginLink);

  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /skills\/flow points at .*gone, which is gone/);
});
