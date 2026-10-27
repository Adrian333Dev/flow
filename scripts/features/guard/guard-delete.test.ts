/** `guard` on deleting: `rm`, `find -delete` and the like ask over work nothing can give back, and only then. */

import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { world, expect } from './guard-world.ts';

test('a delete asks outside the project, and inside it only over work nothing can give back', () => {
  expect(world('guard-delete'), [
    'rm -rf ../other-project',
    'rm ../plain.txt',
    'rm -f ~/notes.txt',
    'rm -rf "$HOME/notes.txt"',
    'rm -rf ~/*',
    'rm -rf .',
    'rm -rf /',
    'rm src/changed.js',
    'rm notes.md',
    'rm -rf src',
    'rm -rf src/{clean,changed}.js',
    'rm src/*.js',
    'cd .. && rm -rf app',
    '(cd src && rm changed.js)',
    'unlink notes.md',
    'rm .env',
    'rm -rf /tmp',
    'rm -rf /tmp/*',
  ], [
    'rm /tmp/some-file.txt',
    'rm -rf /tmp/claude-1000/scratch /tmp/probe-*',
    'rm -rf dist',
    'rm src/clean.js',
    'rm -rf logs',
    'rm -rf build',
    'rm -rf node_modules',
    '(cd src && rm clean.js)',
  ]);
});

test('a delete inside the project\'s tmp/ never asks, unless a link leads out of it', () => {
  const w = world('guard-scratch');
  spawnSync('git', ['init', '-q', path.join(w.dir, 'tmp', 'repo')]);
  fs.symlinkSync(path.join(w.dir, 'src'), path.join(w.dir, 'tmp', 'code'));
  expect(w, [
    'rm -rf tmp/code/',
    'rm -rf tmp/../notes.md',
  ], [
    'rm tmp/scratch.txt',
    'rm -rf tmp',
    'rm -rf tmp/repo',
    'rm -rf tmp/*',
    'rm tmp/code',
    'find tmp -name "*.txt" -delete',
  ]);
});

test('a delete inside ~/.flow is judged by git: a tracked file runs, an ignored or new one asks', () => {
  const w = world('guard-flow-home');
  const flow = path.join(w.home, '.flow');
  for (const f of ['.gitignore', 'notes/a.md', 'wiki/x/page.md', 'logs/x.log']) {
    fs.mkdirSync(path.dirname(path.join(flow, f)), { recursive: true });
    fs.writeFileSync(path.join(flow, f), f === '.gitignore' ? 'logs/\n' : 'x\n');
  }
  const git = (...args) => spawnSync('git', ['-C', flow, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { encoding: 'utf8' });
  git('init', '-q');
  git('add', '.');
  git('commit', '-q', '-m', 'start');
  fs.writeFileSync(path.join(flow, 'notes', 'new.md'), 'x\n');
  expect(w, [
    'rm ~/.flow/logs/x.log',
    'rm ~/.flow/notes/new.md',
    'rm -rf ~/.flow',
    'rm -rf ~/.flow/.git',
    'rm ~/.flow/.git/HEAD',
    'rm ~/flow-release-old',
  ], [
    'rm ~/.flow/notes/a.md',
    'rm -rf ~/.flow/wiki',
    'rm -f ~/.flow/notes/missing.md',
  ]);
});

test('a delete whose target is only known when it runs asks, in every shape', () => {
  expect(world('guard-dynamic'), [
    'for d in ../a ../b; do rm -rf "$d"; done',
    'for f in notes.md; do rm "$f"; done',
    'for f in src/*.js; do rm "$f"; done',
    'for f in $(ls); do rm "$f"; done',
    'rm -rf "$UNSET_SOMETHING/"',
    'rm -rf $(dirname $PWD)',
    'echo notes.md | xargs rm',
    'git ls-files | xargs -I{} rm {}',
    'bash -c \'rm -rf ~/notes.txt\'',
    'sh -c "rm -rf $HOME/notes.txt"',
    'eval "rm -rf ~/notes.txt"',
    'x=../other; rm -rf "$x"',
    'cd "$SOMEWHERE" && rm -rf build',
    'timeout 5 nice -n 5 env A=1 rm -rf ~/notes.txt',
    'bash <<EOF\nrm -rf ~/notes.txt\nEOF',
    'echo "rm -rf ~/notes.txt" | bash',
    '$CMD -rf src',
  ], [
    'd=dist; rm -rf "$d"',
    'for f in src/clean.js logs/old.log; do rm "$f"; done',
    'for d in a b; do rm -rf "$d"; done',
    'for f in src/*.js; do wc -l "$f"; done',
    'echo "rm -rf ~" > tmp/note.txt',
  ]);
});

test('find asks only when what it would delete holds work', () => {
  expect(world('guard-find'), [
    'find ~ -name "*.txt" -delete',
    'find . -name "*.md" -delete',
    'find src -name "*.js" -exec rm {} +',
    'find . -delete',
  ], [
    'find . -name "*.log" -delete',
    'find dist -type f -delete',
    'find . -name "*.js" -print',
    'find src -name "*.js" -exec wc -l {} +',
  ]);
});

test('find judges what it matches, even when it starts at a whole repository', () => {
  const w = world('guard-find-repo');
  const lib = path.join(w.dir, 'vendor', 'lib');
  fs.mkdirSync(lib, { recursive: true });
  fs.writeFileSync(path.join(lib, 'a.log'), 'x\n');
  fs.writeFileSync(path.join(lib, 'b.md'), 'x\n');
  spawnSync('git', ['-C', lib, 'init', '-q']);
  spawnSync('git', ['-C', lib, '-c', 'user.email=t@t', '-c', 'user.name=t', 'add', 'a.log']);
  spawnSync('git', ['-C', lib, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'a']);
  expect(w, ['find vendor/lib -name "*.md" -delete', 'rm -rf vendor/lib'], ['find vendor/lib -name "*.log" -delete']);
});

