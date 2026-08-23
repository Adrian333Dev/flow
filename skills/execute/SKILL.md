---
name: execute
description: ALWAYS invoke on a `feature` or `chore` ticket whose decisions are settled, and whenever the user names a ticket id and says to build it. Writes the plan, builds it a step at a time, then reviews the work. Not for a ticket with open decisions — that is `/groundwork` — and never for work nobody has made a ticket for, or for a parent while its children are open.
---

# Execute

One ticket at a time, start to finish. `flow next` says which are workable; the user picks.

## The loop

```
groundwork → planning → building → review → done
             Phase 1–2   Phase 3   Phase 4
```

Each move is one command, named after where it lands — `flow plan t047`, `flow build t047`, `flow review t047`, `flow done t047`. **2 gates, both the user's** — the plan before `building`, the work before `done`. Nothing else in the loop stops.

Never build a child's work in its parent. `flow ls --parent t047` lists them; the parent keeps whatever none of them holds, and picking it up or planning it refuses until they close.

## Phase 1 — pick up

**The status says where the work stopped; the artifact says whether that phase finished.** Read the artifact, then move the ticket. Nothing has moved it already — `/start` only read it.

- **`todo`** — the ticket arrived decided, cut from a spec → `flow plan t047`, then Phase 2
- **`planning`** — open `plan.md`. Written and approved → `flow build t047`, then Phase 3. Otherwise finish writing it
- **`building`** — open `plan.md`. Every step `[x]` → Phase 4. Otherwise resume at the first `[ ]`; `flow t047` prints the count
- **`review`** — the work is with the user, and their notes start `### When the user sends review notes`

Then read the ticket body, its `## State` where one exists, and its `groundwork/map.md`.

**A ticket born in conversation has no `## Done when`** — `flow new` leaves the template's comment where the check belongs. Write the check here and show it with the plan. A ticket cut from a spec arrived with one.

## Phase 2 — write the plan

**`plan.md`, in the ticket folder. 2 passes, each ending at a write, then the user's approval.** A plan saved only at the end dies with the context; a dead session should cost one pass.

**A design already answers what to build.** Where `docs/spec/` or the ticket's `groundwork/` carries one, the plan sequences it and never re-derives a decision it already made. Where none exists, the plan decides the shape.

### Pass 1 — read the code

**Start with `## References` in the ticket** — whoever cut it already found what this work must respect. **No section** → look once in `docs/context/` and `docs/research/`, then write what you found into `## References`, so the next session skips the search.

**Read the code this ticket changes, then write down what you found** — the signatures, the seam the change goes through, what surprised you. Plan nothing before this. A design says what to build, never what the code looks like today.

**Name the command that proves this ticket done.** Whatever this project uses, never a default like `npm test`. It pastes into every dispatch.

### Pass 2 — write the steps

One line each: title, the files it touches, and the check that proves it.

```markdown
## Steps

1. [ ] **Add the config table** — `db/migrations/0031_rate_limit.sql`, `db/schema.ts`
       Check: `pnpm db:migrate && pnpm test:db`
```

Each step is finishable and checkable on its own, and names a scoped check wherever the full suite is slow. A wide refactor goes **add the new path, move the callers, delete the old** — never one sweeping step.

**Everything else goes indented, under the step it belongs to** — sub-checks, notes, whatever the build adds. The indent tells a session picking this up which lines are the plan.

**No detail yet.** Step 5's body written now guesses at code steps 1–4 have not produced.

### Then show it and wait

More than one step, or more than one file → the user reads what the code looks like now, then `## Steps`, before anything gets built. They are approving the shape: the order, the seam, the step that is missing. One step in one file goes straight through.

## Phase 3 — build

One step at a time, in order. **Write the step's detail, then build it.**

**Build straight through.** Finish a step, run the check it names, mark it `[x]`, start the next — no report in between. Stop for a failed check, a decision only the user can make, or a dispatch you are waiting on. Nothing else.

**Write the code that was decided; describe the code that follows from it.** A step implementing a locked decision carries the code itself; a step whose shape follows from the surrounding code describes the change and lets the builder read the file.

**Never mark a step without the output that proves it.** The full suite runs once, in Phase 4.

**Keep `## State` current as you build**, so `/handoff` checks a record instead of rebuilding one with no context left to rebuild it from.

What the build turns up, by where it goes:

- **Work in flight** — a step that landed differently, a decision deferred → `## State`.
- **Something that cost real effort to learn** — a version that turned out to matter, a workaround a broken library forced → `issues.md`.
- **A discovery that changes a decision** → `groundwork/map.md`.

### Whether to delegate

**Build it yourself by default.** Delegate only where both hold:

- **Every edit is already decided** — nothing left to work out by reading the code.
- **Roughly 5+ files, or 10+ near-identical edits** — a rename at 18 call sites, one signature change everywhere it is called.

The worker spends its own context on the repetition instead of yours. A step needing the code read to decide what to write stays yours at any width.

**A step may touch several files and still be one step.** Step boundaries come from finishable-and-checkable; the file count only decides who types it.

**A job a separate session picks up is a child ticket instead** — `/handoff` writes it with `--parent t047`. Several run at once, and closing this ticket refuses while any is open. A worker dispatched for a step never needs one.

### Dispatching a step

1. **Paste the step's text into the prompt**, with the check it must pass. Never paste the files it names — reading them here spends the context the dispatch exists to save. Never point at a line range either: `plan.md` gets rewritten in place mid-build and the range goes stale.
2. **Dispatch one worker.**

   ```
   Agent(subagent_type="haiku-worker", prompt="<the step's text, then its check>")
   ```

3. **Stop there and say it is running.** Its result arrives on a later turn. **Edit nothing meanwhile** — a hook hands you the working tree's difference either side of the dispatch, so anything you write in that window cannot be told from the worker's own work.
4. **Read the diff.** It arrives with the report. A patch too large to inline arrives as a file list plus a path; read the patch.
5. **No diff means verify the step yourself before marking it.** A worker that stopped early and a broken hook look identical from here. A worker that names files it edited and still produces no diff is running without the hooks: say so, and read those files.
6. **A file in the diff that no step named is the finding.** Tell the user before continuing.

**A worker reporting success is not evidence. The diff is.**

Then the status decides:

- **`PASS`** — mark the step `[x]` in `plan.md`, continue.
- **`FAILED`** — it tried a fix and failed. **When a step fails** below decides what happens next.
- **`NEEDS_DECISION`** — it stopped rather than guess. Obvious and small → decide it and fix inline. Otherwise → back to the user.

### When a step fails

Whether you ran it or a worker did.

**Fix it here while the cause is in front of you**, and keep going as long as every attempt stays mechanical — a version pin, a config key, a wrong path, a missing import. Never count attempts: 3 obvious fixes cost less than one hunt.

**Stop after one attempt where the code runs and the answer is wrong.** Nothing about that failure is mechanical, and the second guess costs what the first did.

**Then `/debug`.** It hunts here, and it owns what happens when the hunt runs out.

### When the plan turns out wrong

Something turns up mid-build that the plan did not account for. 4 outcomes, and 3 of them are the user's call:

- **Rewrite the plan in place** — the discovery changes how _this_ ticket gets built. Yours, and say what changed.
- **New ticket** — the work is genuinely separable: finishable and checkable without this one. Propose it.
- **Back to `groundwork`** — what you built changed what this ticket should be. **When the built thing is wrong**, in Phase 4.
- **Drop this ticket** — the discovery invalidates it. Propose it; on a yes, `flow drop t047 --reason "<why>" --by <id>` re-points anything that depended on it.

## Phase 4 — review and finish

Every step `[x]` → run the full suite Pass 1 named → review it → `flow review t047`.

**Verification is fresh or it does not count.** Run the suite in the turn you report it; a pass from 3 steps ago says nothing about the step you just finished.

Then 2 passes over the same diff, read once. Asked together, one hides the other — code that follows every convention can still build the wrong thing.

- **Against the plan** — every step delivered, and nothing delivered that no step asked for.
- **Against the code** — read `refs/review-code.md`. Skip it where the ticket produced no code.

**Move anything durable in `## State` to `issues.md`, then delete the section from `ticket.md`.** Git keeps the old state.

`review` satisfies other tickets' `deps`, so the move already unblocks work — read what it prints.

### When the user sends review notes

Read the whole list before touching anything. **Anything you do not understand stops the whole list.** Ask about those items first, then start. Notes relate to each other — one is often "and move that into the helper from the note above" — so implementing half the list your own way makes the other half wrong.

Check each note against the code. A note that would break something gets said so, once, with the reason.

**Then `flow build t047`, before the first edit.** Left in `review` while its code is being rewritten, the ticket reports itself as waiting on the user, and every ticket depending on it reads as ready — so `flow next` offers work built on a moving target. The rework goes into `plan.md` as new steps; the old ones are all `[x]` and record none of it.

Then `flow done t047`, once the user says it is done.

### When the built thing is wrong

They tested it and it is not what they wanted — not a list of corrections, a different answer. Nothing here is a fault and none of it earns a study case: the decisions were sound against what anyone knew before there was something to look at.

**The 2 paths split on what came back.** A list of changes to what was built → `building`, above. A changed understanding of what this ticket should be → `groundwork`, here, on the same ticket. A new one strands the map, the `## References` and the history.

1. **Write what building it taught into `issues.md`**, before anything moves. The reopened map runs on it, and left in the conversation it is gone by the next session.
2. **Ask what happens to the code** — kept as reference, or reverted. Print the git command; the user runs it. A rejected implementation left in the tree is what the next build starts from.
3. **`flow groundwork t047`**, then `/groundwork`. Read what it prints: leaving `review` stops satisfying other tickets' `deps`, so work that was ready stops being ready.
4. **`plan.md` is replaced, never extended.** Every step is `[x]` and all of them describe the old shape. Phase 1 writes the new one against the code as it stands that day.

## The ticket folder

5 files, 5 owners. Never write a file another skill owns.

- **`ticket.md`** — frontmatter (`flow`), the body, `## References` and `## Done when` (whoever created it), `## State` (`/handoff` owns its shape, whoever works the ticket writes it). `## State` holds work in flight and dies at review; `## References` stays.
- **`plan.md`** — this skill. What the code looks like now, then the steps, then whatever the build adds under them.
- **`groundwork/map.md`** — `/groundwork`. Every decision and its reasoning.
- **`issues.md`** — whoever builds. What the build taught, and it stays true after the ticket closes. Created the first time there is something; absent from every ticket that produces none.
- **`reports/`** — whichever skill answered something. Absent where nothing was answered.
