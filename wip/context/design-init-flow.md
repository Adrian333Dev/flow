# Design — `init-flow` (front door) + the project doc set

_Started 2026-07-29. Supersedes the front-half of `design-project-genesis.md`. Continues the deliberation-cost thread from `design-explain-rework.md` and `design-capture-rework.md`._

`project-init` was one name over two jobs. This thread splits them, names the front door, and settles what documentation a Flow project actually carries.

> **⚠ READ THE TWO SESSION SECTIONS AT THE END OF THIS FILE FIRST — `## SESSION 2026-08-02 — Flow goes global`, then `## SESSION 2026-08-03 — one repo`.** The 08-03 session merged `flow-skills` into `flow`, dropped the template-repo/CLI machinery, and marks build step 1 as **built**; it supersedes parts of 08-02 in turn.
>
> **⚠ `## SESSION 2026-08-02 — Flow goes global` SUPERSEDES ANYTHING BELOW.** That session inverted the arc, relocated most of `flow/CLAUDE.md` to `~/.claude/`, collapsed the payload to two files, and renamed the skill. #3, #9, #11, #13 and the whole one-flow-for-every-start framing are superseded there. Decisions below that still stand are listed at the top of that section.

---

## Standing principle — the only user is the author

Flow is built for one person, who will hit every scenario himself. Nothing is designed for strangers: no release discipline, no guarantees for repo shapes he doesn't own, no mechanism whose only job is to protect a downstream consumer. Same trigger as `design-skill-ecosystem.md` #4.6 — pay that tax when strangers install, not before.

Applies retroactively. Any decision here that only earns its keep with a third-party audience gets demoted, not kept just in case.

---

## LOCKED decisions

### #1 — `project-init` splits; the deliberative half leaves

`project-init`'s five phases (Assess intake → Walk gaps → Propose spec structure → Write spec → Derive scaffold) are two different things wearing one name:

- **A–D** is a multi-session, research-driven branch walk that produces the whole product foundation. That is `brainstorm`'s full-product mode, already under design in `design-brainstorm-rework.md`. It moves there.
- **What's left** is the front door: land Flow in this repo, fill what can be filled, wire skills, point at the next move.

Same cut as the last three threads — cheap/mechanical vs expensive/deliberative. Assessing pasted material is a judgment call, so it goes with the deliberative half; product mode opens by asking whether there's material to assess, which is the "single adaptive flow" of genesis #5 relocated to the right skill.

Kills `design-brainstorm-rework.md` #D (overlap with project-init) and genesis #6 (skill topology).

### #1b — `docs/work/consolidation.md` is dissolved

It existed only because `project-init` was a separate skill needing its own working memory. Genesis #3.4 says outright that it "IS the project-altitude `brainstorm.md`" — one artifact under two names, which is why the user couldn't say what it was for.

Product-mode brainstorm writes at project altitude, not under `topics/` — it isn't a topic. Its "you are here" status header is separately dead: `handoff` owns resume state since `now.md` was killed, and the brainstorm rework already lists "delete the resume pointer" as a fix.

**SUPERSEDED 2026-08-06 on the path only** — it is `docs/brainstorm/` (a folder: `tree.md` always whole, plus a detail file per branch that actually grew), **not** `docs/work/brainstorm.md`. See `design-brainstorm-rework.md` `## SESSION 2026-08-06`.

The user's second concern — one file will not hold a product brainstorm — was correct and is now resolved by that folder split.

### #2 — Name: `init-flow`

Verb-first per catalog convention. Avoids Claude Code's built-in `/init`. Names the actual job — initialize Flow in this repo, not initialize a project. It never decides what the product is.

Re-runnable: the same skill updates an existing Flow project to a newer template version (see #7).

### #3 — `flow/CLAUDE.md` stays ONE file — split REJECTED

Proposed and rejected same session. The proposal was to move the workflow half (`## Explaining`, `## Communication`, `## Capture`, `## Workflow`, `## Scripts`, `## Hard rules`) into an `@`-imported file, leaving the project half in CLAUDE.md.

Three reasons it fails:

- **It violates the principle the last three threads established.** Never put an always-needed rule behind a mechanism that can fail to fire. An `@` import is exactly that, and it fails *silently*.
- **It doesn't solve migration.** The migration hazard is contradiction, not volume. Two files that contradict each other are worse than one file that does — in one file the conflict is visible and adjacent.
- **The two-lifecycles framing was wrong** (user). The project half starts as placeholders and fills over the whole life of the project via `## Capture`. That's one file with one lifecycle, not two glued together.

The update-path argument was real but small, and is solved by making `init-flow` re-runnable (#7), not by file layout.

### #4 — Migration is CONVERSION, not merge

Corrected by the user. Flow **replaces** the user's existing workflow; it does not negotiate with it. Adopting an opinionated workflow means accepting its opinions. Their `ls` rule loses to `tree.sh`, outright.

What migration does:

- **Harvest content, discard process.** Their instruction file is *source material*. Facts about the project (stack, structure, rules about the code, verified commands, hard-won gotchas) get routed into Flow's structure. Their process instructions — session-start rituals, their own doc-reading order, their skill overrides — are dropped; Flow supplies its own.
- **Harvest lands in `CLAUDE.md` and `docs/context/` only — never `docs/spec/`** (see #12; supersedes the "most of it lands in `docs/spec/`" line written here first, which contradicted the intake bullet below).
- **Their existing docs are intake.** Quarantined into `docs/intake/` per #10, origin recorded. `init-flow` never turns them into a spec — that's a later run of `brainstorm`'s full-product mode, offered and declinable.
- **`.claude/settings.json` is quarantined like everything else** (#10, which supersedes the merge-additively call made here first). Flow writes its own; specific facts are harvested back from the quarantined copy, their process is dropped — same rule as the docs.

### #5 — Blocking git mutations is a Flow default, not a personal preference

Corrected by the user. An agent that can commit and push autonomously has an unbounded blast radius. Flow ships the deny list. Anyone who wants it gone removes it.

### #6 — Borrowing from `reference/mattpocock-skills` requires re-derivation

Standing rule for this thread. His skills assume an issue tracker, GitHub, PRs, and a team-shaped review loop. Flow assumes files on disk and one author. Anything of his that routes through the tracker does not transfer as-is — only the underlying idea transfers, and it has to be rebuilt against files. Never adopt a rule of his together with the environment assumption that made it work.

### #6b — `brainstorm`'s core is not up for rewrite

User: the skill "was decent, it wasn't bad, it worked well — results were always satisfying." Reconsider before rewriting anything there. Consistent with `design-brainstorm-rework.md`'s own "Do not touch" list (branch tree, one-branch-at-a-time, agent-proposes-first, Decision/Reasoning/Rejected sections). The failure that opened that thread was at the **seam** — 1069-line brainstorm producing a 309-line spec that dropped the business model and phases 2–3 — not in the walking.

### #7 — Template changelog — DEMOTED by the standing principle

Was: `flow/` carries a template-level `CHANGELOG.md`, and `init-flow`'s re-run reads entries forward from the version the project stamped instead of diffing two CLAUDE.mds.

With one user, `git log` on `flow/` **is** the changelog and he already knows what changed. The re-run doesn't need a written history to be cheap — it refetches `flow/` and reconciles against what's on disk. Revisit when strangers install (`design-skill-ecosystem.md` #4.6, same trigger).

### #8 — `prototype` — PARKED

Investigated `reference/mattpocock-skills/skills/engineering/prototype/`. It answers two questions with throwaway code: "does this state model feel right" (tiny interactive terminal app) and "what should this look like" (several UI variants on one route, switchable by URL param).

Parked because the user's actual need is different: **technical feasibility spikes** — stand up a local model, wire the tools, find out if the thing is possible at all (read-aloud case). That is not what `prototype` does, and Flow already has a designed answer (genesis #3.2.b: code-only unknowns become a flagged first spike in the backlog). Whether that deferral is right is a `brainstorm`-thread question.

Also noted: `explain` partly covers the UI branch already, though **its mockup output is minimal and not good** (user) — separate improvement, recorded in Parked below.

### #9 — Payload delivery: fetch at run time, never bundle

`init-flow` does not carry the template files. It **fetches `flow/` at run time** — shallow clone into `tmp/`, copy the payload out, discard the clone. One source of truth; no copy inside the skill to drift from the template repo.

**Bundling the payload into the skill folder is rejected** — it duplicates `flow/` inside `flow-skills/`, and the two diverge the first time either is touched.

Consequence: *Use this template* stops being the door. Every path — empty repo, existing codebase, repo already on Flow — is the same two steps: `npx skills add`, then run `init-flow`.

Link-never-hard-copy (`design-skill-ecosystem.md` #4.4) does **not** apply here. That rule exists so `git pull` propagates *skill* updates; payload files are edited per project, so they are always real copies.

### #10 — Conflicting paths are quarantined, not merged

Before writing anything, `init-flow` **moves the user's existing material that collides with Flow's structure into `docs/intake/`**, lays Flow's layout down on the cleared slate, then works from the quarantined copy for the rest of the run.

Why: the payload write never negotiates with what's already there. No per-file merge logic, no half-Flow layouts, no ambiguity about which version of a path is live. It also makes #4's "their existing docs are intake" literal rather than notional — the harvest reads `docs/intake/`, and a later product-brainstorm run consolidates from the same place.

`docs/intake/` and **not** a gitignored scratch path: moving tracked files into an ignored folder removes them from the repo, which is a silent delete. Intake is git-tracked, reviewable, and already designed for this (genesis #2 — originals preserved, never overwritten).

Nothing is deleted. Origins are recorded and the move is reported.

**No exceptions — `.claude/settings.json` is quarantined too.** Merging it additively was the one carve-out and it was wrong (user): the file carries hooks, MCP servers, env, statusline and model config, not just an allow/deny list, so merging means negotiating with arbitrary foreign config — the exact thing this decision removes. Flow writes its own, then harvests specific keys back: their MCP servers and permission entries for their own tooling are **facts** and carry over; their hooks are **process** and get dropped, because Flow ships its own (#4).

**`.claude/settings.local.json` is not touched.** It is gitignored personal state — moving it into a tracked `docs/intake/` would commit machine-local config. Left in place, but read once and reported if it overrides a Flow key, since a local permission entry can silently undo the git deny list of #5.

Settings take effect next session, not this one — Claude Code loads them at startup — so `init-flow` closes by telling the user to restart.

**`.gitignore` is the one true exception — it appends, never replaces, never quarantines.** Flow's is a single line (`tmp/`). Theirs holds `node_modules/`, `dist/`, `.env`. Quarantining it and writing Flow's would start tracking all of it on the next commit — an instant, destructive change to their repo. So: append `tmp/` if absent, touch nothing else.

### #11 — What the payload actually is

`flow/` holds nine files. Six ship into a project, two never do, one appends.

**Ships:** `CLAUDE.md`, `.claude/settings.json`, `scripts/tree.sh`, `scripts/merge-files.js`, `scripts/check-skills.sh`, `docs/work/backlog.md` (empty scaffold).

**Appends:** `.gitignore` — the `tmp/` line only (#10).

**Never ships — template-repo-only:**

- **`README.md`** describes the template *to someone evaluating it* ("A Claude Code project template for solo developers… What ships…"). Copying it into a project overwrites that project's own README with a description of Flow.
- **`recommended-tools.md`** is a catalog of optional external tools — advice to the human, identical in every project, and it goes stale on its own schedule. Shipping a copy into every repo means N copies rotting independently. It stays in the template repo and is read there.

Nothing else in `docs/` is scaffolded. `docs/context/`, `docs/intake/`, `docs/research/`, `docs/spec/` and `docs/work/inbox.md` are all created on first write by whatever needs them — empty folders teach nothing and invite filler.

### #12 — The harvest boundary: `CLAUDE.md` and `docs/context/`, never `docs/spec/`

#4 originally said both "most harvested material lands in `docs/spec/`" and "`init-flow` never consolidates their docs." Those contradict — writing `docs/spec/` *from* their docs **is** consolidation. Resolved by the same deliberation-cost cut that split the skill:

**Cheap and mechanical → `init-flow` does it.** A rule about the code is a sentence you can lift. A verified command is a string you can lift. Both are checkable one item at a time.

**Expensive and judgment-bound → product-mode brainstorm does it.** Synthesizing `docs/spec/` means reading everything, reconciling contradictions between documents written months apart, and deciding what the product actually is now. That is the multi-session work that left with phases A–D.

There's a second reason beyond cost: `docs/spec/` is the foundation `CLAUDE.md` and `backlog.md` derive from (genesis core insight). A half-harvested spec is worse than no spec, because the derivation would then run on a foundation nobody validated.

**So the harvest has exactly three destinations:**

| Harvested | Goes to |
|---|---|
| Rules about the code that conventions don't imply | `CLAUDE.md` `## Project rules` |
| Verified commands (existing repo only — greenfield has none yet) | `docs/context/commands.md` |
| Other durable project facts passing #A's four rules | `docs/context/<subject>.md` |

Everything else stays in `docs/intake/`, untouched, waiting for a later run of `brainstorm`'s full-product mode to read it — if the user wants one.

**Vocabulary (stop using the shorthand).** *Harvest* = read their existing files and lift out the individual facts worth keeping, discarding the rest — copying sentences, not moving files. *Consolidation* (genesis's old internal name for phases A–D) = read everything the user has, find what's missing, research it, and write one clean foundation in `docs/spec/`. That work now belongs to `brainstorm`'s full-product mode; say that instead.

**Knock-on — closes the capture thread's parked question.** `init-flow` never creates `docs/spec/`, so `docs/spec/decisions.md` does **not** exist after init. `flow/CLAUDE.md` `## Capture` already says "or `docs/spec/decisions.md` **where that exists**" — already correct, no edit needed.

### #13 — The re-run reconcile: `CLAUDE.md` splits on its `---` divider

Decided while building, not during the walk. #2 made `init-flow` re-runnable and #7 removed the changelog it was going to read, so the update path needed a rule for what a refetch is allowed to overwrite. `flow/CLAUDE.md` already answers it structurally — a `---` on line 28 separates the project half from the workflow half, and ownership follows that line exactly.

**Above the divider is project-owned and never touched** — `## Project`, `## The user`, `## Preferences`, `## Project rules`. These are filled per project and grow over the project's life (#3's "one file, one lifecycle").

**Below the divider is template-owned and replaced wholesale** — `## Key docs`, `## Workflow`, `## Scripts`, `## Explaining`, `## Communication`, `## Capture`, `## Hard rules`. Identical in every project by construction; a per-project edit there is a template change that hasn't been made yet.

Rest of the payload: `scripts/*` overwritten (template-owned, never edited locally), `.claude/settings.json` merged forward (add new template keys, keep project additions, report disagreements), `docs/work/backlog.md` never touched (it has content), `.gitignore` appended per #10. The below-divider diff is shown before it is applied.

No quarantine, no `docs/intake/`, no interview on this path — the repo is already Flow-shaped.

---

## OPEN

### #A — The project doc set — ACCEPTED

Sorting the two reference projects into Flow's shape (evidence below) leaves exactly one gap: **project-specific durable knowledge that is neither a rule, nor a decision, nor a skill.** `commands.md`, `setup-notes.md`, `lessons-learned/`, `caching-improvements.md`, the dated debugging writeups. delapse's `setup-notes.md` names the category itself: *"a reference, not a directive — things that were done once, not rules to follow on every file."*

**Proposal: `docs/context/`.** One folder, one file per subject, created on demand. `commands.md` from day one; everything else as the project accumulates it. Four rules, aimed at the observed failure mode (bloat, not absence):

1. **Every file answers one question: what would a fresh session get wrong without this?** That's the entry test, and the one `commands.md` failed in delapse (98 lines, user's verdict: bloated).
2. **Facts, not process.** Process is a skill. A context file describing *how to work* is content in the wrong repo.
3. **Verified only.** delapse's `commands.md` carries `# unverified` on six entries. An unverified command is worse than none — the agent runs it, it fails, and the read plus the failure are both wasted.
4. **Rewrite on change, never append.** Git holds the old text.

Routing already exists: `## Capture`'s inbox catches this class ("reusable knowledge needing an altitude call"), and `organize` files it. Today `organize`'s only destinations are a catalog skill or a `needs skill:` flag — `docs/context/` is the third destination it has been missing, for knowledge that is project-specific rather than cross-project.

**Knock-on: this unblocks the key-docs table** stranded in `design-explain-rework.md`. It should list only *stable* paths — `docs/spec/`, `docs/work/backlog.md`, `docs/context/`, `docs/research/` — plus one line on what lives in `context/`. Never per-file: a table needing an update whenever a context file appears will lie within a month.

### #A2 — Skill vs project-context: the routing test — ACCEPTED

The hard part, and the user's own words: *"some of the content is quite tricky… you're really not sure, is it going to go to the project context files or to a skill; there is stuff that's in between as well."*

**The test: would this sentence be true in a different project?**

- **Yes → skill.** `model-notes.md` (267 lines on Vertex thinking-mode latency, Flash-Lite token profiles, provider rate limits) is the clean example — it reads as project docs but is really portable knowledge about building LLM pipelines. User's correction, and it was wrong to group it with `commands.md`.
- **No → `docs/context/`.** "Verification order is check-types → lint → vitest → build." "Supabase types generate to `packages/contracts/src/supabase/database.types.ts`."

**In-between content splits; it doesn't get assigned.** `never-edit-database-types-manually.md` is both: the principle (generated files are never hand-edited — regenerate) is portable and belongs in a Supabase skill; the specifics (this repo's script name and output path) are local and belong in context. Route each half.

**When you genuinely can't tell, don't force it — that's what the inbox is for.** It stays raw until `organize` / `curate-skills` has enough instances to see the pattern.

**`setup-notes.md` is the pipeline, not a destination** (user). It existed because v1 had no skills. In Flow, that content flows: inbox or project files → `curate-skills` → an actual skill. The file disappears; the flow through it is the point.

### #B — Status/query mechanism — PROPOSAL

Frontmatter on topic files plus a script, not a hand-maintained table. lumacraft's `now.md` had a good 12-row milestone status table — and `now.md` is exactly the file killed for being a maintenance tax. Derived state can't drift:

```yaml
---
status: active        # active | done | blocked | parked
title: Brief agent direct-edit model
blocked-by: gate-a-approval
---
```

`scripts/status.sh` sweeps `docs/work/topics/*/` and prints the table — one cheap call instead of N reads, the same trade `tree.sh` and `merge-files.js` already make. Build item, not a design question; settle once the topic folder structure is final.

### #C — `init-flow`'s job list — BUILT 2026-07-31, REJECTED (now `new-workflow/rejected-init-flow/SKILL.md`)

The fork question is answered: #9 makes delivery one path, #10 makes the payload write always land on a clean slate. One flow; the only conditional part is harvesting *their* content, which no-ops on an empty repo. #11 fixes what the payload is, #12 fixes where the harvest goes. Nothing in this branch is open.

Ordered shape so far — quarantine conflicts (#10) → write the payload (#9) → verify skills are reachable and print the install command if not → fill `## The user` (one interview round; the only CLAUDE.md section knowable at init on either path) → harvest from `docs/intake/` per #4 → tell the user to restart, then point at the next move — either way that is `brainstorm`'s full-product mode, offered and declinable; on an existing repo it reads `docs/intake/` first.

`## Project` is **not** filled here. Genesis #4 makes CLAUDE.md derived from a finished `docs/spec/`, and no spec exists at init on either path. On an existing repo, stack and structure are *inferable* and get filled; the rest stays placeholder until product mode closes.

The skill step is a **check, never an install** — `design-skill-ecosystem.md` #5, closed 2026-07-30. Skills are globally symlinked on the author's machine, so they're already present; Flow's hard rules forbid running install commands; and the recommender that branch was named for has an empty candidate set until the catalog holds stack skills.

### #D — Template version stamp — CLOSED, no stamp

It existed only to tell the re-run which changelog entries to read forward from. #7 is demoted, so the stamp has no reader. The re-run fetches current `flow/` and reconciles against what's on disk. Add a stamp if and when a changelog exists to point into.

### Closed while surveying

- **Script documentation in `CLAUDE.md` is already complete.** Checked `## Scripts` against both script headers: `--depth`, `--except` (repeatable; name/folder/glob), the default ignore list, `--ext`, `--force`, the `file.md:45-89` range syntax, folder recursion, fenced-per-file output, and the 2000-line cutoff are all there. An agent can run both without opening them. Only `check-skills.sh` is unmentioned, which is correct — it's a SessionStart hook, never invoked by hand.

---

## Evidence — two real projects (2026-07-29 survey)

`tmp/local-refs/delapse/docs` (36 files) and `tmp/local-refs/lumacraft_v2/docs` (41 files). Both v1-era, slightly different workflows. Sorted by *kind of content*:

| Kind | Files seen | Where it goes in Flow |
|---|---|---|
| Process instructions to the agent | `workflow-rules.md` (239), `planning.md`, `milestones.md`, `research.md`, `testing.md`, `superpowers-overrides.md`, `prompt-engineering-process.md` | **Deleted.** This category *is* the skills. It only existed because v1 had no skills. |
| Generic stack conventions | `conventions.md` (280 in delapse, 59 in lumacraft) | Mostly **catalog skills** (stack knowledge). The project-specific residue → `## Project rules`. |
| Rules genuinely about this codebase | delapse `CLAUDE.md` `## Project-specific rules` (15 bullets) | `## Project rules` — already correct. |
| Operating facts | `commands.md` (98 / 36), verification order | **Gap.** |
| Learned project knowledge | `model-notes.md` (267), `setup-notes.md`, `lessons-learned/` (8 files), `notes/caching-improvements.md` (375), `debugging/<date>-*.md` | **Gap.** |
| Foundation | `spec/` (7 files / 12 files, 3400 lines) | `docs/spec/` — designed. |
| Working state | `now.md`, `roadmap.md`, `backlog.md`, topic folders | Designed (`now.md` and `roadmap.md` both killed). |
| Vendored external docs | `references/`, `llms/` (llms-full.md dumps) | `tmp/` — refetchable. Non-refetchable prior-project notes → learned knowledge. |

**Two observations that matter more than the inventory:**

1. **Flow deletes the single biggest category.** Roughly a third of both projects' `docs/agents/` is process prose that skills replace outright.
2. **The failure mode is bloat, not absence.** 280-line conventions, 560-line decisions log, 375-line caching notes, and the user's own verdict on `commands.md`: *"kind of bloated, included too much unnecessary shit."* Nothing prunes. So the design problem is not which files exist — it's what keeps them small.

Also worth keeping: `lessons-learned/` entries follow a fixed shape — Symptom / Root cause / Fix / Prevention — and the Prevention section names where the rule should end up (rule, plan, review). That is `organize`'s altitude call, done by hand, and it worked.

---

## Parked — belongs to the brainstorm thread

**Wayfinder ideas worth re-deriving against files (product mode only).** (a) *Index, not store* — the always-loaded artifact holds one line + link per decision; the detail lives in exactly one place. (b) *Fog of war* — an explicit home for questions you can sense but can't yet phrase; the test is whether you can *state* the question now, not answer it. (c) *One question per session.* Topic mode keeps its single `brainstorm.md`; applying this to a two-hour feature brainstorm is strictly worse. Evidence for (a) is case3: 1069 lines for a *minimal* product effort, and the user's report that a labs-scale product brainstorm ran two weeks across many files.

Also parked here: whether a feasibility question should stop the brainstorm and get proven with throwaway code, or stay deferred to a backlog spike as genesis #3.2.b decided (see #8).

---

## Everything else → `new-workflow/backlog.md`

Loose items raised in session and not owned by this thread live there — settings work, skills to build, the faulty subagent-reading principles, hooks, and migration of the user's own projects.

---

## SESSION 2026-08-02 — Flow goes global

Triggered by the user rejecting the built `init-flow` SKILL.md outright. Walked conversationally; every decision below is user-confirmed.

**Still standing from #1–#13 above:** #1 (the deliberative half is `brainstorm`'s product mode), #1b (`consolidation.md` dissolved), #4 (migration is conversion, harvest content / discard process), #5 (git deny list is a Flow default — now global, see #G5), #6 (re-derive Matt's skills against files), #6b (brainstorm's core not up for rewrite), #7 (no template changelog), #8 (`prototype` parked), #10 (quarantine, not merge), #12 (harvest never writes `docs/spec/`), #A / #A2 (`docs/context/` and the portability routing test), #B (status script), #D (no version stamp).

**Superseded:** #3, #9 (partly), #11 (partly), #13, #C, and the one-flow-for-every-starting-point framing.

### #G1 — The arc inverts; init is not the front door

Old shape assumed you know you're building something before you think about it. Actual shape:

```
product brainstorm (anywhere, no repo)  →  decide to commit  →  land Flow  →  derive  →  build
         most ideas die here
```

Commitment is an **output** of the brainstorm, not a precondition. Extends the genesis core insight one step out: `docs/spec/` is upstream of `CLAUDE.md`, and the **repo itself is downstream of the thinking**.

Driving cases (user's own): an idea out of nowhere; an **ideas repo** holding many half-formed products across many sessions, results saved in place; a pile of research + brainstorming on something not yet committed to, brainstormed further to finalize the idea. Heavy research, sometimes marketing research. Open-ended. Most never become projects.

Moving finished brainstorm material into a new project repo is **not a problem to solve** (user): he creates the repo and copies the files by hand.

### #G2 — `init-flow` rescoped and renamed → `migrate-to-flow`

| Start | What a skill adds | Verdict |
|---|---|---|
| Empty repo | fetches a few files | zero — "Use this template" or `git clone` |
| Docs, no code | fetch + move files to intake | near-zero; material from his own brainstorm needs no harvest |
| **Existing codebase** | quarantine a real pile + survey the code + harvest stale docs cross-checked against it | **the only real job** |
| Already on Flow | reconcile against current template | small; stays in the same skill |

User's framing: don't design as if he can't `git init` or run `npx skills add` — the published guide covers those. **Docs-but-no-code folds in** as the degenerate case (survey phase no-ops), not a separate path.

Name: `init-flow` promised "initialize Flow," which is the reading that produced the wrong skill.

### #G3 — Almost all of `flow/CLAUDE.md` relocates to `~/.claude/CLAUDE.md`

**Supersedes #3 (split rejected).** Different line, different reason. #3 rejected moving the workflow half to an `@`-import for *update convenience* — an import can silently fail to fire. This moves it to the **user scope**, which Claude Code loads natively in every session in every directory. Requirement, not convenience: the rules must apply where **no project exists**, or brainstorming in an ideas repo gets the skill without the house style.

Test applied: **what actually varies per project?** Only two sections.

| Global — `~/.claude/CLAUDE.md` | Project — `CLAUDE.md` |
|---|---|
| `## The user`, `## Preferences` | `## Project` |
| `## Explaining`, `## Communication` | `## Project rules` |
| `## Key docs`, `## Workflow`, `## Scripts` | |
| `## Capture` (whole section — destinations are template-fixed, identical everywhere) | |
| `## Hard rules` | |

Load order confirmed from the docs: managed → user → project → local, **concatenated, not overriding**, project read last. Both halves land under the 200-line target.

`## Capture` goes global **entire**. An earlier reflex-global / routing-table-project split was overcomplicating: `docs/work/backlog.md`, `## Project rules`, `docs/context/`, `docs/work/inbox.md` are identical in every Flow project. Rows simply no-op where the path doesn't exist; with no project at all everything collapses to the brainstorm file, which is correct.

Cost accepted: a Flow repo on another machine loses the global half. Irrelevant under the standing principle.

### #G4 — Scripts go global (`~/.claude/scripts/`)

`tree.sh` takes a target defaulting to `.` and never references its own location; `merge-files.js` takes path arguments. **Verified: neither assumes a project root**, so both run correctly from `~/.claude/scripts/` against any cwd.

Beyond "the rule that names them is global": a per-project copy of a script nobody ever edits is N copies needing overwrite on every template update. One global copy, updated once.

### #G5 — Settings go global

Comparing `flow/.claude/settings.json` against the user's `~/.claude/settings.json` (2026-08-02): the behavioral half is **already global by hand** — same `disableBundledSkills`, `disableWorkflows`, `disableRemoteControl`, `disableClaudeAiConnectors`, `disableArtifact`, same non-git deny entries.

Moves up: the **git mutation deny list** (unbounded blast radius applies in every directory, not just Flow ones — strengthens #5), the **SessionStart hook** (becomes `bash ~/.claude/scripts/check-skills.sh`, so the skills check runs everywhere), and `autoMemoryEnabled: false`.

### #G6 — The payload collapses to two files

**Supersedes #11's six-file list and #9's "Use this template stops being the door."**

```
~/.claude/                       the project repo
├── CLAUDE.md   ← everything     ├── CLAUDE.md  ← ## Project + ## Project rules
├── scripts/    ← all three      └── docs/work/backlog.md
└── settings.json ← deny + hook
```

`recommended-tools.md` **does ship** (reverses that half of #11) — it's a library the user consults when picking tools, and the staleness objection is answered by the same mechanism that handles scripts: template-owned, overwritten on update. `README.md` does **not** ship; the user never asked for it, and copying it overwrites the project's own README. If a "what is Flow" doc is wanted in-project, that's a new file at a non-colliding path.

**Two doors, two jobs** (reverses #9's consequence): "Use this template" / `git clone` for greenfield, run-time fetch for migration. The template `README.md` therefore becomes the **greenfield onboarding path** and has to actually work as a guide.

Knock-ons: **#13's `---` divider rule is moot** — nothing template-owned is left in the project file; the re-run updates the *global* install instead. **"Already on Flow" needs a new marker** — `## Workflow` won't be in the project CLAUDE.md; presence of `docs/work/backlog.md` is probably enough.

### #G7 — Two skills, named

- **`setup-flow-globals`** — once per machine. Writes the global `CLAUDE.md`, `~/.claude/scripts/`, merges `~/.claude/settings.json`, interviews once for `## The user`. **Now the primary skill.**
- **`migrate-to-flow`** — per repo, existing codebase. The narrow specialist.

Writing the global profile is **its own skill, not a sub-feature of brainstorm** (user). Product-mode brainstorm checks whether the profile exists and **redirects** the user to `setup-flow-globals`; it never does the work itself.

Existing populated `~/.claude/CLAUDE.md`: append under a marked Flow heading, never overwrite, report anything that contradicts a Flow rule rather than silently competing.

### #G8 — Auto memory: structurally wrong for the profile; `docs/context/` wins for project facts

Verified against the Claude Code docs and the user's machine:

- Auto memory stores at `~/.claude/projects/<project>/memory/` — **per repository, machine-local**, not shared across machines. So it **cannot** hold `## The user` / `## Preferences`, which must apply in every repo and in no repo. Custom instructions can't fix a scope problem.
- It captures build commands, debugging insights, architecture notes, conventions — the same content class as `docs/context/`. `docs/context/` wins: in git, diffable, prunable, survives a machine change.
- **Actual state found:** `flow/.claude/settings.json` already carries `"autoMemoryEnabled": false` (user had done it); `~/.claude/settings.json` carries `true`; two projects have live memory dirs (`backmark`, `backmark-validation`). Fix is one line in the global settings — which is #G5.

### #G9 — No interview skill

Matt's `grilling` is **seven lines**: one question at a time, give your recommended answer, look up facts instead of asking, decisions are the user's, don't act until confirmed. `brainstorm` Phase 2 already has all five plus the tree, the writing discipline, and probe-until-clear. Nothing to extract — and the `## The user` caller moves to `setup-flow-globals`, leaving brainstorm's two modes as the only callers.

**Watch when product mode is built:** product questions are *elicitation*, technical questions are *propose-and-react*. If those need genuinely different rules, that's a sub-file inside brainstorm — not a standalone skill.

### #G10 — Mechanics corrected on the migration path

- **Fetch by raw URL, no clone.** Verified 2026-08-02: all payload files return 200 from `https://raw.githubusercontent.com/Adrian333Dev/flow/main/<path>`, including `.gitignore` and `.claude/settings.json`. One chained `curl`; files land at their final path; nothing transits `tmp/`.
- **Never delete `tmp/` wholesale** — the user may already have one with content. Delete only what the run created.
- **No approval gate before moves.** Typing the command *is* the approval; git makes moves reversible; `mv` back is trivial. Every move still reported. (Reverses the one-gate design.)
- **`.claude/` is staged wholesale** to `tmp/pre-flow/.claude/`, then the agents/commands/skills worth keeping are moved back. Their **docs** still go to tracked `docs/intake/` — product mode reads that material weeks later, so it must survive in git.
- **`.claude/agents|commands|skills` are analyzed, not skipped.** File collisions are nil, but *behavioral* ones are real — a project-local `superpowers` competes with Flow's `brainstorm`. Report; offer quarantine; never move silently.
- **`.gitignore`** appends every template line the repo lacks, stated generally rather than hardcoding `tmp/`.
- **The codebase survey reads real code, not just layout.** The code **falsifies** stale docs: on disagreement the code wins and the doc's claim is dropped rather than harvested.

### #G11 — Check built-in `/init` before duplicating the survey

`CLAUDE_CODE_NEW_INIT=1` makes Claude Code's own `/init` run a multi-phase flow: subagent codebase exploration, follow-up questions to fill gaps, reviewable proposal before writing. That is most of `migrate-to-flow`'s survey phase. Test it against a real repo before writing ours; the skill may only need to add the Flow-specific parts.

### Build order (locked this session)

1. **Restructure `flow/` for the global split** — it changes what everything else reads.
2. **Build product-mode brainstorm**, including the profile-existence check that redirects to `setup-flow-globals`.
3. **Write `setup-flow-globals`.**
4. **Write `migrate-to-flow` last**, against a destination that by then exists.

The existing `init-flow` SKILL.md (196 lines, 2026-07-31) is **rejected in full** and awaits rewrite as `migrate-to-flow`. Do not patch it. Moved 2026-08-03 to `new-workflow/rejected-init-flow/` — out of `flow/skills/` so `link-skills.sh` can't publish a rejected skill into `~/.claude/skills/`.

---

## SESSION 2026-08-03 — one repo

Executing build step 1 (restructure `flow/` for the global split) forced three questions the #G session left open. All user-confirmed; **step 1 is now built** — see #H7 for what's on disk.

### #H1 — `flow-skills` merges into `flow`; the distribution machinery dies

Everything the separate catalog bought was distribution to strangers, and strangers were scrapped. Skills already reach the agent by symlink (`~/.claude/skills/*` → the repo), never by CLI — the CLI was already not the live mechanism.

**Dead:** `npx skills add` / `npx skills init`, `.claude-plugin/plugin.json` and its nine-entry registry, the `README.md` skill list, the "register in two places" rule, versioning/changesets.
**Replacement:** `global/scripts/link-skills.sh` — symlinks every folder in `flow/skills/` into `~/.claude/skills/` and drops broken links pointing into the repo. Adding a skill = make the folder, run the script. Permanently fixes the stale-symlink backlog item.

`flow-skills/` is left intact on disk pending a separate delete confirmation; its git history stays in its own repo.

### #H2 — `flow` stops being a GitHub template repo

**Supersedes #G6's "two doors."** "Use this template" copies the whole repo into a new project — with skills and global config inside it, every new project would inherit all of it. Dropping the button costs nothing: what it delivered is now three trivial files (`CLAUDE.md` with two sections, a backlog stub, a one-line `.gitignore`). Greenfield setup is `cp -r project-template/. .`.

`flow` becomes the **system repo** — cloned once per machine, never per project.

### #H3 — Template version vs personalized version

Two states of every global file, and they are meant to diverge:

| | Lives at | Owner |
|---|---|---|
| **Template** | `flow/global/CLAUDE.md` — placeholders + rules, public | the repo |
| **Personalized** | `~/.claude/CLAUDE.md` — real profile, filled over time | the machine |

`setup-flow-globals` **copies** the first to the second, once. Backing up the personalized copy is the user's own business — he tracks `~/.claude/` in a private notes repo. **Out of Flow's scope entirely.**

Kills a symlink-the-CLAUDE.md proposal made this session: it would have committed his live profile into a public repo, and it collapsed two files that exist for different reasons. Scripts *are* symlinked (no personalization); `settings.json` is merged, not copied, because his global settings hold personal keys (`model`, `effortLevel`, plugins) Flow must not own.

### #H4 — The divider and the re-run: closed, permanently

Both terms retired. The `---` divider in the old `flow/CLAUDE.md` existed only so a second install could tell user-owned sections from template-owned ones. Nothing template-owned remains in a project `CLAUDE.md`, and on the global side both halves are authored by the same person — picking up an improvement is reading a diff between two files you wrote, not a protocol. No marker, no protected regions, no update path to design. **Do not reopen.** (`migrate-to-flow` still needs an "already on Flow" check; that is unrelated and trivial.)

### #H5 — Changelogs kept; versions rejected

Version numbers solve distribution lag — N frozen copies needing to learn a newer one exists. One symlinked copy per machine means zero copies and zero lag; a version in frontmatter would also load into context on every invocation for no agent benefit. **No versions.**

Changelogs survive on a different argument than the one that raised them (notification — which doesn't apply, since an edit is live in every project instantly). Five of nine already carry substantive entries that git cannot reproduce, because every commit in these repos says `save`. New rule, now in `flow/skills/CLAUDE.md`: **log behavior changes only** — a rule added/removed/reversed, a mode added, a mechanism replaced. Not renames, path fixes or reference sweeps. Date headers, newest first. Accumulated findings go in a `knowledge/` file instead (loaded at run time; a changelog never is).

### #H6 — `recommended-tools.md` retires into the toolbox repo

**Supersedes #G6's "recommended-tools ships."** The user already keeps `github.com/Adrian333Dev/toolbox` (public, cloned at `~/code/toolbox`) — a broader reference that already overlapped it. Split into `README.md` (index), `mcp-servers.md`, `plugins.md`, `skills.md`, `libraries.md`, `apps.md`.

**Stays a separate repo.** Everything in `flow` is machine-local and symlinked; toolbox is a browsable reference about the outside world, useful with no Flow involved, churning on its own cadence. Read path is the local clone (`~/code/toolbox/<file>.md`), raw GitHub URL as fallback — pointer lives in `global/CLAUDE.md` `## Key docs`.

The external-LLM ranking (Claude → ChatGPT → DeepSeek → Gemini) moved into `skills/research/SKILL.md` instead — it is acted on at run time, not browsed. `flow/recommended-tools.md` deleted 2026-08-03.

### #H7 — Built layout

```
flow/
├── CLAUDE.md              rules for working ON the repo (new job for this file)
├── README.md              setup guide — the only onboarding path
├── global/                → ~/.claude/
│   ├── CLAUDE.md          the nine sections, template version
│   ├── settings.json      permissions (allow + deny), the PreToolUse hook, feature flags
│   ├── settings.md        what every key in settings.json is for and why
│   └── scripts/           tree.sh, merge-files.js, link-skills.sh, guard.py
├── skills/                the eight live skills, symlinked into ~/.claude/skills/
│   └── CLAUDE.md          authoring guide
└── project-template/      CLAUDE.md (## Project + ## Project rules), .gitignore, docs/work/backlog.md
```

Script paths in rules and skills are written `~/.claude/scripts/…`. `global/CLAUDE.md` gained: the no-project case in `## Capture` (everything collapses to the working file; never scaffold a `docs/` tree to route into), the "these paths exist only when there's a project" note on `## Key docs`, and the toolbox pointer.

**Build order 2–4 unchanged.** Step 3 (`setup-flow-globals`) now has a concrete job: run `link-skills.sh`, symlink `~/.claude/scripts`, copy `global/CLAUDE.md` (never overwrite), merge `global/settings.json` key by key, interview for `## The user`.

### #H8 — `check-skills.sh` deleted

> **Corrected same day.** This section originally closed with "Flow now ships no hooks," stated as a rule. That generalization was the agent's, extrapolated from one deletion; the user never decided it and there was no reasoning behind it. **Withdrawn — Flow ships a `PreToolUse` hook, see #H9.** What follows is about `check-skills.sh` only.

The SessionStart hook verified that seven named skills existed under `~/.claude/skills/`, silent when they did. **Deleted 2026-08-03, along with the `hooks` key in `global/settings.json`** — SessionStart was the only hook at the time.

It was built against per-project `npx skills add` distribution, where any machine or project could be un-installed or drifted. Under #H1 there is one clone and one set of symlinks: skills are all linked or none are, and there is no partial state left to detect. What survived was a per-session check for a per-machine condition that step 3 (`setup-flow-globals`) will itself resolve by running `link-skills.sh`.

**The deciding cost is the hardcoded roster.** Its seven names had to be hand-edited on every skill add, rename or removal, and had already gone stale once (`note` listed after it dissolved; `handoff` and `curate-skills` missing) — a checker whose list drifts either cries wolf or hides a real gap.

**Replaced by one clause in `global/CLAUDE.md` `## Workflow`:** *"A skill listed here that isn't installed → say so and stop; never improvise its function."* Same hazard — silent improvisation — caught where the agent meets it rather than in a session-start banner, with no roster to maintain. Supersedes ecosystem #5's "mandatory, already enforced by `check-skills.sh`" and the enforcement clause of session 14's distribution model.

### #H9 — Permission model: blanket allow + deny list + a `PreToolUse` guard

**The problem.** Every novel Bash command stops and asks. "Yes, don't ask again" saves the *exact command string*, so `tree.sh --depth 3` and `tree.sh --depth 4` become two separate rules. The result is an allow list of commands already run, which never converges — the workbench's `.claude/settings.local.json` had accumulated ~50 entries, most pointing at paths the #H1 restructure had already moved.

**Rejected — auto mode** (`permissions.defaultMode: "auto"`). A Sonnet 5 classifier reviews each action before it runs; routine work goes silent and a documented list of escalations gets blocked. Deny rules survive it, so the git list would have held. Killed on cost: every shell command and network call becomes a model call carrying a slice of the transcript, and this workflow is mostly shell. User's objection, and it was correct.

**Rejected — the Bash sandbox.** Bubblewrap jail in auto-allow mode: OS-enforced boundary, zero token cost, no model involved. User rejected it — doesn't match how he wants to work, and it needs `socat` installed.

**LOCKED — three layers, all in `global/settings.json`:**

- **`permissions.allow` = bare tool names.** `Bash`, `Edit`, `WebFetch`, `mcp__context7__*`. A tool name with no parentheses matches *every* use of that tool, so there is no list to curate and nothing to go stale when a path moves. This is what kills the problem rather than managing it.
- **`permissions.deny` = the 32 entries, unchanged.** Rules evaluate **deny → ask → allow**, first match wins, and a broad deny cannot be punctured by a narrower allow. Deny rules also hold in *every* permission mode, including `auto` and `bypassPermissions`.
- **`hooks.PreToolUse` → `global/scripts/guard.py`**, matcher `Bash`, run as `python3 "$HOME/.claude/scripts/guard.py"`. Python because `/usr/bin/python3` is a fixed path; `node` lives under nvm and a hook does not reliably inherit that PATH.

**The blanket allow and the guard are one unit and never ship apart** (user, emphatic, twice). Blanket allow without the guard leaves only the deny list, which can enumerate git mutations but not the open set of dangerous shell. The guard is not a safety net on top of the permission model — it *is* the part of the model that the deny list cannot express.

**`guard.py`'s scope rule, recorded in its own docstring:** it installs to `~/.claude/` and therefore runs in every directory, so it may only carry rules that are true everywhere. A rule belonging to one repo goes in that repo's `.claude/settings.json`. The first draft broke this by denying `pnpm add` — importing the **workbench-only** install ban into a global guard, while `global/CLAUDE.md` *mandates* running the package manager ("run the package manager, never hand-edit the manifest"). Note `session-new-plugin.md` session 13 is stale on this: it records the ban as applying to both files, and the product side was reversed afterwards.

Its verdicts:

- **deny** — `sudo`/`su`, pipe-to-shell (`curl … | bash`), git mutations (a second net independent of the deny list), `--dangerously-skip-permissions`
- **ask** — dependency changes (`npm`/`pnpm`/`yarn`/`bun`/`pip`/`uv`/`cargo`/`go`/`gem`), system packages, `chmod 777`, `dd of=/dev/`, `mkfs`, shell-rc writes, recursive deletes resolving outside the working directory
- **never `allow`** — so `permissions.deny` stays the final authority and a bug in the script cannot widen anything

**Nothing is installed into `~/.claude/` until the repo is finalized** (user, emphatic). The two narrow allow entries the user added to his own settings by hand — `tree.sh` and `merge-files.js` — are a personal interim fix, not Flow's config, and are deliberately *not* mirrored into the template.

**`settings.json` is strict JSON — no comments.** Documentation therefore lives beside it in `global/settings.md`, which groups the deny list and explains every key.

---

## Reference pointers

- `new-workflow/design-project-genesis.md` — the superseded front-of-lifecycle design; phases A–D migrate to the brainstorm thread.
- `new-workflow/design-brainstorm-rework.md` — full-product mode, where Consolidation lands. #D now closed by #1 above.
- `reference/mattpocock-skills/skills/engineering/` — `setup-matt-pocock-skills` (explore → present → confirm → write, edit in place), `ask-matt` (router), `wayfinder` (map + decision tickets), `prototype`.
- `tmp/local-refs/delapse/docs`, `tmp/local-refs/lumacraft_v2/docs` — the survey above.
