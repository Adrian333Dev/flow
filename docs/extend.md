# Extend

Add to what the agent knows: a skill you write, skills from someone else's repository, a plugin, or an MCP server.

## Table of contents

- [Where skills come from](#where-skills-come-from): the 4 sources `flow skills ls` shows
- [Write your own skill](#write-your-own-skill): a private skill, carried to your other computers
- [Add a skill repository](#add-a-skill-repository): `flow skills add`, and how it stays current
- [Read a skill before switching it on](#read-a-skill-before-switching-it-on): use it whole, or take what is useful into your own
- [Plugins and MCP servers](#plugins-and-mcp-servers): on for one project, and a command first where one exists

## Where skills come from

- **`flow`**: Flow's own skills. [Skills](reference/skills.md) lists them.
- **A skill repository**: a git repository of skill folders, downloaded whole. Every `SKILL.md` in it is a skill. Flow starts with one, [`domain-skills`](https://github.com/Adrian333Dev/domain-skills), which holds skills about one tool or field, such as React.
- **`private`**: skills you write yourself, in `~/.flow/private-skills/`.
- **`outside`**: plugins, and skills another tool installed. `flow skills ls` lists them, and Claude Code's own menus switch them.

Skills from a repository and private skills start off. [Configure](configure.md#switch-skills-on-or-off) covers switching one on.

## Write your own skill

A skill is a folder holding a `SKILL.md`, whose top block gives its name and a description:

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

The description is loaded into every session where the skill is on, and the agent decides from it alone when to use the skill. Say what the skill does and what it covers, and leave the steps to the body. [Writing a skill](../skills/tools/file-findings/references/write-skills.md) is the guide Flow's own skills follow.

`flow sync` carries your private skills to your other computers. To share one, copy it into a skill repository of your own.

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

The repository's name goes in [`sources`](reference/settings.md#sources), so your other computers download it too. Nothing is switched on until you say.

**Each repository updates itself** when a session opens, at most every 6 hours. A skill switched on is a link into the download, so the update reaches every project at once. An update never runs over changes you made inside the download, and never merges. The next session names the repository instead.

Where 2 repositories hold a skill of the same name, name the one you mean as `owner/repo:name`. `flow skills drop mattpocock/skills` removes a repository and its download.

## Read a skill before switching it on

A skill written by someone else changes how the agent works, so the agent reads one before switching it on, and checks:

- **Knowledge or process.** A skill with its own order of work, such as "analyze, design, implement, verify", competes with Flow's phases.
- **What the agent would get wrong without it.** Only that part is worth the context. What the agent already knows is not.
- **Where you would disagree with it.**

Then it takes one of 2 routes:

- **Use it whole**: switched on as its author wrote it, and updated with each pull. It suits a skill from the tool's own makers, which changes with each release. A disagreement true in one project goes in an [overlay](configure.md#change-a-skill-for-one-project).
- **Harvest it**: never switched on. The agent reads it alongside your own findings about the tool, and writes your own skill from both. Flow's skill for a harvest is not built yet, so for now a harvest runs only when you ask, and every outside skill is used whole until then.

## Plugins and MCP servers

- **A plugin** is a bundle from a Claude Code marketplace: skills, often with hooks and an MCP server. Install it with Claude Code's `/plugin install`, and switch it on for the one project that needs it, in that project's `.claude/settings.local.json`. Flow never updates or switches a plugin. The setup session removes one that works against Flow's rules, with your yes.
- **An MCP server** is a running program that gives the agent extra tools. Add it to the project's `.mcp.json`, never for every project.

To reach a service such as GitHub or a database, take the first that works:

1. **The service's own command-line tool**, such as `gh`, with a skill teaching the parts the work needs.
2. **A small script over the service's web API**, kept inside that service's skill.
3. **Its MCP server**, for that project alone.

A command costs nothing until the agent runs it. An MCP server's tool descriptions load into every session of the project.
