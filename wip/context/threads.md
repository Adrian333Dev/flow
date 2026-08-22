# Threads — opened one at a time

**Open items are indexed in `backlog.md`, at the repo root.** This file holds the reasoning behind them; it is not a place to check for work.

Discussion threads, added as the user raises them. Each is written to be re-opened **cold**, months
later, by an agent that has read nothing else. Nothing here is decided; nothing here is a build item until it
produces one.

**Refer to a thread by its name, never by a number.** The names:

| Thread | One line | State |
|---|---|---|
| **extension-points** | skills vs. commands vs. agents — Flow uses skills for everything and never compared them | **← active, 2026-08-08** |
| **judgment** | the agent proposes without criticizing its own proposals first; the user is the only judge | next, and the important one |
| **refs** | mine the repos cloned at `wip/refs/` for ideas | pulled from as needed, not a session of its own |
| **subagent-mechanics** | what a parent can do to a subagent, and what it would take to run several at once | parked 2026-08-14, revisit when a subagent actually runs |
| **assignments** | a dispatched job may not need a handoff document at all — a child ticket may already be one | raised 2026-08-15, to discuss |
| **install** | `setup-flow-globals` and `migrate-to-flow` collapse into one skill covering every starting state | raised 2026-08-15, to discuss |
| **ascii-engine** | hand it JSON, get back the drawing — full write-up in `design-ascii-engine.md` | raised 2026-08-19, to brainstorm in its own session |
| **pickup** | `/start` owns pickup, `execute` owns plan → build → review; the skill is `groundwork`, the type is `topic` — full write-up in `design-pickup.md` | **built 2026-08-20**, `execute`'s rewrite still owed |
| **execute-cost** | the build loop reads expensive — the plan passes, mid-build debugging, the review passes | **built 2026-08-20** — all six parts; `execute` and `debug` rewritten, `agents/debug.md` deleted |
| **command-surface** | `flow`'s arguments, several ids at once, and one command that runs any shell | raised 2026-08-20, to discuss |
| **resume** | `/handoff` → `/clear` → carry on, with the third step automatic — full write-up in `design-resume.md` | raised 2026-08-22, mechanics confirmed, shape open |

`remaining.md` → `## Design threads still open` holds the older parked list. This file holds the ones
above, which are bigger and some of which may reshape the workflow. When a thread closes, its outcome moves into
`remaining.md` and the entry here is deleted.

**Why extension-points is active first,** reversing the recommendation given earlier the same day: the user
put three concrete proposals on the table (handoff as a command, a start command, debug as an agent), so the
thread is already open. It is also the cheaper of the two, it blocks **judgment**'s form, and `remaining.md`
items 2c–2g are five skill rewrites that would be written against whichever answer wins — same
do-the-work-twice risk as the parked topic decision.

---

## extension-points — skills vs. commands vs. agents

**Premise changed, 2026-08-20.** Claude Code merged custom commands into skills: a file at
`commands/x.md` and a skill at `skills/x/SKILL.md` both create `/x` and behave the same, and a skill body
can run `` !`cmd` `` before the model reads it. The test this whole thread used to sort them — a command
runs something first, a skill cannot — no longer separates anything. Everything below was decided against
the old test. See `design-pickup.md`.

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
none of them blocking it. Written down so they are not rediscovered from scratch.

**Corrected 2026-08-20.** An earlier line here said no subagent had ever run on this machine. The user has run
both kinds. Everything below comes from the official docs the user downloaded to
`wip/research/claude-code-docs/` — `hooks.md`, `sub-agents.md` and `agent-view.md`.

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
### The shapes, settled from the docs 2026-08-20

Three mechanisms, not two modes of one thing. All three can be talked to, with one exception noted below.

- **A subagent** — the `Agent` tool, and it has two modes. **Foreground** blocks the parent, looks like an
  ordinary tool call, and cannot be typed to. **Background** puts a named row in the panel above the prompt:
  `Enter` opens its transcript, *"follow-up messages and skills go to that agent"*, `x` stops it, and the
  parent keeps working. Neither is ever a row in `claude agents`, and both die with the session.
  - **The mode is not a preference.** Fork mode is on by default in an interactive session, and under it every
    subagent runs in the background and the parameter asking for the foreground is removed. Foreground appears
    in headless runs, the SDK, or under `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`. **`background: true` in an
    agent's frontmatter pins it** wherever it runs.
  - **Background costs a tool set.** A background subagent keeps only `Read, Grep, Glob, Bash, PowerShell,
    Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill, ToolSearch, EnterWorktree, ExitWorktree,
    Monitor, TaskStop, SendMessage, Artifact`, and everything else is stripped **even when the agent file asks
    for it**. Flow's two agents ask for nothing outside that list. Forks skip the filter.
  - **It cannot ask.** `AskUserQuestion` is removed from every subagent, so ending a turn is how it returns.
    The user barges in; the agent never prompts.
- **A background session** — `claude --bg`, `/background`, or a prompt typed into agent view. Its own row in
  `claude agents`, `Space` to peek and reply, `Enter` to attach, and it outlives the parent because a
  supervisor process runs it.
- **A fork** — `/subtask`, or the `fork` subagent type. A subagent that **inherits the whole conversation**
  instead of starting cold: same system prompt, tools, model and history, its own tool calls kept out of the
  parent's window, only the result returned. **It cannot be given an agent definition** — no separate rules,
  tools or model, because it inherited the parent's.
  - **The cache saving is one request, corrected 2026-08-20.** `prompt-caching.md`: a fork's first request
    reads the parent's cache, and after that it warms its own. A cache read still bills at roughly 10% of the
    input rate, and a fork of a long session carries that whole conversation into every turn it takes. The
    cache is also scoped per directory, worktrees included, so worktree isolation costs a full cold read.

**`run_in_background` is not a parameter to pass.** Fork mode is on by default in an interactive session, and
under it Claude Code *"runs the subagents Claude spawns in the background, forks and named subagents alike"*
and *"removes the Agent tool's `run_in_background` parameter, so Claude can't ask for the foreground."* A
background subagent's result arrives as a completion notification in a later turn, it runs with a smaller
built-in tool set, and its permission prompts surface in the parent session.

**Limits:** 20 subagents running at once, nesting three layers deep, both configurable. A finished subagent is
resumable with `SendMessage`, keeping its full history.

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

---

## execute-cost — the build loop costs too much

**Raised by the user 2026-08-20, one message, six parts. Nothing here is decided.** It blocks `execute`'s
owed rewrite, so it opens before that rewrite is attempted again.

The user's summary: *"we should possibly try to make the execution phase as cheap as possible without causing
any trouble. And right now… it feels like something very expensive."* They twice said their reading is not the
source of truth and asked to be argued with.

**The finding that matters: two of the six describe behaviour `execute` never instructs.** The file already
says to read the code before planning, and already says the plan costs three writes. The user read it and came
away believing the opposite of both. Whatever the rewrite decides, the current wording failed at the one job a
skill file has.

### 1. The plan gets written without reading the code

The user's fear: the agent is told to read context files and not the files it will change, so a wrong plan
survives until the build runs into it, and something important gets missed.

**The instruction exists.** Phase 2 Pass 1 opens `docs/context/` first, then *"read the code this ticket
changes, and write it down before anything else: the signatures, the seam the change goes through, what
surprised you"*, and the file calls that the load-bearing half. Two things to settle anyway:

- **Why it did not read that way.** `docs/context/` gets the bold sentence, the code gets a subordinate
  clause, and the heading over both — *what is there now* — names neither.
- **Whether an instruction is enough.** `remaining.md` 2e carries the same complaint from an earlier
  generation: *"nothing forces the 'examine current state first' pass, and it is the load-bearing half of the
  plan."* **extension-points** proposed `codebase-explorer` for exactly this, on the argument that a pass
  which is a dispatch cannot be skipped the way a paragraph of instructions can.

**Decided 2026-08-20 on the first, and the user agreed the instruction was already there.** The heading is now
`### Pass 1 — read the code`, the read is the pass's first sentence and carries the bold, and the reason moved
to the bottom. **The second is still open** and belongs to **extension-points**, not here.

### 2. Write the plan in chunks, not in micro-edits

**What the user meant by incremental**, given because the first rewrite took it too far: superpowers writes a
2000-line plan in one shot, and the alternative they had in mind was five to eight chunks. Never two hundred
small edits. They also noted Flow's tickets are smaller than that workflow's, so the problem is milder here.

**Phase 2 already costs three writes**, one per pass. The churn they are describing is real, and it is in
**Phase 3** — per step it writes the step's detail, runs the check, ticks the box, and updates `## State`.
Three or four edits each, on a file rewritten in place.

**Decided 2026-08-20: the count stays, and the sentence describing it was the actual defect.** Phase 2 costs
two writes, not three — Pass 3 ends at the user's approval and writes nothing, while the file claimed *"three
passes, each ending at a write"*. Phase 3 costs two per step, so a six-step ticket writes `plan.md` 14 times,
nowhere near the 200 the user pictured. The detail write and the tick stay separate because the check runs
between them, and merging them would cost the resume point an interrupted build depends on.

### 3. An issue hit mid-build should not become a ticket

The user's model: dispatch a debug agent then and there, the way a step dispatches a worker, hand it what it
needs, let the user talk to it while it runs, take its report. A ticket gets created only when the fix turns
out not to be quick — and then it belongs to a fresh session, not to this one. They also want more than one
fix attempt before escalating, scaled to how obvious the failure is: a bundler config or a version pin is
mechanical and worth several tries, a subtle failure is not.

**Two of those three premises are already Flow's position, which means the files failed to say so.**

- **The one-attempt rule is `execute`'s, not `debug`'s** — *"A step you ran yourself and could not verify gets
  one inline fix attempt, then `/debug`."*
- **`/debug` is not a dispatch.** Its first line under `## Dispatching the hunt` is *"Debug here by default"* —
  same session, no ticket, no agent. It dispatches only where the hunt is long and its context disposable:
  fifty reproductions, a bisect, a large log. The escalation being objected to costs one file read.
- **Where `debug` does dispatch, it refuses the `Agent` tool on purpose:** *"A background session, never the
  `Agent` tool. `Agent()` blocks or detaches and returns one report either way, and neither can be answered
  mid-hunt. This hunt asks questions."* The brief is a child ticket, because a ticket carries a status and the
  parent's `flow done` refuses to close around it, which no file does.

**That last one is factually wrong, checked against the docs 2026-08-20.** A running subagent appears in the
panel below the prompt, and opening its transcript sends it follow-up messages. **subagent-mechanics** above
now carries the three shapes and what separates them. So the user's model is buildable as stated, and a
**fork** is the shape that fits it — it inherits the conversation, so the hunt starts knowing what the build
knows, and the cold-start cost that argued against dispatching mid-build does not apply to it.

**`execute` never names the debug agent.** It hardcodes `haiku-worker` for a step and writes `/debug` for a
failure — the skill, which by default hunts in this session. `agents/debug.md` exists and is written for the
background-session dispatch: *"You are a background session, not a silent subagent."* So Flow has both
dispatch shapes and no in-session debug agent at all. That is the gap.

### Decided and built 2026-08-20

- **Escalation is a ladder of three**, and what decides each rung is the failure, never a count. Fix it inline
  while every attempt stays mechanical — a version pin, a config key, a wrong path. Stop after one where the
  code runs and the answer is wrong. Then `/debug`, which hunts in this session by default.
- **The in-session dispatch is a named subagent, never a fork.** The deciding argument is not cost: **a fork
  cannot be given `agents/debug.md`**, because it inherits the parent's instructions, tools and model. Its
  bound, its tool list, its model and its report format would all vanish, leaving the build agent hunting with
  the whole build conversation in front of it — the fixation the hunt exists to escape.
- **A ticket is what a subagent's failure becomes**, plus work that is plainly separable. Starting that
  session immediately is optional; a fresh session tomorrow picks up the same ticket.
- **`agents/debug.md` stays one file.** Only two lines assumed a background session, and they became a
  `## How you are reached` section covering both. It also gained `background: true`, which pins the
  addressable mode wherever it runs.
- **The build never works while a hunt runs.** One copy of the files sits on disk and both write to it, so the
  last save wins silently; and the snapshot hook's diff would carry both agents' work with no way to separate
  them. The user is not blocked — they can open the agent and type to it.

### Reversed the same day — there is no subagent hunt

Two of the bullets above lasted hours. The user asked whether a dispatched hunt can genuinely work *with*
them, and the answer collapsed the shape.

- **A subagent cannot ask.** `AskUserQuestion` is on the list of tools stripped from every subagent, "even
  when listed in the `tools` field". Nothing enables it, so there was nothing to isolate either.
- **A message to the parent does not arrive until the user types.** The docs: *"A background subagent's
  results reach Claude as a completion notification in a later turn."* The main agent acts in turns, and an
  idle session has no turn for a message to land in. So the `SendMessage`-to-`main` route — background
  subagents do keep `SendMessage`, and the sibling roster does list `main` — reaches the user no faster than
  the panel they already have. Proposed and withdrawn.
- **The subagent bought no parallel progress.** The bullet above already forbids the build working while a
  hunt runs. What was left was an automatic handoff, paid for with a second dispatch shape carrying its own
  brief, report path, and edit-collision rules.
- **So `debug` has one exit, not two:** hunt here, and where the fix needs a decision nobody gave or the
  hypotheses ran out, write a child ticket and hand it back. The user opens it in a fresh session, which talks
  to them directly and needs no agent file.
- **`agents/debug.md` is deleted.** Its three report statuses — `FIXED`, `FOUND_NOT_FIXED`, `UNPROVEN` — moved
  into the skill's report paragraph, where they make a report scannable a week later. Everything else in it
  was either covered by the skill or specific to the dispatch that went. `agents/` now holds `haiku-worker`
  alone, which `execute` still dispatches for a wide mechanical step.
- **The long-hunt case did not save the subagent.** Fifty reproductions is a `for` loop around the red
  command, which the skill already prescribes and which costs the session a summary, not a window.

### 4. Phase 3 and Phase 4 are not compressed

The user on Phase 3: no compression applied, messy, unclearly structured, too much detail, not a concise flow.
On Phase 4: too detailed given `refs/review-code.md` already exists.

**Built 2026-08-20** with the rewrite. What-goes-where — `## State`, `issues.md`, `map.md`, a new ticket —
was stated in three places across Phases 3 and 4 and the folder list; it is now one `→` list in Phase 3 for
the routing and one line per file in `## The ticket folder` for the ownership. 2757 words to 2144.

### 5. Too many review passes

The user expects roughly one pass over the plan and one over the implementation.

Today: the user approves the plan, every step runs its own check, the full suite runs at Phase 4, the work is
read against the plan, then read again against the code through `refs/review-code.md`, then the user approves
the work, and feedback reopens the build.

The two user gates are the loop's whole shape and stay.

**Decided 2026-08-20: the split stays, and the file now says the two passes read one diff.** The
one-hides-the-other argument held — collapsing them means asking both questions during a single read, which
answers the code question and assumes the plan one. The cost impression came from the file never saying the
diff is read once, which was one sentence.

### 6. The whole plan at once, against step by step

The user's own doubt, raised with the caveat that they may be wrong: writing the whole plan and then
implementing everything might simply cost less than this.

**The agent's position, not a decision.** The step loop is not where the money goes. Reading the code costs the
same either way, and a plan composed whole loses the resume point the three passes bought — a context that
fills mid-plan takes everything unwritten with it. The measured expensive thing in this repo is the cold start:
`study-cases/handy-workspaces/`, 1.1M tokens and 90 minutes for 15 minutes of work, root-caused to per-task
subagents that each began from nothing.

**Decided 2026-08-20, and the user agreed the diagnosis was the point.** The expense was never planning per
step — it was **stopping** per step, since six steps meant six reports to read. Phase 3 now says build
straight through: finish a step, run its check, mark it, start the next, with no report between. It stops for
a failed check, a decision only the user can make, or a dispatch in flight. Same plan, same checks, one
report. The write count was never the problem either: two writes in Phase 2 and two per step in Phase 3 is 14
writes on a six-step ticket, not the 200 the user pictured.

### Found while checking the docs — `execute`'s dispatch cannot do what it says

Not raised by the user. `execute` dispatches a step with `Agent(subagent_type="haiku-worker",
run_in_background=False, …)` and then instructs *"dispatch one worker, in the foreground, and wait"* and
*"start nothing while it runs"*. **Fork mode removes that parameter**, so the worker runs in the background
whatever is passed, and its result arrives as a completion notification in a later turn.

That matters past the wrong argument: the one-worker-at-a-time rule exists because the snapshot hook records
the whole working tree either side of a dispatch and cannot tell two writers apart. A protocol that assumed a
blocking call has to be rewritten against a mechanism that never blocks.

---

## command-surface — what the user types

**Raised by the user 2026-08-20. Nothing here is decided.** Two halves, and the second builds without the
first.

### `flow` has a verb per status

The complaint: too many parameters, and most of them are just status names. Seven of `flow`'s fifteen
top-level commands move a status — `start`, `groundwork`, `plan`, `build`, `review`, `done`, `park` — so
adding a status means editing the script. The user wants fewer arguments and a shape flexible enough that a
new status costs no code, and said the same applies past tickets to the rest of the surface.

Their sketch, offered as an illustration and not a proposal:

```
flow tickets|-t|--t edit <ticket_id> status|-s=<new_status>
```

- **The vocabulary is already data.** `TICKET_STATUSES` in `lib/store.js` is one array. What is not data: the
  `case` in the dispatch, the sort rank in `graph.js`, and the four sets there — live, open, in-flight,
  satisfying. **A new status still has to say where it sorts and which of those it joins**, and no argument
  design removes that. Any "no code change" claim has to cover it.
- **Seven verbs buy `flow build t047`.** The generic form spends twenty more characters on the move every
  skill file writes and the user types daily. Whether that is a cost or the point is the real question.
- **Both can exist.** The generic form as the surface, the verbs generated from the status list as aliases —
  a new status then gets its verb for free, and nothing is written twice.

### Several tickets at once

**Every transition takes exactly one id.** `flow ticket filed t047 t048` already takes a list, so the surface
is inconsistent as well as narrow. The case the user named: `file-findings` closes several tickets in one
pass, then has to move each one separately.

To answer: which commands take a list, and what a partial failure prints when one id in a list refuses. `flow`
refuses on purpose and says why; a list turns one refusal into a report.

### One command that runs anything

**Replace `/merge`.** It is ten lines that run `fmerge $ARGUMENTS` and paste the output. The user wants one
command that runs any shell command or script and drops its output into the session, covering `fmerge`,
`ptree` and whatever comes next, so no tool ever needs its own command file again.

To answer:

- **A non-zero exit aborts the whole invocation** and the model receives nothing, so it needs `|| true` and a
  line saying what a failure looks like. Same trap fixed in `/start` and `/merge` on 2026-08-20.
- **Whether `/merge` survives beside it.** `/merge` carries an instruction a generic runner has nowhere to
  put: no `--` means the files are context, so wait for what comes next.
- **Permissions.** `guard.js` and the allow list in `settings.json` decide what runs without a prompt. A
  command whose whole point is running anything types straight past the surface both were written against.
