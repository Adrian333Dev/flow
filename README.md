# Flow

**Flow is a complete development workflow for Claude Code.** It takes a raw idea and finds every decision the project needs, including the ones you never raised. It researches the open ones, settles each one with you, and tests the design against real cases before any code exists. It cuts the design into tickets, then plans, builds and reviews each one. It carries the work from one session to the next. Everything it learns about your preferences, your tools and its own mistakes goes back into its skills, its rules and a wiki that every project shares. Each project starts with what the last one taught it.

```text
Design    idea → every decision mapped → researched → settled with you → tested on real cases → design written down
Build     tickets → plan → build → two-pass review → handoff to the next session
Improve   preferences, tool knowledge, mistakes → filed into skills, rules and the wiki ↺ the next project
```

## Table of contents

- [What makes it different](#what-makes-it-different): the parts a skill set does not have
- [How it compares](#how-it-compares): Flow beside 3 popular skill sets
- [Install](#install): the line to paste, and what it needs
- [Status](#status): who Flow serves today, where it runs, and what comes next
- [Documentation](#documentation): where to read on

## What makes it different

- **The design comes before the code.** `/flow:groundwork` maps every decision the work needs, researches the open ones, settles each with you, and runs the result through real cases. [Phases](docs/phases.md)
- **Work survives the end of a session.** Tickets sit on a board, a handoff writes down what the next session would get wrong, and opening a ticket loads the files it names. [Sessions](docs/sessions.md)
- **Memory tools remember what went wrong. Flow changes what the agent does next time.** A lesson lands in the skill, the rule or the wiki page it belongs to, and every project reads it. [Learning](docs/learning.md)
- **Risky shell commands stop for a yes.** A guard reads every command before it runs, and asks before deleting work, sending data off the computer, or changing the computer. [Safety](docs/safety.md)
- **A subagent's work is checked against what it changed.** Hooks record each subagent's edits, and the main agent reads that diff, never the subagent's own summary. [Subagents](docs/subagents.md)

## How it compares

The alternatives are skill sets: skills you add to an agent and call one at a time. Flow is a workflow: the skills, plus the board, the hooks and the records that carry work between them.

|  | Flow | [Superpowers](https://github.com/obra/superpowers) | [Agent Skills](https://github.com/addyosmani/agent-skills) | [mattpocock/skills](https://github.com/mattpocock/skills) |
|---|---|---|---|---|
| Idea to reviewed code | One pipeline: design, tickets, plan, build, review | Brainstorming through finishing a branch, each skill on its own | `/spec` through `/ship`, a checklist per step | Small skills you chain yourself |
| Work across sessions | A ticket board, handoffs, and a ticket's files loaded on open | Nothing built in | Nothing built in | A handoff skill, and tickets in your issue tracker |
| Learns from use | Lessons filed into its skills, rules and wiki | No | No | No |
| Hooks | A guard on every shell command, rule checks on every edit | Loads its introduction at session start | Runs a script at session start | An optional hook blocking risky git commands |
| Subagent work | Checked against a diff the hooks recorded | Reviewed from the subagent's report | Reviewed from the subagent's report | Reviewed from the subagent's report |
| Past sessions | Searchable through `flow audit` | No | No | No |
| Agents | Claude Code | Claude Code, Codex, Cursor, Gemini CLI and others | 70+ agents through skills.sh | Claude Code, and others through skills.sh |

Flow works beside a skill set. The guard and the rules apply whichever skill is running.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/main/install.sh | bash
```

You need `git`, `node`, `claude`, `gh` and a GitHub account. [Install](docs/install.md) walks through what the line asks, and how to take Flow off again.

## Status

Flow is not released yet. The next step is a beta: Flow on the author's computer, used for real work for 2 to 3 weeks.

- **Who it serves**: one developer. Two people can share a project's tickets, and nothing more: no assignees, no roles, no shared board, no link to a team's issue tracker.
- **Where it runs**: Claude Code, on Linux, macOS and Windows through WSL. Native Windows is not supported, since every hook is a shell command. Built and tested on Claude's 5.5 models.
- **After the first release**: teams come first. Codex and open-source agents are planned, with no date.

## Documentation

- **[Overview](docs/overview.md)**: how Flow works, start to finish. Start here.
- **[Flow's documentation](docs/README.md)**: every page, grouped by what you came to do.
- **[Changing Flow](docs/dev/README.md)**: the repository, the tests, and adding a skill or a command.
- **[Backlog](lab/backlog/)**: every open item, one file per phase.
