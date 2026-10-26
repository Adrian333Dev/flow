# Flow

**Flow is a personal workflow for Claude Code, built for its author's own work and shared as is.** It has no support, no promise to stay stable, and no instructions for anyone else. Read it, copy from it, or fork it.

It runs a solo developer's work in 3 phases: design the decisions, build one ticket at a time, and file what each session taught back into its rules and skills.

## What the repository holds

- `home/`: the templates for the global rule file and Claude Code's settings
- `skills/`: the `/flow:*` skills, one per phase and tool
- `scripts/`: the `flow` command and its hooks, in Node and bash
- `mods/flow-session/`: Flow's Claude Code mod, in TypeScript: the ticket badges, the meters under the prompt and the restart tool
- `project-template/`: the files `flow init` writes into a project
- `docs/spec/`: what each part of Flow does, and why
- `docs/manual/`: every command, file, setting and skill, and how a session restarts
- `lab/`: the maintainers' workspace, with the archive of retired code

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/main/install.sh | bash
```

The script clones Flow into `~/.flow/repos/flow`, then runs `flow install`. It needs Claude Code 2.1.287 or later, `git`, `node` and `gh`. Built and used on Linux, through WSL, with Claude's 5.5 models.

To update, run `flow update`. It pulls the clone, then runs `flow install` again.

[The command reference](docs/manual/commands.md) lists every `flow` command.
