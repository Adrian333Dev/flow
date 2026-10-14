#!/usr/bin/env node
'use strict';
/**
 * One-time conversion of a place's tickets to the new shape: a short `title`
 * beside a `description`, `type` as a label, the 5 statuses, and no `priority`.
 * Only the frontmatter of each ticket.md is rewritten. A ticket already in the
 * new shape changes nothing, so a second run is a no-op.
 *
 *   node lab/scripts/convert-tickets.js [--dry-run]
 *
 * Runs against the current project's tickets. For the Flow home's, set
 * FLOW_PROJECT=$HOME. Moves to lab/archive/ once the real run is done.
 */

const store = require('../../scripts/lib/tickets/store');
const statuses = require('../../scripts/lib/tickets/statuses');
const records = require('../../scripts/lib/tickets/records');
const { projectRoot } = require('../../scripts/lib/project');

const LABEL_OF_TYPE = { feature: 'feature', chore: 'chore', topic: 'topic', issue: 'bug', prototype: 'research' };
const OLD_STATUSES = new Set(['groundwork', 'planning', 'building', 'review']);
const RANK_STEP = 1000;

const status = (value) => (OLD_STATUSES.has(value) ? 'in-progress' : value);

/** The title an old ticket takes: the folder's words after the id, else a cut of the sentence. */
function titleFor(t, sentence) {
  let words = store.labelOf(t);
  while (words.length > 40 && words.includes('-')) words = words.slice(0, words.lastIndexOf('-'));
  return words && !store.badTitle(words) ? words : store.titleFrom(sentence);
}

/** Converts `tickets` in place. Returns the tickets that changed and a count of each kind of change. */
function convert(tickets) {
  const count = { titles: 0, labels: 0, statuses: 0, ranks: 0, priorities: 0 };
  const changed = new Set();

  for (const t of tickets) {
    const d = t.data;

    if (!d.description) {
      const sentence = d.title;
      d.description = sentence;
      d.title = titleFor(t, sentence);
      count.titles += 1;
      changed.add(t);
    }

    if ('type' in d) {
      const label = LABEL_OF_TYPE[d.type];
      if (label && !d.labels.includes(label)) {
        d.labels = [...d.labels, label];
        count.labels += 1;
      }
      delete d.type;
      changed.add(t);
    }

    if (OLD_STATUSES.has(d.status) || OLD_STATUSES.has(d.resume)) {
      d.status = status(d.status);
      d.resume = status(d.resume);
      count.statuses += 1;
      changed.add(t);
    }
  }

  // A live ticket that was `high` takes a rank among its siblings, in id order,
  // so it stays ahead of the unranked ones as it did.
  const groups = new Map();
  for (const t of tickets) {
    if (t.data.priority !== 'high' || !statuses.LIVE.has(t.data.status) || t.data.rank !== '') continue;
    const key = t.data.parent || '';
    groups.set(key, [...(groups.get(key) || []), t]);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => store.idNumber(a.id) - store.idNumber(b.id));
    group.forEach((t, i) => { t.data.rank = (i + 1) * RANK_STEP; count.ranks += 1; });
  }

  for (const t of tickets) {
    if (!('priority' in t.data)) continue;
    delete t.data.priority;
    count.priorities += 1;
    changed.add(t);
  }

  return { changed: [...changed], count };
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const root = projectRoot();
  const tickets = store.readTickets(root);
  const { changed, count } = convert(tickets);

  if (!changed.length) {
    console.log('nothing to convert.');
    return;
  }
  if (!dry) {
    for (const t of changed) store.writeTicket(t);
    records.commit(root, 'tickets converted to the new shape');
  }
  console.log(`${dry ? 'would convert' : 'converted'} ${changed.length} of ${tickets.length} tickets:`);
  for (const [n, what] of [
    [count.titles, 'titles moved to descriptions, with a new short title'],
    [count.labels, 'types added as labels'],
    [count.statuses, 'old statuses moved to in-progress'],
    [count.ranks, 'high-priority tickets given a rank'],
    [count.priorities, 'priorities removed'],
  ]) if (n) console.log(`  ${n} ${what}`);
}

main();
