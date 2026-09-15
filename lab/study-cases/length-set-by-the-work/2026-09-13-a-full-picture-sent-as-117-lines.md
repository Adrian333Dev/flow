---
date: 2026-09-13
project: flow
model: claude-opus-5
effort: xhigh
rule: short-is-the-default, size-by-worth, name-the-deciding-argument
status: open
---

# A full picture sent as 117 lines, and a split argued from commit counts

Moved from `lab/context/shit-explanations.md` on 2026-09-15. The user named it a major failure. Designing how tools get added to the toolbox, in conversation. The user asked 4 things: whether a toolbox-only script should split off from `util github bookmark`, a shorter and more generic description for `/research`, relative paths in a collection's list, and "the full picture" of the commands with their own flow of saving to the inbox and filing later. The model was found afterwards in the session transcript.

## What the user sent

> "your last response is mostly bloat. Like, you could have explained all this in, you know, like, almost, you know, like, much, you know, like, much shorter response. You came up with a very large response where, you know, like, you just wasted all the wasted so much tokens and, you know, really wasted my time as well."

> "one of your reasons was because it would involve multiple commits. That's very stupid reason. [...] we shouldn't fucking make design decisions Based on how many commits they involve or anything"

> "finding an existing tool that does the job is too vague and it doesn't really explain what that tool actually does."

## What happened

The reply ran 8,361 characters over 117 lines: 4 sections, the last with 5 subsections, 3 code blocks and about 40 bullets.

The split's opening argument, whole:

> **Why:** the tool file's layout and the code that writes it should change in one commit. Today the writing code lives in `util`. Adding a field to a tool file takes a commit in `lab/util`, a commit in Flow, and a `git pull` in `~/code/util` before the `util` command picks it up. Inside the toolbox it's one commit.

Bullets from the "Updating" subsection:

> - **It writes each file whole before replacing the old one**, so a stopped run never loses notes.
> - **One run now** gives the 155 current tools their READMEs and the 12 collections their lists. That's under 1,000 requests to GitHub, and the limit is 5,000 an hour.

The proposed description:

> "Reads what an external tool actually does, from its docs and source. Finds any existing tool that does the job."

## Why it was wrong

1. **The walk's findings went into the reply.** Write order, stopped runs, request counts, rate limits, skipped hand-written files and the proof that type guessing fails were all checks run before showing the design. None changed what the user had to decide. About 20 lines carried the 4 answers.
2. **"The full picture" was read as every detail.** The user wanted the commands and the flow, one line each.
3. **The split was argued from the number of commits.** A commit count is a cost of where code lives, never a design reason. The real reason was never stated: a command meant for any repo should not carry one repo's file format.
4. **The description swapped concrete words for "any existing tool that does the job".** That phrase says nothing about what the skill does.

## Root cause

`attack-before-showing` and `walk-the-awkward-cases` produced many real findings. `show-the-data` read as permission to show them all. The work done set the length, when what the user needed to decide should have.

## What would have been right

One line per answer, the flow as 4 numbered commands, and a finding only where it changes the design.

The case proposes a rule, not yet in any `CLAUDE.md`: a walk's findings stay out of the reply unless one changes what the user decides.

## The rule that failed

3, all loaded, in the repo `CLAUDE.md`: `short-is-the-default` and `size-by-worth` in `## Explaining`, and `name-the-deciding-argument` in `## Judgment`.
