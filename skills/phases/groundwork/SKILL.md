---
name: groundwork
description: Refines the idea and designs the solution. Every open decision, including ones nobody raised, walked to a written answer.
---

# Groundwork

Find every decision this work needs. Answer each one, write the answer down, and put it in the file that owns it. No plan, no code.

## The loop

1. **Questions**: list every open decision, including ones nobody raised.
2. **Walk**: settle them one at a time, writing each answer as it locks.
3. **Attack**: run the result through real cases before it stands. Phase 3 says at which closes.
4. **Route**: send each decision to the file that owns it.

Same 4 phases at any size, however much the first message already settles.

## Arriving

**No ticket** → the agent makes one first, after a look in `flow tickets` for one on this subject.

**Outside a project**, the ticket lives in `~/.flow/tickets/`, and Phase 4's `docs/` routes land under `~/.flow/`.

**On a ticket, read `ticket.md` first.** Its `## Questions` decides the phase, never the status.

- **None listed** → Phase 1
- **Any `[ ]`** → Phase 2, from the first one
- **Every `[x]`** → Phase 4 routes what the ticket decided
- **An older ticket holds `groundwork/map.md`, or `###` sections under `## Decisions`.** Work it in that shape and start no second one.

**Then `flow tickets start <id> --activity design`**, also where the ticket is already `in-progress`.

**A ticket that reads both ways stops the run.** Questions ticked with nothing written under them, a section abandoned mid-sentence, a ticket about another subject: say what you found and ask.

## Phase 1: list the questions

### 1. Extract

Read what already exists in the area this touches: code, documents. Follow how it is built, or say why not.

**Nothing written before this session is settled, a file saying "decided" included.** It gives a question, never the answer, and never your Phase 2 recommendation. Trust it for which questions exist and what was already tried.

**Input arriving as files somebody already worked on** (a brainstorm run with an agent, a research report, a design draft) → read `references/read-intake.md` first.

Then list 4 things:

- what the user settled here, in this session
- what is constrained
- what **contradicts** something else
- what a build would need and nobody supplied

**Look for contradictions between files as well as inside a message**: 2 versions of one document, a design rejected in a note elsewhere, a scope that changed halfway. Dictated input contradicts itself almost every time. Name each one. Never pick a side quietly.

Sharpen vague input: what was tried already, and what forced this now.

**Write down what you found, where it will be used.** What binds the whole ticket (the goals and limits the user set for this work, constraints on every question, contradictions) goes in `## Context`, a few lines. A fact only one question rests on goes in that question's section of `context.md`, with the path you read it from.

**Write only what is specific to this ticket.** A preference of the user, a fact about the project, or how an outside tool behaves goes where `## Capture` sends it. A finding may sit in both.

### 2. Widen

**Generate options nobody raised**, every session, detailed input included: 10 paragraphs is still one person's view.

1. **Name the parts.** Break the subject into pieces that vary on their own. Software: data model, control flow, failure handling, deployment. A pipeline: stages, tools, who owns each, what each costs.
2. **Hit every part with all 9 nudges**, mechanically. A nudge that exposes a real decision becomes a question.
   - **none**: the part doesn't exist at all
   - **more** · **less**: 10 times as much; a tenth, or exactly 1
   - **reverse**: flip the direction, or the order
   - **other-than**: something else entirely in this role
   - **as-well-as**: both options instead of a choice between them
   - **part-of**: one thing, or several wearing one name?
   - **earlier** · **later**: sooner in time; deferred until something forces it
3. **Check the 6 standing subjects.** Each produces a question or gets ruled out loud.
   - **who it is for**, specifically
   - **how you know it worked**: the observable outcome
   - **what it costs**: money, time, attention
   - **what rules bind it**: law, policy, privacy, platform terms
   - **what happens when it fails**
   - **what you refuse to do**, and why
4. **Imagine it failed.** It shipped and went badly. Name the 3 most likely causes. Each cause is an open decision.
5. **Check prior art.** What do existing solutions do that nobody here raised? A landscape you don't already know → **invoke `/flow:research`**, never guess at it.
6. **Challenge the premise.** Is the stated approach right at all? A better path goes on the table _before_ the questions are built around the stated one.
7. **Cut for relevance.** Drop anything with no plausible win for this goal. Never pad to a number.

**Name the new options in prose**: "you haven't mentioned X". Never a label.

### 3. Propose

State 3 things and confirm all 3 before walking: **3–N top-level questions or groups**, **the order you'll walk them**, **where the answers will land**.

Questions that constrain other questions go first: say which constrains which.

**Write the confirmed list into `## Questions`.**

**On a big subject the run can end here**, with scope, order and what gets dropped settled, and the questions that are subjects of their own become child tickets. Say so, and stop.

**Then stop.** The first question goes in the _next_ message.

## Phase 2: walk the questions

One question at a time. Interview until the decision is genuinely clear. A first answer is not clarity.

1. **Pose the question**, and open its section in `context.md`, headed by its handle: `## 1.2`. Write the facts it rests on there as you find them.
2. **Recommend**: "I'd go with X because Y."
3. **Wait for the reaction.** No pushback closes it (`agreed`). Probe only pushback, or an answer too vague to write.
4. **Write the decision** in that section once it locks. Then tick the question `[x]` in `ticket.md` and end its line with the answer in short.

Never gate a write behind a yes/no question. Never end a session with a settled question unwritten.

Add a sub-question that surfaces mid-conversation as a `[ ]` child at once. Walk it after the parent closes.

**Never expose the bookkeeping.** No index numbers, no checkboxes, no "question 2.1". Plain prose: situation, options, recommendation.

**Never add an out-of-scope item to the questions.** A future idea, an unrelated decision, a bug noticed in passing → `## Capture`.

### When a question is its own subject

It leaves and gets its own ticket and session: `flow tickets new "…" --parent <id>`. Then add its line to the parent's `## Tasks`, since `flow tickets new` does not.

**The body carries what the child cannot get by opening this ticket**: the question written out, and every decision here that binds it. Never copy the reasoning, and never copy a whole section.

**Split on whether it can be settled alone, never on size**: one ticket's questions are walked across as many sessions as it takes. A question needing its siblings' answers stays.

A feature rarely spawns one. A whole product usually spawns several.

**A decision that binds more than one child belongs to the parent.** Write it as an open question in the parent's `## Questions`, naming which child raised it. The question here stays `[ ]` and says what it waits on. Where nothing else here can move, say it waits on the parent and stop. Never answer it locally.

### When the user isn't the one who can answer

**Find the fact yourself.** Say what you'll find, find it, come back with it, then propose. The question stays `[ ]` until the finding lands, and only questions downstream of it wait. Never stall the whole round on a lookup.

- **What already exists here** → read it. Never burn a question on what it already says.
- **Something documented elsewhere** → **invoke `/flow:research`**, levels 1–2.
- **Past what the documentation says** → **invoke `/flow:research`**, level 3: get the source and read it. Never commit to a tool's internals unread.
- **Nothing written can answer it** → prototype, below.

**A landscape too big to read here goes to a subagent, never a ticket.** `/flow:research` owns the brief. The question stays `[ ]` until the report lands, and the walk carries on meanwhile. A whole product is where this fires.

### When nothing written can answer it: prototype

A cheap check (one command, a 10-second script) just runs. Anything bigger is a prototype: naive code answering one question, run here in the walk.
- **Build only once talking and reading have both failed.** Documentation that settles it → read it. Layout, colour, density → draw it first, as below. Prototype only where the running stack answers it: real components, real data at volume, motion, a device.
- **Write the question first**, in one sentence, with what a pass and a fail would mean and change. A question only the user can judge by eye gets several variants, never one, and no pass or fail: their reaction is the result.
- **Approach not obvious → confirm it in one message first:** what gets built, the library and version, the fallback if the machinery won't run.
- **Prove the machinery runs once** on the simplest input, before asking it anything.
- **Build only what the question needs.** No tests, no error handling past runnable, no abstractions, no persistence the question doesn't test. Print the full state after every action.
- **One prototype per unknown.** Four unknowns are four prototypes. Wiring them together is fine, and they stay naive.
- **The report is the result, never the code.** In a ticket: code in `protos/<name>/`, report in `reports/<question>.md`, with measured answers first in the question's words and the numbers, then the steps that worked, in order, and where each failed. With no ticket: scratch in `tmp/`, and the answer goes where its decision lands. The code is never promoted into the real build.
- **Where it runs:** here by default. One subagent is allowed (`~/.flow/references/subagents.md`).

### When the question is genuinely hard

Match depth to the question. An obvious one gets the answer. A stuck one (a constraint that won't resolve, a structure that is wrong with no evident replacement) gets all 4 of these **before** the first adequate answer becomes the answer:

- **Reformulate.** State the problem 3 ways. One must weaken a constraint currently treated as fixed: which constraint here is assumed rather than real?
- **Name the contradiction.** "We want X without losing Y." Then satisfy both by separating them: in time, in space, by component, or by condition.
- **Find the same problem in a far-off field.** Name 3 unrelated fields where a problem with the same shape is already solved, and map the parts across. Do all 3 even when the first comes hard.
- **Build 3 structurally different families before judging any.** They differ in mechanism, not in detail. No evaluation until all 3 exist.

Then recommend one, say what would overturn it, and where a check is cheap, **run it**. Prefer a proposal one cycle can show wrong over a better-sounding one that can't.

### When talking can't answer it

Layout, density, how something feels, a system whose shape is itself the question. The signal: "I don't know" twice on one question.

**Invoke `/flow:visualize` and draw it. Never describe it.** Draw inline, in the message, unless the drawing is going into a document being written. Same whenever a proposal, an architecture or a mechanism goes in front of the user for the first time.

### When new input arrives mid-walk

For each new chunk, before answering it:

1. **Check it against settled questions.** If it invalidates a locked decision, say so and reopen it. Never quietly write around it.
2. **Run widen on it**, as on the first input.
3. **Reorder** if the dependency order changed.
4. **Add what it teaches where it is used:** the question's section, or `## Context` if it binds the whole ticket.

Confirms what is already there → absorb it silently. Changes the shape → say so.

### When the question is about structure

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

2–4, under `## Assumptions` in `ticket.md`. Nothing genuinely uncertain → skip.

**Name the non-goals.** What this deliberately does not cover, and why. Write them under `## Non-goals` in `ticket.md`, one line each.

## Phase 4: route what was decided

Confirm every question is resolved or deliberately deferred, then send each decision to the file that owns it. **Every route is conditional**: most runs use 1 or 2.

- **Work committed to here** → this ticket, or its children, shaped by the list below. Each carries what was decided and a `## References` section. **Copy the lines that ticket needs, never the whole list.** A child's order is the parent's `## Tasks`; `deps` is only for a wait outside the family. **Create and fill a child in one command**: `flow tickets new "<short name>: <sentence>" --parent <id> --body -` takes the body on stdin. Never create, then edit.
- **A question that is its own subject** → a child ticket, one per subject. Phase 2 carries the split rule and what the body holds.
- **Work an earlier run already wrote into `docs/spec/`** → `/flow:tickets-from-spec`. Tickets for what this ticket decided are the first route.
- **Anything settled that outlives the build**: what it must do, how it's built, why a call was made, what was refused, what the whole thing bets on → **read `~/.flow/references/write-spec.md`**. It picks the file. A new direction reached in _any_ run goes there, including a ticket-sized one.
- **The project's `CLAUDE.md` still holds the template's comments** in its title and `## Project` → write both from what was decided, and delete the comments.
- **Settled and dying with the build**, this build's non-goals included → already written in the ticket. Leave it there.
- **Decided, but not now** → `## Deferred`, with the reason.
- **The answer is no** → say why, in the question's section. A ticket with nothing to build closes with `flow tickets done`. Any other ticket → propose dropping it: on a yes, `flow tickets drop <id> --reason "<why>" --by <id>` re-points whatever depended on it. **Park it only where it is worth building later**: its dependents wait for the revival.
- **Anything else** → `## Capture`.

**Then shape the ticket, once, and only here:**

- **Exactly 1 unit of work** → this ticket. Its `## Tasks` lists the steps, if it needs them.
- **Several units** → children via `--parent <id>`. Each is one you can try and see working, named by what it does, never by a layer of the code. The parent's `## Tasks` lists them in build order, one line each starting with the child's id: `- [ ] exp-48: …`. **The parent keeps only what no child holds**: the wiring, the integration test, the final suite. It closes after its last child.

**Then say what happens next**: `flow next` lists what is workable, and **`/flow:execute`** takes one ticket. A ticket with nothing to build, where the decisions are the deliverable: `flow tickets done <id>` once the user says it is done, or after its last child closes.

## Asking questions

Applies in Phases 1 and 2 both.

- **Every question carries your guess.**
- **Rounds in Phase 1, one at a time in Phase 2.** Ask gap-filling questions together, ordered so none depends on an answer not yet heard. A decision that constrains other decisions gets its own turn.
- **"I don't know" is a real answer.**
- **Buzzword answers get one probe.** "Scalable", "clean", "modern", "best practice" → _if you didn't have to justify this to anyone, what would you actually want?_
- **Stop test.** Can you predict the reaction to the next 3 questions you'd ask? No → keep going. Several rounds with your confidence flat → say so and reframe the questions.
- **Agreement is not an answer.** 3 rounds of "yes, agreed" → say out loud that the session went passive.

## The files

`ticket.md` and `context.md`, each updated in place as each answer locks, shaped by `~/.flow/references/write-tickets.md`. Groundwork writes `## Context`, `## Questions`, `## Assumptions`, `## Non-goals`, `## Deferred` and `## References`.

### `## Questions` format

Markdown checklist. Zero-based indices, children extending the parent, nested as deep as the subject needs.

**Every leaf is a question, never a topic.**

**A big subject groups its questions under group headings, written in Title Case**: `Distribution` is a group, `which platform do we publish to first?` is a question. A group always has children, and closes when they close. A small subject lists questions flat.

```markdown
- [ ] 0: Distribution
  - [x] 0.0: which platform do we publish to first? YouTube: the audience already watches there.
  - [ ] 0.1: do we cut vertical versions for shorts?
    - [ ] 0.1.0: who owns the re-cut, us or the editor?
- [ ] 1: Production
  - [ ] 1.0: do we script every episode, or run to a beat sheet?
  - [ ] 1.1: what is the smallest kit we buy before episode one?
- [ ] 2: how many episodes ship before we judge the format?
```

Its section in `context.md`:

```markdown
## 0.0

YouTube first. The 3 test videos drew 4,100 views there against 300 on TikTok (`reports/first-platform.md`). Rejected: TikTok first, since the shorts would need a re-cut nobody owns yet (0.1.0).
```

### `## References`

**Add a line the moment you read something the build will need**: a convention file, a research report, a prototype's finding, cached docs for a library, a skill that covers it.

One line each: the path, then what it says, in a few words.

```markdown
## References

- `docs/context/contracts.md`: DTOs live in `packages/contracts`, never duplicated in the app
- `~/.flow/wiki/ai-elements/research/conversation-streaming.md`: how `<Conversation>` handles a streaming response
- `~/.flow/wiki/ai-elements/downloads/llms.txt`: the docs, downloaded 2026-08-12
- `/flow:visualize`: invoke before proposing the panel's layout
```

Nothing read this run → no section. Phase 4 splits the list across the tickets it cuts. Every later phase keeps adding to it.

## Hard rules

- **Every set of questions carries questions nobody raised.** None of them → widen didn't run. Go back.
- **Never print the checklist to the user.**
- **Never start building before the questions close.** "Just do it" mid-walk → check whether the design is actually clear; if it is, close the questions first, then act.
