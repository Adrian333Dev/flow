'use strict';
/**
 * Every skill repository updating itself: `scripts/skills-pull.js` and the
 * library under it. The domain-skills repository stands in for all of them.
 *
 * Every test builds 2 real repositories under tmp/, an upstream and a clone of
 * it, because the whole feature is 2 git guards and a pull. Nothing reaches
 * the network: a clone of a folder is a clone. `GIT_CONFIG_GLOBAL` is emptied
 * so this machine's own git settings cannot change what a test sees, and
 * FLOW_HOME points at a scratch folder, so the real `~/.flow` is never read or
 * written.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SCRATCH, run } = require('./helpers/scratch');
const update = require('../flow/lib/skills-update');

/**
 * git with no machine settings behind it, and an identity of its own. The
 * ceiling stops it at the scratch folder, which sits inside Flow's own
 * repository: a commit whose folder lost its .git would otherwise land there.
 */
const CLEAN = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
  GIT_CEILING_DIRECTORIES: SCRATCH,
};

function git(dir, args) {
  const ran = spawnSync('git', [
    '-c', 'user.email=tests@flow', '-c', 'user.name=Flow tests',
    '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main',
    ...args,
  ], { cwd: dir, env: CLEAN, encoding: 'utf8' });
  assert.strictEqual(ran.status, 0, `git ${args.join(' ')} in ${dir}: ${ran.stderr}`);
  return (ran.stdout || '').trim();
}

function skill(root, name, text) {
  const file = path.join(root, 'skills', name, 'SKILL.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\nname: ${name}\ndescription: ${text}\n---\n`);
  return file;
}

const body = (root, name) => fs.readFileSync(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');

/** An upstream holding 2 skills, a clone of it, and a machine pointed at that clone. */
function place(name, settings = {}) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const upstream = path.join(dir, 'upstream');
  fs.mkdirSync(upstream, { recursive: true });
  skill(upstream, 'react', 'React 19.');
  skill(upstream, 'sql', 'Query plans.');
  git(upstream, ['init', '-q']);
  git(upstream, ['add', '-A']);
  git(upstream, ['commit', '-q', '-m', 'the skills']);

  // Where `flow install` puts the default source, so no setting names it.
  const home = path.join(dir, 'flow-home');
  const clone = path.join(home, 'repos', 'sources', 'Adrian333Dev_domain-skills');
  fs.mkdirSync(path.dirname(clone), { recursive: true });
  git(dir, ['clone', '-q', upstream, clone]);
  fs.writeFileSync(path.join(home, 'settings.json'), JSON.stringify(settings));

  return { dir, upstream, clone, home, at: { flow: home } };
}

/** One more commit upstream, which is the news a session goes looking for. */
function commit(upstream, name, text) {
  skill(upstream, name, text);
  git(upstream, ['add', '-A']);
  git(upstream, ['commit', '-q', '-m', `${name}: ${text}`]);
}

/** The background job, run in the foreground so a test can see what it did. */
const pull = (home) => run('skills-pull.js', [], { env: { ...CLEAN, FLOW_HOME: home } });

/** The one note the single clone left, or null. */
const note = (home) => {
  const notes = update.readNote({ flow: home });
  return notes && notes[0];
};

test('a pull brings the clone up to date and leaves nothing to report', () => {
  const at = place('skills-pull');
  commit(at.upstream, 'react', 'React 20.');

  const ran = pull(at.home);
  assert.strictEqual(ran.code, 0, ran.stderr);
  assert.strictEqual(ran.stdout, '', 'nobody is watching the background job');
  assert.match(body(at.clone, 'react'), /React 20\./, 'every project linking react is current now');
  assert.strictEqual(note(at.home), null, 'and a session has nothing to say');
  assert.strictEqual(update.stale(at.clone), false, 'the fetch just happened, so the next session leaves it alone');

  const [line] = fs.readFileSync(path.join(at.home, 'history.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(line.type, 'pull');
  assert.strictEqual(line.source, 'Adrian333Dev/domain-skills');
  assert.deepStrictEqual(line.changed, ['react'], 'the history names the skills a pull changed');
});

test('uncommitted work in the clone stops the pull and is left untouched', () => {
  const at = place('skills-dirty');
  commit(at.upstream, 'react', 'React 20.');
  skill(at.clone, 'react', 'Half a sentence the user is still writing.');

  const ran = pull(at.home);
  assert.strictEqual(ran.code, 0, ran.stderr);

  const found = note(at.home);
  assert.strictEqual(found.state, 'dirty');
  assert.strictEqual(found.files, 1);
  assert.match(body(at.clone, 'react'), /Half a sentence/, 'the work in the clone is still there');
  assert.match(update.line(found), /^domain-skills has 1 uncommitted file, so none of its skills was updated/);
});

test('a pull that would not fast-forward is refused, and git says why', () => {
  const at = place('skills-diverged');
  commit(at.upstream, 'react', 'React 20.');
  skill(at.clone, 'react', 'What this machine wrote.');
  git(at.clone, ['add', '-A']);
  git(at.clone, ['commit', '-q', '-m', 'local work']);

  const ran = pull(at.home);
  assert.strictEqual(ran.code, 0, ran.stderr);

  const found = note(at.home);
  assert.strictEqual(found.state, 'blocked');
  assert.ok(found.why.length, `git said nothing: ${JSON.stringify(found)}`);
  assert.match(body(at.clone, 'react'), /What this machine wrote/, 'the local commit still stands');
  assert.match(update.line(found), /could not be updated/);
});

test('with the update off, a fetch names the skills behind and stops once they are in', () => {
  const at = place('skills-fetch', { skillsAutoUpdate: false });
  commit(at.upstream, 'sql', 'Query plans, and now locking.');

  assert.strictEqual(pull(at.home).code, 0);
  const found = note(at.home);
  assert.strictEqual(found.state, 'behind');
  assert.strictEqual(found.count, 1);
  assert.deepStrictEqual(found.skills, ['sql'], 'the names are the news, not the number of commits');
  assert.match(body(at.clone, 'sql'), /Query plans\.\n/, 'a fetch writes nothing into the working tree');
  assert.match(update.line(found), /^domain-skills is behind\. 1 skill changed: sql\./);

  // The user pulls by hand. The next session checks again and says nothing.
  git(at.clone, ['merge', '-q', '--ff-only', 'origin/main']);
  assert.strictEqual(pull(at.home).code, 0);
  assert.strictEqual(note(at.home), null);
  assert.match(body(at.clone, 'sql'), /and now locking/);
});

test('a note waiting is checked every session, and a fresh clone with none is left alone', () => {
  const at = place('skills-due');
  const was = process.env.FLOW_HOME;
  process.env.FLOW_HOME = at.home;
  try {
    assert.strictEqual(update.due(at.at), true, 'a clone that never fetched here is worth a look');
    assert.strictEqual(pull(at.home).code, 0);
    assert.strictEqual(update.due(at.at), false, 'nothing behind and a fresh fetch: no session does anything');

    update.writeNote(at.at, [{ state: 'blocked', why: 'something git said.', clone: 'domain-skills' }]);
    assert.strictEqual(update.due(at.at), true, 'a note is only cleared by looking again');
  } finally {
    if (was === undefined) delete process.env.FLOW_HOME;
    else process.env.FLOW_HOME = was;
  }
});
