# Learning

How a lesson from one session changes what the agent does in the next: where each lesson is written, how it becomes a rule or a skill, and the records Flow keeps of what went wrong.

## Table of contents

- [Where each lesson goes](#where-each-lesson-goes): what the agent files at each checkpoint, and where
- [From finding to rule](#from-finding-to-rule): `/flow:file-findings` turns lessons into rules, skills and checks
- [What Flow knows about outside tools](#what-flow-knows-about-outside-tools): the wiki, and how `/flow:research` uses it
- [The agent's mistakes](#the-agents-mistakes): study cases and workflow notes
- [The failure log](#the-failure-log): every failure of something Flow runs
- [Reading past sessions](#reading-past-sessions): `flow audit`, and the words it counts in

## Where each lesson goes

At each checkpoint the agent looks back over the conversation since the last one, and files what it holds. A checkpoint is a handoff, finished work reported, a design question closed, or a plan step built and checked. `/capture` runs the same sweep on demand.

- **Work you decided on** → a ticket.
- **How you like to work** → `## Preferences` in your rules. **A fact about you** → `## The user`. Both come from evidence, such as a correction you gave, and are never announced.
- **A fact about this project that most sessions need** → the project's `AGENTS.md`. A correction true only here goes under `## Rules` the second time you give it.
- **A project fact only some work needs**, such as how it deploys → `docs/context/<subject>.md`.
- **How an outside tool behaves**, such as a library's quirk → `~/.flow/wiki/<tool>/findings/`, shared by every project.
- **Any other lesson worth reusing** → `.flow/findings/<what-was-learned>.md` in the project.
- **A mistake of Flow's own**, such as a rule that never fired → `/flow:review`, where it is switched on.
- **Everything else** → `.flow/inbox.md`, as it came.

A lesson in `~/.flow/` reaches your other computers through [`flow sync`](two-machines.md). A finding never holds a detail of the project or its client, since your Flow home goes to GitHub.

## From finding to rule

A finding sits in a file until `/flow:file-findings` moves it where it changes behavior. Type it when `flow next` says closed tickets wait:

```text
unfiled: 1 closed ticket not yet filed   (flow ls --unfiled)
```

1. **It reads everything waiting**: `.flow/inbox.md`, `.flow/findings/`, and each closed ticket's `issues.md` and `reports/`.
2. **It sorts each item to the file it belongs in**: your rules, the project's `AGENTS.md`, a skill, or a rule file loaded only for one kind of file.
3. **It shows the plan and stops.** Nothing is written before your yes.
4. **It writes each item**, and gives a new rule a [rule check](rule-checks.md) where a script can test it.
5. **It marks each ticket it read** with `flow file`, so the ticket leaves the unfiled list.

A subject several findings point at, with no skill for it yet, gets flagged in the inbox. Several flags on one subject earn a skill.

## What Flow knows about outside tools

An outside tool is anything your project uses that someone else makes: a library, a service, a command-line tool. Each one gets a folder in your Flow home, shared by every project:

```text
~/.flow/wiki/next.js/
├─ index.md                         where the docs are, and which page answered what
├─ research/<question>.md           one report per question about this tool
├─ findings/<what-was-learned>.md   lessons learned using it
└─ downloads/                       its docs and source code, on this computer only
```

`/flow:research` answers a question about a tool in a fixed order, cheapest first:

1. **The tool's skill**, where one is loaded.
2. **The tool's folder**: a report or finding whose name matches the question answers it, with no request outside. Research also prints the count, `next.js: 7 findings, no skill`, so you see when a tool has enough findings to deserve a skill.
3. **`index.md`**, for the page that answered the same topic last time.
4. **Outside**: Context7, a free service answering from a library's docs, for a quick question. The downloaded docs, for building against the tool. The tool's GitHub issues, for a bug. Web search last.

A report true only for this project, such as one about its users, goes in the project's `docs/research/` instead. A report about no single tool, such as a comparison of services, goes in `~/.flow/research/`.

## The agent's mistakes

`/flow:review` looks back over how Flow did, and records 2 kinds of thing. It is off until you switch it on: `flow skills on review --global`.

- **A study case**: one mistake, with the output that shows it, the rule that should have stopped it, and later the fix. Cases are grouped by issue, the kind of mistake, so the same mistake made 3 times shows as a count of 3 rather than 3 stories.
- **A workflow note**: one dated line in `~/.flow/workflow-notes.md`, for friction or a gap with no single failure behind it.

```console
$ flow cases issues
ISSUE            CASES  OPEN  LATEST      RULES
answered-unread  1      1     2026-10-02  read-before-answering
skipped-walk     1      1     2026-10-02  walk-a-real-case

2 issues, 2 cases  /home/me/.flow/study-cases
```

A case is never deleted. Once a change fixes it, `flow cases edit --status fixed --by <file>` records the file that changed. [Commands](reference/commands.md#cases) covers every `flow cases` command.

## The failure log

Every failure of something Flow runs or chose gets one line in `~/.flow/logs/failures/<month>.jsonl`, on this computer:

```json
{"at":"2026-09-27T14:02:11Z","source":"hook","what":"mcp__supabase__list_tables","error":"401 Unauthorized","project":"/home/me/code/shop","session":"b81748eb-…","call":"toolu_01…"}
```

- **A hook** logs a tool from a plugin or an MCP server that failed, a Flow command that exited with an error, and an API error that ended a turn.
- **Flow's background jobs** log what fails with nobody watching, such as a ticket sync.
- **The agent** logs what no hook can see, such as a subagent that changed files and sent no record.

A command of the agent's own, such as a search that found nothing, is never logged. A background job that failed stays open until it next works. Until then the status line shows `⚠ 1 Flow issue: ask Claude to fix them`, and asking does it: the agent runs `flow doctor` and fixes each line.

## Reading past sessions

`flow audit` reads the record Claude Code keeps of every session into a database on this computer, so you can ask what happened: which files a session read, where its tokens went, which rule it ignored. Claude Code deletes a session's record after a year under Flow's settings, so a mistake can still be traced months later. `flow audit keep` saves one for good.

It counts in 2 units:

- **A turn**: one message you sent, and everything it caused.
- **A segment**: one unbroken context window. A compaction starts a new segment inside the same session, and `/clear` starts a new session.

Read the cheapest view first, and the conversation itself last:

1. **`flow audit summary <session>`**: a few lines of totals.
2. **`flow audit timeline <session>`**: every tool call in order, one line each.
3. **`flow audit ls`** and **`flow audit sql`**: any question across sessions.
4. **`flow audit read <session>`**: the conversation, for the turns the others pointed at.

`flow audit sql` takes any SQL query over these tables:

- **`session`**: one row per session, with its project, branch, dates and totals.
- **`segment`**: one row per context window, with what ended it and its size before and after.
- **`turn`**: one row per message you sent, with its tokens, tool calls and errors.
- **`tool_call`**: one row per tool call, with its input, and whether it failed.
- **`file_touch`**: one row per file read or changed. Its `confidence` says how sure the path is: `exact` from the tool itself, `parsed` from a shell command, `declared` where Claude Code named the file.
- **`event`**: one row per line of the record.

[Commands](reference/commands.md#audit) covers every `flow audit` command.
