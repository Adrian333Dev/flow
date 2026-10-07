# Designing a flow command

`flow` is the one command Flow puts on the `PATH`. It runs the ticket board, sets up a machine and its projects, and switches skills and settings. This page holds the rules every `flow` command follows. Read it before adding a command or changing one. `scripts/flow.js` names the commands, and `scripts/lib/cli.js` turns what each one declares into parsing and help.

## Table of contents

- [The shape](#the-shape): where the command, the ids and the flags go
- [One default noun](#one-default-noun): why tickets have no group name
- [The kinds of command](#the-kinds-of-command): board, one ticket, groups, setup, rule checks
- [Hidden from help](#hidden-from-help): the command and flags only the agent and the tests use
- [The actions](#the-actions): `new`, `ls`, `get`, `edit`, `drop`, switches and defaults
- [Status verbs](#status-verbs): one command per status
- [Print the command, never perform it](#print-the-command-never-perform-it): why no command moves a ticket on its own
- [Flags](#flags): dashes, single letters, whole names
- [Every command declares what it accepts](#every-command-declares-what-it-accepts): one list for parsing, checking and help
- [The status table](#the-status-table): the columns each status carries
- [Ticket ids](#ticket-ids): prefix, number and label

## The shape

```text
flow <command> [id]... [--flags]
```

- **The command always sits at position 1**, in every command, without exception.
- **A word naming no command is a ticket id.** `flow exp-47` shows one; `flow get exp-47` is the same thing spelled out. Help prints both as one row, `flow [get] <id>`.
- **Positionals name what the command acts on**: one id, several ids, or the title for `new`, where no ticket exists yet to point at.
- **A positional names one target, never 2 things.** `get` takes one id, and so does each status verb: `flow build exp-47`, then `flow get exp-47`.
- **No path names what a command acts on.** Every command finds the root from the current directory.
- **A last word may name where something goes.** `flow move exp-47 home` moves tickets, `flow store branch` puts a project's records on a branch, and `flow restore machine` puts this machine back.
- **Everything else is a flag.**

## One default noun

Tickets are never named in a command: `flow ls`, `flow new "…"`, `flow build exp-47`. Every other stored thing keeps a group and reads `flow <things> <action>`: `flow cases ls`, `flow cases new "…"`.

**Exactly one stored thing goes unnamed: the most typed.** A second unnamed noun would collide the moment both wanted `ls`.

## The kinds of command

- **The board**: `next`, `check`, `ls`, `tree`. Each answers a question about the work as a whole. `next` is the session opener: `/flow:start` runs it.
- **One ticket**: `<id>`, `handoff`, `new`, `edit`, `file`, `drop`, `move`, and the status verbs. Each names a ticket and acts on it.
- **A group**: `cases`, `skills`, `settings`, `audit`, `restore`. A different stored thing, carrying its own actions behind its own name.
- **Setup**: `install`, `init`, `store`, `update`, `sync`, `doctor`, `survey` and `uninstall`. Each sets up, checks or removes a machine or a project, never a ticket.
  - `install` writes outside any project, into `~/.agents`, `~/.claude`, `~/.flow` and `~/.local/bin`. `doctor` reads the same places back.
  - `survey` lists every place Claude Code reads its setup from, Flow's or not. Both setup sessions start from it, and `doctor` reports its problems.
  - `install` runs before `flow` is a command at all. Typed by path, it makes the link that lets everything else be typed by name.
  - A setup session's steps are flags: `flow install --check` runs before the session's first change, and `flow install --finish` stamps the version at its end. `init` and `update` take the same 2.
- **Rule checks**: `scorecard`. It reads `~/.flow/logs/scorecards/`, which the check hooks write, so it stands apart from `audit`, which reads the transcript index.

All of them share one flat namespace: a name is available once. Help prints them in sections.

**A command with no section runs and never prints in help.** `status-line` is the one Claude Code runs and nobody types. `contribute` waits for the sharing command that replaces it after V1.

## Hidden from help

A command or a flag declared `hidden: true` runs like any other and never prints in `flow --help`. The user docs leave them out too. They exist for the agent and the tests:

- **`flow handoff <id>`**: adds a line to the ticket's `history.md` saying this session handed the work on. `/flow:handoff` runs it after writing `## State`.
- **`--root <dir>`**: stands in for `~`, so a command works on a pretend machine. Taken by `install`, `init`, `update`, `doctor`, `survey`, `sync`, `store`, `uninstall` and every `restore` action. A setup session never opens under it: the command prints what it would hand over.
- **`install --no-bin`** and **`doctor --no-bin`**: skip `~/.local/bin`, so a test leaves the real `PATH` alone.
- **`install --no-clone`**: skips cloning `util`, `toolbox` and `domain-skills`, so a test needs no network.
- **`install --drafts`**: links the skills in `skills/drafts/` too, for trying one before it ships.
- **`doctor --tests`**: runs both test suites as well, which takes about 14 seconds.

**A migration has no `flow` command.** `~/.flow/scripts/apply-migration.js <folder>` carries one out, run by the setup or update session that wrote it. A command on `PATH` can be typed by accident weeks after the migration was written.

## The actions

Every stored thing gets these 5:

- **`new`**: create one
- **`ls`**: list many, filtered
- **`get`**: show one in full
- **`edit`**: change a field on one
- **`drop`**: remove one

The rules around them:

- **`add` stands in for `new` where the thing already exists elsewhere and gets fetched.** `flow skills add <owner/repo>` clones a skill repository someone else wrote.
- **A switch reads `on`, `off` and `reset`.** `on` and `off` write a line at one level: this project or folder, or `--global` for every project. `reset` removes that level's line. The level above then decides. `flow skills` and `flow settings` both work this way.
- **Extra commands are allowed, and one test decides.** `edit` sets one field, on one ticket, to a value you typed. An extra command earns its place by breaking one of those 3: `drop` re-points every ticket that depended on this one, and `file` stamps several tickets at once. `tree` writes nothing at all.
- **A list field is set whole.** `flow edit <id> --deps <id,id>` replaces the list the way `flow new --deps` writes it, and an empty value clears it. Adding one item means typing the list again, which keeps one command per field.
- **A missing action is deliberate, and the file says why.** Cases have no `drop`: a recorded failure is never removed.
- **A group names its most typed action the default, and that word can be left out.** `flow skills react` is `flow skills ls react`, and `flow audit <id>` is `flow audit get <id>`.
- **A bare group name prints help, unless its default action needs no argument.** Then the bare form runs that action: `flow skills` answers, `flow cases` helps. Nothing declares which: an action whose `args` are absent or bracketed, such as `[words...]`, runs bare. `flow restore` lists the originals.
- **A group names no default where that action would write.**

## Status verbs

**Every status is a command, named after where it lands.** `flow build exp-47`, `flow review exp-47`, `flow park exp-47 --reason "…"`.

- **The verb comes off the status table, never hand-written**: one column beside the name.
- **Every verb runs the same move**, through the one function holding every refusal. A verb carries no logic beyond naming a target.
- **A status with no verb says why.** `dropped` has none: killing a ticket repairs whatever depended on it, and `flow drop` is where that repair lives.
- **`edit` never takes a status.**

## Print the command, never perform it

**No command computes a status from something it read.** `flow <id>` prints `pick up with: flow groundwork exp-47` and stops.

The skill that picks the ticket up runs the move, after it opens the phase's own artifact. A command that moved it would move first: Claude Code runs an injected shell line before the model reads a word.

**Skipped moves → add a check that catches the skip.** Never put the write back in front of the read.

## Flags

- **Start every flag with 2 dashes.**
- **A single letter after one dash only where a wide convention already owns it.** `flow init -y` answers yes to its question, as `npm init -y` and `apt -y` do. Such a flag has no 2-dash form.
- **Type the whole name.** `--stat` reaches nothing.

## Every command declares what it accepts

Each command carries a list: the flags it takes, which of them are required, and the legal values wherever the list is closed.

Four things read that list:

1. **Parsing**: an undeclared flag fails.
2. **Validation**: a bad value fails and prints the legal ones.
3. **Resolving**: a typed word is matched against the names legal in its position, and this is where they live.
4. **The help text**: `flow --help` prints the whole surface from the declarations. `--help` or `-h` after a command prints that command's lines alone, and runs nothing.

## The status table

One row per status, in lifecycle order, the order help prints the verbs in:

- **`name`**
- **`verb`**: the command that moves a ticket into it. Empty where the move needs code of its own
- **`rank`**: where it sorts in a list. Separate from row order: in flight first, then what could start, then what was set aside, then history
- **`open`**: counts as unfinished
- **`live`**: still in play, so anything depending on it stays blocked
- **`inFlight`**: someone is working on it
- **`satisfies`**: a dependency on this ticket counts as met
- **`terminal`**: history, so the folder moves to `.flow/tickets/archive/`
- **`reason`**: the move refuses without `--reason`

Adding a status means adding a row and nothing else. The one thing a row cannot carry is a refusal. `done` refuses on a parent with open children; `dropped` refuses while live dependents exist. Those guards are code, attached to a status by name.

## Ticket ids

An id is the project's prefix and a number: `exp-47`. The folder adds a label: `exp-47-parser-split`.

- **The prefix names the place.** 2 to 8 lowercase letters, `ticketPrefix` in the project's `.flow/settings.json`, and `home` for the tickets in `~/.flow/`. A bare number means the current place's ticket.
- **The number is the identity; the label is decoration.** A reference stored as `exp-47-old-label` still resolves.
- **Write the label as 1 to 3 words**, lowercase, joined by hyphens, generated from the title and editable afterwards. Generating one drops `the`, `of`, `to` and the rest of that list first.
- **Any unambiguous part of an id resolves it**: `exp-47`, `47`, `parser`, or the whole thing. Ambiguity fails and lists the matches.
- **Changing a label renames the folder and nothing else**: `flow edit exp-47 --label parser-split`, and in practice only just after creation. `deps` and `parent` hold the id alone. A retitle leaves the label alone.
