# Framework Build Session

_Last updated: 2026-06-29. Status: commands + visualization guide done. Next: core workflow guides._

---

## What's built in `framework-build/`

### `docs/commands/` — all done and tested

| File | What it does | Status |
|---|---|---|
| `list-guides.sh` | Lists all guides with descriptions. Fully recursive. Output: `- path \| description` | Done + tested |
| `merge-files.js` | Merges files/folders to stdout as fenced code blocks. Threshold: 2000 lines. Flags: `--ext`, `--except`, `--force`. | Done + tested |
| `tree.sh` | Filtered directory tree. Hidden files always on. Flags: `--depth N`, `--except pattern`. | Done + tested |

### `docs/guides/` — converted and organized

| File | Tier | Status |
|---|---|---|
| `core/guides.md` | core | Done — meta-guide for writing/maintaining guides |
| `core/comments.md` | core | Done |
| `core/testing.md` | core | Done |
| `core/visualization/GUIDE.md` | core | Done — text formats + HTML sketch rules + layout principles |
| `core/visualization/html-sketch.html` | core | Done — reusable HTML template (zinc CSS vars, no component structure) |
| `domain/chrome-extension.md` | domain | Done |
| `domain/chrome-extension-spa.md` | domain | Done |
| `domain/chrome-extension-youtube.md` | domain | Done |

All guides have proper YAML frontmatter (`name` + single-line `description`).

---

## Decisions locked this session (D81–D85)

- **D81**: visualization guide is a folder (`visualization/GUIDE.md` + `html-sketch.html`)
- **D82**: HTML template = infrastructure only (zinc vars, body, toggle, scenario wrapper) — no component CSS
- **D83**: Layout governed by universal principles, not named modes (isolation, external labels, real UI only, realistic dims, consistent scale, left→right ordering, ~4 col max)
- **D84**: Explanation sequencing: plain text first → HTML when needed; stop if mental model correction; fix all at once
- **D85**: One-shot rules: copy template, realistic dims, left-border + color-mix accents, no opacity stacking, external labels, dark default + toggle

Total decisions: **85**.

---

## What's NOT built yet

### Core workflow guides (highest priority — next)
- `docs/guides/core/brainstorm.md` — **draft exists but NOT final.** The "four phase" structure in design-session.md D27 was preliminary, not a finalized framework. Needs a full brainstorm session before the guide can be properly written. Draft file exists at `framework-build/docs/guides/core/brainstorm.md` — treat as scratch, not source of truth.
- `docs/guides/domain/db-design.md` — **next up.** Working notes at `temp/refs/db-design-guide-notes.md`. Key insight: force access-pattern thinking before schema design. Two use cases: green-field design and mid-project feature addition (most common). ORM-agnostic output.
- `docs/guides/core/handoff.md` — replaces /checkpoint; how to save session state
- `docs/guides/core/verify.md` — verification before completion
- `docs/guides/core/review.md` — ad-hoc code review
- `docs/guides/core/execute.md` — implementation execution guide (behavior locked in D66)
- `docs/guides/core/debug.md` — adapted diagnosing-bugs (behavior locked in D52-D53)

### Framework structure
- `CLAUDE.md` template — first draft rejected; needs fresh approach
- `docs/work/now.md` template
- `docs/guides/tools.md` (skeleton)

---

## Key design decisions to keep in mind

- Agents read guides **on demand** — never auto-triggered.
- **Never run git mutations** — suggest commands only.
- **Never edit guide files mid-session** — write notes to `docs/work/milestones/<slug>/guide-notes.md` instead.
- Guide folder structure: main file is always `GUIDE.md`, not the guide name.
- Session start: `context.md` → `handoff.md` → `now.md`. Read minimum files.
- `merge-files.js` stdout only — one call, no file to read after.
- `--except` in both merge-files and tree matches: exact path, basename, path segments, and glob patterns.

---

## File locations reference

| What | Where |
|---|---|
| All framework files | `framework-build/` |
| Locked decisions (85 total) | `framework-build/docs/design-session.md` |
| Delapse reference | `temp/local-refs/delapse/` |
| UX explanation methods (source for visualization guide) | `temp/ux-explanation-methods.md` |

---

## Strategic pivot (2026-06-30)

**Plan changed.** Building the custom framework from scratch is taking too long. New approach:

1. **Immediate:** Build a "new version of the agentic-setup workflow" — a new plugin combining modified Superpowers + agent-toolkit + other selected skills. This unblocks the user now.
2. **Later:** Continue building the custom framework (all files in `framework-build/`) after unblocking.

The new plugin is NOT a clean fork — it's a curated combination of multiple skill sources, modified where needed.

### Sources to draw from

| Source | Location | Status |
|---|---|---|
| Superpowers | `temp/repos/superpowers/` | Cloned. Key skills identified. |
| agent-toolkit | `temp/repos/agent-toolkit/` | Cloned. Skills catalogued at `temp/refs/agent-toolkit.md`. |
| mattpocock skills | TBD | Not yet cloned. |
| taste-skill | Reference at `temp/refs/taste-skill.md` | Not yet tried. Try on real UI task first. |
| ui-ux-pro-max-skill | TBD | Not yet seen. |

### Key Superpowers problems to fix in the new plugin

- **Brainstorming**: 9-step forced process with HARD-GATE → strip down to conversational exploration, no forced design doc, no mandatory commit, no forced transition to writing-plans
- **using-superpowers**: "1% chance → must invoke" causes constant over-invocation → soften
- **SDD**: Remove or heavily neuter
- **Git mutations**: Remove from all skill steps (brainstorming step 6 says "commit")
- **AskUserQuestion tool**: Prohibit in CLAUDE.md
- **Post-compaction reset**: Fix so hard rules survive compaction

### Debugging principle (for debug skill)

Agent must not state a cause without evidence. Rule: "A hypothesis is not a cause. If you haven't proven X is the root cause, say 'Hypothesis: X might cause this — verify by doing Y.' Don't state it as fact."

### db-design guide (still pending)

Brainstorm is done. Plan:
- Base: Skill-4 (agent-toolkit database-schema-designer)
- Add: Skill-3's access-pattern requirement questions as mandatory gate
- Add: Skill-1's index analysis SQL, zero-downtime migration pattern, keyset pagination
- Modify: Remove Quick Start, remove ORM syntax, add mid-project critique mode
- Convert to guide frontmatter format

This can be written any session — full context is at `temp/refs/db-design-skill/db-design-guide-notes.md`

---

## On resume

1. Read this file
2. Read `temp/refs/db-design-skill/db-design-guide-notes.md` — db-design guide brainstorm notes
3. Next action: **plan the new agentic-setup plugin** — gather remaining sources (mattpocock, ui-ux-pro-max-skill), then plan what goes in and what gets modified
4. db-design guide can be written any time — context is fully captured

## Guide build status (2026-06-30)

| Guide | Status |
|---|---|
| `core/guides.md` | Done |
| `core/comments.md` | Done |
| `core/testing.md` | Done |
| `core/visualization/GUIDE.md` | Done |
| `core/visualization/html-sketch.html` | Done |
| `core/brainstorm.md` | **Draft only — NOT final.** Needs full brainstorm session. D27 phases were preliminary ideas, not a locked framework. |
| `domain/db-design.md` | **Not started.** Next. |
| `domain/backend-design.md` (name TBD) | **Not started.** Follow-on after db-design. |
| `core/handoff.md` | Not started |
| `core/verify.md` | Not started |
| `core/review.md` | Not started |
| `core/execute.md` | Not started |
| `core/debug.md` | Not started |

_Updated: 2026-06-29._
