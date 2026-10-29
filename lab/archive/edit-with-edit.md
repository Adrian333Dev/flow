# edit-with-edit

The rule as it stood in `home/CLAUDE.md` `## Tools`, last commit `cc82532`:

```md
- **`edit-with-edit`** Edits → `Edit`, every independent edit in one message. The same mechanical change across many files (a rename, a moved path) → a script in `tmp/`: dry run, apply, delete. Never `python3` or `sed -i` for an ordinary edit, one file per request. Never a check alone after an edit.
```

An earlier form sits in `global-rules/CLAUDE-2026-10-17.md`, without the script clause.

## Its state

Each ticket below is one sighting of the same fault: a shell edit of known text where `Edit` works.

- `fw-195`: the first ticket, closed 2026-10-19 with no change.
- `fw-247`: `python3` and `sed -i` while building `fw-244` (2026-10-21), again in `fw-290` (2026-10-26).
- `fw-279`, `fw-283`, `fw-309`, `fw-313`, `fw-320`: the same type, closed with `fw-247`.
- `fw-294` held the check: an edit to a test file or a ticket body goes through `Edit` in the next 3 sessions that touch either.

Counts from `flow audit sql`, sessions from 2026-10-19 to 2026-10-29:

- About 247 shell file writes: 101 to other files, 66 to test files, 54 rewriting a ticket file, 26 ticking a checkbox in a ticket, 1 a checkbox in a test.
- `Edit` hit a `ticket.md` 1342 times in the same period.

## Why it was retired

Retired 2026-10-29 by `fw-247` at the user's word. The rule failed 8 times after `fw-195`, and a stricter rule would fail the same way: the agent reaches for the shell on a line that looks like a one-line change. What the shell edit skipped was the guides an `Edit` of that file brings. The `shell-write` entry (`mods/flow-session/features/guides/shell-write.ts`, `situations.ts`) now sends the same guides for a shell write and holds it until they are read. `docs/spec/rules.md` → `### Guides sent by situation` says why.
