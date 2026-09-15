---
date: 2026-09-13
project: flow
model: claude-opus-5
effort: xhigh
rule: most-common-word, define-from-zero
status: open
---

# "Prose" in a heading, and the plain word one line under it

Moved from `lab/context/shit-explanations.md` on 2026-09-15. Designing the toolbox rewrite, in conversation. The user had approved the design in outline, and the reply laid out the build for a final go. Before the build list, the reply raised one gap: the text in today's group files that is about no single tool. The model was found afterwards in the session transcript.

## What the user sent

> "Okay, first of all, I fucking told you 20 times to use the fucking plain language. Now, what the fuck do you mean by pros? What the fuck is pros? Are you talking about a description? What are you exactly fucking talking about? I told you 20, 50, 100 fucking times to follow the explained rules and do not use the basic language, common and basic language. Do not use any terminologies that are not very clear."

## What happened

The opening sentence and the start of the section, whole:

> Before you give the go, one gap needs a decision: the prose the group files hold today, which no single tool owns.
>
> ## Group prose moves to a `README.md` in each group folder
>
> Today's group files carry text that belongs to no one tool. `video.md` alone has:

From the build list in the same reply:

> - **`commands/fs/tree.js`:** `--into <file>` replaces the tree between 2 marker comments in that file.

## Why it was wrong

1. **"Prose" carried the whole section and was never explained.** The word sat in the opening sentence and in the heading, the 2 places read first. The user heard "pros" and could not tell whether it meant a tool's description.
2. **"Marker comments" was never explained either.** Found on re-reading, never named by the user. Nothing said these are 2 hidden lines, such as `<!-- tree -->`, placed in `README.md` to mark where the generated tree starts and ends.

## The tell that was missed

The plain word was already in the section. The first body line says "text that belongs to no one tool". The rare word took the heading, and the common word got the line under it.

## Root cause

"Prose" is the repo's own working word. `references/style.md` uses it, and so did the earlier entries in the file this case came from. A word read constantly in Flow's files felt ordinary. So the check for a common word ran against those files instead of against the user.

## What would have been right

"The general text in the group files: warnings, advice and section intros that are about no single tool."

## The rule that failed

2, both loaded, in `## Explaining` → `### Words` of the repo `CLAUDE.md`: `most-common-word` and `define-from-zero`. `references/style.md` §5 says the same: one word per concept, and the common word. Rules already cover every fault here, so the case produced no new rule and stays open as evidence against those 2.
