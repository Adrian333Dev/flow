'use strict';
/**
 * The board's output: the ticket table, the tree, one ticket shown whole, the
 * status and brief, and the graph check. Plain text, as `lib/render.js` says.
 */

const path = require('path');
const { columns, table, indent } = require('../render');
const graph = require('./graph');
const store = require('./store');
const statuses = require('./statuses');
const ticketHistory = require('./ticket-history');

function ticketTable(tickets) {
  if (tickets.length === 0) return 'no tickets.';
  return table(
    ['TICKET', 'STATUS', 'LABELS', 'PARENT'],
    tickets.map((t) => [
      store.nameOf(t), t.data.status, t.data.labels.join(',') || '-', t.data.parent || '-',
    ])
  );
}

/**
 * The forest, drawn. One line per ticket: the branch, then status and whatever
 * single fact matters most about it: how much of a parent is done, what a
 * blocked ticket waits on, why a parked one was set aside.
 */
function tree(nodes, all) {
  if (!nodes.length) return 'nothing to show.';
  const index = graph.indexById(all);
  const rows = [];

  const walk = (list, prefix, root) => {
    list.forEach((n, i) => {
      const last = i === list.length - 1;
      const t = n.ticket;
      rows.push([
        prefix + (root ? '' : last ? '└── ' : '├── ') + store.nameOf(t),
        t.data.status,
        treeNote(t, all, index),
      ]);
      if (n.children.length) walk(n.children, root ? '' : prefix + (last ? '    ' : '│   '), false);
    });
  };

  walk(nodes, '', true);
  return columns(rows);
}

/**
 * Counted against every ticket, never the visible slice: a parent whose
 * children are all done must still read 3/3 once those children are hidden.
 */
function treeNote(t, all, index) {
  const kids = graph.children(all, t.id);
  if (kids.length) return `${progressOf(t, all)} done`;
  if (t.data.status === 'todo') {
    const unmet = graph.unmetDeps(t, index);
    if (unmet.length) return `blocked by ${unmet.map((u) => u.dep).join(', ')}`;
  }
  return t.data.reason || '';
}

/**
 * How many of a parent's children are finished: the parent's whole progress
 * story, and the only counting `flow` does. It reads `status` in frontmatter,
 * which these commands own outright, so it cannot disagree with anything.
 */
function progressOf(t, tickets) {
  const kids = graph.children(tickets, t.id);
  if (kids.length === 0) return null;
  return `${kids.filter((k) => k.data.status === 'done').length}/${kids.length}`;
}

const blockText = (u) =>
  u.reason === 'missing' ? `${u.dep} does not exist`
  : u.reason === 'dropped' ? `${u.dep} was dropped: this ticket can never become ready`
  : `${u.dep} is ${u.reason}`;

const blockedLines = (entries) =>
  entries.map(({ ticket, unmet }) =>
    `  ${store.nameOf(ticket)}\n` + unmet.map((u) => `        ${blockText(u)}`).join('\n')
  ).join('\n');

/**
 * The code branch the ticket's work is on. Where a live ticket's branch is not
 * the one checked out, the line says so, since building it here would put the
 * work on the wrong branch.
 */
function branchLine(ticket, root) {
  const { branch } = ticket.data;
  if (!branch) return null;
  const here = statuses.TERMINAL.has(ticket.data.status) ? '' : ticketHistory.currentBranch(root);
  return `branch:     ${branch}${here && here !== branch ? `   (checked out here: ${here})` : ''}`;
}

/** Whether a todo ticket can be picked up. A parent waits on its open children, as picking it up refuses. */
function readyLine(ticket, tickets, unmet) {
  const open = graph.openChildren(tickets, ticket.id).map((k) => k.id);
  const reasons = [...(open.length ? [`open children come first: ${open.join(', ')}`] : []), ...unmet.map(blockText)];
  return reasons.length ? `blocked:    ${reasons.join('; ')}` : 'ready:      yes';
}

function show(ticket, tickets, root) {
  const index = graph.indexById(tickets);
  const unmet = graph.unmetDeps(ticket, index);
  const deps = ticket.data.deps.map((d) => {
    const t = index.get(d);
    return t ? `${d} (${t.data.status})` : `${d} (MISSING)`;
  });
  const dependents = graph.dependents(tickets, ticket.id).map((t) => `${t.id} (${t.data.status})`);
  const kids = graph.children(tickets, ticket.id);

  const header = [
    store.nameOf(ticket),
    ticket.data.description || null,
    `status: ${ticket.data.status}   parent: ${ticket.data.parent || '-'}`,
    ticket.data.was ? `was:        ${ticket.data.was}` : null,
    branchLine(ticket, root),
    typeof ticket.data.rank === 'number' ? `rank:       ${ticket.data.rank}` : null,
    ticket.data.labels.length ? `labels:     ${ticket.data.labels.join(', ')}` : null,
    ticket.data.reason ? `reason:     ${ticket.data.reason}` : null,
    ticket.data.status === 'parked' ? `resumes at: ${ticket.data.resume || '?'}` : null,
    `deps:       ${deps.length ? deps.join(', ') : '-'}`,
    `dependents: ${dependents.length ? dependents.join(', ') : '-'}`,
    kids.length
      ? `children:   ${progressOf(ticket, tickets)} done, ${kids.map((k) => `${k.id} (${k.data.status})`).join(', ')}`
      : null,
    questionsLine(ticket),
    tasksLine(ticket),
    mapLine(ticket),
    planLine(ticket),
    decisionsLine(ticket),
    reportsLine(ticket),
    ticket.data.closed ? `closed:     ${ticket.data.closed}` : null,
    ticket.data.filed ? `filed:      ${ticket.data.filed}` : null,
    ticket.data.status === 'todo' ? readyLine(ticket, tickets, unmet) : null,
    `path:       ${path.relative(root, ticket.file)}`,
  ].filter(Boolean).join('\n');

  // Set apart from the fields above it, because it is the one line here that is
  // an instruction rather than a fact about the ticket.
  const pickup = pickupLine(ticket);
  return `${header}\n${pickup ? `\n${pickup}\n` : ''}${'-'.repeat(60)}\n${ticket.body.trimEnd()}`;
}

/**
 * Where a parked ticket comes back to. Parking stores the status it left, so
 * this is a lookup rather than a guess. A ticket parked straight out of `done`,
 * or with nothing stored, falls back to `todo`.
 */
const reviveVerb = (t) => statuses.VERB_OF[t.data.resume] || 'todo';

/**
 * The one command this ticket is waiting for: printed, never run. The agent
 * moves the ticket once it has read it, never before.
 *
 * Only `todo` and `parked` get one. A ticket already `in-progress` has no move
 * to make at pickup.
 */
function pickupLine(ticket) {
  const { status } = ticket.data;
  if (status === 'todo') return `pick up with: flow start ${ticket.id}`;
  if (status === 'parked') return `pick up with: flow ${reviveVerb(ticket)} ${ticket.id}`;
  return null;
}

/**
 * The plan, and how many of its steps are ticked.
 *
 * The count is safe here for the reason a stored one would not be: it is read
 * off `plan.md` every time this prints, so there is no second copy to keep
 * true. It stays out of `ls` and `tree`, where `status` already answers what
 * the count was standing in for.
 */
/**
 * The map, and how many of its questions are answered.
 *
 * Here for the reason the plan count is here: it is the artifact deciding
 * whether a phase finished, and every skill that is not `/flow:groundwork` needs the
 * count rather than the file. One printed line spares them the read, and the
 * one that does need the file opens it anyway.
 */
const mapLine = (ticket) => {
  const q = store.mapQuestions(ticket);
  return q ? `map:        groundwork/map.md   ${q.done}/${q.total} answered` : null;
};

const planLine = (ticket) => {
  if (!store.hasPlan(ticket)) return null;
  const steps = store.planSteps(ticket);
  return steps ? `plan:       plan.md   ${steps.done}/${steps.total} steps` : 'plan:       plan.md';
};

/** Named, not counted: a report is read by opening it, and the name says what it answers. */
const reportsLine = (ticket) => {
  const files = store.reportFiles(ticket);
  return files.length ? `reports:    ${files.map((f) => `reports/${f}`).join(', ')}` : null;
};

/** The ticket's own lists, counted from `ticket.md`. The map and plan lines above stay for tickets made before the one-file shape. */
const questionsLine = (ticket) => {
  const q = store.questionCount(ticket);
  return q ? `questions:  ${q.done}/${q.total} answered` : null;
};

const tasksLine = (ticket) => {
  const tasks = store.taskCount(ticket);
  return tasks ? `tasks:      ${tasks.done}/${tasks.total} done` : null;
};

const decisionsLine = (ticket) => {
  const files = store.decisionFiles(ticket);
  return files.length ? `decisions:  ${files.map((f) => `decisions/${f}`).join(', ')}` : null;
};

/**
 * Where the work stands: the count of each status holding a ticket, then the
 * 4 questions `brief` answers, then parked.
 *
 * The counts come off the status table, so a new status appears here without
 * this line being touched. A status at 0 is left out: `/flow:start` reads this
 * line every session, and 5 zeros say nothing. Parked tickets are invisible in the daily loop by
 * design, and this is the one place they surface: a deliberate "not now"
 * cannot quietly become "forgotten".
 */
function status(tickets, limit, waiting) {
  if (!tickets.length) return 'no tickets yet.';
  const by = (s) => tickets.filter((t) => t.data.status === s);

  const counts = statuses.NAMES.filter((name) => by(name).length).map((name) => `${name} ${by(name).length}`).join('   ');
  const out = [`tickets: ${tickets.length}   ${counts}`, '', brief(tickets, limit, waiting)];

  const parked = by('parked');
  if (parked.length) {
    out.push('');
    out.push(`parked (${parked.length}):`);
    out.push(indent(table(['TICKET', 'REASON'], parked.map((t) => [store.nameOf(t), t.data.reason || '-']))));
  }

  return out.join('\n');
}

/**
 * `waiting for /flow:upkeep: 3 closed tickets, 2 notes, 4 findings`, a part
 * left out at 0, or null where nothing waits. The counts come from
 * `lib/waiting.js`, because this file reads no disk.
 */
function waitingLine(waiting) {
  if (!waiting) return null;
  const parts = [[waiting.tickets, 'closed ticket'], [waiting.notes, 'note'], [waiting.findings, 'finding']]
    .filter(([n]) => n)
    .map(([n, word]) => `${n} ${word}${n === 1 ? '' : 's'}`);
  return parts.length ? `waiting for /flow:upkeep: ${parts.join(', ')}` : null;
}

/**
 * The session opener, printed by `flow next`. Four questions
 * what did I finish last, what is still open, what continues it, what could
 * start. Read-only on purpose: this is the view for not knowing what is next,
 * and picking is a separate act.
 */
function brief(tickets, limit, waiting) {
  if (!tickets.length) return 'no tickets yet.';
  const out = [];

  // The context a new session has lost. Nothing else on screen says what the
  // last piece of work even was. Id and title only: the status, the stamp and
  // the report list all pushed the title off to the right, where it read as
  // noise. `closed` still decides which ticket this is; it just does not print.
  const last = graph.lastClosed(tickets);
  if (last) {
    out.push(`last closed  ${store.nameOf(last)}`);
    out.push('');
  }

  // A parent with open children waits on them, and picking it up refuses, so
  // its children stand in for it: in flight themselves, or continuing it below.
  const inFlight = tickets.filter((t) =>
    graph.IN_FLIGHT.has(t.data.status) && !graph.hasOpenChildren(tickets, t.id));
  if (inFlight.length) {
    out.push(`in flight (${inFlight.length}), finish these before starting more:`);
    out.push(indent(ticketTable(graph.rank(inFlight, tickets))));
    out.push('');
  }

  // Above the ready list even when a top-ranked ticket is sitting in it:
  // unfinished work beats new work, and a ticket nobody has started is new
  // however it is ranked. Rank only orders inside a band.
  const continuing = graph.continuingTickets(tickets);
  if (continuing.length) {
    out.push(`continues open work (${continuing.length}):`);
    out.push(indent(ticketTable(graph.rank(continuing, tickets))));
    out.push('');
  }

  const carried = new Set(continuing.map((t) => t.id));
  const ready = graph.readyTickets(tickets).filter((t) => !carried.has(t.id));
  if (ready.length) {
    const shown = graph.rank(ready, tickets).slice(0, limit);
    out.push(`ready (${shown.length < ready.length ? `${shown.length} of ${ready.length}` : ready.length}):`);
    out.push(indent(ticketTable(shown)));
    if (shown.length < ready.length) out.push('  flow next --all for the rest');
    out.push('');
  } else if (!inFlight.length && !continuing.length) {
    const blocked = graph.blockedTickets(tickets);
    out.push(blocked.length
      ? `nothing ready. ${blocked.length} todo ticket${blocked.length === 1 ? '' : 's'} blocked:\n${blockedLines(blocked.slice(0, 8))}`
      : 'nothing ready and nothing blocked: no todo tickets left.');
    out.push('');
  }

  // Both print only when owed. A line that reads "none" every run is a line
  // the reader learns to skip, and these exist to be noticed.
  const owed = waitingLine(waiting);
  if (owed) out.push(owed);
  const problems = graph.check(tickets);
  if (graph.hasProblems(problems)) out.push('the ticket graph has problems: flow check');

  return out.join('\n').replace(/\n+$/, '');
}

function checkReport(problems) {
  if (!graph.hasProblems(problems)) return 'no problems: no cycles, no dangling ids, no dropped blockers, no closed parents, no unknown statuses, every ticket has a title and a description.';

  const out = [];
  if (problems.unnamed.length) {
    out.push(`no title or description (${problems.unnamed.length}), add them with flow edit:`);
    for (const t of problems.unnamed.slice(0, 10)) out.push(`  ${t.id}`);
    if (problems.unnamed.length > 10) out.push(`  and ${problems.unnamed.length - 10} more`);
    out.push('');
  }
  if (problems.unknownStatuses.length) {
    out.push(`unknown statuses (${problems.unknownStatuses.length}), valid ones are ${statuses.NAMES.join(', ')}:`);
    for (const t of problems.unknownStatuses) out.push(`  ${t.id} has status ${t.data.status ?? '(none)'}`);
    out.push('');
  }
  if (problems.cycles.length) {
    out.push(`dependency cycles (${problems.cycles.length}):`);
    for (const c of problems.cycles) out.push(`  ${c.join(' → ')} → ${c[0]}`);
    out.push('');
  }
  if (problems.dangling.length) {
    out.push(`dangling deps (${problems.dangling.length}), the dep does not exist:`);
    for (const d of problems.dangling) out.push(`  ${d.ticket.id} depends on ${d.dep}`);
    out.push('');
  }
  if (problems.droppedBlockers.length) {
    out.push(`dropped blockers (${problems.droppedBlockers.length}), these can never become ready:`);
    for (const d of problems.droppedBlockers) out.push(`  ${d.ticket.id} depends on ${d.dep} (dropped)`);
    out.push('');
  }
  if (problems.danglingParents.length) {
    out.push(`dangling parents (${problems.danglingParents.length}), the parent does not exist:`);
    for (const d of problems.danglingParents) out.push(`  ${d.ticket.id} has parent ${d.parent}`);
    out.push('');
  }
  if (problems.closedParents.length) {
    out.push(`closed parents (${problems.closedParents.length}), the parent finished while this was still open:`);
    for (const d of problems.closedParents) {
      out.push(`  ${d.ticket.id} (${d.ticket.data.status}) has parent ${d.parent.id}, which is ${d.parent.data.status}`);
    }
    out.push('');
  }
  return out.join('\n').trimEnd();
}

module.exports = { ticketTable, tree, blockText, show, status, checkReport, reviveVerb };
