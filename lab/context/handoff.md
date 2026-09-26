# Handoff

Written 2026-09-26. Read this once, then rewrite it whole next time.

## Next: 2 conversations the user opened, then the research redesign

**The management skill is built apart from `/flow:help`, which is parked until the manual is rewritten.** The user asked for a sweep of the backlog for anything essential and small before the final sweep. The small batch is built, below. What is left, in the order recommended to the user:

1. **Suggesting `flow setup project` in a folder that looks like a project.** The user does not want every folder treated as a project: `~/code/playground` and `~/kb_v0` are git repositories and not projects. They floated a check for code markers such as `package.json`. `backlog.md` → `### Install and migration` holds the line. The reply to that message is where this conversation stands.
2. **A second machine joining `~/.flow/`'s repository**, which cannot happen today. Same section of `backlog.md`.
3. **The research redesign**, agreed 2026-09-19 and waiting for the management work. `lab/context/knowledge-base.md` → `## The build plan`, whose `### Settle before building` holds 3 points for the user.
4. **4 conversations**: filling `## The user` and `## Preferences`, wrapping up when the context gets large, a bare `/flow:start`, and who reads `~/.flow/workflow-notes.md`.
5. **The final sweep.** The user warned it is much bigger than it looks.

## Built today, not committed by the user

The suite passed 173 of 173 on the last whole run.

**A test run made a commit in this repository**: `54272df start`, author `t <t@t>`, holding 13 of today's files as they stood at 14:24. 10 copies of `changes.test.js` shared one scratch folder, one deleted another's `.git`, and that copy's `git commit` climbed up to Flow's repository. Nothing was pushed. The user was told, and what happens to the commit is theirs to decide. Both tests that commit now set `GIT_CEILING_DIRECTORIES`.

- **The session check never takes the home folder for a project.** `scripts/session-check.js` → `projectRoot()`. Before, a session opened outside a project unlinked every skill switched on for the whole machine. Test in `session-check.test.js`, shown failing on the old hook first.
- **`flow restore machine` offers the projects first**: `restore` for all, `machine` for the machine alone. `confirm.word()` takes a list of words. `docs/manual/reference.md` shows the prompt. The user ran it at a real terminal on a pretend machine, `node tmp/restore-try/build.js`, typed `restore`, and all 3 paths came back. The printed layout is messy, filed in `backlog.md` → `` `flow`, the tool ``.
- **`/flow:groundwork`'s 6 `### When` cases** moved to `skills/phases/groundwork/references/walk-cases.md`, one trigger line each left in the skill.
- **`flow sync`**: the first sync to an empty remote no longer refuses, and a refused pull prints git's real reason. `sync.test.js` runs a round trip through a bare repository.
- **`scripts/flow/lib/changes.js` → `snapshot()`** keeps the real index's modified time on its copy, which fixed the test that failed 1 run in 5. A new test forces the same-second timing and failed 3 of 3 before the fix.
- **`lab/research/claude-code-docs/`** fetched again, 3 pages added, 3 citations repointed.
- `references/workflow.md` → `Migration` says `flow restore` is the undo. The backlog moved 5 items that need Flow in real use to `## After V1`.

## Facts established

- **Bash output reaches the agent up to about 30,000 characters in total**, then a 2,000-character preview and a saved file.
- **Read returns 25,000 tokens per page**, and at most 2,000 lines by default, with `offset` and `limit`.
- **`--setting-sources user` skips project instructions at any depth, skills, commands, subagents, settings and `.mcp.json`.** Probed in `tmp/probe-sources/`.
- **The `util` on PATH runs `~/code/util`, an older copy than `lab/util/`.** Its tree shows no line counts.
- **A test's scratch folder sits inside Flow's repository**, so git finds Flow above a folder never initialised. `GIT_CEILING_DIRECTORIES` stops it, as the setup and update tests do.
- **`/doctor prompt-audit` needs Anthropic's bundled `claude-api` skill**, and `home/settings.json` sets `disableBundledSkills: true`, as does this machine's own `~/.claude/settings.json`. The user ran it 2026-09-26 and got that refusal. It stays filed under After V1, to run once Flow is installed.
- **`flow restore` and `flow uninstall` refuse inside any session**, this one included, since the lock looks for any running `claude` process on the machine.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Keep designs simple.** Goals and tips over procedure, no rules on how to use subagents, few options for the user.
- **Flow must stay flexible**: not every folder is a project, and nothing may force one to be. Said 2026-09-26.
- **Explain every term the first time**, in plain words, and answer every topic.
- **Push back once with the deciding argument** when the user's idea loses.
- **Never `cd` in a command.** Use absolute paths.

## Loose ends nobody has raised

- `scripts/flow/setup/` holds the update session's text too, so its name undersells it.
- util's test `git work refuses to send from a machine with no name` fails on this machine, since the global git config sets `util.machine`.
- `docs/manual/reference.md` has a heading `# Delapse into Flow` in the middle of `## Migrations and the original`, not written by this work.
- The scorecard records use a `kind` field.
- Claude Code now has `syncClaudeAiSkills`, which downloads the skills enabled on the claude.ai account into `~/.claude/skills/synced/`. Flow's setup does not know it exists. `settings-reference.md` → `### syncClaudeAiSkills`.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`, `tmp/probe-sources/`, `tmp/ps.md`.
