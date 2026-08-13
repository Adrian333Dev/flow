# Write the design

Read this when a brainstorm settled the **shape of a solution** — the parts and how they talk to each other.

**Always write one. Never skip it for being simple.** Sections scale down to a sentence each; the document does not disappear. A design nobody wrote is a design nobody can disagree with until it is already built, and simple-looking work is where unexamined assumptions cost the most.

**Write it in one pass, after the map closes.** The decisions were agreed while walking the map, so re-approving them section by section bills the same conversation twice.

## 1. Pick the file

The test: **is it still true after this is built?**

- **The thinking belongs to a ticket** → `brainstorm/design.md` in that ticket, beside the map. Read at pickup and during the build.
- **A loose brainstorm, feature-scoped** → `design.md` beside the map. The tickets it produced link to it.
- **It describes the system's shape and outlives the feature** → `docs/spec/tech.md`, via `write-prod-spec.md`. Not a separate file.

One file by default. A part that genuinely outgrows it gets its own file beside it, same rule as the map.

**Not this file's job:** how a library ended up bent out of shape, written after the build so the next person can change it. That is a durable project fact — `docs/context/<subject>.md`, written by `execute`.

## 2. Write it

Sections in this order. Scale each one to what it carries — a sentence where the answer is obvious, a few paragraphs where it is not.

1. **The goal** — one paragraph a stranger can follow.
2. **Scope** — what is in, and what is out. Both named.
3. **The shape** — **invoke `visualize`** and draw it. At least one drawing, before any part is described. This rule stops one thing: a section headed "architecture" with no picture under it.
4. **The parts** — what each one owns, and what it depends on.
5. **The contracts between them** — the actual shapes, signatures and events, concrete wherever they were decided.
6. **The data flow** — one real operation followed end to end, part by part. This is where a design that looks fine as a diagram falls apart.
7. **How it fails** — the error paths, and what happens on each.
8. **How it gets verified** — what is tested, at what level, and what "working" looks like. A design with no verification section produces a build nobody can call finished.
9. **What is locked** — each decision, and what would overturn it.

**Write every requirement concrete and checkable.** "Fast", "robust", "user-friendly" are not requirements.

## 3. Review it yourself

Before showing it, read it once with fresh eyes and fix what you find inline:

- **Placeholders** — any TBD, TODO, or half-written section.
- **Contradictions** — sections that disagree, or a drawing that does not match the parts described under it.
- **Vague requirements** — anything not concrete and checkable.
- **Invented material** — anything in the document that no branch decided.
- **Ambiguity** — any requirement that could be read two ways. Pick one and say it.

No second review. Fix and move on.

## 4. Show it and stop

Give the path. The user reads and edits before anything is built from it.

**An objection is not a new brainstorm.** It reopens the one branch it came from, in `map.md`. Walk that branch, then rewrite the affected section.

## What stays out

The reasoning · the options rejected and why · the history of the discussion · anything still open.

All of that lives in the map. The design says what the thing **is**.

A decision resting on evidence — a research report, a prototype, a drawing — names it **inline, on that part**, plus a short reference list at the end. No global index.

## Hard rules

- **Always write one when a solution's shape was decided.** Simple means a short design, never no design.
- **Write it in one pass, after the map closes.** Never section by section for approval.
- **At least one drawing.**
- **Every design says how it is verified.**
- **No reasoning, no rejected options** — those live in the map.
- **Nothing still open goes in.** An unresolved branch means the map is not closed.
