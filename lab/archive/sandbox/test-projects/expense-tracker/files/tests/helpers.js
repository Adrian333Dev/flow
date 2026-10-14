'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

// Each test gets its own expense and budget files, so nothing touches the
// real ones and tests can run in any order.
function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expense-'));
  process.env.EXPENSE_FILE = path.join(dir, 'expenses.json');
  process.env.BUDGET_FILE = path.join(dir, 'budgets.json');
  return dir;
}

module.exports = { scratch };
