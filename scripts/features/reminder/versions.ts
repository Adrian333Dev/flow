/**
 * The versions of the line the reminder hook prints beside every message, one
 * file each, while the reply rules are still being tuned:
 *
 *   ~/.flow/prompts/reminders/default.md
 *   ~/.flow/prompts/reminders/<name>.md
 *
 * `"reminder"` in ~/.flow/settings.json picks one: `false` prints nothing, a
 * name prints that file, and anything else, absent included, prints
 * `default`. The hook reads the setting on every message, so a switch applies
 * from the next one.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as settings from '../../shared/settings.ts';
import * as paths from '../../shared/paths.ts';

const DEFAULT = 'default';
const NAME = /^[\w.-]+$/;

const dir = (home = paths.flowHome()) => path.join(home, 'prompts', 'reminders');

/** Every version on disk, by name, `default` first. */
function names(home?: string) {
  let files: string[];
  try {
    files = fs.readdirSync(dir(home));
  } catch {
    return [];
  }
  const found = files.filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
  return found.sort((a, b) => Number(b === DEFAULT) - Number(a === DEFAULT) || a.localeCompare(b));
}

/** The version the setting picks, or null where it says false. */
function chosen(home?: string): string | null {
  const value = settings.read(settings.globalFile(home)).reminder;
  if (value === false) return null;
  return typeof value === 'string' && NAME.test(value) ? value : DEFAULT;
}

/** The file of the chosen version, or null where the reminder is off. */
function file(home?: string) {
  const name = chosen(home);
  return name === null ? null : path.join(dir(home), `${name}.md`);
}

export { DEFAULT, NAME, names, chosen, file };
