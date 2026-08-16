'use strict';
/**
 * The relational queries. Two edges exist on a ticket: `deps` (what must be
 * finished first) and `parent` (what this was split out of), so every question
 * here — what is workable, what is broken, what would a drop damage — is a walk
 * over one of them.
 *
 * A dep is satisfied by `review` or `done`: review means built and checked, and
 * that is enough to unblock work that sits on top of it.
 */

const SATISFYING = new Set(['review', 'done']);

// "Still repairable." Deliberately excludes `review` as well as the terminal
// pair: a ticket that is built and being checked has already used its deps, so
// rewriting them would rewrite history rather than rescue anything. `parked`
// is in, because `flow start` brings it back.
const LIVE = new Set(['todo', 'thinking', 'building', 'parked']);
const TERMINAL = new Set(['done', 'dropped']);

// Children that still owe work. A parent is only closable when this is empty.
const OPEN = new Set(['todo', 'thinking', 'building', 'review', 'parked']);

// Picked up and not finished. `flow next` leads with these.
const IN_FLIGHT = new Set(['thinking', 'building', 'review']);

// `normal` sits between the two deliberate answers, and is what an absent field
// means — so a ticket nobody has judged never outranks one judged low.
const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };

// Unfinished first, then what could start, then what was set aside, then
// history. `ls` is the only view holding every status at once, so the order
// lives here rather than being implied by the status list's declaration order.
const STATUS_RANK = { thinking: 0, building: 1, review: 2, todo: 3, parked: 4, done: 5, dropped: 6 };

const indexById = (tickets) => new Map(tickets.map((t) => [t.id, t]));

/**
 * Why a ticket cannot start yet. Empty array = every dep is satisfied.
 * Each entry: { dep, reason } — reason is 'missing', 'dropped', or the
 * blocking ticket's status.
 */
function unmetDeps(ticket, index) {
  const unmet = [];
  for (const dep of ticket.data.deps) {
    const d = index.get(dep);
    if (!d) { unmet.push({ dep, reason: 'missing' }); continue; }
    if (d.data.status === 'dropped') { unmet.push({ dep, reason: 'dropped' }); continue; }
    if (!SATISFYING.has(d.data.status)) unmet.push({ dep, reason: d.data.status });
  }
  return unmet;
}

/** True while children still owe work. Done and dropped children leave nothing. */
function hasOpenChildren(tickets, id) {
  return openChildren(tickets, id).length > 0;
}

/**
 * todo, every dep satisfied, and nothing left open underneath.
 *
 * A parent keeps whatever work no child holds — the wiring, the integration
 * test, the final suite — and that work runs after they close. Offering it
 * while they are open offers something that cannot be built yet, so it appears
 * the moment the last child closes.
 */
function readyTickets(tickets) {
  const index = indexById(tickets);
  return tickets.filter((t) =>
    t.data.status === 'todo' && !hasOpenChildren(tickets, t.id) && unmetDeps(t, index).length === 0
  );
}

/** todo but blocked, each with the reasons. Parents wait on children as above. */
function blockedTickets(tickets) {
  const index = indexById(tickets);
  return tickets
    .filter((t) => t.data.status === 'todo' && !hasOpenChildren(tickets, t.id))
    .map((t) => ({ ticket: t, unmet: unmetDeps(t, index) }))
    .filter((x) => x.unmet.length > 0);
}

/**
 * A ticket's own priority, or the nearest ancestor's, or `normal`.
 *
 * Marking one parent high lifts a whole feature without touching a single
 * child, which is the case that makes the field worth having at all. An
 * explicit value always wins over an inherited one, so a low chore under a high
 * feature stays low. The walk goes the whole chain rather than one level: a
 * grandchild belongs to the feature as much as a child does. `seen` only
 * matters for a hand-edited parent cycle — `ticket edit` refuses to make one.
 */
function effectivePriority(ticket, index) {
  const seen = new Set();
  let t = ticket;
  while (t && !seen.has(t.id)) {
    if (t.data.priority) return t.data.priority;
    seen.add(t.id);
    t = t.data.parent ? index.get(t.data.parent) : null;
  }
  return 'normal';
}

// Both sorts are stable and every list starts in id order, so tickets that tie
// stay oldest-first — which is the direction stale work should drift when a
// ceiling hides the tail of the list.
const rank = (list, pool) => {
  const index = indexById(pool || list);
  return [...list].sort((a, b) =>
    PRIORITY_RANK[effectivePriority(a, index)] - PRIORITY_RANK[effectivePriority(b, index)]);
};

/** Status first, then priority — for the views that hold more than one status. */
const rankByStatus = (list, pool) => {
  const index = indexById(pool || list);
  return [...list].sort((a, b) =>
    (STATUS_RANK[a.data.status] ?? 99) - (STATUS_RANK[b.data.status] ?? 99) ||
    PRIORITY_RANK[effectivePriority(a, index)] - PRIORITY_RANK[effectivePriority(b, index)]);
};

function dependents(tickets, id) {
  return tickets.filter((t) => t.data.deps.includes(id));
}

/**
 * Everything that would go stale if `id` died — dependents, their dependents,
 * and so on. `deps` is stored on one side only, so the damage from a drop lands
 * entirely on tickets the user was not thinking about. Showing only the direct
 * layer would hide t070 behind t060 behind t047.
 *
 * Repairable statuses only, and returned nearest-first so the printed list
 * reads outward from the ticket being dropped.
 */
function transitiveDependents(tickets, id) {
  const seen = new Set([id]);
  const found = [];
  let frontier = [id];

  while (frontier.length) {
    const next = [];
    for (const current of frontier) {
      for (const d of dependents(tickets, current)) {
        if (seen.has(d.id) || !LIVE.has(d.data.status)) continue;
        seen.add(d.id);
        found.push(d);
        next.push(d.id);
      }
    }
    frontier = next;
  }
  return found;
}

/** Tickets split out of `id`. The hierarchy is frontmatter; disk stays flat. */
function children(tickets, id) {
  return tickets.filter((t) => t.data.parent === id);
}

/** Children that still owe work — what makes a parent refuse to close. */
function openChildren(tickets, id) {
  return children(tickets, id).filter((t) => OPEN.has(t.data.status));
}

/** Children, their children, and so on — what `flow tree --parent` keeps. */
function descendants(tickets, id) {
  const found = [];
  const seen = new Set([id]);
  let frontier = [id];
  while (frontier.length) {
    const next = [];
    for (const current of frontier) {
      for (const c of children(tickets, current)) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        found.push(c);
        next.push(c.id);
      }
    }
    frontier = next;
  }
  return found;
}

/**
 * The parent forest — roots first, each node carrying its children.
 *
 * Ordering here is structural, and that is the whole difference between this
 * and `flow next`: that list is flat and priority is its only key, so a high
 * child outranks its own parent. A tree cannot do that without lying about the
 * shape, so nesting wins and priority only orders siblings and roots.
 *
 * Deps are not drawn. They cross the tree — a ticket can depend on anything,
 * anywhere — so they surface as a note on the blocked ticket instead.
 */
function forest(tickets) {
  const pool = new Set(tickets.map((t) => t.id));
  const kids = new Map();
  const roots = [];

  for (const t of tickets) {
    const parent = t.data.parent;
    // A parent filtered out of the pool cannot hold this ticket, so it roots
    // where it is rather than disappearing along with its parent.
    if (parent && parent !== t.id && pool.has(parent)) {
      if (!kids.has(parent)) kids.set(parent, []);
      kids.get(parent).push(t);
    } else {
      roots.push(t);
    }
  }

  const node = (t, seen) => {
    if (seen.has(t.id)) return { ticket: t, children: [] };
    const next = new Set(seen).add(t.id);
    return { ticket: t, children: rank(kids.get(t.id) || [], tickets).map((c) => node(c, next)) };
  };
  return rank(roots, tickets).map((r) => node(r, new Set()));
}

/** Would setting `parent` on `ticket` make it its own ancestor? */
function wouldOrphan(tickets, ticketId, parentId) {
  const index = indexById(tickets);
  const seen = new Set();
  let current = parentId;
  while (current) {
    if (current === ticketId) return true;
    if (seen.has(current)) return false;
    seen.add(current);
    const t = index.get(current);
    current = t ? t.data.parent : '';
  }
  return false;
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
  const danglingParents = [];

  for (const t of tickets) {
    if (!LIVE.has(t.data.status)) continue;
    for (const dep of t.data.deps) {
      const d = index.get(dep);
      if (!d) { dangling.push({ ticket: t, dep }); continue; }
      if (d.data.status === 'dropped') droppedBlockers.push({ ticket: t, dep });
    }
    if (t.data.parent && !index.get(t.data.parent)) danglingParents.push({ ticket: t, parent: t.data.parent });
  }

  return { cycles: findCycles(tickets), dangling, droppedBlockers, danglingParents };
}

const hasProblems = (p) =>
  p.cycles.length + p.dangling.length + p.droppedBlockers.length + p.danglingParents.length > 0;

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
  SATISFYING, LIVE, TERMINAL, OPEN, IN_FLIGHT, PRIORITY_RANK, STATUS_RANK,
  indexById, unmetDeps, readyTickets, blockedTickets, hasOpenChildren,
  effectivePriority, rank, rankByStatus,
  dependents, transitiveDependents, children, openChildren, descendants, forest, wouldOrphan,
  findCycles, check, hasProblems, wouldCycle,
};
