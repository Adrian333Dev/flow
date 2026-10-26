'use strict';
/**
 * Everything that acts on a ticket: `flow tickets`. The noun typed alone
 * lists, `flow tickets -- "label:ui"` narrows the list, and every other word
 * after it is a verb: `flow tickets get exp-47`, `flow tickets start exp-47`.
 *
 * The status verbs are generated from the status table rather than written out.
 * Each is the same call into `transition`, so a verb cannot skip a guard, and a
 * status added to the table arrives with its command already working.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('../lib/error');
const { out, json, readBody, listOf } = require('../lib/cli');
const { projectRootOrNull } = require('../lib/project');
const store = require('../lib/tickets/store');
const graph = require('../lib/tickets/graph');
const order = require('../lib/tickets/rank');
const search = require('../lib/tickets/search');
const query = require('../lib/query');
const render = require('../lib/tickets/render');
const ticketJson = require('../lib/tickets/json');
const { indent } = require('../lib/render');
const statuses = require('../lib/tickets/statuses');
const records = require('../lib/tickets/records');
const registry = require('../lib/registry');
const paths = require('../lib/paths');
const ticketSkills = require('../lib/tickets/ticket-skills');

// True while a write runs (set around it, below): a write outside a project
// refuses, where a read shows the home place.
let writing = false;

// The projects a command read or wrote. After a write their ticket skills are
// synced and they are registered.
const touched = new Set();

/** The refusal for a write that has no project to go to. */
const outside = () => new FlowError(
  'not inside a Flow project, so this has nowhere to write.\n' +
  '  Run flow init here to make this folder a project, or use --project home to write to ~/.flow.'
);

/**
 * The tickets of the project this runs in. Outside one, a read shows the home
 * place under its header line, and a write refuses. `here` is passed by a
 * caller that has already looked; null means it looked and found none.
 */
function load(here = projectRootOrNull()) {
  if (here) {
    touched.add(here);
    return { root: here, tickets: store.readTickets(here) };
  }
  if (writing) throw outside();
  out(placeLine(store.homeRoot()));
  return loadHome();
}

/** The header over a project's tickets in a listing: its prefix, then its folder. */
function placeLine(root) {
  return `${store.prefixOf(root)}  ${paths.shorten(root)}`;
}

/** The home place: the tickets in ~/.flow/, which belong to no project. */
function loadHome() {
  const root = store.homeRoot();
  return { root, tickets: store.readTickets(root) };
}

/** The flag `new`, the list, `next` and `flow notes new` take to name a project by its prefix. */
const PROJECT_FLAG = { arg: '<prefix>' };

/** The project a write goes to: the one `--project` names, else the one it runs in, or a refusal. */
function needProject(flags = {}) {
  const root = flags.project === undefined ? projectRootOrNull() : projectNamed(flags.project, '--project');
  if (!root) throw outside();
  touched.add(root);
  return root;
}

/**
 * The tickets `ls` and `next` list: the project `--project` names, else the
 * one this runs in, else home. The project's header line prints first, so
 * every listing has one shape.
 */
function loadFor(flags = {}) {
  const root = flags.project === undefined ? projectRootOrNull() : projectNamed(flags.project, '--project');
  if (!root) return load(null);
  touched.add(root);
  out(placeLine(root));
  return { root, tickets: store.readTickets(root) };
}

/** True when a query names the `flow-issue` label, which is filed where the fault arose and so is read from every project. */
function wantsIssues(text) {
  return query.parse(text, QUERY_FIELDS).some((term) => term.field === 'label' && term.values.includes('flow-issue'));
}

/**
 * The tickets of every project this machine knows and of home, joined into
 * one list, plus the project this runs in before it has registered. `places`
 * holds each project's own tickets, the project you stand in first and home
 * last. A registered path that is gone is skipped, and `flow doctor` names it.
 */
function loadAll() {
  const here = projectRootOrNull();
  const folders = registry.projects()
    .filter((p) => p.exists && (p.prefix === store.HOME_WORD || fs.existsSync(path.join(p.folder, '.flow'))))
    .map((p) => p.folder);
  if (here && !store.isHome(here) && !registry.registeredAs(here)) folders.push(here);
  const places = folders.map((root) => ({ root, tickets: store.readTickets(root) }));
  const rank = ({ root }) => (store.isHome(root) ? 2 : here && store.prefixOf(root) === store.prefixOf(here) ? 0 : 1);
  places.sort((a, b) => rank(a) - rank(b));
  const tickets = places.flatMap((place) => place.tickets);
  tickets.prefix = here ? store.prefixOf(here) : store.HOME_WORD;
  return { root: here || store.homeRoot(), tickets, places };
}

/**
 * The folder of the project registered under `word`, or a refusal saying what
 * to do. The registry is this machine's list (lib/registry.js), filled by a
 * project's first ticket write.
 */
function registered(word) {
  const folder = registry.read()[word];
  if (!folder) {
    throw new FlowError(
      `no project on this machine has the prefix "${word}".\n` +
      '  A project is registered by its first ticket write: run a command that writes one (flow tickets new, flow tickets start) inside it, once.\n' +
      '  flow doctor lists the projects this machine knows.'
    );
  }
  if (!fs.existsSync(path.join(folder, '.flow'))) {
    throw new FlowError(
      `"${word}" is registered at ${folder}, which holds no .flow/ now.\n` +
      '  If the project moved, a command that writes a ticket inside it updates the path. flow doctor names it.'
    );
  }
  const now = store.prefixOf(folder);
  if (now !== word) {
    throw new FlowError(`"${word}" is registered at ${folder}, whose ticketPrefix is now "${now}". flow doctor names it.`);
  }
  return folder;
}

/**
 * The root a project word names: `home`, the prefix of the project this runs
 * in, or any registered prefix. `by` is what took the word, for the refusal.
 * A folder is refused with the prefix to type instead, since the registry
 * knows every project by its prefix alone; `global` is refused naming `home`.
 */
function projectNamed(value, by) {
  const given = String(value).trim();
  const word = given.toLowerCase();
  if (word === 'global') throw new FlowError('"global" is now named "home": use home for ~/.flow.');
  if (word === store.HOME_WORD) return store.homeRoot();
  const here = projectRootOrNull();
  if (here && store.prefixOf(here) === word) return here;
  const known = registry.read();
  if (store.badWord(word) || (!known[word] && fs.existsSync(path.resolve(given)))) {
    const folder = path.resolve(given);
    const prefix = Object.keys(known).find((p) => known[p] === folder || path.basename(known[p]).toLowerCase() === word);
    throw new FlowError(
      `${given} is not a project prefix. ${by} takes the prefix of a project, such as fw or home, never its folder.\n` +
      (prefix ? `  The project in ${known[prefix]} has the prefix ${prefix}.\n` : '') +
      '  flow doctor lists the prefixes on this machine.'
    );
  }
  return registered(word);
}

const rel = (root, p) => path.relative(root, p) || p;

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
function checkNewLabels(labels, tickets, force) {
  if (force) return;
  const known = new Set(tickets.flatMap((t) => t.data.labels));
  for (const label of labels) {
    if (known.has(label) || label.length < 5) continue;
    const near = [...known].find((k) => k.length >= 5 && search.withinOne(k, label));
    if (near) throw new FlowError(`"${label}" is one typo from the label "${near}". Use that one, or add --force for a new label.`);
  }
}

/**
 * The place `--before <id>`, `--after <id>`, `--first` or `--last` names, as
 * `rank.place` takes it, or null where none is given.
 */
function positionFrom(flags, prefix) {
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
function placeTicket(t, tickets, target) {
  const placed = order.place(order.siblingsOf(tickets, t.data.parent), t, target);
  t.data.rank = placed.rank;
  store.writeTicket(t);
  for (const other of placed.others) {
    other.ticket.data.rank = other.rank;
    store.writeTicket(other.ticket);
  }
  return placed.others.length;
}

/**
 * A child's line in its parent's `## Tasks` follows the child's status: ticked
 * when the child reaches `done`, cleared when a `done` child is reopened.
 * Returns the line to print, or null where there is nothing to say.
 */
function followInParent(t, tickets, from, status) {
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

/**
 * The place an id points at: `home-4` is read from ~/.flow/ wherever this
 * runs, and a word that is the prefix of the project this runs in, or no word
 * at all, from that project. Any other word is a project's prefix, looked up
 * in the registry: the folder you stand in wins, and the rest is reachable
 * from anywhere.
 */
function placeOf(word) {
  if (word === store.HOME_WORD) return loadHome();
  const here = projectRootOrNull();
  if (!word || (here && word === store.prefixOf(here))) return load(here);
  const root = registered(word);
  touched.add(root);
  return { root, tickets: store.readTickets(root) };
}

/**
 * The place a ticket lives, its tickets, and the ticket. An id missing from a
 * project may belong to a ticket `flow tickets move` took home, which kept it as `was:`.
 */
function locate(ref) {
  const place = placeOf(store.wordOf(String(ref || '').trim().toLowerCase()));
  try {
    return { ...place, t: store.findTicket(place.tickets, ref) };
  } catch (e) {
    if (store.isHome(place.root)) throw e;
    const id = store.normalizeId(ref, place.tickets.prefix);
    const home = id && fs.existsSync(store.ticketsDir(store.homeRoot())) ? loadHome() : null;
    const moved = home && home.tickets.find((t) => t.data.was === id);
    if (moved) return { ...home, t: moved };
    throw e;
  }
}

// ---------------------------------------------------------------- moving

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
function transition(t, tickets, root, status, { force, reason, verb, batch, activity }) {
  const from = t.data.status;
  const result = (fields) => json({
    ticket: ticketJson.record(t, tickets), from, to: status, already: false, revived: '', inParent: null,
    nowReady: [], nowBlocked: [], forcedPast: [], ...fields,
  });
  if (from === status) {
    // A skill resuming a ticket in progress still names its kind of work.
    if (activity && status === 'in-progress' && t.data.activity !== activity) {
      const was = t.data.activity || '-';
      t.data.activity = activity;
      store.writeTicket(t);
      records.commit(root, `${t.id}: activity ${was} → ${activity}`);
      out(`${t.id} is already ${status}.\n      activity: ${was} → ${activity}`);
      result({ already: true });
      return 0;
    }
    out(`${t.id} is already ${status}.`);
    result({ already: true });
    return 0;
  }

  if (statuses.NEEDS_REASON.has(status) && !reason) {
    throw new FlowError(
      `moving ${t.id} to ${status} needs a reason:\n` +
      `  ${verb} --reason "vendor API changes land in Q3, pointless before that"\n` +
      'Open the reason with the words that matter most: a narrow list shows only the first ones.'
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
  if (entering && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${openKids.length} open child ticket${openKids.length === 1 ? '' : 's'}, finish those first:\n` +
      openKids.map((c) => `  ${store.nameOf(c)}  ${c.data.status}`).join('\n') +
      `\n  Or override with: ${verb} --force`
    );
  }

  // A parent finishing is a judgment about whether the original question got
  // answered. The children finishing is evidence, not proof, so the call stays
  // with the user and this only refuses to make it for them.
  if (status === 'done' && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${openKids.length} open child ticket${openKids.length === 1 ? '' : 's'}, its work is theirs:\n` +
      openKids.map((c) => `  ${store.nameOf(c)}  ${c.data.status}`).join('\n') +
      `\n  Finish those, or close it anyway with: ${verb} --force`
    );
  }

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

// ---------------------------------------------------------------- the board

const actions = {};

const QUERY_FIELDS = ['label', 'status', 'parent', 'filed'];
const OPEN_STATUSES = statuses.NAMES.filter((name) => !statuses.TERMINAL.has(name));
// `flow tickets labels` lists the tickets themselves up to this many, so one call reaches the leaf.
const LIST_UP_TO = 10;

/**
 * The tickets one quoted query names (lib/query.js, the grammar `flow notes`
 * reads). Done and dropped stay out unless the query names a `status:` term,
 * and `status:all` names every status. `hidden` counts the ones left out.
 * `parent:<id>` names the ticket and everything under it, to any depth.
 */
function select(tickets, text) {
  const terms = query.parse(text, QUERY_FIELDS);
  for (const term of terms) {
    if (term.field === 'status') {
      const bad = term.values.find((v) => v !== 'all' && !statuses.NAMES.includes(v));
      if (bad) throw new FlowError(`status:${bad} is no status. They are ${statuses.NAMES.join(', ')}, or all.`);
    }
    if (term.field === 'filed') {
      const bad = term.values.find((v) => v !== 'yes' && v !== 'no');
      if (bad) throw new FlowError(`filed:${bad} should be filed:yes or filed:no.`);
    }
    if (term.field === 'parent') term.values = term.values.map((v) => store.requireId(v, tickets.prefix));
  }
  const index = graph.indexById(tickets);
  const test = (list) => query.matcher(list, {
    word: (t, w) => search.matcher([w])(t),
    label: (t, v) => t.data.labels.includes(v),
    status: (t, v) => v === 'all' || t.data.status === v,
    parent: (t, v) => t.id === v || graph.isUnder(t, v, index),
    filed: (t, v) => (v === 'yes') === Boolean(t.data.filed),
  });
  if (query.has(terms, 'status')) return { terms, list: tickets.filter(test(terms)), hidden: 0, parked: 0 };
  const everything = tickets.filter(test(terms));
  const list = everything.filter((t) => OPEN_STATUSES.includes(t.data.status) && t.data.status !== 'parked');
  const parked = everything.filter((t) => t.data.status === 'parked').length;
  return { terms, list, hidden: everything.length - list.length - parked, parked };
}

/** What a default listing left out: parked tickets, then done and dropped ones. */
function hiddenNote(hidden, parked) {
  const parts = [parked ? `${parked} parked` : '', hidden ? `${hidden} done or dropped` : ''].filter(Boolean);
  return parts.length ? `${parts.join(', ')} hidden: "status:all"` : '';
}

/**
 * `flow tickets`, typed alone or with a query: the open tickets, each child
 * under its parent to any depth. A child whose parent the query left out
 * roots where it is, its row naming the parent. `--flat` prints the table.
 */
const listing = {
  summary: 'list open tickets as a tree; a query like "label:ui,api status:all budget" narrows it',
  args: '[-- "<query>"]',
  query: true,
  flags: { project: PROJECT_FLAG, flat: { bool: true } },
  run({ query: text, flags }) {
    const across = flags.project === undefined && wantsIssues(text);
    const { tickets, places } = across ? loadAll() : loadFor(flags);
    const { list, hidden, parked } = select(tickets, text);
    const draw = (shown) => (flags.flat ? render.ticketTable(graph.rankByStatus(shown, tickets)) : render.listing(shown, tickets));

    // Issues across projects print one group per project; any other listing is the one group loadFor headed.
    const groups = places ? places.map(({ root }) => list.filter((t) => t.root === root)) : [list];
    groups.forEach((shown, i) => {
      if (places) out(`${i ? '\n' : ''}${placeLine(places[i].root)}`);
      out(draw(shown));
    });
    const note = hiddenNote(hidden, parked);
    if (list.length) out(`\n${list.length} of ${tickets.length}${note ? `, ${note}` : ''}.`);
    else if (note) out(note);

    json({
      tickets: groups.flatMap((shown) => ticketJson.list(graph.forest(shown), tickets)),
      total: tickets.length,
      hidden,
      parked,
    });
    return 0;
  },
};

/**
 * The labels on the tickets a query names, to narrow by: each other label with
 * how many of them carry it. A set small enough to read is listed whole.
 */
actions.labels = {
  summary: 'the labels on the tickets a query names, with counts; the tickets too when 10 or fewer',
  args: '[-- "<query>"]',
  query: true,
  run({ query: text }) {
    const { tickets } = wantsIssues(text) ? loadAll() : load();
    const { terms, list, hidden, parked } = select(tickets, text);
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

actions.check = {
  summary: 'cycles, dangling ids, dropped blockers, orphaned parents, unknown statuses',
  run() {
    const problems = graph.check(load().tickets);
    out(render.checkReport(problems));
    const ids = (list) => list.map((t) => t.id);
    json({
      ok: !graph.hasProblems(problems),
      cycles: problems.cycles,
      dangling: problems.dangling.map((d) => ({ id: d.ticket.id, dep: d.dep })),
      droppedBlockers: problems.droppedBlockers.map((d) => ({ id: d.ticket.id, dep: d.dep })),
      danglingParents: problems.danglingParents.map((d) => ({ id: d.ticket.id, parent: d.parent })),
      closedParents: problems.closedParents.map((d) => ({ id: d.ticket.id, parent: d.parent.id, parentStatus: d.parent.data.status })),
      unknownStatuses: problems.unknownStatuses.map((t) => ({ id: t.id, status: t.data.status })),
      unnamed: ids(problems.unnamed),
    });
    return graph.hasProblems(problems) ? 1 : 0;
  },
};

// ---------------------------------------------------------------- one ticket

/**
 * The word must be or hold an id, since a title word would otherwise find a
 * ticket. `flow tickets -- "<words>"` finds a ticket by its words.
 */
actions.get = {
  args: '<id>',
  summary: 'one ticket in full',
  run({ positional, usage }) {
    const [ref, ...extra] = positional;
    if (!ref || extra.length) throw new FlowError(`usage: ${usage} <id>, such as ${usage} exp-47. The board is flow next.`);
    if (!/^\d+$/.test(ref) && !store.idOfRef(ref)) {
      throw new FlowError(`"${ref}" is no ticket id. Find one by its words with flow tickets -- "${ref}".`);
    }

    const { root, tickets, t } = locate(ref);
    out(render.show(t, tickets, root));
    json(ticketJson.full(t, tickets));
    return 0;
  },
};

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
function takeBack(root, t) {
  store.remove(t);
  records.commit(root, `${t.id}: taken back, never sent`);
}

actions.new = {
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
    for (const d of deps) {
      if (!tickets.some((t) => t.id === d)) throw new FlowError(`--deps names ${d}, which does not exist.`);
    }

    let parent = '';
    if (flags.parent) {
      parent = store.requireId(flags.parent, tickets.prefix);
      if (!tickets.some((t) => t.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
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
actions.edit = {
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
    const changes = [];
    const fields = [];
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
      // Empty clears it: `--parent ""` un-splits a ticket.
      const parent = flags.parent ? store.requireId(flags.parent, tickets.prefix) : '';
      if (parent) {
        if (parent === t.id) throw new FlowError('a ticket cannot be its own parent.');
        if (!tickets.some((x) => x.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
        if (graph.wouldOrphan(tickets, t.id, parent)) {
          throw new FlowError(`${t.id} → ${parent} would make ${t.id} its own ancestor.`);
        }
      }
      change('parent', parent, `parent: ${t.data.parent || '-'} → ${parent || '-'}`);
    }
    if (flags.deps !== undefined) {
      // The whole list, the way `flow tickets new --deps` takes it. Empty clears it.
      const deps = [...new Set(store.toIdList(flags.deps, tickets.prefix))];
      for (const d of deps) {
        if (d === t.id) throw new FlowError('a ticket cannot depend on itself.');
        if (!tickets.some((x) => x.id === d)) throw new FlowError(`--deps names ${d}, which does not exist.`);
        if (graph.wouldCycle(tickets, t.id, d)) throw new FlowError(`${t.id} → ${d} would close a dependency cycle. Run flow tickets check.`);
      }
      change('deps', deps, `deps: [${t.data.deps.join(', ')}] → [${deps.join(', ')}]`);
    }

    if (flags.label !== undefined) {
      // The whole list, the way `--deps` takes it. Empty clears it.
      const labels = labelsFrom(flags.label);
      checkNewLabels(labels, tickets, flags.force);
      change('labels', labels, `labels: [${t.data.labels.join(', ')}] → [${labels.join(', ')}]`);
    }

    if (flags.activity !== undefined) {
      // The kind of work under way, shown on the band. Empty clears it.
      const activity = String(flags.activity).trim().toLowerCase();
      if (activity) {
        const refused = store.badActivity(activity);
        if (refused) throw new FlowError(refused);
        if (t.data.status !== 'in-progress') {
          throw new FlowError(`${t.id} is ${t.data.status}: only an in-progress ticket has an activity. Start it with flow tickets start ${t.id}.`);
        }
      }
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
actions.rank = {
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
actions.file = {
  args: '<id,id>',
  summary: 'stamp today on everything the filing pass swept',
  flags: { force: { bool: true } },
  run({ positional, flags, usage }) {
    const refs = listOf(positional[0]);
    if (!refs.length || positional.length > 1) throw new FlowError(`usage: ${usage} <id,id>, one comma-joined list`);

    const { root, tickets } = locate(refs[0]);
    const stamp = store.today();
    const targets = refs.map((ref) => store.findTicket(tickets, ref));
    const filed = [];

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

    let replacement = null;
    if (flags.by) {
      const byId = store.requireId(flags.by, tickets.prefix);
      if (byId === t.id) throw new FlowError(`${t.id} cannot replace itself.`);
      replacement = tickets.find((x) => x.id === byId);
      if (!replacement) throw new FlowError(`--by names ${byId}, which does not exist.`);

      // A dropped replacement blocks every dependent forever, which is the
      // exact harm --by exists to prevent. `done` is fine: the edge is
      // satisfied on arrival, so it costs nothing beyond a line of frontmatter.
      if (replacement.data.status === 'dropped') {
        throw new FlowError(
          `--by names ${replacement.id}, which is itself dropped: those dependents could never become ready.\n` +
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
      const repointed = [];
      for (const d of graph.dependents(tickets, t.id)) {
        if (!statuses.LIVE.has(d.data.status)) continue;
        const kept = d.data.deps.filter((x) => x !== t.id);
        d.data.deps = [...new Set([...kept, ...(replacement.id === d.id ? [] : [replacement.id])])];
        store.writeTicket(d);
        repointed.push(d);
      }
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
actions.move = {
  args: '<id,id> <home|prefix>',
  summary: 'move tickets to ~/.flow/ or another project by its prefix, each taking a new number there',
  run({ positional, usage }) {
    if (positional.length !== 2) throw new FlowError(`usage: ${usage} <id,id> <home|prefix>, the ids one comma-joined list`);
    const [given, to] = positional;
    const refs = listOf(given);

    const from = locate(refs[0]);
    const moving = refs.map((ref) => store.findTicket(from.tickets, ref));
    const ids = new Set(moving.map((t) => t.id));

    const target = projectNamed(to, 'move');
    touched.add(target);
    if (path.resolve(store.recordsDir(target)) === path.resolve(store.recordsDir(from.root))) {
      throw new FlowError(`${moving[0].id} already lives there.`);
    }

    const links = [];
    for (const t of moving) {
      for (const d of t.data.deps) if (!ids.has(d)) links.push(`${t.id} depends on ${d}`);
      if (t.data.parent && !ids.has(t.data.parent)) links.push(`${t.id} has parent ${t.data.parent}`);
    }
    for (const other of from.tickets) {
      if (ids.has(other.id)) continue;
      for (const d of other.data.deps) if (ids.has(d)) links.push(`${other.id} depends on ${d}`);
      if (ids.has(other.data.parent)) links.push(`${other.id} has parent ${other.data.parent}`);
    }
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

// ---------------------------------------------------------------- the verbs

/**
 * One command per status, built from the table. Every refusal lives in
 * `transition`, so these carry no logic of their own beyond naming a target,
 * which is why adding a status to `statuses.js` is the whole cost of adding a
 * status.
 */
for (const s of statuses.VERBS) {
  const needsReason = statuses.NEEDS_REASON.has(s.name);
  actions[s.verb] = {
    args: '<id>',
    summary: statuses.DOES[s.verb],
    flags: {
      ...(s.name === 'in-progress' ? { activity: { arg: '<word>' } } : {}),
      ...(needsReason
        ? { reason: { required: true, arg: '"<why>"', missing: `${s.verb}ing needs a reason: in six months it is the only thing that explains the ticket.` } }
        : {}),
      force: { bool: true },
    },
    run({ positional, flags, usage }) {
      if (!positional[0]) throw new FlowError(`usage: ${usage} <id>`);
      const activity = flags.activity ? String(flags.activity).trim().toLowerCase() : '';
      const refused = activity && store.badActivity(activity);
      if (refused) throw new FlowError(refused);
      const { root, tickets, t } = locate(positional[0]);
      return transition(t, tickets, root, s.name, {
        activity,
        force: flags.force,
        reason: flags.reason ? String(flags.reason).trim() : '',
        verb: `flow tickets ${s.verb} ${t.id}`,
      });
    },
  };
}

// ---------------------------------------------------------------- ticket skills

/**
 * The `/` list's ticket rows follow every write: `lib/tickets/ticket-skills.js`. Once
 * per command, after it ran, so a command that refused changes nothing. Every
 * project the command touched is synced, which may be another than the one it
 * ran in, and the tickets in ~/.flow/ are always synced, so a move between
 * two places updates both. A failure here never fails the command, whose
 * write already landed.
 */
function syncSkills() {
  const projects = [...touched].filter((root) => !store.isHome(root));
  for (const project of projects.length ? projects : [null]) {
    try {
      ticketSkills.sync({ project });
    } catch (e) {
      process.stderr.write(`flow: the ticket skills were not updated: ${e.message}\n`);
    }
  }
}

/**
 * A command that wrote a ticket registers the projects it touched
 * (lib/registry.js). A refusal here never fails the command, whose write
 * already landed.
 */
function registerProjects() {
  for (const root of touched) {
    try {
      registry.register(root);
    } catch {
      // The registry is unwritable: `flow doctor` says so.
    }
  }
}

const WRITES = ['new', 'edit', 'rank', 'file', 'drop', 'move', ...statuses.VERBS.map((s) => s.verb)];
for (const name of WRITES) {
  const run = actions[name].run;
  actions[name].run = (call) => {
    writing = true;
    let code;
    try {
      code = run(call);
    } finally {
      writing = false;
    }
    syncSkills();
    registerProjects();
    return code;
  };
}

module.exports = {
  summary: 'the tickets: list, read, create, change and move them',
  list: listing,
  actions,
  transition, load, loadFor, outside, projectNamed, PROJECT_FLAG,
};
