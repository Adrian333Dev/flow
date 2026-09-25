# Handoff

Written 2026-09-25, before a compaction the user asked for. Read this once, then rewrite it whole next time. Nothing below is approved to build: the next step is a conversation.

## Next: the project form, then build project setup

**The step file for `flow setup project` is designed. The form is not.** The next reply proposes the outline of `scripts/flow/setup/project-form.md`, the `migration.md` the user approves once, modelled on `scripts/flow/setup/form.md`. Its sections follow from where findings land. Then the build: `project.md`, `project-form.md`, and the code for `flow setup project`, `check` and `finish`.

**Every decision is in `lab/context/management.md` → `## Project setup is a command, ruled 2026-09-25`.** Read it whole before proposing anything. In short:

- **The launch**: `claude --setting-sources user --strict-mcp-config`, plus `--add-dir ~/.flow` and `--add-dir` for the project's memory folder. Loads Flow and nothing of the project's. `references/harnesses/claude-code.md` → `## A session that loads no project files`.
- **Nothing in the project changes before the form's yes.**
- **Setup needs a git repository.** An empty one gets `project-template/` alone.
- **The steps follow `machine.md`**: check, read what Flow brings, read the project, sort, hand over the form, take the answer, carry it into `files/`, apply, doctor, finish, last message.
- **The harvest is goals and tips, never a procedure.** Ruled by the user, who rejected 3 stages, `inventory.md`, 150 KB batches and typing files before reading them as overcomplicated. Start with `util fs tree`, whose line counts show a large file. Explore the code in its own right, skipping what doesn't matter. Read every rule file, every doc written for this project, the memory and the settings. Copied-in documentation stays unread. Subagents where they help, no rules on how. The code wins over any doc.
- **Where findings go**: rules the agent would get wrong → `AGENTS.md`; lasting facts → `docs/context/<subject>.md`; open work → tickets; uncommitted ideas → `.flow/inbox.md`; tool lessons → `.flow/findings/`; the user → the machine's 2 sections; domain skills → `.flow/domain-skills.txt`; dropped lines → `dropped.md` with the Flow rule named.
- **Every project setting gets the keep-or-remove test**: plugins, hooks, permissions, `.mcp.json`, `.claude/settings.local.json`.
- **2 tickets**: "Write the product spec" and "Find skills, plugins and MCP servers for this stack". Setup writes no spec.

The 3 projects studied: `/home/me/code/projects/delapse`, `/home/me/code/projects/delapse-validation` (memory under the old name `-home-me-code-projects-backmark-validation`), and `repos/lumacraft_v2`, read with `cat` only. All 3 are the user's and share a shape. Design for projects that don't.

## Restore: agreed, not built

`flow restore machine` lists every project set up and offers to put them back first. The user types `restore` for all of them, or `machine` for the machine alone, after a warning. `~/.flow/` survives a machine restore, so `node ~/.flow/scripts/flow/flow.js restore project` still works afterwards, and the warning prints it. `scripts/flow/commands/uninstall.js` already lists projects with `originals.list(at)`.

## Done this session

Committed by the user unless named below:

- **Agents read with `Read`, never `util fs merge`.** `merge` is a tool for people only, and says so in the first line of its header. Reasons in `lab/context/state.md` and `docs/manual/reference.md` → `## Agents read files with Read, never util fs merge`.
- **`/flow:setup-project` renamed to `flow setup project`** everywhere live.
- **Descriptions removed**: the `description:` line, `.info` folders and `home/AGENTS.md` → `describe-an-opaque-name`. `util ls` prints each command's first header sentence, `util fs tree` prints names and line counts, util aliases live in `.alias`. The toolbox keeps its `.info` files. `lab/context/state.md` → the descriptions entry.
- **`rules/comments.md`**: `header-says-what-the-file-is` and `cut-words-never-information`, both read and approved by the user. Uncommitted.
- **`lab/context/management.md`**: the step-file bullets, uncommitted.

## Facts established

- **Bash output reaches the agent up to about 30,000 characters in total**, then a 2,000-character preview and a saved file. Nothing scopes the limit to one command.
- **Read returns 25,000 tokens per page**, about 100,000 characters, and at most 2,000 lines by default, with `offset` and `limit`. Parallel calls each get a page.
- **`--setting-sources user` skips project instructions at any depth, skills, commands, subagents, settings and `.mcp.json`.** Probed in `tmp/probe-sources/` for the first 4.
- **A subfolder's `CLAUDE.md` loads when the agent reads a file in that folder.**
- **The `util` on PATH runs `~/code/util`, an older copy than `lab/util/`.** Its tree shows no line counts and it still reads descriptions until that copy is updated.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Keep designs simple.** The user rejects procedure written for the agent where a goal and a tip do the job, and rules about how to use subagents.
- **Explain every term the first time**, in plain words, and answer every topic.
- **Push back once with the deciding argument** when the user's idea loses.
- **Never `cd` in a command.** Use absolute paths.
- **Nothing is released.** Never design for a machine set up with an older Flow.

## Loose ends nobody has raised

- util's test `git work refuses to send from a machine with no name` fails on this machine, since the global git config sets `util.machine = me-kmkw`.
- `docs/manual/reference.md` has a heading `# Delapse into Flow` near line 218, not written by this work.
- 2 Flow tests fail under load and pass alone: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- The scorecard records use a `kind` field.
- The user's own run of the setup session is still pending: `bash lab/scripts/try.sh --case before-flow --name setup-1` from a real terminal.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`, `tmp/probe-sources/`, `tmp/ps.md`.
