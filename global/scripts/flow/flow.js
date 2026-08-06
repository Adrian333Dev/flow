#!/usr/bin/env node
'use strict';
/**
 * flow — tickets and topics for a Flow project.
 *
 * Frontmatter is owned by these commands; everything else in a ticket is
 * written by hand. The project root is found from the current directory, so no
 * command takes a path.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./lib/error');
const { projectRoot } = require('./lib/root');
const store = require('./lib/store');
const graph = require('./lib/graph');
const render = require('./lib/render');

const USAGE = `flow — tickets and topics, computed from docs/tickets/ and docs/topics/

the daily loop
  flow next                          workable now — todo with every dep satisfied
  flow start  <id> [--force]         → in-progress; refuses while a dep is unsatisfied
  flow review <id>                   → review
  flow done   <id>                   → done

looking around
  flow ls [status] [--type T] [--topic S]    status: todo|in-progress|review|done|dropped|superseded
  flow show <id|slug>
  flow status                        active topic, in flight, in review, ready count
  flow check                         cycles, dangling ids, dropped blockers

ticket edits
  flow ticket new "<title>" [--type feature] [--topic <slug>] [--deps t045,t046] [--body -]
                                     --body - reads the whole file body from stdin, so
                                     creating and filling a ticket is one command
  flow ticket drop <id>
  flow ticket supersede <id> --by t020,t021     dependents are re-pointed
  flow ticket dep <id> [--on|--off] <dep-id>
  flow ticket edit <id> [--title "..."] [--type T] [--topic S]

topics
  flow topic new "<title>" [--from t014] [--slug <slug>]
  flow topic ls
  flow topic park|commit|drop <slug>

ids     t047, t47 and 47 all mean the same ticket — reference tickets by id, never by path
layout  docs/tickets/<id>-<slug>/ticket.md while live; done, dropped and superseded
        tickets move to docs/tickets/archive/ and move back if reopened
root    the enclosing git repo; override with FLOW_PROJECT=/path`;

const out = (s) => process.stdout.write(s.endsWith('\n') ? s : s + '\n');

const BOOLEAN_FLAGS = ['on', 'off', 'force'];

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const eq = a.indexOf('=');
    const name = eq === -1 ? a.slice(2) : a.slice(2, eq);
    if (BOOLEAN_FLAGS.includes(name)) { flags[name] = true; continue; }
    const value = eq === -1 ? argv[++i] : a.slice(eq + 1);
    if (value === undefined) throw new FlowError(`--${name} needs a value.`);
    flags[name] = value;
  }
  return { positional, flags };
}

const oneOf = (value, allowed, label) => {
  if (!allowed.includes(value)) throw new FlowError(`${label} must be one of: ${allowed.join(', ')} (got "${value}")`);
  return value;
};

// Loads root + tickets in one step — nearly every command needs both.
function load() {
  const root = projectRoot();
  return { root, tickets: store.readTickets(root) };
}

const rel = (root, p) => path.relative(root, p) || p;

// ------------------------------------------------------------ daily loop

function cmdNext() {
  const { tickets } = load();
  const ready = graph.readyTickets(tickets);

  if (ready.length) {
    out(render.ticketTable(ready));
    out(`\n${ready.length} ready.`);
    return 0;
  }

  const blocked = graph.blockedTickets(tickets);
  if (blocked.length === 0) {
    out(tickets.length ? 'nothing ready and nothing blocked — no todo tickets left.' : 'no tickets yet.');
    return 0;
  }
  out(`nothing ready. ${blocked.length} todo ticket${blocked.length === 1 ? '' : 's'} blocked:\n`);
  out(render.blockedLines(blocked.slice(0, 8)));
  if (blocked.length > 8) out(`\n  … and ${blocked.length - 8} more (flow ls todo)`);
  return 0;
}

function cmdTransition(args, status) {
  const { positional, flags } = parseArgs(args);
  if (!positional[0]) throw new FlowError(`usage: flow ${status === 'in-progress' ? 'start' : status} <id>`);

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const from = t.data.status;

  if (from === status) { out(`${t.id} is already ${status}.`); return 0; }

  // Starting on a blocked ticket refuses rather than warns. A warning is a line
  // of text an agent reads past; a non-zero exit is the thing it cannot ignore.
  const unmet = status === 'in-progress' ? graph.unmetDeps(t, graph.indexById(tickets)) : [];
  if (unmet.length && !flags.force) {
    throw new FlowError(
      `${t.id} is blocked — deps are not satisfied:\n` +
      unmet.map((u) => `  ${render.reasonText(u)}`).join('\n') +
      `\n  Clear those first, or override with: flow start ${t.id} --force`
    );
  }

  const before = graph.readyTickets(tickets).map((x) => x.id);
  t.data.status = status;
  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → ${status}   ${t.data.title}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);

  if (unmet.length) {
    out('\nforced past unsatisfied deps:');
    for (const u of unmet) out(`  ${render.reasonText(u)}`);
  }

  const unblocked = graph.readyTickets(tickets).filter((x) => !before.includes(x.id));
  if (unblocked.length) {
    out('\nnow ready:');
    out(render.indent(render.ticketTable(unblocked)));
  }
  return 0;
}

// ------------------------------------------------------------ looking around

function cmdLs(args) {
  const { positional, flags } = parseArgs(args);
  const { tickets } = load();

  let list = tickets;
  if (positional[0]) {
    const status = oneOf(positional[0], store.TICKET_STATUSES, 'status');
    list = list.filter((t) => t.data.status === status);
  }
  if (flags.type) {
    const type = oneOf(flags.type, store.TICKET_TYPES, '--type');
    list = list.filter((t) => t.data.type === type);
  }
  if (flags.topic) list = list.filter((t) => t.data.topic === flags.topic);

  out(render.ticketTable(list));
  if (list.length) out(`\n${list.length} of ${tickets.length}.`);
  return 0;
}

function cmdShow(args) {
  const { positional } = parseArgs(args);
  if (!positional[0]) throw new FlowError('usage: flow show <id|slug>');
  const { root, tickets } = load();
  out(render.show(store.findTicket(tickets, positional[0]), tickets, root));
  return 0;
}

function cmdStatus() {
  const { root, tickets } = load();
  out(render.status(tickets, store.readTopics(root)));
  return 0;
}

function cmdCheck() {
  const { tickets } = load();
  const problems = graph.check(tickets);
  out(render.checkReport(problems));
  return graph.hasProblems(problems) ? 1 : 0;
}

// ------------------------------------------------------------ ticket edits

function cmdTicket(args) {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'new': return ticketNew(rest);
    case 'drop': return ticketDrop(rest);
    case 'supersede': return ticketSupersede(rest);
    case 'dep': return ticketDep(rest);
    case 'edit': return ticketEdit(rest);
    default: throw new FlowError(`unknown: flow ticket ${sub || ''}\n\n${USAGE}`);
  }
}

function ticketNew(args) {
  const { positional, flags } = parseArgs(args);
  const title = positional.join(' ').trim();
  if (!title) throw new FlowError('usage: flow ticket new "<title>" [--type T] [--topic S] [--deps t045,t046] [--body -]');

  // `--body -` reads the file body from stdin, so a ticket is created and
  // written in one command instead of create-then-edit.
  let body;
  if (flags.body === '-') {
    try {
      body = fs.readFileSync(0, 'utf8');
    } catch {
      throw new FlowError('--body - expects the body on stdin, and nothing was piped in.');
    }
    if (!body.trim()) throw new FlowError('--body - got empty stdin.');
  } else if (flags.body != null) {
    body = flags.body;
  }

  const root = projectRoot();
  const tickets = store.readTickets(root);

  const type = flags.type ? oneOf(flags.type, store.TICKET_TYPES, '--type') : 'feature';
  const deps = store.toIdList(flags.deps);
  for (const d of deps) {
    if (!tickets.some((t) => t.id === d)) throw new FlowError(`--deps names ${d}, which does not exist.`);
  }
  if (flags.topic && !store.readTopics(root).some((tp) => tp.slug === flags.topic)) {
    process.stderr.write(`flow: warning — no topic "${flags.topic}" exists yet.\n`);
  }

  const t = store.createTicket(root, { title, type, topic: flags.topic, deps, tickets, body });
  out(`created ${t.id}  ${t.data.title}`);
  out(`        ${rel(root, t.file)}`);
  if (deps.length) out(`        deps: ${deps.join(', ')}`);
  return 0;
}

function ticketDrop(args) {
  const { positional } = parseArgs(args);
  if (!positional[0]) throw new FlowError('usage: flow ticket drop <id>');

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const from = t.data.status;
  t.data.status = 'dropped';
  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → dropped   ${t.data.title}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);

  const live = graph.dependents(tickets, t.id).filter((d) => graph.LIVE.has(d.data.status));
  if (live.length) {
    out(`\nwarning — ${live.length} live ticket${live.length === 1 ? '' : 's'} depend${live.length === 1 ? 's' : ''} on ${t.id} and can never become ready:`);
    for (const d of live) out(`  ${d.id}  ${d.data.title}`);
    out(`\nfix each with: flow ticket dep <id> --off ${t.id}`);
  }
  return 0;
}

function ticketSupersede(args) {
  const { positional, flags } = parseArgs(args);
  if (!positional[0] || !flags.by) throw new FlowError('usage: flow ticket supersede <id> --by t020,t021');

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const by = store.toIdList(flags.by);
  if (by.length === 0) throw new FlowError('--by needs at least one ticket id.');
  for (const b of by) {
    if (!tickets.some((x) => x.id === b)) throw new FlowError(`--by names ${b}, which does not exist.`);
    if (b === t.id) throw new FlowError(`${t.id} cannot supersede itself.`);
  }

  const from = t.data.status;
  t.data.status = 'superseded';
  t.data.by = by;
  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → superseded by ${by.join(', ')}   ${t.data.title}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);

  // Dependents re-point to the replacements — that is the whole reason
  // `superseded` exists as a status separate from `dropped`.
  const repointed = [];
  for (const d of graph.dependents(tickets, t.id)) {
    if (!graph.LIVE.has(d.data.status)) continue;
    const kept = d.data.deps.filter((x) => x !== t.id);
    d.data.deps = [...new Set([...kept, ...by.filter((b) => b !== d.id)])];
    store.writeTicket(d);
    repointed.push(d);
  }
  if (repointed.length) {
    out('\nre-pointed:');
    for (const d of repointed) out(`  ${d.id}  deps → [${d.data.deps.join(', ')}]`);
  }
  return 0;
}

function ticketDep(args) {
  const { positional, flags } = parseArgs(args);
  if (positional.length < 2) throw new FlowError('usage: flow ticket dep <id> [--on|--off] <dep-id>');
  if (flags.on && flags.off) throw new FlowError('--on and --off are mutually exclusive.');

  const { tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const dep = store.requireId(positional[1]);
  const removing = Boolean(flags.off);

  if (removing) {
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
}

function ticketEdit(args) {
  const { positional, flags } = parseArgs(args);
  if (!positional[0]) throw new FlowError('usage: flow ticket edit <id> [--title "..."] [--type T] [--topic S]');

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const changes = [];

  if (flags.title !== undefined) {
    changes.push(`title: "${t.data.title}" → "${flags.title}"`);
    t.data.title = String(flags.title).trim();
  }
  if (flags.type !== undefined) {
    const type = oneOf(flags.type, store.TICKET_TYPES, '--type');
    changes.push(`type: ${t.data.type} → ${type}`);
    t.data.type = type;
  }
  if (flags.topic !== undefined) {
    changes.push(`topic: ${t.data.topic || '-'} → ${flags.topic || '-'}`);
    t.data.topic = flags.topic;
    if (flags.topic && !store.readTopics(root).some((tp) => tp.slug === flags.topic)) {
      process.stderr.write(`flow: warning — no topic "${flags.topic}" exists yet.\n`);
    }
  }
  if (changes.length === 0) throw new FlowError('nothing to change — pass --title, --type or --topic.');

  store.writeTicket(t);
  out(`${t.id}\n  ${changes.join('\n  ')}`);
  // The folder name is the ticket's identity — links and briefs point at it, so
  // a retitle never moves it.
  if (flags.title !== undefined) out(`\nfolder unchanged: ${rel(root, t.dir)}`);
  return 0;
}

// ------------------------------------------------------------ topics

function cmdTopic(args) {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'new': return topicNew(rest);
    case 'ls': return topicLs();
    case 'park': return topicSet(rest, 'parked');
    case 'commit': return topicSet(rest, 'committed');
    case 'drop': return topicSet(rest, 'dropped');
    default: throw new FlowError(`unknown: flow topic ${sub || ''}\n\n${USAGE}`);
  }
}

function topicNew(args) {
  const { positional, flags } = parseArgs(args);
  const title = positional.join(' ').trim();
  if (!title) throw new FlowError('usage: flow topic new "<title>" [--from t014] [--slug <slug>]');

  const root = projectRoot();
  const tickets = store.readTickets(root);
  const from = store.toIdList(flags.from);
  for (const f of from) {
    if (!tickets.some((t) => t.id === f)) throw new FlowError(`--from names ${f}, which does not exist.`);
  }

  const tp = store.createTopic(root, { title, slug: flags.slug, from });
  out(`created topic ${tp.slug}  ${tp.data.title}`);
  out(`              ${rel(root, tp.file)}`);
  if (from.length) out(`              from: ${from.join(', ')}`);
  return 0;
}

function topicLs() {
  const { root, tickets } = load();
  out(render.topicTable(store.readTopics(root), tickets));
  return 0;
}

function topicSet(args, status) {
  const { positional } = parseArgs(args);
  if (!positional[0]) throw new FlowError(`usage: flow topic ${status === 'parked' ? 'park' : status === 'committed' ? 'commit' : 'drop'} <slug>`);

  const root = projectRoot();
  const tp = store.findTopic(store.readTopics(root), positional[0]);
  const from = tp.data.status;
  if (from === status) { out(`${tp.slug} is already ${status}.`); return 0; }

  tp.data.status = status;
  store.writeTopic(tp);
  out(`${tp.slug}  ${from} → ${status}   ${tp.data.title}`);

  if (status === 'committed') {
    const own = store.readTickets(root).filter((t) => t.data.topic === tp.slug);
    out(own.length
      ? `\n${own.length} ticket${own.length === 1 ? '' : 's'} carry this topic.`
      : '\nwarning — no ticket carries this topic yet. "committed" means the brainstorm produced tickets.');
  }
  return 0;
}

// ------------------------------------------------------------ dispatch

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || ['-h', '--help', 'help'].includes(argv[0])) { out(USAGE); return 0; }

  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'next': return cmdNext(rest);
    case 'start': return cmdTransition(rest, 'in-progress');
    case 'review': return cmdTransition(rest, 'review');
    case 'done': return cmdTransition(rest, 'done');
    case 'ls': return cmdLs(rest);
    case 'show': return cmdShow(rest);
    case 'status': return cmdStatus(rest);
    case 'check': return cmdCheck(rest);
    case 'ticket': return cmdTicket(rest);
    case 'topic': return cmdTopic(rest);
    default: throw new FlowError(`unknown command "${cmd}".\n\n${USAGE}`);
  }
}

try {
  process.exitCode = main() || 0;
} catch (e) {
  if (e instanceof FlowError) {
    process.stderr.write(`flow: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
