# Designing a flow command

`flow` is the ticket tool. This file holds the rules its surface follows and the reasoning behind each. Read it before adding a command or a flag.

## The shape

```
flow <command> [id]... [--flags]
```

- **The command always sits at position 1**, in every command, without exception. A target is often absent — `ls`, `next` and `new` take none — so putting the target first would move the command between positions 1 and 2.
- **A word naming no command is a ticket id.** `flow t047` shows one; `flow get t047` is the same thing spelled out.
- **An ambiguous prefix fails rather than falling through to an id.** `flow p` prints `plan, park`. Guessing between two commands is worse than asking.
- **Positionals name what the command acts on** — one id, several ids, or the title for `new`, where no ticket exists yet to point at.
- **A second positional names a mode, never a second target.** `flow open t047 build` reads as *open it at building*. Reversed 2026-08-24, having said one target only: a status typed there is the user saying which one, and a flag would spell the same thing longer.
- **A path positional is allowed only where the command must run outside a repo.** `flow open docs/handoff.md` is the one, since loose work has no ticket id to name. Everything else finds the root from the current directory and takes no path.
- **Everything else is a flag.**

## One default noun

Tickets are never named in a command: `flow ls`, `flow new "…"`, `flow build t047`. Every other stored thing keeps a group and reads `flow <things> <action>`: `flow cases ls`, `flow cases new "…"`.

**Exactly one stored thing goes unnamed, and it is the most typed.** Tickets are written 9 times for every case across the skills, so the common form gets the short spelling and the rare one gets the explicit prefix. A second unnamed noun would collide the moment both wanted `ls`.

## The four kinds of command

- **The board** — `open` bare, `next`, `status`, `check`, `ls`, `tree`. Each answers a question about the work as a whole.
- **One ticket** — `<id>`, `new`, `edit`, `dep`, `file`, `drop`, and the status verbs. Each names a ticket and acts on it.
- **A group** — `cases`, `work`. A different stored thing, carrying its own actions behind its own name.
- **The session opener** — `open`, and only `open`. It spans the other kinds on purpose: the board with no argument, a ticket with one, a move and a ticket with two. `/start` runs it, so the branching lives in tested code instead of shell inside a markdown file.

All three share one flat namespace, so a name is available exactly once. Help prints them in sections, which is the only place the distinction shows.

## The actions

Every stored thing gets these 5:

- **`new`** — create one
- **`ls`** — list many, filtered
- **`get`** — show one in full
- **`edit`** — change a field on one
- **`drop`** — remove one

- **Extra commands are allowed, and one test decides.** `edit` sets one field, on one ticket, to a value you typed. An extra command earns its place by breaking one of those three: `drop` re-points every ticket that depended on this one, `file` stamps several tickets at once, `dep` edits a list and so takes `--on` and `--off` rather than a value. `tree` writes nothing at all.
- **A missing action is deliberate, and the file says why.** Cases have no `drop`, because a recorded failure is never removed — keeping it is the point of writing it down.

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
- **Shorten a flag by typing less of the word.** `--status`, `--stat` and `--st` all reach `--status`. Shortening never changes the dashes.
- **An exact match beats a shorter one**, so no flag is ever hidden by being the start of another.
- **An ambiguous prefix fails and lists every candidate.** `--p` prints `--parent` and `--priority`.
- **Write the full name in every file.** Skills, `CLAUDE.md` files and scripts spell a flag out; abbreviation is for typing at the prompt, where an error costs 2 seconds. Adding a flag later can turn a stored abbreviation ambiguous, and nothing would catch it until the command failed.

## Every command declares what it accepts

Each command carries a list: the flags it takes, which of them are required, and the legal values wherever the list is closed.

Four things read that list:

1. **Parsing** — an undeclared flag fails. Before this, `--statuss` was ignored silently and the command exited 0 having changed nothing, which looks exactly like success.
2. **Validation** — a bad value fails and prints the legal ones.
3. **Prefix matching** — the resolver needs the legal names, and this is where they live.
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
- **`terminal`** — history, so the folder moves to `docs/tickets/archive/`
- **`reason`** — the move refuses without `--reason`

Adding a status means adding a row and nothing else. The one thing a row cannot carry is a refusal. `done` refuses on a parent with open children; `dropped` refuses while live dependents exist. Those guards are code, attached to a status by name.

## Ticket ids

An id is a number and a label: `t047-parser-split`.

- **The number is the identity; the label is decoration.** A reference stored as `t047-old-label` still resolves, so a stale label can never break one.
- **Write the label as 1 to 3 words**, lowercase, joined by hyphens, generated from the title and editable afterwards. Generating one drops `the`, `of`, `to` and the rest of that list first, so a 3 word label never spends a word on one.
- **Any unambiguous part of an id resolves it** — `t047`, `47`, `parser`, or the whole thing. Ambiguity fails and lists the matches.
- **Changing a label renames the folder and nothing else** — `flow edit t047 --label parser-split`, and in practice only just after creation. There is nothing to chase: `deps` and `parent` hold bare numbers, so no stored reference carries a label. A retitle leaves the label alone, so an id never drifts by accident.
