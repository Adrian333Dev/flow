/**
 * The project found from inside a worktree the agent made by hand, with or
 * without a `.flow` link in it. The guard on `done` and a drop is in
 * `worktree-refusal.test.ts`.
 *
 * A real git repository under SCRATCH, with no FLOW_PROJECT.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRATCH, write, run } from '../../../shared/testing.ts';
import * as project from '../../../shared/project.ts';

const NAMES = { GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@example.com' };

function git(dir, ...args) {
  const ran = spawnSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, ...NAMES } });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

test('flow works on the main checkout\'s project from inside a worktree made by hand (fw-199)', () => {
  const dir = path.join(SCRATCH, 'worktree-project');
  fs.rmSync(dir, { recursive: true, force: true });
  write(dir, 'app.js', 'console.log(1);\n');
  write(dir, '.flow/settings.json', '{\n  "ticketPrefix": "exp"\n}\n');
  git(dir, 'init', '--quiet', '--initial-branch=main');
  fs.appendFileSync(path.join(dir, '.git', 'info', 'exclude'), '.flow\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '-m', 'code');
  const env: NodeJS.ProcessEnv = { ...process.env, ...NAMES, FLOW_HOME: path.join(dir, '..', 'worktree-project-home') };
  delete env.FLOW_PROJECT;
  assert.equal(run('flow.ts', ['tickets', 'new', 'parser-split'], { cwd: dir, env }).code, 0);

  const folder = path.join(dir, '.claude', 'worktrees', 'exp-1-parser-split');
  assert.ok(git(dir, 'worktree', 'add', '--quiet', '-b', 'exp-1-parser-split', folder).ok);
  assert.equal(fs.realpathSync(project.top(folder) || ''), fs.realpathSync(dir));

  const got = run('flow.ts', ['tickets', 'get', '1'], { cwd: folder, env });
  assert.equal(got.code, 0, got.stderr);
  assert.match(got.stdout, /exp-1-parser-split/);
});
