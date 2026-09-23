'use strict';
/**
 * `flow skills`: every skill Flow can reach, switched by one line of settings
 * and made real by one link.
 *
 * Each test builds a whole scratch machine: Flow's folder, Claude Code's, a
 * project, and the skill repositories as real git repositories that
 * `FLOW_GIT_BASE` stands in for GitHub with. HOME moves too, since the plugin
 * folder Flow's own skills link into sits under it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { SCRATCH, run, write, gitRepo, skillFile, setUp } = require('./helpers/scratch');
const render = require('../flow/lib/render');
const skills = require('../flow/lib/skills');

/** A machine with one project, and 2 repositories waiting to be added. */
function place(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  const project = path.join(dir, 'project');
  const remote = path.join(dir, 'remote');
  fs.mkdirSync(path.join(project, '.flow'), { recursive: true });
  setUp(home);

  gitRepo(path.join(remote, 'Adrian333Dev', 'domain-skills'), {
    'react/SKILL.md': skillFile('react', 'React 19 patterns.'),
    'web/sql/SKILL.md': skillFile('sql', 'Query plans.'),
    'vue/SKILL.md': skillFile('vue', 'Vue 3.'),
  });
  gitRepo(path.join(remote, 'me', 'one'), { 'SKILL.md': skillFile('last30days', 'The last 30 days.') });
  gitRepo(path.join(remote, 'me', 'empty'), { 'README.md': 'nothing here\n' });

  const env = {
    ...process.env,
    HOME: user,
    FLOW_HOME: home,
    FLOW_PROJECT: project,
    CLAUDE_CONFIG_DIR: path.join(user, '.claude'),
    FLOW_GIT_BASE: `${remote}${path.sep}`,
  };
  const flow = (...args) => run('flow/flow.js', ['skills', ...args], { cwd: project, env });
  const clone = path.join(home, 'repos', 'sources', 'Adrian333Dev_domain-skills');
  return { dir, user, home, project, flow, clone, claude: path.join(user, '.claude', 'skills') };
}

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const history = (home) => fs.readFileSync(path.join(home, 'history.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const target = (p) => fs.readlinkSync(p);

/** Flow's own rows, read off the tree, so a new skill never breaks a literal. */
/** The Flow rows `ls` prints: the dev skills alone, off unless `on` names a level. */
const flowRows = (on = {}) => skills.installable().filter((s) => !skills.essential(s)).map((s) => s.name).sort()
  .map((name) => [`  ${name}`, on[name] ? 'on' : 'off', on[name] || '']);

test('ls shows Flow, each source, private and outside, with the level only where a line set it', () => {
  const at = place('skills-ls');
  assert.strictEqual(at.flow('add', 'Adrian333Dev/domain-skills').code, 0);
  write(at.home, 'private-skills/notes/SKILL.md', skillFile('notes', 'My notes.'));
  write(at.claude, 'mine/SKILL.md', skillFile('mine', 'Copied in by hand.'));
  assert.strictEqual(at.flow('on', 'react').code, 0);
  assert.strictEqual(at.flow('on', 'vue', '--machine').code, 0);
  assert.strictEqual(at.flow('on', 'review', '--global').code, 0);

  const listed = at.flow('ls');
  assert.strictEqual(listed.code, 0, listed.stderr);
  assert.strictEqual(listed.stdout, render.columns([
    ['', 'state', 'level'],
    ['flow', '', ''],
    ...flowRows({ review: 'global' }),
    ['domain-skills', '1 more', ''],
    ['  react', 'on', 'project'],
    ['  vue', 'on', 'machine'],
    ['private', '', ''],
    ['  notes', 'off', ''],
    ['outside', '', ''],
    ['  mine', 'skill', ''],
  ]) + '\n');

  // A bare `ls` is the default action.
  assert.strictEqual(at.flow().stdout, listed.stdout);
});

test('ls patterns are regular expressions over name and description, and --source lists one whole', () => {
  const at = place('skills-ls-patterns');
  at.flow('add', 'Adrian333Dev/domain-skills');

  assert.strictEqual(at.flow('ls', 'que?ry', '--source', 'domain-skills').stdout, render.columns([
    ['', 'state', 'level'],
    ['domain-skills', '', ''],
    ['  sql', 'off', ''],
  ]) + '\n', 'the description matched, and every source skill shows once a pattern is given');

  assert.strictEqual(at.flow('ls', '--source', 'Adrian333Dev/domain-skills').stdout, render.columns([
    ['', 'state', 'level'],
    ['domain-skills', '', ''],
    ['  react', 'off', ''],
    ['  sql', 'off', ''],
    ['  vue', 'off', ''],
  ]) + '\n', 'owner/repo names a source as well as its name');

  assert.match(at.flow('ls', 'nothing-matches-this').stdout, /^no skill matches "nothing-matches-this"\.\n$/);

  const bad = at.flow('ls', '(');
  assert.strictEqual(bad.code, 1);
  assert.match(bad.stderr, /"\(" is not a pattern/);

  const unknown = at.flow('ls', '--source', 'nope');
  assert.strictEqual(unknown.code, 1);
  assert.match(unknown.stderr, /no source "nope", one of: flow, domain-skills, private, outside/);
});

test('a source not cloned yet says flow install clones it', () => {
  const at = place('skills-not-cloned');
  const listed = at.flow('ls', '--source', 'domain-skills');
  assert.match(listed.stdout, /domain-skills +not cloned: flow install clones it/);

  const refused = at.flow('on', 'react');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /no skill named "react"\. .*\n  Not cloned yet: domain-skills\. flow install clones them\./);
});

test('add clones a source, refuses a repository with no skill, and turns on the names given', () => {
  const at = place('skills-add');

  const empty = at.flow('add', 'me/empty');
  assert.strictEqual(empty.code, 1);
  assert.match(empty.stderr, /no skill found in me\/empty: no folder in it holds a SKILL\.md\./);
  assert.ok(!fs.existsSync(path.join(at.home, 'repos', 'sources', 'me_empty')), 'the clone went with the refusal');
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.json')), 'and no source was written');

  const bare = at.flow('add', 'Adrian333Dev/domain-skills');
  assert.strictEqual(bare.code, 0, bare.stderr);
  assert.match(bare.stdout, /cloned: Adrian333Dev\/domain-skills into /);
  assert.match(bare.stdout, /3 skills, none switched on by this:\n {2}react +React 19 patterns\./);
  assert.ok(fs.existsSync(path.join(at.clone, 'web', 'sql', 'SKILL.md')), 'a skill 2 folders down counts');
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.json')), 'the default source is listed already, so nothing is written');

  // A repository with SKILL.md at its root is one skill, named by its name: line.
  const one = at.flow('add', 'me/one', 'last30days', '--machine');
  assert.strictEqual(one.code, 0, one.stderr);
  assert.strictEqual(target(path.join(at.claude, 'last30days')), path.join(at.home, 'repos', 'sources', 'me_one'));
  assert.match(one.stdout, /on: last30days, this machine\. Every session on this machine now loads its description/);
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')).sources, ['Adrian333Dev/domain-skills', 'me/one']);

  assert.deepStrictEqual(history(at.home).map((h) => [h.type, h.source || h.name]), [
    ['clone', 'Adrian333Dev/domain-skills'],
    ['clone', 'me/one'],
    ['skill', 'last30days'],
  ]);
  assert.strictEqual(history(at.home)[2].by, 'flow skills add');
});

test('on, off and drop write one line at each level, and the links follow', () => {
  const at = place('skills-levels');
  at.flow('add', 'Adrian333Dev/domain-skills');
  const link = path.join(at.project, '.claude', 'skills', 'react');

  const on = at.flow('on', 'react');
  assert.strictEqual(on.code, 0, on.stderr);
  assert.match(on.stdout, /^on: react, this project\.\n/);
  assert.match(on.stdout, /Restart Claude Code: it only watches a skills folder that existed when the session started\./);
  assert.strictEqual(target(link), path.join(at.clone, 'react'));
  assert.deepStrictEqual(read(path.join(at.project, '.flow', 'settings.json')), { skills: { react: 'on' } });

  // On for the machine, the project's own link would load it twice.
  assert.strictEqual(at.flow('on', 'react', '--global').code, 0);
  assert.strictEqual(target(path.join(at.claude, 'react')), path.join(at.clone, 'react'));
  assert.ok(!fs.existsSync(link), 'the machine link covers the project');
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')).skills, { react: 'on' });

  // The machine level sits between the other 2.
  assert.strictEqual(at.flow('off', 'react', '--machine').code, 0);
  assert.deepStrictEqual(read(path.join(at.home, 'settings.local.json')), { skills: { react: 'off' } });
  assert.ok(!fs.existsSync(path.join(at.claude, 'react')), 'off at machine level beats on at global');
  assert.strictEqual(target(link), path.join(at.clone, 'react'), 'and the project line applies again');

  const dropped = at.flow('drop', 'react', '--machine');
  assert.strictEqual(dropped.code, 0, dropped.stderr);
  assert.match(dropped.stdout, /^dropped: react, this machine\.\n/);
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.local.json')), 'a file left empty goes');
  assert.ok(fs.existsSync(path.join(at.claude, 'react')), 'the global line decides again');

  assert.deepStrictEqual(history(at.home).filter((h) => h.type === 'skill').map((h) => [h.name, h.state, h.level]), [
    ['react', 'on', 'project'],
    ['react', 'on', 'global'],
    ['react', 'off', 'machine'],
    ['react', 'dropped', 'machine'],
  ]);
});

test('a Flow skill has no project level, and a project cannot hide a skill the machine has on', () => {
  const at = place('skills-refused');
  at.flow('add', 'Adrian333Dev/domain-skills', 'vue', '--machine');

  const flowSkill = at.flow('off', 'review');
  assert.strictEqual(flowSkill.code, 1);
  assert.match(flowSkill.stderr, /review is a Flow skill, and Flow's skills load for the whole machine: add --machine or --global\./);

  const hidden = at.flow('off', 'vue');
  assert.strictEqual(hidden.code, 1);
  assert.match(hidden.stderr, /vue is on for this machine, and a project cannot hide a skill linked for the whole machine yet\.\n {2}flow skills off vue --machine/);
  assert.ok(!fs.existsSync(path.join(at.project, '.flow', 'settings.json')), 'nothing was written');

  const outside = run('flow/flow.js', ['skills', 'on', 'vue'], {
    cwd: at.dir,
    env: { ...process.env, HOME: at.user, FLOW_HOME: at.home, FLOW_PROJECT: '' },
  });
  assert.notStrictEqual(outside.code, 0, 'no flag outside a project is refused');
});

test('a dev skill switched on for the machine gets its link in the plugin folder, and loses it once dropped', () => {
  const at = place('skills-flow-on');
  const linkDir = skills.linkDir(path.join(at.user, '.agents'));
  const review = skills.installable().find((s) => s.name === 'review');
  fs.mkdirSync(linkDir, { recursive: true });

  assert.strictEqual(at.flow('on', 'review', '--machine').code, 0);
  assert.strictEqual(target(path.join(linkDir, 'review')), review.dir);

  assert.strictEqual(at.flow('drop', 'review', '--machine').code, 0);
  assert.ok(!fs.existsSync(path.join(linkDir, 'review')), 'off again by default');
});

test('an essential skill cannot be switched, stays linked whatever a line says, and ls leaves it out', () => {
  const at = place('skills-essential');
  const linkDir = skills.linkDir(path.join(at.user, '.agents'));
  const groundwork = skills.installable().find((s) => s.name === 'groundwork');
  fs.mkdirSync(linkDir, { recursive: true });

  for (const args of [['off', 'groundwork', '--machine'], ['on', 'groundwork', '--global']]) {
    const refused = at.flow(...args);
    assert.strictEqual(refused.code, 1);
    assert.match(refused.stderr, /groundwork is part of Flow's workflow and always on\. Only the skills in skills\/dev\/ switch\./);
  }
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.local.json')), 'nothing was written');

  // A line written by hand changes nothing, and drop still removes it.
  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ skills: { groundwork: 'off' } }));
  const listed = at.flow('ls');
  assert.strictEqual(target(path.join(linkDir, 'groundwork')), groundwork.dir, 'linked despite the line');
  assert.doesNotMatch(listed.stdout, /groundwork/);
  assert.doesNotMatch(at.flow('ls', 'groundwork').stdout, /groundwork/, 'not even when searched for');

  assert.strictEqual(at.flow('drop', 'groundwork', '--machine').code, 0);
  assert.ok(!fs.existsSync(path.join(at.home, 'settings.local.json')), 'the line is gone');
});

test('a name 2 sources share needs owner/repo:name', () => {
  const at = place('skills-clash');
  at.flow('add', 'Adrian333Dev/domain-skills');
  gitRepo(path.join(at.dir, 'remote', 'other', 'kit'), { 'react/SKILL.md': skillFile('react', 'Another react.') });
  at.flow('add', 'other/kit');

  const refused = at.flow('on', 'react', '--machine');
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /"react" is in 2 sources\. Name the one you mean:\n {2}Adrian333Dev\/domain-skills:react\n {2}other\/kit:react/);

  assert.strictEqual(at.flow('on', 'other/kit:react', '--machine').code, 0);
  assert.strictEqual(target(path.join(at.claude, 'react')),
    path.join(at.home, 'repos', 'sources', 'other_kit', 'react'));
  assert.deepStrictEqual(read(path.join(at.home, 'settings.local.json')), { skills: { 'other/kit:react': 'on' } });
});

test("a dead link into a source is swept, and a folder or link Flow never made is left alone", () => {
  const at = place('skills-sweep');
  at.flow('add', 'Adrian333Dev/domain-skills');
  fs.mkdirSync(at.claude, { recursive: true });
  fs.symlinkSync(path.join(at.clone, 'gone'), path.join(at.claude, 'gone'));
  fs.symlinkSync(path.join(at.dir, 'elsewhere'), path.join(at.claude, 'theirs'));
  write(at.claude, 'vue/SKILL.md', skillFile('vue', 'A copy made by hand.'));

  const on = at.flow('on', 'vue', '--machine');
  assert.strictEqual(on.code, 1, 'a real folder where the link goes is a problem');
  assert.match(on.stderr, /vue is a real folder, not a link: left alone\./);
  assert.ok(fs.statSync(path.join(at.claude, 'vue')).isDirectory());
  assert.match(on.stdout, /unlinked: .*gone/);
  assert.ok(fs.lstatSync(path.join(at.claude, 'theirs')).isSymbolicLink(), "another tool's link stays");
});

test('drop owner/repo removes the source and its clone, and a line left behind shows as missing', () => {
  const at = place('skills-drop-source');
  at.flow('add', 'me/one', 'last30days', '--machine');

  const dropped = at.flow('drop', 'me/one');
  assert.strictEqual(dropped.code, 0, dropped.stderr);
  assert.match(dropped.stdout, /dropped: me\/one and its clone\nunlinked: .*last30days/);
  assert.ok(!fs.existsSync(path.join(at.home, 'repos', 'sources', 'me_one')));
  assert.deepStrictEqual(read(path.join(at.home, 'settings.json')).sources, ['Adrian333Dev/domain-skills']);

  assert.match(at.flow('ls').stdout,
    /missing: last30days is on at machine level, and no source holds it\. flow skills drop last30days --machine removes the line\./);
  assert.strictEqual(at.flow('drop', 'last30days', '--machine').code, 0, 'a line can outlive its skill and still be dropped');
  assert.doesNotMatch(at.flow('ls').stdout, /missing/);

  const unknown = at.flow('drop', 'me/never');
  assert.strictEqual(unknown.code, 1);
  assert.match(unknown.stderr, /me\/never is not a source\./);
});
