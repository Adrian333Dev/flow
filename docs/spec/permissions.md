# Permissions

What runs without asking, what asks, and how a question reaches the user. A session on a set-up project builds a ticket and asks only before a commit, a push or a publish. Three layers decide: the settings rules, the guard, and Flow's mod, which draws every question and writes the log. The guard stops a helpful agent's accidents. It is no defense against a deliberate attack.

## Scope

- **In**: the `permissions` block of `home/settings.json`, the guard (`scripts/hooks/guard.js` and `scripts/lib/guard/`), the pane in Flow's mod, the log in `~/.flow/logs/permissions/`, and `flow audit`'s permissions view.
- **Out**: Flow's mod itself and its layout, in `fw-16` and `fw-14`. The other hooks, in `docs/spec/product.md` → `### Hooks and guardrails`.

## How a call is decided

```text
        a tool call
             │
             ▼
 ┌───────────────────────┐
 │    SETTINGS RULES     │   allow Bash, Edit, Read and the web tools.
 └───────────────────────┘   Ask on commit, push, publish. Deny a short list.
             │
             ▼
 ┌───────────────────────┐
 │       THE GUARD       │   the one judge, a PreToolUse hook.
 └───────────────────────┘   Silent, or an ask with one plain sentence.
             │
             │  an ask, with its sentence
             ▼
 ┌───────────────────────┐
 │        THE MOD        │   opens the dialog, writes the log line.
 └───────────────────────┘
             │
             ├── Allow ──────► the call runs
             │
             └── Refuse ─────► the call is denied, the turn stops
```

A call the guard leaves silent and no rule asks about runs at once, and the mod never sees it. The mod's hook (`tool.check`) fires after the rules and the guard have decided, and only when the answer is an ask. Claude Code's own prompt appears only when the mod is off or fails.

## Behaviors

### What runs without asking

- `V1` **Every shell command, edit, read and web call runs unasked.** `permissions.allow` holds a bare `Bash`, `Edit`, `Read`, `WebFetch` and `WebSearch`. Ruled 2026-09-28: a list of allowed programs asked on half of real commands.
- `V1` **Anything not serious always runs.** Reading a `.env` file, a write to a shell startup file or the global git settings, a global install and a scheduled job leave the guard's list. Ruled 2026-10-12: the user wants as few prompts as possible.
- `V1` **A write under `~/.claude`, `~/.flow` and `~/.agents` runs unchecked**, except the files that can switch the guard off. Tickets, the wiki, logs, `workflow-notes.md`, skills, rules and `CLAUDE.md` steer the agent and cannot disable the guard. Ruled 2026-10-12. Overturned by: evidence that the guard's files are reachable another way.
- `V1` **A project's `.flow` is a symlink into `~/.flow/projects/<name>`, so `~/.flow/projects/` stays off the guard's list.** The old rule judged the real path, and 50 asks in 35 minutes came from appends to `.flow/inbox.md` and scratch files under a ticket.
- `V1` **A write to a protected path with no guard reason is allowed by the mod and logged `auto-allow`.** Claude Code asks for every write under `.claude`, and no settings rule removes the ask. The mod's allow does (probed in `fw-110`).
- `V1` **The target is zero asks in a normal ticket build**, commit, push and publish aside. `flow audit`'s permissions view reads it. An ask outside that list is a fault, fixed by narrowing a rule. Approved 2026-10-12.

### What asks

- `V1` **A commit, a push and a package publish always ask**, through 6 `permissions.ask` lines. A user who wants them silent deletes the lines. Ruled 2026-10-12: they are rare and follow finished work.
- `V1` **The guard asks before 7 kinds of harm.** It never allows.
  - Losing work: a delete git cannot give back, a delete outside the project, a delete aimed at a variable, and the git commands that throw work away. A delete inside the project's `tmp/` never asks.
  - Sending data off the machine: `curl` or `wget` sending data, a copy to another host, `ssh`.
  - A deploy, a cloud write or a database drop.
  - Running downloaded or unknown code: a download run at once, `npx` of a package the project lacks.
  - A write into `~/.ssh`.
  - Reading a private key, a cloud login or a GitHub login into the conversation.
  - A write to the files that can switch the guard off: `~/.claude/settings.json`, `settings.local.json`, `~/.claude/plugins`, `~/.claude/dev-mods`, `~/.flow/repos/flow/scripts` and a project's `.claude/settings*.json`.
- `V1` **The guard judges `Edit` and `Write` as well as `Bash` and `Read`.** The matcher in `home/settings.json` widens to `^(Edit|Write|Bash|Read)$`, and `guard.js` gains one branch, the folder rule above. The old limit was a choice in the matcher, not in Claude Code.
- `V1` **Each ask stays an ask, never a deny.** A deny cannot be overridden and sends the agent into a retry loop.
- `V1` **The deny list stays**: `sudo`, `su`, `mkfs`, `--dangerously-skip-permissions`, reads of `~/.ssh` and `~/.aws`, plan mode, and the tools Flow replaces. `AskUserQuestion` leaves it.
- `V1` **The guard's sentence says what the command does to what**, in plain words, with no hook name: `Deletes 14 files git cannot restore, under src/old`.
- `V1` **The guard fails closed.** A top-level catch answers an ask with `The guard failed, so this command asks first.` and never lets a call through on an error. A safety net that fails open is the worst case.
- `V1` **The guard is the only judge.** Why: a mod that throws is skipped, and the guard would vanish with it while `Bash` is allowed outright. A command hook has no such gap, and `npm test` covers it. Overturned by: a way to make a failing mod fall back to refusing.

### The pane

- `V1` **Flow's mod answers every ask with Claude Code's own question dialog**, opened by `$.ui.ask` from its `tool.check` hook. Options: Allow, Refuse. Enter picks, Esc refuses, and text typed ahead stays in the input. Why the dialog: the band above the input cannot take Enter, and the user wants the pane to block input as Claude Code's prompt does (`fw-110`, `fw-112`). Decided 2026-10-13.
- `V1` **The dialog shows one plain sentence, then the command alone**, about 5 rows. The mod draws both above the rule and rewrites the dialog's own question to `Allow this command?` (`Allow this write?` for a write). For a tool other than `Bash`, the mod writes the sentence and the path from the tool and its input, since a core ask's own reason is long and full of paths.
- `V1` **The text given to `$.ui.ask` is the sentence, a blank line and the command.** It shows as it stands only when the engine refuses the draw, and it reads well on its own then.
- `V1` **Never JSON in a prompt.** The text given to `$.ui.ask` reads well on its own, so a refused tree still reads well. What the draw needs travels in the mod's state, keyed by that text. Ruled by the user 2026-10-13.
- `V1` **Colour is restrained and comes from the terminal's theme.** The sentence is bold `yellow`, as in the cards the user rated. A one-line command is `cyan`. A script of several lines adds 3 accents: strings `green`, comments dim, and control words and operators (`for`, `if`, `then`, `|`, `&&`, `;`, `>`) purple (`magenta`). A here-doc's body, such as a commit message, is one string and draws `green`, with its closing line a control word. Named colours only, never hex. Set 2026-10-13 after the user said the 8-colour page became a rainbow, and picked the purple accent from the palette page (option A). Amended 2026-10-17: the user found a 12-line commit all white, with its message unmarked. Overturned by: the user rating it too plain once the build shows it.
- `V1` **A command of up to 11 non-blank lines shows whole, in colour.** The mod draws the sentence and the command in colour when a sentence plus 11 non-blank lines fit. A blank line costs a row, margins included, so the colour draw keeps blank lines while every line fits in 11 rows and leaves them out beyond that, and the command itself is unchanged. The engine also counts each piece of text of 40 characters or more as extra rows, so the draw cuts a long piece into pieces of 39 or fewer. Allow, Refuse and the other two rows stay on screen at any length, since the dialog sits at the bottom of the page and the command grows upward off the top (`fw-119`: 12 of 12 cases, a 40-line, a 120-line and a 2610-character command, at 50 and 24 terminal rows). The options need a terminal of 14 rows or more. Ruled by the user 2026-10-13.
- `V1` **A longer command is cut to its first 11 non-blank lines, in colour, the 11th ending `…`.** It has no count and no row for a notice, and the dialog has no way to show the rest. Why: the user found a 36-line commit all white, and a draw holds 12 rows, so colour can reach only the head of a long command (`fw-116`). The command stays whole in the chat: the user can see it with Ctrl+O or by clicking the tool call (the user's word, not probed). Ruled by the user 2026-10-17. Overturned by: the user wanting the tail in the dialog, or an engine that lifts the 12-row cap.
- `V1` **The mod cuts a long text itself, below 2000 characters, and ends it with a line saying the rest is not shown, with no count.** The dialog cuts its question text at 2000 characters with a bare `…`, so the tail of a command can be invisible. The sentence counts toward the 2000. The user wants to know that something is cut, never how much (2026-10-17). It applies to a text that is not cut by the fold, such as one very long line.
- `never` **A button or a row that shows the rest of a command.** `fw-119` found that a click button is pressed only by the mouse, in the fullscreen terminal. `fw-113` found that an option row opens a second dialog, which confused the user. `fw-116` built the row again and the user removed it on 2026-10-17 as too ugly.
- `V1` **Rows 3 and 4 stay.** No clean removal exists. Row 3 is a typed note: the call is denied with no interrupt, and the agent reads the note and carries on. Row 4 is a plain Refuse.
- `V1` **A refusal stops the turn, with Claude Code's own screen**: `Interrupted · What should Claude do instead?`. On Refuse, Esc or row 4, `tool.check` stores the verdict in the mod's state and returns the ask unchanged. A `classic.PermissionRequest` hook in the same mod then answers `{ behavior: 'deny', interrupt: true }`. Called route A2. Ruled by the user 2026-10-13: a refusal that lets the agent carry on is wrong. Overturned by: a Claude Code release that changes `classic.PermissionRequest` in mods, or two identical calls at once colliding on the stored key (tool name plus command).
- `V1` **The dialog waits with no timeout while the user is there.** Silence is never a yes. Where nobody can answer (`claude -p`, no screen), the mod denies with no interrupt: `No one is here to ask. Choose another way, or stop.`
- `V1` **A subagent's ask opens in the main session and takes its turn.** A refusal stops that subagent and the main turn goes on. Each session's mod holds its own state, so parallel sessions never block each other.
- `V1` **The mod restyles its own question only**, never one the agent asks. The build checks that the render site's call id tells them apart: the model's own calls carry a `toolu_` id, and the mod's ask carries `toolu_plugin_`.
- `V1` **The `AskUserQuestion` deny leaves `home/settings.json`.** The dialog is that tool, and a deny by name, or by `AskUserQuestion(*)`, makes `$.ui.ask` fail. The agent may call the tool again, and nothing blocks it. Ruled by the user 2026-10-13, overturning the ruling of 2026-09-21 whose reason was the tool's schema in every request.
- `later` **An edit's dialog shows 4 to 6 changed lines**, `−` for old and `+` for new, from the call's own input. The path and the sentence ship first.
- `later` **Hiding the tool's definition from the agent** by changing the request a mod sends, to win back the schema's tokens. Reopen only if the cost shows in the numbers.

### The log

- `V1` **Every ask the mod sees is one line in `~/.flow/logs/permissions/<year>-<month>.jsonl`**, the silent allows of core asks included. Same place and convention as `~/.flow/logs/failures/`. The mod appends it with `$.fs`. Nothing is logged when the mod is off, since Claude Code's own prompt appears then.
- `V1` **`flow audit` has a permissions view** counting asks by `source` and by `headline`. The zero-asks target reads from it.
- `V1` **Both machines' logs are kept**: the log is append-only and travels through `flow sync` like the failures log. Where both machines added lines, keep both.

### Refused

- `never` **A saved decision, or an "always allow" row in the dialog.** A settings allow rule cannot silence a guard ask, so it would need an allow file the guard reads and code in the mod to write it. The asks left are the rare serious kinds, where a one-click shortcut is what the guard prevents. A command that annoys the user is fixed by telling the agent. Decided 2026-10-13. Reopen if the log shows the same serious ask many times a week.
- `never` **An undo layer**: snapshots, a trash in place of `rm`, an overlay. No undo covers a push, a deploy or a leaked secret, and 42% of 290 public incidents reached outside the project. Git covers the project. Ruled 2026-10-12.
- `never` **A defense against hidden instructions in web pages or repository files.** A filter on command text misses effects (52 of 290 public incidents), and the real defenses are ruled out or deferred. Reading secrets and sending data off the machine stay on the guard's list, since they cover the worst result at no cost in asks. Reopen if the agent works in repositories the user does not control. Ruled 2026-10-12.
- `never` **A sandbox, or a short tool list, for agents that read outside material.** A sandbox wraps shell commands only, so it misses `WebFetch` and `Read`. A reader agent adds a file and a change to the research skill. Ruled 2026-10-12.
- `never` **Turning a kind of harm into a deny from the log.** When a command annoys the user, they tell the agent and the rule changes then. Ruled 2026-10-12.
- `never` **A `PermissionRequest` hook as the judge or the recorder.** It does not see the reason a `PreToolUse` hook gave, and it never fires for what the mod answers.
- `never` **Blast Radius as shipped**, an Anthropic sample mod. Its hold sits before the permission check, so the guard would ask a second time. Its measuring code (Apache-2.0) is reusable.
- `never` **A pane in the band above the input, or in the side column.** The band cannot take Enter. The side column shows only at 144 columns or more, which means 2 designs for one box.
- `never` **Auto mode**: it costs extra, its reviews fail with no verdict, and it blocks what the conversation agreed. Ruled 2026-09-28.
- `never` **Claude Code's sandbox in place of the guard**, ruled 2026-09-28.
- `never` **A hook approving a command whose programs are all on a list**: built and removed 2026-09-28, since every missed shape meant editing the list.
- `never` **A timed switch letting commits and pushes run without asking**: removed by the user 2026-09-25, since Claude Code's own prompt covers it. `git log -S gitMode` finds the code.
- `later` **Containment**: a sandbox, a container, a virtual machine or Claude Code's own sandbox. The measured asks come from the guard's folder rule and Claude Code's protected paths, which containment would not remove. Reopen if the asks left after the log has run for a week need a boundary. Options and costs: `~/.flow/research/sandboxes-for-coding-agents-on-linux.md`.
- `later` **The guard checked against Dippy's and CC Safety Net's thousands of command cases**, with one sentence of threat model: the guard stops a helpful agent's accidents, never a deliberate attack.

## The parts

- **`home/settings.json`**: the allow, ask and deny lists, and the guard's matcher.
- **`scripts/hooks/guard.js`**: the `PreToolUse` hook. Judges `Bash` and `Read` by command and path, `Edit` and `Write` by the folder rule, and fails closed.
- **`scripts/lib/guard/`**: one file per kind of harm, the parser, and `world.js`, the one file that reads the disk. The narrowed folder list lives in one place here.
- **The pane**: one module in Flow's mod. It holds the dialog, route A2, the tokenizer, the headline for every tool other than `Bash`, and the log write. Its path follows the layout of the mod `fw-16` builds.
- **`~/.flow/logs/permissions/`**: the log.
- **`scripts/commands/audit.js`**: gains the permissions view.

## What passes between them

The mod's hook receives the ask as `{ decision: 'ask', reason, rule, hook }` from `next(e)`. `reason` is the guard's sentence or Claude Code's long text, `rule` is the settings rule that asked, such as `Bash(git push *)`, and `hook` is `PreToolUse` when the guard asked. The event carries `tool_use_id`, `agentId` and `input` (`{ command }` for `Bash`, `{ file_path, old_string, new_string }` for an edit).

The text given to `$.ui.ask` for a push. The mod draws it in colour over the dialog, and its own question reads `Allow this command?`:

```text
Pushes 3 commits to origin/main.

git push origin main

  1. Allow
  2. Refuse
  3. Type something.
  4. Chat about this
```

One log line:

```json
{"at":"2026-10-14T09:12:03Z","project":"flow-dev","session":"17da95cd","agent":"main","tool":"Bash","source":"rule","headline":"Pushes 3 commits to origin/main","command":"git push origin main","rule":"Bash(git push *)","answer":"allow","ms":4210}
```

`source` is `guard`, `rule` or `core`. `answer` is `allow`, `refuse`, `note`, `auto-allow` or `nobody`. `command` is cut at 200 characters.

## One real case: a ticket built end to end

1. A session builds a ticket on a set-up project. The agent appends to `.flow/inbox.md`. The guard follows the symlink to `~/.flow/projects/flow-dev/`, finds no file that can switch it off, and stays silent. The rules allow the edit. It runs, and nothing is logged.
2. The agent writes `.claude/skills/x/SKILL.md`. Claude Code would ask, since `.claude` is protected. The mod's hook sees the ask with no guard reason, allows it, and logs `auto-allow`.
3. The agent runs `npm test`, then `rm -rf tmp/scratch`. Both run unasked.
4. The agent runs `git commit`. The rule asks. The mod opens the dialog with `Commits 4 files to main`. The user presses Enter. The log gets `answer: "allow"`.
5. The agent edits `~/.claude/settings.json`. The guard asks with `Writes into ~/.claude/settings.json, which could switch the guard off`. The user presses Esc. The mod stores the verdict, and `classic.PermissionRequest` answers deny with `interrupt`. The screen reads `Interrupted · What should Claude do instead?` and the user types the next instruction.
6. `flow audit`'s permissions view shows 2 asks: a commit, and a refused settings edit. The second is outside the target's list, so it is read as a fault to look at, here a deliberate test.

## How it fails

- **The mod throws or is not loaded** → Claude Code's own prompt appears for each ask. More asks, never an unchecked run.
- **The guard throws** → the call asks with `The guard failed, so this command asks first.`
- **Nobody can answer** (`claude -p`, a background session with no screen) → the call is denied with no interrupt and a message to the agent.
- **Two identical calls ask at once** → they share the stored verdict's key. Rare, and the worst case is one wrong stop.
- **The dialog cannot draw a long command in colour** (over 11 lines, not counting blank ones) → the dialog shows the first 11 lines, the 11th ending `…`. The chat's tool line holds the whole command.
- **The terminal has fewer than 14 rows** → some option rows scroll off. Enter and Esc still answer.
- **The engine refuses the coloured draw** → the sentence and the command show as plain text in the dialog's question.
- **A command the guard cannot see inside** (`node -e`, `python3 -c`, a script the agent wrote and then runs) → it runs. The guard catches the forms Claude writes and is no wall.
- **A command typed behind `!`** reaches no hook.
- **Another machine added log lines** → `flow sync` keeps both sets.

## How you know it worked

- **One ticket built in a real session on a set-up project raises 0 asks apart from commit, push and publish.** `flow audit`'s permissions view shows it.
- **A write through the project's `.flow` symlink, to `.flow/inbox.md` and to a ticket file, asks nothing.** A test in `scripts/` covers it.
- **An `Edit` of `settings.json` asks.** So does each kind above, and so does a crash in the guard.
- **A refused ask ends on `Interrupted · What should Claude do instead?`** Seen in a real session.

## What is locked

- **The guard is the only judge, and the mod only asks.** Why: a mod that fails is skipped, a command hook is not.
- **A refusal stops the turn.** Why: it is the native behavior the user knows, and an agent that carries on after a no is wrong.
- **No saved decision.** Why: the asks left are serious, and a shortcut is what the guard prevents.
- **Nothing logged when the mod is off.** Why: Claude Code's own prompt carries the ask then, and one log has one writer.

## Bets

- **Claude Code keeps the mods API as it is in 2.1.296**: `tool.check`, `classic.PermissionRequest`, `$.ui.ask`, and `ui.render` on the question dialog. Mods are early access. If it changes, the pane falls back to Claude Code's own prompt and the guard still judges.
- **Flow stays on a plan with no managed settings.** On a Team or Enterprise plan, `sec-default` loads and holds a guard ask over the mod's allow, so Claude Code's prompt would appear after the pane.
- **The user does not run auto mode.** Whether `tool.check` sees asks there is untested.

## References

- `.flow/tickets/fw-35-permission-system-redesigned/groundwork/map.md`: every decision above, with its reasoning and the rejected options
- `.flow/tickets/archive/fw-110-prototype-mods-tool/reports/tool-check-answers-from-the-band.md`: a mod's allow covers `.claude`, `tool.check` fires for a subagent
- `.flow/tickets/archive/fw-112-prototype-does-mods/reports/dialog-answers-from-tool-check.md`: the `AskUserQuestion` deny kills the dialog
- `.flow/tickets/archive/fw-113-prototype-permission-dialog/reports/`: colour, the 12-row budget, expand
- `.flow/tickets/archive/fw-114-prototype-refusal-stops/reports/`: route A2
- `.flow/tickets/fw-35-permission-system-redesigned/groundwork/permission-palette.html`: the restrained palette on 4 real cases, dark and light
- `~/.flow/research/how-agents-cut-permission-prompts-and-undo-mistakes.md`: other agents' approval models, and undo layers
- `.flow/research/fast-mode/where-flow-slowed-the-work.md`: the 25 guard asks that started it
