# Handoff

Written 2026-09-26. Read this once, then rewrite it whole next time.

## Next: run project setup for the first time

**`flow setup project` is built and has never run.** The next step is running it on Delapse in the sandbox, `bash lab/scripts/try.sh`, and fixing what the run finds. Ask the user before starting it: a run needs their terminal.

What exists, all uncommitted:

- **`scripts/flow/setup/project.md`**: the step file, 11 steps, the harvest as goals and tips.
- **`scripts/flow/setup/project-form.md`**: the form's template.
- **`scripts/flow/commands/setup.js`** → `actions.project`: the launch, `check` and `finish`. 3 tests in `scripts/tests/setup.test.js`.
- **`scripts/flow/commands/doctor.js`**: the stopped-run line names `flow setup project` for a project run.
- Records: `lab/context/management.md` → the form's block under `## Project setup is a command`, `lab/context/state.md`, `backlog.md`, `docs/manual/reference.md` → `### flow setup project`, `docs/dev/layout.md`.

Untested by any run: whether `--add-dir` accepts the memory folder, whether `flow new` with `FLOW_PROJECT` pointed at the copy under `files/` works from inside the session, and how the session copes with Delapse's 182 docs.

The 3 projects studied: `/home/me/code/projects/delapse`, `/home/me/code/projects/delapse-validation` (memory under the old name `-home-me-code-projects-backmark-validation`), and `repos/lumacraft_v2`, read with `cat` only.

## Restore: agreed, not built

`flow restore machine` lists every project set up and offers to put them back first. The user types `restore` for all of them, or `machine` for the machine alone, after a warning. `~/.flow/` survives a machine restore, so `node ~/.flow/scripts/flow/flow.js restore project` still works afterwards, and the warning prints it. `scripts/flow/commands/uninstall.js` already lists projects with `originals.list(at)`.

## Facts established

- **Bash output reaches the agent up to about 30,000 characters in total**, then a 2,000-character preview and a saved file.
- **Read returns 25,000 tokens per page**, and at most 2,000 lines by default, with `offset` and `limit`.
- **`--setting-sources user` skips project instructions at any depth, skills, commands, subagents, settings and `.mcp.json`.** Probed in `tmp/probe-sources/`.
- **The `util` on PATH runs `~/code/util`, an older copy than `lab/util/`.** Its tree shows no line counts.
- **A test's scratch folder sits inside Flow's repository**, so git finds Flow above a folder never initialised. `GIT_CEILING_DIRECTORIES` stops it, as the project setup tests do.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Keep designs simple.** Goals and tips over procedure, no rules on how to use subagents, few options for the user.
- **Explain every term the first time**, in plain words, and answer every topic.
- **Push back once with the deciding argument** when the user's idea loses.
- **Never `cd` in a command.** Use absolute paths.

## Loose ends nobody has raised

- util's test `git work refuses to send from a machine with no name` fails on this machine, since the global git config sets `util.machine`.
- `docs/manual/reference.md` has a heading `# Delapse into Flow` in the middle of `## Migrations and the original`, not written by this work.
- 2 Flow tests fail under load and pass alone: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- The scorecard records use a `kind` field.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`, `tmp/probe-sources/`, `tmp/ps.md`.
