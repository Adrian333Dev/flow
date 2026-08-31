# The project doc set — `docs/context/`, and what a migration harvests

Decided 2026-07-29, surveying 2 real projects. `docs/context/` shipped and is live — `home/CLAUDE.md`
and 7 skills route into it. The 4 rules governing what may go in one never shipped anywhere, and they are
the reason this file survives.

**Read it when the management skill gets designed, or when a real project gets migrated.** Both are unbuilt.
The routing test below is the hard part of both, and the user said so: *"some of the content is quite
tricky… you're really not sure, is it going to go to the project context files or to a skill; there is
stuff that's in between as well."*

**The rest of this file went on 2026-08-28** — a front door skill rejected in full, a payload, a template
repo, a version stamp and an installer, none of which exist. Git holds them. The file was called
`design-init-flow.md`.

## `docs/context/` — durable project facts

The gap it fills: **project knowledge that is neither a rule, nor a decision, nor a skill.** Commands,
setup notes, lessons learned, dated debugging writeups. Delapse's own `setup-notes.md` names the
category: *"a reference, not a directive — things that were done once, not rules to follow on every file."*

One folder, one file per subject, created on demand. Never scaffolded empty — an empty folder teaches
nothing and invites filler.

4 rules, all aimed at bloat rather than absence:

1. **Every file answers one question: what would a fresh session get wrong without this?** That is the
   entry test. Delapse's `commands.md` failed it at 98 lines, and the user's verdict was *"kind of
   bloated, included too much unnecessary shit."*
2. **Write facts, never process.** Process is a skill. A context file describing how to work is content
   in the wrong repo.
3. **File verified facts only.** Delapse's `commands.md` marks 6 entries `# unverified`. An unverified
   command is worse than none — the agent runs it, it fails, and the read and the failure are both wasted.
4. **Rewrite on change, never append.** Git holds the old text.

## Skill or project context — the routing test

**Would this sentence be true in a different project?**

- **Yes → a skill.** `model-notes.md` is the clean example: 267 lines on Vertex thinking-mode latency,
  Flash-Lite token profiles and provider rate limits. It reads as project documentation and is really
  portable knowledge about building LLM pipelines.
- **No → `docs/context/`.** *"Verification order is check-types → lint → vitest → build."* *"Supabase
  types generate to `packages/contracts/src/supabase/database.types.ts`."*

**Content in between splits. Never assign it.** `never-edit-database-types-manually.md` is both: the
principle — a generated file is never hand-edited, regenerate it — is portable and belongs in a Supabase
skill, while this repo's script name and output path are local and belong in context. Route each half.

**When you genuinely cannot tell, leave it in `docs/inbox.md`.** It stays raw until `/file-findings` has
enough instances to see the pattern.

`skills/file-findings/references/write-skills.md` carries this test in its own words, which is the live
copy an agent reads.

## What a migration harvests

Three destinations, and everything else stays where it is:

- A rule about the code that the conventions do not already imply → the project `CLAUDE.md`, `## Rules`
- A verified command → `docs/context/commands.md`
- Any other durable project fact passing the 4 rules → `docs/context/<subject>.md`

**Never `docs/spec/`.** Writing the spec from someone's existing documents is consolidation, and that is
`groundwork`'s full-product work: read everything, reconcile documents written months apart, decide what
the product is now. Two reasons it stays out of a migration. It is expensive and judgment-bound, where
everything above is cheap and checkable one item at a time. And the spec is the foundation `CLAUDE.md`
and the backlog derive from, so a half-harvested spec is worse than no spec — the derivation would run
on a foundation nobody validated.

**Two words to define before using either:**

- **Harvest** — read their existing files, lift out the individual facts worth keeping, discard the rest.
  Copying sentences, never moving files.
- **Quarantine** — move colliding material aside first, lay Flow's layout on the cleared ground, then
  work from the moved copy. Never merge with what is already there. The destination is git-tracked:
  moving tracked files into a gitignored folder deletes them from the repo silently.

`.gitignore` is the one thing that appends instead. Theirs holds `node_modules/`, `dist/`, `.env`;
quarantining it and writing Flow's would start tracking all of it on the next commit.

## Evidence — 2 real projects, surveyed 2026-07-29

Delapse's `docs/` (36 files) and lumacraft_v2's `docs/` (41 files), both written before Flow existed.
Sorted by kind of content:

- **Process instructions to the agent** — `workflow-rules.md` (239 lines), `planning.md`, `milestones.md`,
  `research.md`, `testing.md`, `superpowers-overrides.md`, `prompt-engineering-process.md` → **deleted**.
  This category is what the skills replace. It existed only because the old workflow had no skills
- **Generic stack conventions** — `conventions.md`, 280 lines in Delapse and 59 in lumacraft → mostly a
  `stack/` skill, with the project-specific residue going to `## Rules`
- **Rules genuinely about this codebase** — Delapse's 15 bullets under `## Project-specific rules` →
  `## Rules`, already correct
- **Operating facts** — `commands.md` (98 lines and 36), the verification order → `docs/context/`
- **Learned project knowledge** — `model-notes.md` (267), `setup-notes.md`, `lessons-learned/` (8 files),
  `caching-improvements.md` (375), `debugging/<date>-*.md` → `docs/context/`, or a skill where the
  routing test says so
- **Foundation** — `spec/`, 7 files and 12, about 3,400 lines → `docs/spec/`
- **Working state** — `now.md`, `roadmap.md`, `backlog.md`, topic folders → tickets. `now.md` and
  `roadmap.md` were both killed as a maintenance tax
- **Vendored external documentation** — `references/`, `llms-full.md` dumps → `tmp/`, refetchable

**Two findings matter more than the inventory.**

**Flow deletes the single biggest category.** Roughly a third of both projects' `docs/agents/` is process
prose that skills replace outright.

**The failure mode is bloat, never absence.** 280-line conventions, a 560-line decisions log, 375 lines
of caching notes. Nothing in either project prunes. So the design problem is not which files exist — it
is what keeps them small, which is why the 4 rules are written as filters.

One shape worth copying: Delapse's `lessons-learned/` entries all run Symptom, Root cause, Fix,
Prevention, and the Prevention line names where the rule should end up. That is `/file-findings`'
altitude call, done by hand, and it worked.
