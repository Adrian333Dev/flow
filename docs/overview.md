# Overview

Flow is a workflow for Claude Code. It turns an idea into a written design, the design into tickets, and each ticket into planned, built and reviewed code.

## Table of contents

- [One piece of work](#one-piece-of-work): from an idea to reviewed code
- [How the agent works with you](#how-the-agent-works-with-you): it proposes, and you say go
- [Between sessions](#between-sessions): how work carries over when a conversation ends
- [What Flow learns](#what-flow-learns): how a lesson changes the next session
- [What Flow adds to Claude Code](#what-flow-adds-to-claude-code): skills, tickets, the `flow` command, hooks and your Flow home
- [Where to start](#where-to-start): the pages to read first

## One piece of work

A new feature, from the first sentence to accepted code:

1. **You describe it.** `/flow:groundwork we need receipt uploads` makes a ticket, a folder holding this piece of work.
2. **`/flow:groundwork` settles every decision with you**, including the ones you never raised, and writes each answer into the ticket.
3. **`/flow:execute /shop-9` plans, then builds.** It writes the steps and waits for your yes. Then it builds and checks each step.
4. **You accept it.** The agent reviews its own work, then hands it to you.

`/flow:groundwork` and `/flow:execute` are 2 of Flow's 4 phases, the skills that work on a ticket. A bug takes `/flow:debug`, and a question only running code can answer takes `/flow:prototype`. [Walkthroughs](walkthroughs.md) walks every kind of work.

`flow next` shows where every ticket stands:

```console
$ flow next
tickets: 6   todo 2   building 1   done 2   dropped 1
```

## How the agent works with you

Every session loads your rules, one file at `~/.flow/AGENTS.md`. The ones you notice first:

- **The agent proposes before it edits.** "Go ahead" gets the build. A question or a "maybe" gets an answer.
- **Silence is a yes.** A proposal you never objected to counts as agreed.
- **A delete always waits** for its own yes.
- **Building waits for your yes on the plan**, and a ticket closes only on your yes.

The file is yours to edit: [Configure](configure.md#change-a-rule).

## Between sessions

Answers get worse long before a conversation fills up, so Flow ends it on purpose:

1. **A warning arrives** past 150,000 tokens.
2. **`/flow:handoff`** writes into the ticket what the next session needs.
3. **`/clear`** empties the conversation.
4. **`/flow:execute /shop-9`** picks the work up, with the right files already open.

Flow refuses `/compact`, Claude Code's own way of shrinking a conversation. Its summary keeps a little of everything, and the handoff keeps what matters. [Sessions](sessions.md) covers it.

## What Flow learns

At each checkpoint, such as a handoff, the agent files what the conversation taught:

- **How you like to work** → your rules.
- **A fact about this project** → the project's `CLAUDE.md`.
- **How an outside tool behaves**, such as a library's quirk → `~/.flow/wiki/<tool>/`, which every project reads.
- **A mistake the agent made** → a study case.

`/flow:file-findings` later turns findings into rules and skills. [Learning](learning.md) covers it.

## What Flow adds to Claude Code

- **Skills**, typed `/flow:<name>`: [Skills](reference/skills.md).
- **Tickets**, one folder per piece of work: [Tickets](tickets.md).
- **The `flow` command**, which makes and moves tickets and sets Flow up: [Commands](reference/commands.md).
- **Hooks**, scripts Claude Code runs at fixed moments. Flow's ask before a dangerous command, record what helper agents change, and warn when a conversation gets long: [Settings](reference/settings.md#hooks).
- **Your Flow home**, `~/.flow/`, where Flow keeps your rules, notes, settings and tickets. A private GitHub repository backs it up: [Sync between computers](sync.md).
- **3 repositories** `flow install` downloads beside Flow, each usable without it:
  - **[util](https://github.com/Adrian333Dev/util)**: one command for your small scripts. Flow uses it to draw a project's files, and to carry uncommitted code to another computer.
  - **[domain-skills](https://github.com/Adrian333Dev/domain-skills)**: skills that each know one tool, such as React. [Extend](extend.md#where-skills-come-from) covers it.
  - **[toolbox](https://github.com/Adrian333Dev/toolbox)**: notes on outside tools, which `/flow:research` searches before the web.

## Where to start

1. [Install](install.md) Flow on your computer.
2. [New project](new-project.md): set up your first project with `flow init`.
3. Read [Tickets](tickets.md) once. Every other page assumes it.
4. Find the work you have in [Walkthroughs](walkthroughs.md).
