'use strict';
/**
 * The 2 commands that answer a question about the work as a whole rather than
 * about one ticket. Everything ticket-shaped lives in commands/tickets.js; the
 * two files land in one flat namespace, and `section` decides where help
 * prints each command.
 */

const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const store = require('../lib/store');
const graph = require('../lib/graph');
const render = require('../lib/render');

const load = () => store.readTickets(projectRoot());

// 10, not 15: `next` answers a question, and a longer answer is a second list
// to triage. The count of what was hidden always prints: a silent truncation
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
 * The board, which `/flow:start` opens a session on. `next` once ranked with
 * logic of its own, beside the board `flow get` printed with nothing named,
 * and the 2 disagreed about the child of open work.
 */
board.next = {
  section: 'board',
  summary: 'what to work on, ranked',
  flags: { limit: { arg: '<n>' }, all: { bool: true } },
  run({ flags }) {
    out(render.status(load(), nextLimit(flags)));
    return 0;
  },
};

board.check = {
  section: 'board',
  summary: 'cycles, dangling ids, dropped blockers, orphaned parents, unknown statuses',
  run() {
    const problems = graph.check(load());
    out(render.checkReport(problems));
    return graph.hasProblems(problems) ? 1 : 0;
  },
};

module.exports = board;
