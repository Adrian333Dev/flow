import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SCRATCH } from '../shared/testing.ts';
import { single } from './records-sync.ts';

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
