#!/usr/bin/env node
'use strict';
const { read } = require('./config');

const [command, name, value] = process.argv.slice(2);

if (command === 'get') {
  const config = read();
  if (!(name in config)) { console.error(name); process.exit(1); }
  console.log(config[name]);
} else if (command === 'set') {
  // step 2 of t003: parse, then write. The write is not called yet.
  console.log(`would set ${name} to ${value}`);
} else {
  console.error('config: get <name> | set <name> <value>');
  process.exit(2);
}
