'use strict';
/**
 * The 2 commands that answer a question about the work as a whole rather than
 * about one ticket. Everything ticket-shaped lives in commands/tickets.js; the
 * two files land in one flat namespace, and `section` decides where help
 * prints each command.
 */

const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const graph = require('../lib/tickets/graph');
const render = require('../lib/tickets/render');
const waiting = require('../lib/waiting');
const { load, loadFor, PROJECT_FLAG } = require('./tickets');

// Small, since every session opens on this answer and pays for each line in
// context. The count of what was hidden always prints: a silent truncation is
// the only way a ceiling does harm.
const NEXT_LIMITS = { continuing: 3, ready: 5 };

function nextLimit(flags) {
  if (flags.all) return { continuing: Infinity, ready: Infinity };
  if (flags.limit === undefined) return NEXT_LIMITS;
  const n = Number(flags.limit);
  if (!Number.isInteger(n) || n < 1) {
    throw new FlowError(`--limit takes a whole number of tickets (got "${flags.limit}")`);
  }
  return { continuing: n, ready: n };
}

const board = {};

/**
 * The board, which `/flow:start` opens a session on. `next` once ranked with
 * logic of its own, beside the board the old `flow get` printed with nothing named,
 * and the 2 disagreed about the child of open work.
 */
board.next = {
  section: 'board',
  summary: 'what to work on, ranked',
  flags: { limit: { arg: '<n>' }, all: { bool: true }, project: PROJECT_FLAG },
  run({ flags }) {
    const { root, tickets } = loadFor(flags);
    out(render.status(tickets, nextLimit(flags), waiting.count(root, tickets)));
    return 0;
  },
};

board.check = {
  section: 'board',
  summary: 'cycles, dangling ids, dropped blockers, orphaned parents, unknown statuses',
  run() {
    const problems = graph.check(load().tickets);
    out(render.checkReport(problems));
    return graph.hasProblems(problems) ? 1 : 0;
  },
};

module.exports = board;
