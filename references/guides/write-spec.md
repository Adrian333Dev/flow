# Write the spec

**Not only for software**: a content pipeline, a business, a workflow get the same document. A signature or a schema below is the software case.

## 1. Pick the file

One test, asked of each decision: **does it outlive the thing being built?**

- **No, it dies with the build** → the ticket: its line in `ticket.md`, its reasoning in its `context.md` section.
- **Yes, and it belongs to one part of the product** → that part's file, `docs/spec/<part>.md`, both what the part does and how it is built. No file for the part yet → its section in `product.md`.
- **Yes, and it covers the whole product**: what it is, who it is for, the bets → `docs/spec/product.md`.
- **Yes, and it is a build decision every part shares**: the stack, the repo layout → `docs/spec/tech.md`.

Create `docs/spec/` where there is none. **`product.md` is the one file every spec has.** `tech.md` exists only once a build decision covers every part, so code projects usually have one and others never.

**A part gets its own file once both hold**: its boundary fits one sentence, and no fact would sit in 2 files. A part is whatever the product is actually built out of: a surface, a stage, a subsystem. A small product stays in `product.md`.

**`product.md` indexes every other spec file**, one line each: the path and what it holds. The line lands in the same edit that creates, renames or deletes the file.

**A decision carries its reason in the file it lands in**: `## 3`.

**Not this file's job**: how a library was bent out of shape, written after the build → `docs/context/<subject>.md`, by `/flow:execute`.

## 2. Editing a spec that already exists

- **A behavior changed** → edit it in place. Never append a second version of it elsewhere.
- **A behavior was refused** → move it to `never`, with the reason. Never delete it.
- **The direction changed** → say plainly what it is now, in the section it belongs to. The old direction becomes a refused option under the new one, with why it lost.
- **A section was replaced wholesale** in a file too large to reread → leave one line saying what replaced it and where.
- **A file was renamed, split or merged** → rewrite every ticket's `## References` line naming the old path, archived tickets included: `grep -rl 'docs/spec/<old>.md' .flow/tickets/`. Then the index line in `product.md`.

## 3. Every decision carries its reason

Written under the decision, in whichever file holds it.

- **The reason**: a line or two, dated. Longer reasoning stays in the ticket's `context.md`, named from the line.
- **What it makes harder**: a line, only where the decision has a cost the reader would not guess.
- **What was refused, and why**, under the decision it lost to.
- **The bets** → `product.md` → `## Bets`. A risk goes there too, with what happens if it fires.
- **What is still open** → a ticket each.

A ticket-sized call stays in the ticket.

## 4. Every behavior carries a mark

In whichever spec file holds it, one of 4:

- **A release, `V1`, `V2`…**: the release it ships in. The only mark tickets are created from. A first spec uses `V1` alone.
- **next**: committed, no release picked yet.
- **later**: wanted, no commitment.
- **never**: deliberately refused, with the reason on the same line.

## 5. What stays out

- the deliberation
- the options weighed and dropped mid-discussion
- the history of the conversation
- anything still open, which becomes a ticket

A reason that outlives the build goes under its decision. Everything else stays in the ticket.

**No fact in 2 files.** One live copy, a pointer everywhere else. A decision resting on evidence (a research report, a prototype, a drawing) names it **inline, on that decision**, plus a short reference list at the end of the file. No list of evidence across files.
