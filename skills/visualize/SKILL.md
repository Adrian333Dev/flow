---
name: visualize
description: ALWAYS invoke before conveying structure, architecture or layout — never describe them in prose. Draws the artifact: ASCII diagram, screen mockup, HTML preview. Triggers on proposing an architecture, showing how components relate, showing a screen, comparing two designs, a pipeline, a file tree, a lifecycle or flow, a schedule, a data model — in a message and equally inside a spec, design document or plan.
---

# Visualize

Pick the medium, pick the method, then draw it.

Most of this file is correctness. A drawing is either aligned or it is broken, and a broken one is worse than the prose it replaced.

## Pick the medium — prose, a list, ASCII, or HTML

Decide this **before** drawing anything. Picking wrong is the most expensive mistake in the file.

- **Prose** — a rule, a reason, a sequence of events. The default, and what an ordinary answer uses.
- **A list** — several items with the same shape and role, compared.
- **ASCII** — structure, ownership, flow, containment.
- **ASCII frame** — layout and proportion of a real screen → `refs/draw-mockups.md`.
- **HTML preview** — colour, shade, density, elevation, type weight, spacing feel → `refs/draw-mockups.md`.

**ASCII first, especially for layout.** Settle structure in a frame, then dress it in colour. Colour first puts two undecided things in one artifact, and the reaction cannot be attributed to either.

**Reach for HTML only where ASCII genuinely cannot carry the component.**

**Name what the artifact leaves out.** "This frame is structure only — the palette is a separate step." One sentence turns a missing dimension into a named next step instead of something faked or silently skipped, and tells the reader which parts to judge.

## How to draw it

Three methods, in order of preference.

- **Typed directly — 1–2k tokens.** The default, and correct for anything with few moving parts.
- **A generator, row by row — 2–3k tokens per round.** Build each output row as one string, then join. Right when every row is an independent horizontal slice, which a page mockup is.
- **A generator, on a canvas.** Allocate the whole picture as a grid of blank cells, then draw shapes by coordinate. Right when elements span many rows: a long connector, a tall container, anything nested. `scripts/canvas.js` carries the grid, the container convention and every check below.

Reach for a generator when the artifact is obviously complex, or when the typed attempt came out wrong. A dense mockup takes several rounds.

**Every generator checks itself before it prints.** The checks catch far more than rereading the output does:

- **Every write lands on the grid.** A coordinate past the edge fails immediately, instead of silently shortening one row.
- **Collision on write** — refuse to overwrite an occupied cell with a different character, with an explicit allowance where one element is meant to sit in front. This turns "do these two overlap?" into a failure at generation time.
- **A label fits the line it sits in**, checked before centring it into a connector or a box.
- **Equal row length**, wherever a row-by-row generator builds a frame.

## Diagram rules — every diagram, including invented ones

- **Prose first.** Draw only when structure genuinely beats text.
- **No SVG, no mermaid, no HTML for structure.** ASCII renders instantly everywhere — chat, file, diff. HTML is for the visual dimensions ASCII has no way to express.
- **One idea per diagram.** Needing a legend means a second idea got in. Split it: an overview carrying the backbone, then a small separate frame per detail, and neither one needs a legend.
- **Split wherever a connector outruns one screen.** This is the testable form of "keep it small" — a line whose two ends never appear together conveys nothing, so where it stops fitting is where the diagram divides.
- **Spacious.** Few boxes (~5–6 per idea), a blank line inside boxes between title and content. Cramped is where misalignment happens and cramped is unreadable anyway.
- **Everything defined above it.** No element appears that the prose didn't already define.
- **Plain labels.** No internal codes. Label arrows with what actually flows — `play()`, "plain text". An unlabeled arrow is a guess the reader has to make.
- **The five-second test.** The one idea lands near-instantly, or the diagram failed. Simplify or split.
- **Never draw a sequence diagram** — lifelines down the page with arrows between them. Draw the exchange as a vertical flow instead, one box per step with the actor named inside it. The user reads the sequence form with difficulty, and that is not an ASCII problem: the SVG version reads no better.
- **Dynamics go in prose.** Interactions and message flows are short prose steps. When the *direction* of flow is itself the idea, a layered stack with labeled directional arrows carries it.

## ASCII mechanics

### Characters — this is not style, it is correctness

Three tiers, each set by drawing the character and looking at it.

**Exact, safe anywhere:**

- Box drawing — `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`
- Arrowheads and markers — `▲ ▼ ► ◄ ▸ ▾ ● ■ ▪ ▌ ·`
- Rules and walls — `━ ¦ ‖ ╏ ╌`
- Punctuation — `… → —`

**Slightly over one cell — `◆ ◇ ☰ ❚ ⇆ ↻ ◁ ▷`. One per row at most, never several in a row, never in a border.** Each advances a fraction past its own cell, so one shifts nothing and twenty shift a whole column. A frame survives them only while every row carries the same count, which no frame guarantees.

**Broken — `▶ ◀ ∣ ❘ ❙ ⏸ ⏵`.** Each pushes every column to its right. Use `►` and `◄` in place of `▶` and `◀`. `⏸` and `⏵` are the subtle pair — aligned in a terminal, visibly off in a file. A diagram is read in all three places, chat, file and diff, so terminal-only is out.

Widgets are ASCII only: `[x]` `[ ]` `(*)` `( )` `>` `v`.

**Never predict a character from a property.** Width class, Unicode category and emoji capability all failed as predictors: `∣` matches `│` on every one of them and breaks anyway, and `▪` carries an emoji property and lands exact. **A character is safe once it has been drawn and looked at, and not before.** Using one that is not listed above means showing it to the user on its own first.

**Padding cannot rescue a wide character.** The renderer advances by each character's real width, which is fractional — a substituted one advances about 1.4 cells, and no whole number of spaces cancels four tenths. Tried, and it makes the frame worse.

### Connectors

- **A stroke arriving from below and turning right is `┌`, never `└`.** One wrong corner makes a whole diagram read as broken.
- **Label both ends of a long connector** — `from X` where it leaves, `to Y` where it lands. A connector running 40 rows carries nothing without it, because both ends are never on screen together.
- **At a crossing the vertical passes and the horizontal breaks.** Do it the same way every time and a gap in a horizontal line always means "something crosses here", never "this line ends". `┼` claims the opposite — that the two are joined.
- **Never draw a connector that starts and ends on the same element.** Work an element does to itself becomes a note beside it.
- **Labels ride inside the connector**, not on the row above. A label on its own row breaks a line it is not crossing.
- **Where several connectors merge, join them into one line** at the vertical midpoint of their sources, so no short stub runs the full height.
- **Arrows need not touch a box.** One column of clearance is enough, and junction characters where an arrow meets a box add nothing.

```
┌────────────┐                                                    ┌────────────┐
│  Web app   │ ─── to Search ─┐                   ┌─ from Cron ─► │   Cache    │
└────────────┘                │                   │               └────────────┘
                              │                   │
┌────────────┐                │                   │               ┌────────────┐
│   Queue    │ ───────────────│───────────────────│─ from Queue ► │  Metrics   │
└────────────┘                │                   │               └────────────┘
                              │                   │
┌────────────┐                │                   │
│    Cron    │ ───────────────│── to Cache ───────┘
└────────────┘                │
                              │
                              │                                   ┌────────────┐
                              └───────── from Web app ──────────► │   Search   │
                                                                  └────────────┘
```

### Containers

- **A container's wall is `¦`; its top and bottom edges are dashed.** Every stroke of the border is an interrupted line, so no part of a container is ever read as a connector. Solid `│` reads as an arrow, `│`-and-blank flickers, and alternating `─`/`│` matches a connector every second row.
- **Name a group at both ends** — top-left in the top edge, bottom-right in the bottom edge. With one label a tall group has an unidentifiable bottom.
- **Inset the name into the edge itself.** A name floating inside the shape lands on top of whatever is drawn there.
- **Break the edge where a connector crosses it.** The gap says the flow leaves the group; an unbroken edge says it stops there.

```
                        │
┌─  AGENTIC LOOP ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
¦                       │                                   ¦
¦ ┌─  EACH TURN  ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐           ¦
¦ ¦                     ▼                       ¦           ¦
¦ ¦       ┌─────────────────────────────┐       ¦           ¦
¦ ¦       │         PreToolUse          │       ¦           ¦
¦ ¦       └─────────────────────────────┘       ¦           ¦
¦ ¦                     │                       ¦           ¦
¦ ¦                     │                       ¦           ¦
¦ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ─ ─ ─ ─ EACH TURN ─ ─┘           ¦
¦                       │                                   ¦
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─  AGENTIC LOOP ─ ─┘
                        ▼
```

### Proportion and alignment

- **The whole frame carries the aspect ratio, never one part of it.** `rows = cols / (ratio × 2.2)`, where 2.2 is the terminal cell's height-to-width ratio. Applying 16:9 to a video area and then stacking controls under it produces a square.
- **Relative size is a claim the reader checks.** A player's control strip is about a tenth of its height, not a third.
- **Give a UI-rich screen more room than feels necessary.** A full page needs about 150 columns; 113 is cramped.
- **Anything spanning the frame spans it edge to edge.** A progress bar indented like body text reads as broken.
- **Reserve 50% extra width for a small dense component** carrying text and nested layout — tabs, an accordion. A plain frame does not need it.
- **Lock every vertical border to a fixed column.** `│` and its connectors `┌ ├ └ ┐ ┤ ┘ ┬ ┼ ┴` all sit at the same character index, top to bottom.
- **Don't overload interior labels.** Several descriptors go on their own lines, or get trimmed to one word each. Overstuffed rows are what force the frame narrow.
- **Truncation is a defect.** Hand-wrap a long label rather than cutting it mid-word.
- **Match the source's flow direction** when converting an existing diagram. A left-to-right architecture redrawn vertically loses what made it clear.

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

### Flow with return paths

**When:** a lifecycle, a state machine, a loop with escapes — a spine of ordered steps where some steps jump back.
**How:** the spine runs straight down the middle; each return path gets its own column to the right, labelled at both ends; containers group the phases.
**Failure:** a return path taller than the screen. That is where it splits into two diagrams.
**At scale:** `refs/hooks-lifecycle.md` — 113 × 97, a 15-step spine, two nested containers, three return paths.

```
┌─  EACH TURN  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
¦                                                              ¦
¦     ┌─────────────────────────┐                              ¦
¦     │      PromptSubmit       │ ◄─ from PreToolUse ──┐       ¦
¦     └─────────────────────────┘                      │       ¦
¦                  │                                   │       ¦
¦                  │                                   │       ¦
¦                  ▼                                   │       ¦
¦     ┌─────────────────────────┐                      │       ¦
¦     │       PreToolUse        │ ── to PromptSubmit ──┘       ¦
¦     └─────────────────────────┘                              ¦
¦                                                              ¦
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  EACH TURN  ─ ┘
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

### Rarer forms

- **A schedule, a data model, or two representations that must map onto each other** → `refs/rarer-forms.md`, which defines and draws all three.
- **A screen, or anything floating over one** → `refs/draw-mockups.md`.

## Structure — adapt it, don't fill it in

No fixed template. Structure follows from what is being explained and what the reader will do with it. The proven default **for a design proposal**:

> the proposal itself → components defined from zero → one whole-picture diagram → the load-bearing rule, with depth → key interactions as short prose steps → "what you're deciding"

Other shapes adapt. A *mechanism* explanation ends with "what this means for us," not decision points. A *comparison* leads with the recommendation and differentiates options only on the axes that matter. A *walkthrough* orders by time. Reshape freely.

Use the sentences the material actually needs — no padding, and no artificial squeezing. Only the opener is deliberately short.

`refs/worked-example.md` runs this shape once end to end, on a real architecture, and shows how much depth the load-bearing rule gets.
