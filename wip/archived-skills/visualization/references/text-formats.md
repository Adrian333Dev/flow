# Text formats

Use for: code flows, architecture, logic branches, system behavior, decision trees, linear sequences — anywhere a written explanation captures the shape of the thing without needing spatial or visual judgment. This is the default output of Step 0 in `SKILL.md` — reach for one of these before reaching for a diagram.

**No Mermaid.** Terminal users see raw unrendered syntax — a code block below renders correctly everywhere Mermaid doesn't.
**Style split:** Plain sentences for explanatory text, lead-ins, and rule callouts. Short labels inside tree/flow blocks — one line per step, no filler. Don't assume the user knows the domain: one plain-language sentence establishing what the thing *is* before describing how it works.

## Text-tree — flows with branching or sub-steps

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

## Numbered prose — linear sequences, no branching

```
1. First thing happens
2. Second thing happens
3. Third thing happens
```

## Sequential / flow text — decision trees, state machines, if/else logic

```
input.status:
  rejected                    → outcome A
  null / pending              → outcome B
  analyzed                    → check secondary condition
    condition true            → outcome C
    condition false           → outcome B
```

## When to use which

| Situation | Format |
|---|---|
| Code flow, architecture, branching logic | Text-tree |
| Linear sequence | Numbered prose |
| Decision tree / state machine / if-else | Sequential flow |

For anything involving spatial relationships, visual comparison, or UI — this isn't the right tool. Go back to `SKILL.md`'s Step 1 decision tree.

## What to avoid

- Multi-paragraph explanation for a single step — one line, one thing
- Prose between diagram steps — if a WHY is needed, one parenthetical on the same line
