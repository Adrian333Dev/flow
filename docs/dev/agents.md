# The agents Claude Code runs

A Claude Code session can hand work to another agent: a second model conversation with its own context. This page lists every kind, says what each one starts with, whether you can type to it, and where its edits land, then says which ones Flow uses and how Flow proves what one changed.

Checked against Claude Code 2.1.271 on 2026-09-15. The sources are [Subagents](https://code.claude.com/docs/en/sub-agents), [Agent view](https://code.claude.com/docs/en/agent-view) and [Hooks](https://code.claude.com/docs/en/hooks).

## Table of contents

- [The kinds at a glance](#the-kinds-at-a-glance)
- [A subagent](#a-subagent)
- [A one-shot subagent](#a-one-shot-subagent)
- [A background session](#a-background-session)
- [Kinds Flow turns off](#kinds-flow-turns-off)
- [How a subagent asks you something](#how-a-subagent-asks-you-something)
- [What Flow uses, and where](#what-flow-uses-and-where)
- [What a subagent changed](#what-a-subagent-changed)
- [After a crash](#after-a-crash)

## The kinds at a glance

- **A subagent**: a fresh conversation started from a prompt, living inside your session. You can open it and type to it. Flow uses it.
- **A one-shot subagent**: `Explore` or `Plan`. It answers once and can never be resumed. Flow uses it for reading.
- **A background session**: a whole second session with its own row in agent view, outliving your terminal. Flow does not start one.
- **A fork**: a subagent that starts with a copy of your whole conversation. Flow denies it.
- **An agent team**: several sessions working under a lead. Experimental and off by default, so Flow has nothing to say about it.

## A subagent

The session starts one with the `Agent` tool, giving it a prompt and a type: `general-purpose`, or a name defined in `agents/`, such as Flow's `haiku-worker`.

- **What it starts with**: the prompt, every `CLAUDE.md` that loads for the project, and the git status. Never your conversation, and never the files the parent already read.
- **Where it runs**: in the background, by default since Claude Code 2.1.198. The parent keeps working, and the subagent's report arrives on a later turn.
- **Where you see it**: a row in the panel below the prompt. Press `↓` to reach the panel, `Enter` to open the subagent's transcript, and type to send it a message. `←` goes back.
- **Its tools**: a background subagent keeps a fixed set: `Read`, `Grep`, `Glob`, `Bash`, `Edit`, `Write`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `SendMessage` and a few more, plus every MCP tool. `AskUserQuestion` is never among them.
- **Where its edits land**: in your working copy, the same files the parent sees.
- **How it ends**: it writes its report and stops. The parent receives the report, then a notice saying it finished.
- **Resuming it**: a finished subagent keeps its whole history. The parent resumes it with `SendMessage` to its id, or you type into its row. The resumed run continues under the same id.
- **Its lifetime**: it dies when the session ends. Resuming the session with `claude --resume` brings its history back, and it runs again only when messaged.

A subagent can start subagents of its own, up to 3 levels below the main conversation.

## A one-shot subagent

`Explore` and `Plan` are built into Claude Code and read without writing. They return no agent id, so nothing can resume them, and they skip `CLAUDE.md` and the git status to start faster. Use one when you need an answer and never a second round.

## A background session

`claude --bg "<prompt>"` from a shell, or a prompt typed into agent view (`claude agents`), starts a full Claude Code session with no terminal attached. Agent view lists it, shows the question it is waiting on, and lets you reply or attach. It keeps running after you close the terminal.

Left to its defaults, it moves into its own worktree before its first edit: a second checkout of the repository in its own folder, branched from the remote default branch, which cannot see your uncommitted work. Flow's `home/settings.json` sets `worktree.bgIsolation` to `"none"`, so a background session edits your working copy directly. [Settings](../manual/settings.md#hooks) gives the reason.

## Kinds Flow turns off

**A fork is denied**, with the `Agent(fork)` rule in `home/settings.json`. Claude Code would otherwise start one on its own in an interactive session. Flow wants every agent it starts to see only what its prompt gives it.

**Worktree isolation is denied**, with `EnterWorktree` and `Agent(isolation:worktree)`. Flow's change record, below, separates parallel workers without a second checkout, so a worktree would only hide uncommitted work from the worker.

## How a subagent asks you something

It writes the question as its last message and stops. The message reaches the parent like any report, and the parent passes it on in one line:

```text
t052 asks: Should the importer skip rows with no date, or stop? Answer in its row below the prompt.
```

You press `↓`, select the row, press `Enter`, and type the answer. The subagent resumes with its history intact and carries on. The parent answers nothing itself: it never saw the ticket's reasoning, and a relayed guess reads like your decision.

Each question costs the parent one turn, which is how the question reaches you.

## What Flow uses, and where

- **`/flow:execute` → a worker per mechanical step**: `haiku-worker`, when every edit is already decided and the step spans roughly 5 or more files or 10 or more near-identical edits. Several may run at once where the agent decides it helps; the skill never pushes it.
- **`/flow:groundwork` → `/flow:prototype`**: a question only running code can answer gets a `prototype` ticket, then a `general-purpose` subagent told `Run /flow:prototype on t052`. The session that asked the question never builds the answer, because it would accept a vague question it already understands.
- **`/flow:debug` → a fresh hunt**: when the hypotheses run out, a subagent takes the hunt from the report, free of the hypotheses this session already killed.
- **`/flow:research` and `/flow:groundwork` → readers**: a landscape too big to read in the session goes to a subagent, which writes its report to `docs/research/`.

A prototype or a hunt keeps its place in its ticket: the status stays `building`, and `## State` in `ticket.md` says where the work stopped. A session that ends mid-run loses the subagent and keeps the ticket, and `/flow:start t052` picks it up.

## What a subagent changed

A subagent saying "done", or listing the files it edited, proves nothing. Flow records every change as it happens, under the id of the agent that made it, and hands the parent a diff per file when the subagent finishes. `scripts/changes.js` is the hook, and [Settings](../manual/settings.md#the-change-record) explains how it works.

This is a real record, from 2 subagents running at once in a scratch session. It reached the parent just before the first one's finished notice:

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

"Stop hook blocking error" is how Claude Code labels any message a background hook wakes the parent with. Nothing failed. The rule `change-record` in `home/CLAUDE.md` tells every session so, because a parent with no such instruction read a record as a possible prompt injection.

The other subagent ran a command, and its record listed the command beside the file it created:

```text
1 file changed.

Commands that changed files:
- `echo beta > /home/me/code/flow/tmp/try/project/b.txt`: b.txt
```

## After a crash

A power cut or a killed terminal ends every subagent with the session.

- **Files already written stay written.**
- **Transcripts are written as the work goes**, so `claude --resume` brings back your conversation and every subagent's history.
- **A subagent does not restart by itself.** The parent resumes it with `SendMessage` to its id, or you type into its row.
- **Its change record survives.** Records live under `~/.flow/changes/`, never a temporary folder, so the record handed over after the resume includes what the subagent changed before the crash.
- **A prototype or a hunt also has its ticket**, whose `## State` says where the work stopped.
