#!/usr/bin/env node
/**
 * check-frame — verify an ASCII frame renders as drawn.
 *
 * Usage: node check-frame.js <file> [file2 ...]
 *
 * Splits each file into blocks on blank lines, then per block:
 *   1. charset — flags any character outside the sanctioned set, with line, column, code point.
 *      Catches East-Asian-Ambiguous glyphs that render two columns wide and silently shift
 *      every column to their right.
 *   2. width   — framed lines (first and last non-space char are both box-drawing) must all
 *      share one width. Annotation and connector lines float free and are exempt.
 *   3. columns — prints the column index of every vertical border on each framed line.
 *      Informational, never a failure: drift is obvious when one line reads [0,20,59] and
 *      the next reads [0,21,59]. Nested boxes make auto-judging this produce false failures.
 *
 * Exit 0 = pass, 1 = fail.
 */

const fs = require('fs');

const BOX = '─│┌┐└┘├┤┬┴┼';
const ARROWS = '▲▼▶◀';
const ALLOWED = new Set([...BOX, ...ARROWS]);
const VERTICAL = new Set([...'│┌┐└┘├┤┬┴┼']);

const isAscii = (ch) => {
  const c = ch.codePointAt(0);
  return c >= 0x20 && c <= 0x7e;
};

const codePoint = (ch) => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

const rtrim = (s) => s.replace(/\s+$/, '');

const isFramed = (line) => {
  const s = line.trim();
  return s.length > 1 && BOX.includes(s[0]) && BOX.includes(s[s.length - 1]);
};

function commonWidth(widths) {
  const counts = new Map();
  for (const w of widths) counts.set(w, (counts.get(w) || 0) + 1);
  let best = null;
  let bestCount = -1;
  for (const [w, n] of counts) {
    if (n > bestCount || (n === bestCount && w > best)) {
      best = w;
      bestCount = n;
    }
  }
  return best;
}

function checkBlock(lines, offset) {
  const charset = [];
  const width = [];
  const columns = [];

  lines.forEach((line, i) => {
    const lineNo = offset + i + 1;
    [...line].forEach((ch, col) => {
      if (!isAscii(ch) && !ALLOWED.has(ch)) {
        charset.push(`  line ${lineNo} col ${col}: '${ch}' ${codePoint(ch)} is not sanctioned`);
      }
    });
  });

  const framed = lines
    .map((line, i) => ({ line, lineNo: offset + i + 1 }))
    .filter(({ line }) => isFramed(line));

  // Group by starting column: a box and the connector lines running between two boxes are
  // separate frames that each need internal consistency, not consistency with each other.
  const groups = new Map();
  for (const entry of framed) {
    const indent = entry.line.length - entry.line.trimStart().length;
    if (!groups.has(indent)) groups.set(indent, []);
    groups.get(indent).push(entry);
  }

  for (const [indent, group] of groups) {
    const target = commonWidth(group.map(({ line }) => rtrim(line).length));
    for (const { line, lineNo } of group) {
      const w = rtrim(line).length;
      if (w !== target) {
        width.push(`  line ${lineNo}: width ${w}, the frame at indent ${indent} is ${target}`);
      }
    }
  }

  for (const { line, lineNo } of framed) {
    const cols = [...line].map((ch, col) => (VERTICAL.has(ch) ? col : -1)).filter((c) => c >= 0);
    columns.push(`  line ${lineNo}: [${cols.join(',')}]`);
  }

  return { charset, width, columns };
}

function checkFile(path) {
  const raw = fs.readFileSync(path, 'utf8').split('\n');
  const blocks = [];
  let start = 0;

  for (let i = 0; i <= raw.length; i++) {
    if (i === raw.length || raw[i].trim() === '') {
      if (i > start) blocks.push({ lines: raw.slice(start, i), offset: start });
      start = i + 1;
    }
  }

  let failed = false;
  console.log(`\n${path}`);

  blocks.forEach((block, n) => {
    const { charset, width, columns } = checkBlock(block.lines, block.offset);
    if (!charset.length && !columns.length) return;

    const first = block.offset + 1;
    const last = block.offset + block.lines.length;
    const status = charset.length || width.length ? 'FAIL' : 'PASS';
    if (status === 'FAIL') failed = true;

    console.log(`\n  block ${n + 1} (lines ${first}-${last}): ${status}`);
    if (charset.length) console.log('\n  charset:\n' + charset.join('\n'));
    if (width.length) console.log('\n  width:\n' + width.join('\n'));
    if (columns.length) console.log('\n  border columns:\n' + columns.join('\n'));
  });

  return failed;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node check-frame.js <file> [file2 ...]');
  process.exit(2);
}

const anyFailed = files.map(checkFile).some(Boolean);
process.exit(anyFailed ? 1 : 0);
