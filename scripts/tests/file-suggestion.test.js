'use strict';
/**
 * `file-suggestion`: the paths Claude Code shows after `@`.
 *
 * Each test gets its own TMPDIR, so its cache starts empty and never meets
 * another test's.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { SCRATCH, run, write } = require('./helpers/scratch');

/** A project, Flow's folder, and a temp folder of its own for the cache. */
function place(name) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  const at = { project: path.join(dir, 'project'), home: path.join(dir, 'flow-home'), temp: path.join(dir, 'temp') };
  for (const d of Object.values(at)) fs.mkdirSync(d, { recursive: true });
  return at;
}

/** Write a file and set its change time, in seconds counted back from now. */
function file(at, rel, secondsAgo) {
  write(at.project, rel, 'x');
  const when = new Date(Date.now() - secondsAgo * 1000);
  fs.utimesSync(path.join(at.project, rel), when, when);
}

/** The script, handed a query the way Claude Code hands it one. */
function suggest(at, query) {
  const result = run('file-suggestion.js', [], {
    input: JSON.stringify({ query }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: at.project, FLOW_HOME: at.home, TMPDIR: at.temp },
  });
  assert.strictEqual(result.code, 0, result.stderr);
  return result.stdout.split('\n').filter(Boolean);
}

/** The cache file, whatever its hashed name. */
const cacheOf = (at) => {
  const dir = path.join(at.temp, 'flow-file-suggestion');
  const name = fs.readdirSync(dir).find((n) => n.endsWith('.txt'));
  return path.join(dir, name);
};

test('every word must be in the path, the newest comes first, and a git-ignored file is offered', () => {
  const at = place('suggest-match');
  file(at, 'src/components/Button.tsx', 300);
  file(at, 'src/components/Modal.tsx', 10);
  file(at, 'src/util/format.ts', 5);
  file(at, '.env', 60);
  write(at.project, '.gitignore', '.env\n');
  file(at, '.gitignore', 600);
  file(at, 'node_modules/react/index.js', 1);
  file(at, 'dist/app.js', 1);

  assert.deepStrictEqual(suggest(at, 'src/comp'), ['src/components/Modal.tsx', 'src/components/Button.tsx']);
  assert.deepStrictEqual(suggest(at, 'COMP btn'), [], 'every word, and btn is not in Button');
  assert.deepStrictEqual(suggest(at, 'comp butt'), ['src/components/Button.tsx']);
  assert.deepStrictEqual(suggest(at, 'env'), ['.env'], '.gitignore is never read');

  const bare = suggest(at, '');
  assert.strictEqual(bare[0], 'src/util/format.ts', 'a bare @ is the newest files');
  assert.ok(!bare.some((p) => p.startsWith('node_modules/') || p.startsWith('dist/')), bare.join('\n'));
});

test('fileSuggestionIgnore adds names and paths from every level', () => {
  const at = place('suggest-ignore');
  file(at, 'tmp/scratch.md', 1);
  file(at, 'docs/tmp/scratch.md', 1);
  file(at, 'lab/research/page.md', 1);
  file(at, 'docs/research/kept.md', 1);
  file(at, 'lab/notes.md', 1);
  file(at, 'vendor/lib.md', 1);
  write(at.project, '.flow/settings.json', JSON.stringify({ fileSuggestionIgnore: ['lab/research/'] }));
  fs.writeFileSync(path.join(at.home, 'settings.json'), JSON.stringify({ fileSuggestionIgnore: ['tmp'] }));
  fs.writeFileSync(path.join(at.home, 'settings.local.json'), JSON.stringify({ fileSuggestionIgnore: ['./vendor/'] }));

  assert.deepStrictEqual(suggest(at, 'md').sort(), ['docs/research/kept.md', 'lab/notes.md'],
    'a name is skipped at any depth, a path only from the root, and the levels add up');
});

test('a keystroke answers from the cache, and a stale cache is walked again in the background', async () => {
  const at = place('suggest-cache');
  file(at, 'first.md', 1);
  assert.deepStrictEqual(suggest(at, 'md'), ['first.md']);
  const cache = cacheOf(at);
  assert.match(fs.readFileSync(cache, 'utf8'), /^.*project\t\d+\n[\d.]+\tfirst\.md\n$/);

  file(at, 'second.md', 0);
  assert.deepStrictEqual(suggest(at, 'md'), ['first.md'], 'a fresh cache is not walked again');

  // Mark the cache stale: this keystroke still answers from it, and starts a walk.
  const text = fs.readFileSync(cache, 'utf8').replace(/\t\d+\n/, '\t0\n');
  fs.writeFileSync(cache, text);
  assert.deepStrictEqual(suggest(at, 'md'), ['first.md']);
  for (let i = 0; i < 100 && (fs.existsSync(`${cache}.lock`) || !fs.readFileSync(cache, 'utf8').includes('second.md')); i++) {
    await new Promise((done) => setTimeout(done, 50));
  }
  assert.ok(!fs.existsSync(`${cache}.lock`), 'the walk freed its lock');
  assert.deepStrictEqual(suggest(at, 'md'), ['second.md', 'first.md']);
});

test('a file changed since the walk is sorted by its change time now, and a deleted one is dropped', () => {
  const at = place('suggest-restat');
  file(at, 'old.md', 600);
  file(at, 'new.md', 60);
  file(at, 'gone.md', 30);
  assert.deepStrictEqual(suggest(at, 'md'), ['gone.md', 'new.md', 'old.md']);

  file(at, 'old.md', 0);
  fs.rmSync(path.join(at.project, 'gone.md'));
  assert.deepStrictEqual(suggest(at, 'md'), ['old.md', 'new.md']);
});

test('no query, bad input, or a cache from another project never fails', () => {
  const at = place('suggest-odd');
  file(at, 'a.md', 1);
  const raw = run('file-suggestion.js', [], {
    input: 'not json',
    env: { ...process.env, CLAUDE_PROJECT_DIR: at.project, FLOW_HOME: at.home, TMPDIR: at.temp },
  });
  assert.strictEqual(raw.code, 0);
  assert.strictEqual(raw.stdout, 'a.md\n', 'bad input is a bare @');

  fs.writeFileSync(cacheOf(at), '/somewhere/else\t9999999999999\n1\tnot-here.md\n');
  assert.deepStrictEqual(suggest(at, ''), ['a.md'], "another project's cache is walked over");
});
