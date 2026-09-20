'use strict';
/**
 * `flow domain-skills`: a skill from the repository, linked into one project.
 *
 * Every test builds its own repository under tmp/ and points FLOW_HOME at a
 * scratch folder holding the setting, so nothing reads the real ~/.flow or the
 * real clone.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { project, write, run, REPO } = require('./helpers/scratch');

/** A project, a repository holding react and postgres, and the setting naming it. */
function setup(name) {
  const dir = project(name);
  const repo = path.join(dir, 'repo', 'skills');
  write(dir, 'repo/skills/react/SKILL.md',
    '---\nname: react\ndescription: React 19 components, hooks and server rendering.\n---\n');
  write(dir, 'repo/skills/postgres/SKILL.md',
    '---\nname: postgres\ndescription: Postgres indexes, query plans and migrations.\n---\n');
  write(dir, 'flow-home/settings.json', JSON.stringify({ domainSkills: repo }));
  const root = path.join(dir, 'project');
  fs.mkdirSync(path.join(root, '.flow'), { recursive: true });
  const flow = (args) => run('flow/flow.js', ['domain-skills', ...args], {
    cwd: root,
    env: { ...process.env, FLOW_PROJECT: root, FLOW_HOME: path.join(dir, 'flow-home') },
  });
  return { dir, repo, root, flow };
}

const list = (root) => fs.readFileSync(path.join(root, '.flow', 'domain-skills.txt'), 'utf8');

test('ls prints every skill with its description, and words narrow it', () => {
  const { flow } = setup('domain-ls');

  const all = flow(['ls']);
  assert.strictEqual(all.code, 0, all.stderr);
  assert.match(all.stdout, /react\s+-\s+React 19 components/);
  assert.match(all.stdout, /postgres\s+-\s+Postgres indexes/);

  // A word matches the description as well as the name, and every word has to.
  const byDescription = flow(['ls', 'hooks']);
  assert.match(byDescription.stdout, /react/);
  assert.ok(!/postgres/.test(byDescription.stdout));
  assert.match(flow(['ls', 'react', 'migrations']).stdout, /no domain skills match "react migrations"/);

  // ls is the default, so the bare group lists and a bare word filters.
  assert.strictEqual(flow([]).stdout, all.stdout);
  assert.strictEqual(flow(['hooks']).stdout, byDescription.stdout);
});

test('add links a skill and lists it, and a bare add relinks everything listed', () => {
  const { repo, root, flow } = setup('domain-add');

  const first = flow(['add', 'react']);
  assert.strictEqual(first.code, 0, first.stderr);
  assert.strictEqual(fs.readlinkSync(path.join(root, '.claude/skills/react')), path.join(repo, 'react'));
  assert.strictEqual(list(root), 'react\n');
  assert.match(first.stdout, /Restart Claude Code/, 'the skills folder did not exist before');

  const second = flow(['add', 'postgres', 'react']);
  assert.strictEqual(second.code, 0, second.stderr);
  assert.strictEqual(list(root), 'postgres\nreact\n', 'sorted, and a repeat adds no line');
  assert.ok(!/Restart/.test(second.stdout), 'the folder exists now, so no restart');
  assert.match(flow(['ls']).stdout, /react\s+added/);

  // A fresh clone on another machine: the list came through git, the links did not.
  fs.rmSync(path.join(root, '.claude'), { recursive: true });
  assert.match(flow(['ls']).stdout, /react\s+not linked/);

  const relink = flow(['add']);
  assert.strictEqual(relink.code, 0, relink.stderr);
  assert.strictEqual(fs.readlinkSync(path.join(root, '.claude/skills/postgres')), path.join(repo, 'postgres'));
  assert.strictEqual(fs.readlinkSync(path.join(root, '.claude/skills/react')), path.join(repo, 'react'));
});

test('a skill missing from the repository costs only that skill', () => {
  const { root, flow } = setup('domain-missing');
  write(root, '.flow/domain-skills.txt', 'postgres\nvue\n');

  const result = flow(['add']);
  assert.strictEqual(result.code, 1);
  assert.match(result.stderr, /no skill named "vue"/);
  assert.ok(fs.existsSync(path.join(root, '.claude/skills/postgres')), 'the other skill still links');
  assert.strictEqual(list(root), 'postgres\nvue\n', 'a skill that failed to link stays listed');

  const empty = setup('domain-empty');
  const nothing = empty.flow(['add']);
  assert.strictEqual(nothing.code, 0, nothing.stderr);
  assert.match(nothing.stdout, /lists no skills/);
});

test('drop removes the link and the line, and leaves what it never made', () => {
  const { dir, root, flow } = setup('domain-drop');
  flow(['add', 'react', 'postgres']);

  const dropped = flow(['drop', 'react']);
  assert.strictEqual(dropped.code, 0, dropped.stderr);
  assert.ok(!fs.existsSync(path.join(root, '.claude/skills/react')));
  assert.strictEqual(list(root), 'postgres\n');

  flow(['drop', 'postgres']);
  assert.ok(!fs.existsSync(path.join(root, '.flow/domain-skills.txt')), 'an empty list is deleted');

  // A project's own skill is a real folder, and a link elsewhere is somebody else's.
  write(root, '.claude/skills/ours/SKILL.md', '---\nname: ours\n---\n');
  write(dir, 'elsewhere/theirs/SKILL.md', '---\nname: theirs\n---\n');
  fs.symlinkSync(path.join(dir, 'elsewhere/theirs'), path.join(root, '.claude/skills/theirs'));

  const refused = flow(['drop', 'ours', 'theirs', 'nothing']);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /ours is a real folder/);
  assert.match(refused.stderr, /theirs links to .*outside/);
  assert.match(refused.stderr, /"nothing" is neither linked nor listed/);
  assert.ok(fs.existsSync(path.join(root, '.claude/skills/ours/SKILL.md')));
  assert.ok(fs.lstatSync(path.join(root, '.claude/skills/theirs')).isSymbolicLink());
});

test('without the setting, or with a path that is gone, it refuses', () => {
  const { dir, repo, flow } = setup('domain-setting');

  fs.rmSync(repo, { recursive: true });
  const gone = flow(['ls']);
  assert.strictEqual(gone.code, 1);
  assert.match(gone.stderr, /points at .* which does not exist/);

  fs.writeFileSync(path.join(dir, 'flow-home/settings.json'), '{}');
  const unset = flow(['add', 'react']);
  assert.strictEqual(unset.code, 1);
  assert.match(unset.stderr, /no domainSkills in/);

  assert.match(flow(['add', '../react']).stderr, /skill name, not a path/);
});

// The design rests on this: the link stays out of git and the list goes in.
// Checked against the template's own .gitignore, since that is what a project starts with.
test('in a project made from the template, git ignores the link and sees the list', () => {
  const { root, flow } = setup('domain-git');
  fs.copyFileSync(path.join(REPO, 'project-template', '.gitignore'), path.join(root, '.gitignore'));
  spawnSync('git', ['init', '-q'], { cwd: root });
  flow(['add', 'react']);

  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root, encoding: 'utf8' });
  assert.match(status.stdout, /\.flow\/domain-skills\.txt/);
  assert.ok(!/\.claude\/skills\/react/.test(status.stdout), status.stdout);
});

// A moved clone leaves dead links, which add has to fix. A live link elsewhere
// came from another installer.
test('add replaces its own link or a dead one, and leaves a live link elsewhere', () => {
  const { dir, repo, root, flow } = setup('domain-replace');
  write(dir, 'elsewhere/react/SKILL.md', '---\nname: react\n---\n');
  fs.mkdirSync(path.join(root, '.claude/skills'), { recursive: true });
  fs.symlinkSync(path.join(dir, 'elsewhere/react'), path.join(root, '.claude/skills/react'));
  fs.symlinkSync(path.join(dir, 'old-clone/skills/postgres'), path.join(root, '.claude/skills/postgres'));

  const result = flow(['add', 'react', 'postgres']);
  assert.strictEqual(result.code, 1);
  assert.match(result.stderr, /\.claude\/skills\/react links to .*elsewhere\/react, which flow domain-skills never made/);
  assert.strictEqual(fs.readlinkSync(path.join(root, '.claude/skills/react')), path.join(dir, 'elsewhere/react'));
  assert.strictEqual(fs.readlinkSync(path.join(root, '.claude/skills/postgres')), path.join(repo, 'postgres'));
  assert.strictEqual(list(root), 'postgres\n');

  assert.strictEqual(flow(['add', 'postgres']).code, 0, 'relinking its own link is a no-op that succeeds');
});
