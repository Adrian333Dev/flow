#!/usr/bin/env node
/**
 * flow: the board, setup, settings and audit.
 *
 * The entry point only: it names the commands and hands argv to the argument
 * layer. Every command and its flags are listed in docs/manual/commands.md.
 */

import { FlowError } from './shared/error.ts';
import * as paths from './shared/paths.ts';
import * as cli from './shared/cli.ts';
import board from './commands/board.ts';
import tickets from './commands/tickets.ts';
import notes from './commands/notes.ts';
import findings from './commands/findings.ts';
import install from './commands/install.ts';
import update from './commands/update.ts';
import doctor from './commands/doctor.ts';
import sync from './commands/sync.ts';
import audit from './commands/audit.ts';
import init from './commands/init.ts';
import settingsCommand from './commands/settings.ts';
import scorecard from './commands/scorecard.ts';

// `flow tickets | head -2` closes the pipe while node is still writing into it. The
// default handling for that is an uncaught EPIPE and a stack trace printed over
// whatever you were reading, for something that is not a failure at all: the
// reader stopped, which is what `head` is for.
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

const TITLE = 'flow: the board, setup, settings and audit';

/**
 * Every command sits under a noun, and a noun typed alone lists. Bare stay
 * `flow next`, which answers for Flow as a whole, and the 5 setup commands,
 * which act on Flow itself.
 *
 * The order inside each section is the order help prints it.
 */
const commands = { ...board, ...install, ...update, ...init, ...sync, ...doctor };

const SECTIONS = [
  { key: 'board', title: 'the board' },
  { key: 'setup', title: 'setup, this machine and its projects' },
];

try {
  process.exitCode = cli.dispatch(process.argv.slice(2), {
    commands,
    groups: { tickets, notes, findings, audit, settings: settingsCommand, scorecard },
    check: (_, flags) => {
      paths.useRoot(flags.root);
    },
    sections: SECTIONS,
    title: TITLE,
  }) || 0;
} catch (e) {
  // Under --json a refusal is JSON on stdout too: a reader parses stdout either way.
  if (e instanceof FlowError && cli.jsonMode()) {
    process.stdout.write(`${JSON.stringify({ error: e.message })}\n`);
    process.exitCode = 1;
  } else if (e instanceof FlowError) {
    process.stderr.write(`flow: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
