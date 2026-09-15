'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { project, write } = require('./helpers/scratch');

const SCRIPT = path.resolve(__dirname, '..', 'changes.js');

/** A git repository with one committed file, and a Flow home of its own. */
function repo(name) {
  const dir = project(name);
  const root = path.join(dir, 'repo');
  const home = path.join(dir, 'flow-home');
  fs.mkdirSync(root, { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  write(root, 'keep.txt', 'one\ntwo\n');
  write(root, 'old.txt', 'a line nobody needs to read again\n'.repeat(50));
  spawnSync('git', ['add', '-A'], { cwd: root });
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'start'], { cwd: root });
  return { root, home };
}

/** One hook call, as Claude Code makes it. */
function hook(ctx, event, fields = {}, args = []) {
  const input = JSON.stringify({ session_id: 's1', cwd: ctx.root, hook_event_name: event, ...fields });
  return spawnSync('node', [SCRIPT, ...args], { input, encoding: 'utf8', env: { ...process.env, FLOW_HOME: ctx.home } });
}

/**
 * The waiter, started in the background like the async hook. It resolves once
 * the waiter is polling, since in Claude Code it starts at launch, well before
 * the worker can finish. `done` resolves when it exits.
 */
async function waiter(ctx, agentId) {
  const child = spawn('node', [SCRIPT, '--wait'], { env: { ...process.env, FLOW_HOME: ctx.home } });
  child.stdin.end(JSON.stringify({
    session_id: 's1', cwd: ctx.root, hook_event_name: 'PostToolUse', tool_name: 'Agent',
    tool_input: { prompt: 'x' }, tool_response: { status: 'async_launched', agentId },
  }));
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d; });
  const done = new Promise((resolve) => child.on('close', (code) => resolve({ code, stderr })));
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { done };
}

/** An Edit or Write, with the file change happening between its 2 hooks. */
function edit(ctx, agent, id, file, content) {
  const fields = { tool_name: 'Write', tool_use_id: id, tool_input: { file_path: path.join(ctx.root, file) }, ...(agent && { agent_id: agent }) };
  hook(ctx, 'PreToolUse', fields);
  write(ctx.root, file, content);
  hook(ctx, 'PostToolUse', fields);
}

function command(ctx, agent, id, text, run) {
  const fields = { tool_name: 'Bash', tool_use_id: id, tool_input: { command: text }, ...(agent && { agent_id: agent }) };
  hook(ctx, 'PreToolUse', fields);
  run();
  hook(ctx, 'PostToolUse', fields);
}

const start = (ctx, agent) => hook(ctx, 'SubagentStart', { agent_id: agent, agent_type: 'general-purpose' });
const stop = (ctx, agent) => hook(ctx, 'SubagentStop', { agent_id: agent, agent_type: 'general-purpose' });

test('a worker hands the parent its diff and the command that deleted a file', async () => {
  const ctx = repo('changes-one-worker');
  start(ctx, 'w1');
  const waiting = await waiter(ctx, 'w1');
  edit(ctx, 'w1', 'c1', 'keep.txt', 'one\nTWO\n');
  command(ctx, 'w1', 'c2', 'rm old.txt', () => fs.rmSync(path.join(ctx.root, 'old.txt')));
  stop(ctx, 'w1');

  const { code, stderr } = await waiting.done;
  assert.strictEqual(code, 2, 'exit code 2 is what wakes the parent');
  assert.match(stderr, /change record for subagent w1/);
  assert.match(stderr, /2 files changed/);
  assert.match(stderr, /-two\n\+TWO/);
  assert.match(stderr, /- `rm old\.txt`: old\.txt \(deleted\)/);
  assert.match(stderr, /deleted file mode/);
  assert.doesNotMatch(stderr, /nobody needs to read/, 'a deleted file shows its header, never its content');
});

test('2 workers at once each get only their own file, and the parent\'s edit goes to neither', async () => {
  const ctx = repo('changes-parallel');
  start(ctx, 'w1');
  start(ctx, 'w2');
  const first = await waiter(ctx, 'w1');
  const second = await waiter(ctx, 'w2');
  edit(ctx, 'w1', 'c1', 'a.txt', 'from w1\n');
  edit(ctx, 'w2', 'c2', 'b.txt', 'from w2\n');
  edit(ctx, null, 'c3', 'parent.txt', 'from the parent\n');
  command(ctx, 'w2', 'c4', 'echo more >> b.txt', () => fs.appendFileSync(path.join(ctx.root, 'b.txt'), 'more\n'));
  stop(ctx, 'w1');
  stop(ctx, 'w2');

  const one = await first.done;
  const two = await second.done;
  assert.match(one.stderr, /a\.txt/);
  assert.doesNotMatch(one.stderr, /b\.txt|parent\.txt/);
  assert.match(two.stderr, /\+from w2\n\+more/, 'one diff from before the first change to after the last');
  assert.doesNotMatch(two.stderr, /a\.txt|parent\.txt/);
});

test('a change no hooked call explains comes back marked as unexplained', async () => {
  const ctx = repo('changes-unexplained');
  start(ctx, 'w1');
  const waiting = await waiter(ctx, 'w1');
  write(ctx.root, 'stray.txt', 'written by something no hook saw\n');
  stop(ctx, 'w1');

  const { code, stderr } = await waiting.done;
  assert.strictEqual(code, 2);
  assert.match(stderr, /by no tool call a hook saw/);
  assert.match(stderr, /stray\.txt/);
});

test('a worker that changed nothing wakes nobody', async () => {
  const ctx = repo('changes-nothing');
  start(ctx, 'w1');
  const waiting = await waiter(ctx, 'w1');
  stop(ctx, 'w1');

  const { code, stderr } = await waiting.done;
  assert.strictEqual(code, 0);
  assert.strictEqual(stderr, '');
});

test('a record too long for one hook message shrinks to line counts and names the patch file', async () => {
  const ctx = repo('changes-large');
  start(ctx, 'w1');
  const waiting = await waiter(ctx, 'w1');
  edit(ctx, 'w1', 'c1', 'big.txt', 'a long generated line of text\n'.repeat(2000));
  edit(ctx, 'w1', 'c2', 'small.txt', 'short\n');
  stop(ctx, 'w1');

  const { stderr } = await waiting.done;
  assert.ok(stderr.length < 10000, `${stderr.length} characters`);
  assert.match(stderr, /big\.txt: \+2000 -0, diff left out for length/);
  assert.match(stderr, /\+short/, 'the small diff still shows');
  const patch = stderr.match(/The whole diff is in (\S+)\.\n/)[1];
  assert.match(fs.readFileSync(patch, 'utf8'), /a long generated line/);
});

test('a record nobody waited for reaches the parent on its next call', () => {
  const ctx = repo('changes-pickup');
  start(ctx, 'w1');
  edit(ctx, 'w1', 'c1', 'a.txt', 'resumed by the user typing to it\n');
  stop(ctx, 'w1');

  const outbox = path.join(ctx.home, 'changes', 's1', 'outbox', 'w1.txt');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(outbox, old, old);

  const call = hook(ctx, 'PreToolUse', { tool_name: 'Bash', tool_use_id: 'p1', tool_input: { command: 'ls' } });
  const context = JSON.parse(call.stdout).hookSpecificOutput.additionalContext;
  assert.match(context, /change record for subagent w1/);
  assert.ok(!fs.existsSync(outbox), 'handed over once');
});

test('outside a git repository every event is silent', () => {
  const dir = project('changes-no-repo');
  const ctx = { root: dir, home: path.join(dir, 'flow-home') };
  for (const event of ['SubagentStart', 'PreToolUse', 'PostToolUse']) {
    const r = hook(ctx, event, { agent_id: 'w1', tool_name: 'Write', tool_use_id: 'c1', tool_input: { file_path: path.join(dir, 'x') } });
    assert.strictEqual(r.status, 0);
    assert.strictEqual(r.stdout + r.stderr, '');
  }
});
