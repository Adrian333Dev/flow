# Skills

Every skill Flow ships, and how to hand one a ticket. A skill is a file of instructions the agent loads when you type its name, or when its description matches what you asked. Every Flow skill is typed `/flow:<name>`.

## Table of contents

- [Phases](#phases): the 3 kinds of work a ticket goes through
- [Tools](#tools): the jobs that fit no phase
- [Handing a skill a ticket](#handing-a-skill-a-ticket): `#shop` lists your tickets, and a row attaches one

## Phases

Each phase works on one ticket. Type the phase, then `#shop-7`, and take the ticket's row: `/flow:execute @.flow/tickets/7/ticket.md`. [Handing a skill a ticket](#handing-a-skill-a-ticket) covers it. With no ticket typed, the phase creates one from what you described.

- **`/flow:groundwork`**: turn an idea into a design. Every open decision gets a written answer, including the ones nobody raised. Where nothing written can answer a question, it builds a quick prototype that answers that one question, kept in the ticket beside a report of what it found, and never promoted to the real build. It ends in tickets ready to build.
- **`/flow:execute`**: build one ticket, from its plan through review.
- **`/flow:debug`**: find a bug's cause from evidence, prove it, then fix it.

## Tools

- **`/flow:start`** (only you can start it): open a session on the board, or on one ticket. Bare, it shows the board and recommends what to work on. With a ticket, `/flow:start @.flow/tickets/7/ticket.md`, it picks the phase the ticket needs.
- **`/flow:handoff`**: write into the ticket what the next session needs to carry on, so `/clear` loses nothing.
- **`/flow:research`**: find out how an outside tool really works, from its documentation and source. What it learns goes in `~/.flow/wiki/<tool>/`, shared by every project.
- **`/flow:audit`**: answer a question about how something behaved, such as whether the agent follows a guide Flow sends, by counting the cases in past sessions and Flow's logs against a baseline. It writes a report with the sessions and turns that prove the answer. What it learns, such as the queries that worked, goes in `~/.flow/wiki/audit/`.
- **`/flow:visualize`**: draw diagrams, screen mockups and HTML previews, in a message or in a document.
- **`/flow:upkeep`** (only you can start it): fold closed tickets, notes, findings and the failure log into the wiki, rules and skills. It shows one plan first.
- **`/flow:tickets-from-spec`** (only you can start it): cut the next chunk of planned work out of `docs/spec/` into tickets, earliest release first.
- **`/flow:review-code`** (only you can start it): review the code this session changed against Flow's review criteria, and report what to fix before the ticket closes.
- **`/flow:write-spec`** (only you can start it): write the decisions this session settled into `docs/spec/`, by Flow's spec criteria. It shows the paths and stops.

A skill only you can start never fires by itself, and its description costs the agent nothing. When one is the next step, the agent tells you to type it.

## Handing a skill a ticket

Typing `#` in the prompt lists your note labels, then your open tickets, then your notes. Keep typing to narrow it by id, title, label or words: `#shop-7`, `#safari`. Each row is one line: a short name, then the words, cut to fit your terminal:

```text
#memory               1 note
fw-204-memory         in-progress · what the agent keeps across sessions…
fw-275-memory-rules   todo · rewrite the loaded rules for findings…
note                  Track filing through commands · #memory
```

- **`#t:` shows tickets alone**: `#t:cookie`. A ticket matches on its id, title and description, and the words you typed show underlined.
- **`#n:` shows notes alone**: `#n:cookie`.
- **Taking a row** writes a mention of the ticket's file: `@.flow/tickets/7/ticket.md`. Claude Code attaches the file to your message.
- **After a phase**, `/flow:debug @.flow/tickets/7/ticket.md`, the phase opens on that ticket. Words after it reach the agent as instructions: `/flow:groundwork @.flow/tickets/5/ticket.md compare only free libraries`.
- **Which tickets are listed**: every ticket not `done`, `parked` or `dropped`, 8 at most.
- **Typing the id as plain text**, `/flow:execute shop-7`, works too: the agent looks the ticket up and reads it.

Whenever the agent reads a ticket, or you mention one, Flow adds a short header the file itself does not hold: the status, labels, parent, children done, what it waits on, and the open questions. The header goes once per conversation window, and again after the ticket changes. It never enters the file.
