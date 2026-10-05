# Claude Code features

What Claude Code already does, and where it surprises people, for anyone changing their rules or writing a skill.

## Table of contents

- [Rules load once](#rules-load-once): an edit mid-session waits for `/clear`
- [Where skills are found](#where-skills-are-found): 2 folders, one level deep
- [What a skill costs](#what-a-skill-costs): its description always, its body once per run
- [Switching a skill off](#switching-a-skill-off): `skillOverrides`, and why it never reaches Flow's skills
- [Plugins](#plugins): a bundle, with hooks that run every turn
- [Sessions on disk](#sessions-on-disk): where a session ends, and how long its record stays
- [Reading many files](#reading-many-files): why the agent reads files together, never through one command

## Rules load once

Your rule files load when a session starts. **An edit made during a session does nothing until `/clear` or a restart.**

2 kinds of file load later, and pick up an edit made before then:

- **A rule file with a `paths:` header**, such as `**/*.test.ts`, loads the first time the agent reads a matching file. Creating a file is not a read: [Rule checks](rule-checks.md) cover that gap.
- **A `CLAUDE.md` in a subfolder** loads the first time the agent reads a file there.

## Where skills are found

- **Only 2 folders**: `<project>/.claude/skills/<name>/` and `~/.claude/skills/<name>/`.
- **One level deep.** A skill inside a grouping folder, such as `~/.claude/skills/tools/visualize/`, never loads.
- **A skill in `~/.claude/skills/` beats a project skill of the same name**, with no warning.

## What a skill costs

- **Every skill's description is in every session.** The body loads only when the skill runs.
- **A skill only you can start costs nothing**, since the agent never sees its description.
- **Every time you type a skill**, its whole text is added to the conversation again.

## Switching a skill off

`skillOverrides` in `settings.json` sets how much of one skill the agent sees: `off`, `name-only`, or `user-invocable-only`, where only you can start it. It never reaches a plugin's skills, Flow's included. `flow skills` switches Flow's 2 optional skills.

## Plugins

A plugin is a bundle from a marketplace: skills, often with helper agents, commands and hooks.

- **Switching a plugin off** in `enabledPlugins` stops all of it. Hiding its skill stops only the skill.
- **Its hooks run for as long as it is on**, some after every reply. Nothing reports what they add up to.
- **A change takes effect in the next session.**

## Sessions on disk

- **`/clear` ends a session** and starts a new one. `/resume` still reaches the old one.
- **Compacting never ends a session.**
- **Each session's record** is in `~/.claude/projects/<project>/<session>.jsonl`.
- **Claude Code deletes a record after 30 days.** Flow sets [`cleanupPeriodDays`](reference/settings.md#cleanupperioddays) to a year, so [`flow audit`](learning.md#reading-past-sessions) can still read it.

## Reading many files

A shell command's output reaches the agent up to about 30,000 characters. Past that, it sees a short preview. Each file opened with Claude Code's Read tool gets about 100,000 characters, and files read together each get that much. So 10 files read together arrive whole, and the same 10 printed by one command, such as `util fs merge`, arrive as a preview. Keep `util fs merge` out of your preferences for the agent.
