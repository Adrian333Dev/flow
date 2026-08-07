# Design — Skill & Knowledge Ecosystem (#7)

_Live brainstorm record. Spun out of `design-project-genesis.md` (#7) on 2026-07-17. Meta-work on `agentic-workflow_v2/`._

The **reusable, growing, publishable knowledge system** that sits alongside v2's process skills. Bigger than "conventions" — it's how hard-won engineering knowledge is captured, compounded across projects, maintained without rotting, and published. Linked to `design-project-genesis.md` only at the seams (init-seeding, capture-routing).

**Origin:** v2 kept the *process* layer (skills — brainstorming/plans/execute/research/etc.) but dropped framework-build's *knowledge* layer (the guide system). The user's pain ("I always miss/lose conventions, rules, patterns") is that dropped layer. This doc designs its replacement — grounded in the user's own reference implementation, `tmp/debug-web-pages/`.

---

## Ground rules (same as the genesis doc)
- **Plain conversational brainstorming only.** Do NOT invoke `superpowers:brainstorming` or the v2 `brainstorming` skill on this meta-work.
- One branch at a time; agent commits to a position; write the decision before moving on.
- `framework-build/` and `tmp/debug-web-pages/` are **read-only reference.** No file changes to deliverables without explicit approval.

---

## The reference implementation — `tmp/debug-web-pages/` (studied 2026-07-17)

A skill is not a static instruction file. It's a **self-contained, growing, publishable knowledge unit** with a deliberate anatomy:

```
debug-web-pages/
  SKILL.md            # STABLE CORE — the loop, mode selection, pointers. "Predictability anchor." Changes rarely; detail kept OUT.
  tools/              # scripts (capture.js, unpack.js) — fixed machinery
  knowledge/          # the skill's OWN knowledge base, CHURN-SEPARATED:
    capturing-and-querying.md   # slow-changing SHARED method knowledge (general across pages)
    live-experiments.md
    investigation-patterns.md
    domains/
      _TEMPLATE.md              # template for a new domain file
      youtube-watch.md          # HIGH-CHURN, append-only, ISOLATED per-domain findings cache (dated, verified, cited)
  DESIGN.md   ROADMAP.md   MAINTAINING.md   # meta-layer: architecture, direction, health
```

### The three inventions taken from it
1. **Churn-separation** — split content by *how often it changes*: stable core (`SKILL.md`) / slow shared (`knowledge/*.md`) / high-churn isolated (`knowledge/domains/<x>.md`). Adding/growing one domain file **touches nothing else — zero merge cost.** This is the structural anti-rot idea.
2. **Promotion + Pruning rituals** (`MAINTAINING.md`) — **Promotion:** when a tactic appears in ≥2 domain files, lift it into the shared file (single source of truth) *before* it spreads to a third. **Pruning:** periodic pass for relevance + no-ops, **delete aggressively** ("sediment is the default outcome without this pass, not an edge case"). *This is the direct answer to "I lose/miss conventions."*
3. **Low-friction publishing** (`ROADMAP.md`) — project-local skill → hostable personal-skills repo by *adding* `plugin.json` + symlink-install + README **around an unchanged folder.** No move of internals, no path rewrites.

### `MAINTAINING.md` mechanics (generalize these in branch #2)
- **Where new knowledge goes (routing):** one-page fact → its `domains/<x>.md`; general tactic → the matching shared file; brand-new capability/mode → new `tools/` script(s) + one knowledge file + a mode entry in `SKILL.md` (the only change that touches the core).
- **Domain-file hygiene:** verified findings only (mark guesses as open questions), dated, cite source (bundle/session). Prefer a stable locator (handlerHash/css-path) over prose.
- **Writing style (anti-sprawl):** prompt the positive (don't steer by prohibition); single source of truth per fact; reach for leading words (a compact term the model already knows) over restated phrases.

### The compounding loop
"Before you start, check `knowledge/domains/` for what we already proved; when you finish, append verified findings." **The tooling is fixed; the expertise compounds.** That is the whole reason it's a skill and not a script (`ROADMAP.md` Axis 3).

### The publishing model (`ROADMAP.md` Axis 1 — modeled on `mattpocock/skills`)
```
skills-repo/                        # its own git repo, hostable (e.g. GitHub)
  skills/<category>/<skill>/         # skill moved here verbatim
  scripts/link-skills.sh             # symlink each skill into ~/.claude/skills + ~/.agents/skills → git pull/edit updates every project live
  scripts/list-skills.sh
  .claude-plugin/plugin.json         # lists skills → installs as one named plugin
  README.md  CLAUDE.md
```
- Categories (`engineering/`, `productivity/`, …) + `in-progress/` (WIP, not linked) + `deprecated/` (kept, excluded from install).
- **Migration is low-friction by design:** converting = *adding* the install script + `plugin.json` + README around a folder that already exists.
- Release discipline (changesets, CHANGELOG, ADRs, `docs/` tree) deliberately **skipped until publishing to strangers** — it's release-discipline for others, not needed for a private set.

---

## CORRECTED CORE MODEL (confirmed 2026-07-17)

Two earlier framings by the assistant were WRONG and are superseded: (1) "knowledge base = project-specific leftover bucket"; (2) "three-tier pipeline project KB → personal KB → skill." The real model:

- **The SKILL is the atomic unit of reusable, growing, publishable knowledge.** There is **no separate knowledge-base store beside skills** — a skill's internal `knowledge/` folder **IS** the cross-project knowledge base.
- **Two destinations, decided by REUSABILITY:**
  - **Reusable** (domain / stack / method knowledge) → a **skill** (grows in `knowledge/`, publishable).
  - **Project-specific** (this repo's conventions/decisions) → stays in the **project** (`docs/spec/decisions`), **never a skill.**
  - Surviving kernel of the earlier take: **don't *re-document* what a mature skill already covers** (external like `react-useeffect`, or one of yours) — reference it. "No skill exists yet" ≠ "project-specific" (the chrome-extension/YouTube knowledge is general + reusable, just not yet packaged).
- **The workflow (agentic-setup) and skills are SEPARATE publishable artifacts.** The workflow *consumes/recommends* skills; skills are independently versioned and published. Some are workflow-coupled, some standalone. The user intends to publish **both** the workflow and their own skills.
- **External skills** (e.g. `agent-toolkit`: `react-dev`, `react-useeffect`, `database-schema-designer`) = *other people's* crystallized output of this same pipeline. Import theirs where it exists; grow your own where it doesn't.

---

## A-to-Z sub-system map (the design work — each its own branch)

- **#1 — Skill anatomy standard** — **CLOSED (2026-07-17).** See the locked decision below. Thesis: *standardize the names of the pieces, not which pieces a skill has.* One hard invariant (`SKILL.md`); everything else optional-by-purpose; knowledge layout emergent.
- **#2 — Growth / maintenance framework** — **CLOSED (2026-07-17).** Part A (*where* maintenance lives) + Part B (the janitor's 5 rules) both locked below. Reusable `maintaining-skills` skill (Grow + Audit modes) + thin per-skill config; 5 rules = don't-duplicate, delete-junk, route-new-knowledge, write-only-confirmed, keep-notes-short.
- **#3 — Capture / routing loop** — **CLOSED (2026-07-17).** See locked decision below. Notice (free, during work) split from Sort (at a stopping point); default route = a skill, rare exception = project docs; **no global inbox**; the "reusable vs project-specific" question is NOT a real fork (nearly everything is reusable). *(The part that fixes "I miss things.")*
- **#4 — Publishing / packaging framework** — **CLOSED (2026-07-18).** See locked decision below. Two repos (workflow-template + skills-catalog), developed side-by-side in one local folder (NOT git submodules). Core "how to work" skills ship *inside* the template (Option 1). Distribution ships **both doors**: `npx skills` picker (per-skill / per-agent / per-scope) + Claude Code `marketplace.json`. **Link, never hard-copy** (so `git pull` updates everywhere). Release discipline deferred until strangers install.
- **#5 — Init integration (seam to `project-init`)** — **CLOSED (2026-07-30).** See the locked decision below. No seam survives: project-local capture ships in `CLAUDE.md`, the recommender has an empty candidate set (zero stack skills in the catalog) and is deferred, external-skill recommendation is dropped, and `init-flow`'s skill step is a presence check that prints the install command.
- **#6 — Skill-creation trigger** — when a recurring pattern graduates from project notes into a *new* skill; who authors it (existing `write-a-skill` / `superpowers:writing-skills`?).

---

## LOCKED — Branch #1: Skill anatomy standard (2026-07-17)

**Thesis: standardize the *names of the pieces*, not *which pieces* a skill has.** Two skills can differ completely in structure yet both be instantly navigable, because whatever pieces they *do* have are named identically. The framework is **conventions + heuristics, never mandates/thresholds** — so it stays flexible enough to fit skill types we haven't imagined (turborepo, supabase, tsconfig, TS-packages, logging, …). **`debug-web-pages` is ONE instantiation, not the template.**

### The one hard invariant
Every skill has a **`SKILL.md`**. Nothing else is required.

### Everything else is optional — added by judgment when its *purpose* applies (no thresholds)
| Piece | Add when | Fixed name |
|---|---|---|
| knowledge folder | `SKILL.md` getting too heavy to stay lean, **OR** knowledge accumulates/churns | `knowledge/` |
| tools | the skill has scripts / fixed machinery | `tools/` |
| maintenance manual | growing knowledge needs promotion/pruning governance | `MAINTAINING.md` |
| a shape *inside* `knowledge/` | the knowledge partitions that way (see shape-library) | per shape |

Names are fixed **only when you use them** → consistency of *naming*, not of *structure*.

### Two governing heuristics (not rules)
1. **Smallest shape that works.** Default to one file; that's often also the *final* shape (e.g. a logging skill fits in `SKILL.md`). Add structure only when it pays for itself. The "growth ladder" survives only as a *mental model* (start minimal → add pieces as earned) — each step is a judgment call, not a gated trigger.
2. **Load-frequency split.** `SKILL.md` is read *every invocation* → keep it lean + stable (the predictability anchor); `knowledge/` is read *on-demand via pointers* → may be big + churny. This heuristic is what tells you *when* a `knowledge/` split helps (SKILL.md bloating), **not** a rule that mandates a `knowledge/` folder.

### Meta-docs
- **`MAINTAINING.md`** — the **only** meta-doc with a *standing* place, and only for knowledge-growing skills. Permanent where it applies.
- **`DESIGN.md` / `ROADMAP.md`** — **NOT part of the anatomy.** Construction-phase scratch a skill carries *while being built* or on a deliberate grow-to-publish path. Delete when stale; never create by default. No prescribed set — a WIP skill carries whatever working notes it needs. (They existed in `debug-web-pages` only because that skill is WIP.)

### Knowledge layout is emergent — a shape-library (illustrative & OPEN, not a taxonomy to force-fit)
| Shape | Example | Layout | Template? |
|---|---|---|---|
| **Instance-cache** | debug-web-pages | sub-folder of structurally-similar files (`domains/`, or whatever the instance noun is), append-only verified findings | **yes** — the one case `_TEMPLATE.md` fits |
| **Topic reference** | tsconfig, supabase | flat `knowledge/<topic>.md`, each bespoke | no |
| **Recipe / pattern** | TS-packages | recipe files, or one growing patterns file | no |
| **Flat note** | small skill | single `knowledge/notes.md` | no |

New shapes get added as we build more skills. You pick the shape the knowledge *naturally* takes; you don't force knowledge into a shape.

### `_TEMPLATE.md` is scoped
It belongs **only** to the instance-cache shape (N structurally-similar files worth stamping out consistently). For topic/recipe knowledge each file is bespoke → a template is meaningless. **It is NOT domain-agnostic and NOT mandatory anatomy.**

### Superseded within this branch
- ❌ "anatomy = the `debug-web-pages` full shape as the default template" — wrong; that's the *top of the ladder / one shape*.
- ❌ "keep `domains/` as the fixed sub-bucket name regardless of semantic unit" — wrong; forces the word "domain" onto skills that have none.
- ❌ "meta-docs are a standing trio (DESIGN/ROADMAP/MAINTAINING)" — wrong; only `MAINTAINING` stands, and only for knowledge-growing skills.

---

## SUPERSEDING UPDATE — 2026-07-24 (session 14e): operational layer redesigned

Re-examined the operational branches below and found them over-built. **The core model (skill = atomic, git-tracked, symlink-live, per-skill install, on-demand loading) STANDS.** What changed is the *operational layer* — capture, filing, skill maintenance. Full walk: `session-new-plugin.md` → the **session 14e** block. Summary + branch-by-branch supersession:

**Capture → inbox.** `capture-context` stays the ONLY passive behavior, now **relaxed** (occasional reflex + user-promptable, not every-turn). During work it dumps *everything worth keeping* — decision / finding / idea / reusable knowledge, all mixed — RAW into ONE file **`docs/work/inbox.md`** (name changeable), scoped to the active topic/milestone. **No destination decision at capture time** (that's the win — kills "this fits three files at once"). Exception: an active `brainstorm.md`/`spec.md` owns its own in-progress content.

**Two on-demand commands** (replace the single two-mode `maintaining-skills`):
- **`organize`** (frequent) — drains the inbox, routes each item to its home (project files + appends reusable lines to skills that ALREADY exist). capture-context's old capture-time routing table moves HERE. Reusable knowledge with NO home skill → it **flags** it ("needs new skill: X"), never stub-creates mid-flight.
- **`curate-skills`** (deliberate) — build a new skill, restructure, prune. Prunes only what's WRONG or OUTDATED, never "just an opinion."
- Dividing rule: **adding a line = `organize`; building/reshaping a skill = `curate-skills`.**

**Trigger** (the gap the old design never closed): `organize` is offered at the **review step**, which recurs after EACH artifact (brainstorm/spec/plan/execute) — surface-and-offer, deferrable; the inbox **persists across any U-turn/loop-back** so nothing is lost. The review/finalize phase is itself undesigned and owns this trigger (deferred thread).

**Skills = plain best-practices / tips / guides in prose — NO taxonomy** (rejected a fact/stance/open-question split as overcomplication; `debug-web-pages` is the model). Cross-cutting rules route by **altitude**: tool quirk → tool skill; framework pattern → framework skill; broad principle ("never let the client touch the DB") → a high-level **concept skill** (e.g. `architecture`); integration gotcha → the source-of-the-quirk tool + a pointer. **Never a tool-combo skill** (combinatorial explosion). One home, pointers elsewhere, never duplicate.

**Audit** (the old Grow/Audit read-mode) is **PARKED** — a separate future feature; when built, scope it to the skills the work touched.

**Branch-by-branch:**
- **Branch #2 (Part A + B)** — `maintaining-skills` two-mode + the janitor's 5 rules → **REPLACED** by `organize` + `curate-skills`. The 5 rules collapse to: prune wrong/outdated (not "when unsure"); one home + pointers (never duplicate); knowledge is prose. Audit split out + parked.
- **Branch #3** — Notice/Sort/no-global-inbox/stub-on-the-spot → **REPLACED** by the inbox model + `organize` + flag-not-stub. ("No global inbox" still holds — `inbox.md` is per-project + temporary, not a cross-project store.)
- **Branch #4** — point 3 ("core how-to-work skills live INSIDE the template") is **STALE**: all six skills live in the catalog (`flow-skills`); the template ships zero. The rest of Branch #4 (two repos, link-not-copy, both distribution doors, deferred release discipline) still holds.
- **Branch #1** (skill anatomy) — **unaffected**, still current.

---

## LOCKED — Branch #2, Part A: where maintenance lives (2026-07-17)

**Maintenance is a reusable meta-skill, not per-skill boilerplate.** Split by what's universal vs what's peculiar:

- **MECHANICS** (the *how* — identical for every skill: churn-separation, promotion, pruning, routing, hygiene, writing style) → hoisted into **ONE reusable skill, `maintaining-skills`.** Copying these into every skill's `MAINTAINING.md` *is* the rot we're preventing.
- **SPECIFICS** (the *what* — per-skill: knowledge shape, instance-noun, which files are shared vs churny, what *"verified"* means here, the routing map) → a **thin per-skill `MAINTAINING.md`** that the meta-skill reads as **config**.
  - **Refines Branch #1:** `MAINTAINING.md` keeps its standing place, but goes **THIN** — the heavy ritual logic is hoisted out into `maintaining-skills`.

### New skill confirmed: `maintaining-skills` — two-mode (mirrors "two-modes, one-loop")
Both modes operate over the *same* skill knowledge — one writes, one reads:
- **Grow (WRITE)** — record verified findings into the right skill → **promote** (a tactic in ≥2 instances → lift to shared) → **prune** (delete aggressively).
- **Audit (READ)** — check the current implementation against a skill's accumulated best-practices.

### Why Audit lives HERE, not in `verification-before-completion` (decided 2026-07-17)
1. **Sequencing** — `verification-before-completion` is **not in the v2 workflow yet** (not locked, not designed). Folding Audit into it would create a dependency on an unbuilt skill + force a detour to lock it first. Rejected.
2. **Different concern / altitude** — even once verification exists:
   - `verification-before-completion` = **milestone / execution-scoped** — "did I complete *this* unit of work, against *its* plan/spec, does it run?" Evidence-before-claims, tied to a specific milestone.
   - **Audit** = **skill-scoped / cross-cutting** — "does this follow the reusable best-practices this skill accumulated?" Not tied to any milestone; reads the same knowledge Grow writes.
3. **Future layering (don't lose this):** if `verification-before-completion` is later designed, it **may invoke** `maintaining-skills:audit` as one of its checks — but Audit is **owned by the skill system**, not contained in milestone-verification. Milestone-verify can *call* skill-audit; it does not own it.

### `context-capture` overlap resolved
Not duplicates — **two destinations downstream of one routing decision:** `context-capture` → **project working memory** (project-specific); `maintaining-skills` → a **skill's reusable knowledge**. The fork between them (project-specific vs reusable → which skill?) is **Branch #3**. Siblings, not collisions.

### Still open — Branch #2, Part B (NEXT)
Generalize the mechanics *content* from `debug-web-pages`' `MAINTAINING.md` into skill-agnostic rules that live inside `maintaining-skills`: the **promotion** trigger, **pruning** discipline, the **routing** map ("where does a new piece of knowledge go?"), **hygiene** (verified/dated/cited), and **writing style** (prompt the positive, single source of truth, leading words).

---

## LOCKED — Branch #2, Part B: the janitor's rulebook (2026-07-17)

These are the rules `maintaining-skills` follows to keep a skill's knowledge files healthy. A skill's `knowledge/` rots without discipline (duplicated / outdated / junk notes); these 5 rules are the discipline. Written plainly on purpose — they must read the same to a stranger who installs the workflow.

**Rule 1 — Don't write the same thing twice; move it to one shared spot.**
If a fact you already wrote in one file is about to be written into a *second* file, stop and move it into one shared file both point to. One copy = one place to fix when it changes. *(Applies only to skills that have a shared + per-instance split; for a single-file skill there's nothing to move.)*

**Rule 2 — Delete old junk often; when unsure, delete.**
Knowledge files fill with wrong/useless notes; without deletion they become garbage. Whenever you open a knowledge file for any reason, delete the stale bits you notice. Don't keep "just in case" copies — **git already remembers everything you delete**, so deleting is safe. Bias toward delete.

**Rule 3 — When you learn something new, decide where it goes** (in order):
1. Useful only for *this project*, or for *future projects too*? → project-only ⇒ **project docs, not a skill.** *(This first fork is really Branch #3's job — named here, decided there.)*
2. Reusable ⇒ **which skill** does it belong to? *(also Branch #3.)*
3. Inside that skill ⇒ **general tip → shared file; specific to one thing → that thing's file;** a whole new ability → new `tools/` + a knowledge note + **one line** in `SKILL.md` (the only edit that touches the lean core).

**Rule 4 — Rules for what you're allowed to write down.**
- Only write what you **tested and confirmed.** Guesses go in a separate "open questions" section — never inline as if fact.
- **Date** it.
- Say **where** you learned it (session / PR / capture) so it can be re-checked.
- Point at something **precise and stable** (the actual selector/ID), not a vague description ("the button near the top").

**Rule 5 — Keep notes short and non-repeating.**
- Write what **to do**, not long lists of what not to do.
- Each fact lives in **exactly one spot**.
- Use short known terms instead of long explanations (say "debounce," don't describe it).

### Two seams (belong to other branches — flagged, not decided here)
- **Rule 3's first fork** (project-only vs reusable, and which skill) → **Branch #3** (capture/routing loop).
- **Rule 5's style tips** also apply when a skill is first *created* → owned by the skill-authoring skill (`write-a-skill` / `superpowers:writing-skills`); `maintaining-skills` **references** them rather than restating (that *is* Rule 1). → touches **Branch #6**.

---

## LOCKED — Branch #3: capture / routing loop (2026-07-17)

**The problem it fixes:** knowledge learned mid-work evaporates. Root cause — writing it down forces the decision *"where does this go?"*, that decision is the expensive part, so it gets skipped, and skipping it means the note gets skipped too. **Noticing and filing are glued together; unglue them.**

### Stage 1 — Notice (free, during work)
The instant something notable comes up, drop **one line** into a file. No thinking about where it belongs. This rides on **`context-capture`** (already always-on, already writing to the working file) — a **new lane in an existing mechanism**, not a new one. Must land in a **file**, not just the chat (compaction eats the chat).

### Stage 2 — Sort (later, at a natural stopping point)
One pass over the captured lines. The "**reusable vs project-specific?**" question is **NOT a real fork** — nearly everything is reusable (same stack/scenario recurs in future projects). So don't agonize; **flip the default:**
- **Default → a skill.** Edit an existing skill, or **create a new stub skill right here.** (This is where `maintaining-skills` → **Grow** runs.)
- **Rare exception → project docs.** Only genuinely one-app things: product/business decisions and this-app-specific architecture (e.g. *"we chose Supabase for this app"*). Everything else → a skill.

### No global inbox (rejected 2026-07-17)
A reusable note with **no skill yet** does **not** go to some external inbox — you **create a local skill for it on the spot** (a rough stub is fine). If it proves useful, it gets promoted up to the global repo later (Branch #4).

### Why local skills make this safe
Skills are **local and git-tracked in a clone you own**, so every edit the agent makes **shows up in git and you can review it.** That is the fix to the real pain — "global/installed skills where you don't know where they live and never see the edits." (Install/promote **mechanics** = Branch #4, mattpocock-style: clone the hosted skills repo → install command → pick skills → edit locally → push worthwhile edits back up.)

### The whole loop in one line
**Notice → one free line into a file → at a stopping point, sort each line: default a skill / rare project docs → a note with no skill yet becomes a new local skill → worthwhile local skills + edits get promoted up to the global repo.**

### Seams (decided elsewhere)
- Install / publish / promote-up mechanics → **Branch #4.**
- Seeding proven skills into a *new* project → **Branch #5.**
- "No skill yet → create one" as the skill-birth trigger → **Branch #6.**

---

## LOCKED — Branch #4: publishing / packaging (2026-07-18)

**The load-bearing correction:** the interactive installer the user liked from mattpocock (pick skills / pick agents / pick global-vs-project) is **NOT** Claude Code's native plugin system. There are **two separate distribution tools**, and a repo can satisfy both at once (mattpocock does):
- **Claude Code native plugins + marketplace** — `.claude-plugin/plugin.json` (+ `marketplace.json` catalog). Install via `/plugin marketplace add owner/repo` → `/plugin install name@marketplace`. **All-or-nothing per plugin** (you get every skill in it; skills namespaced `/plugin:skill`). No built-in per-skill pick unless you split each skill into its own plugin (painful). Two public marketplaces exist (`claude-plugins-official` curated, `claude-community` submissions). Versioning: explicit `version` field, else git SHA = every commit is "latest."
- **`npx skills add owner/repo`** (skills.sh, now **`vercel-labs/skills`**) — the interactive picker: pick individual skills (`--skill`), pick agents (`-a claude-code cursor codex`), pick scope (project `./` or global `~/` via `-g`), **symlink by default** (`--copy` to copy). Cross-agent. Needs only `SKILL.md` files with `name`+`description`; a `marketplace.json` is optional gravy. Subcommands: `add`, `use`, `list`, `find`, `update`, `remove`, `init`.

### The decisions

**1. Two repos.**
- **Repo A — the workflow template** (`agentic-workflow_v2` as it stands): `CLAUDE.md`, the `docs/` scaffold, **and the core "how to work" skills**. You clone this to *start* a project. It is the engine.
- **Repo B — the skills catalog**: the "what I know about tool X" skills (turborepo, supabase, tsconfig, debug-web-pages, ts-packages, …). Grows forever; installed piece-by-piece.
- Different rhythms justify the split: the template is cloned once at project start; the catalog is added-to continuously and installed selectively.

**2. No git submodules.** For developing both at once, keep two ordinary clones side-by-side in one local folder on the machine (what the user meant by "single root"). The template references the catalog by **install command / URL**, never by file path, so no submodule pinning is needed. (Submodules rejected: forgotten pushes, pinned commits, detached heads.)

**3. Where the core skills live — Option 1 (LOCKED).** The "how to work" skills (`brainstorming`, `writing-plans`, `executing-plans`, `verification`, `finishing-a-branch`, `project-init`, `maintaining-skills`) live **inside the template repo (A)**, not the catalog. Rationale (user's words): *they're part of the workflow, not external add-ons — they evolve together with `CLAUDE.md` and the workflow rules, so one repo = one coherent version.* The catalog (B) holds only the stack/tool knowledge skills, which live their own life. (Rejected alternative — Option 2: one skills home for everything with the core skills in a `flow/` bucket.)

**4. Link, never hard-copy.** The template ships *with* skills already installed, but as **links (symlinks) into a clone of the source repo**, not frozen copies. Then `git pull` on the source updates every project that points at it — the user pulls to push improvements out, downstream users pull to receive them. This is the whole reason to link: copies are frozen snapshots, links stay live. (`npx skills` symlinks by default; a small link-script does the same. `--copy` stays available for a stranger who'd rather a self-contained copy that survives folder moves — not locked out, just not the default.)

**5. Distribution — ship both doors** (cheap, because both read the same `SKILL.md` folders):
- Catalog (B): `npx skills`-installable (this is the pick-skills/agent/scope menu) **and** carries a `marketplace.json` so it also shows as a Claude Code marketplace.
- Engine (A): the core skills are a set you want *whole* → a single plugin bundle fits; the template also *is* the "clone to start" scaffold.

**6. Release discipline — deferred.** Start with **no version numbers** (Claude Code treats "no version" as "every commit is latest" — right for a fast-moving solo dev). Add explicit versions + a changelog tool (mattpocock uses `changesets`) **only once strangers install and start getting surprised by changes.** Don't pay that tax before anyone is downstream.

### The author's edit loop (grounded in real tooling)
Keep a real git clone of the catalog → symlink it into `~/.claude/skills` → edit **in the clone** (every change visible + git-tracked, which is the "I want to see the edits" requirement) → `git push` = promoted up → others `git pull` / `skills update` to receive it. This is Branch #3's locked model with the actual commands filled in.

### Seams (decided elsewhere)
- Seeding proven skills into a *new* project at init → **Branch #5.**
- "No skill yet → create one" as the skill-birth trigger → **Branch #6.**

---

## LOCKED — Branch #5: Init integration seam (2026-07-30)

Walked under `design-init-flow.md`'s standing principle (the only user is the author). The branch as written — *"read the tech spec → recommend/import relevant skills (external + personal) → scaffold project-local capture"* — is three clauses. Two die, one defers, and what remains is a check rather than an integration.

**Scaffold project-local capture — DEAD.** Capture moved into `flow/CLAUDE.md` `## Capture` (`design-capture-rework.md`), and `inbox.md` is created on first write. It arrives with the payload; there is nothing to scaffold.

**Recommend from the tech spec — DEFERRED, no recommender.** It never applied to the process skills: those are *mandatory*, not recommended — Flow doesn't run without them, and `check-skills.sh` already enforces presence at SessionStart. It only ever applied to stack/knowledge skills, and the catalog holds **zero** of those today (all eight are process or domain skills). A recommender over an empty candidate set is machinery built ahead of its input. When stack skills exist, `npx skills add`'s own per-skill picker is already the selection UI; `init-flow`'s whole contribution would be one line naming a match against the stack it detected while harvesting. Revisit then.

**External skills — DROPPED.** Recommending third-party skills means `init-flow` carrying a registry of other people's work and keeping it current. The author installs what he wants.

**What `init-flow` actually does about skills: verify, never install.** Skills are globally symlinked on the author's machine (session 13 — one symlink per skill into the catalog clone), so on his own machine every project already has them and a per-project install is redundant. Flow's own hard rule forbids running install commands anyway. So the step is the check `check-skills.sh` already performs, run once at init: anything missing → print `npx skills add Adrian333Dev/flow-skills` and let the user run it. The hook ships in the payload and takes over from the next session.

**Found while walking — `check-skills.sh` is stale.** Its required list is `brainstorm research explain note organize execute`: `note` is dissolved and archived, and `handoff` + `curate-skills` are missing. `debug-web-pages` is correctly absent — it's a domain skill, not required. → `new-workflow/backlog.md`.

**Net: the branch closes without a seam.** The genesis-#4 seeding link it was named for is a no-op for a globally-symlinked author.

---

## Reference pointers
- `tmp/debug-web-pages/` — the reference implementation (SKILL.md, DESIGN.md, ROADMAP.md, MAINTAINING.md, `knowledge/domains/youtube-watch.md`, `knowledge/domains/_TEMPLATE.md`, `knowledge/capturing-and-querying.md`).
- `mattpocock/skills` (studied in `tmp/repos/skills/` per debug-web-pages ROADMAP) — the personal-skills-repo publishing model.
- `framework-build/docs/guides/` + `docs/design-session.md` D35–85 — the earlier guide-system take on this same problem (3 tiers core/domain/stack, `list-guides.sh`, D69 notes-first review-gated update model). Historical; superseded by the skill-as-unit model but the tier idea + update model inform #2.
- `new-workflow/agent-toolkit/` — external skill plugin (react-dev, react-useeffect, database-schema-designer) = examples of general/reusable skills to reference, not duplicate.
- `design-project-genesis.md` — the front-of-lifecycle doc; #7 pointer + the seams (#5 init integration, #3 capture-routing).
