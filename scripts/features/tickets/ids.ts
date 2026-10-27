/**
 * Ticket ids and the words in them: `exp-47`, its prefix, its number. Pure
 * text, so nothing here touches the disk.
 */

import path from 'node:path';
import { FlowError } from '../../shared/error.ts';

const HOME_WORD = 'home';

// 2 to 8 lowercase letters. A digit or a dash would make `exp2-4` or `my-app-4`
// ambiguous to read back.
const WORD = /^[a-z]{2,8}$/;

// Words no prefix may be: `--project` and a note's `project:` term read them.
// `global` is the old name of `home`, refused so it names the new one.
const RESERVED = [HOME_WORD, 'global', 'all', 'here'];

/**
 * The word a folder name offers, before the user picks: its letters whole where
 * they fit a prefix, `my-app` → `myapp`, else the first 3, `expense-tracker` →
 * `exp`. Under 2 letters, `flow`.
 */
function offerWord(folder) {
  const letters = path.basename(path.resolve(folder)).toLowerCase().replace(/[^a-z]/g, '');
  const cuts = letters.length <= 8 ? [letters, letters.slice(0, 3)] : [letters.slice(0, 3)];
  return cuts.find((word) => word.length >= 2 && !RESERVED.includes(word)) || 'flow';
}

/** The refusal for a word that cannot be one, or null. */
function badWord(word) {
  if (!WORD.test(String(word))) return `"${word}" cannot be a ticket prefix: use 2 to 8 lowercase letters.`;
  if (word === HOME_WORD) return '"home" is the prefix of the tickets in ~/.flow/, so no project can take it.';
  if (word === 'global') return '"global" is now named "home" (the tickets and notes of ~/.flow/), so no project can take it.';
  if (RESERVED.includes(word)) return `"${word}" is a word flow reads (project:${word}, --project), so no project can take it.`;
  return null;
}

/**
 * `exp-47`, `EXP-47` and `47` all normalize to `exp-47` in a place whose word
 * is `exp`. A word other than the place's own stays as typed, lowercased, so
 * the caller can send it to the place that owns it. Null for anything else.
 */
function normalizeId(ref, prefix) {
  const s = String(ref || '').trim().toLowerCase();
  const bare = s.match(/^(\d+)$/);
  if (bare) return prefix ? `${prefix}-${parseInt(bare[1], 10)}` : null;
  const full = s.match(/^([a-z]{2,8})-(\d+)$/);
  return full ? `${full[1]}-${parseInt(full[2], 10)}` : null;
}

/** The word of an id, `exp` for `exp-47` or `exp-47-old-words`, or null. */
const wordOf = (id) => (String(id).match(/^([a-z]{2,8})-\d+(?:-|$)/) || [])[1] || null;

/** Sort key. String compare puts exp-182 between exp-1819 and exp-1820. */
function idNumber(id) {
  const m = String(id).match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

const byId = (a, b) => idNumber(a.id) - idNumber(b.id) || String(a.id).localeCompare(String(b.id));

function requireId(ref, prefix) {
  const id = normalizeId(ref, prefix);
  if (!id) throw new FlowError(`not a ticket id: ${ref}`);
  return id;
}

/** The number at the front of a folder name, `47` from `47` or `47-parser-split`. */
const idOfFolder = (name) => (String(name).match(/^(\d+)(?:-|$)/) || [])[1] || null;

/** The id at the front of what was typed, `exp-47` from `EXP-47-old-words`, or null. */
const idOfRef = (ref) => (String(ref || '').trim().toLowerCase().match(/^([a-z]{2,8}-\d+)(?:-|$)/) || [])[1] || null;

/** The folder for an id: its number alone, then the words an old folder kept. */
const folderName = (id, label = '') => (label ? `${idNumber(id)}-${label}` : String(idNumber(id)));

/**
 * An id as the frontmatter holds it: the number, as a number so it is written
 * bare, where the id carries the place's own word; any other id as it is.
 */
const storedId = (id, prefix) =>
  prefix && /^[a-z]{2,8}-\d+$/.test(id) && wordOf(id) === prefix ? idNumber(id) : id;

function toIdList(v, prefix) {
  if (v === undefined || v === null || v === '') return [];
  const raw = Array.isArray(v) ? v : String(v).split(',');
  return raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .map((x) => normalizeId(x, prefix) || x); // keep unparseable entries so `check` can report them
}

export { HOME_WORD, WORD, offerWord, badWord, normalizeId, wordOf, idNumber, byId, requireId, idOfFolder, idOfRef, folderName, storedId, toIdList };
