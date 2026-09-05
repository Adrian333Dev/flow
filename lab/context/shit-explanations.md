# Shit explanations

The message the user rejected most recently, kept whole. **Every quotation is verbatim, theirs and
mine**. The wording is the evidence, and a paraphrase of an unreadable sentence is readable.

**An entry is deleted once its faults are rules.** The faults here are what `## Explaining` in
`home/CLAUDE.md` gets written from, so an entry that has produced its rules has done its job and
goes. Six entries left on 2026-08-31 for that reason, covering 2026-08-23 to 2026-08-29; git holds
every one of them, and `git log -- lab/context/shit-explanations.md` is how to read them back.

---

## 2026-08-30: a page about moving two files, and a blocker that was one `ls` away

**Context.** The user asked four things in one message: why `ptree` and `fmerge` had not moved into
the `util` repo, what happened to the commands list holding `clone` and `bookmark`, a description for
the `util` repo, and why its README claims to ship no commands. The reply answered all four. Two
sections were rejected. Both decisions had been locked days earlier, so neither needed an argument —
only a plan.

**Sent, the first rejected section (opening and close, of 9 paragraphs):**

> ## `ptree` and `fmerge` were agreed — I built the batch you approved, and they were not in it

> **The two are not the same problem, and that is worth knowing before you sequence them.** `ptree`
> has no code dependency anywhere in Flow. Every reference to it is prose in `home/CLAUDE.md` — line
> 11, where the `description:` rule says *`ptree` prints it beside the filename*, and the `##
> Scripts` entry at line 85.

> That batch is: `git mv` two files into `lab/util/commands/fs/`, `open.js` calls `util fs merge`,
> `BIN` drops to `flow` and `fw`, `home/CLAUDE.md` § `## Scripts` goes from three commands to one
> plus a `util` line, and `lib/describe.js` stops being a second copy of `ptree.js`'s parser.

**Sent, the second rejected section, whole:**

> ## The rest of the list is designed and unbuilt, and one command's source is missing
>
> Nothing was lost. `design-util.md` → `### The namespaces at the start` carries all of it, and
> `backlog.md:69` holds the `github` half:
>
> - **`github`, alias `gh`** — `clone`, taking one or more repos in any URL form; `bookmark`, which
>   fetches a repo's stars, language, pushed date and description and appends one line about it to a
>   file
>
> **One blocker on `bookmark`, and it is not what the backlog thinks.** `bookmark` is
> `toolbox/bin/add-repo` renamed and widened, and `toolbox/` is not on this machine. It is also no
> longer a submodule: `.gitmodules` still declares it, but `HEAD`'s tree carries no gitlink for it,
> so `git submodule status` lists only `lab/util` and `git submodule update --init` does nothing.
> Either you re-add it, or I write `bookmark` from the design's description with no original to port.

**Rejected:**

> "you have dedicated a whole section about them. You need to consider that this is a very minor
> thing, you know. This is just, you know, moving two scripts around, you know. They don't deserve to
> have, you know, a whole page dedicated about them, right?"

> "you were supposed to just, you know, like, really fucking summarize and outline what you're going
> to do and just confirm it, you know. This is very minor detail, and we already fucking locked the
> decision, and you just had to fucking implement it. That's it."

> "I read that whole section and I literally didn't understand a single fucking thing from it. Like,
> your explanation in that section is absolute shit. Absolute shit. Unbearable."

> "why are you stopping and saying it's a one blocker or anything? You can fucking implement it right
> now, you piece of shit. And in case you actually need that repo for some stupid fucking reason, you
> can already find it at repos/toolbox!!!"

**Faults.**

1. **Nine paragraphs arguing a decision that was already made.** The move was locked, written into
   `design-util.md` and sitting in the backlog. The only thing owed was the plan and a confirmation.
   Length is a claim about weight, so a page said *this is contested*, and the user spent the page
   finding out it was not.
2. **A blocker reported without looking for the file.** `toolbox/bin/add-repo` was on the machine the
   whole time, at `repos/toolbox/bin/add-repo`, findable with one `ls`. Instead the absence was
   handed back as a decision for the user to make. A lookup the reply could do is never a question.
3. **Pointers standing where the answer belongs.** *"`design-util.md` → `### The namespaces at the
   start` carries all of it, and `backlog.md:69` holds the `github` half"*. Two file references
   instead of the two sentences saying what `clone` and `bookmark` do.
4. **Five git terms, undefined, in an answer about two shell scripts.** *gitlink*, *`HEAD`'s tree*,
   *`.gitmodules`*, *`git submodule status`*, *`git submodule update --init`*. The user opened the
   section to find out what happened to a list of commands.
5. **Neither command is ever described in the user's terms.** What `bookmark` does is write one
   markdown line about a repo into a file, so a list of interesting repos builds up. That sentence
   appears nowhere; the bullet carries the alias, the sibling command and a parenthetical instead.

**Rule that failed.** Two, both loaded. *Match depth to weight* — *a minor point gets a line* — did
not fire, because it names the symptom without saying what length costs. *A label, a pointer and a
quote are not explanations* did not fire on a file path used as an answer.

**Root cause.** Reporting the state of the record instead of doing the work. The user asked what
happened to the commands; the reply said where they are written down and what was blocking them.

**Right instead.** A settled decision gets the plan and the confirmation, never the case for it. Look
before reporting something missing. Say what each command does in one plain sentence, then build it.
Two rules were written from this entry: **Length claims importance** and **Never argue a decision
already made**, both in `## Explaining` → `### The message`.

---

## 2026-09-02: a shell parser described in its own jargon

**Context.** The user asked what five things had changed during the audit build. One item was about
shell command parsing. The paragraph explained what the parser does using terms the reader has never
encountered.

**Sent, whole:**

> A shell command is prose as often as it is a command. The first pass recorded the, a and and as
> files read 46 times, out of heredoc bodies — a line reading `tail the log` parses as a `tail`. It
> also recorded `2>/dev/null` as a file, and `/^##` 63 times from a sed pattern. Heredoc bodies are
> stripped before parsing now, redirections are dropped, a path needs a slash or an extension, and
> sed's own grammar decides which argument is the script.

**Rejected:**

> "it's one of the shittiest explanations I ever had seen, I literally didn't understand a single
> fucking thing from that line"

> "we still have similar issues literally in your whole response"

**Faults.**

1. **No term is defined before use.** "Heredoc bodies", "redirections", "sed pattern", "parsing" are
   jargon from shell programming. The reader has never encountered any of them.
2. **The example explains nothing without the term it illustrates.** "A line reading `tail the log`
   parses as a `tail`" requires knowing what a heredoc body is to understand why English words ended
   up being parsed as commands.
3. **`2>/dev/null` is written as if the reader knows what it means.** It is a shell idiom for "throw
   the error messages away", and the parser mistook it for a filename. Neither fact appears.
4. **"sed's own grammar decides which argument is the script" assumes three things.** That the reader
   knows sed, knows it has a grammar, and knows what "the script" refers to in that grammar.
5. **Four separate fixes joined by commas in one sentence.** Each fix addresses a different problem,
   and no problem is ever stated. The reader has no way to match a fix to the defect it corrects.

**Rule that failed.** Three, all loaded. "Define from zero" (§5 in `## Explaining`, §6 in
`style.md`). "One idea per sentence" (§5 in `style.md`). "Name the subject first" (`## Explaining`).

**Root cause.** The paragraph describes what the parser does instead of what went wrong. Every fix is
stated without its corresponding problem, and every term is used without its definition, so the
reader cannot reconstruct either the problem or the solution.

**Right instead.** Define each term in one plain sentence before using it. State each problem, then
its fix. One sentence per idea. The rewritten version from the same conversation did this correctly
for the same material: it defined a heredoc as "a block of plain English inside a command", explained
why `tail the log` was misread, said `2>/dev/null` means "throw error messages away", and described
`sed -n '/^## Heading/p' file.md` by saying which word is the pattern and which is the file.

**Rules already cover every fault.** This entry produces no new rule. It stays as a test case for
the existing three.

---

## 2026-09-05: the enforcement bridge explained in its own jargon, without the whole picture

**Context.** The user asked what the scorecard is, how the enforcement bridge works, and what
the scorecard file actually holds. The reply used undefined terms, skipped the whole picture,
and never showed what the data looks like.

**Sent, the first rejected paragraph:**

> The scorecard is a tally sheet that runs in the background. Every time the agent edits or
> writes a file, a script checks the written content against a list of mechanical patterns —
> banned patterns, naming conventions, things a regex can catch. It counts three things per rule:
> how many edits the rule applied to, how many followed it, how many violated it. At session end,
> a second script prints those counts.

**Rejected:**

> "I fucking asked you what scorecard means and you said it's a tally sheet. Like, what the fuck
> is tally sheet? I fucking explained this shit to you that you shouldn't explain, assume that I
> know those terminologies. I have zero idea what the fuck is a tally sheet means."

> "you're not fucking explaining me the whole fucking picture. There are all missing pieces here
> in your fucking explanation."

> "it seems like you're suggesting that somehow we extract the rules or something from the rule
> files. And then building hooks based on them. And I don't know how the check and shit works."

> "I still have zero fucking idea what the fuck that scorecard holds."

**Faults.**

1. **"Tally sheet" — a label used as a definition, and an unfamiliar one.** The user asked what
   a scorecard is. The answer was a synonym the user does not know either. "Define from zero"
   failed on the very first word of the explanation.
2. **The whole machine is never shown.** The explanation describes pieces — a script, a pattern
   check, a count — without ever saying what connects them or how the whole thing moves from
   start to finish. "Open with the whole, then its parts" did not fire.
3. **Never said what the scorecard file actually contains.** The user asked what data lives in
   it, and the reply said "counts" without showing what a count looks like. No example, no
   structure.
4. **The relationship between rule files and the scorecard's patterns was never explained.** The
   user thought the scorecard imports rules from `rules/` files. The reply never stated that the
   scorecard's patterns are hand-written JavaScript regex checks, separate from the prose rules
   the agent reads.
5. **No visualization.** The enforcement bridge is a flow from rules through checking to
   enforcement — structure that belongs in a diagram. The reply used prose for all of it.

**Rule that failed.** Four, all loaded. "Define from zero" (§5). "Open with the whole, then its
parts" (§5). "Name the subject first" (§5). "UI is drawn, never described" (repo CLAUDE.md
carries the rule; `home/CLAUDE.md` does not).

**Root cause.** Describing pieces of a mechanism without ever showing the mechanism. The reader
cannot assemble the pieces because the shape they fit into was never drawn.


---

## 2026-09-05: a rule section built out of two questions, neither of them answered

**Context.** The user asked for a new `CLAUDE.md` section fixing three agent behaviors: repeating a
clear instruction back instead of doing it, re-raising settled points as open, and splitting one
answer across several edits. The reply proposed a section named `## Acting`. It was rejected whole.

**Sent, the proposed section in full:**

> ## Acting
>
> Two questions, in order, every turn.
>
> **Is this an instruction to act?** A change named with its target is one, and it gets done rather
> than repeated back. "Go ahead" is one. A hedge, a question, a reaction, or a list of feedback is
> not, however much the user agrees with themselves.
>
> **What is in scope?** Everything the conversation named and the user did not argue with, back to
> the last thing they did. Nothing you would be writing for the first time here.

**Rejected:**

> "if you look at the acting section, it's not in plain language, it's been structured in a complex
> way. Just make sure it's very plain, very clear. Like for example you say "A change named with its
> target is one", That's very confusing and very unintelligible sentence. That sentence doesn't make
> any fucking sense. You had to come up with a much clearer sentence there."

> "what's the scope question in the acting section? That doesn't make any sense. Like, what the fuck
> is the purpose of it? You don't really clarify what that question is fucking for, right? That's,
> you know, complete nonsense section. The whole acting section is complete nonsense and
> unintelligible."

**Faults.**

1. **"A change named with its target is one."** The word "one" reaches back across a sentence
   boundary to "an instruction to act" in the heading above it. The reader has to hold the heading,
   carry it into the next sentence, and substitute it in. `Name the thing, never point at it` covers
   exactly this, and the sentence breaks it in five words.
2. **Both headings ask instead of answering.** `A heading states its answer` is a loaded rule. Under
   a heading that asks, every sentence reads as evidence for one side or the other, and the reader
   never learns what the section wants them to do.
3. **The second heading never says what the question is for.** The section asks "what is in scope?"
   and never states that scope means how much of the agreed work to build in this turn. The user
   named this fault directly, and it is the whole reason the section reads as noise.
4. **"However much the user agrees with themselves" carries no meaning.** It was compressed out of
   the idea that a long approving message is still discussion. Nothing of that idea survives the
   compression.
5. **"Nothing you would be writing for the first time here" hides its own subject.** The rule is
   about not inventing material the user never saw. The sentence never says invent, never says
   propose, and leaves "here" undefined.

**Rule that failed.** Four, all loaded. `Name the thing, never point at it`, `A heading states its
answer`, `One idea per sentence`, and `Plain words, short sentences`. All four sit in `## Explaining`
in the repo `CLAUDE.md` and in `references/style.md` §5.

**Root cause.** The section was written in the compressed register of the bullets already in
`home/CLAUDE.md`, matching the surrounding file instead of `style.md`. Those bullets are the text the
user has now ruled unreadable, so matching them reproduces the defect on purpose.

**Right instead.** Say what the thing is before arguing about it. One heading per statement, each
heading a claim rather than a question. Name the subject of every sentence inside that sentence. The
rewrite in the same conversation ran four short statements, each a plain imperative, with the purpose
of the last one stated in its first clause.

### Second rejection, same section, same session

The rewrite fixed the sentences and failed on length. Sent, in part:

> **Work out first whether the user is telling you to do something or thinking about it.**
>
> An instruction says what to change and where. "Update the title in README.md" is an instruction.
> So is "go ahead" after a plan.
>
> Everything else is thinking: a hedge, a question, feedback, a reaction. "Maybe we should", "I'm
> not sure" and "what do you think" all mean the user has not decided yet.

**Rejected:**

> "you need to fucking, you know, explain the whole responsibility of acting section. Like, what is
> it about? What it really brings to the table?"

> "right now it seems to be like, you know, like too detailed. Like, you know, it includes too much
> unnecessary context. It doesn't immediately go to the point. It will need to be like significantly
> compressed. We need to consider that we have a lot of compression rules in the, you know, style
> file."

> "we'll just need to you know like explain the rule of you know it's you know like outline the whole
> you know flow to the agent right so it knows how to you know follow it we shouldn't come up with
> too much explanation shit explanation like that."

> "Same goes for the next block where you mentioned narration is in one line per action. It's also
> like you didn't follow any of the writing styles at all. Like you're explaining things in very long
> sentences."

**Faults.**

1. **No sentence saying what the section is for.** It opens on the first step. Nothing anywhere says
   the section decides when work starts and how much gets built, which is the one thing a reader
   needs before the rules mean anything.
2. **Two illustrations standing where one test belongs.** `style.md` §9 names this as the biggest
   single win available: *four examples means the test was never written*. "Update the title in
   README.md" and "go ahead" both illustrate a test the section never states.
3. **One rule written twice.** "Never repeat the instruction back first. Never ask the user to
   confirm what they just said." Two sentences, one instruction.
4. **Elaboration around rules already stated.** "However many messages back it was", "even though the
   user said nothing against it", "whatever their silence looked like". §9 `Delete the elaboration`.
5. **Written in the wrong register.** `home/CLAUDE.md` is a loaded file, and §6 → `### Only in a
   loaded file` drops articles and filler verbs and lets a fragment stand. Both blocks were written
   as full explanatory prose instead.

**Rule that failed.** `style.md` §6 → `### Only in a loaded file`, §9 `State the test, delete the
illustrations`, §9 `Delete the elaboration`, and `Name the subject first` in `## Explaining`.

**Root cause.** The section was written as an explanation aimed at the user, then pasted into a file
aimed at an agent. `style.md` separates those two registers in its opening lines and the draft used
one for the other throughout.

### Third rejection: the section was too narrow, not badly written

> "I previously assumed that we would basically remove all that no edit without approval rule and
> also other related rules about our latest discussion, we would remove all of them and we just
> introduce one section where we include everything for the agent right but it seems instead of that
> you just came up with acting section which is kind of confusing section I still fully don't
> understand what it really does here"

**The fault.** `## Acting` covered when to start work and how much to build, and the narration rules
stayed where they were as 2 loose bullets in `## Explaining`. One turn was described in 2 places. The
user had asked for a single section on the model of `## Capture`, holding the whole flow.

**Why the section read as confusing.** A section covering half a turn has no natural boundary, so
nothing in it says where it stops. `## The turn` is readable because the unit is: one message in, one
reply out.
