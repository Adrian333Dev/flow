'use strict';
/**
 * `flow next`, the one bare command that answers about the work as a whole
 * rather than one noun's list. Everything ticket-shaped lives in
 * commands/tickets.js, under `flow tickets`.
 */

const { out, json } = require('../lib/cli');
const graph = require('../lib/tickets/graph');
const render = require('../lib/tickets/render');
const ticketJson = require('../lib/tickets/json');
const store = require('../lib/tickets/store');
const waiting = require('../lib/waiting');
const { loadFor, PROJECT_FLAG } = require('./tickets');

// Small, since every session opens on this answer and pays for each line in
// context. The count of what was hidden always prints: a silent truncation is
// the only way a ceiling does harm.
const READY_ROWS = 3;

const board = {};

/**
 * The board, which `/flow:start` opens a session on: the work started as a
 * tree, then what could start, then the one ticket to take.
 *
 * Its JSON holds more than its text: the ready list whole, never cut to 3.
 */
board.next = {
  section: 'board',
  summary: 'what to work on: the work started, then what could start',
  flags: { all: { bool: true }, project: PROJECT_FLAG },
  run({ flags }) {
    const { root, tickets } = loadFor(flags);
    const view = graph.nextView(tickets);
    const owed = waiting.count(root, tickets);
    out(render.next(view, tickets, owed, flags.all ? Infinity : READY_ROWS));

    const index = graph.indexById(tickets);
    json({
      project: { prefix: store.prefixOf(root), folder: root },
      lastClosed: view.lastClosed && ticketJson.record(view.lastClosed, tickets, index),
      inProgress: ticketJson.list(view.tree, tickets),
      ready: view.ready.map((t) => ticketJson.record(t, tickets, index)),
      take: view.take ? view.take.id : null,
      parked: view.parked,
      waiting: owed,
      problems: view.problems,
    });
    return 0;
  },
};

module.exports = board;
