/** The `flow tickets` actions that only read: the listing, `labels`, `check` and `get`. */

import { FlowError } from '../../shared/error.ts';
import { out, json } from '../../shared/cli.ts';
import type { Action } from '../../shared/cli.ts';
import * as store from './store.ts';
import * as graph from './graph.ts';
import * as render from './render.ts';
import * as ticketJson from './json.ts';
import * as statuses from './statuses.ts';
import { PROJECT_FLAG, placeLine, load, loadFor, loadAll, locate } from './places.ts';
import { select, hiddenNote, wantsIssues } from './select.ts';
import type { Ticket, TicketList } from './types.ts';

// `flow tickets labels` lists the tickets themselves up to this many, so one call reaches the leaf.
const LIST_UP_TO = 10;

/**
 * `flow tickets`, typed alone or with a query: the open tickets, each child
 * under its parent to any depth. A child whose parent the query left out
 * roots where it is, its row naming the parent. `--flat` prints the table.
 */
const listing: Action = {
  summary: 'list open tickets as a tree; a query like "label:ui,api status:all budget" narrows it',
  args: '[-- "<query>"]',
  query: true,
  flags: { project: PROJECT_FLAG, flat: { bool: true } },
  run({ query: text, flags }) {
    const across = flags.project === undefined && wantsIssues(text);
    const { tickets, places } = (across ? loadAll() : loadFor(flags)) as { tickets: Ticket[]; places?: { root: string; tickets: Ticket[] }[] };
    const { list, hidden, parked, held } = select(tickets, text);
    const draw = (shown, cards) => (flags.flat
      ? render.ticketTable(graph.rankByStatus(shown, tickets))
      : render.listing(shown, tickets, held, cards));

    // Issues across projects print one group per project; any other listing is the one group loadFor headed.
    const groups = places ? places.map(({ root }) => list.filter((t) => t.root === root)) : [list];
    groups.forEach((shown, i) => {
      if (places) out(`${i ? '\n' : ''}${placeLine(places[i].root)}`);
      out(draw(shown, places ? (places[i].tickets as TicketList).groups : (tickets as TicketList).groups));
    });
    const note = hiddenNote(hidden, parked);
    if (list.length) out(`\n${list.length} of ${tickets.length}${note ? `, ${note}` : ''}.`);
    else if (note) out(note);

    json({
      tickets: groups.flatMap((shown) => ticketJson.list(graph.forest(shown), tickets)),
      total: tickets.length,
      hidden,
      parked,
      held: held.length,
    });
    return 0;
  },
};

/**
 * The labels on the tickets a query names, to narrow by: each other label with
 * how many of them carry it. A set small enough to read is listed whole.
 */
const labels: Action = {
  summary: 'the labels on the tickets a query names, with counts; the tickets too when 10 or fewer',
  args: '[-- "<query>"]',
  query: true,
  run({ query: text }) {
    const { tickets } = wantsIssues(text) ? loadAll() : load();
    const { terms, list, hidden, parked: alone, held } = select(tickets, text);
    // A held ticket counts as parked here: this view has no row to show its group on.
    const parked = alone + held.length;
    const asked = new Set(terms.filter((t) => t.field === 'label').flatMap((t) => t.values));
    const counts = new Map();
    for (const t of list) for (const label of t.data.labels) if (!asked.has(label)) counts.set(label, (counts.get(label) || 0) + 1);
    const open = list.filter((t) => !statuses.TERMINAL.has(t.data.status)).length;

    const note = hiddenNote(hidden, parked);
    const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const listed = list.length > LIST_UP_TO ? null : graph.rankByStatus(list, tickets);
    json({
      tickets: list.length, open, hidden, parked,
      labels: ranked.map(([label, count]) => ({ label, count })),
      list: listed && listed.map((t) => ticketJson.record(t, tickets)),
    });

    out(`${list.length} ticket${list.length === 1 ? '' : 's'}, ${open} open${note ? `, ${note}` : ''}`);
    if (ranked.length) out(`more labels: ${ranked.map(([label, n]) => `${label} ${n}`).join(', ')}`);
    if (!listed) {
      out(`add a label: term to see the tickets (up to ${LIST_UP_TO} are listed).`);
      return 0;
    }
    const width = Math.max(0, ...list.map((t) => t.id.length));
    for (const t of listed) out(`${t.id.padEnd(width)}  ${t.data.status.padEnd(11)}  ${t.data.title}`);
    return 0;
  },
};

const check: Action = {
  summary: 'cycles, dangling ids, dropped blockers, orphaned parents, unknown statuses',
  run() {
    const problems = graph.check(load().tickets);
    out(render.checkReport(problems));
    json({
      ok: !graph.hasProblems(problems),
      cycles: problems.cycles,
      dangling: problems.dangling.map((d) => ({ id: d.ticket.id, dep: d.dep })),
      droppedBlockers: problems.droppedBlockers.map((d) => ({ id: d.ticket.id, dep: d.dep })),
      danglingParents: problems.danglingParents.map((d) => ({ id: d.ticket.id, parent: d.parent })),
      closedParents: problems.closedParents.map((d) => ({ id: d.ticket.id, parent: d.parent.id, parentStatus: d.parent.data.status })),
      unknownStatuses: problems.unknownStatuses.map((t) => ({ id: t.id, status: t.data.status })),
      unnamed: problems.unnamed.map((t) => t.id),
    });
    return graph.hasProblems(problems) ? 1 : 0;
  },
};

/** The ref must be or hold an id, since a title word would otherwise find a ticket. */
function demandId(ref: string): void {
  if (!/^\d+$/.test(ref) && !store.idOfRef(ref)) {
    throw new FlowError(`"${ref}" is no ticket id. Find one by its words with flow tickets -- "${ref}".`);
  }
}

/**
 * `flow tickets get a b c`: each ticket in full. An id with no ticket is listed
 * under `missing` and does not stop the rest, so a reader holding many ids (the
 * mod's band, at the end of a turn) reads them all in one process.
 */
function getMany(refs: string[]): number {
  const found: { root: string; tickets: Ticket[]; t: Ticket }[] = [];
  const missing: string[] = [];
  for (const ref of refs) {
    demandId(ref);
    try {
      found.push(locate(ref));
    } catch {
      missing.push(ref);
    }
  }
  out(found.map(({ t, tickets, root }) => render.show(t, tickets, root)).join('\n\n'));
  if (missing.length) out(`\nno ticket: ${missing.join(', ')}`);
  json({ tickets: found.map(({ t, tickets }) => ticketJson.full(t, tickets)), missing });
  return 0;
}

/** `flow tickets -- "<words>"` finds a ticket by its words. */
const get: Action = {
  args: '<id>...',
  summary: 'one ticket in full; several ids print each, with --json as {tickets, missing}',
  run({ positional, usage }) {
    const [ref, ...more] = positional;
    if (!ref) throw new FlowError(`usage: ${usage} <id>, such as ${usage} exp-47. The board is flow next.`);
    if (more.length) return getMany(positional);
    demandId(ref);

    const { root, tickets, t } = locate(ref);
    out(render.show(t, tickets, root));
    json(ticketJson.full(t, tickets));
    return 0;
  },
};

export { listing, labels, check, get };
