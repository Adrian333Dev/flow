---
description: Open a session, or pick up a ticket
argument-hint: [ticket-id]
---

!`if [ -z "$ARGUMENTS" ]; then flow status; else flow tickets start $ARGUMENTS; fi 2>&1 || true`

**`flow` refused, or printed nothing** → say why and stop. It refuses what would break the ticket graph.

**No ticket named** — the session opener is above and nothing has moved. Recommend one ticket and say what decides it: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then wait. The user picks.

**A ticket is above.** Route on its `type:` and `status:` lines, read nothing else first, then invoke:

- `issue` → `/debug`
- `prototype` → `/prototype`
- `topic` → `/groundwork`
- `feature`, `chore` → `/groundwork` at `groundwork`; `/execute` at `planning`, `building` or `review`

**A ticket cut from a spec arrives decided.** Its body already carries what to build and the decisions behind it, so run `flow tickets edit <id> --status planning` and hand it to `/execute`. **Open *decisions* are what send a ticket to `/groundwork`**, never code left to read.

Route, and stop there. Whether this ticket splits, and whether it is worth building at all, are answers a map produces — `/groundwork` owns both.
