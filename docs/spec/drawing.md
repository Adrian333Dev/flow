# Drawing

How Flow draws: `/flow:visualize`, the skill every diagram, screen mockup and colour preview goes through, in a reply or inside a document. It picks what the answer is made of first, then how to draw it, then draws it by a fixed set of rules that hold in a terminal, a file and a diff alike.

## Scope

- **In**: picking the medium, the 3 ways to draw, the characters an agent may use, the conventions every diagram follows, `canvas.js`, what drawing costs, and the engine that may come later.
- **Out**: when a spec or a reply must carry a drawing, which `skills/phases/groundwork/references/write-spec.md` and `home/AGENTS.md` → `ui-is-drawn` say.

## What an answer is drawn in

The choice the skill makes before drawing anything:

```text
what the answer has to show
├─ a rule, a reason, a sequence of events  → prose, the default
├─ several items of one shape, compared    → a list
├─ structure, ownership, flow              → ASCII
│   ├─ few moving parts                    → typed directly, 1–2k tokens
│   ├─ rows that stand alone, a page       → a generator, row by row
│   └─ elements spanning many rows         → a generator on canvas.js
├─ a real screen's layout and proportion   → an ASCII frame
└─ colour, density, spacing, type weight   → an HTML preview
```

## Behaviors

### Picking the medium

- `V1` **The medium is picked before anything is drawn**: prose, a list, ASCII, an ASCII frame or an HTML preview. "Medium" stays, ruled by the user: shorter than "what the answer is made of".
- `V1` **ASCII first, layout included.** A frame settles structure, then a preview dresses it in colour. HTML only where ASCII cannot carry the thing.
- `V1` **The artifact names what it leaves out**: "This frame is structure only: the palette is a separate step."
- `never` **SVG, mermaid or HTML for structure.** SVG through the excalidraw skills cost about 10 minutes and 80,000 tokens a drawing, measured, against 1,000 to 2,000 for typed ASCII.
- `never` **A sequence diagram**, in any medium: the user cannot read lifelines and arrows between columns, and the SVG version reads no better. The exchange becomes a vertical flow with the actor named in each box.

### Drawing it

- `V1` **3 ways, in order: typed directly, a generator row by row, a generator on a canvas.** Typing is the default. A generator is for a drawing that is plainly complex, or one whose typed attempt came out wrong.
- `V1` **A drawing goes to a generator past a size**: a container, a connector spanning more than about 5 rows, 2 elements overlapping, or more than about 15 rows or 80 columns. Against the skill's 5 patterns that sends 4 to typing.
- `V1` **Every generator checks itself before it prints**: every write lands on the grid, no write overwrites a different character, every label fits its line, every row of a frame is one length.
- `V1` **`canvas.js` is a grid, never a diagram engine.** `new Canvas(76, 13)` allocates the cells, and `put`, `text`, `hl`, `vl`, `box`, `run`, `container` and `clear` draw by coordinate. It routes nothing and places nothing. Its worth is the checks: a connector at column 58 raised `label "from TaskCompleted" needs 24 cols, run is 19`, a cut label that would have shipped.
- `V1` **A mockup is built row by row, never on the canvas.** Built twice to prove it: identical output, and the canvas needed a counted column for every label.
- `V1` **The user checks every drawing by eye.** The skill holds no step re-reading its own output: it costs tokens and catches nothing the user would miss. A broken frame becomes a study case, and a study case a rule.

### Characters

- `V1` **3 tiers, each set by drawing the character and looking at it.** Exact: box drawing, `▲ ▼ ► ◄`, `¦ ━ …` and the rest of the skill's list. Slightly over one cell: `◆ ◇ ☰ ↻` and a few more, one per row at most and never in a border. Broken: `▶ ◀ ∣ ⏸ ⏵`, each with a working twin.
- `V1` **A character is safe once drawn and looked at, never predicted from a property.** Width class fails: every box-drawing character is East Asian Ambiguous and all are fine. The emoji property fails both ways: `∣` lacks it and breaks, `▪` carries it and renders exact.
- `V1` **A character not on the list is shown to the user alone first.**
- `never` **Padding around a wide character**: a character falling back to another font advances a fraction of a cell, such as 1.4, and no whole number of spaces cancels it.
- `never` **A font holding every character**: it fixes one machine, never a drawing landing in GitHub, a chat window or someone else's terminal.
- `later` **The glyph probe as a script**, `glyph-probe.js`: characters in, an aligned frame out, rendered into a file as well as a terminal, since `⏸` and `⏵` align in a terminal and break in a file. Verdicts: blocked for an emoji character, known good for a listed one, unverified for the rest, which never blocks.

### Conventions every diagram follows

- `V1` **One idea per diagram.** Needing a legend means 2 ideas: an overview, plus a small frame per detail. A connector outrunning one screen splits the drawing.
- `V1` **Few boxes, about 5 or 6 per idea, with room inside**, and nothing in the drawing the prose above did not define.
- `V1` **Plain labels, and an arrow labelled with what flows along it**: `play()`, "plain text".
- `V1` **The 5-second test**: the one idea lands near at once, or the drawing is simplified or split.
- `V1` **A container is drawn from broken strokes only**: `¦` walls, dashed top and bottom edges, named at top-left and bottom-right. Every solid line is then a connector. This reversed 2 earlier rulings, alternating walls and then corner stubs.
- `V1` **At a crossing the vertical passes and the horizontal breaks.** `┼` means joined.
- `V1` **A long connector is labelled at both ends**, `from X` where it leaves and `to Y` where it lands, with the label inside the line.
- `V1` **A pattern vocabulary, a menu and never a template**: layered stack, pipeline, flow with return paths, tree, side by side, and in `references/` a schedule, record boxes and 2 aligned scales.
- `V1` **`## Structure` stays in `SKILL.md`**, ruled twice by the user, against a reference file and against `home/AGENTS.md`.

### The engine

- `later` **An ASCII engine: JSON in, the finished drawing out.** The user's direction, 2026-08-19: the caller passes boxes, arrows and groups with no coordinates, the engine does the whole rendering, diagrams only at first, mockups later or never. `/flow:visualize` mentions none of it until it exists, then is rewritten around it. Its return is the connector faults that stop, never the tokens saved: typing stays for a 3-box stack. The trap: auto-layout gives drawings perfectly aligned and unreadable, and a drawing that looks finished hides it. Graphviz, dagre, graph-easy, diagon and mermaid-ascii get tried first.
  - The user mostly disagreed with the recommendation of one schema per pattern over a general layout, and has not stated the other direction yet. It is asked first.
- `later` **An SVG engine**, after the ASCII one, run in a subagent: outside the main conversation, the 80,000 tokens a drawing stop counting against it.

## The parts

- **`skills/tools/visualize/SKILL.md`**: the medium, the methods, the rules, the patterns, the structure of a design proposal. One file, since every run needs all of it.
- **`references/draw-mockups.md`**: frames and HTML previews. **`rarer-forms.md`**: the schedule, record boxes and aligned scales. **`hooks-lifecycle.md`**, **`youtube-page.md`**, **`worked-example.md`**: finished drawings, read on some runs.
- **`scripts/canvas.js`**: the grid and its checks.

## One real case: the hooks lifecycle

1. A reply needs Claude Code's hook events in order, with the points where a turn loops back.
2. The medium is ASCII: order and flow. The pattern is a flow with return paths.
3. 15 steps, 2 nested containers and 3 return paths pass every size limit, so the drawing goes on `canvas.js`.
4. The generator places the containers, the spine and each return lane by coordinate. A label too long for its lane fails the check before anything prints.
5. 4 rounds, against about 9 for the YouTube page mockup, the first large drawing. The result is `references/hooks-lifecycle.md`, 113 columns by 97 rows.

## How it fails

- **A character drawn off by a fraction** → the user reports it. It joins the broken tier with its twin named.
- **A typed drawing comes out wrong** → the next attempt is a generator.
- **A generator writes off the grid, over another character, or a label past its line** → it refuses to print, naming the coordinate.
- **A drawing needs a legend** → it is 2 ideas, and splits.

## How you know it worked

- **The hooks lifecycle drawn on the canvas** in 4 rounds, with the canvas catching the errors the user caught before.
- **No broken frame reported in the beta.** Not yet known.

## What is locked

- **ASCII over SVG**, on the measured cost.
- **A character is used only once drawn and looked at.**
- **The skill does not check its own drawings**: the user does.
- **The engine stays out of the skill until it exists.**
