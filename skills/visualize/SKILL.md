---
name: visualize
description: ALWAYS invoke before conveying structure, architecture or layout — never describe them in prose. Draws the artifact: ASCII diagram, screen mockup, HTML preview. Triggers on proposing an architecture, showing how components relate, showing a screen, comparing two designs, any pipeline or file tree — in a message and equally inside a spec, design document or plan. Baseline prose rules apply to every answer and live in the global CLAUDE.md, not here.
---

# Visualize

Pick a medium, draw the artifact, check it.

The rules that govern *every* answer — whole picture first, define from zero, no undefined shorthand, priority order, no preamble — are in the global CLAUDE.md and already active. They are not repeated here. This file is the machinery for the cases where sentences alone can't do the job.

Everything you need is in this one file. Read it fully, then produce.

## When to reach for this

- Proposing a design large enough that its shape has to be seen.
- Anything visual: layout, hierarchy, density, colour, elevation, type weight.
- A mechanism where structure genuinely beats sentences.
- **Writing a spec, a design document or a plan.** These are read by the user, so the same rule binds: a section describing an architecture, a layout or a flow carries a drawing.

Not for ordinary answers. Those obey CLAUDE.md and cost nothing extra.

## Cost

Ordinary explanation stays fast — it fires constantly, and slow output is itself a failure.

A rendered artifact is different and earns its cost. An HTML preview takes several internal rounds and cannot happen in a minute. Budget for that; don't rush it into a broken picture. A frame is cheaper — draw it right the first time by following the mechanics below, and never break the flow of a discussion to go check one.

## Choosing the medium

Decide this **before** drawing anything. Picking wrong is the most expensive mistake in the file.

- **Prose** — a rule, a reason, a sequence of events. The default.
- **A list** — several items with the same shape and role, compared. Preferred over a table.
- **ASCII** — structure, ownership, flow, containment.
- **ASCII frame** — layout and proportion of a real screen. The scale model below.
- **HTML preview** — colour, shade, density, elevation, type weight, spacing feel.

**ASCII first.** Especially for layout. Settle structure in a frame, then dress it in colour. The two are complements, not competitors — colour first puts two undecided things in one artifact and makes the feedback unattributable.

Reach for HTML earlier only when the component is complex enough that ASCII genuinely cannot carry it. Judgment call, ASCII as the default.

**Say what the medium cannot carry.** "This frame is structure only — the palette is a separate step." One sentence keeps the missing dimension a named next step instead of faked or silently skipped, and tells the reader exactly which parts they are being asked to judge.

## Diagram rules — every diagram, including invented ones

- **Prose first.** Draw only when structure genuinely beats text.
- **No SVG, no mermaid, no HTML for structure.** ASCII renders instantly everywhere — chat, file, diff. HTML is for the visual dimensions ASCII has no way to express.
- **One idea per diagram.** Needs a legend, or a second idea creeping in? Split. Big structure: an overview carrying the backbone only, plus separate detail diagrams.
- **Split overview from detail.** One frame answers "what is the navigation model." A second, small one answers "what does the redesigned section look like." Neither then needs a legend.
- **Spacious.** Few boxes (~5–6 per idea), a blank line inside boxes between title and content. Cramped is where misalignment happens and cramped is unreadable anyway.
- **Everything defined above it.** No element appears that the prose didn't already define.
- **Plain labels.** No internal codes. Label arrows with what actually flows — `play()`, "plain text". An unlabeled arrow is a guess the reader has to make.
- **The five-second test.** The one idea lands near-instantly, or the diagram failed. Simplify or split.
- **Dynamics go in prose.** Interactions and message flows are short prose steps. When the *direction* of flow is itself the idea, a layered stack with labeled directional arrows carries it.

## ASCII mechanics

### Character set — this is not style, it is correctness

Allowed: **ASCII**, the light box-drawing set `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`, and the solid arrows `▲ ▼ ▶ ◀`.

Widgets are ASCII only: `[x]` `[ ]` `(*)` `( )` `>` `v`.

**Never** `● ▌ ▸ ▾ ■ ━ · … → —`. These are East-Asian-Ambiguous or wide: they can render two columns instead of one, silently shifting every column to their right and destroying an otherwise correct frame. The source looks fine; the render doesn't. Inside a frame use `...`, `->` and `-` in place of `…`, `→` and `—`; em dashes stay fine in prose.

### Alignment

- **Reserve generous width** — err about 50% wider than feels necessary. Cramped frames are where drift starts.
- **Lock every vertical border to a fixed column.** For each vertical line, `│` and its connectors `┌ ├ └ ┐ ┤ ┘ ┬ ┼ ┴` all sit at the same character index, top to bottom.
- **Don't overload interior labels.** Several descriptors go on their own lines, or get trimmed to one word each. Overstuffed rows are what force the frame narrow.

## Mockups — the scale model

A screen mockup is a **model of the real screen**, not a parts list. That is where its value comes from and what the rules below protect.

- **Proportion is real.** The divider sits where it would actually sit. The reader gets density and balance, which is most of what "is this layout any good?" means and exactly what no sentence delivers.
- **Nesting carries hierarchy.** Two depths of box, no legend needed.
- **Real strings, never placeholders.** `Playback speed`, not `<setting>`. Real strings are checkable, reviewable, and they expose a label that doesn't fit.
- **No "after" without a "before" the reader has seen.** Never ask someone to appreciate a fix to a layout that was never rendered. The current state gets its own verified frame first.

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                           [x]  │
├───────────────────┬──────────────────────────────────────┤
│                   │                                      │
│  General          │   Playback speed                     │
│  Playback         │   [ 1.0x ]  [ 1.25x ]  [ 1.5x ]      │
│  Voices           │                                      │
│  ─────────────    │   Skip silence          (*) on       │
│  Developer        │                         ( ) off      │
│                   │                                      │
└───────────────────┴──────────────────────────────────────┘
```

## HTML previews

For colour, shade, density, elevation, type weight — the dimensions ASCII has no way to express. One self-contained file in `tmp/`, opened from disk in a browser. **Not** the Artifact tool, **not** published, no server, no build step.

**Needs the running stack** — real components, real data at volume, motion → build a `prototype`.

**Never show one variant.** A lone theme gets approved by default. Show two or three, same page, same content.

What makes it cheap — one file, ~200 lines, one round with the user:

- **Full-page realistic scale.** Not swatches, not isolated components. A swatch strip cannot tell you whether a *page* reads calm.
- **Real content.** No lorem, no placeholder labels. Same reason as the frames.
- **Design tokens as named CSS custom properties at the top**, each commented, plus a header comment listing the loud values being replaced. The file then doubles as what gets copied into the real stylesheet.
- **One nine-line theme toggle**, not two files.
- **Static markup with trivial inline `onclick` class flips** — controls feel real without a framework.

## Structure — adapt it, don't fill it in

No fixed template. Structure follows from what is being explained and what the reader will do with it. The proven default **for a design proposal**:

> the proposal itself → components defined from zero → one whole-picture diagram → the load-bearing rule, with depth → key interactions as short prose steps → "what you're deciding"

Other shapes adapt. A *mechanism* explanation ends with "what this means for us," not decision points. A *comparison* leads with the recommendation and differentiates options only on the axes that matter. A *walkthrough* orders by time. Reshape freely.

Use the sentences the material actually needs — no padding, and no artificial squeezing. Only the opener is deliberately short.

## Pattern vocabulary — a menu, not a template

Proven layouts. Pick one, combine several, or invent a better-fitting layout — the rules above bind whatever you invent.

### Layered stack

**When:** components with ownership and command/data flow — "who owns what, who tells whom."
**How:** one box per layer (name + tech, an `owns:`/`state:` line inside); arrows labeled with the actual calls or data; where flow is two-way, separate the directions — that asymmetry is often the whole point.
**Failure:** more than ~3 layers, or crossing arrows. Split, or zoom into one seam.

```
┌─────────────────────────────┐
│         UI  (React)         │
│                             │
│  state: cart / products     │
└─────────────────────────────┘
      │ addItem(id)      ▲ cart changed
      ▼                  │
┌─────────────────────────────┐
│        CART SERVICE         │
│                             │
│  owns: pricing / totals     │
└─────────────────────────────┘
```

### Pipeline

**When:** input transforms through stages.
**How:** vertical; arrow labels are the data between stages; a short annotation beside each box says what it does. The reader follows the labels and watches the data change shape.
**Failure:** stuffing a stage's internals into the overview — an interesting stage gets its own diagram.

```
   raw markdown
        │
        ▼
 ┌──────────────┐
 │    RENDER    │   strip syntax, keep the words
 └──────────────┘
        │  plain text
        ▼
 ┌──────────────┐
 │   SEGMENT    │   cut into sentence-sized chunks
 └──────────────┘
```

### Timeline / parallel lanes

**When:** concurrency, scheduling, latency — anything where *when* and *overlap* are the idea.
**How:** time flows right; one lane per actor; blocks mark activity spans; annotate the one thing to notice.
**Failure:** structural boxes inside a timeline, or two time scales in one picture. Structure and timing are two diagrams.

```
time ─────────────────────────────────────▶

chunk 1   │synth│ PLAY ▶▶▶▶▶▶│
chunk 2         │synth│       PLAY ▶▶▶▶▶▶│
chunk 3                │synth│             PLAY ▶▶ ...

           the user only ever waits for chunk 1's synth
```

### Aligned axes

**When:** two representations of one thing that must map onto each other — source and derived, text and time.
**How:** stack the two; vertical alignment *is* the mapping; mark only the interesting correspondence and let the boring 1:1 cases just line up.
**Failure:** three or more representations at once. Chain two diagrams.

```
ON SCREEN:   ┌───┐ ┌──────┐ ┌────┐ ┌────────┐
             │ I │ │ paid │ │ $5 │ │ today. │
             └───┘ └──────┘ └─┬──┘ └────────┘
                              │  one screen token -> two spoken words
                              ▼
SPOKEN:       "I"   "paid"    "five dollars"   "today"
```

### Tree

**When:** hierarchy or containment — file layouts, nesting, decision trees.
**How:** indented text tree with inline annotations. Almost never boxes — indentation says containment cleaner than boxes inside boxes.

```
core/
├─ pipeline/    render -> segment -> synthesize
├─ playback/    the controller (no React here)
└─ cache/       content-key -> audio + timings
```

### Side-by-side

**When:** comparing two options or states.
**How:** two columns, same skeleton so the differences pop; verdict labels up front so the headers alone tell the story.
**Failure:** if the columns are just attribute rows, nothing is being drawn. Use a list.

```
   TIMER IN REACT (drifts)          CONTROLLER-DRIVEN (exact)

   setInterval guesses the           the audio clock IS the
   position on schedule              position: read, not guessed
```

## Worked example — stripped excerpts, NOT the full artifact

What scored 10/10 was a **complete ~80-line explanation** from a read-aloud-app brainstorm (playback-architecture proposal; user profile "strong React, no browser-audio background"), produced after four earlier attempts at the same material failed on wrong calibration, missing whole picture, and unreadable diagrams. Below are only its key moves. The full version also defined the *other* component the same way, wrote out both key interactions as prose steps, and closed with its two decision points — that completeness is part of why it scored. A real explanation has no gaps between these moves.

**The opening — the whole picture, before any part:**

> Playback lives entirely outside React. A plain TypeScript module — the **playback controller** — plays the sound and tells React which word is active, every frame. React draws what it's told and never calculates the highlight itself.

**A component defined from zero** (the user is a React expert — but this module is ours, so it's new; the one unfamiliar tech term gets defined by its abilities):

> **Playback controller** — a plain TS module, no React anywhere in it. It owns the **audio clips** (one per chunk, already synthesized) and the **timing table** (for every word: which clip it lives in, at which millisecond). It plays the clips through the **Web Audio API** — the browser's built-in sound engine. We need it for exactly three abilities a plain `<audio>` tag doesn't have: an exact playback clock, gapless back-to-back playback, starting any clip at any millisecond.

**The whole-picture diagram** — layered stack; the two-way asymmetry is the design:

```
┌────────────────────────────────────┐
│         UI LAYER  (React)          │
│                                    │
│  state:  words[] / activeWordIndex │
│  draws:  word list / controls      │
└────────────────────────────────────┘
      │                        ▲
      │ commands               │ the active word
      │                        │
      │ play() / pause()       │ setActiveWord(n)
      │ seekToWord(n)          │ every frame
      │ setSpeed(x)            │
      ▼                        │
┌────────────────────────────────────┐
│  PLAYBACK CONTROLLER  (plain TS)   │
│                                    │
│  owns:  audio clips / timing table │
└────────────────────────────────────┘
                  │
                  │ schedule clips / read the clock
                  ▼
┌────────────────────────────────────┐
│           WEB AUDIO API            │
│   (browser built-in sound player)  │
└────────────────────────────────────┘
```

**The load-bearing rule, with depth** — the one non-obvious idea gets the why and the failed alternative:

> **`activeWordIndex` is written by the controller — never computed in React.** The obvious alternative — a React-side `setInterval` advancing the word on schedule — drifts: browsers throttle and delay timers, so within tens of seconds the highlight and the voice visibly disagree. Web Audio's clock can't drift, because it isn't an estimate of the audio position — it *is* the audio position.

**The close:** key interactions as short prose steps ("Press play: the controller schedules the clips..."), then exactly two decision points ("Playback code fully outside React — OK?").
