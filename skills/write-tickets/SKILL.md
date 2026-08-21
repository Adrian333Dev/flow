---
name: write-tickets
description: Cut the next batch of work out of docs/spec/ into tickets. Reach for it when the ticket pool is empty or thin and the spec has work left in it, and right after a product spec is first approved.
---

# Write tickets

**Read cold.** Months pass between runs and the groundwork that produced the spec will not be in context. Everything needed is here or in `docs/spec/`.

## The rule that decides what gets a ticket

**Only behaviors marked `V1` in `product.md`.** Everything marked `next`, `later` or `never` stays prose.

A ticket is a commitment to build, so one cut from a `later` behavior turns an idea into an obligation and fills the pool with work nobody agreed to do. To promote a `next` behavior, edit its mark in `product.md` first — then it is V1, then it gets a ticket.

## Cutting the work

One ticket per unit of work: something that can be picked up, planned and built without waiting on a decision nobody has made.

- A behavior needing an unmade decision is still one ticket — the decision gets made at pickup, in that ticket's own `groundwork/`.
- A behavior too big for one pickup gets a parent ticket plus children carrying `parent:`. The parent keeps only what no child holds — the wiring, the test that covers them together — and `flow` withholds it until they close.
- Order that matters is `deps`, not sequence in the file.

## Writing each one

Create and fill in one command — never create, then edit:

```bash
flow ticket new "Title" --type feature --deps t045 --body - <<'EOF'
What changes and why. One paragraph, from the spec section this came from.

## References

- `docs/context/<subject>.md` — what it settles, in a few words

## Done when

One observable check.
EOF
```

Each ticket carries:

- **What the spec says**, in its own words. It is read at pickup by someone who will not re-read the spec.
- **A `## References` section** — the artifacts attached to the section it came from, plus the conventions the work has to respect: the research report, the prototype's finding, the design document, a file under `docs/context/`, a skill the work needs. One line each, the path then what it says. A reference left only in the spec is a reference nobody follows.
- **A `## Done when`** that names something observable.

Never copy a whole spec section in. One live copy of anything; the ticket points at `docs/spec/product.md` for the full statement.

## After

Report what was created: the ids, the titles, and which spec sections are now covered. Then `flow next` shows what is workable.

Nothing else changes. The spec is never annotated with ticket ids — that mapping goes stale the first time a ticket is dropped, and `flow` already holds it.

## Hard rules

- **V1 only.** Promote in `product.md` first, then create.
- **One command per ticket** — `flow ticket new … --body -`, never create-then-edit.
- **References travel with the ticket**, in a `## References` section.
- **Never copy a spec section wholesale into a ticket.**
- **Never edit a mark in `product.md` to justify a ticket you already created.**
