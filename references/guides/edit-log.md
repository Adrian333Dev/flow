# Log a change to a file Flow ships

An edit of one ends on `[Auto] <file> is logged: a change of approach gets an entry in <log>, …`.

- **Log a change of approach**: a rule that now has the agent act otherwise, by a decision, and every removal.
- **Skip a rename, a rewording, and a line a release made true**, such as a tool's new option.

Before the reply, append one entry to that log per rule changed in the turn, or per section where the file has no rule ids. Several edits of one rule in a turn are one entry. Log a batch the user approved as one change in one entry. Its `Was` holds each touched section whole. A missing log starts with `# Log of <file>`. Newest last.

````md
## 2026-11-01 · `agreed` · rewrite
Ticket: fw-341
Why: a hedge on a proposal was read as pushback, and the user asked for hedges to count as agreement.
Was:
```md
- **`agreed`** Everything you proposed that drew no pushback. Pushback: an objection, or another solution to the same problem.
```
````

- **Heading**: the date, the rule id (or the heading text), and `add`, `rewrite` or `remove`.
- **`Ticket`**: the ticket the work belongs to. None → leave the line out.
- **`Why`**: one line. What went wrong, or what the user asked, in their words where they gave them.
- **`Was`**: for a rewrite or a remove, the whole rule or section as it stood before the turn, verbatim, in a fence longer than any fence inside it. It is the only way back. An add has none. A new file is one `add` entry headed by the file's name.
