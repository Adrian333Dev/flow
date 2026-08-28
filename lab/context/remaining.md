# Remaining — the two locked decisions

Two decisions the user approved in conversation, the first on 2026-08-08 and the second on 2026-08-09.
Both are built. This file is the only record of the arguments behind them, so both sections stand exactly
as they were written.

**Everything else in this file went on 2026-08-28** — 868 lines of build steps for skills that were never
built under those names, and design threads that have all since closed. Git holds them.

Open work lives in `backlog.md`, at the repo root. This file is not a work list.

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
- [x] **`home/CLAUDE.md` — BUILT 2026-08-09.** See the 2026-08-09 build-cost section below; both sections'
  changes to this file landed in one pass.
- **The `brainstorm` rework record**, deleted 2026-08-28, **and the `brainstorm` skill** — both written
  against topics.
- The 5 skill rewrites were blocked on this call. **They are unblocked now**, and every one of them gets
  written against the shape above. All 5 landed 2026-08-09.

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
  directory's own `CLAUDE.md` (that directory only) wins. Stated **once** in `home/CLAUDE.md`; no
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

**Say "create", never "mint".** The word is all over this file and `home/CLAUDE.md`; it was never shared
with the user and reading it back to them failed outright (2026-08-09, recorded in
`lab/study-cases/bad-explanations/`). A word appearing in Flow's own files is not thereby a word the user
knows. The sweep of the existing design record ran with the rest of the build.

### Build cost

- [x] **`home/CLAUDE.md` — BUILT 2026-08-09.** `docs/topics/` row deleted, `docs/brainstorm/` replaced by
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
  names both shapes. `## Capture` in `home/CLAUDE.md` routes code rules to `## Project rules` **or**
  `## Rules`, so the two templates stay consistent.
- **The `brainstorm` skill**, since renamed `groundwork` — every topic path, plus the two modes, the three
  endings, the reference-earlier-brainstorms move, and where the folder may sit.
- **`flow`** — unaffected by this section. It never knew about brainstorms.
