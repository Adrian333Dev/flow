# Subagents: handing work to one, and proving what it changed

Opened 2026-09-15 in conversation with the user, approved and built the same day.
`## Build status, 2026-09-15` at the end says what was built and what never ran live.

## Rulings from the user, 2026-09-15

- **Flow never uses a fork**, the subagent that starts with a copy of the whole conversation. Never
  propose one as an option, never write one into a skill. The root `CLAUDE.md` carries it as
  `no-fork-subagent`, with the conduct rules no better idea overturns.
- **Worktrees are out of the backlog.** They were there to make parallel subagents possible, and
  `## Proving what a worker changed` below does that without them. The `EnterWorktree` and
  `Agent(isolation:worktree)` denies in `home/settings.json` stay, so no worker edits outside the
  project. "Set up the dev checkout" and "Work on several branches at once" stay: neither is about
  subagents.
- **`/execute` never encourages parallel dispatch.** It stays possible, and the agent decides. The
  delegation rule stays as written: every edit already decided, so the worker guesses nothing, and
  roughly 5+ files or 10+ near-identical edits. The user does not want a one-file edit delegated.
- **A simplification touching the topic at hand is raised then**, never saved for the final sweep.
  Each one says first what the rule protects and whether that still holds. Many rules came out of
  long design work and exist for a reason.

## The agents Claude Code runs

Verified from the docs 2026-09-15: `sub-agents.md`, `agent-view.md` and `hooks.md` under
`lab/research/claude-code-docs/`, plus `agents.md` and `worktrees.md` fetched from
`code.claude.com/docs/en/`. This is the material for `docs/dev/agents.md`.

- **A subagent**, `general-purpose` or one defined in `agents/`: starts from its prompt alone, with
  every `CLAUDE.md` loaded. In an interactive session it runs in the background. It gets a row in the
  panel below the prompt, `Enter` opens it, and what the user types goes to it. Its last message
  reaches the parent as a notice on a later turn. A finished one resumes with its full history through
  `SendMessage`, also after Claude Code restarts and the session is resumed. It dies when the session
  ends.
- **A one-shot subagent**, `Explore` or `Plan`: returns no id, so it cannot be resumed. It skips
  `CLAUDE.md` and the git status.
- **A background session**: `claude --bg "<prompt>"`, or a prompt typed into agent view
  (`claude agents`). A full session with its own row in agent view, and it outlives the terminal.
  Before editing it moves into its own worktree, branched from the remote default branch, so it
  cannot see uncommitted work.
- **An agent team**: several sessions with a lead. Experimental, and off by default.
- **A worktree**: a second checkout of the repository in its own folder, on its own branch.

The facts the designs below rest on:

- A background subagent keeps only `Read`, `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`,
  `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`,
  `ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage` and `Artifact`, plus every MCP tool.
- `AskUserQuestion` is removed from every subagent, and `home/settings.json` denies it everywhere
  anyway. Every agent in Flow asks by writing the question and ending its turn.
- Every hook that fires inside a subagent carries `agent_id` and `agent_type`.
- For a background subagent the `Agent` tool call returns at launch, with `status: "async_launched"`
  and the `agentId`. `PostToolUse` on `Agent` fires then, never at the finish.
- `SubagentStart` and `SubagentStop` carry `agent_id`. `SubagentStop` fires at the real finish, and
  its output goes to the subagent, never to the parent.
- A command hook with `asyncRewake: true` runs in the background and wakes the parent on exit code 2,
  showing its stderr as a system reminder. The timeout defaults to 600 seconds and is settable.
- Hook output is capped at 10,000 characters.

## Prototype and debug hand off to a subagent

Agreed 2026-09-15. It replaces "a fresh session picks the ticket up": the user found opening a
session by hand inconvenient. A separate session stays an option when the user asks for one.

1. `/groundwork` writes the prototype ticket, as today. It then starts a subagent with "Run
   /prototype on t052".
2. When the subagent needs the user, it writes the question and stops. Its last message reaches the
   parent.
3. The parent shows the question in one line, "t052 asks: … Answer in its row below the prompt", and
   answers nothing itself.
4. The user selects the row with ↓, presses `Enter` and types the answer. The subagent continues.
5. When the report lands, the parent reads it and carries on with `/groundwork`.
6. The session closes mid-run → the subagent dies. The ticket stays `building`, `## State` in
   `ticket.md` says where it stopped, and `/start t052` picks it up next session.

**Why a subagent keeps what the 2 sessions protected.** `/prototype` splits the work because the
session that invented a question reads a vague one as clear: it knows what it meant. A subagent sees
the ticket and nothing else, so the ticket has to carry the question in full.

**The cost** is one parent turn per question, which re-reads the parent's context from cache. That
turn is how the question reaches the user.

**`/debug`** hands the hunt to a subagent, given the report's path, when the hypotheses run out or 3
fixes have failed. A decision nobody gave is asked of the user in the session.

**Unverified:** that typing into a finished subagent's row resumes it. The docs say so. One
interactive run of `bash lab/scripts/try.sh` settles it.

**What the build touches:** `skills/phases/prototype/SKILL.md` → `**2 sessions.**`,
`skills/phases/groundwork/SKILL.md:143` where it cuts a prototype ticket, and
`skills/phases/debug/SKILL.md` → `## Handing it back`.

## Proving what a worker changed

Agreed 2026-09-15 as the direction. The user added that the tool detects each worker's changes and
returns them with no work left to the parent.

### What `snapshot.js` does, and why it is broken

`/execute` can hand a step to a worker subagent, and a worker saying "done" proves nothing.
`scripts/snapshot.js` produces the proof. A snapshot is `git write-tree` against a throwaway index: a
record of every file in the project at one moment, uncommitted changes included, moving nothing.

1. `PreToolUse` on `Agent` takes a snapshot just before the worker starts.
2. `PostToolUse` on `Agent` takes a second one when the tool call returns.
3. The difference goes to the parent as the worker's changes.

A background subagent's tool call returns the moment it launches. So step 2 runs before the worker
has done anything, and the difference comes back empty. `/execute` step 5 then falls back to "no
diff, verify the step yourself": nothing crashes, and the proof never arrives. Background became the
default in Claude Code 2.1.198.

### Why 2 snapshots cannot separate parallel workers

A difference between 2 snapshots holds every change made between them, by anyone. With 3 workers
editing at once, each worker's difference holds all 3 workers' changes. The user's first idea, a
snapshot per worker, fails for exactly this reason. The user's second idea, a fingerprint per worker,
is the fix, and Claude Code already supplies it as `agent_id`.

### The design: record each change the moment it happens, under the id of the agent that made it

- **`Edit`, `Write` and `NotebookEdit`**: `PreToolUse` reads the file, `PostToolUse` reads it again,
  and that one change is saved under the agent's id. This stays exact when 2 workers edit one file.
- **`Bash`, `PowerShell`, `Monitor` and every MCP tool**: a snapshot just before and just after the
  call, saved under the agent's id with the command text. A deletion shows up both ways: the
  snapshot records the file as gone, and the command list shows the `rm`.
- **The parent's own edits and commands** are recorded under `main` while any worker runs, so none is
  ever handed to a worker.
- **The safety net**: a snapshot at each worker's start (`SubagentStart`) and finish
  (`SubagentStop`). A change no record explains, such as a background command still running or the
  user's editor, goes to every worker that was running then, marked unexplained.

The records live in a folder under `~/.flow/`, named at the build, since `os.tmpdir()` is not
promised to survive a reboot.

### Delivery, fully automatic

When a worker finishes, the parent receives that worker's changes as a diff per file, and the list of
commands it ran. The parent never reads ids and never matches a change to a worker.

- **A file only this worker touched in its window** → one diff, from before its first change to after
  its last.
- **A file another agent touched too** → this worker's own changes, edit by edit.
- **A file changed while 2 workers' commands ran at the same moment** → goes to both, marked shared.

The mechanism: `PostToolUse` on `Agent` starts an async hook with `asyncRewake: true`. It waits for
that worker's `SubagentStop`, then exits 2 with the changes on stderr, which wakes the parent. A worker
resumed through `SendMessage` gets a new waiter the same way. **Unverified live**: the docs describe
`asyncRewake` for long-running failures, so one interactive run confirms it before anything else is
built on it.

### Size

- **A deleted file** shows its header only: `git diff -D`, `--irreversible-delete`, omits the old
  content.
- **A file past a size limit** shows its line counts only, `+120 -30`.
- **The whole delivery** stays under the 10,000-character hook cap. The largest files collapse to
  line counts first. `snapshot.js` uses 8,000 today.

### The cases, walked

1. **One worker writing, the parent waiting**: exact.
2. **One worker writing, the parent editing**: exact, since the parent's edits carry no worker id.
   `/execute`'s "edit nothing meanwhile" goes.
3. **Only readers**: nothing to record.
4. **Readers and writers together**: exact.
5. **Writers on separate files**: exact.
6. **Writers editing the same file**: exact, edit by edit.
7. **2 workers running commands at the same moment**: the files changed in the overlap go to both,
   marked shared.
8. **A worker that starts its own subagent**: that subagent's changes carry its own id. Whether its
   delivery reaches the top parent is unverified.
9. **A background command still running after its call returns**, such as a watcher: the safety net
   reports its changes as unexplained.
10. **A very large repository**: 2 snapshots per command a worker runs, which is slow. The cost to
    watch.

### A power cut mid-run

The user's case: the machine shuts down while workers run, then the same session is resumed.

- Every subagent process dies with Claude Code. Files already written stay on disk.
- Transcripts are written as the work goes, so the resumed session has its conversation, and each
  worker's history survives. A worker does not continue by itself. It resumes through `SendMessage`
  to its id, which `home/settings.json` denies today.
- The waiting hook died too, so the resumed worker's new waiter delivers everything recorded,
  including the changes from before the cut, because the records live under `~/.flow/`.
- A prototype or a hunt also has its ticket: `## State` says where it stopped.

### What the build touches

- `scripts/snapshot.js`: rewritten, and renamed for what it now does, at the build
- `home/settings.json`: the hooks above, replacing the 2 `Agent` entries
- `skills/phases/execute/SKILL.md` → `### Dispatching a step`: step 2's "Dispatch one worker" and step
  3's "Edit nothing meanwhile" go, steps 4 and 5 read the delivery
- `docs/dev/layout.md` and `docs/manual/settings.md`, where they describe the hooks
- `scripts/tests/`: the cases above

## Proposed, waiting for approval

- **Deny `Agent(fork)` in `home/settings.json`.** Claude Code spawns forks on its own in an interactive
  session, and the docs name this rule as the way to stop it while keeping subagents in the
  background. It enforces `no-fork-subagent` in every session.
- **Lift the `SendMessage` deny in `home/settings.json`.** Resuming a worker after a crash needs it.

## Build status, 2026-09-15

The user approved everything above on 2026-09-15, with one change: `NotebookEdit` and `Monitor` get no hook of their own, since Flow uses neither, and the run's 2 snapshots catch whatever they change.

### Built and tested

- **`scripts/changes.js`** with the logic in **`scripts/flow/lib/changes.js`**, replacing `snapshot.js`, which is deleted. 7 tests in `scripts/tests/changes.test.js`; `doctor.test.js` now counts 9 hooks. Flow's suite passed.
- **`home/settings.json`**: the hooks on `PreToolUse`, `PostToolUse`, `PostToolUseFailure` (`^(Edit|Write|Bash)$|^mcp__`), the waiter on `PostToolUse` `Agent|SendMessage` (`asyncRewake`, timeout 86400), `SubagentStart`, `SubagentStop`. `SendMessage` left the deny list, `Agent(fork)` joined it.
- **`home/CLAUDE.md` → `## Tools`**: `change-record`, saying the "Stop hook blocking error" from `PostToolUse:Agent` is the record, never a failure.
- **Skills**: `/execute` → `### Dispatching a step` (no "one worker", no "edit nothing meanwhile", reads the record); `/prototype` → `**A fresh subagent builds it.**`; `/groundwork` Phase 2 prototype line starts `Run /prototype on <id>` and relays questions; `/debug` → `## Handing it back`.
- **Deviation found mid-walk in `/debug`**: 3 failed fixes go to the user, not a subagent. The skill's own rule already names that case a structural decision nobody gave (`FOUND_NOT_FIXED`), and a subagent cannot make it either. Only "the hypotheses ran out" goes to a subagent.
- **Docs**: `docs/dev/agents.md` (new, with a real record), `docs/dev/README.md`, `docs/dev/layout.md`, `docs/manual/README.md`, `docs/manual/settings.md` (`#### The change record`, the worktree reason, the deny table).
- **Small fixes**: `util git work drop` fetches first (util test updated, 53 pass); `store.js` `moveFolder` copies then deletes on `EXDEV` (1 new test); `/flow-review` → `## Whether a rule loaded`.

### Verified live, Claude Code 2.1.271, in `bash lab/scripts/try.sh` driven through tmux

- A hook's `agent_id` equals the `agentId` in the `Agent` result, and a subagent's hooks carry the parent's `session_id`.
- A background subagent reports through `SubagentHandback`, an undocumented tool. The report reaches the parent about 2 seconds before `SubagentStop` fires, then the finished notice follows. Nothing is built on `SubagentHandback`.
- The waiter's exit 2 reached the parent as `<task-notification><summary>Stop hook feedback</summary>` plus `Stop hook blocking error from command "PostToolUse:Agent": …`. A parent with no instruction called it a possible prompt injection; with `change-record` loaded it trusted the record.
- 2 parallel workers each got only their own diff, and each record arrived just before its finished notice. A worker resumed with `SendMessage` handed over only its new change.
- Not run live: typing into a finished subagent's row (the docs say it resumes it), and the pickup of a record nobody waited for (unit-tested).

### Finished after the compaction

- `docs/manual/where-everything-lives.md` is written, and Reference's `## Files` points at it. The `hooks` line in Reference names the 3 hook jobs.
- `README.md` describes the change record, a subagent building a prototype, and the final sweep where worktrees stood in `## What is next`.
- The built items left `backlog.md`, and `state.md` records the build.
- Both suites pass: Flow 112, util 53.
