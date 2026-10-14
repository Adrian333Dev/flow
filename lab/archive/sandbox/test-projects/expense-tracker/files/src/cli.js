#!/usr/bin/env node
'use strict';
const { add } = require('./add');
const { report } = require('./report');
const { setBudget, readBudgets } = require('./budgets');

const [command, ...rest] = process.argv.slice(2);

try {
  if (command === 'add') {
    const flags = {};
    const words = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--date') flags.date = rest[++i];
      else words.push(rest[i]);
    }
    const record = add({ amount: words[0], category: words[1], note: words.slice(2).join(' '), date: flags.date });
    console.log(`${record.id}  ${record.date}  ${record.amount.toFixed(2)}  ${record.category}  ${record.note}`);
  } else if (command === 'report') {
    process.stdout.write(report());
  } else if (command === 'budget' && rest[0] === 'set') {
    const budget = setBudget(rest[1], rest[2]);
    console.log(`${budget.category}  ${budget.amount.toFixed(2)} per month`);
  } else if (command === 'budget') {
    for (const b of readBudgets()) console.log(`${b.category}  ${b.amount.toFixed(2)} per month`);
  } else {
    console.error('expense: add <amount> <category> [note] [--date YYYY-MM-DD] | report | budget [set <category> <amount>]');
    process.exit(2);
  }
} catch (err) {
  console.error(`expense: ${err.message}`);
  process.exit(1);
}
