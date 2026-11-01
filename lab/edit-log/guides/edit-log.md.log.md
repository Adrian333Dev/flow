# Log of guides/edit-log.md

## 2026-11-01 · Log a change to a file Flow ships · rewrite
Ticket: fw-341
Why: the user asked to log only real instruction changes, approach A to approach B, never a rename or a line a release made true.
Was:
```md
An edit of one ends on `[Auto] <file> is logged: add an entry to <log>, …`. Before the reply, append one entry to that log per rule changed in the turn, or per section where the file has no rule ids. Several edits of one rule in a turn are one entry. A missing log starts with `# Log of <file>`. Newest last.
```
