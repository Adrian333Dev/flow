# Configure

Change how Flow behaves: its settings and which file wins, the skills that are on, a skill's steps for one project, and the rules.

## Table of contents

- [Where settings live](#where-settings-live): 4 files, and which one wins
- [Turn Flow's lines on or off](#turn-flows-lines-on-or-off): `flow settings`
- [Switch skills on or off](#switch-skills-on-or-off): this project or everywhere, and what each costs
- [Change a skill for one project](#change-a-skill-for-one-project): overlays
- [Change a rule](#change-a-rule): your rules, a project's, and rules for one kind of file

## Where settings live

- **`~/.flow/settings.json`**: Flow's settings for all your computers. `flow sync` carries it.
- **`~/.flow/settings.local.json`**: Flow's settings for this computer alone.
- **`<project>/.flow/settings.json`**: one project's settings, saved with its tickets, so a fresh clone gets them back.
- **`~/.claude/settings.json`**: Claude Code's own file, with Flow's keys added.

One question decides between the 2 computer-wide files: would the value still be true on your other computers? A folder path, such as a folder to skip, goes in the local file. Everything else goes in `settings.json`.

Where 2 files hold the same thing, the nearer one wins:

- **A skill**: the project's line over the computer-wide one.
- **A key in both computer-wide files**: the local file.
- **`setupReminder`**: a folder's switch over the computer-wide one.

A change to Flow's files counts from the next command. A change to `~/.claude/settings.json` counts once Claude Code restarts. [Settings](reference/settings.md) covers every key.

## Turn Flow's lines on or off

Flow prints a few lines by itself, such as the reminder beside each message. `flow settings` switches each one, without opening a file:

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

Flow's workflow skills are always on. 3 kinds start off, for you to switch:

- **Flow's 2 skills for working on Flow**: `/flow:review` and `/flow:apply-domain-findings`.
- **Skills from a skill repository** you added. [Extend](extend.md) covers adding one.
- **Your private skills**, in `~/.flow/private-skills/`.

A switch works at one of 2 levels:

- **This project**, with no flag: `flow skills on react`.
- **Everywhere**, with `--global`: `flow skills on vitest --global`. [`flow sync`](two-machines.md) carries the switch, and the next session on each computer makes the link.

Prefer the project level for a skill about one tool. A skill on everywhere puts its description into every session, in projects it has nothing to do with too, and the command says so:

```console
$ flow skills on vitest --global
on: vitest, everywhere. Every session now loads its description, in projects it has nothing to do with too.
linked: ~/.claude/skills/vitest
```

A skill is on where its link exists. A skill on for a project is linked in the project's `.claude/skills/`, and one on everywhere in `~/.claude/skills/`. A project cannot turn off a skill that is on everywhere, since the link outside the project loads in every session. Turn it off everywhere instead, and on again for the projects that want it.

[Commands](reference/commands.md#skills) covers every `flow skills` command.

## Change a skill for one project

Every project shares one copy of each skill, so a project never edits a skill. It adds an overlay instead: `.flow/overlays/<skill>.md`, a file whose text the agent gets right after the skill's own, each time the skill loads in that project.

```md
Run `pnpm test:unit` as each step's check. The full suite needs the database, so run it only in review.
```

- **The file is named for the skill without its prefix**: `/flow:execute` takes `.flow/overlays/execute.md`.
- **Any skill takes one**: Flow's, one from a skill repository, or one from a plugin.
- **An overlay can remove a step too**, by saying so: "skip the visual check here". It arrives after the step it changes.
- **It arrives however the skill loads**: typed by you, or loaded by the agent or a subagent. The one miss is a subagent whose definition loads the skill up front, through a `skills:` line.

## Change a rule

- **Your rules**: `~/.flow/AGENTS.md`, loaded in every session. The setup session wrote it from Flow's template and your old rule files. After that the file is yours: edit any rule, and [`flow sync`](two-machines.md) carries it to your other computers.
- **A project's rules**: `## Rules` in the project's `AGENTS.md`, for corrections true only there.
- **Rules for one kind of file**: a file in `.claude/rules/` whose `paths:` header names the files it covers, such as `**/*.ts`. Claude Code loads it once the agent reads a matching file.

Each rule in your rules file carries an id, such as `build-what-was-agreed`, so a correction can name the rule it means. 2 sections of the file start empty and fill as sessions learn about you:

- **`## The user`**: facts about you, such as the languages you work in.
- **`## Preferences`**: how you like to work, taken from your corrections.

Sessions add to all 3 kinds of rules as they learn: [Learning](learning.md) covers how. A rule a script can test can also get a [rule check](rule-checks.md).
