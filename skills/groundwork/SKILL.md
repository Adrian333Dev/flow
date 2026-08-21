---
name: groundwork
description: ALWAYS invoke when work depends on decisions nobody has made yet — a feature's shape, a product direction, a ticket's design, a choice between tools, a business or pipeline being set up, a vague ask that has to become a plan. Also on a `topic` ticket, on any ticket sitting in `groundwork`, and whenever the user says to brainstorm something. Any subject, not only software. Maps every open decision, including ones nobody raised, and walks each to a written answer. Covers the research and solution design a plan can't be written without. Not for obvious small tasks, and reading what exists to learn how it works is never groundwork.
---

# Groundwork

The work before the work: every open decision found, walked to a written answer, then routed to the file that owns it. No plan, no code.

## The loop

1. **Map** — list every open decision, including ones nobody raised.
2. **Walk** — settle them one at a time, writing each answer as it locks.
3. **Attack** — run the result through real cases before it stands.
4. **Route** — send each decision to the file that owns it.

Same 4 phases at any size. 3 words or 10 paragraphs — long input means more to extract, less to generate.

## Phase 1 — build the map

### 1. Pick the folder

- Belongs to a ticket → that ticket's `groundwork/`, created with the ticket.
- Inside a project, belongs to nothing yet → `docs/groundwork/<slug>/`.

Never pick from a guess at the outcome. You can't know yet whether this becomes 6 tickets or 1.

Folder already there for this subject → continue it. Never start a second map on one subject.

### 2. Extract

Read what exists in the area this touches — code, documents, whatever is there. Follow its grain, or say why not.

Then, from what the user gave, whatever its size, list 4 things:

- what is already decided
- what is constrained
- what **contradicts** something else they said
- what a build would need and nobody supplied

Dictated input carries contradictions almost every time. Name them. Never pick a side silently.

Sharpen vague input: what was tried already, what forced this now.

### 3. Widen

**Generate options nobody raised.** A map built only from what the user said summarizes their thinking instead of mapping the decision space. Runs every session, detailed input included — 10 paragraphs is one person's frame stated at length.

1. **Name the parts.** Break the subject into independent axes — whatever it's actually made of. Software: data model, control flow, failure handling, deployment. A pipeline: stages, tools, who owns each, what each costs.
2. **Hit every part with all 9 nudges.** Mechanical on purpose. Turning the crank surfaces what nobody thought of, and each pairing that exposes a real decision becomes a candidate branch.
   - **none** — the part doesn't exist at all
   - **more** · **less** — 10 times as much; a tenth, or exactly 1
   - **reverse** — flip the direction, or the order
   - **other-than** — something else entirely in this role
   - **as-well-as** — both options instead of a choice between them
   - **part-of** — one thing, or several wearing one name?
   - **earlier** · **later** — sooner in time; deferred until something forces it
3. **Check the 6 standing subjects.** Skipped most often, cost most when skipped. Each either produces a branch or gets ruled out loud.
   - **who it is for**, specifically
   - **how you know it worked** — the observable outcome
   - **what it costs** — money, time, attention
   - **what rules bind it** — law, policy, privacy, platform terms
   - **what happens when it fails**
   - **what you refuse to do**, and why
4. **Imagine it failed.** It shipped and went badly. Name the 3 most likely causes. Each cause is an open decision.
5. **Check prior art.** What do existing solutions do that nobody here raised? A landscape you don't already know → **invoke `/research`**, never guess at it.
6. **Challenge the premise.** Is the stated approach right at all? A better path goes on the table _before_ a map gets built around the stated one.
7. **Cut for relevance.** Drop anything with no plausible win for this goal. Never pad to a number — options the user reads and rejects cost more than they're worth.

**Name the new options in prose** — "you haven't mentioned X". Never a label. Seeing what they'd have missed is most of the value.

### 4. Propose

State 3 things and confirm all 3 before walking: **3–N top-level branches**, **the order you'll walk them**, **where the answers will land**.

Order is a dependency claim. Branches that constrain other branches go first — say which constrains which.

**Then stop.** End the message here. The first branch question goes in the _next_ message.

## Phase 2 — walk the map

One branch at a time. Interview until the decision is genuinely clear. A first answer is not clarity.

1. **Pose the branch.**
2. **Recommend.** Commit to a position: "I'd go with X because Y."
3. **Wait for the reaction.** Vague or partial → probe before closing.
4. **Write the decision** once it's locked — user-confirmed, no open threads, not mid-discussion agreement. Mark it `[x]`.

Batching 2–3 locked decisions into 1 write is fine. Never gate a write behind a yes/no question, never end a session with a settled branch unwritten.

Sub-branches surface mid-conversation. Add them as `[ ]` children immediately, walk them after the parent closes. A branch that turns out to be its own subject can leave instead — `flow ticket new "…" --type topic --parent <id>` gives it its own map and session. Most never need it.

**Never expose the bookkeeping.** No index numbers, no checkboxes, no "branch 2.1". Plain prose: situation, options, recommendation.

**Never add an out-of-scope item to the map.** A future idea, an unrelated decision, a bug noticed in passing → `## Capture`.

### When the user isn't the one who can answer

**Find the fact yourself.** Say what you'll find, find it, come back with it, then propose. The branch stays `[ ]` until the finding lands, and only branches downstream of it wait — never stall the whole round on a lookup.

- **What already exists here** → read it. Code, documents, files. Never burn a branch on what they already say.
- **Something documented elsewhere** → **invoke `/research`**, levels 1–2.
- **Past what the documentation says** → **invoke `/research`**, level 3: get the source and read it. **This is the case that sinks plans** — committing to a tool's internals unread produces a design that dies 4 steps into the build.
- **Nothing written can answer it** → run something. A cheap check — one command, a 10-second script — runs here. Anything needing an install, a server, a download, or more than a couple of turns → **cut a ticket typed `prototype`** carrying the question and its pass and fail, a child of this work where there is one: `flow ticket new "<question>" --type prototype --parent <id>`. **Never build it here** — a fresh session does that, then this groundwork resumes and reads the finding in the ticket's `reports/`. Keep walking branches that don't need the answer; when nothing else can move, say the map is waiting on that ticket and stop.

**A landscape too big to read here goes to a subagent**, never a ticket — reading asks no questions back, so nothing needs to watch it. `/research` owns the brief. The branch stays `[ ]` until the report lands in `docs/research/`; cut it mid-map and keep walking, because waiting is only for a branch nothing downstream can move without. A whole product is where this fires, since reading 3 tool landscapes inline spends the map's context on material the map never keeps.

### When the branch is genuinely hard

Match depth to the branch. An obvious one gets the answer. A stuck one — a constraint that won't resolve, a structure that is wrong with no evident replacement — gets all 4 of these **before** the first adequate answer becomes the answer:

- **Reformulate.** State the problem 3 ways. One must weaken a constraint currently treated as fixed: which constraint here is assumed rather than real?
- **Name the contradiction.** "We want X without losing Y." Then satisfy both by separating them — in time, in space, by component, or by condition.
- **Force a distant analogue.** Find 3 unrelated fields where a structurally identical problem is already solved, and map the parts across. Do all 3 even when the first comes hard; one spontaneous attempt reproduces the failure this step exists to fix.
- **Build 3 structurally different families before judging any.** They differ in mechanism, not in detail. No evaluation until all 3 exist.

Then recommend one, say what would overturn it, and where a check is cheap, **run it**. A proposal that can be shown wrong in one cycle beats a better-sounding one that can't.

### When talking can't answer it

Layout, density, how something feels — and equally a system whose shape is itself the question. Rephrasing these grows the scope to fill the uncertainty. "I don't know" twice on one branch is the signal.

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
- Exploration **informs** proposals and doesn't constrain them. If the right design replaces what exists, that's in scope.

## Phase 3 — attack it before it stands

`## Judgment` carries the method. Extra here:

- Also walk **exactly 1**, **2 at once**, **out of order**, and the cheap patch that changes least.
- **Report findings only, no fixes.** Nothing found is a result — list the cases you ran so coverage can be checked.

Run at 3 moments: the user asks it of a specific proposal, your own proposal looks shaky, or the groundwork produced something expensive to get wrong — a structure, a data model, a commitment to a tool or a supplier. Not at every close.

**Name the bets.** Assumptions the conclusions rest on — unverified, load-bearing enough that being wrong changes the approach.

> We're betting that X. If that's not true, we'd need to rethink Y.

2–4, under `## Assumptions`. Nothing genuinely uncertain → skip.

**Name the non-goals.** What this deliberately does not cover, and why. Silent disagreement about what is _not_ being built is half of all misalignment.

## Phase 4 — route what was decided

Confirm every branch is resolved or deliberately deferred, then send each decision to the file that owns it. **Every route is conditional** — most runs use 1 or 2, several at once is normal.

- **Work committed to here** → a ticket per unit of work, `flow ticket new "…"`, each carrying what the map decided and a `## References` section. **Copy the lines that ticket needs, never the whole list** — `/execute` reads every one of them, and a ticket pointed at everything is pointed at nothing.
- **Work already written into `docs/spec/product.md`** → **invoke `/write-tickets`**. That skill cuts the next batch out of a spec written months ago and read cold. Tickets for what this map just decided are the line above.
- **Anything settled that outlives the build** — what it must do, how it's built, why a call was made, what was refused, what the whole thing bets on → **read `refs/write-spec.md`**. It picks the file. A new direction reached in _any_ run goes there, including a ticket-sized one.
- **A durable fact about this project** → `docs/context/<subject>.md`.
- **Settled and dying with the build**, this build's non-goals included → already written in `map.md`. Leave it there.
- **Decided, but not now** → `## Deferred` in the map, with the reason.
- **Nothing** → deliberate. Say so out loud and say why, in `map.md`.
- **Not worth building, on a ticket** → propose parking it. On a yes, `flow park <id> "<reason>"`.

**Nothing** is a legitimate outcome. Groundwork that resolves to "not worth doing" did its job.

**Then move the folder, once, and only here:**

- Exactly 1 unit of work → `flow ticket new "…" --from-groundwork <path>`. The tool moves the folder in as that ticket's `groundwork/` and leaves nothing behind. Never move it by hand.
- Several units, each useful alone → **it stays**, and becomes the design record the tickets link back to.
- Several units, useless shipped apart → one parent ticket with children, created with the same flag so the folder lands on the parent. **The parent keeps only what no child holds** — the wiring, the integration test, the final suite.

**Then say what happens next.** `flow next` lists what is workable, and **`/execute`** takes one ticket from there. A ticket's plan is written at pickup, inside `/execute`, against the code as it stands that day. Writing one here dates it before the build starts.

## Asking questions

Applies in Phases 1 and 2 both.

- **Every question carries your guess.** Reacting to a wrong guess is faster than composing an answer from nothing.
- **Rounds in Phase 1, one at a time in Phase 2.** Gap-filling questions are independent: ask them together, ordered so none depends on an answer not yet heard. A decision that constrains other decisions gets its own turn.
- **"I don't know" is a real answer.** Twice on one branch means talking can't settle it — draw it instead.
- **Buzzword answers get one probe.** "Scalable", "clean", "modern", "best practice" → _if you didn't have to justify this to anyone, what would you actually want?_
- **Stop test.** Can you predict the reaction to the next 3 questions you'd ask? No → keep going. Several rounds with your confidence flat → say so and reframe, because the questions are wrong.
- **Agreement is not an answer.** 3 rounds of "yes, agreed" means the session went passive. Say so out loud. A long session that decided nothing feels productive and is not.

## The files

- **`map.md`** — every branch and every decision, one file, updated in place. Never split it.
- **`<index>-<name>.md`** — one file per branch that **actually grew** past what fits in `map.md`. Most branches never earn one.

**Everything else routes out.** Working material stays in this folder; finished documents go where they belong, one live copy each, a one-line pointer everywhere else.

**`map.md` is the decision log for this build.** A decision that outlives the build is written to `docs/spec/decisions.md` as well.

### `map.md` format

Markdown checklist. Zero-based indices, children extending the parent, nested as deep as the subject needs.

**Every leaf is a question.** A question walks to an answer and gets ticked. A topic never can, so a map of topics never closes.

**A big subject groups its questions under group headings, written in Title Case.** Case separates the two on sight: `Distribution` is a group, `which platform do we publish to first?` is a question. A group always has children, and closes when they close. A group with nothing under it is an agenda. A small subject skips grouping and lists questions flat.

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

Below the list, one section per resolved branch, carrying the decision, the reasoning, the alternatives rejected and why, the constraints. **Write it for a reader who was never here.** A summary of the conversation fails that reader. A section that outgrows the file moves to `<index>-<name>.md` and leaves a one-line pointer.

### `## References`, at the bottom of `map.md`

**Add a line the moment you read something the build will need** — a convention file, a research report, a prototype's finding, cached docs for a library, a skill that covers it. Left until the end of the run, half of them are forgotten.

One line each: the path, then what it says, in a few words. A bare path makes the reader open the file to find out whether it matters.

```markdown
## References

- `docs/context/contracts.md` — DTOs live in `packages/contracts`, never duplicated in the app
- `docs/research/ai-elements-streaming.md` — how `<Conversation>` handles a streaming response
- `tmp/refs/ai-elements/llms.txt` — cached docs, fetched 2026-08-12
- `/frontend-design` — invoke before writing the panel's layout
```

Nothing read this run → no section. Phase 4 splits the list across the tickets it cuts.

## Hard rules

- **Every map carries branches nobody raised.** None of them → widen didn't run. Go back.
- **Recommend, never survey.** A neutral list of options is not an answer.
- **One branch at a time in Phase 2.** Stacked questions disorient.
- **Never print the map to the user.** It's a file.
- **Phase 1 ends its message. Phase 2 starts the next.** Never both in one message.
- **Never start building before the map closes.** "Just do it" mid-map → check whether the design is actually clear; if it is, close the map first, then act.
