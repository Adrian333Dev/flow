# `settings.json` — what every key is for

Reference for `global/settings.json`, which merges into `~/.claude/settings.json`. Merged rather than copied: your global settings also hold personal things — model, effort level, plugins, statusline — that Flow shouldn't own.

`settings.json` is strict JSON. No comments, which is why this file exists.

Settings load at startup. **Restart Claude Code after any change.**

---

## `hooks`

```json
"hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
  { "type": "command", "command": "node \"$HOME/.claude/scripts/guard.js\"" } ] } ] }
```

Runs `scripts/guard.js` before every Bash call. The script reads the pending command on stdin and returns `deny`, `ask`, or nothing.

Node, not Python. The hook inherits Claude Code's `PATH`, so a Node installed under nvm has to be on it — but `flow` and `fmerge` are Node too, so that is already a hard requirement of the toolchain and this adds nothing new. What it removes is a third language in a five-file folder.

**The guard and the blanket `Bash` allow below are one unit. Never install one without the other.** Blanket allow with no guard leaves only the deny list, which can name git commands but not the open set of everything else.

### The snapshot pair

```json
"PreToolUse":  [ { "matcher": "Agent", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.claude/scripts/snapshot.js\" --before" } ] } ],
"PostToolUse": [ { "matcher": "Agent", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.claude/scripts/snapshot.js\" --after" } ] } ]
```

**⚠️ Never run, on this machine or any other.** Written 2026-08-14 against the hooks reference, installed nowhere. One live dispatch confirms it or does not.

Records the working tree before a subagent runs and again after, then hands the parent a diff of the two. That diff is the only honest account of what a subagent touched: its own report can leave things out, and a plain `git diff` cannot separate its work from a tree that has been dirty for weeks.

`Agent` is the tool that spawns a subagent, so both hooks match on it. They pair by `tool_use_id`, which both events carry, so two overlapping dispatches never read each other's stored snapshot. That is bookkeeping, not isolation: the diffs still overlap.

**Fires for every subagent, not only the ones that build.** A research agent that was supposed to read and quietly wrote something is worth catching, and a dispatch that changed nothing prints nothing.

Two consequences worth knowing:

- **The diff covers the window, not the worker.** Everything that changed between the two events lands in it, whoever changed it, so one subagent at a time and a parent that touches nothing meanwhile. `execute` carries that as an instruction; this is where it comes from.
- **`git add` has to stay reachable.** The snapshot stages into a throwaway index, which touches no real git state, and `guard.js` exempts exactly that form. The `Bash(git add:*)` deny rule below is a separate gate that has never been tested against it — under these hooks it does not matter, because a hook runs its own command rather than calling the Bash tool.

### Why worktree isolation is off

`EnterWorktree` and `Agent(isolation:worktree)` both move work into a second directory. The snapshot compares one directory against itself, and `snapshot.js` gives up when the directory moves between its two events — so worktree isolation turns the diff off and says nothing.

**A hold, not a verdict.** Separate directories are the obvious road to running several subagents at once, which the one-at-a-time rule above rules out today. Lift this once the snapshot handles a per-subagent working directory.

`Agent(isolation:worktree)` is a scoped rule rather than a bare name, so the Agent tool stays available and only that one parameter value is blocked.

**`worktree.bgIsolation` closes the same door from the other side.** Its default, `"worktree"`, blocks `Edit` and `Write` in the main checkout until `EnterWorktree` runs — and `EnterWorktree` is denied above, so a background session would read files and run commands and never write a fix. `"none"` lets it edit the working copy directly. The `debug` agent runs as one of those sessions, and isolation is wrong for debugging anyway: the bug often lives in uncommitted state that a fresh worktree does not carry.

---

## `permissions`

Rules evaluate **deny → ask → allow**, first match wins. A broad deny beats a narrower allow. Deny rules hold in every permission mode.

### `allow`

| Entry | Covers |
|---|---|
| `Bash` | every shell command |
| `Edit` | every file-editing tool, including Write |
| `WebFetch` | every domain |
| `WebSearch` | every search |
| `mcp__context7__*` | every tool from the context7 MCP server |

A tool name written **without parentheses matches every use of that tool**.

Why blanket rather than a curated list: approving a command through the permission dialog saves the *exact string* that ran, so `ptree --depth 3` and `ptree --depth 4` become two rules. A hand-kept list of command patterns never converges and goes stale the moment a path moves. The deny list plus the guard define the boundary instead.

Not on the list, so still prompts: reads outside the working directory, and writes into protected paths — `.git`, `.claude`, `.vscode`, `.idea`, `.husky` and friends, which allow rules cannot pre-approve by design.

**Spawning a subagent never prompts, so `Agent` needs no entry.** Claude Code checks a subagent's own tool calls against these same rules while it works, and that is what governs a worker.

### `deny` — Claude Code surfaces Flow doesn't use

These are **bare tool names**, which removes each tool from the model's context entirely rather than blocking it at call time. That also drops its schema from every request: `DesignSync` alone measured ~2,200 tokens.

| Entry | Why |
|---|---|
| `EnterPlanMode`, `ExitPlanMode` | Flow owns planning: `brainstorm` → tickets → the ticket's `## Plan`. Built-in plan mode also blocks the file writes those phases depend on. |
| `AskUserQuestion` | Presents a canned multiple-choice list. Flow's rule is the inverse — the agent commits to a recommendation and the user reacts. |
| `SendMessage`, `ListAgents` | Agent-to-agent messaging, and the tool that finds agents to message. `execute` dispatches subagents with self-contained assignments; there is no back-channel to keep open. |
| `PushNotification`, `ScheduleWakeup`, `RemoteTrigger`, `ReportFindings` | Out-of-band and unattended operation. One author, one terminal, every session watched. |
| `SendUserFile`, `ShareOnboardingGuide` | Send a file off the machine, to a device or behind a public link. Same reason, plus the work is not the agent's to publish. |
| `CronCreate`, `CronDelete`, `CronList` | Scheduled background jobs. Same reason. |
| `NotebookEdit` | Jupyter notebooks. Not in any workflow here. |
| `DesignSync` | Design-tool sync. Unused — and absent from the published tool reference, so it was found by logging a real request rather than by reading the docs. |

### `deny` — git mutations

Every command that changes repository state: `add`, `commit`, `push`, `pull`, `reset`, `rebase`, `merge`, `checkout`, `switch`, `restore`, `rm`, `mv`, `stash`, `clean`, `cherry-pick`, `revert`, `branch -*`, `worktree add`, `worktree remove`.

Read-only git — `status`, `log`, `diff`, `show` — is untouched and runs freely.

The agent names the exact command; you run it. This is a **Flow default, not a personal preference**: git history is the one thing an agent cannot un-break, and a rewritten branch or a stray `reset --hard` costs work that exists nowhere else.

`guard.js` blocks the same set independently, so a missing or overridden settings file still leaves git covered.

### Modes

Six of them, cycled with Shift+Tab and overridable for one session with `--permission-mode <name>`. A mode only decides what happens to a call no rule above matched.

**Stay on `default`**, labelled Manual. There is no `defaultMode` key here because `default` is already the default, and the allow list covers everything routine — so the prompts left over are the ones worth seeing.

**`dontAsk` is the unattended mode.** It auto-denies whatever the allow list does not cover and never interrupts, so a long run finishes and every denial shows up in the transcript. Reach for it with Shift+Tab, never by setting it here.

**`acceptEdits` buys almost nothing.** With `Bash` and `Edit` blanket-allowed above, it is not the looser mode it looks like.

**`bypassPermissions` is locked out**, by `permissions.disableBypassPermissionsMode: "disable"`. Its one addition over `acceptEdits` is silent writes into `.claude` and `.git`, and Flow's entire content *is* `.claude`. The same key disables the `--dangerously-skip-permissions` flag that `guard.js` already denies as a Bash command, and makes Claude Code ignore `permissionMode: bypassPermissions` in any agent definition.

**`auto` was rejected, not locked out.** It routes every shell command and network call through a classifier model carrying a slice of the transcript — a per-command token cost on a workflow that is mostly shell. Rejecting it needs no key: its cost is tokens rather than damage, and nothing reaches it by accident the way `--dangerously-skip-permissions` reaches bypass.

---

## Feature flags

| Key | Value | Effect |
|---|---|---|
| `disableBundledSkills` | `true` | Anthropic's bundled skills stay out, so only Flow's skills load. |
| `disableWorkflows` | `true` | Built-in workflows off — Flow's skills are the workflow. |
| `disableRemoteControl` | `true` | No driving the session from claude.ai or mobile. |
| `disableClaudeAiConnectors` | `true` | No claude.ai connectors. |
| `disableArtifact` | `true` | No artifact tool. `visualize` renders inline. |
| `autoMemoryEnabled` | `false` | Auto memory is retired. It is per-repository and machine-local, so it cannot hold anything durable. Everything worth keeping goes in the repo — `CLAUDE.md`, `docs/`, or a skill. |

---

## Deliberately absent

**The built-in task tools** — `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate` — stay allowed rather than joining the deny list. They look like a tracker competing with `flow` and are not: `flow` records work that outlives the session, these are a scratch checklist for the turn in front of you. Denying them costs the checklist and saves nothing.

**`sandbox`.** Claude Code's bubblewrap jail was considered and rejected. It is a genuine OS-level boundary at zero token cost, and it remains the right answer for unattended runs — but it needs `socat` installed, blocks Windows binaries under WSL2, and adds a second boundary to reason about.
