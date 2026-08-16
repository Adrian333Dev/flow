---
name: brainstorm
description: ALWAYS invoke when work depends on decisions nobody has made yet — a feature's shape, a product direction, a ticket's design, a choice between tools, a business or a pipeline being set up, a vague ask that has to become a plan. Works on any subject, not only software. Maps every open decision, including the ones nobody raised, and walks each one to a written answer. Covers the research and the solution design a plan cannot be written without. Not for obvious small tasks, and reading what already exists to learn how it works is never a brainstorm.
---

# Brainstorm

Turn an open subject into written, settled decisions.

## The loop

1. **Map** — build the list of open decisions, including the ones nobody raised.
2. **Walk** — settle them one at a time, writing each answer as it locks.
3. **Attack** — run the result through real cases before it stands.
4. **Route** — send each decision to the file that owns it.

Same four phases at any size. Three words or ten paragraphs — long input means more to extract and less to generate.

## Phase 1 — build the map

### 1. Pick the folder

- Belongs to a ticket → that ticket's `brainstorm/`, created with the ticket.
- Inside a project, belongs to nothing yet → `docs/brainstorms/<slug>/`.
- No project here → where you are standing, same shape.

Never pick the folder from a guess at the outcome. You cannot know yet whether this becomes six tickets or one.

A folder already there for this subject → continue it. Never start a second map on one subject.

### 2. Extract

Read what already exists in the area this touches — the code, the documents, whatever is there. Follow its grain, or say why not.

Then, from what the user gave, whatever its size, list four things:

- what is already decided
- what is constrained
- what **contradicts** something else they said
- what a build would need and nobody supplied

Dictated input carries contradictions almost every time. Name them. Never pick a side silently.

Sharpen vague input: what has been tried already, and what forced this now.

### 3. Widen

**Generate options nobody raised.** A map built only from what the user said summarizes their thinking instead of mapping the decision space. Runs every session, detailed input included — ten paragraphs is one person's frame stated at length.

1. **Name the parts.** Break the subject into independent axes — whatever it is actually made of. Software: data model, control flow, failure handling, deployment. A pipeline: stages, tools, who owns each, what each costs.
2. **Hit every part with all nine nudges.** Mechanical on purpose. Turning the crank is what surfaces what nobody thought of, and each pairing that exposes a real decision becomes a candidate branch.
   - **none** — the part does not exist at all
   - **more** · **less** — ten times as much; a tenth, or exactly one
   - **reverse** — flip the direction, or flip the order
   - **other-than** — something else entirely in this role
   - **as-well-as** — both options, instead of choosing between them
   - **part-of** — one thing, or several wearing one name?
   - **earlier** · **later** — sooner in time; deferred until something forces it
3. **Check the six standing subjects.** The ones skipped most often, and the ones that cost most when skipped. Each either produces a branch or gets ruled out loud.
   - **who it is for**, specifically
   - **how you know it worked** — the observable outcome
   - **what it costs** — money, time, attention
   - **what rules bind it** — law, policy, privacy, platform terms
   - **what happens when it fails**
   - **what you refuse to do**, and why
4. **Imagine it failed.** It shipped and went badly. Name the three most likely causes. Each cause is an open decision.
5. **Check prior art.** What do existing solutions do that nobody here raised? A landscape you do not already know → **invoke `research`**, never guess at it.
6. **Challenge the premise.** Is the stated approach right at all? A better path goes on the table _before_ a map gets built around the stated one.
7. **Cut for relevance.** Drop anything with no plausible win for this goal. Never pad to a number — options the user reads and rejects cost more than they are worth.

**Name the new options in prose** — "you haven't mentioned X". Never a label. Seeing what they would have missed is most of the value.

### 4. Propose

State three things and confirm all three before walking: **3–N top-level branches**, **the order you will walk them**, and **where the answers will land**.

Order is a dependency claim. Branches that constrain other branches go first — say which constrains which.

**Then stop.** End the message here. The first branch question goes in the _next_ message.

## Phase 2 — walk the map

One branch at a time. Interview until the decision is genuinely clear. A first answer is not clarity.

1. **Pose the branch.**
2. **Recommend.** Commit to a position: "I'd go with X because Y."
3. **Wait for the reaction.** Vague or partial → probe before closing.
4. **Write the decision** once it is locked — user-confirmed, no open threads, not mid-discussion agreement. Mark it `[x]`.

Batching two or three locked decisions into one write is fine. Never gate a write behind a yes/no question, and never end a session with a settled branch unwritten.

Sub-branches surface mid-conversation. Add them as `[ ]` children immediately and walk them after the parent closes. A branch that turns out to be its own subject can leave instead — `flow ticket new "…" --type research --parent <id>` gives it its own map and its own session. Most never need it.

**Never expose the bookkeeping.** No index numbers, no checkboxes, no "branch 2.1". Plain prose: situation, options, recommendation.

**Never add an out-of-scope item to the map.** A future idea, an unrelated decision, a bug noticed in passing → `## Capture`.

### When the user is not the one who can answer

**Find the fact yourself.** Say what you are going to find, find it, come back with it, then propose. The branch stays `[ ]` until the finding lands, and only branches downstream of it wait — never stall the whole round on a lookup.

- **What already exists here** → read it. The code, the documents, the files. Never burn a branch on what they already say.
- **Something documented elsewhere** → **invoke `research`**, levels 1–2.
- **Past what the documentation says** → **invoke `research`**, level 3: get the source and read it. **This is the case that sinks plans** — committing to a tool's internals unread produces a design that dies four steps into the build.
- **Nothing written can answer it** → run something. A cheap check — one command, a ten-second script — runs here. Anything needing an install, a server, a download, or more than a couple of turns → **invoke `prototype`**: name the question, write pass and fail, hand it to a fresh session, then wait.

**A landscape too big to read here goes to a subagent**, never a ticket — reading asks no questions back, so nothing needs to watch it. `research` owns the brief. The branch stays `[ ]` until the report lands in `docs/research/`; cut it mid-map and keep walking, because waiting is only for a branch nothing downstream can move without. A whole-product brainstorm is where this fires, since reading three tool landscapes inline spends the map's context on material the map never keeps.

### When the branch is genuinely hard

Match depth to the branch. An obvious one gets the answer. A stuck one — a constraint that will not resolve, a structure that is wrong with no evident replacement — gets all four of these **before** the first adequate answer becomes the answer:

- **Reformulate.** State the problem three ways. One must weaken a constraint currently treated as fixed: which constraint here is assumed rather than real?
- **Name the contradiction.** "We want X without losing Y." Then satisfy both by separating them — in time, in space, by component, or by condition.
- **Force a distant analogue.** Find three unrelated fields where a structurally identical problem is already solved, and map the parts across. Do all three even when the first comes hard; one spontaneous attempt reproduces the failure this step exists to fix.
- **Build three structurally different families before judging any.** They differ in mechanism, not in detail. No evaluation until all three exist.

Then recommend one, say what would overturn it, and where a check is cheap, **run it**. A proposal that can be shown wrong in one cycle beats a better-sounding one that cannot.

### When talking cannot answer it

Layout, density, how something feels — and equally a system whose shape is itself the question. Rephrasing these grows the scope to fill the uncertainty. "I don't know" twice on one branch is the signal.

**Invoke `visualize` and draw it. Never describe it.** Draw inline, in the message, unless the drawing is going into a document being written. ASCII frame first until the structure is agreed; colour only when colour is the open branch.

Same whenever a proposal, an architecture or a mechanism goes in front of the user for the first time. A shape stated in sentences was not communicated.

### When new input arrives mid-walk

The whole ask rarely arrives at once. For each new chunk, before answering it:

1. **Check it against settled branches.** If it invalidates a locked decision, say so and reopen it. Never quietly write around it.
2. **Run widen on it.** New material gets the same treatment as the first input, not just filing.
3. **Reorder** if the dependency order changed.

Confirms what is already there → absorb it silently. Changes the shape → say so.

### When the branch is about structure

- Propose parts with one clear purpose, connected by defined handoffs. For each: what it does, how it is used, what it depends on.
- A part that needs a huge file, or one person doing six unrelated jobs, is one part doing too much.
- Build the smallest thing that works. Three similar lines beat a premature abstraction.
- Exploration **informs** proposals and does not constrain them. If the right design replaces what exists, that is in scope.

## Phase 3 — attack it before it stands

**Attack it by running it. Rating it finds nothing.** Walk it through named cases: the one it was built for, then empty, exactly one, enormous, repeated, two at once, out of order, interrupted halfway. **A fault is a step you cannot finish.**

- Take every "usually" and "most of the time" in the reasoning first. Each one is a case that was skipped.
- Walk what already exists the same way, and walk the cheap patch that changes the least. Late faults live in what nobody ever ran.
- Report findings only, no fixes. Nothing found is a result: list the cases you ran so the coverage can be checked.

Run this at three moments: the user asks it of a specific proposal, you think your own proposal is shaky, or the brainstorm produced something expensive to get wrong — a structure, a data model, a commitment to a tool or a supplier. Not at every close.

**Name the bets.** The assumptions the conclusions rest on — unverified, and load-bearing enough that being wrong changes the approach.

> We're betting that X. If that's not true, we'd need to rethink Y.

Two to four, under `## Assumptions`. Nothing genuinely uncertain → skip it.

**Name the non-goals.** What this deliberately does not cover, and why. Silent disagreement about what is _not_ being built is half of all misalignment.

## Phase 4 — route what was decided

Confirm every branch is resolved or deliberately deferred, then send each decision to the file that owns it. **Every route is conditional** — most brainstorms use one or two, and several at once is normal.

- **Work committed to here** → a ticket per unit of work, `flow ticket new "…"`, each carrying what the map decided.
- **Work already written into `docs/spec/product.md`** → **invoke `write-tickets`**. That skill cuts the next batch out of a spec written months ago and read cold. Tickets for what this map just decided are the line above.
- **Anything settled that outlives the build** — what it must do, how it is built, why a call was made, what was refused, what the whole thing bets on → **read `write-spec.md`** in this folder. It picks the file. A new direction reached in _any_ brainstorm goes there, including a ticket-sized one.
- **A durable fact about this project** → `docs/context/<subject>.md`.
- **Settled and dying with the build**, this build's non-goals included → already written in `map.md`. Leave it there.
- **Decided, but not now** → `## Deferred` in the map, with the reason.
- **Nothing** → deliberate. Say so out loud and say why, in `map.md`.

**Nothing** is a legitimate outcome. A brainstorm that resolves to "not worth doing" did its job.

**Then move the folder, once, and only here:**

- Exactly one unit of work → `flow ticket new "…" --from-brainstorm <path>`. The tool moves the folder in as that ticket's `brainstorm/` and leaves nothing behind. Never move it by hand.
- Several units, each useful alone → **it stays**, and becomes the design record the tickets link back to.
- Several units, useless shipped apart → one parent ticket with children, created with the same flag so the folder lands on the parent.

**Then say what happens next.** `flow next` lists what is workable, and **`execute`** takes one ticket from there. A ticket's plan is written at pickup, inside `execute`, against the code as it stands that day. Writing one here dates it before the build starts.

## Asking questions

Applies in Phases 1 and 2 both.

- **Every question carries your guess.** Reacting to a wrong guess is faster than composing an answer from nothing.
- **Rounds in Phase 1, one at a time in Phase 2.** Gap-filling questions are independent: ask them together, ordered so none depends on an answer not yet heard. A decision that constrains other decisions gets its own turn.
- **"I don't know" is a real answer.** Twice on one branch means talking cannot settle it — draw it instead.
- **Buzzword answers get one probe.** "Scalable", "clean", "modern", "best practice" → _if you didn't have to justify this to anyone, what would you actually want?_
- **Stop test.** Can you predict the reaction to the next three questions you would ask? No → keep going. Several rounds with your confidence flat → say so and reframe, because the questions are wrong.
- **Agreement is not an answer.** Three rounds of "yes, agreed" means the session went passive. Say so out loud. A long session that decided nothing feels productive and is not.

## The files

- **`map.md`** — every branch and every decision, one file, updated in place. Never split it.
- **`<index>-<name>.md`** — one file per branch that **actually grew** past what fits in `map.md`. Most branches never earn one.

**Everything else routes out.** Working material stays in this folder; finished documents go where they belong, one live copy each, a one-line pointer everywhere else.

**`map.md` is the decision log for this build.** A decision that outlives the build is written to `docs/spec/decisions.md` as well.

### `map.md` format

A markdown checklist. Zero-based indices, children extending the parent, nested as deep as the subject needs.

**Every leaf is a question.** A question walks to an answer and gets ticked. A topic never can, so a map of topics never closes.

**A big subject groups its questions under topic parents, written in Title Case.** Case separates the two on sight: `Distribution` is a group, `which platform do we publish to first?` is a question. A topic parent always has children, and closes when they close. A topic with nothing under it is an agenda. A small subject skips grouping and lists questions flat.

```markdown
- [ ] 0 — Distribution
  - [x] 0.0 — which platform do we publish to first?
  - [ ] 0.1 — do we cut vertical versions for shorts?
    - [ ] 0.1.0 — who owns the re-cut, us or the editor?
- [ ] 1 — Production
  - [ ] 1.0 — do we script every episode, or run to a beat sheet?
  - [ ] 1.1 — what is the smallest kit we buy before episode one?
- [ ] 2 — how many episodes ship before we judge the format?
```

Below the list, one section per resolved branch, carrying the decision, the reasoning, the alternatives rejected and why, and the constraints. **Write it for a reader who was never here.** A summary of the conversation fails that reader. A section that outgrows the file moves to `<index>-<name>.md` and leaves a one-line pointer.

## Hard rules

- **Every map carries branches nobody raised.** None of them → widen did not run. Go back.
- **Recommend, never survey.** A neutral list of options is not an answer.
- **One branch at a time in Phase 2.** Stacked questions disorient.
- **Never print the map to the user.** It is a file.
- **Phase 1 ends its message. Phase 2 starts the next.** Never both in one message.
- **Never start building before the map closes.** "Just do it" mid-brainstorm → check whether the design is actually clear; if it is, close the map first, then act.
