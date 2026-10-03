# Approval

How the agent works with you under Flow's rules: what waits for your yes, what one yes covers, and how the agent replies.

## Table of contents

- [Instruction or thinking](#instruction-or-thinking): what decides whether the agent edits anything
- [Nothing is built without your yes](#nothing-is-built-without-your-yes): the proposal, your approval, and silence
- [One yes runs to the end](#one-yes-runs-to-the-end): what a single approval covers
- [How the agent replies](#how-the-agent-replies): one reply, short, one section per topic
- [Your rules file](#your-rules-file): where these rules live, and changing them

## Instruction or thinking

The agent sorts every message you send into one of 2 kinds:

- **An instruction** names the change or approves a plan: "do it", "go ahead", "apply that". It gets work.
- **Thinking** is everything else: a question, a "maybe", a correction, a new idea, feedback. It gets a reply and no edit.

"Build me an export" starts the discussion about what to build. A long list of feedback is a list of topics to answer, never a list of tasks.

The agent tests what you say before agreeing. It checks the claim against the code, the docs and its own reasoning. Where it disagrees, it says so once, with the argument, and then you decide.

## Nothing is built without your yes

Before any edit, 2 messages must exist: the agent's, saying what would change, and yours, approving it.

```text
You:    maybe the export should be CSV, not PDF?
Agent:  CSV fits better: your users open it in Excel, and PDF needs a layout. I recommend CSV, with one row per expense.
You:    go ahead
Agent:  editing src/export.ts: writes CSV in place of PDF
```

- **Silence is a yes.** A proposal you never objected to counts as agreed, however many topics ago it was. So the agent never asks you to confirm one.
- **A delete is the one yes it asks for**, even inside an approved plan.
- **Only what it spelled out is agreed.** A change it never described needs its own proposal, and so does an idea raised in the same message that approved something else.
- **A new decision mid-build stops the build.** The agent says what it would decide before doing it.

2 things it does without asking:

- **It skips a Flow step that would make the work worse**, and names the step and why.
- **It fixes what breaks**: it reads the error, fixes the cause, and runs the command again. A fault inside Flow's own files is reported to you instead, with a workaround for the task in hand.

## One yes runs to the end

One approval covers the whole build: every file the change makes out of date, the tests, and the editing pass every written page gets. The agent never stops halfway to report and wait for a second go.

Inside a phase, 2 moments always wait for you: the plan before building, and the finished work before `done`. [Phases](phases.md) covers both.

## How the agent replies

One message from you, the agent's work, then one reply. During long work it sends one line saying what is running. The last message carries the whole answer and every change made, since it is the one you read.

- **One section per topic you raised**, in your order, none dropped.
- **Each heading states its answer**: "The cache is the bottleneck", never "Cache performance".
- **Short by default.** Length comes from how complicated the topic is, never from the work behind it.
- **One recommendation**, and what the other options lose, rather than a list of options.
- **An example of the data**: a file, a record or an output is shown, never only described.
- **Every new term defined** in plain words before it is used.
- **No "you're right" and no apology.** Where it changed its mind, it says what is now true.

The [reminder](sessions.md#while-a-session-runs) beside each message keeps these rules in front of the agent in a long conversation.

## Your rules file

Every rule above lives in `~/.flow/AGENTS.md`, which every session loads. Each rule carries an id, such as `build-what-was-agreed`, so a correction can name it. The setup session wrote the file from Flow's template and your old rules. After that it is yours: edit any rule, and [`flow sync`](two-machines.md) carries the file to your other computers.

2 sections start empty and fill as sessions learn about you:

- **`## The user`**: facts about you, such as the languages you work in.
- **`## Preferences`**: how you like to work, taken from your corrections.

[Learning](learning.md) covers how a line gets there.
