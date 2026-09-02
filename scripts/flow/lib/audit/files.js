'use strict';
/**
 * Which file entered context, and how sure we are.
 *
 * No single extractor covers every route. The Read tool reports the path and
 * the exact line range it delivered; `cat` and `sed -n` report nothing and
 * have to be read out of the command; `util fs merge` names every file in its
 * own output; an attachment arrives with no tool call at all. On the largest
 * session on this machine the Read tool was 7% of tool calls, so an extractor
 * set built on Read alone measures a corner and calls it the room.
 *
 * Every row therefore carries a confidence:
 *
 *   exact     the tool itself reported the path — Read, Edit, Write
 *   parsed    a command line or an output stream was read for it
 *   declared  Claude Code named it in an attachment
 *
 * A query that demands exact gets only what cannot be wrong. A query that
 * takes all three gets the fuller picture and knows what it is trusting.
 *
 * What stays invisible, and no extractor can fix: a script that opens files
 * internally. `node build.js` reads a hundred files and the transcript records
 * one command.
 */

const path = require('path');

// A read the shell performed. `grep` and `util fs tree` are absent on purpose:
// grep returns matching lines rather than a file, and a tree is a listing.
const READERS = new Set(['cat', 'head', 'tail', 'less', 'more', 'bat']);

const IGNORED_PREFIX = /^(sudo|command|time|env)$/;

/**
 * A word that is a path rather than a flag, a number, or an English word.
 *
 * The last of those is why this is strict. A shell command arrives as free
 * text, and a heredoc body full of prose parses as commands unless something
 * refuses it — the first pass over this machine recorded `the`, `a` and `and`
 * as files read 46 times. A path here has a slash, an extension, or a leading
 * dot, and a bare word is thrown away even when it is a real directory name.
 */
function looksLikePath(word) {
  if (!word || word.startsWith('-')) return false;
  if (/[<>*?$`(){}]/.test(word)) return false;          // a redirect, a glob, a substitution
  if (/^\d+$/.test(word)) return false;
  if (word.startsWith('/') || word.includes('/')) return true;
  if (/^\.[\w.-]+$/.test(word)) return true;             // .gitignore, .flow-include
  return /^[\w.\- ]+\.[A-Za-z0-9]{1,8}$/.test(word);     // anything with an extension
}

/**
 * Removes every heredoc body, keeping the line that opened it.
 *
 * A heredoc is how this workflow writes files from the shell, and its body is
 * prose, markdown or code — not commands. Left in, a line reading "tail the
 * log" parses as a `tail` of a file named `the`. Nothing inside one is ever a
 * file read by the command that carries it.
 */
function stripHeredocs(command) {
  const lines = command.split('\n');
  const kept = [];
  let i = 0;
  while (i < lines.length) {
    kept.push(lines[i]);
    const opener = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/.exec(lines[i]);
    i += 1;
    if (!opener) continue;
    const end = opener[2];
    while (i < lines.length && lines[i].trim() !== end) i += 1;
    i += 1;                             // and the delimiter line itself
  }
  return kept.join('\n');
}

/**
 * Splits a shell command on the operators that start a new command, so
 * `cd x && cat y | head` yields three. Quoting is handled well enough to keep
 * a `&&` inside a string from splitting the line.
 */
function segments(command) {
  const out = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      current += c;
      if (c === quote && command[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; current += c; continue; }
    if (c === '|' || c === ';' || c === '&' || c === '\n') { out.push(current); current = ''; continue; }
    current += c;
  }
  out.push(current);
  return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * The line range `sed -n '40,120p'` asked for. Only the plain numeric form is
 * read; an address matching a pattern has no line number to record.
 */
function sedRange(words) {
  for (const word of words) {
    const m = /^'?(\d+),(\d+)p'?$/.exec(word);
    if (m) return { start: Number(m[1]), end: Number(m[2]) };
    const one = /^'?(\d+)p'?$/.exec(word);
    if (one) return { start: Number(one[1]), end: Number(one[1]) };
  }
  return {};
}

/** How many lines `head -n 40` or `head -40` took. */
function countFlag(words) {
  for (let i = 0; i < words.length; i++) {
    const m = /^-n?(\d+)$/.exec(words[i]);
    if (m) return Number(m[1]);
    if (words[i] === '-n' && /^\d+$/.test(words[i + 1] || '')) return Number(words[i + 1]);
  }
  return null;
}

/**
 * Splits one command into words, keeping a quoted run together and stripping
 * the quotes. Splitting on whitespace alone tore `sed -n '/^## Heading/p'`
 * into two words and recorded `/^##` as a file read 63 times.
 */
function words(segment) {
  const out = [];
  let current = '';
  let quote = null;
  let quoted = false;
  for (const c of segment) {
    if (quote) {
      if (c === quote) quote = null;
      else current += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; quoted = true; continue; }
    if (/\s/.test(c)) {
      if (current || quoted) out.push(current);
      current = '';
      quoted = false;
      continue;
    }
    current += c;
  }
  if (current || quoted) out.push(current);
  return out;
}

/**
 * The words a command was given, with every redirection dropped. `cat x >
 * out.md` reads one file and writes another, and the second is not a read.
 */
function args(list) {
  const kept = [];
  for (let i = 0; i < list.length; i++) {
    if (/[<>]/.test(list[i])) {
      if (/^\d*>>?$|^<$/.test(list[i])) i++;   // the target is a separate word
      continue;
    }
    kept.push(list[i]);
  }
  return kept;
}

/**
 * Reads a Bash command for the files it opened. Best effort throughout: the
 * point is to catch `cat file` and `sed -n '1,80p' file`, which together are
 * most of how this workflow actually reads a file.
 */
function fromCommand(command) {
  const found = [];
  if (!command) return found;

  for (const segment of segments(stripHeredocs(command))) {
    const all = words(segment);
    let head = 0;
    while (all[head] && IGNORED_PREFIX.test(all[head])) head++;
    const verb = path.basename(all[head] || '');
    const rest = args(all.slice(head + 1));

    if (READERS.has(verb)) {
      const lines = verb === 'head' || verb === 'tail' ? countFlag(rest) : null;
      for (const word of rest) {
        if (!looksLikePath(word)) continue;
        const range = verb === 'head' && lines ? { start: 1, end: lines } : {};
        found.push({ path: word, kind: 'read', via: `bash:${verb}`, confidence: 'parsed', ...range });
      }
      continue;
    }

    // sed's own grammar decides this: `sed [options] script file...`, so the
    // first word that is not a flag is the script, unless every script came
    // through -e. Reading the script as a filename is what produced `/^##`.
    if (verb === 'sed') {
      const range = sedRange(rest);
      const kind = rest.some((w) => w.startsWith('-i') || w.startsWith('--in-place')) ? 'edit' : 'read';
      const scripted = rest.includes('-e') || rest.includes('-f');
      let seenScript = scripted;
      for (let i = 0; i < rest.length; i++) {
        const word = rest[i];
        if (word.startsWith('-')) {
          if (word === '-e' || word === '-f') i++;   // -i takes an attached suffix, not a word
          continue;
        }
        if (!seenScript) { seenScript = true; continue; }
        if (!looksLikePath(word)) continue;
        found.push({ path: word, kind, via: 'bash:sed', confidence: 'parsed', ...range });
      }
      continue;
    }

    // `util fs merge src/` and `util fs tree docs` — a merge is a read of
    // every file it prints, and the output names them, so the paths come from
    // there. A tree is recorded as a listing and never as a read.
    if (verb === 'util' && rest[0] === 'fs' && rest[1] === 'tree') {
      for (const word of rest.slice(2)) {
        if (looksLikePath(word) || /^[\w.-]+$/.test(word)) {
          found.push({ path: word, kind: 'list', via: 'util fs tree', confidence: 'parsed' });
        }
      }
    }
  }

  return found;
}

// ` ```js path/to/file ` — the opener util fs merge writes above each file.
const FENCE = /^```([A-Za-z0-9+#-]*)[ \t]+(\S.*?)\s*$/;

/**
 * The files a `util fs merge` run printed, taken from its own output. The
 * command names a folder and the output names what was in it, so the stream is
 * the only place the list exists.
 */
function fromMergeOutput(command, stdout) {
  if (!stdout) return [];
  if (!/\butil\s+fs\s+merge\b/.test(command || '') && !/\bfmerge\b/.test(command || '')) return [];

  const found = [];
  const seen = new Set();
  for (const line of stdout.split('\n')) {
    const m = FENCE.exec(line);
    if (!m) continue;
    const file = m[2];
    if (seen.has(file)) continue;
    seen.add(file);
    const range = /^(.*):(\d+)-(\d+)$/.exec(file);
    found.push(range
      ? { path: range[1], start: Number(range[2]), end: Number(range[3]), kind: 'read', via: 'util fs merge', confidence: 'parsed' }
      : { path: file, kind: 'read', via: 'util fs merge', confidence: 'parsed' });
  }
  return found;
}

/**
 * What a finished tool call touched. The exact cases come first because the
 * tool reported them itself; Bash falls through to reading the command.
 */
function fromToolCall({ name, input, result }) {
  const found = [];
  const r = result && typeof result === 'object' ? result : null;

  if (name === 'Read') {
    const f = r && r.file;
    if (f && f.filePath) {
      found.push({
        path: f.filePath,
        kind: 'read',
        via: 'Read',
        confidence: 'exact',
        start: f.startLine ?? null,
        end: f.startLine != null && f.numLines != null ? f.startLine + f.numLines - 1 : null,
        total: f.totalLines ?? null,
        bytes: typeof f.content === 'string' ? Buffer.byteLength(f.content) : null,
      });
    } else if (input && input.file_path) {
      // An errored read still says which path was asked for, and a path that
      // does not exist is itself worth seeing in the record.
      found.push({ path: input.file_path, kind: 'read', via: 'Read', confidence: 'exact' });
    }
    return found;
  }

  if (name === 'Edit' || name === 'Write' || name === 'NotebookEdit') {
    const file = (r && r.filePath) || (input && (input.file_path || input.notebook_path));
    if (file) {
      const patch = r && Array.isArray(r.structuredPatch) ? r.structuredPatch : [];
      const start = patch.length ? Math.min(...patch.map((h) => h.newStart || 1)) : null;
      const end = patch.length
        ? Math.max(...patch.map((h) => (h.newStart || 1) + (h.newLines || 0) - 1))
        : null;
      found.push({
        path: file,
        kind: name === 'Write' ? 'write' : 'edit',
        via: name,
        confidence: 'exact',
        start,
        end,
        total: r && typeof r.originalFile === 'string' ? r.originalFile.split('\n').length : null,
      });
    }
    return found;
  }

  if (name === 'Bash') {
    const command = input && input.command;
    found.push(...fromCommand(command));
    found.push(...fromMergeOutput(command, r && r.stdout));
    return found;
  }

  return found;
}

/**
 * Content that reached context with no tool call: a CLAUDE.md loading, a file
 * dragged in from the editor, a compaction carrying a file reference forward.
 * Claude Code names the path itself, so these are declared rather than parsed.
 */
function fromAttachment(a) {
  if (!a || !a.type) return [];
  const file = a.path || a.displayPath || a.filename;
  if (!file) return [];

  const kinds = {
    file: 'read',
    nested_memory: 'read',
    compact_file_reference: 'read',
    opened_file_in_ide: 'read',
    selected_lines_in_ide: 'read',
    edited_text_file: 'edit',
  };
  const kind = kinds[a.type];
  if (!kind) return [];

  return [{
    path: file,
    kind,
    via: `attachment:${a.type}`,
    confidence: 'declared',
    start: a.lineStart ?? null,
    end: a.lineEnd ?? null,
    bytes: typeof a.content === 'string' ? Buffer.byteLength(a.content) : null,
  }];
}

module.exports = { fromToolCall, fromAttachment, fromCommand, fromMergeOutput, segments, stripHeredocs, words };
