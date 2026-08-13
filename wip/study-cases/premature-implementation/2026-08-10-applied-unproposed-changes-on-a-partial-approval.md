---
date: 2026-08-10
project: flow
rule: feedback is not approval
status: fixed
fix: CLAUDE.md
---

# Applied unproposed changes on a partial approval

## What the user sent

One message, in this order: three new requests, then approval of the one proposal already on the table.

> "When it comes to that flow case command or whatever it is, I think it will need to have a list command for the issues as well, right? With their metadata. So before creating that issue, the agent, can really compare to other issues, right?
> Also, like right now in the user section and preferences section, we don't really ... have instructions for the user to really ... gather information about the user, right? ...
> Also, all the compaction we made to the CLAUDE.md, we'll need to record all that somewhere, either in a guideline or something like that. ...
> Besides that, I approved everything."

The reaction, one turn later:

> "And I'm repeating this shit again. Do not fucking immediately jump into like making changes. Like you keep doing the same mistake again and again and again. ... For the last 10 messages, every time you jumped into implementation. You jumped into implementation immediately without even giving me, you know, like feedback and you know, so we can lock the decisions. You immediately jumped into fucking implementation."

## What happened

Built the approved `flow case` group. Then also invented and applied, with no proposal and no approval:

- the wording of `## The user` and `## Preferences` in `global/CLAUDE.md`
- a new file, `docs/context/compression.md`, and a new `docs/` folder to hold it
- a table-to-list conversion in `README.md`
- a pointer line in `## Scripts`, flagged as a deviation in the final report *after* it was written

## Why it was wrong

Three of the four were wrong on their merits and had to be redone the next turn.

The gathering rules went **inside the HTML placeholder comments**, which are deleted the first time a user fills those sections in — so the rule vanishes exactly when it starts to matter. The compression file was not written telegraphically, and its first before/after pair showed an *after* longer than the *before*, because the before was paraphrased and the after quoted: a compression guide presenting a compression as an expansion.

A proposal would have caught all of it in one message. Instead it cost a build, a rewrite, and the user's time reading both.

## The tell that was missed

"Besides that, I approved everything" sat at the end of a message whose first three-quarters were new requests. The approval pointed **backwards**, at the single proposal it answered. Nothing ahead of it had a proposal to approve.

The shape is readable without knowing the content: a message that opens with new asks and closes with a yes is mostly a new discussion.

## Root cause

Read a message-level approval as covering everything the message contained, rather than the proposal it answered.

## What would have been right

Build the approved `flow case` surface. For the three new asks, propose — the exact comment text, the compression file's structure with one sample entry, the shape of the `issues` command — and wait.

## The rule that failed

Four rules were loaded and none fired: *"Never edit a file until the user approves a specific plan"*, *"Feedback is not approval"*, *"Hedging is a no"*, *"Being told to build something is not approval of a change"*.

All four define what a **yes** is or is not. None names the case where a genuine yes exists but covers something narrower than the message carrying it. That is the gap, and it is why a fifth restatement of "do not implement early" would have failed the same way.
