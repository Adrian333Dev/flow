---
description: Open a session, or pick up a ticket
argument-hint: [ticket-id]
---

!`if [ -z "$ARGUMENTS" ]; then flow status; else flow $ARGUMENTS; fi 2>&1 || true`

**`flow` printed a refusal, or nothing** → say why and stop. Nothing above writes, so a refusal means the id matched no ticket.

**No ticket named** — the session opener is above. Recommend one ticket and say what decides it: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then wait. The user picks.

**A ticket is above, and nothing has moved.** `flow` read it. The skill you route to writes the status, after it opens the phase's own artifact — never here, and never before something has been read.

Its `type:` line picks the skill, and `feature` and `chore` read `status:` too. Read nothing else first, then invoke — the skill loads here, in this session.

- `issue` → `/debug`
- `prototype` → `/prototype`
- `topic` → `/groundwork`
- `feature`, `chore` — the status decides:
  - `todo`, `groundwork` → `/groundwork`
  - `planning`, `building`, `review` → `/execute`

**`status: parked`** → route on the `resumes at:` line, which names the status the ticket left. The command that revives it prints underneath.

**`status: done` or `dropped`** → say the ticket is closed, and stop. Reopening is the user's call.

**A ticket cut from a spec arrives decided.** Its body already carries what to build and the decisions behind it, so route it to `/execute`, which opens it at `planning`. **Open *decisions* are what send a ticket to `/groundwork`**, never code left to read.

Route, and stop there. Whether this ticket splits, and whether it is worth building at all, are answers a map produces — `/groundwork` owns both.
