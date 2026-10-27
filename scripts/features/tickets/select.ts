/**
 * The tickets one quoted query names (shared/query.ts, the grammar `flow notes`
 * reads), for `flow tickets` and `flow tickets labels`.
 */

import { FlowError } from '../../shared/error.ts';
import * as query from '../../shared/query.ts';
import * as store from './store.ts';
import * as graph from './graph.ts';
import * as search from './search.ts';
import * as statuses from './statuses.ts';

const QUERY_FIELDS = ['label', 'status', 'parent', 'filed'];
const OPEN_STATUSES = statuses.NAMES.filter((name) => !statuses.TERMINAL.has(name));

/** True when a query names the `flow-issue` label, which is filed where the fault arose and so is read from every project. */
function wantsIssues(text?: string) {
  return query.parse(text, QUERY_FIELDS).some((term) => term.field === 'label' && term.values.includes('flow-issue'));
}

/** Refuses a `status:` or `filed:` value that names nothing, and turns each `parent:` value into an id. */
function checkTerms(terms, prefix: string) {
  for (const term of terms) {
    if (term.field === 'status') {
      const bad = term.values.find((v) => v !== 'all' && !statuses.NAMES.includes(v));
      if (bad) throw new FlowError(`status:${bad} is no status. They are ${statuses.NAMES.join(', ')}, or all.`);
    }
    if (term.field === 'filed') {
      const bad = term.values.find((v) => v !== 'yes' && v !== 'no');
      if (bad) throw new FlowError(`filed:${bad} should be filed:yes or filed:no.`);
    }
    if (term.field === 'parent') term.values = term.values.map((v) => store.requireId(v, prefix));
  }
}

/**
 * The tickets the query names. Done and dropped stay out unless the query
 * names a `status:` term, and `status:all` names every status. `hidden` counts
 * the done and dropped ones left out, `parked` the ones parked alone, and
 * `held` the ones a parked group holds, which a listing shows as the group's row.
 * `status:` reads the effective status, so `status:parked` finds a held ticket.
 * `parent:<id>` names the ticket and everything under it, to any depth.
 */
function select(tickets, text?: string) {
  const terms = query.parse(text, QUERY_FIELDS);
  checkTerms(terms, tickets.prefix);
  const index = graph.indexById(tickets);
  const test = (list) => query.matcher(list, {
    word: (t, w) => search.matcher([w])(t),
    label: (t, v) => t.data.labels.includes(v),
    status: (t, v) => v === 'all' || store.statusOf(t) === v,
    parent: (t, v) => t.id === v || graph.isUnder(t, v, index),
    filed: (t, v) => (v === 'yes') === Boolean(t.data.filed),
  });
  if (query.has(terms, 'status')) return { terms, list: tickets.filter(test(terms)), hidden: 0, parked: 0, held: [] };
  const everything = tickets.filter(test(terms));
  const list = everything.filter((t) => OPEN_STATUSES.includes(store.statusOf(t)) && store.statusOf(t) !== 'parked');
  const parked = everything.filter((t) => t.data.status === 'parked').length;
  const held = everything.filter((t) => t.held);
  return { terms, list, hidden: everything.length - list.length - parked - held.length, parked, held };
}

/** What a default listing left out: parked tickets, then done and dropped ones. A held ticket shows as its group's row instead. */
function hiddenNote(hidden: number, parked: number) {
  const parts = [parked ? `${parked} parked` : '', hidden ? `${hidden} done or dropped` : ''].filter(Boolean);
  return parts.length ? `${parts.join(', ')} hidden: "status:all"` : '';
}

export { wantsIssues, select, hiddenNote };
