# Advanced patterns

Read this when the diagram is more than one simple flow or container — side-by-side comparisons, a path that's blocked/broken vs one that succeeds, a recommendation callout, a legend. This is what separates a diagram that looks like documentation from one that looks generic. ViewBox height routinely runs 600-900px for these — that's fine, just compute it from actual content, never guess.

## Side-by-side comparison columns

Two (or three) independent vertical flows in the same viewBox, each under its own header badge, so the user can visually compare options without scrolling between two separate diagrams.

**Header badge** — a small pill above each column naming the option:
```svg
<rect x="40" y="20" width="280" height="28" rx="6" fill="var(--c-red-50)" stroke="var(--c-red-100)" stroke-width="0.5"/>
<text x="180" y="39" text-anchor="middle" class="th" fill="var(--c-red-800)">Option 1 — URL-based loop</text>
```
Color the badge to hint at the column's verdict before the user reads a single box: red/coral for "this breaks," green/teal for "this works," gray/blue for neutral. The viewer should be able to glance at just the two badges and the two legend dots at the bottom and get the headline.

**Column layout.** Pick x-ranges with a real gutter between them and lay out each column's boxes independently, top to bottom, using the same flowchart rules as a single diagram (60px vertical gaps, box width from text). For two columns on a ~680-wide canvas that's e.g. column A: x 40-320, column B: x 360-640, gutter ≈ 40px — but those numbers follow from W, they aren't fixed. For 3-4 columns, don't compress each one to fit inside 680px; let W grow so every column keeps a comfortable width, then divide the wider canvas into that many lanes plus gutters. Columns don't need the same number of boxes — a "this fails fast" column is often shorter than the one that succeeds, and that asymmetry itself is informative.

## Status-coded paths: success vs blocked

When a flow can succeed or fail depending on a branch, color the connector and the downstream boxes by outcome, not just the boxes:

```svg
<!-- a step that fails -->
<line x1="265" y1="112" x2="265" y2="140" stroke="var(--c-red-600)" stroke-width="1.5" marker-end="url(#arrow)"/>
<g>
  <rect x="195" y="140" width="140" height="44" rx="8" fill="var(--c-red-50)" stroke="var(--c-red-600)" stroke-width="0.5"/>
  <text class="th" x="265" y="158" text-anchor="middle" dominant-baseline="central" fill="var(--c-red-800)">Step blocked</text>
  <text class="ts" x="265" y="174" text-anchor="middle" dominant-baseline="central" fill="var(--c-red-600)">Reason it failed</text>
</g>
```
An explicit "✕" mark on the connector reads faster than a color alone — drop a small `<text class="t" fill="var(--c-red-600)">✕</text>` at the connector's midpoint, offset slightly so it doesn't sit on the line itself.

**Dead-end termination.** When a branch just stops (rather than flowing into the next box), end it with a short dashed stub and a label instead of trailing off mid-air:
```svg
<line x1="265" y1="184" x2="265" y2="210" stroke="var(--c-red-600)" stroke-width="1.5" stroke-dasharray="4 3"/>
<text class="ts" x="265" y="226" text-anchor="middle" fill="var(--c-red-600)">Loop broken</text>
```
The success branch in the parallel column uses the same shapes with `var(--c-green-*)` or `var(--c-teal-*)` instead, and a solid (non-dashed) line all the way through, so the visual contrast between "this path dies" and "this path continues" is immediate.

## Return / loop arrows that have to cross open space

A late-stage box sometimes needs to point back to something near the top (e.g. "installing this turns a non-user into a user, who now feeds back into step one"). A straight or simply-curved line will usually cross through unrelated boxes or text in between. Two ways to handle it, in order of preference:

**1. Manual bypass route (default — do this first).** Compute a path that hugs the empty margin around your boxes rather than cutting through the middle. You already know every box's bounding rect from your layout step, so route the curve through the gaps:
```svg
<path d="M600 500 Q600 560 120 560 Q120 530 120 515"
      fill="none" stroke="var(--c-teal-600)" stroke-width="1.5"
      stroke-dasharray="5 3" marker-end="url(#arrow)"/>
```
Plan the route by eye against your coordinate list before writing it — drop down into clear space below the lowest box, travel horizontally there, then come back up into the target. This handles the vast majority of cases and doesn't need anything fancy.

**2. SVG mask, for when the route genuinely must cross over existing text.** Build a mask that's solid white everywhere except small black cutout rects positioned exactly over each text element the path would otherwise run through, then apply it to the path so it visually "ducks under" the text instead of drawing over it:
```svg
<defs>
  <mask id="text-gaps" maskUnits="userSpaceOnUse">
    <rect x="0" y="0" width="680" height="900" fill="white"/>
    <!-- one cutout rect per text element the path crosses, sized to that text's bounding box + ~4px padding -->
    <rect x="210" y="141" width="108" height="22" fill="black" rx="2"/>
  </mask>
</defs>
<path d="..." mask="url(#text-gaps)" .../>
```
This only pays off when you have the exact bounding box of every text element in the way — eyeball it from your own coordinates (text width ≈ chars × 8px at 14px, × 7px at 12px; height ≈ font-size + 8px) rather than guessing. If you can't pin the boxes down confidently, use the bypass route instead — a slightly longer path beats a path that clips through a letterform.

## Insight / recommendation callout

A single highlighted box below the main diagram, visually distinct from the flow boxes (different fill, accent border), holding the one-sentence takeaway:
```svg
<rect x="40" y="600" width="600" height="56" rx="8" fill="var(--surface-1)" stroke="var(--c-blue-600)" stroke-width="0.5"/>
<text class="th" x="340" y="618" text-anchor="middle" fill="var(--c-blue-800)">Key insight, stated as one sentence</text>
<text class="ts" x="340" y="636" text-anchor="middle" fill="var(--text-secondary)">A second line of supporting detail if it earns its place</text>
```
Use this sparingly — one per diagram, max. It's for the conclusion the comparison was building toward, not a third stream of commentary running alongside the boxes.

## Legend

Only needed when color is carrying real meaning the user has to decode (status, category, outcome) — skip it if the diagram is self-explanatory from labels alone. A single row of swatch + label pairs along the bottom:
```svg
<g>
  <rect x="40" y="700" width="10" height="10" rx="2" fill="var(--c-red-600)"/>
  <text class="ts" x="56" y="710" fill="var(--text-secondary)">Path blocked</text>
</g>
<g>
  <rect x="160" y="700" width="10" height="10" rx="2" fill="var(--c-teal-600)"/>
  <text class="ts" x="176" y="710" fill="var(--text-secondary)">Path succeeds</text>
</g>
```
Space entries roughly 120px apart on the x-axis, adjust based on label length. Keep every legend label to two or three words — it's a key, not a caption.

## Putting it together

A full comparison diagram is, in order: two header badges → two independent flowing columns (each following the flowchart rules, colored by outcome as it branches) → one insight callout spanning the full width → one legend row. That's the shape of "comparison diagram" as a reusable template — swap in any two options being weighed against each other and the structure holds.
