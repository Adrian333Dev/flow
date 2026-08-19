---
description: Open a session, or pick up a ticket
argument-hint: [ticket-id]
---

!`flow start $ARGUMENTS`

**A ticket is above and now in `thinking`** — route on its `type:` line, and read nothing else first:

- `feature` or `chore` → invoke `/execute`, Phase 1
- `issue` → invoke `/debug`
- `research` → invoke `/brainstorm`
- `prototype` → invoke `/prototype`

`flow` refused instead → say why and stop. It refuses what would break the ticket graph.

**No ticket named, so the session opener is above and nothing has moved.** Recommend one ticket and say what decides it: work already in flight comes before work cut out of it, and both come before anything new, whatever its priority. Then wait — the user picks, and `flow start <id>` routes as above.
