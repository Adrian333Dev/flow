# Designing a flow command

## The shape

```text
flow <command> [id]... [--flags]
```

- **The command always sits at position 1**, in every command, without exception.
- **A word naming no command is a ticket id.** `flow exp-47` shows one; `flow get exp-47` is the same thing spelled out.
- **Positionals name what the command acts on**: one id, several ids, or the title for `new`, where no ticket exists yet to point at.
- **A positional names one target, never two things.** `get` takes one id, and so does each status verb: `flow build exp-47`, then `flow get exp-47`.
- **No path names what a command acts on.** Every command finds the root from the current directory, and `flow move`'s last word is where the tickets go.
- **Everything else is a flag.**

## One default noun

Tickets are never named in a command: `flow ls`, `flow new "…"`, `flow build exp-47`. Every other stored thing keeps a group and reads `flow <things> <action>`: `flow cases ls`, `flow cases new "…"`.

**Exactly one stored thing goes unnamed: the most typed.** A second unnamed noun would collide the moment both wanted `ls`.

## The four kinds of command

- **The board**: `next`, `check`, `ls`, `tree`. Each answers a question about the work as a whole. `next` is the session opener: `/flow:start` runs it.
- **One ticket**: `<id>`, `new`, `edit`, `dep`, `file`, `drop`, and the status verbs. Each names a ticket and acts on it.
- **A group**: `cases`, `skills`, `settings`, `audit`, `restore`, `setup`. A different stored thing, carrying its own actions behind its own name.
- **Setup**: `install` and `doctor`. Neither needs a project: `install` writes outside the project, into `~/.agents`, `~/.claude`, `~/.flow` and `~/.local/bin`, and `doctor` reads the same places back. `install` runs before `flow` is a command at all: typed by path, it makes the link that lets everything else be typed by name.

All 4 share one flat namespace: a name is available once. Help prints them in sections.

**A migration has no `flow` command.** `~/.flow/scripts/apply-migration.js <id>` carries one out, run by the skill that wrote it. A command on `PATH` can be typed by accident weeks after the migration was written.

## The actions

Every stored thing gets these 5:

- **`new`**: create one
- **`ls`**: list many, filtered
- **`get`**: show one in full
- **`edit`**: change a field on one
- **`drop`**: remove one

- **Extra commands are allowed, and one test decides.** `edit` sets one field, on one ticket, to a value you typed. An extra command earns its place by breaking one of those three: `drop` re-points every ticket that depended on this one, `file` stamps several tickets at once, `dep` edits a list and so takes `--on` and `--off` rather than a value. `tree` writes nothing at all.
- **A missing action is deliberate, and the file says why.** Cases have no `drop`: a recorded failure is never removed.
- **A group names its most typed action the default, and that word can be left out.** `flow skills react` is `flow skills ls react`.
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

- **Start every flag with two dashes.**
- **A single letter after one dash only where a wide convention already owns it.** `flow init -y` answers yes to its question, as `npm init -y` and `apt -y` do. Such a flag has no two-dash form.
- **Type the whole name.** `--stat` reaches nothing.

## Every command declares what it accepts

Each command carries a list: the flags it takes, which of them are required, and the legal values wherever the list is closed.

Four things read that list:

1. **Parsing**: an undeclared flag fails.
2. **Validation**: a bad value fails and prints the legal ones.
3. **Resolving**: a typed word is matched against the names legal in its position, and this is where they live.
4. **The help text**: `flow` prints its surface from the declarations.

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
