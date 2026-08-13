# Write the product spec

Read this when a brainstorm decided something about **what the product is** — a behavior, a constraint, a direction. It creates `docs/spec/` if there is none and edits it if there is. A ticket-sized brainstorm that turns up a new direction lands here too; there is no size gate.

## What the spec is

Two files, markdown only.

- **`docs/spec/product.md`** — the whole product. Every behavior, every version, plus what is in and out.
- **`docs/spec/tech.md`** — stack, repo layout, high-level components, the decisions that constrain implementation.

**`product.md` is the whole product, not the part being built next.** Scope the *building*, never the *writing* — a spec that opens "ship phase 1" and pushes the rest out of scope loses every phase after the first.

## Every behavior is marked

`V1` · `next` · `later` · `never`. Nothing is dropped for being far off.

- **V1** — ships first. The only mark tickets are created from.
- **next** — committed, not yet.
- **later** — wanted, no commitment.
- **never** — deliberately refused. Kept because "why not X" comes back otherwise.

**This is the exit condition.** The spec is finished when every behavior carries one — not when the thinking feels done.

## Before writing

1. **Re-read `map.md`.** Open `[ ]` branches → name them and confirm they are deferred, or go back and walk them. A spec written over an open branch buries it.
2. **Read the code**, for anything not greenfield: the files this touches, the types and schemas named, the patterns to follow. A contradiction with a settled decision → raise it and reopen that branch. Never quietly write around it.

## Writing — three passes

One pass over a large map drops behaviors silently, and "every behavior is marked" cannot be checked if nobody ever listed them.

1. **List.** Walk the map branch by branch, one line per behavior with its mark. Nothing else, no prose. A 5,000-line map is maybe 120 lines of this. Several map files → one at a time.
2. **Write.** `product.md`, then `tech.md`, section by section, ticking each line off as it lands. Save as each section completes.
3. **Verify.** Every line ticked. An unticked line is a behavior that vanished.

`product.md`:

- What the product is, in a paragraph a stranger can follow.
- Every behavior, grouped how the product is actually shaped — by surface, by job, by whatever the map used. Each carries its mark.
- What is on `next`, `later` and `never`, as prose, and why.

`tech.md`:

- Stack, and what each piece is for.
- Repo layout — the folders that exist and what lives in them.
- High-level components: backend, frontend, services, workers, packages. What each owns.
- The decisions that constrain implementation, with the reason attached.
- **A drawing of the system's shape** — **invoke `visualize`**. Components and how they talk do not survive as sentences.

**Requirements are concrete and checkable.** "Fast", "robust", "user-friendly" are not requirements.

## Editing a spec that already exists

Same three passes, scoped to what changed.

- **A behavior changed** → edit it in place. Never append a second version of it elsewhere.
- **A behavior was refused** → move it to `never` with the reason. Never delete it; deleting is how "why not X" comes back.
- **The direction changed** → say plainly what it was and what it is now, in the section it belongs to. The spec states the present, so the old direction leaves only as much trace as `never` needs.
- **A new subject genuinely doesn't fit either file** → a third file, only when all three hold: no fact appears in two files, the boundary is statable in one sentence, and it is not a section of an existing file. Otherwise it is a section.

## Forbidden outright

`decisions.md` · `open-questions.md` · a `README.md` index · frontmatter · copied artifacts · history · the reasoning behind a decision.

Reasoning lives in the map. The spec says what the product **is**.

A decision resting on evidence — a research report, a prototype, a drawing — names it **inline, on that decision**, plus a short reference list at the end of the file. No global index.

## Then

1. **Self-review before showing it.** Placeholders, internal contradictions, vague requirements, anything invented that no branch decided. Fix first.
2. **Show the paths and stop.** The user reads and approves before anything is created from it.
3. **Approved and there is work to cut** → `write-tickets`.

## Hard rules

- **Every behavior carries a mark.** An unmarked behavior is an unfinished spec.
- **List, write, verify.** Never one pass over a large map.
- **The whole product goes in, at every version.** Never scope `product.md` to what ships first.
- **No fact in two files.**
- **Markdown only. No frontmatter, no index, no `decisions.md`.**
- **Never create a ticket from here** — that is `write-tickets`, after approval.
