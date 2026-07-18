---
name: executing-plans
description: Execute a plan.md task by task. Default mode delegates mechanical tasks to Haiku subagents (cheaper, keeps main context lean). Inline mode executes everything directly.
---

# Executing Plans

## Modes

Choose at session start:

- **Delegate mode** (default) — tasks with exact code specified → Haiku subagent; tasks requiring discovery or judgment → main agent inline
- **Inline mode** — main agent executes everything directly

## Session Start

1. Read `plan.md` in full
2. Confirm the verification command (stated in plan, or ask before starting)
3. **Delegate mode only:** note the line range of each task section (needed for dispatch)
4. Announce: mode, task count, verification command

## Task Classification (delegate mode)

**DELEGATE** — task step includes complete code or full file content to write:
- "Add exactly this function: [code block]"
- "Create this file with this content: [full content]"
- "Replace X with Y: [before/after blocks]"

**INLINE** — task requires discovery or judgment:
- "Read the existing implementation and add Y in the right place"
- "Figure out how the shortcut system works, then wire in the new action"
- Tasks flagged `INLINE` in the plan

When in doubt: INLINE is safe. DELEGATE only when the change is unambiguous from the plan alone.

## Per-Task Loop

### DELEGATE — Haiku dispatch

```
Agent(
  model="haiku",
  run_in_background=False,
  prompt=(
    "1. Read .claude/agents/haiku-worker.md (your instructions)\n"
    "2. Read <plan_path> offset=<N> limit=<L>  (your task — '### Task X: <name>')\n"
    "3. Execute the task"
  )
)
```

- Use `offset`/`limit` to point Haiku at the exact task section — do NOT paste the task content into the prompt
- Main agent output for this call: ~40 tokens
- Wait for result synchronously (`run_in_background=False`)

**After Haiku returns:**

| Status | Action |
|--------|--------|
| `PASS` | Mark task `[x]` in plan.md, continue |
| `FAIL` | See Failure Handling |
| `NEEDS_DEBUG` | See Debug Agent Handoff |

### INLINE — main agent execution

Execute directly. Read files as needed. Apply changes with Edit/Write. Run verification.

### Verification cadence

After every task (both modes), run the full check as **one chained Bash call**:

```bash
pnpm build && pnpm check-types   # or whatever the plan specifies
```

Never split into separate calls. If verification fails, see Failure Handling.

## Failure Handling

**Haiku returned FAIL** (attempted simple fix, still failing):
1. Review Haiku's diff and error output
2. If root cause is now clear: fix inline, re-run verification
3. If still unclear or second attempt fails → Debug Agent Handoff

**Haiku returned NEEDS_DEBUG** (non-obvious failure, no fix attempted):
1. Review Haiku's diff and error output
2. If root cause is obvious from the error: fix inline, re-run verification
3. If not obvious → Debug Agent Handoff

**Inline task verification failure:**
1. Attempt one inline fix
2. If still failing → Debug Agent Handoff

## Debug Agent Handoff

Spawn Sonnet debug agent (background — visible in FleetView, user can interact):

```
Agent(
  model="sonnet",
  run_in_background=True,
  prompt=(
    "Task: <task name>\n"
    "Error:\n<full error output>\n\n"
    "Diff of what was changed:\n<git diff>\n\n"
    "What was tried: <brief description>\n\n"
    "Debug this failure. Apply a fix if you find the root cause. "
    "Return: root cause + fix applied (or why it can't be fixed) + verification output."
  )
)
```

Notify user: *"Execution paused on Task N: `<name>`. Debug agent spawned — visible in FleetView."*

When debug agent returns: verify its fix, then continue.

## Progress Tracking

Mark tasks `[x]` in plan.md with Edit as each completes. Never mark complete without verified output evidence.

## Completion

All tasks `[x]` → run the full verification suite one final time as a chained call. State completion only after confirmed pass.

## Multi-Source Briefs (advanced)

If a Haiku task brief needs content from multiple sources, use merge-files with line range syntax instead of the file-reference approach:

```bash
node scripts/merge-files.js .claude/agents/haiku-worker.md plan.md:45-89
```

Capture the stdout and pass it as the Agent prompt directly.
