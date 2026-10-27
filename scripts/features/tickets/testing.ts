/** Helpers for tests that read a project's tickets back off the disk. */

import fs from 'node:fs';
import path from 'node:path';
import * as frontmatter from '../../shared/frontmatter.ts';
import * as store from './store.ts';

// The files hold bare numbers; a test reads the ids in full, as the commands print them.
const full = (v) => (Array.isArray(v) ? v.map(full) : store.normalizeId(v, 'exp') || v);

const parseFull = (text) => {
  const read = frontmatter.parse(text);
  for (const key of ['id', 'was', 'parent', 'deps']) if (read.data[key]) read.data[key] = full(read.data[key]);
  return read;
};

const ticket = (dir) => {
  const base = path.join(dir, '.flow', 'tickets');
  const folders = fs.readdirSync(base).filter((f) => f !== 'archive');
  const files = folders.map((f) => path.join(base, f, 'ticket.md'));
  return folders.map((f, i) => ({ id: full(store.idOfFolder(f)), folder: f, ...parseFull(fs.readFileSync(files[i], 'utf8')) }));
};

const ticketFile = (dir, id): string => {
  const base = path.join(dir, '.flow', 'tickets');
  const archive = path.join(base, 'archive');
  const number = id.match(/\d+$/)![0];
  for (const root of [base, archive]) {
    if (!fs.existsSync(root)) continue;
    const hit = fs.readdirSync(root).find((f) => [id, number].some((x) => f === x || f.startsWith(`${x}-`)));
    if (hit) return path.join(root, hit, 'ticket.md');
  }
  throw new Error(`no ticket ${id} on disk`);
};

export { full, parseFull, ticket, ticketFile };
