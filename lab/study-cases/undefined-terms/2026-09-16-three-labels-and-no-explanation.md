---
date: 2026-09-16
project: flow
model: claude-opus-5
effort: xhigh
rule: explain-never-label, define-from-zero
status: open
---

# 3 labels and no explanation

Written during the lab cleanup. The user had approved deleting a set of design records, and the reply proposed what had to be rescued before 2 of them went. It named 3 things and explained none of them: "the 4 rules for what may go in a project's `docs/context/`", "the routing test", and "how a plugin is switched on per project".

## What the user sent

> "fucking say that First, a point in the 'Delapse: design-project-docs.md needs 2 rescues before it goes' section Add shit explanation like that was just one other example. I literally didn't understand a single fucking thing from that line. Also, same issue kinda goes for the next line as well, although it's a little bit more clear, but you didn't fucking clarify what the fuck is routing test."

> "in the design-skills.md file what 'How a plugin is switched on for one project, off by default.' means? Like what's exa- you know like what's the top topics about what plugin are you fucking talking about?"

> "I also noticed that we're actually going to rework on the explain section of this skill because we still have a lot of explain issues and you keep making and making and making them which keeps pissing me off so much."

## What happened

3 sentences, from 2 replies in the same session:

> **The 4 rules for what may go in a project's `docs/context/`.** `references/workflow.md` carries one compressed line: *"durable project facts, one file per subject: a verified command, a path, a settled convention."* The entry test, facts-never-process, and rewrite-never-append are nowhere.

> **The routing test**, *would this sentence be true in a different project?* The record claims `write-skills.md` carries it. It does not. Nothing does.

> - **How a plugin is switched on for one project**, off by default.

## Why it was wrong

1. **A rule count is not a rule.** "The 4 rules" tells the reader there are 4 of something. It never says what any of them requires, so the sentence carries a number and nothing else.
2. **A folder named but never described.** `docs/context/` is a project folder holding plain facts about that one project. The reader has to already know that for any of the 3 sentences to parse, and nothing in the message says it.
3. **A test quoted without its answers.** "Would this sentence be true in a different project?" was given as the routing test. A test is a question plus what each answer does, and the 2 answers, a skill or `docs/context/`, were left out.
4. **A word standing for a thing the reader never met.** "Plugin" meant a bundle installed from a marketplace that can carry skills, subagents, commands and hooks at once. It was used as though it meant one skill.
5. **The 3 failures are one move, repeated.** Each sentence named a section of a record and let the name stand for the content. That move is forbidden in as many words by `explain-never-label`: *a label, a pointer and a quote are not explanations*.

## Root cause

The rule that forbids it was loaded and correctly worded, so the wording is not the fault. `home/CLAUDE.md` → `## Explaining` is 42 lines holding 20 rules, and the 2 that bind hardest, `define-from-zero` and `explain-never-label`, sit among 18 about sentence shape and message order. A section that size is read as a style guide rather than as a gate each sentence has to pass.

## What would have been right

For each of the 3: one sentence saying what the thing is, then its content in full. The corrected version ran to 4 paragraphs where the original ran to 3 lines, and the user read it without complaint.

## The rule that failed

2, both loaded, in `## Explaining` of the repo `CLAUDE.md`: `explain-never-label` and `define-from-zero`.

## What it produced

`backlog.md` → `## V1` → `### Rules and always-loaded files` gained the item to rework `## Explaining` against the study cases, separately from the final sweep's writing pass, because this is a structure fault and that pass is a wording pass.
