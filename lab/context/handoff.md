# Handoff

Written 2026-09-26. Read this once, then rewrite it whole next time.

## Next: `/flow:help`

**The build order in `backlog.md` → `### The management skill, in build order` has 2 lines left before the first real install**: `skills/tools/help/SKILL.md`, then the install on this machine, which waits for the user's word. `/flow:help` is designed in `lab/context/management.md` → `## The answer job`. Propose its shape to the user before building.

## Built today, never run for real

`flow up` is uncommitted. Neither has met a real case.

- **`flow setup project`**: `scripts/flow/setup/project.md`, `project-form.md`, `scripts/flow/commands/setup.js` → `actions.project`. The user chose to try it at the end, once Flow is finished, on Delapse in the sandbox, `bash lab/scripts/try.sh`. Untested: whether `--add-dir` accepts the memory folder, whether `flow new` with `FLOW_PROJECT` pointed at the copy under `files/` works from inside the session, and how the session copes with Delapse's 182 docs.
- **`flow up`**, in place of the `/flow:migrate` skill: `scripts/flow/commands/up.js` and `scripts/flow/setup/migrate.md`. It pulls, then opens one session per place behind, the machine first. A real run needs entry 2 in `CHANGELOG.md` and its guide, and entry 2 waits for the first install. Untested: whether `flow audit session` lists the hooks a `claude -p` session fired, which the proof step relies on.
- Records: `management.md` → `## Project setup is a command, ruled 2026-09-25` and `## Migration is a session flow up opens, ruled 2026-09-26`, `lab/context/state.md`, `backlog.md`, `docs/manual/reference.md` → `### flow setup project` and `### flow up`, `upgrades/README.md`, now 5 headings.

The suite passed 169 of 169 on the last run.

## Restore: agreed, not built

`flow restore machine` lists every project set up and offers to put them back first. The user types `restore` for all of them, or `machine` for the machine alone, after a warning. `~/.flow/` survives a machine restore, so `node ~/.flow/scripts/flow/flow.js restore project` still works afterwards, and the warning prints it. `scripts/flow/commands/uninstall.js` already lists projects with `originals.list(at)`.

## Facts established

- **Bash output reaches the agent up to about 30,000 characters in total**, then a 2,000-character preview and a saved file.
- **Read returns 25,000 tokens per page**, and at most 2,000 lines by default, with `offset` and `limit`.
- **`--setting-sources user` skips project instructions at any depth, skills, commands, subagents, settings and `.mcp.json`.** Probed in `tmp/probe-sources/`.
- **The `util` on PATH runs `~/code/util`, an older copy than `lab/util/`.** Its tree shows no line counts.
- **A test's scratch folder sits inside Flow's repository**, so git finds Flow above a folder never initialised. `GIT_CEILING_DIRECTORIES` stops it, as the setup and update tests do.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Keep designs simple.** Goals and tips over procedure, no rules on how to use subagents, few options for the user.
- **Explain every term the first time**, in plain words, and answer every topic.
- **Push back once with the deciding argument** when the user's idea loses.
- **Never `cd` in a command.** Use absolute paths.

## Loose ends nobody has raised

- `scripts/flow/setup/` now holds the update session's text too, so its name undersells it.
- util's test `git work refuses to send from a machine with no name` fails on this machine, since the global git config sets `util.machine`.
- `docs/manual/reference.md` has a heading `# Delapse into Flow` in the middle of `## Migrations and the original`, not written by this work.
- 2 Flow tests fail under load and pass alone: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- `references/workflow.md` → `Migration` still says a migration is undone with a snapshot.
- The scorecard records use a `kind` field.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`, `tmp/probe-sources/`, `tmp/ps.md`.
