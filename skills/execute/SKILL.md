---
name: execute
description: ALWAYS invoke when starting work on a ticket, or when the user names a ticket id and says to build it. Takes one ticket from pickup to done, writing its plan at pickup against the code as it stands that day. Not for work nobody has made a ticket for, and never for a parent ticket whose children hold the real work.
---

# Execute

One ticket at a time, start to finish. `flow next` says which are workable; the user picks.

## The loop

1. **Pick up** — read the ticket and the code, decide what this ticket actually is.
2. **Plan** — write `## Plan` into the ticket: what is there now, then numbered steps.
3. **Build** — one step at a time, verified after each.
4. **Finish** — the full suite once more, then hand it on.

```
flow start t047     → thinking     Phase 1, then Phase 2
flow build t047     → building     Phase 3
flow review t047    → review       Phase 4
flow done t047      → done
```

Never work a ticket that has children. Its work is theirs — `flow ls --parent t047` lists them.

## Phase 1 — pick up

**The one real decision in the system, and it happens here.** Never in advance. An unopened ticket is a title and an intent.

`flow start t047` puts it in `thinking`. Then read three things: the ticket body, its `brainstorm/` — `map.md`, and `design.md` if there is one — and the code it touches. Then one of four:

- **Every decision is already made** → Phase 2.
- **Open decisions** → walk them in `brainstorm/map.md`; the folder is already there. Then come back to this list.
- **More than one unit of work** → create children with `--parent t047`. The parent stays `building` and is done when they are.
- **Not worth building** → `flow park t047 "<reason>"`.

**Reading code is not a brainstorm.** A brainstorm resolves open *decisions*. Where there are none, the look-first pass feeds straight into the steps.

## Phase 2 — write the plan

A `## Plan` section inside `ticket.md`. Nothing is ever called `plan.md`. Parent tickets never get one.

**Part 1 — what is there now.** Written before any step: the signatures, the seam the change goes through, what surprised you. **This is the load-bearing half, and the one skipped under pressure.** A plan written without it is a guess about code nobody read.

**Part 2 — numbered steps, each naming the files it touches.**

> **Write the code that was decided; describe the code that follows from it.** A step implementing a locked decision carries the actual code. A step whose shape follows from the surrounding code describes the change and lets the builder read the file.

Each step is finishable and checkable on its own. A wide refactor goes **expand → migrate → contract**, never one sweeping step.

Then `flow build t047`.

## Phase 3 — build

**Delegate mode is the default.** A step carrying exact code goes to a Haiku subagent; a step needing discovery or judgment stays with you. In doubt, keep it — delegation is only cheaper when the step is unambiguous from the plan alone.

Confirm the verification command before the first step: whatever this project uses, stated in the plan or asked for. Never assume a default like `npm test`.

**Run the full check after every step, in both modes.** Never mark a step done without the output that proves it.

### Dispatching a step

```
Agent(
  model="haiku",
  run_in_background=False,
  prompt=(
    "1. Read ~/.claude/skills/execute/haiku-worker.md (your instructions)\n"
    "2. Read <ticket_path> offset=<N> limit=<L>  (your step)\n"
    "3. Execute the step"
  )
)
```

Point at the line range; never paste the step into the prompt. Wait synchronously.

- **`PASS`** — mark the step `[x]` in `ticket.md`, continue.
- **`FAIL`** — it tried a fix and failed. Read the diff and the error: root cause clear → fix inline, otherwise → debug agent.
- **`NEEDS_DEBUG`** — it did not attempt a fix. Obvious from the error → fix inline, otherwise → debug agent.

A step you ran yourself and could not verify gets one inline fix attempt, then the debug agent.

### Dispatching the debug agent

```
Agent(
  model="sonnet",
  run_in_background=True,
  prompt=(
    "Step: <name>\n"
    "Error:\n<full error output>\n\n"
    "Diff of what changed:\n<git diff>\n\n"
    "What was tried: <brief description>\n\n"
    "Debug this failure. Apply a fix if you find the root cause. "
    "Return: root cause + fix applied (or why it can't be fixed) + verification output."
  )
)
```

Tell the user it is running and that they can interact with it. When it returns, verify the fix yourself, then continue.

A dispatched side job needing more than a prompt gets its own file, `<slug>.md` inside the ticket folder, and several can be live at once. `handoff.md` is the single resume file — an assigned job never clobbers it.

### When the plan turns out wrong

Something turns up mid-build that the plan did not account for. Three outcomes, and only one is a new ticket:

- **Rewrite the plan in place** — the discovery changes how *this* ticket gets built.
- **New ticket** — the work is genuinely separable: finishable and checkable without this one.
- **Drop this ticket** — the discovery invalidates it. `flow ticket drop t047 "<reason>" --by <id>` re-points anything that depended on it.

**Wanting a separate session on something is not a reason to create a ticket.** Assign it to a subagent. A ticket earns its id, its status and its deps entry only when the work is genuinely separable.

## Phase 4 — finish

Every step `[x]` → the full verification suite once more → `flow review t047`.

State completion only after a confirmed pass, and say what the output was.

`flow review` satisfies other tickets' `deps`, so it already unblocks work — it prints what became ready.

## Hard rules

- **Never build a ticket with children.**
- **Never write `## Plan` before pickup.**
- **Part 1 before Part 2, always** — the current-state pass is not optional and not a formality.
- **Never mark a step done without verified output.**
- **Never claim completion on unrun verification.**
- **One resume file per ticket.** Every assigned job gets its own name, and any number run at once.
