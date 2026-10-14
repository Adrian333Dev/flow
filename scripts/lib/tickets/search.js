'use strict';
/**
 * Loose word search over tickets, for `flow ls <words>`. Backlog.md's search
 * uses Fuse.js, and Flow takes no dependencies, so this is the small version:
 * every word must appear in the title, description, id, labels or body, and a word of 5
 * letters or more may be one typo away from a word in the text.
 */

const tokens = (text) => text.split(/[^a-z0-9]+/).filter(Boolean);

/** True when `a` and `b` differ by at most one inserted, dropped or changed letter. */
function withinOne(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** A test for `words`: true for a ticket that holds every one of them. */
function matcher(words) {
  const wanted = words.map((w) => String(w).trim().toLowerCase()).filter(Boolean);
  return (ticket) => {
    const { title, description, labels } = ticket.data;
    const text = [title, description, ticket.id, labels.join(' '), ticket.body].join('\n').toLowerCase();
    let split = null;
    return wanted.every((word) => {
      if (text.includes(word)) return true;
      if (word.length < 5) return false;
      split = split || tokens(text);
      return split.some((token) => withinOne(token, word));
    });
  };
}

module.exports = { matcher, withinOne };
