---
description: Run a shell command and put its output in the session
argument-hint: <command> [args...]
---

!`$ARGUMENTS 2>&1 || true`

Typed: `$ARGUMENTS`. Errors print above with the output. An empty block means the command printed nothing.

- **The typed line ends in an instruction** → follow it, against the output above.
- **No instruction** → the output is context. Wait for what comes next.
