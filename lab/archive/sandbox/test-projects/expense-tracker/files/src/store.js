'use strict';
const fs = require('fs');
const path = require('path');

// Every record lives in one JSON array. The file sits beside the command, or
// wherever EXPENSE_FILE points, which is how the tests keep their own.
const file = () => process.env.EXPENSE_FILE || path.join(__dirname, '..', 'expenses.json');

function readAll() {
  if (!fs.existsSync(file())) return [];
  return JSON.parse(fs.readFileSync(file(), 'utf8'));
}

function writeAll(records) {
  fs.writeFileSync(file(), JSON.stringify(records, null, 2) + '\n');
}

module.exports = { readAll, writeAll, file };
