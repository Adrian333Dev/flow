# Handoff

Written 2026-09-30, before a compaction the user asked for. Read this once, then rewrite it whole next time.

## Where things stand

The final sweep is on pass 1, the walk: `lab/backlog/before-beta.md`, item 1. Nothing is committed, and the user wants no commit suggestions.

- **The sweep reads and reasons, and runs no live session.** Ruled by the user 2026-09-30, after a live run through `try.sh` that they found an overcomplication. They test live in the beta, on the real machine. The `try.sh` rule left the root `CLAUDE.md`, and pass 2 weighs deleting `try.sh`, its saved computers and the practice projects.
- **Round 2 of the walk is next, and much wider than round 1.** It covers round 1's 6 cases against the changed code, a 7th for installing Flow on a machine, and every area no walk has read yet. The user expects missed details there. The backlog line lists the 6.
- **The user has one more instruction to give after the compaction.** Wait for it before starting round 2.

## Done this session, after the ticket-store build

- **The setup session runs with Flow's permissions, for that session alone.** `flow install` writes `~/.flow/setup-settings.json`: Flow's `allow`, `ask` and `deny`, and `disableAutoMode`. It then starts `claude --safe-mode … --settings` on it. The user's live run had asked on most of 18 shell commands. A probe showed safe mode reads the file. `lab/context/state.md` holds the detail. The guard is off in that session, since safe mode turns off every hook.
- **`tmp/` is cleaned**, and `scratch-in-tmp` in the root `CLAUDE.md` now says to delete your own scratch there in the same turn, without asking.
- **`try.sh` builds again.** Its last commit failed once `flow new` began committing each ticket.
- `npm test` in `scripts/` passes 218 of 218.

## Open findings for round 2

- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked on a branch with no commit. This matters only if `try.sh` survives pass 2.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
