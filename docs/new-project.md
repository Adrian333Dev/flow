# New project

Set a project up with `flow init`, and choose where its tickets are kept.

## Table of contents

- [Set up a project](#set-up-a-project): `flow init`, and what it writes
- [Where the tickets live](#where-the-tickets-live): the project's `flow` branch, or your Flow home
- [A folder that already has files](#a-folder-that-already-has-files): the setup session, which reads them first
- [On your other computer](#on-your-other-computer): picking up a project set up elsewhere

## Set up a project

Type `flow init` in the project's folder, once Flow is [installed](install.md). Inside a subfolder, it works at the repository's top folder. With no git repository, it makes one.

It asks for the ticket prefix, the word every ticket id starts with, and offers the folder's name:

```text
Ticket prefix, so its tickets read shop-1, shop-2: shop
```

The offered word shows in dim text. Enter keeps it, and typing replaces it.

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
```

`entry 1` is the version of Flow the project is on. [Update Flow](install.md#update-flow) covers the numbers.

`AGENTS.md` holds what every session in this project needs. It starts with 2 sections, `## Project` for what the project is and `## Rules` for corrections that hold only here. Describe the project with `/flow:groundwork`, which fills in `## Project`. Sessions add the rest as they learn it. [Files](reference/files.md#in-a-project) covers the other files.

Commit the files when you choose. Flow saves the tickets itself, apart from your code.

## Where the tickets live

A project's tickets live in one of 2 places:

- **The project's `flow` branch**, the default: a branch in the project's own repository, sharing no history with your code, checked out at `.flow/`. `.gitignore` hides `.flow/` from your code branches, so a ticket never gets merged into the code. Everyone who can read the repository reads the tickets, so a team shares them.
- **Your Flow home**, with `flow init --private`: `.flow/` is a link to `~/.flow/projects/<project>/`, which git never sees. Only you read them, and [`flow sync`](two-machines.md) carries them to your other computers.

On the branch, every change to a ticket is committed and sent to GitHub by itself. A new ticket gets its number only once GitHub has it, so the number never changes after you see it. Offline, `flow new` refuses.

A public repository makes `flow init` ask, since the branch would publish the tickets:

```text
This repository is public. Where should its tickets live?
  1. Your Flow home: private, on all your machines
  2. The project's flow branch: PUBLIC, anyone can read them
Type 1 or 2: 1
```

Enter picks 1, your Flow home.

A repository that refuses your push stops `flow init` before it makes anything, and offers `--private`.

`flow store` says where the tickets are:

```console
$ flow store
shop's tickets live on the project's flow branch. Everyone who can read the repository reads them.
```

`flow store private` and `flow store branch` move them. A move to your Flow home leaves the branch as it was, so anyone who read the repository may still hold a copy. The command prints how to delete the branch.

## A folder that already has files

`flow init` opens the setup session, a Claude Code session that reads what the folder holds before anything changes:

- **Rules for Claude Code or another agent**, such as `CLAUDE.md`, `.claude/`, `.mcp.json` or `.cursorrules`: it opens without asking.
- **Any other file, or Claude Code's memory for this folder**: `flow init` asks first. `-y` answers yes.

The session loads Flow's rules and nothing of the project's. It reads the project's rule files, docs, code and Claude Code memory, then writes every change into one form, `migration.md`, and stops. Nothing in the project changes before you approve the form.

- **Each line says what goes where**, with a count: `9 rules → AGENTS.md`.
- **What it learned about you**, rather than the project, goes into your own rules.
- **The code wins over the docs.** A doc the code contradicts becomes a ticket.
- **2 tickets are added where they apply**: "Write the product spec", where the project holds plans, and "Find skills, plugins and MCP servers for this stack", where there is code.
- **Anything working against Flow** is listed under `🔴 Removed unless you untick it`.
- **A plugin or a skill your computer's setup switched off** is switched on here where the code uses it, under `Switched on for this project`: `supabase plugin: this project uses @supabase/supabase-js.` A plugin's switch goes into the project's `.claude/settings.json`, which reaches your other computer with the code.

Quit and start `claude` again once the session ends, so the project's new rules load. `flow restore project` undoes the whole setup: [Install](install.md#take-flow-off) covers it.

## On your other computer

A clone brings your code and the files you committed, never `.flow/`. The tickets sit on the `flow` branch, which a clone does not check out, or in your Flow home. Clone the project, and type `flow init` in it. Flow sees the project is already set up, and asks nothing:

- **Tickets on the branch**: it checks the `flow` branch out at `.flow/`. A teammate's computer does the same.
- **Tickets in your Flow home**: it finds their folder by the repository's address, and links `.flow/` to it.

Claude Code may have kept memory for the project on that computer before Flow. A session there then shows `Flow: old Claude Code memory here. Run flow init to fold it in.`, and `flow init` opens a short setup session that sorts the memory into Flow's files.
