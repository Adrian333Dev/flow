/**
 * Two projects and the home place, used the way a person would: make tickets,
 * reach them from another folder, list them, then rename a prefix. Each step
 * is covered alone in registry.test.js and routing.test.js; this walks them in
 * one run, so a step that works alone but breaks the next one shows up here.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SCRATCH, project, write, flow, run } from '../shared/testing.ts';
import * as registry from '../shared/registry.ts';

const ticketText = (dir, number) => fs.readFileSync(path.join(dir, '.flow', 'tickets', String(number), 'ticket.md'), 'utf8');

test('make, route, list and rename a prefix across 2 projects and home', () => {
  const shop = project('projects-shop');
  const bee = project('projects-bee');
  const home = path.join(shop, 'flow-home');
  const env = { FLOW_HOME: home };
  write(shop, '.flow/settings.json', '{\n  "ticketPrefix": "shop"\n}\n');
  write(bee, '.flow/settings.json', '{\n  "ticketPrefix": "bee"\n}\n');

  // Make: a ticket in each project, one filed into bee from shop, one in home.
  assert.match(flow(shop, ['tickets', 'new', 'Cart'], env).stdout, /created shop-1-cart/);
  assert.match(flow(bee, ['tickets', 'new', 'Hive'], env).stdout, /created bee-1-hive/);
  assert.match(flow(shop, ['tickets', 'new', 'Wax', '-p', 'bee'], env).stdout, /created bee-2-wax/);
  assert.match(flow(shop, ['tickets', 'new', 'Fault', '--label', 'flow-issue,hook', '-p', 'home'], env).stdout, /created home-1-fault/);
  assert.deepStrictEqual(Object.keys(registry.read(home)).sort(), ['bee', 'shop'], 'each project registered by its first write');
  assert.ok(fs.existsSync(path.join(bee, '.flow', 'tickets', '2', 'ticket.md')), 'the ticket landed in bee, under its number');
  assert.match(ticketText(bee, 2), /^id: 2$/m, 'a ticket file holds no prefix');

  // Route: an id works from the other project and from a folder that is no project.
  assert.match(flow(shop, ['tickets', 'get', 'bee-1'], env).stdout, /^bee-1-hive/m);
  assert.match(flow(shop, ['tickets', 'start', 'bee-1'], env).stdout, /bee-1-hive {2}todo → in-progress/);
  const plain = path.join(SCRATCH, 'projects-plain');
  fs.mkdirSync(plain, { recursive: true });
  const away: NodeJS.ProcessEnv = { ...process.env, FLOW_HOME: home };
  delete away.FLOW_PROJECT;
  const done = run('flow.ts', ['tickets', 'done', 'bee-1'], { cwd: plain, env: away });
  assert.strictEqual(done.code, 0, done.stderr);

  // List: each list has its project line, and the issue list groups by project.
  const ls = flow(shop, ['tickets', '-p', 'bee'], env).stdout;
  assert.match(ls, /^bee {2}\S+\n/);
  assert.match(ls, /bee-2-wax/);
  const issues = flow(shop, ['tickets', '--', 'label:flow-issue'], env).stdout;
  assert.match(issues, /^shop {2}\S+\nno tickets\.\n\nbee {2}\S+\nno tickets\.\n\nhome {2}\S+\nhome-1-fault/);
  assert.match(run('flow.ts', ['tickets'], { cwd: plain, env: away }).stdout, /^home {2}\S+\n/);

  // Rename: one edit to ticketPrefix, then the next ticket write in bee moves its registry line.
  write(bee, '.flow/settings.json', '{\n  "ticketPrefix": "cat"\n}\n');
  assert.match(flow(bee, ['tickets', 'new', 'Comb'], env).stdout, /created cat-3-comb/);
  assert.deepStrictEqual(Object.keys(registry.read(home)).sort(), ['cat', 'shop'], 'the old line went with the old prefix');
  const moved = flow(shop, ['tickets', 'get', 'cat-2'], env);
  assert.match(moved.stdout, /^cat-2-wax/m, `the same ticket under its new prefix: ${moved.stderr}`);
  assert.ok(fs.existsSync(path.join(bee, '.flow', 'tickets', '2', 'ticket.md')), 'nothing on disk was renamed');
  const old = flow(shop, ['tickets', 'get', 'bee-2'], env);
  assert.strictEqual(old.code, 1);
  assert.match(old.stderr, /no project on this machine has the prefix "bee"/);
  assert.match(flow(shop, ['tickets', '-p', 'cat'], env).stdout, /^cat {2}\S+\n/);
});
