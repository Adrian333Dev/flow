---
name: start
description: 'Opens a session: the board, or one ticket.'
disable-model-invocation: true
---

!`flow next 2>&1 || true`

**A ticket is above**, printed by its own skill in `/flow:start /exp-47` → route it by `## When a ticket is above`. Never recommend from the board printed beside it.

**A refusal, and no ticket** → say why and stop.

**The board says `no tickets yet`** → say so, and point to `/flow:groundwork` for the first piece of work.

**The board is above**: recommend one ticket and say what decides it: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then wait. The user picks.

## When a ticket is above

**Read any `open` block above before opening a file**: it already loaded the files it names.

**A `branch:` line saying `checked out here:` another branch** → tell the user which branch the work is on before routing, and wait.

**Leave the status.** The skill you route to writes it.

Pick the skill, say in one line what decided it, then invoke it here with no argument. The ticket is already above.

- `issue` → `/flow:debug`
- `prototype` → `/flow:prototype`
- `topic` → `/flow:groundwork`
- `feature`, `chore`: read the body, the `map:` line and `## State`. What they leave open decides:
  - decisions still open → `/flow:groundwork`
  - decided, nothing built → `/flow:execute`, which opens it at `planning`
  - code in progress, or waiting on review → `/flow:execute`
  - too little written to tell → the status: `todo`, `groundwork` → `/flow:groundwork`; `planning`, `building`, `review` → `/flow:execute`

**`status: parked`** → route on the `resumes at:` line, which names the status the ticket left. The command that revives it prints underneath.

**`status: done` or `dropped`** → say the ticket is closed, and stop. Reopening is the user's call.

**Neither a long body nor code left to read sends a ticket to `/flow:groundwork`.** Only open decisions do.

**Route, and stop.** Whether the ticket splits, and whether it is worth building, are `/flow:groundwork`'s to answer.
