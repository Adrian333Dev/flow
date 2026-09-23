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
const { project, run, flow, gitRepo, skillFile, setUp, REPO } = require('./helpers/scratch');

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
    flow(dir, ['install', '--root', root, '--no-bin']);
    assert.ok(!fs.existsSync(at.skill('test-only-draft')), 'a draft is skipped by the linker');
    assert.ok(fs.existsSync(at.skill('groundwork')), 'every other group still links');

    flow(dir, ['install', '--root', root, '--no-bin', '--drafts']);
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

  const first = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(first.code, 0, first.stderr);

  // The plugin folder is real and lives in ~/.agents, where Codex reads it.
  // Claude Code reaches the same folder through one link.
  assert.ok(!fs.lstatSync(at.plugin).isSymbolicLink(), 'the plugin folder is a real folder');
  assert.strictEqual(linkTarget(path.join(at.claude, 'skills', 'flow')), at.plugin);
  assert.strictEqual(
    fs.readFileSync(path.join(at.plugin, '.claude-plugin', 'plugin.json'), 'utf8'),
    fs.readFileSync(path.join(REPO, 'skills', '.claude-plugin', 'plugin.json'), 'utf8')
  );
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
  assert.ok(!fs.existsSync(path.join(at.claude, 'commands')), 'nothing links a commands folder any more');

  // The rule file and the line importing it are /flow:setup-machine's.
  // Install leaves both alone and says which command finishes the machine.
  assert.ok(!fs.existsSync(path.join(at.agents, 'AGENTS.md')), 'no rule file yet');
  assert.ok(!fs.existsSync(path.join(at.claude, 'CLAUDE.md')), 'no import line yet');
  assert.ok(!fs.existsSync(path.join(root, '.codex')), 'nothing under ~/.codex at all');
  assert.match(first.stdout, /restart Claude Code, then type \/flow:setup-machine/);

  // Where the clone sits: every other clone goes beside this link, and no
  // setting records the path.
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'repos', 'flow')), REPO);
  assert.ok(!fs.existsSync(path.join(at.flowHome, 'settings.local.json')), 'no clone key');
  assert.match(first.stdout, /could not clone Adrian333Dev\/util: .*Run flow install again once that is fixed\./,
    'a clone that fails is a line of the report, never a stop');
  const history = fs.readFileSync(path.join(at.flowHome, 'history.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepStrictEqual(history.map((h) => [h.type, h.clone]), [['install', REPO]]);

  // A skill renamed in the clone leaves a link pointing at nothing.
  fs.symlinkSync(path.join(REPO, 'skills', 'phases', 'write-tickets'), at.skill('write-tickets'));

  const second = flow(dir, ['install', '--root', root, '--no-bin']);
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

  const first = flow(dir, ['install', '--root', root, '--no-bin']);
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
  const second = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.doesNotMatch(second.stdout, /this machine as it was before Flow/);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(file, 'utf8')), manifest, 'nothing was added');
});

test('a name that has left the BIN map is unlinked, and another tool keeps its own', () => {
  const dir = project('install-bin');
  const root = path.join(dir, 'root');
  const bin = path.join(root, '.local', 'bin');

  assert.strictEqual(flow(dir, ['install', '--root', root]).code, 0);
  assert.strictEqual(linkTarget(path.join(bin, 'flow')), path.join(REPO, 'scripts', 'flow', 'flow.js'));
  assert.strictEqual(linkTarget(path.join(bin, 'fw')), path.join(REPO, 'scripts', 'flow', 'flow.js'));

  // gsave left for util on 2026-08-30. Its link still resolved, so nothing
  // ever noticed it.
  fs.symlinkSync(path.join(REPO, 'scripts', 'flow', 'flow.js'), path.join(bin, 'gsave'));
  fs.symlinkSync(path.join(dir, 'other-tool.js'), path.join(bin, 'other'));

  const again = flow(dir, ['install', '--root', root]);
  assert.match(again.stdout, /unlinked \(renamed\): .*bin\/gsave/);
  assert.ok(!fs.existsSync(path.join(bin, 'gsave')), 'the stale name is gone');
  assert.ok(fs.lstatSync(path.join(bin, 'other')).isSymbolicLink(), 'a link into anywhere else is left alone');
  assert.ok(fs.existsSync(path.join(bin, 'flow')), 'the names still in the map stay');
});

test('the import line comes from home/CLAUDE.md, with ~ kept only for the real home folder', () => {
  const os = require('os');
  const machine = require('../flow/lib/machine');
  assert.strictEqual(fs.readFileSync(path.join(REPO, 'home', 'CLAUDE.md'), 'utf8'), '@~/.agents/AGENTS.md\n');
  assert.strictEqual(machine.importLine(REPO, os.homedir()), '@~/.agents/AGENTS.md');
  assert.strictEqual(machine.importLine(REPO, '/scratch/root'), '@/scratch/root/.agents/AGENTS.md');
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

  const written = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(written.code, 0, written.stderr);
  assert.strictEqual(fs.readFileSync(claudeRules, 'utf8'), 'My own rules.\n');
  assert.ok(!fs.existsSync(path.join(at.agents, 'AGENTS.md')));
});

test('install never reaches outside the root it was given', () => {
  const dir = project('install-scoped');
  const root = path.join(dir, 'root');
  const before = fs.readdirSync(dir).sort();
  flow(dir, ['install', '--root', root, '--no-bin']);

  assert.deepStrictEqual(fs.readdirSync(dir).sort(), [...before, 'root'].sort(), 'nothing lands beside the root');
  assert.deepStrictEqual(fs.readdirSync(root).sort(), ['.agents', '.claude', '.flow']);
});

test('the flags that took one folder each are gone', () => {
  const dir = project('install-old-flags');
  const before = fs.readdirSync(dir).sort();
  const old = run('flow/flow.js', ['install', '--home', path.join(dir, 'home'), '--no-bin']);
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
  const install = () => run('flow/flow.js', ['install', '--root', root], { cwd: dir, env: { ...process.env, ...env } });

  const first = install();
  assert.strictEqual(first.code, 0, first.stderr);
  for (const id of ['Adrian333Dev/util', 'Adrian333Dev/toolbox', 'Adrian333Dev/domain-skills']) {
    assert.match(first.stdout, new RegExp(`cloned: ${id} into `));
  }
  assert.ok(fs.existsSync(path.join(at.flowHome, 'repos', 'sources', 'Adrian333Dev_domain-skills', 'react', 'SKILL.md')));
  assert.ok(fs.lstatSync(path.join(bin, 'util')).isSymbolicLink(), 'util installed its own name');
  assert.ok(!fs.existsSync(path.join(at.claude, 'skills', 'react')), 'a source skill starts off');

  fs.writeFileSync(path.join(at.flowHome, 'settings.local.json'), JSON.stringify({ skills: { react: 'on' } }));
  fs.rmSync(path.join(bin, 'util'));
  setUp(at.flowHome);

  const second = install();
  assert.strictEqual(second.code, 0, second.stderr);
  assert.doesNotMatch(second.stdout, /cloned:/, 'nothing is cloned twice');
  assert.strictEqual(linkTarget(path.join(at.claude, 'skills', 'react')),
    path.join(at.flowHome, 'repos', 'sources', 'Adrian333Dev_domain-skills', 'react'));
  assert.match(second.stdout, /Flow is already set up on this machine, so there is nothing more to do\./);
  assert.doesNotMatch(second.stdout, /setup-machine/);

  const types = fs.readFileSync(path.join(at.flowHome, 'history.jsonl'), 'utf8').trim().split('\n')
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

  const refused = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.notStrictEqual(refused.code, 0);
  assert.match(refused.stderr, /repos\/flow is .*other-clone, and this is /);
  assert.ok(!fs.existsSync(path.join(root, '.agents')), 'nothing was made');
});
