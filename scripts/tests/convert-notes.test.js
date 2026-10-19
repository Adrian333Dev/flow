'use strict';
/**
 * lab/scripts/convert-notes.js against scratch notes: `global` becomes `home`,
 * a folder name becomes its registered prefix, change times stay, and a second
 * run changes nothing. Each test has its own Flow home, so none touches the
 * real `~/.flow/notes`.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SCRATCH } = require('./helpers/scratch');
const registry = require('../lib/registry');

const SCRIPT = path.resolve(__dirname, '..', '..', 'lab', 'scripts', 'convert-notes.js');

const note = (project, body = 'A thought.') => `---\ndate: 2026-10-18\nlabels: [profile]\nproject: ${project}\n---\n\n${body}\n`;

/** A Flow home with `shop` registered for the folder `web-shop`, and four notes. */
function scratchHome(name) {
  const home = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(path.join(SCRATCH, name), { recursive: true, force: true });
  fs.mkdirSync(path.join(home, 'notes'), { recursive: true });
  registry.write({ shop: path.join(SCRATCH, name, 'web-shop') }, home);
  const files = {
    'a-global-note': note('global'),
    'a-folder-note': note('web-shop'),
    'a-converted-note': note('shop'),
    'an-unknown-note': note('old-site'),
  };
  for (const [slug, text] of Object.entries(files)) fs.writeFileSync(path.join(home, 'notes', `${slug}.md`), text);
  return home;
}

const convert = (home, ...args) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, FLOW_HOME: home }, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
};

const projectOf = (home, slug) =>
  /^project: (.*)$/m.exec(fs.readFileSync(path.join(home, 'notes', `${slug}.md`), 'utf8'))[1];

test('convert-notes --dry-run names the changes and writes nothing', () => {
  const home = scratchHome('convert-notes-dry');
  const r = convert(home, '--dry-run');
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /would change 2 notes\./);
  assert.strictEqual(projectOf(home, 'a-global-note'), 'global');
  assert.strictEqual(projectOf(home, 'a-folder-note'), 'web-shop');
});

test('convert-notes moves global to home and a folder to its prefix, and keeps change times', () => {
  const home = scratchHome('convert-notes-run');
  const file = path.join(home, 'notes', 'a-global-note.md');
  const when = new Date('2026-01-02T03:04:05Z');
  fs.utimesSync(file, when, when);

  const r = convert(home);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /changed 2 notes\./);
  assert.strictEqual(projectOf(home, 'a-global-note'), 'home');
  assert.strictEqual(projectOf(home, 'a-folder-note'), 'shop');
  assert.strictEqual(projectOf(home, 'a-converted-note'), 'shop');
  assert.strictEqual(fs.statSync(file).mtimeMs, when.getTime());
  assert.match(fs.readFileSync(file, 'utf8'), /\n---\n\nA thought\.\n$/, 'the body is untouched');
});

test('a folder the registry does not know is left alone and named, and --map says what it was', () => {
  const home = scratchHome('convert-notes-map');
  const left = convert(home);
  assert.strictEqual(projectOf(home, 'an-unknown-note'), 'old-site');
  assert.match(left.stdout, /left alone: 1 note of "old-site".*--map old-site=<prefix>/);

  const mapped = convert(home, '--map', 'old-site=blog');
  assert.strictEqual(mapped.code, 0, mapped.stderr);
  assert.strictEqual(projectOf(home, 'an-unknown-note'), 'blog');
});

test('convert-notes refuses a --map prefix that is not a prefix', () => {
  const home = scratchHome('convert-notes-bad-map');
  const r = convert(home, '--map', 'old-site=global');
  assert.strictEqual(r.code, 1);
  assert.match(r.stderr, /--map takes folder=prefix/);
});

test('convert-notes twice changes nothing the second time', () => {
  const home = scratchHome('convert-notes-twice');
  convert(home);
  const once = fs.readdirSync(path.join(home, 'notes')).map((f) => fs.readFileSync(path.join(home, 'notes', f), 'utf8'));
  const again = convert(home);
  assert.match(again.stdout, /changed 0 notes\./);
  const twice = fs.readdirSync(path.join(home, 'notes')).map((f) => fs.readFileSync(path.join(home, 'notes', f), 'utf8'));
  assert.deepStrictEqual(twice, once);
});
