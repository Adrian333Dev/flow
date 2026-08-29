---
name: cut-from-spec
description: Cuts the next batch of work out of `docs/spec/` into tickets.
disable-model-invocation: true
---

# Cut from spec

**Work from `docs/spec/` and this file alone.** Months pass between runs, and the groundwork that produced the spec is long gone from context.

## What gets a ticket

**Only behaviors marked `V1` in `product.md`.** Everything marked `next`, `later` or `never` stays prose.

A ticket is a commitment to build, so one cut from a `later` behavior fills the pool with work nobody agreed to do. To promote a `next` behavior, edit its mark in `product.md` first. **Never edit a mark to justify a ticket already created.**

## Cutting the work

One ticket per unit of work — something a session can pick up, plan and build without waiting on a decision nobody has made.

- A behavior needing an unmade decision is still one ticket. The decision gets made at pickup, in that ticket's own `groundwork/`.
- A behavior too big for one pickup gets a parent ticket plus children carrying `parent:`. The parent keeps only what no child holds — the wiring, the test that covers them together — and `flow` withholds it until they close.
- **Record order that matters as `deps`.** Sequence in the spec file carries none.

## Writing each one

Create and fill in one command — never create, then edit:

```bash
flow new "Title" --type feature --deps t045 --body - <<'EOF'
What changes and why. One paragraph, from the spec section this came from.

## References

- `docs/context/<subject>.md` — what it settles, in a few words

## Done when

One observable check.
EOF
```

Each ticket carries:

- **What the spec says**, in the ticket's own words. Whoever picks it up will not re-read the spec.
- **A `## References` section** — whatever the spec section attached, plus the conventions this work has to respect: a research report, a file under `docs/context/`, a skill this work should reach for. One line each, the path then what it settles. A reference left only in the spec is a reference nobody follows.
- **A `## Done when`** naming something observable.

Never copy a whole spec section in. One live copy of anything — the ticket points at `docs/spec/product.md` for the full statement.

## After

Report the ids, the titles, and which spec sections are now covered. Then `flow next` shows what is workable.

Never annotate the spec with ticket ids. That mapping goes stale the first time a ticket is dropped, and `flow` already holds it.

!`flow overlays cut-from-spec`
