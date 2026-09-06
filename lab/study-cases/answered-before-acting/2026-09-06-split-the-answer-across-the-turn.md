---
date: 2026-09-06
project: flow
rule: assume only the final message is read
status: fixed
fix: home/CLAUDE.md
---

# Split the answer across the turn, so the user read only the tail

Reported by the user on 2026-09-05, in the design session that produced `## The turn`. The failing sessions ran Claude Sonnet 4.6 and none of their transcripts was kept, so the account below is the whole record.

## What the user sent

> "what Sonic 4.6 does is that you know first let's say it immediately starts responding to me it immediately starts responding to me with you know a lot of you know like details because you know let's say my feedback was very detailed it generates very you know large details and then it assumes that I have read it and it immediately starts making changes and after it's complete usually it's last you know I usually only see its last response which is usually you know confirmation of few changes which is usually you know much concise and it doesn't know that I actually missed and a lot of the you know details and messages it generated in the middle of the you know like work so I only see the last message and I'm able to only copy the last one which is very very annoying."

And the shape that costs most:

> "And we have even worse case scenarios where you know basically it generates a message and the mix edits and then generates a message and the mix edits. So basically, even worse version of it where even the message is split between several changes, which is you know like very very annoying situation."

## What happened

The agent answered a long feedback message in full before touching a file, made its edits, then closed with a short confirmation of the changes. In the worse shape, the answer came in several pieces with edits between them.

## Why it was wrong

The substance landed in a message the user never reads. Only the last message is on screen when the work finishes, and only the last message can be copied out, so the whole answer to detailed feedback is lost while the agent believes it was delivered.

The split shape costs more than lost text. The user cannot tell which parts of the reasoning survived into the edits, because the reasoning and the edits are interleaved and only the tail is visible.

## The tell that was missed

**The user reads the turn from the bottom.** Anything above the final message is scrollback, and the copy action takes one message. Where the answer sits decides whether it is read at all, and length has nothing to do with it.

## Root cause

The agent optimized for responding early, treating each message it emits as delivered on arrival.

## What would have been right

Name each action in one line as it happens, so the work is visible while it runs. Put the entire answer, plus the report of every change, in the final message. The user asked for exactly this:

> "it should only address me at the end, like it can, you know, like include its reasoning, at least you know, calling what it does while it's making the edits. But it should only address me at the end, it should assume that the user is only reading the final message. So, final message needs to include everything, including all the you know, like changes being outlined."

## The rule that failed

`Assume only the final message is read`, in `home/CLAUDE.md` → `## Explaining` at the time. It says what the final message must contain and never says the answer may not appear anywhere else, so an agent can write the answer up front, repeat it at the end, and break nothing the rule states.

Fixed 2026-09-05 by `home/CLAUDE.md` → `## The turn`, steps 4 and 5, which set the order rather than the contents: one line per action while working, then *"Every action first, then one answer."* Both old rules, `Assume only the final message is read` and `Think out loud while you work`, were deleted in the same edit.
