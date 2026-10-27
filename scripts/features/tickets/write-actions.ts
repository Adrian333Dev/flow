/** The `flow tickets` actions that create or change a ticket: `new`, `edit`, `rank` and `file`. */

import { FlowError } from '../../shared/error.ts';
import { out, json, readBody, listOf } from '../../shared/cli.ts';
import type { Action } from '../../shared/cli.ts';
import * as store from './store.ts';
import * as graph from './graph.ts';
import * as order from './rank.ts';
import * as search from './search.ts';
import * as ticketJson from './json.ts';
import * as statuses from './statuses.ts';
import * as records from './records.ts';
import { PROJECT_FLAG, needProject, locate, rel } from './places.ts';
import type { Ticket } from './types.ts';

/** The labels a `--label a,b` value names. Any name is free; one that cannot be written plainly is refused. */
function labelsFrom(value) {
  const labels = store.toLabelList(value);
  for (const label of labels) {
    const bad = store.badLabel(label);
    if (bad) throw new FlowError(bad);
  }
  return labels;
}

/** A new label one typo from an existing one is most likely that label misspelt. Refused unless `--force`. */
function checkNewLabels(labels: string[], tickets: Ticket[], force) {
  if (force) return;
  const known = new Set<string>(tickets.flatMap((t) => t.data.labels));
  for (const label of labels) {
    if (known.has(label) || label.length < 5) continue;
    const near = [...known].find((k) => k.length >= 5 && search.withinOne(k, label));
    if (near) throw new FlowError(`"${label}" is one typo from the label "${near}". Use that one, or add --force for a new label.`);
  }
}

/** Refuses an id a flag names that no ticket carries. */
function mustExist(tickets: Ticket[], id: string, flag: string) {
  if (!tickets.some((t) => t.id === id)) throw new FlowError(`${flag} names ${id}, which does not exist.`);
}

/** The activity a flag names, trimmed and lowercased; empty clears it. A name that cannot be written is refused. */
function activityFrom(value): string {
  const activity = String(value || '').trim().toLowerCase();
  const refused = activity && store.badActivity(activity);
  if (refused) throw new FlowError(refused);
  return activity;
}

/** Why `flow tickets new` made no ticket: the pull or the push behind it failed. */
function notMade(failed) {
  if (!failed.offline) return `no ticket was made: ${(failed.why || 'the push failed').replace(/\.$/, '')}.`;
  return `no ticket was made: the remote did not take it. git said: ${failed.why}\n` +
    'Fix what git names, or wait until the remote answers, then try again.';
}

/**
 * Undo a new ticket whose push never landed: the folder goes, and the removal
 * is committed, so the branch holds nothing the remote never agreed to.
 */
function takeBack(root: string, t: Ticket) {
  store.remove(t);
  records.commit(root, `${t.id}: taken back, never sent`);
}

/**
 * The place `--before <id>`, `--after <id>`, `--first` or `--last` names, as
 * `rank.place` takes it, or null where none is given.
 */
function positionFrom(flags, prefix: string) {
  const given = ['before', 'after', 'first', 'last'].filter((name) => flags[name]);
  if (given.length > 1) throw new FlowError(`give one place, not ${given.map((name) => `--${name}`).join(' and ')}.`);
  if (!given.length) return null;
  const [name] = given;
  return { [name]: name === 'before' || name === 'after' ? store.requireId(flags[name], prefix) : true };
}

const describePosition = (target) =>
  target.before ? `before ${target.before}` : target.after ? `after ${target.after}` : target.first ? 'first' : 'last';

/**
 * Writes the numbers that put `t` where `target` says: its own, and the other
 * tickets' where the group had to be numbered. Returns how many others it numbered.
 */
function placeTicket(t: Ticket, tickets: Ticket[], target) {
  const placed = order.place(order.siblingsOf(tickets, t.data.parent), t, target);
  t.data.rank = placed.rank;
  store.writeTicket(t);
  for (const other of placed.others) {
    other.ticket.data.rank = other.rank;
    store.writeTicket(other.ticket);
  }
  return placed.others.length;
}

// ---------------------------------------------------------------- edit

/** `--parent`: an empty value clears it, which un-splits a ticket. */
function parentForEdit(t: Ticket, tickets: Ticket[] & { prefix: string }, value) {
  const parent = value ? store.requireId(value, tickets.prefix) : '';
  if (parent) {
    if (parent === t.id) throw new FlowError('a ticket cannot be its own parent.');
    mustExist(tickets, parent, '--parent');
    if (graph.wouldOrphan(tickets, t.id, parent)) {
      throw new FlowError(`${t.id} → ${parent} would make ${t.id} its own ancestor.`);
    }
  }
  return parent;
}

/** `--deps`: the whole list, the way `flow tickets new --deps` takes it. Empty clears it. */
function depsForEdit(t: Ticket, tickets: Ticket[] & { prefix: string }, value) {
  const deps = [...new Set(store.toIdList(value, tickets.prefix))];
  for (const d of deps) {
    if (d === t.id) throw new FlowError('a ticket cannot depend on itself.');
    mustExist(tickets, d, '--deps');
    if (graph.wouldCycle(tickets, t.id, d)) throw new FlowError(`${t.id} → ${d} would close a dependency cycle. Run flow tickets check.`);
  }
  return deps;
}

/** `--activity`: the kind of work under way, shown on the band. Empty clears it. */
function activityForEdit(t: Ticket, value) {
  const activity = activityFrom(value);
  if (activity && t.data.status !== 'in-progress') {
    throw new FlowError(`${t.id} is ${t.data.status}: only an in-progress ticket has an activity. Start it with flow tickets start ${t.id}.`);
  }
  return activity;
}

const newTicket: Action = {
  args: '"<description>"',
  summary: 'create one, last among its siblings; flow tickets rank places it',
  flags: {
    parent: { arg: '<id>' },
    deps: { arg: '<id,id>' },
    label: { arg: '<label,label>' },
    body: { arg: '<text|->' },
    force: { bool: true },
    project: PROJECT_FLAG,
  },
  run({ positional, flags, usage }) {
    const [description, ...extra] = positional.map((p) => p.trim());
    if (!description || extra.length) throw new FlowError(`usage: ${usage} "<short name>: <details>", in quotes`);
    // The description opens with the short name: `Safari cookie lost: gone after login`.
    const title = store.titleFrom(description);
    const refused = store.badTitle(title);
    if (refused) throw new FlowError(refused);

    const body = readBody(flags);
    const labels = labelsFrom(flags.label);
    const root = needProject(flags);
    // The newest numbers first, so this ticket takes one nobody has pushed.
    // A number is only ever given out where the remote agreed to it, so a
    // pull that fails makes no ticket.
    const pulled = records.pull(root);
    if (!pulled.ok) throw new FlowError(notMade(pulled));
    for (const r of pulled.renumbered || []) out(`${r.from} is now ${r.to}: another machine took ${r.from} first.`);
    const tickets = store.readTickets(root);
    checkNewLabels(labels, tickets, flags.force);

    const deps = store.toIdList(flags.deps, tickets.prefix);
    for (const d of deps) mustExist(tickets, d, '--deps');

    let parent = '';
    if (flags.parent) {
      parent = store.requireId(flags.parent, tickets.prefix);
      mustExist(tickets, parent, '--parent');
    }

    let t = store.createTicket(root, { title, description, labels, parent, deps, tickets, body });

    // Pushed before the id is shown, so nobody ever sees a number change. A
    // refused push means someone took the number first: the ticket is
    // renumbered and pushed again. A push that never lands takes it back.
    const claimed = records.claim(root, t.id);
    if (claimed.id !== t.id) t = store.findTicket(store.readTickets(root), claimed.id);
    if (!claimed.ok) {
      takeBack(root, t);
      throw new FlowError(notMade(claimed));
    }

    out(`created ${store.nameOf(t)}`);
    out(`        ${rel(root, t.file)}`);
    if (labels.length) out(`        labels: ${labels.join(', ')}`);
    if (parent) out(`        parent: ${parent}`);
    if (deps.length) out(`        deps: ${deps.join(', ')}`);
    out(`\npick up with: flow tickets start ${t.id}`);
    const after = store.readTickets(root);
    json({ ticket: ticketJson.record(store.findTicket(after, t.id), after), renumbered: pulled.renumbered || [] });
    return 0;
  },
};

/**
 * Every field a ticket carries except `status`, which belongs to the verbs.
 * Two spellings for one move meant skills wrote the long one: it was the
 * documented general form, so the surface read as if the verbs did not exist.
 */
const edit: Action = {
  args: '<id>',
  summary: 'change a field',
  flags: {
    title: { arg: '<words>' },
    description: { arg: '"<text>"' },
    label: { arg: '<label,label>' },
    parent: { arg: '<id>' },
    deps: { arg: '<id,id>' },
    activity: { arg: '<word>' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> [--title ...] [--description ...] [--label ...] [--activity ...]`);

    const { root, tickets, t } = locate(positional[0]);
    // Each change as a line of text, and as `{ field, from, to }` for --json.
    const changes: string[] = [];
    const fields: { field: string; from: any; to: any }[] = [];
    const change = (field, to, text) => {
      fields.push({ field, from: t.data[field], to });
      changes.push(text);
      t.data[field] = to;
    };

    // The folder stays: a rename is this one field.
    if (flags.title !== undefined) {
      const title = String(flags.title).trim();
      const refused = store.badTitle(title);
      if (refused) throw new FlowError(refused);
      change('title', title, `title: ${t.data.title} → ${title}`);
    }
    if (flags.description !== undefined) {
      const description = String(flags.description).trim();
      change('description', description, `description: "${t.data.description}" → "${description}"`);
    }
    if (flags.parent !== undefined) {
      const parent = parentForEdit(t, tickets, flags.parent);
      change('parent', parent, `parent: ${t.data.parent || '-'} → ${parent || '-'}`);
    }
    if (flags.deps !== undefined) {
      const deps = depsForEdit(t, tickets, flags.deps);
      change('deps', deps, `deps: [${t.data.deps.join(', ')}] → [${deps.join(', ')}]`);
    }
    if (flags.label !== undefined) {
      // The whole list, the way `--deps` takes it. Empty clears it.
      const labels = labelsFrom(flags.label);
      checkNewLabels(labels, tickets, flags.force);
      change('labels', labels, `labels: [${t.data.labels.join(', ')}] → [${labels.join(', ')}]`);
    }
    if (flags.activity !== undefined) {
      const activity = activityForEdit(t, flags.activity);
      change('activity', activity, `activity: ${t.data.activity || '-'} → ${activity || '-'}`);
    }

    if (!changes.length) {
      throw new FlowError(
        'nothing to change: pass --title, --description, --label, --parent, --deps or --activity. Order is flow tickets rank.\n' +
        `  Status moves are their own commands: flow tickets start ${t.id}, flow tickets done ${t.id}, flow tickets park ${t.id}.`
      );
    }

    store.writeTicket(t);
    records.commit(root, `${t.id}: ${changes.join('; ')}`);
    out(`${t.id}\n  ${changes.join('\n  ')}`);
    json({ ticket: ticketJson.record(t, tickets), changes: fields });
    return 0;
  },
};

/**
 * Moves a ticket among its siblings: the tickets that share its parent. Only an
 * open ticket has a place, and only a sibling is a place to go beside.
 */
const rank: Action = {
  args: '<id>',
  summary: 'put it before or after a sibling, or first or last',
  flags: {
    before: { arg: '<id>' },
    after: { arg: '<id>' },
    first: { bool: true },
    last: { bool: true },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --before <id>`);

    const { root, tickets, t } = locate(positional[0]);
    const target = positionFrom(flags, tickets.prefix);
    if (!target) throw new FlowError('say where: --before <id>, --after <id>, --first or --last.');
    if (statuses.TERMINAL.has(t.data.status)) throw new FlowError(`${t.id} is ${t.data.status}: only open tickets have a place.`);
    if (target.before === t.id || target.after === t.id) throw new FlowError(`${t.id} cannot go beside itself.`);

    const renumbered = placeTicket(t, tickets, target);
    records.commit(root, `${t.id}: ranked ${describePosition(target)}`);
    records.syncLater(root);
    out(`${store.nameOf(t)}  ${describePosition(target)}`);
    if (renumbered) out(`      numbered ${renumbered} other ticket${renumbered === 1 ? '' : 's'} too, in their current order`);
    json({ ticket: ticketJson.record(t, tickets), position: describePosition(target), renumbered });
    return 0;
  },
};

/**
 * The filing pass marks what it swept. Several ids at once, comma-joined,
 * because sweeping a batch of closed tickets is the normal case, and every id
 * gets stamped, including the tickets that produced nothing worth keeping. A
 * ticket nobody looked at and a ticket that taught nothing are
 * indistinguishable from the outside, so only the mark drains the queue.
 */
const file: Action = {
  args: '<id,id>',
  summary: 'stamp today on everything the filing pass swept',
  flags: { force: { bool: true } },
  run({ positional, flags, usage }) {
    const refs = listOf(positional[0]);
    if (!refs.length || positional.length > 1) throw new FlowError(`usage: ${usage} <id,id>, one comma-joined list`);

    const { root, tickets } = locate(refs[0]);
    const stamp = store.today();
    const targets = refs.map((ref) => store.findTicket(tickets, ref));
    const filed: any[] = [];

    for (const t of targets) {
      if (t.data.filed && !flags.force) {
        out(`${store.nameOf(t)}  already filed ${t.data.filed}`);
        filed.push({ id: t.id, filed: t.data.filed, was: '', already: true });
        continue;
      }
      const previous = t.data.filed;
      t.data.filed = stamp;
      store.writeTicket(t);
      out(`${store.nameOf(t)}  filed ${stamp}${previous ? ` (was ${previous})` : ''}`);
      filed.push({ id: t.id, filed: stamp, was: previous, already: false });
    }

    records.commit(root, `filed ${targets.map((t) => t.id).join(', ')}`);
    const left = tickets.filter((t) => t.data.status === 'done' && !t.data.filed);
    json({ filed, unfiled: left.length });
    out(left.length
      ? `\n${left.length} closed ticket${left.length === 1 ? '' : 's'} still unfiled (flow tickets -- "status:done filed:no")`
      : '\nnothing left unfiled.');
    return 0;
  },
};

const writeActions: Record<string, Action> = { new: newTicket, edit, rank, file };

export { writeActions, activityFrom };
