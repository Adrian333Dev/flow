# Subagents

A subagent is a second agent your session starts for one job, with its own conversation, which reports back when done. It never sees your conversation, runs in the background, and edits your files where they are.

## Table of contents

- [When Flow starts one](#when-flow-starts-one): the 4 jobs Flow hands to a subagent
- [Talking to a subagent](#talking-to-a-subagent): finding it, and answering its question
- [What a subagent changed](#what-a-subagent-changed): the record Flow hands back, and why it says "error"
- [After a crash](#after-a-crash): what survives, and how to carry on

## When Flow starts one

- **`/flow:execute` → a mechanical step**, such as the same edit across 10 files, goes to `haiku-worker`, Flow's subagent on Claude's smallest model, so it costs less.
- **`/flow:groundwork` → a prototype**, run on its own ticket, so the session that asked the question never grades its own answer.
- **`/flow:debug` → a fresh hunt**, once every guess has failed, free of the guesses already ruled out.
- **`/flow:research` → readers**, for a subject too big to read in the session.

Flow turns off forks, subagents that start with a copy of your whole conversation, and worktrees, separate copies of the project that miss your uncommitted work.

## Talking to a subagent

Each running subagent has a row in the panel below the box you type in. Press `↓`, then `Enter` on a row to open its conversation, type to message it, and `←` to go back.

A subagent's question reaches you in one line:

```text
shop-12 asks: Should the importer skip rows with no date, or stop? Answer in its row below the prompt.
```

Answer in its row. Your session never answers for you.

## What a subagent changed

A subagent's report of what it changed proves nothing. Flow records every change as it happens, and when the subagent finishes, your session gets a diff of each file it changed:

```text
Stop hook blocking error from command "PostToolUse:Agent": Flow's change record for subagent acde662e8feb7ed27 (general-purpose). The changes.js hook built it from what the subagent's own tool calls did to the files, not from its report.

2 files changed.

diff --git a/a.txt b/a.txt
new file mode 100644
index 0000000..4a58007
--- /dev/null
+++ b/a.txt
@@ -0,0 +1 @@
+alpha

diff --git a/shared.txt b/shared.txt
index e5c5c55..7b363c9 100644
--- a/shared.txt
+++ b/shared.txt
@@ -1,2 +1,2 @@
-line one
+LINE ONE
 line two
```

**"Stop hook blocking error" means nothing failed.** Claude Code labels every message from a background hook that way.

## After a crash

A power cut or a closed terminal ends every subagent with the session.

- **Files already written stay written.**
- **`claude --resume`** brings back your conversation and every subagent's history.
- **A subagent never restarts by itself.** Ask the session to carry it on, or type into its row.
- **Its change record survives**, so the diff after the resume includes what it changed before the crash.
