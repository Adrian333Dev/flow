# Log a change to a file Flow ships

An edit of one ends on `[Auto] <file> is logged: add an entry to <log>, …`. Before the reply, append one entry to that log per rule changed in the turn, or per section where the file has no rule ids. Several edits of one rule in a turn are one entry. A missing log starts with `# Log of <file>`. Newest last.

````md
## 2026-11-01 · `agreed` · rewrite
Ticket: fw-341
Why: a hedge on a proposal was read as pushback, and the user asked for hedges to count as agreement.
Trial: watch whether "mostly" replies still get asked for a yes.
Was:
```md
- **`agreed`** Everything you proposed that drew no pushback. Pushback: an objection, or another solution to the same problem.
```
````

- **Heading**: the date, the rule id (or the heading text), and `add`, `rewrite` or `remove`.
- **`Ticket`**: the ticket the work belongs to. None → leave the line out.
- **`Why`**: one line. What went wrong, or what the user asked, in their words where they gave them.
- **`Trial`**: only when the user calls the change a test. What to watch, in one line.
- **`Was`**: for a rewrite or a remove, the whole rule or section as it stood before the turn, verbatim, in a fence longer than any fence inside it. It is the only way back. An add has none. A new file is one `add` entry headed by the file's name.
