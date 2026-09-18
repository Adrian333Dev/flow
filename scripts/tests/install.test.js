'use strict';
/**
 * `flow install`: what installs, and where each piece lands.
 *
 * Every install here targets a scratch root and passes --no-bin. A test that
 * wrote into the real home folder would install Flow on the machine running it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, run, flow, REPO } = require('./helpers/scratch');

const linkTarget = (p) => fs.readlinkSync(p);

/** Where each piece lands under a scratch root standing in for `~`. */
function paths(root) {
  const agents = path.join(root, '.agents');
  const claude = path.join(root, '.claude');
  const plugin = path.join(agents, 'skills', 'flow');
  return {
    agents,
    claude,
    codex: path.join(root, '.codex'),
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
    'a typed-only skill installs like any other');
  assert.strictEqual(linkTarget(at.skill('review')), path.join(REPO, 'skills', 'dev', 'review'),
    'every group outside drafts/ installs');

  // scripts and references live under ~/.flow: Claude Code reads neither, and
  // the hooks and skills name both by path.
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'scripts')), path.join(REPO, 'scripts'));
  assert.strictEqual(linkTarget(path.join(at.flowHome, 'references')), path.join(REPO, 'references'));
  assert.ok(!fs.existsSync(path.join(at.claude, 'scripts')), 'scripts never land under ~/.claude');
  assert.ok(!fs.existsSync(path.join(at.claude, 'commands')), 'nothing links a commands folder any more');

  // One real rule file, reached two ways.
  const rules = path.join(at.agents, 'AGENTS.md');
  assert.strictEqual(fs.readFileSync(rules, 'utf8'), fs.readFileSync(path.join(REPO, 'home', 'AGENTS.md'), 'utf8'));
  assert.strictEqual(fs.readFileSync(path.join(at.claude, 'CLAUDE.md'), 'utf8'), `@${rules}\n`,
    'a scratch root gets the full path, since ~ would reach the real home folder');
  assert.strictEqual(linkTarget(path.join(at.codex, 'AGENTS.md')), rules);
  assert.match(first.stdout, /merge/, 'settings are left for a human to merge');

  // A skill renamed in the clone leaves a link pointing at nothing.
  fs.symlinkSync(path.join(REPO, 'skills', 'phases', 'write-tickets'), at.skill('write-tickets'));
  fs.appendFileSync(rules, '\n## The user\n\nWrites by voice.\n');

  const second = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.match(second.stdout, /unlinked \(gone\): .*\.agents\/skills\/flow\/skills\/write-tickets/);
  assert.ok(fs.existsSync(at.skill('groundwork')), 'still linked after a re-run');
  assert.match(second.stdout, /kept: .*\.agents\/AGENTS\.md, yours/);
  assert.match(fs.readFileSync(rules, 'utf8'), /Writes by voice/, 'the rule file is never overwritten');
  assert.match(second.stdout, /kept: .*\.claude\/CLAUDE\.md, already importing/);
});

test('install fills an empty CLAUDE.md and leaves a written one alone', () => {
  const dir = project('install-claude-md');
  const root = path.join(dir, 'root');
  const at = paths(root);
  const claudeRules = path.join(at.claude, 'CLAUDE.md');
  const codexRules = path.join(at.codex, 'AGENTS.md');

  // A fresh Claude Code install can leave an empty CLAUDE.md, and an empty
  // file holds nothing to lose.
  fs.mkdirSync(at.claude, { recursive: true });
  fs.writeFileSync(claudeRules, '');
  const empty = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(empty.code, 0, empty.stderr);
  assert.strictEqual(fs.readFileSync(claudeRules, 'utf8'), `@${path.join(at.agents, 'AGENTS.md')}\n`);

  // Rules written by hand, in either file, are never replaced. The output
  // names what to move and where.
  fs.writeFileSync(claudeRules, 'My own rules.\n');
  fs.unlinkSync(codexRules);
  fs.writeFileSync(codexRules, 'Codex rules of my own.\n');
  const written = flow(dir, ['install', '--root', root, '--no-bin']);
  assert.strictEqual(written.code, 0, written.stderr);
  assert.strictEqual(fs.readFileSync(claudeRules, 'utf8'), 'My own rules.\n');
  assert.strictEqual(fs.readFileSync(codexRules, 'utf8'), 'Codex rules of my own.\n');
  assert.match(written.stdout, /CLAUDE\.md, yours, and it does not import/);
  assert.match(written.stdout, /\.codex\/AGENTS\.md, yours, so Codex reads it instead/);
});

test('install never reaches outside the root it was given', () => {
  const dir = project('install-scoped');
  const root = path.join(dir, 'root');
  flow(dir, ['install', '--root', root, '--no-bin']);

  assert.deepStrictEqual(fs.readdirSync(dir), ['root'], 'nothing lands beside the root');
  assert.deepStrictEqual(fs.readdirSync(root).sort(), ['.agents', '.claude', '.codex', '.flow']);
});

test('the flags that took one folder each are gone', () => {
  const dir = project('install-old-flags');
  const old = run('flow/flow.js', ['install', '--home', path.join(dir, 'home'), '--no-bin']);
  assert.notStrictEqual(old.code, 0, 'an unknown flag refuses rather than installing for real');
  assert.deepStrictEqual(fs.readdirSync(dir), [], 'nothing was written before the refusal');
});
