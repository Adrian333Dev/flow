# Write the spec

**Not only for software.** A content pipeline, a business, a workflow — anything built out of parts that hand things to each other gets the same document. Where a section names a signature or a schema, that is the software case, not the definition.

## 1. Pick the file

One test, asked of each decision: **does it outlive the thing being built?**

- **No, it dies with the build** → `design.md` beside `map.md`, or `groundwork/design.md` in the ticket that owns it.
- **Yes, and it says what the product must do** → `docs/spec/product.md`.
- **Yes, and it says how the system is built** → `docs/spec/tech.md`.
- **Yes, and it says why a call was made** → `docs/spec/decisions.md`.

One run usually writes 2 of these. Create `docs/spec/` where there is none.

`product.md` and `tech.md` are the base pair. `decisions.md` appears the moment something is locked with a reason worth keeping, which at project start is immediately.

A subject gets its own file beside them only when all 3 hold: no fact appears in 2 files, the boundary is statable in one sentence, and it isn't a section of an existing file. Past 3 files, add an index naming each and what it holds.

**Not this file's job:** how a library ended up bent out of shape, written after the build so the next person can change it. That's a durable project fact — `docs/context/<subject>.md`, written by `/execute`.

## 2. Before writing

1. **Re-read `map.md`.** Open `[ ]` branches → name them and confirm they're deferred, or go back and walk them. A spec written over an open branch buries it.
2. **Read what exists** — code, the current spec, whatever this touches. A contradiction with a settled decision → raise it and reopen that branch. Never quietly write around it.
3. **List every closed branch, one line each, with the file it lands in.**

Step 3 is the whole defence against a spec that quietly loses half the map. **List branches, never behaviors** — a UI decision, a refused approach and a cost ceiling are all branches, and none is a behavior. A 5,000-line map is maybe 120 lines of this. Several map files → one at a time.

Write the list before any prose. Tick each line as it lands. Verify at the end: an unticked line is a decision that vanished.

## 3. Write it

One pass, after the map closes. The decisions were agreed while walking the map, so re-approving them section by section bills the same conversation twice. Save as each section completes.

**Write every requirement concrete and checkable.** "Fast", "robust", "user-friendly" are not requirements.

**Draw wherever a drawing carries the point — invoke `/visualize`.** One place or 5, in whichever sections are spatial, and **every spec carries at least one**. Never head a section "architecture" and leave no picture under it.

Markdown only. No frontmatter, no copied artifacts.

### What it must do — `product.md`

Always, however small the product:

1. **What it is and who it is for** — one paragraph a stranger follows.
2. **The problem, and why now.**
3. **Every behavior**, grouped how the product is actually shaped — by surface, by job, by whatever the map used. Each carries a mark.
4. **How you know it worked** — the observable outcome, the check, the number.

Then only what a branch actually covered. Most specs use 3 or 4 of these, and a subject nobody walked writes nothing here:

- **The domain model** — the concepts this is built on, and how they relate.
- **Named principles** — the constraints that settle later arguments before they start.
- **The interaction surface** — screens, cards, flows, at the depth the groundwork reached.
- **Constraints that are not code** — money, law, privacy, policy.
- **What it competes against**, and why this holds up. The survey itself belongs in `docs/research/`.
- **The glossary** — every term invented here.

**Every behavior carries a mark**, one of four:

- **V1** — ships first. The only mark tickets are created from.
- **next** — committed, not yet.
- **later** — wanted, no commitment.
- **never** — deliberately refused. The reason goes in `decisions.md`.

The spec is finished when every behavior carries a mark, never when the thinking feels done.

**Write the whole product, at every version.** Scope the *building*, never the *writing* — a spec that opens "ship phase 1" and pushes the rest out of scope loses every phase after the first.

### How it is built — `tech.md` or `design.md`

Same skeleton at both scopes. `tech.md` is the whole system and outlives every feature; `design.md` is one thing and dies when that thing is built.

**Always write one. Never skip it for being simple.** Sections scale down to a sentence each; the document doesn't disappear. Simple-looking work is where unexamined assumptions cost the most.

1. **The goal** — one paragraph a stranger follows.
2. **Scope** — what is in, and what is out. Both named.
3. **The parts** — what each one owns, and what it depends on. A part is a module, a stage, a team, a channel: whatever this thing is actually built out of.
4. **What passes between them** — concrete wherever it was decided. A function signature and an event payload in software; a rendered file, an approval, a paid invoice elsewhere.
5. **One real case, end to end** — followed part by part, start to finish. One request from click to stored row. One video from idea to published. One customer from first ad to money in the account. A design that looks fine as a diagram falls apart here first.
6. **How it fails** — every way it goes wrong, and what happens on each.
7. **How you know it worked** — the observable outcome, the check, the number. A design with no answer here produces work nobody can call finished.
8. **What is locked** — one line per decision. The reasoning stays where it was written.

`tech.md` adds 2 things, and only because its scope is the whole system:

- **The stack and the repo layout** — what each piece is for, which folders exist, what lives in them.
- **The parts are the system's parts** — backend, frontend, services, workers, packages. Never one feature's.

### Why it is this way — `decisions.md`

Only for reasoning that outlives the build. A ticket-sized call stays in `map.md`, which sits beside the work and gets read there.

- **Each locked decision, with its reason.** Dated, newest last.
- **What was refused, and why.** The reason is the point. Without it the same idea comes back every quarter.
- **The bets** — Phase 3 names them. A risk is a bet already known to be shaky, so it goes here too, with what happens if it fires.
- **What is still open** — grouped by kind, each saying what would settle it.

## 4. Review it yourself

Read it once with fresh eyes and fix what you find inline:

- **Placeholders** — any TBD, TODO, or half-written section.
- **Contradictions** — sections that disagree, or a drawing that doesn't match the parts under it.
- **Vague requirements** — anything not concrete and checkable.
- **Invented material** — anything in the document that no branch decided.
- **Ambiguity** — any requirement that could be read 2 ways. Pick one and say it.
- **The branch list** — every line ticked.

No second review. Fix and move on.

## 5. Show it and stop

Give the paths. The user reads and approves before anything is created from it.

**An objection is not new groundwork.** It reopens the one branch it came from, in `map.md`. Walk that branch, then rewrite the affected section.

Approved and there's work to cut → **invoke `/cut-from-spec`**. **Never create a ticket from here.**

## Editing a spec that already exists

Same steps, scoped to what changed.

- **A behavior changed** → edit it in place. Never append a second version of it elsewhere.
- **A behavior was refused** → move it to `never` and write the reason in `decisions.md`. Never delete it; deleting is how "why not X" comes back.
- **The direction changed** → say plainly what it was and what it is now, in the section it belongs to. The spec states the present, and the old direction survives in `decisions.md`.
- **A section was replaced wholesale** in a file too large to reread → leave one line saying what replaced it and where.

## What stays out

- the deliberation
- the options weighed and dropped mid-discussion
- the history of the conversation
- anything still open, which goes in `decisions.md`

Reasoning that outlives the build goes to `decisions.md`. Everything else stays in `map.md`. `product.md` says what the thing **is**, and `tech.md` says how it is **built**.

**No fact in two files.** One live copy, a pointer everywhere else. A decision resting on evidence — a research report, a prototype, a drawing — names it **inline, on that decision**, plus a short reference list at the end of the file. No global index.
