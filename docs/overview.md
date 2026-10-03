# Overview

How Flow works, start to finish: the parts it adds to Claude Code, and the path one piece of work takes through them. Each part links to the page that covers it.

## Table of contents

- [The parts](#the-parts): what Flow adds to Claude Code
- [One piece of work](#one-piece-of-work): from an idea to reviewed code
- [Between sessions](#between-sessions): how work carries over when a conversation ends
- [What Flow learns](#what-flow-learns): how a lesson changes the next session
- [Where to start](#where-to-start): the pages to read first

## The parts

- **Rules**: one file of instructions every session loads, `~/.agents/AGENTS.md`. It says how the agent works with you: it proposes, you say yes, then it builds. [Approval](approval.md) covers it.
- **Skills**: files of instructions the agent loads for one kind of work, typed `/flow:<name>`. 4 of them are phases, one per kind of work. [Skills](reference/skills.md) lists them all.
- **Tickets**: one folder per piece of work, kept beside your code. Every phase works on one. [Tickets](tickets.md) covers them.
- **The `flow` command**: makes, moves and lists tickets, and sets Flow up. [Commands](reference/commands.md) lists every command.
- **Hooks**: scripts Claude Code runs at fixed moments. Flow's ask before a dangerous command, record what helper agents change, and warn when a conversation gets long. [Settings](reference/settings.md#hooks) lists them.
- **Your Flow home**: `~/.flow/`, the folder where Flow keeps your rules, notes, settings and tickets. A private GitHub repository backs it up and shares it between your computers. [Two machines](two-machines.md) covers it.

## One piece of work

A new feature, from the first sentence to accepted code:

1. **You describe it.** `/flow:groundwork we need receipt uploads` makes a ticket for the idea and starts designing.
2. **Groundwork finds every decision.** It lists what the feature needs decided, including what you never raised: where files are stored, the size limit, what happens offline. It researches the open ones, settles each with you, and tests the design against real cases. Everything lands in the ticket's `groundwork/map.md`.
3. **The design becomes tickets.** One piece of work stays one ticket. A bigger one gets a ticket per part, each under the first.
4. **Execute plans, then builds.** `/flow:execute /shop-9` writes `plan.md`, numbered steps each ending on a check, and waits for your yes. Then it builds the steps in order and checks each one.
5. **It reviews its own work**, then hands it to you at `review`. You read it and say done.

A bug takes `/flow:debug` instead, and a question only running code can answer takes `/flow:prototype`. [Phases](phases.md) says when to pick each.

Along the way the ticket's status moves, `todo → groundwork → planning → building → review → done`, and `flow next` shows where every ticket stands:

```console
$ flow next
tickets: 6   todo 2   building 1   done 2   dropped 1
```

## Between sessions

A conversation can only grow so long before the agent's answers get worse. Flow ends it before then, on purpose:

1. **A warning arrives** once the conversation passes 150,000 tokens.
2. **`/flow:handoff`** writes into the ticket what the next session needs: where the work stands, what was learned, and which files to open.
3. **`/clear`** empties the conversation.
4. **`/flow:execute /shop-9`** starts the next session from the ticket, with those files already open.

Flow refuses `/compact`, Claude Code's own way of shrinking a conversation, since its summary keeps a little of everything and the handoff keeps what matters. [Sessions](sessions.md) covers all of it.

## What Flow learns

At each checkpoint, such as a handoff or finished work, the agent looks back over the conversation and files what it found:

- **How you like to work** → your rules, so every session after follows it.
- **A fact about this project** → the project's `AGENTS.md`.
- **How an outside tool behaves**, such as a library's quirk → `~/.flow/wiki/<tool>/`, which every project reads.
- **A mistake the agent made** → a study case, grouped with the same mistake made before.

`/flow:file-findings` later turns findings into skills and rules. Each project starts with what the last one taught. [Learning](learning.md) covers each step.

## Where to start

1. [Install](install.md) Flow on your computer.
2. [New project](new-project.md): set up your first project with `flow init`.
3. Read [Tickets](tickets.md) once. Every other page assumes it.
