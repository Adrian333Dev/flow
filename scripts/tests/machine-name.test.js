'use strict';
/**
 * `lib/machine-name.js`: the name `flow install` offers a machine. What the
 * hardware says is read on a real machine only, so these cover what is made
 * of it: the chassis type as a word, a clash numbered, a typed name cleaned.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const name = require('../flow/lib/machine-name');

test('a chassis type becomes laptop, desktop or server, and anything else nothing', () => {
  assert.deepStrictEqual([9, 10, 31].map(name.typeOf), ['laptop', 'laptop', 'laptop']);
  assert.deepStrictEqual([3, 13, 35].map(name.typeOf), ['desktop', 'desktop', 'desktop']);
  assert.strictEqual(name.typeOf(23), 'server');
  assert.strictEqual(name.typeOf(1), null, 'a cloud server reports Other');
  assert.strictEqual(name.typeOf(NaN), null, 'no file to read');
});

test('a name a record holds is offered with the next free number', () => {
  assert.strictEqual(name.suggest([], 'desktop-wsl'), 'desktop-wsl');
  assert.strictEqual(name.suggest(['desktop-wsl'], 'desktop-wsl'), 'desktop-wsl-2');
  assert.strictEqual(name.suggest(['desktop-wsl', 'desktop-wsl-2', 'laptop-mac'], 'desktop-wsl'), 'desktop-wsl-3');
});

test('a typed name keeps letters, digits and dashes', () => {
  assert.strictEqual(name.clean(' My Laptop! '), 'my-laptop');
  assert.strictEqual(name.clean('work_pc 2'), 'work-pc-2');
  assert.strictEqual(name.clean('!!!'), '');
});
