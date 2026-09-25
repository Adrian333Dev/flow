# Handoff

Written 2026-09-25, before a compaction the user asked for. Read this once, then rewrite it whole next time. Nothing below is approved to build: the next step is a conversation.

## Next: the step file for project setup

**The user asked "what's next" and the answer was the design of `flow setup project`'s 2 remaining pieces, in this order:**

1. **The step file, `scripts/flow/setup/project.md`**, modelled on `scripts/flow/setup/machine.md`. The promised next reply is its outline: the harvest's 3 stages, what each subagent reads and returns, and where each type of finding goes.
2. **The project form**, the `migration.md` the user approves once, modelled on `scripts/flow/setup/form.md`. It follows the steps, since it records what they find.

**Every decision so far is in `lab/context/management.md` → `## Project setup is a command, ruled 2026-09-25`.** Read it before proposing anything. In short:

- **The launch**: `flow setup project` opens a normal session through `claude --setting-sources user --strict-mcp-config`, which loads Flow and nothing of the project's. Probed in `tmp/probe-sources/`. `references/harnesses/claude-code.md` → `## A session that loads no project files` holds the line.
- **Nothing in the project changes before the form's yes.** Files kept never move.
- **The harvest**: survey into `inventory.md`, subagents reading batches with `util fs tree` and `Read`, findings beside it. Sources typed by content, the code wins over docs, only files git keeps.
- **Where findings go**: rules the agent would get wrong → `AGENTS.md`; lasting facts → `docs/context/<subject>.md`; open work → tickets; uncommitted ideas → `.flow/inbox.md`; lessons about a tool → `.flow/findings/`; the user → the machine's 2 sections; domain skills → `.flow/domain-skills.txt`.
- **Every project setting gets the keep-or-remove test one by one**: plugins, hooks, permissions, `.mcp.json`, `.claude/settings.local.json`.
- **2 tickets**: "Write the product spec" for `/flow:groundwork`, and "Find skills, plugins and MCP servers for this stack" for `/flow:research`. No spec is written by setup.
- **Rejected, with reasons recorded**: a skill in place of the command, a script moving files out first, and the same model for machine setup, which stays in safe mode.

The 3 projects studied: `/home/me/code/projects/delapse` (drifted `CLAUDE.md` and `AGENTS.md`, superpowers switched on in project settings, 183 docs, 24 memory files), `/home/me/code/projects/delapse-validation` (memory under the old name `-home-me-code-projects-backmark-validation`), and `repos/lumacraft_v2`, read with `cat` only (no `AGENTS.md`, 11 plugins in project settings, tracked notes in `important-temp/`). All 3 are the user's and share a shape. Design for projects that don't.

## Restore: agreed, not built

`flow restore machine` lists every project set up and offers to put them back first. The user types `restore` for all of them, or `machine` for the machine alone, after a warning. Declining is allowed: `~/.flow/` survives a machine restore, so `node ~/.flow/scripts/flow/flow.js restore project` still works in a project afterwards, and the warning prints it. `flow restore project` stays for one project. `scripts/flow/commands/uninstall.js` already lists projects with `originals.list(at)`.

## Done this session

Committed by the user:

- **Agents read with `Read`, never `util fs merge`.** `home/AGENTS.md` → `read-in-parallel`. `merge`'s `description:` line says "not designed for Claude Code". The reason sits in `lab/context/state.md` → the reading entry, `docs/manual/reference.md` → `## Agents read files with Read, never util fs merge`, `README.md`, and util's `docs/commands.md`. `flow doctor` checks only `fs tree` and `fs open`.
- **`/flow:setup-project` renamed to `flow setup project`** in every live script, doc and message. Dated entries in `management.md` keep the old name.
- **Project setup decisions** written into `management.md`, then the paths list, `docs/context/`, inbox, findings, domain skills, settings test and the research ticket.

Not yet committed: the flags decision in `management.md`, `backlog.md` → `flow setup project`, and `references/harnesses/claude-code.md`.

## Facts established

- **Bash output reaches the agent up to about 30,000 characters in total**, then a 2,000-character preview and a saved file. Nothing scopes that limit to one command. `bashOutputMaxChars` is machine-wide, or session-wide through `--settings`, and the user rejected both.
- **Read returns 25,000 tokens per page**, about 100,000 characters, and takes `offset` and `limit` for a line range. Parallel calls each get a page.
- **Models newer than Opus 4.6 can edit a file they never read**, when reading it would need no permission prompt. `lab/research/claude-code-docs/tools-reference.md` line 195.
- **`--setting-sources user` skips project instructions at any depth, skills, commands, subagents, settings and `.mcp.json`.** Probed for the first 4, documented for the last 2.
- **A subfolder's `CLAUDE.md` loads when the agent reads a file in that folder.** `tmp/docs-fetch/memory.md` line 134.
- **Safe mode switches off `CLAUDE.md`, skills, plugins, hooks, MCP servers, custom commands and agents.** Built-in tools and permissions work.
- **A project's `enabledPlugins` beats the user's own.**

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Explain every term the first time**, in plain words.
- **Answer every topic, and say what to do.** Push back once with the deciding argument when the user's idea loses; the user asked for that explicitly.
- **Never propose a fix that moves the problem instead of solving it.** Test a proposal against the user's own requirement before showing it.
- **Never `cd` in a command.** Use absolute paths, or a `( … )` subshell.
- **Pick the smallest design, one source of truth.** Prefer what other harnesses can share, as the user asked.
- **Nothing is released.** Never design for a machine set up with an older Flow.

## Loose ends nobody has raised

- util's test `git work refuses to send from a machine with no name` (`lab/util/tests/commands.test.js:324`) fails on this machine: the global git config sets `util.machine = me-kmkw`, so unsetting the repository's name still leaves one.
- `docs/manual/reference.md` has a heading `# Delapse into Flow` near line 218, not written by this work.
- 2 Flow tests fail under load and pass alone: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- The scorecard records use a `kind` field.
- The user's own run of the setup session is still pending: `bash lab/scripts/try.sh --case before-flow --name setup-1` from a real terminal.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`, `tmp/probe-sources/`, `tmp/ps.md`.
