/**
 * Where a ticket is still mentioned as text, before `flow tickets delete`
 * removes its folder: its id (`fw-269`, never `fw-2690`) or its relative path
 * (`.flow/tickets/269/`, `.flow/tickets/archive/269/`). Absolute paths are not
 * searched: every path Flow writes is relative to a root.
 *
 * 2 roots: the project's folder and the Flow home, which holds the project's
 * records (tickets, findings, research) beside the notes, the wiki and the
 * rules. The project's `.flow` is a link into the Flow home, and ripgrep
 * follows no link, so each file is read once.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { FlowError } from '../../shared/error.ts';
import * as paths from '../../shared/paths.ts';
import * as store from './store.ts';
import type { Ticket } from './types.ts';

type Mention = { file: string; line: number; text: string };

const real = (p: string) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

/**
 * Every line mentioning `t`, outside its own folder. `ignore(file, text)`
 * drops a line the caller is about to rewrite, such as the parent's task line.
 */
function find(t: Ticket, ignore: (file: string, text: string) => boolean = () => false): Mention[] {
  const n = store.idNumber(t.id);
  const roots = [...new Set([real(t.root), real(paths.flowHome())])].filter((r) => fs.existsSync(r));
  // --hidden: `.flow`, `.claude` and the like are where tickets get cited.
  const ran = spawnSync('rg', [
    '--line-number', '--no-heading', '--with-filename', '--no-messages', '--hidden', '--glob', '!.git',
    '-e', `\\b${t.id}\\b`, '-e', `\\.flow/tickets/(archive/)?${n}\\b`,
    ...roots,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (ran.error) {
    const missing = (ran.error as NodeJS.ErrnoException).code === 'ENOENT';
    throw new FlowError(missing
      ? 'ripgrep (rg) is not on PATH, and flow tickets delete searches for mentions with it. Install it, then run flow doctor.'
      : `ripgrep failed: ${ran.error.message}`);
  }
  // 1 is no match. 2 with output is a match beside an unreadable file.
  if (ran.status === 2 && !ran.stdout) throw new FlowError(`ripgrep failed: ${ran.stderr.trim()}`);

  const own = real(t.dir) + path.sep;
  const seen = new Set<string>();
  const found: Mention[] = [];
  for (const row of ran.stdout.split('\n')) {
    const m = row.match(/^(.*?):(\d+):(.*)$/);
    if (!m) continue;
    const file = real(m[1]);
    const key = `${file}:${m[2]}`;
    if (file.startsWith(own) || seen.has(key) || ignore(file, m[3])) continue;
    seen.add(key);
    found.push({ file, line: Number(m[2]), text: m[3].trim() });
  }
  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

/** A mention as one line: the path from the project's folder where it sits inside, else with `~`. */
function describe(root: string, m: Mention) {
  const inside = m.file.startsWith(real(root) + path.sep);
  const where = inside ? path.relative(real(root), m.file) : paths.shorten(m.file);
  const text = m.text.length > 80 ? `${m.text.slice(0, 79)}…` : m.text;
  return `${where}:${m.line}  ${text}`;
}

export { find, describe, real };
export type { Mention };
