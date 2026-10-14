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
 * it. The one thing a row cannot carry is a refusal: `done` refuses on a
 * parent with open children, `dropped` refuses while live dependents exist,
 * so those stay in the command that writes them.
 */

/*
 * Five statuses, and the agent moves them as the work moves.
 * `todo`: ready to work, nothing else. `in-progress`: someone is on it, from
 * the first question to the last check; a ticket waiting on the user stays
 * here. `done`: the agent closes it once its own check passes, and the user
 * reopens it in a word. `parked`: put off, with a reason saying what brings it
 * back. `dropped`: cancelled, with a reason.
 *
 * Rows are in lifecycle order, which is the order the verbs print in help.
 * `rank` is separate because a list is read work-first rather than
 * lifecycle-first: what is in flight leads, then what could start, then what
 * was set aside, then history.
 *
 * `parked` is live, because the verb for the status it was parked from brings
 * it straight back.
 *
 * A dep is satisfied by `done` alone. Work sitting on top of a ticket that is
 * still `in-progress` is sitting on something that can change under it.
 *
 * `dropped` is the one status with no verb. Killing a ticket repairs whatever
 * depended on it, and that repair only exists in `flow drop`.
 */
const STATUSES = [
  { name: 'todo',        verb: 'todo',  rank: 1, open: true,  live: true,  inFlight: false, satisfies: false, terminal: false, reason: false },
  { name: 'in-progress', verb: 'start', rank: 0, open: true,  live: true,  inFlight: true,  satisfies: false, terminal: false, reason: false },
  { name: 'done',        verb: 'done',  rank: 3, open: false, live: false, inFlight: false, satisfies: true,  terminal: true,  reason: false },
  { name: 'parked',      verb: 'park',  rank: 2, open: true,  live: true,  inFlight: false, satisfies: false, terminal: false, reason: true  },
  { name: 'dropped',     verb: '',      rank: 4, open: false, live: false, inFlight: false, satisfies: false, terminal: true,  reason: true  },
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
 * The verbs, and what each one does.
 *
 * A status move is the most-typed thing `flow` does, and it used to be spelled
 * `flow tickets edit t047 --status building`: 5 words to write one field. The
 * summaries are separate from the table because a sentence inside an aligned
 * row destroys the alignment that makes the row readable.
 */
const VERBS = STATUSES.filter((s) => s.verb);
const VERB_OF = Object.fromEntries(VERBS.map((s) => [s.name, s.verb]));

const DOES = {
  todo: 'put it back in the queue',
  start: 'start working on it',
  done: 'close it',
  park: 'set it aside, with a reason',
};

module.exports = {
  STATUSES, NAMES, RANK, VERBS, VERB_OF, DOES,
  OPEN, LIVE, IN_FLIGHT, SATISFYING, TERMINAL, NEEDS_REASON,
};
