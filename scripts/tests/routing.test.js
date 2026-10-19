'use strict';
/**
 * An id's prefix finds its project from any folder, and a folder that is no
 * project reads the home place. Project A is the folder a command runs in,
 * project B (prefix `bee`) is reached through the registry in A's Flow home.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { SCRATCH, project, write, flow, run } = require('./helpers/scratch');
const registry = require('../lib/registry');

const homeOf = (dir) => path.join(dir, 'flow-home');

/** Projects A and B, B holding `bee-1`, both known to A's Flow home. */
function pair(name) {
  const a = project(`${name}-a`);
  const b = project(`${name}-b`);
  write(b, '.flow/settings.json', '{\n  "ticketPrefix": "bee"\n}\n');
  const made = flow(b, ['new', 'Thing', '--title', 'thing'], { FLOW_HOME: homeOf(a) });
  assert.strictEqual(made.code, 0, made.stderr);
  return { a, b, home: homeOf(a) };
}

/** `flow` in a plain folder: no repository, no `.flow/`, no FLOW_PROJECT. */
function outside(name, home, args) {
  const cwd = path.join(SCRATCH, `${name}-plain`);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.mkdirSync(cwd, { recursive: true });
  const env = { ...process.env, FLOW_HOME: home };
  delete env.FLOW_PROJECT;
  return { ...run('flow.js', args, { cwd, env }), cwd };
}

test('from project A, flow <id> and flow start <id> work on a ticket of project B', () => {
  const { a, b, home } = pair('routing-read');

  const shown = flow(a, ['bee-1']);
  assert.strictEqual(shown.code, 0, shown.stderr);
  assert.match(shown.stdout, /^bee-1-thing/m);

  const started = flow(a, ['start', 'bee-1']);
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /bee-1-thing {2}todo → in-progress/);
  assert.match(fs.readFileSync(path.join(b, '.flow', 'tickets', '1', 'ticket.md'), 'utf8'), /^status: in-progress$/m);

  assert.match(fs.readFileSync(path.join(b, '.claude', 'skills', 'bee-1', 'SKILL.md'), 'utf8'), /in-progress/, 'B\'s skill follows');
  assert.ok(!fs.existsSync(path.join(a, '.claude', 'skills', 'bee-1')), 'A gets no skill for B\'s ticket');
  assert.deepStrictEqual(Object.keys(registry.read(home)), ['bee'], 'A wrote no ticket, so A stays unregistered');
});

test('the folder you stand in wins when its own prefix matches', () => {
  const { a, b, home } = pair('routing-wins');
  flow(a, ['new', 'Mine', '--title', 'mine']);
  registry.write({ exp: b, bee: b }, home);

  assert.match(flow(a, ['exp-1']).stdout, /^exp-1-mine/m);
  assert.match(flow(a, ['1']).stdout, /^exp-1-mine/m, 'a bare number is the current project\'s');
});

test('an unknown prefix names flow doctor and says a project registers by its first ticket write', () => {
  const { a } = pair('routing-unknown');
  const r = flow(a, ['start', 'zzz-1']);
  assert.strictEqual(r.code, 1);
  assert.match(r.stderr, /no project on this machine has the prefix "zzz"/);
  assert.match(r.stderr, /first ticket write/);
  assert.match(r.stderr, /flow doctor/);
});

test('a registered path that is gone, or whose prefix changed, is refused with the cause', () => {
  const { a, b, home } = pair('routing-stale');

  registry.write({ bee: path.join(a, 'moved-away') }, home);
  assert.match(flow(a, ['bee-1']).stderr, /registered at .*moved-away, which holds no \.flow\/ now/);

  registry.write({ bee: b }, home);
  write(b, '.flow/settings.json', '{\n  "ticketPrefix": "cat"\n}\n');
  assert.match(flow(a, ['bee-1']).stderr, /"bee" is registered at .*, whose ticketPrefix is now "cat"/);
});

test('an id of B that flow move took home still finds the ticket from A', () => {
  const { a, b, home } = pair('routing-was');
  const moved = flow(b, ['move', 'bee-1', 'home'], { FLOW_HOME: home });
  assert.strictEqual(moved.code, 0, moved.stderr);

  const r = flow(a, ['bee-1']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^home-1-thing/m);
});

test('flow move takes the destination project as a prefix, and refuses a folder', () => {
  const { a, b, home } = pair('routing-move');
  flow(a, ['new', 'Wanderer', '--title', 'wanderer']);

  const byFolder = flow(a, ['move', 'exp-1', b]);
  assert.strictEqual(byFolder.code, 1);
  assert.match(byFolder.stderr, /is not a project prefix\. move takes the prefix of a project/);
  assert.match(byFolder.stderr, /has the prefix bee/, 'a folder names the prefix to type');

  const unknown = flow(a, ['move', 'exp-1', 'zzz']);
  assert.strictEqual(unknown.code, 1);
  assert.match(unknown.stderr, /no project on this machine has the prefix "zzz".*flow doctor/s);

  const moved = flow(a, ['move', 'exp-1', 'bee']);
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.match(moved.stdout, /exp-1 → bee-2-wanderer/);
  assert.ok(fs.existsSync(path.join(b, '.flow', 'tickets', '2', 'ticket.md')));
  assert.ok(fs.existsSync(path.join(b, '.claude', 'skills', 'bee-2', 'SKILL.md')), 'B\'s skills follow the move in');
  assert.ok(Object.keys(registry.read(home)).includes('bee'));
});

test('a read in a folder with no project shows the home tickets, says so, and creates nothing', () => {
  const { a, home } = pair('routing-outside');
  flow(a, ['new', 'Kept', '--title', 'kept']);
  assert.strictEqual(flow(a, ['move', 'exp-1', 'home']).code, 0);

  const ls = outside('routing-outside', home, ['ls']);
  assert.strictEqual(ls.code, 0, ls.stderr);
  assert.match(ls.stdout, /^outside a project: showing ~\/\.flow\/tickets\n/);
  assert.match(ls.stdout, /home-1-kept/);

  const next = outside('routing-outside', home, ['next']);
  assert.strictEqual(next.code, 0, next.stderr);
  assert.match(next.stdout, /^outside a project: showing ~\/\.flow\/tickets\n/);

  const named = outside('routing-outside', home, ['home-1']);
  assert.strictEqual(named.code, 0, named.stderr);
  assert.doesNotMatch(named.stdout, /outside a project/, 'an id that names its place defaults to nothing');
  assert.deepStrictEqual(fs.readdirSync(ls.cwd), [], 'nothing was initialized in the folder');
});

test('a write in a folder with no project refuses and names flow init and --project home', () => {
  const { home } = pair('routing-refuse');
  const before = fs.readdirSync(home).sort();

  for (const args of [['new', 'Lost', '--title', 'lost'], ['note', 'lost words'], ['start', '1'], ['park', '--label', 'x', '--reason', 'r']]) {
    const r = outside('routing-refuse', home, args);
    assert.strictEqual(r.code, 1, args.join(' '));
    assert.match(r.stderr, /not inside a Flow project/, args.join(' '));
    assert.match(r.stderr, /flow init/);
    assert.match(r.stderr, /--project home/);
  }
  assert.deepStrictEqual(fs.readdirSync(home).sort(), before, 'no ticket and no note was made');

  const named = outside('routing-refuse', home, ['note', 'kept words', '--project', 'home']);
  assert.strictEqual(named.code, 0, named.stderr);

  const ticket = outside('routing-refuse', home, ['new', 'Kept', '--title', 'kept', '-p', 'home']);
  assert.strictEqual(ticket.code, 0, ticket.stderr);
  assert.match(ticket.stdout, /created home-1-kept/);
});

test('-p and --project name a project by its prefix for new, ls and next, from another folder', () => {
  const { a, b, home } = pair('routing-flag');

  const made = flow(a, ['new', 'From afar', '--title', 'from-afar', '-p', 'bee']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /created bee-2-from-afar/);
  assert.ok(fs.existsSync(path.join(b, '.flow', 'tickets', '2', 'ticket.md')), 'the ticket landed in B');
  assert.ok(!fs.existsSync(path.join(a, '.flow', 'tickets')), 'A got nothing');
  assert.ok(fs.existsSync(path.join(b, '.claude', 'skills', 'bee-2', 'SKILL.md')), 'B\'s skills follow');

  for (const flag of ['-p', '--project']) {
    const ls = flow(a, ['ls', flag, 'bee']);
    assert.strictEqual(ls.code, 0, ls.stderr);
    assert.match(ls.stdout, /bee-1-thing/);
    assert.match(ls.stdout, /bee-2-from-afar/);
  }
  assert.match(flow(a, ['ls', '--project=bee']).stdout, /bee-1-thing/);
  assert.match(flow(a, ['next', '-p', 'bee']).stdout, /bee-1-thing/);
  assert.doesNotMatch(flow(a, ['ls']).stdout, /bee-1/, 'without the flag, A\'s own');

  const homed = flow(a, ['new', 'Shared', '--title', 'shared', '-p', 'home']);
  assert.match(homed.stdout, /created home-1-shared/);
  assert.match(flow(a, ['ls', '-p', 'home']).stdout, /home-1-shared/);
  assert.match(flow(a, ['next', '-p', 'home']).stdout, /home-1-shared/);
  assert.ok(fs.existsSync(path.join(home, 'tickets', '1', 'ticket.md')));
  assert.deepStrictEqual(Object.keys(registry.read(home)), ['bee'], 'home is no registry line, and A wrote no ticket');
});

test('--project refuses global, a folder, all and a prefix no project has, and writes nothing', () => {
  const { a, b, home } = pair('routing-flag-refuse');
  const before = fs.readdirSync(path.join(b, '.flow', 'tickets')).sort();

  assert.match(flow(a, ['new', 'x', '--title', 'x', '-p', 'global']).stderr, /"global" is now named "home"/);
  const folder = flow(a, ['new', 'x', '--title', 'x', '-p', b]);
  assert.strictEqual(folder.code, 1);
  assert.match(folder.stderr, /is not a project prefix\. --project takes the prefix of a project/);
  assert.match(folder.stderr, /has the prefix bee/);
  assert.match(flow(a, ['ls', '-p', 'all']).stderr, /is not a project prefix/);
  assert.match(flow(a, ['next', '--project', 'zzz']).stderr, /no project on this machine has the prefix "zzz".*flow doctor/s);
  assert.match(flow(a, ['ls', '-p']).stderr, /-p needs a value/);

  assert.deepStrictEqual(fs.readdirSync(path.join(b, '.flow', 'tickets')).sort(), before);
  assert.ok(!fs.existsSync(path.join(home, 'tickets')), 'no refusal made a ticket in home');
});

test('help lists -p beside --project', () => {
  const { a } = pair('routing-flag-help');
  assert.match(flow(a, ['ls', '--help']).stdout, /\[-p, --project <prefix>\]/);
});

test('a write whose id names its place works from a folder with no project', () => {
  const { a, b, home } = pair('routing-named');
  flow(a, ['new', 'Home one', '--title', 'home-one']);
  flow(a, ['move', 'exp-1', 'home']);

  const home1 = outside('routing-named', home, ['start', 'home-1']);
  assert.strictEqual(home1.code, 0, home1.stderr);
  assert.match(home1.stdout, /home-1-home-one {2}todo → in-progress/);

  const bee1 = outside('routing-named', home, ['start', 'bee-1']);
  assert.strictEqual(bee1.code, 0, bee1.stderr);
  assert.match(fs.readFileSync(path.join(b, '.flow', 'tickets', '1', 'ticket.md'), 'utf8'), /^status: in-progress$/m);
});
