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

Same 4 phases at any size, however much the first message already settles.

## Arriving

**No ticket** → the ticket `flow ls` shows open on this subject, since one subject never gets a second map. None → `flow new "<subject>" --type topic`. The map is the ticket's `groundwork/map.md`.

**Outside a project**, the ticket lives in `~/.flow/tickets/`, and Phase 4's `docs/` routes land under `~/.flow/`. Never create a project to have somewhere to write. **Work that turns out to belong to a project** → `flow move <id> <project folder>`, once. Same move when the current folder becomes a project mid-run.

**On a ticket, open `map.md` first.** The map decides the phase, never the status.

- **No map, or a map holding no questions** → Phase 1
- **Any question still `[ ]`** → Phase 2, from the first one
- **Every question `[x]`** → Phase 4 routes what the map decided

**Then `flow groundwork <id>`**, unless the ticket is already there. Never move it further.

**A map that reads both ways stops the run.** Questions ticked with nothing written under them, a section abandoned mid-sentence, a map about another subject: say what you found and ask.

## Phase 1: build the map

### 1. Extract

Read what already exists in the area this touches: code, documents. Follow how it is built, or say why not.

**Nothing written before this session is settled, a file saying "decided" included.** It puts a branch on the map, never the answer, and never your Phase 2 recommendation. Trust it for which questions exist and what was already tried.

**Input arriving as files somebody already worked on** (a brainstorm run with an agent, a research report, a design draft) → read `references/read-intake.md` first.

Then list 4 things:

- what the user settled here, in this session
- what is constrained
- what **contradicts** something else
- what a build would need and nobody supplied

**Look for contradictions between files as well as inside a message**: 2 versions of one document, a design rejected in a note elsewhere, a scope that changed halfway. Dictated input contradicts itself almost every time. Name each one. Never pick a side quietly.

Sharpen vague input: what was tried already, and what forced this now.

### 2. Widen

**Generate options nobody raised**, every session, detailed input included: 10 paragraphs is still one person's view.

1. **Name the parts.** Break the subject into pieces that vary on their own. Software: data model, control flow, failure handling, deployment. A pipeline: stages, tools, who owns each, what each costs.
2. **Hit every part with all 9 nudges**, mechanically. A nudge that exposes a real decision becomes a branch.
   - **none**: the part doesn't exist at all
   - **more** · **less**: 10 times as much; a tenth, or exactly 1
   - **reverse**: flip the direction, or the order
   - **other-than**: something else entirely in this role
   - **as-well-as**: both options instead of a choice between them
   - **part-of**: one thing, or several wearing one name?
   - **earlier** · **later**: sooner in time; deferred until something forces it
3. **Check the 6 standing subjects.** Each produces a branch or gets ruled out loud.
   - **who it is for**, specifically
   - **how you know it worked**: the observable outcome
   - **what it costs**: money, time, attention
   - **what rules bind it**: law, policy, privacy, platform terms
   - **what happens when it fails**
   - **what you refuse to do**, and why
4. **Imagine it failed.** It shipped and went badly. Name the 3 most likely causes. Each cause is an open decision.
5. **Check prior art.** What do existing solutions do that nobody here raised? A landscape you don't already know → **invoke `/flow:research`**, never guess at it.
6. **Challenge the premise.** Is the stated approach right at all? A better path goes on the table _before_ a map gets built around the stated one.
7. **Cut for relevance.** Drop anything with no plausible win for this goal. Never pad to a number.

**Name the new options in prose**: "you haven't mentioned X". Never a label.

### 3. Propose

State 3 things and confirm all 3 before walking: **3–N top-level branches**, **the order you'll walk them**, **where the answers will land**.

Branches that constrain other branches go first: say which constrains which.

**On a big subject the run can end here**, with scope, order and what gets dropped settled, and the branches that are subjects of their own gone to child maps. Say so, and stop.

**Then stop.** The first branch question goes in the _next_ message.

## Phase 2: walk the map

One branch at a time. Interview until the decision is genuinely clear. A first answer is not clarity.

1. **Pose the branch.**
2. **Recommend**: "I'd go with X because Y."
3. **Wait for the reaction.** Vague or partial → probe before closing.
4. **Write the decision** in the map once it locks, and mark it `[x]`.

Never gate a write behind a yes/no question. Never end a session with a settled branch unwritten.

Add a sub-branch that surfaces mid-conversation as a `[ ]` child at once. Walk it after the parent closes.

**Never expose the bookkeeping.** No index numbers, no checkboxes, no "branch 2.1". Plain prose: situation, options, recommendation.

**Never add an out-of-scope item to the map.** A future idea, an unrelated decision, a bug noticed in passing → `## Capture`.

### When a branch is its own subject

It leaves and gets its own map and session: `flow new "…" --type topic --parent <id>`.

**The body carries what the child cannot get by opening this map**: the branch written as a question, and every decision here that binds it. Never copy the reasoning, and never copy a whole section.

**Split on whether it can be settled alone, never on size**: one `map.md` is walked across as many sessions as it takes. A branch needing its siblings' answers stays.

A feature rarely spawns one. A whole product usually spawns several.

**A decision that binds more than one child belongs to the parent.** Write it as an open branch in the parent's `map.md`, naming which child raised it. The branch here stays `[ ]` and says what it waits on. Where nothing else here can move, say it waits on the parent and stop. Never answer it locally.

### When the user isn't the one who can answer

**Find the fact yourself.** Say what you'll find, find it, come back with it, then propose. The branch stays `[ ]` until the finding lands, and only branches downstream of it wait. Never stall the whole round on a lookup.

- **What already exists here** → read it. Never burn a branch on what it already says.
- **Something documented elsewhere** → **invoke `/flow:research`**, levels 1–2.
- **Past what the documentation says** → **invoke `/flow:research`**, level 3: get the source and read it. Never commit to a tool's internals unread.
- **Nothing written can answer it** → run something. A cheap check (one command, a 10-second script) runs here. Anything needing an install, a server, a download, or more than a couple of turns → **cut a child ticket typed `prototype`** carrying the question and its pass and fail: `flow new "<question>" --type prototype --parent <id>`. **Never build it here.**
  - Start a subagent with `Run /flow:prototype on <id>`, and carry on with the walk.
  - Pass on every question it ends a turn with, in one line: `<id> asks: <question> Answer in its row below the prompt.` Never answer one yourself.
  - Resume from the finding in the ticket's `reports/`. Close the ticket with `flow done <id>` once the user accepts the answer.
  - When nothing else on the map can move, say it waits on that ticket and stop. A session that ends first leaves the ticket in `building`, and `/flow:prototype /exp-12` picks it up.

**A landscape too big to read here goes to a subagent, never a ticket.** `/flow:research` owns the brief. The branch stays `[ ]` until the report lands, and the walk carries on meanwhile. A whole product is where this fires.

**Never send the user's own material to a subagent.**

### When the branch is genuinely hard

Match depth to the branch. An obvious one gets the answer. A stuck one (a constraint that won't resolve, a structure that is wrong with no evident replacement) gets all 4 of these **before** the first adequate answer becomes the answer:

- **Reformulate.** State the problem 3 ways. One must weaken a constraint currently treated as fixed: which constraint here is assumed rather than real?
- **Name the contradiction.** "We want X without losing Y." Then satisfy both by separating them: in time, in space, by component, or by condition.
- **Find the same problem in a far-off field.** Name 3 unrelated fields where a problem with the same shape is already solved, and map the parts across. Do all 3 even when the first comes hard.
- **Build 3 structurally different families before judging any.** They differ in mechanism, not in detail. No evaluation until all 3 exist.

Then recommend one, say what would overturn it, and where a check is cheap, **run it**. Prefer a proposal one cycle can show wrong over a better-sounding one that can't.

### When talking can't answer it

Layout, density, how something feels, a system whose shape is itself the question. The signal: "I don't know" twice on one branch.

**Invoke `/flow:visualize` and draw it. Never describe it.** Draw inline, in the message, unless the drawing is going into a document being written. Same whenever a proposal, an architecture or a mechanism goes in front of the user for the first time.

### When new input arrives mid-walk

For each new chunk, before answering it:

1. **Check it against settled branches.** If it invalidates a locked decision, say so and reopen it. Never quietly write around it.
2. **Run widen on it**, as on the first input.
3. **Reorder** if the dependency order changed.

Confirms what is already there → absorb it silently. Changes the shape → say so.

### When the branch is about structure

- Build the smallest thing that works. 3 similar lines beat a premature abstraction.
- What you found while exploring shapes the proposal without binding it. If the right design replaces what exists, that's in scope.

## Phase 3: attack it before it stands

`## Judgment` carries the method. Extra here:

- Also walk **exactly 1**, **2 at once**, **out of order**, and the cheap patch that changes least.
- **Report findings only, no fixes.** Nothing found is a result: list the cases you ran.

Run only at 3 moments:

1. The user asks it of a specific proposal.
2. Your own proposal looks shaky.
3. The groundwork produced something expensive to get wrong: a structure, a data model, a commitment to a tool or a supplier.

**Name the bets**: the unchecked assumptions the answers rest on, where one being wrong changes the approach.

> We're betting that X. If that's not true, we'd need to rethink Y.

2–4, under `## Assumptions` in `map.md`. Nothing genuinely uncertain → skip.

**Name the non-goals.** What this deliberately does not cover, and why.

## Phase 4: route what was decided

Confirm every branch is resolved or deliberately deferred, then send each decision to the file that owns it. **Every route is conditional**: most runs use 1 or 2.

- **Work committed to here** → this ticket, or its children, shaped by the list below. Each carries what the map decided and a `## References` section. **Copy the lines that ticket needs, never the whole list.** **Record order that matters as `deps`**; the order you walked the branches in carries none. **Create and fill a child in one command**: `flow new "…" --parent <id> --body -` takes the body on stdin. Never create, then edit.
- **A branch that is its own subject** → `flow new "…" --type topic --parent <id>`, one per subject. Phase 2 carries the split rule and what the body holds.
- **Work an earlier run already wrote into `docs/spec/`** → `/flow:tickets-from-spec`. Tickets for what this map decided are the first route.
- **Anything settled that outlives the build**: what it must do, how it's built, why a call was made, what was refused, what the whole thing bets on → **read `references/write-spec.md`**. It picks the file. A new direction reached in _any_ run goes there, including a ticket-sized one.
- **The project's `CLAUDE.md` still holds the template's comments** in its title and `## Project` → write both from what the map decided, and delete the comments.
- **Settled and dying with the build**, this build's non-goals included → already written in `map.md`. Leave it there.
- **Decided, but not now** → `## Deferred` in the map, with the reason.
- **The answer is no** → say why, in `map.md`. A `topic` closes as below. Any other ticket → propose dropping it: on a yes, `flow drop <id> --reason "<why>" --by <id>` re-points whatever depended on it. **Park it only where it is worth building later**: its dependents wait for the revival.
- **Anything else** → `## Capture`.

**Then shape the ticket, once, and only here:**

- Exactly 1 unit of work → this ticket. A `topic` becomes a feature: `flow edit <id> --type feature`.
- Several units, useless shipped apart → children of this ticket, which becomes a `feature` where it is a `topic`. **The parent keeps only what no child holds**: the wiring, the integration test, the final suite.
- Several units, each useful alone → children of this ticket, which becomes a `topic` where it is not one. It closes after them.

**Then say what happens next**: `flow next` lists what is workable, and **`/flow:execute`** takes one ticket. On a `topic`, the map is the deliverable, a no included: `flow done <id>` once the user says it is done, or after its last child closes.

## Asking questions

Applies in Phases 1 and 2 both.

- **Every question carries your guess.**
- **Rounds in Phase 1, one at a time in Phase 2.** Ask gap-filling questions together, ordered so none depends on an answer not yet heard. A decision that constrains other decisions gets its own turn.
- **"I don't know" is a real answer.**
- **Buzzword answers get one probe.** "Scalable", "clean", "modern", "best practice" → _if you didn't have to justify this to anyone, what would you actually want?_
- **Stop test.** Can you predict the reaction to the next 3 questions you'd ask? No → keep going. Several rounds with your confidence flat → say so and reframe the questions.
- **Agreement is not an answer.** 3 rounds of "yes, agreed" → say out loud that the session went passive.

## The files

- **`map.md`**: every branch and every decision, one file, updated in place. Never split it.
- **`<index>-<name>.md`**: one file per branch that **actually grew** past what fits in `map.md`.

### `map.md` format

Markdown checklist. Zero-based indices, children extending the parent, nested as deep as the subject needs.

**Every leaf is a question, never a topic.**

**A big subject groups its questions under group headings, written in Title Case**: `Distribution` is a group, `which platform do we publish to first?` is a question. A group always has children, and closes when they close. A small subject lists questions flat.

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

Below the list, one section per resolved branch, carrying the decision, the reasoning, the alternatives rejected and why, the constraints. **Never summarize the conversation: write for a reader who was never here.** A section that outgrows the file moves to `<index>-<name>.md` and leaves a one-line pointer.

### `## References`, at the bottom of `map.md`

**Add a line the moment you read something the build will need**: a convention file, a research report, a prototype's finding, cached docs for a library, a skill that covers it.

One line each: the path, then what it says, in a few words.

```markdown
## References

- `docs/context/contracts.md`: DTOs live in `packages/contracts`, never duplicated in the app
- `~/.flow/wiki/ai-elements/research/conversation-streaming.md`: how `<Conversation>` handles a streaming response
- `~/.flow/wiki/ai-elements/downloads/llms.txt`: the docs, downloaded 2026-08-12
- `/flow:visualize`: invoke before proposing the panel's layout
```

Nothing read this run → no section. Phase 4 splits the list across the tickets it cuts.

## Hard rules

- **Every map carries branches nobody raised.** None of them → widen didn't run. Go back.
- **Never print the map to the user.**
- **Never start building before the map closes.** "Just do it" mid-map → check whether the design is actually clear; if it is, close the map first, then act.
