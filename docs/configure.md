# Configure

Change how Flow behaves: its settings, the skills that are on, a skill's steps for one project, and the rules.

## Table of contents

- [Where settings live](#where-settings-live): 4 files, and which one wins
- [Turn Flow's lines on or off](#turn-flows-lines-on-or-off): `flow settings`
- [Switch skills on or off](#switch-skills-on-or-off): this project or everywhere
- [Change a skill for one project](#change-a-skill-for-one-project): overlays
- [Change a rule](#change-a-rule): your rules, a project's, and rules for one kind of file

## Where settings live

- **`~/.flow/settings.json`**: Flow's settings for all your computers.
- **`~/.flow/settings.local.json`**: for this computer alone, such as a folder path.
- **`<project>/.flow/settings.json`**: one project's, kept with its tickets.
- **`~/.claude/settings.json`**: Claude Code's own file, with Flow's keys added.

The nearer file wins: a project's skill switch over the computer-wide one, and the local file over `settings.json`. A change to Claude Code's file counts once Claude Code restarts. [Settings](reference/settings.md) covers every key.

## Turn Flow's lines on or off

```console
$ flow settings ls
setting           state  level
reminder          on     everywhere   a line beside every message, pointing Claude at the reply rules
sessionCheck      on                  what needs attention, when a session opens
setupReminder     off    this folder  suggests flow init where a repository or old memory needs it
skillsAutoUpdate  on                  each skill repository updates itself when a session opens
wrapUp            on                  tells Claude to hand off once the conversation passes wrapUpAt tokens
```

`flow settings off wrapUp --global` turns one off everywhere. Only `setupReminder` can be turned off for one folder, by typing the command there with no flag.

## Switch skills on or off

Flow's workflow skills are always on. These start off:

- **`/flow:review` and `/flow:apply-domain-findings`**, Flow's 2 skills for working on Flow.
- **Skills from a skill repository** you added: [Extend](extend.md).
- **Your private skills**, in `~/.flow/private-skills/`.

`flow skills on react` switches one on for this project. `--global` switches it on everywhere. Prefer the project: a skill on everywhere puts its description into every session, and the command says so:

```console
$ flow skills on vitest --global
on: vitest, everywhere. Every session now loads its description, in projects it has nothing to do with too.
linked: ~/.claude/skills/vitest
```

A project cannot turn off a skill that is on everywhere. Turn it off everywhere, then on for the projects that want it. [Commands](reference/commands.md#skills) covers every `flow skills` command.

## Change a skill for one project

A project never edits a shared skill. It adds an overlay, `.flow/overlays/<skill>.md`, whose text the agent gets right after the skill's own, each time the skill loads there:

```md
Run `pnpm test:unit` as each step's check. The full suite needs the database, so run it only in review.
```

- **Name it for the skill without its prefix**: `/flow:execute` takes `execute.md`.
- **Any skill takes one**: Flow's, one from a skill repository, or a plugin's.
- **An overlay can remove a step too**: "skip the visual check here".

## Change a rule

- **Your rules**: `~/.flow/AGENTS.md`, loaded in every session. The file is yours to edit, and [`flow sync`](sync.md) carries it to your other computers.
- **A project's rules**: `## Rules` in the project's `CLAUDE.md`, for corrections true only there.
- **Rules for one kind of file**: a file in `.claude/rules/` whose `paths:` header names the files it covers, such as `**/*.ts`.

Each rule carries an id, such as `build-what-was-agreed`, so a correction can name the rule it means. Sessions add to all 3 as they learn: [Learning](learning.md).
