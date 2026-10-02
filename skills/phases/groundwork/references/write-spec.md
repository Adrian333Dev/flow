# Write the spec

**Not only for software**: a content pipeline, a business, a workflow get the same document. A signature or a schema below is the software case.

## 1. Pick the file

One test, asked of each decision: **does it outlive the thing being built?**

- **No, it dies with the build** → `design.md` beside `map.md`, or `groundwork/design.md` in the ticket that owns it.
- **Yes, and it says what the product must do** → `docs/spec/product.md`.
- **Yes, and it says how the system is built** → `docs/spec/tech.md`.

One run usually writes 2 of these. Create `docs/spec/` where there is none.

**A decision carries its reason in the file it lands in**: `### Every decision carries its reason`.

A subject gets its own file beside them only when all 3 hold: no fact appears in 2 files, the boundary is statable in one sentence, and it isn't a section of an existing file. Past 3 files, add an index naming each and what it holds.

**Not this file's job**: how a library was bent out of shape, written after the build → `docs/context/<subject>.md`, by `/flow:execute`.

## 2. Before writing

1. **Re-read `map.md`.** Open `[ ]` branches → name them and confirm they're deferred, or go back and walk them.
2. **Read what exists**: code, the current spec, whatever this touches. A contradiction with a settled decision → raise it and reopen that branch. Never quietly write around it.
3. **List every closed branch, one line each, with the file it lands in.**

**List branches, never behaviors**: a UI decision, a refused approach and a cost ceiling are all branches, and none is a behavior. A 5,000-line map is maybe 120 lines of this. Several map files → one at a time.

Write the list before any prose. Tick each line as it lands. At the end, check every line is ticked.

## 3. Write it

One pass, after the map closes. Never re-approve the decisions section by section. Save as each section completes.

**Write every requirement concrete and checkable.** "Fast", "robust", "user-friendly" are not requirements.

**Draw wherever a drawing carries the point: invoke `/flow:visualize`.** In whichever sections are spatial, and **every spec carries at least one**. Never head a section "architecture" and leave no picture under it.

Markdown only. No frontmatter, no copied artifacts.

### What it must do: `product.md`

Always, however small the product:

1. **What it is and who it is for**: one paragraph a stranger follows.
2. **The problem, and why now.**
3. **Every behavior**, grouped how the product is actually shaped: by surface, by job, by whatever the map used. Each carries a mark.
4. **How you know it worked**: the observable outcome, the check, the number.

Then only what a branch covered, usually 3 or 4 of these:

- **The domain model**: the concepts this is built on, and how they relate.
- **Named principles**: the constraints that settle later arguments before they start.
- **The interaction surface**: screens, cards, flows, at the depth the groundwork reached.
- **Constraints that are not code**: money, law, privacy, policy.
- **What it competes against**, and why this holds up. The survey itself belongs in `docs/research/`.
- **The glossary**: every term invented here.
- **`## Bets`**: what the whole thing rests on that nobody has checked.

**Every behavior carries a mark**, one of 4:

- **V1**: ships first. The only mark tickets are created from.
- **next**: committed, not yet.
- **later**: wanted, no commitment.
- **never**: deliberately refused, with the reason on the same line.

Finish the spec when every behavior carries a mark.

**Write the whole product, at every version.** Scope the *building*, never the *writing*: never push later phases out of the spec.

### How it is built: `tech.md` or `design.md`

Same skeleton at both scopes. `tech.md` is the whole system and outlives every feature; `design.md` is one thing and dies when that thing is built.

**Always write one, simple work included.** A section can be one sentence.

1. **The goal**: one paragraph a stranger follows.
2. **Scope**: what is in, and what is out. Both named.
3. **The parts**: what each one owns, and what it depends on. A part is a module, a stage, a team, a channel: whatever this thing is actually built out of.
4. **What passes between them**: concrete wherever it was decided. A function signature and an event payload in software; a rendered file, an approval, a paid invoice elsewhere.
5. **One real case, end to end**: followed part by part, start to finish. One request from click to stored row. One video from idea to published. One customer from first ad to money in the account.
6. **How it fails**: every way it goes wrong, and what happens on each.
7. **How you know it worked**: the observable outcome, the check, the number.
8. **What is locked**: one line per decision, with its reason.

`tech.md` adds 2 things:

- **The stack and the repo layout**: what each piece is for, which folders exist, what lives in them.
- **The parts are the system's parts**: backend, frontend, services, workers, packages. Never one feature's.

### Every decision carries its reason

Written under the decision, in whichever file holds it.

- **The reason**: a line or two, dated. Longer reasoning stays in `map.md`, named from the line.
- **What was refused, and why**, under the decision it lost to.
- **The bets** → `product.md` → `## Bets`. Phase 3 names them. A risk goes there too, with what happens if it fires.
- **What is still open** → a ticket each, once the spec is approved: `## 5. Show it and stop`.

A ticket-sized call stays in `map.md`.

## 4. Review it yourself

Read it once with fresh eyes and fix what you find inline:

- **Placeholders**: any TBD, TODO, or half-written section.
- **Contradictions**: sections that disagree, or a drawing that doesn't match the parts under it.
- **Vague requirements**: anything not concrete and checkable.
- **Invented material**: anything in the document that no branch decided.
- **Ambiguity**: any requirement that could be read 2 ways. Pick one and say it.
- **The branch list**: every line ticked.

No second review. Fix and move on.

## 5. Show it and stop

Give the paths. The user reads and approves before anything is created from it.

**An objection is not new groundwork.** It reopens the one branch it came from, in `map.md`. Walk that branch, then rewrite the affected section.

Approved, with questions still open → one ticket per question: `flow new "<the question>" --type topic --body -`, the body saying what would settle it.

Approved, with work to cut → `/flow:tickets-from-spec`. **Never cut a work ticket from here.**

## Editing a spec that already exists

Same steps, scoped to what changed.

- **A behavior changed** → edit it in place. Never append a second version of it elsewhere.
- **A behavior was refused** → move it to `never`, with the reason. Never delete it.
- **The direction changed** → say plainly what it is now, in the section it belongs to. The old direction becomes a refused option under the new one, with why it lost.
- **A section was replaced wholesale** in a file too large to reread → leave one line saying what replaced it and where.

## What stays out

- the deliberation
- the options weighed and dropped mid-discussion
- the history of the conversation
- anything still open, which becomes a ticket

A reason that outlives the build goes under its decision. Everything else stays in `map.md`.

**No fact in 2 files.** One live copy, a pointer everywhere else. A decision resting on evidence (a research report, a prototype, a drawing) names it **inline, on that decision**, plus a short reference list at the end of the file. No global index.
