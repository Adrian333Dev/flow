---
name: run
description: Runs a shell command and reads its output.
argument-hint: '<command> [args...]'
disable-model-invocation: true
---

!`$ARGUMENTS 2>&1 || true`

Typed: `$ARGUMENTS`. Errors print above with the output. An empty block means the command printed nothing.

- **The typed line ends in an instruction** → follow it, against the output above.
- **No instruction** → the output is context. Wait for what comes next.
