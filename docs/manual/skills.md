# Skills

Every skill Flow ships, and the skills Flow makes from your tickets. A skill is a file of instructions the agent loads when you type its name, or when its description matches what you asked. Every Flow skill is typed `/flow:<name>`.

## Table of contents

- [Phases](#phases): the 3 kinds of work a ticket goes through
- [Tools](#tools): the jobs that fit no phase
- [Ticket skills](#ticket-skills): one skill per open ticket, `/shop-7`

## Phases

Each phase works on one ticket. Type the phase, then the ticket's id as a skill: `/flow:execute /shop-7`. [Ticket skills](#ticket-skills) covers those. With no ticket typed, the phase creates one from what you described.

- **`/flow:groundwork`**: turn an idea into a design. Every open decision gets a written answer, including the ones nobody raised. Where nothing written can answer a question, it builds a quick prototype that answers that one question, kept in the ticket beside a report of what it found, and never promoted to the real build. It ends in tickets ready to build.
- **`/flow:execute`**: build one ticket, from its plan through review.
- **`/flow:debug`**: find a bug's cause from evidence, prove it, then fix it.

## Tools

- **`/flow:start`** (only you can start it): open a session on the board, or on one ticket. Bare, it shows the board and recommends what to work on. With a ticket, `/flow:start /shop-7`, it picks the phase the ticket needs.
- **`/flow:handoff`**: write into the ticket what the next session needs to carry on, so `/clear` loses nothing.
- **`/flow:research`**: find out how an outside tool really works, from its documentation and source. What it learns goes in `~/.flow/wiki/<tool>/`, shared by every project.
- **`/flow:audit`**: answer a question about how something behaved, such as whether the agent follows a guide Flow sends, by counting the cases in past sessions and Flow's logs against a baseline. It writes a report with the sessions and turns that prove the answer. What it learns, such as the queries that worked, goes in `~/.flow/wiki/audit/`.
- **`/flow:visualize`**: draw diagrams, screen mockups and HTML previews, in a message or in a document.
- **`/flow:upkeep`** (only you can start it): fold closed tickets, notes, findings and the failure log into the wiki, rules and skills. It shows one plan first.
- **`/flow:tickets-from-spec`** (only you can start it): cut the next chunk of planned work out of `docs/spec/` into tickets, earliest release first.
- **`/flow:review-code`** (only you can start it): review the code this session changed against Flow's review criteria, and report what to fix before the ticket closes.
- **`/flow:write-spec`** (only you can start it): write the decisions this session settled into `docs/spec/`, by Flow's spec criteria. It shows the paths and stops.

A skill only you can start never fires by itself, and its description costs the agent nothing. When one is the next step, the agent tells you to type it.

## Ticket skills

Every open ticket is also a skill named after its id, so typing `/shop` lists your tickets:

```text
/shop-3    Ticket, todo, blocked: CSV export
/shop-5    Ticket, todo: Choose a chart library
/shop-7    Ticket, in-progress: Safari loses the session cookie
```

- **Typed alone**, `/shop-7` prints the ticket, as `flow tickets get shop-7` does.
- **Typed after a phase**, `/flow:debug /shop-7`, it opens that phase on the ticket. Words after it reach the agent as instructions: `/flow:groundwork /shop-5 compare only free libraries`.
- **Which tickets get one**: every ticket not `done` or `dropped`, parked ones included. `blocked` means it waits on another ticket.
- **Where they live**: the project's `.claude/skills/<id>/`, and `~/.claude/skills/home-<n>/` for the tickets in your Flow home. git never sees them.
- **Only you can start one**, so the list costs the agent nothing.

Every `flow` command that changes a ticket rewrites them, and so does every session start. Never edit one: `flow` rewrites any folder it made.
