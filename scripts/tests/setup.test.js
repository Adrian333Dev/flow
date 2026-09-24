'use strict';
/**
 * `flow setup`: the check before the session, the line that opens it, and
 * the stamp at its end. The session itself is an agent's run, and
 * lab/scripts/try.sh is where it is tried.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run, flow, bareRepo, REPO } = require('./helpers/scratch');
const version = require('../flow/lib/version');

/** A scratch install, with or without what a real one clones and links. */
function installed(name, { whole }) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const made = flow(dir, ['install', '--root', root, '--no-clone', '--repo', bareRepo(name)]);
  assert.strictEqual(made.code, 0, made.stderr);
  if (whole) {
    const flowHome = path.join(root, '.flow');
    for (const clone of ['util', 'toolbox']) fs.mkdirSync(path.join(flowHome, 'repos', clone), { recursive: true });
    fs.writeFileSync(path.join(flowHome, 'settings.json'), JSON.stringify({ sources: [] }));
    for (const name of ['util', 'u']) fs.symlinkSync(REPO, path.join(root, '.local', 'bin', name));
  }
  return { dir, root, flowHome: path.join(root, '.flow') };
}

test('setup refuses to start on an install that is not finished', () => {
  const m = installed('setup-unready', { whole: false });
  const refused = flow(m.dir, ['setup', '--root', m.root]);

  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /the install is not finished, so setup has not started:/);
  assert.match(refused.stderr, /util is not linked in /);
  assert.match(refused.stderr, /util is not cloned into /);
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')), 'nothing is started');

  const check = flow(m.dir, ['setup', 'check', '--root', m.root]);
  assert.strictEqual(check.code, 1);
  assert.match(check.stdout, /^not ready:/);
});

test('setup writes its run and its prompt, then prints the session it opens', () => {
  const m = installed('setup-ready', { whole: true });
  assert.strictEqual(flow(m.dir, ['setup', 'check', '--root', m.root]).code, 0);

  const started = flow(m.dir, ['setup', '--root', m.root]);
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /cd \S+ && claude --safe-mode --permission-mode acceptEdits --add-dir \S+ --allowedTools 'Bash\(flow setup:\*\)'/);
  assert.match(started.stdout, /--append-system-prompt-file \S+setup-prompt\.md 'Set up this machine\.'$/m);

  const prompt = fs.readFileSync(path.join(m.flowHome, 'setup-prompt.md'), 'utf8');
  assert.ok(prompt.startsWith(fs.readFileSync(path.join(REPO, 'home', 'AGENTS.md'), 'utf8').trim()), 'the rules come first');
  assert.match(prompt, /^# This session sets up this machine$/m);

  const runFile = JSON.parse(fs.readFileSync(path.join(m.flowHome, 'run.json'), 'utf8'));
  assert.deepStrictEqual([runFile.type, runFile.step], ['setup-machine', 0]);
  assert.match(runFile.migration, /^machine\/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d$/, 'the session is handed its folder');

  // A second start carries the stopped run on rather than starting over.
  fs.writeFileSync(path.join(m.flowHome, 'run.json'), JSON.stringify({ ...runFile, step: 4 }));
  const again = flow(m.dir, ['setup', '--root', m.root]);
  assert.match(again.stdout, /'Carry on setting up this machine\.'$/m);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(m.flowHome, 'run.json'), 'utf8')).step, 4);
});

test('setup finish stamps the version and ends the run, and only a running setup can', () => {
  const m = installed('setup-finish', { whole: true });
  const early = flow(m.dir, ['setup', 'finish', '--root', m.root]);
  assert.strictEqual(early.code, 1);
  assert.match(early.stderr, /no setup is running/);

  flow(m.dir, ['setup', '--root', m.root]);
  const done = flow(m.dir, ['setup', 'finish', '--root', m.root]);
  assert.strictEqual(done.code, 0, done.stderr);
  assert.strictEqual(fs.readFileSync(path.join(m.flowHome, 'version'), 'utf8'), `${version.newest(REPO)}\n`);
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')));

  const after = flow(m.dir, ['setup', '--root', m.root]);
  assert.match(after.stdout, /Flow is already set up on this machine/);
});
