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
const { REPO, project, run, setupMachine, utilStub, pathWith } = require('./helpers/scratch');
const version = require('../flow/lib/version');

/** A scratch machine: installed under one root in tmp/, settings merged by hand. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const home = path.join(root, '.claude');
  const flowHome = path.join(root, '.flow');

  const installed = run('flow/flow.js', ['install', '--root', root, '--no-bin']);
  assert.strictEqual(installed.code, 0, installed.stderr);

  // Install is half a machine. The rule file and its 2 ways in come from
  // /flow:setup-machine, which does not exist as a skill yet.
  setupMachine(root);

  // `flow install` stops short of settings.json on purpose, so the merge a real
  // machine does by hand happens here, with the hook paths pointed at this tree.
  const template = fs.readFileSync(path.join(REPO, 'home', 'settings.json'), 'utf8');
  fs.writeFileSync(
    path.join(home, 'settings.json'),
    template.split('$HOME/.flow').join(flowHome)
  );

  return { dir, root, home, flowHome };
}

/** Doctor against a scratch machine, with a stub util in front of the real PATH. */
function doctor(m, { bin, utilHome, inProject } = {}) {
  const env = { ...process.env };
  if (bin) env.PATH = pathWith(bin);
  if (utilHome) env.UTIL_HOME = utilHome;
  // Without this, doctor resolves the Flow repo itself, which has no .flow/,
  // and reports on the machine alone.
  if (inProject) env.FLOW_PROJECT = inProject;
  const args = ['doctor', '--root', m.root, '--no-bin', '--no-tests'];
  return run('flow/flow.js', args, { env });
}

test('a fresh install passes every check', () => {
  const m = machine('doctor-clean');
  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 0, report.stdout + report.stderr);
  assert.match(report.stdout, /nothing to fix\./);
  assert.match(report.stdout, /util: fs tree, fs merge, fs open all run/);
  assert.match(report.stdout, /12 hooks registered, every file they name on disk, sessions start in "default" mode/);
});

test('a machine with nothing installed says so once, rather than failing every check', () => {
  const dir = project('doctor-bare');
  const report = run('flow/flow.js', ['doctor', '--root', path.join(dir, 'root'), '--no-bin']);

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /Flow is not installed here/);
  assert.doesNotMatch(report.stdout, /^fail/m, 'the empty case is one message, not 20 failures');
});

test('a run that stopped part-way is reported first, and names both ways out', () => {
  const m = machine('doctor-run');

  // What /flow:migrate leaves behind when it stops: the step it finished, and
  // the migration folder it opened. Nothing writes this file yet, so the shape
  // is the one `lib/migrations.js` documents.
  fs.writeFileSync(path.join(m.flowHome, 'run.json'), JSON.stringify({
    started: '2026-09-20T10:12:40',
    type: 'migrate',
    migration: 'machine/2026-09-20T10-12-40',
    step: 4,
  }));

  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 1);
  assert.strictEqual(report.stdout.split('\n')[0], 'fail  run.json:', 'it comes before every other check');
  assert.match(report.stdout, /a migrate run stopped after step 4, started 2026-09-20T10:12:40/);
  assert.match(report.stdout, /carry on: open a session and type \/flow:migrate/);
  assert.match(report.stdout, /go back: type flow restore machine/);
});

test('a machine behind the changelog is a note, and one above it fails', () => {
  const m = machine('doctor-version');
  const bin = utilStub(m.dir);
  const stamp = path.join(m.flowHome, 'version');
  const newest = version.newest(REPO);

  fs.writeFileSync(stamp, `${newest - 1}\n`);
  const behind = doctor(m, { bin });
  assert.strictEqual(behind.code, 0, 'being behind still leaves a machine that works');
  assert.match(behind.stdout, new RegExp(`this machine is at entry ${newest - 1}, 1 entry behind the changelog: run flow up`));

  fs.writeFileSync(stamp, `${newest + 5}\n`);
  const ahead = doctor(m, { bin });
  assert.strictEqual(ahead.code, 1, 'only a clone that moved backwards puts a machine above the newest entry');
  assert.match(ahead.stdout, /so the clone moved backwards/);

  // The file held a date until 2026-09-20. A machine stamped then reads as a
  // file somebody else wrote, rather than as a number to compare.
  fs.writeFileSync(stamp, '2026-09-20\n');
  const dated = doctor(m, { bin });
  assert.strictEqual(dated.code, 1);
  assert.match(dated.stdout, /holds "2026-09-20", and it holds one changelog entry number and nothing else/);
});

test('a project behind the machine it sits on is named, and the clone is not fetched by default', () => {
  const m = machine('doctor-project-version');
  const newest = version.newest(REPO);
  fs.writeFileSync(path.join(m.dir, '.flow', 'version'), `${newest - 1}\n`);

  const report = doctor(m, { bin: utilStub(m.dir), inProject: m.dir });

  assert.strictEqual(report.code, 0, 'a project a migration never reached still works');
  assert.match(report.stdout, new RegExp(`${path.basename(m.dir)} is at entry ${newest - 1} and this machine is at ${newest}`));
  assert.match(report.stdout, /run flow up inside it/);

  // The tag comparison is the one check that goes to the network, so nothing
  // here reaches it. --updates is proved by typing it.
  assert.match(report.stdout, /the remote is not read without --updates/);
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

// Step 0 of a setup or a migration, on a machine Flow is not on yet. The
// whole report would refuse such a machine, so this flag has to skip it.
test('--prereq checks what Flow calls and nothing Flow installs', () => {
  const dir = project('doctor-prereq');
  const at = (bin, extra = {}) => run('flow/flow.js', ['doctor', '--prereq'], {
    env: { ...process.env, PATH: pathWith(bin), ...extra },
  });

  const ok = at(utilStub(dir));
  assert.strictEqual(ok.code, 0, ok.stderr);
  assert.match(ok.stdout, /ok {4}programs: node, git, claude all resolve/);
  assert.match(ok.stdout, /ok {4}util: fs tree, fs merge, fs open all run/);
  assert.ok(!/skills|hooks|settings|version/.test(ok.stdout), `an install check ran anyway:\n${ok.stdout}`);

  const utilHome = path.join(dir, 'util-home');
  fs.mkdirSync(utilHome, { recursive: true });
  const broken = at(utilStub(dir, { works: false }), { UTIL_HOME: utilHome });
  assert.strictEqual(broken.code, 1, 'a skill reads the exit code and stops');
  assert.match(broken.stdout, /util fs tree does not run/);
  assert.match(broken.stdout, /no source is registered: run util install/);
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
  assert.match(report.stdout, /AGENTS\.md is not linked: type \/flow:setup-machine/);
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
