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

## Case 2

> Good — I now have the real constraint map. The important discovery: there's already a **toolbar action popup** from m26 (the video-status banner + indicator toggle + settings gear), and it opens on toolbar-icon click *today*. That directly collides with the program's "open-on-action-click" plan, because Chrome can't do both a `default_popup` and open-the-panel on the same click.
>
> There's also a mechanical fact that matters a lot for the "toggle hotkey" requirement: **Chrome has no `sidePanel.close()` / no toggle API.** The *only* clean open/close toggle Chrome gives you is the native one you get from `openPanelOnActionClick: true` when the action has **no** popup. A `commands` hotkey can only `open()` the panel — it can't reliably close it.
>
> So the first real fork determines M2's scope. Let me put it to you.
>
> **Question 1 — What does the toolbar icon do, and what happens to the m26 status popup?**
>
> Three existing "chrome UI" surfaces exist today: the **settings page** (`options_ui`, moving into the panel — that's M2's core), the **m26 action popup** (video-status banner, indicator toggle, hotkey, settings gear — opens on icon click), and the dev **workbench** (stays separate).
>
> Since the panel can't co-exist with the popup on the same click, pick the model:
>
> - **A — Panel becomes the toolbar surface (my recommendation).** Retire the `popup` entrypoint; `openPanelOnActionClick: true` with no popup gives you a **native click-to-toggle** for free. The m26 status content moves into a small **Status strip at the top of the panel**...
> - **B — Keep the popup; panel opens via hotkey + gear only.** Smallest, truly "pure surface swap" M2...
>
> I lean hard toward **A**... Which way?

--- end of Case 2

## Why Case 2 is bad (diagnosis)

The failure is one thing: **jargon used as the load-bearing term was never grounded in the physical UI.** Symptoms:

- **The most-repeated phrase was never defined.** "Action click" / "open-on-action-click" appeared throughout, but the reader was never told it just means *"the user clicks the extension's icon in Chrome's toolbar."* The whole message pivoted on a term with no anchor.
- **Named abstract "surfaces" before establishing what they physically are.** "the `popup` entrypoint," "m26 action popup," "side panel" — three things listed as a set before the reader knew what any of them look like or where on screen they appear.
- **Led with the conflict before the two conflicting things existed for the reader.** "That directly collides…" lands only if you already hold both sides in your head.
- **Chrome-API identifiers dumped into the option text.** `default_popup`, `setPanelBehavior`, `openPanelOnActionClick`, `GET_VIDEO_STATE`, `actionBanner` — code-level names the reader couldn't yet parse, mixed into the decision they were supposed to make.

Root cause: same as Case 1 — writing at my own altitude (internal terms, API names) instead of grounding every concept in what the user actually sees on screen, at first use.

The fix that worked: a redraw that (1) named the three physical things — toolbar icon, popup bubble, side panel — and *where they sit on screen* before any jargon; (2) stated "clicking the icon does exactly one thing" as the plain rule; (3) only then introduced the collision and the toggle constraint; (4) kept all Chrome-API names out of the plain-language model. The user understood it immediately.

## Case 3

Proposing the admin-page UI (nav model + palette) entirely in prose:

> That makes **navigation the backbone decision**. Three models:
> - **Left nav rail + content pane (my recommendation).** A slim rail lists sections; clicking one shows it in the main pane. Two labeled groups — Settings and Developer…
> - **One long scrolling page with section headers.** Simplest… degrades into a wall as settings multiply.
> - **Top tabs.** Clean for 4–5 sections; gets cramped…
>
> …next I'll lay out the actual section taxonomy inside it. Which navigation model do you want?

Plus, in the same thread, proposing to reuse the extension's **overlay** palette on a full page.

## Why Case 3 is bad (diagnosis)

Two distinct failures:

- **A UI was proposed as text.** Layout, hierarchy, spacing, density, and — worst — *color and shade*
  cannot be conveyed in sentences. "A slim rail lists sections" gives the reader nothing to actually
  see; they can't tell if it's good, and can't react to a picture that isn't there. The user's words:
  "proposing a UI in a text format is plain up stupid… I'm having a hard time trying to visualize."
- **A design misjudgment that only a rendered view would have exposed.** The extension's popup palette
  is loud *because* it overlays the YouTube video and must grab attention. On a full page we own, that
  same loudness reads as noisy and cheap. Reusing it wholesale was wrong; the right move is a calmer,
  lower-energy variant of the *same* palette (softer surfaces, elevation layers, accent used sparingly
  for state). This is obvious the instant you render it, invisible while you describe it.

**Rule for next time — any UI proposal must be rendered, not described.** Build a self-contained HTML
mockup (inline CSS/JS) in `temp/`, and have the user open it in a browser. Interactive where it helps
(clickable nav, real toggles) so they can explore, not just glance. **Not** the Artifact tool, **not**
publishing — a local file. Reserve ASCII strictly for *pure structural* layout (box-in-box), never for
conveying visual design: color, shade, density, and hierarchy only survive as pixels.

## The fix that works: trigger `explain` more often

Observed pattern: **whenever the `explain` skill is actually invoked, the problem goes away.** So the fix is to make the agent reach for `explain` far more often — specifically, any time it's about to propose, pitch, or walk through a design or mechanism, not only when the user says "explain."

Candidate enforcement (for later):
- Custom agent instruction: "Before proposing or explaining any design, invoke the `explain` skill."
- Strengthen `explain`'s own description/trigger so the model auto-fires it on proposals.

## Fixes to make to the `explain` skill itself

1. **Diagrams are optional and often unnecessary.** The skill leans toward producing a diagram. Many good explanations (including the one that replaced Case 1) need zero diagrams. Make the default "prose, no diagram" more prominent; a diagram is the exception you reach for only when structure genuinely beats words.
2. **Drop the pervasive "1–2 sentence / 2–3 sentence" compression mandate.** The skill repeats "one-two sentences" all over, pushing the agent to force-compress even when the material needs room. Replace with: use as many sentences as the thing genuinely needs — no padding, but no artificial compression either. The whole-picture *opener* can be short; that shouldn't propagate into a compress-everything rule for the whole explanation.