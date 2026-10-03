# Two machines

How your rules, notes, tickets and unfinished code reach your other computers: your Flow home, its private GitHub repository, `flow sync`, and `util git uncommitted`.

## Table of contents

- [Your Flow home](#your-flow-home): one folder, backed up to one private repository
- [Add a computer](#add-a-computer): `flow install` joins the Flow home you have
- [`flow sync`](#flow-sync): what it does, and when it runs by itself
- [What travels](#what-travels): what reaches your other computers, and what stays
- [Uncommitted code](#uncommitted-code): edits you never committed, carried to the next computer
- [When 2 computers clash](#when-2-computers-clash): the same lines changed twice, a ticket number taken twice
- [Both computers on the same Flow](#both-computers-on-the-same-flow): why a computer behind stops syncing

## Your Flow home

Your Flow home is `~/.flow/`, the folder where Flow keeps your rules, notes, settings and tickets. It is a git repository, backed up to a private GitHub repository on your account named `flow-home`. Your first `flow install` creates it. Any number of computers can share it.

Never rename `flow-home`, edit it on GitHub, or make it public. Flow finds it by name, and it holds what sessions learned about your work.

A project's tickets travel by one of 2 routes. Tickets on the project's `flow` branch travel with the project's own repository. Tickets kept privately live inside your Flow home, and travel with it. [New project](new-project.md#where-the-tickets-live) covers both.

## Add a computer

Install Flow on the new computer the same way as the first. [Install](install.md) covers it. The install finds `flow-home`, downloads your Flow home before the setup starts, and names the computer:

```console
$ flow install
Flow is installed: 10 skills, each typed under the plugin name, as /flow:groundwork.
wrote: ~/.flow/originals/machine, this machine as it was before Flow
named: this machine is laptop-mac
joined: 11 files from desktop-wsl, your Flow home as your other machine last sent it
Every line of the install is in ~/.flow/logs/install.log.
```

The setup session there keeps your rules as they arrived, and adds what that computer's old rule files say about you. Skills you switched on everywhere are switched on there too.

For each project, clone it and type `flow init` inside. [New project](new-project.md#on-your-other-computer) covers what it finds.

## `flow sync`

`flow sync` does 3 things, in order:

1. **It saves this computer's work** as one commit, named for the computer.
2. **It brings the other computers' work down**, and merges it.
3. **It sends the result up.**

```console
$ flow sync
came down: 1 file
went up: desktop-wsl: 1 file
```

Inside a project with tickets on its `flow` branch, it syncs those tickets too.

You rarely need to type it. Flow sends both after a reply, once 30 minutes have passed and something changed, and again when a session ends. A session opening in a project brings its tickets down. Offline, a send fails quietly, and the next one tries again.

## What travels

Everything in `~/.flow/` travels, except what describes one computer:

- **`settings.local.json`**: settings that name a folder on this computer.
- **`version`**: the newest Flow change this computer has applied.
- **`logs/`, `audit/`, `changes/` and `originals/`**: records of what happened on this computer.
- **`repos/`**: the repositories Flow downloads. Each computer downloads its own, from the same list.
- **Each tool's `wiki/<tool>/downloads/`**: a tool's docs and source code, often megabytes.

[Files](reference/files.md#what-stays-on-one-computer) lists every path that stays.

Each computer has a record in the repository, `machines/<name>.json`, saying which version of Flow it is on:

```json
{
  "name": "laptop-mac",
  "joined": "2026-10-03",
  "flowVersion": 1
}
```

## Uncommitted code

A project's code travels through the project's own repository, so only the edits you never committed stay behind. `util`, a second command-line tool that `flow install` adds, carries them across:

```sh
util git uncommitted send   # on the computer you are leaving
util git uncommitted get    # on the computer you are arriving at
```

- **`send`** stores every file you changed and pushes it to the project's remote. Your branch, your files and what you staged stay exactly as they were.
- **`get`** puts those edits back into the project, unstaged, the way you left them. A line changed on both computers comes back with git's usual conflict markers.

Files git ignores stay behind. To carry one, such as `.env.local`, name it in the project's `.uncommitted-include`, one path per line. A file named there is pushed to the project's remote, so on a public repository it becomes public.

## When 2 computers clash

**The same lines of one file changed on both computers stop the sync.** The merge is undone, so nothing comes down and nothing goes up. Your work stays committed in `~/.flow/`. Merge the file by hand, then sync again. Changes to different lines of the same file merge by themselves.

**2 computers can give a new ticket the same number** between syncs, for a ticket kept in your Flow home. The one that reached GitHub first keeps the number. The other takes the next free one, and keeps its old id as `was:`, so the old id still finds it:

```text
  home-4 is now home-5: another machine took home-4 first.
```

A ticket on a project's `flow` branch never clashes: it gets its number only once GitHub has it.

## Both computers on the same Flow

Each change to how Flow behaves gets a number. A computer still on an older number syncs nothing, since a newer Flow may have changed the shape of the files it would download:

```text
your Flow home is on changelog entry 12, since desktop-wsl moved to it, and this machine is on 11. Nothing was synced. Run flow update first.
```

The computer behind learns it before you type anything. A session there opens with:

```text
Flow: desktop-wsl is on changelog entry 12, and this machine is on 11. Run flow update in a terminal.
```

`flow update` brings that computer's Flow home up to the new shape, with everything written there in the meantime. The next `flow sync` merges both.
