# Log of home/CLAUDE.md

## 2026-11-02 · `show-the-data` · rewrite
Ticket: fw-358
Why: an example of a new window's context came as inline, unformatted JSON, and a before and an after were put in one `[user]` / `[agent]` block. The user asked for one generic line, optimized for their reading, never a list of formats that grows a line per case.
Was:
```md
- **`show-the-data`** A file, a record or an output gets an example of what it holds, never a description alone.
```

## 2026-11-03 · `read-writing-first` · remove
Ticket: fw-397
Why: the agent read `writing.md` itself before its first markdown edit in 0 of 13 windows. The mod sends each file's guides when the file is read, grepped or edited. The user: "since it never really triggered".
Was:
```md
- **`read-writing-first`** Before planning or drafting any markdown change, read `~/.flow/guides/writing.md`.
```

## 2026-11-03 · `read-before-adding` · remove
Ticket: fw-397
Why: fired 1 time in 1, late, at the build. The mod's `knowledge` entry holds a new `SKILL.md`, an `.mcp.json` edit and a plugin or MCP install until `knowledge.md` is read.
Was:
```md
- **`read-before-adding`** Before proposing a skill, a plugin or an MCP server, read `~/.flow/guides/knowledge.md`.
```

## 2026-11-03 · `read-subagents-before-dispatch` · remove
Ticket: fw-397
Why: the agent read `subagents.md` before its own dispatch in 4 of 12 windows. The mod's `agent` entry now holds an `Agent` call until the guide is read. The user approved the removal 2026-11-03.
Was:
```md
- **`read-subagents-before-dispatch`** Before starting a subagent, read `~/.flow/guides/subagents.md`: which model, how to brief it, how to reply while it runs.
```

## 2026-11-04 · `user-only-skills` · rewrite
Ticket: fw-397
Why: no file the agent reads named `/flow:triggers-check`, so the agent would report it missing when the user asks for it by name.
Was:
```md
- **`user-only-skills`** Suggest `/flow:start`, `/flow:tickets-from-spec` and `/flow:upkeep` to the user.
```

## 2026-11-05 · `show-the-data` · rewrite
Ticket: fw-408
Why: "as it would appear" invited invented files and before/after blocks (fw-408, fw-409). "a real example" rules them out.
Was:
```md
- **`show-the-data`** A file, a record or an output gets an example of what it holds, never a description alone. Show it as it would appear, formatted for the user to read at a glance, each block labelled for what it holds.
```

## 2026-11-07 · `instruction-or-thinking` · rewrite
Ticket: fw-414
Why: "test it, disagree, recommend" made the reply a pass-or-fail verdict on the user's idea, so a working idea was adopted as given. The user: an idea is "a seed, and I'm expecting you to return it as a full tree". Its new sub-rule `grow-the-idea` replaces the clause.
Was:
```md
1. **`instruction-or-thinking`** An instruction names the change or approves a plan: "do it", "go ahead". Everything else is thinking: a hedge ("maybe"), a question, a correction, a new idea, feedback. "Build X" with no approved plan starts a discussion of what to build. A feedback list is topics, not tasks. Thinking gets a reply and no edit: test it, disagree, recommend. An instruction gets work, never a restatement.
```

## 2026-11-07 · `short-is-the-default` · remove
Ticket: fw-414
Why: `size-by-worth` and `depth-matches-weight` already set a reply's length; "always in a rush" squeezed a grown design into one line, which read as an echo. No reason was recorded at its add (2026-09-16, `8f612f5`). The user approved the cut 2026-11-07.
Was:
```md
   - **`short-is-the-default`** The user is always in a rush. Cut the output, never the thinking, the walk or the design.
```

## 2026-11-07 · cut pass: `## The turn`, `## Reading`, `## Tools`, `## Workflow`, `## Scripts`, `## Judgment` · rewrite
Ticket: fw-425
Why: Test cut. The user asked to minimize the file wherever possible, as a test ("it might affect negatively"), `## Capture` aside. One batch, one entry. A fault traced to a cut line → restore that line from `Was` (`fw-294` holds the check). Changes:
- Removed: the opening line of `## The turn`; `say-the-depth`; `tree-for-structure` (into `## Scripts`' `util fs tree` line); `search-then-choose`; `docs-before-experiment` (into `wiki-first`); `never-ask-what-a-command-answers`; `invoke-the-skill` and its drawing line; `find-it-mid-walk`.
- Merged: `never-narrate-being-wrong` into `move-forward-never-sideways`.
- Rewritten: `proposal-shape` (the old "after, in one sentence" plus "one line per file" reduced a design to an edit list); `agreed` (only replies answered since; its hedge clause became `a-hedge-asks-for-better`: the user, 2026-11-07, "maybe" is sometimes pushback, meaning not impressed, worried about issues; build the better version).
- Moved: `agreed`'s delete sentences to `## Tools` as `ask-before-deleting-their-work`.
- Removed from `instruction-or-thinking`'s list of thinking: "a hedge ("maybe")". It contradicted `a-hedge-asks-for-better`, which builds on a hedge. A hedged new idea stays thinking, as a new idea.
- Kept on the user's word: `plan-the-reads`, `read-in-parallel`, `search-wide`. Before them the agent did not batch calls, though Claude Code's system prompt asks it to.
Was (each touched section whole, from `home/CLAUDE.md`; `~/.flow/CLAUDE.md` differs only in `end-with-the-next-step`'s example ids, `#fw-204` and `tickets/204`):
````md
## The turn

One user message, your work, one reply. In that order, every time.

1. **`instruction-or-thinking`** An instruction names the change or approves a plan: "do it", "go ahead". Everything else is thinking: a hedge ("maybe"), a question, a correction, a new idea, feedback. "Build X" with no approved plan starts a discussion of what to build. A feedback list is topics, not tasks. Thinking gets a reply and no edit. An instruction gets work, never a restatement.
   - **`grow-the-idea`** An idea the user offers, in a first message or against a proposal, is a direction to search. Find what it reaches for, try more than one shape of it, and bring back the strongest design found there. Say what grew beyond the user's words. Never return the idea as it came.
   - **`user-dictates`** Expect transcription noise and infer from context. Confirm only when a wrong word won't resolve.
   - **`ask-for-the-missing-attachment`** The user mentions a screenshot, image or file, and none came with the message → reply only by asking for it. An answer without it guesses at what they meant to show.
2. **`disagree-before-building`** What the user says about the code, the docs or the design is a claim to test, never a fact. Before agreeing, check it against the code, the docs and your reasoning. What they report doing (committed, pushed, ran, installed) is true: run no command to confirm it, and let a later failure be the check. Say a disagreement once, with the argument. Once the user has chosen, the answer is the plan, never the case for it.
   - **`never-narrate-being-wrong`** No "you're right", no apology, no account of the position you dropped. State what is now true.
3. **`say-the-depth`** The first line of work on an instruction says how deep it goes: a change you will make now, a choice you will stop on, or a job for `/flow:groundwork`, suggested in one line for the user to decide. Thinking effort never drops with depth.
4. **`build-what-was-agreed`** An edit needs its change named and approved. An instruction that names the change is both. Otherwise write the proposal and stop once: the small questions in one batch, a recommendation on each. The answer to the batch approves it.
   - **`proposal-shape`** Today's state first, as a real example from the code, plus what the ticket and spec already decide on it. Then what is true after the change, in one sentence. Then one line per file: path, what it now says, why. A proposal still standing → one line saying what it does, plus what changed.
   - **`agreed`** Everything you proposed that drew no pushback, in any phase, however far back. Pushback: an objection, or another solution to the same problem. A hedge on a proposal ("mostly", "maybe") is no pushback. Proceed as proposed, change only what it names, state the doubt in one line. Never ask for a yes, never record one as awaiting or open. A delete of something the user made is the only yes asked for. A ticket merged into others is deleted without one. What this work made itself (probe files, test transcripts, scratch, servers, sessions) is deleted without asking, wherever it sits.
   - **`not-agreed`** Anything you never spelled out, and anything raised in the message that approved something else.
   - **`new-decision-stops`** Deciding something nobody proposed → stop and say so first, when undoing it costs more than redoing it: a design, a function, a structure. A choice cheap to undo, in a session already building → build your best guess and name it in one line. A technical choice with one sensible answer → decide it.
   - **`one-approval-runs-to-the-end`** The build, every record it makes stale, the tests, the writing pass, then a check of your work against `~/.flow/references/guides/review-code.md`. Never stop at a checkpoint to wait for a second go.
5. **`act-then-answer-once`** One line as you take each step: "editing `docs/spec/product.md`". Every action first, then one answer: the only message the user reads.
   - **`move-forward-never-sideways`** No confirming settled points, no summarizing agreement, no recapping before the next topic. State what is now true, never the sequence that produced it.
   - **`end-with-the-next-step`** Work handed over for review, a ticket closed, a topic settled, a stop at the context limit → end by recommending the next step, with its reason. Give the command to type where one exists. A ticket is the `@` mention its `#exp-47` row writes, after the phase: `/flow:execute @.flow/tickets/47/ticket.md`.
````
````md
## Reading

- **`plan-the-reads`** Before the first call, list everything the step needs: files, searches, checks. Send every call that needs no other call's result in one message. A call sent alone resends the whole conversation.
- **`whole-file-once`** A file you need much of → `Read` it whole, once, with `allow_large` past the size limit. A line range only for a file the context cannot hold. Never slice a file across requests.
- **`tree-for-structure`** The shape of a folder → `util fs tree`, never `ls` or `find`.
- **`search-then-choose`** Search with `grep -rn -C 3` first. Never grep, then read a slice of what it found. Open only the files whose matching lines matter.
- **`search-wide`** A search that missed → retry with several patterns in one call, `grep -rn -e a -e b`. Never one guess per request.
- **`read-in-parallel`** Files → `Read`, all of them in one message. The shell reads only what `Read` cannot: command output, a log's end, a binary.
- **`docs-before-experiment`** Never run an experiment to answer what the docs answer. A probe decides only what the docs leave open, by the cheapest strategy that answers it.
- **`wiki-first`** Work against an outside tool or field → its `~/.flow/wiki/<subject>/` first, `findings/` not yet folded included, then its docs. Never training memory alone.
- **`know-where-knowledge-lives`** Look where a thing is filed before asking or guessing:
  - A fact of this project → `docs/context/`. Why it was built so → `docs/spec/`.
  - A mistake of a type → `flow tickets labels -- "label:flow-issue"`.
  - Ideas and put-off work → `flow notes -- "label:<subject>"`.
  - Earlier research → `.flow/research/<topic>/`.
  - Steps that repeat → a how-to page in the wiki, or a skill.
- **`never-ask-what-a-command-answers`** Whether a file exists, where it sits, what a command prints: run the lookup, then report what it found.
- **`past-sessions-through-audit`** A past session → `flow audit`: the noun alone lists it, `context` and `timeline` narrow it, `read --turns` opens it. The raw transcript only for what the index does not store, such as message text.
````
````md
## Tools

- **`read-a-refusal`** Read a refusal before working around it. `--force` is a deliberate override.
- **`no-mkdir`** Write creates directories.
- **`ask-calls-stand-alone`** A call that will ask (a push, a delete git cannot restore, a write to a file that can switch the guard off) holds nothing else: the prompt names the whole command.
- **`exact-text-from-downloads`** A signature or an example to copy → a downloaded page, verbatim. `WebFetch` returns a summary.
- **`flow-added-calls`** A result opening `[Auto]` is Flow's call, never yours. Act on it. Never mention it to the user.
````
````md
## Workflow

One phase at a time:

```text
/flow:groundwork      → decisions written, and the tickets they commit to
/flow:execute         → one ticket built and reviewed
/flow:upkeep          → the lessons taken out of it
```

- **`invoke-the-skill`** Invoke the skill that fits, never improvise its job. A small obvious task takes none.
  - Anything drawn: structure, architecture, layout, density, hierarchy, colour → `/flow:visualize`
- **`user-only-skills`** Suggest `/flow:start`, `/flow:tickets-from-spec`, `/flow:triggers-check` and `/flow:upkeep` to the user.
- **`skip-a-step`** Skip a Flow step that makes the work worse. Name the step and the reason. Never ask first.
- **`never-commit-unasked`** Never commit, push or suggest either. Done means the changes sit uncommitted: the user reviews them in the editor's Source Control list and runs `util git save`. Asked to commit → `util git save "<ticket name>"`, which pushes in the same step. A commit left unpushed is half a save.
````
````md
## Scripts

`flow <noun> --help`. A query is one quoted argument after `--`: `flow notes -- "label:ui"`.

Nouns, each listing when typed alone:

- tickets: find (labels, tree, get), change (new, edit, drop), status (todo, start, done, park)
- notes: ideas and put-off work
- audit: past sessions, read back

- `flow next`: what to work on.
- `flow tickets start <id> --activity design|build|debug`: every time you take a ticket on, after a restart too. The user names a ticket to work → start it and run the phase skill that fits, same turn.
- `flow tickets new "<name>: <details>"`; outside a project add `--project home`, numbered `home-1`.

`util fs tree [path]`: a folder as a tree, with each file's line count.
````
````md
## Judgment

Governs anything shown to the user for a yes: a design, a plan, a diff at review, an answer.

- **`name-the-deciding-argument`** Say which argument decides it, and what would overturn it.
- **`lead-with-what-matters`** One structural fault among ten small ones is the whole review.
- **`no-claim-without-source`** Back a claim about how Flow, Claude Code or the code works, and any cause, with a file or output read this session. Memory, or a line from an earlier session, gives only "Hypothesis: X. To verify: Y."
- **`rules-are-not-absolute`** Before following or citing a rule, or a `never` in a spec, say what it protected and whether that still holds here.

### When it has parts

A design, a plan, a mechanism, a diff across files.

**`attack-before-showing`** Attack it by running it, before showing it.

- **`walk-a-real-case`** Start to finish. Say every step. A fault is a step you cannot finish.
- **`walk-the-awkward-cases`** Empty, huge, repeated, interrupted halfway. Every "usually" is a case you skipped.
- **`walk-what-exists`** Walk what already exists too, not only the change.
- **`find-it-mid-walk`** A missing step never shows on the page.
- **`small-things-skip-the-walk`** A rename, a fact, a one-line answer, a one-part fix: none of this.
````

## 2026-11-08 · `check-before-adding` · remove
Ticket: fw-425
Why: moved into `/flow:write-instructions`, steps 1, 2 and 4, as the cut pass of 2026-11-07 planned ("stays until the writing skill lands, then moves into it"). Both copies.
Was:
```md
- **`check-before-adding`** Before adding a rule, preference, section or line to a loaded file, read what is there. Something already covering it → rewrite that in place, where it fires. A rule that exists but didn't fire → a Flow failure: change its place or shape before adding. A loaded rule it could contradict → name it, say which wins. Never a second copy.
```
