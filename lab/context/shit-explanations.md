# Shit explanations

Messages the user rejected outright, kept verbatim. The wording is the evidence, so nothing here is
paraphrased. Newest at the bottom.

---

## 2026-08-23 — git explained in git's own vocabulary

**Context.** Designing how uncommitted work moves between two machines. The user asked how the
proposed mechanism works. They had said, one message earlier, *"I'm not aware of most of the
terminologies and concepts you're referencing"* and *"I don't even know how snapshot works."*

Two consecutive messages failed. The second was a rewrite of the first and failed harder, because
it went one layer deeper into git and kept the same vocabulary.

**What was sent, message 1 (excerpt):**

> A commit does not have to live on a branch. You can build one whose parent is your current `HEAD`
> — whatever branch that is — record the entire dirty working tree in it, and store it under a ref
> outside `refs/heads/`.

Undefined at that point: `HEAD`, `parent`, `working tree`, `ref`, `refs/heads/`.

**What was sent, message 2 (excerpts):**

> The thing most people get wrong: **a commit is a complete picture of every file, not a list of
> changes.** Git shows you diffs by comparing two pictures after the fact. It doesn't store them.

> Objects are named by a hash of their own content, so they can never be modified — writing an
> object only ever *adds* to the bag.

> A label stored anywhere else is not a branch. `refs/flow-wip/main` is just a name pointing at a
> commit. Git keeps that commit alive and will push it like anything else, but nothing checks it
> out, and committing never moves it.

**What the user said back:**

> "What the fuck is object? Is this a blob? What the fuck is this exactly?"

> "If it doesn't store them, what the fuck is that picture?"

> "you say, you know, nothing checks it out. What the fuck does that mean? And also, you say, and
> committing never moves it. And also, what the fuck does that mean?"

> "you can assume that I actually didn't read anything after 'What git actually stores'"

### Five faults, ordered by damage

1. **A word used before it was defined, inside the sentence defining something else.** `object`
   was never introduced. Blob, tree and commit were each defined, then a later sentence referred to
   all three collectively as objects — a fourth term, arriving as if it were already shared.
2. **A metaphor standing in for a definition, then contradicted.** *Picture* was never defined.
   Two sentences later, git *"doesn't store them."* Both readings stayed available: either commits
   are pictures and git stores them, or it doesn't and a picture is something else.
3. **A causal claim with the cause deleted.** *"Named by a hash of their own content, so they can
   never be modified."* Why the second follows from the first is the entire idea, and it was
   carried by the word `so`.
4. **Git's verbs used as English verbs.** *checks it out*, *moves it*, *fast-forward*, *HEAD*.
   Each is a term of art meaning something specific and mechanical, each was used bare.
5. **A correction framed so the reader cannot tell which half is the error.** *"The thing most
   people get wrong: a commit is a complete picture of every file"* — the clause after the colon is
   the correct version, and reads as the mistaken one.

### Rules that were loaded and did not fire

All from `## Explaining` in the root `CLAUDE.md`, in context for both messages:

- **Define from zero.** Anything invented here — term, module, file — defined before first use.
- **A label is not an explanation.** Say what the thing does.
- **Plain words, short sentences.** A sentence read twice gets rewritten.
- **Calibrate tech** against the user profile. Since rewritten as `Name unfamiliar tech by what it
  does here`, because the profile file was deleted.
- **Priority order.** The load-bearing idea gets depth.

### What the rules fail to name

`Define from zero` scopes itself to *"anything invented here"*, which reads as Flow's own coinages —
skill names, file names, terms from the design record. It does not reach `object`, `HEAD`,
`check out` or `fast-forward`, because none of those were invented here. They are ordinary
vocabulary, correctly used, inside git's documentation.

That is the third register of one failure. The 2026-08-09 case found the second: a word appearing in
Flow's own files is not thereby shared with the user. This is the same shape one step out —
**a word that is standard inside a tool's documentation is not thereby shared with the user.**

The tell was in plain sight and read as a request for more detail rather than for different words:
*"I high level know, but not like how it utilizes the Git exactly."* That sentence says the concepts
are missing, not the specifics.

### What would have been right

Build one ladder, bottom-up, where every rung uses only words defined on a rung below it. Name
git's term **after** its meaning is established, never as the way of introducing it: *"git calls
this a tree"*, never *"a tree is a directory listing."*

---

## 2026-08-23 — sentences built to be dense instead of plain

Same session, four messages later. The vocabulary problem from the case above was fixed; the user
confirmed *"now it's a little more clear"*. Then the writing failed a second way, and the user named
this one as the more frequent of the two: **the sentences themselves.** Not a missing definition —
the construction.

**What was sent (excerpts):**

> ## The anchor: you already have this feature, locally

> **Save a copy.** Adds objects and a label. Your files are untouched. Safe to run automatically.

> **Save a copy and clear the desk.** The same thing, then reverts your working files to match the
> branch tip so you can switch away. This one destroys your local changes — safely, because the copy
> exists, but it destroys them.

**What the user said back:**

> "I have no idea what the fuck are you talking about. Like, what do you mean by the anchor? And
> what feature are you fucking referring to where you say you already have this feature?"

> "You say your files are untouched. What the fuck do you mean? What files exactly?"

> "It's not just about, you know, missing something. It's not just about not explaining some
> terminology. Overall, the sentencing is just wrong. You are fucking explaining things in a
> complicated way. You could have explained them much more simply."

> "Consider that I stopped reading your response at some point because it's very long, too much
> bullshit in it, and not clear in the first place."

### Four faults

1. **A heading that points at nothing.** *"The anchor: you already have this feature"* — `anchor` is
   writing-craft vocabulary for "a familiar thing to compare against," and it names nothing the
   reader can see. `this feature` referred forward to a sentence not yet written. The first line of
   the message was unreadable, so the rest went unread.
2. **A vague noun where a specific one was available.** *"Your files are untouched"* — which files.
   The answer is "the files in your project folder", and it is three words longer.
3. **Meaning packed into clauses instead of spread across sentences.** *"reverts your working files
   to match the branch tip so you can switch away"* carries four ideas in one clause. Each was
   correct. Together they are unreadable. The last excerpt is worse: it asserts, qualifies and
   re-asserts the same fact inside one sentence, and ends on the word it spent the sentence
   softening.
4. **A long message answered by alluding to its points rather than restating them.** The user
   raised this as the repeating offence, not a one-off: *"I come up with a 10 paragraph message, I
   paste it through, you respond, and you just reference some of my points, but you don't give
   enough details so I know what you're talking about."* A reply that assumes the question is still
   loaded in the reader's head is unreadable by the one person who wrote it.

### Root cause

Writing for density. Every offending line is a correct sentence compressed until the reader has to
decompress it. The user pays that cost, every time, in a message they are reading once.

### The rule that failed

`references/writing.md` §5 already carries the test — *"Act on it after one read. Re-reading to
find the instruction means rewrite it."* It is written for rules inside skill files, and the
`## Explaining` section of `CLAUDE.md` does not restate it for prose written to the user. What
`## Explaining` says instead is *"Plain words, short sentences"*, which reads as advice about
word choice and did not catch a four-idea clause made entirely of plain words.

### What would have been right

- **One idea per sentence.** Split on every `and`, `so`, `then` and dash that joins two ideas.
- **Name the thing, never point at it.** No `this feature`, `that approach`, `the same thing`, `it`
  across a sentence boundary. Repeat the noun.
- **Restate the question before answering it**, in the user's own words, every time a message
  carries more than one.
- **Never open with a heading the reader cannot evaluate.** The first line states the situation in
  plain words or it is cut.

---

## 2026-08-25 — naming a thing the repo has three of

**Context.** The user sent a seven-topic message about `flow get`, the `flow-open` block,
`write-tickets`, `## References`, the global `CLAUDE.md`, and two gaps in `/debug`. The reply
answered all seven under headings that reused the user's own loose wording as labels.

**What was sent (excerpts):**

> ## 4. `## References` as a `flow-open` block

> The backup motivation doesn't survive: the block only exists inside `flow open`.

> So widen it, but bound the trigger by cost rather than by where the work came from: several
> tickets at once, or material this session wasn't there for.

**What the user said back:**

> "I have no idea what the fuck are you referring to by references section. Like, which references
> section? Where? Like, what are you exactly fucking referring to?"

> "what do you mean the backup motivation? What's exactly the backup motivation?"

> "Is terribly explained, and I didn't understand a single fucking thing from it. Like, I have no
> idea what the fuck are you exactly proposing in that section."

### Three faults

1. **A name the repo carries three times, used bare.** Flow has `## References` in a ticket body,
   `## References` at the bottom of `map.md`, and `## References` in `home/CLAUDE.md`. The reply
   named none of them. The user had written "reference section", so restating their words restated
   the ambiguity.
2. **A label invented for the user's own reasoning, then argued against.** The user's stated reason
   was *"in case the user doesn't actually utilize the start command."* The reply compressed that
   into "the backup motivation" and spent a paragraph refuting the label. The user could not match
   the label back to their own sentence.
3. **A proposal made of three undefined abstractions.** "Bound the trigger by cost rather than by
   where the work came from" — `trigger` means the skill's `description:` frontmatter line, `bound`
   means narrowing that sentence, and `cost` means context spent loading a skill. None was said.
   The one sentence carrying the whole recommendation was the least readable in the message.

### Root cause

Answering seven topics in one message, and compressing each one's subject into a short heading to
fit. Every heading dropped the referent. The compression served the writer, who still had all seven
subjects loaded, and cost the reader, who did not.

### The rule that failed

`## Explaining` carries *"Restate each question before answering it, in the user's own words"*,
added 2026-08-24 from the entry above. It fired and did not help. Restating the user's words
preserves their looseness — and dictated input is loose by construction. The rule names the wrong
half of the job: the question was restated, the thing it referred to never was.

### What would have been right

- **Resolve the referent, not just the question.** Where the user's words name something the repo
  has more than one of, say which one — the file, and the place in it — before answering.
- **Never invent a label for something the user said.** Say their sentence back in full words. A
  label the user cannot match to their own message makes the paragraph under it unreadable.
- **Define a term inside the sentence that first uses it**, even in a recommendation. A proposal is
  the worst place to spend an undefined word.

---

## 2026-08-25 — reporting the investigation instead of the answer

**Context.** The user approved a test of whether a hook can inject project-specific overrides at the
moment a skill loads. The reply opened with a section reporting that test.

**What was sent (excerpts):**

> Test is done. It worked, and it found a hole the first version would have shipped with.

> ## The hook fires — and the typed `/skill` path bypasses it

> **Model-invoked** — `PreToolUse` with matcher `Skill` fires, and the payload names the skill

> **Then I tested typing `/pingtest`, and the hook never ran.**

> **The fix is a second event.**

**What the user said back:**

> "I read, you know, like first three paragraphs, and I have zero fucking idea what the fuck is
> happening."

> "your messages sound like they are conflicting with each other, and you know, in one place you
> say, you know, like, test is done and it worked, and in other sentence you say, and you know,
> like, skill path bypasses it. So, does it work or does it doesn't work?"

> "Only in the last message where you mentioned that you know user prompt expansion and stuff, I was
> able to understand that you know the solution you came up with actually worked."

### Three faults

1. **The heading was a cliffhanger.** *"The hook fires — and the typed `/skill` path bypasses it"*
   states a contradiction and resolves it four paragraphs later. The reader holds an open question
   through the whole section, and every sentence read in that state gets read as possible evidence
   for either side.
2. **The chronology of the investigation was reported as if it were the finding.** Three reversals
   in order: it worked, then it did not, then a second mechanism made it work. The answer — overrides
   work, and they need two hooks because a skill can be invoked two ways — appeared nowhere until
   the reversals had finished. A test report says what is true now. The order it was learned in is
   the writer's history, not the reader's information.
3. **The split that makes all of it make sense was never stated.** A skill reaches the agent two
   ways: the model decides to invoke it, or the user types `/name`. Claude Code runs different code
   for each. Nothing said that before the results arrived, so **Model-invoked** as a bold lead-in
   read as a detail rather than as one half of a pair.

### Root cause

`## Explaining` carries *"Never hide your reasoning. Think out loud while you work."* That rule fired
and produced this. Thinking out loud got read as narrating the sequence of experiments — try, fail,
try again. The rule is about saying which argument decides a thing, not about replaying the order the
writer met the evidence in. A result section is the one place where sequence is worthless: the reader
wants the state of the world, and every intermediate state is a false statement about it.

### What would have been right

- **A heading is an answer, never a cliffhanger.** *"Overrides work — two hooks, because a skill can
  be invoked two ways"* carries the same content and closes the question in the first line.
- **State the split before the results.** Where a finding divides by case, name the cases first, in
  one sentence. Results reported into a frame the reader already holds cannot read as contradictions.
- **Report the end state, never the path to it.** A superseded result is history, not a finding.
  Where the path itself matters — a dead end worth not repeating — it goes at the bottom, under its
  own heading, after the answer is closed.
