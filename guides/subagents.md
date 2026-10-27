# Subagents

Read before starting a subagent. A fresh subagent reads everything again, so it costs what its input weighs.

## Whether to send one

- **Count the input first.** About 40k tokens or less → read it here. A source over that → one `general-purpose` subagent that returns the lasting facts only.
- **Send a question one source can answer.** Never cut one body of evidence into chunks across agents: analysis is a loop of reading for the shape, planning, reading what the plan names and planning again, and the loop stays here.
- **A file every agent needs** → read it here once, and put its facts in each brief.
- **A side task that needs what this session read** → a fork.
- **You are the orchestrator.** You analyse, plan, and plan again after each report, so agents never run uncoordinated.
- **Size the job before you send it.** You keep the plan, the decisions, the small reads and the synthesis. An agent gets one unit of evidence and one report file. A job that would read over about 100k tokens of sources → split by source group, each with its own file, and read the reports here before the next dispatch. Why: every request of an agent reads its whole window again. In a measured research run, 82% of the cache reads came after 150k.

## Which model

- **Sonnet**: the default, for about 9 jobs in 10: research, design reading, fact-checking, code with a clear spec.
- **Haiku**: short lookups and decided edits.
- **Opus**: only a job that is very tricky, or one where Sonnet already failed. The user ran a whole design on Sonnet, 2026-10-21.
- **Raise the model before the effort.**

## The brief

`/flow:handoff` writes it from its `references/dispatch.md`, in the prompt and never a file.

- **One batch**: a unit of evidence, never a slice by size.
- **A stopping point the brief names**: "stop after these 3 sources and write the file". Never a time limit.
- **It writes its file as it goes.** It cannot restart. At 170k, the session limit, the mod sends it a message that replaces the brief's stopping point: it saves the sources read, the findings and what is left to its report files, then begins its reply with `UNFINISHED:` and their paths. Within a few steps of its final report it finishes instead, because a new agent costs about 4 requests of a full window. The brief needs no word on this.
- **It starts another subagent only with a serious reason, stated in the brief.** A chain can be right. A chain nobody needed once passed one question up through 3 agents.
- **It cannot ask the user.** A question it has ends its report. Ask, then resume the same subagent with `SendMessage` and the answer.
- **A job that needs no rule file, such as a lookup or an idea generator** → a custom agent definition setting `omitClaudeMd: true`. It starts without every `CLAUDE.md`: cheaper, and free of this session's framing. Its tools and skills stay. Its brief carries every rule it needs. An `Agent` call alone cannot drop them.

## While it runs

- **A reply to a finished notice is very short**, and may carry one line for the user.
- **A message from the user gets a full reply.**
- **The final reply waits until every subagent is done.**

## When it reports back

- **A reply that begins `UNFINISHED:`** → the job goes on in a new subagent, briefed by `references/dispatch.md` → `## A continuation`. Read the files it names first: they are the work so far.
- **Judge its work by the change record**, never by its report. A "Stop hook blocking error" from `PostToolUse:Agent` is Flow's change record, never a failure: the diff of what the subagent's own tool calls changed. It arrives with the finished notice, and none means no file changed.
- **Parallel subagents each get their own record.** A file two of them changed in the same window is marked shared, and each record shows only that agent's change.
- **A long record points at a file.** Past about 9,000 characters the biggest diffs shrink to line counts, and the message names a `.patch` file with the whole diff. Read it before accepting the work.
