import { FlowError } from '../../shared/error.ts';
import { out, json } from '../../shared/cli.ts';
import { indent } from '../../shared/render.ts';
import * as store from './store.ts';
import * as graph from './graph.ts';
import * as render from './render.ts';
import * as ticketJson from './json.ts';
import * as statuses from './statuses.ts';
import * as records from './records.ts';
import { rel } from './places.ts';
import type { Ticket } from './types.ts';

interface Options {
  force?: any;
  reason?: string;
  verb?: string;
  batch?: boolean;
  activity?: string;
}

/**
 * A child's line in its parent's `## Tasks` follows the child's status: ticked
 * when the child reaches `done`, cleared when a `done` child is reopened.
 * Returns the line to print, or null where there is nothing to say.
 */
function followInParent(t: Ticket, tickets: Ticket[], from: string, status: string) {
  const closing = status === 'done';
  if (!t.data.parent || (!closing && from !== 'done')) return null;
  const parent = tickets.find((x) => x.id === t.data.parent);
  if (!parent) return null;

  const result = store.tickTask(parent, t.id, closing);
  if (result === 'changed') {
    store.writeTicket(parent);
    return `${closing ? 'ticked' : 'cleared'} in ${parent.id}'s ## Tasks`;
  }
  return result === 'missing' && closing ? `${parent.id} has no line for ${t.id} in its ## Tasks` : null;
}

/** A ticket already in the status it was asked to move to: only a resumed `in-progress` may change its activity. */
function stayPut(t: Ticket, root: string, status: string, activity: string | undefined, result: (fields: object) => void) {
  // A skill resuming a ticket in progress still names its kind of work.
  if (activity && status === 'in-progress' && t.data.activity !== activity) {
    const was = t.data.activity || '-';
    t.data.activity = activity;
    store.writeTicket(t);
    records.commit(root, `${t.id}: activity ${was} → ${activity}`);
    out(`${t.id} is already ${status}.\n      activity: ${was} → ${activity}`);
  } else {
    out(`${t.id} is already ${status}.`);
  }
  result({ already: true });
  return 0;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The refusals before a move: a missing reason, unmet deps, open children. Returns the unmet deps, which `--force` goes past. */
function refuseUnlessAllowed(t: Ticket, tickets: Ticket[], from: string, status: string, { force, reason, verb }: Options) {
  if (statuses.NEEDS_REASON.has(status) && !reason) {
    throw new FlowError(
      `moving ${t.id} to ${status} needs a reason:\n` +
      `  ${verb} --reason "vendor API changes land in Q3, pointless before that"\n` +
      'Open the reason with the words that matter most: a narrow list shows only the first ones.'
    );
  }

  // A ticket started under a parked group would be work `flow next` never shows.
  if (status === 'in-progress' && t.held && !force) {
    throw new FlowError(
      `${t.id} is held by the parked group ${t.held}. Bring the group back with: flow groups revive ${t.held}\n` +
      `  Or start it anyway with: ${verb} --force`
    );
  }

  const entering = (from === 'todo' || from === 'parked') && status !== 'todo' && status !== 'parked';

  // Starting a blocked ticket refuses rather than warns. A warning is a line of
  // text an agent reads past; a non-zero exit is the thing it cannot ignore.
  const unmet = entering ? graph.unmetDeps(t, graph.indexById(tickets)) : [];
  if (unmet.length && !force) {
    throw new FlowError(
      `${t.id} is blocked, deps are not satisfied:\n` +
      unmet.map((u) => `  ${render.blockText(u)}`).join('\n') +
      `\n  Clear those first, or override with: ${verb} --force`
    );
  }

  // The pair to `done` refusing on open children. A parent keeps whatever work
  // no child holds (the wiring, the final suite) and that work runs after
  // they close, so this refuses early rather than at the finish line.
  const openKids = graph.openChildren(tickets, t.id);
  const kids = openKids.map((c) => `  ${store.nameOf(c)}  ${c.data.status}`).join('\n');
  if (entering && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${plural(openKids.length, 'open child ticket')}, finish those first:\n${kids}\n  Or override with: ${verb} --force`
    );
  }

  // A parent finishing is a judgment about whether the original question got
  // answered. The children finishing is evidence, not proof, so the call stays
  // with the user and this only refuses to make it for them.
  if (status === 'done' && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${plural(openKids.length, 'open child ticket')}, its work is theirs:\n${kids}\n  Finish those, or close it anyway with: ${verb} --force`
    );
  }
  return unmet;
}

/**
 * The one place a status is written. Every verb goes through it.
 *
 * Guards are keyed to where the ticket is coming from and what it moves into:
 * a ticket leaving `todo` or `parked` for `in-progress` or `done` is being
 * picked up, so it meets both refusals. A move between `todo` and `parked`
 * starts nothing, so it meets neither: parking a blocked ticket is the point
 * of parking.
 *
 * `batch` is a move inside a larger one (a label parked whole): the caller
 * commits and sends once, so the move prints its own line and nothing else.
 */
function transition(t: Ticket, tickets: Ticket[], root: string, status: string, options: Options) {
  const { reason, batch, activity } = options;
  const from = t.data.status;
  const result = (fields: object) => json({
    ticket: ticketJson.record(t, tickets), from, to: status, already: false, revived: '', inParent: null,
    nowReady: [], nowBlocked: [], forcedPast: [], ...fields,
  });
  if (from === status) return stayPut(t, root, status, activity, result);

  const unmet = refuseUnlessAllowed(t, tickets, from, status, options);
  const before = graph.readyTickets(tickets).map((x) => x.id);
  const revived = from === 'parked' && t.data.reason;

  const { moved } = store.setStatus(t, status, reason || '', activity || '');
  const inParent = followInParent(t, tickets, from, status);
  // A status move is a checkpoint: saved on the `flow` branch now, and sent
  // in the background, so the move never waits on the network.
  if (!batch) {
    records.commit(root, `${t.id}: ${from} → ${status}`);
    records.syncLater(root);
  }
  out(`${store.nameOf(t)}  ${from} → ${status}`);
  if (t.data.reason && !batch) out(`      reason: ${t.data.reason}`);
  if (t.data.activity) out(`      activity: ${t.data.activity}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);
  if (revived && !batch) out(`      revived, cleared reason: ${revived}`);
  if (inParent) out(`      ${inParent}`);
  if (batch) return 0;

  if (unmet.length) {
    out('\nforced past unsatisfied deps:');
    for (const u of unmet) out(`  ${render.blockText(u)}`);
  }

  const ready = graph.readyTickets(tickets).map((x) => x.id);
  const unblocked = tickets.filter((x) => ready.includes(x.id) && !before.includes(x.id));
  const blocked = tickets.filter((x) => x.id !== t.id && before.includes(x.id) && !ready.includes(x.id));
  result({
    revived: revived || '', inParent,
    nowReady: unblocked.map((x) => x.id), nowBlocked: blocked.map((x) => x.id), forcedPast: unmet.map((u) => u.dep),
  });
  if (unblocked.length) {
    out('\nnow ready:');
    out(indent(render.ticketTable(unblocked)));
  }

  // The mirror. A move back down the line un-satisfies deps, so work `flow next`
  // was offering stops being workable, and the ticket that moved is not one of
  // them, since leaving `todo` drops it from the ready list on every pickup.
  if (blocked.length) {
    out('\nnow blocked:');
    out(indent(render.ticketTable(blocked)));
  }
  if (status === 'parked') out(`\nrevive with: flow tickets ${render.reviveVerb(t)} ${t.id}`);
  return 0;
}

export { transition };
