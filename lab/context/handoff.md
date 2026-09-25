# Handoff

Written 2026-09-25, before a compaction the user asked for. Read this once, then rewrite it whole next time. Nothing below is approved to build: the next step is a conversation.

## Open now: a clean way for `util fs merge` to hand over large output

**This is the first topic after compaction.** The user wants to discuss it and find a clean solution.

The problem, as the user put it: the harvest reads projects through `util fs merge`, which prints many files as one text. Today `merge` refuses past 2,000 lines and prints each file's line count instead, and `--force` prints everything. An agent then takes 3 calls: the refusal, the `--force` run, and a Read of the file Claude Code saved the output to. The user wants the large limit for `merge` alone.

**Facts, from the docs and from probes run 2026-09-25 in `tmp/docs-fetch/`:**

- **Bash output reaches Claude inline up to about 30,000 characters.** Past that, Claude Code saves it to a file and gives the path plus a 2,000-character preview. A failing command gets a 10,000-character head-and-tail excerpt with no path. `tools-reference.md` → `#### Output limits`, fetched raw into `tmp/docs-fetch/`.
- **`bashOutputMaxChars`** (a setting, up to 128,000, Claude Code 2.1.261 or later, this machine runs 2.1.282) raises the inline ceiling for every command. `BASH_MAX_OUTPUT_LENGTH` raises only the read-back window, never the inline ceiling.
- **Nothing scopes the Bash limit to one command.** The only per-tool limit is an MCP tool's `_meta["anthropic/maxResultSizeChars"]`, up to 500,000 characters. Safe mode switches off MCP servers and hooks, and setup runs in safe mode.
- **A `PostToolUse` hook can replace a tool's output** with `updatedToolOutput`, matching the Bash shape `{stdout, stderr, interrupted, isImage}`. Hook output strings are capped at 10,000 characters, and hooks are off in safe mode.
- **Read returns 25,000 tokens per page**, probed: `showing lines 1-850 of 4001 total (100006 tokens, cap 25000)`, with the offset for the next page. `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` overrides it.
- **2,000 lines of code run 60,000 to 80,000 characters**, so even a merge `merge` calls safe overflows the 30,000 inline ceiling today.
- **Probed and working, and rejected by the user:** `claude --settings '{"bashOutputMaxChars":128000}'` raises the limit for one session, subagents included. The user rejected it hard: a setup session runs many commands besides `merge`, so a session-wide limit is the same problem as a global one.

**Also proposed and not yet answered:** `merge` stops using `--force`. Over its limit, it writes the whole output to a file under `tmp/` and prints the path and size, so the agent makes 2 calls, `merge` then Read, with no failed call. The limit becomes characters, not lines. The user's objection was aimed at the session setting, and this part was not discussed on its own.

`merge` lives in `lab/util/commands/fs/merge.js`, `LINE_LIMIT = 2000`. `lab/util/` has its own tests.

## Project setup: designed, not built

`backlog.md` → `flow setup project`, and `lab/context/management.md` → `## Project setup is a command, ruled 2026-09-25` hold every decision so far: the command, the 3 harvest rulings, the 3 rulings on what setup writes and on restore, and how the harvest runs. The design pass still owes:

- **The step file**, `scripts/flow/setup/project.md`, modelled on `scripts/flow/setup/machine.md`, and the project form, modelled on `scripts/flow/setup/form.md`.
- **The merge question above**, which decides how subagents read.
- **Whether safe mode loads an explicit `--mcp-config`** was never checked, and matters only if an MCP route comes back.

The 3 projects studied: `/home/me/code/projects/delapse` (CLAUDE.md and AGENTS.md drifted copies, superpowers switched on in its project settings, 183 docs, 24 memory files), `/home/me/code/projects/delapse-validation` (memory under the old name `-home-me-code-projects-backmark-validation`), and `repos/lumacraft_v2`, read with `cat` only (no `AGENTS.md`, 11 plugins in project settings, tracked notes in `important-temp/`). All 3 are the user's and share a shape. Design for projects that don't.

## Restore: agreed, not built

`flow restore machine` lists every project set up and offers to put them back first. The user types `restore` for all of them, or `machine` for the machine alone, after a warning. Declining is allowed: `~/.flow/` survives a machine restore, so `node ~/.flow/scripts/flow/flow.js restore project` still works in a project afterwards, and the warning prints it. `flow restore project` stays for one project. `scripts/flow/commands/uninstall.js` already lists projects with `originals.list(at)`.

## Built this session, uncommitted

- **Permissions with one owner per rule.** `home/settings.json` allows 23 shell patterns and denies `sudo *`, `su *`, `mkfs*` and `* --dangerously-skip-permissions *`. `scripts/guard.js` asks about 4 things and never allows. The git switch is gone. `lab/context/state.md` and `management.md` → `## Permissions have one owner per rule` carry it.
- **Restores write a line to `~/.flow/history.jsonl`**, from `restore()` in `scripts/flow/lib/originals.js`, tested in `scripts/tests/restore.test.js`. The history log backlog item is finished and deleted.
- `npm test` in `scripts/`: 160 of 160 pass.

## Facts established

- **Claude Code runs a built-in read-only set with no rule**: `ls`, `cat`, `echo`, `head`, `tail`, `grep`, `find`, `wc`, `diff`, and read-only `git`.
- **A trailing ` *` in a pattern matches a word boundary or the end**, so `Bash(npm test *)` matches a bare `npm test`, and `Bash(mkfs *)` misses `mkfs.ext4`.
- **A hook's `ask` shows Yes and No only**, and prompts even where an allow rule matches.
- **Saved rules land in `.claude/settings.local.json` at the repository root.**
- **A project's `enabledPlugins` beats the user's own**, per Claude Code's settings docs. To opt out on one machine, set it `false` in `.claude/settings.local.json`.
- **Safe mode switches off `CLAUDE.md`, skills, plugins, hooks, MCP servers, custom commands and agents.** Built-in tools and permissions work normally, and built-in subagents run.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Explain every term the first time**, in plain words.
- **Answer every topic, and say what to do.**
- **Never propose a fix that moves the problem instead of solving it.** The session-wide setting was rejected as the same thing as a global one. Test a proposal against the user's own requirement before showing it.
- **Never `cd` in a command.** Use absolute paths, or a `( … )` subshell.
- **Pick the smallest design, one source of truth.**
- **Nothing is released.** Never design for a machine set up with an older Flow.

## Loose ends nobody has raised

- `docs/manual/reference.md` has a heading `# Delapse into Flow` near line 220, not written by this work.
- 2 tests fail under load and pass alone: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- The scorecard records use a `kind` field.
- The user's own run of the setup session is still pending: `bash lab/scripts/try.sh --case before-flow --name setup-1` from a real terminal.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`.
