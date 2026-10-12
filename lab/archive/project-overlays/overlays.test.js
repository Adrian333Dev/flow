'use strict';
/**
 * overlays.js, the hook that hands a skill its project overlay, typed or
 * loaded by the agent, Flow's or anybody's.
 *
 * Its silences matter as much as its output. A skill loads in projects that
 * carry no overlay and in folders that are not projects at all, and neither may
 * put an error into the session.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { project, write, run, REPO } = require('./helpers/scratch');

const hook = (dir, call, env = {}) =>
  run('hooks/overlays.js', [], {
    cwd: dir,
    env: { ...process.env, FLOW_PROJECT: dir, ...env },
    input: JSON.stringify({ cwd: dir, session_id: 's1', ...call }),
  });

const typed = (name) => ({ hook_event_name: 'UserPromptExpansion', command_name: name, command_args: '' });
const loaded = (name) => ({ hook_event_name: 'PostToolUse', tool_name: 'Skill', tool_input: { skill: name } });

const context = (ran) => {
  assert.strictEqual(ran.code, 0, ran.stderr);
  return ran.stdout ? JSON.parse(ran.stdout).hookSpecificOutput : null;
};

test('a typed skill and a loaded one both get the overlay, prefix or none', () => {
  const dir = project('overlay-hook');
  write(dir, '.flow/overlays/execute.md', 'Skip phase 3 here.\n');
  write(dir, '.flow/overlays/postgres.md', 'This project uses RLS on every table.\n');

  const first = context(hook(dir, typed('flow:execute')));
  assert.strictEqual(first.hookEventName, 'UserPromptExpansion');
  assert.strictEqual(
    first.additionalContext,
    '# Overlay\n\nSkip phase 3 here.',
  );

  const second = context(hook(dir, loaded('supabase:postgres')));
  assert.strictEqual(second.hookEventName, 'PostToolUse');
  assert.match(second.additionalContext, /^# Overlay\n\n[\s\S]*RLS on every table/);

  // A standalone outside skill carries no prefix at all.
  write(dir, '.flow/overlays/nestjs-expert.md', 'Modules live under src/modules.\n');
  assert.match(context(hook(dir, loaded('nestjs-expert'))).additionalContext, /src\/modules/);
});

test('no overlay file, an empty one, or a name shaped like a path prints nothing', () => {
  const dir = project('overlay-hook-silent');
  write(dir, '.flow/overlays/debug.md', '  \n');
  assert.strictEqual(context(hook(dir, typed('flow:groundwork'))), null);
  assert.strictEqual(context(hook(dir, typed('flow:debug'))), null);
  assert.strictEqual(context(hook(dir, loaded('../../etc/passwd'))), null);
  assert.strictEqual(context(hook(dir, { hook_event_name: 'PostToolUse', tool_name: 'Skill' })), null);
});

test('outside a project, or on input it cannot read, it prints nothing and exits 0', () => {
  const dir = project('overlay-hook-no-repo');
  write(dir, '.flow/overlays/execute.md', 'never read\n');
  // The scratch folder sits inside the Flow repo, so git would find that one.
  // A ceiling stops the search below it.
  const loose = hook(dir, typed('flow:execute'), { FLOW_PROJECT: '', GIT_CEILING_DIRECTORIES: path.join(REPO, 'tmp') });
  assert.deepStrictEqual([loose.code, loose.stdout, loose.stderr], [0, '', '']);

  const garbage = run('hooks/overlays.js', [], { cwd: dir, input: 'not json' });
  assert.deepStrictEqual([garbage.code, garbage.stdout, garbage.stderr], [0, '', '']);
});
