---
name: execute
description: ALWAYS invoke on a `feature` or `chore` ticket whose decisions are settled, and whenever the user names a ticket id and says to build it. Writes the plan, builds it a step at a time, then reviews the work. Not for a ticket with open decisions — that is `/groundwork` — and never for work nobody has made a ticket for, or for a parent while its children are open.
---

# Execute

One ticket at a time, start to finish. `flow next` says which are workable; the user picks.

## The loop

1. **Pick up** — read the ticket and what it already decided.
2. **Plan** — write `plan.md`, then get it approved.
3. **Build** — one step at a time, verified after each.
4. **Review** — check the work against the plan, then hand it back.

```
flow tickets start t047                  → groundwork   /start routes here
flow tickets edit t047 --status planning → planning     Phase 1, then Phase 2
                                   the user approves the plan
flow tickets edit t047 --status building → building     Phase 3
flow tickets edit t047 --status review   → review       Phase 4
                                   the user approves the work
flow tickets edit t047 --status done     → done
```

Two gates, and both belong to the user. Nothing else in the loop stops.

Never build a child's work in its parent. `flow tickets ls --parent t047` lists the children; the parent keeps whatever none of them holds, and starting or planning it both refuse until they close.

## Phase 1 — pick up

**Invoked on a `feature` or `chore` whose decisions are settled.** Open decisions go to `/groundwork` first, and `/start` routes that.

Read the ticket body, its `## State` where one exists, and its `groundwork/map.md`.

**A ticket born in conversation has no `## Done when`.** `flow tickets new` writes a title and leaves the template's comment where the check belongs. Write that check here, from whatever the ticket turns out to be, and show it with the plan. A ticket cut from a spec arrived with one.

## Phase 2 — write the plan

**`plan.md`, in the ticket folder. Two passes, each ending at a write, then the user's approval.** A plan composed whole in context and saved at the end dies with the context — fifteen minutes of reading gone, nothing to resume from. Save as you go and a dead session costs one pass.

**A design already answers what to build.** Where `docs/spec/` or the ticket's `groundwork/` carries one, the plan sequences it and never re-derives a decision it already made. Where none exists, the plan is where the shape gets decided.

### Pass 1 — read the code

**Start with `## References` in the ticket.** Whoever cut it already found what this work has to respect — a convention, the research that answered its API questions, cached docs for a library, a skill it needs. **No section, which is normal on a ticket born in conversation** → look once, in `docs/context/` and `docs/research/`, then write what you found back into `## References`, so the next session does not repeat the search.

**Read the code this ticket changes, then write down what you found** — the signatures, the seam the change goes through, what surprised you. Plan nothing before this.

**Name the command that proves this ticket done.** Whatever this project uses, never a default like `npm test`. Written once, it survives compaction and pastes into every dispatch.

This is the pass skipped under pressure, and a design does not cover it — a design says what to build, never what the code looks like today.

### Pass 2 — write the steps

One line each: title, the files it touches, and the check that proves it.

```markdown
## Steps

1. [ ] **Add the config table** — `db/migrations/0031_rate_limit.sql`, `db/schema.ts`
       Check: `pnpm db:migrate && pnpm test:db`
```

Each step is finishable and checkable on its own, and names a scoped check wherever the full suite is slow. A wide refactor goes **add the new path, move the callers, delete the old** — never one sweeping step.

**Everything else goes indented, under the step it belongs to** — sub-checks, notes, whatever the build adds. The indent tells a session picking this up which lines are the plan.

**No detail yet.** Step 5's body written now is a guess about code that steps 1–4 have not produced. Written when the build reaches it, it is written against code that exists.

### Then show it and wait

More than one step, or more than one file → the user reads the whole plan, what the code looks like now and then `## Steps`, before anything gets built. One step in one file goes straight through.

They are approving the shape — the order, the seam, the step that is missing. That is what plans get wrong, and all of it is visible without a line of detail. Reading it costs a minute; reading the diff it turns into costs an hour.

Then `flow tickets edit t047 --status building`.

## Phase 3 — build

One step at a time, in order. **Write the step's detail, then build it.**

**Build straight through.** Finish a step, run the check it names, mark it `[x]`, start the next — no report in between. Stop for a failed check, a decision only the user can make, or a dispatch you are waiting on. Nothing else.

**Write the code that was decided; describe the code that follows from it.** A step implementing a locked decision carries the actual code. A step whose shape follows from the surrounding code describes the change and lets the builder read the file.

Detail goes underneath its step, indented to stay inside the list item.

**Never mark a step without the output that proves it.** The full suite runs once, in Phase 4.

**Keep `## State` current as you build.** Then `/handoff` at the end checks a record instead of rebuilding one, at exactly the moment there is no context left to rebuild it with.

What the build turns up, by where it goes:

- **Work in flight** — a step that landed differently, a decision deferred → `## State`.
- **Something that cost real effort to learn** — a version that turned out to matter, a workaround a broken library forced, a lint rule this repo enables that no design mentions → `issues.md`.
- **A discovery that changes a decision** → `groundwork/map.md`.
- **Work that is genuinely separable** → its own ticket. **When the plan turns out wrong** below.

### Whether to delegate

**Build it yourself by default.** Delegate only where both hold:

- **Every edit is already decided** — nothing left to work out by reading the code.
- **Roughly 5+ files, or 10+ near-identical edits** — a rename at 18 call sites, one signature change everywhere it is called.

The worker spends its own context on the repetition instead of yours. Below that width the dispatch costs more than the typing, and a step needing the code read to decide what to write stays yours at any width.

**A step may touch several files and still be one step.** Step boundaries come from finishable-and-checkable; the file count only decides who types it.

### Dispatching a step

1. **Paste the step's text into the prompt**, with the check it must pass. Never paste the files it names — reading them here spends exactly the context the dispatch exists to save. Never point at a line range either, because `plan.md` gets rewritten in place mid-build and the range goes stale.
2. **Dispatch one worker.**

   ```
   Agent(subagent_type="haiku-worker", prompt="<the step's text, then its check>")
   ```

3. **Stop there and say it is running.** A worker runs in the background whatever you ask for, and its result arrives on a later turn. **Edit nothing meanwhile** — a hook hands you the working tree's difference either side of the dispatch, so anything you write in that window cannot be told from the worker's own work.
4. **Read the diff.** It arrives with the report. A patch too large to inline arrives as a file list plus a path; read the patch.
5. **No diff means verify the step yourself before marking it.** Silence is the honest answer for a worker that stopped early and also what a broken hook returns, and from here the two look identical. A worker that names files it edited and still produces no diff is running without the hooks: say so, and read those files.
6. **A file in the diff that no step named is the finding.** Tell the user before continuing.

**A worker reporting success is not evidence.** The diff is.

Then the status decides:

- **`PASS`** — mark the step `[x]` in `plan.md`, continue.
- **`FAILED`** — it tried a fix and failed. **When a step fails** below decides what happens next.
- **`NEEDS_DECISION`** — it stopped rather than guess. Obvious and small → decide it and fix inline. Otherwise → back to the user.

### When a step fails

Whether you ran it or a worker did.

**Fix it here while the cause is in front of you**, and keep going as long as every attempt stays mechanical — a version pin, a config key, a wrong path, a missing import. Counting attempts is the wrong gate: three obvious fixes cost less than one hunt.

**Stop after one attempt where the code runs and the answer is wrong.** Nothing about that failure is mechanical, and the second guess costs what the first did.

**Then `/debug`.** It hunts here, and it owns what happens when the hunt runs out.

### Handing a job to a separate session

A job a separate session picks up becomes a **child ticket** — `/handoff` writes it with `--parent t047`. Several run at once, and closing this ticket refuses while any is open. Someone has to see its status, and nobody watches a file.

**A worker dispatched for a step never needs one.** It gets the step's text and reports back here.

### When the plan turns out wrong

Something turns up mid-build that the plan did not account for. Four outcomes, and three of them are the user's call:

- **Rewrite the plan in place** — the discovery changes how *this* ticket gets built. Yours, and say what changed.
- **New ticket** — the work is genuinely separable: finishable and checkable without this one. Propose it.
- **Back to `groundwork`** — what you built changed what this ticket should be. The steps are under **When the built thing is wrong**, in Phase 4.
- **Drop this ticket** — the discovery invalidates it. Propose it; on a yes, `flow tickets drop t047 --reason "<why>" --by <id>` re-points anything that depended on it.

## Phase 4 — review and finish

Every step `[x]` → run the full suite Pass 1 named → review what was built → `flow tickets edit t047 --status review`.

**Verification is fresh or it does not count.** Run the suite in the turn you report it — a pass from three steps ago says nothing about the step you just finished.

Then two passes over the same diff, read once. Asked together, one question hides the other: code that follows every convention can implement the wrong thing, and code that does exactly what was asked can be a mess.

- **Against the plan** — every step delivered, and nothing delivered that no step asked for.
- **Against the code** — read `refs/review-code.md`. Skip it where the ticket produced no code.

**Move anything durable in `## State` to `issues.md`, then delete the section from `ticket.md`.** Git keeps the old state.

`flow tickets edit t047 --status review` hands it over. It also satisfies other tickets' `deps`, so it already unblocks work — it prints what became ready.

### When the user sends review notes

They read the diff and sent back a list. Read the whole list before touching anything.

**Anything you do not understand stops the whole list.** Ask about those items first, then start. Notes relate to each other — one is often "and move that into the helper from the note above" — so implementing half the list your own way makes the other half wrong.

Check each note against the code. A note that would break something gets said so, once, with the reason.

**Then `flow tickets edit t047 --status building`, before the first edit.** Left in `review` while its code is being rewritten, the ticket reports itself as waiting on the user, and every ticket depending on it reads as ready — so `flow next` offers work built on a moving target. The rework goes into `plan.md` as new steps, since the old ones are all `[x]` and record none of it.

Then `flow tickets edit t047 --status done`, once the user says it is done.

### When the built thing is wrong

They tested it and it is not what they wanted — not a list of corrections, a different answer. The decisions were sound against what anyone knew before there was something to look at, and building it produced the rest. Nothing here is a fault, and none of it earns a study case.

**The two paths split on what came back.** A list of changes to what was built → `building`, above. A changed understanding of what this ticket should be → `groundwork`, here.

Same ticket. Its subject has not changed, and a new one strands the map, the `## References` and the history.

1. **Write what building it taught into `issues.md`**, before anything moves. The reopened map runs on it, and left in the conversation it is gone by the next session.
2. **Ask what happens to the code** — kept as reference, or reverted. Print the git command; the user runs it. A rejected implementation left in the tree is what the next build starts from.
3. **`flow tickets edit t047 --status groundwork`**, then `/groundwork`. Read what it prints: leaving `review` stops satisfying other tickets' `deps`, so work that was ready stops being ready.
4. **`plan.md` is replaced, never extended.** Every step is `[x]` and all of them describe the old shape. Phase 1 writes the new one against the code as it stands that day.

## The ticket folder

Five files, five owners. Never write a file another skill owns.

- **`ticket.md`** — frontmatter (`flow`), the body, `## References` and `## Done when` (whoever created it), `## State` (`/handoff` owns its shape, whoever works the ticket writes it). `## State` is work in flight only, which is why review deletes it; `## References` stays.
- **`plan.md`** — this skill. What the code looks like now, then the steps, then whatever the build adds under them.
- **`groundwork/map.md`** — `/groundwork`. Every decision and its reasoning.
- **`issues.md`** — whoever builds. What the build taught, and it stays true after the ticket closes. Created the first time there is something; absent from every ticket that produces none.
- **`reports/`** — whichever skill answered something. Absent where nothing was answered.
