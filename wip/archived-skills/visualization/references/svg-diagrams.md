# SVG diagrams — stylesheet, hard rules, and core recipes

Read this once Step 1 in `SKILL.md` has routed to flowchart, structural, or illustrative (comparison uses this too, plus `advanced-patterns.md`). Entity-relationship and UI mockups don't use any of this — see their own reference files instead.

## Output as a standalone `.svg` file, not `.html`

Save every diagram as `<descriptive-name>.svg` — a plain SVG file, viewable directly in VS Code or a browser, no HTML wrapper. This matters because a standalone `.svg` is parsed as XML: the document's one root element must be `<svg>` itself, so the stylesheet has to live *inside* it (as its first child), not as a sibling before it or inside an assumed `<html><head>`. There's no `<body>` element to style either, so the page background comes from a `<rect>` drawn first, not from CSS on `body`.

## Base template — paste this whole skeleton, then fill in the diagram content

```svg
<svg width="100%" viewBox="0 0 W H" xmlns="http://www.w3.org/2000/svg">
<style>
:root {
  --surface-0:#16161a; --surface-1:#1c1c20; --surface-2:#222226;
  --text-primary:#ededea; --text-secondary:#a8a69e; --text-muted:#76756f;
  --border:#393834; --border-strong:#4a4944;
  --c-gray-50:#2C2C2A;   --c-gray-100:#444441;   --c-gray-600:#B4B2A9;  --c-gray-800:#D3D1C7;  --c-gray-900:#F1EFE8;
  --c-blue-50:#042C53;   --c-blue-100:#0C447C;   --c-blue-600:#85B7EB;  --c-blue-800:#B5D4F4;  --c-blue-900:#E6F1FB;
  --c-teal-50:#04342C;   --c-teal-100:#085041;   --c-teal-600:#5DCAA5;  --c-teal-800:#9FE1CB;  --c-teal-900:#E1F5EE;
  --c-coral-50:#4A1B0C;  --c-coral-100:#712B13;  --c-coral-600:#F0997B; --c-coral-800:#F5C4B3; --c-coral-900:#FAECE7;
  --c-purple-50:#26215C; --c-purple-100:#3C3489; --c-purple-600:#AFA9EC;--c-purple-800:#CECBF6;--c-purple-900:#EEEDFE;
  --c-amber-50:#412402;  --c-amber-100:#633806;  --c-amber-600:#EF9F27;--c-amber-800:#FAC775; --c-amber-900:#FAEEDA;
  --c-red-50:#501313;    --c-red-100:#791F1F;    --c-red-600:#F09595;  --c-red-800:#F7C1C1;   --c-red-900:#FCEBEB;
  --c-green-50:#173404;  --c-green-100:#27500A;  --c-green-600:#97C459;--c-green-800:#C0DD97; --c-green-900:#EAF3DE;
  --c-pink-50:#4B1528;   --c-pink-100:#72243E;   --c-pink-600:#ED93B1; --c-pink-800:#F4C0D1;  --c-pink-900:#FBEAF0;
}
@media (prefers-color-scheme: light) {
  :root {
    --surface-0:#fff; --surface-1:#f8f8f6; --surface-2:#fff;
    --text-primary:#1a1a1a; --text-secondary:#5f5e5a; --text-muted:#888780;
    --border:#d3d1c7; --border-strong:#b4b2a9;
    --c-gray-50:#F1EFE8;   --c-gray-100:#D3D1C7;   --c-gray-600:#5F5E5A;  --c-gray-800:#444441;  --c-gray-900:#2C2C2A;
    --c-blue-50:#E6F1FB;   --c-blue-100:#B5D4F4;   --c-blue-600:#185FA5;  --c-blue-800:#0C447C;  --c-blue-900:#042C53;
    --c-teal-50:#E1F5EE;   --c-teal-100:#9FE1CB;   --c-teal-600:#0F6E56;  --c-teal-800:#085041;  --c-teal-900:#04342C;
    --c-coral-50:#FAECE7;  --c-coral-100:#F5C4B3;  --c-coral-600:#993C1D; --c-coral-800:#712B13; --c-coral-900:#4A1B0C;
    --c-purple-50:#EEEDFE; --c-purple-100:#CECBF6; --c-purple-600:#534AB7;--c-purple-800:#3C3489;--c-purple-900:#26215C;
    --c-amber-50:#FAEEDA;  --c-amber-100:#FAC775;  --c-amber-600:#854F0B;--c-amber-800:#633806; --c-amber-900:#412402;
    --c-red-50:#FCEBEB;    --c-red-100:#F7C1C1;    --c-red-600:#A32D2D;  --c-red-800:#791F1F;   --c-red-900:#501313;
    --c-green-50:#EAF3DE;  --c-green-100:#C0DD97;  --c-green-600:#3B6D11;--c-green-800:#27500A; --c-green-900:#173404;
    --c-pink-50:#FBEAF0;   --c-pink-100:#F4C0D1;   --c-pink-600:#993556; --c-pink-800:#72243E;  --c-pink-900:#4B1528;
  }
}
svg { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.t  { font-size:14px; fill:var(--text-primary); }
.th { font-size:14px; font-weight:600; fill:var(--text-primary); }
.ts { font-size:12px; fill:var(--text-secondary); }
.box rect { fill:var(--surface-1); stroke:var(--border-strong); }
.arr { stroke:var(--border-strong); stroke-width:1.5; fill:none; }
.leader { stroke:var(--text-muted); stroke-width:0.5; stroke-dasharray:3 3; fill:none; }
</style>
<rect x="0" y="0" width="W" height="H" fill="var(--surface-0)"/>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>
<!-- diagram content goes here -->
</svg>
```

Dark is the default appearance (`:root`) — this is a deliberate, standing preference, not a fallback. Light only shows up via `@media (prefers-color-scheme: light)`, the reverse of a typical light-default/dark-override setup. Don't flip this back without being told to.

Replace `W`/`H` in both the `viewBox` and the background `<rect>` with the same computed numbers (see the ViewBox hard rule below) — the rect has to cover exactly the visible area, not a guessed size.

For a colored node, don't use a class — set `fill`/`stroke` inline from the matching ramp so it's explicit and greppable:
```svg
<rect fill="var(--c-blue-50)" stroke="var(--c-blue-600)" stroke-width="0.5" .../>
<text class="th" fill="var(--c-blue-800)">Title</text>
<text class="ts" fill="var(--c-blue-600)">Subtitle</text>
```
In light mode every one of those flips automatically. **Never write a literal hex color directly on a diagram element** — always go through a `var(--...)` token, or light mode silently breaks.

Use `marker-end="url(#arrow)"` on any line/path that should end in an arrowhead. It inherits whatever color the line/path is, automatically.

## Hard rules — check every one before calling a diagram done

**ViewBox.** `viewBox="0 0 W H"` — compute both dimensions from actual content, the same way. `H` = bottom-most element's y + height, plus a 40px buffer. `W` = right-most element's x + width, plus a 40px buffer. Don't guess a round number and hope for either one. For a simple diagram (a handful of boxes, one column) W naturally lands around 680-900 — no reason to force it wider than the content needs. For a wide comparison, a multi-lane branch, or anything cramped at that width, let W grow; there's no ceiling to respect here, this is a standalone file, not an embedded panel. Safe content area is x: 40–(W-40), y: 40–(H-40). Remember to update the background `<rect>`'s `width`/`height` to the same W/H — it's a separate element from `viewBox` and won't resize itself.

**Box width from text, not vibes.** At 14px: ~8px per character. At 12px: ~7px per character. `box_width = max(title_chars × 8, subtitle_chars × 7) + 24` (24 = padding both sides). If a label is 20 characters at 14px, that's 160px of text — a 140px box will visibly overflow. When in doubt, widen the box.

**Two-line box anatomy** (title + subtitle, 56px tall):
```svg
<g>
  <rect x="100" y="20" width="200" height="56" rx="8" stroke-width="0.5" fill="var(--surface-1)" stroke="var(--border-strong)"/>
  <text class="th" x="200" y="38" text-anchor="middle" dominant-baseline="central">Title here</text>
  <text class="ts" x="200" y="56" text-anchor="middle" dominant-baseline="central">Subtitle, five words max</text>
</g>
```
Single-line box: 44px tall, one centered `class="th"` line. Every `<text>` inside a box needs `dominant-baseline="central"` with y at the vertical center of its row — without it the glyph sits ~4px high and looks subtly wrong.

**Subtitles are ≤5 words.** If it needs more, that detail belongs in the prose around the diagram, not crammed into the box. SVG text never auto-wraps — every line break needs an explicit `<tspan x="..." dy="1.2em">`, so the real fix is almost always "shorten it," not "wrap it."

**Spacing.** 60px minimum vertical gap between sequential boxes. Siblings in the same row can sit with 16–20px gaps (do the arithmetic: N boxes × width + (N-1) × gap gives you the required row width. Since W is computed from content, not fixed, the default move when a row is cramped is to let W grow to fit it, not to shrink the boxes. Only shrink, wrap to two rows, or split into two diagrams if growing W would make the diagram absurdly wide for what it's showing — e.g. 3 boxes stretched across 1400px).

**Arrows never cross a box.** Before drawing any `<line>`/`<path>`, check its coordinates against every box already placed. If the direct path would cross one, route an L-bend instead: `<path d="M x1 y1 L x1 ymid L x2 ymid L x2 y2" fill="none" class="arr" marker-end="url(#arrow)"/>`. Every connector `<path>` needs `fill="none"` explicitly — SVG defaults paths to filled black, and a curved connector without it renders as a black blob instead of a line.

**Labels cannot share a gap area.** A "gap area" is any space between two containers — between boxes, between a boundary line and a box, or between a box and the diagram edge. Before placing a label in a gap area, check: does anything else (another label, an arrow, a boundary line) occupy a similar y-range at the same x-range? If yes, one element must move. Three fixes in priority order: (1) shorten the label so it fits beside the other element; (2) switch from centered to left- or right-aligned so it occupies a different x-range; (3) use the badge pattern — a small `<rect fill="var(--surface-0)"/>` drawn behind the text, placed over the line, masking the line so it reads as annotation not overlap. Arrow labels go to the **side** of the arrow, not at the same y-level as another label in the same band. Floating text outside boxes (e.g. "external service", "outside the browser") almost always collides with nearby arrows — move that information inside the relevant box as a subtitle instead.

**Color encodes category, not decoration.** Pick 2-3 ramps per diagram max. Same type of thing = same color, every time. Gray is for neutral/structural/start/end nodes. Don't rainbow through every ramp — that's noise, not information. If color is carrying real meaning (a status, a tier), add a one-line legend (see advanced patterns).

**Max 4-5 boxes per single linear flow.** If the real process has more steps than that, it's not one diagram — split into an overview diagram plus one diagram per sub-flow, with a paragraph of prose between them. This limit doesn't apply to comparison/multi-column layouts — there it's 4-5 boxes *per column*. For the full version of this judgment call at large scale — branching flows, parallel processes, when a 20-node diagram is still legible versus when it isn't — see `references/complex-diagrams.md`.

**No filters, gradients, shadows, or blur** except the one specific gradient case in illustrative diagrams (continuous physical property like temperature). Flat fills only. Gradients and shadows are what makes a diagram look like a 2014 PowerPoint slide instead of documentation.

## Recipe: flowchart (linear)

Single direction, top-down or left-right, 60px gaps, two-line boxes per the anatomy above, neutral gray for start/end, one accent color for the process steps. This is the default for "what happens when X" questions.

## Recipe: structural (containment)

Outer container: large rounded rect (`rx="20"`), lightest fill from one ramp, label top-left. Inner regions: smaller rounded rects (`rx="12"`) in a *different* ramp than the parent so the nesting reads at a glance, side by side with 16px+ gaps, 20px clearance from the container edges. Max 2-3 nesting levels — past that, color-in-color containment stops reading as "this is inside that" even with plenty of width to spare. It's a comprehension ceiling, not a pixel one, so growing the canvas doesn't buy you a 4th level. External inputs/outputs are short labels outside the container with an arrow crossing the boundary.

```svg
<g><!-- outer -->
  <rect x="120" y="50" width="440" height="200" rx="20" fill="var(--c-purple-50)" stroke="var(--c-purple-600)" stroke-width="0.5"/>
  <text class="th" x="340" y="80" text-anchor="middle" fill="var(--c-purple-800)">Outer system</text>
</g>
<g><!-- inner region -->
  <rect x="150" y="120" width="180" height="100" rx="12" fill="var(--c-teal-50)" stroke="var(--c-teal-600)" stroke-width="0.5"/>
  <text class="th" x="240" y="150" text-anchor="middle" fill="var(--c-teal-800)">Sub-component</text>
</g>
```

## Recipe: illustrative (intuition, not reference)

For "how does X actually work" — abstract things get a spatial metaphor (a hash table is a row of buckets catching falling items; gradient descent is a ball rolling down a contour surface), physical things get a simplified cross-section. Shapes can be freeform (`<path>`, `<ellipse>`, curves) and can overlap for depth — that permission does NOT extend to text, which always needs 8px of clear air around it. Color encodes intensity here (warm = active/hot, cool/gray = dormant/cold), not category. One `<linearGradient>` is allowed, only for a genuinely continuous property, only two stops, same ramp. This is the highest-payoff diagram type when the question is "make me get it," and the one worth taking the most care on — a static cross-section is good, one with a slider or toggle the user can actually operate is better.

**The shape has to carry the metaphor on its own, before any label is read.** Cover up every `<text>` element and look at just the shapes and colors — if the metaphor isn't legible at that point (which parts are "the same thing," what's foreground vs. background, what the spatial relationship represents), labels are doing the work shapes should be doing, and that's a sign to redraw, not to add a caption explaining it. Two disconnected, differently-styled shapes captioned "this represents X" and "this represents Y" is a diagram with a caption bolted on, not a spatial metaphor — the two parts of a real metaphor usually need to be the *same visual material* (continuous outline, shared shape family, or literally one connected path) so the relationship reads from geometry alone.

## Scripting large diagrams

For grids, generated layouts, or anything with 10+ repeated elements (e.g. a board of pixels, a calendar, a bar chart with 30 bars), don't hand-type every coordinate — write a short Python or JS snippet that computes positions in a loop and emits the SVG string, then save that output as the `.svg` file. Hand-typed coordinates are where arithmetic mistakes creep in and boxes start overlapping.

For anything that should update without re-running Claude (a counter, a form, a filter on a dataset), make it an interactive HTML widget instead of a static SVG: real `<input>`/`<button>` elements, vanilla JS, state held in a JS variable (never `localStorage` — keep it in-memory, the file should work the same on every open). This is the one case that's genuinely `.html`, not `.svg`, since `<input>`/`<button>` aren't SVG elements — same color tokens, same restraint on gradients/shadows, `<style>` back in a normal `<head>`.

## Before calling it done — checklist

- Saved as a standalone `.svg` file — no `<html>`/`<body>` wrapper, `<style>` lives inside `<svg>`
- Every box width checked against its longest text line
- No arrow crosses through a box it isn't pointing at
- ViewBox height and width computed from actual content, not guessed, and the background `<rect>` matches
- Colors only via `var(--...)`, none hardcoded
- Subtitles are ≤5 words
- Abbreviations spelled out the first time they're used
