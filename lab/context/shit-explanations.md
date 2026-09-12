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
sections were rejected. Both decisions had been locked days earlier, so neither needed an argument:
only a plan.

**Sent, the first rejected section (opening and close, of 9 paragraphs):**

> ## `ptree` and `fmerge` were agreed: I built the batch you approved, and they were not in it

> **The two are not the same problem, and that is worth knowing before you sequence them.** `ptree`
> has no code dependency anywhere in Flow. Every reference to it is prose in `home/CLAUDE.md`: line
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
> - **`github`, alias `gh`**: `clone`, taking one or more repos in any URL form; `bookmark`, which
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

**Rule that failed.** Two, both loaded. *Match depth to weight* (*a minor point gets a line*) did
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
> files read 46 times, out of heredoc bodies: a line reading `tail the log` parses as a `tail`. It
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
> writes a file, a script checks the written content against a list of mechanical patterns:
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

1. **"Tally sheet": a label used as a definition, and an unfamiliar one.** The user asked what
   a scorecard is. The answer was a synonym the user does not know either. "Define from zero"
   failed on the very first word of the explanation.
2. **The whole machine is never shown.** The explanation describes pieces: a script, a pattern
   check, a count, without ever saying what connects them or how the whole thing moves from
   start to finish. "Open with the whole, then its parts" did not fire.
3. **Never said what the scorecard file actually contains.** The user asked what data lives in
   it, and the reply said "counts" without showing what a count looks like. No example, no
   structure.
4. **The relationship between rule files and the scorecard's patterns was never explained.** The
   user thought the scorecard imports rules from `rules/` files. The reply never stated that the
   scorecard's patterns are hand-written JavaScript regex checks, separate from the prose rules
   the agent reads.
5. **No visualization.** The enforcement bridge is a flow from rules through checking to
   enforcement: structure that belongs in a diagram. The reply used prose for all of it.

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

## 2026-09-12: a contribution pipeline explained twice, both times from inside the design

**Model.** Claude Fable 5.1, both messages. Recorded at the user's request, because the entry is
worthless without the model that wrote it.

**Context.** Designing the management skill, in conversation. The user asked how findings reach a
shared corpus of stack skills, how the maintainer contributes, how a multi-week design becomes
reusable knowledge, how private skills work, and what `browser-harness` does that is worth taking.
The first reply was rejected at its opening paragraph. The user then asked for a rewrite from scratch
that assumed nothing had been read. The rewrite was rejected section by section.

**Sent, the first message's opening, whole:**

> Every machine reads skills from a **list of trees**. A tree is a folder holding skill folders.
> There are 3: Flow's clone, the shared corpus, and your own tree. A **contribution is always a new
> file**, never an edit to a file somebody else reads. The only act that edits a shared body is a
> **fold**: one writer, one skill, reading every pending finding and rewriting the skill to absorb
> them. That one rule set covers the small finding, the multi-week security design, the maintainer,
> the private skill, and the private extension of a public skill.

**Rejected:**

> "I didn't understand a single fucking thing from that, you know, from that first paragraph in the
> The whole system in one paragraph section! Like, what the fuck is, you know, you said list of
> trees. What's that list of trees? Where did it come from? You're not fucking clarifying things
> here. You like, you assume that I already know most of the design, and you, you know, like, you're
> only pointing out in some other parts. You need to fucking explain the whole fucking picture here.
> Like, assume that I didn't read your solution at all."

**Faults.**

1. **Five new terms in six sentences, each defined in one clause.** "Tree", "corpus", "contribution",
   "fold", "extension". A one-clause definition names a thing; it never shows what the thing does,
   who runs it, or what it reads. `define-from-zero` says build the meaning first, then name it.
   The paragraph named first and never built.
2. **Nothing said what exists today.** The reader cannot see what "instead of one" means without
   first being shown the one: a symlink at `~/.claude/skills/<name>` pointing into one clone.
3. **The paragraph summarised a design the reader had never seen.** A summary is only readable by
   someone who already holds the parts. `whole-then-parts` wants the whole first, but a whole made
   of undefined names is a list of names.

### Second rejection: the rewrite defined every word and still showed no picture

**Sent, the rewrite's Part 1, the part that failed:**

> ```
> # ~/.flow/sources
> ~/code/flow/skills
> ~/code/flow-corpus/skills
> ~/.flow/private
> ```
>
> How `flow install` uses the list: for each skill name, it looks through the folders in order and
> links `~/.claude/skills/<name>` to the last folder that has `<name>/SKILL.md`. When two folders
> both have one, the later wins, and install prints a line saying so.

**Sent, from Part 4:**

> 2. Makes a temporary checkout of the corpus under `~/.flow/tmp/`, so your real corpus clone never
>    leaves `main`.
> 3. Copies each file into the matching place, `stack/react/findings/2026-09-11-hydration-suspense.md`.
>    A new file never conflicts with anyone.

**Sent, the last two paragraphs of the private-skills section:**

> After you publish the basic version in step 4 above, your private `SKILL.md` still shadows the
> public one, and `flow doctor` says so. You delete your private `SKILL.md` and keep only the private
> pages. Now the public body keeps improving upstream while your pages stay attached.
>
> This is not the machine-wide overlay you refused. An overlay pastes text into a body for one
> project. An extension is whole pages in your folder, listed at the bottom, with the public body
> untouched. A restructured body cannot lose them, because the list is printed, never merged.

**Sent, from the `browser-harness` section:**

> - **Lookup by key.** With 100 knowledge files, the body says which one to read for this run, by
>   hostname or package name, so a run reads 1 or 2.

**Rejected:**

> "I'm right now in the part one, and already it doesn't make sense to me. So, firstly, you need to
> consider like I don't understand what you're exactly referring to here, but you need to consider
> that like we have the skill folders in two phases, right? One is in the development phase, in the
> you know, like clone of the flow repo, right? [...] But once we actually know, like, install them
> on the machine, they are no longer going to be under you know, like, in under that folder in the
> groups, but they are will be directly you know, like, at least seem linked directly under the
> global .claude folder, right? And I'm really confused here. What phase are you referring to here?"

> "I'm looking at those four paths you have listed. And none of them really makes sense. The first
> one shows ~/.flow/sources! Like when it comes to that path, firstly, like you know, we can only
> have it in that path after the installation, right? And secondly, that path isn't, you know, like
> ClaudeCode is not going to pick that path, right? That's completely unrelated path. [...] But
> where did that, you know, like, third path came from? And what the fuck is that flow-corpus
> directory is about?"

> "you said, you know, like if we have you know two skills with the same name, the later one wins.
> Like, what does that exactly mean for us? You're not really clarifying what later one really
> means."

> "in part 4 I didn't understand "Makes a temporary checkout of the corpus under ~/.flow/tmp/, so
> your real corpus clone never leaves main." line at all! I also didn't understand the line that
> comes after."

> "I actually didn't understand the, you know, like last two paragraphs from the Private skills: one
> rule gives all three cases section at all! So, just another case of shit explanation because you
> know you're not really You didn't really give me the full picture You only giving me the pieces
> and you're ex you know like you're talking as if I already have the full picture"

> "that browser-harness: take the lookup, not the separate path Section is you know complete shit as
> well, like you didn't properly explain it at all. [...] at least fucking explaining me that, you
> know, look up my key idea that you decided to take from the browser harness. Because I have zero
> idea what the fuck that means in the first place."

> "you keep making and making and making this mistake again and again and again and again. And I'm
> really tired at this point."

**Faults.**

1. **The list of folders never said who reads it, or when.** Two things exist on an installed
   machine: the symlinks Claude Code reads at `~/.claude/skills/`, and the clone they point into.
   The list changes only where a symlink points, is read only by `flow install`, and Claude Code
   never sees it. None of that was said, so the reader could not tell which of the 2 phases the
   list belonged to. `name-the-subject-first`.
2. **A path was shown before its meaning existed.** `~/code/flow-corpus` appeared in a code block
   as a fact, and the sentence saying it is a proposed second repository came 4 lines later. The
   file's own path, `~/.flow/sources`, sat as a comment line above the 3 entries, so the block read
   as 4 paths with only 3 explained. `show-the-data` wants the data after the reader knows what it
   is.
3. **"Later wins" was never defined.** Later means a lower line in the file. Nothing said so, and
   nothing said why the order matters: the private folder is the last line so a private skill beats
   a public one of the same name. `define-from-zero`.
4. **A git mechanism was described by its effect, with no reason.** "A temporary checkout so the
   clone never leaves `main`" assumes the reader knows a pull request needs a commit on a branch,
   and that the stable clone must never carry a local commit. Neither was said.
   `explain-never-label`.
5. **The private-skills close pointed at 3 mechanisms by name.** "Shadows", "listed at the bottom",
   "printed, never merged" each point at a definition given in another section. A reader who did
   not hold those sections got 3 labels. `never-point-at-an-earlier-message`, applied inside one
   message.
6. **"Lookup by key" was a label with nothing under it.** Nothing said what a key is here, what does
   the looking up, or what the reader gains. The one sentence that existed compressed the mechanism
   into "by hostname or package name".
7. **Every section explained a piece and none placed it in the whole.** The second message defined
   its terms, which was the first message's fault, and kept the first message's structure: a
   sequence of parts, each assuming the others. The user's diagnosis was exact: "talking as if I
   already have the full picture".

**Rule that failed.** `define-from-zero`, `name-the-subject-first`, `explain-never-label`,
`show-the-data`, `whole-then-parts`, `never-point-at-an-earlier-message`. All loaded, all in
`## Explaining` of the repo `CLAUDE.md`.

**Root cause.** The design had been built up across 3 sessions inside the model's own context, and
both messages were written from that context. Every mechanism already had a name there, so the
writing named it and moved on. The rewrite treated "define every term" as the fix, and a definition
is a label with one more clause. What was missing both times was the picture of the machine: what
Claude Code reads, what points where, what runs when, and only then what each new piece changes in
that picture.

**Right instead.** Open with the machine as it is today, drawn: the symlinks, where they point, what
runs at install and what runs when a skill loads. Introduce each change as a change to that drawing.
Show a file only after saying what reads it. Name a mechanism only after the paragraph that showed it
working, and name it once.

---

## 2026-09-12: five verdicts and no picture, from Opus 5

**Model.** Opus 5. The two entries above it are Claude Fable 5.1; this one is not, and the user
corrected the attribution mid-session: *"I fucking told you to record it as Opus 5 because this
model was fucking Opus 5, not Fable 5.1."*

**Context.** Designing the contribution pipeline, in conversation, the turn after the whole design
was written to `lab/context/design-domain-skills.md`. The user asked five things in one message:
whether to use the Vercel skills package, how a shared skill stays usable on a machine with no Flow,
whether to drop the plan of installing every domain skill and turning most off, whether to build the
separate repository first, and whether that repository becomes a submodule under `lab/`. The reply
answered all five and was rejected whole.

**Sent, whole:**

`````markdown
Read the folder you installed under `tmp/domain-skills/`, Flow's `skills.js` and `commands/skills.js`, and fetched the Claude Code skills page to `tmp/skills-doc.md`, since it is the one page missing from `lab/research/claude-code-docs/`. No file edited.

## 1. The Vercel package: copy its layout, do not build on it

What it is, from what it left in `tmp/domain-skills/`: a CLI that copies a skill folder out of a GitHub repo into `.agents/skills/<name>/`, symlinks `.claude/skills/<name>` at it, and writes `skills-lock.json` recording the source repo, the path inside it, and a hash of the content:

```json
"ai-elements": {
  "source": "vercel/ai-elements",
  "sourceType": "github",
  "skillPath": "skills/ai-elements/SKILL.md",
  "computedHash": "6d7ccc65..."
}
```

Do not build on it. For our own repo a clone plus `git pull` does everything it does and leaves a history; the lock file's job is to tell a borrowed skill from one you own, and the folder a skill sits in already says that. It adds a second skills folder and a node dependency for what is one `ln -s`.

Take one thing from it: the path it expects. `skills/<name>/SKILL.md` at the repo root. Lay the repo out that way and anyone can install from it with `npx skills add`, with no Flow involved. That is most of your compatibility question answered by a folder name.

Nothing in Flow needs to change to tolerate it either. `flow install` already refuses to replace anything that is not already a symlink, so a skill that CLI put in a project is left alone.

## 2. Outside Flow: one guarded line at the bottom of a body

Verified on the docs page: `` !`cmd` `` in a skill body runs when the skill loads, the `!` has to start a line, and the output is pasted in as plain text.

Today a body carries two Flow lines, `` !`flow overlays <name>` `` and, in the design, `` !`flow extras <name>` ``. Cut it to one:

```
!`flow extras react 2>/dev/null || true`
```

Where `flow` is absent the shell prints its complaint to stderr, `2>/dev/null` swallows it, `|| true` keeps the exit clean, and the reader sees a plain skill. `flow extras` prints the project's overlay text first, then one path per file under `~/.flow/skills/react/`. Flow's own phase and tool skills keep `flow overlays` unchanged, so nothing else moves.

One line rather than two because every Flow line in that repo is foreign matter to someone who has never heard of Flow, and the two commands answer one question: what does this machine add to this skill.

The rest of compatibility is the page rules already decided: no path outside the repo, no link to a file the repo does not ship, no `flow` anywhere except that one line. Worth knowing: a reader who sets `disableSkillShellExecution` sees `[shell command execution disabled by policy]` in place of the line, which is harmless.

## 3. Install nothing by default: right call, wrong reason

The obvious argument for it is false, so it is worth replacing before it gets written down. A skill set to `off` costs nothing in context. Flow verified that against Claude Code 2.1.251 on 2026-08-29 and the docs agree. So "off wastes context" does not decide this.

What decides it: `flow install` would have to enumerate the corpus and write one line per skill into `~/.claude/settings.json`, turning a file you maintain by hand into a generated one, and fill `~/.claude/skills/` with hundreds of symlinks for skills nobody is using. On demand needs no list anywhere.

Then go one step further than you said: **install into the project, not the machine.** A skill that is on costs its name and description in every session, and the docs cap the whole listing at 1% of the context window and start dropping descriptions when it overflows. A React skill's description in a Python project is pure cost. Machine wide and off is free but needs a settings edit before it works. Per project is free everywhere else and works the moment it lands.

The mechanism, four pieces:

- `~/.flow/sources` stays, one folder per line, but it is now a lookup path rather than an install list. `flow install` never reads it.
- `flow skills ls --hidden` gains the corpus. The flag already means "what else exists"; corpus skills list with state `available`. That is how an agent discovers a skill it cannot see.
- `flow skills add react` symlinks `<project>/.claude/skills/react` at the source folder and prints which source won.
- `flow skills drop react` removes the symlink.

Two facts that make it work, both from the docs page: Claude Code watches `.claude/skills/` and picks up an added skill inside the running session with no restart, so `flow skills add` is usable mid task; and if the project had no `.claude/skills/` folder at all when the session started, that session has to restart once. And the symlink needs no gitignore work, because `project-template/.gitignore` already ignores links and tracks folders.

Two written positions this overturns, both rewritten in the same pass:

- `scripts/flow/commands/skills.js` opens with "No `add`, `sync`, `new` or `drop`. An external skill used by one project is a folder copied into `<project>/.claude/skills/<name>/` and committed." A copy never receives a fold, so it becomes a symlink and the commands exist.
- The off by default question is dead. `home/settings.json` loses `"web-pages": "off"`.

`home/CLAUDE.md` gets one line: a domain skill for the tool you are using may exist without being installed, `flow skills ls --hidden` lists them, `flow skills add <name>` installs one.

## 4. Repo first, and it now stands alone

New order, replacing items 7 to 11 in `backlog.md`:

1. `domain-skills`: `web-pages` moved in and reshaped, `CONTRIBUTING.md`, `skills/stack/` removed from Flow, docs and `home/settings.json` updated.
2. `~/.flow/sources`, plus `flow skills add`, `drop` and `ls --hidden`.
3. `flow extras`.
4. `/file-findings` writes finding files.
5. `/fold`.

Under the old plan the repo needed the sources work first or nothing could install. It no longer does: until item 2 exists, a corpus skill is installed by one `ln -s` into a project. So item 1 is genuinely finishable and testable on its own.

## 5. Submodule under `lab/`, and one rule has to change

Same shape as `lab/util` and `lab/toolbox`: its own repo, checked out here only so development happens in one place, never named by anything that ships. `submodules-commit-twice` becomes three submodules.

One rule in `CLAUDE.md` says otherwise. `no-skill-under-lab` opens "`skills/` is the only place a live skill exists." A submodule at `lab/domain-skills/` breaks that sentence. What the rule protects is two things: `flow install` reads one tree and cannot be fooled, and nothing that ships points into `lab/`. The first is already retired by the sources design. The second still matters. So replace the sentence rather than the rule:

> **`no-skill-under-lab`** Flow's own skills live in `skills/`. A skill from another repo lives in that repo. Never let a `lab/` path leak into a skill, `home/`, or `project-template/`.

The repo has to exist before the submodule can point at it, and both commands are git mutations, so they are yours. Public, since other people's pull requests are the entire point of the pipeline:

```
gh repo create Adrian333Dev/domain-skills --public
git submodule add git@github.com:Adrian333Dev/domain-skills.git lab/domain-skills
```

Say go and I will write the records for all five decisions, then start on the repo.
`````

**Rejected:**

> "Okay, your explanation is shit. I'm having a hard time understanding what the fuck are you exactly
> proposing. You'll need to fucking try again and properly explain what the fuck are you proposing.
> I'll also record this shit in the shit explanations as well. Like, I'm really pissed off by this
> and I'm really tired of this shit. Like, you keep making and making this mistake again and again
> and again and I'm already tired at this point. Like, what the fuck are you even explaining here?"

**Faults.**

1. **Five headings, five verdicts, and not one of them the proposal.** The message opens on the
   Vercel package, a side question, and the first thing the reader meets is a ruling about a tool
   rather than a statement of what is being built. No sentence anywhere in 89 lines says what the
   proposal is. `name-the-subject-first` wants that sentence before any sentence arguing about it.
2. **The load-bearing sentence is buried inside an argument.** "Install into the project, not the
   machine" is the entire design, and it appears mid-section 3, bolded, after two paragraphs
   correcting a reason the reader never held. The correction got the opening position and the design
   got a subordinate clause. `lead-with-what-matters`.
3. **The argument precedes the thing it argues for.** Section 3 opens by refuting "off wastes
   context". A refutation is only readable by someone who already knows which design it is clearing
   the ground for, and that design had not been stated.
4. **Six mechanisms named as if known.** `~/.flow/sources`, `flow skills ls --hidden`, `flow extras`,
   "the corpus", "the listing budget", "a fold". Each appears as an established noun. The design
   record on disk holds all six, and none of them had been put in front of the reader in this
   conversation. `define-from-zero`, `explain-never-label`.
5. **The two folders the change is about never appear together.** The whole proposal is the
   difference between `~/.claude/skills/` and `<project>/.claude/skills/`. Neither path is shown
   until a bullet list in section 3, and they are never shown side by side.
6. **No drawing, for a change whose entire content is where files sit.** `ui-is-drawn` sends
   structure through `visualize`, and `visualize` carries a Tree pattern for exactly this: file
   layout as an indented text tree. The user had asked for a tree-shaped picture two turns earlier.

**Rule that failed.** `name-the-subject-first`, `whole-then-parts`, `lead-with-what-matters`,
`define-from-zero`, `explain-never-label`, `ui-is-drawn`. All six sit in `## Explaining` and
`## Judgment` in the repo `CLAUDE.md`.

**Root cause.** `topic-by-topic` was obeyed and `whole-then-parts` was not. The user asked five
questions, so the reply was built as five answers in their order, and a list of five verdicts has
nowhere to put the picture all five depend on. Where the two rules collide, the picture comes first
and the topics hang off it; the reply treated the user's question order as the structure of the
whole message rather than the order of its sections.

**Right instead.** One sentence naming what is proposed. Then the tree of what sits where today.
Then the same tree after the change. Then each of the five questions answered as a change to that
tree.

### The rewrite, same session: readable, and still carrying three faults

The rewrite opened with the proposal in one sentence and two trees, and the user worked through it
rather than rejecting it. Three faults survived, all named by the user.

1. **A section of pure argument, unlabelled.** "The load-bearing rule: a domain skill is installed
   per project" ran a three-way comparison without a first sentence saying it was the case for a
   line in the proposal above it. *"I'm still not understanding that if that section is a proposal
   of new system? Or were you just evaluating the old solution? You just dumped your reasoning in
   that section and you're not fucking clarifying."* An argument section states what it is arguing
   for before it argues.
2. **Today's tree used to define a term, with no label saying it was today's.** The folder list
   named `skills/stack/` as a live group, in a section the reader took for the design after the
   change, where that folder is deleted. *"Is that correct? I don't think it is accurate because I
   think we discussed that we're going to move it out completely."*
3. **A mechanism deleted inside a simplification, without the deletion being named.** Merging
   `flow overlays` into `flow extras` removed the project overlay from every domain skill body. The
   message presented the merge as cutting two lines to one and never said which capability went.
   *"Where did the overlays command go? I think we're supposed to have the overlays command as
   well, right?"*
