---
name: execute
description: ALWAYS invoke when starting work on a ticket, or when the user names a ticket id and says to build it. Takes one ticket from pickup to done, writing its plan at pickup against the code as it stands that day. Not for work nobody has made a ticket for, and never for a parent ticket whose children hold the real work.
---

# Execute

One ticket at a time, start to finish. `flow next` says which are workable; the user picks.

## The loop

1. **Pick up** — read the ticket and the code, decide what this ticket actually is.
2. **Plan** — write `## Plan` into the ticket, then get it approved.
3. **Build** — one step at a time, verified after each.
4. **Review** — check the work against the plan, then hand it back.

```
flow start t047     → thinking     Phase 1, then Phase 2
                                   the user approves the plan
flow build t047     → building     Phase 3
flow review t047    → review       Phase 4
                                   the user approves the work
flow done t047      → done
```

Two gates, and both belong to the user. Nothing else in the loop stops.

Never work a ticket that has children. Its work is theirs — `flow ls --parent t047` lists them.

## Phase 1 — pick up

**The one real decision in the system, and it happens here.** Never in advance. An unopened ticket is a title and an intent.

`flow start t047` puts it in `thinking`. Then read three things: the ticket body, its `brainstorm/` — `map.md`, and the design if there is one — and the code it touches. Then one of four:

- **Every decision is already made** → Phase 2.
- **Open decisions** → walk them in `brainstorm/map.md`; the folder is already there. Then come back to this list.
- **More than one unit of work** → propose the split. On a yes, create children with `--parent t047`. The parent stays `building` and is done when they are.
- **Not worth building** → propose parking it. On a yes, `flow park t047 "<reason>"`.

The last two rewrite the ticket graph, so the user decides them. The first two are yours.

**Reading code is not a brainstorm.** A brainstorm resolves open *decisions*. Where there are none, the look-first pass feeds straight into the steps.

## Phase 2 — write the plan

A `## Plan` section inside `ticket.md`. Nothing is ever called `plan.md`. Parent tickets never get one.

**A design already answers what to build.** Where `docs/spec/` or the ticket's `brainstorm/` carries one, the plan sequences it and never re-derives a decision it already made. Where none exists, the plan is where the shape gets decided.

**Part 1 — what is there now.** Written before any step: the signatures, the seam the change goes through, what surprised you. **This is the load-bearing half, and the one skipped under pressure.** A plan written without it is a guess about code nobody read. A design does not cover it — a design says what to build, never what the code looks like today.

**Name the command that proves this ticket done**, here in Part 1. Whatever this project uses, never a default like `npm test`. Written once, it survives compaction and pastes into every dispatch.

**Part 2 — numbered steps, each naming the files it touches.**

> **Write the code that was decided; describe the code that follows from it.** A step implementing a locked decision carries the actual code. A step whose shape follows from the surrounding code describes the change and lets the builder read the file.

Each step is finishable and checkable on its own, and names the check that proves it — a scoped one wherever the full suite is slow. A wide refactor goes **expand → migrate → contract**, never one sweeping step.

**Then show the plan and wait.** More than one step, or more than one file → the user reads it before anything gets built. One step in one file goes straight through. Reading 30 lines of plan costs a minute; reading the diff it turns into costs an hour.

Then `flow build t047`.

## Phase 3 — build

**Run the check the step names, then mark it done.** Never substitute a default like `npm test`. Never mark a step `[x]` without the output that proves it. The full suite runs once, in Phase 4.

**Context running low mid-build → `handoff`.** A long build is where it runs out, and a ticket's `## Plan` is a plan, not a resume file.

### Whether to delegate

**Build it yourself by default.** Delegate only where both hold:

- **Every edit is already decided** — nothing left to work out by reading the code.
- **Roughly 5+ files, or 10+ near-identical edits** — a rename at 18 call sites, one signature change everywhere it is called.

The worker then spends its own context on the repetition instead of yours, and there is no judgement to lose. Below that width the dispatch costs more than the typing.

A step needing the code read to decide what to write stays yours at any width. A cold worker re-derives what you already know, and that re-derivation stays invisible until the bill arrives.

**A step may touch several files and still be one step.** Step boundaries come from finishable-and-checkable; the file count only decides who types it.

### Dispatching a step

1. **Paste the step's text into the prompt**, with the check it must pass. Never paste the files it names — reading them here spends exactly the context the dispatch exists to save. Never point at a line range either, because the plan gets rewritten in place mid-build and the range goes stale.
2. **Dispatch one worker, in the foreground, and wait.**

   ```
   Agent(subagent_type="haiku-worker", run_in_background=False, prompt="<the step's text, then its check>")
   ```

3. **Start nothing while it runs.** Whatever you touch lands in its diff.
4. **Read the diff.** It arrives with the report — a hook records the working tree either side of the dispatch and hands you what changed. A patch too large to inline arrives as a file list plus a path; read the patch.
5. **No diff means nothing changed**, the honest answer for a worker that stopped early. A worker that reports files it edited and still produces no diff is running without the hooks — say so, and read those files yourself.
6. **A file in the diff that no step named is the finding.** Tell the user before continuing.

**A worker reporting success is not evidence.** The diff is.

Then the status decides:

- **`PASS`** — mark the step `[x]` in `ticket.md`, continue.
- **`FAILED`** — it tried a fix and failed. Cause clear from the diff and the error → fix inline. Otherwise → `debug`.
- **`NEEDS_DECISION`** — it stopped rather than guess. Obvious and small → decide it and fix inline. Otherwise → back to the user.

A step you ran yourself and could not verify gets one inline fix attempt, then `debug`.

### When a step fails

**`debug` owns the method and the dispatch.** Run its loop, and let it decide whether this hunt earns its own context. Never improvise a debug prompt here.

### Files for a dispatched job

A side job that a separate session picks up gets its own file, `<slug>.md` inside the ticket folder, and several can be live at once. `handoff.md` is the single resume file — an assigned job never clobbers it.

### When the plan turns out wrong

Something turns up mid-build that the plan did not account for. Three outcomes, and two of them are the user's call:

- **Rewrite the plan in place** — the discovery changes how *this* ticket gets built. Yours, and say what changed.
- **New ticket** — the work is genuinely separable: finishable and checkable without this one. Propose it.
- **Drop this ticket** — the discovery invalidates it. Propose it; on a yes, `flow ticket drop t047 "<reason>" --by <id>` re-points anything that depended on it.

**Wanting a separate session on something is not a reason to create a ticket.** Assign it to a subagent. A ticket earns its id, its status and its deps entry only when the work is genuinely separable.

## Phase 4 — review and finish

Every step `[x]` → run the full suite Part 1 named → review what was built → `flow review t047`.

**Verification is fresh or it does not count.** Run the suite in the turn you report it. A pass from three steps ago says nothing about the step you just finished.

Then two passes, kept apart. One can hide the other: code that follows every convention can implement the wrong thing, and code that does exactly what was asked can be a mess.

- **Against the plan** — every step delivered, and nothing delivered that no step asked for.
- **Against the code** — read `review-code.md`. Skip it where the ticket produced no code.

`flow review t047` hands it over. It also satisfies other tickets' `deps`, so it already unblocks work — it prints what became ready.

### Taking the feedback

**One unclear item stops all of them.** Six notes with two you do not follow → ask about those two before implementing any of the four. The items are usually related, and a partial reading produces the wrong fix.

Check each note against the code before implementing it. A note that would break something gets said so, once, with the reason.

Then `flow done t047`, once the user says it is done.

## Hard rules

- **Never build a ticket with children.**
- **Never write `## Plan` before pickup.**
- **Part 1 before Part 2, always** — the current-state pass is not optional and not a formality.
- **Show every plan past one step or one file** before `flow build`.
- **Splitting, parking and dropping a ticket are the user's calls.**
- **Never mark a step done without verified output.**
- **Never claim a pass you did not run this turn.**
- **Never trust a worker's own report.** Read what changed.
- **Start nothing while a subagent runs.** Your edits land in its diff.
- **One resume file per ticket.** Every assigned job gets its own name, and any number run at once.
