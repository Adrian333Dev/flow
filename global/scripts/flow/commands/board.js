'use strict';
/**
 * The 3 commands about the work as a whole. None of them names a stored thing,
 * which is the test for belonging here rather than under `flow tickets`.
 */

const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const store = require('../lib/store');
const graph = require('../lib/graph');
const render = require('../lib/render');
const statuses = require('../lib/statuses');

const load = () => store.readTickets(projectRoot());

// 10, not 15: `next` answers a question, and a longer answer is a second list
// to triage. The count of what was hidden always prints — a silent truncation
// is the only way a ceiling does harm.
const NEXT_LIMIT = 10;

function nextLimit(flags) {
  if (flags.all) return Infinity;
  if (flags.limit === undefined) return NEXT_LIMIT;
  const n = Number(flags.limit);
  if (!Number.isInteger(n) || n < 1) {
    throw new FlowError(`--limit takes a whole number of tickets (got "${flags.limit}")`);
  }
  return n;
}

const board = {};

/**
 * Two questions, one answer: what is already open, and what could be started.
 *
 * The in-flight block leads because this used to list todos only, so a ticket
 * you were in the middle of was invisible in the one place you looked before
 * picking up the next thing.
 */
board.next = {
  summary: 'what to work on, ranked',
  flags: { limit: { arg: '<n>' }, all: { bool: true } },
  run({ flags }) {
    const limit = nextLimit(flags);
    const tickets = load();

    const inFlight = tickets.filter((t) => statuses.IN_FLIGHT.has(t.data.status));
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
    if (blocked.length > 8) out(`\n  … and ${blocked.length - 8} more (flow tickets ls --status todo)`);
    return 0;
  },
};

/**
 * The session opener, for when you do not know what is next: what you closed
 * last, what is still open, what continues it, what could start, and the counts
 * across every status. Read-only on purpose — picking is a separate act.
 */
board.status = {
  summary: 'where the work stands',
  flags: { limit: { arg: '<n>' }, all: { bool: true } },
  run({ flags }) {
    out(render.status(load(), nextLimit(flags)));
    return 0;
  },
};

board.check = {
  summary: 'cycles, dangling ids, dropped blockers, orphaned parents',
  run() {
    const problems = graph.check(load());
    out(render.checkReport(problems));
    return graph.hasProblems(problems) ? 1 : 0;
  },
};

module.exports = board;
