/**
 * A ticket as `--json` prints it: one record shape for every list and every
 * write, so the mod and the hooks read one thing. A list is flat, in display
 * order, each record carrying its `depth`: the nesting rules stay here in
 * `scripts/`, never redone by a reader.
 */

import * as graph from './graph.ts';
import * as store from './store.ts';
import * as groupCards from './groups.ts';
import type { Ticket, TicketList } from './types.ts';

/**
 * One ticket. `index` is `graph.indexById(tickets)`, passed by a caller printing
 * many. `status` is the effective one: `parked` while `heldBy` names the parked
 * group holding it. `groups` are its labels that are groups.
 */
function record(t: Ticket, tickets: Ticket[], index = graph.indexById(tickets)) {
  const d = t.data;
  return {
    id: t.id,
    name: store.nameOf(t),
    title: d.title,
    description: d.description,
    status: store.statusOf(t),
    heldBy: t.held || '',
    activity: d.activity,
    labels: d.labels,
    groups: groupCards.groupsOf(t, (tickets as TicketList).groups || []),
    parent: d.parent,
    deps: d.deps,
    rank: typeof d.rank === 'number' ? d.rank : null,
    reason: d.reason,
    was: d.was,
    branch: d.branch,
    closed: d.closed,
    filed: d.filed,
    path: t.file,
    progress: graph.progress(tickets, t.id),
    blockedBy: graph.unmetDeps(t, index).map((u) => ({ id: u.dep, reason: u.reason })),
  };
}

/** A forest flattened to records, top down, each with its `depth` (0 at a root). */
function list(nodes: any[], tickets: Ticket[]) {
  const index = graph.indexById(tickets);
  return graph.flatten(nodes).map(({ ticket, depth }) => ({ ...record(ticket, tickets, index), depth }));
}

/** One ticket in full, as `flow tickets get` shows it. */
function full(t: Ticket, tickets: Ticket[]) {
  const brief = (x: Ticket) => ({ id: x.id, status: x.data.status });
  return {
    ...record(t, tickets),
    dependents: graph.dependents(tickets, t.id).map(brief),
    children: graph.children(tickets, t.id).map(brief),
    questions: store.questionCount(t),
    tasks: store.taskCount(t),
    ...store.openWork(t),
    context: store.contextSections(t),
    reports: store.reportFiles(t),
    body: t.body,
  };
}

export { record, list, full };
