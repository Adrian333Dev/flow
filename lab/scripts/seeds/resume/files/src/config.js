'use strict';
const fs = require('fs');
const path = require('path');

const file = () => path.join(__dirname, '..', 'config.json');

function read() {
  if (!fs.existsSync(file())) return {};
  return JSON.parse(fs.readFileSync(file(), 'utf8'));
}

module.exports = { read, file };
