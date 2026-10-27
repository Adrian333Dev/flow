/**
 * Which wiki folders and research topics a project's work opens, counted.
 *
 *   .flow/tickets/274/usage.json   the visits made while working fw-274
 *   .flow/usage.json               the visits made with no ticket
 *
 *   {"claude-code": {"count": 12, "last": "2026-10-24 14:05"}, "research:agent-memory": {...}}
 *
 * A wiki folder is its name, a research topic `research:<topic>`. The file
 * sits in the ticket's folder so it moves, syncs and archives with the
 * ticket. The project's counts are the sum over every file. The flow-session
 * mod adds a visit when the agent reads a file inside a folder, once per
 * folder per window (`flow visit`).
 */

import fs from 'node:fs';
import path from 'node:path';
import * as store from '../tickets/store.ts';
import * as records from '../tickets/records.ts';

const FILE = 'usage.json';

interface Visits {
  count: number;
  last: string;
}

type Usage = Record<string, Visits>;

function readFile(file: string): Usage {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/** The usage file a visit goes to: the ticket's, else the project's. A ticket id that names none is refused. */
function fileFor(root: string, ticket?: string) {
  if (!ticket) return path.join(store.recordsDir(root), FILE);
  return path.join(store.findTicket(store.readTickets(root), ticket).dir, FILE);
}

/** Adds one visit to `folder`, under the records lock, since parallel sessions write the same file. */
function add(root: string, folder: string, ticket?: string) {
  const file = fileFor(root, ticket);
  records.locked(root, () => {
    const usage = readFile(file);
    const was = usage[folder];
    usage[folder] = { count: (was?.count || 0) + 1, last: store.now().slice(0, 16) };
    fs.writeFileSync(file, `${JSON.stringify(usage, null, 2)}\n`);
    return { ok: true };
  });
  return file;
}

/** Every usage file of a project: the project's own and each ticket's, archived ones included. */
function files(root: string) {
  const found = [path.join(store.recordsDir(root), FILE)];
  for (const dir of [store.ticketsDir(root), store.archiveDir(root)]) {
    let names: string[];
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) found.push(path.join(dir, name, FILE));
  }
  return found.filter((f) => fs.existsSync(f));
}

/** A project's visits per folder, summed over its files, the latest visit first. */
function totals(root: string): [string, Visits][] {
  const sum: Usage = {};
  for (const file of files(root)) {
    for (const [folder, v] of Object.entries(readFile(file))) {
      const was = sum[folder] || { count: 0, last: '' };
      sum[folder] = { count: was.count + (Number(v.count) || 0), last: String(v.last || '') > was.last ? String(v.last) : was.last };
    }
  }
  return Object.entries(sum).sort((a, b) => b[1].last.localeCompare(a[1].last) || b[1].count - a[1].count);
}

export type { Visits };
export { add, totals };
