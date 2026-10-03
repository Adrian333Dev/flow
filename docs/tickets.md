# Tickets

A ticket is one piece of work, written down as a folder: what to build, where the work stands, and everything the work produced. Flow's 4 phases, the skills that do the work, each work on one ticket. A phase started without one creates it.

## Table of contents

- [What a ticket holds](#what-a-ticket-holds): the folder, and the file at its top
- [Naming a ticket](#naming-a-ticket): ids, and the shorter ways to type one
- [Statuses](#statuses): where the work stands, and what moves it
- [Types](#types): the 5 kinds of work, and the statuses each passes through
- [Parents and waits](#parents-and-waits): splitting work, and work that waits on other work

## What a ticket holds

```text
.flow/tickets/shop-7-safari-loses-session/
├─ ticket.md       what to do, why, and where the work stands
├─ history.md      one line per status change
├─ groundwork/
│  └─ map.md       every decision the design needed, and its answer
├─ plan.md         the numbered steps that build it
├─ issues.md       what the build taught, still true after it closes
├─ intake/         material you dropped in for this work
├─ reports/        one file per question the work answered
└─ protos/<name>/  a prototype's code
```

`ticket.md` and `groundwork/` exist from the start, and the rest appears when the work writes it. A finished ticket's folder moves to `.flow/tickets/archive/`, so nothing is deleted. [New project](new-project.md#where-the-tickets-live) covers where `.flow/` is kept.

### `ticket.md`

A ticket in the middle of a build might read:

````md
---
id: shop-7
title: Safari loses the session cookie
status: building
type: issue
branch: main
---

Logging in on Safari 17 lands back on /login. Chrome and Firefox keep the session.

## Done when

Logging in on Safari 17 reaches the dashboard, and stays there after a reload.

## References

- `src/auth/session.ts`: sets the cookie on every login

## State

Found: the cookie is set with `SameSite=None` and no `Secure` flag, so Safari drops it.

```open
src/auth/session.ts:20-45   # where the cookie is set
```
````

- **The block between the `---` lines** belongs to `flow`, which writes it. Change it through [commands](reference/commands.md#one-ticket): a status written by hand skips the checks that refuse a bad move.
- **The first paragraph**: what changes and why.
- **`## Done when`**: one check that proves the work is finished.
- **`## References`**: what the work has to read, one line each. It stays until the end.
- **`## State`**: where the work stopped, written for the next session. The `open` block lists the files that session gets before its first message. [Sessions](sessions.md) covers it. The section is deleted when the ticket reaches `review`.

Other fields appear only when they hold something:

- **`priority`**: `high` or `low`. None means normal.
- **`parent`** and **`deps`**: covered in [Parents and waits](#parents-and-waits).
- **`branch`**: the code branch the work was built on.
- **`reason`**: why the ticket was parked or dropped. **`resume`**: the status a parked ticket goes back to.
- **`closed`** and **`filed`**: the day it finished, and the day its lessons were filed.
- **`was`**: its old id, after [`flow move`](reference/commands.md#flow-move) gave it a new one.

## Naming a ticket

An id is the project's prefix and a number: `shop-7`. Any part of the folder name that matches one ticket finds it too, so `7` and `safari` both name `shop-7` inside the project.

Work that belongs to no project goes in your Flow home, `~/.flow/`, with ids starting `home-`: `home-4`.

Every open ticket is also a skill, so `/shop-7` opens it in a session. [Skills](reference/skills.md#ticket-skills) covers ticket skills.

## Statuses

`todo → groundwork → planning → building → review → done`:

- **`todo`**: nobody has started.
- **`groundwork`**: decisions are still open.
- **`planning`**: the decisions are made, and the steps are being written.
- **`building`**: you approved the plan, and the code is being written.
- **`review`**: the work is with you to accept.
- **`done`**: you accepted it.

2 more sit off the line, each with a written reason:

- **`parked`**: set aside. It comes back at the status it left.
- **`dropped`**: it will never be done.

The skills move tickets as they work, so you rarely type a status. [Phases](phases.md) says which skill moves a ticket when. Each move adds a line to `history.md`: the time, the move, the Claude Code session, its title, and the code branch.

```text
2026-10-02 22:47  todo → building   ee0550b3-83ce-47b6-a333-b7204710063f  -  master
```

`claude --resume <session>` reopens the session that made a move, on the computer that ran it.

A status can be wrong, such as `building` with no `plan.md`. The skill that picks the ticket up then goes by the files in the folder, tells you the status was wrong, and corrects it.

## Types

Each type passes through some of the statuses, always in the same order:

- **`feature`**: something new. Every status.
- **`chore`**: upkeep. Every status, though it usually skips groundwork.
- **`issue`**: a bug. `todo → building → review → done`, since finding the cause and fixing it are one job.
- **`topic`**: a decision with nothing to build. `todo → groundwork → done`, and `groundwork/map.md` is the result.
- **`prototype`**: quick code that answers one question. `todo → building → review → done`, and the code stays in the ticket.

## Parents and waits

- **A parent** is the ticket a bigger piece of work was split from. Each part becomes its own ticket under it, and `flow tree` shows them nested. The parent's own work starts once its children finish, and it closes only after them.
- **A wait** (`deps`) is a ticket that must be finished before this one starts. A ticket in `review` already counts as finished, since built and checked is enough to start on top of. `flow next` offers only tickets with nothing left to wait on.
- **Priority** passes down: a ticket with none takes its parent's.

Dropping a ticket that others wait on refuses, until you point them at a replacement or drop them too. [Commands](reference/commands.md#flow-drop) shows both.
