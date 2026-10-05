# Extend

Add to what the agent knows: a skill you write, skills from someone else's repository, a plugin, or an MCP server.

## Table of contents

- [Where skills come from](#where-skills-come-from): the 4 sources `flow skills ls` shows
- [Write your own skill](#write-your-own-skill): a private skill, carried to your other computers
- [Add a skill repository](#add-a-skill-repository): `flow skills add`, and how it stays current
- [Read a skill before switching it on](#read-a-skill-before-switching-it-on): use it whole, or take what is useful into your own
- [Plugins and MCP servers](#plugins-and-mcp-servers): on for one project, and a command first where one exists

## Where skills come from

- **`flow`**: Flow's own skills: [Skills](reference/skills.md).
- **A skill repository**: a git repository of skill folders. Flow starts with [`domain-skills`](https://github.com/Adrian333Dev/domain-skills), skills that each know one tool, such as React.
- **`private`**: skills you write, in `~/.flow/private-skills/`.
- **`outside`**: plugins, and skills another tool installed. Claude Code's own menus switch them.

Skills from a repository and private skills start off: [Configure](configure.md#switch-skills-on-or-off).

## Write your own skill

A skill is a folder holding a `SKILL.md`:

```md
---
name: release-notes
description: Writes release notes from the merged pull requests since the last tag, grouped by area.
---

List the merged pull requests with `gh pr list --state merged --search "merged:>=<last tag date>"`.
Group them by the folder they mostly touch. One line each, in the past tense.
```

1. **Create `~/.flow/private-skills/<name>/SKILL.md`.**
2. **Switch it on**: `flow skills on release-notes`, or with `--global` for every project.
3. **Type it** as `/release-notes`, or let the agent load it when your request matches the description.

The agent decides from the description alone when to use the skill, so say what it does and covers, and leave the steps to the body. `flow sync` carries your private skills to your other computers.

## Add a skill repository

```console
$ flow skills add mattpocock/skills
cloned: mattpocock/skills into ~/.flow/repos/sources/mattpocock_skills
added: mattpocock/skills to sources in ~/.flow/settings.json

2 skills, none switched on by this:
  grill-me  Interview the user about a plan until every branch is resolved.
  tdd       Test-driven development, red green refactor.

flow skills on <name> turns one on here, --global everywhere.
```

Your other computers download it too. Each repository updates itself when a session opens, at most every 6 hours, and the update reaches every project at once. An update never runs over changes you made inside the download: the next session names the repository instead.

Where 2 repositories hold a skill of the same name, name the one you mean as `owner/repo:name`. `flow skills drop mattpocock/skills` removes a repository.

## Read a skill before switching it on

Someone else's skill changes how the agent works, so the agent reads it first, and checks whether it brings its own order of work that competes with Flow's phases, what the agent would get wrong without it, and where you would disagree with it. Then it takes one of 2 routes:

- **Use it whole**, updated with each pull. It suits a skill from the tool's own makers. A disagreement true in one project goes in an [overlay](configure.md#change-a-skill-for-one-project).
- **Harvest it**: the agent writes your own skill from it and your own findings, and the original is never switched on. Only when you ask, for now.

## Plugins and MCP servers

- **A plugin** is a bundle from a Claude Code marketplace: skills, often with hooks and an MCP server. Install it with Claude Code's `/plugin install`, and switch it on in the project that needs it, in its `.claude/settings.json`.
- **An MCP server** is a running program that gives the agent extra tools. Add it to the project's `.mcp.json`.

To reach a service such as GitHub or a database, take the first that works:

1. **The service's own command-line tool**, such as `gh`, with a skill teaching the parts the work needs.
2. **A small script over the service's web API**, kept inside that service's skill.
3. **Its MCP server**, for that project alone.

A command costs nothing until the agent runs it. An MCP server costs a little context in every session of the project.
