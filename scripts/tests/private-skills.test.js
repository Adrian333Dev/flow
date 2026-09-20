'use strict';
/**
 * `flow private-skills`: a skill of your own, linked into one project or the
 * machine.
 *
 * FLOW_HOME holds the private folder and CLAUDE_CONFIG_DIR stands in for
 * ~/.claude, so no test reads or writes the real machine.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, run } = require('./helpers/scratch');

/** A project, a private folder holding deploy and billing, and a domain repository holding react. */
function setup(name) {
  const dir = project(name);
  const home = path.join(dir, 'flow-home');
  const claude = path.join(dir, 'claude-home');
  const source = path.join(home, 'private-skills');
  write(home, 'private-skills/deploy/SKILL.md', '---\nname: deploy\ndescription: Ship this machine\'s services.\n---\n');
  write(home, 'private-skills/billing/SKILL.md', '---\nname: billing\ndescription: The Acme billing API.\n---\n');
  write(dir, 'repo/skills/react/SKILL.md', '---\nname: react\ndescription: React 19.\n---\n');
  write(home, 'settings.json', JSON.stringify({ domainSkills: path.join(dir, 'repo', 'skills') }));
  const root = path.join(dir, 'project');
  fs.mkdirSync(path.join(root, '.flow'), { recursive: true });
  const flow = (args) => run('flow/flow.js', ['private-skills', ...args], {
    cwd: root,
    env: { ...process.env, FLOW_PROJECT: root, FLOW_HOME: home, CLAUDE_CONFIG_DIR: claude },
  });
  return { dir, home, claude, source, root, flow };
}

test('ls shows each skill here and on the machine, and words narrow it', () => {
  const { home, flow } = setup('private-ls');

  const all = flow(['ls']);
  assert.strictEqual(all.code, 0, all.stderr);
  assert.match(all.stdout, /SKILL\s+HERE\s+GLOBAL\s+DESCRIPTION/);
  assert.match(all.stdout, /deploy\s+-\s+-\s+Ship this machine's services/);
  assert.match(flow(['acme']).stdout, /billing/);
  assert.ok(!/deploy/.test(flow(['acme']).stdout), 'ls is the default, and a word filters');

  fs.rmSync(path.join(home, 'private-skills'), { recursive: true });
  assert.match(flow([]).stdout, /no skills in .*private-skills\.\n\s+Make one: .*private-skills\/<name>\/SKILL\.md/);
});

test('add links into the project or the machine, and a bare add relinks that list', () => {
  const { claude, source, root, flow } = setup('private-add');

  const here = flow(['add', 'billing']);
  assert.strictEqual(here.code, 0, here.stderr);
  assert.strictEqual(fs.readlinkSync(path.join(root, '.claude/skills/billing')), path.join(source, 'billing'));
  assert.strictEqual(fs.readFileSync(path.join(root, '.flow/private-skills.txt'), 'utf8'), 'billing\n');

  const machine = flow(['add', 'deploy', '--global']);
  assert.strictEqual(machine.code, 0, machine.stderr);
  assert.strictEqual(fs.readlinkSync(path.join(claude, 'skills/deploy')), path.join(source, 'deploy'));
  assert.strictEqual(fs.readFileSync(path.join(source, 'global.txt'), 'utf8'), 'deploy\n');
  assert.ok(!fs.existsSync(path.join(root, '.claude/skills/deploy')), '--global never touches the project');

  const listed = flow(['ls']).stdout;
  assert.match(listed, /billing\s+added\s+-/);
  assert.match(listed, /deploy\s+-\s+added/);

  // A second machine: the private folder came through its own repository, the links did not.
  fs.rmSync(path.join(claude, 'skills'), { recursive: true });
  assert.match(flow(['ls']).stdout, /deploy\s+-\s+not linked/);
  const relink = flow(['add', '--global']);
  assert.strictEqual(relink.code, 0, relink.stderr);
  assert.strictEqual(fs.readlinkSync(path.join(claude, 'skills/deploy')), path.join(source, 'deploy'));
});

test('add refuses a name a Flow skill or a domain skill already uses', () => {
  const { home, source, root, flow } = setup('private-names');
  write(source, 'groundwork/SKILL.md', '---\nname: groundwork\n---\n');
  write(source, 'react/SKILL.md', '---\nname: react\n---\n');

  const refused = flow(['add', 'groundwork', 'react', 'billing']);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /"groundwork" is a Flow skill's name/);
  assert.match(refused.stderr, /"react" is a domain skill's name/);
  assert.ok(!fs.existsSync(path.join(root, '.claude/skills/react')));
  assert.ok(fs.existsSync(path.join(root, '.claude/skills/billing')), 'the free name still links');

  // Without the setting there is no repository, so nothing to clash with.
  fs.writeFileSync(path.join(home, 'settings.json'), '{}');
  assert.strictEqual(flow(['add', 'react']).code, 0);
});

test('drop --global removes the machine link and line, and leaves the project alone', () => {
  const { claude, source, root, flow } = setup('private-drop');
  flow(['add', 'deploy', '--global']);
  flow(['add', 'deploy']);

  const dropped = flow(['drop', 'deploy', '--global']);
  assert.strictEqual(dropped.code, 0, dropped.stderr);
  assert.ok(!fs.existsSync(path.join(claude, 'skills/deploy')));
  assert.ok(!fs.existsSync(path.join(source, 'global.txt')), 'an empty list is deleted');
  assert.ok(fs.existsSync(path.join(root, '.claude/skills/deploy')));

  assert.match(flow(['drop', 'billing', '--global']).stderr, /"billing" is neither linked nor listed on this machine/);
});
