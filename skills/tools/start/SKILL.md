---
name: start
description: 'Opens a session: the board, one ticket, or a loose file.'
argument-hint: '[ticket-id] | [path]'
disable-model-invocation: true
---

!`flow get $ARGUMENTS --files 2>&1 || true`

**A refusal, or nothing** → say why and stop. The id matched no ticket, the path matched no file, or a status move hit a guard.

**Nothing named, and the board says `no tickets yet`** → say so, and point to `/flow:groundwork` for the first piece of work.

**Nothing named**: the board is above. Recommend one ticket and say what decides it: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then wait. The user picks.

**A file is above and no ticket**: loose work. Carry on from whatever that file says comes next.

## When a ticket is above

**An `open` block already loaded the files it names**, so the phase's artifact may be on screen. Read what is there before opening anything.

**A `branch:` line saying `checked out here:` another branch** → tell the user which branch the work is on before routing, and wait. Building here would put the work on the wrong branch.

**A line reading `planning → building` means the user named that move and `flow` made it.** Take the ticket at the status it now holds, and never move it again.

**No such line means nothing has moved.** The skill you route to writes the status, after it opens the phase's own artifact.

Pick the skill, say in one line what decided it, then invoke it with no argument: the skill loads here, in this session, and the ticket is already above.

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

**Open decisions are what send a ticket to `/flow:groundwork`**, never a long body, and never code left to read. A cleanup chore with nothing settled goes there like anything else.

Route, and stop there. Whether this ticket splits, and whether it is worth building at all, are answers a map produces: `/flow:groundwork` owns both.
