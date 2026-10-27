/**
 * overlays.ts, the hook that hands a skill the user's overlay, typed or
 * loaded by the agent, Flow's or anybody's.
 *
 * Its silences matter as much as its output. A skill loads on machines with no
 * overlay folder and in folders that are no project, and neither may put an
 * error into the session.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import os from 'node:os';
import { project, write, run } from '../shared/testing.ts';

// The hook reads the Flow home, so each test builds one and names it outright.
// It runs from the system's temp folder, a place that is no project.
const hook = (home, call) =>
  run('hooks/overlays.ts', [], {
    cwd: os.tmpdir(),
    env: { ...process.env, FLOW_HOME: home },
    input: JSON.stringify({ cwd: os.tmpdir(), session_id: 's1', ...call }),
  });

const typed = (name) => ({ hook_event_name: 'UserPromptExpansion', command_name: name, command_args: '' });
const loaded = (name) => ({ hook_event_name: 'PostToolUse', tool_name: 'Skill', tool_input: { skill: name } });

const context = (ran) => {
  assert.strictEqual(ran.code, 0, ran.stderr);
  return ran.stdout ? JSON.parse(ran.stdout).hookSpecificOutput : null;
};

test('a typed skill and a loaded one both get the overlay, prefix or none, in any folder', () => {
  const home = project('overlay-hook');
  write(home, 'skill-overlays/execute.md', 'Skip phase 3 here.\n');
  write(home, 'skill-overlays/postgres.md', 'Every table uses RLS.\n');

  const first = context(hook(home, typed('flow:execute')));
  assert.strictEqual(first.hookEventName, 'UserPromptExpansion');
  assert.strictEqual(
    first.additionalContext,
    '# Overlay\n\nSkip phase 3 here.',
  );

  const second = context(hook(home, loaded('supabase:postgres')));
  assert.strictEqual(second.hookEventName, 'PostToolUse');
  assert.match(second.additionalContext, /^# Overlay\n\n[\s\S]*Every table uses RLS/);

  // A standalone outside skill carries no prefix at all.
  write(home, 'skill-overlays/nestjs-expert.md', 'Modules live under src/modules.\n');
  assert.match(context(hook(home, loaded('nestjs-expert'))).additionalContext, /src\/modules/);
});

test('no overlay file, an empty one, or a name shaped like a path prints nothing', () => {
  const home = project('overlay-hook-silent');
  write(home, 'skill-overlays/debug.md', '  \n');
  assert.strictEqual(context(hook(home, typed('flow:groundwork'))), null);
  assert.strictEqual(context(hook(home, typed('flow:debug'))), null);
  assert.strictEqual(context(hook(home, loaded('../../etc/passwd'))), null);
  assert.strictEqual(context(hook(home, { hook_event_name: 'PostToolUse', tool_name: 'Skill' })), null);
});

test('a project overlay is never read, and input it cannot read prints nothing and exits 0', () => {
  const home = project('overlay-hook-project');
  write(home, '.flow/overlays/execute.md', 'never read\n');
  assert.strictEqual(context(hook(home, typed('flow:execute'))), null);

  const garbage = run('hooks/overlays.ts', [], { cwd: os.tmpdir(), env: { ...process.env, FLOW_HOME: home }, input: 'not json' });
  assert.deepStrictEqual([garbage.code, garbage.stdout, garbage.stderr], [0, '', '']);
});
