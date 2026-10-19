'use strict';
/**
 * Two projects and the home place, used the way a person would: make tickets,
 * reach them from another folder, list them, then rename a prefix. Each step
 * is covered alone in registry.test.js and routing.test.js; this walks them in
 * one run, so a step that works alone but breaks the next one shows up here.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { SCRATCH, project, write, flow, run } = require('./helpers/scratch');
const registry = require('../lib/registry');

const ticketText = (dir, number) => fs.readFileSync(path.join(dir, '.flow', 'tickets', String(number), 'ticket.md'), 'utf8');

test('make, route, list and rename a prefix across 2 projects and home', () => {
  const shop = project('projects-shop');
  const bee = project('projects-bee');
  const home = path.join(shop, 'flow-home');
  const env = { FLOW_HOME: home };
  write(shop, '.flow/settings.json', '{\n  "ticketPrefix": "shop"\n}\n');
  write(bee, '.flow/settings.json', '{\n  "ticketPrefix": "bee"\n}\n');

  // Make: a ticket in each project, one filed into bee from shop, one in home.
  assert.match(flow(shop, ['new', 'Cart', '--title', 'cart'], env).stdout, /created shop-1-cart/);
  assert.match(flow(bee, ['new', 'Hive', '--title', 'hive'], env).stdout, /created bee-1-hive/);
  assert.match(flow(shop, ['new', 'Wax', '--title', 'wax', '-p', 'bee'], env).stdout, /created bee-2-wax/);
  assert.match(flow(shop, ['new', 'Fault', '--title', 'fault', '--label', 'flow-issue,hook', '-p', 'home'], env).stdout, /created home-1-fault/);
  assert.deepStrictEqual(Object.keys(registry.read(home)).sort(), ['bee', 'shop'], 'each project registered by its first write');
  assert.ok(fs.existsSync(path.join(bee, '.flow', 'tickets', '2', 'ticket.md')), 'the ticket landed in bee, under its number');
  assert.match(ticketText(bee, 2), /^id: 2$/m, 'a ticket file holds no prefix');

  // Route: an id works from the other project and from a folder that is no project.
  assert.match(flow(shop, ['bee-1'], env).stdout, /^bee-1-hive/m);
  assert.match(flow(shop, ['start', 'bee-1'], env).stdout, /bee-1-hive {2}todo → in-progress/);
  const plain = path.join(SCRATCH, 'projects-plain');
  fs.mkdirSync(plain, { recursive: true });
  const away = { ...process.env, FLOW_HOME: home };
  delete away.FLOW_PROJECT;
  const done = run('flow.js', ['done', 'bee-1'], { cwd: plain, env: away });
  assert.strictEqual(done.code, 0, done.stderr);

  // List: each list has its header, and the issue list groups by project.
  const ls = flow(shop, ['ls', '-p', 'bee'], env).stdout;
  assert.match(ls, /^bee {2}\S+\n/);
  assert.match(ls, /bee-2-wax/);
  const issues = flow(shop, ['ls', 'label:flow-issue'], env).stdout;
  assert.match(issues, /^shop {2}\S+\nno tickets\.\n\nbee {2}\S+\nno tickets\.\n\nhome {2}\S+\n.*\nhome-1-fault/s);
  assert.match(run('flow.js', ['ls'], { cwd: plain, env: away }).stdout, /^home {2}\S+\n/);

  // Rename: one edit to ticketPrefix, then the next ticket write in bee moves its registry line.
  write(bee, '.flow/settings.json', '{\n  "ticketPrefix": "cat"\n}\n');
  assert.match(flow(bee, ['new', 'Comb', '--title', 'comb'], env).stdout, /created cat-3-comb/);
  assert.deepStrictEqual(Object.keys(registry.read(home)).sort(), ['cat', 'shop'], 'the old line went with the old prefix');
  const moved = flow(shop, ['cat-2'], env);
  assert.match(moved.stdout, /^cat-2-wax/m, `the same ticket under its new prefix: ${moved.stderr}`);
  assert.ok(fs.existsSync(path.join(bee, '.flow', 'tickets', '2', 'ticket.md')), 'nothing on disk was renamed');
  const old = flow(shop, ['bee-2'], env);
  assert.strictEqual(old.code, 1);
  assert.match(old.stderr, /no project on this machine has the prefix "bee"/);
  assert.match(flow(shop, ['ls', '-p', 'cat'], env).stdout, /^cat {2}\S+\n/);
});
