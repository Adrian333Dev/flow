'use strict';
const fs = require('fs');
const path = require('path');

// One budget per category, per month. Kept apart from the records so a
// change to a budget never rewrites the expense file.
const file = () => process.env.BUDGET_FILE || path.join(__dirname, '..', 'budgets.json');

function readBudgets() {
  if (!fs.existsSync(file())) return [];
  return JSON.parse(fs.readFileSync(file(), 'utf8'));
}

function setBudget(category, amount) {
  const value = Number(amount);
  if (!category) throw new Error('a category is required');
  if (!Number.isFinite(value) || value <= 0) throw new Error(`a budget is a number above zero, got "${amount}"`);
  const budgets = readBudgets().filter((b) => b.category !== category);
  const budget = { category, amount: Math.round(value * 100) / 100 };
  budgets.push(budget);
  budgets.sort((a, b) => a.category.localeCompare(b.category));
  fs.writeFileSync(file(), JSON.stringify(budgets, null, 2) + '\n');
  return budget;
}

module.exports = { readBudgets, setBudget };
