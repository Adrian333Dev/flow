# Remaining — the whole build in one list

Master checklist for Flow v1. Ordered by **what blocks what**, not by size. Every item names where its
design already lives; **no pointer means the design does not exist yet** and deciding it is part of the item.

**Read `wip/handoff.md` first** — current state, machine state, and the next action. This file is what is
left to build; `session-new-plugin.md` is the historical log for why a decision was made.

Absorbs the old `backlog.md` in full — see the last section.

Legend: ⛔ blocks the items under it · ❓ needs a decision before it can be built · 🔁 rewrite of a file that exists

---

## Where it stands

The design is close to done. **Almost nothing is built.**

`flow/skills/` holds eight skills written against the **old** chain — `brainstorm.md → spec.md → plan.md`,
topic folders at `docs/work/topics/t<NN>-<slug>/`, milestones. The 2026-08-05 and 2026-08-06 sessions
replaced that chain with **topics → one flat ticket pool → a `## Plan` section inside the ticket**, and
added product mode on top. So the skills on disk describe a system that no longer exists. Four of the eight
(`brainstorm`, `execute`, `organize`, `handoff`) name paths and files that the design has deleted.

Nothing is symlinked into `~/.claude/` and nothing is installed — deliberate, until the skill set is final.

**The workbench repo is gone (2026-08-07).** `agentic-setup` *was* the previous workflow and it incubated
this one; it has been deleted outright, GitHub repo included, and `flow` is now the only repo. Everything
worth keeping was carried into **`wip/`** — this file, the resume file, the `design-*.md` record, the v1
archive, and the evidence behind the skills. `toolbox` came along as a submodule.

**`wip/` is scaffolding and gets deleted when the build is done.** Nothing in it installs anywhere and
nothing in it is part of the product. Never let a `wip/` path leak into a skill, into `global/`, or into
`project-template/`.

---

## ⏸ PARKED — "delete the topic; a ticket holds its own brainstorm" (2026-08-07)

**Status: fully explained to the user, deliberately NOT approved. Parked so other work goes first.**
Do not implement. Do not re-open unprompted. When it is re-opened, everything needed is below — the
conversation it came from is gone.

**Where the system stands today — three containers.** (1) `docs/brainstorm/`, the product brainstorm, one
per project, output `docs/spec/`. (2) `docs/topics/<slug>/`, a brainstorm about one subject — `topic.md` +
`brainstorm/`; thinking, never work; produces tickets, is never built. (3) `docs/tickets/tNNN-slug/`, one
unit of work — `ticket.md` + `handoff.md` + job briefs; gets built. **Brainstorms may live only in (1) and
(2). A ticket cannot hold one.**

**The problem the user raised, and it is real.** He states — and it is his work, so it is his call — that
**most tickets need a genuine brainstorm at pickup**, tree and all, and that **most of those do not split
into sub-tickets.** His example: a small isolated feature, minted during an earlier brainstorm with partial
detail; at pickup you think it through, lock the behaviors, build it. One ticket in, one ticket out. Today
that forces creating a topic — a container whose entire purpose is decomposition — for something that does
not decompose.

**The argument that actually decides it (user, and the agent had missed it):** *you cannot know at the start
of a brainstorm whether it will split.* Therefore no rule can make the brainstorm's **location** depend on
its **outcome**. Any "put it in the ticket, move it to a topic if it splits" scheme dies on the locked
invariant that a ticket's path never changes during its life (handoffs and job briefs sit in that folder).

**The proposal — two containers instead of three.**

```
docs/tickets/t047-daemon-detection/
  ticket.md          metadata + description + ## Plan
  brainstorm/        tree.md + a detail file per branch that grew.  ALWAYS here, never elsewhere
  handoff.md
  <slug>.md          job briefs
```

- `docs/topics/` deleted. `flow topic …` deleted.
- Frontmatter: **`topic:` → `parent:`** (the ticket this one was split out of; empty for most).
- **Statuses gain `parked`** — thought it through, deliberately not building it. Absorbs the one topic
  status with no ticket equivalent; `dropped` means abandoned, which is a different fact.
- A ticket with children is never built; the children are the work; it is done when they are.
- `docs/brainstorm/` (product) **unchanged** — it happens once, before any work item exists, and produces
  the spec. Two containers, split cleanly by altitude.
- Pickup becomes: `flow start t047` → does it already carry its decisions? *(rare)* plan and build →
  otherwise brainstorm it **in its own folder** → then either children fall out
  (`flow ticket new … --parent t047`, t047 stays `in-progress`) or they do not (write `## Plan`, build).
  Or `flow park t047`. **Nothing ever moves, either way.**

**Objections raised against it, and where each landed** (the agent argued this down twice before conceding;
keep the record so it is not re-argued from scratch):

1. *Topic and ticket statuses are incompatible — a topic has no `done` because "a topic is a document, not
   work".* **Resolved.** With one kind, `committed` is derivable (children exist), topic `in-progress` is
   the same word tickets use, and `parked` becomes a ticket status.
2. *`parent` was deliberately removed once.* **Resolved.** The stated reason was **redundancy with `topic`**
   — *"`topic` already groups, and the containment link is stored once on the topic side (`from:`)"*. Remove
   topics and the redundancy is gone. The separate cycle objection was aimed at collapsing parent *into*
   `deps`, which this does not do.
3. *Product mode does not collapse — `docs/brainstorm/` can never be a ticket, so you end with two concepts,
   not one.* **True, and accepted as fine.** An honest split by altitude with no overlap, and simpler than
   today's three where two of them (topic, parent ticket) do the same job. The user's instinct that product
   mode needs its own container was right; the inference that it therefore needs topics too was not.
4. *Hierarchy was rejected on evidence* — delapse's `e1-web-app/` + `s01-*.md` + `t14-*.md` mixture the user
   could not parse. **Survives but does not bite:** `docs/tickets/` stays flat, the link is frontmatter, and
   `flow` renders the tree on demand.
5. *The merge is not needed to fix the case — one folder would do.* **Overtaken.** Killing the ticket→topic
   conversion leaves topics with no birth mechanism in the loop (the only other entry, "a subject with no
   ticket yet", is already served by `flow ticket new` + brainstorm), so they wither. Half-keeping them is
   worse than either alternative.

**The one real loss.** Topic frontmatter had **`from: [t014, t018]` as an array** — several tickets feeding
one design session, for when two open questions are really one design problem. A ticket has exactly one
`parent`, so that goes. Workaround: mint one ticket owning the combined question with `deps` on both —
clumsier, and a genuine trade.

**Cost if approved.** `flow` (~950 lines): strip topic commands, add `--parent` / `--under` / `park`; touches
`store.js`, `graph.js`, `render.js` and the surface. Then a sweep of `global/CLAUDE.md`, this file,
`design-brainstorm-rework.md`, and the `brainstorm` skill. **Cheaper before 2c–2g than after** — four skills
are about to be written against whichever shape wins.

**Open sub-question, unanswered:** when the last child of a parent finishes, does `flow` mark the parent
`done` automatically, or refuse `flow done` on a parent with open children and leave the call to the user?
Agent leans the second.

**Knock-on if it is approved:** `global/CLAUDE.md`'s `## Workflow` currently carries a **two-outcome** pickup
ladder (plan it, or open a topic) written 2026-08-07 against the *existing* design. It gets replaced.

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
      *not* PATH commands (`guard.js`, referenced by `settings.json`'s hook, and `link-skills.sh`).
      Aliases stay rejected: bash does not expand them in non-interactive shells, so the agent could not
      call them. **`setup-flow-globals` (build step 3) must create all four `~/.local/bin` links plus the
      `~/.claude/scripts` folder link** — they exist on this machine already, but a new machine has none.
      Written into `flow/README.md`'s manual setup block in the meantime
- [x] **Final names, 2026-08-07** — typed as `ptree`, `fmerge`, `gsave`, `flow`. Bare `merge` and `save`
      collide with what those words already mean around git, so the one-letter prefix says which noun the
      command operates on — **f**ile merge, **g**it save
- [x] **Extensions stay on every file; the symlink drops them** (user, 2026-08-07, reversing the same
      morning's call to strip them). `ptree.sh`, `fmerge.js`, `gsave.sh`, `guard.js`, `link-skills.sh`,
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
- [x] **`~/.claude/scripts` folder symlink created 2026-08-07**, so `guard.js` and `link-skills.sh` are
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

### 2c — 🔁 `brainstorm/SKILL.md`

The engine survives ("brainstorm's core is not up for rewrite — the failure was at the seam"), but every
path, the tree notation and the whole close phase change.

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

### 2d — 🔁 the product-mode conversion sub-file

Replaces `write-spec.md`. It is about **the conversion**, not about brainstorming.

- [ ] ❓ Name it — `write-spec.md` still fits since it writes `docs/spec/`, but it also mints tickets. One
      sub-file or two
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

### 2e — 🔁 `write-plan.md` → the ticket's `## Plan` section

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

### 2f — 🔁 `execute/SKILL.md`

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

- [ ] `organize/SKILL.md` — "route decisions to the topic's `spec.md`" (topics have no spec.md now); "skills
      mean the ones under `.claude/skills/`" (skills are global-only since #H1)
- [ ] 🔁 `handoff/SKILL.md` — **needs a new resolution ladder, not a path fix.** It currently knows two
      locations (`docs/work/topics/t<NN>-<slug>/handoff.md`, else `docs/work/handoff.md`); both paths are
      dead, and the user raised 2026-08-06 that **a handoff is needed per ticket too** — mid-implementation
      is exactly when a session runs out. Product brainstorms need one as well: they are multi-session by
      default, and that is what replaced real-aloud's 75-line resume blob.
      Proposed ladder, most specific wins:

      | when | where |
      |---|---|
      | implementing a ticket | `docs/tickets/t047-slug/handoff.md` |
      | a topic is active | `docs/topics/<slug>/handoff.md` |
      | the product brainstorm is active | `docs/brainstorm/handoff.md` |
      | none of the above | `docs/handoff.md` |

- [ ] **A resume handoff and a job brief are different things — the skill already says so, and tickets give
      the second one a home.** `handoff/SKILL.md` today: the default is *resume the same work*, overwritten,
      one per context; naming a different job outright ("debug this", "investigate in parallel") makes it a
      **brief** for that job, written as its own file so it cannot clobber the resume. Several briefs can be
      live at once; there is only ever one resume. With folder-per-ticket both land inside the ticket folder:
      `handoff.md` for the resume, `<slug>.md` per brief. Raised by the user 2026-08-06 as the case a single
      file could not serve — correct, and this is the case that earns the folder
- [ ] **Dispatching a subagent is an execution choice; minting a ticket is a recording choice. They are
      independent** (locked 2026-08-06). A tricky bug found while implementing t047 does **not** become a
      ticket merely because you want a separate session on it — write a brief and dispatch. It becomes a
      ticket only under the existing mid-build-discovery rule, when the work turns out to be genuinely
      separable. Otherwise it is churn: an id, a status, a deps entry, `done` twenty minutes later
- [ ] The debugging brief is what the unbuilt `debug` skill consumes — design the two together
- [ ] ~~Milestone-level handoff path~~ — **dissolved.** Milestones no longer exist; tickets replaced them

### 2j — `flow/project-template/` — **DONE 2026-08-07**

- [x] **`docs/work/` deleted from the template** (user-authorized delete). It shipped an empty
      `backlog.md`, which the 2h decision killed. The template is now **two files** — `CLAUDE.md`
      (`## Project` + `## Project rules`) and `.gitignore` (`tmp/`) — and nothing else: every `docs/` path
      is created on first write by whatever needs it, so a new project starts with two files rather than a
      tree of empty scaffolding
- [x] `flow/CLAUDE.md` layout table and `flow/README.md`'s "Starting a new project" both updated to match

---

## Step 3 — `setup-flow-globals` (new skill)

Once per machine. Design: `design-init-flow.md` #G7.

- [ ] Copies `global/CLAUDE.md` → `~/.claude/CLAUDE.md`, merges `global/settings.json` into
      `~/.claude/settings.json` (this is what installs the `guard.js` hook — a fresh machine has no `hooks`
      key at all), runs `link-skills.sh`
- [ ] **Three symlink jobs, all of them:** the folder link `~/.claude/scripts` → `global/scripts/`, for files
      named by path · the four `~/.local/bin` per-file links that drop the extension (`ptree`, `fmerge`,
      `gsave`, `flow`) · **`~/.claude/toolbox` → the `toolbox/` submodule**, which is the path
      `global/CLAUDE.md` names for the tool catalog. Miss the last one and every external-tool lookup breaks
- [ ] **Creates `~/.claude/flow/` and never writes inside it.** `notes.md` there belongs to the user, not the
      template — silent and unrecoverable if it is overwritten
- [ ] Interviews once for `## The user` and `## Preferences`. **Source material is `wip/user-profile.md`**,
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

- [ ] **`debug` — the general systematic-debugging skill. Never designed, never built.** Raised again by
      the user 2026-08-06 and missing from the first version of this list. It was named as a needed skill
      back in the original problem inventory, and its core principle already shipped as a hard rule in
      `global/CLAUDE.md` (*"No cause without evidence. Hypothesis: X. To verify: Y."*) — but the rule is one
      line and the skill is the loop around it. Highest-value item in this group: it fires on every project,
      every stack, constantly.
      **Design it against `debug-web-pages` and against `reference/superpowers/skills/systematic-debugging`.**
      The disjointness rule applies to skills too — the general skill owns the *method*, the domain skill
      owns browser specifics. Today `debug-web-pages` is the only debugging skill Flow has and it silently
      stands in for a general one it was never scoped to be
- [ ] **`prototype` — brainstorm it before building it.** Product mode leans on it for three jobs
      (feasibility spikes, UI mockups, proof-of-concept builds) and what the skill *is* has never been
      decided. Un-parked 2026-08-06
- [x] ~~**A router skill, in the shape of `ask-matt`.**~~ **Dropped 2026-08-07 (user).** It exists to
      orient *newcomers*, and there are none — one user, who is building the thing. If Flow is ever opened
      up, the narrative it would carry (main flow, on-ramps, what is standalone, how work crosses sessions)
      goes in `README.md` or a guide file, which is cheaper and cannot go stale in context. Not a skill
- [ ] **`testing` — decide, leaning no.** Stack-specific testing knowledge belongs in that stack's skill;
      project-specific conventions belong in `docs/context/`
- [ ] 🔁 **`explain`'s mockup output is weak** (user's verdict). The ASCII/structural side works; the mockup
      side needs its own pass
- [ ] 🔁 **Telegraphic refactor pass** over `brainstorm`, `research`, `execute`, `debug-web-pages`
- [ ] `debug-web-pages` is prototype-adjacent but narrow — revisit alongside the `prototype` brainstorm

---

## Hooks

- [ ] **`PreCompact` hook** — block-once state file, so auto-compaction gives way to `handoff`
- [ ] **Context-pulse hook** — inject remaining-context info so the agent can trigger `handoff` itself.
      The agent can often judge this unaided; the hook makes it reliable

---

## Housekeeping

- [ ] **Link the skills globally** once the set is final: `bash global/scripts/link-skills.sh` from the repo
      root. Not before — nothing loads until then, and that is deliberate. As of 2026-08-07 `~/.claude/skills/`
      holds only three unrelated folders from May; no Flow skill is installed anywhere
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

- [ ] **Skills vs. agents vs. commands — never actually decided** (raised 2026-08-07). Claude Code offers
      three extension points and Flow reflexively puts everything in skills. Worth deciding deliberately
      which of the three each capability belongs to, and whether anything now a skill should move.
      **Un-parked by the user 2026-08-08 — moved to `wip/threads.md`, thread `extension-points`**, which
      carries the full statement and is the active thread
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
- [ ] **Red-team / grill mode** — an adversarial pass that attacks a design before it locks. Captured
      2026-07-23, never designed. Ancestor: delapse's `grill-me` / `grill-with-docs`.
      **Overlaps `wip/threads.md`, thread `judgment`**, which is the always-on version covering every
      proposal in every phase; decide there whether it absorbs this one or they stay two things

---

## Deferred deliberately — no action, wait for real cases

- Whether a leaf ticket is always plannable in ~35 lines. A ticket spanning a migration plus a backfill plus
  UI probably isn't
- A **fifth ticket type** for document-producing work that is not research. Bar: *it must change what the
  ticket produces, or be a filter you would actually run.* Watch for "design X" tickets — designing is not
  researching
- Splitting `~/.claude/flow/notes.md` — allowed **by kind, never by project**, and only once one file hurts

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
