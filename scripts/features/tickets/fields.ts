/** What a ticket's own fields may hold: labels, activities, titles and ranks, and the dates stamped on it. */

import { FlowError } from '../../shared/error.ts';

// `labels` are free tags, several per ticket: `v1`, `post-v1`, `urgent`. Any
// name that fits the pattern is allowed, and no label changes what Flow does.
// The pattern keeps the inline list in the frontmatter safe: no comma, no space.
const LABEL = /^[a-z0-9][a-z0-9-]{0,23}$/;

/** A `labels` value as a list: an array, or a comma-separated string. */
function toLabelList(v) {
  if (v === undefined || v === null || v === '') return [];
  const raw = Array.isArray(v) ? v : String(v).split(',');
  return [...new Set(raw.map((x) => String(x).trim()).filter(Boolean))];
}

/** The refusal for a label that cannot be one, or null. */
const badLabel = (label) =>
  LABEL.test(label) ? null : `"${label}" cannot be a label: use lowercase letters, digits and hyphens, 24 characters at most.`;

// An open word, not a list: `design`, `build`, `debug`, `research`, `proto`. Letters only keeps it one word in the band.
const ACTIVITY = /^[a-z]{1,8}$/;

/** The refusal for an activity that cannot be one, or null. */
const badActivity = (word) =>
  ACTIVITY.test(word) ? null : `"${word}" cannot be an activity: use 1 to 8 lowercase letters, such as build.`;

/** A `rank` value as a number, or '' where the field is missing or not a number. */
const toRank = (v) => {
  if (v === undefined || v === null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
};

const SLUG_MAX = 48;

// Hyphenated so the id and the title join into one word, `exp-47-parser-split`,
// which is how the badge and the board show a ticket.
const TITLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TITLE_MAX = 40;

/**
 * A title cut from a description: up to 4 words before the first colon, else
 * the first 4 words. `Safari cookie lost: gone after login` is `safari-cookie-lost`.
 */
const titleFrom = (description) => {
  const colon = description.indexOf(':');
  const head = colon > 0 ? description.slice(0, colon) : description;
  const words = head.toLowerCase().replace(/['’]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  let title = words.slice(0, 4).join('-');
  while (title.length > TITLE_MAX && title.includes('-')) title = title.slice(0, title.lastIndexOf('-'));
  return title.slice(0, TITLE_MAX);
};

/** The refusal for a title that cannot be one, or null. */
const badTitle = (title) =>
  TITLE.test(title) && title.length <= TITLE_MAX
    ? null
    : `"${title}" cannot be a title: use lowercase letters, digits and single hyphens, ${TITLE_MAX} characters at most, such as login-redirect-loop.`;

/** Local date, not UTC: a date stamped a day behind the user's own calendar
 *  is wrong in the only way this field can be wrong. */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `today()` plus the clock, for `closed`: see the note on that field. */
function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function slugify(title, max = SLUG_MAX) {
  const base = String(title)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) throw new FlowError('that title produces an empty slug: it needs words, not punctuation.');
  if (base.length <= max) return base;
  const cut = base.slice(0, max);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 12 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

export { toLabelList, badLabel, badActivity, toRank, titleFrom, badTitle, today, now, slugify };
