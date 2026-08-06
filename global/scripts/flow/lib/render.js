'use strict';
/**
 * Output. Plain text, no colour — the agent reads this as often as the user
 * does, and ANSI codes are noise in a transcript.
 */

const path = require('path');
const graph = require('./graph');

function table(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length), 0)
  );
  const line = (cells) => cells.map((c, i) => String(c ?? '').padEnd(widths[i])).join('  ').trimEnd();
  return [line(headers), ...rows.map(line)].join('\n');
}

const ticketRow = (t) => [t.id, t.data.status, t.data.type, t.data.topic || '-', t.data.title];

function ticketTable(tickets) {
  if (tickets.length === 0) return 'no tickets.';
  return table(['ID', 'STATUS', 'TYPE', 'TOPIC', 'TITLE'], tickets.map(ticketRow));
}

function topicTable(topics, tickets) {
  if (topics.length === 0) return 'no topics.';
  const rows = topics.map((tp) => {
    const own = tickets.filter((t) => t.data.topic === tp.slug);
    const done = own.filter((t) => t.data.status === 'done').length;
    return [tp.slug, tp.data.status, own.length ? `${done}/${own.length}` : '-',
      tp.data.from.length ? tp.data.from.join(',') : '-', tp.data.title];
  });
  return table(['SLUG', 'STATUS', 'DONE', 'FROM', 'TITLE'], rows);
}

const reasonText = (u) =>
  u.reason === 'missing' ? `${u.dep} does not exist`
  : u.reason === 'dropped' ? `${u.dep} was dropped — this ticket can never become ready`
  : u.reason === 'superseded' ? `${u.dep} was superseded${u.by && u.by.length ? ` by ${u.by.join(', ')}` : ''} — re-point this dep`
  : `${u.dep} is ${u.reason}`;

const blockedLines = (entries) =>
  entries.map(({ ticket, unmet }) =>
    `  ${ticket.id}  ${ticket.data.title}\n` + unmet.map((u) => `        ${reasonText(u)}`).join('\n')
  ).join('\n');

function show(ticket, tickets, root) {
  const index = graph.indexById(tickets);
  const unmet = graph.unmetDeps(ticket, index);
  const deps = ticket.data.deps.map((d) => {
    const t = index.get(d);
    return t ? `${d} (${t.data.status})` : `${d} (MISSING)`;
  });
  const dependents = graph.dependents(tickets, ticket.id).map((t) => `${t.id} (${t.data.status})`);

  const header = [
    `${ticket.id}  ${ticket.data.title}`,
    `status: ${ticket.data.status}   type: ${ticket.data.type}   topic: ${ticket.data.topic || '-'}`,
    `deps:       ${deps.length ? deps.join(', ') : '-'}`,
    `dependents: ${dependents.length ? dependents.join(', ') : '-'}`,
    ticket.data.by.length ? `superseded by: ${ticket.data.by.join(', ')}` : null,
    ticket.data.status === 'todo'
      ? (unmet.length ? `blocked:    ${unmet.map(reasonText).join('; ')}` : 'ready:      yes')
      : null,
    `path:       ${path.relative(root, ticket.file)}`,
  ].filter(Boolean).join('\n');

  return `${header}\n${'-'.repeat(60)}\n${ticket.body.trimEnd()}`;
}

function status(tickets, topics) {
  const by = (s) => tickets.filter((t) => t.data.status === s);
  const activeTopics = topics.filter((tp) => tp.data.status === 'in-progress');
  const ready = graph.readyTickets(tickets);
  const blocked = graph.blockedTickets(tickets);

  const out = [];
  out.push(`tickets: ${tickets.length}   todo ${by('todo').length}   in-progress ${by('in-progress').length}   ` +
    `review ${by('review').length}   done ${by('done').length}   dropped ${by('dropped').length}   ` +
    `superseded ${by('superseded').length}`);
  out.push('');

  out.push(`active topic${activeTopics.length === 1 ? '' : 's'}: ` +
    (activeTopics.length ? activeTopics.map((tp) => tp.slug).join(', ') : 'none'));

  out.push('');
  out.push(`in flight (${by('in-progress').length}):`);
  out.push(by('in-progress').length ? indent(ticketTable(by('in-progress'))) : '  none');

  out.push('');
  out.push(`in review (${by('review').length}):`);
  out.push(by('review').length ? indent(ticketTable(by('review'))) : '  none');

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
  if (problems.supersededDeps.length) {
    out.push(`superseded deps (${problems.supersededDeps.length}) — re-point them:`);
    for (const d of problems.supersededDeps) {
      out.push(`  ${d.ticket.id} depends on ${d.dep}, superseded by ${d.by.length ? d.by.join(', ') : '(nothing)'}`);
    }
    out.push('');
  }
  return out.join('\n').trimEnd();
}

const indent = (text) => text.split('\n').map((l) => '  ' + l).join('\n');

module.exports = { table, ticketTable, topicTable, blockedLines, reasonText, show, status, checkReport, indent };
