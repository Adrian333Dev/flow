---
date: 2026-09-12
project: flow
model: claude-fable-5-1
effort: xhigh
rule: define-from-zero, name-the-subject-first, explain-never-label, show-the-data, whole-then-parts, never-point-at-an-earlier-message
status: open
---

# A contribution pipeline explained twice, both times from inside the design

Moved from `lab/context/shit-explanations.md` on 2026-09-15. Designing the management skill, in conversation. The user asked how findings reach a shared set of stack skills, how the maintainer contributes, how a multi-week design becomes reusable knowledge, how private skills work, and what `browser-harness` does that is worth taking. The first reply was rejected at its opening paragraph. The user asked for a rewrite from scratch that assumed nothing had been read, and the rewrite was rejected section by section. Both messages were Claude Fable 5.1, recorded at the user's request, because the case is worthless without the model that wrote it.

## What the user sent

On the first message:

> "I didn't understand a single fucking thing from that, you know, from that first paragraph in the The whole system in one paragraph section! Like, what the fuck is, you know, you said list of trees. What's that list of trees? Where did it come from? You're not fucking clarifying things here. You like, you assume that I already know most of the design, and you, you know, like, you're only pointing out in some other parts. You need to fucking explain the whole fucking picture here. Like, assume that I didn't read your solution at all."

On the rewrite:

> "I'm right now in the part one, and already it doesn't make sense to me. So, firstly, you need to consider like I don't understand what you're exactly referring to here, but you need to consider that like we have the skill folders in two phases, right? One is in the development phase, in the you know, like clone of the flow repo, right? [...] But once we actually know, like, install them on the machine, they are no longer going to be under you know, like, in under that folder in the groups, but they are will be directly you know, like, at least seem linked directly under the global .claude folder, right? And I'm really confused here. What phase are you referring to here?"

> "I'm looking at those four paths you have listed. And none of them really makes sense. The first one shows ~/.flow/sources! Like when it comes to that path, firstly, like you know, we can only have it in that path after the installation, right? And secondly, that path isn't, you know, like ClaudeCode is not going to pick that path, right? That's completely unrelated path. [...] But where did that, you know, like, third path came from? And what the fuck is that flow-corpus directory is about?"

> "you said, you know, like if we have you know two skills with the same name, the later one wins. Like, what does that exactly mean for us? You're not really clarifying what later one really means."

> "in part 4 I didn't understand "Makes a temporary checkout of the corpus under ~/.flow/tmp/, so your real corpus clone never leaves main." line at all! I also didn't understand the line that comes after."

> "I actually didn't understand the, you know, like last two paragraphs from the Private skills: one rule gives all three cases section at all! So, just another case of shit explanation because you know you're not really You didn't really give me the full picture You only giving me the pieces and you're ex you know like you're talking as if I already have the full picture"

> "that browser-harness: take the lookup, not the separate path Section is you know complete shit as well, like you didn't properly explain it at all. [...] at least fucking explaining me that, you know, look up my key idea that you decided to take from the browser harness. Because I have zero idea what the fuck that means in the first place."

> "you keep making and making and making this mistake again and again and again and again. And I'm really tired at this point."

## What happened

The first message's opening, whole:

> Every machine reads skills from a **list of trees**. A tree is a folder holding skill folders. There are 3: Flow's clone, the shared corpus, and your own tree. A **contribution is always a new file**, never an edit to a file somebody else reads. The only act that edits a shared body is a **fold**: one writer, one skill, reading every pending finding and rewriting the skill to absorb them. That one rule set covers the small finding, the multi-week security design, the maintainer, the private skill, and the private extension of a public skill.

The rewrite's Part 1, the part that failed:

> ```
> # ~/.flow/sources
> ~/code/flow/skills
> ~/code/flow-corpus/skills
> ~/.flow/private
> ```
>
> How `flow install` uses the list: for each skill name, it looks through the folders in order and links `~/.claude/skills/<name>` to the last folder that has `<name>/SKILL.md`. When two folders both have one, the later wins, and install prints a line saying so.

From Part 4:

> 2. Makes a temporary checkout of the corpus under `~/.flow/tmp/`, so your real corpus clone never leaves `main`.
> 3. Copies each file into the matching place, `stack/react/findings/2026-09-11-hydration-suspense.md`. A new file never conflicts with anyone.

The last 2 paragraphs of the private-skills section:

> After you publish the basic version in step 4 above, your private `SKILL.md` still shadows the public one, and `flow doctor` says so. You delete your private `SKILL.md` and keep only the private pages. Now the public body keeps improving upstream while your pages stay attached.
>
> This is not the machine-wide overlay you refused. An overlay pastes text into a body for one project. An extension is whole pages in your folder, listed at the bottom, with the public body untouched. A restructured body cannot lose them, because the list is printed, never merged.

From the `browser-harness` section:

> - **Lookup by key.** With 100 knowledge files, the body says which one to read for this run, by hostname or package name, so a run reads 1 or 2.

## Why it was wrong

The first message:

1. **5 new terms in 6 sentences, each defined in one clause.** "Tree", "corpus", "contribution", "fold", "extension". A one-clause definition names a thing and never shows what it does, who runs it, or what it reads. The paragraph named first and never built the meaning.
2. **Nothing said what exists today.** The reader cannot see what "a list of trees" replaces without first being shown the one: a symlink at `~/.claude/skills/<name>` pointing into one clone.
3. **The paragraph summarised a design the reader had never seen.** A summary is only readable by someone who already holds the parts, and a whole made of undefined names is a list of names.

The rewrite:

1. **The list of folders never said who reads it, or when.** An installed machine has the symlinks Claude Code reads at `~/.claude/skills/`, and the clone they point into. The list changes only where a symlink points, is read only by `flow install`, and Claude Code never sees it. None of that was said, so the reader could not tell which of the 2 phases the list belonged to.
2. **A path was shown before its meaning existed.** `~/code/flow-corpus` appeared in a code block as a fact, and the sentence saying it is a proposed second repository came 4 lines later. The file's own path sat as a comment above the 3 entries, so the block read as 4 paths with only 3 explained.
3. **"Later wins" was never defined.** Later means a lower line in the file. Nothing said so, and nothing said why order matters: the private folder is the last line so a private skill beats a public one of the same name.
4. **A git mechanism was described by its effect, with no reason.** "A temporary checkout so the clone never leaves `main`" assumes the reader knows a pull request needs a commit on a branch, and that the stable clone must never carry a local commit.
5. **The private-skills close pointed at 3 mechanisms by name.** "Shadows", "listed at the bottom" and "printed, never merged" each point at a definition in another section.
6. **"Lookup by key" was a label with nothing under it.** Nothing said what a key is, what does the looking up, or what the reader gains.
7. **Every section explained a piece, and none placed it in the whole.** The rewrite defined its terms and kept the first message's structure: a sequence of parts, each assuming the others. The user's diagnosis was exact: "talking as if I already have the full picture".

## Root cause

The design had been built up across 3 sessions inside the model's own context, and both messages were written from that context. Every mechanism already had a name there, so the writing named it and moved on. The rewrite treated "define every term" as the fix, and a definition is a label with one more clause. What was missing both times was the picture of the machine: what Claude Code reads, what points where, what runs when, and only then what each new piece changes.

## What would have been right

Open with the machine as it is today, drawn: the symlinks, where they point, what runs at install and what runs when a skill loads. Introduce each change as a change to that drawing. Show a file only after saying what reads it. Name a mechanism only after the paragraph that showed it working, and name it once.

## The rule that failed

6, all loaded, all in `## Explaining` of the repo `CLAUDE.md`: `define-from-zero`, `name-the-subject-first`, `explain-never-label`, `show-the-data`, `whole-then-parts` and `never-point-at-an-earlier-message`, which applies inside one message too.
