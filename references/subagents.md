# Subagents

Read before starting a subagent. A fresh subagent reads everything again, so it costs what its input weighs.

## Whether to send one

- **Count the input first.** About 40k tokens or less → read it here. A source over that → one `general-purpose` subagent that returns the lasting facts only.
- **Send a question one source can answer.** Never cut one body of evidence into chunks across agents: analysis is a loop of reading for the shape, planning, reading what the plan names and planning again, and the loop stays here.
- **A file every agent needs** → read it here once, and put its facts in each brief.
- **A side task that needs what this session read** → a fork.
- **You are the orchestrator.** You analyse, plan, and plan again after each report, so agents never run uncoordinated.

## Which model

- **Haiku**: short lookups and decided edits.
- **Sonnet**: a clear spec with an output you can check.
- **Opus**: web research, fact-checking, hard code, risky review, design.
- **Raise the model before the effort.**

## The brief

`/flow:handoff` writes it from its `references/dispatch.md`, in the prompt and never a file.

- **One batch**: a unit of evidence, never a slice by size.
- **A stopping point the brief names**: "stop after these 3 sources and write the file". Never a time limit.
- **It writes its file as it goes.** Past about 150k tokens it writes what it has and finishes.
- **It starts another subagent only with a serious reason, stated in the brief.** A chain can be right. A chain nobody needed once passed one question up through 3 agents.
- **It cannot ask the user.** A question it has ends its report. Ask, then resume the same subagent with `SendMessage` and the answer.

## While it runs

- **A reply to a finished notice is very short**, and may carry one line for the user.
- **A message from the user gets a full reply.**
- **The final reply waits until every subagent is done.**

## When it reports back

- **Judge its work by the change record**, never by its report. A "Stop hook blocking error" from `PostToolUse:Agent` is Flow's change record, never a failure: the diff of what the subagent's own tool calls changed. It arrives with the finished notice, and none means no file changed.
