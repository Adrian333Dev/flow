# Sync between computers

How your rules, notes, tickets and uncommitted code reach your other computers.

## Table of contents

- [Your Flow home](#your-flow-home): one folder, backed up to one private repository
- [Add a computer](#add-a-computer): `flow install` joins the Flow home you have
- [`flow sync`](#flow-sync): what it does, and when it runs by itself
- [What stays on one computer](#what-stays-on-one-computer): the few things that never travel
- [Uncommitted code](#uncommitted-code): edits you never committed, carried to the next computer
- [When 2 computers clash](#when-2-computers-clash): the same lines changed twice, a ticket number taken twice
- [A computer on an older Flow](#a-computer-on-an-older-flow): why it stops syncing

## Your Flow home

`~/.flow/` holds your rules, notes, settings and tickets. It is a git repository, backed up to a private GitHub repository named `flow-home`, which your first `flow install` creates. Never rename it, edit it on GitHub, or make it public: Flow finds it by name.

A project's tickets travel with your Flow home when kept privately, or with the project's own repository on its `flow` branch: [New project](new-project.md#where-the-tickets-live).

## Add a computer

Install Flow the same way as on the first: [Install](install.md). The install finds `flow-home` and downloads your Flow home before the setup starts:

```console
$ flow install
Flow is installed: 10 skills, each typed under the plugin name, as /flow:groundwork.
wrote: ~/.flow/originals/machine, this machine as it was before Flow
named: this machine is macbook-pro
joined: 11 files from pc-wsl, your Flow home as your other machine last sent it
Every line of the install is in ~/.flow/logs/install.log.
```

Your rules and the skills you switched on everywhere arrive with it. For each project, clone it and type `flow init` inside: [New project](new-project.md#on-your-other-computer).

## `flow sync`

`flow sync` saves this computer's work as one commit, brings the other computers' work down and merges it, then sends the result up:

```console
$ flow sync
came down: 1 file
went up: pc-wsl: 1 file
```

Inside a project with tickets on its `flow` branch, it syncs those too.

You rarely type it. Flow syncs after a reply once 30 minutes have passed, and again when a session ends. Offline, a sync fails quietly, and the next one tries again.

## What stays on one computer

Everything in `~/.flow/` travels, apart from:

- **`settings.local.json`**: settings that name a folder on this computer.
- **Logs and records** of what happened on this computer.
- **Downloads**: skill repositories and each tool's docs. Each computer downloads its own, from the same list.

[Files](reference/files.md#what-stays-on-one-computer) lists every path.

## Uncommitted code

Edits you never committed travel with `util`, a second command Flow installs:

```sh
util git uncommitted send   # on the computer you leave
util git uncommitted get    # on the computer you arrive at
```

They come back unstaged, as you left them. Ignored files stay behind unless listed in `.uncommitted-include`. A file listed there is pushed to the project's remote, so on a public repository it becomes public.

## When 2 computers clash

**The same lines of one file changed on both computers stop the sync.** Nothing comes down and nothing goes up, and your work stays committed. Merge the file by hand, then sync again.

**2 computers can give a private ticket the same number** between syncs. The one that reached GitHub first keeps it, and the other takes the next free number:

```text
  home-4 is now home-5: another machine took home-4 first.
```

The old id still finds it. A ticket on a project's `flow` branch never clashes, since it gets its number from GitHub.

## A computer on an older Flow

A computer on an older Flow syncs nothing, since a newer Flow may have changed the files it would download. A session there opens with:

```text
Flow: pc-wsl is on changelog entry 12, and this machine is on 11. Run flow update in a terminal.
```

`flow update` brings it up, and the next `flow sync` merges both.
