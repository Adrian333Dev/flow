# `settings.json` — what every key is for

Reference for `global/settings.json`, which merges into `~/.claude/settings.json`. Merged rather than copied: your global settings also hold personal things — model, effort level, plugins, statusline — that Flow shouldn't own.

`settings.json` is strict JSON. No comments, which is why this file exists.

Settings load at startup. **Restart Claude Code after any change.**

---

## `hooks`

```json
"hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
  { "type": "command", "command": "python3 \"$HOME/.claude/scripts/guard.py\"" } ] } ] }
```

Runs `scripts/guard.py` before every Bash call. The script reads the pending command on stdin and returns `deny`, `ask`, or nothing.

Python, not Node — `/usr/bin/python3` is a fixed path; a Node under nvm may not be on a hook's `PATH`.

**The guard and the blanket `Bash` allow below are one unit. Never install one without the other.** Blanket allow with no guard leaves only the deny list, which can name git commands but not the open set of everything else.

---

## `permissions`

Rules evaluate **deny → ask → allow**, first match wins. A broad deny beats a narrower allow. Deny rules hold in every permission mode.

### `allow`

| Entry | Covers |
|---|---|
| `Bash` | every shell command |
| `Edit` | every file-editing tool, including Write |
| `WebFetch` | every domain |
| `mcp__context7__*` | every tool from the context7 MCP server |

A tool name written **without parentheses matches every use of that tool**.

Why blanket rather than a curated list: approving a command through the permission dialog saves the *exact string* that ran, so `tree.sh --depth 3` and `tree.sh --depth 4` become two rules. A hand-kept list of command patterns never converges and goes stale the moment a path moves. The deny list plus the guard define the boundary instead.

Not on the list, so still prompts: `Agent` (subagent spawns), and writes into protected paths — `.git`, `.claude`, `.vscode`, `.idea`, `.husky` and friends, which allow rules cannot pre-approve by design.

### `deny` — Claude Code surfaces Flow doesn't use

These are **bare tool names**, which removes each tool from the model's context entirely rather than blocking it at call time.

| Entry | Why |
|---|---|
| `EnterPlanMode`, `ExitPlanMode` | Flow owns planning: `brainstorm` → `spec.md` → `plan.md`. Built-in plan mode also blocks the file writes those phases depend on. |
| `AskUserQuestion` | Presents a canned multiple-choice list. Flow's rule is the inverse — the agent commits to a recommendation and the user reacts. |
| `SendMessage` | Agent-to-agent messaging. `execute` dispatches subagents with self-contained briefs; there is no back-channel to keep open. |
| `PushNotification`, `ScheduleWakeup`, `RemoteTrigger`, `ReportFindings` | Out-of-band and unattended operation. One author, one terminal, every session watched. |
| `CronCreate`, `CronDelete`, `CronList` | Scheduled background jobs. Same reason. |
| `NotebookEdit` | Jupyter notebooks. Not in any workflow here. |
| `DesignSync` | Design-tool sync. Unused. |

### `deny` — git mutations

Every command that changes repository state: `add`, `commit`, `push`, `pull`, `reset`, `rebase`, `merge`, `checkout`, `switch`, `restore`, `rm`, `mv`, `stash`, `clean`, `cherry-pick`, `revert`, `branch -*`, `worktree add`, `worktree remove`.

Read-only git — `status`, `log`, `diff`, `show` — is untouched and runs freely.

The agent names the exact command; you run it. This is a **Flow default, not a personal preference**: git history is the one thing an agent cannot un-break, and a rewritten branch or a stray `reset --hard` costs work that exists nowhere else.

`guard.py` blocks the same set independently, so a missing or overridden settings file still leaves git covered.

---

## Feature flags

| Key | Value | Effect |
|---|---|---|
| `disableBundledSkills` | `true` | Anthropic's bundled skills stay out, so only Flow's skills load. |
| `disableWorkflows` | `true` | Built-in workflows off — Flow's skills are the workflow. |
| `disableRemoteControl` | `true` | No driving the session from claude.ai or mobile. |
| `disableClaudeAiConnectors` | `true` | No claude.ai connectors. |
| `disableArtifact` | `true` | No artifact tool. `explain` renders inline. |
| `autoMemoryEnabled` | `false` | Auto memory is retired. It is per-repository and machine-local, so it cannot hold anything durable. Everything worth keeping goes in the repo — `CLAUDE.md`, `docs/`, or a skill. |

---

## Deliberately absent

**`permissions.defaultMode`.** Left at `default` (labelled Manual). The allow list already covers everything used routinely, so the mode only governs what's left over — and having that prompt is the point.

`auto` mode was considered and rejected: it routes every shell command and network call through a classifier model carrying a slice of the transcript, which is a per-command token cost on a workflow that is mostly shell.

**`sandbox`.** Claude Code's bubblewrap jail was considered and rejected. It is a genuine OS-level boundary at zero token cost, and it remains the right answer for unattended runs — but it needs `socat` installed, blocks Windows binaries under WSL2, and adds a second boundary to reason about.
