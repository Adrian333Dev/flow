# Tickets

A ticket is one piece of work, kept as a folder: what to build, where the work stands, and everything the work produced. Each of Flow's 4 phases works on one ticket, and a phase started without one creates it.

## Table of contents

- [What a ticket holds](#what-a-ticket-holds): the folder, and the file at its top
- [Naming a ticket](#naming-a-ticket): ids, and the shorter ways to type one
- [Statuses](#statuses): where the work stands, and what moves it
- [Types](#types): the 5 kinds of work
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

The rest appears as the work writes it. A finished ticket moves to `.flow/tickets/archive/`, so nothing is deleted.

`ticket.md`, in the middle of a build:

````md
---
id: shop-7
title: Safari loses the session cookie
status: building
type: issue
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

- **The block between the `---` lines** belongs to `flow`. Change it through [commands](reference/commands.md#one-ticket), which refuse a bad move.
- **`## Done when`**: one check that proves the work is finished.
- **`## References`**: what the work has to read.
- **`## State`**: where the work stopped, written for the next session. The `open` block lists the files that session gets before its first message: [Sessions](sessions.md).

## Naming a ticket

An id is the project's prefix and a number: `shop-7`. Any part of the folder name that matches one ticket finds it too, so `7` and `safari` both name `shop-7`.

Work that belongs to no project goes in your Flow home, with ids starting `home-`.

Every open ticket is also a skill, so `/shop-7` opens it in a session: [Skills](reference/skills.md#ticket-skills).

## Statuses

`todo → groundwork → planning → building → review → done`:

- **`todo`**: nobody has started.
- **`groundwork`**: decisions are still open.
- **`planning`**: the steps are being written.
- **`building`**: you approved the plan, and the code is being written.
- **`review`**: the work is with you to accept.
- **`done`**: you accepted it.

Off the line, each with a written reason: **`parked`**, set aside until it comes back, and **`dropped`**, never to be done.

The skills move tickets as they work, so you rarely type a status. Where a status is wrong, such as `building` with no `plan.md`, the next skill goes by the files, and tells you.

## Types

- **`feature`**: something new. Every status.
- **`chore`**: upkeep. Every status, though it usually skips groundwork.
- **`issue`**: a bug. `todo → building → review → done`, since finding the cause and fixing it are one job.
- **`topic`**: a decision with nothing to build. `todo → groundwork → done`, and `groundwork/map.md` is the result.
- **`prototype`**: quick code that answers one question. `todo → building → review → done`.

## Parents and waits

- **A parent** is the ticket bigger work was split from, with each part a child ticket. `flow tree` shows them nested. The parent closes only after its children.
- **A wait** (`deps`) is a ticket that must be finished before this one starts. `review` counts as finished. `flow next` offers only tickets with nothing left to wait on.
- **Priority** passes down: a ticket with none takes its parent's.

Dropping a ticket others wait on refuses, until you point them at a replacement or drop them too: [Commands](reference/commands.md#flow-drop).
