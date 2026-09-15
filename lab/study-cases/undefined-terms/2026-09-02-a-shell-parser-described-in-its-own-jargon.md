---
date: 2026-09-02
project: flow
model: claude-opus-5
effort: xhigh
rule: define-from-zero
status: open
---

# A shell parser described in its own jargon

Moved from `lab/context/shit-explanations.md` on 2026-09-15. The user asked what 5 things had changed during the audit build. One item was about how shell commands get parsed, and the paragraph explained the parser in terms the reader had never met. The model was found afterwards in the session transcript.

## What the user sent

> "it's one of the shittiest explanations I ever had seen, I literally didn't understand a single fucking thing from that line"

> "we still have similar issues literally in your whole response"

## What happened

Sent, whole:

> A shell command is prose as often as it is a command. The first pass recorded the, a and and as files read 46 times, out of heredoc bodies: a line reading `tail the log` parses as a `tail`. It also recorded `2>/dev/null` as a file, and `/^##` 63 times from a sed pattern. Heredoc bodies are stripped before parsing now, redirections are dropped, a path needs a slash or an extension, and sed's own grammar decides which argument is the script.

## Why it was wrong

1. **No term is defined before use.** "Heredoc bodies", "redirections", "sed pattern" and "parsing" are shell programming jargon, and the reader had met none of them.
2. **The example explains nothing without the term it illustrates.** "A line reading `tail the log` parses as a `tail`" needs the reader to know what a heredoc body is before it says why English words were read as commands.
3. **`2>/dev/null` is written as if the reader knows it.** It is a shell idiom for "throw the error messages away", and the parser mistook it for a filename. Neither fact appears.
4. **"sed's own grammar decides which argument is the script" assumes 3 things**: that the reader knows sed, knows it has a grammar, and knows what "the script" means in that grammar.
5. **4 separate fixes are joined by commas in one sentence.** Each fix addresses a different problem, and no problem is ever stated, so the reader cannot match a fix to its defect.

## Root cause

The paragraph describes what the parser does instead of what went wrong: every fix is stated without its problem, and every term without its definition.

## What would have been right

Define each term in one plain sentence before using it. State each problem, then its fix. One sentence per idea. The rewrite in the same conversation did this for the same material: it defined a heredoc as "a block of plain English inside a command", explained why `tail the log` was misread, said `2>/dev/null` means "throw error messages away", and described `sed -n '/^## Heading/p' file.md` by saying which word is the pattern and which is the file.

## The rule that failed

3, all loaded: `define-from-zero`, `one-idea-per-sentence` and `name-the-subject-first`. Every fault here already had a rule, so the case produced no new one and stays open as evidence against those 3.
