# Shit Explanations

## Case 1

I've got full grounding now — the locked 14e redesign, the catalog conventions, and the current skill structure. Here's the build plan. No files touched yet; I'll wait for your go.

## What we're building

The operational layer from the 14e redesign: one migration + two new skills. Everything else it locked (inbox model, altitude routing, no-taxonomy prose, review-step trigger) is _expressed inside_ these three artifacts.

```
capture-context  (migrate)  →  dumps raw to docs/work/inbox.md, no routing at capture time
organize         (new)      →  drains inbox → project files + appends to existing skills; flags homeless knowledge
curate-skills    (new)      →  build / restructure / prune skills
```

Dividing line baked into both new skills: **adding a line = `organize`; building or reshaping a skill = `curate-skills`.**

## Build order & scope

**1. Migrate `capture-context`** (mostly deletion + reframe)

- Rip out the capture-time routing — the "Where to write" table, the per-file "How to write" formats, the "During an active brainstorm" routing. All of that moves to `organize`.
- New core behavior: during work, dump _everything worth keeping_ — decision / finding / idea / reusable knowledge, all mixed — RAW into one file `docs/work/inbox.md`, scoped to the active topic. No destination decision. One exception preserved: an active `brainstorm.md`/`spec.md` owns its own in-progress content.
- Reframe the "always-on" language to **relaxed**: occasional reflex + user-promptable ("note that," "save that pattern"), not every-turn.
- CHANGELOG entry for the change.

**2. New `organize`** (inbound; the routing table lands here)

- Drains `docs/work/inbox.md` one item at a time; routes each to its home.
- Project-specific → project files (decisions → `docs/spec/decisions.md` or `docs/decisions.md`; findings → `docs/notes/<topic>.md`; backlog → `docs/work/backlog.md`; preferences → `docs/preferences.md`), deferring to existing structure — this _is_ capture-context's old table, moved and updated for the flow scaffold.
- Reusable → append a prose line to a skill that **already exists**, chosen by **altitude** (tool quirk → tool skill; framework pattern → framework skill; broad principle → concept skill; integration gotcha → source-tool skill + a pointer from the other). One home, pointers elsewhere, never duplicate, never a tool-combo skill.
- Reusable with **no home skill** → **flag it** ("needs new skill: X") and move on. Never stub-creates mid-drain.
- CHANGELOG + plugin.json + README registration.

**3. New `curate-skills`** (works on the library; deliberate)

- Three jobs: create a skill, restructure one, prune one.
- Carries the anatomy standard (Branch #1: `SKILL.md` the only invariant, smallest-shape-that-works, load-frequency split) and the collapsed janitor rules — prune only what's **wrong or outdated** (never "just an opinion"); promotion (a tactic in ≥2 instance files → lift to the shared file); hygiene (verified / dated / cited); writing style (prompt the positive, single source of truth, leading words).
- Delegates the actual authoring mechanics to the existing skill-authoring skill rather than restating them.
- CHANGELOG + plugin.json + README registration.

**4. Wiring**: `plugin.json` (+organize, +curate-skills), README Skills list (both), and a one-line mention of `inbox.md` where the flow template documents `docs/work/`.

## Open points — my calls (veto any)

- **Checkpoint mode stays in `capture-context`.** Session-state writing (`session.md`) is a distinct, still-valid function; the redesign killed the _routing_, not the checkpoint. Keep it, lightly cleaned.
- **`inbox.md` is created lazily** (first capture), not shipped as an empty stub — matches the existing "create files lazily" rule.
- **Both new skills are model-invoked** (no `disable-model-invocation`) so the agent can reach for them at the right moment; both also work as `/organize` and `/curate-skills`.
- **`curate-skills` references the existing `write-a-skill` skill** for authoring mechanics. I'll confirm its exact name/origin at build time before wiring the reference.
- **The review-step trigger is deferred** (that phase is undesigned). `organize` ships user- and model-invocable now, with a short note that automatic invocation-at-review is TBD — no dependency on the unbuilt review phase.

**Out of scope this round:** review-phase design, audit, grill-mode, harvesting the delapse/framework-build knowledge into skills. Separate threads.

Approve and I'll build in that order (capture-context → organize → curate-skills → wiring), then hand you the git state for commits.

--- end of Case 1

## Why Case 1 is bad (diagnosis)

The failure is one thing: **the internal design spec got handed over as if it were an explanation.** Symptoms, all present in Case 1:

- **Undefined jargon dump.** "altitude routing," "no-taxonomy prose," "load-frequency split," "flags homeless knowledge," "smallest-shape-that-works," "instance-cache," "leading words." Every one is an internal design term the reader was never given. These are notes-to-self, not words that explain anything to a person.
- **Telegraphic fragments.** "One home, pointers elsewhere, never duplicate, never a tool-combo skill." Compressed into a checklist for someone who already knows the design.
- **Assumes the whole design is already in the reader's head.** "Everything else it locked (…) is expressed inside these three artifacts" — only parseable if you're holding the entire 14e redesign in memory.
- **Shaped as a build checklist, not an explanation.** Build order / open points / wiring — documents WHAT to implement in implementer-shorthand instead of EXPLAINING the idea to a human first.

Root cause: writing the way I'd write a note to myself, then shipping it as the user-facing message.

## The fix that works: trigger `explain` more often

Observed pattern: **whenever the `explain` skill is actually invoked, the problem goes away.** So the fix is to make the agent reach for `explain` far more often — specifically, any time it's about to propose, pitch, or walk through a design or mechanism, not only when the user says "explain."

Candidate enforcement (for later):
- Custom agent instruction: "Before proposing or explaining any design, invoke the `explain` skill."
- Strengthen `explain`'s own description/trigger so the model auto-fires it on proposals.

## Fixes to make to the `explain` skill itself

1. **Diagrams are optional and often unnecessary.** The skill leans toward producing a diagram. Many good explanations (including the one that replaced Case 1) need zero diagrams. Make the default "prose, no diagram" more prominent; a diagram is the exception you reach for only when structure genuinely beats words.
2. **Drop the pervasive "1–2 sentence / 2–3 sentence" compression mandate.** The skill repeats "one-two sentences" all over, pushing the agent to force-compress even when the material needs room. Replace with: use as many sentences as the thing genuinely needs — no padding, but no artificial compression either. The whole-picture *opener* can be short; that shouldn't propagate into a compress-everything rule for the whole explanation.