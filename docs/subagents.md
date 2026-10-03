# Subagents

A subagent is a second agent your session starts for one job, with its own conversation, which reports back when done. This page covers which ones Flow starts, how one asks you a question, and how Flow proves what one changed.

## Table of contents

- [When Flow starts one](#when-flow-starts-one): the 4 jobs Flow hands to a subagent
- [Talking to a subagent](#talking-to-a-subagent): finding it, and answering its question
- [What a subagent changed](#what-a-subagent-changed): the record Flow hands back, and why it says "error"
- [What Flow turns off](#what-flow-turns-off): forks and worktrees
- [After a crash](#after-a-crash): what survives, and how to carry on

## When Flow starts one

A subagent starts with only the prompt it is given, your project's rule files, and the git status. It never sees your conversation. It runs in the background, edits your files where they are, and the session keeps working until its report arrives.

- **`/flow:execute` → a worker for a mechanical step.** Where every edit is already decided and the step spans about 5 or more files, or 10 or more near-identical edits, the step goes to `haiku-worker`. It is Flow's own subagent, running Claude's smallest model, Haiku, so the step costs less.
- **`/flow:groundwork` → a prototype.** A question only running code can answer gets a `prototype` ticket, and a subagent runs `/flow:prototype` on it. The session that asked would accept a vague question it already understands, so it never builds the answer itself.
- **`/flow:debug` → a fresh hunt.** When every guess at a bug's cause has failed, a subagent takes the hunt from the report, free of the guesses already ruled out.
- **`/flow:research` → readers.** A subject too big to read in the session goes to subagents, which write their reports where `/flow:research` files them.

A prototype or a hunt keeps its own ticket, so a session that ends mid-run loses the subagent and keeps the work. `/flow:start /shop-12` picks it up.

## Talking to a subagent

Each running subagent has a row in the panel below the box you type in. Press `↓` to reach the panel, then `Enter` on a row to open the subagent's conversation. Type there to send it a message, and press `←` to go back.

A subagent asks you something by ending its turn on the question. Your session passes it on in one line:

```text
shop-12 asks: Should the importer skip rows with no date, or stop? Answer in its row below the prompt.
```

Open the row and type the answer. The subagent carries on with everything it knew. Your session never answers for you: it never saw the subagent's reasoning, and a guess passed on reads like your decision.

## What a subagent changed

A subagent saying it is done, or listing the files it edited, proves nothing. Flow records every change as it happens, under the subagent that made it. When the subagent finishes, your session gets a diff of each file it changed:

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

**"Stop hook blocking error" means nothing failed.** Claude Code labels every message a background hook sends that way. Flow's rules tell the agent so.

Several subagents can work at once, and each record holds only that subagent's changes. A file changed by a shell command is listed with the command:

```text
1 file changed.

Commands that changed files:
- `echo beta > /home/me/code/flow/tmp/try/project/b.txt`: b.txt
```

## What Flow turns off

- **Forks**: a subagent that starts with a copy of your whole conversation. Flow wants each subagent to see only what its prompt gives it, so the setup denies them.
- **Worktrees**: a separate copy of your project for a subagent or a background session to work in, made from the last commit. It cannot see your uncommitted work, and Flow's change record already keeps parallel workers apart, so Flow turns it off.

## After a crash

A power cut or a closed terminal ends every subagent with the session.

- **Files already written stay written.**
- **`claude --resume`** brings back your conversation and every subagent's history.
- **A subagent never restarts by itself.** Ask the session to carry it on, or type into its row.
- **Its change record survives**, in `~/.flow/changes/`, so the diff handed back after the resume includes what it changed before the crash.
