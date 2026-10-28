/**
 * Each ticket's code in its own git worktree: made by `flow tickets start`,
 * merged and removed by `flow tickets done`, removed with its branch kept by
 * a drop, and the project found from inside one.
 *
 * Real git repositories under SCRATCH, with no FLOW_PROJECT, since finding
 * the project from a worktree is part of what is under test.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCRATCH, write, run } from '../../../shared/testing.ts';
import * as project from '../../../shared/project.ts';
import * as store from '../store.ts';
import * as worktrees from '../worktrees.ts';

const NAMES = { GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@example.com' };

function git(dir, ...args) {
  const ran = spawnSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, ...NAMES } });
  return { ok: ran.status === 0, out: (ran.stdout || '').trim(), err: (ran.stderr || '').trim() };
}

/** A repository on `main` holding one commit of code, in Flow, with tickets `exp-1` onwards. */
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
  const flow = (cwd, ...args) => run('flow.ts', args, { cwd, env });
  return { dir, flow, folder: (n) => path.join(dir, '.claude', 'worktrees', n) };
}

const ticket = (dir, id) => store.findTicket(store.readTickets(dir), id);

test('a build makes the ticket a worktree on its own branch, and records its name', () => {
  const r = repo('worktree-start');
  write(r.dir, '.gitignore', '.env\n');
  write(r.dir, '.worktreeinclude', '.env\n');
  write(r.dir, '.env', 'SECRET=1\n');
  write(r.dir, '.worktree/create', '#!/usr/bin/env bash\necho made > created.txt\n');
  fs.chmodSync(path.join(r.dir, '.worktree/create'), 0o755);
  git(r.dir, 'add', '-A');
  git(r.dir, 'commit', '--quiet', '-m', 'setup');
  write(r.dir, 'app.js', 'console.log(2);\n');

  assert.equal(r.flow(r.dir, 'tickets', 'new', 'parser-split').code, 0);
  const started = r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'build');
  assert.equal(started.code, 0, started.stderr);
  const folder = r.folder('exp-1-parser-split');
  assert.match(started.stdout, new RegExp(`worktree: ${folder}`));
  assert.match(started.stdout, /uncommitted changes/);

  const t = ticket(r.dir, '1');
  assert.equal(t.data.worktree, 'exp-1-parser-split');
  assert.equal(t.data.branch, '', 'no branch: on the default branch');
  assert.equal(git(folder, 'branch', '--show-current').out, 'exp-1-parser-split');
  assert.equal(fs.readFileSync(path.join(folder, 'app.js'), 'utf8'), 'console.log(1);\n', 'from the last commit');
  assert.equal(fs.readFileSync(path.join(folder, '.env'), 'utf8'), 'SECRET=1\n');
  assert.ok(fs.existsSync(path.join(folder, 'created.txt')));
  assert.ok(fs.lstatSync(path.join(folder, '.flow')).isSymbolicLink());
  assert.equal(git(r.dir, 'status', '--porcelain', '--', '.claude').out, '', '.claude/worktrees/ is hidden from git');

  // From inside the worktree, flow works on the main checkout's project.
  assert.equal(fs.realpathSync(project.top(folder) || ''), fs.realpathSync(r.dir));
  // A worktree made by hand, with no `.flow` link, still finds the project (fw-199).
  git(r.dir, 'worktree', 'add', '--quiet', path.join(r.dir, '..', 'worktree-start-bare'), '-b', 'bare');
  const bare = r.flow(path.join(r.dir, '..', 'worktree-start-bare'), 'tickets', 'get', '1');
  assert.equal(bare.code, 0, bare.stderr);
  assert.match(bare.stdout, /exp-1-parser-split/);
  git(r.dir, 'worktree', 'remove', '--force', path.join(r.dir, '..', 'worktree-start-bare'));
  const again = r.flow(folder, 'tickets', 'start', '1', '--activity', 'build');
  assert.equal(again.code, 0, again.stderr);
  assert.match(again.stdout, /already in-progress/);
  assert.match(again.stdout, new RegExp(`worktree: ${folder}`));
  assert.equal(git(r.dir, 'worktree', 'list').out.split('\n').length, 2, 'reused, never a second one');
});

test('design work and a ticket already building in the main checkout get no worktree', () => {
  const r = repo('worktree-none');
  r.flow(r.dir, 'tickets', 'new', 'only-design');
  r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'design');
  assert.ok(!fs.existsSync(r.folder('exp-1-only-design')));

  // Design, then the build: the build gets its worktree.
  r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'build');
  assert.ok(fs.existsSync(r.folder('exp-1-only-design')));

  r.flow(r.dir, 'tickets', 'new', 'old-build');
  const t = ticket(r.dir, '2');
  t.data.status = 'in-progress';
  t.data.activity = 'build';
  store.writeTicket(t);
  r.flow(r.dir, 'tickets', 'start', '2', '--activity', 'build');
  assert.ok(!fs.existsSync(r.folder('exp-2-old-build')));
});

test('done commits the worktree, rebases it onto a branch that moved, and merges it', () => {
  const r = repo('worktree-done');
  r.flow(r.dir, 'tickets', 'new', 'feature');
  r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'build');
  const folder = r.folder('exp-1-feature');
  write(folder, 'feature.js', 'export {};\n');
  write(r.dir, 'other.js', 'export {};\n');
  git(r.dir, 'add', 'other.js');
  git(r.dir, 'commit', '--quiet', '-m', 'meanwhile');

  const done = r.flow(r.dir, 'tickets', 'done', '1');
  assert.equal(done.code, 0, done.stderr);
  assert.match(done.stdout, /merged exp-1-feature into main/);
  assert.ok(fs.existsSync(path.join(r.dir, 'feature.js')), 'main checkout fast-forwarded');
  assert.equal(git(r.dir, 'log', '--format=%s', '-3').out, 'exp-1-feature\nmeanwhile\ncode');
  assert.ok(!fs.existsSync(folder));
  assert.ok(!git(r.dir, 'show-ref', '--verify', '-q', 'refs/heads/exp-1-feature').ok);
  assert.equal(ticket(r.dir, '1').data.worktree, 'exp-1-feature', 'kept as the record');
});

test('a conflict stops done with the ticket open, naming the files', () => {
  const r = repo('worktree-conflict');
  r.flow(r.dir, 'tickets', 'new', 'clash');
  r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'build');
  const folder = r.folder('exp-1-clash');
  write(folder, 'app.js', 'console.log("ticket");\n');
  write(r.dir, 'app.js', 'console.log("main");\n');
  git(r.dir, 'commit', '--quiet', '-am', 'main changed it');

  const done = r.flow(r.dir, 'tickets', 'done', '1');
  assert.notEqual(done.code, 0);
  assert.match(done.stderr, /conflicts with main in:\n {2}app\.js/);
  assert.equal(ticket(r.dir, '1').data.status, 'in-progress');

  write(folder, 'app.js', 'console.log("both");\n');
  git(folder, 'add', 'app.js');
  assert.ok(git(folder, '-c', 'core.editor=true', 'rebase', '--continue').ok);
  const again = r.flow(r.dir, 'tickets', 'done', '1');
  assert.equal(again.code, 0, again.stderr);
  assert.equal(fs.readFileSync(path.join(r.dir, 'app.js'), 'utf8'), 'console.log("both");\n');
});

test('a drop removes the folder and keeps the branch with its work; a park keeps both', () => {
  const r = repo('worktree-drop');
  r.flow(r.dir, 'tickets', 'new', 'abandoned');
  r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'build');
  const folder = r.folder('exp-1-abandoned');
  write(folder, 'half.js', 'export {};\n');

  r.flow(r.dir, 'tickets', 'park', '1', '--reason', 'later');
  assert.ok(fs.existsSync(path.join(folder, 'half.js')));

  const dropped = r.flow(r.dir, 'tickets', 'drop', '1', '--reason', 'not needed');
  assert.equal(dropped.code, 0, dropped.stderr);
  assert.ok(!fs.existsSync(folder));
  assert.equal(git(r.dir, 'show', '--name-only', '--format=', 'exp-1-abandoned').out, 'half.js');
  assert.ok(!fs.existsSync(path.join(r.dir, 'half.js')));
});

test('a child builds on its parent\'s unmerged branch', () => {
  const r = repo('worktree-child');
  r.flow(r.dir, 'tickets', 'new', 'parent');
  r.flow(r.dir, 'tickets', 'start', '1', '--activity', 'build', '--force');
  write(r.folder('exp-1-parent'), 'base.js', 'export {};\n');
  git(r.folder('exp-1-parent'), 'add', '-A');
  git(r.folder('exp-1-parent'), 'commit', '--quiet', '-m', 'parent work');
  r.flow(r.dir, 'tickets', 'new', 'child', '--parent', '1');
  r.flow(r.dir, 'tickets', 'start', '2', '--activity', 'build');

  assert.equal(ticket(r.dir, '2').data.branch, 'exp-1-parent');
  assert.ok(fs.existsSync(path.join(r.folder('exp-2-child'), 'base.js')));
});

test('orphans names a worktree whose ticket closed or is gone, never one Flow did not make', () => {
  const r = repo('worktree-orphans');
  r.flow(r.dir, 'tickets', 'new', 'closed');
  for (const name of ['exp-1-closed', 'exp-9-gone', 'happy-otter']) fs.mkdirSync(r.folder(name), { recursive: true });
  const t = ticket(r.dir, '1');
  t.data.status = 'done';
  store.writeTicket(t);

  const found = worktrees.orphans(r.dir, store.readTickets(r.dir), 'exp');
  assert.deepEqual(found, [{ name: 'exp-1-closed', why: 'exp-1 is done' }, { name: 'exp-9-gone', why: 'its ticket is gone' }]);
});
