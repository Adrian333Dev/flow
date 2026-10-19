#!/usr/bin/env node
'use strict';
/**
 * flow: the board, setup, settings and audit.
 *
 * The entry point only: it names the commands and hands argv to the argument
 * layer. Every command and its flags are listed in docs/reference/commands.md.
 */

const { FlowError } = require('./lib/error');
const paths = require('./lib/paths');
const cli = require('./lib/cli');
const board = require('./commands/board');
const tickets = require('./commands/tickets');
const notes = require('./commands/notes');
const install = require('./commands/install');
const update = require('./commands/update');
const doctor = require('./commands/doctor');
const sync = require('./commands/sync');
const audit = require('./commands/audit');
const init = require('./commands/init');
const settingsCommand = require('./commands/settings');
const scorecard = require('./commands/scorecard');

// `flow ls | head -2` closes the pipe while node is still writing into it. The
// default handling for that is an uncaught EPIPE and a stack trace printed over
// whatever you were reading, for something that is not a failure at all: the
// reader stopped, which is what `head` is for.
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

const TITLE = 'flow: the board, setup, settings and audit';

/**
 * One flat namespace. Tickets are what this tool is about, so they have no
 * name of their own: `flow ls`, `flow start exp-47`. Everything else keeps a
 * group: `notes`, `settings` and `audit`.
 *
 * The order inside each section is the order help prints it. A command whose
 * section is missing here still runs and never prints. A command marked
 * `hidden` still never prints: `note`, the short form of `flow notes new`,
 * which the notes group's summary names.
 */
const commands = {
  ...board, ...tickets.actions, ...install, ...update, ...init, ...sync, ...doctor, ...scorecard,
  note: notes.note,
};

const SECTIONS = [
  { key: 'board', title: 'the board' },
  { key: 'tickets', title: 'tickets' },
  { key: 'status', title: 'status, the move is the command' },
  { key: 'setup', title: 'setup, this machine and its projects' },
  { key: 'checks', title: 'rule checks' },
];

try {
  process.exitCode = cli.dispatch(process.argv.slice(2), {
    commands,
    groups: { notes, settings: settingsCommand, audit },
    check: (_, flags) => {
      paths.useRoot(flags.root);
    },
    fallback: tickets.fallback,
    sections: SECTIONS,
    title: TITLE,
  }) || 0;
} catch (e) {
  if (e instanceof FlowError) {
    process.stderr.write(`flow: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
