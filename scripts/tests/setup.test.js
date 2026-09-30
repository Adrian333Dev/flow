'use strict';
/**
 * `flow install` and `flow init`: the check before the session, the
 * line that opens it, and the stamp at its end. The session itself is an agent's run, and
 * lab/scripts/try.sh is where it is tried.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { project, run, flow, bareRepo, REPO, SCRATCH } = require('./helpers/scratch');
const version = require('../flow/lib/version');

/** A scratch install, with or without what a real one clones and links. */
function installed(name, { whole }) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const remote = bareRepo(name);
  const made = flow(dir, ['install', '--root', root, '--no-clone'], { FLOW_HOME_REMOTE: remote });
  assert.strictEqual(made.code, 0, made.stderr);
  if (whole) {
    const flowHome = path.join(root, '.flow');
    for (const clone of ['util', 'toolbox']) fs.mkdirSync(path.join(flowHome, 'repos', clone), { recursive: true });
    fs.writeFileSync(path.join(flowHome, 'settings.json'), JSON.stringify({ sources: [] }));
    for (const name of ['util', 'u']) fs.symlinkSync(REPO, path.join(root, '.local', 'bin', name));
  }
  // `flow install` again: every link is there, so it goes straight to the session.
  const setup = (...args) => flow(dir, ['install', ...args, '--root', root, '--no-clone'], { FLOW_HOME_REMOTE: remote });
  return { dir, root, flowHome: path.join(root, '.flow'), setup };
}

test('install hands over rather than opening a session the install cannot support', () => {
  const m = installed('setup-unready', { whole: false });
  const handed = m.setup();

  assert.strictEqual(handed.code, 0, handed.stderr);
  assert.match(handed.stdout, /One step left: setting up this machine\. Start it from a terminal:\n\n {2}flow install --root /);
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')), 'nothing is started');

  const check = flow(m.dir, ['install', 'check', '--root', m.root]);
  assert.strictEqual(check.code, 1);
  assert.match(check.stdout, /^not ready:/);
  assert.match(check.stdout, /util is not cloned into /);
});

test('install writes its run and its prompt, then prints the session it opens', () => {
  const m = installed('setup-ready', { whole: true });
  assert.strictEqual(flow(m.dir, ['install', 'check', '--root', m.root]).code, 0);

  const started = m.setup();
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /cd \S+ && claude --safe-mode --permission-mode acceptEdits --add-dir \S+ --settings \S+setup-settings\.json /);

  // Flow's permissions for this session alone, with auto mode off.
  const settings = JSON.parse(fs.readFileSync(path.join(m.flowHome, 'setup-settings.json'), 'utf8'));
  assert.ok(settings.permissions.allow.includes('Bash'), 'every shell command runs unasked');
  assert.ok(settings.permissions.ask.includes('Bash(git push *)'));
  assert.strictEqual(settings.disableAutoMode, 'disable');
  assert.match(started.stdout, /--append-system-prompt-file \S+setup-prompt\.md 'Set up this machine\.'$/m);

  const prompt = fs.readFileSync(path.join(m.flowHome, 'setup-prompt.md'), 'utf8');
  assert.ok(prompt.startsWith(fs.readFileSync(path.join(REPO, 'home', 'AGENTS.md'), 'utf8').trim()), 'the rules come first');
  assert.match(prompt, /^# This session sets up this machine$/m);

  const runFile = JSON.parse(fs.readFileSync(path.join(m.flowHome, 'run.json'), 'utf8'));
  assert.deepStrictEqual([runFile.type, runFile.step], ['setup-machine', 0]);
  assert.match(runFile.migration, /^machine\/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d$/, 'the session is handed its folder');

  // A second start carries the stopped run on rather than starting over.
  fs.writeFileSync(path.join(m.flowHome, 'run.json'), JSON.stringify({ ...runFile, step: 4 }));
  const again = m.setup();
  assert.match(again.stdout, /'Carry on setting up this machine\.'$/m);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(m.flowHome, 'run.json'), 'utf8')).step, 4);
});

test('install finish stamps the version and ends the run, and only a running setup can', () => {
  const m = installed('setup-finish', { whole: true });
  const early = flow(m.dir, ['install', 'finish', '--root', m.root]);
  assert.strictEqual(early.code, 1);
  assert.match(early.stderr, /no setup is running/);

  m.setup();
  const prompt = path.join(m.flowHome, 'setup-prompt.md');
  assert.ok(fs.existsSync(prompt), 'the launch writes the prompt the session starts on');
  const done = flow(m.dir, ['install', 'finish', '--root', m.root]);
  assert.strictEqual(done.code, 0, done.stderr);
  assert.strictEqual(fs.readFileSync(path.join(m.flowHome, 'version'), 'utf8'), `${version.newest(REPO)}\n`);
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')));
  assert.ok(!fs.existsSync(prompt), 'the prompt goes with the run');
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'setup-settings.json')), 'and so do its permissions');
  const records = fs.readdirSync(path.join(m.flowHome, 'machines'));
  assert.strictEqual(records.length, 1, 'the record the other machines read');
  const record = JSON.parse(fs.readFileSync(path.join(m.flowHome, 'machines', records[0]), 'utf8'));
  assert.strictEqual(record.flowVersion, version.newest(REPO));

  const after = m.setup();
  assert.match(after.stdout, /Flow is already set up on this machine/);
});

/** A machine Flow is set up on, and a git repository beside it, for `flow init`. */
function projectCase(name, { setUp = true, git = true } = {}) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const root = path.join(dir, 'root');
  const proj = path.join(dir, 'proj');
  fs.mkdirSync(path.join(root, '.flow'), { recursive: true });
  fs.mkdirSync(proj, { recursive: true });
  if (setUp) fs.writeFileSync(path.join(root, '.flow', 'version'), `${version.newest(REPO)}\n`);
  if (git) spawnSync('git', ['init', '--quiet'], { cwd: proj });
  // The scratch folder sits inside Flow's own repository, which git would
  // otherwise find above a folder never initialised.
  const env = { ...process.env, GIT_CEILING_DIRECTORIES: dir };
  delete env.FLOW_PROJECT;
  delete env.FLOW_HOME;
  const setup = (...args) => run('flow/flow.js', ['init', ...args, '--root', root], { cwd: proj, env });
  return { root, proj, flowHome: path.join(root, '.flow'), setup };
}

test('init refuses a machine not set up, and runs git init in a folder outside git', () => {
  const bare = projectCase('setup-project-unready', { setUp: false, git: false });
  const refused = bare.setup();
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /Flow is not set up on this machine\. Run flow install first/);
  assert.ok(!fs.existsSync(path.join(bare.flowHome, 'run.json')), 'nothing is started');
  assert.strictEqual(bare.setup('check').code, 1);

  const loose = projectCase('setup-project-loose', { git: false });
  const made = loose.setup('--prefix', 'shop');
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /^git init: \S+ is a git repository now$/m);
  assert.ok(fs.existsSync(path.join(loose.proj, '.git')));
});

test('init with nothing competing writes the template at once, and opens no session', () => {
  const m = projectCase('setup-project-plain');
  const done = m.setup('--prefix', 'shop');
  assert.strictEqual(done.code, 0, done.stderr);
  assert.match(done.stdout, /^wrote: AGENTS\.md$/m);
  assert.match(done.stdout, /^set up: \S+ is on entry \d+\./m);
  assert.doesNotMatch(done.stdout, /claude /, 'no session');
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')));
  assert.strictEqual(fs.readFileSync(path.join(m.proj, '.flow', 'version'), 'utf8'), `${version.newest(REPO)}\n`);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(m.proj, '.flow', 'settings.json'), 'utf8')), { ticketPrefix: 'shop' });
});

test('init writes its run and prints a session that loads nothing of the project, where files compete', () => {
  const m = projectCase('setup-project-ready');
  fs.writeFileSync(path.join(m.proj, 'CLAUDE.md'), '# How to work here\n');
  const memory = path.join(m.root, '.claude', 'projects', fs.realpathSync(m.proj).replace(/[^A-Za-z0-9]/g, '-'), 'memory');
  fs.mkdirSync(memory, { recursive: true });
  fs.writeFileSync(path.join(memory, 'MEMORY.md'), '- the deploy runs from main\n');
  assert.strictEqual(m.setup('check').code, 0);

  const started = m.setup('--prefix', 'shop');
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /2 things here already tell Claude how to work: CLAUDE\.md, Claude Code's memory for this folder\./);
  assert.match(started.stdout, /claude --setting-sources user --strict-mcp-config --permission-mode acceptEdits --add-dir \S+ --add-dir \S+memory --allowedTools 'Bash\(flow init:\*\)'/);
  assert.match(started.stdout, /'Set up this project\.'$/m);

  const prompt = fs.readFileSync(path.join(m.flowHome, 'setup-prompt.md'), 'utf8');
  assert.match(prompt, /^# This session sets up this project$/m);

  const runFile = JSON.parse(fs.readFileSync(path.join(m.flowHome, 'run.json'), 'utf8'));
  assert.deepStrictEqual([runFile.type, runFile.project, runFile.memory, runFile.step], ['setup-project', fs.realpathSync(m.proj), memory, 0]);
  assert.match(runFile.migration, /^[\w-]+\/\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d$/);

  const again = m.setup();
  assert.match(again.stdout, /'Carry on setting up this project\.'$/m);
});

test('init finish stamps .flow/version, and a machine run blocks a project one', () => {
  const m = projectCase('setup-project-finish');
  assert.match(m.setup('finish').stderr, /no project setup is running/);

  fs.writeFileSync(path.join(m.proj, 'CLAUDE.md'), '# How to work here\n');
  m.setup('--prefix', 'shop');
  const done = m.setup('finish');
  assert.strictEqual(done.code, 0, done.stderr);
  assert.strictEqual(fs.readFileSync(path.join(m.proj, '.flow', 'version'), 'utf8'), `${version.newest(REPO)}\n`);
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')));
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'setup-prompt.md')));
  assert.match(m.setup().stdout, /is already set up/);

  const other = projectCase('setup-project-busy');
  fs.writeFileSync(path.join(other.flowHome, 'run.json'), JSON.stringify({ type: 'setup-machine', step: 2 }));
  assert.match(other.setup().stderr, /says a setup-machine run stopped part way/);
});

// A project set up on another machine arrives through its own repository,
// stamped. This machine's Claude Code memory for it was never read.
test('init in a project set up already folds in this machine\'s old memory, and leaves the stamp alone', () => {
  const m = projectCase('setup-project-memory');
  m.setup('--prefix', 'shop');
  const stamp = fs.readFileSync(path.join(m.proj, '.flow', 'version'), 'utf8');

  const memory = path.join(m.root, '.claude', 'projects', fs.realpathSync(m.proj).replace(/[^A-Za-z0-9]/g, '-'), 'memory');
  fs.mkdirSync(memory, { recursive: true });
  assert.match(m.setup().stdout, /is already set up, so there is nothing more to do/, 'an empty memory folder holds nothing to fold in');

  fs.writeFileSync(path.join(memory, 'MEMORY.md'), '- the deploy runs from main\n');
  assert.match(m.setup('check').stdout, /ready: .* is set up, and this machine's old memory for it can be folded in/);
  const started = m.setup();
  assert.match(started.stdout, /^Folding this machine's old memory into .* runs in its own session\./m);
  assert.match(started.stdout, /'Fold this machine'\\''s old memory into this project\.'$/m);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(m.flowHome, 'run.json'), 'utf8')).memoryOnly, true);

  const done = m.setup('finish');
  assert.match(done.stdout, /^folded in: this machine's old memory for /);
  assert.strictEqual(fs.readFileSync(path.join(m.proj, '.flow', 'version'), 'utf8'), stamp, 'flow update moves the stamp, never this');
  assert.ok(!fs.existsSync(path.join(m.flowHome, 'run.json')));
});
