# Designing a flow command

`flow` is the ticket tool, and it also sets this machine up and tells a project which skills it uses. This file holds the rules its surface follows and the reasoning behind each. Read it before adding a command or a flag.

## The shape

```
flow <command> [id]... [--flags]
```

- **The command always sits at position 1**, in every command, without exception. A target is often absent — `ls`, `next` and `new` take none — so putting the target first would move the command between positions 1 and 2.
- **A word naming no command is a ticket id.** `flow t047` shows one; `flow get t047` is the same thing spelled out.
- **Positionals name what the command acts on** — one id, several ids, or the title for `new`, where no ticket exists yet to point at.
- **A positional names one target, never two things.** `get` takes one id or one path. The status verbs each take one id. Cut 2026-09-04, having carried `flow get t047 build` since 2026-08-24: the combined form added a second path into `transition` and saved nothing the agent needs — `flow build t047` then `flow get t047` is two commands and no ambiguity.
- **A path positional is allowed only on `get`.** `flow get .flow/handoff.md` reads a file and loads any `flow-open` block it contains, since loose work has no ticket id to name. Everything else finds the root from the current directory and takes no path.
- **Everything else is a flag.**

## One default noun

Tickets are never named in a command: `flow ls`, `flow new "…"`, `flow build t047`. Every other stored thing keeps a group and reads `flow <things> <action>`: `flow cases ls`, `flow cases new "…"`.

**Exactly one stored thing goes unnamed, and it is the most typed.** Tickets are written 9 times for every case across the skills, so the common form gets the short spelling and the rare one gets the explicit prefix. A second unnamed noun would collide the moment both wanted `ls`.

## The four kinds of command

- **The board** — `get` bare, `next`, `check`, `ls`, `tree`. Each answers a question about the work as a whole. `get` with `--files` is the session opener: `/start` runs it, so the branching lives in tested code instead of shell inside a markdown file.
- **One ticket** — `<id>`, `new`, `edit`, `dep`, `file`, `drop`, and the status verbs. Each names a ticket and acts on it.
- **A group** — `cases`, `work`, `skills`, `overlays`. A different stored thing, carrying its own actions behind its own name.
- **Setup** — `install`, and only `install`. It writes outside the project, into `~/.claude` and `~/.local/bin`, which no other command does. It is also the one run before `flow` is a command at all: on a machine that has just cloned Flow, it is typed by path, and it makes the link that lets everything else be typed by name.

All 4 share one flat namespace, so a name is available exactly once. Help prints them in sections, which is the only place the distinction shows.

## The actions

Every stored thing gets these 5:

- **`new`** — create one
- **`ls`** — list many, filtered
- **`get`** — show one in full
- **`edit`** — change a field on one
- **`drop`** — remove one

- **Extra commands are allowed, and one test decides.** `edit` sets one field, on one ticket, to a value you typed. An extra command earns its place by breaking one of those three: `drop` re-points every ticket that depended on this one, `file` stamps several tickets at once, `dep` edits a list and so takes `--on` and `--off` rather than a value. `tree` writes nothing at all.
- **A missing action is deliberate, and the file says why.** Cases have no `drop`, because a recorded failure is never removed — keeping it is the point of writing it down.
- **A group names its most typed action the default, and that word can be left out.** `flow overlays groundwork` is `flow overlays get groundwork`. It is the rule the flat namespace already runs one level up, where a word naming no command is read as a ticket id.
- **A bare group name prints help, unless its default action takes no argument.** Then the bare form runs that action: `flow git` answers, `flow cases` helps. Nothing new declares which. An action with no `args` cannot be missing one, so the bare form is always a complete call.
- **`work` names no default**, because its `get` replays a stored copy over the folder you are standing in. A mistyped action falling through to a write of your working tree is the one worth refusing.

## Status verbs

**Every status is a command, named after where it lands.** `flow build t047`, `flow review t047`, `flow park t047 --reason "…"`.

- **The verb comes off the status table, never hand-written.** One column beside the name, so a new status arrives with its command already working. A hand-written set costs new code per status, and the day that step gets skipped the status exists with nothing that reaches it.
- **Every verb runs the same move**, through the one function holding every refusal. A verb cannot walk past a guard, because it carries no logic of its own beyond naming a target.
- **A status with no verb says why.** `dropped` has none: killing a ticket repairs whatever depended on it, and `flow drop` is where that repair lives.
- **`edit` never takes a status.** Two spellings for one move sends every file to the general one, and the verbs go unread.

## Print the command, never perform it

**No command computes a status from something it read.** `flow <id>` prints `pick up with: flow groundwork t047` and stops there.

The move belongs to the skill that picks the ticket up, after it opens the phase's own artifact. A command that both reports a ticket and moves it runs the move first — Claude Code executes an injected shell line before the model reads a word — so the ticket advances on the strength of nothing.

**The cost is accepted.** An instruction can be skipped where a mechanical move cannot. Printing the exact command makes it a copy rather than a decision; where it drifts in practice, the fix is a check that catches the skip, never putting the write back in front of the read.

## Flags

- **Start every flag with two dashes.** One dash means a single letter, and single letters glue together — `-la` is `-l` and `-a` — so one dash followed by a word cannot be read reliably. Two dashes carries no second meaning.
- **Type the whole name.** `--stat` reaches nothing. An abbreviation changes meaning the day a flag is added beside it, and tab completion already buys the typing back.

## Every command declares what it accepts

Each command carries a list: the flags it takes, which of them are required, and the legal values wherever the list is closed.

Four things read that list:

1. **Parsing** — an undeclared flag fails. Before this, `--statuss` was ignored silently and the command exited 0 having changed nothing, which looks exactly like success.
2. **Validation** — a bad value fails and prints the legal ones.
3. **Resolving** — a typed word is matched against the names legal in its position, and this is where they live.
4. **The help text** — `flow` prints its surface from the declarations, so help can never describe a command that no longer exists.

Point 4 is what makes the declarations worth the trouble. Help used to be an 80-line string kept in step by hand.

## The status table

One row per status, in lifecycle order, which is the order the verbs print in help:

- **`name`**
- **`verb`** — the command that moves a ticket into it. Empty where the move needs code of its own
- **`rank`** — where it sorts in a list. Separate from row order, because a list is read work-first: what is in flight leads, then what could start, then what was set aside, then history
- **`open`** — counts as unfinished
- **`live`** — still in play, so anything depending on it stays blocked
- **`inFlight`** — someone is working on it
- **`satisfies`** — a dependency on this ticket counts as met
- **`terminal`** — history, so the folder moves to `.flow/tickets/archive/`
- **`reason`** — the move refuses without `--reason`

Adding a status means adding a row and nothing else. The one thing a row cannot carry is a refusal. `done` refuses on a parent with open children; `dropped` refuses while live dependents exist. Those guards are code, attached to a status by name.

## Ticket ids

An id is a number and a label: `t047-parser-split`.

- **The number is the identity; the label is decoration.** A reference stored as `t047-old-label` still resolves, so a stale label can never break one.
- **Write the label as 1 to 3 words**, lowercase, joined by hyphens, generated from the title and editable afterwards. Generating one drops `the`, `of`, `to` and the rest of that list first, so a 3 word label never spends a word on one.
- **Any unambiguous part of an id resolves it** — `t047`, `47`, `parser`, or the whole thing. Ambiguity fails and lists the matches.
- **Changing a label renames the folder and nothing else** — `flow edit t047 --label parser-split`, and in practice only just after creation. There is nothing to chase: `deps` and `parent` hold bare numbers, so no stored reference carries a label. A retitle leaves the label alone, so an id never drifts by accident.
