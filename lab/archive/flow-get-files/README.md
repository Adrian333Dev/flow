# flow get --files

`flow get <id> --files` printed a ticket, then the files its `open` block named. It ran `util fs open --files-only <ticket.md>` and printed the output under a rule. Every ticket skill ran it, and so did `/flow:handoff` when it booted a new session.

Retired by `fw-139`: a ticket lists its files in `## References`, and the agent reads what the work needs. `flow <id>` prints the ticket alone.

- `load-open.js`: `loadOpen`, `RULE` and the `files` branch of `actions.get`, as they were in `scripts/commands/tickets.js`.
- `util fs open` stays in `lab/util/`, with its own tests. It still reads and merges an `open` block in any document.
- `658f1e7` is the last commit holding the loader in `scripts/`.
