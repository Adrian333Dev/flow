---
date: 2026-09-06
project: flow
rule: never re-ask a settled point
status: fixed
fix: home/CLAUDE.md
---

# Listed proposals the user never argued with as open questions

Reported by the user on 2026-09-05, in the design session that produced `## The turn`. The failing sessions ran Claude Sonnet 4.6 and none of their transcripts was kept, so the account below is the whole record.

## What the user sent

> "So, in those scenarios, if I don't push back on any question or any suggestion or something, that almost always means that I have nothing against it, which means I have approved it. And, you know, like, the agent keeps making these mistakes, you know, like, it comes up with, you know, like, large, you know, number of proposals in different areas, in different decisions. But, you know, in the upcoming messages, it keeps bringing them back as open questions or undecided questions, which is just incorrect. You know, it needs to assume that if I didn't address something, it obviously needs to assume that I agreed on it."

They set the boundary in the same breath, from a case that had already happened:

> "But there might be a little bit of confusion here. For example, we previously faced such a scenario where it assumed that I agreed on something. But the issue was that it didn't actually propose creating some skill. And I didn't push back on it. And it assumed that I agreed on it. But the problem was that it didn't really clarify the skill. Maybe it mentioned something very minor about it. But it didn't fully clarify that it wants to create some type of skill or something. And it didn't give any details about the skill."

## What happened

The agent made a batch of proposals across several decisions. The user pushed back on some and said nothing about the rest. In later messages the agent listed the unopposed ones again, under a heading calling them open or undecided.

## Why it was wrong

The user reads the same proposal twice and has to close it twice. Worse, listing a decision as open reads as reopening it, so a point they thought was banked comes back for a second argument.

The boundary case shows the opposite cost. Silence over a skill that was mentioned in passing, never described and never proposed, is not approval of building it. Reading that as a yes produces work nobody asked for.

## The tell that was missed

**Selective pushback is the signal.** A user who objects to 3 items out of 10 read all 10. Objecting to some and not the rest is the answer to the rest.

**What separates the two cases is whether the proposal was spelled out**, never how the user reacted. The reaction is identical in both: nothing. Silence approves what the user could see. A thing named in passing, with no shape given, was never on the page for them to disagree with.

## Root cause

The agent tracked approval as an explicit event, so anything without a spoken yes stayed on the open list forever.

## What would have been right

Treat every proposal the user read and did not argue with as settled, however many topics have passed since. Where the proposal was never spelled out, propose it properly rather than listing it as open.

## The rule that failed

`Never re-ask a settled point, and never list one as open`, in the repo's own `CLAUDE.md`, set by the user on 2026-09-02 after the same 2 points came back across 3 messages. It states the prohibition and never states the test, so an agent unsure whether something counts as settled has nothing to check against.

Fixed 2026-09-05 by `home/CLAUDE.md` → `## The turn`, step 3, which writes the test both ways: *"Agreed: proposed by you, never argued with, however far back. Not agreed: anything you never spelled out."*
