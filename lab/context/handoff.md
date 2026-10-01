# Handoff

Written 2026-10-01. Read this once, then rewrite it whole next time.

## Where things stand

Pass 2 of the final sweep, simplify, ran a second time on 2026-10-01, and everything it proposed is built. `lab/backlog/before-beta.md` → pass 2 records each item:

- **Every phase skill works on a ticket.** A phase skill finding none creates one first, outside a project in `~/.flow/tickets/`. `.flow/groundwork/`, `~/.flow/groundwork/`, `flow new --from-groundwork`, `flow get <path>`, `/flow:start <path>`, `handoff.md` and the `REPORT` files are gone.
- **4 fixes**: `/flow:debug` moves its own ticket to `review` and `done`, and the parent session closes a hunt or a prototype it handed to a subagent. The board leaves a parent with open children out of `in flight`. `flow next` prints the board, `/flow:start` runs it, and `flow get` needs an id. `flow drop` writes its `history.md` line.

`npm test` in `scripts/` passed, 246 of 246. Nothing is committed.

## Next: pass 3, compress every skill

Pass 2 is finished, so `lab/backlog/before-beta.md` → pass 3 comes next: cut the detail and explanation an agent does not need, pass after pass, until the user is happy. `/flow:groundwork` is the user's example of a skill that over-explains. Run `drain-workflow-notes` and `check-claude-code-updates` from `CLAUDE.md` first.

## How the user wants this work done

- Reason extensively before proposing anything. Weigh each candidate against what it is for, and never re-raise one recorded as kept.
- Record every dropped proposal in its backlog item, with why, in the same turn: `CLAUDE.md` → `write-dropped-proposals`.
- Keep replies short. The user is always in a rush.
- Reuse what exists, and match the conventions the user names.
- The user dictates by voice, thinks out loud, and approves with "go" or "approve". A message ending in a question is thinking.
- The user commits. Never suggest a commit.

## Watch in the beta

- **`/flow:start /home-4` outside a project may be refused.** `scripts/check-ticket.js` refuses a bare `/flow:start` outside a project, and whether Claude Code hands it an empty `command_args` when a ticket's skill follows it is unchecked. A phase skill with the ticket, `/flow:groundwork /home-4`, always gets through.
- **`flow init`'s push check is a dry run**, tested only against a missing remote folder. Whether GitHub refuses a dry run from someone signed out, or without write access, is unchecked.
- **Whether `claude plugin list`, run from inside the safe-mode setup session, still lists synced plugins.** The docs do not say.
- **The restore form has never met a real terminal.** Tests answer the word in process. Check the prompt reads well, and that saving the form in an editor and typing the word works as written.
- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
