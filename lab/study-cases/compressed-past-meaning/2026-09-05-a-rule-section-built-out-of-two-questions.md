---
date: 2026-09-05
project: flow
model: claude-opus-5
effort: xhigh
rule: name-it-never-point, a-heading-states-its-answer, one-idea-per-sentence
status: open
---

# A rule section built out of 2 questions, neither of them answered

Moved from `lab/context/shit-explanations.md` on 2026-09-15. The user asked for a new `CLAUDE.md` section fixing 3 agent behaviors: repeating a clear instruction back instead of doing it, re-raising settled points as open, and splitting one answer across several edits. The reply proposed a section named `## Acting`, rejected 3 times in one session. `## The turn` is what finally replaced it. The model was found afterwards in the session transcript.

## What the user sent

> "if you look at the acting section, it's not in plain language, it's been structured in a complex way. Just make sure it's very plain, very clear. Like for example you say "A change named with its target is one", That's very confusing and very unintelligible sentence. That sentence doesn't make any fucking sense. You had to come up with a much clearer sentence there."

> "what's the scope question in the acting section? That doesn't make any sense. Like, what the fuck is the purpose of it? You don't really clarify what that question is fucking for, right? That's, you know, complete nonsense section. The whole acting section is complete nonsense and unintelligible."

## What happened

The proposed section, whole:

> ## Acting
>
> Two questions, in order, every turn.
>
> **Is this an instruction to act?** A change named with its target is one, and it gets done rather than repeated back. "Go ahead" is one. A hedge, a question, a reaction, or a list of feedback is not, however much the user agrees with themselves.
>
> **What is in scope?** Everything the conversation named and the user did not argue with, back to the last thing they did. Nothing you would be writing for the first time here.

## Why it was wrong

1. **"A change named with its target is one."** The word "one" reaches back across a sentence boundary to "an instruction to act" in the heading above. The reader has to carry the heading into the next sentence and substitute it in.
2. **Both headings ask instead of answering.** Under a heading that asks, every sentence reads as evidence for one side or the other, and the reader never learns what the section wants them to do.
3. **The second heading never says what the question is for.** The section asks "what is in scope?" and never states that scope means how much of the agreed work to build in this turn. The user named this fault directly.
4. **"However much the user agrees with themselves" carries no meaning.** It was compressed out of the idea that a long approving message is still discussion, and nothing of that idea survives.
5. **"Nothing you would be writing for the first time here" hides its own subject.** The rule is about not inventing material the user never saw. The sentence never says invent, never says propose, and leaves "here" undefined.

## Root cause

The section was written in the compressed style of the bullets already in `home/CLAUDE.md`, matching the surrounding file instead of `style.md`. Those bullets are the text the user had just ruled unreadable, so matching them reproduced the defect.

## What would have been right

Say what the thing is before arguing about it. Make every heading a claim, never a question. Name the subject of every sentence inside that sentence. The rewrite ran 4 short statements, each a plain imperative, with the purpose of the last one stated in its first clause.

## The rule that failed

4, all loaded, in `## Explaining` of the repo `CLAUDE.md` and in `references/style.md` §5: `name-it-never-point`, `a-heading-states-its-answer`, `one-idea-per-sentence`, and plain words in short sentences.

## Second rejection: readable sentences, too long

The rewrite fixed the sentences and failed on length. Sent, in part:

> **Work out first whether the user is telling you to do something or thinking about it.**
>
> An instruction says what to change and where. "Update the title in README.md" is an instruction. So is "go ahead" after a plan.
>
> Everything else is thinking: a hedge, a question, feedback, a reaction. "Maybe we should", "I'm not sure" and "what do you think" all mean the user has not decided yet.

Rejected:

> "you need to fucking, you know, explain the whole responsibility of acting section. Like, what is it about? What it really brings to the table?"

> "right now it seems to be like, you know, like too detailed. Like, you know, it includes too much unnecessary context. It doesn't immediately go to the point. It will need to be like significantly compressed. We need to consider that we have a lot of compression rules in the, you know, style file."

> "we'll just need to you know like explain the rule of you know it's you know like outline the whole you know flow to the agent right so it knows how to you know follow it we shouldn't come up with too much explanation shit explanation like that."

> "Same goes for the next block where you mentioned narration is in one line per action. It's also like you didn't follow any of the writing styles at all. Like you're explaining things in very long sentences."

Faults:

1. **No sentence says what the section is for.** It opens on the first step. Nothing says the section decides when work starts and how much gets built, which a reader needs before the rules mean anything.
2. **2 illustrations stand where one test belongs.** `style.md` §9: *four examples means the test was never written*. "Update the title in README.md" and "go ahead" both illustrate a test the section never states.
3. **One rule written twice.** "Never repeat the instruction back first. Never ask the user to confirm what they just said."
4. **Elaboration around rules already stated.** "However many messages back it was", "even though the user said nothing against it", "whatever their silence looked like".
5. **Written for the wrong reader.** `home/CLAUDE.md` is a loaded file, where §6 → `### Only in a loaded file` drops articles and filler verbs and lets a fragment stand. Both blocks were full explanatory prose.

The rules that failed: `style.md` §6 → `### Only in a loaded file`, §9 `State the test, delete the illustrations`, §9 `Delete the elaboration`, and `name-the-subject-first`. The root cause: the section was written as an explanation aimed at the user, then pasted into a file aimed at an agent.

## Third rejection: the section was too narrow

> "I previously assumed that we would basically remove all that no edit without approval rule and also other related rules about our latest discussion, we would remove all of them and we just introduce one section where we include everything for the agent right but it seems instead of that you just came up with acting section which is kind of confusing section I still fully don't understand what it really does here"

`## Acting` covered when to start work and how much to build, and the narration rules stayed behind as 2 loose bullets in `## Explaining`, so one turn was described in 2 places. The user had asked for one section holding the whole flow, on the model of `## Capture`. A section covering half a turn has no natural boundary, so nothing in it says where it stops. `## The turn` is readable because its unit is: one message in, one reply out.
