'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const { spawnSync } = require('child_process');
const frontmatter = require('../lib/frontmatter');

const SCRIPT = path.resolve(__dirname, '..', '..', 'lab', 'scripts', 'convert-tickets.js');

/** The conversion script against a scratch project. */
const convert = (dir, ...args) => {
  const env = { ...process.env, FLOW_PROJECT: dir, FLOW_HOME: path.join(dir, 'flow-home') };
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, env, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
};

const old = (id, fields, body = 'Body.\n') =>
  `---\nid: ${id}\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n${body}`;

/** A project in the old shape, with a file beside each ticket that must survive. */
function oldProject(name) {
  const dir = project(name);
  const tickets = [
    ['exp-1-login-page', { title: 'Login page for the app', status: 'building', type: 'feature', priority: 'high' }],
    ['exp-2-parser-crash', { title: 'The parser crashes on empty input', status: 'todo', type: 'issue', priority: 'high', parent: 'exp-1' }],
    ['exp-3-dark-mode', { title: 'Dark mode', status: 'parked', type: 'prototype', priority: 'low', reason: 'later', resume: 'planning' }],
    ['exp-4', { title: 'A folder with no words in it', status: 'review', type: 'topic' }],
    ['archive/exp-5-old-thing', { title: 'Old thing', status: 'done', type: 'chore', priority: 'high' }],
  ];
  for (const [folder, fields] of tickets) {
    write(dir, `.flow/tickets/${folder}/ticket.md`, old(folder.match(/exp-\d+/)[0], fields));
    write(dir, `.flow/tickets/${folder}/groundwork/map.md`, `map of ${folder}\n`);
  }
  write(dir, '.flow/tickets/archive/exp-5-old-thing/issues.md', 'what it taught\n');
  return dir;
}

const read = (dir, folder) =>
  frontmatter.parse(fs.readFileSync(path.join(dir, '.flow', 'tickets', folder, 'ticket.md'), 'utf8')).data;

/** Every file under the tickets folder, as `path: content`, ticket.md frontmatter left out. */
function snapshot(dir) {
  const base = path.join(dir, '.flow', 'tickets');
  const lines = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const text = fs.readFileSync(p, 'utf8');
      lines.push(`${path.relative(base, p)}: ${e.name === 'ticket.md' ? frontmatter.parse(text).body.trim() : text}`);
    }
  };
  walk(base);
  return lines.sort();
}

test('flow check names the tickets with no description', () => {
  const dir = oldProject('convert-check');
  const r = flow(dir, ['tickets', 'check']);
  assert.strictEqual(r.code, 1);
  assert.match(r.stdout, /no title or description \(5\), added by flow tickets edit/);
});

test('convert-tickets --dry-run counts and writes nothing', () => {
  const dir = oldProject('convert-dry');
  const before = fs.readFileSync(path.join(dir, '.flow', 'tickets', 'exp-1-login-page', 'ticket.md'), 'utf8');
  const r = convert(dir, '--dry-run');
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^would convert 5 of 5 tickets:$/m);
  assert.strictEqual(fs.readFileSync(path.join(dir, '.flow', 'tickets', 'exp-1-login-page', 'ticket.md'), 'utf8'), before);
});

test('convert-tickets gives every ticket the new shape and touches nothing else', () => {
  const dir = oldProject('convert-run');
  const before = snapshot(dir);

  const r = convert(dir);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^converted 5 of 5 tickets:$/m);
  assert.match(r.stdout, /5 titles moved to descriptions/);
  assert.match(r.stdout, /5 types added as labels/);
  assert.match(r.stdout, /3 old statuses moved to in-progress/);
  assert.match(r.stdout, /2 high-priority tickets given a rank/);
  assert.match(r.stdout, /4 priorities removed/);

  const login = read(dir, 'exp-1-login-page');
  assert.strictEqual(login.title, 'login-page');
  assert.strictEqual(login.description, 'Login page for the app');
  assert.strictEqual(login.status, 'in-progress');
  assert.deepStrictEqual(login.labels, ['feature']);
  assert.strictEqual(String(login.rank), '1000');
  assert.ok(!('type' in login) && !('priority' in login));

  const crash = read(dir, 'exp-2-parser-crash');
  assert.deepStrictEqual(crash.labels, ['bug']);
  assert.strictEqual(String(crash.rank), '1000','a child is ranked among its own siblings');

  const dark = read(dir, 'exp-3-dark-mode');
  assert.deepStrictEqual(dark.labels, ['research']);
  assert.strictEqual(dark.status, 'parked');
  assert.strictEqual(dark.resume, 'in-progress');
  assert.ok(!('rank' in dark), 'low priority gets no rank');

  assert.strictEqual(read(dir, 'exp-4').title, 'a-folder-with-no', 'a folder with no words takes a cut of the sentence');
  assert.strictEqual(read(dir, 'exp-4').status, 'in-progress');
  assert.ok(!('rank' in read(dir, 'archive/exp-5-old-thing')), 'a closed ticket gets no rank');

  assert.deepStrictEqual(snapshot(dir), before, 'every file but the frontmatter of ticket.md is unchanged');
  assert.strictEqual(flow(dir, ['tickets', 'check']).code, 0);
});

test('convert-tickets twice changes nothing the second time', () => {
  const dir = oldProject('convert-twice');
  convert(dir);
  const once = fs.readFileSync(path.join(dir, '.flow', 'tickets', 'exp-1-login-page', 'ticket.md'), 'utf8');
  const again = convert(dir);
  assert.strictEqual(again.stdout.trim(), 'nothing to convert.');
  assert.strictEqual(fs.readFileSync(path.join(dir, '.flow', 'tickets', 'exp-1-login-page', 'ticket.md'), 'utf8'), once);
});
