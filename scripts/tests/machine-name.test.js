'use strict';
/**
 * `lib/machine/machine-name.js`: the name `flow install` offers a machine. What the
 * hardware says is read on a real machine only, so these cover what is made
 * of it: the chassis type as a word, a Mac's model line, a clash numbered, a
 * typed name cleaned.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const name = require('../lib/machine/machine-name');

test('a chassis type becomes laptop, pc or server, and anything else nothing', () => {
  assert.deepStrictEqual([9, 10, 31].map(name.typeOf), ['laptop', 'laptop', 'laptop']);
  assert.deepStrictEqual([3, 13, 35].map(name.typeOf), ['pc', 'pc', 'pc']);
  assert.strictEqual(name.typeOf(23), 'server');
  assert.strictEqual(name.typeOf(1), null, 'a cloud server reports Other');
  assert.strictEqual(name.typeOf(NaN), null, 'no file to read');
});

test('a Mac is named for its model line, and nothing where there is none', () => {
  const said = 'Hardware:\n\n    Hardware Overview:\n\n      Model Name: MacBook Pro\n      Model Identifier: Mac14,10\n';
  assert.strictEqual(name.macModel(said), 'macbook-pro');
  assert.strictEqual(name.macModel('      Model Name: Mac mini\n'), 'mac-mini');
  assert.strictEqual(name.macModel(''), null, 'system_profiler printed nothing');
});

test('a name a record holds is offered with the next free number', () => {
  assert.strictEqual(name.suggest([], 'pc-wsl'), 'pc-wsl');
  assert.strictEqual(name.suggest(['pc-wsl'], 'pc-wsl'), 'pc-wsl-2');
  assert.strictEqual(name.suggest(['pc-wsl', 'pc-wsl-2', 'macbook-pro'], 'pc-wsl'), 'pc-wsl-3');
});

test('a typed name keeps letters, digits and dashes', () => {
  assert.strictEqual(name.clean(' My Laptop! '), 'my-laptop');
  assert.strictEqual(name.clean('work_pc 2'), 'work-pc-2');
  assert.strictEqual(name.clean('!!!'), '');
});
