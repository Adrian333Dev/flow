---
name: tickets-from-spec
description: Cuts the next chunk of planned work out of `docs/spec/` into tickets, earliest release first.
disable-model-invocation: true
---

# Tickets from spec

**Work from `docs/spec/` and this file alone.**

## What gets a ticket

**Only behaviors marked with a release (`V1`, `V2`…) in any file under `docs/spec/`, from the earliest release still holding a behavior no ticket covers.** `product.md` indexes the files. Everything marked `next`, `later` or `never` stays prose.

To promote a behavior, give it a release in its spec file first. **Never edit a mark to justify a ticket already created.**

**Skip a behavior a ticket already covers**, whatever its status, archived ones included. `grep -rl 'docs/spec/' .flow/tickets/` lists every ticket cut from the spec. Each names its section under `## References`. A dropped one → report it, never cut it again.

## Picking the next chunk

**Cut a chunk, never a whole release.** Building the first tickets changes the plan for the rest, so tickets cut far ahead go stale.

- **Pick what matters most next**: what the rest of the release builds on, then what the user most needs working.
- **Leave out what waits** on work neither built nor in this chunk.
- **Leave out what this chunk's build could change.**

Words after the command narrow the pick. Without them, decide.

## Cutting the work

One ticket per unit of work: something a session can pick up, plan and build without waiting on a decision nobody has made.

- A behavior needing an unmade decision is still one ticket. The decision gets made at pickup, in that ticket's own `groundwork/`.
- A behavior too big for one pickup gets a parent ticket plus children carrying `parent:`. The parent keeps only what no child holds (the wiring, the test covering them together). `flow` withholds it until they close.
- **Record order that matters as `deps`.** Sequence in the spec file carries none.

## Writing each one

Create and fill in one command. Never create, then edit:

```bash
flow new "Title" --type feature --deps exp-45 --body - <<'EOF'
What changes and why. One paragraph, from the spec section this came from.

## References

- `docs/spec/<file>.md` → `### <section>`: the behavior this cuts
- `docs/context/<subject>.md`: what it settles, in a few words

## Done when

One observable check.
EOF
```

Each ticket carries:

- **What the spec says**, in the ticket's own words.
- **A `## References` section**: the spec section first, then whatever it attached, plus the conventions this work has to respect: a research report, a file under `docs/context/`, a skill this work should reach for. One line each, the path then what it settles.
- **A `## Done when`** naming something observable.

Never copy a whole spec section in. Point at its spec file for the full statement.

## After

Report the ids, the titles, which spec sections are now covered, and which sections of that release are still uncut. Then `flow next` shows what is workable.

Never annotate the spec with ticket ids.
