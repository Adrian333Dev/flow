# Drawing: the settled rulings, and the engine that may never be built

Everything behind `/visualize`, Flow's drawing skill. Two records merged on 2026-09-16: the rework that produced the skill, and the engine idea raised at the end of it. They are one subject, and the second only makes sense against the measurement in the first.

`skills/tools/visualize/SKILL.md` and its `references/` carry every drawing rule and the measured table of characters an agent may use. `backlog.md` → `### Drawing` carries the 3 open items.

## The rework: what is settled, and what `canvas.js` measured

Reworked 2026-08-19 over 4 passes and signed off by the user the same day. Git holds the passes. Cut on 2026-09-15 to what stops a settled point being re-raised, and what the open items still need.

### Settled: do not re-raise

- **Checking is deleted from the skill.** The user checks every drawing by eye and reports what broke. A broken frame becomes a study case, and a study case becomes a rule. An agent re-reading its own output costs credits and catches nothing the user was not going to catch anyway.
- **One file.** The pattern vocabulary and the worked example are needed on every run, so moving them out only buys extra reads. A gallery of finished conversions is read on some runs and not others, so it sits in `references/`.
- **Generators are allowed.** Type the drawing directly by default. Reach for a script when the drawing is complex, or when the typed attempt came out wrong.
- **Budgeting extra columns is dead.** A character that falls back to another font advances a fraction of a cell, such as 1.4, and whole spaces cannot pad a fraction away. A character either advances exactly one cell or it cannot be used.
- **A font change is rejected.** A monospace font holding every character would fix the machine, never the file. A drawing lands in GitHub, a pull request, a chat window and someone else's terminal. Every banned character has a working twin, so the ban costs nothing.
- **A container is drawn from interrupted strokes only**: `¦` walls, dashed top and bottom edges, named top-left and bottom-right. Every solid line in a drawing is then a connector. This reversed 2 earlier rulings in turn: alternating `─`/`│` walls, then corner stubs with no wall at all.
- **`## Structure` stays in `SKILL.md`.** Ruled twice by the user: first against moving it to a reference file, then against moving it to `home/CLAUDE.md` → `## Explaining`. **Do not raise it a third time.**
- **`skills/tools/visualize/future-ideas/` belongs to the user.** They saved those SVGs by hand for their own reference. Never propose deleting, moving or reorganising it, and never count it against the skill's size.
- **"Medium" stays.** The user asked twice what the word meant, got the plain answer, *what the answer is made of, the material you express it in*, and ruled that the word keeps its place because it is shorter than the phrase. They were asking for a definition, never a rewrite.
- **Sequence diagrams are out.** The user cannot read the form: lifelines, activation bars, arrows between columns. The SVG version reads no better. What one was for goes into a vertical flow with the actor named in each box.

### Cost

- **SVG through the excalidraw skills: about 10 minutes and 80k tokens per drawing**, measured. That is what ASCII competes against, and why it wins. A subagent drawing the SVG outside the main conversation would change that arithmetic, which is what the SVG engine item reopens.
- **Typed ASCII: about 1 to 2k tokens.**
- **A generator: about 2 to 3k tokens per round.** The YouTube page took about 9 rounds the first time. The hooks lifecycle took 4, because the canvas caught the errors instead of the user.

### The probe script: designed, not built

`lab/research/ascii-glyph-probe.md` is the markdown probe the user read by eye to sort characters into exact, slightly over and broken. Turning it into `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out.

- **Characters in, an aligned frame out.**
- **It renders into a file as well as a terminal.** `⏸` U+23F8 and `⏵` U+23F5 are aligned in the terminal and visibly off in a file, so a probe checking only the terminal passes them.
- **Verdicts**: BLOCKED for a character with the emoji property, KNOWN GOOD for one already on the verified list, UNVERIFIED for everything else. UNVERIFIED never blocks: the agent uses the character and the user reports a break.
- **Nothing predicts breakage but measurement.** Width class fails, since every box-drawing character is East Asian Ambiguous and all of them are fine. The emoji property fails both ways: `∣` U+2223 lacks it and breaks, `▪` U+25AA carries it and renders exact.

Recommended, never agreed, and the skill works without it.

### `scripts/canvas.js`: measured, not described

A drawing surface, not a diagram engine. It knows nothing about graphs, layout or routing. `new Canvas(76, 13)` allocates 13 rows by 76 columns of spaces, and `out()` returns the rows joined. It provides `put`, `text`, `hl`, `vl`, `box`, `run`, `container` and `clear`. It does not route connectors, draw elbows or arrowheads, wrap text or decide where a box goes.

**The ratio that decides its worth**, measured by rebuilding a slice of the hooks lifecycle: 4 lines of canvas calls for the container, both boxes and the spine, then 13 hand-written lines for one return connector, which `run()` has since cut to 3. 30 hand-computed numbers remain, and every one is wrong again the moment a label changes length. **That measurement is the whole case for the engine, below.**

**Its value is the checks.** Placing a connector at column 58 raised `label "from TaskCompleted" needs 24 cols, run is 19`: a cut-off label that would otherwise have shipped.

**Wrong tool for mockups**, proven by building the same player slice twice. Row-by-row strings and the canvas produced identical output, but the canvas version needed a hand-counted column for every label. A mockup's unit is a row, and aligning within a width is string work. A diagram's unit is a coordinate, and its elements span rows: that is canvas work.

**When it should fire**: type the drawing directly unless it has a container, a connector spanning more than about 5 rows, 2 overlapping elements, or more than about 15 rows or 80 columns. Against the 5 patterns in the skill, that sends 4 to typing and only a flow with return paths to a generator.

## The engine: hand it JSON, get back the drawing

**Nothing is decided and it may never be built.** Raised by the user 2026-08-19, at the end of the rework
above, after watching me rebuild a slice of the hooks diagram by hand. The skill works without an engine
today and must keep working without one: `skills/tools/visualize/` mentions none of this on purpose. This
section is written so the brainstorm can open cold, months later, with nothing else read.

It is written that way because the first explanation failed: the user understood none of it, including what
the named tools were. Everything below is defined from zero.

### Where this stands, 2026-08-19: read this before anything below

**The user has read this section and mostly disagrees with the recommendation in it.** Their words: "I mostly
disagree with your suggestions. And I'm looking to move into probably completely different direction. But
I'll need you to write the idea down so later we can look into it as well."

So everything below is **a recorded option, not the plan.** It is kept because the reasoning and the
measurements in it stand on their own: the cost of a hand-drawn connector, what the two halves of the job
are, which tools already exist, and whoever opens the brainstorm will want them whether or not they take
the recommendation.

**Their direction is not yet stated** beyond the two things they have said twice: JSON goes in, and the
engine does the whole rendering. Ask for it first, before arguing any of this. The one part of the proposal
below they have not pushed back on is the shape of the input, which was their idea to begin with.

### What it is

A program you hand a description of a diagram, which hands you back the finished drawing. The description
carries **what**: these boxes, these arrows, these groups. It carries no **where**: no rows, no columns, no
widths. Working those out is the program's whole job.

```
  { nodes, edges, groups }        <-  JSON in, no coordinates anywhere
            │
            ▼
   ┌──────────────────┐
   │      LAYOUT      │   which rank each box sits in, how wide it has to be,
   └──────────────────┘   which column each arrow runs down
            │  a row and column for every box, a path for every arrow
            ▼
   ┌──────────────────┐
   │    RASTERISE     │   characters into cells: corners, crossings,
   └──────────────────┘   arrowheads, labels, container walls
            │
            ▼
     the finished drawing         <-  what goes in the message
```

This is how every mainstream diagram tool already works. Mermaid, Graphviz and Excalidraw's own generators all
take a description and compute the picture. **The only unusual part is the output**: characters in a terminal
grid instead of an SVG.

### The user's direction, 2026-08-19

Their words, and they differ from the earlier proposal in one way that matters:

- **JSON in.** "We just pass down the entities we want, like diagrams and stuff, we just pass them as JSON
  objects. And that engine handles the whole rendering. We don't draw anything at all."
- **Diagrams only, at first.** "Initially, it will be all diagrams. And maybe we won't even have the mockups.
  It could be only about diagrams."
- **Mockups later, or never.** Agreed, and for a reason worth keeping: a mockup's value is judgment about
  proportion and real strings, and a screen is not a graph: it is nested box flow, closer to implementing CSS
  layout than to drawing a diagram. That is a second engine, not a later feature of this one.
- **The skill stays independent.** If the engine ever lands, `visualize` gets rewritten around it. Until then
  the skill must never mention it.

**This kills the cheapest tier I proposed earlier.** I recommended starting with routing only: the caller
still places every box, the engine draws every connector. That still makes the caller do arithmetic, which is
exactly what the user is trying to delete. Under their framing, automatic placement is the floor, not the
ceiling.

### The same diagram, three ways

One container, two boxes, a spine down and a return lane back: the smallest piece of the hooks lifecycle that
is still real.

```
┌─  EACH TURN  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
¦                                                                 ¦
¦       ┌────────────────────────────┐                            ¦
¦       │         PreToolUse         │                            ¦
¦       └────────────────────────────┘◄──── to PreToolUse ─────┐  ¦
¦                      │                                       │  ¦
¦                      │                                       │  ¦
¦                      │                                       │  ¦
¦                      ▼                                       │  ¦
¦       ┌────────────────────────────┐                         │  ¦
¦       │       TaskCompleted        │                         │  ¦
¦       └────────────────────────────┘ ── from TaskCompleted ──┘  ¦
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ EACH TURN ─┘
```

**Typed by hand**: 13 lines of characters, every one of them counted. A label that grows by two characters
means retyping every row below it. This is what the skill does today for anything small, and it is correct
for anything small.

**On the canvas: `scripts/canvas.js`, what the skill does today for anything large:**

```js
const k = new Canvas(76, 13);
k.container(0, 0, 12, 66, "EACH TURN");
k.box(2, 8, 30, ["PreToolUse"]);
k.vl(23, 5, 7); k.put(8, 23, "▼");
k.box(9, 8, 30, ["TaskCompleted"]);
k.vl(63, 5, 10); k.put(4, 63, "┐"); k.put(11, 63, "┘");
k.run(4, 39, 62, "to PreToolUse"); k.run(11, 39, 62, "from TaskCompleted");
k.put(4, 38, "◄");
```

Eight lines instead of thirteen, and the assertions catch a mistake instead of shipping it. But **count the
numbers: thirty of them**, every one worked out by hand, and every one wrong again the moment a label changes
length. The boxes are nearly free: `box()` and `container()` do real work. The connector is not, and the
connector is the part that actually breaks.

**As JSON, if the engine existed:**

```json
{
  "pattern": "flow-with-returns",
  "groups": [{ "name": "EACH TURN", "contains": ["pre", "done"] }],
  "nodes":  [{ "id": "pre", "label": "PreToolUse" },
             { "id": "done", "label": "TaskCompleted" }],
  "edges":  [{ "from": "pre",  "to": "done" },
             { "from": "done", "to": "pre", "return": true }]
}
```

Not one number. Box widths come from the labels, the lane column comes from counting the lanes, and
`from TaskCompleted` / `to PreToolUse` are generated from the node names rather than typed twice.

### The two halves of the job

**Layout**: deciding where things go. Which horizontal rank each box sits in, what order within a rank
crosses the fewest arrows, how wide each box has to be, which column each arrow gets. This is a solved,
forty-year-old field, and it is borrowable.

**Rasterising**: turning those numbers into characters. Integer coordinates only, so everything rounds.
Orthogonal arrows that route around boxes rather than through them. The right junction glyph wherever strokes
meet: `┼ ├ ┬ ┤` and the corner rule that `┌` is a stroke arriving from below and turning right. The crossing
convention where the vertical passes and the horizontal breaks. A label centred inside its run. Both ends of a
long lane labelled. A container edge broken exactly where flow crosses it.

**Only the second half is hard, and it is hard mostly because it is finicky.** No algorithm is missing. Every
rule above is already written down and already argued out: they are the contents of
`skills/visualize/SKILL.md`, which is what this rework produced. The engine is those rules expressed as code
instead of as instructions to an agent.

### The tools that already exist

None of these is a dependency yet. **Each is something to try before writing a line**, because if one is close
the job shrinks to a post-processor that applies Flow's conventions to somebody else's output.

- **Graphviz**: the classic. A program that reads a small text language called `dot`, where you write
  `a -> b`, and computes a layout. Decades old, on every machine, and it can print its layout as plain
  numbers (`dot -Tplain`) rather than a picture, which is exactly the input a rasteriser needs. **The
  strongest candidate for the layout half**, and it does no ASCII of its own.
- **dagre**: the same idea as Graphviz's layout, written as a small MIT-licensed JavaScript library. Feed it
  nodes with sizes and edges; get back an x and y for every node and a list of points for every edge. It draws
  nothing at all. Mermaid uses it internally. Matters because Flow is a Node repo and this needs no external
  binary.
- **graph-easy**: a Perl program that takes a tiny graph description and prints an ASCII diagram directly.
  The closest existing thing to the whole idea. Old, its output style is fixed, and that style is not Flow's,
  so the realistic use is as evidence about how good ASCII auto-layout can get, not as a dependency.
- **diagon**: a small MIT tool (C++, with a web version) that turns short text descriptions into ASCII art:
  trees, tables, sequence diagrams, maths, and flowcharts by way of Graphviz. Worth reading for its
  rasteriser, which is the half nobody else has solved.
- **mermaid-ascii**: a young Go project that renders Mermaid diagram syntax as ASCII instead of SVG. Least
  certain of the five; **confirm it still exists and still works** before counting on it.

**What to check, concretely:** run the hooks lifecycle through `graph-easy` and through `diagon`, and look at
the result beside `skills/visualize/references/hooks-lifecycle.md`. If either comes close, the engine is a
post-processor. If both come out unreadable, that is the strongest possible evidence for the recommendation
below.

### How far it can go: the recommendation the user disagrees with

**Restrict the shapes and the hard part mostly disappears.** General graph auto-layout is where the difficulty
and the ugliness both live. Flow does not need general graph layout, because `visualize` already settled which
shapes it draws: layered stack, pipeline, flow with return paths, tree, side-by-side, plus the rarer schedule,
record boxes and aligned axes. **Each of those has a known layout with no graph theory in it.** A pipeline is
a single column in list order. A flow with returns is a single column plus one lane per return, allotted
right to left. A tree is indentation. A layered stack is a column with labelled gaps.

So the recommendation is **one JSON schema per pattern, not one general engine**: `"pattern":
"flow-with-returns"` above is that idea. Perhaps 200 lines of layout for the first three patterns, against
roughly 1000 for a general DAG layout that would still need taming afterwards.

Three tiers, in the order they should be attempted:

1. **Two patterns, end to end**: pipeline and flow-with-returns, JSON in, drawing out. These are the two
   shapes the hooks lifecycle and most architecture sketches are made of. Small enough to throw away.
2. **The rest of the vocabulary.** Same rasteriser, one layout function per pattern. Additive, and each new
   pattern is independent of the last.
3. **General graph layout**, via Graphviz or dagre, for a diagram that fits no pattern. Only worth it once
   tiers 1 and 2 are in daily use and something real does not fit. **Possibly never.**

Mockups sit outside all three, permanently, for the reason in the direction section above.

### The trap nobody sees coming

**Auto-layout produces diagrams that are perfectly aligned and unreadable.** The five-second test (one idea,
landing instantly) is a taste judgment, and every auto-layout tool in existence fails it routinely: arrows
take absurd routes, unrelated boxes land next to each other, the eye finds no path through it.

An engine that always aligns but sometimes produces spaghetti is **worse than typing**, because a broken
border is obvious and a badly-laid-out diagram is not. It looks finished.

**The defence is the restriction above.** A pipeline laid out down a column cannot produce spaghetti, because
there is only one arrangement. Every pattern that admits exactly one layout is safe by construction, and that
is the real argument for pattern schemas over a general engine, not the line count.

### Cost: when the engine wins

Typing a diagram costs 1–2k tokens. Writing the JSON for one costs maybe 300–800. So the engine wins on
anything large and loses on anything small, which is the same threshold `canvas.js` already has.

**It replaces the generator, never the typing.** A three-box stack stays typed forever. This also means the
engine cannot be justified by token savings alone: its real return is that the connector defects stop
happening, and those are the defects that made this rework necessary.

### What the brainstorm has to settle

- **Does an existing tool already do it?** Run the three ASCII tools against the hooks lifecycle first.
  Everything below is moot if one of them lands close.
- **Pattern schemas or one general graph?** The recommendation above is patterns, and **the user has
  already rejected it in outline.** Get their direction first, then argue this against it rather than for it.
- **Where the engine lives.** `skills/tools/visualize/scripts/` alongside `canvas.js`, or `scripts/` as a
  command on the PATH like `flow` and `util`. A command means any session can pipe JSON to it without
  loading a skill.
- **What happens to `canvas.js`.** The engine could sit on top of it: the canvas is already the grid, the
  collision check and the container convention, or replace it. Sitting on top looks right and is untested.
- **How the agent produces the JSON**, and whether writing malformed JSON is a worse failure mode than
  drawing a crooked line. A schema error is at least loud.
- **Whether `visualize` keeps the hand-drawing rules** once an engine exists. It must: the engine covers
  diagrams, and prose, mockups and previews are still hand-made.
