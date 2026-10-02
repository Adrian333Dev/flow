# Who moves the status

A ticket's status is one line in its header, `status: building`, and it is the only thing the next session reads to know where the work stopped. [Tickets](../tickets.md) lists the 8 statuses. This page says who writes the line and when.

## Table of contents

- [Every move is one command](#every-move-is-one-command)
- [The skill moves it, at the moment the phase moves](#the-skill-moves-it-at-the-moment-the-phase-moves)
- [You can move it yourself](#you-can-move-it-yourself)
- [Two moves wait for your yes](#two-moves-wait-for-your-yes)
- [The files outrank the status](#the-files-outrank-the-status)

## Every move is one command

The status is never edited by hand. Each move is a `flow` command named for where the ticket lands, and the command prints the move it made:

```sh
$ flow review exp-8
exp-8  building → review   Rename the auth folder
```

The line of statuses runs `todo → groundwork → planning → building → review → done`, and every ticket walks a part of it in that order. Off the line: `flow park` with a reason, and `flow drop`. A move that a guard refuses, such as building a ticket whose dependency is still open, exits with a message naming the flag that overrides it. [Reference](../reference.md) lists the verbs and the guards.

## The skill moves it, at the moment the phase moves

The agent runs the verb as part of the phase, never at the end of a session:

- **`/flow:groundwork`** runs `flow groundwork exp-1` when it opens, whatever status the ticket held, and never moves it further. A finished map ends by pointing to `/flow:execute`, which makes the next move. On a topic, where the map was the deliverable, it runs `flow done exp-5` once you say it is done. It closes a prototype it handed to a subagent, `flow done exp-6`, once you accept the answer.
- **`/flow:execute`** runs `flow plan exp-2` when it picks up a ticket at `todo` or `groundwork`. A map with questions still open is reported to you, and the plan waits for your call. Then `flow build exp-2` once you approve the steps, `flow review exp-2` once every step is checked and the suite passes, and `flow done exp-2` once you say it is done.
- **`/flow:debug`** and **`/flow:prototype`** run `flow build` on arrival. An issue and a prototype have no phase before building. A fixed bug goes to `flow review exp-4` once its failing check passes, and `flow done exp-4` once you confirm the fix. A bug found but not fixed, or not found, stays at `building`, and you decide whether the hunt carries on. Run from inside `/flow:execute`, `/flow:debug` moves nothing.
- **A skill opened with no ticket** creates one first, with `flow new`, before its first move.

The agent reads the ticket first and moves it second. A ticket already at the right status gets no command.

## You can move it yourself

The same verbs work from your keyboard, and the agent reads the result the same way. Two places to type one:

- **Shell mode, inside the session.** A line starting with `!` runs as a shell command and its output lands in the conversation: `! flow build exp-2`. The agent sees the move on its next turn.
- **A second terminal.** `flow build exp-2` there writes the same line. The agent sees it the next time it reads the ticket, which every phase skill does on arrival.

Both write the same `status:` line, so it never matters who moved it. The next skill reads only that line.

## Two moves wait for your yes

`flow build` waits for your approval of the plan, and `flow done` waits for your approval of the work. Nothing else in the loop stops for you.

## The files outrank the status

The status is a claim somebody wrote. The ticket folder is the evidence: a `plan.md` with unchecked steps, a `map.md` with open questions. Where the two disagree, the skill picking the ticket up trusts the files, says which one disagreed, and writes the correcting command. `flow exp-2` shows both at once: the status line, and `plan: plan.md 2/4 steps` counted from the file.
