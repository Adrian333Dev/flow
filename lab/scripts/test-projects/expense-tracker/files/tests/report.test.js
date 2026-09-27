'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { report } = require('../src/report');
const records = require('./fixtures/expenses.json');

test('report sums by category', () => {
  const out = report(records);
  assert.match(out, /food\s+20\.50/);
  assert.match(out, /travel\s+100\.00/);
});
