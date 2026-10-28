/**
 * An id's prefix finds its project from any folder, and a folder that is no
 * project reads the home place. Project A is the folder a command runs in,
 * project B (prefix `bee`) is reached through the registry in A's Flow home.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SCRATCH, project, write, flow, run } from '../shared/testing.ts';
import * as registry from '../shared/registry.ts';

const homeOf = (dir) => path.join(dir, 'flow-home');

/** Projects A and B, B holding `bee-1`, both known to A's Flow home. */
function pair(name) {
  const a = project(`${name}-a`);
  const b = project(`${name}-b`);
  write(b, '.flow/settings.json', '{\n  "ticketPrefix": "bee"\n}\n');
  const made = flow(b, ['tickets', 'new', 'Thing'], { FLOW_HOME: homeOf(a) });
  assert.strictEqual(made.code, 0, made.stderr);
  return { a, b, home: homeOf(a) };
}

/** `flow` in a plain folder: no repository, no `.flow/`, no FLOW_PROJECT. */
function outside(name, home, args) {
  const cwd = path.join(SCRATCH, `${name}-plain`);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.mkdirSync(cwd, { recursive: true });
  const env: NodeJS.ProcessEnv = { ...process.env, FLOW_HOME: home };
  delete env.FLOW_PROJECT;
  return { ...run('flow.ts', args, { cwd, env }), cwd };
}

test('from project A, flow <id> and flow start <id> work on a ticket of project B', () => {
  const { a, b, home } = pair('routing-read');

  const shown = flow(a, ['tickets', 'get', 'bee-1']);
  assert.strictEqual(shown.code, 0, shown.stderr);
  assert.match(shown.stdout, /^bee-1-thing/m);

  const started = flow(a, ['tickets', 'start', 'bee-1']);
  assert.strictEqual(started.code, 0, started.stderr);
  assert.match(started.stdout, /bee-1-thing {2}todo → in-progress/);
  assert.match(fs.readFileSync(path.join(b, '.flow', 'tickets', '1', 'ticket.md'), 'utf8'), /^status: in-progress$/m);

  assert.deepStrictEqual(Object.keys(registry.read(home)), ['bee'], 'A wrote no ticket, so A stays unregistered');
});

test('the folder you stand in wins when its own prefix matches', () => {
  const { a, b, home } = pair('routing-wins');
  flow(a, ['tickets', 'new', 'Mine']);
  registry.write({ exp: b, bee: b }, home);

  assert.match(flow(a, ['tickets', 'get', 'exp-1']).stdout, /^exp-1-mine/m);
  assert.match(flow(a, ['tickets', 'get', '1']).stdout, /^exp-1-mine/m, 'a bare number is the current project\'s');
});

test('an unknown prefix names flow doctor and says a project registers by its first ticket write', () => {
  const { a } = pair('routing-unknown');
  const r = flow(a, ['tickets', 'start', 'zzz-1']);
  assert.strictEqual(r.code, 1);
  assert.match(r.stderr, /no project on this machine has the prefix "zzz"/);
  assert.match(r.stderr, /first ticket write/);
  assert.match(r.stderr, /flow doctor/);
});

test('a registered path that is gone, or whose prefix changed, is refused with the cause', () => {
  const { a, b, home } = pair('routing-stale');

  registry.write({ bee: path.join(a, 'moved-away') }, home);
  assert.match(flow(a, ['tickets', 'get', 'bee-1']).stderr, /registered at .*moved-away, which holds no \.flow\/ now/);

  registry.write({ bee: b }, home);
  write(b, '.flow/settings.json', '{\n  "ticketPrefix": "cat"\n}\n');
  assert.match(flow(a, ['tickets', 'get', 'bee-1']).stderr, /"bee" is registered at .*, whose ticketPrefix is now "cat"/);
});

test('an id of B that flow move took home still finds the ticket from A', () => {
  const { a, b, home } = pair('routing-was');
  const moved = flow(b, ['tickets', 'move', 'bee-1', 'home'], { FLOW_HOME: home });
  assert.strictEqual(moved.code, 0, moved.stderr);

  const r = flow(a, ['tickets', 'get', 'bee-1']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^home-1-thing/m);
});

test('flow move takes the destination project as a prefix, and refuses a folder', () => {
  const { a, b, home } = pair('routing-move');
  flow(a, ['tickets', 'new', 'Wanderer']);

  const byFolder = flow(a, ['tickets', 'move', 'exp-1', b]);
  assert.strictEqual(byFolder.code, 1);
  assert.match(byFolder.stderr, /is not a project prefix\. move takes the prefix of a project/);
  assert.match(byFolder.stderr, /has the prefix bee/, 'a folder names the prefix to type');

  const unknown = flow(a, ['tickets', 'move', 'exp-1', 'zzz']);
  assert.strictEqual(unknown.code, 1);
  assert.match(unknown.stderr, /no project on this machine has the prefix "zzz".*flow doctor/s);

  const moved = flow(a, ['tickets', 'move', 'exp-1', 'bee']);
  assert.strictEqual(moved.code, 0, moved.stderr);
  assert.match(moved.stdout, /exp-1 → bee-2-wanderer/);
  assert.ok(fs.existsSync(path.join(b, '.flow', 'tickets', '2', 'ticket.md')));
  assert.ok(Object.keys(registry.read(home)).includes('bee'));
});

test('a read in a folder with no project shows the home tickets under a header line, and creates nothing', () => {
  const { a, home } = pair('routing-outside');
  flow(a, ['tickets', 'new', 'Kept']);
  assert.strictEqual(flow(a, ['tickets', 'move', 'exp-1', 'home']).code, 0);

  const ls = outside('routing-outside', home, ['tickets']);
  assert.strictEqual(ls.code, 0, ls.stderr);
  assert.match(ls.stdout, /^home {2}\S+\n/);
  assert.doesNotMatch(ls.stdout, /outside a project/);
  assert.match(ls.stdout, /home-1-kept/);

  const next = outside('routing-outside', home, ['next']);
  assert.strictEqual(next.code, 0, next.stderr);
  assert.match(next.stdout, /^home {2}\S+\n/);

  const named = outside('routing-outside', home, ['tickets', 'get', 'home-1']);
  assert.strictEqual(named.code, 0, named.stderr);
  assert.doesNotMatch(named.stdout, /^home {2}\S+$/m, 'an id that names its place prints no header');
  assert.deepStrictEqual(fs.readdirSync(ls.cwd), [], 'nothing was initialized in the folder');
});

test('a write in a folder with no project refuses and names flow init and --project home', () => {
  const { home } = pair('routing-refuse');
  const before = fs.readdirSync(home).sort();

  for (const args of [['tickets', 'new', 'Lost'], ['notes', 'new', 'lost words'], ['tickets', 'start', '1'], ['tickets', 'park', '1', '--reason', 'r']]) {
    const r = outside('routing-refuse', home, args);
    assert.strictEqual(r.code, 1, args.join(' '));
    assert.match(r.stderr, /not inside a Flow project/, args.join(' '));
    assert.match(r.stderr, /flow init/);
    assert.match(r.stderr, /--project home/);
  }
  assert.deepStrictEqual(fs.readdirSync(home).sort(), before, 'no ticket and no note was made');

  const named = outside('routing-refuse', home, ['notes', 'new', 'kept words', '--project', 'home']);
  assert.strictEqual(named.code, 0, named.stderr);

  const ticket = outside('routing-refuse', home, ['tickets', 'new', 'Kept', '-p', 'home']);
  assert.strictEqual(ticket.code, 0, ticket.stderr);
  assert.match(ticket.stdout, /created home-1-kept/);
});

test('-p and --project name a project by its prefix for new, ls and next, from another folder', () => {
  const { a, b, home } = pair('routing-flag');

  const made = flow(a, ['tickets', 'new', 'From afar', '-p', 'bee']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.match(made.stdout, /created bee-2-from-afar/);
  assert.ok(fs.existsSync(path.join(b, '.flow', 'tickets', '2', 'ticket.md')), 'the ticket landed in B');
  assert.ok(!fs.existsSync(path.join(a, '.flow', 'tickets')), 'A got nothing');

  for (const flag of ['-p', '--project']) {
    const ls = flow(a, ['tickets', flag, 'bee']);
    assert.strictEqual(ls.code, 0, ls.stderr);
    assert.match(ls.stdout, /bee-1-thing/);
    assert.match(ls.stdout, /bee-2-from-afar/);
  }
  assert.match(flow(a, ['tickets', '--project=bee']).stdout, /bee-1-thing/);
  assert.match(flow(a, ['next', '-p', 'bee']).stdout, /bee-1-thing/);
  assert.doesNotMatch(flow(a, ['tickets']).stdout, /bee-1/, 'without the flag, A\'s own');

  const homed = flow(a, ['tickets', 'new', 'Shared', '-p', 'home']);
  assert.match(homed.stdout, /created home-1-shared/);
  assert.match(flow(a, ['tickets', '-p', 'home']).stdout, /home-1-shared/);
  assert.match(flow(a, ['next', '-p', 'home']).stdout, /home-1-shared/);
  assert.ok(fs.existsSync(path.join(home, 'tickets', '1', 'ticket.md')));
  assert.deepStrictEqual(Object.keys(registry.read(home)), ['bee'], 'home is no registry line, and A wrote no ticket');
});

test('--project refuses global, a folder, all and a prefix no project has, and writes nothing', () => {
  const { a, b, home } = pair('routing-flag-refuse');
  const before = fs.readdirSync(path.join(b, '.flow', 'tickets')).sort();

  assert.match(flow(a, ['tickets', 'new', 'x', '-p', 'global']).stderr, /"global" is now named "home"/);
  const folder = flow(a, ['tickets', 'new', 'x', '-p', b]);
  assert.strictEqual(folder.code, 1);
  assert.match(folder.stderr, /is not a project prefix\. --project takes the prefix of a project/);
  assert.match(folder.stderr, /has the prefix bee/);
  assert.match(flow(a, ['tickets', '-p', 'all']).stderr, /is not a project prefix/);
  assert.match(flow(a, ['next', '--project', 'zzz']).stderr, /no project on this machine has the prefix "zzz".*flow doctor/s);
  assert.match(flow(a, ['tickets', '-p']).stderr, /-p needs a value/);

  assert.deepStrictEqual(fs.readdirSync(path.join(b, '.flow', 'tickets')).sort(), before);
  assert.ok(!fs.existsSync(path.join(home, 'tickets')), 'no refusal made a ticket in home');
});

test('help lists -p beside --project', () => {
  const { a } = pair('routing-flag-help');
  assert.match(flow(a, ['tickets', '--help']).stdout, /\[-p, --project <prefix>\]/);
});

test('a write whose id names its place works from a folder with no project', () => {
  const { a, b, home } = pair('routing-named');
  flow(a, ['tickets', 'new', 'Home one']);
  flow(a, ['tickets', 'move', 'exp-1', 'home']);

  const home1 = outside('routing-named', home, ['tickets', 'start', 'home-1']);
  assert.strictEqual(home1.code, 0, home1.stderr);
  assert.match(home1.stdout, /home-1-home-one {2}todo → in-progress/);

  const bee1 = outside('routing-named', home, ['tickets', 'start', 'bee-1']);
  assert.strictEqual(bee1.code, 0, bee1.stderr);
  assert.match(fs.readFileSync(path.join(b, '.flow', 'tickets', '1', 'ticket.md'), 'utf8'), /^status: in-progress$/m);
});

test('every ls and next list begins with its header line, inside a project too', () => {
  const { a } = pair('routing-header');
  flow(a, ['tickets', 'new', 'Mine']);

  const lists: [string[], string][] = [
    [['tickets'], 'exp'], [['next'], 'exp'], [['tickets', '-p', 'exp'], 'exp'], [['next', '-p', 'exp'], 'exp'],
    [['tickets', '-p', 'bee'], 'bee'], [['next', '-p', 'bee'], 'bee'], [['tickets', '-p', 'home'], 'home'],
  ];
  for (const [args, prefix] of lists) {
    const out = flow(a, args).stdout;
    assert.match(out, new RegExp(`^${prefix} {2}~?\\S+\\n`), args.join(' '));
    assert.strictEqual(out.match(/^(exp|bee|home) {2}\S+$/gm)!.length, 1, `${args.join(' ')} has one header`);
  }
});

test('flow-issue queries read every project and home, and skip a registered path that is gone', () => {
  const { a, b, home } = pair('routing-issues');
  flow(a, ['tickets', 'new', 'Fault A', '--label', 'flow-issue,rework-loop']);
  flow(b, ['tickets', 'new', 'Fault B', '--label', 'flow-issue,wrong-output'], { FLOW_HOME: home });
  flow(a, ['tickets', 'new', 'Fault H', '--label', 'flow-issue,hook', '-p', 'home']);
  registry.write({ ...registry.read(home), gone: path.join(a, 'moved-away') }, home);

  const ls = outside('routing-issues', home, ['tickets', '--', 'label:flow-issue']);
  assert.strictEqual(ls.code, 0, ls.stderr);
  const groups = (out) => out.split(/^(?=(?:exp|bee|home|gone) {2}\S+$)/m).filter((g) => /^\w+ {2}\S+\n/.test(g));
  const prefixes = (out) => groups(out).map((g) => g.split(' ')[0]);
  const under = (out, prefix, id) => groups(out).find((g) => g.startsWith(`${prefix}  `))?.includes(id);

  assert.strictEqual(under(ls.stdout, 'exp', 'exp-1-fault-a'), true, 'fault A sits under exp');
  assert.strictEqual(under(ls.stdout, 'bee', 'bee-2-fault-b'), true, 'fault B sits under bee');
  assert.strictEqual(under(ls.stdout, 'home', 'home-1-fault-h'), true, 'fault H sits under home');
  assert.doesNotMatch(ls.stdout, /bee-1-thing/, 'a ticket without the label stays out');
  assert.ok(!prefixes(ls.stdout).includes('gone'), 'a registered path that is gone has no group');
  assert.strictEqual(ls.stdout.match(/^\d+ of \d+/gm)!.length, 1, 'one count line');

  const labels = outside('routing-issues', home, ['tickets', 'labels', '--', 'label:flow-issue']);
  assert.strictEqual(labels.code, 0, labels.stderr);
  assert.match(labels.stdout, /^3 tickets, 3 open$/m);
  assert.match(labels.stdout, /^more labels: .*rework-loop 1/m);
  assert.match(labels.stdout, /^bee-2 +todo /m);

  const inside = flow(a, ['tickets', '--', 'label:flow-issue']).stdout;
  assert.deepStrictEqual(prefixes(inside), ['exp', 'bee', 'home'], 'the project you stand in first, home last');
  assert.strictEqual(under(inside, 'bee', 'bee-2-fault-b'), true, 'from inside a project too');
  assert.doesNotMatch(labels.stdout, /^(exp|bee|home) {2}\S+$/m, 'labels stays merged, with no group headers');

  const named = flow(a, ['tickets', '--', 'label:flow-issue', '-p', 'bee']).stdout;
  assert.match(named, /bee-2-fault-b/);
  assert.doesNotMatch(named, /exp-1-fault-a/, '-p limits it to one project');

  assert.doesNotMatch(flow(a, ['tickets', '--', 'label:rework-loop,hook']).stdout, /home-1|bee-2/, 'any other query reads the current project');
});
