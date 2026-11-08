# Log of guides/edit-log.md

## 2026-11-01 · Log a change to a file Flow ships · rewrite
Ticket: fw-341
Why: the user asked to log only real instruction changes, approach A to approach B, never a rename or a line a release made true.
Was:
```md
An edit of one ends on `[Auto] <file> is logged: add an entry to <log>, …`. Before the reply, append one entry to that log per rule changed in the turn, or per section where the file has no rule ids. Several edits of one rule in a turn are one entry. A missing log starts with `# Log of <file>`. Newest last.
```

## 2026-11-05 · Log a change to a file Flow ships · rewrite
Ticket: fw-425
Why: the `Trial` field retired with `sweep-trials` (the user 2026-11-05). Removed from the field list and the example.
Was:
```md
- **`Trial`**: only when the user calls the change a test. What to watch, in one line.
```

## 2026-11-07 · Log a change to a file Flow ships · add
Ticket: fw-425
Why: the user, on the `CLAUDE.md` cut pass: log the exact sections as they were, so a cut can be brought back exactly, and group the batch in the log.
