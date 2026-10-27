/**
 * The relational queries. Two edges exist on a ticket: `deps` (what must be
 * finished first) and `parent` (what this was split out of), so every question
 * here (what is workable, what is broken, what would a drop damage) is a walk
 * over one of them.
 *
 * A dep is satisfied by `done` alone.
 */

// Every property of a status is a column in one table: see statuses.ts. These
// are that table's columns, read as sets: SATISFYING unblocks a dependent, LIVE
// is still repairable, OPEN still owes work, IN_FLIGHT is being worked on now.
import * as statuses from './statuses.ts';
const { SATISFYING, LIVE, TERMINAL, OPEN, IN_FLIGHT, NAMES } = statuses;
const STATUS_RANK = statuses.RANK;
import * as order from './rank.ts';
import * as store from './store.ts';
import * as groupCards from './groups.ts';
import type { Group } from './groups.ts';
import type { Ticket, TicketList } from './types.ts';

const { statusOf } = store;

type Index = Map<string, Ticket>;

/** A ticket and what sits under it. */
interface Node {
  ticket: Ticket;
  children: Node[];
}

const indexById = (tickets: Ticket[]): Index => new Map(tickets.map((t) => [t.id, t]));

/**
 * Why a ticket cannot start yet. Empty array = every dep is satisfied.
 * Each entry: { dep, reason }, reason is 'missing', 'dropped', or the
 * blocking ticket's status.
 */
function unmetDeps(ticket: Ticket, index: Index) {
  const unmet: { dep: string; reason: string }[] = [];
  for (const dep of ticket.data.deps) {
    const d = index.get(dep);
    if (!d) { unmet.push({ dep, reason: 'missing' }); continue; }
    if (d.data.status === 'dropped') { unmet.push({ dep, reason: 'dropped' }); continue; }
    if (!SATISFYING.has(d.data.status)) unmet.push({ dep, reason: d.data.status });
  }
  return unmet;
}

/** True while children still owe work. Done and dropped children leave nothing. */
function hasOpenChildren(tickets: Ticket[], id: string) {
  return openChildren(tickets, id).length > 0;
}

/**
 * todo, every dep satisfied, and nothing left open underneath.
 *
 * A parent keeps whatever work no child holds: the wiring, the integration
 * test, the final suite, and that work runs after they close. Offering it
 * while they are open offers something that cannot be built yet, so it appears
 * the moment the last child closes.
 */
function readyTickets(tickets: Ticket[]) {
  const index = indexById(tickets);
  return tickets.filter((t) =>
    statusOf(t) === 'todo' && !hasOpenChildren(tickets, t.id) && unmetDeps(t, index).length === 0
  );
}

/** todo but blocked, each with the reasons. Parents wait on children as above. */
function blockedTickets(tickets: Ticket[]) {
  const index = indexById(tickets);
  return tickets
    .filter((t) => statusOf(t) === 'todo' && !hasOpenChildren(tickets, t.id))
    .map((t) => ({ ticket: t, unmet: unmetDeps(t, index) }))
    .filter((x) => x.unmet.length > 0);
}

/**
 * Tickets in board order: see `rank.ts`. `pool` is the full ticket set when
 * `list` is a filtered slice of it, so a parent outside the slice still places
 * its children. Tickets without a rank follow by id, which is the direction
 * stale work should drift when a ceiling hides the tail of the list.
 */
const rank = (list: Ticket[], pool?: Ticket[]) => {
  const index = indexById(pool || list);
  return [...list].sort((a, b) => order.compareOrder(a, b, index));
};

/** Status first, then board order, for the views that hold more than one status. */
const rankByStatus = (list: Ticket[], pool?: Ticket[]) => {
  const index = indexById(pool || list);
  return [...list].sort((a, b) =>
    (STATUS_RANK[statusOf(a)] ?? 99) - (STATUS_RANK[statusOf(b)] ?? 99) ||
    order.compareOrder(a, b, index));
};

/**
 * The ticket that finished most recently. `closed` is the only field that can
 * answer it: ids are creation order, and `filed` is stamped days later.
 * Sorts as a string because `YYYY-MM-DD HH:MM` already sorts chronologically.
 */
function lastClosed(tickets: Ticket[]) {
  const closed = tickets.filter((t) => TERMINAL.has(t.data.status) && t.data.closed);
  if (!closed.length) return null;
  // `>=` on a tie: the list is in id order, so two tickets closed in the same
  // minute resolve to the later one, which is the likelier answer.
  return closed.reduce((best, t) => (t.data.closed >= best.data.closed ? t : best));
}

function dependents(tickets: Ticket[], id: string) {
  return tickets.filter((t) => t.data.deps.includes(id));
}

/**
 * Everything that would go stale if `id` died: dependents, their dependents,
 * and so on. `deps` is stored on one side only, so the damage from a drop lands
 * entirely on tickets the user was not thinking about. Showing only the direct
 * layer would hide t070 behind t060 behind t047.
 *
 * Repairable statuses only, and returned nearest-first so the printed list
 * reads outward from the ticket being dropped.
 */
function transitiveDependents(tickets: Ticket[], id: string) {
  const seen = new Set([id]);
  const found: Ticket[] = [];
  let frontier = [id];

  while (frontier.length) {
    const next: string[] = [];
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
function children(tickets: Ticket[], id: string) {
  return tickets.filter((t) => t.data.parent === id);
}

/** Children that still owe work: what makes a parent refuse to close. */
function openChildren(tickets: Ticket[], id: string) {
  return children(tickets, id).filter((t) => OPEN.has(t.data.status));
}

/**
 * How many of a parent's children are done, of all of them, or null for a
 * ticket with none. Counted against every ticket, never a visible slice: a
 * parent whose children are all done still reads 3/3 once they are hidden.
 */
function progress(tickets: Ticket[], id: string) {
  const kids = children(tickets, id);
  return kids.length ? { done: kids.filter((k) => k.data.status === 'done').length, total: kids.length } : null;
}

/** True when `id` is the parent of `t`, or its parent's parent, and so on. Cycle-safe. */
function isUnder(t: Ticket, id: string, index: Index) {
  const seen = new Set<string>();
  let current: string | undefined = t.data.parent;
  while (current && !seen.has(current)) {
    if (current === id) return true;
    seen.add(current);
    current = index.get(current)?.data.parent;
  }
  return false;
}

/**
 * The parent forest: roots first, each node carrying its children.
 *
 * Ordering is structural: nesting wins, and among siblings and roots work
 * started comes before work new, then rank (`rankByStatus`).
 *
 * Deps are not drawn. They cross the tree: a ticket can depend on anything,
 * anywhere, so they surface as a note on the blocked ticket instead.
 */
function forest(tickets: Ticket[]): Node[] {
  const pool = new Set(tickets.map((t) => t.id));
  const kids = new Map<string, Ticket[]>();
  const roots: Ticket[] = [];

  for (const t of tickets) {
    const parent = t.data.parent;
    // A parent filtered out of the pool cannot hold this ticket, so it roots
    // where it is rather than disappearing along with its parent.
    if (parent && parent !== t.id && pool.has(parent)) {
      kids.set(parent, [...(kids.get(parent) ?? []), t]);
    } else {
      roots.push(t);
    }
  }

  const node = (t: Ticket, seen: Set<string>): Node => {
    if (seen.has(t.id)) return { ticket: t, children: [] };
    const next = new Set(seen).add(t.id);
    return { ticket: t, children: rankByStatus(kids.get(t.id) || [], tickets).map((c) => node(c, next)) };
  };
  return rankByStatus(roots, tickets).map((r) => node(r, new Set()));
}

/** The forest in display order, top down: one `{ ticket, depth }` per ticket, 0 at a root. */
function flatten(nodes: Node[], depth = 0): { ticket: Ticket; depth: number }[] {
  return nodes.flatMap((n) => [{ ticket: n.ticket, depth }, ...flatten(n.children, depth + 1)]);
}

/**
 * The ranked group a ticket is listed under, or null: the first ranked group,
 * not parked, among its top ancestor's labels. A parent in a group takes its
 * children with it, and a child stays where its parent sits.
 */
function placer(tickets: Ticket[], groups: Group[] = (tickets as TicketList).groups || []) {
  const index = indexById(tickets);
  const order = groupCards.ranked(groups).filter((g) => !g.data.parked);
  return (t: Ticket): Group | null => {
    const seen = new Set<string>();
    let top = t;
    for (let up = index.get(top.data.parent); up && !seen.has(up.id); up = index.get(top.data.parent)) {
      seen.add(up.id);
      top = up;
    }
    return order.find((g) => top.data.labels.includes(g.label)) || null;
  };
}

/** `list` with each ranked group's tickets moved to the top, in group order. The order inside a group, and among the rest, stays. */
function byPlacement(list: Ticket[], place: (t: Ticket) => Group | null) {
  const at = (t: Ticket) => {
    const g = place(t);
    return g ? (g.data.rank as number) : Infinity;
  };
  return list.map((t, i) => ({ t, i, at: at(t) })).sort((a, b) => a.at - b.at || a.i - b.i).map((x) => x.t);
}

/** How many tickets carry the label, done of all, dropped ones left out. */
function groupProgress(tickets: Ticket[], label: string) {
  const members = tickets.filter((t) => t.data.labels.includes(label) && t.data.status !== 'dropped');
  return { done: members.filter((t) => t.data.status === 'done').length, total: members.length };
}

/** Each parked group holding at least one ticket, with how many. */
function holds(tickets: Ticket[], groups: Group[] = (tickets as TicketList).groups || []) {
  return groups
    .filter((g) => g.data.parked)
    .map((g) => ({ group: g, held: tickets.filter((t) => t.held === g.label) }))
    .filter((h) => h.held.length);
}

/**
 * What `flow next` shows, before any text is drawn.
 *
 * The tree is the work started: every in-progress ticket, and under it every
 * child still todo or in progress, to any depth. A parked or closed child
 * stops the walk, since nothing under it is being worked. `take` is the first
 * ticket in the tree that can be started, top down, so open work beats new;
 * failing that, the first ready ticket. The ready list is every ready ticket
 * outside the tree, each ranked group's first, then rank order, whole: the
 * text cuts its rows. A held ticket reads as parked, so it is in neither.
 */
function nextView(tickets: Ticket[]) {
  const pool = new Map<string, Ticket>();
  const walk = (t: Ticket) => {
    if (pool.has(t.id)) return;
    pool.set(t.id, t);
    for (const c of children(tickets, t.id)) if (statusOf(c) === 'todo' || IN_FLIGHT.has(statusOf(c))) walk(c);
  };
  for (const t of tickets) if (IN_FLIGHT.has(statusOf(t))) walk(t);

  const tree = forest([...pool.values()]);
  const ready = readyTickets(tickets);
  const readyIds = new Set(ready.map((t) => t.id));
  const place = placer(tickets);
  const outside = byPlacement(rank(ready.filter((t) => !pool.has(t.id)), tickets), place);
  const take = flatten(tree).find(({ ticket }) => readyIds.has(ticket.id))?.ticket || outside[0] || null;

  return {
    lastClosed: lastClosed(tickets),
    tree,
    ready: outside,
    place,
    take,
    blocked: tree.length || outside.length ? [] : blockedTickets(tickets),
    parked: tickets.filter((t) => t.data.status === 'parked').length,
    holds: holds(tickets),
    problems: hasProblems(check(tickets)),
  };
}

/** Would setting `parent` on `ticket` make it its own ancestor? */
function wouldOrphan(tickets: Ticket[], ticketId: string, parentId: string) {
  const index = indexById(tickets);
  const seen = new Set<string>();
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
function findCycles(tickets: Ticket[]) {
  const index = indexById(tickets);
  const state = new Map<string, 'open' | 'closed'>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  function visit(id: string) {
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
 * Integrity problems worth acting on. Only live tickets are reported: a done
 * ticket that once depended on a dropped one is history, not a problem.
 */
function check(tickets: Ticket[]) {
  const index = indexById(tickets);
  const dangling: { ticket: Ticket; dep: string }[] = [];
  const droppedBlockers: { ticket: Ticket; dep: string }[] = [];
  const danglingParents: { ticket: Ticket; parent: string }[] = [];
  const closedParents: { ticket: Ticket; parent: Ticket }[] = [];
  const unknownStatuses: Ticket[] = [];
  const unnamed: Ticket[] = [];

  for (const t of tickets) {
    if (!t.data.description || store.badTitle(t.data.title)) unnamed.push(t);

    // Nothing refuses a status written by hand, and a misspelt one matches no
    // column in statuses.ts: the ticket drops out of every set, so it is never
    // ready, never in flight, and never reported below.
    if (!NAMES.includes(t.data.status)) unknownStatuses.push(t);

    // Parent problems are judged over OPEN: a ticket that still owes work with
    // a broken parent above it is a problem.
    if (OPEN.has(t.data.status) && t.data.parent) {
      const parent = index.get(t.data.parent);
      if (!parent) danglingParents.push({ ticket: t, parent: t.data.parent });
      // Closing a parent with `--force` leaves its open children behind. Nothing
      // recorded the override before this: the parent said its work belonged to
      // them, then finished without them, and `flow tickets` nests live work under
      // an archived ticket. Readiness never consults a parent, so nothing is
      // lost: only the claim, which is what this reports.
      else if (TERMINAL.has(parent.data.status)) closedParents.push({ ticket: t, parent });
    }

    if (!LIVE.has(t.data.status)) continue;
    for (const dep of t.data.deps) {
      const d = index.get(dep);
      if (!d) { dangling.push({ ticket: t, dep }); continue; }
      if (d.data.status === 'dropped') droppedBlockers.push({ ticket: t, dep });
    }
  }

  return { cycles: findCycles(tickets), dangling, droppedBlockers, danglingParents, closedParents, unknownStatuses, unnamed };
}

const hasProblems = (p: ReturnType<typeof check>) =>
  p.cycles.length + p.dangling.length + p.droppedBlockers.length +
  p.danglingParents.length + p.closedParents.length + p.unknownStatuses.length + p.unnamed.length > 0;

/** Would adding `dep` to `ticket` close a loop? */
function wouldCycle(tickets: Ticket[], ticketId: string, dep: string) {
  const index = indexById(tickets);
  const seen = new Set<string>();
  const walk = (id: string): boolean => {
    if (id === ticketId) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    const t = index.get(id);
    return t ? t.data.deps.some(walk) : false;
  };
  return walk(dep);
}

export type { Node };
export { SATISFYING, LIVE, TERMINAL, OPEN, IN_FLIGHT, STATUS_RANK, indexById, unmetDeps, readyTickets, blockedTickets, hasOpenChildren, rank, rankByStatus, lastClosed, placer, byPlacement, groupProgress, holds, nextView, dependents, transitiveDependents, children, openChildren, progress, isUnder, forest, flatten, wouldOrphan, findCycles, check, hasProblems, wouldCycle };
