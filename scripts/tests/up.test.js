'use strict';
/**
 * `flow up`: which place it finds behind, the run it writes, the line that
 * opens the session, and the stamp at its end. Every case runs on a scratch
 * machine through `--root`, which never pulls the real clone. The session
 * itself is an agent's run, and lab/scripts/try.sh is where it is tried.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { run, REPO, SCRATCH } = require('./helpers/scratch');
const version = require('../flow/lib/version');

const NEWEST = version.newest(REPO);

/** A machine at one entry, and a Flow project beside it at another, or none. */
function place(name, { machine, project } = {}) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const root = path.join(dir, 'root');
  const proj = path.join(dir, 'proj');
  fs.mkdirSync(path.join(root, '.flow'), { recursive: true });
  fs.mkdirSync(proj, { recursive: true });
  spawnSync('git', ['init', '--quiet'], { cwd: proj });
  if (machine !== undefined) fs.writeFileSync(path.join(root, '.flow', 'version'), `${machine}\n`);
  if (project !== undefined) {
    fs.mkdirSync(path.join(proj, '.flow'), { recursive: true });
    fs.writeFileSync(path.join(proj, '.flow', 'version'), `${project}\n`);
  }
  // The scratch folder sits inside Flow's own repository, which git would
  // otherwise find above the project.
  const env = { ...process.env, GIT_CEILING_DIRECTORIES: dir };
  delete env.FLOW_PROJECT;
  delete env.FLOW_HOME;
  const up = (...args) => run('flow/flow.js', ['up', ...args, '--root', root], { cwd: proj, env });
  const runFile = () => JSON.parse(fs.readFileSync(path.join(root, '.flow', 'run.json'), 'utf8'));
  return { root, proj: fs.realpathSync(proj), flowHome: path.join(root, '.flow'), up, runFile };
}

test('up refuses a machine never set up, and says so where nothing is behind', () => {
  const bare = place('up-bare');
  const refused = bare.up();
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /Flow is not set up on this machine\. Run flow setup first/);

  const current = place('up-current', { machine: NEWEST, project: NEWEST });
  const done = current.up();
  assert.strictEqual(done.code, 0, done.stderr);
  assert.match(done.stdout, new RegExp(`Flow is up to date: this machine is at entry ${NEWEST}, and so is `));
  assert.ok(!fs.existsSync(path.join(current.flowHome, 'run.json')), 'nothing is started');

  const unset = place('up-unset', { machine: NEWEST });
  fs.mkdirSync(path.join(unset.proj, '.flow'));
  assert.match(unset.up().stdout, /was never set up\. Run flow setup project inside it/);
});

test('up takes the machine first, and prints the session it opens', () => {
  const m = place('up-machine', { machine: NEWEST - 1, project: NEWEST - 1 });
  const started = m.up();
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /claude --permission-mode acceptEdits --add-dir \S+ --allowedTools 'Bash\(flow up:\*\)'/);
  assert.match(started.stdout, /--append-system-prompt-file \S+migrate-prompt\.md 'Bring this machine up to date\.'$/m);
  assert.match(started.stdout, /run flow up again in \S+ for the project/);

  const prompt = fs.readFileSync(path.join(m.flowHome, 'migrate-prompt.md'), 'utf8');
  assert.match(prompt, /^# This session brings Flow up to date$/m);

  const r = m.runFile();
  assert.deepStrictEqual([r.type, r.project, r.from, r.to, r.step], ['migrate', undefined, NEWEST - 1, NEWEST, 0]);
  assert.match(r.migration, /^machine\/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d$/);

  const check = m.up('check');
  assert.strictEqual(check.code, 0, check.stdout);
  assert.match(check.stdout, new RegExp(`ready: this machine goes from entry ${NEWEST - 1} to ${NEWEST}\\.`));
  assert.match(check.stdout, new RegExp(`  ${NEWEST}, \\d{4}-\\d\\d-\\d\\d: `), 'each entry covered is listed');

  // A second start carries the stopped run on rather than starting another.
  fs.writeFileSync(path.join(m.flowHome, 'run.json'), JSON.stringify({ ...r, step: 3 }));
  assert.match(m.up().stdout, /'Carry on bringing this machine up to date\.'$/m);
  assert.strictEqual(m.runFile().step, 3);
});

test('up finish stamps the machine, then the project behind it gets its own run', () => {
  const m = place('up-project', { machine: NEWEST - 1, project: NEWEST - 1 });
  assert.match(m.up('finish').stderr, /no update is running/);

  m.up();
  const machineDone = m.up('finish');
  assert.strictEqual(machineDone.code, 0, machineDone.stderr);
  assert.strictEqual(fs.readFileSync(path.join(m.flowHome, 'version'), 'utf8'), `${NEWEST}\n`);
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')));

  const started = m.up();
  assert.match(started.stdout, /'Bring this project up to date\.'$/m);
  assert.match(started.stdout, new RegExp(`cd ${m.proj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} && claude`), 'the project session opens in the project');
  const r = m.runFile();
  assert.deepStrictEqual([r.project, r.from, r.to], [m.proj, NEWEST - 1, NEWEST]);

  assert.strictEqual(m.up('finish').code, 0);
  assert.strictEqual(fs.readFileSync(path.join(m.proj, '.flow', 'version'), 'utf8'), `${NEWEST}\n`);
  assert.match(m.up().stdout, /Flow is up to date/);
});

test('up waits for a setup that stopped part way', () => {
  const m = place('up-busy', { machine: NEWEST - 1 });
  fs.writeFileSync(path.join(m.flowHome, 'run.json'), JSON.stringify({ type: 'setup-project', project: '/somewhere/shop', step: 2 }));
  const refused = m.up();
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /says a setup-project run stopped part way\. Finish that first: in \/somewhere\/shop, run flow setup project/);
  assert.strictEqual(m.up('check').code, 1);
});
