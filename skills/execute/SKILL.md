---
name: execute
description: ALWAYS invoke when starting work on a `feature` or `chore` ticket, or when the user names a ticket id and says to build it. Takes one ticket from pickup to done, writing its plan at pickup against the code as it stands that day. The other three types belong elsewhere and it says so at pickup — `issue` to `debug`, `research` to `brainstorm`, `prototype` to `prototype`. Not for work nobody has made a ticket for, and never for a parent while its children are open.
---

# Execute

One ticket at a time, start to finish. `flow next` says which are workable; the user picks.

## The loop

1. **Pick up** — read the ticket and the code, decide what this ticket actually is.
2. **Plan** — write `plan.md`, then get it approved.
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

Never build a child's work in its parent. `flow ls --parent t047` lists the children; the parent keeps whatever none of them holds, and `flow start` refuses it until they close.

## The ticket folder

Five files, five owners. Never write into one another skill owns.

- **`ticket.md`** — frontmatter (`flow`), the body and `## Done when` (whoever created it), `## State` (`handoff` owns its shape, whoever works the ticket writes it).
- **`plan.md`** — this skill. What the code looks like now, then the steps.
- **`brainstorm/map.md`** — `brainstorm`. Every decision and its reasoning.
- **`reports/`** — one file per thing answered, named after what it answers. `debug` writes a cause here, a prototype writes what it measured. Appears only where something was answered.
- **`issues.md`** — whoever builds. Written only where the build produced a finding worth keeping, and it outlives the ticket.

## Phase 1 — pick up

**The one real decision in the system, and it happens here.** Never in advance. An unopened ticket is a title and an intent.

`flow start t047` puts it in `thinking`. Read the ticket body, its `## State` where one exists, its `brainstorm/map.md`, and the code it touches.

**A ticket born in conversation has no `## Done when`.** `flow ticket new` writes a title and leaves the template's comment where the check belongs. Write that check here, from whatever the ticket turns out to be, and show it with the plan. A ticket cut from a spec arrived with one.

**Then the type decides which loop runs.** Every type still moves through the same statuses; what changes is what happens between them.

- **`feature`, `chore`** → the rest of this file.
- **`issue`** → **`debug`** owns it end to end. Come back only if the fix turns out to need a plan of its own.
- **`prototype`** → **`prototype`** owns it. The ticket is a question only code can answer — does this library hold sync under load, is this approach fast enough — and it closes on the report rather than on shipped code. There is no build phase to reach.
- **`research`** → **`brainstorm`** owns it. The ticket is a subject nobody has decided yet — a marketing approach, a pricing model, a caching strategy — and it gets its own `brainstorm/map.md`. Where the map's answers turn out to be work, cut children for them; where the answers are the deliverable, the ticket closes on the map. There is no build phase to reach.

**A feature or a chore then takes one of four:**

- **Every decision is already made** → Phase 2.
- **Open decisions** → walk them in `brainstorm/map.md`; the folder is already there. Then come back to this list.
- **More than one unit of work** → propose the split. On a yes, create children with `--parent t047`, keeping in the parent only what no child holds: the wiring, the integration test, the final suite. `flow next` offers it back the moment the last child closes.
- **Not worth building** → propose parking it. On a yes, `flow park t047 "<reason>"`.

The last two rewrite the ticket graph, so the user decides them. The first two are yours.

**Reading code is not a brainstorm.** A brainstorm resolves open *decisions*. Where there are none, the look-first pass feeds straight into the steps.

## Phase 2 — write the plan

**`plan.md`, in the ticket folder.** The plan is the part that grows, and a build session is the only thing that opens it — keeping it out of `ticket.md` is what leaves the ticket readable as a state file.

**Three passes, each ending at a write.** A plan composed whole in context and saved at the end is lost entirely when the context fills first: fifteen minutes of reading, gone, with nothing on disk to resume from. Save as you go and a dead session costs the pass it was in.

**A design already answers what to build.** Where `docs/spec/` or the ticket's `brainstorm/` carries one, the plan sequences it and never re-derives a decision it already made. Where none exists, the plan is where the shape gets decided.

### Pass 1 — what is there now

**Open `docs/context/` before the code**, and read what touches this ticket. It holds what the project already learned about this code — a verified command, a convention it settled on, a path that matters. Opened at review instead, it can only judge code that already exists.

Then read the code this ticket changes, and **write it down before anything else**: the signatures, the seam the change goes through, what surprised you.

**This is the load-bearing half, and the one skipped under pressure.** A plan written without it is a guess about code nobody read. A design does not cover it — a design says what to build, never what the code looks like today. It is also the most expensive pass, which is why it reaches disk first.

**Name the command that proves this ticket done**, here. Whatever this project uses, never a default like `npm test`. Written once, it survives compaction and pastes into every dispatch.

### Pass 2 — the steps

One line each: title, the files it touches, and the check that proves it.

```markdown
## Steps

1. [ ] **Add the config table** — `db/migrations/0031_rate_limit.sql`, `db/schema.ts`
       Check: `pnpm db:migrate && pnpm test:db`
```

Each step is finishable and checkable on its own, and names a scoped check wherever the full suite is slow. A wide refactor goes **expand → migrate → contract**, never one sweeping step.

**Anything else checkable goes indented, underneath the step it belongs to.** The indent is what tells a session picking this up which lines are the plan and which are working notes.

**No detail yet.** Step 5's body written now is a guess about code that steps 1–4 have not produced. Written when the build reaches it, it is written against code that exists.

### Pass 3 — show it and wait

More than one step, or more than one file → the user reads both sections before anything gets built. One step in one file goes straight through.

They are approving the shape — the order, the seam, the step that is missing. That is what plans get wrong, and all of it is visible without a line of detail. Reading it costs a minute; reading the diff it turns into costs an hour.

Then `flow build t047`.

## Phase 3 — build

One step at a time, in order. **Write the step's detail, then build it.**

> **Write the code that was decided; describe the code that follows from it.** A step implementing a locked decision carries the actual code. A step whose shape follows from the surrounding code describes the change and lets the builder read the file.

Detail goes underneath its step, indented to stay inside the list item.

**Run the check the step names, then mark it `[x]`.** Never substitute a default like `npm test`. Never mark a step without the output that proves it. The full suite runs once, in Phase 4.

**Keep `## State` current as you build.** Write to it every time something becomes true that no other file records — a discovery mid-step, a step that landed differently than planned, a decision deferred. Never step status; `plan.md` owns that. Then `handoff` at the end is a check rather than a reconstruction, which is the one moment context cannot pay for one.

**What cost real effort to learn goes to `issues.md` instead** — a version that turned out to matter, a workaround a broken library forced, a lint rule this repo enables that no design mentions. Create it the first time this build produces one, in whatever shape fits, and leave it out of every ticket that produces none. `## State` dies at review because each line describes work in flight; a finding stays true after the ticket closes.

**It takes only what is neither work nor a decision.** A discovery that changes a decision goes to `brainstorm/map.md`, and separable work becomes its own ticket — **When the plan turns out wrong** below routes both.

### Whether to delegate

**Build it yourself by default.** Delegate only where both hold:

- **Every edit is already decided** — nothing left to work out by reading the code.
- **Roughly 5+ files, or 10+ near-identical edits** — a rename at 18 call sites, one signature change everywhere it is called.

The worker then spends its own context on the repetition instead of yours, and there is no judgement to lose. Below that width the dispatch costs more than the typing.

A step needing the code read to decide what to write stays yours at any width. A cold worker re-derives what you already know, and that re-derivation stays invisible until the bill arrives.

**A step may touch several files and still be one step.** Step boundaries come from finishable-and-checkable; the file count only decides who types it.

### Dispatching a step

1. **Paste the step's text into the prompt**, with the check it must pass. Never paste the files it names — reading them here spends exactly the context the dispatch exists to save. Never point at a line range either, because `plan.md` gets rewritten in place mid-build and the range goes stale.
2. **Dispatch one worker, in the foreground, and wait.**

   ```
   Agent(subagent_type="haiku-worker", run_in_background=False, prompt="<the step's text, then its check>")
   ```

3. **Start nothing while it runs.** Whatever you touch lands in its diff.
4. **Read the diff.** It arrives with the report — a hook records the working tree either side of the dispatch and hands you what changed. A patch too large to inline arrives as a file list plus a path; read the patch.
5. **No diff means verify the step yourself before marking it.** Silence is the honest answer for a worker that stopped early, and it is also what a broken hook returns — from here the two look identical. A worker that reports files it edited and still produces no diff is running without the hooks: say so, and read those files yourself.
6. **A file in the diff that no step named is the finding.** Tell the user before continuing.

**A worker reporting success is not evidence.** The diff is.

Then the status decides:

- **`PASS`** — mark the step `[x]` in `plan.md`, continue.
- **`FAILED`** — it tried a fix and failed. Cause clear from the diff and the error → fix inline. Otherwise → `debug`.
- **`NEEDS_DECISION`** — it stopped rather than guess. Obvious and small → decide it and fix inline. Otherwise → back to the user.

A step you ran yourself and could not verify gets one inline fix attempt, then `debug`.

### When a step fails

**`debug` owns the method and the dispatch.** Run its loop, and let it decide whether this hunt earns its own context. Never improvise a debug prompt here.

### Handing a job to a separate session

A job a separate session picks up becomes a **child ticket** — `handoff` writes it, created with `--parent t047`. Several run at once, and `flow done` refuses to close this ticket while any of them is open.

A subagent running inside this session is not that. It is a step of the plan, and it gets the step's text in its prompt.

### When the plan turns out wrong

Something turns up mid-build that the plan did not account for. Three outcomes, and two of them are the user's call:

- **Rewrite the plan in place** — the discovery changes how *this* ticket gets built. Yours, and say what changed.
- **New ticket** — the work is genuinely separable: finishable and checkable without this one. Propose it.
- **Drop this ticket** — the discovery invalidates it. Propose it; on a yes, `flow ticket drop t047 "<reason>" --by <id>` re-points anything that depended on it.

**A subagent inside this session is a step, not a ticket.** A separate session that reports back is a child ticket, because someone has to see its status and nobody watches a file.

## Phase 4 — review and finish

Every step `[x]` → run the full suite Pass 1 named → review what was built → `flow review t047`.

**Verification is fresh or it does not count.** Run the suite in the turn you report it. A pass from three steps ago says nothing about the step you just finished.

Then two passes, kept apart. One can hide the other: code that follows every convention can implement the wrong thing, and code that does exactly what was asked can be a mess.

- **Against the plan** — every step delivered, and nothing delivered that no step asked for.
- **Against the code** — read `review-code.md`. Skip it where the ticket produced no code.

**Move anything durable in `## State` to `issues.md`, then delete the section from `ticket.md`.** Every line left in it describes work in progress, which is false the moment this ticket closes. `plan.md` and `issues.md` both stay — one records what was built, the other what it taught. Git keeps the old state.

`flow review t047` hands it over. It also satisfies other tickets' `deps`, so it already unblocks work — it prints what became ready.

### Taking the feedback

**One unclear item stops all of them.** Six notes with two you do not follow → ask about those two before implementing any of the four. The items are usually related, and a partial reading produces the wrong fix.

Check each note against the code before implementing it. A note that would break something gets said so, once, with the reason.

**Then `flow build t047`, before the first edit.** Left in `review` while its code is being rewritten, the ticket reports itself as waiting on the user, and every ticket depending on it reads as ready — so `flow next` offers work built on a moving target. The rework goes into `plan.md` as new steps, since the old ones are all `[x]` and record none of it.

Then `flow done t047`, once the user says it is done.

## Hard rules

- **Never build a child's work in its parent.** The parent keeps only what no child holds.
- **Route by type before planning.** A bug goes to `debug`, an undecided subject to `brainstorm`.
- **The plan is `plan.md`, never a section of `ticket.md`.**
- **Never write a plan before pickup.**
- **Save each pass as you finish it.** A plan held in context and written at the end dies with the context.
- **Pass 1 before Pass 2, always** — the current-state pass is not optional and not a formality.
- **Show every plan past one step or one file** before `flow build`.
- **Splitting, parking and dropping a ticket are the user's calls.**
- **Never mark a step done without verified output.**
- **Never claim a pass you did not run this turn.**
- **Never trust a worker's own report.** Read what changed.
- **Start nothing while a subagent runs.** Your edits land in its diff.
- **One `## State` per ticket**, rewritten whole, deleted at review. A dispatched job is its own ticket.
