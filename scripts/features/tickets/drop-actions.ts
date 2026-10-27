import path from 'node:path';
import { FlowError } from '../../shared/error.ts';
import { out, json, listOf } from '../../shared/cli.ts';
import type { Action } from '../../shared/cli.ts';
import * as store from './store.ts';
import * as graph from './graph.ts';
import * as ticketJson from './json.ts';
import * as statuses from './statuses.ts';
import * as records from './records.ts';
import { touched, rel, locate, projectNamed } from './places.ts';
import type { Ticket } from './types.ts';

/**
 * The ticket `--by` names to take over a dropped ticket's dependents, or a
 * refusal: it must exist, differ from the dropped one, be live, and close no
 * dependency cycle with the dependents it takes.
 */
function replacementFor(t: Ticket, tickets: Ticket[] & { prefix: string }, value): Ticket {
  const byId = store.requireId(value, tickets.prefix);
  if (byId === t.id) throw new FlowError(`${t.id} cannot replace itself.`);
  const found = tickets.find((x) => x.id === byId);
  if (!found) throw new FlowError(`--by names ${byId}, which does not exist.`);

  // A dropped replacement blocks every dependent forever, which is the
  // exact harm --by exists to prevent. `done` is fine: the edge is
  // satisfied on arrival, so it costs nothing beyond a line of frontmatter.
  if (found.data.status === 'dropped') {
    throw new FlowError(
      `--by names ${found.id}, which is itself dropped: those dependents could never become ready.\n` +
      '  Pick a live replacement, or drop them too with --force.'
    );
  }

  // `dep` refuses an edge that would close a loop. --by writes the same
  // kind of edge, checked before the drop is written, because a refusal
  // after it would leave the graph half-edited.
  const loops = graph.dependents(tickets, t.id).filter((d) =>
    statuses.LIVE.has(d.data.status) && d.id !== found.id && graph.wouldCycle(tickets, d.id, found.id)
  );
  if (loops.length) {
    throw new FlowError(
      `re-pointing at ${found.id} would close a dependency cycle:\n` +
      loops.map((d) => `  ${d.id} → ${found.id} → … → ${d.id}`).join('\n') +
      '\n  Pick a different replacement, or drop them too with --force.'
    );
  }
  return found;
}

/** Points every live direct dependent of `t` at `replacement` instead. Returns the ones it rewrote. */
function repoint(t: Ticket, tickets: Ticket[], replacement: Ticket) {
  const repointed: Ticket[] = [];
  for (const d of graph.dependents(tickets, t.id)) {
    if (!statuses.LIVE.has(d.data.status)) continue;
    const kept = d.data.deps.filter((x) => x !== t.id);
    d.data.deps = [...new Set([...kept, ...(replacement.id === d.id ? [] : [replacement.id])])];
    store.writeTicket(d);
    repointed.push(d);
  }
  return repointed;
}

/**
 * Dropping is the one destructive edit here, and its damage lands on tickets
 * the user was not thinking about: `deps` is stored on one side only, so
 * killing t047 silently strands whatever depended on it. Bare `drop` therefore
 * refuses while live dependents exist and prints the whole chain first.
 *
 * It is the one status with no verb, for that repair. `flow dropped t047` would
 * be a verb that had to do something no other verb does.
 */
const drop: Action = {
  args: '<id>',
  summary: 'kill it, and repair what depended on it',
  flags: {
    reason: { required: true, arg: '"<why>"', missing: 'dropping needs --reason "<why>".' },
    by: { arg: '<id>' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --reason "<why>"`);
    if (flags.by && flags.force) {
      throw new FlowError('--by and --force are mutually exclusive: one rescues dependents, the other kills them.');
    }

    const { root, tickets, t } = locate(positional[0]);
    const reason = String(flags.reason).trim();
    const replacement = flags.by ? replacementFor(t, tickets, flags.by) : null;

    const affected = graph.transitiveDependents(tickets, t.id);
    if (affected.length && !flags.by && !flags.force) {
      throw new FlowError(
        `${t.id} has ${affected.length} live dependent${affected.length === 1 ? '' : 's'}, directly or through others:\n` +
        affected.map((d) => `  ${store.nameOf(d)}  ${d.data.status}`).join('\n') +
        '\n\nLeft alone they can never become ready. Pick one:\n' +
        `  flow tickets drop ${t.id} --reason "${reason}" --by <id>    re-point them at the replacement\n` +
        `  flow tickets drop ${t.id} --reason "${reason}" --force      drop them too`
      );
    }

    const { from, moved } = store.setStatus(t, 'dropped', reason);
    out(`${store.nameOf(t)}  ${from} → dropped`);
    out(`      reason: ${reason}`);
    if (moved) out(`      moved → ${rel(root, moved.to)}`);

    // --by only matters for tickets that depend on this one *directly*;
    // anything further out keeps working once the near edge is repaired.
    if (replacement) {
      const repointed = repoint(t, tickets, replacement);
      out(`\nre-pointed to ${store.nameOf(replacement)}:`);
      for (const d of repointed) out(`  ${d.id}  deps → [${d.data.deps.join(', ')}]`);
      if (!repointed.length) out('  nothing to re-point.');
      json({ ticket: ticketJson.record(t, tickets), repointed: repointed.map((d) => d.id), droppedWith: [] });
      records.commit(root, `${t.id}: dropped, dependents re-pointed to ${replacement.id}`);
      records.syncLater(root);
      return 0;
    }

    const droppedWith = flags.force ? affected : [];
    if (droppedWith.length) {
      out(`\ndropped with it (${droppedWith.length}):`);
      for (const d of droppedWith) {
        store.setStatus(d, 'dropped', `dropped with ${store.nameOf(t)}, which it depended on`);
        out(`  ${store.nameOf(d)}`);
      }
    }
    json({ ticket: ticketJson.record(t, tickets), repointed: [], droppedWith: droppedWith.map((d) => d.id) });
    records.commit(root, `${t.id}: dropped`);
    records.syncLater(root);
    return 0;
  },
};

/** The links between the moving tickets and the ones staying behind, as lines for the refusal. */
function linksAcross(moving: Ticket[], all: Ticket[]) {
  const ids = new Set(moving.map((t) => t.id));
  const links: string[] = [];
  for (const t of moving) {
    for (const d of t.data.deps) if (!ids.has(d)) links.push(`${t.id} depends on ${d}`);
    if (t.data.parent && !ids.has(t.data.parent)) links.push(`${t.id} has parent ${t.data.parent}`);
  }
  for (const other of all) {
    if (ids.has(other.id)) continue;
    for (const d of other.data.deps) if (ids.has(d)) links.push(`${other.id} depends on ${d}`);
    if (ids.has(other.data.parent)) links.push(`${other.id} has parent ${other.data.parent}`);
  }
  return links;
}

/**
 * Move tickets to another place: `home`, the tickets in ~/.flow/, or another
 * project by its prefix. Each takes the next free number there and keeps
 * its old id as `was:`, so the old id still finds it.
 *
 * A dependency or a parent across 2 places could never be resolved, so a
 * ticket linked to one staying behind is refused. Moving the linked tickets
 * together is fine: their links are rewritten to the new ids.
 *
 * The folder moves whole, files git ignores included, so a prototype's
 * installed packages go with it.
 */
const move: Action = {
  args: '<id,id> <home|prefix>',
  summary: 'move tickets to ~/.flow/ or another project by its prefix, each taking a new number there',
  run({ positional, usage }) {
    if (positional.length !== 2) throw new FlowError(`usage: ${usage} <id,id> <home|prefix>, the ids one comma-joined list`);
    const [given, to] = positional;
    const refs = listOf(given);

    const from = locate(refs[0]);
    const moving = refs.map((ref) => store.findTicket(from.tickets, ref));

    const target = projectNamed(to, 'move');
    touched.add(target);
    if (path.resolve(store.recordsDir(target)) === path.resolve(store.recordsDir(from.root))) {
      throw new FlowError(`${moving[0].id} already lives there.`);
    }

    const links = linksAcross(moving, from.tickets);
    if (links.length) {
      throw new FlowError(
        `a link across 2 places could never be followed:\n${links.map((l) => `  ${l}`).join('\n')}\n` +
        '  Move the linked tickets in the same command, or remove the links first with flow tickets edit --deps and --parent.'
      );
    }

    const there = store.readTickets(target);
    const prefix = store.prefixOf(target);
    const renamed = new Map();
    for (const t of [...moving].sort((a, b) => store.idNumber(a.id) - store.idNumber(b.id))) {
      const next = store.nextId([...there, ...[...renamed.values()].map((id) => ({ id }))], prefix, there.counter);
      renamed.set(t.id, next);
    }

    for (const t of moving) {
      const id = renamed.get(t.id);
      store.move(t, target, id, renamed);
      out(`${t.data.was} → ${id}-${t.data.title}`);
    }

    json({ moved: [...renamed].map(([from, to]) => ({ from, to })) });
    const said = [...renamed].map(([a, b]) => `${a} → ${b}`).join(', ');
    records.commit(from.root, `moved away: ${said}`);
    records.commit(target, `moved in: ${said}`);
    records.syncLater(from.root);
    records.syncLater(target);
    // Only a project's own id leads home: from inside a project, an id missing
    // there is looked for among the tickets that moved to ~/.flow/. A ticket
    // left behind that was renumbered from the same id is found first.
    if (store.isHome(target)) {
      const left = store.readTickets(from.root);
      const leads = [...renamed.keys()].filter((old) => !left.some((t) => t.data.was === old));
      if (leads.length) out(`\nthe old id still finds it from the project (flow tickets get ${leads[0]})`);
    }
    return 0;
  },
};

export { drop, move };
