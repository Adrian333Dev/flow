# Claude Code mods, read against Flow

Mods arrived in Claude Code 2.1.287 on 2026-10-01. This file holds everything learned about them on 2026-10-02, so no later session researches them again: what a mod is, every part of its API, what it fixes in Flow, the ideas it opens, what it costs, and the order to build in.

**Ruled by the user 2026-10-02:** the beta ships first, on Flow's command hooks. Mods get built during the beta, live in this repo, each one used in the session that wrote it.

## Where things live

- **`README.md`**: this file. The facts, the Flow reading and the build order.
- **`docs/`**: the 10 pages of Anthropic's Mods section, saved as published on 2026-10-02: `overview`, `create`, `reference`, `interface`, `gallery`, `events`, `api`, `test`, `troubleshoot`, `admin`. Each page's own URL is `https://code.claude.com/docs/en/plugins/mods/<page>.md`. Gitignored, so a fresh clone fetches them again from there.
- **The type file, not saved**: [`mods/types/claude-code.d.ts`](https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts), 13,186 lines, said 2.1.277 on 2026-10-02. The docs say to trust the copy Claude Code writes into a mod's `.claude-plugin/types/` for the running version. `## Details only the type file has` keeps what it added.
- **The 2 blog posts**: [claude.com/blog/claude-code-mods](https://claude.com/blog/claude-code-mods) and [claude.dev's getting-started guide](https://claude.dev/blog/getting-started-with-claude-code-mods/). Neither says anything the docs leave out.
- **Sample mods**: `token-weather`, `blast-radius` and `replay-theater` in [`claude-code-playground/claude-code/mods`](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods). Claude Code's own built-in mods, with tests, are in [`claude-code/mods`](https://github.com/anthropics/claude-code/tree/main/mods): `diff`, `agents-md`, `sec-default`, `telemetry`.

## What a mod is

A mod is a plugin holding one JavaScript or TypeScript file, the hooks module. Claude Code calls functions in it at each event: a prompt sent, a tool about to run, a skill loading, the system prompt being built, a part of the screen being drawn. The functions run inside Claude Code's own process. The docs call each function a hook, and call the old kind in `settings.json` a settings hook.

```js
export function register(on) {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (/git push .*--force/.test(e.command)) return { deny: 'No force pushes. Push a new branch.' }
    return next(e)
  })
}
```

- **`on(event, matcher?, hook)`** registers a hook. The matcher filters on the event's fields: a value, a list, or a regular expression. `'classic.*'` matches every settings hook event, `'*'` every event but telemetry. One event registered twice with no matcher fails to load.
- **`e`** is the event, deeply frozen. Changing it means passing a copy to `next`.
- **`next(e)`** runs the later mods, then Claude Code's own behaviour, and resolves to the result. Its extras: `next.signal` (aborts when the event is abandoned), `next.origin` (who fired it), `next.budget` (time left), `next.to(e, tier)` (skip ahead, for an organization's mods only).
- **3 things a hook does**: watch (return `next(e)`), rewrite (pass a changed copy, or change the result), answer (return without calling `next`, so Claude Code's behaviour never runs).
- **`$`** is the mods API, the only way out of the file. The file has no Node APIs, no `setTimeout`, no file or network access of its own. Standard web APIs (`URL`, `TextEncoder`, `AbortController`, `crypto.subtle`) work.
- **Shared variables**: every hook in the file sees the file's top-level variables, so one hook counts what another draws.

## How a mod loads, reloads and is tested

- **Files**: `.claude-plugin/plugin.json`, then `hooks/hooks.json` holding `"modules": ["./register.js"]`, then the module. The same `hooks.json` can hold settings hooks under `hooks`. `types/index.d.ts` is needed only for `$.state` or a namespace the mod adds.
- **ES modules only**: `import` at the top of the file, relative paths inside the plugin, and `claude-code` as the one bare import.
- **Static analysis**: Claude Code reads the source before running it. Every call is written in full (`$.fs.read`, never `const fs = $.fs`), every event name is a string literal, and `$` passes only to a top-level function in the same file.
- **`claude plugin validate <dir>`** prints the `hooks:` and `calls:` lines: every event handled and every method called. `--strict` and `--json` exist.
- **`claude --plugin-dir <dir>`** loads a folder for one session and reloads the module on every save. Installs nothing. Shadows an installed or skills-folder plugin of the same name. `CLAUDE_CODE_PLUGIN_DIRS` does the same through the environment.
- **`/reload-plugins`** reloads every plugin. An installed plugin runs from a cache keyed by version, so editing it changes nothing until the version goes up.
- **A mod Claude writes** lands in `~/.claude/dev-mods/<session id>/<name>/`, a protected path, so each file asks. After a yes to hot reloading it loads at the turn's end and lives for that session alone. The built-in `plugin-authoring` skill tells Claude how.
- **Types**: each load of a `--plugin-dir` mod writes `.claude-plugin/types/`, with `claude-code/index.d.ts` (every event, method and element), `claude-code-tools/` (built-in tool inputs), `claude-code-mcp/`, and a `tsconfig.json`.
- **`claude plugin test [dir]`** runs every `*.test.ts` with no session, sign-in or network. Tests import `claude-code/testing`, stub what Claude Code would answer with `on(...)`, fire events through `$`, and press controls by `key`. 5 seconds a test. Exit 1 on a failure.
- **Seeing what loaded**: `/plugin` shows `1 mod active · <name>`. A refusal is a `hooks module <name> not loaded: <reason>` line in the debug log, or on stderr under `claude -p`.

## Events

**Tools**

- `tool.call`: a tool is about to run, a subagent's and MCP tools included. Returns `next(e)`, `{ deny }` or `{ result }`. Calling `next(e)` twice retries. `e.agentId` names a subagent's call.
- `tool.check`: the permission decision, after the rules and `PreToolUse` hooks. Returns `{ decision: 'allow' | 'ask' | 'deny' }`.
- `tool.describe`: once per tool, the description Claude reads. Returns `{ description }`.

**Prompts and what Claude reads**

- `prompt.submit`: a prompt sent. `next({ ...e, text })` replaces it, `context` adds text only Claude reads, `{ drop }` stops it.
- `prompt.fill`, `prompt.suggest`: text going into the box as a draft or a dim suggestion.
- `prompt.edit`: each edit the user makes in the box, a paste included.
- `prompt.compose`: the whole system prompt as `{ id, text, scope }` sections.
- `prompt.section`: one system prompt section. `{ text: null }` drops it.
- `prompt.context`: the context sent with the first message, the instruction files among it.
- `prompt.attachment`: a message Claude Code adds by itself, such as a reminder. `{ text: null }` drops it.
- `skill.prompt`: a skill's text as it expands, typed, loaded through the Skill tool or preloaded into a subagent. Returns `{ text }`.
- `attribution.text`: commit and pull request attribution.

**Commands and configuration**

- `command.run`: a command about to run. Returns `{ text }` (printed, and Claude reads it), `{}` or `next(e)`.
- `command.describe`, `config.set`, `config.describe`: the command list and `/config` rows.

**Turns**

- `turn.start`: a turn begins.
- `turn.step`: one request to the model, written as an async generator. Can change `model` or `effort`, read `result.usage`, or answer without the model.
- `turn.complete`: the turn ended, with `e.answer`, `e.durationMs`, `e.usage` and `e.isAborted`. `{ text }` shows a line under the answer.

**Session**

- `session.start`: once per mod before the first prompt, and after each reload. Never after `/clear`, `/resume` or `/branch`, where `classic.SessionStart` fires instead.
- `session.end`: 1.5 seconds for every hook together.
- `session.compact`: a compaction about to run, manual or automatic. `{ skip }` stops it. `instructions` and `messages` can be rewritten.
- `session.receive`, `session.send`: messages between sessions and subagents.
- `session.append`: each row the conversation keeps, before it's stored.
- `session.attach`, `session.detach`, `session.measure` (after each turn, and when a plan limit moves).

**Subagents**

- `agent.offer`: a subagent type offered to Claude. `{ isOffered: false }` withholds it.
- `agent.spawn`: a subagent about to start. Can change `prompt`, `subagentType`, `model`, `cwd`, or `{ deny }`.

**Interface**: `ui.render`, `ui.resolve`, `ui.press`, `ui.input`, `ui.select`, `ui.focus`, `ui.scroll`, `ui.close`, `ui.message`.

**Other mods**: `plugin.register` (a module about to load, `{ refuse }`) and `engine.create` (the API handed to a mod).

**Telemetry**: `telemetry.log`, `telemetry.mark`, only with the matcher `{ to: 'collector' }`.

**Settings hooks**: every settings hook event is `classic.<Event>`, with the stdin JSON as `e`.

**Calls**: every method is also an event, `fs.read` for `$.fs.read`. A mod earlier in the chain can watch, rewrite or refuse a later mod's call.

## Methods

- `$.plugin`: `name`, `root`.
- `$.ui`: `resolve`, `invalidate`, `open`, `close`, `panes`, `focus`, `scroll`, `toast`, `status` (a line under the prompt), `log` (a dim transcript line Claude never reads), `notice`, `ask` (the question dialog, resolving to the label picked), `copy`, `blit`.
- `$.command`: `register` (name, description, `argumentHint`, `immediate: true` to run during a turn), `run`, `list`. A taken name throws.
- `$.tool`: `register` (Claude sees `mcp__<plugin>__<name>`), `call`, `check`, `list`.
- `$.agent`: `register`, `spawn`, `list`.
- `$.model`: `complete` (one prompt, no history, on the user's plan, `maxTokens` 1,024 by default), `fork` (one question over the current conversation, served mostly from the prompt cache), `classify`.
- `$.prompt`: `submit` (starts a turn once idle, `asUser: true` to send as the user's words), `read`, `fill`, `suggest`, `compose`.
- `$.turn`: `abort`.
- `$.session`: `messages` (newest 4,096), `cwd`, `root`, `model`, `turns`, `id`, `repo`, `surfaces`, `usage` (`{ context: { tokens, window, percent }, rateLimits, cost, startedAt }`), `version`, `compact`, `send`, `append`, `authorize`.
- `$.config`: `list`, `set`. `$.settings`: `read`. `$.env`: `get`, `set`.
- `$.fs`: `read`, `write` (not atomic), `list` (one folder, not recursive), `exists`, `stat`, `ancestors`. Relative paths resolve against the session's folder.
- `$.store`: `get`, `set`, `delete`, `keys`. One JSON file per plugin under `~/.claude/plugins/store/`, shared by every session on the machine, 4 MiB. A get then a set races across sessions.
- `$.state`: reactive values for the session, surviving a reload, reset by `/clear`, `/resume` and `/branch`. A drawing that reads one redraws when it changes.
- `$.clock`: `now`, `sleep`, `after`, `every`. Timers stop on reload.
- `$.http`: `fetch`. `$.process`: `run` (no shell, 30 seconds by default, 10 minutes at most), `spawn`. `$.mcp`: `call`, `connect`. `$.audio`: `play`, `speak`. `$.telemetry`: `log`, `mark`.

## Drawing

- **A pane** is a sidebar beside the transcript in a wide fullscreen terminal, or a framed region above the prompt otherwise. `$.ui.open({ id, title, focus, closeOnEscape, holdToasts, rows, columns })` opens one. One the user didn't ask for appears only from 144 columns, or 110 once they've opened it themselves.
- **The band** is the strip directly above the prompt box, `AbovePrompt`, shared by every mod. A tree there replaces what later mods draw.
- **Claude Code's own sites**: `UserMessage`, `AssistantMessage`, `ToolUse`, `ToolResult`, `ToolGroup`, `CommandOutput`, `AskUserQuestion`, `Spinner`, `SessionMode`, `PromptHint`, plus `ToolProgress`, `TurnDuration` and `InfoNotice` in the terminal only. A hook changes props, replaces the drawing, or wraps Claude Code's own in a `Box`.
- **The permission prompt is not a site.** No mod can change it.
- **Elements**: `Box` (flex layout), `Text`, `Button` (`hotkey`, `action` naming a keybinding), `Link`, `Code` (10,000 characters, diffs too), `Markdown` (10,000), `Input`, `Select`, `Client` (a second file drawing, for animation and pointer input), `Raster` (a grid of colored cells, 512 by 256, terminal only), `Image` (PNG or RGBA up to 2 MiB, terminal only), `Svg` (Desktop only).
- **Keys**: a pane gets focus from `focus: true` opened by a command or press, Ctrl+X then Tab, or a click, and only while the prompt is empty. Tab and the arrows can't be rebound. A digit hotkey on the band fires when typed alone into an empty prompt.
- **Redraws**: `$.ui.invalidate('ui.render')`, at most 10 a second, 30 in the terminal for the visible pane, the band and the hint line.

## Limits

- **10 seconds** of a hook's own time per event. Waiting inside `next` or a `$` call doesn't count, except `$.clock.sleep`. A hook that times out is skipped, so a held tool call then runs.
- **1 second** for a `.catch` handler, which makes a guard fail closed.
- **1.5 seconds** for all `session.end` hooks together.
- **4 MiB** per `$.fs` file and for the whole `$.store`.
- **64 characters** for a command, tool, subagent or pane name: letters, digits, `_`, `-`.
- **3 crashes** of the shared worker that runs installed mods unload every one until `/reload-plugins`.

## Where mods run, and who decides

- **Hooks run** in the terminal, the Desktop Code tab, the VS Code panel, `claude -p`, the Agent SDK, Remote Control and cloud sessions that carry the plugin.
- **Drawing shows** in the terminal and the Desktop Code tab only.
- **Nothing loads** in safe mode, under `--bare` for installed plugins, under `disableAllHooks`, in a folder whose trust prompt went unanswered, or in a Desktop WSL session.
- **Order**: the built-in guard and an organization's `prependPlugins` first, then the mods a user installs, then `appendPlugins`, then Claude Code's built-in mods. A user's mod runs before the mods it lists under `dependencies`. The first mod is outermost: it sees the event first and the result last.
- **`prependPlugins` and `appendPlugins`** live in managed settings, or in user settings on a machine with no managed settings and no Team or Enterprise sign-in.
- **Settings hooks in the chain**: `PreToolUse` hooks from managed settings run before every mod, and their block is final. Every other `PreToolUse` hook runs after the last mod calls `next`.
- **A mod's `tool.check` outranks the rules**: it can approve what an `ask` rule would prompt for, what a non-managed `PreToolUse` hook blocked, and what auto mode's classifier would review. On a machine with no managed settings and no Team or Enterprise sign-in, it can also approve what a `deny` rule refuses.
- **The built-in guard, `sec-default@builtin`**, loads only with managed settings or a Team or Enterprise sign-in. It holds deny rules over mods there, and `allowManagedModsOnly` and `allowModsToOverrideDenyRules` are its options.
- **Built-in mods**: `cc-plugin-agents-md` (loads `AGENTS.md`), `cc-plugin-diff` (`/diff`), `cc-plugin-plugin-authoring`, `cc-plugin-sec-default`, `cc-plugin-telemetry`, and `cc-plugin-you-should-know`, off by default, a side agent showing a note above the prompt when it finds something worth knowing.

## Details only the type file has

- **`prompt.attachment` kinds** include `todo_reminder`, `plan_mode`, `auto_mode`, `instructions`, `nested_memory`, `skill_listing`, `deferred_tools_delta`, `edited_text_file`, `file` and `queued_command`. Builds add and retire kinds.
- **`prompt.context` blocks** are `claudeMd`, `userEmail`, `attachedProject` and `currentDate`, and `instructionFiles` lists the files behind `claudeMd`, `@` imports included. A hook can add, drop or rewrite any of them.
- **`prompt.submit`'s `context`** is read whole up to 100,000 characters a block, 200,000 together. Past that Claude reads a head and a path.
- **`prompt.edit`** carries the draft, the cursor, the span replaced and the text going in, which `next({ ...e, inputText })` replaces.
- **`agent.spawn`** fixes `fork` and `permissionMode`, and a rewritten `subagentType` must name an agent the call can dispatch.

## What mods fix in Flow

Each line: the limit Flow hit, then the fix, then what it replaces.

- **A hook can't replace the prompt**, [#95763](https://github.com/anthropics/claude-code/issues/95763): `prompt.submit` returns new text.
- **A hook can't load a rule or a skill**, [#93252](https://github.com/anthropics/claude-code/issues/93252): after an Edit or Write, the mod reads what was written and adds the rule or skill text to the result Claude reads.
- **`paths:` rules load on reads only**, [#93248](https://github.com/anthropics/claude-code/issues/93248): the same hook on Write gives `rules/comments.md` to a brand-new `.js` file.
- **No hook payload carries context usage**: `$.session.usage()`. Replaces the session-file parsing in `context-check.js`.
- **The model reaches a hook only at session start**: `$.session.model()`, and each request on `turn.step`. Gives the scorecard its model.
- **A subagent's cost never reaches the parent**: subagent requests report usage with their id, and a `tool.call` hook on Agent can add the total to the report.
- **A subagent has no output contract**: the same hook checks the report's shape and calls `next(e)` again to rerun it.
- **A hook's prompt offers only Yes or No**: the guard asks its own question with its own answers, "Yes for this session" among them, then approves through `tool.check`. Claude Code's prompt never appears. `blast-radius` is the model.
- **A Flow skill has no per-project switch**: drop it from the `skill_listing` reminder and refuse its Skill call.
- **A typed skill loads whole every time**: `skill.prompt` returns one line pointing at the copy the conversation already holds. That removes the reason behind `short-skill-no-arguments` in the root `CLAUDE.md`.
- **A failed background job shows only next session**, `lab/context/failure-log.md`: `$.ui.toast`, `$.ui.status` or `$.prompt.fill`, from a `$.clock.every` timer.
- **`/compact` is refused only when typed**: `session.compact` catches automatic compaction too. Replaces `compact-check.js`.
- **Overlays need 2 hook types**: `skill.prompt` is one event for every way a skill loads. Replaces `overlays.js`.
- **`changes.js` attributes edits by comparing times on WSL's jumping clock**: each `tool.call` carries `agentId`.
- **A dragged file arrives as a quoted path**, [#95761](https://github.com/anthropics/claude-code/issues/95761): `prompt.edit` can turn the paste into `@path`. A dragged folder, [#95762](https://github.com/anthropics/claude-code/issues/95762), inserts nothing, so nothing reaches a hook.
- **Every hook is a new Node process**: in-process hooks start no process, so a guard on every shell command costs nothing to start.
- **Hooks reach a machine only through the setup's merge into `settings.json`**: a hooks module ships inside the plugin folder Flow already links. A plugin's `hooks/hooks.json` could already carry command hooks, so moving Flow's hooks there never needed mods.

**Still blocked**: the machine setup session runs in safe mode, where no mod loads. The permission prompt can't be redrawn. The docs don't say whether a mod's approval covers a write under `.claude`.

## Ideas mods open

1. **Rewrite Claude Code's system prompt.** `prompt.section` drops or rewrites the sections that fight Flow's rules, such as "When you have enough information to act, act", which pushes against `instruction-or-thinking`. The same goes for `tool.describe` and the reminders under `prompt.attachment`, which also cuts tokens. Fixed text costs one cache write a session.
2. **Check each reply against `## The reply`.** At `turn.complete`, `$.model.fork` asks over the cached conversation whether the reply passes `### Before sending`, with `lab/context/rejected-replies.md` as the examples. A failure shows a line under the answer, or asks Claude for a rewrite.
3. **Coordinate sessions on one repo.** Each edit records file and session in `$.store`. A second session editing a file another live session touched recently is held with a question, or the mod messages that session through `$.session.send`.
4. **Give Flow its own screen.** The band shows the ticket, its status, context used and open issues, replacing `flow status-line`. A `/board` pane draws the board with buttons that move a ticket, with no turn and no tokens, while Claude works too. `/exp-47` as a mod command prints the ticket the same way, in place of a generated skill per ticket.
5. **Real pictures for `/flow:visualize`.** `Image` draws a PNG in the terminal, so a rendered mockup shows in a pane. `lab/context/drawing.md` holds the engine that was never built.
6. **A handoff in place of compaction.** `session.compact` skips the compaction and `$.prompt.submit` sends `/flow:handoff`.

## Dropped

- **A gate on `instruction-or-thinking`**, dropped by the user 2026-10-02. A Haiku call at `prompt.submit` would label each message an instruction or thinking, and the turn's first Edit or Write under "thinking" would be held with a question. The user: current models are smart enough to judge it, and a model call per message is overcomplication. The cause behind past breaks stays real: Claude Code's own system prompt pushes the agent to act. Idea 1 is the fix kept for it.

## Costs

- **A port, not a wrapper.** The module has no Node APIs, and `guard.js` is 1,400 lines of Node. Running the script through `$.process.run` keeps one copy and loses the speed. Porting it to `$` is fast and leaves 2 copies until the script goes.
- **New and moving.** Released 2026-10-01. The docs say events and methods change between releases, and the type file on GitHub was 10 releases behind on 2026-10-02.
- **No drawing under `claude -p`, nothing in safe mode.**
- **Any installed mod can lift Flow's deny rules** on a machine with no managed settings and no Team or Enterprise sign-in. The locks on `flow restore` and `flow uninstall` lean partly on deny rules. Flow's mod listed first in `prependPlugins` sees every later decision and can put the deny back.
- **Prompt cache**: any text a hook changes between requests invalidates it.
- **Codex: no cost.** The user put Codex out of scope 2026-10-02, with a version of its own possible later, so Claude Code lock-in delays no mod.

## Open questions

Each one is for a short probe, since the docs leave it open.

1. Does `flow@skills-dir`, the plugin loaded from Flow's skills folder, load a hooks module, including through a linked `hooks/` folder? Claude Code 2.1.257 refuses a component path that is a link leading outside the plugin.
2. Can `tool.check` approve a write under `.claude`?
3. Can `$.command.register` add a command after session start, for a ticket made mid-session?
4. Does `skill.prompt` fire for a repeat load that Claude Code already shortens to a note?

## Build order

Nothing is built before the beta ships. Every step below runs during the beta, in this repo.

0. **Probe the 4 open questions.** Question 1 decides where the module lives: inside Flow's plugin, reloaded with `/reload-plugins`, or a second plugin loaded with `--plugin-dir`, reloaded on every save.
1. **Watch-only first**: the band, context usage and the compaction catch, replacing `context-check.js`, `compact-check.js` and the status line. They change nothing Claude does, so a fault costs little.
2. **Then idea 1**, the system prompt rewrite.
3. **Then the rest, one at a time, most valuable first:**
   1. Rules and skills loaded on a write, fixing #93248 and #93252.
   2. Overlays and repeat skill loads, through `skill.prompt`.
   3. The guard asking its own question, with "Yes for this session".
   4. Subagent cost and the checked report shape.
   5. The board pane and the ticket commands.
   6. Session coordination.
   7. The reply check, pictures for `/flow:visualize`, and the handoff in place of compaction.

Every step ends the same way: its tests run under `claude plugin test` inside Flow's suite, the script it replaced is deleted, and `lab/context/state.md`, the docs and this file say what changed.

Building live: `claude --plugin-dir <Flow's plugin folder in this repo>` loads the repo's copy for one session, reloads it on every save, and installs nothing. `lab/scripts/try.sh` stays for what a live session can't test: a fresh install, the setup session, a machine without Flow.
