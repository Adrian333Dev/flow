# Shit explanations

The message the user rejected most recently, kept whole. **Every quotation is verbatim, theirs and
mine** — the wording is the evidence, and a paraphrase of an unreadable sentence is readable.

**An entry is deleted once its faults are rules.** The faults here are what `## Explaining` in
`home/CLAUDE.md` gets written from, so an entry that has produced its rules has done its job and
goes. Six entries left on 2026-08-31 for that reason, covering 2026-08-23 to 2026-08-29; git holds
every one of them, and `git log -- lab/context/shit-explanations.md` is how to read them back.

---

## 2026-08-30 — a page about moving two files, and a blocker that was one `ls` away

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
   start` carries all of it, and `backlog.md:69` holds the `github` half"* — two file references
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
