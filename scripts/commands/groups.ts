/**
 * Groups: a label with a card (features/tickets/groups.ts), under `flow groups`.
 * The noun typed alone lists them. `rank` places a group among the ranked ones,
 * `park` holds every open ticket carrying the label with one reason, and
 * `revive` lets them go. A group is never started, so it has no status verbs.
 *
 * A card is made on purpose alone: by its first `rank` or `park`, for a label
 * some ticket carries. Deleting the file turns the group back into a plain label.
 */

import { FlowError } from '../shared/error.ts';
import { out, json } from '../shared/cli.ts';
import { columns } from '../shared/render.ts';
import type { Action } from '../shared/cli.ts';
import * as store from '../features/tickets/store.ts';
import * as graph from '../features/tickets/graph.ts';
import * as order from '../features/tickets/rank.ts';
import * as records from '../features/tickets/records.ts';
import * as groupCards from '../features/tickets/groups.ts';
import { firstWords } from '../features/tickets/render.ts';
import { PROJECT_FLAG, loadFor, needProject } from '../features/tickets/places.ts';
import type { Group } from '../features/tickets/groups.ts';
import type { TicketList } from '../features/tickets/types.ts';

/** The label a command names, lowercased, or a refusal naming the usage. */
function labelFrom(positional: string[], usage: string) {
  const [given, ...extra] = positional;
  if (!given || extra.length) throw new FlowError(`usage: ${usage} <label>`);
  const label = given.trim().toLowerCase();
  const bad = store.badLabel(label);
  if (bad) throw new FlowError(bad);
  return label;
}

/**
 * The group `label` names, its card made in memory where none exists. A label
 * no ticket carries is refused with the labels in use, since labels are free
 * and a typo should show.
 */
function cardFor(root: string, tickets: TicketList, label: string): Group {
  const found = (tickets.groups || []).find((g) => g.label === label);
  if (found) return found;
  if (!tickets.some((t) => t.data.labels.includes(label))) {
    const used = [...new Set(tickets.flatMap((t) => t.data.labels))].sort();
    throw new FlowError(`no ticket carries ${label}, so it cannot be a group.${used.length ? ` Labels in use: ${used.join(', ')}.` : ''}`);
  }
  return groupCards.card(store.recordsDir(root), label, { title: label, rank: '', parked: '', group_by: '' });
}

/** The writable place and its tickets. */
function place() {
  const root = needProject();
  return { root, tickets: store.readTickets(root) as TicketList };
}

/** One group as `--json` prints it. */
const groupJson = (g: Group, tickets: TicketList) => ({
  label: g.label,
  title: g.data.title,
  rank: typeof g.data.rank === 'number' ? g.data.rank : null,
  parked: g.data.parked,
  groupBy: g.data.group_by,
  builtIn: g.builtIn,
  progress: graph.groupProgress(tickets, g.label),
  held: tickets.filter((t) => t.held === g.label).map((t) => t.id),
  path: g.builtIn ? '' : g.file,
});

/** Ranked groups in rank order, then the unranked by label. */
const ordered = (groups: Group[]) => [...groupCards.ranked(groups), ...groups.filter((g) => !groupCards.hasRank(g))];

/**
 * `flow groups`: every group with an open ticket, its done count, and a parked
 * one's hold and reason. A group with nothing open hides, and returns when a
 * ticket arrives, since a group is never declared finished.
 */
const listing: Action = {
  summary: 'list the groups with open tickets: ranked first, each with its done count, a parked one with its reason',
  flags: { project: PROJECT_FLAG },
  run({ flags }) {
    const { tickets } = loadFor(flags);
    const open = (g: Group) => tickets.some((t) => t.data.labels.includes(g.label) && graph.OPEN.has(t.data.status));
    const groups = ordered(((tickets as TicketList).groups || []).filter(open));
    const rows = groups.map((g) => {
      const p = graph.groupProgress(tickets, g.label);
      const held = tickets.filter((t) => t.held === g.label).length;
      const note = g.data.parked ? `parked, ${held} held, ${firstWords(g.data.parked)}` : groupCards.hasRank(g) ? '' : 'unranked';
      return [g.label, `${p.done}/${p.total}`, note];
    });
    out(rows.length ? columns(rows) : 'no groups.');
    json({ groups: groups.map((g) => groupJson(g, tickets as TicketList)) });
    return 0;
  },
};

const actions: Record<string, Action> = {};

/** `--before <label>`, `--after <label>`, `--first` or `--last`, as `rank.place` takes it. */
function positionFrom(flags: Record<string, any>) {
  const given = ['before', 'after', 'first', 'last'].filter((name) => flags[name]);
  if (given.length > 1) throw new FlowError(`give one place, not ${given.map((name) => `--${name}`).join(' and ')}.`);
  if (!given.length) throw new FlowError('say where: --before <label>, --after <label>, --first or --last.');
  const [name] = given;
  return { [name]: name === 'before' || name === 'after' ? String(flags[name]).trim().toLowerCase() : true };
}

const describe = (target) =>
  target.before ? `before ${target.before}` : target.after ? `after ${target.after}` : target.first ? 'first' : 'last';

/**
 * Places a group among the ranked groups, as `flow tickets rank` places a
 * ticket among its siblings. Only ranked groups are neighbours: numbering
 * every card on the first move would rank `flow-issue` and every parked group.
 */
actions.rank = {
  args: '<label>',
  summary: 'put a group before or after another, or first or last; makes its card',
  flags: { before: { arg: '<label>' }, after: { arg: '<label>' }, first: { bool: true }, last: { bool: true } },
  run({ positional, flags, usage }) {
    const label = labelFrom(positional, usage);
    const target = positionFrom(flags);
    const { root, tickets } = place();
    const g = cardFor(root, tickets, label);
    const siblings = groupCards.ranked(tickets.groups || []);
    const beside = target.before || target.after;
    if (beside === label) throw new FlowError(`${label} cannot go beside itself.`);
    if (beside && !siblings.some((s) => s.label === beside)) {
      throw new FlowError(`${beside} is no ranked group. Ranked: ${siblings.map((s) => s.label).join(', ') || 'none yet, so use --first'}.`);
    }

    const placed = order.place(siblings as any[], g as any, target);
    g.data.rank = placed.rank;
    groupCards.writeGroup(g);
    for (const other of placed.others as any[]) {
      other.ticket.data.rank = other.rank;
      groupCards.writeGroup(other.ticket);
    }
    records.commit(root, `group ${label}: ranked ${describe(target)}`);
    records.syncLater(root);
    out(`${label}  ${describe(target)}`);
    json({ group: groupJson(g, tickets), position: describe(target), renumbered: placed.others.length });
    return 0;
  },
};

/**
 * Holds every open ticket carrying the label, with the reason written once on
 * the card. No ticket file changes. An in-progress ticket is held too, and
 * listed, since its work stops showing in `flow next`.
 */
actions.park = {
  args: '<label>',
  summary: 'hold every open ticket with the label, one reason on the card; makes its card',
  flags: { reason: { required: true, arg: '"<why>"', missing: 'parking needs a reason: in six months it is the only thing that explains the group.' } },
  run({ positional, flags, usage }) {
    const label = labelFrom(positional, usage);
    const reason = String(flags.reason).trim();
    if (!reason) throw new FlowError('parking needs a reason: --reason "<why>".');
    const { root, tickets } = place();
    const g = cardFor(root, tickets, label);
    const was = g.data.parked;
    g.data.parked = reason;
    groupCards.writeGroup(g);

    const held = tickets.filter((t) => t.data.labels.includes(label) && (t.data.status === 'todo' || t.data.status === 'in-progress'));
    const working = held.filter((t) => t.data.status === 'in-progress');
    records.commit(root, `group ${label}: parked, ${held.length} held`);
    records.syncLater(root);

    out(`${label} parked, holding ${held.length} ticket${held.length === 1 ? '' : 's'}`);
    out(`      reason: ${reason}`);
    if (was && was !== reason) out(`      replaced reason: ${was}`);
    if (working.length) {
      out('\nin progress, now held:');
      for (const t of working) out(`  ${store.nameOf(t)}`);
    }
    out(`\nrevive with: flow groups revive ${label}`);
    json({ group: groupJson(g, tickets), held: held.map((t) => t.id), inProgress: working.map((t) => t.id), replaced: was && was !== reason ? was : '' });
    return 0;
  },
};

/** Lets the group's tickets go: the card changes, and each ticket is back at its stored status. */
actions.revive = {
  args: '<label>',
  summary: 'let a parked group go: its tickets show again where they stopped',
  run({ positional, usage }) {
    const label = labelFrom(positional, usage);
    const { root, tickets } = place();
    const g = (tickets.groups || []).find((x) => x.label === label);
    if (!g || !g.data.parked) {
      const parked = (tickets.groups || []).filter((x) => x.data.parked).map((x) => x.label);
      throw new FlowError(`${label} is no parked group.${parked.length ? ` Parked: ${parked.join(', ')}.` : ''}`);
    }
    const freed = tickets.filter((t) => t.held === label);
    const reason = g.data.parked;
    g.data.parked = '';
    groupCards.writeGroup(g);
    records.commit(root, `group ${label}: revived, ${freed.length} back`);
    records.syncLater(root);

    // A ticket another parked group holds stays held.
    const still = store.readTickets(root).filter((t) => t.held && freed.some((f) => f.id === t.id));
    out(`${label} revived, ${freed.length - still.length} ticket${freed.length - still.length === 1 ? '' : 's'} back`);
    out(`      cleared reason: ${reason}`);
    for (const t of still) out(`      ${t.id} is still held by ${t.held}`);
    json({ group: groupJson(g, store.readTickets(root) as TicketList), freed: freed.filter((t) => !still.some((s) => s.id === t.id)).map((t) => t.id), stillHeld: still.map((t) => ({ id: t.id, by: t.held })) });
    return 0;
  },
};

export default {
  summary: 'groups: a label with a card, ranked and parked as one',
  list: listing,
  actions,
};
