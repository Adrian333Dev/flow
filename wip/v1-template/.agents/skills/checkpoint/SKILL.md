---
name: checkpoint
description: Save a comprehensive session checkpoint to the active milestone folder. Acts as both a compact command and a progress snapshot — detailed enough that the next session can resume without re-reading source files or conversation history. Trigger when user says "save context", "checkpoint", or "/checkpoint".
---

## When NOT to use this skill

**Do not use during design or planning phases** (architectural decisions, Q&A grills, brainstorming). This skill's minimal format is wrong for preserving design reasoning — use the milestone's `spec.md` instead.

Only use this skill when implementation has started and the session involved writing actual code.

---

Determine the active milestone from `docs/work/now.md` (already in context). Write `docs/work/milestones/<active-milestone>/session.md`. Overwrite if it already exists.

The file must be detailed enough that reading it alone is sufficient to fully resume work. Write it as if briefing a colleague who knows the codebase but has zero memory of this session.

---

## Structure to write

```markdown
# Session checkpoint — <milestone-id>
_Saved: <date>_

## Session narrative
<!--
  3–5 paragraphs. This is the most important section.
  Cover: what the goal was, what was actually done, key decisions made and WHY,
  any approaches tried and abandoned (and why), anything surprising or non-obvious.
  Write enough that someone reading this cold understands the full context.
-->

## Decisions made this session
<!--
  Decisions that aren't in plan.md — things that emerged during implementation.
  Format: decision → reasoning
-->
- **<decision>**: <why>
- ...

## Implementation state

### Completed
- `<path>` (lines <X>–<Y>): <what was done>
- ...

### In progress
- `<path>`: <what was started, what's still missing, what the partial state is>
- ...

### Not yet started (still in plan)
- <phase or file still to do>
- ...

## Resume: start here next session
<!--
  Make this executable. First thing to open, first line to write.
  List 3–5 ordered steps.
-->
1. **<file>**: <exact action — what to write, where>
2. ...

## Code context
<!--
  Paste the exact code the next session will need to read or extend.
  Include: function signatures, interfaces, key constants, anything that
  would otherwise require opening a source file.
  Label each snippet with file path and line range.
-->

### <description of snippet>
\`\`\`typescript
// <path/to/file> lines <X>–<Y>
<code>
\`\`\`

## Relevant conventions (if non-obvious)
<!--
  Only include if something unusual applies to the work being done.
  Skip if everything follows standard project conventions.
-->
- ...

## Open questions / blockers
- <item, or "none">

## Deferred (noted for later, not in plan)
- <item>
```

---

After writing the file, tell the user:

> "Context saved to `docs/work/milestones/<milestone>/session.md`. You can start a new session — I'll resume from the checkpoint without needing to re-read the conversation or source files."

If the active milestone is ambiguous, ask before writing.
