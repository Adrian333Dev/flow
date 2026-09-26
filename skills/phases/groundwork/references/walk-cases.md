# Walking a branch: 6 cases

Each section adds to Phase 2's loop in `SKILL.md` for one situation. More than one can hit the same branch.

## When a branch is its own subject

It leaves and gets its own map and session: `flow new "…" --type topic --parent <id>`.

**The body carries what the child cannot get by opening this map**: the branch written as a question, and every decision here that binds it. Never copy the reasoning, and never copy a whole section. The parent's map is one path away, and a second copy of a decision drifts from the first.

**Split on whether it can be settled alone, never on how big it is.** A branch that needs answers from its siblings is not independent. Size is not a reason: one `map.md` is walked across as many sessions as it takes.

A feature rarely spawns one. A whole product usually spawns several, because its parts are genuinely separate subjects.

**A decision that binds more than one child belongs to the parent.** Write it as an open branch in the parent's `map.md`, naming which child raised it. The branch here stays `[ ]` and says what it waits on. Where nothing else here can move, say it waits on the parent and stop. Never answer it locally: 2 children answering the same question answer it differently.

## When the user isn't the one who can answer

**Find the fact yourself.** Say what you'll find, find it, come back with it, then propose. The branch stays `[ ]` until the finding lands, and only branches downstream of it wait. Never stall the whole round on a lookup.

- **What already exists here** → read it. Never burn a branch on what it already says.
- **Something documented elsewhere** → **invoke `/flow:research`**, levels 1–2.
- **Past what the documentation says** → **invoke `/flow:research`**, level 3: get the source and read it. **This is the case that sinks plans**, committing to a tool's internals unread produces a design that dies 4 steps into the build.
- **Nothing written can answer it** → run something. A cheap check (one command, a 10-second script) runs here. Anything needing an install, a server, a download, or more than a couple of turns → **cut a ticket typed `prototype`** carrying the question and its pass and fail. Make it a child of this work where there is one: `flow new "<question>" --type prototype --parent <id>`. **Never build it here.** Start a subagent with `Run /flow:prototype on <id>`, and carry on with the walk. Pass on every question it ends a turn with, in one line: `<id> asks: <question> Answer in its row below the prompt.` Never answer one yourself. This groundwork resumes from the finding in the ticket's `reports/`. When nothing else on the map can move, say it waits on that ticket and stop. A session that ends first leaves the ticket in `building`, and `/flow:start <id>` picks it up.

**A landscape too big to read here goes to a subagent**, never a ticket: reading asks no questions back, so nothing needs to watch it. `/flow:research` owns the brief. The branch stays `[ ]` until the report lands in `docs/research/`, and the walk carries on meanwhile. A whole product is where this fires.

**Never send the user's own material to a subagent.** A summary drops the detail Phase 1 needs, and their files are where the contradictions hide.

## When the branch is genuinely hard

Match depth to the branch. An obvious one gets the answer. A stuck one (a constraint that won't resolve, a structure that is wrong with no evident replacement) gets all 4 of these **before** the first adequate answer becomes the answer:

- **Reformulate.** State the problem 3 ways. One must weaken a constraint currently treated as fixed: which constraint here is assumed rather than real?
- **Name the contradiction.** "We want X without losing Y." Then satisfy both by separating them: in time, in space, by component, or by condition.
- **Find the same problem in a far-off field.** Name 3 unrelated fields where a problem with the same shape is already solved, and map the parts across. Do all 3 even when the first comes hard.
- **Build 3 structurally different families before judging any.** They differ in mechanism, not in detail. No evaluation until all 3 exist.

Then recommend one, say what would overturn it, and where a check is cheap, **run it**. A proposal that can be shown wrong in one cycle beats a better-sounding one that can't.

## When talking can't answer it

Layout, density, how something feels, and equally a system whose shape is itself the question. Rephrasing these grows the scope to fill the uncertainty. "I don't know" twice on one branch is the signal.

**Invoke `/flow:visualize` and draw it. Never describe it.** Draw inline, in the message, unless the drawing is going into a document being written. ASCII frame first until the structure is agreed; colour only when colour is the open branch.

Same whenever a proposal, an architecture or a mechanism goes in front of the user for the first time. A shape stated in sentences was not communicated.

## When new input arrives mid-walk

The whole ask rarely arrives at once. For each new chunk, before answering it:

1. **Check it against settled branches.** If it invalidates a locked decision, say so and reopen it. Never quietly write around it.
2. **Run widen on it.** New material gets the same treatment as the first input, not just filing.
3. **Reorder** if the dependency order changed.

Confirms what is already there → absorb it silently. Changes the shape → say so.

## When the branch is about structure

- Propose parts with one clear purpose, connected by defined handoffs. For each: what it does, how it's used, what it depends on.
- A part that needs a huge file, or one person doing 6 unrelated jobs, is one part doing too much.
- Build the smallest thing that works. 3 similar lines beat a premature abstraction.
- What you found while exploring shapes the proposal without binding it. If the right design replaces what exists, that's in scope.
