---
name: visualization
description: Format rules and layout principles for code flow diagrams, architecture visualization, and UI/UX design sketches. Covers text-tree formats, explanation sequencing, and HTML mockup guidelines. Read before presenting any diagram, flow, or design sketch.
---

## Text formats

Use for: code flows, architecture, logic branches, system behavior, decision trees, linear sequences.

**No Mermaid.** Terminal users see raw unrendered syntax.
**Telegraph style throughout.** One line per thing. No padding. Fragments over sentences.

### Text-tree — flows with branching or sub-steps

```
1. Step one
   → sub-step
   → sub-step

2. Step two — parallel split

   ├─ Path A
   │  condition X → outcome
   │  condition Y → outcome
   │
   └─ Path B
      condition X → outcome
      condition Y → outcome
```

Code block preserves indentation in all renderers and terminal.

### Numbered prose — linear sequences, no branching

```
1. First thing happens
2. Second thing happens
3. Third thing happens
```

### Sequential / flow text — decision trees, state machines, if/else logic

```
input.status:
  rejected                    → outcome A
  null / pending              → outcome B
  analyzed                    → check secondary condition
    condition true            → outcome C
    condition false           → outcome B
```

---

## When to use which format

| Situation | Format |
|---|---|
| Code flow, architecture, branching logic | Text-tree |
| Linear sequence | Numbered prose |
| Decision tree / state machine / if-else | Sequential flow |
| Any UI/UX visual judgment needed | HTML sketch — never ASCII |

---

## Explanation sequencing

1. Plain text first — establish vocabulary, surface trade-offs before committing to any visual
2. Once mental model is aligned and visual judgment is needed → switch to HTML sketch
3. If user corrects mental model mid-sketch → stop generating visuals, read prior design docs first
4. After feedback: fix all issues at once — not one at a time

---

## HTML design sketches

ASCII is inadequate for UI: can't express visual weight, containment, hierarchy, or realistic proportions. Use HTML whenever visual judgment is needed.

Start from `html-sketch.html` in this folder — don't reconstruct the CSS from scratch. The template has the full color system, light/dark toggle, and structural scaffolding battle-tested across multiple sessions.

### Layout principles

Apply regardless of what's being sketched or how many scenarios there are:

- **Isolation** — each scenario/state gets its own visual column; never mix states inside one component
- **External labels** — scenario label and description sit above the component with a clear gap; never inside the component HTML
- **Real UI only** — the component contains exactly what the real UI would show; no annotations, scenario IDs, or design notes inside
- **Realistic dimensions** — match the thing being sketched; a sidebar is narrow, a page is wide, a card is card-sized
- **Consistent scale** — all scenarios in one sketch at the same scale
- **Left → right ordering** — natural reading direction: before → after, fewer features → more, normal → edge case → error
- **Columns compare; rows stack** — side-by-side columns for states that compare; consider vertical stacking for sequential flows
- **Past 4 columns** — reconsider grouping or split into two sketches

### One-shot rules

Follow these to avoid a styling iteration round:

- Copy `html-sketch.html` as the starting point — never start from blank HTML
- Set `.panel` width to match the real thing (sidebar narrow, modal medium, page wide)
- Define item variant types with left-border accent + `color-mix` tinted background
- All base colors through CSS vars — only accent hex values (item type colors) are hardcoded
- Never stack `opacity` on a CSS var to create a dimmer variant — use explicit `oklch` values for every text level
- Labels always external: `.scenario-label` + `.scenario-desc` above each `.scenario` div, never inside `.panel`
- Always include the light/dark toggle — it's in the template, don't remove it
- Dark mode is the default (`class="dark"` on `<html>`) — don't change this

---

## What to avoid

- Multi-paragraph explanation for a single step — one line, one thing
- Prose between diagram steps — if a WHY is needed, one parenthetical on the same line
- ASCII art for any UI context
- Opacity stacked on CSS color vars
- Annotations, labels, or scenario text inside component HTML
- Hardcoded hex for base colors — use vars; only hardcode accent colors for item types
- Abbreviations without prior definition — spell out the first time
