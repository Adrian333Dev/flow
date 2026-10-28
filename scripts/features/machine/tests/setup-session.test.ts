/**
 * The setup session's marker, its copies and the link to the rules. The
 * session itself is Claude Code and is never started here: `open` prints its
 * line under `printOnly`.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, REPO } from '../../../shared/testing.ts';
import * as session from '../setup-session.ts';
import * as paths from '../../../shared/paths.ts';

/** A scratch machine with the rule file in `~/.flow/`, and `~/.claude/` made. */
function machine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const at = paths.folders(root);
  fs.mkdirSync(at.flow, { recursive: true });
  fs.mkdirSync(at.claude, { recursive: true });
  fs.writeFileSync(path.join(at.flow, 'CLAUDE.md'), 'Flow rules.\n');
  return at;
}

test('a real CLAUDE.md moves to before/, a link takes its place, and a session is owed', () => {
  const at = machine('setup-session-real');
  fs.writeFileSync(path.join(at.claude, 'CLAUDE.md'), 'My own rules.\n');
  fs.writeFileSync(path.join(at.claude, 'settings.json'), '{"theme":"dark"}\n');

  const lines = session.linkRules(at);

  assert.strictEqual(fs.readlinkSync(path.join(at.claude, 'CLAUDE.md')), path.join(at.flow, 'CLAUDE.md'));
  assert.strictEqual(fs.readFileSync(path.join(session.beforeDir(at), 'CLAUDE.md'), 'utf8'), 'My own rules.\n');
  assert.strictEqual(fs.readFileSync(path.join(session.beforeDir(at), 'settings.json'), 'utf8'), '{"theme":"dark"}\n');
  assert.ok(session.isPending(at));
  assert.ok(lines.some((l) => /^moved: .*CLAUDE\.md to .*logs\/before\/CLAUDE\.md$/.test(l)));
  assert.ok(lines.some((l) => /^linked: .*\.claude\/CLAUDE\.md$/.test(l)));
});

test('a CLAUDE.md that is already Flow\'s link owes nothing', () => {
  const at = machine('setup-session-linked');
  fs.symlinkSync(path.join(at.flow, 'CLAUDE.md'), path.join(at.claude, 'CLAUDE.md'));

  assert.deepStrictEqual(session.linkRules(at), []);
  assert.ok(!session.isPending(at));
  assert.ok(!fs.existsSync(session.beforeDir(at)), 'no copy made');
});

test('a missing or wrong link is made again and owes a session', () => {
  const missing = machine('setup-session-missing');
  session.linkRules(missing);
  assert.strictEqual(fs.readlinkSync(path.join(missing.claude, 'CLAUDE.md')), path.join(missing.flow, 'CLAUDE.md'));
  assert.ok(session.isPending(missing));

  const wrong = machine('setup-session-wrong');
  fs.symlinkSync(path.join(wrong.base, 'elsewhere.md'), path.join(wrong.claude, 'CLAUDE.md'));
  session.linkRules(wrong);
  assert.strictEqual(fs.readlinkSync(path.join(wrong.claude, 'CLAUDE.md')), path.join(wrong.flow, 'CLAUDE.md'));
  assert.ok(session.isPending(wrong));
});

test('with no rule file in ~/.flow, the real CLAUDE.md stays where it is', () => {
  const at = machine('setup-session-no-rules');
  fs.rmSync(path.join(at.flow, 'CLAUDE.md'));
  fs.writeFileSync(path.join(at.claude, 'CLAUDE.md'), 'My own rules.\n');

  const lines = session.linkRules(at);

  assert.match(lines[0], /^could not link .*CLAUDE\.md: .* does not exist/);
  assert.strictEqual(fs.readFileSync(path.join(at.claude, 'CLAUDE.md'), 'utf8'), 'My own rules.\n');
  assert.ok(!session.isPending(at));
});

test('owing a session twice keeps the copy from before the first', () => {
  const at = machine('setup-session-twice');
  fs.writeFileSync(path.join(at.claude, 'settings.json'), '{"theme":"dark"}\n');
  session.markPending(at);
  fs.writeFileSync(path.join(at.claude, 'settings.json'), '{"theme":"light"}\n');
  session.markPending(at);

  assert.strictEqual(fs.readFileSync(path.join(session.beforeDir(at), 'settings.json'), 'utf8'), '{"theme":"dark"}\n');
});

test('open does nothing while no session is owed, and prints the line while one is', () => {
  const at = machine('setup-session-open');
  assert.strictEqual(session.open(at, REPO, { printOnly: true }), 'none');

  session.markPending(at);
  const printed: string[] = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => { printed.push(String(chunk)); return true; };
  let result;
  try {
    result = session.open(at, REPO, { printOnly: true });
  } finally {
    process.stdout.write = write;
  }

  assert.strictEqual(result, 'printed');
  assert.match(printed.join(''), /claude --safe-mode --permission-mode acceptEdits --add-dir .*--settings .*setup-settings\.json --append-system-prompt-file .*setup-prompt\.md/);
  assert.ok(session.isPending(at), 'the session deletes the marker, never open');
  assert.strictEqual(fs.readFileSync(path.join(at.flow, 'setup-prompt.md'), 'utf8'),
    fs.readFileSync(path.join(REPO, 'prompts', 'setup-session.md'), 'utf8'));
  const settings = JSON.parse(fs.readFileSync(path.join(at.flow, 'setup-settings.json'), 'utf8'));
  assert.strictEqual(settings.disableAutoMode, 'disable');
  assert.ok(settings.permissions.allow.length, 'the template\'s lists come across');
});
