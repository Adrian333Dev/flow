# Explain-skill issues

Problems observed in how the `explain` skill gets *used* (distinct from the skill's own text, whose
fixes live in `shit-explanation_original.md` § "Fixes to make to the explain skill itself"). This file
is an ongoing log — append newest first. Each entry: what went wrong, root cause, the rule to apply.

---

## 2026-07-25 — the skill has no medium for proposals whose subject *is* the visuals

**Where:** the m28 palette step — proposing a calmer variant of the extension's Verdant/Ember tokens for
a full page. Outcome was accepted on the first pass ("not 10 out of 10 but good enough, let's proceed"),
but the skill as written did not permit the thing that worked.

**The gap.** The skill's diagram rules say: *"Structural ASCII only. No SVG, no mermaid, no HTML — too
slow and expensive to generate, or unreadable without a renderer."* For **structure** that rule is right
and proven — the m28 layout frames are the best output this skill has produced. But it makes an entire
class of proposal unproposable: anything whose subject is **color, shade, density, elevation, or type
weight**. ASCII cannot carry any of those. Obeying the rule literally forces the proposal into prose,
which is precisely the failure already logged as Case 3 in `shit-explanation.md`. So the skill's own
constraint pushes toward its own documented failure mode whenever the topic is visual rather than
structural.

**What worked instead:** one self-contained HTML file written to the project `temp/` folder and opened
from the filesystem in a browser. Not the Artifact tool, not published, no server, no build.

**What kept it cheap** (single file, ~200 lines, one round, no iteration):

- **Render the full page at realistic scale, not isolated components or swatches.** The user's reason:
  small components cannot tell you whether a *page* reads calm. This is the same failure as describing
  layout in prose — a swatch strip shows you colors but not the thing you are judging. Related: the
  extension's popups are judged sitting over the YouTube frame, whereas this page is judged as a page,
  so the two need different framing entirely.
- **Real content, no lorem, no placeholders** — actual section names and control labels, same discipline
  that made the ASCII frames work.
- **The tokens are the deliverable, so they sit at the top of the file as named CSS custom properties**,
  each with a comment saying what it is for, plus a header comment listing the *loud* values being
  replaced. The file doubles as the thing that gets copied into the real stylesheet.
- **One theme toggle** (nine lines of inline JS) to cover both palettes instead of two files.
- **Static markup with trivial inline `onclick` class flips** for the toggles, so controls feel real
  without a framework.

**Sequencing that mattered:** the ASCII frame and the HTML preview are complements, not competitors. The
frame settled the layout first; the HTML then dressed an already-agreed layout in color. Doing color
first would have put two undecided things in one artifact and made the feedback unattributable.

**Candidate rules to apply:**

1. **Add a medium-selection step before drawing anything.** What is being judged picks the medium:
   relationships, hierarchy, containment, flow, proportion → **structural ASCII**. Color, shade, density,
   elevation, type weight, spacing feel → **a local self-contained HTML file in `temp/`**, opened from
   disk. Never prose for either.
2. **Soften "no HTML" to "no HTML for structure."** Keep the ban where it earns its keep (structure
   renders instantly as ASCII everywhere, including in a diff); lift it where ASCII physically cannot
   represent the subject.
3. **When HTML is the medium, require full-page scale, real content, and the design tokens as the file's
   own top-level variables.** These are what made one pass sufficient.

---

## 2026-07-25 — invented words used as if already defined

**Where:** the m28 admin-page layout proposal. The overview frame landed well; the *second* frame — a
grid whose rows were History / Summary / Nudge — did not. The user: "I didn't really understand what
the hell that was exactly, I didn't understand the purpose of it." The offending paragraph:

> "**Panels** is the one section that isn't a **straight port**. History, Summary and Nudge each have
> the identical three controls today, written out as three **near-duplicate blocks**. As a matrix it
> becomes one glanceable thing, and a fourth panel later is one row instead of another block."

**Root cause:** three terms invented on the spot and used as though the reader already had them.

- **"Panels"** — a section name I made up that turn. Never said it meant *the three popups other than
  the orientation card* (history panel, video summary, catch-up nudge).
- **"straight port"** — my private shorthand for "the other seven sections only get restyled, this one
  changes shape." Never unpacked, so "isn't a straight port" carried no information.
- **"near-duplicate blocks"** — described the *current* settings page, which was never shown. The
  reader was asked to appreciate a fix to a layout they had never seen.

Also missing: the **nine settings** the grid holds (3 popups × 3 controls) were never enumerated, so the
grid's cells had no referent, and the *purpose* (comparing one control across popups, which is the
question you actually ask) was stated only as "one glanceable thing."

Note this is the same failure as `shit-explanation.md` Cases 1 and 2 — writing at my own altitude — but
it survived *inside* an otherwise successful `explain` run. Invoking the skill did not catch it: the
first frame's components were all defined from zero, the second frame's were not.

**What fixed it:** name the three popups as physical things, list the three controls each one has, state
the count (nine), render *today's* three-block layout as its own verified frame so the "before" exists,
then show the grid as the "after" and say what question it answers faster. Plus dropping the invented
shorthand entirely — "not a straight port" became "this is the only section where I'm changing the shape
of the UI, not just its looks."

---

## 2026-07-25 — ASCII diagrams render misaligned when cramped

**Where:** the M2 side-panel re-explanation. The browser-frame diagram had vertical borders (`│`) that
did not line up into straight columns — the connectors (`├ ┼ ┬`) and the `│` above/below them landed
at different character offsets, so the "frame" looked crooked. Example of the crooked output:

```
┌───────────────────────────────────────────────────────────┐
│  ...   [ youtube.com/watch?v=... ]        🧩  [D] ⚙  │   ← right border drifts left of the ┐ above it
├──────────────────────────────────────────┬────────────────┤
```

**Root cause (user's diagnosis):** not reserving enough horizontal width for the drawing. When the
diagram is a scale model of something real (a browser window), cramming it into a narrow width forces
uneven interior spacing and the columns drift out of alignment. A secondary cause: overloading an
interior region with too many words (the side-panel box crammed "docks here / full height / right edge"
under one bracket) so it reads as messy noise.

**Rules to apply:**

1. **Reserve generous width — err wide.** Give the diagram noticeably more horizontal room than feels
   necessary (roughly +50%). Cramped is exactly where misalignment happens.
2. **Lock every vertical border to a fixed character column.** For each vertical line in the figure, the
   `│` and its connectors on other rows — left edge `┌ ├ └`, right edge `┐ ┤ ┘`, interior divider
   `┬ ┼ ┴` — must all sit at the *same* column index top-to-bottom. Count columns; do not eyeball.
3. **Don't overload interior labels.** If a region needs several descriptors, put them on their own
   lines (list style) or trim to the one essential word. Many words jammed under one bracket = noise.
4. **Prefer no diagram.** (Carried over from the skill's own fixes.) If prose explains it, skip the
   figure. A misaligned diagram is worse than none — it distracts from an explanation that otherwise
   worked. The M2 re-explanation succeeded on the *prose*; the diagram only added a defect.
