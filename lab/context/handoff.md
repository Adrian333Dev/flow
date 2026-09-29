# Handoff

Written 2026-09-29, at the end of the ticket-store build and its second round. Read this once, then rewrite it whole next time.

## Where things stand

The storage redesign in `lab/context/ticket-store.md` is built, tested and written up, the second round included: `--local`, `flow new` refusing offline, `branch:` and `history.md`, and `flow load`. Nothing is committed, and the user wants no commit suggestions.

- **Tests**: `npm test` in `scripts/` passes all of them. No `~/.flow` exists after a run.
- **Records**: `ticket-store.md`, `state.md` and the backlog match the tree.
- **Never run live**: the history line inside a real Claude Code session, where `CLAUDE_CODE_SESSION_ID` and a real transcript title arrive. The test fakes both.

## Next

Round 2 of the workflow walk, live through `bash lab/scripts/try.sh`: `lab/backlog/before-beta.md`, item 1.
