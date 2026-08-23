'use strict';
/**
 * Everything that acts on a ticket.
 *
 * None of it is spelled `flow tickets ...`. A ticket is what this tool is
 * about, so these sit at the top level and the noun is left out — `flow ls`,
 * `flow build t047`. Only `cases` keeps a group name, being a different thing.
 *
 * The status verbs are generated from the status table rather than written out.
 * Each is the same call into `transition`, so a verb cannot skip a guard, and a
 * status added to the table arrives with its command already working.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const store = require('../lib/store');
const graph = require('../lib/graph');
const render = require('../lib/render');
const statuses = require('../lib/statuses');

function load() {
  const root = projectRoot();
  return { root, tickets: store.readTickets(root) };
}

const rel = (root, p) => path.relative(root, p) || p;

/**
 * `flow t047` and `flow get t047` both land on the same lookup. The first got
 * here because `t047` matched no command — which means a mistyped command,
 * `flow buidl t047`, arrives here too and would fail with a message about
 * tickets. `unnamed` is passed on that path only, and says what else it tried.
 */
function find(tickets, ref, unnamed) {
  try {
    return store.findTicket(tickets, ref);
  } catch (e) {
    if (unnamed && e instanceof FlowError) {
      throw new FlowError(`${e.message}\n  "${ref}" is not a command either — flow help lists them.`);
    }
    throw e;
  }
}

/** `--body -` reads the whole body from stdin, so creating and filling a ticket is one command. */
function readBody(flags) {
  if (flags.body === '-') {
    let body;
    try {
      body = fs.readFileSync(0, 'utf8');
    } catch {
      throw new FlowError('--body - expects the body on stdin, and nothing was piped in.');
    }
    if (!body.trim()) throw new FlowError('--body - got empty stdin.');
    return body;
  }
  return flags.body == null ? undefined : flags.body;
}

// ---------------------------------------------------------------- moving

/**
 * The one place a status is written. Every verb goes through it.
 *
 * Guards are keyed to where the ticket is coming from, never to where it is
 * going. The entry status varies by type, so a target-status test would let an
 * issue picked up at `building` walk past both refusals. `planning` is guarded
 * as well because groundwork is where children get cut: a parent whose work
 * just moved into its children cannot have a plan written for it until they
 * close.
 */
function transition(t, tickets, root, status, { force, reason, verb }) {
  const from = t.data.status;
  if (from === status) {
    out(`${t.id} is already ${status}.`);
    return 0;
  }

  if (statuses.NEEDS_REASON.has(status) && !reason) {
    throw new FlowError(
      `moving ${t.id} to ${status} needs a reason — in six months it is the only thing that explains the ticket.\n` +
      `  ${verb} --reason "vendor API changes land in Q3, pointless before that"`
    );
  }

  const entering = from === 'todo' || from === 'parked' || status === 'planning';

  // Starting a blocked ticket refuses rather than warns. A warning is a line of
  // text an agent reads past; a non-zero exit is the thing it cannot ignore.
  const unmet = entering ? graph.unmetDeps(t, graph.indexById(tickets)) : [];
  if (unmet.length && !force) {
    throw new FlowError(
      `${t.id} is blocked — deps are not satisfied:\n` +
      unmet.map((u) => `  ${render.blockText(u)}`).join('\n') +
      `\n  Clear those first, or override with: ${verb} --force`
    );
  }

  // The pair to `done` refusing on open children. A parent keeps whatever work
  // no child holds — the wiring, the final suite — and that work runs after
  // they close, so this refuses early rather than at the finish line.
  const openKids = graph.openChildren(tickets, t.id);
  if (entering && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${openKids.length} open child ticket${openKids.length === 1 ? '' : 's'} — finish those first:\n` +
      openKids.map((c) => `  ${c.id}  ${c.data.status.padEnd(10)} ${c.data.title}`).join('\n') +
      `\n  Or override with: ${verb} --force`
    );
  }

  // A parent finishing is a judgment about whether the original question got
  // answered. The children finishing is evidence, not proof — so the call stays
  // with the user and this only refuses to make it for them.
  if (status === 'done' && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${openKids.length} open child ticket${openKids.length === 1 ? '' : 's'} — its work is theirs:\n` +
      openKids.map((c) => `  ${c.id}  ${c.data.status.padEnd(10)} ${c.data.title}`).join('\n') +
      `\n  Finish those, or close it anyway with: ${verb} --force`
    );
  }

  const before = graph.readyTickets(tickets).map((x) => x.id);
  const revived = from === 'parked' && t.data.reason;

  t.data.status = status;
  // The moment work stopped. Any move back to a live status clears it, because
  // a ticket in flight has no finish to point at.
  t.data.closed = statuses.TERMINAL.has(status) ? store.now() : '';
  // A reason outlives only the status it explains. Carrying "waiting on the Q3
  // API" into a ticket now being built is worse than carrying nothing.
  t.data.reason = reason || '';
  // Where a parked ticket comes back to. Nothing used to store this: revive
  // recomputed the entry status from the type, so a feature parked at
  // `building` came back at `groundwork` — losing two phases, on the command
  // the tool printed for it. The status it left is the only thing that knows.
  t.data.resume = status === 'parked' ? from : '';

  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → ${status}   ${t.data.title}`);
  if (t.data.reason) out(`      reason: ${t.data.reason}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);
  if (revived) out(`      revived — cleared reason: ${revived}`);

  if (unmet.length) {
    out('\nforced past unsatisfied deps:');
    for (const u of unmet) out(`  ${render.blockText(u)}`);
  }

  const ready = graph.readyTickets(tickets).map((x) => x.id);
  const unblocked = tickets.filter((x) => ready.includes(x.id) && !before.includes(x.id));
  if (unblocked.length) {
    out('\nnow ready:');
    out(render.indent(render.ticketTable(unblocked)));
  }

  // The mirror. A move back down the line un-satisfies deps, so work `flow next`
  // was offering stops being workable — and the ticket that moved is not one of
  // them, since leaving `todo` drops it from the ready list on every pickup.
  const blocked = tickets.filter((x) => x.id !== t.id && before.includes(x.id) && !ready.includes(x.id));
  if (blocked.length) {
    out('\nnow blocked:');
    out(render.indent(render.ticketTable(blocked)));
  }
  if (status === 'parked') out(`\nrevive with: flow ${render.reviveVerb(t)} ${t.id}`);
  return 0;
}

// ---------------------------------------------------------------- the board

const actions = {};

actions.ls = {
  section: 'board',
  summary: 'list many, filtered',
  flags: {
    status: { values: statuses.NAMES, arg: '<status>' },
    type: { values: store.TICKET_TYPES, arg: '<type>' },
    parent: { arg: '<id>' },
    unfiled: { bool: true },
  },
  run({ flags }) {
    const { tickets } = load();
    let list = tickets;

    if (flags.status) list = list.filter((t) => t.data.status === flags.status);
    if (flags.type) list = list.filter((t) => t.data.type === flags.type);
    if (flags.parent) {
      const parent = store.requireId(flags.parent);
      list = list.filter((t) => t.data.parent === parent);
    }
    // The filing pass runs this first, to get the ids it will sweep. Done only:
    // a dropped ticket's reason is its whole record, and an open one is still
    // producing the material the pass would file.
    if (flags.unfiled) list = list.filter((t) => t.data.status === 'done' && !t.data.filed);

    out(render.ticketTable(graph.rankByStatus(list, tickets), tickets));
    if (list.length) out(`\n${list.length} of ${tickets.length}.`);
    return 0;
  },
};

/**
 * The whole shape, which nothing else shows. `ls` is a flat table with a parent
 * column and `get` is one ticket — the hierarchy that `parent` builds had no
 * renderer at all.
 */
actions.tree = {
  section: 'board',
  summary: 'the shape, nested by parent',
  flags: { parent: { arg: '<id>' }, all: { bool: true } },
  run({ flags }) {
    const { tickets } = load();
    if (!tickets.length) { out('no tickets yet.'); return 0; }

    let pool = tickets;
    if (flags.parent) {
      const top = store.findTicket(tickets, flags.parent);
      pool = [top, ...graph.descendants(tickets, top.id)];
    }

    // Done and dropped collapse into the parent's count by default. A tree
    // carrying every finished ticket is the noise a tree exists to strip.
    const visible = flags.all ? pool : pool.filter((t) => !statuses.TERMINAL.has(t.data.status));
    if (!visible.length) { out('nothing live here — flow tree --all includes done and dropped.'); return 0; }

    out(render.tree(graph.forest(visible), tickets));
    const hidden = pool.length - visible.length;
    out(`\n${visible.length} ticket${visible.length === 1 ? '' : 's'}` +
      (hidden ? `, ${hidden} done or dropped hidden — flow tree --all` : ''));
    return 0;
  },
};

// ---------------------------------------------------------------- one ticket

actions.get = {
  section: 'tickets',
  args: '<id>',
  summary: 'the same, spelled out',
  run({ positional, usage, unnamed }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id>`);
    const { root, tickets } = load();
    out(render.show(find(tickets, positional[0], unnamed), tickets, root));
    return 0;
  },
};

actions.new = {
  section: 'tickets',
  args: '"<title>"',
  summary: 'create one',
  flags: {
    type: { values: store.TICKET_TYPES, arg: '<type>' },
    priority: { values: store.TICKET_PRIORITIES, arg: '<level>' },
    parent: { arg: '<id>' },
    deps: { arg: '<id,id>' },
    label: { arg: '<1-3 words>' },
    body: { arg: '<text|->' },
    'from-groundwork': { arg: '<path>' },
  },
  run({ positional, flags, usage }) {
    const title = positional.join(' ').trim();
    if (!title) throw new FlowError(`usage: ${usage} "<title>"`);

    const body = readBody(flags);
    const root = projectRoot();
    const tickets = store.readTickets(root);

    const deps = store.toIdList(flags.deps);
    for (const d of deps) {
      if (!tickets.some((t) => t.id === d)) throw new FlowError(`--deps names ${d}, which does not exist.`);
    }

    let parent = '';
    if (flags.parent) {
      parent = store.requireId(flags.parent);
      if (!tickets.some((t) => t.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
    }

    // `--from-groundwork` moves an existing loose groundwork in as this
    // ticket's own, for when the groundwork resolved to exactly one unit of work.
    let fromGroundwork = '';
    if (flags['from-groundwork'] != null) {
      const given = String(flags['from-groundwork']).trim();
      if (!given) throw new FlowError('--from-groundwork expects the path of an existing groundwork folder.');
      fromGroundwork = path.resolve(given);
      if (!fs.existsSync(fromGroundwork) || !fs.statSync(fromGroundwork).isDirectory()) {
        throw new FlowError(`--from-groundwork names ${given}, which is not a folder.`);
      }
      if (!fs.existsSync(path.join(fromGroundwork, 'map.md'))) {
        throw new FlowError(`${given} holds no map.md, so it is not a groundwork folder.`);
      }
      const live = store.ticketsDir(root);
      if (fromGroundwork === live || fromGroundwork.startsWith(live + path.sep)) {
        throw new FlowError(`${given} is inside docs/tickets/, so it already belongs to a ticket.`);
      }
    }

    const t = store.createTicket(root, {
      title, type: flags.type || 'feature', priority: flags.priority || '',
      parent, deps, tickets, body, fromGroundwork, label: flags.label,
    });

    out(`created ${t.id}  ${t.data.title}`);
    out(`        ${rel(root, t.file)}`);
    out(`        ${rel(root, path.join(t.dir, 'groundwork', 'map.md'))}`);
    if (t.movedFrom) out(`        moved  ${rel(root, t.movedFrom)}/ → groundwork/`);
    if (t.data.priority) out(`        priority: ${t.data.priority}`);
    if (parent) out(`        parent: ${parent}`);
    if (deps.length) out(`        deps: ${deps.join(', ')}`);
    out(`\npick up with: flow ${statuses.VERB_OF[statuses.entryStatusFor(t.data.type)]} ${t.id}`);
    return 0;
  },
};

/**
 * Every field a ticket carries except `status`, which belongs to the verbs.
 * Two spellings for one move meant skills wrote the long one — it was the
 * documented general form — so the surface read as if the verbs did not exist.
 */
actions.edit = {
  section: 'tickets',
  args: '<id>',
  summary: 'change a field',
  flags: {
    title: { arg: '"<title>"' },
    label: { arg: '<1-3 words>' },
    type: { values: store.TICKET_TYPES, arg: '<type>' },
    priority: { values: store.TICKET_PRIORITIES, arg: '<level>' },
    parent: { arg: '<id>' },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> [--title ...] [--type ...]`);

    const { root, tickets } = load();
    const t = store.findTicket(tickets, positional[0]);
    const changes = [];

    if (flags.title !== undefined) {
      changes.push(`title: "${t.data.title}" → "${flags.title}"`);
      t.data.title = String(flags.title).trim();
    }
    if (flags.type !== undefined) {
      changes.push(`type: ${t.data.type} → ${flags.type}`);
      t.data.type = flags.type;
    }
    if (flags.priority !== undefined) {
      // `normal` and `""` both clear it — the field goes away rather than
      // storing the default, so an ordinary ticket has no priority line to go stale.
      const priority = store.toPriority(flags.priority);
      changes.push(`priority: ${t.data.priority || 'normal'} → ${priority || 'normal'}`);
      t.data.priority = priority;
    }
    if (flags.parent !== undefined) {
      // Empty clears it: `--parent ""` un-splits a ticket.
      const parent = flags.parent ? store.requireId(flags.parent) : '';
      if (parent) {
        if (parent === t.id) throw new FlowError('a ticket cannot be its own parent.');
        if (!tickets.some((x) => x.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
        if (graph.wouldOrphan(tickets, t.id, parent)) {
          throw new FlowError(`${t.id} → ${parent} would make ${t.id} its own ancestor.`);
        }
      }
      changes.push(`parent: ${t.data.parent || '-'} → ${parent || '-'}`);
      t.data.parent = parent;
    }

    let renamed = null;
    if (flags.label !== undefined) {
      renamed = store.relabel(t, flags.label);
      changes.push(`label: ${renamed.from} → ${renamed.to}`);
    }

    if (!changes.length) {
      throw new FlowError(
        'nothing to change — pass --title, --label, --type, --priority or --parent.\n' +
        `  Status moves are their own commands: flow build ${t.id}, flow review ${t.id}, flow done ${t.id}.`
      );
    }

    store.writeTicket(t);
    out(`${t.id}\n  ${changes.join('\n  ')}`);
    if (renamed) out(`\nfolder → ${rel(root, t.dir)}`);
    return 0;
  },
};

actions.dep = {
  section: 'tickets',
  args: '<id>',
  summary: 'add or remove a dependency',
  flags: { on: { arg: '<id>' }, off: { arg: '<id>' } },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --on <id> | --off <id>`);
    if (flags.on && flags.off) throw new FlowError('--on and --off are mutually exclusive.');
    if (!flags.on && !flags.off) throw new FlowError(`${usage} needs --on <id> or --off <id>.`);

    const { tickets } = load();
    const t = store.findTicket(tickets, positional[0]);
    const dep = store.requireId(flags.off || flags.on);

    if (flags.off) {
      if (!t.data.deps.includes(dep)) { out(`${t.id} does not depend on ${dep}.`); return 0; }
      t.data.deps = t.data.deps.filter((d) => d !== dep);
    } else {
      if (dep === t.id) throw new FlowError('a ticket cannot depend on itself.');
      if (!tickets.some((x) => x.id === dep)) throw new FlowError(`no ticket ${dep}.`);
      if (t.data.deps.includes(dep)) { out(`${t.id} already depends on ${dep}.`); return 0; }
      if (graph.wouldCycle(tickets, t.id, dep)) {
        throw new FlowError(`${t.id} → ${dep} would close a dependency cycle. Run flow check.`);
      }
      t.data.deps = [...t.data.deps, dep];
    }

    store.writeTicket(t);
    out(`${t.id}  deps → [${t.data.deps.join(', ')}]`);
    return 0;
  },
};

/**
 * The filing pass marks what it swept. Several ids at once, because sweeping a
 * batch of closed tickets is the normal case — and every id gets stamped,
 * including the tickets that produced nothing worth keeping. A ticket nobody
 * looked at and a ticket that taught nothing are indistinguishable from the
 * outside, so only the mark drains the queue.
 */
actions.file = {
  section: 'tickets',
  args: '<id>...',
  summary: 'stamp today on everything the filing pass swept',
  flags: { force: { bool: true } },
  run({ positional, flags, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <id>...`);

    const { tickets } = load();
    const stamp = store.today();
    const targets = positional.map((ref) => store.findTicket(tickets, ref));

    for (const t of targets) {
      if (t.data.filed && !flags.force) {
        out(`${t.id}  already filed ${t.data.filed}   ${t.data.title}`);
        continue;
      }
      const previous = t.data.filed;
      t.data.filed = stamp;
      store.writeTicket(t);
      out(`${t.id}  filed ${stamp}${previous ? ` (was ${previous})` : ''}   ${t.data.title}`);
    }

    const left = tickets.filter((t) => t.data.status === 'done' && !t.data.filed);
    out(left.length
      ? `\n${left.length} closed ticket${left.length === 1 ? '' : 's'} still unfiled — flow ls --unfiled`
      : '\nnothing left unfiled.');
    return 0;
  },
};

/**
 * Dropping is the one destructive edit here, and its damage lands on tickets
 * the user was not thinking about: `deps` is stored on one side only, so
 * killing t047 silently strands whatever depended on it. Bare `drop` therefore
 * refuses while live dependents exist and prints the whole chain first.
 *
 * It is the one status with no verb, for that repair. `flow dropped t047` would
 * be a verb that had to do something no other verb does.
 */
actions.drop = {
  section: 'tickets',
  args: '<id>',
  summary: 'kill it, and repair what depended on it',
  flags: {
    reason: { required: true, arg: '"<why>"', missing: 'dropping needs a reason — nothing else records why the work died.' },
    by: { arg: '<id>' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --reason "<why>"`);
    if (flags.by && flags.force) {
      throw new FlowError('--by and --force are mutually exclusive: one rescues dependents, the other kills them.');
    }

    const { root, tickets } = load();
    const t = store.findTicket(tickets, positional[0]);
    const reason = String(flags.reason).trim();

    let replacement = null;
    if (flags.by) {
      const byId = store.requireId(flags.by);
      if (byId === t.id) throw new FlowError(`${t.id} cannot replace itself.`);
      replacement = tickets.find((x) => x.id === byId);
      if (!replacement) throw new FlowError(`--by names ${byId}, which does not exist.`);

      // A dropped replacement blocks every dependent forever, which is the
      // exact harm --by exists to prevent. `done` is fine: the edge is
      // satisfied on arrival, so it costs nothing beyond a line of frontmatter.
      if (replacement.data.status === 'dropped') {
        throw new FlowError(
          `--by names ${replacement.id}, which is itself dropped — those dependents could never become ready.\n` +
          '  Pick a live replacement, or drop them too with --force.'
        );
      }

      // `dep` refuses an edge that would close a loop. --by writes the same
      // kind of edge, checked before the drop is written, because a refusal
      // after it would leave the graph half-edited.
      const loops = graph.dependents(tickets, t.id).filter((d) =>
        statuses.LIVE.has(d.data.status) && d.id !== replacement.id && graph.wouldCycle(tickets, d.id, replacement.id)
      );
      if (loops.length) {
        throw new FlowError(
          `re-pointing at ${replacement.id} would close a dependency cycle:\n` +
          loops.map((d) => `  ${d.id} → ${replacement.id} → … → ${d.id}`).join('\n') +
          '\n  Pick a different replacement, or drop them too with --force.'
        );
      }
    }

    const affected = graph.transitiveDependents(tickets, t.id);
    if (affected.length && !flags.by && !flags.force) {
      throw new FlowError(
        `${t.id} has ${affected.length} live dependent${affected.length === 1 ? '' : 's'}, directly or through others:\n` +
        affected.map((d) => `  ${d.id}  ${d.data.status.padEnd(10)} ${d.data.title}`).join('\n') +
        '\n\nLeft alone they can never become ready. Pick one:\n' +
        `  flow drop ${t.id} --reason "${reason}" --by <id>    re-point them at the replacement\n` +
        `  flow drop ${t.id} --reason "${reason}" --force      drop them too`
      );
    }

    const from = t.data.status;
    t.data.status = 'dropped';
    t.data.reason = reason;
    t.data.resume = '';
    t.data.closed = store.now();
    const moved = store.writeTicket(t);
    out(`${t.id}  ${from} → dropped   ${t.data.title}`);
    out(`      reason: ${reason}`);
    if (moved) out(`      moved → ${rel(root, moved.to)}`);

    // --by only matters for tickets that depend on this one *directly*;
    // anything further out keeps working once the near edge is repaired.
    if (replacement) {
      const repointed = [];
      for (const d of graph.dependents(tickets, t.id)) {
        if (!statuses.LIVE.has(d.data.status)) continue;
        const kept = d.data.deps.filter((x) => x !== t.id);
        d.data.deps = [...new Set([...kept, ...(replacement.id === d.id ? [] : [replacement.id])])];
        store.writeTicket(d);
        repointed.push(d);
      }
      out(`\nre-pointed to ${replacement.id} (${replacement.data.title}):`);
      for (const d of repointed) out(`  ${d.id}  deps → [${d.data.deps.join(', ')}]`);
      if (!repointed.length) out('  nothing to re-point.');
      return 0;
    }

    if (flags.force && affected.length) {
      out(`\ndropped with it (${affected.length}):`);
      for (const d of affected) {
        d.data.status = 'dropped';
        d.data.reason = `dropped with ${t.id} (${t.data.title}), which it depended on`;
        d.data.resume = '';
        d.data.closed = store.now();
        store.writeTicket(d);
        out(`  ${d.id}  ${d.data.title}`);
      }
    }
    return 0;
  },
};

// ---------------------------------------------------------------- the verbs

/**
 * One command per status, built from the table. Every refusal lives in
 * `transition`, so these carry no logic of their own beyond naming a target —
 * which is why adding a status to `statuses.js` is the whole cost of adding a
 * status.
 */
for (const s of statuses.VERBS) {
  const needsReason = statuses.NEEDS_REASON.has(s.name);
  actions[s.verb] = {
    section: 'status',
    args: '<id>',
    summary: statuses.DOES[s.verb],
    flags: {
      ...(needsReason
        ? { reason: { required: true, arg: '"<why>"', missing: `${s.verb}ing needs a reason — in six months it is the only thing that explains the ticket.` } }
        : {}),
      force: { bool: true },
    },
    run({ positional, flags, usage }) {
      if (!positional[0]) throw new FlowError(`usage: ${usage} <id>`);
      const { root, tickets } = load();
      const t = store.findTicket(tickets, positional[0]);
      return transition(t, tickets, root, s.name, {
        force: flags.force,
        reason: flags.reason ? String(flags.reason).trim() : '',
        verb: `flow ${s.verb} ${t.id}`,
      });
    },
  };
}

module.exports = { actions, fallback: actions.get };
