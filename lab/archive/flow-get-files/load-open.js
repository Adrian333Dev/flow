'use strict';
/**
 * Retired: what `flow get <id> --files` ran to load a ticket's `open` block.
 * Copied out of `scripts/commands/tickets.js`, where it sat beside `actions.get`.
 */

const { execFileSync } = require('child_process');
const { out } = require('../../../scripts/lib/cli');

const RULE = '-'.repeat(60);

/**
 * The files a document names in its own `open` block, printed under a rule.
 *
 * `util fs open` owns the format, the parse and the merge, because the block is
 * not a ticket format: a handoff, a spec or a loose note carries one on the
 * same terms. What stays here is where Flow runs it from. That command resolves
 * a path beside the document first and then from its working directory, so
 * running it at the repo root against `ticket.md` gives exactly the two bases a
 * ticket needs.
 *
 * `--files-only` because `get` has already printed the ticket by the time this
 * runs. Without the flag the command prints the document too, which is what it
 * should do for anyone opening a document cold.
 */
function loadOpen(file, cwd) {
  let printed;
  try {
    printed = execFileSync('util', ['fs', 'open', '--files-only', file], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    const why = e.code === 'ENOENT'
      ? 'util is not on PATH: install it, then run flow get --files again'
      : String(e.stderr || e.message).trim();
    printed = `unread: util fs open failed, ${why}`;
  }
  out(`\n${RULE}\n${printed.trimEnd()}`);
}

// The `files` branch of `actions.get`, which called it after printing the ticket:
//
//   flags: { files: { bool: true } },
//   run({ positional, flags, unnamed }) {
//     ...
//     const { root, tickets, t } = locate(first, unnamed);
//     out(render.show(t, tickets, root));
//     if (flags.files) {
//       loadOpen(t.file, root);
//     }
//     return 0;
//   },

module.exports = { loadOpen, RULE };
