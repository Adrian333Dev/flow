# Study case — implemented a draft the user was still thinking out loud about

Date: 2026-08-10. Context: rewriting `global/CLAUDE.md`. Agent: Claude Opus 5.

## What the user sent

A long spoken message reacting to `tmp/claude-md-draft.md`. Roughly a dozen separate reactions. Their shape matters more than their content:

- **Hedged**: "I don't know which one is really better here." "Maybe we should keep it as is." "Maybe, I don't know, maybe not so much." "I'm not sure they actually belong in the CLAUDE.md file."
- **Directional, not specified**: "needs to be significantly reduced", "we can possibly make the script section a little more concise", "I don't know the exact final version, but we could say something like…"
- **A question asked outright**: "Now I wonder what are your thoughts on all this."
- **One flat rejection**: "I fully disapprove the workflow section."

Not one sentence in it was an instruction to write.

## What the agent did

Rewrote `global/refs/workflow.md` and then rewrote `tmp/claude-md-draft.md` end to end — every section, including the sections the user had explicitly marked as unresolved — and reported the finished result with line counts.

## Why it was wrong

The user was **thinking out loud and asking for an opinion.** The message ended with a direct question. Answering a question by rewriting the artifact skips the part where the user gets to disagree.

Three of the changes turned out to be wrong, and all three were wrong in ways discussion would have caught first:

1. The approval rule kept a delete clause the user had already said twice was unnecessary, defended with an argument ("the guard isn't built yet") the user had already ruled out of scope.
2. The `## Workflow` section was shortened when the user had asked for it to be **removed**. The agent argued the point instead of reasoning through the user's argument.
3. The `## Rendering` section stayed in `CLAUDE.md` after the user had said, twice, that it belongs back in the `explain` skill.

Because the artifact was rewritten before the disagreement happened, all three had to be unwound.

## The tell the agent missed

**Hedging is the signal.** "Maybe", "I don't know", "I'm not sure", "possibly", "or something like that" mean the user has not decided. A decided instruction has no hedge in it.

A second tell: **the message ends with a question.** "What are your thoughts on all this" is not a work order.

A third: **volume of feedback is not intensity of approval.** A long message with twelve reactions is twelve things to discuss, not twelve tasks. The agent appears to have read length as mandate.

## Root cause

The agent treated its own agreement with the feedback as the approval. Each individual point sounded correct, so it acted on all of them. But "the user is right" and "the user said go" are different facts, and only the second one licenses an edit.

## What would have been right

Reply with reasoning on each point, a recommendation where the user hedged, and a stated disagreement where the agent disagreed. Zero file writes. Wait.

## Related

Not the first time. The user's words: *"you did make that mistake so many times."* This case exists because a rule in the repo's own `CLAUDE.md` — "Feedback is not approval" — was already written, already loaded, and still did not fire.

That is the finding worth keeping: **the rule as written was not enough.** It defines approval ("do it", "go ahead") but never names the counter-signal. An agent scanning for "did they say no" finds nothing and proceeds. The rule needs to name what hesitation looks like, not only what consent looks like.
