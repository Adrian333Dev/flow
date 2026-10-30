/**
 * A worktree the user asked for is the agent's to make, with plain git. Flow
 * only finds it: `done` and a drop refuse while it holds uncommitted or
 * unmerged work, and `leftover` names one whose ticket closed.
 *
 * Real git repositories under SCRATCH, with no FLOW_PROJECT.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRATCH, write, run } from '../../../shared/testing.ts';
import * as store from '../store.ts';
import * as worktrees from '../worktrees.ts';

const NAMES = { GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@example.com' };

function git(dir, ...args) {
  const ran = spawnSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, ...NAMES } });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

/** A repository on `main`, in Flow, with ticket `exp-1` started and its worktree made by hand. */
function repo(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  write(dir, 'app.js', 'console.log(1);\n');
  write(dir, '.flow/settings.json', '{\n  "ticketPrefix": "exp"\n}\n');
  git(dir, 'init', '--quiet', '--initial-branch=main');
  fs.appendFileSync(path.join(dir, '.git', 'info', 'exclude'), '.flow\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '-m', 'code');
  const env: NodeJS.ProcessEnv = { ...process.env, ...NAMES, FLOW_HOME: path.join(dir, '..', `${name}-home`) };
  delete env.FLOW_PROJECT;
  const flow = (...args) => run('flow.ts', args, { cwd: dir, env });
  flow('tickets', 'new', 'parser');
  flow('tickets', 'start', '1', '--activity', 'build');
  const folder = path.join(dir, '.claude', 'worktrees', 'exp-1-parser');
  assert.ok(git(dir, 'worktree', 'add', '--quiet', '-b', 'exp-1-parser', folder).ok);
  const ticket = () => store.findTicket(store.readTickets(dir), '1');
  return { dir, flow, folder, ticket };
}

test('a ticket with no worktree is found nowhere, and holds nothing', () => {
  const r = repo('refusal-none');
  git(r.dir, 'worktree', 'remove', r.folder);
  assert.equal(worktrees.find(r.ticket(), r.dir), null);
  assert.deepEqual(worktrees.unfinished(r.ticket(), r.dir), []);
  assert.equal(r.flow('tickets', 'done', '1').code, 0);
});

test('the finder matches the folder named for the ticket, never the main checkout or another ticket', () => {
  const r = repo('refusal-find');
  const found = worktrees.find(r.ticket(), r.dir);
  assert.equal(found && fs.realpathSync(found.folder), fs.realpathSync(r.folder));
  assert.equal(found?.branch, 'exp-1-parser');
  git(r.dir, 'worktree', 'add', '--quiet', '-b', 'exp-10-other', path.join(r.dir, '..', 'exp-10-other'));
  assert.equal(path.basename(worktrees.find(r.ticket(), r.dir)!.folder), 'exp-1-parser', 'exp-10 is not exp-1');
});

test('a clean worktree with nothing ahead of main lets done close the ticket', () => {
  const r = repo('refusal-clean');
  assert.deepEqual(worktrees.unfinished(r.ticket(), r.dir), []);
  const done = r.flow('tickets', 'done', '1');
  assert.equal(done.code, 0, done.stderr);
  assert.ok(fs.existsSync(r.folder), 'done removes nothing');
});

test('uncommitted edits stop done, naming the folder and the work', () => {
  const r = repo('refusal-dirty');
  write(r.folder, 'new.js', 'export {};\n');
  write(r.folder, 'app.js', 'console.log(2);\n');
  assert.deepEqual(worktrees.unfinished(r.ticket(), r.dir), ['2 uncommitted files']);
  const done = r.flow('tickets', 'done', '1');
  assert.notEqual(done.code, 0);
  assert.match(done.stderr, /exp-1-parser holds 2 uncommitted files/);
  assert.equal(r.ticket().data.status, 'in-progress');
  assert.equal(fs.readFileSync(path.join(r.folder, 'app.js'), 'utf8'), 'console.log(2);\n', 'nothing committed or reverted');
  assert.equal(git(r.folder, 'log', '--format=%s').out, 'code', 'nothing committed');
});

test('commits not in main stop done and a drop; a park leaves the worktree alone', () => {
  const r = repo('refusal-ahead');
  write(r.folder, 'feature.js', 'export {};\n');
  git(r.folder, 'add', '-A');
  git(r.folder, 'commit', '--quiet', '-m', 'feature');
  assert.deepEqual(worktrees.unfinished(r.ticket(), r.dir), ['1 commit not in main']);

  const done = r.flow('tickets', 'done', '1');
  assert.notEqual(done.code, 0);
  assert.match(done.stderr, /1 commit not in main/);
  const dropped = r.flow('tickets', 'drop', '1', '--reason', 'not needed');
  assert.notEqual(dropped.code, 0);
  assert.match(dropped.stderr, /1 commit not in main/);
  assert.equal(r.ticket().data.status, 'in-progress');

  assert.equal(r.flow('tickets', 'park', '1', '--reason', 'later').code, 0);
  assert.ok(fs.existsSync(path.join(r.folder, 'feature.js')));
});

test('a ticket whose branch: names its own worktree branch is still compared with main', () => {
  const r = repo('refusal-own-branch');
  write(r.folder, 'feature.js', 'export {};\n');
  git(r.folder, 'add', '-A');
  git(r.folder, 'commit', '--quiet', '-m', 'feature');
  const t = r.ticket();
  t.data.branch = 'exp-1-parser';
  store.writeTicket(t);
  assert.deepEqual(worktrees.unfinished(r.ticket(), r.dir), ['1 commit not in main']);
});

test('after the work is merged into main, done closes the ticket', () => {
  const r = repo('refusal-merged');
  write(r.folder, 'feature.js', 'export {};\n');
  git(r.folder, 'add', '-A');
  git(r.folder, 'commit', '--quiet', '-m', 'feature');
  assert.ok(git(r.dir, 'merge', '--ff-only', '--quiet', 'exp-1-parser').ok);
  assert.deepEqual(worktrees.unfinished(r.ticket(), r.dir), []);
  assert.equal(r.flow('tickets', 'done', '1').code, 0);
});

test('leftover names a worktree whose ticket closed or is gone, never one Flow did not make', () => {
  const r = repo('refusal-leftover');
  for (const name of ['exp-9-gone', 'happy-otter']) {
    git(r.dir, 'worktree', 'add', '--quiet', '-b', name, path.join(r.dir, '.claude', 'worktrees', name));
  }
  const t = r.ticket();
  t.data.status = 'done';
  store.writeTicket(t);

  const found = worktrees.leftover(r.dir, store.readTickets(r.dir), 'exp')
    .map(({ folder, why }) => ({ name: path.basename(folder), why }));
  assert.deepEqual(found, [{ name: 'exp-1-parser', why: 'exp-1 is done' }, { name: 'exp-9-gone', why: 'its ticket is gone' }]);
});
