# New project

Set a project up with `flow init`, and choose where its tickets are kept.

## Table of contents

- [Set up a project](#set-up-a-project): `flow init`, and what it writes
- [Where the tickets live](#where-the-tickets-live): the project's `flow` branch, or your Flow home
- [A folder that already has files](#a-folder-that-already-has-files): the setup session, which reads them first
- [On your other computer](#on-your-other-computer): picking up a project set up elsewhere

## Set up a project

Type `flow init` in the project's folder. With no git repository, it makes one. It asks for the ticket prefix, offering the folder's name, and Enter keeps it:

```text
Ticket prefix, so its tickets read shop-1, shop-2: shop
```

In an empty folder it then writes the project's files at once:

```console
$ flow init --prefix shop
.flow/: a new flow branch, sharing no history with the code, checked out
.gitignore: .flow/ added
wrote: .claude/settings.json
wrote: .gitignore
wrote: .uncommitted-include
wrote: AGENTS.md
wrote: CLAUDE.md

set up: ~/code/shop is on entry 1. Nothing in the code is committed: AGENTS.md, CLAUDE.md, .gitignore and .claude/ wait for your next commit.
A plugin or skill switched off on this computer is switched on here with: claude plugin enable <id> --scope project, or flow skills on <name>
```

The last line is for a plugin or skill your computer's setup switched off: switch it on here once the project uses it.

`AGENTS.md` holds what every session in this project needs. `/flow:groundwork` fills in its `## Project` section, and sessions add the rest. Commit the files when you choose.

## Where the tickets live

- **The project's `flow` branch**, the default: a branch in the project's own repository, sharing no history with your code, checked out at `.flow/`. A ticket never gets merged into the code, and everyone who can read the repository reads the tickets.
- **Your Flow home**, with `flow init --private`: only you read them, and [`flow sync`](sync.md) carries them to your other computers.

On the branch, every change to a ticket is committed and sent to GitHub by itself. A new ticket gets its number only once GitHub has it, so offline, `flow new` refuses.

A public repository makes `flow init` ask, since the branch would publish the tickets:

```text
This repository is public. Where should its tickets live?
  1. Your Flow home: private, on all your machines
  2. The project's flow branch: PUBLIC, anyone can read them
Type 1 or 2: 1
```

`flow store` says where the tickets are, and `flow store private` or `flow store branch` moves them. A move to your Flow home leaves the branch as it was, and prints how to delete it.

## A folder that already has files

`flow init` opens the setup session, a Claude Code session that reads the project's rule files, docs, code and Claude Code memory before anything changes. Where the folder holds no rules for an agent, it asks first. `-y` answers yes.

The session writes every change into one form, `migration.md`, and stops. Nothing changes before you approve it.

- **Each line says what goes where**: `9 rules → AGENTS.md`.
- **The code wins over the docs.** A doc the code contradicts becomes a ticket.
- **Anything working against Flow** is listed under `🔴 Removed unless you untick it`.
- **A plugin or skill your computer's setup switched off** is switched on where the code uses it: `supabase plugin: this project uses @supabase/supabase-js.`

Start `claude` again once the session ends, so the new rules load. `flow restore project` undoes the whole setup: [Install](install.md#take-flow-off).

## On your other computer

Clone the project, and type `flow init` in it. Flow sees it is already set up, and asks nothing: it checks the `flow` branch out at `.flow/`, or links `.flow/` to the tickets in your Flow home. A teammate's computer does the same.
