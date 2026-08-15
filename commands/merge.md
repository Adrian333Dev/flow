---
description: Read many files as one stream, with an optional instruction after `--`
argument-hint: <path>... [-- what to do with them]
---

!`fmerge $ARGUMENTS`

Typed: `$ARGUMENTS` — everything after `--` is the instruction, and the files above are what it applies to.

No `--` → the files are context for what comes next. Wait for it.
