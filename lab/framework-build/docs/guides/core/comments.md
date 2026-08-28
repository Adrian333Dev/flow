---
name: comments
description: Code commenting rules — file header format and inline comment conventions. Read before creating a new file, substantially rewriting one, or adding any comments to existing code.
---

## Rule: write comments when writing code

Never add comments in a separate pass. When a file is created or substantially rewritten:
1. File header goes in before any imports or code
2. Inline comments go in at the same time as the code they annotate

---

## File header

Every new file gets a 1–3 line `//` block at the very top explaining:
- **What** this file owns (its role)
- **Why** it exists as a separate file (non-obvious constraint or boundary)
- **How** it fits into the larger system — only if not obvious from the name

```typescript
// Decides which response flow fires for a given /v1/message request.
// Reads video_analysis.status + video_beats; never calls LlmService directly.
// Parallel to PreprocessingOrchestrator — they share no state and never sync.
```

**Rules:**
- `//` only — no JSDoc (`/** */`), no block comments
- Max 3 lines. If you need more, the file is probably doing too much
- Explain WHY this file exists, not what TypeScript already says
- No task references, no "added for X", no "used by Y"

---

## Inline comments

- Explain WHY or the non-obvious consequence — never WHAT
- `//` on its own line immediately before a class or function definition
- Inline `//` at end of line for variables and fields
- Every word earns its place — cut anything that restates the code
- Calls that cross environment/process boundaries always get a comment (they look local but aren't)

---

## What NOT to comment

- Obvious code (`// increment counter`, `// return the result`)
- What the function name already says
- The current task, milestone, or calling code
- Anything that will rot as the codebase evolves
