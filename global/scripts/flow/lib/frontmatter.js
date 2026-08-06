'use strict';
/**
 * YAML frontmatter — the controlled subset Flow actually stores.
 *
 * Scalars and flat arrays, nothing else. Block sequences are accepted on read
 * (a file may have been hand-edited) but never written; arrays serialize inline
 * as [a, b]. Anything richer than this is a signal the field is wrong, not that
 * the parser is too small.
 */

function parse(raw) {
  const text = String(raw).replace(/^﻿/, '');
  if (!text.startsWith('---')) return { data: {}, body: text };

  const lines = text.split('\n');
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return { data: {}, body: text };

  return {
    data: parseBlock(lines.slice(1, end)),
    body: lines.slice(end + 1).join('\n').replace(/^\n+/, ''),
  };
}

function parseBlock(lines) {
  const data = {};
  let currentKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const seq = line.match(/^\s*-\s+(.*)$/);
    if (seq && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(scalar(stripComment(seq[1])));
      continue;
    }

    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    currentKey = kv[1];
    const rest = stripComment(kv[2]).trim();
    data[currentKey] = rest === '' ? '' : value(rest);
  }

  return data;
}

// Drops a trailing ` # comment`, but not a # inside a quoted string.
function stripComment(s) {
  const t = s.trimStart();
  if (t.startsWith('"') || t.startsWith("'")) {
    const q = t[0];
    for (let i = 1; i < t.length; i++) {
      if (t[i] === '\\') { i++; continue; }
      if (t[i] === q) return t.slice(0, i + 1);
    }
    return t;
  }
  const idx = s.indexOf(' #');
  return idx === -1 ? s : s.slice(0, idx);
}

function value(raw) {
  const s = raw.trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(scalar).filter((x) => x !== '');
  }
  return scalar(s);
}

function scalar(raw) {
  const s = raw.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

function quoteIfNeeded(s) {
  const needs =
    /^[\s>|@`%*&!\[\]{}#'"-]/.test(s) ||
    /[:#]\s/.test(s) ||
    /:\s*$/.test(s) ||
    /\s$/.test(s) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^-?\d+(\.\d+)?$/.test(s);
  if (!needs) return s;
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/** Serializes in `keyOrder`; empty strings and empty arrays are omitted entirely. */
function serialize(data, keyOrder) {
  const lines = ['---'];
  for (const key of keyOrder) {
    const v = data[key];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      lines.push(`${key}: [${v.join(', ')}]`);
    } else {
      const s = String(v);
      if (s === '') continue;
      lines.push(`${key}: ${quoteIfNeeded(s)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function stringify(data, keyOrder, body) {
  const text = String(body || '').replace(/^\n+/, '').trimEnd();
  return serialize(data, keyOrder) + '\n\n' + text + '\n';
}

module.exports = { parse, serialize, stringify };
