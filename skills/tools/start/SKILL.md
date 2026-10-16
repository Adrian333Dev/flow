---
name: start
description: 'Opens a session: the board, or one ticket.'
disable-model-invocation: true
---

!`flow next 2>&1 || true`

**A ticket is above**, printed by its own skill in `/flow:start /exp-47` → route it by `## When a ticket is above`. Never recommend from the board printed beside it.

**A refusal, and no ticket** → say why and stop.

**The board says `no tickets yet`** → say so, and point to `/flow:groundwork` for the first piece of work.

**The board is above**: recommend one ticket and say what decides it: work already in flight beats work cut out of it, and both beat anything new. Then wait. The user picks.

## When a ticket is above

**Read the ticket's `## State` above before opening a file**: it says where the work stopped and what is still open.

**A `branch:` line saying `checked out here:` another branch** → tell the user which branch the work is on before routing, and wait.

Pick the skill, say in one line what decided it, then invoke it here with no argument. The ticket is already above.

Take the first line that matches:

- **An open `## Questions` line** (the `questions:` line short of its total) → `/flow:groundwork`
- **An open `## Tasks` line** (the `tasks:` line short of its total) → `/flow:execute`
- **A `bug` label, or a failure with no known cause** → `/flow:debug`
- **Neither list written** → read the body: a decision still to make → `/flow:groundwork`; the change already clear → `/flow:execute`

**`status: done` or `dropped`** → say the ticket is closed, and stop. Reopening is the user's call.

**Route, and stop.** Whether the ticket splits, and whether it is worth building, are `/flow:groundwork`'s to answer.
