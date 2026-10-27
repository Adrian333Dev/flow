/**
 * A renamed finding keeps every pointer to it: `flow findings edit --title`
 * rewrites its old path wherever a text file cites it.
 *
 * A citation is the file's path from its home down, the form tickets, notes,
 * rules and other findings write: `.flow/findings/<name>.md`,
 * `wiki/<subject>/findings/<name>.md`, `~/.flow/findings/<name>.md`. Each holds
 * the place, so 2 findings sharing a name in 2 wiki folders never mix. A bare
 * `<name>.md` is rewritten too where no other finding has that name.
 *
 * The walk reads the project the command runs in, and the Flow home's text:
 * its rule file, the wiki, notes, tickets, every project's records under
 * `projects/`, research and the archive. The audit index, logs, clones and
 * downloads hold no citation worth a rewrite and are skipped.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as paths from '../../shared/paths.ts';
import { projectRootOrNull } from '../../shared/project.ts';
import * as store from '../tickets/store.ts';
import type { Finding } from './findings.ts';

const TEXT = new Set(['.md', '.ts', '.js', '.json', '.txt', '.sh']);
const SKIP = new Set(['node_modules', '.git', 'tmp', 'downloads', 'audit', 'logs', 'changes', 'repos', 'originals', 'scripts']);
const HOME_PARTS = ['CLAUDE.md', 'wiki', 'notes', 'tickets', 'projects', 'research', 'archive', 'findings', 'machines'];

/** Every text file under `dir`, each real path once. */
function walk(dir: string, seen: Set<string>, found: string[]) {
  let real: string;
  try {
    real = fs.realpathSync(dir);
  } catch {
    return;
  }
  if (seen.has(real)) return;
  seen.add(real);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(real);
  } catch {
    return;
  }
  if (stat.isFile()) {
    if (TEXT.has(path.extname(real))) found.push(real);
    return;
  }
  if (!stat.isDirectory()) return;
  for (const entry of fs.readdirSync(real)) {
    if (!SKIP.has(entry)) walk(path.join(real, entry), seen, found);
  }
}

function textFiles() {
  const seen = new Set<string>();
  const found: string[] = [];
  const here = projectRootOrNull();
  if (here && !store.isHome(here)) walk(here, seen, found);
  for (const part of HOME_PARTS) walk(path.join(paths.flowHome(), part), seen, found);
  return found;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The pattern of a citation: the bare name where no other finding has it,
 * else the name behind its place's folder, so a namesake elsewhere is left.
 */
function pattern(f: Finding, unique: boolean) {
  const name = escape(`${f.name}.md`);
  if (unique) return new RegExp(`(?<![\\w-])${name}`, 'g');
  if (f.place.wiki) return new RegExp(`(?<=wiki/${escape(f.place.wiki)}/findings/)${name}`, 'g');
  if (f.place.project === store.HOME_WORD) return new RegExp(`(?<=~/\\.flow/findings/)${name}`, 'g');
  return new RegExp(`(?<=(?<!~/)\\.flow/findings/)${name}`, 'g');
}

/**
 * Rewrites every citation of `finding` under its old name to `to`, and
 * returns the files changed. `unique` says no other finding shares the old
 * name.
 */
function rewrite(finding: Finding, to: string, unique: boolean) {
  const re = pattern(finding, unique);
  const changed: string[] = [];
  for (const file of textFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes(`${finding.name}.md`)) continue;
    const next = text.replace(re, `${to}.md`);
    if (next !== text) {
      fs.writeFileSync(file, next);
      changed.push(file);
    }
  }
  return changed;
}

export { rewrite };
