---
name: handoff
description: 'Writes what a session that was not here needs: the state itself, never a reading list.'
---

# Handoff

Write what a session that was not here needs to carry on.

It knows the repo. It knows nothing about this conversation.

**One test decides every line: would that session get this wrong without it?** Never whether it mattered here.

**First, run the sweep in `## Capture`.**

## 1. Pick where it goes

Decide this first.

- **Working a ticket** → `## State` inside that ticket's `ticket.md`.
- **Work with no ticket** → a new ticket, `flow new "…" --type <what the work is> --body -`, then move it to the status the work has reached: `flow build <id>` for code in progress, `flow groundwork <id>` while decisions are still open. The body: one paragraph on the job and why, then `## State`.
- **Handing a job to a session that reports back** → a new ticket, `flow new "…" --body -`. A child of the ticket that dispatched it, where one exists.
- **A subagent starting right now** → the prompt, never a file.

**Inside a ticket the state is a living section.** Write to it as the work moves, every time something becomes true that no other file records: after every thing you learned or were told, never after every edit. **A sentence from the user counts**: a constraint, a correction, a leaning they have not locked.

**A child ticket's body and a subagent's prompt are written once**, read once, and never updated in place.

## 2. Gather only what this job needs

Nothing here runs by default. Pick what the next session will trip over.

- **Mid-build** → name the files this session changed, and what changed in each. `git status --short` gets you that in a repo committed regularly; on a tree nobody has committed for weeks it returns everything and separates nothing.
- **Other tickets in flight** → `flow next`, for what else is moving.
- **Handing a job over** → whatever waits for the receiving session: a server already listening, a half-finished install, a folder that is read-only.
- **Groundwork, or a prototype question** → nothing.

## 3. Write it

**The destination decides the sections.** Drop any section nothing fills.

### The `open` block

Every ticket's own skill, `/exp-47`, runs `flow get --files`, which finds this block and loads every file it names **before the session's first turn**.

Write it fenced, inside `## State`:

```open
plan.md
src/parser.js:40-120   # where step 4 stopped
```

- **One path per line**, with a `#` note saying what the reader gets from it.
- **Take a line range where you know one**: `path:40-120`, inclusive.
- **Write the path that reads naturally.** A ticket's paths resolve beside the ticket first, then from the repo root, so `plan.md` and `src/parser.js` both land.
- **Name what the first action opens, and nothing else.** No minimum: a ticket that carries its own context writes no block.
- **Nothing is truncated**: a folder loads whole.
- **Verify every path.**

A subagent gets no block.

### In a ticket: `## State`

Never restate what 4 other files carry:

- **`plan.md`** holds the steps and which ones landed.
- **`groundwork/map.md`** holds every decision and its reasoning.
- **The ticket body** holds why the work exists; `## Done when` holds what finishes it.
- **The research report** holds the findings, wherever `/flow:research` filed it.

What is left is what nobody wrote down, under 4 labels:

- **Now**: what is half-done, broken, half-applied, or in flight this second.
- **Found**: what cost real effort to learn and lives in no file: the version that turned out to matter, the exact payload, the trap already hit.
- **Open**: decisions half-made, threads nobody closed, the option you were leaning toward and why.
- **Touched**: files this session changed that no step in `plan.md` names.

**`Now` and `Touched` are rewritten whole every time.**

**`Found` and `Open` are added to, never regenerated.** A line goes in the moment you learn it, and comes out when it stops being true: a decision closes, or a fact moves to `docs/context/`.

**Most of the time 2 fill.** A build fills *Now* and *Found*. Groundwork fills *Now* and *Open*. **A bug fills all 4 and runs long.**

A fat state section on a build ticket means the plan carries too little.

### Handing a job over: a child ticket's body

The body carries all of it:

- **The job**: what's being done and why, current tense.
- **The state**: done, in flight, broken, half-applied.
- **What is already set up**: the install that ran, the server still listening, the read-only folder, the command that works from one directory only.
- **What binds it**: decisions locked, corrections given, approaches ruled out and why. Weight what was said out loud and written nowhere. Dead ends count as conclusions.
- **What is still open**: threads nobody resolved, the options weighed, the one you were leaning toward and why.
- **What was found**: versions, endpoints, exact payloads, traps already hit. Write out anything that cost real effort, source or no source.
- **The first action**: concrete enough to start on. Name the skill when one applies.

Plus 4 where someone waits on an answer:

- **What turns on the answer**: the decision waiting on it, and what changes if it comes back no.
- **What done looks like**: written before the work starts, as the ticket's `## Done when`.
- **What to produce**: the artifact and its shape: the questions it answers, in order.
- **What to say back**: the 2 or 3 sentences this session needs to carry on.

**A bug with no failing check built yet** → its `## Done when` is the observable: the failure as seen, and what not seeing it would look like.

**A subagent starting now gets the same content in its prompt.**

### How much to write

**Write out what the next session must know. A path is for a file it must open.**

Never name 2 kinds of file:

- **A file whose content you already wrote out here.**
- **A file the session must not act on.** Where a path exists only to stop the reader doing something, write that sentence and drop the path.

## 4. Land it

**`## State` goes at the bottom of `ticket.md`**, plus a line in `## References` for anything this session read that the build will need. While `map.md` is still open its own `## References` holds those, and Phase 4 splits them into the tickets it cuts.

Then `flow handoff <id>`, which adds this session to the ticket's `history.md`.

Everything else has an owner: `flow` the frontmatter, `/flow:execute` `plan.md`, `/flow:debug` and `/flow:prototype` `reports/`, and whoever created the ticket the body paragraph. `## Done when` moves only when a skill re-decides what the ticket is.

**At `review`, empty `Found` before deleting the section.** Anything in it still true goes to the ticket's `issues.md`, where `/flow:file-findings` files it later. Then delete the section.

## 5. End on what to type

End the reply with what the user types to carry on: `/clear`, then the line that picks the work up where it stopped.

```text
/clear
/flow:debug /exp-4
```

- **A ticket mid-phase** → that phase's skill, then the ticket's: `/flow:groundwork /exp-47`, `/flow:execute /exp-47`, `/flow:debug /exp-4`, `/flow:prototype /exp-9`.
- **A ticket with no phase running** → `/flow:start /exp-47`, which picks the phase from its type and status.
- **A job handed to another session** → the same line, typed in a new session. This one carries on.

Add words after the line only for an instruction the ticket does not hold.

## Booting from one

**Whatever the block named is already loaded.** Start on the first action; open something else only when the work reaches it.

**Anything listed in prose rather than in the block, read in one parallel batch.** The decisions in the document are settled.

**Where `## State` and the files on disk disagree about what exists, the files win.** **On decisions and what is still open, `## State` wins over the rest of the ticket.**

A dispatched job ends by saying its answers back in its final message, and by writing them into the file its own skill names: `reports/<failure>.md` for a hunt, the research file `/flow:research` names for a question. `## State` carries the job's progress, never its answer.

## Hard rules

- **Write what is true now.** Never replay the session. A decision made out loud and written nowhere is state.
- **Never write into a section another skill owns.**
- **Never restate what an existing file already holds.**
- **Never run a command this job does not need.**
- **Write at a clean point.** Finish the task, land the edit, run the verification, then write. No room left for that → describe the half-state honestly.
- **Verify every path before writing it down.**
