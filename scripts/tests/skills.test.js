'use strict';
/**
 * `flow skills`: every skill Flow can reach, switched by one line of settings
 * and made real by one link.
 *
 * Each test builds a whole scratch machine: Flow's folder, Claude Code's, a
 * project, and 3 private skills to switch. HOME moves too, since the plugin
 * folder Flow's own skills link into sits under it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { SCRATCH, run, write, skillFile } = require('./helpers/scratch');
const render = require('../lib/render');
const skills = require('../lib/skills/skills');
const logs = require('../lib/logs/logs');

/** A machine with one project and the private skills react, sql and vue. */
function place(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  const project = path.join(dir, 'project');
  fs.mkdirSync(path.join(project, '.flow'), { recursive: true });
  fs.mkdirSync(home, { recursive: true });

  write(home, 'private-skills/react/SKILL.md', skillFile('react', 'React 19 patterns.'));
  write(home, 'private-skills/web/sql/SKILL.md', skillFile('sql', 'Query plans.'));
  write(home, 'private-skills/vue/SKILL.md', skillFile('vue', 'Vue 3.'));

  const env = {
    ...process.env,
    HOME: user,
    FLOW_HOME: home,
    FLOW_PROJECT: project,
    CLAUDE_CONFIG_DIR: path.join(user, '.claude'),
  };
  const flow = (...args) => run('flow.js', ['skills', ...args], { cwd: project, env });
  const priv = path.join(home, 'private-skills');
  return { dir, user, home, project, env, flow, priv, claude: path.join(user, '.claude', 'skills') };
}

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const history = (home) => fs.readFileSync(logs.historyFile(home), 'utf8').trim().split('\n').map(JSON.parse);
const target = (p) => fs.readlinkSync(p);

/** The Flow rows `ls` prints: the dev skills alone, off unless `on` names a level. */
const flowRows = (on = {}) => skills.installable().filter((s) => !skills.essential(s)).map((s) => s.name).sort()
  .map((name) => [`  ${name}`, on[name] ? 'on' : 'off', on[name] || '']);

test('ls shows Flow, private and outside, with the level only where a line set it', () => {
  const at = place('skills-ls');
  write(at.home, 'private-skills/notes/SKILL.md', skillFile('notes', 'My notes.'));
  write(at.claude, 'mine/SKILL.md', skillFile('mine', 'Copied in by hand.'));
  assert.strictEqual(at.flow('on', 'react').code, 0);
  assert.strictEqual(at.flow('on', 'vue', '--global').code, 0);
  assert.strictEqual(at.flow('on', 'review', '--global').code, 0);

  const listed = at.flow('ls');
  assert.strictEqual(listed.code, 0, listed.stderr);
  assert.strictEqual(listed.stdout, render.columns([
    ['', 'state', 'level'],
    ['flow', '', ''],
    ...flowRows({ review: 'global' }),
    ['private', '', ''],
    ['  notes', 'off', ''],
    ['  react', 'on', 'project'],
    ['  sql', 'off', ''],
    ['  vue', 'on', 'global'],
    ['outside', '', ''],
    ['  mine', 'skill', ''],
  ]) + '\n');

  // A bare `ls` is the default action.
  assert.strictEqual(at.flow().stdout, listed.stdout);
});

test('ls lists outside plugins, and never Flow\'s own', () => {
  const at = place('skills-ls-plugins');
  const bin = path.join(at.dir, 'bin');
  const plugins = [{ id: 'flow@skills-dir' }, { id: 'superpowers@claude-plugins-official' }];
  write(bin, 'claude', `#!/usr/bin/env bash\necho '${JSON.stringify(plugins)}'\n`);
  fs.chmodSync(path.join(bin, 'claude'), 0o755);
  const listed = run('flow.js', ['skills', 'ls', '--source', 'outside'], {
    cwd: at.project, env: { ...at.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
  });
  assert.strictEqual(listed.stdout, render.columns([
    ['', 'state', 'level'],
    ['outside', '', ''],
    ['  superpowers', 'plugin', ''],
  ]) + '\n', listed.stderr);
});

test('ls patterns are regular expressions over name and description, and --source lists one group whole', () => {
  const at = place('skills-ls-patterns');

  assert.strictEqual(at.flow('ls', 'que?ry', '--source', 'private').stdout, render.columns([
    ['', 'state', 'level'],
    ['private', '', ''],
    ['  sql', 'off', ''],
  ]) + '\n', 'the description matched, and a skill 2 folders down counts');

  assert.strictEqual(at.flow('ls', '--source', 'private').stdout, render.columns([
    ['', 'state', 'level'],
    ['private', '', ''],
    ['  react', 'off', ''],
    ['  sql', 'off', ''],
    ['  vue', 'off', ''],
  ]) + '\n');

  assert.match(at.flow('ls', 'nothing-matches-this').stdout, /^no skill matches "nothing-matches-this"\.\n$/);

  const bad = at.flow('ls', '(');
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /"\(" is not a pattern/);

  const unknown = at.flow('ls', '--source', 'nope');
  assert.strictEqual(unknown.code, 1);
  assert.match(unknown.stderr, /no source "nope", one of: flow, private, outside/);
});

test('a name no skill has is refused', () => {
  const at = place('skills-unknown');
  const refused = at.flow('on', 'nope');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /no skill named "nope"\. flow skills ls <pattern> searches every group\./);
});

test('on links a private skill, says what it costs, and writes the history', () => {
  const at = place('skills-private-on');
  const on = at.flow('on', 'react', '--global');
  assert.strictEqual(on.code, 0, on.stderr);
  assert.strictEqual(target(path.join(at.claude, 'react')), path.join(at.priv, 'react'));
  assert.match(on.stdout, /on: react, everywhere\. Every session now loads its description/);

  assert.strictEqual(at.flow('on', 'sql', '--global').code, 0);
  assert.strictEqual(target(path.join(at.claude, 'sql')), path.join(at.priv, 'web', 'sql'));

  assert.deepStrictEqual(history(at.home).map((h) => [h.type, h.name, h.by]), [
    ['skill', 'react', 'flow skills on'],
    ['skill', 'sql', 'flow skills on'],
  ]);
});

test('on, off and reset write one line at each level, and the links follow', () => {
  const at = place('skills-levels');
  const link = path.join(at.project, '.claude', 'skills', 'react');

  const on = at.flow('on', 'react');
  assert.strictEqual(on.code, 0, on.stderr);
  assert.match(on.stdout, /^on: react, this project\.\n/);
  assert.match(on.stdout, /Restart Claude Code: it only watches a skills folder that existed when the session started\./);
  assert.strictEqual(target(link), path.join(at.priv, 'react'));
  assert.deepStrictEqual(read(path.join(at.project, '.flow', 'settings.json')), { skills: { react: 'on' } });

  // On for the machine, the project's own link would load it twice.
  assert.strictEqual(at.flow('on', 'react', '--global').code, 0);
  assert.strictEqual(target(path.join(at.claude, 'react')), path.join(at.priv, 'react'));
  assert.ok(!fs.existsSync(link), 'the machine link covers the project');
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')).skills, { react: 'on' });

  // Off everywhere, the project's own line applies again.
  assert.strictEqual(at.flow('off', 'react', '--global').code, 0);
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')).skills, { react: 'off' });
  assert.ok(!fs.existsSync(path.join(at.claude, 'react')), 'off everywhere removes the machine link');
  assert.strictEqual(target(link), path.join(at.priv, 'react'), 'and the project line applies again');

  const reset = at.flow('reset', 'react', '--global');
  assert.strictEqual(reset.code, 0, reset.stderr);
  assert.match(reset.stdout, /^reset: react, everywhere\.\n/);
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.json')), 'a file left empty goes');
  assert.strictEqual(target(link), path.join(at.priv, 'react'), 'the project line still decides');

  assert.deepStrictEqual(history(at.home).filter((h) => h.type === 'skill').map((h) => [h.name, h.state, h.level]), [
    ['react', 'on', 'project'],
    ['react', 'on', 'global'],
    ['react', 'off', 'global'],
    ['react', 'reset', 'global'],
  ]);
});

test('--machine is refused, and a line in settings.local.json switches nothing', () => {
  const at = place('skills-no-machine');

  const refused = at.flow('on', 'vue', '--machine');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /unknown flag "--machine", one of: --global/);

  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ skills: { vue: 'on' } }));
  assert.strictEqual(at.flow('ls').code, 0);
  assert.ok(!fs.existsSync(path.join(at.claude, 'vue')), 'the local file holds paths, never a switch');
});

test('a Flow skill has no project level, and a project cannot hide a skill the machine has on', () => {
  const at = place('skills-refused');
  at.flow('on', 'vue', '--global');

  const flowSkill = at.flow('off', 'review');
  assert.strictEqual(flowSkill.code, 1);
  assert.match(flowSkill.stderr, /review is a Flow skill, and Flow's skills load for the whole machine: add --global\./);

  const hidden = at.flow('off', 'vue');
  assert.strictEqual(hidden.code, 1);
  assert.match(hidden.stderr, /vue is on everywhere \(--global\), and a project cannot hide a skill linked for the whole machine yet\.\n {2}flow skills off vue --global/);
  assert.ok(!fs.existsSync(path.join(at.project, '.flow', 'settings.json')), 'nothing was written');

  const outside = run('flow.js', ['skills', 'on', 'vue'], {
    cwd: at.dir,
    env: { ...process.env, HOME: at.user, FLOW_HOME: at.home, FLOW_PROJECT: '' },
  });
  assert.notStrictEqual(outside.code, 0, 'no flag outside a project is refused');
});

test('a dev skill switched on everywhere gets its link in the plugin folder, and loses it once reset', () => {
  const at = place('skills-flow-on');
  const linkDir = skills.linkDir(path.join(at.user, '.agents'));
  const review = skills.installable().find((s) => s.name === 'review');
  fs.mkdirSync(linkDir, { recursive: true });

  assert.strictEqual(at.flow('on', 'review', '--global').code, 0);
  assert.strictEqual(target(path.join(linkDir, 'review')), review.dir);

  assert.strictEqual(at.flow('reset', 'review', '--global').code, 0);
  assert.ok(!fs.existsSync(path.join(linkDir, 'review')), 'off again by default');
});

test('an essential skill cannot be switched, stays linked whatever a line says, and ls leaves it out', () => {
  const at = place('skills-essential');
  const linkDir = skills.linkDir(path.join(at.user, '.agents'));
  const groundwork = skills.installable().find((s) => s.name === 'groundwork');
  fs.mkdirSync(linkDir, { recursive: true });

  for (const args of [['off', 'groundwork', '--global'], ['on', 'groundwork', '--global']]) {
    const refused = at.flow(...args);
    assert.strictEqual(refused.code, 1);
    assert.match(refused.stderr, /groundwork is part of Flow's workflow and always on\. Only the skills in skills\/dev\/ switch\./);
  }
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.json')), 'nothing was written');

  // A line written by hand changes nothing, and reset still removes it.
  fs.writeFileSync(path.join(at.home, 'settings.json'), JSON.stringify({ skills: { groundwork: 'off' } }));
  const listed = at.flow('ls');
  assert.strictEqual(target(path.join(linkDir, 'groundwork')), groundwork.dir, 'linked despite the line');
  assert.doesNotMatch(listed.stdout, /groundwork/);
  assert.strictEqual(at.flow('ls', 'groundwork').stdout, 'no skill matches "groundwork".\n', 'not even when searched for');

  assert.strictEqual(at.flow('reset', 'groundwork', '--global').code, 0);
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.json')), 'the line is gone');
});

test('a name a Flow skill and a private skill share is refused', () => {
  const at = place('skills-clash');
  write(at.home, 'private-skills/review/SKILL.md', skillFile('review', 'My own review.'));

  const refused = at.flow('on', 'review', '--global');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /"review" is both a Flow skill and a private one\. Rename the private one\./);
});

test('a dead link into the private folder is swept, and a folder or link Flow never made is left alone', () => {
  const at = place('skills-sweep');
  fs.mkdirSync(at.claude, { recursive: true });
  fs.symlinkSync(path.join(at.priv, 'gone'), path.join(at.claude, 'gone'));
  fs.symlinkSync(path.join(at.dir, 'elsewhere'), path.join(at.claude, 'theirs'));
  write(at.claude, 'vue/SKILL.md', skillFile('vue', 'A copy made by hand.'));

  const on = at.flow('on', 'vue', '--global');
  assert.strictEqual(on.code, 1, 'a real folder where the link goes is a problem');
  assert.match(on.stderr, /vue is a real folder, not a link: left alone\./);
  assert.ok(fs.statSync(path.join(at.claude, 'vue')).isDirectory());
  assert.match(on.stdout, /unlinked: .*gone/);
  assert.ok(fs.lstatSync(path.join(at.claude, 'theirs')).isSymbolicLink(), "another tool's link stays");
});

test('a line left behind by a removed skill shows as missing, and reset still removes it', () => {
  const at = place('skills-missing');
  write(at.home, 'private-skills/old/SKILL.md', skillFile('old', 'Soon gone.'));
  at.flow('on', 'old', '--global');
  fs.rmSync(path.join(at.priv, 'old'), { recursive: true });

  assert.match(at.flow('ls').stdout,
    /missing: old is on at global level, and no skill has that name\. flow skills reset old --global removes the line\./);
  assert.strictEqual(at.flow('reset', 'old', '--global').code, 0, 'a line can outlive its skill and still be reset');
  assert.doesNotMatch(at.flow('ls').stdout, /missing/);
});
