'use strict';
/**
 * `context-check`: the hook that tells the agent to wrap up once the
 * conversation passes a size, read off the session file.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { SCRATCH, run } = require('./helpers/scratch');

/** A ~/.flow holding whatever settings it is given. */
function flowHome(name, settings) {
  const dir = path.join(SCRATCH, name, 'flow-home');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (settings) fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings));
  return dir;
}

/**
 * A session file whose assistant messages read the given sizes, each split
 * over 2 lines the way Claude Code writes a message with 2 blocks, with a
 * user line and a subagent's message between them.
 */
function sessionFile(home, sizes) {
  const lines = [];
  sizes.forEach((n, i) => {
    const usage = { input_tokens: 1, cache_read_input_tokens: n - 101, cache_creation_input_tokens: 100 };
    const message = (type) => ({ role: 'assistant', id: `msg_${i}`, usage, content: [{ type }] });
    lines.push({ type: 'user', message: { role: 'user', content: 'go' } });
    lines.push({ type: 'assistant', message: message('thinking') });
    lines.push({ type: 'assistant', message: message('tool_use') });
    lines.push({ type: 'assistant', isSidechain: true, message: { role: 'assistant', id: `sub_${i}`, usage: { input_tokens: 999999 } } });
  });
  const file = path.join(home, 'session.jsonl');
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return file;
}

function check(home, sizes, extra = {}) {
  const input = JSON.stringify({ transcript_path: sessionFile(home, sizes), hook_event_name: 'PostToolBatch', ...extra });
  const result = run('context-check.js', [], { input, env: { ...process.env, FLOW_HOME: home } });
  assert.strictEqual(result.code, 0);
  return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput : null;
}

test('crossing the limit asks for a handoff at the next checkpoint, once', () => {
  const home = flowHome('context-limit', null);
  assert.strictEqual(check(home, [140000, 149000]), null, 'under 150k by default');

  const said = check(home, [149000, 152300]);
  assert.strictEqual(said.hookEventName, 'PostToolBatch');
  assert.strictEqual(said.additionalContext,
    'The context is at 152k. At the next checkpoint, run /flow:handoff, report in full, and stop.');

  assert.strictEqual(check(home, [152300, 160000]), null, 'said once, never on every message past it');
  assert.ok(check(home, [155000]), 'a session file with one message counts from 0');
});

test('every 20k past the limit it says so again, firmer', () => {
  const home = flowHome('context-again', null);
  const said = check(home, [168000, 171000], { hook_event_name: 'UserPromptSubmit' });
  assert.strictEqual(said.hookEventName, 'UserPromptSubmit');
  assert.strictEqual(said.additionalContext,
    'The context is at 171k, past the 150k limit. Stop at the step you are on: finish it, run /flow:handoff, report, and stop.');

  assert.strictEqual(check(home, [171000, 189000]), null);
  assert.ok(check(home, [189000, 191000]));
  assert.ok(check(home, [140000, 215000]), 'a jump over several marks still says it once');
});

test('"wrapUpAt" moves the limit, and "wrapUp": false silences it', () => {
  assert.match(check(flowHome('context-at', { wrapUpAt: 100000 }), [99000, 101000]).additionalContext, /at 101k\. At the next/);
  assert.strictEqual(check(flowHome('context-off', { wrapUp: false }), [149000, 152000]), null);
});

test('a subagent, a missing file and bad input stay silent and exit 0', () => {
  const home = flowHome('context-quiet', null);
  assert.strictEqual(check(home, [149000, 152000], { agent_id: 'agent-1' }), null);
  assert.strictEqual(check(home, [149000, 152000], { transcript_path: path.join(home, 'none.jsonl') }), null);

  const bad = run('context-check.js', [], { input: 'not json', env: { ...process.env, FLOW_HOME: home } });
  assert.deepStrictEqual([bad.code, bad.stdout], [0, '']);
});

test('a session file larger than one read is read from the end', () => {
  const home = flowHome('context-large', null);
  const file = sessionFile(home, [149000, 152000]);
  const padding = JSON.stringify({ type: 'user', message: { role: 'user', content: 'x'.repeat(3 << 20) } });
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^/, `${padding}\n`));
  const tail = JSON.stringify({ type: 'user', message: { role: 'user', content: 'y'.repeat(2 << 20) } });
  fs.appendFileSync(file, `${tail}\n`);

  const input = JSON.stringify({ transcript_path: file, hook_event_name: 'PostToolBatch' });
  const result = run('context-check.js', [], { input, env: { ...process.env, FLOW_HOME: home } });
  assert.match(result.stdout, /at 152k/, 'the 2 messages sit behind a 2 MB line, past the first 1 MB read');
});
