/**
 * `session-check`: the SessionStart hook that suggests `flow init` where a
 * repository has no `.flow/`.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRATCH, run, write } from '../shared/testing.ts';

/** A throwaway machine and one project inside it. A project is a git repository, as `flow init` leaves one. */
function place(name, opts: { settings?: object } = {}) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const home = path.join(dir, 'flow-home');
  const project = path.join(dir, 'project');
  const user = path.join(dir, 'user');
  fs.mkdirSync(user, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(path.join(project, '.flow'), { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: project });

  if (opts.settings) fs.writeFileSync(path.join(home, 'settings.json'), JSON.stringify(opts.settings));
  return { home, project, user };
}

/**
 * The hook, handed the event Claude Code sends it. HOME and CLAUDE_CONFIG_DIR
 * move with FLOW_HOME: the hook makes skill links in Claude Code's folder.
 * The scratch folder sits inside Flow's own repository, so git stops at it.
 */
const check = ({ home, project, user }) => run('hooks/session-check.ts', [], {
  input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd: project }),
  env: {
    ...process.env, FLOW_HOME: home, HOME: user, CLAUDE_CONFIG_DIR: path.join(user, '.claude'), GIT_CEILING_DIRECTORIES: SCRATCH,
  },
});

test('a project with nothing to change prints nothing at all', () => {
  const result = check(place('session-current'));
  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.code, 0);
});

// On a real machine ~/.flow sits in the home folder, so every folder under it
// has a `.flow/` above it. That one is the machine's, never a project's.
test('a folder under the home folder with no .flow of its own is not a project', () => {
  const dir = path.join(SCRATCH, 'session-home');
  fs.rmSync(dir, { recursive: true, force: true });
  const user = path.join(dir, 'user');
  const home = path.join(user, '.flow');
  const playground = path.join(user, 'code', 'playground');
  fs.mkdirSync(playground, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  write(home, 'tickets/home-4-backup-script/ticket.md',
    '---\nid: home-4\ntitle: Backup script\nstatus: in-progress\ntype: chore\n---\n\nBody.\n');

  const result = check({ home, project: playground, user });
  assert.strictEqual(result.stdout, '', 'no setup line: the folder is no repository');
  assert.ok(!fs.existsSync(path.join(playground, '.claude')), 'the home folder is never read as a project');
  assert.ok(!fs.existsSync(path.join(user, '.claude', 'skills')), 'a ticket gets no skill');
});

test('a git repository with no .flow gets the setup line, shown to the user alone, unless a setting says not', () => {
  const at = place('session-setup-line');
  const shop = path.join(at.user, 'code', 'shop');
  fs.mkdirSync(path.join(shop, 'src'), { recursive: true });
  assert.strictEqual(spawnSync('git', ['init', '-q'], { cwd: shop }).status, 0);

  const output = JSON.parse(check({ ...at, project: path.join(shop, 'src') }).stdout);
  assert.strictEqual(output.systemMessage, 'Flow: not set up here. Run flow init to set it up on this computer, or flow settings off setupReminder to stop this.');
  assert.strictEqual(output.hookSpecificOutput, undefined, 'nothing reaches the agent');

  const notes = path.join(at.user, 'notes');
  fs.mkdirSync(notes, { recursive: true });
  assert.strictEqual(check({ ...at, project: notes }).stdout, '', 'a folder git does not track');

  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ setupReminderSkip: ['~/code/shop'] }));
  assert.strictEqual(check({ ...at, project: path.join(shop, 'src') }).stdout, '', 'a skipped folder, and everything below it');

  fs.rmSync(path.join(at.home, 'settings.local.json'));
  fs.writeFileSync(path.join(at.home, 'settings.json'), JSON.stringify({ setupReminder: false }));
  assert.strictEqual(check({ ...at, project: shop }).stdout, '', 'off everywhere');

  fs.writeFileSync(path.join(at.home, 'settings.json'), JSON.stringify({ sessionCheck: false }));
  assert.strictEqual(check({ ...at, project: shop }).stdout, '', 'the session check off');
});
