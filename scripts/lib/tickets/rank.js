'use strict';
/**
 * The order of tickets, and the number that puts one in a place.
 *
 * Siblings are the open tickets that share a parent. Top-level tickets share the
 * empty one. Among siblings, a ticket with `rank:` comes first, by number, and
 * the tickets without one follow by id. A new ticket has no rank, so it lands
 * last on its own. Only a move writes a number: `flow tickets rank`, or a position on
 * `flow tickets new`.
 */

const store = require('./store');
const statuses = require('./statuses');
const { FlowError } = require('../error');

// Backlog.md's step. Wide gaps let a move take the middle number of its
// neighbours without touching any other ticket.
const STEP = 1000;
const EPSILON = 1e-6;

const hasRank = (t) => typeof t.data.rank === 'number';

/** Ranked before unranked, ranked by number, unranked by id. */
function compareSiblings(a, b) {
  if (hasRank(a) !== hasRank(b)) return hasRank(a) ? -1 : 1;
  if (hasRank(a) && a.data.rank !== b.data.rank) return a.data.rank - b.data.rank;
  return store.idNumber(a.id) - store.idNumber(b.id) || String(a.id).localeCompare(String(b.id));
}

/** The ticket and its parents, top first. `seen` stops a hand-edited parent cycle. */
function chain(ticket, index) {
  const found = [];
  const seen = new Set();
  for (let t = ticket; t && !seen.has(t.id); t = t.data.parent ? index.get(t.data.parent) : null) {
    seen.add(t.id);
    found.unshift(t);
  }
  return found;
}

/**
 * One order for a flat list. The tickets are compared level by level from the
 * top parent down, so a child sits where its parent sits and children of one
 * parent keep their own order.
 */
function compareOrder(a, b, index) {
  const ca = chain(a, index);
  const cb = chain(b, index);
  for (let i = 0; i < Math.min(ca.length, cb.length); i++) {
    if (ca[i].id !== cb[i].id) return compareSiblings(ca[i], cb[i]);
  }
  return ca.length - cb.length;
}

/** The open tickets whose parent is `parent`. */
const siblingsOf = (tickets, parent) =>
  tickets.filter((t) => (t.data.parent || '') === (parent || '') && !statuses.TERMINAL.has(t.data.status));

/**
 * Where `mover` goes among `siblings`, and the numbers that put it there.
 * `target` is `{ before: id }`, `{ after: id }`, `{ first: true }` or `{ last: true }`.
 *
 * Returns `{ rank, others }`: the mover's number, and the other tickets that
 * got a number too. `others` is empty for a normal move. It holds the whole
 * group when the group had unranked tickets, which are numbered once so the
 * mover has neighbours to sit between, or when the gap at the target is too
 * small to split.
 */
function place(siblings, mover, target) {
  const group = siblings.filter((t) => t.id !== mover.id).sort(compareSiblings);

  let at;
  if (target.first) at = 0;
  else if (target.last) at = group.length;
  else {
    const id = target.before || target.after;
    const i = group.findIndex((t) => t.id === id);
    if (i === -1) throw new FlowError(`${id} is not an open ticket with the same parent: a ticket is ranked among its siblings.`);
    at = target.before ? i : i + 1;
  }

  const others = new Map();
  let numbers = group.map((t) => t.data.rank);
  if (numbers.some((n) => typeof n !== 'number')) {
    numbers = group.map((_, i) => STEP * (i + 1));
    group.forEach((t, i) => { if (t.data.rank !== numbers[i]) others.set(t, numbers[i]); });
  }

  const before = numbers[at - 1];
  const after = numbers[at];
  let rank;
  if (before === undefined && after === undefined) rank = STEP;
  else if (before === undefined) rank = after - STEP;
  else if (after === undefined) rank = before + STEP;
  else rank = (before + after) / 2;

  if (before !== undefined && after !== undefined && (rank <= before + EPSILON || rank >= after - EPSILON)) {
    others.clear();
    [...group.slice(0, at), mover, ...group.slice(at)].forEach((t, i) => {
      if (t === mover) rank = STEP * (i + 1);
      else if (t.data.rank !== STEP * (i + 1)) others.set(t, STEP * (i + 1));
    });
  }

  return { rank, others: [...others].map(([ticket, number]) => ({ ticket, rank: number })) };
}

module.exports = { compareSiblings, compareOrder, siblingsOf, place };
