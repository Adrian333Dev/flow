/**
 * The world `guard` is tested in: a project and a home folder of its own, and
 * the guard's answer to a command or a file.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { project, run } from '../../shared/testing.ts';

/**
 * A project and a home folder of its own. The project is a git repository:
 * `src/clean.js` committed, `src/changed.js` committed then edited,
 * `notes.md` new, `dist/`, `tmp/` and `.env` ignored, and prettier installed.
 */
function world(name) {
  const base = project(name);
  const home = path.join(base, 'home');
  const dir = path.join(base, 'app');
  const write = (file, content = 'x\n') => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}\n');
  fs.writeFileSync(path.join(home, '.bashrc'), '');
  fs.writeFileSync(path.join(home, 'notes.txt'), 'mine\n');

  write('.gitignore', 'dist/\ntmp/\nnode_modules/\n.env\n');
  write('src/clean.js');
  write('src/changed.js');
  write('package.json', '{ "devDependencies": { "prisma": "5.0.0" } }\n');
  const git = (...args) => spawnSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { encoding: 'utf8' });
  git('init', '-q');
  git('add', '.');
  git('commit', '-q', '-m', 'start');
  write('src/changed.js', 'edited\n');
  write('notes.md');
  write('dist/out.js');
  write('tmp/scratch.txt');
  write('.env', 'SECRET=1\n');
  write('logs/old.log');
  git('add', 'logs');
  git('commit', '-q', '-m', 'logs');
  write('node_modules/.bin/prettier');
  return { dir, home };
}

/** The guard's answer, parsed, or null when it stays silent. */
function answer(command, { dir, home }, cwd = dir) {
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd });
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: home, CLAUDE_PROJECT_DIR: dir };
  delete env.VIRTUAL_ENV;
  delete env.CONDA_PREFIX;
  const result = run('hooks/guard.ts', [], { input, env });
  return result.stdout.trim() ? JSON.parse(result.stdout).hookSpecificOutput : null;
}

/** The guard's answer to an Edit or Write of `file`, parsed, or null when it stays silent. */
function fileAnswer(tool, file, { dir, home }) {
  const input = JSON.stringify({ tool_name: tool, tool_input: { file_path: file }, cwd: dir });
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: home, CLAUDE_PROJECT_DIR: dir };
  const result = run('hooks/guard.ts', [], { input, env });
  return result.stdout.trim() ? JSON.parse(result.stdout).hookSpecificOutput : null;
}

/** The verdict, as one word. `silent` is the hook declining to decide. */
const verdict = (command, w) => answer(command, w)?.permissionDecision ?? 'silent';

function expect(w, asks, silent) {
  for (const command of asks) assert.strictEqual(verdict(command, w), 'ask', command);
  for (const command of silent) assert.strictEqual(verdict(command, w), 'silent', command);
}

export { world, answer, fileAnswer, verdict, expect };
