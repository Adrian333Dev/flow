# Rejected replies: every recorded failure, one line each

What `## The reply` was built against. 14 study cases, 2026-08-10 to 2026-09-16, across Sonnet 4.6, Opus 4.6, Opus 5 and Fable 5.1. Each line holds the date, the fault, and the user's own words. The full cases were deleted once this file existed; `git log -p -- lab/study-cases/` restores any of them.

**This file is the test set for the next rewrite of `## The reply`.** A new shape is checked by walking these 14 and asking which the shape would have caught.

## What the reader never got

- **2026-09-05, the scorecard explained as a tally sheet.** A synonym stood in for a definition, and the mechanism was never shown whole. *"What the fuck is tally sheet? I have zero idea what the fuck a tally sheet means."* and *"you're not fucking explaining me the whole fucking picture. There are all missing pieces here."*
- **2026-09-12, the contribution pipeline, rejected twice.** 5 new terms in 6 sentences, each defined in one clause, and no picture of the machine either time. *"You didn't really give me the full picture. You only giving me the pieces and you're talking as if I already have the full picture."* The rewrite failed too, which produced the sharpest finding on record: a definition is a label with one more clause, and defining every term does not build a picture.
- **2026-09-12, 5 verdicts and no picture.** 5 questions got 5 answers in the user's order, and no sentence in 89 lines said what the proposal was. *"I'm having a hard time understanding what the fuck are you exactly proposing."* `topic-by-topic` was obeyed and `whole-then-parts` was not.
- **2026-09-16, 3 labels and no explanation.** "The 4 rules for `docs/context/`", "the routing test" and "how a plugin is switched on per project", each named and none explained. *"I literally didn't understand a single fucking thing from that line."*

## Words the user had never met

- **2026-09-02, a shell parser in its own jargon.** Heredoc, redirection, sed pattern, `2>/dev/null`. *"It's one of the shittiest explanations I ever had seen."*
- **2026-09-13, "prose" in a heading.** The plain words were already one line below it, in the body. *"What the fuck do you mean by pros? I told you 20, 50, 100 fucking times to follow the explained rules."*
- **2026-08-30, 5 git terms in an answer about 2 shell scripts.** Gitlink, `HEAD`'s tree, `.gitmodules`, and 2 submodule commands.
- **2026-09-07, on a reply about rule files.** *"Your whole response is a complete jargon as well."* Words named: load-bearing, §7, dissolves, tally sheet, bound.

## Length set by the wrong thing

- **2026-09-13, a full picture sent as 117 lines.** The checks run before showing the design went into the reply: write order, stopped runs, request counts, rate limits. About 20 lines carried the 4 answers. *"Your last response is mostly bloat. You wasted so much tokens and really wasted my time as well."* It also argued a split from how many commits it would take: *"That's very stupid reason."*
- **2026-08-30, 9 paragraphs arguing a locked decision.** *"We already fucking locked the decision, and you just had to fucking implement it. That's it."* And on the same reply: *"I read that whole section and I literally didn't understand a single fucking thing from it."*

## Pointers where content belongs

- **2026-08-30, 2 file paths instead of 2 sentences.** *"`design-util.md` → `### The namespaces at the start` carries all of it"* replaced saying what the 2 commands do.
- **2026-09-12, "lookup by key" as a heading with nothing under it.** Nothing said what a key is or what does the looking up.

## When to act, all fixed by `## The turn` on 2026-09-05

- **2026-08-10, built on a partial approval.** "Besides that, I approved everything" closed a message that was three-quarters new requests. 3 of the 4 changes had to be unwound.
- **2026-08-10, built while the user was thinking out loud.** A dozen hedged reactions ending in "what are your thoughts on all this".
- **2026-09-06, repeated a clear instruction instead of running it.** *"Probably the most annoying issue ever."*
- **2026-09-06, listed proposals the user never argued with as open questions.**
- **2026-09-06, put the answer above the edits.** Only the last message is on screen when the work finishes, and only the last message can be copied.
- **2026-08-30, reported a blocker one `ls` away.** *"You can fucking implement it right now. You can already find it at repos/toolbox!!!"*

## Writing a rule file, not a reply

- **2026-09-05, a section built out of 2 questions, rejected 3 times.** Both headings asked instead of answering, and "a change named with its target is one" made the reader carry the heading into the next sentence. It belongs to `references/style.md` and to `rules.md`, which holds the user's feedback on how a loaded file is written.

## What the 14 have in common

- **Every rule that failed was already loaded.** 11 cases say so in as many words. No new rule has ever fixed one of these.
- **Structure fixed the acting failures. Wording never fixed the explaining failures.** One ordered section closed 6 cases in a day. 20 rules in a flat list closed none in 6 weeks.
- **A rule written only as a prohibition inherits whatever the model already leans toward.** An eager model reads it as permission, a cautious one as an order to wait.
- **A rule that names the symptom without naming the cost does not fire.** "Match depth to weight" did nothing until `size-by-worth` said what length claims to the reader.
