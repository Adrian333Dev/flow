---
date: 2026-09-06
project: flow
rule: no edits without approval
status: fixed
fix: home/CLAUDE.md
---

# Restated a clear instruction instead of running it

Reported by the user on 2026-09-05, in the design session that produced `## The turn`. The failing sessions ran Claude Sonnet 4.6 and none of their transcripts was kept, so the account below is the whole record.

## What the user sent

> "I just give the agent, you know, clear instructions. I'm telling it, and the instructions, you know, are very clear, right? I'm telling you that it needs to do following, following, edit, following file, update this to be that. And, you know, it's very clear instructions. There is no conflicts or anything. ... I don't want it to, you know, basically repeat back to me what, you know, what I just told it, right? But it's just you know too often does exactly that which is very annoying."

They called it "probably the most annoying issue ever", and drew the boundary themselves in the same message:

> "It depends on the scenario. Let's say, you know, I just started a session and I tell it, you know, like, very vague instructions, like, do following and following and following. It's not very clear, you know, agent doesn't have the necessary context, let's say. So, in those scenarios, obviously, it needs to, you know, first go, you know, and really reason about it and then, you know, possibly, you know, come up with a, you know, maybe plan it's going to do, right? But not like, you know, in very obvious scenarios."

## What happened

Given an instruction naming the file and naming the change, the agent replied with a restatement of that instruction and stopped. No edit.

## Why it was wrong

The user spends a full round trip to be handed back what they just dictated. Nothing moves. The instruction was already executable: naming the file and the new content is the whole of a plan for a one-file edit, so there was no plan left to propose.

## The tell that was missed

**A clear instruction names its own target.** Which file, and what it should say. Nothing was left for a proposal to decide.

**Position in the session is the second tell.** The user says this arrives mid-session, after context is built, never on the first turn. A vague opener with no context is the case that does earn reasoning first, and the agent treated both the same.

## Root cause

The approval rules were written only as prohibitions, so they say what approval is not and never say what to do when approval is plainly present.

## What would have been right

Make the edit. Report it in one line.

## The rule that failed

`No edits without approval`, in `home/CLAUDE.md` at the time. The rule was loaded and it did fire, in the wrong direction. It was written against a different model, and the user says so:

> "the reason we added that is that previously ... in the middle of you know, discussion where we haven't you know, like really luck decisions, we still you know, like brainstorming, we still discussing and designing, it would just jump into action and start making changes without you know, we having you know, like fully approved a plan, which was very, very annoying. And so, we basically added that rule to prevent that ... which kind of worked, but oftentimes it just backfires in you know, some of the models, like for example, Sonnet 4.6."

**A rule stated only as a prohibition inherits whatever the model already leans toward.** An eager model reads it as permission, a cautious one as an instruction to wait, and the same words produce opposite behavior.

Fixed 2026-09-05 by `home/CLAUDE.md` → `## The turn`, step 1, which names the default action on both sides: *"Thinking gets a reply: test it, disagree where you disagree, recommend. An instruction gets work, never a summary of itself."*
