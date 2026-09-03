---
name: start
description: Opens a session — the board, one ticket, or a loose file.
argument-hint: '[ticket-id] | [path]'
disable-model-invocation: true
---

!`flow get $ARGUMENTS --files 2>&1 || true`

**A refusal, or nothing** → say why and stop. The id matched no ticket, the path matched no file, or a status move hit a guard.

**Nothing named** — the board is above. Recommend one ticket and say what decides it: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then wait. The user picks.

**A file is above and no ticket** — loose work. Carry on from whatever that file says comes next.

## When a ticket is above

**A `flow-open` block already loaded the files it names**, so the phase's artifact may be on screen. Read what is there before opening anything.

**A line reading `planning → building` means the user named that move and `flow` made it.** Take the ticket at the status it now holds, and never move it again.

**No such line means nothing has moved.** The skill you route to writes the status, after it opens the phase's own artifact.

Its `type:` line picks the skill, and `feature` and `chore` read `status:` too. Read nothing else first, then invoke — the skill loads here, in this session.

- `issue` → `/debug`
- `prototype` → `/prototype`
- `topic` → `/groundwork`
- `feature`, `chore` — the status decides:
  - `todo`, `groundwork` → `/groundwork`
  - `planning`, `building`, `review` → `/execute`

**`status: parked`** → route on the `resumes at:` line, which names the status the ticket left. The command that revives it prints underneath.

**`status: done` or `dropped`** → say the ticket is closed, and stop. Reopening is the user's call.

**Open decisions are what send a ticket to `/groundwork`** — never a long body, and never code left to read. A cleanup chore with nothing settled goes there like anything else. A ticket cut from a spec is the one that does not: its body already carries what to build and the decisions behind it, so route it to `/execute`, which opens it at `planning`.

Route, and stop there. Whether this ticket splits, and whether it is worth building at all, are answers a map produces — `/groundwork` owns both.

!`flow overlays start`
