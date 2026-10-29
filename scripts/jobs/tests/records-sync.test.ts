import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { SCRATCH, SCRIPTS, bareRepo } from '../../shared/testing.ts';
import * as repo from '../../features/machine/flow-repo.ts';
import { git } from '../../shared/git.ts';
import { folders } from '../../shared/paths.ts';
import { single } from '../records-sync.ts';

function home(name) {
  const flow = path.join(SCRATCH, name, '.flow');
  fs.rmSync(flow, { recursive: true, force: true });
  fs.mkdirSync(flow, { recursive: true });
  return { flow };
}

test('a sync asked for while one of the same place runs leaves a mark, and the running one goes once more', () => {
  const at = home('records-sync-single');
  let runs = 0;
  single(at, '/home/me/code/exp', () => {
    runs++;
    // A second process asking now finds the first running.
    if (runs === 1) single(at, '/home/me/code/exp', () => assert.fail('a second runner started'));
  });
  assert.strictEqual(runs, 2);
  assert.deepStrictEqual(fs.readdirSync(at.flow), []);
});

test('8 syncs of the Flow home started at once leave no lock failure, and send what changed', async () => {
  const dir = path.join(SCRATCH, 'records-sync-eight');
  fs.rmSync(dir, { recursive: true, force: true });
  const at = folders(dir);
  fs.mkdirSync(at.flow, { recursive: true });
  const remote = bareRepo('records-sync-eight');
  repo.connect(at, remote);
  git(at.flow, ['config', 'flow.machine', 'eight']);
  fs.writeFileSync(path.join(at.flow, 'note.md'), 'written while 8 syncs start\n');

  const script = path.join(SCRIPTS, 'jobs', 'records-sync.ts');
  const env = { ...process.env, FLOW_HOME: at.flow };
  const exits = await Promise.all(Array.from({ length: 8 }, () => new Promise<number | null>((resolve) => {
    spawn(process.execPath, [script, '--home', '--now'], { env, stdio: 'ignore' }).on('close', resolve);
  })));

  assert.deepStrictEqual(exits, Array(8).fill(0));
  const logged = path.join(at.flow, 'logs', 'failures');
  const lines = fs.existsSync(logged) ? fs.readdirSync(logged).map((f) => fs.readFileSync(path.join(logged, f), 'utf8')).join('') : '';
  assert.doesNotMatch(lines, /held the records|index\.lock/);
  assert.strictEqual(git(at.flow, ['status', '--porcelain']).out.includes('note.md'), false, 'note.md was committed');
  assert.match(git(remote, ['log', '--oneline', 'main']).out, /.+/, 'the remote received the commit');
  assert.deepStrictEqual(fs.readdirSync(at.flow).filter((f) => /^records-sync\..*\.(running|again)$/.test(f)), []);
});

test('2 places sync side by side, and a dead runner older than 5 minutes is taken over', () => {
  const at = home('records-sync-places');
  const ran: string[] = [];
  single(at, 'home', () => single(at, '/srv/exp', () => ran.push('exp')));
  assert.deepStrictEqual(ran, ['exp']);

  const dead = path.join(at.flow, 'records-sync.home.running');
  fs.writeFileSync(dead, '1');
  const old = new Date(Date.now() - 6 * 60 * 1000);
  fs.utimesSync(dead, old, old);
  single(at, 'home', () => ran.push('home'));
  assert.deepStrictEqual(ran, ['exp', 'home']);

  fs.writeFileSync(dead, '1');
  single(at, 'home', () => ran.push('home'));
  assert.deepStrictEqual(ran, ['exp', 'home']);
  assert.ok(fs.existsSync(path.join(at.flow, 'records-sync.home.again')));
});
