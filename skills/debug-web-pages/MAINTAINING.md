# Maintaining debug-web-pages

This skill is expanded **often** — every investigation can add to it. That makes
it prone to the two ways a growing skill dies: **sediment** (stale layers pile up
because adding feels safe and removing feels risky) and **sprawl** (simply too
long). This doc is the discipline that keeps it healthy. Read it before any
structural change (a new mode, a new knowledge file, promoting/pruning content).

## Manage churn by separating content by how often it changes

- **Stable core — `SKILL.md`.** The loop + mode selection + pointers. Changes
  rarely. It's the predictability anchor: keep investigation detail **out** of it.
  If you're tempted to add specifics here, they belong in a knowledge file.
- **Slow shared knowledge — `knowledge/*.md`** (`capturing-and-querying`,
  `live-experiments`, `investigation-patterns`). Edit only when you learn a
  *general* tactic that applies across pages.
- **High-churn, append-only, isolated — `knowledge/domains/<page>.md`.** One
  independent file per page. Adding or growing one **touches nothing else** — no
  `SKILL.md` edit, no merge risk. This is where routine growth goes.

## Where new knowledge goes

- A fact about **one page** → its `domains/<page>.md` (create from `_TEMPLATE.md`).
- A tactic that helped on **one page but is general** → the matching shared file.
- A brand-new **capability/mode** → new `scripts/` script(s) + one knowledge file +
  a mode entry in `SKILL.md`. This is the only change that touches the core.

## Two rituals

- **Promotion.** When the same tactic appears in **≥2 domain files**, lift it into
  the relevant shared file (its single source of truth) and leave the domains
  pointing at it. Do this *before* it spreads to a third.
- **Pruning.** Periodically pass every file for **relevance** (does this line still
  bear on what the skill does?) and **no-ops** (would the agent already do this by
  default? then it's costing tokens to say nothing). Delete aggressively — sediment
  is the *default* outcome without this pass, not an edge case.

## Domain-file hygiene

Domain files are trusted by future runs, so: **verified findings only** (mark
guesses as open questions), **dated**, and **cite the source** (bundle name or
session). Prefer a handler's `handlerHash` / css-path over prose.

## Writing style (keeps sprawl out)

- **Prompt the positive.** State the target behavior; don't steer by prohibition
  (naming the bad behavior makes it more available, not less). Keep a "don't" only
  as a hard guardrail you can't phrase positively — and pair it with the do.
- **Single source of truth.** One authoritative place per fact, so a behavior
  change is a one-place edit.
- **Reach for leading words** — a compact term the model already knows (a *probe*,
  a *bundle*, the *loop*) beats a restated phrase, and anchors behavior in fewer
  tokens.

## Scope

This is a project-local Claude Code skill, unrelated to superpowers. Its future
packaging (converting into a hostable multi-skill repo) lives in
[`ROADMAP.md`](ROADMAP.md) — don't build that until it's warranted.
