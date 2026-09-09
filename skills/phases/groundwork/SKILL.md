---
name: groundwork
description: Refines the idea and designs the solution. Every open decision, including ones nobody raised, walked to a written answer.
---

# Groundwork

Find every decision this work needs. Answer each one, write the answer down, and put it in the file that owns it. No plan, no code.

## The loop

1. **Map**: list every open decision, including ones nobody raised.
2. **Walk**: settle them one at a time, writing each answer as it locks.
3. **Attack**: run the result through real cases before it stands. Phase 3 says at which closes.
4. **Route**: send each decision to the file that owns it.

Same 4 phases at any size. A long message fills more of the map in advance, never less of it.

## Arriving

Anything starts a run: one line, 10 paragraphs, a folder of research reports, a design someone already drafted. Phase 1 takes all of it the same way.

**No ticket** → nothing has a status, so no `flow` command runs before Phase 4. Start at Phase 1.

**On a ticket, open `map.md` before anything else.** It is what the work produced, so it decides which phase this is. The status is a claim somebody wrote, and it can be wrong.

- **No map, or a map holding no questions** → Phase 1
- **Any question still `[ ]`** → Phase 2, from the first one
- **Every question `[x]`** → Phase 4 routes what the map decided

**Then write the status the map just proved**, in one command, saying what the map holds wherever it disagreed with the status: `flow groundwork <id>` while the map is live, `flow plan <id>` at the end of Phase 4 to hand the ticket to `/execute`, `flow done <id>` on a `topic`, where the map was the deliverable. Already matching → no command, and a line like `todo → groundwork` above means `/start` ran it.

**A map that reads both ways stops the run.** Questions ticked with nothing written under them, a section abandoned mid-sentence, a map about another subject: say what you found and ask.

## Phase 1: build the map

### 1. Pick the folder

- Belongs to a ticket → that ticket's `groundwork/`, created with the ticket.
- Inside a project, belongs to nothing yet → `.flow/groundwork/<slug>/`.
- No project here → `~/.flow/groundwork/<slug>/`, the global store. Never create a project to have somewhere to write, and never leave the folder where you happen to be standing.

**A global run stays global.** Nothing it decides reaches `docs/`, because there is no product here to hold a spec: Phase 4's `docs/` routes land under `~/.flow/` instead, and the rest lands in the ticket. Commands take the root: `FLOW_PROJECT=$HOME flow new "…"` writes to `~/.flow/tickets/`, on its own id sequence.

**Work that turns out to belong to a project moves there, once.** The folder goes to that project's `.flow/groundwork/<slug>/` and leaves nothing behind. Same move when the directory you are standing in becomes a project mid-run.

Never pick the folder from a guess at how the work ends.

Folder already there for this subject → continue it. Never start a second map on one subject.

### 2. Extract

Read what is already here in the area this touches: code, documents, whatever there is. Follow how it is built, or say why not.

**Nothing written before this session is settled, including anything labelled settled.** A file saying "decided" records what somebody thought on the day they wrote it, with whatever they knew then. It puts a branch on the map. It never gives you the answer, and it is never your recommendation in Phase 2. What it is reliable about is which questions exist, and what was already tried.

**Input arriving as files somebody already worked on** → read `references/read-intake.md` first. Brainstorms run with an agent, research reports, design drafts: real work, and none of it settled.

Then list 4 things:

- what the user settled here, in this session
- what is constrained
- what **contradicts** something else
- what a build would need and nobody supplied

**Contradictions sit between files as often as inside a message.** Two versions of one document, a design rejected in a note somewhere else, a scope that changed halfway through. Name them. Never pick a side quietly. Dictated input contradicts itself almost every time.

Sharpen vague input: what was tried already, and what forced this now.

### 3. Widen

**Generate options nobody raised.** A map built only from what the user said writes down their thinking instead of mapping the decision. Runs every session, detailed input included: 10 paragraphs is one person's view stated at length.

1. **Name the parts.** Break the subject into pieces that vary on their own. Software: data model, control flow, failure handling, deployment. A pipeline: stages, tools, who owns each, what each costs.
2. **Hit every part with all 9 nudges.** Mechanical on purpose. Going through all 9 finds what nobody thought of. Where a nudge exposes a real decision, that becomes a branch.
   - **none**: the part doesn't exist at all
   - **more** · **less**: 10 times as much; a tenth, or exactly 1
   - **reverse**: flip the direction, or the order
   - **other-than**: something else entirely in this role
   - **as-well-as**: both options instead of a choice between them
   - **part-of**: one thing, or several wearing one name?
   - **earlier** · **later**: sooner in time; deferred until something forces it
3. **Check the 6 standing subjects.** Skipped most often, cost most when skipped. Each either produces a branch or gets ruled out loud.
   - **who it is for**, specifically
   - **how you know it worked**: the observable outcome
   - **what it costs**: money, time, attention
   - **what rules bind it**: law, policy, privacy, platform terms
   - **what happens when it fails**
   - **what you refuse to do**, and why
4. **Imagine it failed.** It shipped and went badly. Name the 3 most likely causes. Each cause is an open decision.
5. **Check prior art.** What do existing solutions do that nobody here raised? A landscape you don't already know → **invoke `/research`**, never guess at it.
6. **Challenge the premise.** Is the stated approach right at all? A better path goes on the table _before_ a map gets built around the stated one.
7. **Cut for relevance.** Drop anything with no plausible win for this goal. Never pad to a number: options the user reads and rejects cost more than they're worth.

**Name the new options in prose**: "you haven't mentioned X". Never a label. Seeing what they'd have missed is most of the value.

### 4. Propose

State 3 things and confirm all 3 before walking: **3–N top-level branches**, **the order you'll walk them**, **where the answers will land**.

Branches that constrain other branches go first: say which constrains which.

**On a big subject the run can end here.** Settling scope, order and what gets dropped is a full session's work, and the branches that are subjects in their own right leave as child maps. Say that is what happened, and stop.

**Then stop.** The first branch question goes in the _next_ message.

## Phase 2: walk the map

One branch at a time. Interview until the decision is genuinely clear. A first answer is not clarity.

1. **Pose the branch.**
2. **Recommend.** Commit to a position: "I'd go with X because Y." A neutral list of options is not an answer.
3. **Wait for the reaction.** Vague or partial → probe before closing.
4. **Write the decision** once it's locked: user-confirmed, no open threads, not mid-discussion agreement. Mark it `[x]`.

Batching 2–3 locked decisions into 1 write is fine. Never gate a write behind a yes/no question, never end a session with a settled branch unwritten.

Sub-branches surface mid-conversation. Add them as `[ ]` children immediately, and walk them after the parent closes.

**Never expose the bookkeeping.** No index numbers, no checkboxes, no "branch 2.1". Plain prose: situation, options, recommendation.

**Never add an out-of-scope item to the map.** A future idea, an unrelated decision, a bug noticed in passing → `## Capture`.

### When a branch is its own subject

It leaves and gets its own map and session: `flow new "…" --type topic --parent <id>`.

**The body carries what the child cannot get by opening this map**: the branch written as a question, and every decision here that binds it. Never copy the reasoning, and never copy a whole section. The parent's map is one path away, and a second copy of a decision drifts from the first.

**Split on whether it can be settled alone, never on how big it is.** A branch that needs answers from its siblings is not independent. Size is not a reason: one `map.md` is walked across as many sessions as it takes.

A feature rarely spawns one. A whole product usually spawns several, because its parts are genuinely separate subjects.

**A decision that binds more than one child belongs to the parent.** Write it as an open branch in the parent's `map.md`, naming which child raised it. The branch here stays `[ ]` and says what it waits on. Where nothing else here can move, say it waits on the parent and stop. Never answer it locally: 2 children answering the same question answer it differently.

### When the user isn't the one who can answer

**Find the fact yourself.** Say what you'll find, find it, come back with it, then propose. The branch stays `[ ]` until the finding lands, and only branches downstream of it wait. Never stall the whole round on a lookup.

- **What already exists here** → read it. Never burn a branch on what it already says.
- **Something documented elsewhere** → **invoke `/research`**, levels 1–2.
- **Past what the documentation says** → **invoke `/research`**, level 3: get the source and read it. **This is the case that sinks plans**, committing to a tool's internals unread produces a design that dies 4 steps into the build.
- **Nothing written can answer it** → run something. A cheap check (one command, a 10-second script) runs here. Anything needing an install, a server, a download, or more than a couple of turns → **cut a ticket typed `prototype`** carrying the question and its pass and fail. Make it a child of this work where there is one: `flow new "<question>" --type prototype --parent <id>`. **Never build it here.** A fresh session does that, and this groundwork resumes from the finding in the ticket's `reports/`. When nothing else on the map can move, say it waits on that ticket and stop.

**A landscape too big to read here goes to a subagent**, never a ticket: reading asks no questions back, so nothing needs to watch it. `/research` owns the brief. The branch stays `[ ]` until the report lands in `docs/research/`, and the walk carries on meanwhile. A whole product is where this fires.

**Never send the user's own material to a subagent.** A summary drops the detail Phase 1 needs, and their files are where the contradictions hide.

### When the branch is genuinely hard

Match depth to the branch. An obvious one gets the answer. A stuck one (a constraint that won't resolve, a structure that is wrong with no evident replacement) gets all 4 of these **before** the first adequate answer becomes the answer:

- **Reformulate.** State the problem 3 ways. One must weaken a constraint currently treated as fixed: which constraint here is assumed rather than real?
- **Name the contradiction.** "We want X without losing Y." Then satisfy both by separating them: in time, in space, by component, or by condition.
- **Find the same problem in a far-off field.** Name 3 unrelated fields where a problem with the same shape is already solved, and map the parts across. Do all 3 even when the first comes hard.
- **Build 3 structurally different families before judging any.** They differ in mechanism, not in detail. No evaluation until all 3 exist.

Then recommend one, say what would overturn it, and where a check is cheap, **run it**. A proposal that can be shown wrong in one cycle beats a better-sounding one that can't.

### When talking can't answer it

Layout, density, how something feels, and equally a system whose shape is itself the question. Rephrasing these grows the scope to fill the uncertainty. "I don't know" twice on one branch is the signal.

**Invoke `/visualize` and draw it. Never describe it.** Draw inline, in the message, unless the drawing is going into a document being written. ASCII frame first until the structure is agreed; colour only when colour is the open branch.

Same whenever a proposal, an architecture or a mechanism goes in front of the user for the first time. A shape stated in sentences was not communicated.

### When new input arrives mid-walk

The whole ask rarely arrives at once. For each new chunk, before answering it:

1. **Check it against settled branches.** If it invalidates a locked decision, say so and reopen it. Never quietly write around it.
2. **Run widen on it.** New material gets the same treatment as the first input, not just filing.
3. **Reorder** if the dependency order changed.

Confirms what is already there → absorb it silently. Changes the shape → say so.

### When the branch is about structure

- Propose parts with one clear purpose, connected by defined handoffs. For each: what it does, how it's used, what it depends on.
- A part that needs a huge file, or one person doing 6 unrelated jobs, is one part doing too much.
- Build the smallest thing that works. 3 similar lines beat a premature abstraction.
- What you found while exploring shapes the proposal without binding it. If the right design replaces what exists, that's in scope.

## Phase 3: attack it before it stands

`## Judgment` carries the method. Extra here:

- Also walk **exactly 1**, **2 at once**, **out of order**, and the cheap patch that changes least.
- **Report findings only, no fixes.** Nothing found is a result: list the cases you ran so coverage can be checked.

Run at 3 moments, not at every close:

1. The user asks it of a specific proposal.
2. Your own proposal looks shaky.
3. The groundwork produced something expensive to get wrong: a structure, a data model, a commitment to a tool or a supplier.

**Name the bets.** The assumptions the answers rest on. Nobody has checked them, and if one is wrong the approach changes.

> We're betting that X. If that's not true, we'd need to rethink Y.

2–4, under `## Assumptions` in `map.md`. Nothing genuinely uncertain → skip.

**Name the non-goals.** What this deliberately does not cover, and why.

## Phase 4: route what was decided

Confirm every branch is resolved or deliberately deferred, then send each decision to the file that owns it. **Every route is conditional**: most runs use 1 or 2, several at once is normal.

- **Work committed to here** → a ticket per unit of work, `flow new "…"`, each carrying what the map decided and a `## References` section. **Copy the lines that ticket needs, never the whole list**: `/execute` reads every one of them, and a ticket pointed at everything is pointed at nothing. **Record order that matters as `deps`**; the order you walked the branches in carries none. **Create and fill in one command**: `--body -` takes the body on stdin. Never create, then edit.
- **A branch that is its own subject** → `flow new "…" --type topic --parent <id>`, one per subject. Phase 2 carries the split rule and what the body holds.
- **Work already written into `docs/spec/product.md`** → **invoke `/cut-from-spec`**. That skill cuts the next batch out of a spec written months ago and read cold. Tickets for what this map just decided are the line above.
- **Anything settled that outlives the build**: what it must do, how it's built, why a call was made, what was refused, what the whole thing bets on → **read `references/write-spec.md`**. It picks the file. A new direction reached in _any_ run goes there, including a ticket-sized one.
- **A durable fact about this project** → `docs/context/<subject>.md`.
- **Settled and dying with the build**, this build's non-goals included → already written in `map.md`. Leave it there.
- **Decided, but not now** → `## Deferred` in the map, with the reason.
- **Nothing** → a legitimate outcome, and deliberate. Say so out loud and say why, in `map.md`. Groundwork that resolves to "not worth doing" did its job.
- **Not worth building, on a ticket** → propose dropping it. On a yes, `flow drop <id> --reason "<why>" --by <id>` re-points whatever depended on it. **Park it only where it is worth building later**: a parked ticket satisfies nothing, so its dependents wait for the revival.

**Then move the folder, once, and only here:**

- Exactly 1 unit of work → `flow new "…" --from-groundwork <path>`. The tool moves the folder in as that ticket's `groundwork/` and leaves nothing behind. Never move it by hand.
- Several units, each useful alone → **it stays**, and becomes the design record the tickets link back to.
- Several units, useless shipped apart → one parent ticket with children, created with the same flag so the folder lands on the parent. **The parent keeps only what no child holds**: the wiring, the integration test, the final suite.

**Then say what happens next.** `flow next` lists what is workable, and **`/execute`** takes one ticket from there. A ticket's plan is written at pickup, inside `/execute`, against the code as it stands that day.

## Asking questions

Applies in Phases 1 and 2 both.

- **Every question carries your guess.** Reacting to a wrong guess is faster than composing an answer from nothing.
- **Rounds in Phase 1, one at a time in Phase 2.** Gap-filling questions are independent: ask them together, ordered so none depends on an answer not yet heard. A decision that constrains other decisions gets its own turn.
- **"I don't know" is a real answer.** Twice on one branch means talking can't settle it: draw it instead.
- **Buzzword answers get one probe.** "Scalable", "clean", "modern", "best practice" → _if you didn't have to justify this to anyone, what would you actually want?_
- **Stop test.** Can you predict the reaction to the next 3 questions you'd ask? No → keep going. Several rounds with your confidence flat → say so and reframe, because the questions are wrong.
- **Agreement is not an answer.** 3 rounds of "yes, agreed" means the session went passive. Say so out loud.

## The files

- **`map.md`**: every branch and every decision, one file, updated in place. Never split it.
- **`<index>-<name>.md`**: one file per branch that **actually grew** past what fits in `map.md`. Most branches never earn one.

**Everything else routes out.** Working material stays in this folder. Finished documents go where they belong, one live copy each, a one-line pointer everywhere else.

**`map.md` is the decision log for this build.**

### `map.md` format

Markdown checklist. Zero-based indices, children extending the parent, nested as deep as the subject needs.

**Every leaf is a question.** A question walks to an answer and gets ticked. A topic never can, so a map of topics never closes.

**A big subject groups its questions under group headings, written in Title Case.** Case separates the two on sight: `Distribution` is a group, `which platform do we publish to first?` is a question. A group always has children, and closes when they close. A small subject skips grouping and lists questions flat.

```markdown
- [ ] 0: Distribution
  - [x] 0.0: which platform do we publish to first?
  - [ ] 0.1: do we cut vertical versions for shorts?
    - [ ] 0.1.0: who owns the re-cut, us or the editor?
- [ ] 1: Production
  - [ ] 1.0: do we script every episode, or run to a beat sheet?
  - [ ] 1.1: what is the smallest kit we buy before episode one?
- [ ] 2: how many episodes ship before we judge the format?
```

Below the list, one section per resolved branch, carrying the decision, the reasoning, the alternatives rejected and why, the constraints. **Write it for a reader who was never here.** A summary of the conversation fails that reader. A section that outgrows the file moves to `<index>-<name>.md` and leaves a one-line pointer.

### `## References`, at the bottom of `map.md`

**Add a line the moment you read something the build will need**: a convention file, a research report, a prototype's finding, cached docs for a library, a skill that covers it. Left until the end of the run, half of them are forgotten.

One line each: the path, then what it says, in a few words. A bare path makes the reader open the file to find out whether it matters.

```markdown
## References

- `docs/context/contracts.md`: DTOs live in `packages/contracts`, never duplicated in the app
- `docs/research/ai-elements-streaming.md`: how `<Conversation>` handles a streaming response
- `tmp/references/ai-elements/llms.txt`: cached docs, fetched 2026-08-12
- `/visualize`: invoke before proposing the panel's layout
```

Nothing read this run → no section. Phase 4 splits the list across the tickets it cuts.

## Hard rules

- **Every map carries branches nobody raised.** None of them → widen didn't run. Go back.
- **Never print the map to the user.** It's a file.
- **Never start building before the map closes.** "Just do it" mid-map → check whether the design is actually clear; if it is, close the map first, then act.

!`flow overlays groundwork`
