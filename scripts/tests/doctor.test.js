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
const { REPO, project, run, utilStub, claudeStub, pathWith, bareRepo } = require('./helpers/scratch');
const registry = require('../lib/registry');

/** A scratch machine: installed under one root in tmp/, settings merged by hand. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const home = path.join(root, '.claude');
  const flowHome = path.join(root, '.flow');

  fs.mkdirSync(flowHome, { recursive: true });

  const installed = run('flow.js', ['install', '--root', root, '--no-bin', '--no-clone'], { env: { ...process.env, FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) } });
  assert.strictEqual(installed.code, 0, installed.stderr);

  // The session install owes is finished by hand here too: the marker goes.
  fs.rmSync(path.join(flowHome, 'logs', 'setup-pending'));

  // `flow install` leaves settings.json to the setup session, so the edit that
  // session makes happens here, with the hook paths pointed at this tree.
  const template = fs.readFileSync(path.join(REPO, 'home', 'settings.json'), 'utf8');
  fs.writeFileSync(
    path.join(home, 'settings.json'),
    template.split('$HOME/.flow').join(flowHome)
  );

  // The scratch project is on this machine's list, as a project that wrote a ticket is.
  registry.register(dir, flowHome);

  return { dir, root, home, flowHome };
}

/**
 * Doctor against a scratch machine, with a stub util in front of the real PATH.
 *
 * A stub claude always goes in front too, listing the one plugin a fresh
 * install puts on disk, Flow's own: the skills check asks it, and the real one
 * would read a scratch Claude Code folder it never signed in to.
 */
function doctor(m, { bin, utilHome, inProject } = {}) {
  const env = { ...process.env };
  const claude = claudeStub(m.dir, { list: [{ id: 'flow@skills-dir', scope: 'user', enabled: true }] });
  env.PATH = pathWith(bin ? `${claude}${path.delimiter}${bin}` : claude);
  if (utilHome) env.UTIL_HOME = utilHome;
  // Without this, doctor asks git, which finds Flow's own repo around tmp/ and
  // reads its real tickets.
  env.FLOW_PROJECT = inProject || m.dir;
  const args = ['doctor', '--root', m.root, '--no-bin'];
  return run('flow.js', args, { cwd: m.dir, env });
}

test('a fresh install passes every check', () => {
  const m = machine('doctor-clean');
  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 0, report.stdout + report.stderr);
  assert.match(report.stdout, /nothing to fix\./);
  assert.match(report.stdout, /util: fs tree runs/);
  assert.match(report.stdout, /^ok {4}projects: exp .*doctor-clean$/m);
  assert.match(report.stdout, /18 hooks registered, every file they name on disk, sessions start in "acceptEdits" mode/);
});

test('a machine with nothing installed says so once, rather than failing every check', () => {
  const dir = project('doctor-bare');
  const report = run('flow.js', ['doctor', '--root', path.join(dir, 'root'), '--no-bin']);

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /Flow is not installed here/);
  assert.doesNotMatch(report.stdout, /^fail/m, 'the empty case is one message, not 20 failures');
});

test('a background job whose last run failed is named until the same job works', () => {
  const failures = require('../lib/logs/failures');
  const m = machine('doctor-issues');
  failures.record(m.flowHome, { source: 'records', what: 'sync ~/.flow', job: 'sync ~/.flow', error: 'another machine changed the same lines' });

  const report = doctor(m, { bin: utilStub(m.dir) });
  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /^fail {2}issues:\n {8}sync ~\/\.flow: failed since \d{4}-\d\d-\d\d \d\d:\d\d\. another machine changed the same lines$/m);

  failures.cleared(m.flowHome, 'sync ~/.flow');
  assert.match(doctor(m, { bin: utilStub(m.dir) }).stdout, /^ok {4}issues: every job running in the background worked last time$/m);
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
  settings.skillOverrides = { [skill]: 'off' };
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

test('a synced skill with no skillOverrides entry is named, and any entry settles it', () => {
  const m = machine('doctor-synced');
  const bin = utilStub(m.dir);
  fs.mkdirSync(path.join(m.home, 'skills', 'synced', 'acct', 'new-skill'), { recursive: true });
  fs.writeFileSync(path.join(m.home, 'skills', 'synced', 'acct', '.last-complete-round'), '1');

  const report = doctor(m, { bin });
  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /the synced skill "new-skill" has no skillOverrides entry.*add "new-skill": "off" to skillOverrides/);
  assert.doesNotMatch(report.stdout, /last-complete-round/);

  const settingsFile = path.join(m.home, 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  settings.skillOverrides = { 'new-skill': 'on' };
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  assert.doesNotMatch(doctor(m, { bin }).stdout, /the synced skill/);
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
  assert.match(chosen.stdout, /note  settings\.json: permissions\.defaultMode is "auto", and Flow's template starts every session in "acceptEdits"/);
});

test('a ticket still in the old format is named, and a current one is not', () => {
  const m = machine('doctor-tickets');
  const bin = utilStub(m.dir);
  const tickets = path.join(m.dir, '.flow', 'tickets');
  const ticket = (folder, title, labels) => {
    fs.mkdirSync(path.join(tickets, folder), { recursive: true });
    fs.writeFileSync(path.join(tickets, folder, 'ticket.md'),
      `---\nid: ${folder.match(/\d+/)[0]}\ntitle: ${title}\ndescription: "x: y"\nstatus: todo\nlabels: [${labels}]\n---\n\nbody\n`);
  };
  const template = '# {{title}}: groundwork\n\n<!-- Empty until this ticket is picked up.\n\n     - [ ] 0: A Group Of Questions\n     -->\n';

  ticket('1', 'login-loop', 'bug');
  fs.mkdirSync(path.join(tickets, '1', 'groundwork'));
  fs.writeFileSync(path.join(tickets, '1', 'groundwork', 'map.md'), `${template}\n## 1. A real decision\n\nKept.\n`);
  const clean = doctor(m, { bin });
  assert.strictEqual(clean.code, 0, clean.stdout);
  assert.match(clean.stdout, /^ok {4}tickets: 1 ticket in the current format$/m);

  ticket('2-old-words', 'old-words', 'chore');
  ticket('3', 'feature', 'feature');
  fs.mkdirSync(path.join(tickets, '3', 'groundwork'));
  fs.writeFileSync(path.join(tickets, '3', 'groundwork', 'map.md'), template);

  const old = doctor(m, { bin });
  assert.strictEqual(old.code, 1);
  assert.match(old.stdout, /2-old-words is in a folder not named by its number: rename the folder to 2/);
  assert.match(old.stdout, /exp-3 holds a groundwork\/map\.md that is only the empty template: delete it/);
  assert.match(old.stdout, /exp-3 is titled "feature", a label and no name: flow edit exp-3 --title/);
  assert.doesNotMatch(old.stdout, /exp-1 /, 'a map holding a decision is not the template');
});

// On a machine Flow is not on yet. The whole report would refuse such a
// machine, so this flag has to skip it.
test('--prereq checks what Flow calls and nothing Flow installs', () => {
  const dir = project('doctor-prereq');
  const at = (bin, extra = {}) => run('flow.js', ['doctor', '--prereq'], {
    env: { ...process.env, PATH: pathWith(bin), ...extra },
  });

  const ok = at(utilStub(dir));
  assert.strictEqual(ok.code, 0, ok.stderr);
  assert.match(ok.stdout, /ok {4}programs: node, git, claude, gh all resolve/);
  assert.ok(!/util|skills|hooks|settings|version/.test(ok.stdout), `an install check ran anyway:\n${ok.stdout}`);

  const broken = at(dir, { PATH: path.join(dir, 'nothing-here') });
  assert.strictEqual(broken.code, 1, 'a skill reads the exit code and stops');
  assert.match(broken.stdout, /git is not on PATH, and a project is found by asking git for its root/);
});

// The README names the same floor.
test('--prereq refuses a Claude Code older than the release Flow needs', () => {
  const dir = project('doctor-claude-release');
  const claudeAt = (release) => {
    const bin = path.join(dir, `bin-${release}`);
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(path.join(bin, 'claude'), `#!/usr/bin/env bash\necho "${release} (Claude Code)"\n`);
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    return run('flow.js', ['doctor', '--prereq'], {
      env: { ...process.env, PATH: `${bin}${path.delimiter}${pathWith(utilStub(dir))}` },
    });
  };

  const old = claudeAt('2.1.99');
  assert.strictEqual(old.code, 1, old.stdout);
  assert.match(old.stdout, /Claude Code 2\.1\.99 is older than 2\.1\.287, the oldest release Flow runs on: run claude update/);

  const current = claudeAt('2.1.287');
  assert.strictEqual(current.code, 0, current.stdout);
  assert.match(current.stdout, /claude code: 2\.1\.287, and Flow needs 2\.1\.287 or later/);
});

test('a util that does not run is diagnosed against its source registry', () => {
  const m = machine('doctor-util');
  const utilHome = path.join(m.dir, 'util-home');
  fs.mkdirSync(utilHome, { recursive: true });

  const report = doctor(m, { bin: utilStub(m.dir, { works: false }), utilHome });

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /util fs tree does not run, and it is called by home\/CLAUDE\.md, in tree-for-structure/);
  assert.match(report.stdout, /no source is registered: run flow install/);
});

test('a util run the system kills before it exits is retried, never counted', () => {
  const m = machine('doctor-util-killed');

  // Each command's first run is killed, the way a busy machine refuses a
  // process, and every run after it works.
  const bin = path.join(m.dir, 'bin-killed');
  fs.mkdirSync(bin, { recursive: true });
  const seen = path.join(m.dir, 'seen');
  fs.writeFileSync(path.join(bin, 'util'),
    '#!/usr/bin/env bash\n' +
    `mark="${seen}-$1-$2"\n` +
    '[ -e "$mark" ] || { touch "$mark"; kill -9 $$; }\n' +
    'exit 0\n');
  fs.chmodSync(path.join(bin, 'util'), 0o755);

  const report = doctor(m, { bin });

  assert.match(report.stdout, /util: fs tree runs/);
  assert.doesNotMatch(report.stdout, /does not run/);
});

test('a CLAUDE.md that is not the link to the rules is named', () => {
  const m = machine('doctor-rules');

  fs.rmSync(path.join(m.home, 'CLAUDE.md'));
  fs.writeFileSync(path.join(m.home, 'CLAUDE.md'), 'My own rules.\n');

  const report = doctor(m, { bin: utilStub(m.dir) });

  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /CLAUDE\.md is a real file, not a link/);
  assert.doesNotMatch(report.stdout, /codex/i, 'Codex is not checked');
});

test('a setup session that never finished is named', () => {
  const m = machine('doctor-session');
  const bin = utilStub(m.dir);

  fs.writeFileSync(path.join(m.flowHome, 'logs', 'setup-pending'), 'now\n');
  const pending = doctor(m, { bin });
  assert.strictEqual(pending.code, 1);
  assert.match(pending.stdout, /the setup session did not finish .*setup-pending stands.*: run flow install/);

  fs.rmSync(path.join(m.flowHome, 'logs', 'setup-pending'));
  assert.doesNotMatch(doctor(m, { bin }).stdout, /did not finish/);
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

test('projects: a registered path that is gone is named, with the list', () => {
  const m = machine('doctor-projects-gone');
  const gone = path.join(m.dir, 'moved-away');
  registry.write({ exp: m.dir, old: gone }, m.flowHome);

  const report = doctor(m, { bin: utilStub(m.dir) });
  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /old is registered at .*moved-away, which is gone/);
  assert.match(report.stdout, /^note {2}projects: registered: exp .*doctor-projects-gone, old .*moved-away$/m);
});

test('projects: the current folder\'s prefix held by another folder is a clash, with ticketPrefix as the fix', () => {
  const m = machine('doctor-projects-clash');
  const other = project('doctor-projects-other');
  registry.write({ exp: other }, m.flowHome);

  const report = doctor(m, { bin: utilStub(m.dir) });
  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /this folder's prefix "exp" is held by .*doctor-projects-other: set ticketPrefix in .*settings\.json to another word/);
});

test('projects: a line whose folder changed its ticketPrefix is named', () => {
  const m = machine('doctor-projects-renamed');
  fs.writeFileSync(path.join(m.dir, '.flow', 'settings.json'), '{\n  "ticketPrefix": "shop"\n}\n');

  const report = doctor(m, { bin: utilStub(m.dir) });
  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /.*doctor-projects-renamed is registered as "exp", but its ticketPrefix is now "shop"/);
  assert.doesNotMatch(report.stdout, /is not in the list/, 'the folder has a line, under its old prefix');
});

test('projects: the current folder with a prefix and no line is named', () => {
  const m = machine('doctor-projects-missing');
  registry.write({}, m.flowHome);

  const report = doctor(m, { bin: utilStub(m.dir) });
  assert.strictEqual(report.code, 1);
  assert.match(report.stdout, /this folder \(prefix "exp"\) is not in the list: a ticket-writing command here adds it/);
});
