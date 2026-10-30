import path from 'node:path';
import { FlowError } from '../../shared/error.ts';
import { out, json, listOf } from '../../shared/cli.ts';
import type { Action } from '../../shared/cli.ts';
import * as store from './store.ts';
import * as ticketJson from './json.ts';
import * as statuses from './statuses.ts';
import * as records from './records.ts';
import * as mentions from './mentions.ts';
import * as worktrees from './worktrees.ts';
import { touched, rel, locate, projectNamed } from './places.ts';
import type { Ticket } from './types.ts';

/** One ticket's link to the ticket leaving: it waits on it, or it is its child. */
type Link = { ticket: Ticket; field: 'deps' | 'parent' };

/**
 * The links other tickets hold to `t`, among `among`. Only the near edge
 * counts: a ticket waiting on a dependent of `t` is fine once that edge moves.
 */
function linksTo(t: Ticket, among: Ticket[]): Link[] {
  const links: Link[] = [];
  for (const other of among) {
    if (other.id === t.id) continue;
    if (other.data.deps.includes(t.id)) links.push({ ticket: other, field: 'deps' });
    if (other.data.parent === t.id) links.push({ ticket: other, field: 'parent' });
  }
  return links;
}

/** A link as a refusal line, with the edit that moves it. `--deps` takes the whole list, so it shows the ids kept. */
function linkLine(t: Ticket, link: Link) {
  const { ticket: other, field } = link;
  if (field === 'parent') return `  ${other.id} has parent ${t.id}    flow tickets edit ${other.id} --parent <id>`;
  const kept = other.data.deps.filter((d) => d !== t.id);
  return `  ${other.id} depends on ${t.id}    flow tickets edit ${other.id} --deps ${[...kept, '<ids>'].join(',')}`;
}

/** Removes each link to `t`: the id leaves `deps`, and a child loses its parent. Writes each ticket. */
function clearLinks(t: Ticket, links: Link[]) {
  for (const { ticket: other, field } of links) {
    if (field === 'deps') other.data.deps = other.data.deps.filter((d) => d !== t.id);
    else other.data.parent = '';
    store.writeTicket(other);
  }
}

const describeLinks = (links: Link[]) => links.map(({ ticket, field }) => ({ id: ticket.id, field }));

/**
 * A drop strands the tickets linked to it: `deps` is stored on one side only,
 * so a ticket waiting on a dropped one never becomes ready, and a child keeps
 * a parent that will never close. Bare `drop` refuses while a live ticket
 * waits on it or an open child sits under it, naming the edit that moves each
 * link. Where the work went is the agent's to say: it is seldom one ticket.
 * `--force` clears the links instead.
 *
 * It is the one status with no verb, for that repair. `flow dropped t047` would
 * be a verb that had to do something no other verb does.
 */
const drop: Action = {
  args: '<id>',
  summary: 'kill it, once nothing open waits on it or sits under it',
  flags: {
    reason: { required: true, arg: '"<why>"', missing: 'dropping needs --reason "<why>".' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --reason "<why>"`);

    const { root, tickets, t } = locate(positional[0]);
    const reason = String(flags.reason).trim();
    const links = linksTo(t, tickets.filter((other) => statuses.LIVE.has(other.data.status)));
    if (links.length && !flags.force) {
      throw new FlowError(
        `${t.id} has ${links.length} open link${links.length === 1 ? '' : 's'}, which would never resolve. Move each to where its work went, then drop again:\n` +
        links.map((link) => linkLine(t, link)).join('\n') +
        `\n  Or clear them: flow tickets drop ${t.id} --reason "${reason}" --force`
      );
    }

    worktrees.refuseWhileUnfinished(t, root, 'dropped');
    clearLinks(t, links);
    const { from, moved } = store.setStatus(t, 'dropped', reason);
    out(`${store.nameOf(t)}  ${from} → dropped`);
    out(`      reason: ${reason}`);
    if (moved) out(`      moved → ${rel(root, moved.to)}`);
    if (links.length) out(`      cleared: ${links.map(({ ticket, field }) => `${ticket.id} ${field}`).join(', ')}`);
    json({ ticket: ticketJson.record(t, tickets), cleared: describeLinks(links) });
    records.commit(root, `${t.id}: dropped`);
    records.syncLater(root);
    return 0;
  },
};

/**
 * A real delete, for a ticket whose content the agent copied into others: a
 * merge. Nothing stays, so every link and mention would point at nothing, and
 * it refuses on both: a ticket linked to it (any status), and a line naming
 * its id or path in the project or the Flow home. Its own line in its
 * parent's `## Tasks` goes with it, so that line is no mention. A closed
 * ticket is a record and refuses too. `--force` overrides all 3, clearing the
 * links and leaving the mentions.
 *
 * Its number stays given out: `ticket-counter` holds it (`store.remove`).
 */
const remove: Action = {
  args: '<id>',
  summary: 'delete a ticket merged into others, once nothing links to it or mentions it',
  flags: { force: { bool: true } },
  run({ positional, flags, usage }) {
    if (!positional[0] || positional.length > 1) throw new FlowError(`usage: ${usage} <id>`);

    const { root, tickets, t } = locate(positional[0]);
    const parent = t.data.parent ? tickets.find((p) => p.id === t.data.parent) : undefined;
    // The parent's task line goes with the ticket, so it is no mention.
    const parentFile = parent ? mentions.real(parent.file) : '';
    const task = parent ? store.taskOf(parent, t.id).trim() : '';
    const ignore = (file: string, text: string) => Boolean(task) && file === parentFile && text.trim() === task;

    const closed = statuses.TERMINAL.has(t.data.status);
    const links = linksTo(t, tickets);
    const found = mentions.find(t, ignore);
    if ((closed || links.length || found.length) && !flags.force) {
      const parts: string[] = [];
      if (closed) parts.push(`${t.id} is ${t.data.status}: a closed ticket is a record of the work.`);
      if (links.length) parts.push(`${links.length} ticket link${links.length === 1 ? '' : 's'} to it. Move each to where its piece went:\n${links.map((link) => linkLine(t, link)).join('\n')}`);
      if (found.length) parts.push(`${found.length} mention${found.length === 1 ? '' : 's'} of it. Edit each to name where its piece went:\n${shown(root, found)}`);
      throw new FlowError(`${store.nameOf(t)} was not deleted.\n${parts.join('\n')}\n  Then run this again, or delete anyway with --force.`);
    }

    clearLinks(t, links);
    const untasked = parent ? store.removeTask(parent, t.id) : false;
    if (untasked) store.writeTicket(parent);
    store.remove(t);

    out(`deleted ${store.nameOf(t)}`);
    if (untasked) out(`      removed its line in ${parent!.id}'s ## Tasks`);
    if (links.length) out(`      cleared: ${links.map(({ ticket, field }) => `${ticket.id} ${field}`).join(', ')}`);
    if (found.length) out(`      still mentioned in ${found.length} place${found.length === 1 ? '' : 's'}:\n${shown(root, found)}`);
    json({
      deleted: t.id,
      cleared: describeLinks(links),
      untasked: untasked ? parent!.id : null,
      mentions: found.map((m) => ({ file: m.file, line: m.line })),
    });
    records.commit(root, `${t.id}: deleted`);
    records.syncLater(root);
    return 0;
  },
};

/** The mentions as lines, the first 10, then a count of the rest. */
function shown(root: string, found: mentions.Mention[]) {
  const lines = found.slice(0, 10).map((m) => `  ${mentions.describe(root, m)}`);
  if (found.length > 10) lines.push(`  and ${found.length - 10} more`);
  return lines.join('\n');
}

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

export { drop, remove, move };
