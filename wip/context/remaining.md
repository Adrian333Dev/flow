# Remaining — the whole build in one list

**Open items are indexed in `backlog.md`, at the repo root.** This file holds the reasoning behind them; it is not a place to check for work.

The build record, written as a checklist and ordered by **what blocks what**. Every item names where its
design already lives; **no pointer means the design was never written**. Superseded as a work list by
`backlog.md`; kept for the reasoning under each item.

**Read `wip/context/handoff.md` first** — current state, machine state, and the next action. This file is what is
left to build; `session-new-plugin.md` is the historical log for why a decision was made.

Absorbs the old `backlog.md` in full — see the last section.

Legend: ⛔ blocks the items under it · ❓ needs a decision before it can be built · 🔁 rewrite of a file that exists

---

## Where it stands

The design is done. **2026-08-09: all four build items are built and verified** — `global/CLAUDE.md`,
the `flow` tool, `project-template/`, and the skill rewrites.

`skills/` now describes the current chain. `brainstorm`, `execute`, `organize` and `research` were rewritten
2026-08-09; `commands/handoff.md` got its three-row resolution ladder. The old chain
(`brainstorm.md → spec.md → plan.md`, topic folders at `docs/work/topics/t<NN>-<slug>/`, milestones) is gone
from disk, along with every path the 2026-08-08 and 2026-08-09 locked sections deleted.

⚠️ **This file is now the stale one.** The sections below marked BUILT still carry the content bullets they
were written with — some describe design the two locked sections later reversed (`docs/topics/` under 2c,
`superseded` under 2e, "mint" throughout). **The locked sections at the top win over anything below them.**
Fixing that is the deferred restructure at the bottom of this file.

`skills/` holds eight as of 2026-08-09: `grill` moved in from `commands/` that day. `commands/` now holds
`handoff.md` only.

Nothing is symlinked into `~/.claude/` and nothing is installed — deliberate, until the skill set is final.

**The workbench repo is gone (2026-08-07).** `agentic-setup` *was* the previous workflow and it incubated
this one; it has been deleted outright, GitHub repo included, and `flow` is now the only repo. Everything
worth keeping was carried into **`wip/`** — this file, the resume file, the `design-*.md` record, the v1
archive, and the evidence behind the skills. `toolbox` came along as a submodule.

**`wip/` is scaffolding and gets deleted when the build is done.** Nothing in it installs anywhere and
nothing in it is part of the product. Never let a `wip/` path leak into a skill, into `global/`, or into
`project-template/`.

---

## ✅ LOCKED — one entity: the ticket absorbs the topic (approved 2026-08-08)

**Approved by the user 2026-08-08 after a full walk-through. Build it.** Proposed and parked 2026-08-07;
re-opened and reworked 2026-08-08. The status set, the drop semantics and `reason:` are new in the rework and
were never part of the parked version. Everything below is decided unless marked otherwise.

### What a project holds afterwards

```
docs/brainstorms/  thinking not attached to a ticket. Any number of them, two modes
     │
     │  product mode ends by writing
     ▼
docs/spec/         what the product is
     │
     │  tickets are created from it, for as long as the product lives
     ▼
docs/tickets/      the work pool. Flat, every ticket at one level
```

**`docs/topics/` is deleted, and so is `flow topic`.**

**Superseded in part, 2026-08-09.** This diagram originally read `docs/brainstorm/` — singular,
product only, "once, before any work item exists" — and the text called it two containers split by
altitude. The plural folder and the two modes replaced that; see the 2026-08-09 locked section below.

### One ticket on disk

```
docs/tickets/t047-daemon-detection/
├─ ticket.md        frontmatter, description, ## Plan
├─ brainstorm/      tree.md + one file per branch that grew. ALWAYS present, from birth
├─ handoff.md       resume state, overwritten, at most one
└─ <slug>.md        job briefs, one per dispatched job
```

Frontmatter `topic:` becomes **`parent:`** — the ticket this one was split out of, empty for most. A ticket
with children is never built itself; the children are the work, and it is done when they are. `docs/tickets/`
stays flat on disk — the hierarchy is frontmatter, rendered by `flow` on demand.

### The problem it solves

Most tickets need a genuine brainstorm at pickup, tree and all, and **most of those do not split.** One ticket
in, one ticket out. The old rule forced creating a topic — a container whose entire purpose is decomposition
— for something that does not decompose.

### The argument that decides it (user's; the agent had missed it)

**You cannot know at the start of a brainstorm whether it will split.** Therefore no rule may make a
brainstorm's *location* depend on its *outcome*. That also kills the cheap patch — start it in the ticket,
move it to a topic if it splits — for a second, independent reason: a ticket's path is fixed for life,
because `handoff.md` and the job briefs sit in that folder and are referenced by path.

Hence `brainstorm/` exists from birth, always. **Nothing ever moves, in any branch.**

### Statuses — seven, replacing ten

Today: tickets carry `todo, in-progress, review, done, dropped, superseded`; topics carry
`in-progress, parked, committed, dropped`. `in-progress` is the weak one — it is true while thinking, while
coding and while checking, so it answers nothing.

| status | means | next move |
|---|---|---|
| `todo` | minted, never picked up | `flow start` |
| `thinking` | picked up; evaluating, brainstorming, researching | resolve the open decisions |
| `building` | the plan is written, code is being written | work the plan |
| `review` | built, being checked | verify, then close |
| `done` | finished | terminal |
| `parked` | thought through, deliberately not now | `flow start` revives it |
| `dropped` | abandoned | terminal |

- **`thinking`, not `brainstorming`** — every ticket passes through it including the ones needing no
  brainstorm at all, and it also covers reading the code and doing research. "Brainstorming" would be a lie
  in the common case.
- **`committed` dissolves** — "children exist" is data `flow` reads off, never a state.
- **`superseded` dissolves too**, see *Drop* below.
- A parent that split sits in `building` like anything else; its work is being done by its children. `flow`
  renders `2/3` where a normal ticket shows a plan.

### Pickup

```
flow start t047
│
└─ evaluate: read the code, read what the ticket already carries
   │
   ├─ decisions all present     write ## Plan            ──▶ building
   │
   └─ open decisions            brainstorm/ tree, resolve it
      │
      ├─ one unit of work       write ## Plan            ──▶ building
      │
      ├─ several units          mint children            ──▶ building
      │                         t047 is done when they are
      │
      └─ not worth building     flow park t047           ──▶ parked
```

The evaluation is **not a status.** It is the first minutes of `thinking`; a state occupied for ninety
seconds does not earn a name.

### Drop, and what happens to dependents

`deps` is stored on one side only — `t060` carries `deps: [t047]`, and `t047` records nothing about `t060`.
`flow` finds dependents by scanning. So when `t047` dies, the data that goes stale lives on a ticket the user
was not thinking about, and every repair edits *that* ticket. That asymmetry is the whole issue.

Left alone, a dropped dependency counts as permanently unmet, so `t060` never appears in `flow next` again —
invisible rather than lost. `flow check` already reports exactly this.

**Bare `drop` refuses when live dependents exist**, and lists them **transitively** — `t070` behind `t060`
behind `t047` all appear before anything is destroyed. Two ways out, mutually exclusive:

```
flow ticket drop t047 --by t051      live dependents re-point: deps [t047] becomes [t051]
flow ticket drop t047 --force        live dependents are dropped too, each with an automatic reason
```

`--by` requires `t051` to exist and prints every ticket it touched. Dependents already `done` or `review` are
left alone either way — their history is not rewritten. **The `by:` frontmatter field is not kept**: `--by`
needs the replacement only at the moment it runs, nothing queries it afterwards, and the trail lives in
`reason:` instead.

This is the old `supersede` behaviour, minus the status and the separate command. The user rejected
`superseded` as a status on 2026-08-08 — *"too specific and most of the time we won't be needing it"* — after
the agent had first recommended deleting the mechanism outright, which was wrong: the mechanism is the only
thing that rescues dependents, and the code comment said so.

### `reason:` — why a status changed

New in the rework, user's idea. One frontmatter field, overwritten on each change that carries one; git holds
the previous values, so an append-only log would buy history that already exists.

| transition | reason |
|---|---|
| `todo → thinking → building → review → done` | none — the workflow *is* the reason |
| `→ parked` | **required**, typed by the user |
| `→ dropped` | **required**, typed by the user |
| dropped by a `--force` cascade | **automatic** |

```
flow park t047 "vendor API changes land in Q3, pointless before that"
flow ticket drop t047 "we're not shipping a daemon at all"

reason: dropped with t047 (detect the daemon), which it depended on     ← the automatic one
```

An optional reason is a reason nobody writes; requiring it on exactly the two exits where the *why* is
unrecoverable makes it stick without taxing the daily path. **Reviving a parked ticket clears the field** —
a stale reason is worse than none.

### Closed: does a parent auto-close when its last child finishes?

**No — `flow done` refuses on a parent with open children and leaves the call to the user.** Decided
2026-08-08; the user was indifferent and left it to the agent. Closing a parent is a judgment about whether
the original question got answered, and the children finishing is evidence, not proof.

### Deleted by this decision

`docs/topics/` · `flow topic` and all its subcommands · topic statuses `in-progress`, `parked`, `committed`,
`dropped` as a separate set · ticket status `superseded` · `flow ticket supersede` · the `by:` field · the
`superseded` branch in `unmetDeps` · the `supersededDeps` section of `flow check` · topic frontmatter
`from:`.

### The one real loss

Topic frontmatter had **`from: [t014, t018]` as an array** — several tickets feeding one design session, for
when two open questions are really one design problem. A ticket has exactly one `parent`, so that goes.
Workaround: mint one ticket owning the combined question with `deps` on both. Clumsier, and a genuine trade.

### Objections raised against the merge, and where each landed

The agent argued this down twice before conceding; the record is kept so it is not re-argued from scratch.

1. *Topic and ticket statuses are incompatible — a topic has no `done` because "a topic is a document, not
   work".* **Resolved.** With one kind, `committed` is derivable, and `parked` becomes a ticket status.
2. *`parent` was deliberately removed once.* **Resolved.** The stated reason was **redundancy with `topic`**
   — *"`topic` already groups, and the containment link is stored once on the topic side (`from:`)"*. Remove
   topics and the redundancy is gone. The separate cycle objection was aimed at collapsing parent *into*
   `deps`, which this does not do.
3. *Product mode does not collapse — `docs/brainstorm/` can never be a ticket, so you end with two concepts,
   not one.* **True, and accepted as fine.** An honest split by altitude with no overlap, and simpler than
   three where two of them (topic, parent ticket) did the same job.
   **Overturned 2026-08-09.** The acceptance was wrong, and wrong for a reason nobody checked at the time:
   `docs/brainstorm/` allowed exactly **one per repo**, and that is false in three of the user's four real
   directories. The fix was not to make the product brainstorm a ticket — it is a folder that holds
   brainstorms, plural, in either of two modes. See the 2026-08-09 section.
4. *Hierarchy was rejected on evidence* — delapse's `e1-web-app/` + `s01-*.md` + `t14-*.md` mixture the user
   could not parse. **Survives but does not bite:** `docs/tickets/` stays flat, the link is frontmatter, and
   `flow` renders the tree on demand.
5. *The merge is not needed to fix the case — one folder would do.* **Overtaken.** Killing the ticket→topic
   conversion leaves topics with no birth mechanism, so they wither. Half-keeping them is worse than either
   alternative.

### Build cost

- [x] **`flow` — BUILT 2026-08-09, end-to-end tested in a scratch repo.** Topic commands stripped
  (`store.js` lost `readTopics`/`writeTopic`/`createTopic`/`findTopic`, `templates/topic.md` deleted).
  Added `--parent`, `flow park <id> "reason"`, `flow build <id>` for the new `thinking → building` step,
  `reason:` cleared on every transition that is not park or drop, transitive dependent check on drop,
  `--by` / `--force`. Statuses are the locked seven; `superseded` is gone everywhere, including
  `unmetDeps` and `flow check` — which gained a `danglingParents` report in its place. `flow done` refuses
  on a parent with open children, `--force` overrides. `flow ticket new` now creates `brainstorm/tree.md`
  so the folder exists from birth. `render.reasonText` renamed `blockText` to stop it colliding with the
  new `reason:` field.
  **One judgment call not in the locked text:** `parked` does **not** archive. The locked list of terminal
  statuses names exactly two, and parked is revivable, so it stays in the live pool — with a dedicated
  block in `flow status` so a deliberate "not now" cannot quietly become "forgotten".
- [x] **`global/CLAUDE.md` — BUILT 2026-08-09.** See the 2026-08-09 build-cost section below; both sections'
  changes to this file landed in one pass.
- **`wip/context/design-brainstorm-rework.md`** and the `brainstorm` skill — written against topics.
- The five skill rewrites below were blocked on this call. **They are unblocked now**, and every one of them
  gets written against the shape above.

---

## ✅ LOCKED — brainstorms stand alone, in two modes (approved 2026-08-09)

**Approved by the user 2026-08-09**, after walking the design against three real directories outside this
repo. Supersedes the `docs/brainstorm/` row of the 2026-08-08 section and overturns its objection #3.

### The change, in one line

**A brainstorm no longer needs a container Flow owns.** It is a shape that can sit anywhere, and it has two
modes chosen when it starts.

### The evidence that forced it

Three directories the user named, none of them a plain software project:

| Directory | What it is | Verdict |
|---|---|---|
| `~/code/toolbox` | tool catalog, being rebuilt as an automated crawler + queryable library | **fits already.** It is a real software product. Only open question is how an existing repo enters Flow — that is `migrate-to-flow` |
| `~/code/playground` | one git repo holding four unrelated things: `delapse`, `real-aloud-app`, `sap`, `yt-workflow` | **breaks the singular product folder.** There is no "the product" to brainstorm |
| `~/kb_v0` | personal notes with its own complete filing system, documented in its `GUIDE.md` | **never gets tickets.** But brainstorms happen there, before any repo exists |

Damage already on disk in those repos, all from one cause — a brainstorm having nowhere legitimate to sit:

- `reader-app` material exists in **both** `kb_v0/20-projects/planned/reader-app/` and
  `playground/real-aloud-app/` (`prod-vision.md`, `voiceover-feature/` in each). `delapse` material is split
  three ways. Nothing marks which copy is live.
- `kb_v0/20-projects/planned/` holds **seven** stalled brainstorms — browser-agent, reader-app, lang-app,
  marketing-toolkit, media-recommendation-app, yt-media-reply — with no status, no date, no recorded reason.

### The two modes

Chosen when the brainstorm starts. There is no test and no rule about outcomes.

| | **Normal mode** | **Product mode** |
|---|---|---|
| subject | anything — a topic, a question, a feature, a ticket's own thinking | a whole product |
| how it ends | create tickets, or write a document, or nothing | write `docs/spec/` |
| after it ends | finished | tickets are created **from the spec**, for as long as the product lives |

**Started normal and it turns out to be a product?** Start a fresh brainstorm in product mode and list the
earlier ones as references at the top of its `tree.md`. Nothing converts, nothing moves, the old ones stay
untouched. This is the user's answer (2026-08-09) to the agent's objection that a mode cannot be chosen up
front because the outcome is unknowable — **the objection is withdrawn**; a wrong guess costs one new folder.

### Where a brainstorm lives

```
docs/
├─ brainstorms/              not attached to a ticket. Both modes, any number
│  ├─ toolbox-rebuild/       product mode
│  │  ├─ tree.md             mode recorded at the top, not in the path
│  │  └─ <branch>.md
│  └─ sap-network/           normal mode
│
├─ spec/                     written by a product-mode brainstorm
│  ├─ product.md
│  └─ tech.md
│
└─ tickets/
   └─ t047-scrub-back/
      └─ brainstorm/         normal mode, this ticket's own thinking. Present from birth
```

Outside a project — `~/kb_v0`, a bare directory — a brainstorm sits **wherever you are standing**, same
shape, no reserved path. `docs/brainstorm/` singular is **deleted**: it allowed exactly one per repo.

### The two outputs — only one of them travels

Every brainstorm produces two things, and confusing them is what put `reader-app` in two repos:

- **the working material** — `tree.md` plus a file per branch that grew. **Stays where the thinking
  happened**, always, with one exception below.
- **the finished document** — a spec, a product vision, a research writeup. **Files wherever it belongs**,
  which is often not where the thinking happened.

**One live copy of anything; everywhere else is a one-line pointer.** This is the rule that would have
prevented the observed three-way `delapse` split.

### When the folder does move

A loose brainstorm turning out to be **one unit of work**: the whole folder moves into the ticket it
becomes, as that ticket's `brainstorm/`, and nothing is left behind. Legal because the ticket does not exist
until the move — "a ticket's path is fixed for life" starts at that moment.

Turning out to be **several units**: the folder **stays** and becomes the design record; the tickets link to
it. Reason it does not move into a parent ticket instead: terminal tickets move to `docs/tickets/archive/`,
so a parent closing would bury the design record for shipped work in an archive folder.

**A loose brainstorm in a directory that becomes a project during the ending** — greenfield, `docs/` is
created right then — is placed into `docs/brainstorms/<slug>/` at that moment. Otherwise it sits at repo
root beside a `docs/` tree forever.

### Rulings that came out of the same walk

- **"Project" means `## Project` is present, never "a `CLAUDE.md` exists."** A directory can want rules
  without being a project. `~/kb_v0` gets a rules-only `CLAUDE.md` — no `## Project`, no `docs/` table, no
  tickets, no `flow` — and it grows over time.
- **Every path Flow names is a default.** A path written in `## Preferences` (machine-wide) or in a
  directory's own `CLAUDE.md` (that directory only) wins. Stated **once** in `global/CLAUDE.md`; no
  per-path override syntax, no `## Paths` block, nothing in `project-template/`. Pattern copied from
  superpowers' brainstorming skill, which names one default path and adds a single parenthetical.
- **Prototypes.** Loose brainstorm → the prototype sits inside the brainstorm folder. Inside a project →
  `protos/` at repo root, because `docs/` must not hold runnable code; the brainstorm links to it.
- **Brainstorm always precedes the prototype.** The agent claimed a prototype can come first and produce the
  question; the user corrected it — `real-aloud-app` went brainstorm, then research, then prototype. No
  change to the chain.
- **A global register of loose brainstorms is PARKED, not dropped.** Proposed as
  `~/.claude/flow/brainstorms.md`, one line each — date, path, one-line subject, and the session id, which is
  real and reachable (`CLAUDE_CODE_SESSION_ID`, transcripts at `~/.claude/projects/<path-slug>/<id>.jsonl`).
  User's reason for parking: brainstorms will now have fixed homes, so nothing will be lost. **What would
  revive it:** a brainstorm the user actually cannot find. The seven stalled folders in `kb_v0` were argued
  as evidence for building it and did not carry the day, on the grounds that they stalled under the old shape.
- **`grill` is a skill, not a command** — **done 2026-08-09**, moved to `skills/grill/SKILL.md`. The rule it
  establishes: a command is a one-shot prompt and is the right shape only when shell output must land
  *before* the model reasons (`/handoff` needs `git status` and `flow status`). A method that governs a
  stretch of conversation is a skill.

### Vocabulary — user-facing text

**Say "create", never "mint".** The word is all over this file and `global/CLAUDE.md`; it was never shared
with the user and reading it back to them failed outright (2026-08-09, recorded in
`wip/study-cases/bad-explanations/`). A word appearing in Flow's own files is not thereby a word the user
knows. Not swept from the existing design record — that is a build item, below.

### Build cost

- [x] **`global/CLAUDE.md` — BUILT 2026-08-09.** `docs/topics/` row deleted, `docs/brainstorm/` replaced by
  `docs/brainstorms/<slug>/`, `docs/handoff.md` carries the approved three-row rule, `protos/` gained the
  loose-brainstorm case, `~/.claude/flow/` gained faults and gaps. `## Workflow` now shows the two modes and
  the pickup tree, with the statuses updated. `## Scripts` matches the rebuilt `flow`. Added: the
  project-means-`## Project` definition, the one-line path-default rule, and **both new rules the user
  requested** — improvise (end of `## Workflow`, explicitly bounded so it cannot reach `## Hard rules`) and
  record-faults-unprompted (folded into the existing `flow/notes.md` row in `## Capture`). "mint" swept to
  "create" — zero occurrences left in the file.
- [x] **`project-template/` — BUILT 2026-08-09.** New `CLAUDE-directory.md`: `## Rules` only, no
  `## Project`, with a comment saying the missing section is exactly what makes it not a project, and a
  pointer that a path named there wins for that directory. The layout table in the root `CLAUDE.md` now
  names both shapes. `## Capture` in `global/CLAUDE.md` routes code rules to `## Project rules` **or**
  `## Rules`, so the two templates stay consistent.
- **`brainstorm` skill (2c below)** — every topic path, plus the two modes, the three endings, the
  reference-earlier-brainstorms move, and where the folder may sit.
- **`flow`** — unaffected by this section. It never knew about brainstorms.

---

## Step 2 — the brainstorm → ticket → plan chain ← **current step**

### 2a — Commands: the registration mechanism ⛔

Two separable problems, both open. This one is **how any command gets to be a command** — it outlives the
ticket system and covers tools that have nothing to do with Flow.

Today there are no commands, only paths: `bash ~/.claude/scripts/tree.sh`. The user wants real globally
registered commands, callable by name from any directory, by both the agent and himself.

**The split he stated (2026-08-06):** general-purpose tools (`tree.sh`, `merge-files.js`, a future
git-in-one-shot command) are *not* Flow-specific and should not be namespaced under Flow. Ticket and topic
commands are Flow-specific and only mean anything inside a Flow project.

- [x] **PATH mechanism settled and installed 2026-08-07: `~/.local/bin`.** Already on this machine's PATH
      and already existed, so nothing had to be configured. Each command is a **symlink** into it pointing
      at the file in this repo — nothing is copied, so editing the repo changes the command instantly.
      `~/.claude/scripts/` stays a separate concern: it is a folder symlink for the two things that are
      *not* PATH commands (`guard.js`, referenced by `settings.json`'s hook, and `link.sh`).
      Aliases stay rejected: bash does not expand them in non-interactive shells, so the agent could not
      call them. **`setup-flow-globals` (build step 3) must create all four `~/.local/bin` links plus the
      `~/.claude/scripts` folder link** — they exist on this machine already, but a new machine has none.
      Written into `flow/README.md`'s manual setup block in the meantime
- [x] **Final names, 2026-08-07** — typed as `ptree`, `fmerge`, `gsave`, `flow`. Bare `merge` and `save`
      collide with what those words already mean around git, so the one-letter prefix says which noun the
      command operates on — **f**ile merge, **g**it save
- [x] **Extensions stay on every file; the symlink drops them** (user, 2026-08-07, reversing the same
      morning's call to strip them). `ptree.sh`, `fmerge.js`, `gsave.sh`, `guard.js`, `link.sh`,
      `flow/flow.js` on disk; `~/.local/bin/ptree` → `…/ptree.sh` and so on. The stripped version failed on
      its own terms: it was meant to be consistent and wasn't — `flow.js` kept an extension because it sits
      in a package folder — and an extensionless file shows no type in an editor. The symlink layer already
      exists, so it costs nothing to let it carry the bare name. **Rule:** nothing in `global/scripts/` is
      ever extensionless
- [x] **Two languages, settled 2026-08-07 (user).** Three was one too many. `guard.py` → `guard.js`, a
      straight port verified against the Python original on 18 command probes — identical verdicts on all
      of them. The `settings.md` objection (`/usr/bin/python3` is a fixed path, nvm's node may not be on a
      hook's `PATH`) is void: `flow` and `fmerge` are Node, so node-on-PATH is already a hard dependency of
      the toolchain and the guard adds no new one. Verified from `/proc/<claude-pid>/environ` that the PATH
      Claude Code passes to hooks does contain the nvm bin dir. **The split that remains:** bash where the
      script is a thin wrapper over another command (`ptree` over `tree`, `gsave` over `git`), Node where
      there is real logic (`fmerge`, `flow`, `guard.js`)
- [x] **Language: JavaScript** (node), settled 2026-08-06. The user leaned that way and the work agrees —
      every command is *parse YAML frontmatter across N files → filter → write it back*, plus a dependency
      graph for `next` (transitive dep checks) and `check` (cycle detection). That is bash's worst domain:
      hand-rolled sed/awk against a structured format, and `deps: [t045, t046]` arrays make it worse. Node
      is already a toolchain dependency via `merge-files.js`
- [ ] **Zero dependencies preferred, not mandated** (user, 2026-08-06). Dependencies are allowed where
      genuinely necessary. Test for "necessary": the alternative is re-implementing a spec somebody else
      already got right — full YAML, semver, timezone-aware dates — not merely that it saves typing.
      The real cost is concrete rather than ideological: a dependency means a `package.json` and an install
      step, `setup-flow-globals` grows that step, and the never-run-install hard rule means **the user** has
      to run it before his commands work
- [x] **Frontmatter: hand-parse it.** Unaffected by the above — seven controlled fields (`id`, `title`,
      `status`, `type`, `topic`, `deps`, `by`) is roughly 50 lines, well under the bar.
      **Built** as `lib/frontmatter.js`, zero dependencies. Writes inline arrays (`deps: [t045, t046]`);
      *reads* block sequences too, because a hand-edited file is a real case. Empty fields are dropped on
      write rather than left as `topic:` with nothing after it
- [x] **Reference sweep done 2026-08-07, twice** (once per rename round). `global/CLAUDE.md` `## Scripts`
      rewritten for bare commands and given a `flow` entry plus a never-run-it line for `gsave`;
      `flow/CLAUDE.md` layout table plus three rules (bare paths, the extension convention, the two-language
      split); `flow/README.md` — setup block now creates the four `~/.local/bin` links, and the script list
      is split into PATH commands and path-referenced files; `global/settings.md` and `settings.json` (hook
      command is now `node …/guard.js`); `execute/SKILL.md`; every script's own usage text and `--help`.
      CHANGELOG entries left alone — they record what was true at the time
- [x] **`guard.py` deleted 2026-08-07**, the moment `guard.js` replaced it. The deletes rule now carves
      out superseded files explicitly, in both this workbench's `CLAUDE.md` and `global/CLAUDE.md` — asking
      about a file the same session just replaced is friction, not safety
- [x] **`~/.claude/scripts` folder symlink created 2026-08-07**, so `guard.js` and `link.sh` are
      reachable at the path `settings.json` and the docs name. The hook itself is still not installed:
      `~/.claude/settings.json` has no `hooks` key yet — that is `setup-flow-globals`' job
- [x] **`flow ticket new --body -` — built 2026-08-07.** Reads the whole file body from stdin and uses it
      instead of the template, so creating and filling a ticket is one command rather than create-then-edit.
      `--body "text"` also works for a one-liner. Written into `global/CLAUDE.md` as the expected form
- [x] **`flow start` refuses on an unsatisfied dep — built 2026-08-07.** Reverses the original warn-and-
      proceed design, on the user's suggestion. The argument that decided it: an agent reads past a warning
      line, but cannot ignore a non-zero exit code. The check runs *before* the write, so a refused start
      changes nothing on disk. `--force` overrides and still prints what was overridden
- [ ] Behaviour when a command is missing — files stay plain markdown + YAML and grep still works, so say
      what a skill does rather than letting it improvise

**Project-root discovery — required (user, 2026-08-06).** Commands take no path. Run from anywhere inside a
project, they locate it from the current directory.

- [x] **Resolve the root with `git rev-parse --show-toplevel`**, not a hand-rolled walk up the tree. One
      subprocess, and it already handles the cases a walk gets wrong — worktrees (where `.git` is a *file*),
      submodules, and symlinked paths. Nested repos resolve to the nearest enclosing repo, which is the
      correct answer in this workbench (running inside `flow/` must mean `flow/`, not `agentic-setup/`).
      **Built** as `lib/root.js`; nested-repo behaviour verified against this workbench — `flow/` and
      `reference/superpowers/` each resolve to themselves
- [x] `.git` is the marker, **not** `docs/tickets/` — that folder does not exist before the first ticket, so
      `flow ticket new` in a fresh project would have nothing to find
- [x] Not in a git repo → one clear error naming the `FLOW_PROJECT` escape hatch. Brainstorming works with
      no repo, but tickets do not exist until a project does
- [x] **`FLOW_PROJECT` env override — built.** Wins over git discovery; errors if the path does not exist.
      For an agent dispatched with a different working directory, and the only way to drive a non-git
      scratch project (which is how the smoke test runs)
- [x] **`gsave` — built 2026-08-07.** add + commit + push in one command. A PATH script, not the git alias
      the 08-06 note guessed at.
      `gsave` · `gsave "message"` · `-p src,docs` to stage a subset (comma-separated) · `-n` to skip the
      push · `--dry-run`. With no message it generates one from the staged paths rather than writing
      "save" — that is the every-commit-says-save problem. With nothing to commit it still pushes, so
      `gsave` also means "catch the remote up"; with no upstream it sets one.
      **User-run only; the agent never calls it** — written as such in `global/CLAUDE.md`
- [x] **Scope of `gsave` fixed by the user, 2026-08-07: it shortens three commands, it does not wrap git.**
      `--amend` and the `--force-with-lease` push that came with it were cut. The test for anything
      proposed here is not "is this useful" but "does this belong to add-commit-push". Everything else —
      amend, revert, rebase, force — is typed as a plain git command
- [ ] ❓ Optional, user's call: add the git command's name to `guard.js`'s deny list anyway. The user's
      position is that it is his command, so the guard is unrelated. Noted counterpoint — the guard does not
      gate *who* runs a command, it gates what the **agent's Bash tool** executes, and the agent can type any
      string. Cost of closing it is one deny-list line; risk of leaving it open is low in practice

### 2a2 — Commands: the ticket/topic surface — **BUILT 2026-08-06**

**Correction on the record (2026-08-06):** the 08-05 command list was never really approved — the user
waved it through to keep moving and considers it "very terribly designed and very confusing." Treat
`design-brainstorm-rework.md` → *Commands, not an index file* as a **first draft**, not a settled surface.

What is concretely wrong with the draft, so the redesign has a target:

1. **`flow ticket` and `flow tickets` are different commands.** Singular/plural as a semantic distinction is
   unmemorable — nobody recalls whether listing is `ticket list` or `tickets`
2. **`flow ticket set t047 status=done`** — key=value is un-guessable next to the obvious `flow ticket done t047`
3. **"status" means two different things** in one CLI: `flow status` (project state) and `--status` (a
   frontmatter filter)
4. **`--ready` is a flag**, buried on a list command — yet it is *the* question the whole no-index-file
   decision depends on. The most-run query should be the shortest thing to type
5. **No topic commands exist at all**, though topics get created, get frontmatter and get `parked`

**SURFACE — CONFIRMED 2026-08-06.** Three tiers: the daily loop is top-level and noun-free because it is
90% of use; everything less frequent is namespaced; overviews stand alone. Both judgment calls below were
accepted as proposed.

```
# the daily loop
flow next                            workable now — todo with every dep done
flow start  <id>                     → in-progress
flow review <id>                     → review
flow done   <id>                     → done

# looking around
flow ls [todo|in-progress|review|done|dropped] [--type …] [--topic …]
flow show <id|slug>
flow status                          active topic, in flight, in review, ready count
flow check                           cycles, dangling ids, dropped blockers

# less frequent ticket edits
flow ticket new "<title>" [--type feature] [--topic <slug>] [--deps t045,t046]
flow ticket drop <id>                warns and lists dependents — a dropped dep must error on them
flow ticket supersede <id> --by t020,t021
flow ticket dep <id> [--on|--off] t045
flow ticket edit <id> [--title …] [--type …] [--topic …]

# topics
flow topic new "<title>" [--from t014]
flow topic ls | park <slug> | commit <slug> | drop <slug>
```

How it answers each fault: singular/plural collision gone — `ticket` only, `ls` is the list verb ·
key=value gone — verbs and flags · **`--status` no longer exists**, so "status" means the project overview
and nothing else; filtering takes a bare positional (`flow ls done`) · `--ready` promoted to `flow next` ·
topics have commands.

Two judgment calls to confirm or overturn: **the daily verbs are top-level** (`flow start t047`, not
`flow ticket start t047`) — ids and slugs are visibly different so it stays unambiguous; and **`flow ls`
defaults to tickets**, with `flow topic ls` for topics — an asymmetry paid so the common case is short.

- [x] Surface confirmed 2026-08-06
- [x] **`design-init-flow.md` #B is superseded — folded in, 2026-08-06.** It was a 2026-07-29 sketch
      (frontmatter on topic files + a `scripts/status.sh` sweeping `docs/work/topics/*/` to print a status
      table) written before topics and tickets were redesigned. It is an earlier, smaller draft of
      `flow status` / `flow ls`, and nothing in it survives that those do not already cover. Mark it
      superseded in that doc during the sweep
- [x] **Templates live beside the script as real files** (user, 2026-08-06) — `templates/ticket.md`,
      `templates/topic.md`, read at runtime. **Not embedded strings in the JS:** a template is content the
      user will want to edit (add a section to every new ticket), and editing a string literal to do that is
      hostile
- [x] **Built 2026-08-06**, every command in the surface above, ~950 lines, zero dependencies:
      ```
      flow/global/scripts/flow/
        flow.js               entry + dispatch + all command bodies   (+x, #!/usr/bin/env node)
        lib/root.js           git rev-parse --show-toplevel, FLOW_PROJECT override
        lib/frontmatter.js    parse / serialize the controlled YAML subset
        lib/store.js          ids, slugs, the folder layout, templates, lookup by id or slug
        lib/graph.js          ready set, unmet deps, dependents, cycles, integrity check
        lib/render.js         tables and reports — plain text, no ANSI
        lib/error.js          FlowError → a message, not a stack trace
        templates/ticket.md   body only; frontmatter is generated
        templates/topic.md
      ```
      Knock-on, still open: `flow/CLAUDE.md`'s layout table lists `global/scripts/` as four loose files
- [ ] Sweep the command names into every doc that references them — once, not twice. Same paragraphs also
      carry the now-overturned flat-file pool wording

**Judgment calls made during the build**, each defensible but none of them previously stated:

- **`start` warns on unmet deps, it does not refuse.** `flow next` is the gate; a verb that argues with you
  is a verb you route around
- **`supersede` re-points its dependents automatically** and prints every rewrite. Re-pointing is the entire
  reason `superseded` exists as a status distinct from `dropped`; leaving the pool inconsistent and printing
  a to-do list would be worse
- **`ticket edit --title` never renames the folder.** The folder name is the ticket's identity — job briefs
  and handoffs sit inside it and links point at it. Frontmatter changes, path does not
- **`dep --on` refuses to close a cycle** at the moment of the edit, rather than letting `check` find it later
- **Templates hold the body only.** Frontmatter is generated, which is the enforceable form of "frontmatter is
  owned by the commands" — there is no placeholder to hand-edit
- **No `## Plan` heading in the ticket template.** The plan is written at pickup; an empty heading invites
  filling it early, which is the thing the design rejects
- **Ids are three digits** (`t001`), and `t47` / `47` / `T047` all resolve to the same ticket on input

**Mandatory use — confirmed by the user 2026-08-06, with the boundary stated.** Creating a ticket or a
topic, and changing status or any other frontmatter field, **must** go through a command. Everything else —
writing the body, the `## Plan`, adding files alongside — is free-hand. The line:

> **Frontmatter is owned by the commands. Everything else is written by hand.**

- [ ] Every frontmatter mutation needs a command, or the agent will hand-edit the uncovered case and the
      invariant dies quietly: create, status, deps, topic, supersede-with-`by`, retitle
- [ ] Write the rule into the skills that mutate tickets, and into `global/CLAUDE.md`

### 2b — Scripts: build — **DONE 2026-08-06**

Superseded as a checklist by 2a2, whose surface is what actually got built. Kept for the invariants:

- [x] Next id, folder created from template, dep references validated at creation
- [x] Integrity reporting as its own command (`flow check`): dependency cycles, dangling ids, `dropped`
      blockers, `superseded` deps needing a re-point. Exits 1 when anything is found. Only **live** tickets
      are reported — a `done` ticket that once depended on a dropped one is history, not a problem
- [x] `flow status` — counts by status, active topics, in flight, in review, ready vs blocked
- [x] No delete command. `status: dropped` is the archive
- [x] **`review` satisfies a dependent's `deps`**, same as `done` — verified: moving a ticket to `review`
      prints the tickets that just became ready

**Verified by smoke test** against a scratch project (`tmp/flow-smoke/`, driven by `FLOW_PROJECT`): seven
tickets and two topics created; one walked `todo → in-progress → review → done`; `next` respecting deps and
naming the blocker when nothing is ready; a dropped blocker reported on drop *and* by `check`; a supersede
re-pointing its dependent; a hand-written cycle plus a dangling id both caught; block-sequence frontmatter
and short ids (`t5`) parsed and normalized on the next write.

- [ ] **No test suite.** The smoke test was a shell session, not a file. Worth a small runner before the
      commands get load-bearing — the graph functions are the part that will silently rot

### 2c — ✅ `brainstorm/SKILL.md` — BUILT 2026-08-09

The engine survived; every path, the tree notation and the whole close phase changed. 166 lines → 151.
Built against the two locked sections, not against the stale bullets below — which are kept only as the
record of what was asked for. What actually landed: two modes chosen explicitly at the start and written at
the top of `tree.md`; the three homes (ticket's `brainstorm/`, `docs/brainstorms/<slug>/`, or where you are
standing); the never-choose-location-from-outcome rule with its single exit-time exception; `tree.md` whole
plus `<index>-<name>.md` only for branches that grew; zero-based indices; kickoff proposing root branches
**and** walk order; three endings; the profile check redirecting to `setup-flow-globals`; research landing
in `docs/research/`; prototypes after the brainstorm, in `protos/` or inside a loose brainstorm folder.

> **The bullets below predate 2026-08-08 and 2026-08-09 and are stale wherever they name topics, a singular
> `docs/brainstorm/`, or a topic-vs-product test.** Build this against the two locked sections at the top of
> this file, not against the list here. Specifically dead: the topic paths, the topic frontmatter and its
> four statuses, the topic-vs-product discriminator, and "two exits". Live replacements: two modes chosen at
> the start, three endings, `docs/brainstorms/<slug>/` or wherever you are standing.

- [ ] Zero-based branch indices (`0`, `1`, `2`; children `0.0`, `0.1`) replacing `A`/`B`/`C1`
- [ ] Output split: `tree.md` always whole in one file + `<index>-<name>.md` detail **only for branches that
      actually grew** — not one file per root branch
- [ ] Topic paths: `docs/topics/<slug>/` = `topic.md` + `brainstorm/`, nothing else
- [ ] Topic frontmatter (`slug`/`title`/`status`/`from:` array) and its four statuses
- [ ] Product mode: entered **explicitly**, never auto-detected; brainstorm lives at `docs/brainstorm/`
- [ ] Kickoff: propose root branches **plus walk order**, confirm before walking. Walk order is a recorded
      dependency rule ("branches that constrain other branches go first"), never a fixed template
- [ ] The topic-vs-product discriminator: if every root branch can be resolved in one session, it is a topic
- [ ] Two exits — **commit** (write tickets) or **park** (write none, deliberately)
- [ ] Delete Phase 4's `spec.md` writing
- [ ] Profile-existence check → redirect to `setup-flow-globals`, never do that work inline
      (`design-init-flow.md` #G7)
- [ ] Coordination table: `research`, `explain`, and `prototype` once it exists
- [ ] Where research reports land — `docs/research/`, flat and **global**, not per-topic

### 2d — ✅ the product-mode conversion sub-files — BUILT 2026-08-09

**Two files, as decided:** `write-spec.md` writes `docs/spec/`, `create-tickets.md` cuts work from it.
Everything below landed. The new material beyond the checklist: `write-spec.md` names the phase-1 failure
outright as the rule it exists to prevent, and `create-tickets.md` opens by saying it is read cold, because
it is.

- [x] ✅ **Two sub-files, decided 2026-08-09.** `write-spec.md` writes `docs/spec/`; a second file covers
      creating tickets from it. The 08-09 brainstorm lock is what settles it — the spec is written **once**,
      tickets are created from it **for as long as the product lives**. Two lifetimes, and the second file is
      read cold months later with no brainstorm in context, so it cannot be a tail section of the first.
      Name the second when it is written; it is the ticket-creation half, not a naming question worth
      holding the build for
- [ ] Write `docs/spec/` in one go from the tree — markdown only
- [ ] `product.md` — the Bible: whole product, every behavior, all versions, plus the **scope ladder**
      (V1 / next / later / never)
- [ ] `tech.md` — stack, repo layout, high-level components (backend / frontend / services / workers /
      packages), high-level design, the decisions that constrain implementation
- [ ] The disjointness rule as the birth rule for any third file: *no fact in two files; boundary statable in
      one sentence; otherwise it is a section*
- [ ] Explicitly forbidden: `decisions.md`, `open-questions.md`, a `README.md` index, frontmatter, copied
      artifacts, history or rationale in spec files
- [ ] Artifact references — inline on the decision that rests on the evidence, plus a short reference block
      at the end of each spec file. No global index
- [ ] Mint tickets **only from the V1 rung**; everything below stays prose in the ladder
- [ ] The minted ticket inherits the artifact references attached to the section it came from
- [ ] The exit condition is the scope ladder, not "the thinking is done"

### 2d2 — A ticket is a FOLDER (settled 2026-08-06, reverses 08-05's flat-file pool)

```
docs/tickets/t047-daemon-detection/
  ticket.md          frontmatter + body + ## Plan.  Constant filename, like SKILL.md
  handoff.md         the resume, overwritten, at most one
  <slug>.md          a job brief per dispatched side-job — debugging, a parallel investigation
```

Modelled on the skills layout the user already lives with (`skills/brainstorm/SKILL.md`). **Uniform from
birth** — never a file that gets promoted, never a mixed directory, never a path that changes during the
ticket's life. The user's promote-on-`in-progress` variant was argued down and dropped: location would
duplicate `status`, and all six statuses would then need a location rule.

The agent's earlier objection — that a ticket with an "inside" recreates delapse's `m08e` nesting — is
**withdrawn**. It does not survive the parallel-dispatch case above, which needs real sibling files, and the
gravity well already has a designated exit: work that deserves decomposition becomes a **topic**, which is
the concept that exists for exactly that.

- [x] Inner filename is a constant (`ticket.md`), not the slug repeated — tooling always knows the path
- [x] `flow` commands create the folder; the shape is never assembled by hand. Nothing ever *moves* it —
      not on status change, not on retitle
- [ ] Sweep every doc that says the pool is flat files — `design-brainstorm-rework.md` `## SESSION 2026-08-05`
      is the main one

### 2d3 — ❓ Scale: a few hundred tickets, most of them `done`

Raised by the user 2026-08-06 and not previously considered. At a real milestone the pool holds hundreds of
entries, overwhelmingly terminal.

- [ ] **Filtering must never require reading the pool.** `flow ls --status …` parses frontmatter across
      every ticket; that is fine for a script and impossible for an agent doing it by hand. This is the
      strongest argument yet that the commands are mandatory rather than convenience
- [x] **Archive terminal tickets — BUILT 2026-08-07.** `done` / `dropped` / `superseded` move to
      `docs/tickets/archive/<id>-<slug>/`; the live pool keeps only `todo` / `in-progress` / `review`.
      Automatic on the status write, and it moves **back** if a done ticket is reopened. Two buckets, never
      one folder per status — that would make location duplicate `status`, which is what killed
      promote-on-`in-progress`.
      **The reason is readability, not performance.** The agent measured 2000 tickets at 62 ms to parse and
      wrongly argued from that; the user's actual case is scrolling `docs/tickets/` in an editor file tree,
      where hundreds of dead folders bury the eight live ones and no command can help.
      **The one rule that makes it safe: reference a ticket by id, never by path.** The user's point —
      lookup goes through `flow show t047`, which searches both directories, so nothing breaks. Written into
      `flow`'s own help text. Paths written into a doc by hand are the only thing that can break, and they
      were already the wrong way to name a ticket

### 2e — ✅ `write-plan.md` → the ticket's `## Plan` section — BUILT 2026-08-09

The file is **deleted**; its content lives in `execute/SKILL.md`, because planning happens at every pickup
and a sub-file is only for what gets read on some runs. Every bullet below landed except the last two, which
changed shape: mid-build discovery has three outcomes but the third is now `flow ticket drop --by`, not
`superseded` + `by:` (that status no longer exists); and the pickup judgment is four-way, not two-way, since
"open a topic" became "create children" and "park it" joined. The ⚠️ carried open from 08-05 is answered —
the current-state pass is written as the load-bearing half, in the skill body and again in the hard rules.

- [ ] Plan is a section **inside the ticket file**, written at pickup, never earlier
- [ ] Part 1 — examine the current state of what the ticket changes and record it (signatures, the seam,
      what surprised you)
- [ ] Part 2 — numbered steps, each naming the files it touches
- [ ] The code rule: *write the code that was decided, describe the code that follows from it*
- [ ] Parent tickets never get a plan
- [ ] The pickup judgment — unopened → broken-down (open a topic with `from: [t]`) or planned. This is the
      only real decision in the system, and it happens at pickup, never in advance
- [ ] Mid-build discovery, three outcomes: new ticket / rewrite the plan in place / `superseded` + `by:`
- [ ] Decomposition rule: every ticket finishable and checkable without its siblings, with an observable
      "done" written at creation. Wide refactors take expand → migrate → contract
- [ ] ⚠️ Carried open from 08-05: **nothing forces the "examine current state first" pass**, and it is the
      load-bearing half of the plan

### 2f — ✅ `execute/SKILL.md` — BUILT 2026-08-09

All four bullets landed, plus the absorbed planning content from 2e. Status line is now
`flow start` → `thinking`, `flow build` → `building`, `review`, `done`.

- [ ] Reads the **ticket**, not `plan.md`; marks steps in the ticket
- [ ] Status transitions it owns: `todo` → `in-progress` → `review` → `done`
- [ ] Implementation only ever happens on a ticket with no children
- [ ] Haiku delegation and the debug-agent handoff survive as-is; `haiku-worker.md` path refs stay valid

### 2g — `code-review` skill — **promoted from optional to blocking**

`review` is a real status with a behavioural difference (it satisfies another ticket's `deps`), it is
**universal** rather than UI-conditional, and nothing implements it.

- [ ] Build it. Shape is already chosen: a reviewer subagent given base/head SHAs plus the requirements,
      returning strengths / issues / assessment (`reference/superpowers/skills/requesting-code-review/SKILL.md`)

### 2h — 🔁 `flow/global/CLAUDE.md` knock-ons — **DONE 2026-08-07**

- [x] `## Workflow` rewritten for the ticket chain — *brainstorm → tickets → plan → build*, with the two
      brainstorm modes and their paths shown inline, and a closing rule that **`## Plan` is written at
      pickup, never in advance**. `plan.md` named once, as a thing that no longer exists
- [x] `## Key docs` rebuilt: eleven rows. Added `docs/tickets/` (folder shape, the archive, *reach a ticket
      by id, never by path*), `docs/topics/<slug>/`, `docs/brainstorm/`, `docs/inbox.md`, `docs/handoff.md`
      (carrying the four-level ladder in one sentence), `protos/` and `~/.claude/flow-notes.md`. `docs/spec/`
      now names `product.md` + `tech.md` and states *no index, no `decisions.md`*; `docs/research/` says flat
      and global; `docs/work/backlog.md` gone
- [x] `## Capture` rewritten. Committed work → `flow ticket new`, might-do work → `docs/inbox.md`, and the
      test between them is **commitment, not size**. Locked decisions → the brainstorm tree that owns the
      subject, with the spec taking over once it exists. Open questions → the ticket that answers them.
      (This closes the one open item in `design-capture-rework.md`)
- [x] Flow-notes row added in both `## Key docs` and `## Capture`, with the routing test and the
      date+project stamp. It is also the one row that survives *no project here*
- [x] **Path changed to `~/.claude/flow/notes.md` (user, 2026-08-07), reversing the loose
      `~/.claude/flow-notes.md`.** `~/.claude/` is Claude Code's own directory; everything user-owned in
      there (`CLAUDE.md`, `settings.json`, `skills/`, `scripts/`) is **config Claude Code loads by
      convention**, and a notes file is not — nothing reads it. So it gets its own obviously-named subfolder
      that Flow owns and Claude Code ignores. Keeps the user's backup plan intact (he symlinks the whole
      `~/.claude/` into a private notes repo) and leaves room for the by-kind split the design already
      allows. Rejected: `~/.flow/` — fully isolated, but a second backup decision and a new top-level
      dotfolder for one file. **`setup-flow-globals` must create `~/.claude/flow/` and never write inside it**
- [x] Confirmation markers updated — `[inbox]`, `[ticket t048]`, `[flow-notes]`
- [ ] ❓ **Does `docs/work/backlog.md` still exist?** Raised by the user 2026-08-06: minting a ticket
      mid-work (id, frontmatter, topic, deps, a file) is heavy next to jotting one line, so killing
      backlog.md outright may have removed a real convenience.
      **Agent recommendation — drop it, and point `## Capture`'s future-work row at `docs/inbox.md`.**
      The inbox already *is* the zero-decision capture file ("fragments, half-formed ideas, anything with no
      home yet"), and its whole premise is that you do not route at capture time. Once work has a real home
      in the ticket pool, backlog's only surviving job is "work I have not committed to yet" — which is the
      same sentence as "not yet routed." `organize` gains one destination: **mint a ticket.** One staging
      file, one drain, one pool.
      *Rejected alternative:* keeping backlog.md as an explicit staging area that drains into tickets. That
      is the inbox with a second name, and it re-imposes a routing decision at capture time — the exact
      thing the inbox model was built to remove
- [ ] ❓ **Does `docs/work/` still earn a folder?** **Agent recommendation — no, delete it.** With
      brainstorm, topics and tickets all at `docs/` level it holds two transient files; and the name is now
      actively misleading, because the actual work lives in `docs/tickets/`. Move them to `docs/inbox.md`
      and `docs/handoff.md`. The per-topic variant `docs/topics/<slug>/handoff.md` is unaffected

### 2i — 🔁 stale paths in the other skills

- [x] ✅ **`organize/SKILL.md` — DONE 2026-08-09.** Both fixed, plus `docs/work/inbox.md` → `docs/inbox.md`,
      the dead `docs/work/backlog.md` flag target, and the end-of-session sweep re-pointed from a topic's
      files to the brainstorm tree. Gained the commitment test for creating a ticket from an inbox item
- [x] ✅ **`research/SKILL.md` — DONE 2026-08-09**, not previously on this list. Reports move to
      `docs/research/<question>.md`, flat and project-wide; distilled conclusions route to a branch in
      `tree.md`, a spec section, or `docs/context/`. `docs/refs/` dropped
- [x] ✅ **`commands/handoff.md` — DONE 2026-08-09.** The ladder below is written into the file verbatim,
      plus the user-path override sentence. **Converted to a command 2026-08-08**; the file moved out of `skills/` and
      now prefetches `git status --short` and `flow status` into the prompt, so the ladder below can be read
      off rather than reasoned out. What remains here is content only. **Needs a new resolution ladder, not a
      path fix.** It currently knows two
      locations (`docs/work/topics/t<NN>-<slug>/handoff.md`, else `docs/work/handoff.md`); both paths are
      dead, and the user raised 2026-08-06 that **a handoff is needed per ticket too** — mid-implementation
      is exactly when a session runs out. Product brainstorms need one as well: they are multi-session by
      default, and that is what replaced real-aloud's 75-line resume blob.
      **✅ Approved 2026-08-09.** Three rows, not four — topics no longer exist, and every brainstorm now
      resolves the same way regardless of where it sits:

      | when | where |
      |---|---|
      | working a ticket | `docs/tickets/t047-slug/handoff.md` |
      | working a brainstorm, anywhere on disk | that brainstorm's own folder, `handoff.md` |
      | neither | `docs/handoff.md`; no project → beside the working file |

      Plus one sentence, and nothing more: **a path named by the user wins.** Same override shape as the
      brainstorm path rule — one default, one parenthetical, no table and no syntax. The user's framing
      (2026-08-09): the handoff is like the brainstorm folder, it depends on preference, it can be literally
      anywhere, and the default should simply be the most relevant place. Ask for one mid-brainstorm and it
      belongs in that brainstorm's folder.

- [x] ✅ **DONE 2026-08-09** — `commands/handoff.md` "The job" and "Where"; `execute/SKILL.md` says a brief
      must never clobber the resume. **A resume handoff and a job brief are different things — the skill already says so, and tickets give
      the second one a home.** `commands/handoff.md` today: the default is *resume the same work*, overwritten,
      one per context; naming a different job outright ("debug this", "investigate in parallel") makes it a
      **brief** for that job, written as its own file so it cannot clobber the resume. Several briefs can be
      live at once; there is only ever one resume. With folder-per-ticket both land inside the ticket folder:
      `handoff.md` for the resume, `<slug>.md` per brief. Raised by the user 2026-08-06 as the case a single
      file could not serve — correct, and this is the case that earns the folder
- [x] ✅ **DONE 2026-08-09** — `execute/SKILL.md`, end of "Mid-build discovery". **Dispatching a subagent is
      an execution choice; creating a ticket is a recording choice. They are
      independent** (locked 2026-08-06). A tricky bug found while implementing t047 does **not** become a
      ticket merely because you want a separate session on it — write a brief and dispatch. It becomes a
      ticket only under the existing mid-build-discovery rule, when the work turns out to be genuinely
      separable. Otherwise it is churn: an id, a status, a deps entry, `done` twenty minutes later
- [ ] The debugging brief is what the unbuilt `debug` skill consumes — design the two together
- [ ] ~~Milestone-level handoff path~~ — **dissolved.** Milestones no longer exist; tickets replaced them

### 2j — `flow/project-template/` — **DONE 2026-08-07**

- [x] **`docs/work/` deleted from the template** (user-authorized delete). It shipped an empty
      `backlog.md`, which the 2h decision killed. The template is now **three files** — `CLAUDE.md`
      (`## Project` + `## Project rules`), `CLAUDE-directory.md` (`## Rules` only, added 2026-08-09 for a
      directory that is not a project) and `.gitignore` (`tmp/`) — and nothing else: every `docs/` path
      is created on first write by whatever needs it, so a new project starts with two files rather than a
      tree of empty scaffolding
- [x] `flow/CLAUDE.md` layout table and `flow/README.md`'s "Starting a new project" both updated to match

---

## Step 3 — `setup-flow-globals` (new skill)

Once per machine. Design: `design-init-flow.md` #G7.

- [ ] Copies `global/CLAUDE.md` → `~/.claude/CLAUDE.md`, merges `global/settings.json` into
      `~/.claude/settings.json` (this is what installs the `guard.js` hook — a fresh machine has no `hooks`
      key at all), runs `link.sh`
- [ ] **Three symlink jobs, all of them:** the folder link `~/.claude/scripts` → `global/scripts/`, for files
      named by path · the four `~/.local/bin` per-file links that drop the extension (`ptree`, `fmerge`,
      `gsave`, `flow`) · **`~/.claude/toolbox` → the `toolbox/` submodule**, which is the path
      `global/CLAUDE.md` names for the tool catalog. Miss the last one and every external-tool lookup breaks
      ⚠️ `commands/` and `agents/` are **not** here — `link.sh` links those per file, same as skills, because
      `~/.claude/{skills,commands,agents}/` are shared namespaces. A folder symlink evicts every non-Flow entry
- [ ] **Creates `~/.claude/flow/` and never writes inside it.** `notes.md` there belongs to the user, not the
      template — silent and unrecoverable if it is overwritten
- [ ] Interviews once for `## The user` and `## Preferences`. **Source material is `wip/context/user-profile.md`**,
      carried out of the workbench; delete that file once the personal copy exists
- [ ] Existing populated `~/.claude/CLAUDE.md` → append under a marked Flow heading, never overwrite; report
      contradictions rather than silently competing
- [ ] Sets `autoMemoryEnabled: false` — currently `true` globally, with live memory dirs for `backmark` and
      `backmark-validation`

---

## Step 4 — `migrate-to-flow` (new skill)

Written last, against a destination that by then exists. The old `init-flow` SKILL.md is **rejected in full**
and parked at `wip/rejected-init-flow/` — the input to the rewrite, never patched.

- [ ] Test built-in `/init` with `CLAUDE_CODE_NEW_INIT=1` against a real repo **first** — it already does
      subagent codebase exploration, gap questions and a reviewable proposal, which is most of the survey phase
- [ ] Decide the "already on Flow" marker — `## Workflow` is no longer in the project CLAUDE.md; presence of
      `docs/work/backlog.md` is the leading candidate, and 2h may kill that file
- [ ] Quarantine colliding paths, never merge (#10)
- [ ] Harvest into `CLAUDE.md` + `docs/context/` only — **never** `docs/spec/` (#12)
- [ ] Fetch payload by raw URL, no clone; delete only what the run created
- [ ] `.claude/agents|commands|skills` analyzed for **behavioural** collisions, reported, never moved silently
- [ ] Codebase survey reads real code — on disagreement the code wins and the stale doc claim is dropped

---

## Step 5 — the real migration

- [ ] Migrate `delapse` and `lumacraft_v2` — the real test cases, and the reason the migration path exists
- [ ] Delete their project-local skills afterwards (skills are global-only, one symlinked copy per machine)
- [ ] Harvest `delapse` / `lumacraft_v2` / `framework-build` knowledge into skills before that material is lost

---

## Skills — not blocking the chain

- [x] **`debug` — BUILT 2026-08-15**, designed the same day. `skills/debug/SKILL.md`, `agents/debug.md`
      (model `opus`), and `worktree.bgIsolation: "none"` in `global/settings.json`. The reasoning is in
      `wip/context/design-debug.md`: the red command as the core, the gate that blocks naming any cause
      until that command has failed, three ranked hypotheses shown to the user before any is tested, the
      user as an instrument, and dispatch as an attachable background session (`claude --agent debug --bg`),
      which reports to a file and is polled with `claude agents --json`. The original
      entry, kept for its reasoning: Raised again by
      the user 2026-08-06 and missing from the first version of this list. It was named as a needed skill
      back in the original problem inventory, and its core principle already shipped as a hard rule in
      `global/CLAUDE.md` (*"No cause without evidence. Hypothesis: X. To verify: Y."*) — but the rule is one
      line and the skill is the loop around it. Highest-value item in this group: it fires on every project,
      every stack, constantly.
      **Design it against `debug-web-pages` and against `reference/superpowers/skills/systematic-debugging`.**
      The disjointness rule applies to skills too — the general skill owns the *method*, the domain skill
      owns browser specifics. Today `debug-web-pages` is the only debugging skill Flow has and it silently
      stands in for a general one it was never scoped to be
- [x] ~~**`prototype` — brainstorm it before building it.**~~ **BUILT 2026-08-12**, `skills/prototype/SKILL.md`.
      The full record is the entry under `## Design threads still open` above; this one is the older duplicate
- [x] ~~**A router skill, in the shape of `ask-matt`.**~~ **Dropped 2026-08-07 (user).** It exists to
      orient *newcomers*, and there are none — one user, who is building the thing. If Flow is ever opened
      up, the narrative it would carry (main flow, on-ramps, what is standalone, how work crosses sessions)
      goes in `README.md` or a guide file, which is cheaper and cannot go stale in context. Not a skill
- [ ] **`testing` — decide, leaning no.** Stack-specific testing knowledge belongs in that stack's skill;
      project-specific conventions belong in `docs/context/`
- [ ] 🔁 **`visualize`'s mockup output is weak** (user's verdict; the skill was called `explain` then). The
      ASCII/structural side works; the mockup side needs its own pass
- [ ] 🔁 **Telegraphic refactor pass** over `brainstorm`, `research`, `execute`, `debug-web-pages`
- [ ] `debug-web-pages` is prototype-adjacent but narrow — revisit alongside the `prototype` brainstorm

---

## Hooks

- [ ] **`PreCompact` hook** — block-once state file, so auto-compaction gives way to `handoff`
- [ ] **Context-pulse hook** — inject remaining-context info so the agent can trigger `handoff` itself.
      The agent can often judge this unaided; the hook makes it reliable

---

## Housekeeping

- [ ] **Link skills and commands globally** once the set is final: `bash global/scripts/link.sh` from the
      repo root. Not before — nothing loads until then, and that is deliberate. As of 2026-08-07
      `~/.claude/skills/` holds only three unrelated folders from May (`find-skills`,
      `improve-codebase-architecture`, `write-a-skill`, all linked to `~/.agents/skills/`) and
      `~/.claude/commands/` does not exist; no Flow skill or command is installed anywhere
- [ ] **Tune `guard.js`'s deny/ask lists** against real use. Written from the hard rules, never against
      observed false positives; a `deny` verdict cannot be overridden in-session
- [ ] **Real commit messages.** Nearly every commit in `flow` says `save`, which is why per-skill changelogs
      have to carry the reasoning
- [ ] **Rewrite `session-new-plugin.md`'s stale "Skills still to build" list**
- [ ] **Clean up `wip/` redundant content** — deferred until the design lands; several docs carry superseded
      blocks, and `session-new-plugin.md` is a newest-at-the-bottom log whose older entries still name
      `new-workflow/` and `agentic-setup/` paths that no longer exist. Those are dated records, not live
      pointers; the live pointers at the top of both files were corrected on 2026-08-07

---

## Design threads still open

- [x] ~~**`prototype` — the next skill to build.**~~ **BUILT 2026-08-12**, `skills/prototype/SKILL.md`,
      86 lines. The four jobs agreed 2026-08-11 collapsed to **two**: a measured question and a judged
      one. The state-model demo is just a measured question with a clickable artifact, and the
      library playground left for `research` — a playground has no fixed question, so it produces
      understanding, which is what `research` produces. **Reading is research, running is prototype**
      still holds as the boundary between the two skills. The `brainstorm` entry claiming it "names
      `prototype` in three places" was **stale** — the rewrite dropped every mention, so nothing ever
      halted; two lines describe the job without naming the skill and still need fixing.
      **REWRITTEN 2026-08-12**, second pass, after the user caught a structural error: the skill had the
      prototype session writing its own handoff, which is impossible — that document already exists by the
      time the skill runs. **Two sessions, not three.** The brainstorm names the question, writes the
      handoff and *waits*; a fresh session builds and reports back; the brainstorm reads the report and
      closes its own branch. A third session only appears when the first runs out of context. The skill is
      now the middle box only: stand it up · build only what the question needs · report. `map.md` never
      appears in it.
      **Both follow-ups closed 2026-08-14.** `visualize` keeps its HTML-preview section — moving it here was
      reversed by the locked decision that `prototype` owns appearance only where the real stack answers the
      question. `project-template/.gitignore` now carries `protos/*/node_modules/`, which is the artifacts
      line: a prototype's code and `REPORT.md` are committed, so the folder itself is never ignored. The
      `brainstorm` line is done.
- [x] ~~**Drop "brief" as a word**~~ — **DONE 2026-08-12**, and it turned into a real fix rather than a
      rename. The gap was in `/handoff` itself: it listed five things every handoff answers, and three of
      the six a prototype needs landed nowhere. What those three share is that **someone is waiting for an
      answer** — nothing to do with prototypes. The handoff file now names **two jobs, resume and
      assign**, with four extra items for an assigned job (what turns on the answer · what done looks
      like · what to produce · what to say back), plus two repairs: "where it stands" split out a **what
      is already set up** line for the environment, and **what was found** now earns its own line, because
      the old "point at what's on disk" test actively suppressed writing out facts that cost an hour to
      extract from a package's source.
      Word swapped to "assignment" in `execute` (102, 112, 129), `global/refs/workflow.md:42`,
      `global/settings.md:53`. Left alone: `execute:93` (the adjective), `global/CLAUDE.md:87` (generic
      prose, and it is mirrored in the repo `CLAUDE.md`).
- [x] ~~**`handoff` is a command**~~ — **CONVERTED TO A SKILL 2026-08-12** (user). A command can only be
      typed, yet the file's own trigger list asks to fire when a brainstorm resolves or a ticket finishes —
      it asked for something the format cannot do. A skill is still typeable as `/handoff`, so nothing was
      lost. **The real win is the pre-run scripts.** `git status --short` and `flow status` were baked in
      with the `!`-backtick syntax and fired on every handoff; a prototype assignment needs neither. They
      are now step 2, **"gather only what this job needs"**, and nothing runs by default. Same pass made
      `## Where` lead with the general rule and demote Flow's ticket paths to examples, so the skill is not
      tied to one project layout. `commands/` is deleted — it held only this file. `link.sh` skips a
      missing folder, so it was left alone; `CLAUDE.md` and `README.md` layout lines updated.
- [x] **The resume handoff should be disposable, not tracked** (user, 2026-08-12) — **closed 2026-08-15.**
      `skills/handoff/SKILL.md` says to delete the file once the job it describes finishes, never at the
      moment it is read, since a session that dies mid-job needs it again. The gitignore half was tried and
      **reversed**: a handoff file is tracked like every other file. Deleting it is what makes it disposable,
      and git holding the old one is the point. `.gitignore` is back to `tmp/` alone, and the user restated
      the rule 2026-08-15 — **handoff files are never gitignored.**
- [ ] **Subagent assignments never got the same treatment.** `skills/research/SKILL.md:49` still describes
      a subagent prompt with its own four-item shape — the question, the constraints, the sources, the
      required output — which is the assign shape under a different name. `execute` dispatches subagents
      too. Decide whether an in-session subagent dispatch is the same document type as a cross-session
      assignment, or genuinely different. Nothing contradicts anything today; this is a unification.
- [ ] **Does `flow start` need a slash command?** Checked 2026-08-11: `flow start t047` is a one-line
      status transition and nothing about it is unfinished. What may be missing is a `/start` command —
      Flow has exactly one command today. But `execute`'s description already says "reach for it when
      starting work on a ticket", so typing "start t047" should load it without one. **Leave it; fold
      into the `flow` simplification pass.** Reopen if the skill demonstrably fails to load in practice.
- [ ] **Where the review paragraph lives once `review` exists.** `grill` was deleted 2026-08-11 and its
      content is one paragraph in `brainstorm` Phase 3. The user's framing is that it is a **review**
      behavior; the `review` skill is unbuilt and its scope is deliberately wide (brainstorm, design,
      plan, code — not specific to any). Decide then whether the paragraph moves. Five lines.
- [ ] **`execute` likely gets a full rewrite** (user, 2026-08-11), after `prototype`. Not started, no
      scope agreed. Its `## Plan` half is the piece that has to line up with the new design document —
      a design now exists in some brainstorms and the plan is a sequencing of it, not a re-derivation.
- [ ] **Two rules for `global/CLAUDE.md`, both confirmed by the user 2026-08-09 — wording open, not written
      yet.** They are a pair: the first lets the agent leave the workflow, the second makes leaving it
      leave a trace.

      **Rule one — the agent may improvise.** Flow's instructions are not followed 100% of the time. When the
      situation is one the workflow never considered, or following it would fight the work, the agent departs
      from it: say which part is being set aside and why, then carry on. Silently forcing a bad fit is the
      failure this prevents. This is a **standing permission**, not an exception to be requested — asking
      every time defeats it.

      **Rule two — the agent notices and records the workflow's own faults, unprompted.** Once Flow is in
      daily use, gaps, friction and outright problems will show up in the course of ordinary work. When the
      agent sees one, it writes it down **without being asked**, so the whole set can be reviewed later.

      **Rule two is ~80% already built and needs sharpening, not a mechanism.** `## Capture` in
      `global/CLAUDE.md` already routes *"about **Flow itself** rather than what you're building"* to
      `~/.claude/flow/notes.md`, stamped with date and project, and already carries the routing test and the
      `[flow-notes]` confirmation marker. It is also already unprompted — *"background reflex, not every
      turn… unsure: write it"*. Two things are missing: the destination row is written for **insights**, and
      never names a **fault, gap or friction point in Flow** as the kind of thing to notice; and nothing
      connects it to rule one, where every departure is by definition a gap worth recording.

      **Not blocked on the complaints-filing question below.** These notes are about Flow, and `flow/notes.md`
      is the settled home for that. What is still unsettled there is the user's *own* complaints and how a
      long study case gets filed — a different pile.

- [ ] **Skills vs. agents vs. commands — never actually decided** (raised 2026-08-07). Claude Code offers
      three extension points and Flow reflexively puts everything in skills. Worth deciding deliberately
      which of the three each capability belongs to, and whether anything now a skill should move.
      **Un-parked by the user 2026-08-08 — moved to `wip/context/threads.md`, thread `extension-points`**, which
      carries the full statement and is the active thread
- [ ] **Go over the scripts and possibly simplify them — mainly `flow`** (raised by the user 2026-08-11).
      **Low priority, and deliberately vague — the user said so twice: "it's not a clear idea, just maybe"
      and "I don't know, to be honest."** The suspicion is that `flow` is a little overcomplicated. **Not
      about implementation** — not code quality, not file layout, not refactoring `lib/`. It is about the
      **logic and the flow**: how many concepts a user has to hold, how many commands and statuses there
      are, whether the rules the tool enforces earn what they cost to learn. Read as "is this design
      heavier than the job needs", never as "tidy the code". Nothing to open until the build is finished
- [ ] **How a growing collection of global scripts gets managed** (raised 2026-08-07). The set keeps growing
      and **most of it is not Flow-specific** — `gsave` is the model: a general-purpose command that merely
      happens to live in this repo. Needs a story for where general tools live, how they get registered, and
      whether Flow should own them at all. **Parked by the user: record it, do not open it yet**
- [ ] **Excalidraw — evaluate or drop.** Three third-party skills kept verbatim at `wip/excalidraw/` with a
      README comparing them: two create diagrams (one ships a Python renderer, one is guidance only), one
      solves reading `.excalidraw` files without burning context. `explain` currently bans SVG, mermaid and
      HTML-for-structure, but that ruling was made against SVG's measured cost (~10 min, ~80k tokens per
      diagram) and **never covered excalidraw**, which is a different mechanism. Needs its own verdict
- [ ] **Ecosystem branch #6 — the skill-creation trigger** (`design-skill-ecosystem.md`). #5 closed 2026-07-30
- [ ] **The review/finalize phase that triggers `organize`.** Partly answered by the ticket `review` status;
      the wiring was never designed
- [ ] **Revisit stack-skill recommendation at init** — the catalog holds eight process/domain skills and zero
      stack skills, which is why it was deferred
- [ ] **Audit** — checking current work against a skill's accumulated best practices. Parked as ecosystem
      issue #4; needs scoping to the skills the work actually touched, or it is unbounded reads
- [x] **Red-team / grill mode** — designed and built 2026-08-08 as **`commands/grill.md`**, typed `/grill`.
      A prompt template fired at the same agent for a second pass: restate the target as mechanism, run named
      cases through it *and* through its rivals (what exists today, the cheap patch, doing nothing), filter,
      report findings only. Ancestors read and mostly rejected — Matt Pocock's `grill-me` interviews the user,
      which is the opposite job; `doubt-driven-development`'s "strip your reasoning or you get back validation
      of your conclusions" is the one idea kept. **Two layers, not one** (the question this entry left open):
      the always-on half is `## Judgment` in both `CLAUDE.md` files, grill is the invoked half.
      ✅ `wip/context/threads.md` thread `judgment` settled all four — name, form, trigger and depth — on 2026-08-13.
      **`grill` no longer exists**, deleted 2026-08-11 into `brainstorm` Phase 3, so there is no invoked half left.
      `## Judgment` is the whole mechanism, and it carries its own depth gate.
      **Moved to `skills/grill/SKILL.md` on 2026-08-09** — a command is one-shot, and grill is a method that
      runs across a whole discussion. The text above is accurate for its own date; the file is no longer a
      command and is no longer typed with a slash.
- [ ] **Cold-reader `/grill`** — parked upgrade, the known weakness of the version built. Same context means
      the agent can walk the motions and pass itself; the filters push back, a reader that never saw the
      argument pushes harder. Later version hands the stripped mechanism + bar to subagents that never saw the
      conversation — one attacking the target, one walking the rivals *without ever seeing the target*, so it
      cannot defend either side. Blocked on the `extension-points` thread, and argue it against the
      1.1M-token subagent study case in `session-new-plugin.md` before building
- [ ] **Where the user's complaints get written down — one file will not hold it** (raised 2026-08-08).
      The standing decision was: whenever something in the workflow annoys the user, he tells the agent to
      write it into a **single running file**, and the batch gets tackled later. That breaks now that the
      **study-case treatment is wanted for the same material** — the offending output kept verbatim, the
      rule it broke named, the fix recorded, so it can be studied later
      (`wip/study-cases/bad-explanations/README.md` is the first one, written 2026-08-08 after a rejected
      explanation). A study case is long, structured, and read one at a time; a one-line annoyance is none
      of those. One file cannot serve both. Needs a shape: how many files, what splits them, what triggers
      a write, who prunes. **Raised by the user, deliberately deferred — discuss later, do not design it now**
      ⚠️ 2026-08-09: check this against the two confirmed rules in the first thread above before designing
      it. Agent-noticed faults in Flow are **not** part of this pile — they already have a home,
      `~/.claude/flow/notes.md`. What is left here is narrower than it looked: the user's own complaints, and
      how a long structured study case gets filed
      ✅ 2026-08-10: **the filing half is answered and built** — see the two entries below. What remains is
      only the user's own one-line complaints, and `## Capture` already routes those: irritation at a habit
      → `## Preferences`, friction with the workflow itself → `~/.claude/flow/notes.md`. Nothing open here
- [x] **`~/.claude/flow/` naming — DECIDED 2026-08-10 (user approved).** The repo is **never cloned into
      `~/.claude/flow/`**. That folder means exactly one thing: Flow's runtime folder — `refs/` and
      `toolbox/` symlinked in from the repo, `notes.md` and `study-cases/` as real data. The repo stays
      wherever the user cloned it (README default `~/code/flow`), and `setup-flow-globals` runs *from inside*
      the clone, so it never has to choose a location. The three-way collision existed only because the clone
      was going in there. `README.md` states it explicitly now
- [x] **`flow study-case …` — BUILT 2026-08-10, exercised end to end against a scratch `FLOW_HOME`.** Four
      subcommands: `study-case issues` (the index, read before every create), `study-case new` (writes path,
      date and frontmatter; body by hand or on stdin), `study-case ls`, `study-case fix <ref> --by <file>`.
      **Named `study-case`, not `case`** (user, 2026-08-10) — `case` alone says nothing in a list of
      commands, and the group is read in usage text far more often than it is typed. The scope question is
      settled: **`flow`'s promise is "commands take no path", not "flow is project-scoped"**, and
      `projectRoot()` is called per command inside `load()`, so a project-less group was a local addition.
      `FLOW_HOME` mirrors `FLOW_PROJECT` as the override. A standalone `case` command was impossible — it is
      a bash reserved word. **The issue folder is the whole mechanism**, so `--issue` is required, slugified
      rather than trusted, and a near-miss on an existing issue refuses with `--force` as the override;
      without that guard two spellings split the count and nothing errors. New: `lib/cases.js`,
      `templates/study-case.md`; `store.js` now exports `renderTemplate` alongside `slugify`, which are the
      only two things cases borrow. `global/CLAUDE.md` carries a one-line pointer only — the surface lives in
      `global/refs/study-cases.md`, which is read at exactly the moment a case is written. **`global/CLAUDE.md`
      names no study-case command at all** (user, 2026-08-10) — the `## Capture` route to that ref file is the
      whole pointer; the agent learns the commands when it goes to record one
- [x] **A placeholder comment is deleted at first use — DECIDED 2026-08-10 (user).** So it holds a shape and
      an example, never a rule. Both template placeholders had been carrying real rules: the calibration rule
      and "expertise is direction and review, not typing" in `## The user`, and the inference triggers in
      `## Preferences`. All of it was scheduled to vanish the moment a user filled those sections in. Moved
      into `## Explaining` and `## Capture`, which survive. Recorded in the root `CLAUDE.md` under
      `## Two versions of every global file`
- [x] **Two new hard rules in the root `CLAUDE.md` — 2026-08-10 (user asked for them).** *"Approval covers
      what was proposed, and nothing else"* and *"Flagging a deviation afterwards is not asking."* Four rules
      about approval were already loaded and none fired, because every one of them defines what a **yes** is
      or is not — none covered a genuine yes that is narrower than the message carrying it. A fifth
      restatement of "do not implement early" would have failed identically. Study case:
      `wip/study-cases/premature-implementation/2026-08-10-applied-unproposed-changes-on-a-partial-approval.md`,
      written with the new tool and closed against `CLAUDE.md`
- [x] **Ticket priority — BUILT 2026-08-11.** Reverses the recommendation given 2026-08-10, which was "not
      yet, deps already carry ordering". That argument holds **within** a branch and says nothing **between**
      them, which is the case the user named: two independent branches, both ready, nothing to separate them.
      The only way to express it before was a fake dep, which is a lie about the code *and* blocks the ticket
      — `start` refuses on an unsatisfied dep. A pin was offered as the simpler alternative and rejected on
      one ground: it has no downward direction, so it cannot say "real work, never show it to me at the top",
      which is half of what fifteen dictated tickets need. **Optional with a default is what killed the rot
      objection** — `high` and `low` are the only values on disk, `normal` is the absent field, and nothing
      stamps one at creation. Inheritance from the nearest ancestor, explicit always beating inherited, is
      what makes one command lift a whole feature. Never gates anything: `start` on a `low` ticket works
      exactly as before, and priority is orthogonal to `--type`. **Study cases get no priority** (settled,
      user agreed, closed) — a case is evidence rather than queued work, and `study-case issues` already
      ranks by frequency, which is counted rather than declared
- [x] **`flow next` stops listing containers, and `flow start` refuses on one — 2026-08-11.** A pre-existing
      fault found while walking the priority scenarios: `next` promised "workable now" and listed parents,
      and the guard against building a container existed only at `done`. So a parent could be offered, picked
      up and built, and the contradiction surfaced at the one moment it was too late. `readyTickets` and
      `blockedTickets` now exclude any ticket with a live child; a parent reappears if its last live child is
      dropped. `--force` overrides `start`, matching `done`
- [x] **`flow next` leads with in-flight work, capped at 10 — 2026-08-11.** It listed todos only, so a ticket
      you were in the middle of was invisible in the one place you looked before starting the next thing.
      `-n N` and `--all` adjust the cap, and the count held back always prints — a silent truncation is the
      only way a ceiling does harm. Ties inside a priority band stay oldest-first, so a ceiling pushes stale
      work up rather than burying it
- [x] **`flow tree` — BUILT 2026-08-11.** The `parent` field built a shape nothing rendered: `ls` is a flat
      table with a parent column, `show` is one ticket, `status` groups by status. **Ordering differs from
      `next` on purpose** — `next` is flat and priority is its only key, so a high child outranks its own
      parent; a tree cannot do that without lying about the shape, so nesting wins and priority orders
      siblings and roots only. Deps are not drawn — they cross the tree, so they surface as a note on the
      blocked ticket. Done and dropped collapse into the parent's count, `--all` includes them, `--parent`
      roots the tree at one ticket

---

## Deferred deliberately — no action, wait for real cases

- Whether a leaf ticket is always plannable in ~35 lines. A ticket spanning a migration plus a backfill plus
  UI probably isn't
- A **fifth ticket type** for document-producing work that is not research. Bar: *it must change what the
  ticket produces, or be a filter you would actually run.* Watch for "design X" tickets — designing is not
  researching
- Splitting `~/.claude/flow/notes.md` — allowed **by kind, never by project**, and only once one file hurts
- [x] **A one-line description at the top of any file, rendered by `ptree` beside the filename — BUILT
  2026-08-15.** `global/scripts/ptree.js` replaces `ptree.sh` and drops the `tree` dependency. One marker,
  `description:`, in a comment in any language or in markdown frontmatter; found anywhere in the first 50
  lines but only on a comment line, which is what keeps a SQL column of that name out. Multi-line reads to the
  paragraph break; display cuts to one sentence, then 60 characters. A folder describes itself in a `.info`
  file it carries, README as fallback. All three open questions closed: one reader covers every language, the
  two display cuts always apply, and the read costs 21 ms across 2,947 files — a cache was measured and
  rejected, since the freshness check alone costs 9 ms of that. Authoring rule in `global/CLAUDE.md`
  `## Hard rules`. **Strictly optional and never a migration** — most files need none.
- **Structured frontmatter for files other than tickets** (raised 2026-08-10, user unsure). Spec files are the
  likely first case — a status, maybe other metadata. Only an idea; no case has forced it yet
- **An interview at setup to fill `## The user`** (raised 2026-08-10, user unsure). `setup-flow-globals` could
  ask a few questions and write the section instead of leaving a placeholder. The gathering half is already
  built — `## Capture` now routes what the user knows or doesn't into `## The user`, so the section fills
  itself over time either way. Decide when the setup skill is written; an interview is a nice first fill,
  not a prerequisite
- **The git rule is a preference, not a hard rule** (user, 2026-08-10). "Never run or propose a git command
  that writes" sits in `## Hard rules` only because `## Preferences` is still an empty placeholder in the
  template. Move it there once that section carries real content

---

## Restructure of this file — decided 2026-08-07, not yet applied

`backlog.md` was **deleted 2026-08-07** (user-authorized). It was fully absorbed above.

Still to do to this file itself:

- **Move steps 4 and 5 out** to `wip/migration.md`. They cover migrating existing projects onto
  Flow, which happens after Flow is finished; this file is about finishing it
- **Two tiers — must and later.** Must = the workflow does not work without it. User's rulings 2026-08-07:
  **`debug` and `prototype` are both must**; **the telegraphic refactor pass is must** — without it the
  design is not in final shape; **`debug-web-pages` work is later**; **`testing` stays later**, leaning never
- **Cut the settled argument out of `[x]` items** — the reasoning behind decisions nobody will reopen
