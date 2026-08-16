'use strict';
/**
 * Output. Plain text, no colour — the agent reads this as often as the user
 * does, and ANSI codes are noise in a transcript.
 */

const path = require('path');
const graph = require('./graph');
const store = require('./store');

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

/** `4/9` while a plan exists, blank otherwise. */
const stepCell = (t) => {
  const p = store.planProgress(t);
  return p ? `${p.done}/${p.total}` : '-';
};

const ticketRow = (t, index, steps) => [
  t.id, t.data.status, t.data.type, priCell(t, index),
  ...(steps ? [stepCell(t)] : []),
  t.data.parent || '-', t.data.title,
];

// `pool` is the full ticket set when the list being printed is a filtered slice
// of it — priority is inherited, so a parent outside the slice still decides.
//
// The STEPS column appears only where something in this list has a plan. Most
// lists are todo tickets, and a column of dashes across all of them costs width
// for nothing.
function ticketTable(tickets, pool) {
  if (tickets.length === 0) return 'no tickets.';
  const index = graph.indexById(pool || tickets);
  const steps = tickets.some((t) => store.planProgress(t));
  return table(
    ['ID', 'STATUS', 'TYPE', 'PRI', ...(steps ? ['STEPS'] : []), 'PARENT', 'TITLE'],
    tickets.map((t) => ticketRow(t, index, steps))
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
  const plan = store.planProgress(t);
  if (plan) return `${plan.done}/${plan.total} steps`;
  return t.data.reason || '';
}

/**
 * A parent shows how many of its children are finished where a leaf shows
 * whether it has a plan — that count is the parent's whole progress story.
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
    ticket.data.status === 'todo'
      ? (unmet.length ? `blocked:    ${unmet.map(blockText).join('; ')}` : 'ready:      yes')
      : null,
    `path:       ${path.relative(root, ticket.file)}`,
  ].filter(Boolean).join('\n');

  return `${header}\n${'-'.repeat(60)}\n${ticket.body.trimEnd()}`;
}

/**
 * The plan lives beside the ticket, so `show` prints how far it got and the
 * path to read. Nothing here parses the steps themselves — a plan is read by
 * opening it, and a summary in the header would be a second copy to trust.
 */
function planLine(ticket) {
  const p = store.planProgress(ticket);
  if (!p) return null;
  return `plan:       ${p.done}/${p.total} steps — plan.md`;
}

function priorityLine(ticket, index) {
  if (ticket.data.priority) return ticket.data.priority;
  const effective = graph.effectivePriority(ticket, index);
  if (effective === 'normal') return 'normal';
  let p = ticket.data.parent ? index.get(ticket.data.parent) : null;
  while (p && !p.data.priority) p = p.data.parent ? index.get(p.data.parent) : null;
  return `${effective} — inherited from ${p ? p.id : '?'}`;
}

function status(tickets) {
  const by = (s) => tickets.filter((t) => t.data.status === s);
  const ready = graph.readyTickets(tickets);
  const blocked = graph.blockedTickets(tickets);
  const inFlight = [...by('thinking'), ...by('building')];

  const out = [];
  out.push(`tickets: ${tickets.length}   todo ${by('todo').length}   thinking ${by('thinking').length}   ` +
    `building ${by('building').length}   review ${by('review').length}   done ${by('done').length}   ` +
    `parked ${by('parked').length}   dropped ${by('dropped').length}`);

  out.push('');
  out.push(`in flight (${inFlight.length}):`);
  out.push(inFlight.length ? indent(ticketTable(graph.rank(inFlight, tickets), tickets)) : '  none');

  out.push('');
  out.push(`in review (${by('review').length}):`);
  out.push(by('review').length ? indent(ticketTable(graph.rank(by('review'), tickets), tickets)) : '  none');

  // Parked tickets are invisible in the daily loop by design; a count here is
  // the one place they surface, so a deliberate "not now" cannot quietly
  // become "forgotten".
  const parked = by('parked');
  if (parked.length) {
    out.push('');
    out.push(`parked (${parked.length}):`);
    out.push(indent(table(['ID', 'TITLE', 'REASON'], parked.map((t) => [t.id, t.data.title, t.data.reason || '-']))));
  }

  out.push('');
  out.push(`ready: ${ready.length}   blocked: ${blocked.length}   (flow next)`);

  return out.join('\n');
}

function checkReport(problems) {
  if (!graph.hasProblems(problems)) return 'no problems: no cycles, no dangling ids, no dropped blockers.';

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
  columns, table, ticketTable, tree, progressOf, blockedLines, blockText, show, status, checkReport, indent,
  issueTable, caseList,
};
