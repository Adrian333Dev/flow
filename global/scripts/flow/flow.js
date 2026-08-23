#!/usr/bin/env node
'use strict';
/**
 * flow — tickets for a Flow project.
 *
 * The entry point only: it names the commands and hands argv to the argument
 * layer. Every rule the surface follows, and the reasoning behind each, lives
 * in global/refs/cli-design.md.
 *
 * Frontmatter is owned by these commands; everything else in a ticket is
 * written by hand. The project root is found from the current directory, so no
 * command takes a path.
 */

const { FlowError } = require('./lib/error');
const cli = require('./lib/cli');
const board = require('./commands/board');
const tickets = require('./commands/tickets');
const cases = require('./commands/cases');

// `flow ls | head -2` closes the pipe while node is still writing into it. The
// default handling for that is an uncaught EPIPE and a stack trace printed over
// whatever you were reading — for something that is not a failure at all: the
// reader stopped, which is what `head` is for.
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

const TITLE = 'flow — tickets, computed from docs/tickets/';

/**
 * One flat namespace. Tickets are what this tool is about, so they have no
 * name of their own — `flow ls`, `flow build t047` — and `cases` keeps a group
 * because it is a different stored thing, typed a tenth as often.
 *
 * The order inside each section is the order help prints it.
 */
const commands = { ...board, ...tickets.actions };

const SECTIONS = [
  { key: 'board', title: 'the board' },
  { key: 'tickets', title: 'tickets', lead: [['flow <id>', 'show one in full']] },
  { key: 'status', title: 'status — the move is the command' },
];

const NOTES = `shape   flow <command> [id] [--flags]. A word naming no command is read as a
        ticket id, which is what makes flow t047 show one. Shorten any name
        to an unambiguous prefix: flow b t047 is flow build t047
ids     t047-parser-split. The number is the identity and the label is
        decoration, so t047, 47, parser and the whole thing all resolve. A
        ticket is never renamed, so a label that goes stale breaks nothing
layout  docs/tickets/<id>-<label>/ — ticket.md and groundwork/ from birth,
        plan.md and reports/ written by the work. One report per thing
        answered, named after what it answers, whether a hunt found it or a
        prototype did. Done and dropped tickets move to docs/tickets/archive/
        and move back if reopened
steps   flow <id> counts the checkboxes in plan.md each time it prints, so the
        count cannot drift from the file. The lists never count: out there
        status already says whether a ticket is being built, waiting on
        review, or finished
pickup  flow <id> prints the command a todo or parked ticket is waiting for.
        It prints it rather than running it — the skill picking the ticket up
        moves it, after reading the ticket rather than before
park    parking stores the status it left, and reviving is the verb for that
        status. A feature parked at building comes back at building
parent  a ticket split out of another carries parent: t047. Disk stays flat;
        the hierarchy is frontmatter. A parent waits while its children are
        open — it leaves flow next, and picking it up refuses — then returns
        for whatever work no child holds
pri     high or low on disk and nothing else: normal is the absent field, so an
        ordinary ticket has no priority line to go stale. A ticket with none
        inherits the nearest ancestor's, and an explicit value always beats an
        inherited one — so marking one parent high lifts a whole feature, and a
        low chore inside it stays low
root    the enclosing git repo; override with FLOW_PROJECT=/path
cases   ~/.claude/flow/study-cases/<issue>/<date>-<slug>.md — global, filed by
        issue and never by project, because the payoff is seeing one failure
        three times. Override with FLOW_HOME`;

try {
  process.exitCode = cli.dispatch(process.argv.slice(2), {
    commands,
    groups: { cases },
    fallback: tickets.fallback,
    sections: SECTIONS,
    title: TITLE,
    notes: NOTES,
  }) || 0;
} catch (e) {
  if (e instanceof FlowError) {
    process.stderr.write(`flow: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
