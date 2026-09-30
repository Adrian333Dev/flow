# Handoff

Written 2026-09-30, before a compaction the user asked for. Read this once, then rewrite it whole next time.

## Where things stand

The final sweep is on pass 1, the walk: `lab/backlog/before-beta.md`, item 1. Nothing from this session is committed, and the user wants no commit suggestions.

- **The user will answer the last reply after the compaction.** Wait for that answer before doing anything. The reply reported the Claude Code catch-up and asked one yes, below.
- **One fix waits on the user's yes: setup never sees a plugin synced from the claude.ai account.** Such a plugin loads as `<name>@synced` with no install record. `scripts/flow/setup/machine.md` step 3 reads only `installed_plugins.json`, and its line 60 allows only `claude plugin uninstall`, which cannot remove one. `scripts/flow/lib/skill-links.js:333` misses them too. Proposed: list plugins through `claude plugin list --json`, and switch a synced one off with `claude plugin disable <name>@synced`. The finding sits under pass 1 in the backlog.
- **The rest of round 2 comes after that.** Round 2 is a paper walk, much wider than round 1: round 1's 6 cases against the changed code, a 7th for installing Flow on a machine, and every area no walk has read yet. The sweep reads and reasons, and runs no live session.

## Done this session

- **Claude Code releases are tracked.** `lab/research/claude-code-updates.md` holds `Last checked: 2.1.285` on line 1, and a verdict for each release that touches Flow. `lab/scripts/claude-code-changes.sh` prints the releases newer than line 1, from Anthropic's `CHANGELOG.md` on GitHub. The root `CLAUDE.md` → `check-claude-code-updates` runs it before the next work is chosen.
- **The catch-up read 61 releases, 2.1.214 to 2.1.285.** It found the synced-plugin fault above, and 2 tools for pass 2's context engineering, now named in that backlog item: `/skill-doctor` and `/cost`'s cache-miss cause. Since 2.1.284 a session with no mode set starts in auto mode, and Flow's `defaultMode: "default"` still wins.
- **All 16 pages in `lab/research/claude-code-docs/` were downloaded again.** `plugins-loading.md` now comes from `plugins/loading.md`.
- The user's `tmp/claude-code-changelog.md` was deleted with their yes.

## Open findings, only if `try.sh` survives pass 2

- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
