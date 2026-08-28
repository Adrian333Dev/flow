# agent-skills — authoring conventions

How they write skills, and how their conventions compare to Flow's.

---

## Their system: docs/skill-anatomy.md

The authoritative spec. Key rules:

**Structure**:
- Every skill lives at `skills/<name>/SKILL.md` — one folder per skill, constant filename.
- `SKILL.md` is the only required file. `scripts/` and `references/` (or other supporting files) are added only when the skill actually needs them.

**Frontmatter** (required):
```yaml
---
name: skill-name-with-hyphens
description: <what the skill does in third person>. Use when <trigger conditions>. Max 1024 characters.
---
```

The description has a strict job: it must tell the agent both what the skill provides and *when to activate it*. The prohibition is explicit: do not put process steps in the description — if the summary contains steps, the agent may follow the summary instead of reading the full skill.

**Standard section shape** (recommended, not mandatory):
1. Overview — elevator pitch, why the skill exists
2. When to Use — positive triggers + "When NOT to use" exclusions
3. Core Process / The Workflow / Steps — the step-by-step, the heart of the skill
4. Common Rationalizations — excuses agents use to skip steps, paired with factual rebuttals
5. Red Flags — observable signs the skill is being violated
6. Verification — exit checklist with evidence requirements (not vague "confirm X is done")

Equivalent headings are acceptable. The intent matters more than the label.

**The most distinctive section: Common Rationalizations**. Every skill has a table of "excuse | reality" pairs. This is the anti-sycophancy mechanism — the skill pre-empts the arguments an agent would use to skip important steps. Examples: "I'll write tests after the code works" → "You won't. And tests written after the fact test implementation, not behavior." These tables are the sharpest thing about this skill library and have no equivalent in most skill systems.

**Size target**:
- Keep `SKILL.md` under 500 lines. Move detailed reference material to supporting files.
- Supporting files are created only when content exceeds 100 lines *or* scripts are needed.
- Empty `scripts/` directories are explicitly forbidden.

**Progressive disclosure**: `SKILL.md` is the entry point. Supporting files are read only when the workflow reaches them (not preloaded). One level of linking only — SKILL.md links to supporting files, never through intermediate documents.

**Context efficiency principle**: prefer scripts over inline code blocks, because executing a script consumes no context while inline code is loaded on every read.

**Shared vs. skill-specific references**:
- Checklists used by more than one skill (security, testing, performance, accessibility, definition-of-done) live in `references/` at the repo root.
- Material used by exactly one skill is a loose supporting file in that skill's directory.
- The gap: a per-skill copy of `skills/<name>/` without the repo root is missing these shared references — tracked as an open issue.

**Cross-skill references**: by name only — `Follow the test-driven-development skill` — never by path, never copy-pasted content.

**Naming**:
- Skill directories: `lowercase-hyphen-separated`
- `SKILL.md` always uppercase
- Supporting files: `lowercase-hyphen-separated.md`
- Names are noun-phrase or gerund-derived (`spec-driven-development`, `debugging-and-error-recovery`) — not verb-first

**Script requirements** (when scripts exist):
- `#!/bin/bash` shebang
- `set -e` fail-fast
- Write status to stderr, machine-readable output (JSON) to stdout
- Cleanup trap for temp files
- Reference as `skills/<skill-name>/scripts/<script>.sh` (repo-relative)

**Writing principles**:
1. Process over knowledge — steps, not facts
2. Specific over general — "run `npm test`" beats "verify the tests"
3. Evidence over assumption — every verification checkbox requires proof
4. Anti-rationalization — every skip-worthy step needs a counter-argument
5. Progressive disclosure — main SKILL.md is the entry point
6. Token-conscious — if removing a section wouldn't change agent behavior, remove it

---

## Their CONTRIBUTING.md additions

Before proposing a new skill:
1. Search for existing overlap — many proposals partially overlap existing skills
2. Check open PRs — clusters of near-duplicate proposals exist
3. Read skill-anatomy.md to confirm the idea fits (actionable workflow, not vague advice)
4. In the PR, justify explicitly why this isn't covered by an existing skill

Every skill must ship with an eval case file at `evals/cases/<skill-name>.json` containing at least 3 positive triggers, 2 negative triggers, and 1 behavioral eval. CI enforces this.

---

## Flow's system: skills/CLAUDE.md

**Structure**: Same physical convention — one folder per skill, `SKILL.md` constant filename.

**Frontmatter**:
```yaml
---
name: <name>
description: <one line>
# optionally:
disable-model-invocation: true
---
```

`disable-model-invocation: true` marks a skill as user-invoked only. agent-skills has no equivalent flag — all skills are model-invokable; the distinction is handled by description precision.

**Size**: Under ~300 lines is fine; up to ~500 is acceptable when the material earns it. Matches their 500-line guidance almost exactly.

**Split policy**: Split a skill into sub-files only when parts are genuinely conditional — read on some runs and not others. Splitting content needed every run just buys extra reads.

**Naming**: Verb-first. `execute`, `research`, `brainstorm`, `write-spec.md`, `create-tickets.md` — never gerunds or noun forms.

**Style**: Telegraphic. Every sentence earns its place. No filler, no restating what the agent already knows, no rules already stated as hard rules elsewhere.

**No shared references folder**: Flow's skills do not share a cross-skill references directory. There is no equivalent to their `references/` tree.

**No changelogs** (as of 2026-08-09 — suspended until v1): they are suspended entirely.

**Description length by invocation type**: Model-invoked → full "what AND when." User-invoked → short, general. This is the same as their guidance.

---

## Point-by-point comparison

| Dimension | agent-skills | Flow | Who wins |
|---|---|---|---|
| Section shape | 6 named sections, recommended not required | None prescribed — telegraphic density is the only rule | Draw — their shape is more teachable; Flow's density is more efficient in context |
| Common Rationalizations | Every skill has an excuse-table with rebuttals | None — no anti-rationalization mechanism | **Theirs win.** This is the most effective behavioral mechanism in their library. Worth stealing. |
| Red Flags | Every skill has observable violation signals | None explicitly | **Theirs win.** Red flags give reviewers and the agent itself a checklist for self-monitoring. |
| Verification checklist | Every skill ends with evidence-based exit criteria | None explicitly | **Theirs win.** Flow's skills end at the last instruction, leaving the "is this done?" question open. |
| Naming convention | Noun-phrase/gerund: `debugging-and-error-recovery` | Verb-first: `execute`, `research`, `debug-web-pages` | Flow wins for agent invocation (verb-first maps to how tasks are phrased: "execute this ticket"); theirs wins for human browsability |
| Size enforcement | Hard cap: 500 lines, move excess to supporting files | Soft cap: 300–500 lines, same split principle | Draw |
| Supporting files | Conditional (read some runs): fine. Unconditional: inline it. | Identical rule | Same |
| Shared references | `references/` at repo root for cross-skill material | None — each skill is standalone | **Theirs is cleaner** for a large library; Flow's approach (9 skills) doesn't need this yet |
| Evaluation/testing | Full eval system with 3 tiers | None | **Massive gap.** Flow has no way to verify a skill works. |
| Cross-skill refs | By name only, no path | Same | Draw |
| Script conventions | Formal: shebang, set -e, stderr/stdout split, cleanup trap | Less formal: `scripts/` subfolder, executables live there | Theirs is stricter and more production-grade; Flow's is simpler |
| Description discipline | No process steps in description (enforced by eval tier 2) | Same principle, not enforced | Their CI enforcement is better |
| Anti-sycophancy | Explicit in Common Rationalizations section | Implicit in Judgment section of CLAUDE.md | **Theirs is more actionable** — per-skill, specific to that skill's failure modes |
| Telegraphic compression | Not a house rule — skills are verbose | Core convention | **Flow wins** — their skills are 1200–3200 words each; Flow targets 300–500 lines. Both have the right idea but Flow enforces it harder. |

**The three biggest differences:**

1. **Common Rationalizations**: their skill-level excuse tables are the most concrete anti-rationalization mechanism in either system. Flow has Judgment in CLAUDE.md as a global principle, but nothing that says "here is the specific excuse you will use to skip this step, and here is why it is wrong." This is directly adoptable.

2. **Verification checklists**: every skill ends with a numbered checklist of evidence-based exit criteria. Flow's skills give instructions but no exit gate. Adding these would make Flow's skills self-auditable.

3. **Testing infrastructure**: their 3-tier eval system can measure whether a skill routes correctly and changes behavior as claimed. Flow has no equivalent. This is not easily stolen — it requires a test runner, fixture files, and ongoing maintenance — but the *concept* of routing tests (positive/negative trigger prompts) is lightweight and stealable.
