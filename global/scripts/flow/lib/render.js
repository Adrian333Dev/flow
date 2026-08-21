'use strict';
/**
 * Output. Plain text, no colour — the agent reads this as often as the user
 * does, and ANSI codes are noise in a transcript.
 */

const path = require('path');
const graph = require('./graph');
const store = require('./store');
const statuses = require('./statuses');

/** Aligned columns with no header row — the tree needs the padding without one. */
function columns(rows) {
  const widths = [];
  for (const r of rows) {
    r.forEach((c, i) => { widths[i] = Math.max(widths[i] || 0, String(c ?? '').length); });
  }
  return rows
    .map((r) => r.map((c, i) => String(c ?? '').padEnd(widths[i])).join('  ').trimEnd())
    .join('\n');
}

const table = (headers, rows) => columns([headers, ...rows]);

/**
 * Effective priority, so a child of a high parent reads `high` even though its
 * own file says nothing. `normal` prints as `-`: the column exists to show the
 * exceptions, and a column full of the word "normal" would bury them.
 */
const priCell = (t, index) => {
  const p = graph.effectivePriority(t, index);
  return p === 'normal' ? '-' : p;
};

const ticketRow = (t, index) => [
  t.id, t.data.status, t.data.type, priCell(t, index),
  t.data.parent || '-', t.data.title,
];

// `pool` is the full ticket set when the list being printed is a filtered slice
// of it — priority is inherited, so a parent outside the slice still decides.
function ticketTable(tickets, pool) {
  if (tickets.length === 0) return 'no tickets.';
  const index = graph.indexById(pool || tickets);
  return table(
    ['ID', 'STATUS', 'TYPE', 'PRI', 'PARENT', 'TITLE'],
    tickets.map((t) => ticketRow(t, index))
  );
}

/**
 * The forest, drawn. One line per ticket: the branch, then status, priority and
 * whatever single fact matters most about it — how much of a parent is done,
 * what a blocked ticket waits on, why a parked one was set aside.
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
        prefix + (root ? '' : last ? '└── ' : '├── ') + `${t.id}  ${t.data.title}`,
        t.data.status,
        priCell(t, index),
        treeNote(t, all, index),
      ]);
      if (n.children.length) walk(n.children, root ? '' : prefix + (last ? '    ' : '│   '), false);
    });
  };

  walk(nodes, '', true);
  return columns(rows);
}

// Counted against every ticket, never the visible slice: a parent whose
// children are all done must still read 3/3 once those children are hidden.
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
 * How many of a parent's children are finished — the parent's whole progress
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
  : u.reason === 'dropped' ? `${u.dep} was dropped — this ticket can never become ready`
  : `${u.dep} is ${u.reason}`;

const blockedLines = (entries) =>
  entries.map(({ ticket, unmet }) =>
    `  ${ticket.id}  ${ticket.data.title}\n` + unmet.map((u) => `        ${blockText(u)}`).join('\n')
  ).join('\n');

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
    `${ticket.id}  ${ticket.data.title}`,
    `status: ${ticket.data.status}   type: ${ticket.data.type}   parent: ${ticket.data.parent || '-'}`,
    // The one place inheritance is spelled out, so "which ticket do I edit to
    // change this" has an answer somewhere. The daily lists stay uncluttered.
    `priority:   ${priorityLine(ticket, index)}`,
    ticket.data.reason ? `reason:     ${ticket.data.reason}` : null,
    `deps:       ${deps.length ? deps.join(', ') : '-'}`,
    `dependents: ${dependents.length ? dependents.join(', ') : '-'}`,
    kids.length
      ? `children:   ${progressOf(ticket, tickets)} done — ${kids.map((k) => `${k.id} (${k.data.status})`).join(', ')}`
      : null,
    planLine(ticket),
    reportsLine(ticket),
    ticket.data.closed ? `closed:     ${ticket.data.closed}` : null,
    ticket.data.filed ? `filed:      ${ticket.data.filed}` : null,
    ticket.data.status === 'todo'
      ? (unmet.length ? `blocked:    ${unmet.map(blockText).join('; ')}` : 'ready:      yes')
      : null,
    `path:       ${path.relative(root, ticket.file)}`,
  ].filter(Boolean).join('\n');

  return `${header}\n${'-'.repeat(60)}\n${ticket.body.trimEnd()}`;
}

/**
 * The plan lives beside the ticket, so `show` says whether there is one. How
 * far it got is not summarized here: a plan is read by opening it, and any
 * digest in the header would be a second copy to keep true.
 */
const planLine = (ticket) => (store.hasPlan(ticket) ? 'plan:       plan.md' : null);

/** Named, not counted — a report is read by opening it, and the name says what it answers. */
const reportsLine = (ticket) => {
  const files = store.reportFiles(ticket);
  return files.length ? `reports:    ${files.map((f) => `reports/${f}`).join(', ')}` : null;
};

function priorityLine(ticket, index) {
  if (ticket.data.priority) return ticket.data.priority;
  const effective = graph.effectivePriority(ticket, index);
  if (effective === 'normal') return 'normal';
  let p = ticket.data.parent ? index.get(ticket.data.parent) : null;
  while (p && !p.data.priority) p = p.data.parent ? index.get(p.data.parent) : null;
  return `${effective} — inherited from ${p ? p.id : '?'}`;
}

/**
 * Where the work stands: the counts across every status, then the 4 questions
 * `brief` answers, then parked.
 *
 * The counts come off the status table, so a new status appears here without
 * this line being touched. Parked tickets are invisible in the daily loop by
 * design, and this is the one place they surface — a deliberate "not now"
 * cannot quietly become "forgotten".
 */
function status(tickets, limit) {
  if (!tickets.length) return 'no tickets yet.';
  const by = (s) => tickets.filter((t) => t.data.status === s);

  const counts = statuses.NAMES.map((name) => `${name} ${by(name).length}`).join('   ');
  const out = [`tickets: ${tickets.length}   ${counts}`, '', brief(tickets, limit)];

  const parked = by('parked');
  if (parked.length) {
    out.push('');
    out.push(`parked (${parked.length}):`);
    out.push(indent(table(['ID', 'TITLE', 'REASON'], parked.map((t) => [t.id, t.data.title, t.data.reason || '-']))));
  }

  return out.join('\n');
}

/**
 * The session opener, printed by `flow status`. Four questions in order:
 * what did I finish last, what is still open, what continues it, what could
 * start. Read-only on purpose — this is the view for not knowing what is next,
 * and picking is a separate act.
 */
function brief(tickets, limit) {
  if (!tickets.length) return 'no tickets yet.';
  const out = [];

  // The context a new session has lost. Nothing else on screen says what the
  // last piece of work even was. Id and title only: the status, the stamp and
  // the report list all pushed the title off to the right, where it read as
  // noise. `closed` still decides which ticket this is; it just does not print.
  const last = graph.lastClosed(tickets);
  if (last) {
    out.push(`last closed  ${last.id}  ${last.data.title}`);
    out.push('');
  }

  const inFlight = tickets.filter((t) => graph.IN_FLIGHT.has(t.data.status));
  if (inFlight.length) {
    out.push(`in flight (${inFlight.length}) — finish these before starting more:`);
    out.push(indent(ticketTable(graph.rank(inFlight, tickets), tickets)));
    out.push('');
  }

  // Above the ready list even when a high-priority ticket is sitting in it:
  // unfinished work beats new work, and a ticket nobody has started is new
  // however it is marked. Priority only orders inside a band.
  const continuing = graph.continuingTickets(tickets);
  if (continuing.length) {
    out.push(`continues open work (${continuing.length}):`);
    out.push(indent(ticketTable(continuing, tickets)));
    out.push('');
  }

  const carried = new Set(continuing.map((t) => t.id));
  const ready = graph.readyTickets(tickets).filter((t) => !carried.has(t.id));
  if (ready.length) {
    const shown = graph.rank(ready, tickets).slice(0, limit);
    out.push(`ready (${shown.length < ready.length ? `${shown.length} of ${ready.length}` : ready.length}):`);
    out.push(indent(ticketTable(shown, tickets)));
    if (shown.length < ready.length) out.push('  flow next --all for the rest');
    out.push('');
  } else if (!inFlight.length && !continuing.length) {
    const blocked = graph.blockedTickets(tickets);
    out.push(blocked.length
      ? `nothing ready. ${blocked.length} todo ticket${blocked.length === 1 ? '' : 's'} blocked:\n${blockedLines(blocked.slice(0, 8))}`
      : 'nothing ready and nothing blocked — no todo tickets left.');
    out.push('');
  }

  // Both print only when owed. A line that reads "none" every run is a line
  // the reader learns to skip, and these exist to be noticed.
  const unfiled = tickets.filter((t) => t.data.status === 'done' && !t.data.filed);
  if (unfiled.length) {
    out.push(`unfiled: ${unfiled.length} closed ticket${unfiled.length === 1 ? '' : 's'} not yet filed   (flow tickets ls --unfiled)`);
    out.push('         run file-findings to sweep them');
  }
  const problems = graph.check(tickets);
  if (graph.hasProblems(problems)) out.push('the ticket graph has problems — flow check');

  return out.join('\n').replace(/\n+$/, '');
}

function checkReport(problems) {
  if (!graph.hasProblems(problems)) return 'no problems: no cycles, no dangling ids, no dropped blockers, no closed parents.';

  const out = [];
  if (problems.cycles.length) {
    out.push(`dependency cycles (${problems.cycles.length}):`);
    for (const c of problems.cycles) out.push(`  ${c.join(' → ')} → ${c[0]}`);
    out.push('');
  }
  if (problems.dangling.length) {
    out.push(`dangling deps (${problems.dangling.length}) — the dep does not exist:`);
    for (const d of problems.dangling) out.push(`  ${d.ticket.id} depends on ${d.dep}`);
    out.push('');
  }
  if (problems.droppedBlockers.length) {
    out.push(`dropped blockers (${problems.droppedBlockers.length}) — these can never become ready:`);
    for (const d of problems.droppedBlockers) out.push(`  ${d.ticket.id} depends on ${d.dep} (dropped)`);
    out.push('');
  }
  if (problems.danglingParents.length) {
    out.push(`dangling parents (${problems.danglingParents.length}) — the parent does not exist:`);
    for (const d of problems.danglingParents) out.push(`  ${d.ticket.id} has parent ${d.parent}`);
    out.push('');
  }
  if (problems.closedParents.length) {
    out.push(`closed parents (${problems.closedParents.length}) — the parent finished while this was still open:`);
    for (const d of problems.closedParents) {
      out.push(`  ${d.ticket.id} (${d.ticket.data.status}) has parent ${d.parent.id}, which is ${d.parent.data.status}`);
    }
    out.push('');
  }
  return out.join('\n').trimEnd();
}

const indent = (text) => text.split('\n').map((l) => '  ' + l).join('\n');

// ---------------------------------------------------------------- study cases

/**
 * The index that decides where a new case goes. One line per issue, because it
 * is read before every create — the rules are here because "is my failure this
 * one?" is answered by the rule that failed far more often than by the name.
 */
function issueTable(issues) {
  if (issues.length === 0) return 'no issues yet — the first study case creates one.';
  return table(
    ['ISSUE', 'CASES', 'OPEN', 'LATEST', 'RULES'],
    issues.map((i) => [i.issue, i.total, i.open, i.latest || '-', i.rules.length ? i.rules.join('; ') : '-'])
  );
}

function caseList(cases) {
  if (cases.length === 0) return 'no study cases.';

  const byIssue = new Map();
  for (const c of cases) {
    if (!byIssue.has(c.issue)) byIssue.set(c.issue, []);
    byIssue.get(c.issue).push(c);
  }

  const out = [];
  for (const [issue, list] of [...byIssue.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    out.push(`${issue} (${list.length})`);
    out.push(indent(table(
      ['DATE', 'STATUS', 'CASE', 'RULE', 'PROJECT'],
      list.map((c) => [c.data.date || '-', c.data.status, c.slug, c.data.rule || '-', c.data.project || '-'])
    )));
    out.push('');
  }
  return out.join('\n').trimEnd();
}

module.exports = {
  columns, table, ticketTable, tree, progressOf, blockedLines, blockText, show, status, brief, checkReport, indent,
  issueTable, caseList,
};
