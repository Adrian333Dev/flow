# Handoff — 2026-08-08

First file to read in a fresh session. Replaced wholesale each time, never appended to.

## What this repo is

**Flow** — a Claude Code workflow for one solo developer. Three shipped parts: `global/` installs to
`~/.claude/` and loads in every directory whether or not there is a project; `skills/` holds the skill set;
`project-template/` is the two files a new project starts with. `toolbox/` is a submodule, its own repo, a
catalog of external tools filed by job.

**It is not finished.** The design is nearly complete and almost nothing is built. The eight skills on disk
were written against an older chain and four of them (`brainstorm`, `execute`, `organize`, `handoff`) name
paths the design has since deleted. **Never audit a skill on disk as if it described the current design** —
when a skill file and the design record disagree, the design record wins.

The design record is `wip/`: `remaining.md` is the master build checklist, `session-new-plugin.md` is the
historical log (newest at the bottom) where a decision's origin is found, and the `design-*.md` files hold
the reasoning behind each locked decision.

## Machine state — nothing is installed

**Flow does not run on this machine.** This is the fact most likely to cause confusion.

- `~/.claude/skills/` holds three unrelated folders from May and no Flow skill
- `~/.claude/CLAUDE.md` has not been written, so **none of `global/CLAUDE.md`'s rules load**
- `~/.claude/settings.json` has no `hooks` key, so the `guard.js` PreToolUse hook is not active
- `~/.claude/toolbox` does not exist

The four PATH commands and `~/.claude/scripts` pointed into the `agentic-setup` workbench repo, which was
deleted outright on 2026-08-07 (GitHub repo included) after everything worth keeping was carried into `wip/`.
They broke with it. Re-point them:

```bash
ln -sfn ~/code/flow/global/scripts               ~/.claude/scripts
ln -sfn ~/code/flow/global/scripts/ptree.sh      ~/.local/bin/ptree
ln -sfn ~/code/flow/global/scripts/fmerge.js     ~/.local/bin/fmerge
ln -sfn ~/code/flow/global/scripts/gsave.sh      ~/.local/bin/gsave
ln -sfn ~/code/flow/global/scripts/flow/flow.js  ~/.local/bin/flow
ln -sfn ~/code/flow/toolbox                      ~/.claude/toolbox
```

`ptree`, `fmerge` and `flow` are used constantly and fail until this runs. `flow` itself is built and working
— ~950 lines, zero dependencies, the full confirmed surface. If the repo was cloned without
`--recurse-submodules`, `toolbox/` is empty; fix with `git submodule update --init`.

---

# The two issues to work, in this order

Both were raised by the user on 2026-08-08. **Neither has been designed. Nothing about either is decided.**

A session on 2026-08-08 attempted both and the user rejected the output, so the issues are restated here from
scratch. Where that session produced a finding worth not losing, it is marked **⚠ unconfirmed** — treat it as
a lead, never as a conclusion.

## Issue 1 — the agent has no judgment about its own proposals

**The user's own framing: this is the crucial one.**

### The problem

The agent proposes constantly — design directions, tickets, plans, refactors, "do X instead of Y" — and it
does so **without having criticized its own proposal first**. The agent generates; the user judges. Every
time.

Three consequences the user named:

1. **The user is the only judge in the system.** A fault the user does not personally catch ships. Faults get
   through not because they are subtle but because nobody was looking.
2. **It costs the user enormous time.** The reasoning work is supposed to be the agent's. It has landed on
   the user instead.
3. **The design loops.** Flow's own design has been re-opened over the same ground many times, and the
   re-opening is almost always triggered by the user noticing something rather than the agent finding it.

**This is not a brainstorming problem.** The user was explicit: it fires in every phase — planning,
implementation, mid-task suggestions, anywhere a proposal is made. A fix scoped to the `brainstorm` skill
would miss most occurrences.

### The two pieces of evidence, both in this repo

**Evidence A — the parked proposal.** `wip/remaining.md`, the section titled `## ⏸ PARKED — "delete the
topic; a ticket holds its own brainstorm"` (starts at line 38). Read it in full; it is the cleanest specimen
available and it is written up with all five objections and where each landed.

What happened: the agent argued the proposal down **twice** and conceded **twice**. The argument that
actually decided it — *you cannot know at the start of a brainstorm whether it will split, therefore no rule
may make a brainstorm's location depend on its outcome* — came from the user, and is recorded in that section
as *"the argument that actually decides it (user, and the agent had missed it)"*.

**This is the acceptance test. A mechanism that would not have caught this one does not work.**

**Evidence B — the miss.** For an entire design generation nobody noticed that **a ticket needs its own
brainstorm at pickup** — that a unit of work is a full arc (brainstorm → research → prototype → plan →
implement), not just the implement step. The whole three-container design was built without it. It surfaced
only when it occurred to the user. Nothing in the process was looking for it.

### ⚠ Unconfirmed lead from the rejected session

The obvious design — *"make the agent state objections to its own proposal before showing it"* — appears to
**fail the acceptance test**. In Evidence A the agent raised five objections, not zero. A rule demanding
self-criticism would have been satisfied by those five and changed nothing.

If that holds, the two evidence cases are two different failures, needing two different moves: Evidence A is
a failure to find **the crux** (the one invariant or fact that decides the question), and Evidence B is a
failure to notice an **absence** (criticism attacks what is on the page; that fault was not on the page).

Not verified against anything but the parked section. Re-derive it rather than trusting it.

### What is known about the fix

Constraints the user stated:

- Fires **before** the proposal reaches the user, not after they push back
- Applies in any phase, not one skill
- Cheap enough to run often — a ceremony costing a full extra pass on every suggestion gets skipped, and a
  skipped mechanism is not a mechanism
- Survives the failure mode it is aimed at: the agent grading its own homework and passing

**The user's position on form, stated 2026-08-08:** *"I'm very certain it's not going to actually be a skill.
It's something that is going to directly live in the CLAUDE.md file, probably."* Nothing is decided; the name
is not chosen either.

### Prior art to check first

- `wip/remaining.md` → `## Design threads still open` → **"Red-team / grill mode"** — an adversarial pass the
  user invokes on a finished design. Captured 2026-07-23, never designed. Ancestor: delapse's `grill-me`.
  **Open question: does the fix absorb this thread, or do the two stay separate?**
- `global/CLAUDE.md` `## Communication` → *"Reason before agreeing"* and `## Hard rules` → *"No cause without
  evidence"* are existing partial ancestors of the same instinct. Neither prevented Evidence A.

## Issue 2 — skills vs. commands vs. agents

**Keep this minimal.** The user cut it back on 2026-08-08 after a session over-expanded it. Answer only what
is needed, then return to Issue 1.

### The three extension points, defined

Claude Code offers three ways to extend it. **Flow uses one of them for everything** — eight skills, zero
commands, zero agents — and has never compared them.

- **Command** — a prompt template fired by name. A file at `~/.claude/commands/foo.md` becomes `/foo`; its
  text is injected into the current conversation as a user turn. It can take arguments (`$ARGUMENTS`, `$1`),
  pull in files with `@path`, and run shell with `` !`cmd` `` so the output sits in the prompt *before* the
  model reasons.
- **Skill** — a folder (`SKILL.md` plus any bundled files) the model reaches for when it recognizes the
  situation. Only `name` and `description` stay in context permanently; the body loads on invocation.
- **Agent (subagent)** — a separate context window with its own system prompt, tool allowlist and model, at
  `~/.claude/agents/foo.md`. The parent dispatches it and gets back only a report.

Two things worth knowing: the **command/skill line has largely dissolved** — both can be typed as `/name`,
both can be model-invoked, and a skill with `disable-model-invocation: true` *is* a user-only slash command.
What still separates them is argument interpolation and shell preloading. What separates an agent from both
is categorical: **only an agent does not spend the parent's context.**

Paths are fixed by Claude Code exactly as they are for skills, so "where do these live" is not a design
question.

### The user's question

Is Flow's design faulty for reflexively making everything a skill? Three specific guesses the user put on the
table: **`handoff` may want to be a command**, **a `start` command probably makes sense**, **`debug` probably
wants to be an agent**.

### Hard constraints the user set on 2026-08-08 — do not relitigate these

- **Do not optimize Flow for subagents.** Execution runs as a **single session, single model, one context**
  covering brainstorm → planning → execution. No worker agents.
- **The one clear subagent case is debug.** When the main session gets stuck, it dispatches a debug agent
  with a **full, detailed brief** — the issue explained properly, not a bare-minimum context — and asks it to
  debug and if possible fix. That is the whole of it.
- **The Haiku worker is parked**, tending toward removal. The user recalls deciding to drop it when the
  design moved from milestones to tickets; the written record neither contains that decision nor contradicts
  it. `global/CLAUDE.md` line 50 (*"Haiku subagents by default"*), `remaining.md` 2f, and
  `skills/execute/haiku-worker.md` all still assume it exists and would need correcting if it goes.
- **Do not propose new agents.** A rejected session invented six. The user asked for the existing workflow to
  be optimized, not for new machinery.

Supporting evidence for the above, already in the record: `session-new-plugin.md` line 572 records a study
case at `wip/study-cases/handy-workspaces/` — a nine-task feature under a subagent-heavy workflow costing
**~1.1M tokens and 90 minutes for work that should have taken 15**, root cause *"per-task implement+review
subagents (each starting cold)"*.

### Sequencing note

Deciding the extension point for something **unbuilt** (`debug`, `code-review`, a `start` command) is cheap
and prevents a rewrite. Deciding it for something **on disk** is unreliable, because those files describe the
old chain — fold that call into each skill's rewrite (`remaining.md` items 2c–2g) instead of auditing them
now.

---

## ⏸ A parked decision that affects most of what is left

`remaining.md` opens with `## ⏸ PARKED — "delete the topic; a ticket holds its own brainstorm"`. It is a
fully-worked proposal the user understood and **deliberately did not approve**, wanting other work first.
Everything needed to re-open it is in that section — the conversation it came from is gone.

**Do not implement it. Do not re-open it unprompted.**

It matters for sequencing: `remaining.md` items `2c`–`2g` are five skill rewrites, all written against
topics. Building them before that call is made risks doing the work twice. Raise the ordering once, then
follow the user's answer.

(It is also Evidence A for Issue 1. Reading it as a specimen is not the same as re-opening it.)

## Build work waiting behind the two issues

1. **Restructure `remaining.md`** — split steps 4–5 out to `wip/migration.md`, split every checkbox into
   **must** / **later**, cut settled argument out of `[x]` items. Approved in conversation, spec at the
   bottom of that file, not yet done. Blocks nothing.
2. **Build step 3, `setup-flow-globals`** — the skill that installs everything under "Machine state" above.
   Spec is in `remaining.md`.

## Other threads, recorded and not opened

- **A growing set of global scripts**, most not Flow-specific — `gsave` is the model. Where general tools
  live, how they register, whether Flow should own them. The `toolbox` submodule answers this for
  *catalogued* tools only; it says nothing about scripts.
- **Excalidraw** — see `wip/excalidraw/README.md`. `explain` bans SVG and mermaid on measured cost, but that
  ruling never covered excalidraw, which is a different mechanism.

## Files left behind by the rejected session

- **`wip/threads.md`** — working notes from 2026-08-08, containing a subagent-heavy audit and a six-agent
  proposal the user rejected. **Do not build on it.** Superseded by this file; a deletion candidate, the
  user's call.
- **`wip/remaining.md`** — two entries in `## Design threads still open` were edited to cross-reference
  `wip/threads.md` by thread name. Harmless, but they point at the file above.
- **`wip/refs/`** — several agentic-workflow repos the user cloned for inspiration. **The thread that used
  them is dropped.** Note the hazard: reading any file inside `wip/refs/<repo>/` auto-loads that repo's
  `CLAUDE.md` — thousands of tokens of instructions written for *their* repo, none of which govern Flow.

## How to work here

`CLAUDE.md` at the repo root carries the rules, and they are load-bearing because **no global rules are
installed**. The ones violated most often, in order:

1. **Discuss before doing.** The user gives a message full of positions; the reply is a discussion of them —
   proposals, agreement, disagreement. Files change only after a decision is confirmed. A session on
   2026-08-08 was told to build something and started editing `global/CLAUDE.md` inside the same turn; every
   edit had to be reverted.
2. **Never run git mutations.** Print the exact command and let the user run it. `gsave` is the user's own
   commit-and-push command — name it, never invoke it. Reads are fine. Applies to `toolbox/` too.
3. **Deletes need their own explicit confirmation**, even inside an approved plan. Moving is not deleting.
4. **Follow `## Explaining` and `## Communication` in the root `CLAUDE.md`.** They are mirrored there from
   `global/CLAUDE.md` precisely because that file does not load. The final message of every turn is the
   deliverable: whole picture first, every invented term defined before first use, no undefined shorthand, no
   internal reasoning dumped in place of an explanation. State plainly what is being proposed, where it goes,
   and which files would change.
5. **Designing Flow itself uses plain conversation** — never a brainstorming skill, neither
   `superpowers:brainstorming` nor Flow's own.

Scratch files go in `tmp/`, which is gitignored. Never `/tmp`, never the repo root.
