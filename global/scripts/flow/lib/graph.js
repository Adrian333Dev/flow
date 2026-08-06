'use strict';
/**
 * The dependency graph. `deps` is the only relational field on a ticket, so
 * every question here — what is workable, what is broken — is a query over it.
 *
 * A dep is satisfied by `review` or `done`: review means built and checked, and
 * that is enough to unblock work that sits on top of it.
 */

const SATISFYING = new Set(['review', 'done']);
const LIVE = new Set(['todo', 'in-progress', 'review']);
const TERMINAL = new Set(['done', 'dropped', 'superseded']);

const indexById = (tickets) => new Map(tickets.map((t) => [t.id, t]));

/**
 * Why a ticket cannot start yet. Empty array = every dep is satisfied.
 * Each entry: { dep, reason, by } — reason is 'missing', 'dropped',
 * 'superseded', or the blocking ticket's status.
 */
function unmetDeps(ticket, index) {
  const unmet = [];
  for (const dep of ticket.data.deps) {
    const d = index.get(dep);
    if (!d) { unmet.push({ dep, reason: 'missing' }); continue; }
    if (d.data.status === 'dropped') { unmet.push({ dep, reason: 'dropped' }); continue; }
    if (d.data.status === 'superseded') { unmet.push({ dep, reason: 'superseded', by: d.data.by }); continue; }
    if (!SATISFYING.has(d.data.status)) unmet.push({ dep, reason: d.data.status });
  }
  return unmet;
}

/** todo, with every dep satisfied. The answer to "what can I work on now". */
function readyTickets(tickets) {
  const index = indexById(tickets);
  return tickets.filter((t) => t.data.status === 'todo' && unmetDeps(t, index).length === 0);
}

/** todo but blocked, each with the reasons. */
function blockedTickets(tickets) {
  const index = indexById(tickets);
  return tickets
    .filter((t) => t.data.status === 'todo')
    .map((t) => ({ ticket: t, unmet: unmetDeps(t, index) }))
    .filter((x) => x.unmet.length > 0);
}

function dependents(tickets, id) {
  return tickets.filter((t) => t.data.deps.includes(id));
}

/** Cycles over the deps edges, each returned as the ids in cycle order. */
function findCycles(tickets) {
  const index = indexById(tickets);
  const state = new Map(); // id → 'open' | 'closed'
  const stack = [];
  const cycles = [];
  const seen = new Set();

  function visit(id) {
    const t = index.get(id);
    if (!t) return;
    if (state.get(id) === 'open') {
      const cycle = stack.slice(stack.indexOf(id));
      const key = [...cycle].sort().join(',');
      if (!seen.has(key)) { seen.add(key); cycles.push(cycle); }
      return;
    }
    if (state.get(id) === 'closed') return;

    state.set(id, 'open');
    stack.push(id);
    for (const dep of t.data.deps) visit(dep);
    stack.pop();
    state.set(id, 'closed');
  }

  for (const t of tickets) visit(t.id);
  return cycles;
}

/**
 * Integrity problems worth acting on. Only live tickets are reported — a done
 * ticket that once depended on a dropped one is history, not a problem.
 */
function check(tickets) {
  const index = indexById(tickets);
  const dangling = [];
  const droppedBlockers = [];
  const supersededDeps = [];

  for (const t of tickets) {
    if (!LIVE.has(t.data.status)) continue;
    for (const dep of t.data.deps) {
      const d = index.get(dep);
      if (!d) { dangling.push({ ticket: t, dep }); continue; }
      if (d.data.status === 'dropped') droppedBlockers.push({ ticket: t, dep });
      if (d.data.status === 'superseded') supersededDeps.push({ ticket: t, dep, by: d.data.by });
    }
  }

  return { cycles: findCycles(tickets), dangling, droppedBlockers, supersededDeps };
}

const hasProblems = (p) =>
  p.cycles.length + p.dangling.length + p.droppedBlockers.length + p.supersededDeps.length > 0;

/** Would adding `dep` to `ticket` close a loop? */
function wouldCycle(tickets, ticketId, dep) {
  const index = indexById(tickets);
  const seen = new Set();
  const walk = (id) => {
    if (id === ticketId) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    const t = index.get(id);
    return t ? t.data.deps.some(walk) : false;
  };
  return walk(dep);
}

module.exports = {
  SATISFYING, LIVE, TERMINAL,
  indexById, unmetDeps, readyTickets, blockedTickets, dependents,
  findCycles, check, hasProblems, wouldCycle,
};
