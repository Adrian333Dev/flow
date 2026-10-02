#!/usr/bin/env node
'use strict';
/**
 * context-check.js: the PostToolBatch and UserPromptSubmit hook.
 *
 * Tells the agent to wrap up once the conversation passes a size: reach a
 * checkpoint, run /flow:handoff, report in full, and stop. Answers get worse
 * long before the window fills, and Claude Code's own summary arrives near the
 * top of a 1M window, so the limit follows the work, never the window.
 *
 * No hook input carries the size. The session file does: every assistant
 * message in it records its token count under `usage`. The file can pass
 * 100 MB, so it is read from the end, a growing piece at a time.
 *
 * It speaks when the size crosses a mark: the limit, then every 20k past it.
 * A crossing is read off the last 2 assistant messages, so no state is kept.
 * The 2 events between them see every message once: one that calls tools is
 * followed by PostToolBatch, which fires once per batch where PostToolUse
 * fires per tool, and one that ends a turn is followed by the next
 * UserPromptSubmit.
 *
 * `"wrapUpAt"` in ~/.flow/settings.json sets the limit, 150,000 by default.
 * `"wrapUp": false` silences it. A subagent's tool calls fire this hook too,
 * carrying the parent's session file, so they are skipped. Nothing here exits
 * non-zero: exit 2 on UserPromptSubmit erases what the user typed.
 */

const fs = require('fs');
const settings = require('../lib/settings');
const hook = require('../lib/hook');

const LIMIT = 150000;
const STEP = 20000;
const CHUNK = 1 << 20;

/** Every token the model read for one message: fresh, cached, and written to the cache. */
const size = (u) => (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);

/**
 * The sizes of the last 2 main-conversation assistant messages, oldest first.
 *
 * One message spans several lines, one per block, all with the same id and
 * the same `usage`, so lines are counted by id. The first line of a piece may
 * be cut in half and is dropped, unless the piece is the whole file.
 */
function lastSizes(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const total = fs.fstatSync(fd).size;
    for (let length = CHUNK; ; length *= 2) {
      const start = Math.max(0, total - length);
      const buffer = Buffer.alloc(total - start);
      fs.readSync(fd, buffer, 0, buffer.length, start);
      const lines = buffer.toString('utf8').split('\n');
      if (start > 0) lines.shift();

      const found = [];
      for (let i = lines.length - 1; i >= 0 && found.length < 2; i--) {
        let entry;
        try { entry = JSON.parse(lines[i]); } catch { continue; }
        const message = entry.message;
        if (entry.isSidechain || message?.role !== 'assistant' || !message.usage) continue;
        if (found.some((f) => f.id === message.id)) continue;
        found.push({ id: message.id, size: size(message.usage) });
      }
      if (found.length === 2 || start === 0) return found.map((f) => f.size).reverse();
    }
  } finally {
    fs.closeSync(fd);
  }
}

/** The line to send, or null. `before` is 0 for the session's first message. */
function line(before, now, limit) {
  if (now < limit) return null;
  const mark = limit + Math.floor((now - limit) / STEP) * STEP;
  if (before >= mark) return null;
  const k = `${Math.round(now / 1000)}k`;
  if (before < limit) {
    return `The context is at ${k}. At the next checkpoint, run /flow:handoff, report in full, and stop.`;
  }
  return `The context is at ${k}, past the ${Math.round(limit / 1000)}k limit. Stop at the step you are on: finish it, run /flow:handoff, report, and stop.`;
}

function main() {
  if (!settings.prints('wrapUp')) return;
  const input = hook.event();
  if (!input || input.agent_id || !input.transcript_path) return;

  const set = Number(settings.readGlobal().wrapUpAt);
  const limit = set > 0 ? set : LIMIT;
  const sizes = lastSizes(input.transcript_path);
  if (!sizes.length) return;
  const now = sizes[sizes.length - 1];
  const before = sizes.length === 2 ? sizes[0] : 0;

  const text = line(before, now, limit);
  if (!text) return;
  hook.answer(input.hook_event_name, { additionalContext: text });
}

try {
  main();
} catch {
  // A size nobody can read is a warning nobody gets. Never a failure.
}
