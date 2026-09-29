# Stopping and picking up

A session ends, or its context fills, and the work has to carry on in a new one. The new session knows the repo and nothing about the conversation that just ended. Three steps carry the work across: `/flow:handoff` writes what the next session needs into the ticket, `/clear` empties the context, and the phase skill with the id picks up from the ticket.

## Table of contents

- [What `/flow:handoff` writes](#what-handoff-writes)
- [The 3 steps](#the-3-steps)
- [Groundwork closed, moving to execute](#groundwork-closed-moving-to-execute)
- [Context filled mid-phase](#context-filled-mid-phase)
- [Work with no ticket gets one](#work-with-no-ticket-gets-one)
- [`/flow:handoff` against `/compact`](#handoff-against-compact)

## What `/flow:handoff` writes

`/flow:handoff` writes a `## State` section at the bottom of the ticket file. One test decides every line in it: would the next session get this wrong without it? A ticket mid-build, after the handoff:

````md
## State

Now: steps 1 and 2 pass. Step 3 is not started: `setBudget` accepts any category, and the user wants a typo like `fod` refused.

Found: `readAll` in `src/store.js` is the only place that knows every category, so step 3 reads the records through it rather than keeping a category list.

```open
plan.md
src/budgets.js:14-24   # setBudget, where step 3 goes
```
````

Three parts. `Now` is where the work stands. `Found` is what this session learned that no other file records. The `open` block lists the files the next session must have in front of it, with a line range where one part matters, and the next session loads them before its first turn. A decision made out loud and written nowhere is state, and this section is the only thing that carries it.

`Now` is rewritten whole each time, since it describes this second. `Found` is only added to, and a line leaves it when it stops being true, so something learned 3 sessions ago survives. 2 more labels appear when the work needs them: `Open` for decisions half made, kept like `Found`, and `Touched` for files changed outside the plan, rewritten like `Now`. At `review` the section is deleted: anything in `Found` still true moves to a durable file first.

## The 3 steps

1. `/flow:handoff`. The agent writes `## State` and shows it.
2. `/clear`. The context empties. The ticket file holds everything.
3. `/flow:execute t002`, or `/flow:start t002` to let the type and status pick the skill. Either loads the ticket, its `## State` and every file in the `open` block, in one step, before the skill's first word.

Where `## State` and the files on disk disagree about what exists, the files win. A new session can be started without `/flow:handoff`, and then `## State` describes an older point than the code. On decisions and what is still open, `## State` wins over the rest of the ticket, since it is the newer record.

## Groundwork closed, moving to execute

`/flow:groundwork` ends by cutting tickets for what the map decided and running `flow plan t001` on the one going to `/flow:execute`. The map is the handoff: every decision and its reasoning already sit in `groundwork/map.md`, so `/flow:handoff` here adds a `## State` only where something outside the map is true, such as a file the plan must start from.

Then `/clear` and `/flow:execute t001`. The skill finds the ticket at `planning`, reads the map, and starts writing `plan.md` from it. It never re-derives a decision the map already made.

## Context filled mid-phase

The same 3 steps, at a clean point: the current step finished, its check run, the edit landed. A handoff written mid-edit describes a state that no longer exists once the edit lands.

`/flow:execute t002` then reads the status and lands on it. At `building` it opens `plan.md` and resumes at the first unchecked step. `## State` says how far that step got. `/flow:debug t004` reads `## State` for the hypotheses already killed and resumes at the first one still standing, never restarting the loop.

## Work with no ticket gets one

A conversation can start with no ticket: a design question, a quick fix that grew. In a project, `/flow:handoff` then creates a ticket for it with `flow new`. The ticket's body says what the job is and why, and its `## State` carries the rest. The new ticket is moved in flight, so a bare `/flow:start` after `/clear` shows it on the board and recommends it. Loose groundwork, a `.flow/groundwork/<slug>/` folder with no ticket, moves into the new ticket as its `groundwork/`.

Only a folder with no `.flow/` gets a `handoff.md` file instead, picked up with `/flow:start <path>`.

## `/flow:handoff` against `/compact`

`/compact` is Claude Code's own command. It summarizes the whole conversation and keeps the session going. `/flow:handoff` writes only what the next session would get wrong without, into a file that outlives the session. Use `/compact` to keep working in the same session. Use `/flow:handoff` then `/clear` when the session is ending, or when the summary would carry more than the work needs.
