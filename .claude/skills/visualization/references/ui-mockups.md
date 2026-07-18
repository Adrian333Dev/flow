# UI mockups

Use when a request needs real UI/UX visual judgment — "show me a mockup," "what would this look like," "design this screen," "compare these two states of the component." ASCII is inadequate here: it can't express visual weight, containment, hierarchy, or realistic proportions. This is the one case in this skill where the output is HTML/CSS, not SVG — a mockup simulates a real interface, it doesn't diagram a process. Applies to any UI markup request, not just side-by-side comparisons — a single mockup gets the same treatment as a two-way comparison, just with one `.scenario` instead of two.

Start from `examples/html-sketch.html` in this skill — don't reconstruct the CSS from scratch. It uses the exact same color tokens as every SVG diagram in this skill (see the base stylesheet in `references/svg-diagrams.md`), plus a manual light/dark toggle so both states of a component can be checked without touching OS settings.

This is the default approach for UI mockups today, not a permanent lock. The SVG-diagram side of this skill already produces sharper, more reliable output than this template does for everything else it covers — it's plausible the diagram machinery eventually absorbs mockup generation too. If a better fit turns up, replace this file, don't patch around it.

## Layout principles

Apply regardless of what's being sketched or how many scenarios there are:

- **Isolation** — each scenario/state gets its own visual column; never mix states inside one component
- **External labels** — scenario label and description sit above the component with a clear gap; never inside the component HTML
- **Real UI only** — the component contains exactly what the real UI would show; no annotations, scenario IDs, or design notes inside
- **Realistic dimensions** — match the thing being sketched; a sidebar is narrow, a page is wide, a card is card-sized
- **Consistent scale** — all scenarios in one sketch at the same scale
- **Left → right ordering** — natural reading direction: before → after, fewer features → more, normal → edge case → error
- **Columns compare; rows stack** — side-by-side columns for states that compare; consider vertical stacking for sequential flows
- **Past 4 columns** — reconsider grouping or split into two sketches

## One-shot rules

Follow these to avoid a styling iteration round:

- Copy `examples/html-sketch.html` as the starting point — never start from blank HTML
- Set `.panel` width to match the real thing (sidebar narrow, modal medium, page wide)
- Define item variant types with left-border accent + `color-mix` tinted background
- All base colors through `var(--...)` tokens — only accent values (item-type colors) are hardcoded, same rule as every SVG diagram in this skill
- Never stack `opacity` on a color token to create a dimmer variant — use the next token down the ramp instead (e.g. `--c-blue-800` instead of `--c-blue-600` at half opacity)
- Labels always external: `.scenario-label` + `.scenario-desc` above each `.scenario` div, never inside `.panel`
- Always include the light/dark toggle — it's in the template, don't remove it
- Dark mode is the default (`class="dark"` on `<html>`) — don't change this

## What to avoid

- ASCII art for any UI context
- Opacity stacked on a color token
- Annotations, labels, or scenario text inside component HTML
- Hardcoded hex for base colors — use `var(--...)` tokens; only hardcode accent colors for item types
