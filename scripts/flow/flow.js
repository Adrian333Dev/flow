#!/usr/bin/env node
'use strict';
/**
 * flow — tickets for a Flow project.
 *
 * The entry point only: it names the commands and hands argv to the argument
 * layer. Every rule the surface follows, and the reasoning behind each, lives
 * in references/cli-design.md.
 *
 * Frontmatter is owned by these commands; everything else in a ticket is
 * written by hand. The project root is found from the current directory, so
 * only `open` takes a path — loose work has no ticket id to name.
 */

const { FlowError } = require('./lib/error');
const cli = require('./lib/cli');
const open = require('./commands/open');
const board = require('./commands/board');
const tickets = require('./commands/tickets');
const cases = require('./commands/cases');
const work = require('./commands/work');
const overlays = require('./commands/overlays');
const skills = require('./commands/skills');
const install = require('./commands/install');

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
 * name of their own — `flow ls`, `flow build t047`. `cases` and `work` each
 * keep a group, because each is a different stored thing, typed a tenth as
 * often.
 *
 * The order inside each section is the order help prints it.
 */
const commands = { ...open, ...board, ...tickets.actions, ...install };

const SECTIONS = [
  { key: 'board', title: 'the board' },
  { key: 'tickets', title: 'tickets', lead: [['flow <id>', 'show one in full']] },
  { key: 'status', title: 'status — the move is the command' },
  { key: 'setup', title: 'setup — this machine' },
];

const NOTES = `shape   flow <command> [id] [--flags]. A word naming no command is read as a
        ticket id, which is what makes flow t047 show one
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
pickup  flow <id> prints the command a todo or parked ticket is waiting for
        and never runs it, so the skill picking the ticket up moves it after
        reading. flow open t047 build is the other door: you name the status
        yourself, so nothing is computed and nothing is guessed
resume  flow open reads the ticket, then every file named in its fenced
        flow-open block. handoff writes that block, and decides what goes in
        it — an empty one is a real answer for a ticket that carries its own
        context. Paths resolve beside the ticket first, then from the repo
        root, and a line range passes through: src/parser.js:40-120. Nothing
        is truncated, so a huge block costs what it costs
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
        three times. Override with FLOW_HOME
work    uncommitted work, stored as a commit under refs/unfinished/<machine>/
        <branch> and pushed. Not a branch: nothing switches to it and nothing
        moves it. Send from one machine, get on the other. Name each machine
        once with git config --global flow.machine <name>; sending refuses
        until it is set, because two machines sharing one name overwrite each
        other silently. Gitignored files travel only when named in
        .flow-include at the project root. Full instructions in
        ~/.claude/flow/references/work-sync.md
skills  one real copy of each lives in the clone, filed under a group folder
        that decides nothing else. Installing one means creating a symlink
        named for it: home/skills names what links into ~/.claude/skills, and
        .claude/flow/skills names what links into this project. A symlink
        cannot be committed — git stores this machine's path and the next
        machine keeps its clone elsewhere — so the lists carry names and
        flow skills sync turns a list back into links
overlay a project adds to a skill without editing it, because one copy of that
        skill is shared by every project on the machine. Write
        .claude/flow/overlays/<name>.md and every session in that project reads
        it as part of the skill. The line runs at the bottom of the skill, so
        a project with no overlay file prints nothing
default cases, skills and overlays each read a bare word as an argument to
        their most used action: flow overlays groundwork is flow overlays get
        groundwork. work has none, because its get writes over the folder you
        are standing in`;

try {
  process.exitCode = cli.dispatch(process.argv.slice(2), {
    commands,
    groups: { cases, work, skills, overlays },
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
