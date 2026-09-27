'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { scratch } = require('./helpers');
const { add } = require('../src/add');
const { readAll } = require('../src/store');

test('add writes one record with the next id', () => {
  scratch();
  add({ amount: '12.5', category: 'food', note: 'lunch', date: '2026-01-14' });
  const second = add({ amount: 8, category: 'food', date: '2026-01-15' });
  assert.strictEqual(second.id, 2);
  assert.strictEqual(readAll().length, 2);
});

test('add refuses a negative amount and a missing category', () => {
  scratch();
  assert.throws(() => add({ amount: '-3', category: 'food' }), /above zero/);
  assert.throws(() => add({ amount: '3' }), /category is required/);
  assert.strictEqual(readAll().length, 0);
});

test('add refuses a date that is not YYYY-MM-DD', () => {
  scratch();
  assert.throws(() => add({ amount: 1, category: 'food', date: '14/01/2026' }), /YYYY-MM-DD/);
});
