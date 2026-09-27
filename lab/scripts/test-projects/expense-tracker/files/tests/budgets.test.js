'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { scratch } = require('./helpers');
const { setBudget, readBudgets } = require('../src/budgets');

test('set replaces the budget for a category and keeps the rest', () => {
  scratch();
  setBudget('food', 200);
  setBudget('travel', 100);
  setBudget('food', 150);
  assert.deepStrictEqual(readBudgets(), [
    { category: 'food', amount: 150 },
    { category: 'travel', amount: 100 },
  ]);
});
