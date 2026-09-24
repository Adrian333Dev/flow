#!/usr/bin/env node
'use strict';
/**
 * flow: tickets for a Flow project.
 *
 * The entry point only: it names the commands and hands argv to the argument
 * layer. Every rule the surface follows, and the reasoning behind each, lives
 * in references/cli-design.md.
 *
 * Frontmatter is owned by these commands; everything else in a ticket is
 * written by hand. The project root is found from the current directory, so
 * only `get` takes a path: loose work has no ticket id to name.
 */

const { FlowError } = require('./lib/error');
const machine = require('./lib/machine');
const cli = require('./lib/cli');
const board = require('./commands/board');
const tickets = require('./commands/tickets');
const cases = require('./commands/cases');
const overlays = require('./commands/overlays');
const skills = require('./commands/skills');
const install = require('./commands/install');
const doctor = require('./commands/doctor');
const sync = require('./commands/sync');
const uninstall = require('./commands/uninstall');
const audit = require('./commands/audit');
const scorecard = require('./commands/scorecard');
const contribute = require('./commands/contribute');
const restore = require('./commands/restore');
const setup = require('./commands/setup');

// `flow ls | head -2` closes the pipe while node is still writing into it. The
// default handling for that is an uncaught EPIPE and a stack trace printed over
// whatever you were reading, for something that is not a failure at all: the
// reader stopped, which is what `head` is for.
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

const TITLE = 'flow: tickets, computed from .flow/tickets/';

/**
 * One flat namespace. Tickets are what this tool is about, so they have no
 * name of their own: `flow ls`, `flow build t047`. `cases` keeps a group of
 * its own, being a different stored thing and typed a tenth as often.
 *
 * The order inside each section is the order help prints it.
 */
const commands = { ...board, ...tickets.actions, ...install, ...doctor, ...sync, ...uninstall, ...scorecard, ...contribute };

const SECTIONS = [
  { key: 'board', title: 'the board' },
  { key: 'tickets', title: 'tickets', lead: [['flow <id>', 'show one in full']] },
  { key: 'status', title: 'status, the move is the command' },
  { key: 'setup', title: 'setup, this machine and its projects' },
  { key: 'rules', title: 'rules, whether the checks are catching anything' },
  { key: 'share', title: 'sharing, what this project learned' },
];

const NOTES = `shape   flow <command> [id] [--flags]. A word naming no command is read as a
        ticket id, which is what makes flow t047 show one
ids     t047-parser-split. The number is the identity and the label is
        decoration, so t047, 47, parser and the whole thing all resolve. A
        ticket is never renamed, so a label that goes stale breaks nothing
layout  .flow/tickets/<id>-<label>/: ticket.md and groundwork/ from birth,
        plan.md and reports/ written by the work. One report per thing
        answered, named after what it answers, whether a hunt found it or a
        prototype did. Done and dropped tickets move to .flow/tickets/archive/
        and move back if reopened
steps   flow <id> counts the checkboxes in plan.md and in groundwork/map.md
        each time it prints, so neither count can drift from its file. The
        two artifacts say whether a phase finished; status only claims it.
        The lists never count: out there status already says whether a ticket
        is being built, waiting on review, or finished
pickup  flow <id> prints the command a todo or parked ticket is waiting for
        and never runs it, so the skill picking the ticket up moves it after
        reading. The status verbs are the only way to move a ticket
resume  flow get --files reads the ticket, then every file named in its
        fenced open block, through util fs open. handoff writes that block,
        and decides what goes in it: an empty one is a real answer for a
        ticket carrying its own context. Paths resolve beside the ticket
        first, then from the repo root, and a line range passes through:
        src/parser.js:40-120. Nothing is truncated
park    parking stores the status it left, and reviving is the verb for that
        status. A feature parked at building comes back at building
parent  a ticket split out of another carries parent: t047. Disk stays flat;
        the hierarchy is frontmatter. A parent waits while its children are
        open (it leaves flow next, and picking it up refuses) then returns
        for whatever work no child holds
pri     high or low on disk and nothing else: normal is the absent field, so an
        ordinary ticket has no priority line to go stale. A ticket with none
        inherits the nearest ancestor's, and an explicit value always beats an
        inherited one, so marking one parent high lifts a whole feature, and a
        low chore inside it stays low
root    the enclosing git repo; override with FLOW_PROJECT=/path
cases   ~/.flow/study-cases/<issue>/<date>-<slug>.md: global, filed by issue
        and never by project, because the payoff is seeing one failure three
        times. Override with FLOW_HOME
skills  one real copy of each lives in the clone, filed under a group folder.
        Every group but drafts installs on every machine, as one symlink named
        for the skill, so there is no list to keep in step. The links sit
        inside ~/.agents/skills/flow/, beside the manifest that makes each one
        typed as /flow:groundwork. Codex reads that folder, and Claude Code
        reaches it through the link ~/.claude/skills/flow
sources a skill repository Flow takes skills from, cloned whole into
        ~/.flow/repos/sources/<owner>_<repo>/. sources in ~/.flow/settings.json
        lists them, the domain-skills repository first. flow skills add
        owner/repo clones one, flow install clones any that are missing, and
        the session-start hook pulls them. Private skills live in
        ~/.flow/private-skills/<name>/ and take a name no other skill uses
switch  a skill is on where its link exists. "skills": { "react": "on" } in
        a settings file says which: <project>/.flow/settings.json for the
        project, ~/.flow/settings.local.json for this machine, and
        ~/.flow/settings.json for every machine, the nearest winning. Flow's
        own skills start on and have no project level; the rest start off.
        flow skills on, off and drop write the line and fix the links
overlay a project adds to a skill without editing it, because one copy of that
        skill is shared by every project on the machine. Write
        .flow/overlays/<name>.md and every session in that project reads it as
        part of the skill. The line runs at the bottom of the skill, so a
        project with no overlay file prints nothing
share   a finding for a domain skill waits in .flow/findings/<skill>/, where
        /flow:file-findings moves it on a yes. flow contribute opens one pull
        request per skill through gh api, forking first where you cannot
        push, and deletes each file once sent. A pull request is never
        merged: /flow:apply-domain-findings rewrites the skill from it and
        closes it with what went in
migrate a change to where Flow and the harnesses keep their files, written
        by flow setup, /flow:setup-project or /flow:migrate into
        ~/.flow/migrations/<machine or project>/<time>/: migration.md lists
        each change, files/ holds each new version. After your yes the skill
        runs ~/.flow/scripts/apply-migration.js, which never touches a path
        the migration leaves out. A line that fails stops the run there, and
        running the script again carries on from that line
before  ~/.flow/originals/<machine or project>/ holds every path as it was
        before Flow first touched it. flow install writes the machine's, the
        first setup of each place closes it, and nothing is ever added after
        that. flow restore machine and flow restore project put every path
        back; flow uninstall does both, then deletes ~/.flow/ and the clone.
        Both need a terminal with no session running, so neither is a command
        the agent can run
sync    ~/.flow/ is one private git repository, and that is the whole of how a
        second machine gets your rules, notes, study cases and wiki. flow sync
        brings the other machine's down, then sends this one up. What belongs
        to one machine stays there: version, run.json, originals/,
        settings.local.json, repos/, history.jsonl, the scripts, references
        and docs links, and each wiki tool's downloads
default cases and overlays each read a bare word as an argument to their
        most used action: flow overlays groundwork is flow overlays get
        groundwork. skills defaults to ls, so flow skills react lists the
        skills naming react
audit   what Claude Code did, read back afterwards. It reads the transcripts
        Claude Code already writes at ~/.claude/projects/ and derives an index
        at ~/.flow/audit/audit.db; nothing is recorded and nothing is
        intercepted, so a session that ran before any of this existed reads the
        same as one that ran today. flow audit index first, every time: it
        walks only what was appended since the last run. The index is derived:
        deleting it loses nothing, and --rebuild is how a schema change lands.
        Queries narrow to a turn range, and flow audit read opens that range of
        the original conversation. Never a whole session: one segment averages
        270k tokens
checks  a rule check is one file in ~/.flow/scripts/rule-checks/, named after
        the rule id it enforces. The PreToolUse hook on Edit and Write runs
        every one of them and appends a line per result to
        ~/.flow/scorecards/<session>.jsonl. Each check carries its own tier:
        measure records and interrupts nothing, warn puts a line in front of
        the agent, block refuses the edit. Every check starts at measure, and
        flow scorecard says which have earned a promotion. A rule with no check
        is listed as coverage, never as a failure`;

try {
  process.exitCode = cli.dispatch(process.argv.slice(2), {
    commands,
    groups: { cases, skills, overlays, audit, restore, setup },
    check: (action, flags) => (action.anywhere ? null : machine.requireSetup(flags.root)),
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
