# Handoff — 2026-08-09

First file to read in a fresh session. Replaced wholesale each time, never appended to.
Read every file listed under **What to read**, then start on **The first action**.

## What this repo is

**Flow** — a Claude Code workflow for one solo developer. Three shipped parts: `global/` installs to
`~/.claude/` and loads in every directory whether or not there is a project; `skills/` and `commands/` hold
the skill set and the slash commands; `project-template/` is the two files a new project starts with.
`toolbox/` is a submodule, its own repo, a catalog of external tools filed by job.

**It is not finished.** The design is nearly complete and almost nothing is built. The seven skills on disk
were written against an older chain; three of them (`brainstorm`, `execute`, `organize`) and
`commands/handoff.md` name paths the design has since deleted. **Never audit a file on disk as if it
described the current design** — when it and the design record disagree, the design record wins.

The design record is `wip/`: `remaining.md` is the master build checklist, `session-new-plugin.md` is the
historical log (newest at the bottom) where a decision's origin is found, and the `design-*.md` files hold
the reasoning behind each locked decision.

## Machine state — nothing is installed

**Flow does not run on this machine, this is deliberate, and it is not yours to fix.** Nothing gets installed
until the workflow is finished — the user has said so at least three times, most recently 2026-08-08, and it
is now a hard rule in the root `CLAUDE.md`. Never install, never propose installing, never treat a skill or
command being untypeable as a blocker. Read the file on disk and follow it.

- `~/.claude/CLAUDE.md` has not been written, so **none of `global/CLAUDE.md`'s rules load**
- `~/.claude/skills/` holds three unrelated folders and no Flow skill; `~/.claude/commands/` does not exist
- `~/.claude/settings.json` has no `hooks` key, so the `guard.js` PreToolUse hook is not active
- `ptree`, `fmerge`, `gsave` and `flow` are dead symlinks — they pointed into the `agentic-setup` workbench
  repo, deleted outright 2026-08-07. `flow` itself is built and working (~950 lines, zero dependencies); it
  just cannot be called by name.

**One exception, made 2026-08-08 at the user's explicit request and re-pointed 2026-08-09:** `grill` is
linked *project-locally* at `.claude/skills/grill` -> `../../skills/grill`, so it loads in this repo and
nowhere else. It was `/grill` under `.claude/commands/` until 2026-08-09; it is a **skill** now, so reach for
it by name, not by typing a slash command. Nothing global was touched. `handoff` has no such link; add one
only if asked.

---

# The first action — decide what gets built, in what order

**The design is finished. Nothing is being built yet, and that is deliberate.**

The 2026-08-09 session settled the last open design questions and the user then stopped the work with a
specific instruction: *"What I approve is for you to actually record the decisions. I don't want you to
immediately start implementing it yet, because we need to really decide what we're going to implement
first."* The `grill` move was exempted and is done.

So the next conversation is **scope and order, not design.** Everything decided is written down; nothing
except `grill` has been applied to `global/`, `project-template/` or any skill.

The build items that fall out of the two locked sections, none started:

1. **`global/CLAUDE.md`** — `## Key docs`: drop the `docs/topics/` row, replace `docs/brainstorm/` with
   `docs/brainstorms/`. `## Workflow`: drop "topic mode" and "product mode" from the chain, replace the
   two-outcome pickup ladder with the pickup tree. Add the one-line rule that every named path is a default
   preferences can override. Sweep the word "mint" to "create".
2. **`flow` (~950 lines)** — the whole 2026-08-08 status and drop rework. Unaffected by 2026-08-09; it never
   knew about brainstorms.
3. **`project-template/`** — a second `CLAUDE.md` shape for a plain directory: rules only, no `## Project`.
4. **The skill rewrites** — `brainstorm` first, since both locked sections land in it.

**Do not pick the order alone.** Ask, or put up a proposed order and wait. The one thing the user has said
about sequencing is that it is theirs to decide.

## Where things stand on disk

Uncommitted at the time of writing — all of it this session's design record, nothing half-applied:

```
 M wip/handoff.md                   this file
 M wip/remaining.md                 both locked sections
 M wip/session-new-plugin.md        two dated log entries appended
 M wip/study-cases/bad-explanations/README.md
 D commands/grill.md                moved, not deleted
?? skills/grill/                    where it moved to
?? .claude/skills/grill             the project-local link, re-pointed
```

The old staged link at `.claude/commands/grill.md` was removed when the target moved; `.claude/commands/`
is now an empty directory and gone. Everything earlier is committed and pushed. The user runs `gsave`;
never run a git mutation.

## What binds this — two locked sections, do not reopen unprompted

Both are at the top of `wip/remaining.md` and both are complete. **Read them in full before saying anything
about the design.** Summarised here only so you know what is in them.

### `## ✅ LOCKED — one entity: the ticket absorbs the topic` (2026-08-08)

Containers, folder layout, the deciding argument, the seven statuses, the pickup tree, drop semantics,
`reason:`, everything deleted, the one real loss, all five objections with where each landed, build cost.

- `docs/topics/` and `flow topic` are deleted. A ticket carries `brainstorm/` from birth, always.
- `topic:` becomes `parent:`. A parent is never built itself; it is done when its children are.
- Seven statuses: `todo`, `thinking`, `building`, `review`, `done`, `parked`, `dropped`.
- `superseded` is gone. Bare `drop` refuses while live dependents exist and lists them transitively;
  `--by t051` re-points them, `--force` drops them too. Mutually exclusive.
- `reason:` in frontmatter, required on `parked` and `dropped`, automatic on a cascade, cleared on revive.
- `flow done` refuses on a parent with open children.
- The name stays **ticket**.

Three of those the agent decided and the user did not explicitly confirm — flagged to them in the final
message and not objected to: `thinking` over `brainstorming` as the status name, parent auto-close refusing,
and `by:` not being stored in frontmatter.

### `## ✅ LOCKED — brainstorms stand alone, in two modes` (2026-08-09)

Overturns objection #3 of the section above and supersedes its `docs/brainstorm/` row.

- A brainstorm needs **no container Flow owns**. It sits in a ticket, in `docs/brainstorms/<slug>/`, or
  wherever you are standing outside a project. `docs/brainstorm/` singular is deleted — it allowed one
  per repo, and three of the user's four real directories break that.
- **Two modes, chosen at the start**: normal (anything) and product (ends by writing `docs/spec/`).
  Guessed wrong? Start a fresh product-mode brainstorm and reference the earlier ones. Nothing converts.
- **Two outputs**: the working material stays where the thinking happened; the finished document files
  wherever it belongs. One live copy of anything, pointers elsewhere.
- The folder **moves into a ticket** only when it turns out to be one unit of work. Several units → it stays
  and becomes the design record.
- **"Project" means `## Project` is present**, not "a `CLAUDE.md` exists". A plain directory gets a
  rules-only `CLAUDE.md`.
- **Every named path is a default**; `## Preferences` or a directory's own `CLAUDE.md` overrides it. One
  rule, stated once, no per-path syntax.
- A global register of loose brainstorms is **parked**, with what would revive it recorded.
- **Say "create", never "mint"** in anything the user reads.

**Nothing has been built from either decision except the `grill` move.** `global/CLAUDE.md` still describes
three containers and the old two-outcome pickup ladder; `flow` still has `flow topic`. That is deliberate —
recording a decision is not implementing it, and the user said so explicitly on 2026-08-09.

## The two standing issues, and where each now stands

### Issue 1 — the agent has no judgment about its own proposals

**The user's own framing: this is the crucial one.** The agent proposes constantly and does so without having
criticized its own proposal first. The user is the only judge in the system, it costs them enormous time, and
the design loops because re-opening is almost always triggered by the user noticing something.

**Partly addressed 2026-08-08, not closed.** Two layers shipped: the always-on half is `## Judgment` in both
`CLAUDE.md` files, and the invoked half is `skills/grill/SKILL.md`.

**First real run, 2026-08-09 — it half-worked, and the failure is instructive.** Grill was run against the
brainstorm design over three real directories. It found the load-bearing fault correctly (a brainstorm has
nowhere legitimate to sit) and produced real evidence from the user's own disk. But its first pass also
invented a fault out of a misread — the "construction vs operation" gap around `~/code/toolbox` — because it
never checked what the user meant by "rebuild". **Running cases does not help if the case itself is
imagined.** Candidate addition: confirm what each case *is* before walking it.

The acceptance test still stands and is worth re-running against anything new: **the mechanism must catch the
topic/ticket case.** In that case the agent argued the proposal down twice and conceded twice, and the
argument that decided it came from the user. A mechanism that would not have caught it does not work.

⚠ **Unconfirmed lead, re-derive rather than trust:** "make the agent state objections before showing the
proposal" appears to fail that test, because the agent raised five objections, not zero. If that holds, there
are two distinct failures — failing to find **the crux**, and failing to notice an **absence** (criticism
attacks what is on the page; that fault was not on the page). `/grill`'s filter table is aimed at the first.

**A second failure was recorded this session and has its own home.** The user rejected an explanation
outright — checklist IDs used as words, a quote pasted instead of an explanation, and length hiding
uncertainty. Both rules already existed in `global/CLAUDE.md` and were broken anyway, which is itself
evidence about always-on rules. Specimen: `wip/study-cases/bad-explanations/README.md`.

### Issue 2 — skills vs. commands vs. agents

**Keep this minimal.** The user cut it back after a session over-expanded it. Three extension points:
a **command** is a prompt template fired by name, taking `$ARGUMENTS` and able to run shell with `` !`cmd` ``
so output lands in the prompt before the model reasons; a **skill** is a folder the model reaches for; an
**agent** is a separate context window, and is the only one that does not spend the parent's context.

Settled: **`handoff` is a command** (`commands/handoff.md`, prefetching `git status --short` and
`flow status`), and **`grill` is a skill** — moved out of `commands/` on 2026-08-09 because a command is
one-shot and grill is a method that runs across a whole discussion. Both stay model-invocable —
`disable-model-invocation` is what would switch that off and it is deliberately absent.

**The rule that split them, use it for the next one:** shell output must land *before* the model reasons →
command. A method that governs a stretch of conversation, no prefetch → skill.

Still open: a **`start` command** (named as the strongest remaining case) and **`debug` as an agent**.

**Hard constraints the user set, do not relitigate:** execution runs as a single session, single model, one
context; no worker agents; the one clear subagent case is debug, dispatched with a full detailed brief; the
Haiku worker is parked and tending toward removal; **do not propose new agents**. Evidence:
`wip/study-cases/handy-workspaces/` — a nine-task feature under a subagent-heavy workflow cost ~1.1M tokens
and 90 minutes for work that should have taken 15.

## Build work waiting

**Order not chosen — that is the first action, above. This is the inventory, not a sequence.**

1. **`global/CLAUDE.md`** — the `## Key docs` and `## Workflow` edits from both locked sections, the
   path-default rule, and the "mint" sweep.
2. **The skill rewrites** (`brainstorm`, `execute`, `organize`, and the others under Step 2 in
   `remaining.md`) — unblocked, and each gets written against both locked sections. `brainstorm` takes the
   most change and should go first.
3. **`flow` itself** — strip topic commands, add `--parent`, `park`, `reason:`, the transitive dependent
   check, `--by`/`--force`, rename two statuses, delete `superseded`. Untouched by the 2026-08-09 decision.
4. **`project-template/`** — a second `CLAUDE.md` shape for a plain directory, rules only, no `## Project`.
5. **Restructure `remaining.md`** — split steps 4–5 into `wip/migration.md`, split every checkbox into
   must/later. Approved in conversation, spec at the bottom of that file. Blocks nothing.
6. **`setup-flow-globals`** — the install skill. Writing it is fine; running it is not.

## Threads recorded, not opened

- **Where the user's complaints get written down.** The standing plan was one running file; that breaks now
  that study cases want the same pipe. Recorded in `remaining.md` → `## Design threads still open`.
  **Deferred by the user — discuss later, do not design it now.**
- **Cold-reader `grill`** — the known weakness of the built version is that the same context can walk the
  motions and pass itself. Parked upgrade, in the same section. The 2026-08-09 run added a second known
  weakness: it walked a case it had misunderstood. See Issue 1 above.
- **A growing set of global scripts**, most not Flow-specific. Parked by the user: record, do not open.
- **Excalidraw** — `wip/excalidraw/README.md`. `explain` bans SVG and mermaid on measured cost; that ruling
  never covered excalidraw, which is a different mechanism.
- **Job briefs** (`<slug>.md` inside a ticket folder) — a dispatch packet for a different job, as opposed to
  `handoff.md` which resumes the same one. They serve only the debug case, so they are a deletion candidate;
  the user's call is **keep for now, settle it when `debug` is designed.**

## Files and hazards

- **`wip/threads.md`** — working notes from the rejected 2026-08-08 session, containing a subagent-heavy
  audit and a six-agent proposal the user rejected. **Do not build on it.** Two rows in it were updated this
  session and are accurate; the rest is superseded. Still a deletion candidate, the user's call.
- **`wip/refs/`** — cloned reference repos; that thread is dropped. **Hazard: reading any file inside
  `wip/refs/<repo>/` with the Read tool auto-loads that repo's `CLAUDE.md`** — thousands of tokens of
  instructions written for their repo. Use `cat` via Bash instead.
- **`skills/debug-web-pages/ROADMAP.md`** names `link-skills.sh` and `~/.agents/skills`, a repo layout that
  no longer exists. Stale in more ways than the filename; wants a look, not a find-and-replace.
- Six files under `wip/` still say `link-skills.sh` (renamed to `link.sh` this session). All are dated design
  records and the historical log — left alone on purpose, so the record stays true to its date.

## How to work here

`CLAUDE.md` at the repo root carries the rules and they are load-bearing, because **no global rules are
installed.** The ones violated most often, in order:

1. **Discuss before doing.** Files change only after you have said what would change and the user has said
   yes. Feedback is not approval.
2. **Never run git mutations.** Print the command; the user runs `gsave`. Applies to `toolbox/` too.
3. **Never install anything, and never propose it.**
4. **Cleanup after your own change needs no approval** — orphaned files, emptied folders, dead references.
   Other deletes still need their own explicit yes.
5. **Follow `## Explaining` and `## Communication` in the root `CLAUDE.md`.** No checklist IDs, no `2i`, no
   `T1` — say what the thing is. A quote is not an explanation. Plain words, short sentences, and the final
   message is the whole deliverable.
6. **UI, layout and structure are rendered, never described** — read `skills/explain/SKILL.md` and follow it.
   ASCII only; the allowed character set is in that file and it is correctness, not style.
7. **Designing Flow itself uses plain conversation** — never a brainstorming skill, neither
   `superpowers:brainstorming` nor Flow's own.

Scratch files go in `tmp/`, which is gitignored. Never `/tmp`, never the repo root.

## What to read

In one batch, before responding:

- `CLAUDE.md` — loads automatically, but read `## Judgment`, `## Explaining` and `## Communication` properly.
- `wip/remaining.md` **lines 42–384** — both locked sections, from the first `## ✅ LOCKED` to just before
  `## Step 2`. The 2026-08-08 one starts at line 42, the 2026-08-09 one at line 251. Everything the design
  has settled is in those two, and nothing outside them is current.
- `skills/grill/SKILL.md` — 70 lines. You will likely be running it.
- `wip/study-cases/bad-explanations/README.md` — 85 lines, two entries. What a rejected explanation looks
  like, and why a short one made of the wrong words fails just as hard.

Not needed unless the conversation goes there: `global/CLAUDE.md`, `commands/handoff.md`,
`global/scripts/flow/lib/graph.js`.
