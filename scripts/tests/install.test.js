'use strict';
/**
 * `flow install`: what installs, and where each piece lands.
 *
 * Every install here targets a scratch root. A test that reached the real home
 * folder would install Flow on the machine running it. Most pass --no-bin too;
 * the one test of the typed names leaves it off, and those names land in the
 * scratch root's own .local/bin.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run, flow, gitRepo, bareRepo, skillFile, setUp, pathWith, REPO } = require('./helpers/scratch');
const logs = require('../lib/logs/logs');
const failures = require('../lib/logs/failures');

const linkTarget = (p) => fs.readlinkSync(p);

/** Where each piece lands under a scratch root standing in for `~`. */
function paths(root) {
  const agents = path.join(root, '.agents');
  const claude = path.join(root, '.claude');
  const plugin = path.join(agents, 'skills', 'flow');
  return {
    agents,
    claude,
    flowHome: path.join(root, '.flow'),
    plugin,
    skill: (name) => path.join(plugin, 'skills', name),
  };
}

// The one behaviour that needs a skill on disk: a group folder is the whole
// mechanism, so faking it anywhere else would test nothing.
test('a skill in drafts/ does not install', () => {
  const dir = project('install-drafts');
  const root = path.join(dir, 'root');
  const at = paths(root);
  const draft = path.join(REPO, 'skills', 'drafts', 'test-only-draft');

  fs.mkdirSync(draft, { recursive: true });
  fs.writeFileSync(path.join(draft, 'SKILL.md'),
    '---\nname: test-only-draft\ndescription: A draft written by the test suite.\n---\n');
  try {
    flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
    assert.ok(!fs.existsSync(at.skill('test-only-draft')), 'a draft is skipped by the linker');
    assert.ok(fs.existsSync(at.skill('groundwork')), 'every other group still links');

    flow(dir, ['install', '--root', root, '--no-bin', '--drafts'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
    assert.ok(fs.existsSync(at.skill('test-only-draft')),
      '--drafts links it, which is what the scratch session passes');
  } finally {
    fs.rmSync(draft, { recursive: true, force: true });
  }
});

test('install builds a whole machine, is idempotent, and prunes a dead link', () => {
  const dir = project('install-home');
  const root = path.join(dir, 'root');
  const at = paths(root);

  const first = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.strictEqual(first.code, 0, first.stderr);

  // The plugin folder is real and lives in ~/.agents, where Codex reads it.
  // Claude Code reaches the same folder through one link.
  assert.ok(!fs.lstatSync(at.plugin).isSymbolicLink(), 'the plugin folder is a real folder');
  assert.strictEqual(linkTarget(path.join(at.claude, 'skills', 'flow')), at.plugin);
  // The copy drops the clone's `skills` key: its group folders are not in the plugin folder.
  const { skills: groups, ...named } = JSON.parse(fs.readFileSync(path.join(REPO, 'skills', '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.ok(groups.length, 'the clone names its group folders, for a live session');
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(at.plugin, '.claude-plugin', 'plugin.json'), 'utf8')), named);
  assert.ok(!fs.lstatSync(path.join(at.plugin, '.claude-plugin', 'plugin.json')).isSymbolicLink(),
    'the manifest is copied: Codex ignores a linked one');

  assert.strictEqual(linkTarget(at.skill('groundwork')), path.join(REPO, 'skills', 'phases', 'groundwork'));
  assert.strictEqual(linkTarget(at.skill('start')), path.join(REPO, 'skills', 'tools', 'start'),
    'a user-only skill installs like any other');
  assert.strictEqual(linkTarget(at.skill('debug')), path.join(REPO, 'skills', 'phases', 'debug'),
    'every essential skill is linked');
  assert.ok(!fs.existsSync(at.skill('review')), 'a dev skill starts off');
  assert.doesNotMatch(first.stdout, /skills\/review/, 'never linked and then unlinked');

  // scripts, references and docs live under ~/.flow: Claude Code reads none of
  // them, and the hooks and skills name all 3 by path.
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'scripts')), path.join(REPO, 'scripts'));
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'references')), path.join(REPO, 'references'));
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'docs')), path.join(REPO, 'docs'),
    '/flow:help reads a manual page through this link');
  assert.ok(!fs.existsSync(path.join(at.claude, 'scripts')), 'scripts never land under ~/.claude');
  assert.ok(!fs.lstatSync(path.join(at.claude, 'commands')).isSymbolicLink(), 'commands/ holds other tools\' files too');
  assert.strictEqual(linkTarget(path.join(at.claude, 'commands', 'capture.md')), path.join(REPO, 'claude', 'commands', 'capture.md'),
    'a command links per file, typed /capture with no prefix');

  // The rule file and the link to it are /flow:setup-machine's.
  // Install leaves both alone and says which command finishes the machine.
  assert.ok(!fs.existsSync(path.join(at.flowHome, 'CLAUDE.md')), 'no rule file yet');
  assert.ok(!fs.existsSync(path.join(at.claude, 'CLAUDE.md')), 'no link to it yet');
  assert.ok(!fs.existsSync(path.join(root, '.codex')), 'nothing under ~/.codex at all');
  // A scratch root hands the rest to flow install, which has its own tests.
  assert.match(first.stdout, /One step left: setting up this machine\. Start it from a terminal:\n\n {2}flow install --root /);
  assert.match(first.stdout, /^Flow is installed: \d+ skills/m, 'a summary comes first');
  assert.doesNotMatch(first.stdout, /^linked: /m, 'every link goes to the log, never the screen');
  assert.match(fs.readFileSync(path.join(at.flowHome, 'logs', 'install.log'), 'utf8'), /^linked: .*skills\/flow\/skills\/groundwork$/m);

  // Where the clone sits: every other clone goes beside this link, and no
  // setting records the path.
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'repos', 'flow')), REPO);
  assert.ok(!fs.existsSync(path.join(at.flowHome, 'settings.local.json')), 'no clone key');
  assert.match(first.stdout, /could not clone Adrian333Dev\/util: .*Run flow install again once that is fixed\./,
    'a clone that fails is a line of the report, never a stop');
  const failed = fs.readFileSync(failures.file(at.flowHome), 'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(failed.some((f) => f.source === 'install' && /^could not clone Adrian333Dev\/util/.test(f.error)),
    'and a line in the failure log');
  const history = fs.readFileSync(logs.historyFile(at.flowHome), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepStrictEqual(history.map((h) => [h.type, h.clone]), [['install', REPO]]);

  // A skill renamed in the clone leaves a link pointing at nothing.
  fs.symlinkSync(path.join(REPO, 'skills', 'phases', 'write-tickets'), at.skill('write-tickets'));

  const second = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.strictEqual(second.code, 0, second.stderr);
  assert.match(second.stdout, /unlinked \(gone\): .*\.agents\/skills\/flow\/skills\/write-tickets/);
  assert.ok(fs.existsSync(at.skill('groundwork')), 'still linked after a re-run');
});

test('install writes the machine as it was before Flow, once', () => {
  const dir = project('install-original');
  const root = path.join(dir, 'root');
  const at = paths(root);

  // One path that was already there, so the original holds a real copy beside
  // its absent entries.
  fs.mkdirSync(path.join(at.claude, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(at.claude, 'agents', 'mine.md'), 'my own agent\n');

  const first = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.strictEqual(first.code, 0, first.stderr);
  assert.match(first.stdout, /wrote: .*originals\/machine, this machine as it was before Flow/);

  const file = path.join(at.flowHome, 'originals', 'machine', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.strictEqual(manifest.place, 'machine');
  assert.strictEqual(manifest.project, null);
  assert.strictEqual(manifest.closed, false, '/flow:setup-machine closes it, not install');

  // ~/.agents did not exist, so the whole folder is recorded absent and a
  // restore takes it away again. Nothing under ~/.flow is ever recorded.
  const byPath = Object.fromEntries(manifest.entries.map((e) => [e.path, e.type]));
  assert.strictEqual(byPath[at.agents], 'absent');
  assert.strictEqual(byPath[path.join(at.claude, 'skills')], 'absent');
  assert.ok(!Object.keys(byPath).some((p) => p.startsWith(at.flowHome)), 'nothing under ~/.flow/');

  // The second run finds Flow's own links in place. Recording them would make
  // Flow the state to go back to.
  const second = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.strictEqual(second.code, 0, second.stderr);
  assert.doesNotMatch(second.stdout, /this machine as it was before Flow/);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(file, 'utf8')), manifest, 'nothing was added');
});

test('a name that has left the BIN map is unlinked, and another tool keeps its own', () => {
  const dir = project('install-bin');
  const root = path.join(dir, 'root');
  const bin = path.join(root, '.local', 'bin');

  assert.strictEqual(flow(dir, ['install', '--root', root], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) }).code, 0);
  assert.strictEqual(linkTarget(path.join(bin, 'flow')), path.join(REPO, 'scripts', 'flow.js'));
  assert.strictEqual(linkTarget(path.join(bin, 'fw')), path.join(REPO, 'scripts', 'flow.js'));

  // gsave left for util on 2026-08-30. Its link still resolved, so nothing
  // ever noticed it.
  fs.symlinkSync(path.join(REPO, 'scripts', 'flow.js'), path.join(bin, 'gsave'));
  fs.symlinkSync(path.join(dir, 'other-tool.js'), path.join(bin, 'other'));

  const again = flow(dir, ['install', '--root', root], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.match(again.stdout, /unlinked \(renamed\): .*bin\/gsave/);
  assert.ok(!fs.existsSync(path.join(bin, 'gsave')), 'the stale name is gone');
  assert.ok(fs.lstatSync(path.join(bin, 'other')).isSymbolicLink(), 'a link into anywhere else is left alone');
  assert.ok(fs.existsSync(path.join(bin, 'flow')), 'the names still in the map stay');
});

test('install never touches the rule file or either way in to it', () => {
  const dir = project('install-claude-md');
  const root = path.join(dir, 'root');
  const at = paths(root);
  const claudeRules = path.join(at.claude, 'CLAUDE.md');

  // Rules of the user's own, in the file /flow:setup-machine will later ask
  // about. Install reads none of it and writes none of it.
  fs.mkdirSync(at.claude, { recursive: true });
  fs.writeFileSync(claudeRules, 'My own rules.\n');

  const written = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.strictEqual(written.code, 0, written.stderr);
  assert.strictEqual(fs.readFileSync(claudeRules, 'utf8'), 'My own rules.\n');
  assert.ok(!fs.lstatSync(claudeRules).isSymbolicLink(), 'still the user\'s own file');
  assert.ok(!fs.existsSync(path.join(at.flowHome, 'CLAUDE.md')));
});

test('install never reaches outside the root it was given', () => {
  const dir = project('install-scoped');
  const root = path.join(dir, 'root');
  const before = fs.readdirSync(dir).sort();
  flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });

  assert.deepStrictEqual(fs.readdirSync(dir).sort(), [...before, 'root'].sort(), 'nothing lands beside the root');
  assert.deepStrictEqual(fs.readdirSync(root).sort(), ['.agents', '.claude', '.flow', '.gitconfig'],
    'the machine name lands in the root\'s own git config, never the real one');
  assert.match(fs.readFileSync(path.join(root, '.gitconfig'), 'utf8'), /machine = test-machine/);
});

test('the flags that took one folder each are gone', () => {
  const dir = project('install-old-flags');
  const before = fs.readdirSync(dir).sort();
  const old = run('flow.js', ['install', '--home', path.join(dir, 'home'), '--no-bin']);
  assert.notStrictEqual(old.code, 0, 'an unknown flag refuses rather than installing for real');
  assert.deepStrictEqual(fs.readdirSync(dir).sort(), before, 'nothing was written before the refusal');
});

test('install clones what is missing, links a skill switched on, and never clones twice', () => {
  const dir = project('install-clones');
  const root = path.join(dir, 'root');
  const at = paths(root);
  const bin = path.join(root, '.local', 'bin');
  const remote = path.join(dir, 'remote');

  // util's own installer, cut down to the one thing Flow reads back: a link
  // in the folder it was given.
  gitRepo(path.join(remote, 'Adrian333Dev', 'util'), {
    'util.js': "const fs = require('fs'); const path = require('path');\n" +
      "const bin = process.argv[process.argv.indexOf('--bin') + 1];\n" +
      "fs.mkdirSync(bin, { recursive: true }); fs.symlinkSync(__filename, path.join(bin, 'util'));\n",
  });
  gitRepo(path.join(remote, 'Adrian333Dev', 'toolbox'), { 'README.md': 'catalog\n' });
  gitRepo(path.join(remote, 'Adrian333Dev', 'domain-skills'), { 'react/SKILL.md': skillFile('react') });

  const env = { FLOW_GIT_BASE: `${remote}${path.sep}` };
  const remoteRepo = bareRepo('install-clones');
  const install = () => run('flow.js', ['install', '--root', root], { cwd: dir, env: { ...process.env, ...env, FLOW_HOME_REMOTE: remoteRepo } });

  const first = install();
  assert.strictEqual(first.code, 0, first.stderr);
  for (const id of ['Adrian333Dev/util', 'Adrian333Dev/toolbox', 'Adrian333Dev/domain-skills']) {
    assert.match(first.stdout, new RegExp(`cloned: ${id} into `));
  }
  assert.ok(fs.existsSync(path.join(at.flowHome, 'repos', 'sources', 'Adrian333Dev_domain-skills', 'react', 'SKILL.md')));
  assert.ok(fs.lstatSync(path.join(bin, 'util')).isSymbolicLink(), 'util installed its own name');
  assert.ok(!fs.existsSync(path.join(at.claude, 'skills', 'react')), 'a source skill starts off');

  fs.writeFileSync(path.join(at.flowHome, 'settings.json'), JSON.stringify({ skills: { react: 'on' } }));
  fs.rmSync(path.join(bin, 'util'));
  setUp(at.flowHome);

  const second = install();
  assert.strictEqual(second.code, 0, second.stderr);
  assert.doesNotMatch(second.stdout, /cloned:/, 'nothing is cloned twice');
  assert.strictEqual(linkTarget(path.join(at.claude, 'skills', 'react')),
    path.join(at.flowHome, 'repos', 'sources', 'Adrian333Dev_domain-skills', 'react'));
  assert.match(second.stdout, /Flow is already set up on this machine, so there is nothing more to do\./);
  assert.doesNotMatch(second.stdout, /One step left/);

  const types = fs.readFileSync(logs.historyFile(at.flowHome), 'utf8').trim().split('\n')
    .map((l) => JSON.parse(l).type);
  assert.deepStrictEqual(types, ['clone', 'clone', 'clone', 'install', 'install']);
});

test('install refuses when ~/.flow/repos/flow is another clone', () => {
  const dir = project('install-other-clone');
  const root = path.join(dir, 'root');
  const other = path.join(dir, 'other-clone');
  fs.mkdirSync(other, { recursive: true });
  fs.mkdirSync(path.join(root, '.flow', 'repos'), { recursive: true });
  fs.symlinkSync(other, path.join(root, '.flow', 'repos', 'flow'));

  const refused = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) });
  assert.notStrictEqual(refused.code, 0);
  assert.match(refused.stderr, /repos\/flow is .*other-clone, and this is /);
  assert.ok(!fs.existsSync(path.join(root, '.agents')), 'nothing was made');
});

test('install checks the Flow home before it makes anything, and keeps it once connected', () => {
  const dir = project('install-no-repo');
  const root = path.join(dir, 'root');

  // gh signed out, and no stand-in: install stops at the sign-in and never
  // asks GitHub for anything.
  const bin = path.join(dir, 'gh-signed-out');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'gh'), '#!/usr/bin/env bash\necho "$*" >> "$(dirname "$0")/calls"\nexit 1\n');
  fs.chmodSync(path.join(bin, 'gh'), 0o755);
  const signedOut = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: '', PATH: pathWith(bin) });
  assert.strictEqual(signedOut.code, 1);
  assert.match(signedOut.stdout, /stopped: gh (is not signed in|did not sign in)/);
  assert.doesNotMatch(fs.readFileSync(path.join(bin, 'calls'), 'utf8'), /repo|api/, 'no repository was looked for or made');
  assert.strictEqual(signedOut.stdout, 'stopped: gh is not signed in, and there is no terminal here to sign in. Run gh auth login, then flow install again.\n');
  assert.ok(!fs.existsSync(root), 'nothing is made');

  const unreachable = flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: path.join(dir, 'nothing-here.git') });
  assert.strictEqual(unreachable.code, 1);
  assert.match(unreachable.stdout, /^stopped: git cannot reach .*nothing-here\.git/);
  assert.ok(!fs.existsSync(path.join(root, '.agents')), 'nothing is linked');

  // Once connected, the repository is kept, whatever the stand-in says next.
  const remote = bareRepo('install-no-repo');
  assert.strictEqual(flow(dir, ['install', '--root', root, '--no-bin'], { FLOW_HOME_REMOTE: remote }).code, 0);
  const again = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(again.code, 0, again.stdout);
  assert.match(again.stdout, new RegExp(`kept: .*\\.flow is sent to ${remote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});
