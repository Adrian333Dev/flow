#!/usr/bin/env node
'use strict';
/**
 * flow — tickets for a Flow project.
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
const cases = require('./lib/cases');
const graph = require('./lib/graph');
const render = require('./lib/render');

const USAGE = `flow — tickets, computed from docs/tickets/

the daily loop
  flow next [-n 10] [--all]          what is already in flight, then what could be started —
                                     todo, every dep satisfied, highest priority first. Capped
                                     at 10 and it always says how many it held back
  flow start <id> [--force]          → thinking; refuses on an unsatisfied dep, and on a ticket
                                     that has been split into children
  flow build <id>                    → building; the plan is written, code starts
  flow review <id>                   → review
  flow done <id> [--force]           → done; refuses on a parent with open children
  flow park <id> "<reason>"          → parked; revive it with flow start

looking around
  flow tree [--parent t047] [--all]  the whole shape, nested by parent, siblings by priority.
                                     Done and dropped collapse into the parent's count
  flow ls [status] [--type T] [--parent <id>]
                                     status: todo|thinking|building|review|done|parked|dropped
  flow show <id|slug>                children, progress, and where a priority came from
  flow status                        in flight, in review, parked, ready count
  flow check                         cycles, dangling ids, dropped blockers, dangling parents

ticket edits
  flow ticket new "<title>" [--type feature] [--priority high] [--parent t047]
                            [--deps t045,t046] [--body -] [--from-brainstorm <path>]
                                     --body - reads the whole file body from stdin, so
                                     creating and filling a ticket is one command
                                     --from-brainstorm moves a loose brainstorm folder in
                                     as this ticket's brainstorm/, leaving nothing behind
  flow ticket drop <id> "<reason>" [--by <id> | --force]
                                     refuses while live dependents exist and lists them
                                     transitively. --by re-points them, --force drops them too
  flow ticket dep <id> [--on|--off] <dep-id>
  flow ticket edit <id> [--title "..."] [--type T] [--priority P] [--parent <id>]

study cases                        recorded failures — the one group that works outside a project
  flow study-case issues             every issue with its counts and the rules that failed. Read
                                     it before creating one, so a repeat failure lands in the
                                     folder it already has instead of a second spelling of it
  flow study-case new "<title>" --issue <issue> [--rule "<rule>"] [--body -] [--force]
                                     --rule names the rule that was loaded and did not fire. A
                                     near-miss on an existing issue refuses; --force means it
                                     really is a new kind of failure
  flow study-case ls [--issue X] [--status open|fixed]
  flow study-case fix <ref> --by <file>
                                     → fixed, recording the file that changed. Nothing is deleted

ids     t047, t47 and 47 all mean the same ticket — reference tickets by id, never by path
layout  docs/tickets/<id>-<slug>/ticket.md while live, with brainstorm/ from birth; done
        and dropped tickets move to docs/tickets/archive/ and move back if reopened
parent  a ticket split out of another carries parent: t047. Disk stays flat; the
        hierarchy is frontmatter. A ticket with children is never built itself — it leaves
        flow next, and flow start refuses on it
pri     high or low on disk and nothing else: normal is the absent field, so an ordinary
        ticket has no priority line to go stale. A ticket with none inherits the nearest
        ancestor's, and an explicit value always beats an inherited one — so marking one
        parent high lifts a whole feature, and a low chore inside it stays low
root    the enclosing git repo; override with FLOW_PROJECT=/path
cases   ~/.claude/flow/study-cases/<issue>/<date>-<slug>.md — global, filed by issue and never
        by project, because the payoff is seeing one failure three times. Override with FLOW_HOME`;

const out = (s) => process.stdout.write(s.endsWith('\n') ? s : s + '\n');

const BOOLEAN_FLAGS = ['on', 'off', 'force', 'all'];

// The one short flag. `-n 5` is worth it because a ceiling is adjusted mid-loop;
// nothing else here is typed often enough to earn an alias.
const SHORT_FLAGS = { '-n': 'limit' };

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (SHORT_FLAGS[a]) {
      const value = argv[++i];
      if (value === undefined) throw new FlowError(`${a} needs a value.`);
      flags[SHORT_FLAGS[a]] = value;
      continue;
    }
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

// Ten, not fifteen: `next` answers a question, and a longer answer is a second
// list to triage. The count of what was hidden always prints — a silent
// truncation is the only way a ceiling does harm.
const NEXT_LIMIT = 10;

function nextLimit(flags) {
  if (flags.all) return Infinity;
  if (flags.limit === undefined) return NEXT_LIMIT;
  const n = Number(flags.limit);
  if (!Number.isInteger(n) || n < 1) throw new FlowError(`-n takes a whole number of tickets (got "${flags.limit}")`);
  return n;
}

/**
 * Two questions, one answer: what is already open, and what could be started.
 *
 * The in-flight block leads because this command used to list todos only, so a
 * ticket you were in the middle of was invisible in the one place you looked
 * before picking up the next thing.
 */
function cmdNext(args) {
  const { flags } = parseArgs(args);
  const limit = nextLimit(flags);
  const { tickets } = load();

  const inFlight = tickets.filter((t) => graph.IN_FLIGHT.has(t.data.status));
  if (inFlight.length) {
    out(`in flight (${inFlight.length}) — finish these before starting more:`);
    out(render.indent(render.ticketTable(graph.rank(inFlight, tickets), tickets)));
    out('');
  }

  const ready = graph.readyTickets(tickets);
  if (ready.length) {
    const shown = graph.rank(ready, tickets).slice(0, limit);
    out(render.ticketTable(shown, tickets));
    out(shown.length < ready.length
      ? `\n${shown.length} of ${ready.length} ready — flow next --all`
      : `\n${ready.length} ready.`);
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

const COMMAND_FOR = { thinking: 'start', building: 'build', review: 'review', done: 'done' };

function cmdTransition(args, status) {
  const { positional, flags } = parseArgs(args);
  const verb = COMMAND_FOR[status];
  if (!positional[0]) throw new FlowError(`usage: flow ${verb} <id>`);

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const from = t.data.status;

  if (from === status) { out(`${t.id} is already ${status}.`); return 0; }

  // Starting on a blocked ticket refuses rather than warns. A warning is a line
  // of text an agent reads past; a non-zero exit is the thing it cannot ignore.
  const unmet = status === 'thinking' ? graph.unmetDeps(t, graph.indexById(tickets)) : [];
  if (unmet.length && !flags.force) {
    throw new FlowError(
      `${t.id} is blocked — deps are not satisfied:\n` +
      unmet.map((u) => `  ${render.blockText(u)}`).join('\n') +
      `\n  Clear those first, or override with: flow start ${t.id} --force`
    );
  }

  // The pair to `done` refusing on open children. Until now the guard existed
  // only at the finish line, so a container could be picked up and built, and
  // the contradiction surfaced at the one moment it was too late to matter.
  if (status === 'thinking' && graph.isParent(tickets, t.id) && !flags.force) {
    const kids = graph.children(tickets, t.id).filter((c) => c.data.status !== 'dropped');
    throw new FlowError(
      `${t.id} has been split into ${kids.length} ticket${kids.length === 1 ? '' : 's'} — the work is theirs:\n` +
      kids.map((c) => `  ${c.id}  ${c.data.status.padEnd(8)} ${c.data.title}`).join('\n') +
      `\n  Start one of those, or override with: flow start ${t.id} --force`
    );
  }

  // A parent finishing is a judgment about whether the original question got
  // answered. The children finishing is evidence, not proof — so the call stays
  // with the user and this only refuses to make it for them.
  if (status === 'done') {
    const open = graph.openChildren(tickets, t.id);
    if (open.length && !flags.force) {
      throw new FlowError(
        `${t.id} has ${open.length} open child ticket${open.length === 1 ? '' : 's'} — its work is theirs:\n` +
        open.map((c) => `  ${c.id}  ${c.data.status.padEnd(8)} ${c.data.title}`).join('\n') +
        `\n  Finish those, or close it anyway with: flow done ${t.id} --force`
      );
    }
  }

  const before = graph.readyTickets(tickets).map((x) => x.id);
  const revived = from === 'parked' && t.data.reason;
  t.data.status = status;
  // A reason outlives only the status it explains. Carrying "waiting on the Q3
  // API" into a ticket now being built is worse than carrying nothing.
  t.data.reason = '';
  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → ${status}   ${t.data.title}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);
  if (revived) out(`      revived — cleared reason: ${revived}`);

  if (unmet.length) {
    out('\nforced past unsatisfied deps:');
    for (const u of unmet) out(`  ${render.blockText(u)}`);
  }

  const unblocked = graph.readyTickets(tickets).filter((x) => !before.includes(x.id));
  if (unblocked.length) {
    out('\nnow ready:');
    out(render.indent(render.ticketTable(unblocked)));
  }
  return 0;
}

/**
 * Parking needs a reason and dropping needs a reason, because those are the two
 * exits where the "why" is otherwise unrecoverable. Everywhere else the
 * workflow is its own explanation, and an optional reason is one nobody writes.
 */
function cmdPark(args) {
  const { positional } = parseArgs(args);
  if (!positional[0]) throw new FlowError('usage: flow park <id> "<reason>"');

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const reason = positional.slice(1).join(' ').trim();
  if (!reason) {
    throw new FlowError(
      `parking ${t.id} needs a reason — in six months it is the only thing that explains the ticket.\n` +
      `  flow park ${t.id} "vendor API changes land in Q3, pointless before that"`
    );
  }

  const from = t.data.status;
  if (from === 'parked') { out(`${t.id} is already parked — reason: ${t.data.reason || '-'}`); return 0; }

  t.data.status = 'parked';
  t.data.reason = reason;
  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → parked   ${t.data.title}`);
  out(`      reason: ${reason}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);
  out(`\nrevive with: flow start ${t.id}`);
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
  if (flags.parent) {
    const parent = store.requireId(flags.parent);
    list = list.filter((t) => t.data.parent === parent);
  }

  out(render.ticketTable(graph.rankByStatus(list, tickets), tickets));
  if (list.length) out(`\n${list.length} of ${tickets.length}.`);
  return 0;
}

/**
 * The whole shape, which nothing else showed. `ls` is a flat table with a parent
 * column, `show` is one ticket, `status` groups by status — the hierarchy that
 * `parent` builds had no renderer at all.
 */
function cmdTree(args) {
  const { flags } = parseArgs(args);
  const { tickets } = load();
  if (!tickets.length) { out('no tickets yet.'); return 0; }

  let pool = tickets;
  if (flags.parent) {
    const root = store.findTicket(tickets, flags.parent);
    pool = [root, ...graph.descendants(tickets, root.id)];
  }

  // Done and dropped collapse into the parent's count by default. A tree
  // carrying every finished ticket is the noise a tree exists to strip.
  const visible = flags.all ? pool : pool.filter((t) => !graph.TERMINAL.has(t.data.status));
  if (!visible.length) { out('nothing live here — flow tree --all includes done and dropped.'); return 0; }

  out(render.tree(graph.forest(visible), tickets));
  const hidden = pool.length - visible.length;
  out(`\n${visible.length} ticket${visible.length === 1 ? '' : 's'}` +
    (hidden ? `, ${hidden} done or dropped hidden — flow tree --all` : ''));
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
  const { tickets } = load();
  out(render.status(tickets));
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
    case 'dep': return ticketDep(rest);
    case 'edit': return ticketEdit(rest);
    default: throw new FlowError(`unknown: flow ticket ${sub || ''}\n\n${USAGE}`);
  }
}

function ticketNew(args) {
  const { positional, flags } = parseArgs(args);
  const title = positional.join(' ').trim();
  if (!title) throw new FlowError('usage: flow ticket new "<title>" [--type T] [--priority P] [--parent <id>] [--deps t045,t046] [--body -] [--from-brainstorm <path>]');

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
  const priority = flags.priority ? oneOf(flags.priority, store.TICKET_PRIORITIES, '--priority') : '';
  const deps = store.toIdList(flags.deps);
  for (const d of deps) {
    if (!tickets.some((t) => t.id === d)) throw new FlowError(`--deps names ${d}, which does not exist.`);
  }

  let parent = '';
  if (flags.parent) {
    parent = store.requireId(flags.parent);
    if (!tickets.some((t) => t.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
  }

  // `--from-brainstorm` moves an existing loose brainstorm in as this ticket's
  // own, for the case where the thinking resolved to exactly one unit of work.
  let fromBrainstorm = '';
  if (flags['from-brainstorm'] != null) {
    const given = String(flags['from-brainstorm']).trim();
    if (!given) throw new FlowError('--from-brainstorm expects the path of an existing brainstorm folder.');
    fromBrainstorm = path.resolve(given);
    if (!fs.existsSync(fromBrainstorm) || !fs.statSync(fromBrainstorm).isDirectory()) {
      throw new FlowError(`--from-brainstorm names ${given}, which is not a folder.`);
    }
    if (!fs.existsSync(path.join(fromBrainstorm, 'map.md'))) {
      throw new FlowError(`${given} holds no map.md, so it is not a brainstorm folder.`);
    }
    const live = store.ticketsDir(root);
    if (fromBrainstorm === live || fromBrainstorm.startsWith(live + path.sep)) {
      throw new FlowError(`${given} is inside docs/tickets/, so it already belongs to a ticket.`);
    }
  }

  const t = store.createTicket(root, { title, type, priority, parent, deps, tickets, body, fromBrainstorm });
  out(`created ${t.id}  ${t.data.title}`);
  out(`        ${rel(root, t.file)}`);
  out(`        ${rel(root, path.join(t.dir, 'brainstorm', 'map.md'))}`);
  if (t.movedFrom) out(`        moved  ${rel(root, t.movedFrom)}/ → brainstorm/`);
  if (t.data.priority) out(`        priority: ${t.data.priority}`);
  if (parent) out(`        parent: ${parent}`);
  if (deps.length) out(`        deps: ${deps.join(', ')}`);
  return 0;
}

/**
 * Dropping is the one destructive edit here, and its damage lands on tickets
 * the user was not thinking about: `deps` is stored on one side only, so
 * killing t047 silently strands whatever depended on it. Bare `drop` therefore
 * refuses while live dependents exist and prints the whole chain first.
 */
function ticketDrop(args) {
  const { positional, flags } = parseArgs(args);
  if (!positional[0]) throw new FlowError('usage: flow ticket drop <id> "<reason>" [--by <id> | --force]');

  const { root, tickets } = load();
  const t = store.findTicket(tickets, positional[0]);
  const reason = positional.slice(1).join(' ').trim();
  if (!reason) {
    throw new FlowError(
      `dropping ${t.id} needs a reason — nothing else records why the work died.\n` +
      `  flow ticket drop ${t.id} "we're not shipping a daemon at all"`
    );
  }
  if (flags.by && flags.force) throw new FlowError('--by and --force are mutually exclusive: one rescues dependents, the other kills them.');

  let replacement = null;
  if (flags.by) {
    const byId = store.requireId(flags.by);
    if (byId === t.id) throw new FlowError(`${t.id} cannot replace itself.`);
    replacement = tickets.find((x) => x.id === byId);
    if (!replacement) throw new FlowError(`--by names ${byId}, which does not exist.`);
  }

  const affected = graph.transitiveDependents(tickets, t.id);
  if (affected.length && !flags.by && !flags.force) {
    throw new FlowError(
      `${t.id} has ${affected.length} live dependent${affected.length === 1 ? '' : 's'}, directly or through others:\n` +
      affected.map((d) => `  ${d.id}  ${d.data.status.padEnd(8)} ${d.data.title}`).join('\n') +
      `\n\nLeft alone they can never become ready. Pick one:\n` +
      `  flow ticket drop ${t.id} "${reason}" --by <id>    re-point them at the replacement\n` +
      `  flow ticket drop ${t.id} "${reason}" --force      drop them too`
    );
  }

  const from = t.data.status;
  t.data.status = 'dropped';
  t.data.reason = reason;
  const moved = store.writeTicket(t);
  out(`${t.id}  ${from} → dropped   ${t.data.title}`);
  out(`      reason: ${reason}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);

  // --by only matters for tickets that depend on this one *directly*; anything
  // further out keeps working once the near edge is repaired.
  if (replacement) {
    const repointed = [];
    for (const d of graph.dependents(tickets, t.id)) {
      if (!graph.LIVE.has(d.data.status)) continue;
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
      store.writeTicket(d);
      out(`  ${d.id}  ${d.data.title}`);
    }
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
  if (!positional[0]) throw new FlowError('usage: flow ticket edit <id> [--title "..."] [--type T] [--priority P] [--parent <id>]');

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
  if (flags.priority !== undefined) {
    // `normal` and `""` both clear it — the field goes away rather than storing
    // the default, so the ordinary ticket has no priority line to go stale.
    const priority = flags.priority ? store.toPriority(oneOf(flags.priority, store.TICKET_PRIORITIES, '--priority')) : '';
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
  if (changes.length === 0) throw new FlowError('nothing to change — pass --title, --type, --priority or --parent.');

  store.writeTicket(t);
  out(`${t.id}\n  ${changes.join('\n  ')}`);
  // The folder name is the ticket's identity — links and briefs point at it, so
  // a retitle never moves it.
  if (flags.title !== undefined) out(`\nfolder unchanged: ${rel(root, t.dir)}`);
  return 0;
}

// ------------------------------------------------------------ study cases

function cmdCase(args) {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'issues': return caseIssues(rest);
    case 'new': return caseNew(rest);
    case 'ls': return caseLs(rest);
    case 'fix': return caseFix(rest);
    default: throw new FlowError(`unknown: flow study-case ${sub || ''}\n\n${USAGE}`);
  }
}

function caseIssues() {
  const issues = cases.readIssues();
  out(render.issueTable(issues));
  if (issues.length) {
    const total = issues.reduce((n, i) => n + i.total, 0);
    out(`\n${issues.length} issue${issues.length === 1 ? '' : 's'}, ${total} case${total === 1 ? '' : 's'}  ${cases.casesDir()}`);
  }
  return 0;
}

/**
 * The issue is the folder, and the folder is the whole mechanism — three cases
 * of one failure only add up while they share a name. So `--issue` is required,
 * it is slugified rather than trusted, and a near-miss refuses.
 */
function caseNew(args) {
  const { positional, flags } = parseArgs(args);
  const title = positional.join(' ').trim();
  if (!title) throw new FlowError('usage: flow study-case new "<title>" --issue <issue> [--rule "<rule>"] [--body -] [--force]');
  if (!flags.issue) {
    throw new FlowError('--issue names the kind of failure, not this instance of it. See the ones that exist: flow study-case issues');
  }

  const issue = store.slugify(flags.issue);
  const names = cases.readIssues().map((i) => i.issue);

  if (!names.includes(issue)) {
    const near = cases.nearMatches(issue, names);
    if (near.length && !flags.force) {
      throw new FlowError(
        `"${issue}" is close to an issue that already exists:\n` +
        near.map((n) => `  ${n}`).join('\n') +
        '\n\nOne failure, one folder — a second spelling splits the count and nothing errors.\n' +
        `  Reuse it:           flow study-case new "${title}" --issue ${near[0]}\n` +
        `  A new kind, really: flow study-case new "${title}" --issue ${issue} --force`
      );
    }
  }

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

  const c = cases.createCase({ issue, title, rule: flags.rule, body });
  out(`created ${c.issue}/${c.name}`);
  out(`        ${c.file}`);
  if (c.data.project) out(`        project: ${c.data.project}`);
  if (c.data.rule) out(`        rule: ${c.data.rule}`);
  if (body == null) out('\nPaste the artifact in now, verbatim. The analysis waits.');
  return 0;
}

function caseLs(args) {
  const { flags } = parseArgs(args);
  const all = cases.readCases();

  let list = all;
  if (flags.issue) {
    const issue = store.slugify(flags.issue);
    list = list.filter((c) => c.issue === issue);
  }
  if (flags.status) {
    const status = oneOf(flags.status, cases.CASE_STATUSES, '--status');
    list = list.filter((c) => c.data.status === status);
  }

  out(render.caseList(list));
  if (list.length) out(`\n${list.length} of ${all.length}.`);
  return 0;
}

function caseFix(args) {
  const { positional, flags } = parseArgs(args);
  if (!positional[0]) throw new FlowError('usage: flow study-case fix <ref> --by <file>');
  if (!flags.by) throw new FlowError('--by names the file that changed — a fix nobody can point at is not a fix.');

  const c = cases.findCase(cases.readCases(), positional[0]);
  if (c.data.status === 'fixed') {
    out(`${c.issue}/${c.name} is already fixed by ${c.data.fix || '-'}.`);
    return 0;
  }

  c.data.status = 'fixed';
  c.data.fix = String(flags.by).trim();
  cases.writeCase(c);
  out(`${c.issue}/${c.name}  open → fixed`);
  out(`      fix: ${c.data.fix}`);

  const stillOpen = cases.readCases().filter((x) => x.issue === c.issue && x.data.status === 'open');
  if (stillOpen.length) out(`\n${stillOpen.length} still open in ${c.issue}.`);
  return 0;
}

// ------------------------------------------------------------ dispatch

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || ['-h', '--help', 'help'].includes(argv[0])) { out(USAGE); return 0; }

  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'next': return cmdNext(rest);
    case 'start': return cmdTransition(rest, 'thinking');
    case 'build': return cmdTransition(rest, 'building');
    case 'review': return cmdTransition(rest, 'review');
    case 'done': return cmdTransition(rest, 'done');
    case 'park': return cmdPark(rest);
    case 'ls': return cmdLs(rest);
    case 'tree': return cmdTree(rest);
    case 'show': return cmdShow(rest);
    case 'status': return cmdStatus(rest);
    case 'check': return cmdCheck(rest);
    case 'ticket': return cmdTicket(rest);
    case 'study-case': return cmdCase(rest);
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
