# claude-code-tools

Read 2026-10-04 from `repos/tools/claude-code-tools/`. About 2,000 stars, MIT, by Prasad Chalasani. A set of command-line tools around Claude Code and Codex: full-text search over past sessions, a tmux driver, a safety hook, a status line.

**A rollover keeps the old transcript reachable.** `aichat resume` starts a fresh session whose first line names its parent session files. The new session pulls a missing detail from the old transcript on demand, with a search skill or a subagent, instead of trusting a summary alone.

## Against Flow

**Flow has both halves and never joins them.** Each ticket's `history.md` names every session that handed off, by id. `flow audit read <id> --turns 412-460` opens a slice of a past transcript. No skill tells a resumed session either exists.

## What Flow could take

**One line in the ticket's pickup**: a detail the handoff lacks → the last session in `history.md`, read with `flow audit read`. `lab/backlog/after-v1.md` → the past transcript item.
