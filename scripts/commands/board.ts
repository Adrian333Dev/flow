/**
 * `flow next`, the one bare command that answers about the work as a whole
 * rather than one noun's list. Everything ticket-shaped lives in
 * commands/tickets.ts, under `flow tickets`.
 */

import { out, json } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import * as graph from '../features/tickets/graph.ts';
import * as render from '../features/tickets/render.ts';
import * as ticketJson from '../features/tickets/json.ts';
import * as store from '../features/tickets/store.ts';
import * as waiting from '../features/waiting/waiting.ts';
import { loadFor, PROJECT_FLAG } from '../features/tickets/places.ts';

// Small, since every session opens on this answer and pays for each line in
// context. The count of what was hidden always prints: a silent truncation is
// the only way a ceiling does harm.
const READY_ROWS = 3;

const board: Record<string, Action> = {};

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

export default board;
