# Skills

Every skill Flow ships, and the skills Flow makes from your tickets. A skill is a file of instructions the agent loads when you type its name, or when its description matches what you asked. Every Flow skill is typed `/flow:<name>`.

## Table of contents

- [Phases](#phases): the 4 kinds of work a ticket goes through
- [Tools](#tools): the jobs that fit no phase
- [Skills for working on Flow](#skills-for-working-on-flow): off until you turn one on
- [Ticket skills](#ticket-skills): one skill per open ticket, `/shop-7`
- [`/capture`](#capture): file what the conversation holds, now

## Phases

Each phase works on one ticket. Type the phase, then the ticket's id as a skill: `/flow:execute /shop-7`. [Ticket skills](#ticket-skills) covers those. With no ticket typed, the phase creates one from what you described. [Phases](../phases.md) says when to pick each.

- **`/flow:groundwork`**: turn an idea into a design. Every open decision gets a written answer, including the ones nobody raised. It ends in tickets ready to build.
- **`/flow:execute`**: build one ticket, from its plan through review.
- **`/flow:prototype`**: write quick code that answers one question, kept in the ticket beside a report of what it found. It never becomes the real build.
- **`/flow:debug`**: find a bug's cause from evidence, prove it, then fix it.

## Tools

- **`/flow:start`** (only you can start it): open a session on the board, or on one ticket. Bare, it shows the board and recommends what to work on. With a ticket, `/flow:start /shop-7`, it picks the phase the ticket needs.
- **`/flow:handoff`**: write into the ticket what the next session needs to carry on, so `/clear` loses nothing. [Sessions](../sessions.md) covers when it runs.
- **`/flow:research`**: find out how an outside tool really works, from its documentation and source. What it learns goes in `~/.flow/wiki/<tool>/`, shared by every project. [Learning](../learning.md) covers the wiki.
- **`/flow:visualize`**: draw diagrams, screen mockups and HTML previews, in a message or in a document.
- **`/flow:file-findings`** (only you can start it): file what a session learned into skills, rules and checks.
- **`/flow:tickets-from-spec`** (only you can start it): cut the next chunk of planned work out of `docs/spec/` into tickets, earliest release first.

A skill only you can start never fires by itself, and its description costs the agent nothing. When one is the next step, the agent tells you to type it.

## Skills for working on Flow

These 2 are off on a new computer, and the only Flow skills you can switch. `flow skills on review --global` turns one on in every project.

- **`/flow:review`**: look back over how Flow did. It finds where a rule failed, where the same friction came back, and where the design has a gap. It records each as a study case or a note.
- **`/flow:apply-domain-findings <skill>`** (only you can start it): check the findings sent to one skill in a skill repository, and write the true ones into it.

## Ticket skills

Every open ticket is also a skill named after its id, so typing `/shop` lists your tickets:

```text
/shop-3    Ticket, todo, blocked: CSV export
/shop-5    Ticket, todo: Choose a chart library
/shop-7    Ticket, building: Safari loses the session cookie
```

- **Typed alone**, `/shop-7` prints the ticket and every file it names, as `flow get shop-7 --files` does.
- **Typed after a phase**, `/flow:debug /shop-7`, it opens that phase on the ticket. Words after it reach the agent as instructions: `/flow:groundwork /shop-5 compare only free libraries`.
- **Which tickets get one**: `todo`, `groundwork`, `planning`, `building` and `review`. `blocked` means it waits on another ticket.
- **Where they live**: the project's `.claude/skills/<id>/`, and `~/.claude/skills/home-<n>/` for the tickets in your Flow home. git never sees them.
- **Only you can start one**, so the list costs the agent nothing.

Every `flow` command that changes a ticket rewrites them, and so does every session start. Never edit one: `flow` rewrites any folder it made.

## `/capture`

Look back over the conversation now and file what is worth keeping into your rules, skills and notes, the way the agent does at each checkpoint. Only you can start it. It is a command rather than a skill, so it is typed with no `flow:`.
