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

