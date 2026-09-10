# Tickets

A ticket is one unit of committed work: something somebody decided to build, written down where the work itself happens. It is the only thing Flow ever builds, and everything else in the workflow either produces a ticket or comes out of one.

**Every ticket is made and moved by the `flow` command.** It owns the id, the folder name and the whole block of fields at the top, because those three have to agree. You write the body; `flow` writes everything above it.

## Table of contents

- [What a ticket is](#what-a-ticket-is)
- [Where a ticket lives](#where-a-ticket-lives)
- [The frontmatter](#the-frontmatter)
  - [The 8 statuses](#the-8-statuses)
  - [The 5 types](#the-5-types)
- [The body](#the-body)
- [What a ticket looks like](#what-a-ticket-looks-like)
- [Creating one](#creating-one)
- [Moving one](#moving-one)

## What a ticket is

Three things at once:

- **A description** of what changes and why, written by whoever decided to build it.
- **A status**, saying where the work stopped: undecided, being planned, being built, waiting on a review, finished.
- **A folder**, holding the plan, the design that produced it, and whatever the work answered along the way.

**A ticket is named by its id**, a `t` and a number: `t047`. The folder gets a readable label after it, `t047-parser-split`, but the number is the identity. `t047`, `47`, `parser` and `t047-parser-split` all name the same ticket to every command.

**Not everything is a ticket.** A question somebody wants answered produces a report and no code, so it runs inside whatever work raised it. A decision nobody has made yet is groundwork. A ticket exists once there is committed work.

## Where a ticket lives

```
.flow/tickets/t047-parser-split/
├─ ticket.md          what to do, why, and where it stands
├─ groundwork/
│  └─ map.md          every open decision, walked to an answer
├─ plan.md            the numbered steps that build it
├─ issues.md          what the build taught, still true after it closes
├─ intake/            material dropped in for this job
└─ reports/           one file per question the work answered
```

`ticket.md` and `groundwork/` exist from the moment the ticket is created. Everything else appears when the work writes it, so a ticket that never needed a report never grows a `reports/` folder.

`.flow/tickets/` stays flat. A ticket split out of another records its parent as a field rather than by nesting, so a ticket can be re-parented without moving a folder. **A finished ticket moves to `.flow/tickets/archive/`**, folder and all. Nothing is deleted.

## The frontmatter

The block at the top of `ticket.md`, between two `---` lines. Hand-editing it is not blocked, but a status written by hand skips the checks that refuse a bad move.

- **`id`**: `t047`. Assigned at creation, never reused.
- **`title`**: one line, what the work is.
- **`status`**: where the work stopped. The 8 values are below.
- **`type`**: what kind of work it is. The 5 values are below.
- **`priority`**: `high` or `low`. Absent means normal, which is why most tickets carry no such line.
- **`parent`**: the id of the ticket this one was split out of. One at most.
- **`deps`**: ids this ticket cannot start before.
- **`reason`**: why the ticket was parked or dropped. Required for both.
- **`resume`**: the status a parked ticket left, so reviving it lands where it stopped.
- **`closed`**: the date it reached `done` or `dropped`.
- **`filed`**: the date its findings were drained into rules and skills.

**Every empty field is omitted**, so a plain new ticket carries four lines and no more.

### The 8 statuses

`todo → groundwork → planning → building → review → done` is the line. Two statuses sit off it.

- **`todo`**: it exists and nobody has started.
- **`groundwork`**: the decisions are still open.
- **`planning`**: the decisions are settled and the steps are being written.
- **`building`**: the steps are approved and code is being written.
- **`review`**: the work is with whoever asked for it.
- **`done`**: accepted.
- **`parked`**: set aside, revivable, and it needs a written reason. **A parked ticket satisfies nothing**, so anything depending on it waits until it comes back.
- **`dropped`**: killed, and it needs a written reason. Dropping repairs whatever depended on it, either by re-pointing those tickets at a replacement or by dropping them too.

**A dependency is satisfied by `review` or `done`.** Built and checked is enough to unblock work sitting on top.

### The 5 types

Every type walks a subsequence of the same line, never a different order.

- **`feature`**: all of it.
- **`chore`**: the same, usually skipping groundwork. Upkeep rarely has a decision in it.
- **`issue`**: `todo → building → review → done`. A bug hunt finds the cause and writes the fix as one act.
- **`topic`**: `todo → groundwork → done`. The map of decisions is the deliverable, and there is nothing to build.
- **`prototype`**: `todo → building → review → done`. The question arrives with the ticket, and the code is thrown away.

## The body

Everything under the frontmatter. Four parts, and only the first is always there.

- **The opening paragraph**: what changes and why. Written by whoever created the ticket.
- **`## Done when`**: one observable check that proves the ticket finished. A ticket cut from a written spec arrives with one; a ticket born in conversation often does not, and whoever picks it up writes it before planning.
- **`## References`**: what the build has to read, one line each: the path, then what it says. **Durable.** Whoever cut the ticket found these, and they survive to `done`.
- **`## State`**: what is true this second, and nothing another file already holds. **Work in flight.** It is deleted when the ticket reaches review, and anything in it still true moves out first.

A `## State` section can end with a fenced `open` block: a list of file paths, one per line, that a session resuming this ticket is handed before its first turn. The format is `util fs open`'s rather than Flow's, and [the `open` block](https://github.com/Adrian333Dev/util/blob/main/docs/commands.md#the-open-block) in util's documentation is the full account of it.

## What a ticket looks like

One in the middle of a build, carrying all four sections. Most tickets carry two.

````markdown
---
id: t047
title: Split the parser into a tokenizer and a builder
status: building
type: feature
priority: high
parent: t045
deps: [t046]
---

# Split the parser into a tokenizer and a builder

The parser reads characters and builds nodes in one pass, so a syntax change
touches both jobs at once. Splitting them means a token stream can be tested
on its own, and the builder stops caring how whitespace is spelled.

## Done when

`npm test -- parser` passes, and `parse()` accepts the same inputs it accepts
today with the same output.

## References

- `src/parser.js`: the whole thing today, one 600-line pass
- `docs/spec/tech.md`: the error positions are part of the public API
- `t046`: added the fixture set this leans on

## State

Now: the tokenizer is written and passing. The builder still calls it through
the old entry point, so nothing is deleted yet.

Found: error positions are byte offsets, not character offsets. Two tests
pass for the wrong reason because the fixtures are all ASCII.

```open
plan.md
src/parser.js:40-120   # where step 4 stopped
```
````

## Creating one

Every ticket is created by a command, because the id, the folder and the frontmatter have to agree.

```bash
flow new "Split the parser into a tokenizer and a builder"
```

That prints the ids and paths it made, and the command to pick the ticket up. Seven flags shape it:

- **`--type <type>`**: one of the 5 above. Defaults to `feature`.
- **`--priority <level>`**: `high`, `normal` or `low`. Only `high` and `low` are stored.
- **`--parent <id>`**: the ticket this was split out of.
- **`--deps <id,id>`**: ids this cannot start before, comma separated.
- **`--label <1-3 words>`**: the readable half of the folder name, where the title makes a poor one.
- **`--body <text|->`**: the whole body, or `-` to read it from standard input.
- **`--from-groundwork <path>`**: move a loose groundwork folder in as this ticket's `groundwork/`.

**Without `--body`, the ticket gets a template**: the title, a comment where the paragraph goes, and a `## Done when` heading.

**With `--body`, the supplied text replaces that template outright**, which is what lets one command both create and fill a ticket. The template's `## Done when` is gone unless the body wrote one.

```bash
flow new "Fix the crash on an empty payload" --type issue --parent t047 --body - <<'EOF'
The importer throws on a payload with no `items` key.

## Done when

`npm test -- import` passes, including the empty-payload case.
EOF
```

## Moving one

Each move is one command, named after where it lands: `flow groundwork t047`, `flow plan t047`, `flow build t047`, `flow review t047`, `flow done t047`. Off the line: `flow park t047 --reason "…"` and `flow drop t047 --reason "…"`.

**A refused move exits non-zero rather than warning.** Starting a ticket whose dependencies are unmet refuses. Closing a ticket with open children refuses. Dropping a ticket that other live tickets depend on refuses, and prints the whole chain before it does. Each refusal names the flag that overrides it.

**The status is a claim; the folder is the evidence.** A ticket sitting at `building` with no `plan.md`, or at `planning` with half its decisions still open, has a status somebody wrote and never corrected. Where the two disagree, whichever skill picks the ticket up trusts the files, says which one disagreed, and writes the correcting command.
