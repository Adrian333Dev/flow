# Designing a flow command

`flow` is the ticket tool. This file holds the rules its surface follows and the reasoning behind each. Read it before adding a command, an action or a flag.

## The two kinds of command

**Commands about a stored thing.** Flow stores tickets and cases. Each kind gets the same actions in the same shape, so learning one teaches the rest.

**Commands about the board.** `flow status`, `flow next`, `flow check`. Each answers a question about the work as a whole and names no stored thing.

**The test for a new command:** does it act on one kind of stored thing? Yes → it is an action on that thing. No → it stands alone.

`ls` shows why the test earns its place. It looks like a board command, but the moment a second stored thing exists `flow ls` has to answer "list what?" and cannot. So `ls` belongs to tickets.

## The shape

```
flow <things> <action> [target]... [--flags]
```

- **The action always sits at position 2**, in every command, without exception. A target is often absent — `ls` and `new` take none — so putting the target first would move the action between positions 2 and 3.
- **Name the stored thing in the plural.** `flow tickets ls` reads correctly, and `ls` is the most typed of the five.
- **Positionals name what the action acts on** — one target, several targets, or the title for `new`, where no ticket exists yet to point at.
- **Everything else is a flag.**

Board commands keep their own names and take flags by the same rules.

## The actions

Every stored thing gets these 5:

- **`new`** — create one
- **`ls`** — list many, filtered
- **`get`** — show one in full
- **`edit`** — change a field on one
- **`drop`** — remove one

- **Extra actions are allowed, and one test decides.** `edit` sets one field, on one ticket, to a value you typed. An extra action earns its place by breaking one of those three: `start` computes the value from the ticket's type, `drop` re-points every ticket that depended on this one, `filed` stamps several tickets at once, `dep` edits a list and so takes `--on` and `--off` rather than a value. `tree` writes nothing at all.
- **A missing action is deliberate, and the file says why.** Cases have no `drop`, because a recorded failure is never removed — keeping it is the point of writing it down.
- **Never add an action that sets a field.** `flow tickets review t047` sets one field, on one ticket, to a value you typed, so it is `edit --status review`. Six verbs that each wrote one status is what this design replaced, and a new status meant new code every time.

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

One row per status, in lifecycle order, which is the order `--status` prints its legal values:

- **`name`**
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
- **Changing a label renames the folder and nothing else.** `flow tickets edit t047 --label parser-split`. There is nothing to chase: `deps` and `parent` hold bare numbers, so no stored reference carries a label. A retitle leaves the label alone, so an id never drifts by accident.
