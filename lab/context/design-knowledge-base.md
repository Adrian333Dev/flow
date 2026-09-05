# Knowledge system — design

Research is complete. The design discussion locked all decisions across 5 sessions, the last of them 2026-09-05, which closed the semantic-rule gap the enforcement bridge had left open. This file carries the locked decisions, the research inventory, and the build plan.

## Locked decisions — the knowledge system

### The name

The mechanism is the **knowledge system** — it captures, stores, surfaces, and maintains what the agent learns across sessions and projects. "Knowledge system" over "memory system" because memory is passive (store and recall); what Flow builds is active (capture, organize, promote, age, enforce).

### Capture — `.flow/findings/<subject>.md`

During work in any phase, the agent writes reusable knowledge directly to `.flow/findings/<subject>.md` — one file per subject, organized by topic, not chronologically. A Prisma finding goes to `.flow/findings/prisma.md`. A prompting technique goes to `.flow/findings/prompting.md`. Files can be 10 lines or 500 lines — research output, tool behavior details, library quirks, conventions discovered.

**Format**: plain markdown with sub-topic headings (`## Connection pooling`, `## Migration quirks`). No frontmatter, no metadata. File-findings routes by content, not by when something was captured. New findings on the same sub-topic update the existing section (topic-key upsert).

**Duplicate filter**: before writing to findings, check whether the loaded skill already covers it. If it does, skip. Contradictions and extensions are new knowledge — write them, and file-findings edits the skill when promoting.

The inbox (`.flow/inbox.md`) stays for work items: potential tickets, fragments, half-formed ideas. Knowledge and work items are different streams captured to different places.

The Capture section in `home/CLAUDE.md` needs one routing-rule addition: reusable knowledge → `.flow/findings/<subject>.md`, inserted between the project-fact line and the decisions line. The "everything else → inbox" catch-all stays. If the agent knows the knowledge is reusable and knows the subject, findings. If unclear, inbox.

### Promotion: `/file-findings`

`/file-findings` is the single mechanism that moves knowledge from project-local capture to its global destination. It reads 5 inputs:

- `.flow/inbox.md`, work items
- `.flow/findings/*.md`, knowledge captured during work
- Closed unfiled tickets
- The groundwork map this session closed
- `flow scorecard`, how the existing checks are doing

It routes each item:

- Descriptive knowledge with a matching skill → that skill's `references/`
- Universal prescriptive rule → `rules/<topic>.md` (symlinked to `~/.claude/rules/`)
- Stack/context prescriptive rule → `rules/<topic>.md` with `paths:` frontmatter
- Project-specific prescriptive rule → `.claude/rules/<topic>.md`
- Project-specific fact → `docs/context/<subject>.md`
- No matching skill → flag in inbox as `needs skill: <group>/<subject> (<note>)`
- Work item → ticket or stays in inbox

Filed items are cleared from findings and inbox. Findings files fully drained are deleted, never emptied, because an empty file with a subject name is noise.

**Every rule written or changed gets its check in the same pass**, wherever a function can tell violations apart. `references/write-checks.md` carries the how.

**The input source determines routing behavior, with no modes and no flags.** Inbox items need triage (what is this? where does it go?). Findings items are already identified as reusable knowledge and organized by subject, so they skip triage and go straight to destination routing. Closed tickets and groundwork maps stay as they are.

**The ticket sweep is the safety net for capture.** With findings capture in place, most knowledge is already in `.flow/findings/` by ticket close. The sweep catches what the agent missed during the build and marks tickets as filed. The mechanism is unchanged; it produces fewer findings.

**File-findings never runs mid-session.** Promoting to skills writes through symlinks into the Flow repo, which invalidates the prompt cache. Capture happens during work (zero cache impact); promotion happens at session end or in a dedicated session.

### Surfacing — the loading ladder

Knowledge defaults to the lowest loading tier and is promoted only with evidence:

- **Skill `references/`** (default destination) — loaded only when the skill fires. Most knowledge stays here.
- **`.claude/rules/` with `paths:` frontmatter** — loaded when the agent reads a matching file. For rules tied to a file type or directory.
- **`.claude/rules/` without `paths:`** or **`home/CLAUDE.md`** — loaded every session. Only for universal rules that apply regardless of stack or context.

Promotion up the ladder requires evidence: repeated corrections, repeated violations measured by the compliance scorecard. Knowledge that loads every session but never applies is wasted context — every loaded token gets re-read on every message in the conversation.

### Aging — no scheduled maintenance

Three mechanisms, no timers or scheduled jobs:

1. **Default low, promote with evidence.** New knowledge enters at skill references. Promotion to rules requires the agent repeatedly violating a convention or the user repeatedly correcting the same thing.
2. **Demote via dead-rules-audit signal.** Rules that load but never apply get flagged for demotion — move back to skill references, or delete.
3. **Update on conflict.** New findings that contradict existing knowledge supersede the old record. The agent notices the contradiction during work and updates.

### What knowledge types exist

Four types, each with a different final destination:

- **Tool/library knowledge** (descriptive, detailed, 50-500 lines) — how a tool actually behaves. Goes to skill `references/`.
- **Rules and conventions** (prescriptive, short) — "always do X." Goes to `rules/` or project CLAUDE.md depending on scope.
- **Patterns and techniques** (instructional, medium) — "when doing X, approach it this way." Goes to skill `references/` or `rules/` depending on scope.
- **Project-specific facts** (descriptive, varies) — "this repo uses X." Goes to `docs/context/<subject>.md`. This already works today.

### What each project-level folder holds

- `.flow/inbox.md` — work items, fragments, ideas. Not knowledge. Drained by file-findings into tickets and project docs.
- `.flow/findings/<subject>.md` — reusable knowledge captured during work, organized by subject. Temporary staging. Drained by file-findings into skills and rules.
- `docs/context/<subject>.md` — project-specific facts. Permanent. Not promoted.
- `.claude/rules/<topic>.md` — project-specific prescriptive rules. Permanent in this project.

## Locked decisions — the enforcement bridge

Locked 2026-09-05, across the session that also resolved the semantic-rule gap.

### The three tiers

1. **Measure** — the rule is text the agent reads. A check counts violations silently. Nothing interrupts.
2. **Warn** — the same check runs before the edit and returns a message the agent reads. The edit proceeds.
3. **Block** — the same check rejects the edit. Reserved for rules with no false positives.

Most rules stay at measure. Promotion needs evidence from the scorecard.

### One script does all three jobs

Recording, warning and blocking are the same check at the same moment. One `PreToolUse` hook on `Edit|Write` runs one script, and each check's own `tier` field decides what the script returns. No hook per rule, and no separate warning script.

`permissionDecisionReason` on an `allow` reaches the user, never Claude. A warning the agent must read goes in `additionalContext`. Writing it into the other field sends it to the terminal and nowhere else.

A sync hook adds latency to every edit, roughly 50 to 100 milliseconds. Measure it rather than guess. The async alternative delivers its output on the next turn and cannot block.

### Knowing which rules are loaded

An `InstructionsLoaded` hook fires whenever a `CLAUDE.md` or a `.claude/rules/*.md` file enters context. It reports `file_path`, `memory_type`, `load_reason` and the `paths:` globs. It fires again with `load_reason: "compact"` after a compaction, so the record survives one.

The scorecard hooks it and keeps a per-session list of loaded files. A warning then takes 1 of 2 forms:

- **Rule file loaded** → the check's message plus the rule ID. The agent already holds the full text.
- **Rule file not loaded** → the hook reads that rule's text out of the file and injects it in `additionalContext`.

Injecting beats telling the agent to go read the file. No extra turn, and no chance it skips the read.

### The check files

One file per check at `scripts/rule-checks/<id>.js`, exporting everything about itself:

- `id` — groups the counts, and matches a rule ID in a rule file
- `rule` — path to the file holding that rule
- `tier` — `measure`, `warn` or `block`
- `applies(path, content)` — is the rule relevant to this edit
- `check(path, content)` — was it followed
- `needs` — `'added'` for only the text this edit introduces, `'file'` for the whole file as it will read afterwards
- `message` — the one line the agent reads on a violation
- `since` — the date the check last changed materially, so `flow scorecard` skips counts an older version produced

The folder is the registry. Adding a check adds a file. Promotion changes one word.

**No registry file.** Flow made this call for skills already: a second list is a second thing to update, and it goes stale the first time somebody forgets. A ticket earns registration because it has a lifecycle and outside references. A check has neither.

`Edit` and `Write` hand a check different things. `Edit` gives the old and new fragment, `Write` gives the whole file. Each check declares which it needs.

**A check can be any JavaScript function**, not only a regular expression. Text search, comment-line counting, sentence length, file-read ordering. The boundary is whether a function tells violations apart reliably, never whether a regular expression can express it.

### Rule IDs

Every rule gets an ID, written inline in the bold slot where the label sits today:

```
- **`no-git-mutations`** No `add`, `commit`, `push`, `checkout`, `reset`, `rebase`, `merge`, `stash`.
```

**The ID states the rule. The body says only what the ID cannot.** Following that ID with "Never run git mutations" spends tokens repeating it. Written this way the ID replaces the old bold label rather than adding to it, so the cost is close to zero.

Inline, never a heading per rule. The token difference runs about 4 tokens either way, so it decides nothing. A hundred H2 sections is not a file anyone skims.

Every rule gets one, never a subset. Mixed is more confusing than either extreme. An ID also makes a rule citable from a study case, a backlog line or a commit message, where quoting it is what happens today.

Extracting one rule's text means reading from a bullet to the next bullet at the same indent.

**A checked rule lives in `rules/`.** Those files are symlinked, so one copy exists. `home/CLAUDE.md` is copied and personalized at install, and the 2 copies drift on purpose.

### `flow scorecard`

Reads every session file under `~/.flow/scorecards/`, adds the counts across all of them, and prints 4 lists:

- **Stale checks** — the check names a rule ID no rule file defines
- **Violated most** — rule, count, rate
- **Ready for promotion** — past the threshold, meaning measure becomes warn
- **Never applied** — loaded every session, never once relevant

Thresholds start at 5 violations and a 60% rate. Both are guesses until real data exists.

The summary states its own coverage: `12 rules measured, 89 not measurable`. Without that line a clean report reads as a clean session, when most rules were never checked at all.

The agent may run the command, which only reads. Acting on it edits a check file, and that needs approval like any change.

### Recording

Append one line per result. Never read, modify and write back: 2 hooks firing close together overwrite each other's counts.

Each session file records which project it ran in. That answers "violated in one project and nowhere else", which is the signal a global rule should have been project-scoped. Free now, impossible to backfill.

A session with no edits writes no file, so the reader handles a missing one.

### What counts as a dead rule

`relevant = 0` across many sessions, and nothing else. The situation the rule governs stopped arising, so the rule pays context rent for a case that no longer exists. Move it down the ladder.

**Never violated is not a dead rule.** A rule only gets written after a real mistake, so zero violations means the fix took. Removing it reintroduces the bug. For a promoted rule, zero violations means the warning is doing the work, and the only testable change is dropping it back to measure.

### Tracking what was read

The scorecard reads the current session's transcript at `~/.claude/projects/<project>/<session-id>.jsonl`, which Claude Code appends as the session runs. The hook payload carries `session_id`.

No second hook on `Read`. Read fires far more often than Edit, and the transcript already holds reads from before any hook existed. Cache the byte offset already scanned.

This is what makes "read `style.md` before writing a skill" a check somebody can write.

### Staleness runs both directions

- Every check names a rule ID, and some rule file must define it. Missing fails the test.
- Rules with no check get listed as information, never a failure. That list is what to make measurable next.

`npm test` covers Flow's own tree. `flow scorecard` covers a user's project, since it already reads every check and every rule file.

### Global and project scope

Checks live at `scripts/rule-checks/`, global to the machine. A project check would live at `.flow/checks/<id>.js`, with the scorecard loading both folders.

**Build the global half only.** No project needs one yet, and a mechanism built ahead of its first case gets built wrong.

### False positives

A wrong warning gets written to `.flow/findings/scorecard.md`. That path already exists and `/file-findings` already drains it. With no recording path, refinement waits on the user noticing, which is the manual work the bridge exists to remove.

Block only after path scoping and pattern refinement clear the false positives.

### Rules no function can catch

Those get a `UserPromptSubmit` hook injecting a short reminder each turn. Still undesigned: what it says, its length, whether it changes between turns, and its token budget. It costs tokens on every turn forever, so the budget decides the shape.

### Who writes the checks: `/file-findings`

Set by the user 2026-09-05, overturning the separate `rule-checks` skill proposed earlier the same day. One skill writes the rule and writes its check, in one pass.

**The argument that decided it: a rule and its check are written at the same moment.** The split assumed they were weeks apart, the check arriving once the scorecard showed the rule failing anyway. They are not. A check starts at `measure`, which interrupts nothing, so one built from a single example costs nothing when it turns out wrong. Waiting for more examples leaves the rule unmeasured for exactly as long as you wait.

Size was the other argument for splitting, and `references/` answers it. `/groundwork` is 258 lines with a 139-line `write-spec.md` beside it, read only on the runs that need it. `/file-findings` gets `references/write-checks.md` on the same pattern, so check instructions cost nothing on the runs that write no check.

**The name stays `/file-findings`.** `/promote-findings` was proposed and rejected as near enough in meaning to buy nothing for a 23-file rename sweep.

The periodic scorecard sweep is not a second skill either. It is `/file-findings` entered with no findings to drain, reading `flow scorecard` as its fifth input.

Not `dev/`, for whichever skill holds this. That group builds Flow itself, and rule enforcement is something a user runs in their own project.

## Locked decisions — supporting

### `commands/` is dissolved, and 2 groups replace it

Set by the user 2026-09-05, overturning the "closed and not reopenable" decision that stood before it. Built the same day. Each of the 4 skills moved to the group that fits what it does:

- `start` and `handoff` → **`session/`**, a new group. One opens a session and loads what the work needs, the other closes it and writes what the next one needs.
- `file-findings` → **`knowledge/`**, a new group. It is the only member, and it stays the only member: check work merged into it rather than becoming a second skill.
- `cut-from-spec` → **`tools/`**, beside `research` and `visualize`. All 3 are invoked to do a job inside other work.

Groups are now `phases/`, `session/`, `knowledge/`, `tools/`, `stack/`, `dev/` and `drafts/`. The repo `CLAUDE.md` rule that read "`commands/` is closed" became "`phases/` is closed at 4", which is what the old rule was protecting.

### Standards skills are redundant

Path-scoped rules in `.claude/rules/` do the same job as standards skills, loading contextually based on what the agent is working with, and they are a native Claude Code feature. The `standards/` skill group can be removed. If a case appears that rules cannot handle, standards skills can return.

The group was empty already and every doc has dropped it. The folder itself is still on disk, holding only the `.info` file that kept it in git, and deleting it is the user's call.

### The CLAUDE.md split

Topic-specific rules move from `home/CLAUDE.md` to `rules/<topic>.md` in the Flow repo, symlinked to `~/.claude/rules/` by `flow install`. Examples:

- Commenting rules → `rules/comments.md` with `paths:` scoped to code files
- TypeScript conventions → `rules/typescript.md` with `paths: "**/*.ts"`

`home/CLAUDE.md` shrinks to universal rules that apply regardless of stack or context.

### The `rules/` folder

Lives at the top level of the Flow repo, alongside `skills/`, `scripts/`, `references/`. Not under `home/`. `flow install` symlinks per file (never the folder) to `~/.claude/rules/`, same pattern as skills. Same safety: refuses to replace anything that isn't already a symlink. Handled by `--home` in the same pass as skills — no new flags.

### `.claude/rules/` is a standard Claude Code feature

Verified against `code.claude.com/docs/en/memory.md` on 2026-09-05. The page is not cloned under
`lab/research/claude-code-docs/`, so re-fetch it rather than trusting this summary for anything load-bearing.

- Project rules: `.claude/rules/<topic>.md`, loaded for this project
- User rules: `~/.claude/rules/<topic>.md`, loaded for every project
- Rules without `paths:` frontmatter load at launch, **with the same priority as `.claude/CLAUDE.md`**
- User rules load before project rules, so project rules win
- Discovered recursively, so `rules/frontend/style.md` works
- Symlinks explicitly supported, and circular ones are detected
- Plain markdown with optional YAML frontmatter

**`paths:` triggers on a read, never on a write.** The documentation is exact: *"Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use."* An edit is safe, because an edit follows a read. **Creating a new file is not**: write `src/foo.ts` in a session that read no `.ts` file and the TypeScript rule was never in context. This is the hole the enforcement bridge fills. The `PreToolUse` hook fires on `Write` whatever loaded, `InstructionsLoaded` says whether the rule file was in context, and the warning injects the rule text when it was not.

**An unconditional rule file saves no context.** It loads at launch exactly like the text it replaced. Splitting `home/CLAUDE.md` into rule files with no `paths:` is filing, not reduction.

**Flow's symlinked rules are skipped in Cowork desktop sessions.** Those sessions skip a symlinked `~/.claude/rules/` directory or rule file resolving outside the working directory, and `flow install` links every rule file into the Flow clone. Terminal and IDE sessions are unaffected. `CLAUDE.md` is copied rather than linked, so that half is safe.

**Two more facts from the same page.** Block-level HTML comments are stripped before a `CLAUDE.md` enters context, so the placeholder comments cost nothing. The documented size target is under 200 lines per file, and `home/CLAUDE.md` is 191.

### Skill loading at scale

Claude Code loads a listing of skill names and descriptions at session start, not skill bodies. The listing has a character budget (default 1% of context window). When many skills exist:

- Every skill name is always listed
- Descriptions get trimmed starting with least-used skills
- Each description capped at 1,536 characters
- `skillOverrides` controls visibility: `"on"`, `"name-only"`, `"user-invocable-only"`, `"off"`

Flow already uses `skillOverrides` in `home/settings.json` to disable stack skills by default. This is the right mechanism. Backlog idea: set obvious stack skills (React, etc.) to `"name-only"` to save description budget.

### No separate compile step

File-findings is the promotion mechanism. No background compilation (like claude-memory-compiler's), no separate API calls, no spawned sessions. Everything runs within normal conversation.

### Cost

The entire knowledge system and enforcement bridge runs within normal session usage. No background agents, no separate API calls. Affordable on a $20/month plan.

## Locked decisions: conduct rules

Locked 2026-09-05. The thread opened out of `### Rules no function can catch` above, and it is now
the larger half of the rules work.

### Two kinds of rule, and the design so far only covered one

**Output rules** say what a file must contain: comment density, naming, no em dashes. They attach to
a file, a path often selects them, and a function can usually check them. Everything above in this
record was built for output rules.

**Conduct rules** say how the agent behaves in the conversation: when it edits, when it asks, when it
speaks, how much it explains. They attach to no file. No path selects them and no function checks
them. Every entry in `shit-explanations.md` and both study cases under `lab/study-cases/` are conduct
failures, so conduct is where the observed damage is.

### A rule written only as a prohibition amplifies whatever the model already does

The approval rules in `home/CLAUDE.md` all say what approval is **not**. They were written from the
two 2026-08-10 study cases, both Opus 5, both the same fault of acting on a discussion. They worked.

The set has no positive side. The only thing it says about acting is three quoted phrases. An agent
reading it under any uncertainty resolves toward not acting, because that is the only direction the
text points. On a model that leans eager the brake corrects it. On a model that leans cautious the
brake compounds, which is the Sonnet 4.6 behavior the user reported.

**So every conduct rule states its default action, not only its forbidden one.** That is what makes a
rule behave the same across models, and it is the test to apply to each one.

### One rule set for every model

No model detection and no per-model instructions. Nothing in Flow identifies which model is running,
and no mechanism exists to branch on it. Every rule has to work on any model, which is the reason the
positive side above is required rather than nice.

### Disagree first, build on the repeat

The agent that thinks a clear instruction is wrong says so and stops. It builds when the user says it
again. Pushing back once and building anyway was rejected.

### Rules live with their subject, never in a parallel tree

Set by the user, overturning `### The CLAUDE.md split` above for the stack case. Splitting TypeScript
guidance between `skills/stack/typescript/references/` and `rules/typescript.md` scatters one subject
across two trees, and whoever edits it then has to remember the other file exists.

**The enforcement bridge is what makes grouping free.** A check names its rule by path, and the hook
reads that rule's text out of whatever file holds it, so the text does not have to sit in
`~/.claude/rules/` to reach the agent at the moment of an edit. The rule file inside the skill folder
works exactly as well.

What is lost is `paths:` auto-loading, and the section on `.claude/rules/`
above already establishes that `paths:` fires on a **read**. For an output rule that is a cost rather
than a benefit: the rule loads every time the agent reads a matching file for any reason, including
reading someone else's clone. The bridge loads it only on a write. **Grouping is strictly better
here.**

Open, and to settle during the split rather than now: what is left for a top-level `rules/` folder
once every rule sits with its subject. A project's own `.claude/rules/` keeps its use, because a
project rule has no skill to live in.

### `## Scripts` drains out of `home/CLAUDE.md`

46 lines, the largest section in the file, and almost all of it is a command reference rather than a
rule. A skill is loaded before nearly every `flow` command gets typed, so the definitions belong in
the skill that runs them.

What stays is what has to be there with nothing loaded: `util fs tree` and `util fs merge` with the
rule that no structure lookup uses `ls` or `find`, `flow new` for `## Capture`, the fact that both
commands are called bare from any directory, and the line saying `flow` run bare prints the full
surface. That last line is the safety net that makes the drain safe.

The rest moves to the skill that uses it: the status verbs to `/execute`, `flow get --files` to
`/start`, the `flow new` flags to `/cut-from-spec`, `flow ls --unfiled` and `flow file` to
`/file-findings`. The remainder goes to `~/.flow/references/workflow.md`, which `## Workflow` already
names as the fallback.

### Answer once, at the end

Two kinds of text in a turn, each with one place. Short lines naming the action go between tool
calls. The answer goes last, and carries everything.

The existing rule failed because it only said what the final message must contain. An agent can write
a full answer up front and still repeat it at the end, breaking nothing. The prohibition on the
up-front answer was never written.

**Narration is one short line per action, and no more.** "Adding the rule to `rules/comments.md`",
not the reasoning and not the result. The current wording, *think out loud while you work*, asks for
more than the user wants.

### "Go means finish everything" comes back, paired with the wrap-up hook

Cut from `home/CLAUDE.md` on 2026-08-31 because a run with no brake is worse than a run that stops
early. The brake now exists in design: a hook watching the token count tells the agent to stop at the
next checkpoint. With that hook, finishing everything is safe to instruct.

The two get designed together and neither ships alone. `backlog.md` → `## Context and session
boundaries` carries the hook.

### The reminder hook has no token problem

A session runs about 20 turns before `/handoff` and a clear, and the working ceiling is 150k tokens.
A 40-line reminder injected every turn costs under 1,000 tokens across the whole session. Earlier
reasoning in this record treated the cost as unbounded and it is not. What decides the shape is what
the agent still reads on turn 15.

### The three reported behaviors become study cases

Agreed 2026-09-05. Every rule Flow has written came from a recorded artifact, and these three exist
only in the user's recollection: repeating a clear instruction back, re-raising settled points as
open, and splitting one answer across several edits. `shit-explanations.md` holds nothing on any of
them, and both files under `lab/study-cases/` are 2026-08-10 Opus 5 cases about the opposite failure.

### `## The turn`, built 2026-09-05

Approved after 3 rejections, all recorded in `shit-explanations.md`: the first for pointing at its
own headings instead of stating anything, the second for over-explaining, the third for covering half
a turn while the narration rules stayed loose in `## Explaining`.

**It sits first in `home/CLAUDE.md`**, above `## Hard rules`, because `style.md` §2 puts the
highest-stakes material first or last and this is the frame every other section runs inside.

```
## The turn

One user message, your work, one reply. In that order, every time.

**1. Instruction, or thinking?** An instruction names the change, or approves a plan.
Thinking is everything else: a hedge ("maybe", "not sure"), a question, feedback, a reaction.
A long list of feedback is a long list of topics, not tasks. Thinking gets a reply: test it,
disagree where you disagree, recommend. An instruction gets work, never a summary of itself.

**2. Disagree before building, never after.** Say it once, then stop.

**3. Build everything agreed, nothing more.** Agreed: proposed by you, never argued with,
however far back. Not agreed: anything you never spelled out. Deciding something new means
stop and ask. One instruction runs to the last file, never stopping halfway to report.

**4. Name each action as you take it.** One line: "adding the rule to `rules/comments.md`".

**5. Every action first, then one answer.** The last message is the only one the user reads:
it carries the whole answer and a report of every change made. Never a scratch file or
working doc in its place.
```

**Deleted in the same edit.** Two from `## Hard rules`: `No edits without approval` and `Reason
before agreeing`. Two from `## Explaining` → `### Always`: `Assume only the final message is read`
and `Think out loud while you work`.

**Three clauses survive by placement rather than by text.** *Silence settles the point, never the
edit* holds because step 1 decides whether any work starts and step 3 only decides scope.
*Repetition is not evidence* was dropped on the user's argument: an agent that pushes back can be
told a second time, so the clause spelled out what the next turn already handles. *Never restate the
instruction back* sits in step 1, at the moment the decision gets made, rather than in the answer
rules where it is merely derivable.

**Cut on the user's call during review.** *The action, never the reasoning or the result* left step
4, and the repetition clause left step 2. Both restated what the surrounding rule already carried.

**Step 3 carries a known risk.** *One instruction runs to the last file* is the rule cut from
`home/CLAUDE.md` on 2026-08-31, cut because a run with no brake is worse than a run that stops early.
It is back before the wrap-up hook exists, so runaway sessions are possible until the hook lands.
`backlog.md` → `## Context and session boundaries` carries the hook.

**`home/CLAUDE.md` is now 201 lines**, one over the documented target. Draining `## Scripts` is what
brings it back down, and that is designed above and unbuilt.

**The repo `CLAUDE.md` still holds 7 rules saying what these 4 said**: `Never edit a file until the
user approves`, `Silence on a decision is a yes`, `Feedback is not approval`, `Hedging is a no`,
`Being told to build something is not approval`, `Approval covers what was proposed`, `Flagging a
deviation afterwards is not asking`. Each carries a dated user ruling worth keeping, so collapsing
them is a separate edit and was not part of this one.

## Research inventory

### Analysis files under `lab/research/`

Twelve files analyzing external repos, in two batches.

**Batch 1** (user-provided repos, analyzed first session):

- `browser-harness.md` — self-improvement through agent-authored helpers and domain skills. Learning is the work itself, zero overhead.
- `tencentdb-agent-memory.md` — server-side layered memory (L0 raw → L1 atoms → L2 scenarios → L3 personas). Heavy infrastructure, but the layering concept translates.
- `everything-claude-code.md` — first-generation solo-developer approach. Session lifecycle hooks, continuous learning via Stop hook, rules as separate files, strategic compact.
- `ecc.md` — ECC's instinct system (trigger + action + confidence + scope). Real-time observation via hooks, project-scoped by git hash, background Haiku observer, promotion from project → global.

**Batch 2** (cloned to `repos/batch1/`, analyzed second session):

- `claude-mem.md` — 93k stars. Progressive-disclosure retrieval (search → timeline → get), SQLite + FTS5, optional Chroma vector search. Heavy infrastructure (Bun worker, HTTP API).
- `claude-memory-compiler.md` — 1.3k stars. Simplest viable architecture: transcript → daily log → compiled wiki articles → `index.md`. No RAG at personal scale (Karpathy insight).
- `pro-workflow.md` — 2.8k stars. Self-correcting memory (corrections → rules → SQLite), persistent FTS5 wikis, correction heatmaps, adaptive quality gates. 37 hooks across 24 events.
- `codealmanac.md` — 993 stars, YC S26. Cleanest design. Wiki-as-code in `almanac/`, background sync/garden agents, notability bar, intelligence in prompts not pipelines.
- `claude-code-hooks-repo.md` — 498 stars + Anthropic's hookify. dead-rules-audit compliance scorecard (deterministic rule violation tracking, promote→hook flag). hookify creates hook rules from conversation analysis.
- `engram.md` — 6.3k stars. Go binary, agent-decides-what-to-save, topic-key upserts (evolving knowledge stays one record), conflict detection.
- `basic-memory.md` — 3.8k stars. Markdown + wikilinks as knowledge graph. `[category] content #tag (context)` observation syntax. Schema validation via Picoschema.
- `claude-diary.md` — 379 stars. Simplest complete loop: diary → reflection → CLAUDE.md updates. No infrastructure beyond two command files.

### Additional research

- `inspirational-repos.md` — broad sweep, unfiltered, includes low-quality repos.
- `filtered_agent_memory_repositories.md` — filtered to 200+ stars and recent maintenance. 35 repos retained.
- `agentic-atlas-refs.md` — Agentic Atlas pages on statelessness, deferred context, and reference data. Source of the loading-ladder and rent-test concepts used in the aging design.

### Repos cloned and analyzed

All at `repos/batch1/`. Anthropic's `claude-code` also cloned there for the hookify plugin at `plugins/hookify/`.

### Convergent pattern across all repos

The repos that work long-term land on the same three layers independently:

1. **Append-only raw layer** — transcripts, logs, observations. Cheap to capture, never edited.
2. **Derived structured layer** — typed facts, wiki pages, rules, instincts. Built by a separate extraction/compilation pass.
3. **Small always-loaded index** — points into the structured layer rather than containing it. Keeps the context budget intact.

### Mechanisms worth stealing — cross-repo synthesis

Six mechanisms that survive across implementations:

1. **Progressive disclosure for retrieval** — compact index → chronological context → full detail. Flow's skill loading model already follows this.
2. **Topic-key upserts for evolving knowledge** — one file per subject, updated in place. Adopted as `.flow/findings/<subject>.md`.
3. **Notability bar for capture** — not everything is worth remembering. The agent exercises judgment about what crosses the threshold.
4. **Compilation from raw to structured** — raw session logs → structured articles → index. Flow uses file-findings as the promotion step instead of a separate compiler.
5. **Compliance scorecard for rule enforcement** — deterministic measurement of rule compliance, flagging chronic violations for hook promotion. Adopted.
6. **Garden/maintenance for aging knowledge** — periodic review for staleness. Flow uses dead-rules-audit signal and conflict detection instead of scheduled maintenance.

### What none of them do

No repo solves knowledge promotion from project to global cleanly. ECC detects candidates but promotion is manual. Flow's design uses `/file-findings` as the explicit promotion step.

## Build plan

### Built 2026-09-04

Capture and promotion. `home/CLAUDE.md` → `## Capture` routes reusable knowledge to `.flow/findings/<subject>.md`. `/file-findings` reads findings as a fourth input and routes to `rules/` alongside skills. `rules/` exists at the repo top level, and `flow install` symlinks its files per item to `~/.claude/rules/`.

### Built 2026-09-05

The skill and the group moves, which were the last 2 steps of the order below and ran first because the design changed under them. `commands/` dissolved into `session/`, `knowledge/` and `tools/`. `/file-findings` moved to `skills/knowledge/` and gained `flow scorecard` as a fifth input, a check step in `## Method`, a `## Checks` section, and an 89-line `references/write-checks.md`. `write-skills.md`, `docs/dev/skills.md`, `docs/dev/layout.md`, `README.md` and the repo `CLAUDE.md` carry the new groups. Nothing enforces anything yet: the skill describes a hook and a folder that do not exist.

### The order for the rest

1. **Split `home/CLAUDE.md`.** Topic rules move into `rules/*.md`. **Every rule gets an ID in the same pass**, across `home/CLAUDE.md`, the repo `CLAUDE.md` and every file the split creates. One pass, never two: doing IDs first edits every rule twice, doing them after sweeps every file again.
2. **Mine the 2 projects.** Delapse and lumacraft_v2, from the live checkouts at `~/code/projects/`, since the copies under `repos/` may be behind. Both carry a `CLAUDE.md` and `docs/agents/conventions.md`. Delapse adds `workflow-rules.md` and `superpowers-overrides.md`, lumacraft_v2 adds `testing.md`. Universal → `rules/<topic>.md`. Tied to a language or file type → the same with `paths:`. True of one project → stays there.
3. **The first check.** `scripts/rule-checks/comment-density.js` against `rules/comments.md`. Commenting rules are universal, broken constantly, and mechanically checkable, so that pair runs the whole loop on one small case.
4. **The scorecard script.** The `PreToolUse` hook on `Edit|Write`, the `InstructionsLoaded` hook, append-only recording.
5. **`flow scorecard`.** Aggregation across sessions, the 4 lists, the coverage line.
6. **Tests.** `npm test` for staleness both directions, `bash lab/scripts/try.sh` for a live session with the hooks firing.

Documentation comes after. Manual pages and the Claude Code reference page are separate work.

### Separate from this design

- **Documentation and examples for workflow artifacts** — ticket templates, groundwork examples. Needed but not part of the knowledge system
- **`name-only` skill overrides for obvious stack skills** — backlog idea, saves description budget
- **Manual pages** — a capture page and a knowledge-system page. The manuals folder is planned and unbuilt, so no path is settled
