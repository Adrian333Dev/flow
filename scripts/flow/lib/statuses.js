'use strict';
/**
 * The status vocabulary, in one table.
 *
 * Every question the rest of the tool asks about a status is a column here:
 * whether it counts as unfinished, whether a dependent stays blocked, whether
 * someone is working on it, whether it satisfies a dependency, whether it is
 * history, whether the move needs a reason, where it sorts in a list, and what
 * you type to move a ticket into it.
 *
 * Adding a status means adding a row, and the row brings its own command with
 * it. The one thing a row cannot carry is a refusal — `done` refuses on a
 * parent with open children, `dropped` refuses while live dependents exist —
 * so those stay in the command that writes them.
 */

/*
 * Three statuses cover the work, and each names what is happening.
 * `groundwork` — the questions are still open. `planning` — they are settled
 * and the plan is being written. `building` — the plan is approved and code
 * starts. The trio replaces `in-progress`, which was true during all of it and
 * answered nothing, and then `thinking`, which covered the first two at once
 * and so could not say whether a ticket was still undecided.
 *
 * Every type uses a subsequence of this order, never a different order, which
 * is why one table covers all 5 types.
 *
 * Rows are in lifecycle order, which is the order the verbs print in help.
 * `rank` is separate because a list is read work-first rather than
 * lifecycle-first: what is in flight leads, then what could start, then what
 * was set aside, then history.
 *
 * `live` deliberately excludes `review` as well as the terminal pair. A ticket
 * built and being checked has already used its deps, so rewriting them would
 * rewrite history rather than rescue anything. `parked` is live, because the
 * verb for the status it was parked from brings it straight back.
 *
 * A dep is satisfied by `review` or `done`: review means built and checked, and
 * that is enough to unblock work sitting on top of it.
 *
 * `dropped` is the one status with no verb. Killing a ticket repairs whatever
 * depended on it, and that repair only exists in `flow drop`.
 */
const STATUSES = [
  { name: 'todo',       verb: 'todo',       rank: 4, open: true,  live: true,  inFlight: false, satisfies: false, terminal: false, reason: false },
  { name: 'groundwork', verb: 'groundwork', rank: 0, open: true,  live: true,  inFlight: true,  satisfies: false, terminal: false, reason: false },
  { name: 'planning',   verb: 'plan',       rank: 1, open: true,  live: true,  inFlight: true,  satisfies: false, terminal: false, reason: false },
  { name: 'building',   verb: 'build',      rank: 2, open: true,  live: true,  inFlight: true,  satisfies: false, terminal: false, reason: false },
  { name: 'review',     verb: 'review',     rank: 3, open: true,  live: false, inFlight: true,  satisfies: true,  terminal: false, reason: false },
  { name: 'done',       verb: 'done',       rank: 6, open: false, live: false, inFlight: false, satisfies: true,  terminal: true,  reason: false },
  { name: 'parked',     verb: 'park',       rank: 5, open: true,  live: true,  inFlight: false, satisfies: false, terminal: false, reason: true  },
  { name: 'dropped',    verb: '',           rank: 7, open: false, live: false, inFlight: false, satisfies: false, terminal: true,  reason: true  },
];

const NAMES = STATUSES.map((s) => s.name);
const setOf = (column) => new Set(STATUSES.filter((s) => s[column]).map((s) => s.name));

const OPEN = setOf('open');
const LIVE = setOf('live');
const IN_FLIGHT = setOf('inFlight');
const SATISFYING = setOf('satisfies');
const TERMINAL = setOf('terminal');
const NEEDS_REASON = setOf('reason');

const RANK = Object.fromEntries(STATUSES.map((s) => [s.name, s.rank]));

/**
 * How far along the line a status sits, for asking whether a ticket has already
 * passed some point. Row order is lifecycle order, so the index answers it.
 *
 * `parked` and `dropped` sit off the line and their numbers mean nothing here —
 * handle both before comparing.
 */
const ORDER = Object.fromEntries(STATUSES.map((s, i) => [s.name, i]));

/**
 * The verbs, and what each one does.
 *
 * A status move is the most-typed thing `flow` does, and it used to be spelled
 * `flow tickets edit t047 --status building` — 5 words to write one field. The
 * summaries are separate from the table because a sentence inside an aligned
 * row destroys the alignment that makes the row readable.
 */
const VERBS = STATUSES.filter((s) => s.verb);
const VERB_OF = Object.fromEntries(VERBS.map((s) => [s.name, s.verb]));

const DOES = {
  todo: 'put it back in the queue',
  groundwork: 'settle the open questions',
  plan: 'write the plan',
  build: 'build it',
  review: 'hand the work over',
  done: 'close it',
  park: 'set it aside, with a reason',
};

/**
 * The first status a type actually uses. An `issue` and a `prototype` have no
 * questions to settle before work starts — a bug's cause is hunted while the
 * fix is written, and a prototype's question arrives with the ticket — so both
 * open at `building` rather than resting in a status that describes neither.
 *
 * Nothing performs this move. `flow <id>` prints the verb for it, and the skill
 * picking the ticket up types it — after reading the ticket, never before.
 */
const ENTRY_STATUS = { issue: 'building', prototype: 'building' };
const entryStatusFor = (type) => ENTRY_STATUS[type] || 'groundwork';

module.exports = {
  STATUSES, NAMES, RANK, ORDER, VERBS, VERB_OF, DOES,
  OPEN, LIVE, IN_FLIGHT, SATISFYING, TERMINAL, NEEDS_REASON,
  entryStatusFor,
};
