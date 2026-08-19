# Threads — opened one at a time

Three discussion threads, opened by the user 2026-08-08. Each is written to be re-opened **cold**, months
later, by an agent that has read nothing else. Nothing here is decided; nothing here is a build item until it
produces one.

**Refer to a thread by its name, never by a number.** The three names:

| Thread | One line | State |
|---|---|---|
| **extension-points** | skills vs. commands vs. agents — Flow uses skills for everything and never compared them | **← active, 2026-08-08** |
| **judgment** | the agent proposes without criticizing its own proposals first; the user is the only judge | next, and the important one |
| **refs** | mine the repos cloned at `wip/refs/` for ideas | pulled from as needed, not a session of its own |
| **subagent-mechanics** | what a parent can do to a subagent, and what it would take to run several at once | parked 2026-08-14, revisit when a subagent actually runs |
| **assignments** | a dispatched job may not need a handoff document at all — a child ticket may already be one | raised 2026-08-15, to discuss |
| **install** | `setup-flow-globals` and `migrate-to-flow` collapse into one skill covering every starting state | raised 2026-08-15, to discuss |
| **ascii-engine** | hand it JSON, get back the drawing — full write-up in `design-ascii-engine.md` | raised 2026-08-19, to brainstorm in its own session |

`remaining.md` → `## Design threads still open` holds the older parked list. This file holds these three,
which are bigger and one of which may reshape the workflow. When a thread closes, its outcome moves into
`remaining.md` and the entry here is deleted.

**Why extension-points is active first,** reversing the recommendation given earlier the same day: the user
put three concrete proposals on the table (handoff as a command, a start command, debug as an agent), so the
thread is already open. It is also the cheaper of the two, it blocks **judgment**'s form, and `remaining.md`
items 2c–2g are five skill rewrites that would be written against whichever answer wins — same
do-the-work-twice risk as the parked topic decision.

---

## extension-points — skills vs. commands vs. agents

**Recorded 2026-08-07 as parked. Un-parked by the user 2026-08-08. Active.**
Supersedes the one-line entry in `remaining.md` → `## Design threads still open`.

Claude Code has three extension points. **Flow uses one of them for everything**, never having compared them.
Eight skills, zero commands, zero subagents. The user's stated suspicion: the other two concepts exist for a
reason, and building everything as a skill may have produced a design that is wrong in places.

### The three, defined

- **Command** — a prompt template fired by name (`~/.claude/commands/foo.md` → `/foo`). Its text is injected
  into the current conversation as a user turn. Takes arguments (`$ARGUMENTS`, `$1`), pulls files with
  `@path`, and can run shell with `` !`cmd` `` so the output is *in the prompt before the model thinks*.
- **Skill** — a folder (`SKILL.md` + bundled files) the model reaches for when it recognizes the situation.
  Only `name` + `description` sit in context permanently; the body loads on invocation. Portable beyond
  Claude Code.
- **Subagent** — a separate context window with its own system prompt, tool allowlist and model
  (`~/.claude/agents/foo.md`). The parent dispatches it and receives only a report. Runs in parallel;
  can run a cheaper model.

**The command/skill line has largely dissolved** — both can be typed as `/name`, both can be model-invoked, and
a skill with `disable-model-invocation: true` *is* a user-only slash command. What still separates them is
argument interpolation and shell preloading. What separates agents from both is categorical: **an agent is the
only one that does not spend the parent's context.**

### The test to apply to each capability

1. Must the model recognize *on its own* when to do this? → **skill**
2. Is it fired by the human at a chosen moment, does it take an argument, does it need state loaded before
   the model reasons? → **command**
3. Is the work context-heavy and is only the conclusion needed downstream? → **agent**

**Not either/or.** A skill or command is a *procedure*; an agent is a *worker the procedure hires*. The likely
shape of the answer is not "move things out of skills" but "let skills dispatch agents."

### The argument that makes this urgent

Flow spends more design effort on context economy than on anything else — telegraphic style, progressive
disclosure, handoffs, the planned context-pulse hook, archiving terminal tickets so the pool stays readable.
It has never used the one extension point whose entire purpose is context economy. Meanwhile the design has
been *assuming* subagents for weeks without defining one: `remaining.md` 2g specifies `code-review` as
"a reviewer subagent given base/head SHAs"; 2f keeps a Haiku delegation path; and `handoff/SKILL.md`'s **job
brief** is a subagent-dispatch protocol implemented as prose and manual copy-paste, because the concept that
does it natively was never on the table.

### The audit — every capability against the test, 2026-08-08. PROPOSED, NOT DECIDED

⚠️ **This audit was run against `skills/`, and `skills/` is stale.** Caught by the user, 2026-08-08. The
eight files on disk describe the **old** chain — `remaining.md` says four of them (`brainstorm`, `execute`,
`organize`, `handoff`) name paths the design has already deleted. So the rows below judge some capabilities
by a description of what they used to do. **They have to be re-run against each skill's rewrite, not
before it.** Two rows are known-shaky on these grounds and flagged in place.

Two rows also cover skills that **do not exist yet** — `debug` and `code-review` are unbuilt. Deciding their
extension point up front is cheap and prevents a rewrite; it is not the same kind of claim as the others.

**The rule applied for command-vs-skill:** a command buys exactly two things — argument interpolation and
shell preloading. **If a capability does not clearly benefit from both, it stays a skill.** Moving something
for tidiness is churn.

| Capability | Verdict | Why |
|---|---|---|
| `brainstorm` | **skill**, gains dispatch | long user dialogue, model must recognize when to map a space. Phase 1's codebase exploration is context-heavy and disposable → dispatch it |
| `research` | **skill**, gains dispatch | the skill is the method (which rung, where findings land); the reading is the agent. It already says so in prose at `## Delegating heavy reading` |
| `execute` | ⚠️ **no verdict** | the file on disk is the most stale of the eight — it executes a `plan.md` that no longer exists. Judge it after 2f rewrites it, and settle the haiku question below first |
| `explain` | **skill** | the model must recognize when structure has to be conveyed; bundles a large reference read on demand. But see the reopened ruling below |
| `debug-web-pages` | **skill**, gains dispatch | same split as general `debug`: method here, hunt in an agent |
| `organize` | **skill** — no change | user-fired, but takes no argument; inbox preload is a single tool call. Not worth the move |
| `curate-skills` | **skill** — no change | benefits from neither of the two things a command buys |
| `handoff` | **command**, confirmed 2026-08-08 | takes a steering argument, and its content depends on `git status --short` + ticket state that `` !`…` `` can put in the prompt *before* the model reasons. **A command is still model-invocable** — that is what `disable-model-invocation` exists to switch off, and it stays off here. Reason strengthened, not weakened: the user fires this deliberately, which is test #2 exactly. **Context-pulse is deferred indefinitely** (user, 2026-08-08) — it answered short context windows on older models; at 1M it is user-triggered in practice, so nothing depends on auto-firing. **Built 2026-08-08** — `skills/handoff/SKILL.md` → `commands/handoff.md`, prefetching `git status --short` and `flow status`. The earlier "wait for the skill rewrite" argument was wrong: the rewrite changes where the file gets written and the resume-vs-brief split, which is disjoint from frontmatter and prefetch |
| `start` (new) | **command** | strongest case in Flow: takes an id, needs the ticket text inlined, fired deliberately, opens the pickup judgment `remaining.md` 2e calls "the only real decision in the system" |
| `debug` (unbuilt) | **skill + agent** | the method must run where the edits happen; the hunt — reproduce, bisect, read logs — is context-heavy and disposable |
| `code-review` (unbuilt) | **agent**, triggered by `flow review <id>` | `remaining.md` 2g already specifies a reviewer subagent |
| `setup-flow-globals`, `migrate-to-flow` (unbuilt) | **skill** | once-per-machine / once-per-project, no argument, nothing to preload. `migrate` dispatches its codebase survey |
| `prototype` (undesigned) | — | no verdict; the skill itself has never been designed |

### The finding that matters

**Flow already has five subagents. They are written as prose instead of definitions.**

1. `execute/haiku-worker.md` — a system prompt for a dispatched worker, stored as a skill sub-file that the
   subagent is told to go read. That is an agent definition in the wrong place.
2. `execute/SKILL.md` → `## Debug Agent Handoff` — a hardcoded `Agent(model="sonnet", …)` call with the
   prompt inlined.
3. `research/SKILL.md` → `## Delegating heavy reading` — a brief spec with no agent to send it to.
4. `handoff/SKILL.md` → the **job brief** — a subagent dispatch protocol executed by manual copy-paste.
5. `remaining.md` 2g — the reviewer, specified and never built.

So this is not "add a new concept to Flow." It is "let five things that already exist stop being prose."

### ⚠️ Counter-evidence Flow already has, which the audit ignored

Found only after the user pushed back, 2026-08-08. **Flow has already rejected a subagent-heavy design, on
measured evidence, and the audit above did not account for it.**

`session-new-plugin.md` records a study case — `study-cases/handy-workspaces/`, a nine-task feature executed
under the superpowers workflow. **~1.1M tokens and 90 minutes for work that should have taken 15.** The
recorded root cause: *"per-task implement+review subagents (each starting cold), final whole-branch review
(90k tokens), mega fix-agent (124k tokens)."* The same log deletes superpowers' `subagent-driven-development`
skill outright, quoting the user: *"really annoying."*

So the honest statement of the trade is **not** "subagents are free context." It is:

- **Cheap** when the dispatched job is *self-contained and read-mostly* — read this corpus, answer this
  question, locate this symbol. The parent pays for a brief and a report.
- **Ruinous** when the dispatched job *needs the parent's context to do the work*, because every cold start
  re-derives it, and the re-derivation is invisible in the parent's window until the bill arrives.

Every roster entry below has to be argued against that line, not against "does it save context."

### Proposed agent roster

Each one is a file at `~/.claude/agents/<name>.md` — a system prompt plus a tool allowlist plus a model
choice. The main agent hands it a brief, it works in its own context window, and it returns one report.
Names are placeholders.

| Agent | What it is handed | What it returns | Read-mostly? |
|---|---|---|---|
| `doc-reader` | a question + paths to fetched docs under `docs/research/` | findings, each citing where in the source it came from | yes — clean fit |
| `debug-investigator` | a failing command + its output + the diff | root cause, or the evidence gathered and why it is still unclear | yes — clean fit |
| `codebase-explorer` | "what does the code that ticket t047 touches look like now" | signatures, the seam, what is surprising | yes — clean fit |
| `code-reviewer` | base/head SHAs + the ticket's requirements | strengths / issues / assessment (`remaining.md` 2g) | yes — clean fit |
| `critic` | a written proposal + the constraints it must satisfy | the strongest arguments against it | yes, **if** the proposal is written down first — see **judgment** |
| `haiku-worker` | ⚠️ **contested — see below** | | **no.** It edits code from a plan the parent wrote. This is the shape the 1.1M-token case burned on |

**`codebase-explorer` answers a carried-open problem.** `remaining.md` 2e: *"⚠️ Carried open from 08-05:
nothing forces the 'examine current state first' pass, and it is the load-bearing half of the plan."* A pass
that is a dispatch cannot be skipped the way a paragraph of instructions can. Same agent serves brainstorm
Phase 1 and `migrate-to-flow`'s survey.

### ⚠️ Contested: does the Haiku worker survive at all?

**The user stated 2026-08-08 that it was decided to remove it. The written record says the opposite, twice.**
Nobody has re-checked; recorded here so the disagreement is not lost.

- `remaining.md` 2f: *"Haiku delegation and the debug-agent handoff survive as-is; `haiku-worker.md` path
  refs stay valid."*
- `global/CLAUDE.md` `## Workflow`: *"todo → in-progress → review → done, **Haiku subagents by default**."*

Possible sources of the mismatch: the deletion that *is* on the record is superpowers'
`subagent-driven-development`, a different thing; and `execute` is being rewritten wholesale under 2f, so
"it's going" may be a decision made in conversation and never written down. **The user's call. If it goes,
`global/CLAUDE.md` line 50 and `remaining.md` 2f both need correcting, and `execute/haiku-worker.md` is a
delete.**

### A settled ruling this reopens

**`explain` bans SVG on measured cost** — ~10 min and ~80k tokens per diagram, in the main context. A
subagent that renders and returns only the artifact changes that arithmetic. The ban may still be right on
other grounds, but **the ground it was actually decided on no longer holds.** Re-check it alongside the
parked excalidraw verdict rather than assuming either way.

### Least confident

- `handoff` → command is the weakest of the two command calls. The preload is real but small.
- The `explain` reopening is an inference from a number in `remaining.md`; the actual measurement was not
  re-run.
- `research` rung 4 hands prompts to the **user** to run in external LLMs. That design predates considering
  subagents. Whether some of it comes in-house is a separate question, not opened here.

### Still to decide

- [ ] Confirm or overturn each row above.
- [ ] Output contract per agent — what it returns, in what shape. Model:
      `wip/refs/caveman/agents/cavecrew-*.md`, which fix the format exactly.
- [ ] Tool allowlist and model per agent.
- [x] **Where they live — not an open question, closed 2026-08-08.** Claude Code fixes the paths exactly as
      it does for skills: `~/.claude/agents/<name>.md` and `~/.claude/commands/<name>.md` globally,
      `.claude/agents/` and `.claude/commands/` per project. Flow is global-only, so: `agents/` and
      `commands/` folders in this repo beside `skills/`, symlinked in by an extended `link-skills.sh`, and
      `setup-flow-globals` gains the two link jobs. Mechanically identical to what already exists. The
      agent posed this as a blocking design question; it was neither blocking nor a design question.
      **Built 2026-08-08:** `link-skills.sh` renamed **`link.sh`** and extended to all three groups — one
      symlink per item, never a folder symlink, because those `~/.claude/` folders are shared with entries
      Flow does not own. `commands/grill.md` is the first. No new job for `setup-flow-globals`: it already
      runs the script, so the two extra groups come for free
- [ ] Whether **judgment**'s critic is a subagent (see that thread).
- [ ] Whether `flow`/`ptree`/`fmerge`/`gsave` gain slash-command wrappers, and what that buys over the bare
      PATH command.

---

## judgment — the agent has no judgment of its own proposals

**Raised 2026-08-08. Not designed. Not named. The important one; opens after extension-points.**

### The problem, in the user's words

The agent proposes constantly — design directions, topics, tickets, plans, refactors, "we should do X instead
of Y" — and it does so **without having criticized its own proposal first**. It generates, the user judges.
Every time.

Consequences the user named:

1. **He is the only judge in the system.** A fault he does not personally catch ships. Edge cases and
   contradictions pass under the radar not because they are subtle but because nobody looked.
2. **It costs him enormous time.** The reasoning work is supposed to be the agent's; he is doing it.
3. **The design loops.** Flow's own design has been re-opened many times over the same ground, and the
   re-opening is usually triggered by the user noticing something rather than the agent finding it.

**Not a brainstorming problem.** The user was explicit: this fires in every phase — planning, implementation,
mid-task suggestions, anywhere a proposal is made. Scoping the fix to the brainstorm skill would miss most of
the occurrences.

### The two pieces of evidence, both in this repo

**Evidence A — the parked proposal.** `remaining.md` → `## ⏸ PARKED — "delete the topic; a ticket holds its
own brainstorm"`. The agent produced the proposal. The line recorded there as *"the argument that actually
decides it (user, and the agent had missed it)"* — that you cannot know at the start of a brainstorm whether
it will split, so no rule may make a brainstorm's **location** depend on its **outcome** — came from the user.
The agent argued against the proposal twice and conceded twice. Both the load-bearing argument and the
eventual concession were user-driven. Read that section in full; it is the cleanest specimen available and it
is written up with all five objections. **It is also the acceptance test: a mechanism that would not have
caught this one does not work.**

**Evidence B — the miss.** For an entire design generation, nobody noticed that **a ticket needs its own
brainstorm at pickup** — that a unit of work is itself a full arc (brainstorm → research → prototype → plan →
implement), not just the implement step. The whole three-container design was built without it. It surfaced
only when it occurred to the user. Nothing in the process was looking for it.

### What a fix has to do

- Fire **before** the proposal reaches the user, not after he pushes back.
- Apply to any phase, not one skill.
- Be cheap enough to run often. A ceremony that costs a full extra pass on every suggestion gets skipped, and
  a mechanism that gets skipped is not a mechanism.
- Attack the proposal on its own terms: what does this break, what case does it not cover, what did the
  previous design know that this one forgets, what is the strongest argument against it.
- Survive the failure mode it is aimed at — the agent grading its own homework and passing. **This is the hard
  part.** Leading argument for the form: a critic sharing the proposer's context inherits the proposer's
  framing, so it proofreads instead of reviewing; a subagent receives the proposal and the constraints and
  nothing else. That makes the form question depend on **extension-points**.

### Prior art already in the repo

- `remaining.md` → `## Design threads still open` → **"Red-team / grill mode — an adversarial pass that
  attacks a design before it locks. Captured 2026-07-23, never designed. Ancestor: delapse's `grill-me` /
  `grill-with-docs`."** Same family, narrower: a pass the user invokes on a finished design. This thread is
  the always-on version covering every proposal. **Decide whether it absorbs that one or they stay two.**
- `global/CLAUDE.md`'s hard rule *"No cause without evidence. Hypothesis: X. To verify: Y."* is the
  debugging-side ancestor of the same instinct.
- `wip/refs/agent-skills/skills/doubt-driven-development/` — a third-party skill squarely in this space,
  unread as of writing. Check it before designing from scratch.

### Settled 2026-08-13 — all four

- **Name.** `## Judgment`, a section in `global/CLAUDE.md`.
- **Form.** An always-on global rule, and nothing else. No skill, no subagent, no hook. The user ruled 2026-08-13 that review runs in the same session, never a subagent, so the cold-reader form is off the table here as well.
- **Trigger.** Always on, scoped by a line naming the moment: anything shown to the user for a yes — a design, a plan before `flow build`, a diff at review, an answer.
- **Depth control.** Two levels. Two cheap bullets always fire. The four walk bullets sit under `### When it has parts` — a design, a plan, a mechanism, a diff across files — and a rename, a fact, a one-line answer or a one-part fix gets none of them. **The gate is whether the thing has parts, never whether it seems big.** Size is a judgment the agent makes about its own work, which is the faculty this section exists because it does not trust; parts are countable.

---

## refs — mine the reference repos at `wip/refs/`

**Cloned by the user 2026-08-08, for inspiration.** Not vendored, not a dependency, not part of the product.
`wip/` is deleted when the build finishes and these go with it. Pulled from as the other threads need them,
rather than surveyed as a session of its own.

| Folder | What it is | Mine it for |
|---|---|---|
| `guidelines/agentskills` | the Agent Skills spec + authoring docs (`docs/specification.mdx`, `docs/skill-creation/`) and a reference implementation in `skills-ref/` | authoritative answer on what a skill *is*; check `skills/CLAUDE.md`'s conventions against it |
| `agent-skills` | addyosmani/agent-skills — ~25 skills by phase, plus `agents/`, `.claude/commands/`, `hooks/`, `references/`, and **`evals/`** | how one repo splits work across all three extension points; `doubt-driven-development` for **judgment**; the eval harness for "does this skill actually fire" |
| `caveman` | JuliusBrussee/caveman — output compression, shipped as a plugin across 30+ agents | `agents/cavecrew-*` are three tight subagent definitions with tool allowlists and `model: haiku`; the hook system; measured token benchmarks |
| `agent-toolkit` | vercel-labs — Vercel-deployment skills | `commands/` as prompt templates; the script-over-inline-code convention |
| `mattpocock-skills` | skills repo with `CONTEXT.md` + `docs/` | context-gathering and knowledge-base shape |
| `agentmemory` | a memory system with `DESIGN.md`, `docs/`, `eval/`, `benchmark/` | knowledge base, self-improvement, what "memory" means as a component |
| `TencentDB-Agent-Memory` | memory system, service-shaped (`MemoryCore`/`MemoryKnowledge`/`MemoryPanel`/`MemoryProxy`) | same, from a different angle — compare the two before drawing conclusions |

Areas the user named: **the three extension points**, **context gathering**, **self-improvement**,
**knowledge base**. Expect more.

### Method note, and a real hazard

**Reading any file inside `wip/refs/<repo>/` auto-loads that repo's `CLAUDE.md` into context.** Confirmed by
accident on 2026-08-08 — three of them landed at once, several thousand tokens of instructions written for
*their* repos, none of which apply here. Survey these with `ls` and targeted reads, run the deep passes in
subagents, and never let a ref repo's `CLAUDE.md` be mistaken for a rule that governs Flow.

---

## subagent-mechanics — what a parent can do to a subagent it dispatched

**Parked by the user 2026-08-14, deliberately.** Four questions raised while designing `execute`'s dispatch,
none of them blocking it. Written down so they are not rediscovered from scratch. **No subagent has ever run
on this machine**, so nothing here is confirmed by observation. Everything below comes from the official hooks
reference the user downloaded to `wip/research/claude-code-docs/hooks.md`, which is authoritative and answers
more than the tool surfaces did.

- **Pre-loading the prompt — possible, and the mechanism exists.** The user wants a dispatch to carry command
  output the subagent would otherwise fetch itself. A **`SubagentStart`** hook returns
  `hookSpecificOutput.additionalContext`, "added to the subagent's context at the start of its conversation,
  before its first prompt". Its matcher filters by agent type, so it can fire for one agent and no other, and
  its payload carries `agent_id` and `agent_type`. A hook could expand a marker such as `{{step:t047#3}}` into
  the step text and the context files, and the parent would never hold the expansion.
- **Killing one.** A background agent is addressable and can be stopped. A foreground one cannot — the parent
  is blocked while it runs, so there is no moment to issue the kill. All subagents die with the session; none
  outlives it. A finished agent needs no kill, so this only matters for one that is stuck or wrong.
- **Reading its full history.** Each subagent writes **its own transcript**, in a nested `subagents/` folder
  beside the session's. A `SubagentStop` hook is handed the path as `agent_transcript_path`, along with
  `last_assistant_message`, the final response as text, so a hook never has to parse the file to read the
  answer. In-session the parent still sees only the returned report.
- **The two kinds, and which Flow should use.** The user reports two shapes: one nested and opaque, visible
  only as something running, and one that appears in the session and can be switched to, watched and talked to.
  Background dispatch is what makes an agent addressable, so **the interactive kind is the background one**.
  The user wants that kind always. It does not conflict with the parent waiting: the flag decides whether the
  agent can be reached, the parent's own instruction decides whether it proceeds meanwhile.

### Running several subagents at once

**Raised by the user 2026-08-14, on approving the `Agent(isolation:worktree)` deny.** That deny is a hold so
nothing breaks quietly. This is the topic it holds open, and the user asked for it in writing before it gets
lost.

**How the snapshot works, from zero.** Two hooks fire around every `Agent` call. The first records the whole
working tree as a git tree object — one hash standing for every file exactly as it sits, dirty parts included.
The second records it again when the subagent returns, and `git diff-tree` prints what differs. Two records of
one directory, taken at two moments.

**Why that forces one subagent at a time.** The difference between the two records is everything that happened
in that window, not everything *that subagent* did. Two subagents running together each get a diff holding
both their work, and neither report can be checked against it. `execute` states the rule — one worker, and the
parent starts nothing while it runs — but the rule is a workaround for a mechanism that cannot tell two
writers apart.

**Why worktrees look like the answer.** A git worktree is a second checkout of the same repository in its own
directory, sharing one object store. A subagent given `isolation: worktree` works there and touches nothing in
the main checkout, so two subagents never turn up in each other's diff. `git write-tree` runs fine in a
worktree and returns a hash comparable with any other, because the object store is shared — the snapshot
mechanism itself has no objection to this.

**What blocks it today.** `snapshot.js` records the working directory at the first event and gives up when the
second reports a different one. That check exists to stop a nonsense diff across two unrelated directories,
and it stops the legitimate case with it.

**To answer before lifting the deny:**

- Which directory does each hook see when the subagent has its own? The payload carries `agent_id` and
  `agent_type`; whether it carries the subagent's working directory is unverified.
- The work lands in a checkout the parent is not in. Who merges it back, and when? Merging is a git mutation,
  so the user runs it, which puts a manual step inside every dispatch.
- Does `flow` work from a worktree? Ticket paths resolve from the project root.
- **Does parallelism pay at all here?** The 1.1M-token study case above found the cost of a dispatch to be the
  cold start, not the waiting. Four cold starts at once are not cheaper than four in a row.

---

## assignments — does a dispatched job need a handoff document?

**CLOSED 2026-08-16 — discussed, decided and built.** A dispatched job is a child ticket; `handoff` lost
its assign half and writes `## Where it stands` inside `ticket.md`. The four questions below were all
answered in the build: a brief is a ticket body, no ticket system falls back to `handoff.md`, `flow done`
refuses to close a parent around an open child, and the report lands in `## Result`. Kept for the reasoning.

Today `handoff` has two jobs: **resume** this work later, and **assign** a job to a session that reports back.
The assignment half writes its own file, named for the job, sitting beside the resume file — that is what the
skill calls a parallel handoff, and `debug` dispatches one.

**The idea: delete the assignment half.** A job handed to another session is work, and Flow already has a place
for work — a ticket. So the dispatched job becomes a **child ticket of the ticket that dispatched it**, and the
brief is the ticket body. `handoff` shrinks to one job, resume.

Raised in the same message as a second `handoff` complaint, which the user detailed in the very next turn:
the skill wrote a reading list instead of the state, so the next session read seven files where two would do.
**That one is fixed** — `skills/handoff/SKILL.md`, 2026-08-15. This idea is the half that stayed open.

**To answer when it opens:**

- **A brief and a ticket body are not the same document.** A ticket says what to build; a brief says what
  failed, what the error was, what changed, and what was already ruled out. Does that fit a ticket body, or
  does the ticket grow a section it only has sometimes?
- **What happens with no ticket system** — a fresh session that types `/debug`, or a directory with no `docs/`.
  Assignments work there today because a file works anywhere.
- **Who closes it.** A child ticket has a status the parent's `flow` graph reads, which is strictly better than
  a file nobody marks done. That may be the strongest argument for the change.
- **The report.** `debug` appends its result to the brief file it was started on. As a ticket, the result would
  land in the ticket body — check that against `flow`'s rule that only `flow` writes frontmatter.

## install — one skill instead of two

**Raised by the user 2026-08-15, to be discussed later. Nothing here is decided.**

The plan was two skills: `setup-flow-globals` to install Flow on a machine that has none, `migrate-to-flow` to
convert a project that already has its own workflow. Neither is built.

**The idea: one skill for both.** The user's reason is that the starting states are open-ended — a bare machine,
a machine with Flow and a fresh project, a project with its own `CLAUDE.md` and docs, a project half-converted —
and there is no clean line to cut two skills along. Writing one skill per scenario means writing a skill per
scenario forever.

**To answer when it opens:**

- **What the single skill branches on.** Whatever it detects first — global rules present or absent, project
  `CLAUDE.md` present or absent, foreign docs present or absent. Those three flags are eight states, and most
  collapse.
- **Whether install and convert really share a spine**, or only share a trigger. Installing writes to
  `~/.claude/`; converting writes inside a repo. One skill that does both crosses the boundary every other
  Flow skill respects.
- **The name.** `setup-flow-globals` and `migrate-to-flow` are both verb-first and both describe half the job.
- **Nothing installs until Flow is finished** — this skill is the thing that finally runs, so its design is
  what closes the whole project.

## ascii-engine — hand it JSON, get back the drawing

Raised by the user 2026-08-19, at the end of the `visualize` rework. **Nothing is decided and it may never be
built.** The skill works without an engine today and must keep working without one.

**The whole thread lives in `wip/context/design-ascii-engine.md`** — what an engine is, the same diagram typed
by hand and as JSON, the two halves of the job, the five existing tools worth trying first, three tiers of
ambition, the readability trap, and the questions the brainstorm has to settle. Written to open cold, so
nothing is restated here.

**The user has read that file and mostly disagrees with its recommendation**, and intends a different
direction they have not stated yet. Ask for it before arguing anything in there. What they have said twice:
JSON goes in, and the engine does the whole rendering.
