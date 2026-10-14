'use strict';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function checkDate(value) {
  if (!DATE.test(value)) throw new Error(`a date is YYYY-MM-DD, got "${value}"`);
  return value;
}

// The month a date belongs to, as the key the report groups by.
function monthOf(date) {
  return date.slice(0, 6);
}

module.exports = { today, checkDate, monthOf };
