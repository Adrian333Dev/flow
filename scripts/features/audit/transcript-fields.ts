/** What the index keeps of one transcript line: its text, the prompt, the source of a turn, a file's name, a call's summary. */

import os from 'node:os';
import path from 'node:path';

const text = (v) => (typeof v === 'string' ? v : v == null ? null : JSON.stringify(v));

// A Write call carries the whole file in its input, so storing every input
// whole copies the repository into the index. The full text is one line range
// away in the transcript; what the index is for is finding which call to open.
const INPUT_CHARS = 4000;
const capped = (s) => (s && s.length > INPUT_CHARS ? s.slice(0, INPUT_CHARS) + ' …' : s);

/**
 * The whole text a turn opened with, whatever shape the message took. Kept
 * whole so a query can read what the user wrote: every listing trims it on
 * print, and a prompt is small beside the tool calls stored with it.
 */
function promptText(message) {
  if (!message) return null;
  const content = message.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;
  const parts : any[] = [];
  for (const block of content) {
    if (block && block.type === 'text' && block.text) parts.push(block.text);
  }
  return parts.length ? parts.join('\n') : null;
}

/**
 * Where a turn came from. Claude Code writes `promptSource` for a typed or
 * queued prompt and nothing at all for a slash command, so the command is read
 * out of the text it inserted.
 */
function turnSource(e, opening) {
  if (e.isCompactSummary) return 'compact';
  if (e.promptSource) return e.promptSource;
  if (opening && opening.includes('<command-name>')) return 'command';
  if (e.isMeta) return 'meta';
  return null;
}

/**
 * One name per file, so the same file read twice counts twice.
 *
 * `Read` reports an absolute path and `cat backlog.md` reports a relative one,
 * and left alone the index holds `backlog.md` and
 * `/home/me/code/flow/backlog.md` as two different files. Every event carries
 * the directory it ran in, which is what resolves the second into the first.
 */
function absolute(file, cwd) {
  if (!file) return file;
  if (path.isAbsolute(file)) return path.normalize(file);
  if (file.startsWith('~/')) return path.join(os.homedir(), file.slice(2));
  return cwd ? path.resolve(cwd, file) : file;
}

/** A one-line handle for a tool call, so a listing reads without opening the input. */
function summarise(name, input) {
  if (!input || typeof input !== 'object') return null;
  const first =
    input.command || input.file_path || input.notebook_path || input.pattern ||
    input.query || input.url || input.path || input.prompt || input.skill;
  return typeof first === 'string' ? first.replace(/\s+/g, ' ').slice(0, 200) : null;
}

function resultBytes(result) {
  if (result == null) return null;
  if (typeof result === 'string') return Buffer.byteLength(result);
  try {
    return Buffer.byteLength(JSON.stringify(result));
  } catch {
    return null;
  }
}

/** The user line that carries a tool result names the call it answers. */
function toolResultBlocks(message) {
  const content = message && message.content;
  if (!Array.isArray(content)) return [];
  return content.filter((b) => b && b.type === 'tool_result');
}

export { text, capped, promptText, turnSource, absolute, summarise, resultBytes, toolResultBlocks };
