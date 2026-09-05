# Knowledge system — design

Research is complete. The design discussion locked all decisions across 5 sessions, the last of them 2026-09-05, which closed the semantic-rule gap the enforcement bridge had left open. This file carries the locked decisions, the research inventory, and the build plan.

## Locked decisions — the knowledge system

### The name

The mechanism is the **knowledge system** — it captures, stores, surfaces, and maintains what the agent learns across sessions and projects. "Knowledge system" over "memory system" because memory is passive (store and recall); what Flow builds is active (capture, organize, promote, age, enforce).

### Capture — `.flow/findings/<subject>.md`

During work in any phase, the agent writes reusable knowledge directly to `.flow/findings/<subject>.md` — one file per subject, organized by topic, not chronologically. A Prisma finding goes to `.flow/findings/prisma.md`. A prompting technique goes to `.flow/findings/prompting.md`. Files can be 10 lines or 500 lines — research output, tool behavior details, library quirks, conventions discovered.

**Format**: plain markdown with sub-topic headings (`## Connection pooling`, `## Migration quirks`). No frontmatter, no metadata. File-findings routes by content, not by when something was captured. New findings on the same sub-topic update the existing section (topic-key upsert).

**Duplicate filter**: before writing to findings, check whether the loaded skill already covers it. If it does, skip. Contradictions and extensions are new knowledge — write them, and file-findings edits the skill when promoting.

The inbox (`.flow/inbox.md`) stays for work items: potential tickets, fragments, half-formed ideas. Knowledge and work items are different streams captured to different places.

The Capture section in `home/CLAUDE.md` needs one routing-rule addition: reusable knowledge → `.flow/findings/<subject>.md`, inserted between the project-fact line and the decisions line. The "everything else → inbox" catch-all stays. If the agent knows the knowledge is reusable and knows the subject, findings. If unclear, inbox.

### Promotion: `/file-findings`

`/file-findings` is the single mechanism that moves knowledge from project-local capture to its global destination. It reads 5 inputs:

- `.flow/inbox.md`, work items
- `.flow/findings/*.md`, knowledge captured during work
- Closed unfiled tickets
- The groundwork map this session closed
- `flow scorecard`, how the existing checks are doing

It routes each item:

- Descriptive knowledge with a matching skill → that skill's `references/`
- Universal prescriptive rule → `rules/<topic>.md` (symlinked to `~/.claude/rules/`)
- Stack/context prescriptive rule → `rules/<topic>.md` with `paths:` frontmatter
- Project-specific prescriptive rule → `.claude/rules/<topic>.md`
- Project-specific fact → `docs/context/<subject>.md`
- No matching skill → flag in inbox as `needs skill: <group>/<subject> (<note>)`
- Work item → ticket or stays in inbox

Filed items are cleared from findings and inbox. Findings files fully drained are deleted, never emptied, because an empty file with a subject name is noise.

**Every rule written or changed gets its check in the same pass**, wherever a function can tell violations apart. `references/write-checks.md` carries the how.

**The input source determines routing behavior, with no modes and no flags.** Inbox items need triage (what is this? where does it go?). Findings items are already identified as reusable knowledge and organized by subject, so they skip triage and go straight to destination routing. Closed tickets and groundwork maps stay as they are.

**The ticket sweep is the safety net for capture.** With findings capture in place, most knowledge is already in `.flow/findings/` by ticket close. The sweep catches what the agent missed during the build and marks tickets as filed. The mechanism is unchanged; it produces fewer findings.

**File-findings never runs mid-session.** Promoting to skills writes through symlinks into the Flow repo, which invalidates the prompt cache. Capture happens during work (zero cache impact); promotion happens at session end or in a dedicated session.

### Surfacing — the loading ladder

Knowledge defaults to the lowest loading tier and is promoted only with evidence:

- **Skill `references/`** (default destination) — loaded only when the skill fires. Most knowledge stays here.
- **`.claude/rules/` with `paths:` frontmatter** — loaded when the agent reads a matching file. For rules tied to a file type or directory.
- **`.claude/rules/` without `paths:`** or **`home/CLAUDE.md`** — loaded every session. Only for universal rules that apply regardless of stack or context.

Promotion up the ladder requires evidence: repeated corrections, repeated violations measured by the compliance scorecard. Knowledge that loads every session but never applies is wasted context — every loaded token gets re-read on every message in the conversation.

### Aging — no scheduled maintenance

Three mechanisms, no timers or scheduled jobs:

1. **Default low, promote with evidence.** New knowledge enters at skill references. Promotion to rules requires the agent repeatedly violating a convention or the user repeatedly correcting the same thing.
2. **Demote via dead-rules-audit signal.** Rules that load but never apply get flagged for demotion — move back to skill references, or delete.
3. **Update on conflict.** New findings that contradict existing knowledge supersede the old record. The agent notices the contradiction during work and updates.

### What knowledge types exist

Four types, each with a different final destination:

- **Tool/library knowledge** (descriptive, detailed, 50-500 lines) — how a tool actually behaves. Goes to skill `references/`.
- **Rules and conventions** (prescriptive, short) — "always do X." Goes to `rules/` or project CLAUDE.md depending on scope.
- **Patterns and techniques** (instructional, medium) — "when doing X, approach it this way." Goes to skill `references/` or `rules/` depending on scope.
- **Project-specific facts** (descriptive, varies) — "this repo uses X." Goes to `docs/context/<subject>.md`. This already works today.

### What each project-level folder holds

- `.flow/inbox.md` — work items, fragments, ideas. Not knowledge. Drained by file-findings into tickets and project docs.
- `.flow/findings/<subject>.md` — reusable knowledge captured during work, organized by subject. Temporary staging. Drained by file-findings into skills and rules.
- `docs/context/<subject>.md` — project-specific facts. Permanent. Not promoted.
- `.claude/rules/<topic>.md` — project-specific prescriptive rules. Permanent in this project.

## Locked decisions — the enforcement bridge

Locked 2026-09-05, across the session that also resolved the semantic-rule gap.

### The three tiers

1. **Measure** — the rule is text the agent reads. A check counts violations silently. Nothing interrupts.
2. **Warn** — the same check runs before the edit and returns a message the agent reads. The edit proceeds.
3. **Block** — the same check rejects the edit. Reserved for rules with no false positives.

Most rules stay at measure. Promotion needs evidence from the scorecard.

### One script does all three jobs

Recording, warning and blocking are the same check at the same moment. One `PreToolUse` hook on `Edit|Write` runs one script, and each check's own `tier` field decides what the script returns. No hook per rule, and no separate warning script.

`permissionDecisionReason` on an `allow` reaches the user, never Claude. A warning the agent must read goes in `additionalContext`. Writing it into the other field sends it to the terminal and nowhere else.

A sync hook adds latency to every edit, roughly 50 to 100 milliseconds. Measure it rather than guess. The async alternative delivers its output on the next turn and cannot block.

### Knowing which rules are loaded

An `InstructionsLoaded` hook fires whenever a `CLAUDE.md` or a `.claude/rules/*.md` file enters context. It reports `file_path`, `memory_type`, `load_reason` and the `paths:` globs. It fires again with `load_reason: "compact"` after a compaction, so the record survives one.

The scorecard hooks it and keeps a per-session list of loaded files. A warning then takes 1 of 2 forms:

- **Rule file loaded** → the check's message plus the rule ID. The agent already holds the full text.
- **Rule file not loaded** → the hook reads that rule's text out of the file and injects it in `additionalContext`.

Injecting beats telling the agent to go read the file. No extra turn, and no chance it skips the read.

### The check files

One file per check at `scripts/rule-checks/<id>.js`, exporting everything about itself:

- `id` — groups the counts, and matches a rule ID in a rule file
- `rule` — path to the file holding that rule
- `tier` — `measure`, `warn` or `block`
- `applies(path, content)` — is the rule relevant to this edit
- `check(path, content)` — was it followed
- `needs` — `'added'` for only the text this edit introduces, `'file'` for the whole file as it will read afterwards
- `message` — the one line the agent reads on a violation
- `since` — the date the check last changed materially, so `flow scorecard` skips counts an older version produced

The folder is the registry. Adding a check adds a file. Promotion changes one word.

**No registry file.** Flow made this call for skills already: a second list is a second thing to update, and it goes stale the first time somebody forgets. A ticket earns registration because it has a lifecycle and outside references. A check has neither.

`Edit` and `Write` hand a check different things. `Edit` gives the old and new fragment, `Write` gives the whole file. Each check declares which it needs.

**A check can be any JavaScript function**, not only a regular expression. Text search, comment-line counting, sentence length, file-read ordering. The boundary is whether a function tells violations apart reliably, never whether a regular expression can express it.

### Rule IDs

Every rule gets an ID, written inline in the bold slot where the label sits today:

```
- **`no-git-mutations`** No `add`, `commit`, `push`, `checkout`, `reset`, `rebase`, `merge`, `stash`.
```

**The ID states the rule. The body says only what the ID cannot.** Following that ID with "Never run git mutations" spends tokens repeating it. Written this way the ID replaces the old bold label rather than adding to it, so the cost is close to zero.

Inline, never a heading per rule. The token difference runs about 4 tokens either way, so it decides nothing. A hundred H2 sections is not a file anyone skims.

Every rule gets one, never a subset. Mixed is more confusing than either extreme. An ID also makes a rule citable from a study case, a backlog line or a commit message, where quoting it is what happens today.

Extracting one rule's text means reading from a bullet to the next bullet at the same indent.

**A checked rule lives in `rules/`.** Those files are symlinked, so one copy exists. `home/CLAUDE.md` is copied and personalized at install, and the 2 copies drift on purpose.

### `flow scorecard`

Reads every session file under `~/.flow/scorecards/`, adds the counts across all of them, and prints 4 lists:

- **Stale checks** — the check names a rule ID no rule file defines
- **Violated most** — rule, count, rate
- **Ready for promotion** — past the threshold, meaning measure becomes warn
- **Never applied** — loaded every session, never once relevant

Thresholds start at 5 violations and a 60% rate. Both are guesses until real data exists.

The summary states its own coverage: `12 rules measured, 89 not measurable`. Without that line a clean report reads as a clean session, when most rules were never checked at all.

The agent may run the command, which only reads. Acting on it edits a check file, and that needs approval like any change.

### Recording

Append one line per result. Never read, modify and write back: 2 hooks firing close together overwrite each other's counts.

Each session file records which project it ran in. That answers "violated in one project and nowhere else", which is the signal a global rule should have been project-scoped. Free now, impossible to backfill.

A session with no edits writes no file, so the reader handles a missing one.

### What counts as a dead rule

`relevant = 0` across many sessions, and nothing else. The situation the rule governs stopped arising, so the rule pays context rent for a case that no longer exists. Move it down the ladder.

**Never violated is not a dead rule.** A rule only gets written after a real mistake, so zero violations means the fix took. Removing it reintroduces the bug. For a promoted rule, zero violations means the warning is doing the work, and the only testable change is dropping it back to measure.

### Tracking what was read

The scorecard reads the current session's transcript at `~/.claude/projects/<project>/<session-id>.jsonl`, which Claude Code appends as the session runs. The hook payload carries `session_id`.

No second hook on `Read`. Read fires far more often than Edit, and the transcript already holds reads from before any hook existed. Cache the byte offset already scanned.

This is what makes "read `style.md` before writing a skill" a check somebody can write.

### Staleness runs both directions

- Every check names a rule ID, and some rule file must define it. Missing fails the test.
- Rules with no check get listed as information, never a failure. That list is what to make measurable next.

`npm test` covers Flow's own tree. `flow scorecard` covers a user's project, since it already reads every check and every rule file.

### Global and project scope

Checks live at `scripts/rule-checks/`, global to the machine. A project check would live at `.flow/checks/<id>.js`, with the scorecard loading both folders.

**Build the global half only.** No project needs one yet, and a mechanism built ahead of its first case gets built wrong.

### False positives

A wrong warning gets written to `.flow/findings/scorecard.md`. That path already exists and `/file-findings` already drains it. With no recording path, refinement waits on the user noticing, which is the manual work the bridge exists to remove.

Block only after path scoping and pattern refinement clear the false positives.

### Rules no function can catch

Those get a `UserPromptSubmit` hook injecting a short reminder each turn. Still undesigned: what it says, its length, whether it changes between turns, and its token budget. It costs tokens on every turn forever, so the budget decides the shape.

### Who writes the checks: `/file-findings`

Set by the user 2026-09-05, overturning the separate `rule-checks` skill proposed earlier the same day. One skill writes the rule and writes its check, in one pass.

**The argument that decided it: a rule and its check are written at the same moment.** The split assumed they were weeks apart, the check arriving once the scorecard showed the rule failing anyway. They are not. A check starts at `measure`, which interrupts nothing, so one built from a single example costs nothing when it turns out wrong. Waiting for more examples leaves the rule unmeasured for exactly as long as you wait.

Size was the other argument for splitting, and `references/` answers it. `/groundwork` is 258 lines with a 139-line `write-spec.md` beside it, read only on the runs that need it. `/file-findings` gets `references/write-checks.md` on the same pattern, so check instructions cost nothing on the runs that write no check.

**The name stays `/file-findings`.** `/promote-findings` was proposed and rejected as near enough in meaning to buy nothing for a 23-file rename sweep.

The periodic scorecard sweep is not a second skill either. It is `/file-findings` entered with no findings to drain, reading `flow scorecard` as its fifth input.

Not `dev/`, for whichever skill holds this. That group builds Flow itself, and rule enforcement is something a user runs in their own project.

## Locked decisions — supporting

### `commands/` is dissolved, and 2 groups replace it

Set by the user 2026-09-05, overturning the "closed and not reopenable" decision that stood before it. Built the same day. Each of the 4 skills moved to the group that fits what it does:

- `start` and `handoff` → **`session/`**, a new group. One opens a session and loads what the work needs, the other closes it and writes what the next one needs.
- `file-findings` → **`knowledge/`**, a new group. It is the only member, and it stays the only member: check work merged into it rather than becoming a second skill.
- `cut-from-spec` → **`tools/`**, beside `research` and `visualize`. All 3 are invoked to do a job inside other work.

Groups are now `phases/`, `session/`, `knowledge/`, `tools/`, `stack/`, `dev/` and `drafts/`. The repo `CLAUDE.md` rule that read "`commands/` is closed" became "`phases/` is closed at 4", which is what the old rule was protecting.

### Standards skills are redundant

Path-scoped rules in `.claude/rules/` do the same job as standards skills, loading contextually based on what the agent is working with, and they are a native Claude Code feature. The `standards/` skill group can be removed. If a case appears that rules cannot handle, standards skills can return.

The group was empty already and every doc has dropped it. The folder itself is still on disk, holding only the `.info` file that kept it in git, and deleting it is the user's call.

### The CLAUDE.md split

Topic-specific rules move from `home/CLAUDE.md` to `rules/<topic>.md` in the Flow repo, symlinked to `~/.claude/rules/` by `flow install`. Examples:

- Commenting rules → `rules/comments.md` with `paths:` scoped to code files
- TypeScript conventions → `rules/typescript.md` with `paths: "**/*.ts"`

`home/CLAUDE.md` shrinks to universal rules that apply regardless of stack or context.

### The `rules/` folder

Lives at the top level of the Flow repo, alongside `skills/`, `scripts/`, `references/`. Not under `home/`. `flow install` symlinks per file (never the folder) to `~/.claude/rules/`, same pattern as skills. Same safety: refuses to replace anything that isn't already a symlink. Handled by `--home` in the same pass as skills — no new flags.

### `.claude/rules/` is a standard Claude Code feature

- Project rules: `.claude/rules/<topic>.md` — loaded for this project
- User rules: `~/.claude/rules/<topic>.md` — loaded for every project
- Rules without `paths:` frontmatter load at session start
- Rules with `paths:` frontmatter load only when the agent reads a matching file
- Symlinks explicitly supported
- Plain markdown with optional YAML frontmatter

### Skill loading at scale

Claude Code loads a listing of skill names and descriptions at session start, not skill bodies. The listing has a character budget (default 1% of context window). When many skills exist:

- Every skill name is always listed
- Descriptions get trimmed starting with least-used skills
- Each description capped at 1,536 characters
- `skillOverrides` controls visibility: `"on"`, `"name-only"`, `"user-invocable-only"`, `"off"`

Flow already uses `skillOverrides` in `home/settings.json` to disable stack skills by default. This is the right mechanism. Backlog idea: set obvious stack skills (React, etc.) to `"name-only"` to save description budget.

### No separate compile step

File-findings is the promotion mechanism. No background compilation (like claude-memory-compiler's), no separate API calls, no spawned sessions. Everything runs within normal conversation.

### Cost

The entire knowledge system and enforcement bridge runs within normal session usage. No background agents, no separate API calls. Affordable on a $20/month plan.

## Research inventory

### Analysis files under `lab/research/`

Twelve files analyzing external repos, in two batches.

**Batch 1** (user-provided repos, analyzed first session):

- `browser-harness.md` — self-improvement through agent-authored helpers and domain skills. Learning is the work itself, zero overhead.
- `tencentdb-agent-memory.md` — server-side layered memory (L0 raw → L1 atoms → L2 scenarios → L3 personas). Heavy infrastructure, but the layering concept translates.
- `everything-claude-code.md` — first-generation solo-developer approach. Session lifecycle hooks, continuous learning via Stop hook, rules as separate files, strategic compact.
- `ecc.md` — ECC's instinct system (trigger + action + confidence + scope). Real-time observation via hooks, project-scoped by git hash, background Haiku observer, promotion from project → global.

**Batch 2** (cloned to `repos/batch1/`, analyzed second session):

- `claude-mem.md` — 93k stars. Progressive-disclosure retrieval (search → timeline → get), SQLite + FTS5, optional Chroma vector search. Heavy infrastructure (Bun worker, HTTP API).
- `claude-memory-compiler.md` — 1.3k stars. Simplest viable architecture: transcript → daily log → compiled wiki articles → `index.md`. No RAG at personal scale (Karpathy insight).
- `pro-workflow.md` — 2.8k stars. Self-correcting memory (corrections → rules → SQLite), persistent FTS5 wikis, correction heatmaps, adaptive quality gates. 37 hooks across 24 events.
- `codealmanac.md` — 993 stars, YC S26. Cleanest design. Wiki-as-code in `almanac/`, background sync/garden agents, notability bar, intelligence in prompts not pipelines.
- `claude-code-hooks-repo.md` — 498 stars + Anthropic's hookify. dead-rules-audit compliance scorecard (deterministic rule violation tracking, promote→hook flag). hookify creates hook rules from conversation analysis.
- `engram.md` — 6.3k stars. Go binary, agent-decides-what-to-save, topic-key upserts (evolving knowledge stays one record), conflict detection.
- `basic-memory.md` — 3.8k stars. Markdown + wikilinks as knowledge graph. `[category] content #tag (context)` observation syntax. Schema validation via Picoschema.
- `claude-diary.md` — 379 stars. Simplest complete loop: diary → reflection → CLAUDE.md updates. No infrastructure beyond two command files.

### Additional research

- `inspirational-repos.md` — broad sweep, unfiltered, includes low-quality repos.
- `filtered_agent_memory_repositories.md` — filtered to 200+ stars and recent maintenance. 35 repos retained.
- `agentic-atlas-refs.md` — Agentic Atlas pages on statelessness, deferred context, and reference data. Source of the loading-ladder and rent-test concepts used in the aging design.

### Repos cloned and analyzed

All at `repos/batch1/`. Anthropic's `claude-code` also cloned there for the hookify plugin at `plugins/hookify/`.

### Convergent pattern across all repos

The repos that work long-term land on the same three layers independently:

1. **Append-only raw layer** — transcripts, logs, observations. Cheap to capture, never edited.
2. **Derived structured layer** — typed facts, wiki pages, rules, instincts. Built by a separate extraction/compilation pass.
3. **Small always-loaded index** — points into the structured layer rather than containing it. Keeps the context budget intact.

### Mechanisms worth stealing — cross-repo synthesis

Six mechanisms that survive across implementations:

1. **Progressive disclosure for retrieval** — compact index → chronological context → full detail. Flow's skill loading model already follows this.
2. **Topic-key upserts for evolving knowledge** — one file per subject, updated in place. Adopted as `.flow/findings/<subject>.md`.
3. **Notability bar for capture** — not everything is worth remembering. The agent exercises judgment about what crosses the threshold.
4. **Compilation from raw to structured** — raw session logs → structured articles → index. Flow uses file-findings as the promotion step instead of a separate compiler.
5. **Compliance scorecard for rule enforcement** — deterministic measurement of rule compliance, flagging chronic violations for hook promotion. Adopted.
6. **Garden/maintenance for aging knowledge** — periodic review for staleness. Flow uses dead-rules-audit signal and conflict detection instead of scheduled maintenance.

### What none of them do

No repo solves knowledge promotion from project to global cleanly. ECC detects candidates but promotion is manual. Flow's design uses `/file-findings` as the explicit promotion step.

## Build plan

### Built 2026-09-04

Capture and promotion. `home/CLAUDE.md` → `## Capture` routes reusable knowledge to `.flow/findings/<subject>.md`. `/file-findings` reads findings as a fourth input and routes to `rules/` alongside skills. `rules/` exists at the repo top level, and `flow install` symlinks its files per item to `~/.claude/rules/`.

### Built 2026-09-05

The skill and the group moves, which were the last 2 steps of the order below and ran first because the design changed under them. `commands/` dissolved into `session/`, `knowledge/` and `tools/`. `/file-findings` moved to `skills/knowledge/` and gained `flow scorecard` as a fifth input, a check step in `## Method`, a `## Checks` section, and an 89-line `references/write-checks.md`. `write-skills.md`, `docs/dev/skills.md`, `docs/dev/layout.md`, `README.md` and the repo `CLAUDE.md` carry the new groups. Nothing enforces anything yet: the skill describes a hook and a folder that do not exist.

### The order for the rest

1. **Split `home/CLAUDE.md`.** Topic rules move into `rules/*.md`. **Every rule gets an ID in the same pass**, across `home/CLAUDE.md`, the repo `CLAUDE.md` and every file the split creates. One pass, never two: doing IDs first edits every rule twice, doing them after sweeps every file again.
2. **Mine the 2 projects.** Delapse and lumacraft_v2, from the live checkouts at `~/code/projects/`, since the copies under `repos/` may be behind. Both carry a `CLAUDE.md` and `docs/agents/conventions.md`. Delapse adds `workflow-rules.md` and `superpowers-overrides.md`, lumacraft_v2 adds `testing.md`. Universal → `rules/<topic>.md`. Tied to a language or file type → the same with `paths:`. True of one project → stays there.
3. **The first check.** `scripts/rule-checks/comment-density.js` against `rules/comments.md`. Commenting rules are universal, broken constantly, and mechanically checkable, so that pair runs the whole loop on one small case.
4. **The scorecard script.** The `PreToolUse` hook on `Edit|Write`, the `InstructionsLoaded` hook, append-only recording.
5. **`flow scorecard`.** Aggregation across sessions, the 4 lists, the coverage line.
6. **Tests.** `npm test` for staleness both directions, `bash lab/scripts/try.sh` for a live session with the hooks firing.

Documentation comes after. Manual pages and the Claude Code reference page are separate work.

### Separate from this design

- **Documentation and examples for workflow artifacts** — ticket templates, groundwork examples. Needed but not part of the knowledge system
- **`name-only` skill overrides for obvious stack skills** — backlog idea, saves description budget
- **Manual pages** — a capture page and a knowledge-system page. The manuals folder is planned and unbuilt, so no path is settled
