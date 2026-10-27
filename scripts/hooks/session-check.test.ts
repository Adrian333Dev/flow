/**
 * `session-check`: the SessionStart hook that suggests `flow init` where a
 * repository has no `.flow/`, and gives the agent the session start view.
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

test('the view counts the labels of every store, names the folders, and drops an empty line', () => {
  const at = place('session-view');
  const env = { ...process.env, FLOW_HOME: at.home, HOME: at.user, CLAUDE_CONFIG_DIR: path.join(at.user, '.claude'), FLOW_PROJECT: at.project };
  const flow = (...args: string[]) => assert.strictEqual(run('flow.ts', args, { cwd: at.project, env }).code, 0, args.join(' '));
  flow('tickets', 'new', 'cache-fix: the cache drops entries', '--label', 'bug,ui');
  flow('tickets', 'new', 'menu-fix: the menu flickers', '--label', 'ui');
  flow('notes', 'new', 'Try a darker theme', '--label', 'ui');
  flow('findings', 'new', 'laptop runs wsl on windows', '--project', 'home', '--label', 'machine-setup');
  flow('findings', 'new', 'node test skips type checks', '--wiki', 'node', '--label', 'test-runner');
  flow('findings', 'new', 'tmux survives closing every terminal', '--wiki', 'tmux', '--label', 'terminal-sessions');
  flow('visit', 'tmux');
  flow('visit', 'tmux', '--ticket', '1');
  write(at.project, 'docs/spec/tickets.md', '# Tickets\n');
  write(at.project, 'docs/spec/product.md', '# Product\n');
  for (let i = 0; i < 25; i++) write(at.project, `.flow/findings/claim-${String(i).padStart(2, '0')}.md`, `---\nlabels: [label-${String(i).padStart(2, '0')}]\n---\n\nText.\n`);

  const output = JSON.parse(check(at).stdout);
  assert.strictEqual(output.systemMessage, undefined, 'nothing for the user');
  const lines = output.hookSpecificOutput.additionalContext.split('\n');
  assert.deepStrictEqual(lines.slice(0, 4), [
    'Labels in use, (n) = entries',
    'tickets           ui (2), bug (1)',
    'notes             ui (1)',
    'findings global   machine-setup (1)',
  ]);
  assert.match(lines[4], /^findings project  label-00 \(1\), .*label-19 \(1\), \+5 more$/, 'a line stops at 20 labels');
  assert.deepStrictEqual(lines.slice(5), ['~/.flow/wiki/     tmux (2), node', 'docs/spec/        product, tickets'], 'a visited folder first, its visits summed over the project and its tickets');
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
