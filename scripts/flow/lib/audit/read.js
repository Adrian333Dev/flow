'use strict';
/**
 * Reading the conversation back, one bounded turn range at a time.
 *
 * This is the expensive tool of the three, and it is bounded on purpose.
 * The largest session on this machine is roughly 15 million tokens, and one
 * segment of it averages a megabyte — still past any context window. So
 * nothing here takes a session: it takes a turn range, and the index supplies
 * the line numbers that make reading that range cost what the range costs
 * rather than what the file costs.
 *
 * Three depths, because the question decides how much is worth loading:
 *
 *   default    the conversation, with one line per tool call
 *   --full     tool results as well, truncated per call
 *   --thinking the reasoning too
 */

const fs = require('fs');
const { FlowError } = require('../error');
const { findSession, bytes, trim, short } = require('./query');

const RESULT_CHARS = 1200;
const HARD_CAP = 400_000;

/** `412-460`, `412`, or `412-` to the end. */
function parseRange(text, last) {
  if (!text) throw new FlowError('--turns needs a range, like 412-460 or 412.');
  const m = /^(\d+)(?:\s*-\s*(\d*))?$/.exec(String(text).trim());
  if (!m) throw new FlowError(`"${text}" is not a turn range. Use 412, 412-460 or 412-.`);
  const from = Number(m[1]);
  if (m[2] === undefined) return { from, to: from };
  return { from, to: m[2] === '' ? last : Number(m[2]) };
}

/** The exact bytes of a line range, taken straight out of the transcript. */
function slice(db, sessionId, firstLine, lastLine) {
  const spans = db.prepare(`SELECT transcript, MIN(offset) start, MAX(offset + bytes) end,
    MIN(line) first_line FROM event
    WHERE session_id = ? AND line BETWEEN ? AND ? GROUP BY transcript ORDER BY first_line`)
    .all(sessionId, firstLine, lastLine);

  const lines = [];
  for (const span of spans) {
    let fd;
    try {
      fd = fs.openSync(span.transcript, 'r');
    } catch {
      throw new FlowError(
        `${span.transcript} is gone.\n` +
        '  Claude Code sweeps transcripts on cleanupPeriodDays. The index outlives them;\n' +
        '  the conversation does not.'
      );
    }
    try {
      const buffer = Buffer.allocUnsafe(span.end - span.start);
      fs.readSync(fd, buffer, 0, buffer.length, span.start);
      for (const text of buffer.toString('utf8').split('\n')) {
        if (text.trim()) lines.push(text);
      }
    } finally {
      fs.closeSync(fd);
    }
  }
  return lines;
}

const wrap = (label, body) => `${label}\n${String(body).replace(/^/gm, '  ')}`;

/**
 * Turns raw transcript lines into something a person or an agent reads. What
 * is dropped is as deliberate as what is kept: the token reminders, the mode
 * flips and the title guesses are Claude Code's bookkeeping, and none of them
 * is anything anybody is auditing.
 */
function renderLines(raw, { full = false, thinking = false, results = new Map() } = {}) {
  const out = [];
  let size = 0;
  const push = (text) => {
    if (size > HARD_CAP) return;
    out.push(text);
    size += text.length;
  };

  for (const line of raw) {
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    const at = e.timestamp ? String(e.timestamp).slice(11, 19) : '';

    if (e.type === 'system' && e.subtype === 'compact_boundary') {
      const meta = e.compactMetadata || {};
      push(`\n═══ COMPACTED (${meta.trigger || 'unknown'}) ${meta.preTokens || '?'} → ${meta.postTokens || '?'} tokens ═══\n`);
      continue;
    }

    if (e.type === 'user') {
      const content = e.message && e.message.content;
      if (typeof content === 'string') {
        push(wrap(`\n── user ${at} ${e.isCompactSummary ? '(compaction summary)' : ''}`, content));
        continue;
      }
      if (!Array.isArray(content)) continue;
      for (const b of content) {
        if (b.type === 'text') push(wrap(`\n── user ${at}`, b.text));
        if (b.type === 'tool_result') {
          const name = results.get(b.tool_use_id) || 'tool';
          const body = typeof b.content === 'string' ? b.content
            : Array.isArray(b.content) ? b.content.map((c) => c.text || `[${c.type}]`).join('\n') : '';
          const head = `   ← ${name} ${b.is_error ? 'ERROR' : 'ok'} ${bytes(Buffer.byteLength(body || ''))}`;
          push(full ? wrap(head, body.slice(0, RESULT_CHARS) + (body.length > RESULT_CHARS ? '\n…' : ''))
            : head + (b.is_error ? ': ' + trim(body, 200) : ''));
        }
      }
      continue;
    }

    if (e.type === 'assistant') {
      for (const b of (e.message && e.message.content) || []) {
        if (b.type === 'text' && b.text) push(wrap(`\n── assistant ${at}`, b.text));
        if (b.type === 'thinking' && thinking && b.thinking) push(wrap(`\n── thinking ${at}`, b.thinking));
        if (b.type === 'tool_use') {
          results.set(b.id, b.name);
          const input = JSON.stringify(b.input || {});
          push(`   → ${b.name} ${trim(input, full ? 600 : 160)}`);
        }
      }
      continue;
    }

    if (e.type === 'attachment' && e.attachment) {
      const a = e.attachment;
      const file = a.path || a.displayPath || a.filename;
      if (file) push(`   + ${a.type}: ${file}`);
    }
  }

  if (size > HARD_CAP) {
    out.push(`\n… stopped at ${bytes(HARD_CAP)}. Narrow the range, or drop --full.`);
  }
  return out.join('\n');
}

/**
 * One turn range of one session, rendered. The turn numbers come off `flow
 * audit turns`; the line numbers behind them never have to be typed.
 */
function read(db, id, { range, full = false, thinking = false } = {}) {
  const s = findSession(db, id);
  const last = db.prepare('SELECT MAX(ordinal) n FROM turn WHERE session_id = ?').get(s.id).n || 0;
  const { from, to } = parseRange(range, last);

  const rows = db.prepare(`SELECT ordinal, first_line, last_line FROM turn
    WHERE session_id = ? AND ordinal BETWEEN ? AND ? ORDER BY ordinal`).all(s.id, from, to);

  if (!rows.length) {
    throw new FlowError(
      `${short(s.id)} has no turns ${from}-${to}. It has ${last}.\n` +
      `  flow audit turns ${short(s.id)} lists them.`
    );
  }

  const firstLine = rows[0].first_line;
  const lastLine = rows.at(-1).last_line;
  const body = renderLines(slice(db, s.id, firstLine, lastLine), { full, thinking });

  return [
    `${short(s.id)} turns ${rows[0].ordinal}-${rows.at(-1).ordinal} · transcript lines ${firstLine}-${lastLine}`,
    body,
  ].join('\n');
}

module.exports = { read, parseRange, slice, renderLines };
