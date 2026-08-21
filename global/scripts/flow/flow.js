#!/usr/bin/env node
'use strict';
/**
 * flow — tickets for a Flow project.
 *
 * The entry point only: it names the command groups and hands argv to the
 * argument layer. Every rule the surface follows, and the reasoning behind
 * each, lives in global/refs/cli-design.md.
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

const TITLE = 'flow — tickets, computed from docs/tickets/';

const NOTES = `shape   flow <things> <action> [target] [--flags] — the action always comes second.
        Shorten any name to an unambiguous prefix: flow t e t047 --st building
ids     t047-parser-split. The number is the identity and the label is
        decoration, so t047, 47, parser and the whole thing all resolve
layout  docs/tickets/<id>-<label>/ — ticket.md and groundwork/ from birth,
        plan.md and reports/ written by the work. One report per thing
        answered, named after what it answers, whether a hunt found it or a
        prototype did. Done and dropped tickets move to docs/tickets/archive/
        and move back if reopened
steps   flow never counts them. A plan is read by opening plan.md; out here,
        status says whether a ticket is being built, waiting on review, or
        finished
parent  a ticket split out of another carries parent: t047. Disk stays flat;
        the hierarchy is frontmatter. A parent waits while its children are
        open — it leaves flow next, and start refuses on it — then returns for
        whatever work no child holds
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
    board,
    groups: { tickets, cases },
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
