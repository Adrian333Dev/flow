---
name: execute
description: Builds one ticket, plan through review.
---

# Execute

One ticket at a time, start to finish. `flow next` says which are workable; the user picks.

## The loop

```
groundwork → planning → building → review → done
             Phase 1–2   Phase 3   Phase 4
```

Each move is one command, named after where it lands: `flow plan exp-47`, `flow build exp-47`, `flow review exp-47`, `flow done exp-47`. **2 gates, both the user's**: the plan before `building`, the work before `done`. Nothing else in the loop stops.

Never build a child's work in its parent. `flow ls --parent exp-47` lists them; the parent keeps whatever none of them holds.

## Phase 1: pick up

**No ticket, and the user described the work** → `flow new "<what to build>" --body -`, the body saying what and why, then pick it up below.

**No ticket, and nothing described** → run `flow next` and recommend one ticket: work in flight beats work cut out of it, and both beat anything new, whatever its priority. Then wait. The user picks.

**Read the artifact before moving the ticket.** The status says where the work stopped, never whether that phase finished.

- **`todo`, `groundwork`**: `flow plan exp-47`, then Phase 2
- **`planning`**: open `plan.md`. Written and approved → `flow build exp-47`, then Phase 3. Otherwise finish writing it
- **`building`**: open `plan.md`. Every step `[x]` → Phase 4. Otherwise resume at the first `[ ]`; `flow exp-47` prints the count
- **`review`**: the work is with the user, and their notes start `### When the user sends review notes`

Then read the ticket body and its `## State` where one exists.

**A `map:` count short of its total** → say which questions are open, and wait: the user decides whether the plan waits for `/flow:groundwork`. No `map:` line is normal.

**No `## Done when`** → write one here and show it with the plan.

## Phase 2: write the plan

**`plan.md`, in the ticket folder. 2 passes, each ending at a write, then the user's approval.**

**A design already answers what to build.** Where `docs/spec/` or the ticket's `groundwork/` carries one, the plan sequences it and never re-derives a decision it made. Where none exists, the plan decides the shape.

### Pass 1: read the code

**Start with `## References` in the ticket.** **No section** → look once in `docs/context/`, `docs/research/`, and `~/.flow/wiki/<tool>/` for each tool the work touches, then write what you found into `## References`.

**Add a line the moment you read something the build will need**, in any pass.

**Read the code this ticket changes, then write down what you found**: the signatures, the seam the change goes through, what surprised you. Plan nothing before this.

**Name the command that proves this ticket done.** Whatever this project uses, never a default like `npm test`. It pastes into every dispatch.

### Pass 2: write the steps

One line each: title, the files it touches, and the check that proves it.

```markdown
## Steps

1. [ ] **Add the config table**: `db/migrations/0031_rate_limit.sql`, `db/schema.ts`
       Check: `pnpm db:migrate && pnpm test:db`
```

Each step is finishable and checkable on its own, and names a scoped check wherever the full suite is slow. A wide refactor goes **add the new path, move the callers, delete the old**, never one sweeping step.

**Everything else goes indented, under the step it belongs to**: sub-checks, notes, whatever the build adds.

**No detail yet**: each step's detail is written when it is built.

### Then show it and wait

More than one step, or more than one file → the user reads what the code looks like now, then `## Steps`, before anything gets built. One step in one file goes straight through.

## Phase 3: build

One step at a time, in order. **Write the step's detail, then build it.**

**Build straight through.** Finish a step, run the check it names, mark it `[x]`, start the next: no report in between. Stop for a failed check, a decision only the user can make, or a dispatch you are waiting on. Nothing else.

**Write the code that was decided; describe the code that follows from it.** A step implementing a locked decision carries the code itself; a step whose shape follows from the surrounding code describes the change and lets the builder read the file.

**Never mark a step without the output that proves it.** The full suite runs once, in Phase 4.

**Keep `## State` current as you build.**

What the build turns up, by where it goes:

- **Work in flight**: a step that landed differently, a decision deferred → `## State`.
- **Something that cost real effort to learn**: a version that turned out to matter, a workaround a broken library forced → `issues.md`.
- **A discovery that changes a decision** → `groundwork/map.md`.

### Whether to delegate

**Build it yourself by default.** Delegate only where both hold:

- **Every edit is already decided**: nothing left to work out by reading the code.
- **Roughly 5+ files, or 10+ near-identical edits**: a rename at 18 call sites, one signature change everywhere it is called.

A step needing the code read to decide what to write stays yours at any width.

**A step may touch several files and still be one step.**

**A job a separate session picks up is a child ticket instead**: `/flow:handoff` writes it with `--parent exp-47`. Several can be open at once, with one session editing the working folder at a time. A worker dispatched for a step never needs one.

### Dispatching a step

1. **Paste the step's text into the prompt**, with the check it must pass. Never paste the files it names, and never a line range.
2. **Dispatch the worker.**

   ```
   Agent(subagent_type="haiku-worker", prompt="<the step's text, then its check>")
   ```

3. **Say it is running.** Its report arrives on a later turn, and the change record with its finished notice.
4. **Read the change record.** A diff too long to show arrives as line counts plus the path of the whole patch: read the patch.
5. **No record means verify the step yourself before marking it.** A worker that names files it edited and brings no record is running without the hooks: say so, and read those files.
6. **A file in the record that no step named is the finding.** Tell the user before continuing. A file marked as changed by no tool call a hook saw may not be the worker's: check it before blaming the worker.

Then the status decides:

- **`PASS`**: mark the step `[x]` in `plan.md`, continue.
- **`FAILED`** → `### When a step fails`.
- **`NEEDS_DECISION`**: obvious and small → decide it and fix inline. Otherwise → back to the user.

### When a step fails

Whether you ran it or a worker did.

**Fix it here while the cause is in front of you**, and keep going as long as every attempt stays mechanical: a version pin, a config key, a wrong path, a missing import. Never count attempts.

**A run of mechanical fixes leaving the same failure standing means the assumption is wrong.** Stop fixing. The run is the signal, never the count.

**Say the assumption to the user before hunting it.** Name what you believed was true, what you changed on the strength of it, and what failed anyway.

**Stop after one attempt where the code runs and the answer is wrong.**

**Then `/flow:debug`**, in this session. It owns what happens when the hunt runs out.

### When the plan turns out wrong

Something turns up mid-build that the plan did not account for. 4 outcomes, and 3 of them are the user's call:

- **Rewrite the plan in place**: the discovery changes how _this_ ticket gets built. Yours, and say what changed.
- **New ticket**: the work is genuinely separable: finishable and checkable without this one. Propose it.
- **Back to `groundwork`**: what you built changed what this ticket should be. **When the built thing is wrong**, in Phase 4.
- **Drop this ticket**: the discovery invalidates it. Propose it; on a yes, `flow drop exp-47 --reason "<why>" --by <id>` re-points anything that depended on it.

## Phase 4: review and finish

Every step `[x]` → run the full suite Pass 1 named → review it → `flow review exp-47`.

**Run the suite in the turn you report it.**

Then 2 separate passes over the same diff, read once:

- **Against the plan**: every step delivered, and nothing delivered that no step asked for.
- **Against the code**: read `references/review-code.md`. A ticket that produced a document reads `style.md` instead, with `write-docs.md` beside it for a documentation page, `write-rules.md` for a rule file, and `cut-loaded-files.md` for any file an agent loads. A ticket that produced a decision reads none of them.

**Move anything durable in `## State` to `issues.md`, then delete the section from `ticket.md`.**

Read what `flow review` prints: `review` already unblocks the tickets depending on this one.

### When the user sends review notes

Read the whole list before touching anything. **Anything you do not understand stops the whole list.** Ask about those items first, then start.

Check each note against the code. A note that would break something gets said so, once, with the reason.

**Then `flow build exp-47`, before the first edit.** The rework goes into `plan.md` as new steps.

Then `flow done exp-47`, once the user says it is done.

**Then offer `/flow:file-findings`.** Never invoke it unasked.

### When the built thing is wrong

The user tested it and wants a different answer. None of it is a fault, and none of it earns a study case.

**The 2 paths split on what came back.** A list of changes to what was built → `building`, above. A changed understanding of what this ticket should be → `groundwork`, here, on the same ticket, never a new one.

1. **Write what building it taught into `issues.md`**, before anything moves.
2. **Ask what happens to the code**: kept as reference, or reverted. Print the git command; the user runs it.
3. **`flow groundwork exp-47`**, then `/flow:groundwork`. Read what it prints: tickets depending on this one stop being ready.
4. **`plan.md` is replaced at the next pickup, never extended.**

## The ticket folder

8 entries, each with one owner. Never write a file another skill owns.

- **`ticket.md`**: frontmatter (`flow`), the body, `## References` and `## Done when` (whoever created it), `## State` (`/flow:handoff` owns its shape, whoever works the ticket writes it). `## State` holds work in flight and dies at review; `## References` stays.
- **`plan.md`**: this skill. What the code looks like now, then the steps, then whatever the build adds under them.
- **`groundwork/map.md`**: `/flow:groundwork`. Every decision and its reasoning.
- **`issues.md`**: whoever builds. What the build taught that stays true after the ticket closes. Created on first need.
- **`reports/`**: whichever skill answered something.
- **`protos/`**: `/flow:prototype`. One folder per prototype, the code beside its report.
- **`history.md`**: `flow`. One line per status move and handoff. Never edited by hand.
- **`intake/`**: the user. Material dropped in for this job, read and never rewritten.
