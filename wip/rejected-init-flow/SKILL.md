---
name: init-flow
description: Install or update the Flow workflow template in this repo — fetch the template, quarantine what collides, write the payload, harvest the facts worth keeping out of what was there.
disable-model-invocation: true
---

# Init Flow

> **⚠ REJECTED 2026-08-02 — DO NOT USE, DO NOT PATCH.** The design under this file was inverted: Flow's rules, scripts and settings move to `~/.claude/`, brainstorming a product happens with no repo and no install, and the only case needing a skill is an existing codebase. This file is kept only as the input to its rewrite as `migrate-to-flow`. Read `new-workflow/design-init-flow.md` → `## SESSION 2026-08-02 — Flow goes global` first. Still registered in `plugin.json` / `README.md` — deregistering is the user's call.

Lands Flow in this repo. One path for every starting point — empty repo, existing codebase, repo already on Flow.

Flow **replaces** whatever workflow is here; it does not merge with it. Facts about the project carry over. Process instructions — session rituals, doc-reading orders, skill overrides — do not; Flow ships its own. **Nothing is ever deleted**, at any phase.

**Template source:** `https://github.com/Adrian333Dev/flow` — fetched at run time, the only place this URL appears.

Payload scripts don't exist on disk until Phase 3. Use normal tools before that.

---

## Phase 0 — Assess, then propose

Read the ground in one parallel batch:

- `git status --short` and whether `.git` exists at all
- root: `CLAUDE.md`, `AGENTS.md`, `.gitignore`, `package.json` (or the stack's manifest)
- `docs/`, `.claude/`, `scripts/` — names only, one level deep

Classify:

| State | Signal | What runs |
|---|---|---|
| **Fresh** | no `CLAUDE.md`, no `docs/`, no `.claude/settings.json` | Phases 1, 3, 4, 5, 7 — nothing to quarantine or harvest |
| **Existing** | any of those present, no Flow marker | all phases |
| **Already Flow** | `scripts/check-skills.sh` present **and** `CLAUDE.md` has `## Workflow` + `## Capture` | the update path below, not Phases 2/5/6 |

**Two stop conditions**, both only when there is material to quarantine:

- **No `.git`** — quarantine's safety rests on the move being recoverable and reviewable. Stop; ask for `git init` plus a first commit.
- **Dirty tree** — a move on top of uncommitted edits is unreviewable. Stop; ask for a commit.

Never run either command (hard rules). Name it, stop, wait.

**Then propose and wait.** One gate for the whole run: every path that will be quarantined, every file that will be written, and that the run ends with a restart. Nothing is touched before approval. That gate is also what catches a `docs/` holding a real documentation site rather than agent notes — if it does, the user says so here and it stays put.

---

## Phase 1 — Fetch the template

```bash
git clone --depth 1 <template source> tmp/flow-template
```

`tmp/` is gitignored by Flow and by most repos. The clone is deleted at the end of Phase 3.

---

## Phase 2 — Quarantine what collides

Move colliding material to `docs/intake/`. The payload write never negotiates with what's already there.

**Moves** — `mv`, not `git mv` (the deny list blocks it; git detects the rename anyway). Mirror the repo-root-relative path so origin needs no manifest, de-dotting leading dots:

| From | To |
|---|---|
| `CLAUDE.md`, `AGENTS.md` | `docs/intake/CLAUDE.md`, … |
| everything under `docs/` except `docs/intake/` | `docs/intake/docs/…` |
| `.claude/settings.json` | `docs/intake/dot-claude/settings.json` |
| `scripts/tree.sh`, `scripts/merge-files.js`, `scripts/check-skills.sh` — same names only | `docs/intake/scripts/…` |

Then write `docs/intake/README.md`: what the folder is, the date, that paths mirror the repo root with leading dots spelled `dot-`, and that a later `brainstorm` full-product run is what reads it.

**Three things do not move:**

- **`.gitignore` appends, never replaces.** Add `tmp/` if absent; touch nothing else. Replacing it would start tracking `node_modules/`, `dist/`, `.env` on the next commit.
- **`.claude/settings.local.json` stays.** Gitignored personal state — moving it into tracked `docs/intake/` commits machine-local config. Read it once and report any key that overrides a Flow one; a local permission entry can silently undo the git deny list.
- **`.claude/agents/`, `.claude/commands/`, `.claude/skills/`.** Flow writes none of those paths, so nothing collides. Report project-local skills that duplicate catalog skills — deleting them is the user's separate call.

`.claude/settings.json` gets no carve-out. It carries hooks, MCP servers, env, statusline and model config, not just an allow/deny list — merging it means negotiating with arbitrary foreign config, the exact thing this phase removes. Flow writes its own; specific keys come back in Phase 6.

Report every move.

---

## Phase 3 — Write the payload

Copy from the clone. Six files ship:

```
CLAUDE.md
.claude/settings.json
scripts/tree.sh
scripts/merge-files.js
scripts/check-skills.sh
docs/work/backlog.md
```

`chmod +x scripts/*.sh`, then delete `tmp/flow-template/`.

**`README.md` and `recommended-tools.md` never ship.** The README describes the template to someone evaluating it — copying it overwrites the project's own README. `recommended-tools.md` is identical in every project and goes stale on its own schedule; it stays in the template repo and is read there.

**Nothing else in `docs/` is scaffolded.** `docs/context/`, `docs/research/`, `docs/spec/`, `docs/work/inbox.md` are created on first write by whatever needs them. Empty folders teach nothing and invite filler.

---

## Phase 4 — Check skills, never install

```bash
bash scripts/check-skills.sh
```

Silent means everything is present. Anything missing → print `npx skills add Adrian333Dev/flow-skills` and let the user run it. Never run it (hard rule). From the next session the SessionStart hook does this check automatically.

---

## Phase 5 — Fill what's knowable

**`## Project`** — only what the repo already proves. Name from the manifest or folder; stack from manifests and the lockfile; structure (single app / monorepo / library) from workspace config. Fresh repo: leave the placeholders. Everything else stays placeholder until a spec exists — `CLAUDE.md` is derived from `docs/spec/`, and no spec exists at init on either path.

**`## The user`** — one interview round, one message, short answer accepted: role, stack expertise, notable gaps. This is the only section knowable at init on both paths, and every explanation calibrates against it.

**`## Preferences` and `## Project rules` stay empty here.** Preferences are inferred over time by `## Capture`. Rules arrive in Phase 6 or from a spec.

---

## Phase 6 — Harvest from intake

Existing repos only. Read their files, lift the individual facts worth keeping, discard the rest — copying sentences, not moving files.

```bash
node scripts/merge-files.js docs/intake --ext md
```

Over 2000 lines it reports per-file counts instead; read in batches from there.

**Three destinations, and no fourth:**

| Harvested | Goes to |
|---|---|
| Rule about the code that conventions don't imply | `CLAUDE.md` → `## Project rules` |
| Verified command | `docs/context/commands.md` |
| Other durable project fact | `docs/context/<subject>.md` |

**Never `docs/spec/`.** Writing a spec from their docs means reading everything, reconciling documents written months apart, and deciding what the product is now. That is `brainstorm`'s full-product mode, offered in Phase 7. A half-harvested spec is worse than none, because `CLAUDE.md` and the backlog derive from it.

**Verified means checkable now** — the command appears in `package.json` scripts or a Makefile, or the intake file states it works. Anything marked unverified is dropped. An unverified command is worse than none: the agent runs it, it fails, and the read plus the failure are both wasted.

**Four rules for every `docs/context/` file:**

1. Answers one question — what would a fresh session get wrong without this?
2. Facts, not process. Process is a skill.
3. Verified only.
4. Rewrite on change, never append. Git holds the old text.

**Routing test when it could be a skill instead: would this sentence be true in a different project?** Yes → portable knowledge; flag it in `docs/work/backlog.md` as `needs skill: <topic> — <note>` and move on. Never create a skill here. No → `docs/context/`. In-between content splits — the portable principle gets flagged, the local specifics get written. Genuinely can't tell → `docs/work/inbox.md`, raw, for `organize` later.

**Also harvest from the quarantined `settings.json`:** their MCP servers and permission entries for their own tooling are facts and carry over into the new `.claude/settings.json`. Their hooks are process and get dropped.

Everything not harvested stays in `docs/intake/`, untouched.

---

## Phase 7 — Close

1. **Restart Claude Code.** Settings load at startup, so the hook and the deny list are inert until then. Say this plainly — it is the one action the user must take.
2. **Report** what was quarantined, what was written, what was harvested and where, and anything flagged to backlog or inbox.
3. **Offer the next move, declinable:** `brainstorm` in full-product mode, to build `docs/spec/`. On an existing repo it reads `docs/intake/` first. Offer it; don't start it.

---

## Updating a repo already on Flow

Re-running is how a Flow project moves to a newer template. Phases 0, 1, 4, 7 run unchanged. Phases 2, 5 and 6 are replaced by a reconcile — no quarantine, no intake, no interview.

`CLAUDE.md` splits on its `---` divider, and that split is the whole rule:

| File | Rule |
|---|---|
| `CLAUDE.md` **above** the `---` (`## Project`, `## The user`, `## Preferences`, `## Project rules`) | project-owned — never touched |
| `CLAUDE.md` **below** the `---` (`## Workflow`, `## Scripts`, `## Explaining`, …) | template-owned — replaced wholesale |
| `scripts/*` | template-owned — overwritten |
| `.claude/settings.json` | add new template keys, keep project additions, report any key where the two now disagree |
| `docs/work/backlog.md` | never touched — it has content |
| `.gitignore` | append `tmp/` if absent |

Show the below-the-divider diff before applying it. There is no version stamp to read; the fetched template and what's on disk are the only two inputs.

---

## Hard rules

- **Propose the whole run and wait.** One gate, Phase 0. Nothing is written before it.
- **Nothing is deleted.** Ever, on any path. Collisions move; they don't vanish.
- **Never install and never mutate git.** Name the command, stop, let the user run it.
- **The payload write never negotiates.** Merge logic is what quarantine exists to remove.
- **`.gitignore` is the only file that merges.**
- **Harvest never writes `docs/spec/`.**
- **Report every move and every write.** A silent quarantine is the worst outcome this skill can cause.
