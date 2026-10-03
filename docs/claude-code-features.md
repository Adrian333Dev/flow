# Claude Code features

What Claude Code already does, and where it surprises people, for anyone changing their rules or writing a skill. Each fact was read in Anthropic's documentation or seen in a test.

## Table of contents

- [Rules load once](#rules-load-once): an edit mid-session waits for `/clear`
- [Where skills are found](#where-skills-are-found): 2 folders, one level deep
- [What a skill costs](#what-a-skill-costs): its description always, its body once per run
- [Switching a skill off](#switching-a-skill-off): `skillOverrides`, and why it never reaches Flow's skills
- [Plugins](#plugins): a bundle, with hooks that run every turn
- [Sessions on disk](#sessions-on-disk): where a session ends, and how long its record stays
- [Reading many files](#reading-many-files): why the agent reads files together, never through one command

## Rules load once

`~/.claude/CLAUDE.md`, a project's `CLAUDE.md`, and every file they pull in load when a session starts. **An edit made during a session does nothing until `/clear` or a restart**, so the agent keeps breaking a rule you just wrote. Start a new session after changing your rules.

2 kinds of file load later, and so pick up an edit made before they load:

- **A rule file with a `paths:` header**, such as `.claude/rules/testing.md` covering `**/*.test.ts`, loads the first time the agent reads a matching file. Creating a new file is not a read, so the rule is missing then. [Rule checks](rule-checks.md) cover that gap.
- **A `CLAUDE.md` in a subfolder** loads the first time the agent reads a file in that folder.

Claude Code reads a project's `AGENTS.md` by itself only where no `CLAUDE.md` exists. Flow keeps a one-line `CLAUDE.md` pulling it in, so the rules always load the same way.

## Where skills are found

- **Only 2 folders**: `<project>/.claude/skills/<name>/SKILL.md` and `~/.claude/skills/<name>/SKILL.md`. No setting adds a third.
- **One level deep.** A skill inside a grouping folder, such as `~/.claude/skills/tools/visualize/`, never loads.
- **A skill in `~/.claude/skills/` beats a project skill of the same name**, with no warning.
- **A folder holding `.claude-plugin/plugin.json` is a plugin**, and its skills load from inside it. That is how Flow's skills load, typed `/flow:<name>`.

## What a skill costs

- **Every skill's description is in every session**, from the start. Only the body waits until the skill runs. A description is a cost paid in every session, and a body only when used.
- **A skill only you can start costs nothing**: Claude Code leaves its description out, since the agent can never choose it.
- **Every time you type a skill**, its whole text is added to the conversation again.
- **The agent loading a skill again** with the same words gets a one-line note that it is already loaded. With different words, it gets the whole skill again.
- **A shell line in a skill runs as the skill loads**, and its output becomes part of the text. `/flow:start` prints the board this way.

## Switching a skill off

`skillOverrides` in `settings.json` sets how much of one skill the agent sees:

- **`off`**: the agent never sees it, and cannot load it.
- **`name-only`**: the agent sees the name without the description.
- **`user-invocable-only`**: only you can start it.

It never reaches a plugin's skills, Flow's included. `flow skills` switches Flow's 2 optional skills, and `claude plugin disable flow@skills-dir` switches all of Flow's skills off at once.

## Plugins

A plugin is a bundle installed from a marketplace: skills, often with helper agents, commands and hooks. One surveyed plugin shipped 1 skill, 4 agents, 23 commands and 2 hooks.

- **Switching a plugin off** in `enabledPlugins` stops all of it. Hiding its skill stops only the skill.
- **Its hooks run for as long as it is on**, some of them after every reply. Hooks from several plugins add up, and nothing reports the total.
- **A change takes effect in the next session.**

## Sessions on disk

- **`/clear` ends a session** and starts a new one, with a new id. `/resume` still reaches the old one.
- **Compacting never ends a session.** The conversation carries on under the same id.
- **Each session's record** is written to `~/.claude/projects/<project>/<session>.jsonl`, with one more per subagent.
- **Claude Code deletes a record after 30 days** by default. Flow sets [`cleanupPeriodDays`](reference/settings.md#cleanupperioddays) to a year, so [`flow audit`](learning.md#reading-past-sessions) can still read it.
- **`/cd` moves a session's record** to the new folder's project, so one session can sit under 2 projects.

## Reading many files

Flow's rules have the agent open files with Read, Claude Code's own tool, and ask for every file a step needs at once.

A shell command's output reaches the agent up to about 30,000 characters in all. Past that, the agent sees a 2,000-character preview and the path of a file holding the rest. Each Read gets its own page of about 100,000 characters, and Reads sent together each get a full page. So 10 files read together arrive whole, and the same 10 printed by one command, such as `util fs merge`, arrive as a preview.

Keep `util fs merge` out of your preferences for the agent. It stays useful to you, for pasting a set of files into a chat.
