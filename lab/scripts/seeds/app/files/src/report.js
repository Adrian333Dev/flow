'use strict';
const { readAll } = require('./store');
const { monthOf } = require('./dates');

function totals(records, keyOf) {
  const sums = new Map();
  for (const r of records) sums.set(keyOf(r), (sums.get(keyOf(r)) || 0) + r.amount);
  return [...sums.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function report(records = readAll()) {
  const lines = ['by category'];
  for (const [category, sum] of totals(records, (r) => r.category)) {
    lines.push(`  ${category.padEnd(12)} ${sum.toFixed(2)}`);
  }
  lines.push('', 'by month');
  for (const [month, sum] of totals(records, (r) => monthOf(r.date))) {
    lines.push(`  ${month.padEnd(12)} ${sum.toFixed(2)}`);
  }
  return lines.join('\n') + '\n';
}

module.exports = { report, totals };
