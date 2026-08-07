# Complex diagrams

Read this when a diagram is genuinely large: 12+ nodes, three or more branches, a background process running alongside the main flow, or several paths that need to converge back into one. This is the highest-payoff and highest-risk diagram type — done right it's the single visual that replaces three paragraphs of routing logic; done wrong it's an unreadable mess of crossing lines. The patterns below are what separates the two outcomes, and the most important one is the first: knowing when *not* to keep adding to a diagram.

## The judgment call: keep building, or split

This is the decision that matters more than any individual technique below. Before adding the next node to an already-large diagram, ask:

- **Does this diagram still read top-to-bottom without the eye having to jump around?** If you have to trace a line backward to figure out what feeds what, it's already over budget.
- **Are there more than ~3 active colors doing real work, plus gray for neutral nodes?** Past that, color stops encoding category and starts being noise.
- **Would removing any single branch make the diagram meaningfully easier to follow without losing the point?** If yes, that branch is probably a separate diagram.

Rough node budget: 12-20 nodes is the comfortable range for one diagram if it has a clear backbone (one main spine with branches hanging off it, like the recipe below). Past 25-30 nodes, even a well-planned diagram starts asking a lot of the reader — at that point, strongly prefer an **overview diagram** (the spine only, with branch boxes labeled but not expanded) plus **separate detail diagrams** for each branch, linked by prose between them. A reader who sees the overview first, then drills into the one branch they care about, understands more than a reader handed the entire 30-node graph at once.

This isn't a hard ceiling — a diagram with a single dominant spine and short side-branches can comfortably hold more nodes than one with three parallel columns of equal weight, because the eye has one clear path to follow. Judge by *legibility*, not node count alone.

## Planning discipline at this scale

For a simple 5-box flowchart, sketching coordinates in your head is enough. At this scale, it isn't. Before writing any SVG:

1. **List every node** with its text content and which color/category it belongs to.
2. **Decide the backbone** — the single path a reader would trace if they ignored every branch. This is almost always a vertical center column.
3. **Assign x-ranges to every branch** as fixed lanes and hold those lanes for every node in that branch — mixing lane widths partway down a branch is how diagrams get crooked. On a ~680-wide canvas that might look like backbone at x=185-495, a parallel side-branch at x=500-640, or a three-way split at x=20-210 / 235-425 / 450-640 — but those are examples for that width, not requirements. If a branch needs more room (long labels, a wide side-branch), let W grow rather than cramming the lane, and recompute lane boundaries for whatever W you land on.
4. **Compute y-coordinates top to bottom**, sequentially, adding each node's height plus the minimum gap before assigning the next. Write this as a running list (e.g. "node 9 ends at y=1014, so node 10 starts at y=1074") rather than estimating positions independently — independent estimates are exactly how overlaps happen at this scale.
5. **Only then write the SVG**, lane by lane, backbone first.

A node count above ~15 is also the point where hand-typing every coordinate becomes genuinely error-prone — if the diagram has any repeating structure (a grid, N similar branches, N similar steps), prefer scripting the coordinate math over hand-placing each one (see "Scripting large diagrams" in `references/svg-diagrams.md`).

## Multi-way branch and merge

A single decision point fanning out to 3+ outcomes, or 3+ paths converging back into one node. Fan out from a single point below the decision node using an L-bend for every branch except the one that continues straight down the backbone:

```svg
<!-- decision node bottom-center at (340, 1014); three lanes below at x=115, 330, 545 -->
<path d="M340 1014 L340 1044 L115 1044 L115 1074" fill="none" class="arr" marker-end="url(#arrow)"/>
<line x1="340" y1="1014" x2="330" y2="1074" class="arr" marker-end="url(#arrow)"/>
<path d="M340 1014 L340 1044 L545 1044 L545 1074" fill="none" class="arr" marker-end="url(#arrow)"/>
```
The bend height (1044 above) should be roughly midway in the gap between the decision node and the branch row — not jammed right under the decision node, which makes the fan-out look cramped.

Merging is the same pattern in reverse — each lane bends back toward the backbone's x-coordinate just above the convergence node:
```svg
<path d="M115 1246 L115 1276 L340 1276 L340 1306" fill="none" class="arr" marker-end="url(#arrow)"/>
<path d="M545 1246 L545 1276 L340 1276 L340 1306" fill="none" class="arr" marker-end="url(#arrow)"/>
```
When 3+ lines converge, it's fine for their bend points to sit at slightly different y-values rather than exactly coincident — a small stagger (1276 vs 1290) reads as a converging fan rather than a single overlapping line, and avoids fighting with SVG's z-order to keep every line visible.

## Asymmetric branches

Real systems are rarely symmetric — one path might resolve in a single step while a sibling path needs three. Let the diagram show that rather than padding the short branch with filler boxes to make the columns match. A short branch can end early with a smaller terminal box (e.g. 40px tall instead of 56px) and a long dashed line carrying it down to the convergence point on its own, while its siblings continue through their full sequence:
```svg
<g><rect x="235" y="1130" width="190" height="40" rx="8" fill="var(--c-blue-50)" stroke="var(--c-blue-600)" stroke-width="0.5"/>
<text class="th" x="330" y="1150" text-anchor="middle" dominant-baseline="central" fill="var(--c-blue-800)">Resolved early</text></g>
<path d="M330 1170 L330 1290 L340 1290 L340 1306" fill="none" stroke="var(--border-strong)" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
```
The asymmetry itself is information — a reader sees at a glance that one path is cheaper or simpler than the others without needing it spelled out in text.

## Parallel / background branches

For a process that runs alongside the main flow rather than blocking it (a background job, an async side-effect, anything the backbone doesn't wait on), don't put it inline in the vertical sequence — that implies the backbone passes through it. Instead, give it its own lane to the side, connected to the backbone by one short horizontal connector at the point where it kicks off, with no connector back (since the backbone doesn't wait for it to finish):
```svg
<!-- backbone node's right edge feeds the side lane -->
<line x1="495" y1="522" x2="500" y2="516" class="arr" marker-end="url(#arrow)"/>
<g><rect x="500" y="494" width="140" height="44" rx="8" fill="var(--c-purple-50)" stroke="var(--c-purple-600)" stroke-width="0.5"/>
<text class="th" x="570" y="516" text-anchor="middle" dominant-baseline="central" fill="var(--c-purple-800)">Background step 1</text></g>
<!-- side lane continues downward independently, smaller boxes, tighter gaps are fine here (20px instead of 60px) since it's explicitly a side annotation, not the main sequential read -->
```
Use a visually distinct color (a ramp not used elsewhere in the diagram, e.g. purple when the backbone is blue/teal/gray) so the side lane reads as "different category of thing" at a glance, not as a continuation of the main flow.

## Self-loops (repeating interactions)

For an action the reader can repeat any number of times before moving on (asking a follow-up question, retrying a step), draw a small curve that leaves a node and re-enters it, rather than drawing the same node twice:
```svg
<path d="M495 1440 C 600 1410 600 1490 495 1462" fill="none" stroke="var(--c-purple-600)" stroke-width="1.5" marker-end="url(#arrow)"/>
<text class="ts" x="560" y="1402" text-anchor="middle">repeatable action</text>
<text class="ts" x="560" y="1502" text-anchor="middle">↻ repeats</text>
```
Route the curve out into genuinely empty space (check it against every other node's bounding box first, same as any connector) — a self-loop crossing through an unrelated box reads as a mistake, not a feature.

## Cross-diagram dashed references

Some nodes are accessible from anywhere in the flow rather than being a step in the sequence (a settings panel, a history view, anything the user can reach "any time"). Connect it with a short dashed line rather than a solid arrow, signaling "available from here" rather than "flow continues here":
```svg
<path d="M495 1334 L500 1334" class="arr" marker-end="url(#arrow)" stroke-dasharray="4 3"/>
```
Keep these nodes visually lightweight (gray, no heavy border) so they don't compete with the actual sequential flow for attention.

## Worked example

`examples/complex-system-example.html` puts all of the above together in one diagram: a single backbone, a fallback chain that merges into it, a parallel background branch, a three-way decision split with one asymmetric (early-resolving) branch, a multi-way convergence back to the backbone, a self-loop, a dashed side-reference, and a closing legend. It's deliberately generic — a request-triage system, not tied to any specific project — so it can be read purely as a layout pattern to imitate, lane structure and all.
