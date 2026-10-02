'use strict';
/**
 * `flow uninstall`: the locks refuse it, and a machine with no original is
 * stripped path by path.
 *
 * Nothing here gets past the locks, because nothing can: the command needs a
 * word typed at a terminal, and a test has no terminal. What happens after the
 * word lives in `lib/machine/installed.js`, so the test calls that directly, the way
 * restore.test.js calls `originals.restore`.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { REPO, project, run, setupMachine, bareRepo } = require('./helpers/scratch');
const installed = require('../lib/machine/installed');
const folders = require('../lib/paths').folders;

const exists = (p) => {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
};

/** A machine built by `flow install` itself, with the settings merge done. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const at = folders(root);

  const made = run('flow.js', ['install', '--root', root, '--no-bin', '--no-clone'], { env: { ...process.env, FLOW_HOME_REMOTE: bareRepo(path.basename(dir)) } });
  assert.strictEqual(made.code, 0, made.stderr);
  setupMachine(root);

  return { dir, root, at };
}

test('uninstall refuses at the locks, and removes nothing', () => {
  const m = machine('uninstall-locks');

  // Lock 1 refuses while a session is running, lock 2 where no terminal is
  // attached. A test process has no terminal, so one of the two always fires.
  const refused = run('flow.js', ['uninstall', '--root', m.root], { cwd: m.dir });
  assert.notStrictEqual(refused.code, 0);
  assert.match(refused.stderr, /^flow: (Close these sessions first: |Run this in a terminal, and type uninstall when it asks\.)/);

  assert.ok(exists(path.join(m.at.agents, 'skills', 'flow')), 'the plugin folder is still there');
  assert.ok(exists(path.join(m.at.flow, 'scripts')), '~/.flow is still there');
  assert.ok(fs.existsSync(REPO), 'the clone is still there');
});

test('unsent work in ~/.flow stops the uninstall before the locks, and removes nothing', () => {
  const m = machine('uninstall-unsent');
  fs.writeFileSync(path.join(m.at.flow, 'workflow-notes.md'), 'A note no other machine has.\n');

  const refused = run('flow.js', ['uninstall', '--root', m.root], { cwd: m.dir });
  assert.notStrictEqual(refused.code, 0);
  assert.match(refused.stderr, /holds work no other machine has: .*Run flow sync, then uninstall again\./);
  assert.ok(exists(path.join(m.at.flow, 'workflow-notes.md')), 'the note is still there');
});

test('a machine with no original is stripped path by path, and shared files keep what is theirs', () => {
  const m = machine('uninstall-strip');
  const { at } = m;

  // The settings merge a real machine does by hand, with a hook of the user's
  // own beside Flow's.
  const template = JSON.parse(fs.readFileSync(path.join(REPO, 'home', 'settings.json'), 'utf8')
    .split('$HOME/.flow').join(at.flow));
  template.hooks.SessionStart = [{ hooks: [{ type: 'command', command: 'node ~/my-own.js' }] }];
  fs.writeFileSync(path.join(at.claude, 'settings.json'), JSON.stringify(template, null, 2) + '\n');

  const claudeRules = path.join(at.claude, 'CLAUDE.md');
  fs.writeFileSync(claudeRules, `${fs.readFileSync(claudeRules, 'utf8').trim()}\n\nMy own rule.\n`);

  const done = installed.strip(REPO, at, { bin: null });

  for (const p of installed.paths(REPO, at, { bin: null })) {
    assert.ok(!exists(p), `${p} is gone`);
  }
  assert.ok(done.some((l) => l.includes('skills/flow')), 'every removal is named');

  const left = JSON.parse(fs.readFileSync(path.join(at.claude, 'settings.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(left.hooks), ['SessionStart'], "only the user's hook is left");
  assert.strictEqual(left.permissions.defaultMode, 'default', 'the permission rules are left alone');

  assert.strictEqual(fs.readFileSync(claudeRules, 'utf8').trim(), 'My own rule.',
    'the import line goes and the rest of the file stays');
});

test('a CLAUDE.md holding the import line and nothing else goes with it', () => {
  const m = machine('uninstall-claude-md');
  installed.stripShared(m.at);
  assert.ok(!exists(path.join(m.at.claude, 'CLAUDE.md')));
});

test('every link into ~/.flow goes before the folder does, and nothing else is touched', () => {
  const m = machine('uninstall-links');
  const skills = path.join(m.at.claude, 'skills');
  const source = path.join(m.at.flow, 'repos', 'sources', 'me_skills', 'react');
  fs.mkdirSync(source, { recursive: true });
  fs.symlinkSync(source, path.join(skills, 'react'));
  fs.symlinkSync(path.join(m.dir, 'elsewhere'), path.join(skills, 'other'));
  fs.mkdirSync(path.join(skills, 'real'));

  const done = installed.unlinkInto(m.at.flow, [skills, path.join(m.dir, 'no-such-folder')]);
  assert.deepStrictEqual(done, [`removed ${require('../lib/paths').shorten(path.join(skills, 'react'))}`]);
  assert.ok(exists(path.join(skills, 'other')), "another tool's link stays");
  assert.ok(exists(path.join(skills, 'real')), 'a real folder stays');
  assert.ok(exists(path.join(skills, 'flow')), 'the plugin link points into ~/.agents, so it stays for the restore');
});

// The 2 locks refuse every test process, so this runs the command in process
// with both taken out, and answers the word itself. --root keeps the clone.
test('uninstall hands over the same form as restore, then deletes ~/.flow whatever it says', () => {
  const confirm = require('../lib/machine/confirm');
  const uninstall = require('../commands/uninstall');
  const m = machine('uninstall-form');
  const kept = { noSessions: confirm.noSessions, word: confirm.word };
  const said = [];
  confirm.noSessions = () => {};
  confirm.word = (wanted, lines) => {
    said.push({ wanted, lines, form: fs.readFileSync(path.join(m.at.flow, 'restore.md'), 'utf8') });
    return 'uninstall';
  };
  try {
    assert.strictEqual(uninstall.uninstall.run({ flags: { root: m.root } }), 0);
  } finally {
    Object.assign(confirm, kept);
  }
  assert.strictEqual(said[0].wanted, 'uninstall');
  assert.match(said[0].lines[1], /^Then \S+\.flow is deleted\.$/, '--root keeps the clone');
  assert.match(said[0].form, /^## Done whatever the boxes say\n\n- \S+\.flow is deleted\.\n- \S+ stays: it belongs to this machine, not to --root\.$/m);
  assert.ok(!exists(m.at.flow), '~/.flow is gone, the form with it');
  assert.ok(fs.existsSync(REPO), 'the clone is still there');
});
