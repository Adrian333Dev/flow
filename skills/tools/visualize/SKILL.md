---
name: visualize
description: Draws ASCII diagrams, screen mockups and HTML previews, in a message or inside a document.
---

# Visualize

Pick the medium, pick the method, then draw it.

## Pick the medium: prose, a list, ASCII, or HTML

Decide this **before** drawing anything.

- **Prose**: a rule, a reason, a sequence of events. The default, and what an ordinary answer uses.
- **A list**: several items with the same shape and role, compared.
- **ASCII**: structure, ownership, flow, containment.
- **ASCII frame**: layout and proportion of a real screen → `references/draw-mockups.md`.
- **HTML preview**: colour, shade, density, elevation, type weight, spacing feel → `references/draw-mockups.md`.

**ASCII first, especially for layout.** Settle structure in a frame, then dress it in colour.

**Reach for HTML only where ASCII genuinely cannot carry the component.**

**Name what the artifact leaves out**: "This frame is structure only: the palette is a separate step."

## How to draw it

3 methods, in order of preference.

- **Typed directly: 1–2k tokens.** The default, and correct for anything with few moving parts.
- **A generator, row by row: 2–3k tokens per round.** Build each output row as one string, then join. Right when every row is an independent horizontal slice, which a page mockup is.
- **A generator, on a canvas.** Allocate the whole picture as a grid of blank cells, then draw shapes by coordinate. Right when elements span many rows: a long connector, a tall container, anything nested. `scripts/canvas.js` carries the grid, the container convention and every check below.

Reach for a generator when the artifact is obviously complex, or when the typed attempt came out wrong. A dense mockup takes several rounds.

**Every generator checks itself before it prints:**

- **Every write lands on the grid.** A coordinate past the edge fails.
- **Collision on write**: refuse to overwrite an occupied cell with a different character, with an explicit allowance where one element is meant to sit in front.
- **A label fits the line it sits in**, checked before centring it into a connector or a box.
- **Equal row length**, wherever a row-by-row generator builds a frame.

## Diagram rules: every diagram, including invented ones

- **Prose first.** Draw only when structure genuinely beats text.
- **No SVG, no mermaid, no HTML for structure.**
- **One idea per diagram.** Needing a legend means 2 ideas: split into an overview carrying the backbone and a small frame per detail.
- **Split wherever a connector outruns one screen.**
- **Spacious.** Few boxes (~5–6 per idea), a blank line inside boxes between title and content.
- **Everything defined above it.** No element appears that the prose didn't already define.
- **Plain labels.** No internal codes. Label arrows with what actually flows: `play()`, "plain text".
- **The 5-second test.** The one idea lands near-instantly, or the diagram failed. Simplify or split.
- **Never draw a sequence diagram**, in any medium: lifelines down the page with arrows between them. Draw the exchange as a vertical flow instead, one box per step with the actor named inside it.
- **Dynamics go in prose.** Interactions and message flows are short prose steps. When the *direction* of flow is itself the idea, a layered stack with labeled directional arrows carries it.

## ASCII mechanics

### Characters

3 tiers, each set by drawing the character and looking at it.

**Exact, safe anywhere:**

- Box drawing: `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`
- Arrowheads and markers: `▲ ▼ ► ◄ ▸ ▾ ● ■ ▪ ▌ ·`
- Rules and walls: `━ ¦ ‖ ╏ ╌`
- Punctuation: `… → —`

**Slightly over one cell: `◆ ◇ ☰ ❚ ⇆ ↻ ◁ ▷`. One per row at most, never several in a row, never in a border.**

**Broken: `▶ ◀ ∣ ❘ ❙ ⏸ ⏵`.** Use `►` and `◄` in place of `▶` and `◀`. `⏸` and `⏵` align in a terminal and break in a file: a diagram must hold in chat, file and diff.

Widgets are ASCII only: `[x]` `[ ]` `(*)` `( )` `>` `v`.

**Never predict a character's width from a property**: width class, Unicode category, emoji capability. **A character is safe once it has been drawn and looked at.** Show one not listed above to the user on its own first.

**Never pad around a wide character**: no whole number of spaces cancels its fractional width.

### Connectors

- **A stroke arriving from below and turning right is `┌`, never `└`.**
- **Label both ends of a long connector**: `from X` where it leaves, `to Y` where it lands.
- **At a crossing the vertical passes and the horizontal breaks**, every time. Never `┼`, which means joined.
- **Never draw a connector that starts and ends on the same element.** Work an element does to itself becomes a note beside it.
- **Labels ride inside the connector**, never on the row above.
- **Where several connectors merge, join them into one line** at the vertical midpoint of their sources, so no short stub runs the full height.
- **Arrows need not touch a box.** One column of clearance, and no junction character where an arrow meets a box.

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

- **A container's wall is `¦`; its top and bottom edges are dashed.** Never a solid wall: it reads as a connector.
- **Name a group at both ends**: top-left in the top edge, bottom-right in the bottom edge.
- **Inset the name into the edge itself.**
- **Break the edge where a connector crosses it.**

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

- **The whole frame carries the aspect ratio, never one part of it.** `rows = cols / (ratio × 2.2)`, where 2.2 is the terminal cell's height-to-width ratio. A 16:9 video area with controls stacked under it is a square.
- **Relative size is a claim the reader checks.** A player's control strip is about a tenth of its height, not a third.
- **Give a UI-rich screen more room than feels necessary.** A full page needs about 150 columns; 113 is cramped.
- **Anything spanning the frame spans it edge to edge**, a progress bar included.
- **Reserve 50% extra width for a small dense component** carrying text and nested layout: tabs, an accordion. A plain frame does not need it.
- **Lock every vertical border to a fixed column.** `│` and its connectors `┌ ├ └ ┐ ┤ ┘ ┬ ┼ ┴` all sit at the same character index, top to bottom.
- **Don't overload interior labels.** Several descriptors go on their own lines, or get trimmed to one word each.
- **Truncation is a defect.** Hand-wrap a long label rather than cutting it mid-word.
- **Match the source's flow direction** when converting an existing diagram.

## Pattern vocabulary: a menu, not a template

Proven layouts. Pick one, combine several, or invent a better-fitting layout: the rules above bind whatever you invent.

### Layered stack

**When:** components with ownership and command/data flow: "who owns what, who tells whom."
**How:** one box per layer (name + tech, an `owns:`/`state:` line inside); arrows labeled with the actual calls or data; where flow is two-way, separate the directions.
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
**How:** vertical; arrow labels are the data between stages; a short annotation beside each box says what it does.
**Failure:** stuffing a stage's internals into the overview: an interesting stage gets its own diagram.

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

**When:** a lifecycle, a state machine, a loop with escapes: a spine of ordered steps where some steps jump back.
**How:** the spine runs straight down the middle; each return path gets its own column to the right, labelled at both ends; containers group the phases.
**Failure:** a return path taller than the screen. That is where it splits into 2 diagrams.
**At scale:** `references/hooks-lifecycle.md`: 113 × 97, a 15-step spine, 2 nested containers, 3 return paths.

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

**When:** hierarchy or containment: file layouts, nesting, decision trees.
**How:** indented text tree with inline annotations. Almost never boxes inside boxes.

```
core/
├─ pipeline/    render -> segment -> synthesize
├─ playback/    the controller (no React here)
└─ cache/       content-key -> audio + timings
```

### Side-by-side

**When:** comparing 2 options or states.
**How:** 2 columns, same skeleton so the differences pop; verdict labels up front so the headers alone tell the story.
**Failure:** if the columns are just attribute rows, nothing is being drawn. Use a list.

```
   TIMER IN REACT (drifts)          CONTROLLER-DRIVEN (exact)

   setInterval guesses the           the audio clock IS the
   position on schedule              position: read, not guessed
```

### Rarer forms

- **A schedule, a data model, or two representations that must map onto each other** → `references/rarer-forms.md`, which defines and draws all 3.
- **A screen, or anything floating over one** → `references/draw-mockups.md`.

## Structure: adapt it, don't fill it in

No fixed template. The default **for a design proposal**:

> the proposal itself → components defined from zero → one whole-picture diagram → the load-bearing rule, with depth → key interactions as short prose steps → "what you're deciding"

Other shapes adapt. A *mechanism* explanation ends with "what this means for us," not decision points. A *comparison* leads with the recommendation and differentiates options only on the axes that matter. A *walkthrough* orders by time.

Use the sentences the material actually needs: no padding, and no artificial squeezing. Only the opener is deliberately short.

`references/worked-example.md` runs this shape once end to end, on a real architecture, and shows how much depth the load-bearing rule gets.
