# Learning

How a lesson from one session changes what the agent does in the next.

## Table of contents

- [Where each lesson goes](#where-each-lesson-goes): what the agent files, and where
- [From finding to rule](#from-finding-to-rule): `/flow:file-findings` turns lessons into rules and skills
- [Research](#research): what Flow knows about outside tools, and prompts for an outside AI
- [The agent's mistakes](#the-agents-mistakes): study cases, workflow notes and the failure log
- [Reading past sessions](#reading-past-sessions): `flow audit`

## Where each lesson goes

At each checkpoint, such as a handoff or finished work, the agent files what the conversation taught. `/capture` does the same on demand.

- **Work you decided on** → a ticket.
- **How you like to work, or a fact about you** → your rules.
- **A fact most sessions in this project need** → the project's `CLAUDE.md`.
- **A project fact only some work needs**, such as how it deploys → `docs/context/<subject>.md`.
- **How an outside tool behaves** → `~/.flow/wiki/<tool>/findings/`, shared by every project.
- **Any other lesson** → `.flow/findings/` in the project.
- **Everything else** → `.flow/inbox.md`.

Your Flow home goes to GitHub, so a lesson filed there never holds a detail of the project or its client.

## From finding to rule

A finding changes nothing until `/flow:file-findings` moves it into the file that changes behavior. Type it when `flow next` says closed tickets wait:

```text
unfiled: 1 closed ticket not yet filed   (flow ls --unfiled)
```

It reads the inbox, the findings and each closed ticket's notes. It then shows where each item would go: your rules, the project's `CLAUDE.md`, a skill, or a [rule check](rule-checks.md). Nothing is written before your yes.

## Research

An outside tool is anything your project uses that someone else makes: a library, a service, a command-line tool. Each gets a folder in your Flow home, which every project reads:

```text
~/.flow/wiki/next.js/
├─ index.md                         where the docs are
├─ research/<question>.md           one report per question
├─ findings/<what-was-learned>.md   lessons from using it
└─ downloads/                       its docs and code, on this computer only
```

`/flow:research` answers from that folder before it searches anywhere else. Before anything gets built, it also looks for something that already does the job: a library, a service, a skill or a plugin. A skill of your own or from `domain-skills` is switched on with `flow skills on <name>`. Anything else, the agent reads before recommending it.

A survey across many sources, such as every way to add search to an app, goes to a deep-research tool you run yourself:

1. **`/flow:research` writes the prompts**, and names the AI to run each one in.
2. **You run each prompt**, and paste the report back under it.
3. **The agent reads every report**, and recommends.

## The agent's mistakes

`/flow:review` records how Flow did. It is off until you switch it on: `flow skills on review --global`.

- **A study case**: one mistake, with the output that shows it and the rule that should have stopped it. The same mistake made 3 times shows as a count of 3.
- **A workflow note**: one line in `~/.flow/workflow-notes.md`, for friction with no single failure behind it.

```console
$ flow cases issues
ISSUE            CASES  OPEN  LATEST      RULES
answered-unread  1      1     2026-10-02  read-before-answering
skipped-walk     1      1     2026-10-02  walk-a-real-case
```

Flow logs every failure of something it runs, such as a sync that never reached GitHub. Until the failure is fixed, the status line shows `⚠ 1 Flow issue: ask Claude to fix them`. Ask, and the agent fixes it.

## Reading past sessions

`flow audit` reads the record Claude Code keeps of each session, so you can ask what happened: which files a session read, where its tokens went, which rule it ignored. Records last a year. `flow audit keep` saves one for good.

It counts in 2 units:

- **A turn**: one message you sent, and everything it caused.
- **A segment**: one unbroken conversation. Compacting starts a new segment, and `/clear` a new session.

Start with the cheapest view:

1. **`flow audit summary <session>`**: a few lines of totals.
2. **`flow audit timeline <session>`**: every tool call, one line each.
3. **`flow audit sql`**: any question across sessions. `flow audit schema` lists the tables.
4. **`flow audit read <session>`**: the conversation itself, for the turns the others pointed at.

[Commands](reference/commands.md#audit) covers every `flow audit` command.
