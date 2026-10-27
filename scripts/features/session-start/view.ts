/**
 * The session start view: what exists, as label groups, folder names and spec
 * file names, so the agent knows which store to open before it explores.
 * `docs/spec/knowledge-base.md` → `### The session start view` decides it.
 *
 *   Labels in use, (n) = entries
 *   tickets           feature (22), chore (9), ...
 *   notes             rule (6), ui (3), ...
 *   findings global   machine-setup (2), user-preference (3)
 *   findings project  hooks (4), ...
 *   ~/.flow/wiki/     claude-code, node, ...
 *   docs/spec/        product, tickets, skills, ...
 *
 * Computed from disk at each start and written nowhere. A store with nothing
 * in it drops its line, and a view with no line is no view.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as store from '../tickets/store.ts';
import * as findings from '../findings/findings.ts';
import * as notes from '../notes/notes.ts';
import { select } from '../tickets/select.ts';
import type { Ticket } from '../tickets/types.ts';

// A line stops here, then says how many it left out.
const LABELS_PER_LINE = 20;

// Every wiki folder is listed up to here, then the most recently changed ones.
// Replaced by the folders the project used, once visits are counted (`fw-274`).
const WIKI_FOLDERS = 15;

const HEAD_WIDTH = 'findings project'.length + 2;

/** `[label, count]` pairs, the most used first. */
function tally(labelLists: string[][]) {
  const counts = new Map<string, number>();
  for (const labels of labelLists) for (const l of labels) counts.set(l, (counts.get(l) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** The first `max` items, then `+N more` for the rest. */
function capped(items: string[], max: number) {
  const shown = items.slice(0, max);
  if (items.length > max) shown.push(`+${items.length - max} more`);
  return shown.join(', ');
}

const counted = (pairs: [string, number][]) => capped(pairs.map(([l, n]) => `${l} (${n})`), LABELS_PER_LINE);

/** The labels of the tickets a plain `flow tickets` lists: open, not parked. */
function ticketLabels(root: string) {
  const { list } = select(store.readTickets(root));
  return tally(list.map((t: Ticket) => t.data.labels));
}

/** The labels of the notes `flow notes` lists here: this project's and the home's. */
function noteLabels(prefix: string | null) {
  const wanted = new Set([store.HOME_WORD, prefix?.toLowerCase()]);
  return tally(notes.readNotes().filter((n) => wanted.has(n.data.project.toLowerCase())).map((n) => n.data.labels));
}

const findingLabels = (root: string) => tally(findings.readDir(findings.projectDir(root), { project: '' }).map((f) => f.data.labels));

/** A folder's last change, or 0. */
function changed(dir: string) {
  try {
    return fs.statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

/** The wiki folders by name, or the most recently changed ones once they pass `WIKI_FOLDERS`. */
function wikiFolders() {
  const all = findings.subjects();
  if (all.length <= WIKI_FOLDERS) return all.join(', ');
  const recent = [...all].sort((a, b) => changed(path.join(findings.wikiDir(), b)) - changed(path.join(findings.wikiDir(), a)));
  return capped(recent, WIKI_FOLDERS);
}

/** The project's spec files, `product` first, without `.md`. */
function specFiles(root: string) {
  let names: string[];
  try {
    names = fs.readdirSync(path.join(root, 'docs', 'spec')).filter((n) => n.endsWith('.md')).map((n) => n.slice(0, -3)).sort();
  } catch {
    return '';
  }
  return names.sort((a, b) => Number(b === 'product') - Number(a === 'product')).join(', ');
}

/** The view for a session in `root`, a Flow project or null; null where every store is empty. */
function view(root: string | null) {
  const home = store.homeRoot();
  const rows: [string, string][] = [
    ['tickets', counted(ticketLabels(root || home))],
    ['notes', counted(noteLabels(root ? store.prefixOf(root) : null))],
    ['findings global', counted(findingLabels(home))],
    ['findings project', root ? counted(findingLabels(root)) : ''],
    ['~/.flow/wiki/', wikiFolders()],
    ['docs/spec/', root ? specFiles(root) : ''],
  ];
  const lines = rows.filter(([, text]) => text).map(([head, text]) => `${head.padEnd(HEAD_WIDTH)}${text}`);
  return lines.length ? ['Labels in use, (n) = entries', ...lines].join('\n') : null;
}

export { view };
