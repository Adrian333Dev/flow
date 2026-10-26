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
 * The forest, drawn: the branch and the name, then the columns `cells(t,
 * root)` gives each ticket. `flow tickets` and `flow next` pick their own.
 */
function tree(nodes, cells) {
  if (!nodes.length) return 'no tickets.';
  const rows = [];

  const walk = (list, prefix, root) => {
    list.forEach((n, i) => {
      const last = i === list.length - 1;
      const t = n.ticket;
      rows.push([prefix + (root ? '' : last ? '└── ' : '├── ') + store.nameOf(t), ...cells(t, root)]);
      if (n.children.length) walk(n.children, root ? '' : prefix + (last ? '    ' : '│   '), false);
    });
  };

  walk(nodes, '', true);
  return columns(rows);
}

/**
 * How many of a parent's children are done, of all of them: `3/5`, never a
 * word, or null for a ticket with none. It reads `status` in frontmatter,
 * which these commands own outright, so it cannot disagree with anything.
 */
function progressOf(t, tickets) {
  const p = graph.progress(tickets, t.id);
  return p ? `${p.done}/${p.total}` : null;
}

/** What a blocked todo waits on, or null. */
function blockedNote(t, index) {
  if (t.data.status !== 'todo') return null;
  const unmet = graph.unmetDeps(t, index);
  return unmet.length ? `blocked by ${unmet.map((u) => u.dep).join(', ')}` : null;
}

/** The opening words of a text, cut at a word near `max` characters with `…`. */
function firstWords(text, max = 40) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

/**
 * The `flow tickets` listing: the forest of what the query named, each row its
 * status, labels and the facts that matter: a parent's count, what a blocked
 * ticket waits on, a parked one's reason, and the parent of a child whose
 * parent the query left out (`under fw-16`), which the tree no longer shows.
 */
function listing(list, all) {
  const index = graph.indexById(all);
  const shown = new Set(list.map((t) => t.id));
  return tree(graph.forest(list), (t, root) => {
    const notes = [
      progressOf(t, all),
      blockedNote(t, index),
      t.data.status === 'parked' && t.data.reason ? firstWords(t.data.reason) : null,
      root && t.data.parent && index.has(t.data.parent) && !shown.has(t.data.parent) ? `under ${t.data.parent}` : null,
    ];
    return [t.data.status, t.data.labels.join(',') || '-', notes.filter(Boolean).join(', ')];
  });
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
    ticket.data.activity ? `activity:   ${ticket.data.activity}` : null,
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
    contextLine(ticket),
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
  if (status === 'todo') return `pick up with: flow tickets start ${ticket.id}`;
  if (status === 'parked') return `pick up with: flow tickets ${reviveVerb(ticket)} ${ticket.id}`;
  return null;
}

/**
 * The plan, and how many of its steps are ticked.
 *
 * The count is safe here for the reason a stored one would not be: it is read
 * off `plan.md` every time this prints, so there is no second copy to keep
 * true. It stays out of the lists, where `status` already answers what
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

/** The handles `context.md` holds, so a section is opened by name without reading the file. */
const contextLine = (ticket) => {
  const sections = store.contextSections(ticket);
  return sections ? `context:    ${store.CONTEXT}   ${sections.join(', ') || '-'}` : null;
};

const decisionsLine = (ticket) => {
  const files = store.decisionFiles(ticket);
  return files.length ? `decisions:  ${files.map((f) => `decisions/${f}`).join(', ')}` : null;
};

/**
 * `waiting: 3 closed tickets, 2 notes, 4 findings`, a part left out at 0, or
 * null where nothing waits. The counts come from `lib/waiting.js`, because
 * this file reads no disk.
 */
function waitingLine(waiting) {
  if (!waiting) return null;
  const parts = [[waiting.tickets, 'closed ticket'], [waiting.notes, 'note'], [waiting.findings, 'finding']]
    .filter(([n]) => n)
    .map(([n, word]) => `${n} ${word}${n === 1 ? '' : 's'}`);
  return parts.length ? `waiting: ${parts.join(', ')}` : null;
}

/** One line per ticket: name and labels. The heading above says the status and the parent. */
const ticketLines = (list) =>
  indent(columns(list.map((t) => [store.nameOf(t), t.data.labels.join(',') || '-'])));

/**
 * The session opener, printed by `flow next` from `graph.nextView`: what
 * finished last, the work started as a tree, what could start, and the one
 * ticket to take. Read-only on purpose: picking is a separate act.
 *
 * Small on purpose: every `/flow:start` and `/flow:execute` pays for these
 * lines in context. A tree row is its name and one fact; a ready row its name
 * and labels. Parked tickets are a count, since a deliberate "not now" must
 * not read as "forgotten" and must not cost a row each. A line holds one
 * colon at most: 2 read as 2 labels.
 */
function next(view, tickets, waiting, readyRows = Infinity) {
  if (!tickets.length) return 'no tickets yet.';
  const out = [];
  const index = graph.indexById(tickets);

  // The context a new session has lost: what the last piece of work was.
  if (view.lastClosed) out.push(`last closed  ${store.nameOf(view.lastClosed)}`, '');

  // The work started, with every open child under it, so the children of a
  // parent in progress are seen as its rest rather than as new work.
  if (view.tree.length) {
    const note = (t) => progressOf(t, tickets) || blockedNote(t, index) || (graph.IN_FLIGHT.has(t.data.status) ? 'in progress' : '');
    out.push('in progress', indent(tree(view.tree, (t) => [note(t)])), '');
  }

  if (view.ready.length) {
    const shown = view.ready.slice(0, readyRows);
    out.push(`ready (${view.ready.length})`, ticketLines(shown));
    if (shown.length < view.ready.length) out.push(`  and ${view.ready.length - shown.length} more (flow next --all)`);
    out.push('');
  } else if (!view.tree.length) {
    const { blocked } = view;
    out.push(blocked.length
      ? `nothing ready. ${blocked.length} todo ticket${blocked.length === 1 ? '' : 's'} blocked\n${blockedLines(blocked.slice(0, 8))}`
      : 'nothing ready and nothing blocked, no todo tickets left.', '');
  }

  if (view.take) out.push(`take: ${store.nameOf(view.take)}`);

  // Each prints only when owed. A line that reads "none" every run is a line
  // the reader learns to skip, and these exist to be noticed.
  const owed = [view.parked ? `${view.parked} parked` : null, waitingLine(waiting)].filter(Boolean);
  if (owed.length) out.push(owed.join(' · '));
  if (view.problems) out.push('the ticket graph has problems, listed by flow tickets check');

  return out.join('\n').replace(/\n+$/, '');
}

function checkReport(problems) {
  if (!graph.hasProblems(problems)) return 'no problems: no cycles, no dangling ids, no dropped blockers, no closed parents, no unknown statuses, every ticket has a title and a description.';

  const out = [];
  if (problems.unnamed.length) {
    out.push(`no title or description (${problems.unnamed.length}), added by flow tickets edit:`);
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

module.exports = { ticketTable, tree, listing, blockText, show, next, checkReport, reviveVerb };
