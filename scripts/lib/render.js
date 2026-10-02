'use strict';
/**
 * Output every command shares: aligned columns, a table, an indent. Plain
 * text, no colour: the agent reads this as often as the user does, and ANSI
 * codes are noise in a transcript. Each command's own views live with it, and
 * the board's in `tickets/render.js`.
 */

/** Aligned columns with no header row: the tree needs the padding without one. */
function columns(rows) {
  const widths = [];
  for (const r of rows) {
    r.forEach((c, i) => { widths[i] = Math.max(widths[i] || 0, String(c ?? '').length); });
  }
  return rows
    .map((r) => r.map((c, i) => String(c ?? '').padEnd(widths[i])).join('  ').trimEnd())
    .join('\n');
}

const table = (headers, rows) => columns([headers, ...rows]);

const indent = (text) => text.split('\n').map((l) => '  ' + l).join('\n');

module.exports = { columns, table, indent };
