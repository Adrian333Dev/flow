/**
 * The machine's list of projects (shared/registry.ts): who registers, who is
 * refused, and what stays out. Each test has its own Flow home, `flow-home/`
 * in the scratch project, so none touches the real `~/.flow/registry.json`.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SCRATCH, project, flow, run } from '../testing.ts';
import * as registry from '../registry.ts';

const homeOf = (dir) => path.join(dir, 'flow-home');
const real = (p) => fs.realpathSync(p);

/** `flow init` in a folder that is no repository yet, against one Flow home. */
function init(home, folder, ...args) {
  fs.mkdirSync(folder, { recursive: true });
  const env: NodeJS.ProcessEnv = { ...process.env, FLOW_HOME: home };
  delete env.FLOW_PROJECT;
  return run('flow.ts', ['init', ...args], { cwd: folder, env });
}

test('flow init registers the project, and a second one on the same prefix is refused with a free word', () => {
  const dir = path.join(SCRATCH, 'registry-init');
  fs.rmSync(dir, { recursive: true, force: true });
  const home = homeOf(dir);
  const ana = path.join(dir, 'ana');
  const ben = path.join(dir, 'ben');

  const first = init(home, ana, '--prefix', 'exp');
  assert.strictEqual(first.code, 0, first.stderr);
  assert.deepStrictEqual(registry.read(home), { exp: real(ana) });

  const second = init(home, ben, '--prefix', 'exp');
  assert.strictEqual(second.code, 1);
  assert.match(second.stderr, /"exp" is the prefix of .*ana, another project on this machine\. Run flow init --prefix (\w+)\./);
  assert.deepStrictEqual(registry.read(home), { exp: real(ana) }, 'the refused project is not in the list');

  const word = /--prefix (\w+)\./.exec(second.stderr)![1];
  const third = init(home, ben, '--prefix', word);
  assert.strictEqual(third.code, 0, third.stderr);
  assert.deepStrictEqual(registry.read(home), { exp: real(ana), [word]: real(ben) });
});

test('flow init in a folder named global offers glo, and refuses the words that name a place', () => {
  const dir = path.join(SCRATCH, 'registry-words');
  fs.rmSync(dir, { recursive: true, force: true });
  const home = homeOf(dir);
  const folder = path.join(dir, 'global');

  const offered = init(home, folder);
  assert.strictEqual(offered.code, 0, offered.stderr);
  assert.deepStrictEqual(registry.read(home), { glo: real(folder) });

  for (const word of ['global', 'all', 'home', 'here']) {
    const refused = init(home, path.join(dir, `w-${word}`), '--prefix', word);
    assert.strictEqual(refused.code, 1, `${word}: ${refused.stdout}`);
    assert.match(refused.stderr, new RegExp(`"${word}"`));
  }
  assert.deepStrictEqual(registry.read(home), { glo: real(folder) }, 'no refused project was registered');
});

test('a project that arrives with .flow/ registers on its first ticket-writing command, and flow ls leaves it out', () => {
  const dir = project('registry-clone');
  const home = homeOf(dir);

  assert.strictEqual(flow(dir, ['tickets']).code, 0);
  assert.deepStrictEqual(registry.read(home), {}, 'a read registers nothing');

  const made = flow(dir, ['tickets', 'new', 'Try it']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.deepStrictEqual(registry.read(home), { exp: real(dir) });
});

test('a project moved to a new path updates its line on its next ticket-writing command', () => {
  const dir = project('registry-moved');
  const home = homeOf(dir);
  registry.write({ exp: path.join(dir, 'where-it-was') }, home);

  const made = flow(dir, ['tickets', 'new', 'Try it']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.deepStrictEqual(registry.read(home), { exp: real(dir) });
  assert.strictEqual(registry.register(dir, home), 'same');
});

test('a prefix another existing folder holds is a clash: the command works, the registry stays', () => {
  const dir = project('registry-clash');
  const other = project('registry-clash-other');
  const home = homeOf(dir);
  registry.write({ exp: other }, home);

  const made = flow(dir, ['tickets', 'new', 'Try it']);
  assert.strictEqual(made.code, 0, made.stderr);
  assert.deepStrictEqual(registry.read(home), { exp: other });
  assert.strictEqual(registry.register(dir, home), 'clash');
});

test('projects() lists the home place first, then each project with whether its folder exists', () => {
  const dir = project('registry-list');
  const home = homeOf(dir);
  const gone = path.join(dir, 'gone');
  registry.write({ shop: gone, exp: dir }, home);

  assert.deepStrictEqual(registry.projects(home), [
    { prefix: 'home', folder: path.resolve(home), exists: true },
    { prefix: 'exp', folder: dir, exists: true },
    { prefix: 'shop', folder: gone, exists: false },
  ]);
});

test('the home place and a folder without .flow are never brought in', () => {
  const dir = project('registry-skipped');
  const home = homeOf(dir);
  const plain = path.join(dir, 'plain');
  fs.mkdirSync(plain);

  assert.strictEqual(registry.register(home, home), 'skipped');
  assert.strictEqual(registry.register(plain, home), 'skipped');
  assert.deepStrictEqual(registry.read(home), {});
  assert.ok(!fs.existsSync(registry.file(home)), 'nothing was written');
});

test('a folder that takes a new prefix loses its line under the old one', () => {
  const dir = project('registry-rename');
  const home = homeOf(dir);
  assert.strictEqual(registry.register(dir, home), 'added');

  fs.writeFileSync(path.join(dir, '.flow', 'settings.json'), '{\n  "ticketPrefix": "shop"\n}\n');
  assert.strictEqual(registry.register(dir, home), 'added');
  assert.deepStrictEqual(registry.read(home), { shop: path.resolve(dir) });
});

test('a registered path that no longer exists does not hold its prefix', () => {
  const dir = project('registry-free');
  const home = homeOf(dir);
  registry.write({ exp: path.join(dir, 'gone') }, home);

  assert.strictEqual(registry.holder('exp', dir, home), null);
  assert.strictEqual(registry.holder('exp', path.join(dir, 'elsewhere'), home), null);
});
