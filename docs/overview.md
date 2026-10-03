# Overview

Flow is a workflow for Claude Code. It turns an idea into a written design, the design into tickets, and each ticket into planned, built and reviewed code. This page follows one piece of work through Flow, then covers how work carries over between sessions and what Flow learns along the way. Each section links to the page that covers it.

## Table of contents

- [One piece of work](#one-piece-of-work): from an idea to reviewed code
- [How the agent works with you](#how-the-agent-works-with-you): it proposes, and you say go
- [Between sessions](#between-sessions): how work carries over when a conversation ends
- [What Flow learns](#what-flow-learns): how a lesson changes the next session
- [What Flow adds to Claude Code](#what-flow-adds-to-claude-code): skills, tickets, the `flow` command, hooks, your rules, your Flow home and 3 more repositories
- [Where to start](#where-to-start): the pages to read first

## One piece of work

A new feature, from the first sentence to accepted code:

1. **You describe it.** `/flow:groundwork we need receipt uploads` makes a ticket, a folder holding this piece of work.
2. **`/flow:groundwork` settles every decision with you**, including the ones you never raised, and writes each answer into the ticket.
3. **`/flow:execute /shop-9` plans, then builds.** It writes the steps and waits for your yes. Then it builds and checks each step.
4. **You accept it.** The agent reviews its own work, then hands it to you. You read it and say done.

`/flow:groundwork` and `/flow:execute` are 2 of Flow's 4 phases, the skills that do the work on a ticket. A bug takes `/flow:debug` instead, and a question only running code can answer takes `/flow:prototype`. [Walkthroughs](walkthroughs.md) walks every kind of work, from a whole new project to a dependency bump.

Along the way the ticket's status moves, `todo → groundwork → planning → building → review → done`, and `flow next` shows where every ticket stands:

```console
$ flow next
tickets: 6   todo 2   building 1   done 2   dropped 1
```

## How the agent works with you

Every session loads your rules, one file of instructions at `~/.flow/AGENTS.md`. The ones you notice first:

- **The agent proposes before it edits.** A question or a "maybe" gets an answer. "Go ahead" gets the build.
- **Silence is a yes.** A proposal you never objected to counts as agreed.
- **A delete always waits** for its own yes.
- **Building waits for your yes on the plan.** A ticket closes only on your yes too.

The file is yours to edit. [Configure](configure.md#change-a-rule) covers how.

## Between sessions

A conversation can only grow so long before the agent's answers get worse. Flow ends it before then, on purpose:

1. **A warning arrives** once the conversation passes 150,000 tokens.
2. **`/flow:handoff`** writes into the ticket what the next session needs: where the work stands, what was learned, and which files to open.
3. **`/clear`** empties the conversation.
4. **`/flow:execute /shop-9`** starts the next session from the ticket, with those files already open.

Flow refuses `/compact`, Claude Code's own way of shrinking a conversation. Its summary keeps a little of everything, and the handoff keeps what matters. [Sessions](sessions.md) covers all of it.

## What Flow learns

At each checkpoint, such as a handoff or finished work, the agent looks back over the conversation and files what it found:

- **How you like to work** → your rules, so every session after follows it.
- **A fact about this project** → the project's `AGENTS.md`.
- **How an outside tool behaves**, such as a library's quirk → `~/.flow/wiki/<tool>/`, which every project reads.
- **A mistake the agent made** → a study case, grouped with the same mistake made before.

`/flow:file-findings` later turns findings into skills and rules. Each project starts with what the last one taught. [Learning](learning.md) covers each step.

## What Flow adds to Claude Code

- **Skills**: Flow's skills, typed `/flow:<name>`. [Skills](reference/skills.md) lists them all.
- **Tickets**: one folder per piece of work, kept beside your code. [Tickets](tickets.md) covers them.
- **The `flow` command**: makes, moves and lists tickets, and sets Flow up. [Commands](reference/commands.md) lists every command.
- **Hooks**: scripts Claude Code runs at fixed moments. Flow's ask before a dangerous command, record what helper agents change, and warn when a conversation gets long. [Settings](reference/settings.md#hooks) lists them.
- **Your rules**: `~/.flow/AGENTS.md`, the instructions every session loads. [How the agent works with you](#how-the-agent-works-with-you) covers them.
- **Your Flow home**: `~/.flow/`, the folder where Flow keeps your rules, notes, settings and tickets. A private GitHub repository backs it up and shares it between your computers. [Two machines](two-machines.md) covers it.
- **3 more repositories**, which `flow install` downloads beside Flow. Each one works without Flow too:
  - **[util](https://github.com/Adrian333Dev/util)**: one command for all your small scripts. Flow uses it to draw a project's files for the agent, and to carry code you never committed to your other computer.
  - **[domain-skills](https://github.com/Adrian333Dev/domain-skills)**: skills that each know one tool or field, such as React. It is the skill repository Flow starts with: [Extend](extend.md#where-skills-come-from) covers skill repositories.
  - **[toolbox](https://github.com/Adrian333Dev/toolbox)**: notes on outside tools worth using, which `/flow:research` searches before the web. It is temporary: a searchable tool library will replace it.

## Where to start

1. [Install](install.md) Flow on your computer.
2. [New project](new-project.md): set up your first project with `flow init`.
3. Read [Tickets](tickets.md) once. Every other page assumes it.
4. Find the work you have in [Walkthroughs](walkthroughs.md).
