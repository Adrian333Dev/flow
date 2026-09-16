'use strict';
const { readAll, writeAll } = require('./store');
const { today, checkDate } = require('./dates');

function add({ amount, category, note = '', date }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`an amount is a number above zero, got "${amount}"`);
  if (!category) throw new Error('a category is required');
  const records = readAll();
  const record = {
    id: records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1,
    date: date ? checkDate(date) : today(),
    amount: Math.round(value * 100) / 100,
    category,
    note,
  };
  records.push(record);
  writeAll(records);
  return record;
}

module.exports = { add };
