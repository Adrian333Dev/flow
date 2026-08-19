# Design — `visualize` rework

_Sessions 2026-08-19. **Applied twice** — the skill was rewritten from this record on 2026-08-19, then
split and re-cut the same day after the user reversed the container decision. Everything below is the
reasoning behind it; read this instead of re-deriving any of it._

## Settled — do not re-raise

- **Checking is deleted from the skill.** The user checks every artifact by eye and reports what broke; a
  broken frame becomes a study case, and a study case becomes a rule. An agent re-reading its own output
  costs credits and catches nothing the user was not going to catch anyway.
- **One file.** `design-explain-rework.md` LOCKED #1 rejects splitting `visualize` into sub-files. The
  pattern vocabulary and worked example are needed on every run, so moving them out only buys extra reads.
  A gallery of finished conversions is different — read on some runs, not others — so it passes the
  conditional test in `writing.md` §4 and does not reverse #1.
- **Generators are allowed.** Prefer direct typed output; reach for a script when the artifact is complex
  or when the typed attempt came out wrong. The user softened an earlier proposal of a hard line size.
- **Budgeting extra columns is dead.** See `## Glyphs`.
- **A font change is rejected.** See `## Glyphs`.
- **A container is drawn from interrupted strokes only** — `¦` walls, dashed top and bottom edges, named
  top-left and bottom-right. Every solid line in a diagram is then a connector. This reverses two earlier
  rulings in turn: alternating `─`/`│` walls, then corner stubs with no wall at all. See `## Drawing rules`.
- **`## Structure` stays in `SKILL.md`.** Ruled twice by the user — first against moving it to a reference
  file, then on 2026-08-19 against moving it to `global/CLAUDE.md` → `## Explaining`. The agent's argument
  for the move (the rule fires when no skill is loaded, so `writing.md` §3 sends it to the always-loaded
  file) was heard and rejected. **Do not raise it a third time.**
- **`skills/visualize/future-ideas/` belongs to the user.** They saved those two SVGs there by hand, for
  their own future reference. Never propose deleting, moving or reorganising it, and never count it against
  the skill's size.
- **"Medium" stays.** The user asked twice what the word meant, got the plain answer — *what the answer is
  made of, the material you express it in* — and then ruled the word keeps its place because it is shorter
  than the phrase. The replacement heading was offered and declined. **The lesson is not about the word:**
  they were never asking for a rewrite, they were asking for a definition, and two replies went to what had
  been changed instead of what the word meant.
- **Sequence diagrams are out.** The user cannot read the form — lifelines, activation bars, arrows between
  columns — and it is not an ASCII problem; the SVG version reads no better. The skill must never reach for
  it. What it was for goes into a vertical flow in the hooks style, with the actor named in each box.

## Glyphs

**Nothing predicts breakage. The measured table is the only source of truth.** Two predictors were tried and
both are dead. *Width class:* every box-drawing character is East Asian Ambiguous and all of them are fine.
*Emoji capability:* `▶` U+25B6 and `◀` U+25C0 do carry the `Emoji` property and font fallback hands them to
a colour emoji font whose square glyphs overflow — but `∣` U+2223 carries no emoji property and breaks, and
`▪` U+25AA carries it and renders exact. The predictor fails in both directions.

**Breakage is a spectrum, not a yes/no.** The renderer advances by each glyph's real width, which is
fractional. A glyph measuring 1.05 cells shifts nothing visible when it appears once and a full column when
it appears twenty times. So the tier is not a property of the character — it is a property of **how many
appear in one row**. A frame stays aligned only while every row carries the same count of them.

Measured by the user on 2026-08-19, by eye, from `wip/research/ascii-glyph-probe.md`:

- **Exact — safe anywhere, including borders and repeated runs.** `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼` `▲ ▼ ► ◄ ▸ ▾`
  `● ━ ■ ▌ ▪ ·` `… → —` `¦ ‖ ╏ ╌`
- **Slightly over — one per row at most, never in a run, never as a border.** `◆ ◇ ☰ ❚ ⇆ ↻ ◁ ▷`
- **Broken — every column to the right shifts.** `▶ ◀ ∣ ❘ ❙ ⏸ ⏵`

**The last four were measured on the second pass, same day, and one result is new in kind.** `◁` U+25C1 and
`▷` U+25B7 are "a little misaligned, but good enough" — the middle tier. `⏸` U+23F8 and `⏵` U+23F5 are
**aligned in the terminal and visibly off in the file**, which is the first character whose verdict depends
on where it is read. A diagram is read in chat, in a file and in a diff, so passing in one of the three is
failing. They go on the broken list, and the reason travels with them: a future probe that only checks a
terminal will pass them again.

All three consequences below are now applied to `SKILL.md`:

- **The ban on `■ ▌ · … → —` was wrong.** All six measure exact, and the rule forcing `...` `->` `-` inside
  a frame was banning working characters. Deleted rather than restated as style.
- **`❚` U+275A moved from broken to the middle tier.** It came from the coarse `temp.txt` test; the probe
  is finer.
- **`╏` U+254F and `╌` U+254C are exact**, so the container convention has fallbacks if `¦` ever stops
  looking right.

**`¦` U+00A6 broken bar is the container wall**, found by the user probing seven vertical candidates by eye.
`‖` U+2016 measures exact but reads heavier than the dashed edges it joins, so it stays out of the skill.

### Budgeting extra columns — tried and dead

The idea: if a glyph takes 2 cells, write it followed by one fewer space. Tested in
`skills/visualize/tmp/glyph-budget-test.md`, six glyphs, each drawn twice.

**Every pair came out wrong.** The premise was mine and it was false: the renderer is not choosing between
1 and 2. VS Code's editor lays text out using each glyph's actual advance width from whichever font supplied
it, so a fallback glyph can advance 1.4 cells. Four tenths of a cell cannot be padded away with whole
spaces, and adding one makes it worse.

**Consequence:** a glyph either advances exactly one cell or it cannot be used. There is no escape hatch,
and the ban list is the only mechanism.

### The other two dead ends

- **No half-width or 1.5-width character exists.** Terminal cells hold 0, 1 or 2 — never a fraction. Thin
  space and hair space are proportional-typography concepts and measure 1 in a grid. "Halfwidth forms"
  (U+FF61–FFDC) are half of *fullwidth CJK*, meaning normal, i.e. 1. Zero-width characters (U+200B, U+FEFF,
  U+200D) measure 0 and can only remove.
- **Changing fonts would work and is still rejected.** A monospace font that already contains the glyph
  stops fallback (any Nerd Font, Iosevka, DejaVu Sans Mono); `U+FE0E` requests text presentation. Both fix
  the machine, not the file. A diagram lands in GitHub, a PR body, a chat window, someone else's terminal —
  the ban is what buys portability, and it costs nothing because every banned glyph has a working twin.

### The probe script — designed, not built

`skills/visualize/scripts/glyph-probe.js`. Takes one or more candidate glyphs, prints one of three verdicts.

- **BLOCKED** — carries the emoji property. Mechanical, no judgement.
- **KNOWN GOOD** — already on the verified list.
- **UNVERIFIED** — everything else. **Never blocks.** The agent uses it and the user reports a break.

The script only prints. The **agent** writes a newly verified glyph to `~/.claude/flow/notes.md`, because a
verified glyph is a fact about Flow — `## Capture` routes it there, not to `docs/inbox.md`. It never edits
the skill file. Reach for it only when introducing a glyph that is not already on the list.

**The markdown probe was written, run and read** — its verdicts are the three-tier table under `## Glyphs`.
It now lives at `wip/research/ascii-glyph-probe.md`. The script above is still unbuilt.

## Drawing rules, each found by breaking something

**Corners and connectors**

- **A stroke arriving from below and turning right is `┌`, never `└`.** This single wrong corner is what
  made the first horizontal diagram read as "completely broken".
- **Arrows need not touch a box.** One column of clearance is enough. Junction glyphs (`├ ┤`) where an arrow
  meets a box add nothing — proposed, then dropped by the user.
- **Label both ends of a long connector** — `from X` where it arrives, `to Y` where it leaves. A 76-row lane
  carries no information without it; you cannot see both ends at once.
- **No connector longer than one screen.** If a connector does not fit, that is where the diagram splits.
  This is the testable form of "keep diagrams small to medium", and it is what the hooks lifecycle proved.
- **At a crossing the vertical passes and the horizontal breaks.** Applied the same way every time, a gap in
  a horizontal run always means "something goes over here" and never "this line ends". `┼` says the
  opposite — that the two are joined.
- **No connector that starts and ends on the same element.** A self-call becomes a note on the element's own
  bar. The user reads U-turn arrows with difficulty in any diagram, ASCII or not.
- **Fan-in uses one trunk**, entering at the vertical midpoint of the sources, so no stub travels the full
  height. `fan-in.md` is the worked case.

**Grouping and layering**

- **A container's wall is `¦`, and its top and bottom edges are dashed.** Every stroke of the border is an
  interrupted line and every connector is a solid one, so the two never collide on any row. The route here
  ran through three rejected designs: solid `│` reads as an arrow, `│`/blank flickers, alternating `─`/`│`
  matches a connector every second row, and corner stubs — shipped for one revision — leave a tall group
  with no visible sides at all. `┆` was rejected on looks and `∣` renders wide, which is what made the wall
  look impossible until the user probed the remaining candidates by eye.
- **A group is named at both ends** — top-left in the top edge, bottom-right in the bottom edge. One label
  leaves a tall group with an unidentifiable bottom.
- **Container labels sit inset in the edge itself.** The source SVG floats them free inside the shape,
  which in ASCII lands on top of whatever is in the gutter.
- **An overlay clears the whole band of the pane it lands in**, not a hole its own size. Punching a
  box-sized hole strands the right-hand tail of every covered line, and the fragments read as damage.
- **A reference line is drawn only in the gaps between data** — the `today` marker in the Gantt appears on
  the blank rows between bars, so it never fights what it measures.

**Proportion and size**

- **The whole frame carries the aspect ratio, not one part of it.** `rows = cols / (ratio × 2.2)`, where 2.2
  is the terminal cell's height-to-width ratio. Applying 16:9 to the video area and then stacking controls
  under it produced a square.
- **Relative size is a claim the reader will check.** A player's control strip is about a tenth of its
  height, not a third.
- **A UI-rich screen needs more room than feels necessary.** YouTube needed 150 columns; 113 was cramped and
  the user said so.
- **Anything that spans a frame spans it edge to edge.** The progress bar was indented like body text and
  read as broken.
- **The 50% width reserve is scoped**, not global: it applies to a small dense component carrying text and
  nested layout — tabs, an accordion. A plain frame does not need it.

**Content**

- **Truncation is a defect.** Hand-wrap titles rather than cutting mid-word.
- **Labels ride inside the arrow**, not on the row above, so a message never breaks a line it is not
  crossing.
- **Never invent a divider the real UI does not have.**
- **Match the source's flow direction.** The channel-architecture SVG read left to right; converting it
  vertically lost what made it clear.
- **Draw the real product's current layout**, not the one you remember. YouTube moved views and date inside
  the description box years ago.

## How to draw it

Three methods, in order of preference.

- **Typed directly.** ~1–2k tokens. The default, and correct for anything with few moving parts.
- **A generator, row by row.** Build each output row as one string, then join. Right when every row is an
  independent horizontal slice — a page mockup is exactly that. The YouTube page uses this.
- **A generator, on a canvas.** Allocate the whole picture as a grid of blank cells, then draw shapes by
  coordinate. Right when things span many rows — a 76-row lane, a 55-row container wall.
  `scripts/canvas.js` is the working helper.

**Every generator asserts before it prints.** The assertions caught more defects than reading ever did:

- **Equal row length**, for anything with a frame. Caught two overflows in the YouTube page.
- **Collision on write** — the canvas refuses to overwrite an occupied cell with a different character, with
  an explicit `over=` allowance where one element is meant to sit in front. This turns "do two things
  overlap?" into a failure at generation time. It fired on the hooks caption and three times on the
  examples.
- **Label fits its run**, before centring a label into a connector.

## Cost

- **SVG through the excalidraw skills: ~10 minutes and ~80k tokens per diagram**, measured, recorded in
  `wip/excalidraw/README.md`. That is what ASCII is competing against, and why it wins.
- **Typed ASCII: ~1–2k tokens.**
- **A generator: ~2–3k tokens per round.** The YouTube page took about 9 rounds the first time. The hooks
  lifecycle took 4, because the canvas caught the errors instead of the user.

## The example set

**A file ships with the skill only if reading it lets the agent draw something `SKILL.md` cannot.**
Everything else is design evidence and belongs in `tmp/` or in this record. A first pass moved twelve
artifacts plus two source SVGs into `refs/`; the user rejected almost all of it, and the rule above is what
came out of that.

Shipped, in `skills/visualize/refs/`:

- **`hooks-lifecycle.md`** — 113 × 97, converted from a 520 × 1228 SVG. A 15-stage spine, a left gutter of
  side boxes, three nested return lanes, two containers. The source is planar — no line crosses another —
  which is why it converted without compromise. Also the case that produced the connector-length rule, and
  the only place the container convention appears at scale.
- **`youtube-page.md`** — 150 × 58. UI-rich mockup: toolbar, 92-wide player at 16:9, description box with
  chapters, comments, a 9-card sidebar. The proportion and density case, pointed at from `refs/draw-mockups.md`.
- **`rarer-forms.md`** — timeline, record boxes and aligned axes merged into one file, each with the three
  lines that define the form above its drawing.
- **`worked-example.md`** — the explanation shape run once end to end.
- **`scripts/canvas.js`** — the grid, the collision assert, the label-fits assert and `container()`. Shipped
  because the container convention is what kept breaking, and a method is harder to get wrong than a
  description of one.

Held in `tmp/`, awaiting a delete confirmation:

- **Byte-identical to a block already in the skill:** `crossing-edges.md`, `overlay-modal.md`.
- **A second example of a form the skill already draws:** `channel-architecture-horizontal.md`, `fan-in.md`.
- **Evidence for a decision now made:** `container-walls.md` (corner stubs vs `‖` vs `¦`),
  `glyph-budget-test.md`, `glyph-probe.md`, `sequence-diagram.md`.
- **Source SVGs:** `channel-architecture-dark.svg`, `hooks-lifecycle-dark.svg`. Never belonged in a skill —
  an agent cannot read an SVG usefully, and 359 lines of it ship for nothing.
- **Superseded earlier:** `channel-architecture-ascii.md`, `mockup-glyph-test.md`, `video-player-mockup.md`,
  `asc-inspirations.md`, `frame.txt`, `hooks.txt`.

## The rewrite — applied

269 lines / 2382 words → 434 / 3983. Growth is rules, not padding: the mechanics section is new and every
bullet in it came from something that broke.

**Cut:** the checking pass; 49 words restating the global `## Explaining`; "read it fully, then produce";
"never break the flow of a discussion to go check one"; 90 words of provenance on the worked example; the
old allowed set and ban list, both rebuilt from measurement.

**Added:** `## ASCII mechanics` with four sub-sections — characters, connectors, containers, proportion and
alignment; `## How to draw it` with the three methods and the assertions; three patterns the examples
earned — flow with return paths, record boxes, overlay; the ban on sequence diagrams, in `## Diagram rules`.

**Fixed:** the old timeline example drew `▶` and `time ─────▶`, both banned characters, inside a skill that
bans them. Every fenced block is now either a verified excerpt from the example set or generated and
asserted.

**Kept:** "Not for ordinary answers", the routing to `/prototype` when the work needs the running stack, all
six original patterns, the worked example's moves.

### Second pass — split by frequency

434 lines / 3983 words → 248 / 2491, after the user rejected a split by category: nine patterns in a
reference file means the agent reads that file on nearly every diagram, so the split buys an extra read and
nothing else. The cut is **how often a form fires**, and the common run now reads one file.

- **Stays in `SKILL.md`** — layered stack, pipeline, flow with return paths, tree, side-by-side. Tree and
  side-by-side are 11 and 12 lines; dropping their pictures saves nothing and risks boxes where indentation
  belongs.
- **`refs/draw-mockups.md`** — mockups, HTML previews, overlay. A floating pane only exists over a screen,
  so it never fires on a run that is not already a mockup.
- **`refs/`** — timeline, record boxes, aligned axes. No chapter each: the three lines that define the form
  sit on top of the artifact that already draws it, and `SKILL.md` keeps a four-line menu pointing at them.
- **Also cut:** `## When to reach for this`, which restated the frontmatter description, and `## Cost`,
  which restated `## How to draw it`. The one surviving rule from each moved rather than went.
- **`## Structure` stayed**, on the user's argument: the explaining rules fire whenever the agent writes to
  them, heavily during brainstorming, not only inside a spec. Only its 47-line worked example moved out.

### Third pass — the writing pass, 2026-08-19

Ordered by `global/refs/writing.md` rule 1: steps first, whole sequence visible, reference after.

- **`## How to draw it` moved up**, from below the mechanics to directly under `## Choosing the medium`.
  Choosing the medium and choosing the method are both decisions taken before a character is typed; the
  mechanics are consulted while typing. The old order put a step behind 80 lines of reference.
- **`## Structure` moved to the end.** It sat in the middle, which rule 2 calls the least-read position, and
  it is the section that fires most often — every brainstorm message uses it, not just a written spec.
- **The three glyph edits applied.** `■ ▌ · … → —` unbanned, `❚` moved out of broken into the middle tier,
  and the middle tier written with its rule: one per row at most, never in a run, never in a border.
- **The `... -> -` substitution rule deleted.** It existed because `… → —` were assumed broken. They measure
  exact, so the rule was banning working characters.
- **`draw-mockups.md` moved to `refs/`** at the user's request, for consistency: `SKILL.md` is now the only
  markdown at the skill's root. The editor mockup inside it draws its own file tree, so that tree was redrawn
  to show `refs/` and `scripts/`, and the command-palette results with it — both blocks re-verified at 80
  columns on every row.

### Fourth pass — the user's review, 2026-08-19

They read `SKILL.md` end to end and returned four findings. All four are applied.

- **"Preferred over a table" was redundant.** `global/CLAUDE.md` line 114 already says *Prefer a list to a
  table*, and that file is always loaded. Deleted from the skill. The general form of the finding: **a skill
  never restates a rule the global file already carries.**
- **The SVG cost paragraph was justification, not instruction.** "Roughly 10 minutes and 80k tokens,
  measured" is the argument for preferring ASCII, aimed at whoever is deciding whether to adopt the rule —
  the user. The agent only needs the rule. Cut to one line: *Reach for HTML only where ASCII genuinely
  cannot carry the component.* The measurement survives here, under `## Cost`. **This is a class, not one
  paragraph:** an agent-facing file states the rule, and the reasoning behind it lives in a document written
  for the user.
- **"Medium" was an undefined word.** Fixed by making the heading define it — `## Pick the medium — prose, a
  list, ASCII, or HTML` — and by deleting the term from the one bullet that used it downstream
  (*Name what the artifact leaves out*). Six more went the same way, since the user flagged the class rather
  than the instance: `glyph` → `character`, `gutter` → *whatever is drawn there*, `trunk`/`fan-in` → *where
  several connectors merge*, `lane` → `connector`, `run` → `line`, `assert` → `check`.
- **`draw-mockups.md` belongs under `refs/`**, for consistency, and `brainstorm/write-spec.md` with it. Both
  moved. This settles a convention: **`SKILL.md` is the only file at a skill's root** — written into
  `CLAUDE.md`, replacing the old rule that let markdown sub-files sit at the root.

`skills/visualize/tmp/` was emptied at the user's word in the same message.

## `scripts/canvas.js` — measured, not described

A drawing surface, not a diagram engine. It knows nothing about graphs, layout or routing.

**Input:** nothing from disk. `require` it, then call methods with integers and strings. `new Canvas(76, 13)`
allocates 13 rows × 76 columns of spaces. **Output:** `out()` returns one string, rows joined by newlines,
each right-trimmed.

**Provides:** `put` `text` `hl` `vl` `box` `run` `container` `clear` `out`, plus a module-level `write()` that
saves a titled markdown file and prints the row and column count. `text` treats `\0` as skip-this-cell. `box`
draws a `├───┤` divider for a `null` row. `run` draws a horizontal run with its label centred inside.
`container` draws the whole `¦` convention. `clear` blanks a rectangle, which is how an overlay punches its
band.

**Does not provide:** routing, elbows, arrowheads, text wrapping, or any decision about where a box goes.

**Ported from Python 2026-08-19, and verified rather than assumed** — the same drawing built from both files
came out byte-identical, then `canvas.py` was deleted. The reason is the repo's own rule, Node wherever there
is real logic, and the user asked for it by name. `run()` was added in the same pass, which is what made
`SKILL.md`'s claim about a label-fits-its-run assertion true instead of wrong.

**The ratio that decides its worth**, measured by rebuilding the hooks slice: 4 lines of canvas calls for the
container, both boxes and the spine — then 13 hand-written lines for one return lane, which `run()` has since
cut to 3. Thirty hand-computed numbers remain, and every one is wrong again the moment a label changes
length. That measurement is the whole case for `design-ascii-engine.md`.

**Its value is the assertions, and it earned that on the demo run.** Placing the lane at column 58 raised
`label "from TaskCompleted" needs 24 cols, run is 19` — a truncation that would have shipped, caught by eye
instead.

**Wrong tool for mockups, proven by building the same player slice twice.** Row-by-row strings and canvas
produced byte-identical output, but the string version right-aligns with a `between(a, b, w)` helper while
the canvas version needs a hand-counted column for every label. A mockup's unit is a row and its operation
is "align within a width" — that is string work. A diagram's unit is a coordinate and its elements span
rows — that is canvas work. The skill already routes them that way; these two runs are why.

**When it should fire**, since the shipped wording "obviously complex" is too soft to hold. Type it directly
unless the drawing has a container, a connector spanning more than ~5 rows, two overlapping elements, or
exceeds ~15 rows or ~80 columns. Against the five patterns in the skill that sends four to typing and only
flow-with-return-paths to a generator.

## Open

- **`execute/review-code.md` and `file-findings/write-skills.md` still sit at their skill roots**, which the
  rule set 2026-08-19 forbids. Both skills are due a full rewrite; the move goes with it.
- **The glyph probe is a markdown file, not a script.** At `wip/research/ascii-glyph-probe.md`, out of the
  gitignored `tmp/`, since it is evidence behind a skill rather than something a skill reads. Turning it into
  `scripts/glyph-probe.js` — characters in, aligned frame out — would make "show it to the user first" an
  instruction the agent can carry out. It must render **into a file as well as a terminal**, which is what
  `⏸` and `⏵` proved. Recommended, not agreed, and the skill works without it.
- **The engine.** `design-ascii-engine.md` holds it. The user has read it and mostly disagrees; nothing in
  `visualize` may mention it until it exists.

## The skill is finished — closed 2026-08-19

Reviewed end to end by the user and signed off, with all four review findings applied. **Nothing left under
`## Open` belongs to `visualize`** — the two misplaced sub-files belong to `execute` and `file-findings`, the
probe script is optional, and the engine is its own document.

Final shape: `SKILL.md` 253 lines, `refs/` (`draw-mockups.md`, `hooks-lifecycle.md`, `rarer-forms.md`,
`worked-example.md`, `youtube-page.md`), `scripts/canvas.js`, and the user's own `future-ideas/`. `tmp/` is
empty, every shipped file is reachable from `SKILL.md`, and nothing in this document is stale against it.
