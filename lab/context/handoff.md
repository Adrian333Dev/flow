# Handoff, 2026-09-05

Rewritten whole each time, read once. Durable reasoning belongs in `state.md`, `threads.md` and the
`design-*.md` records. This file holds only what the next session needs and would otherwise lose.

## Built this session, and already recorded

`commands/` is dissolved and `/file-findings` absorbed all check work. `state.md` carries it in two
paragraphs, `design-knowledge-base.md` carries every decision, `backlog.md` is updated. 57 tests
pass and a scratch install links all 12 skills at their new paths.

Do not re-derive any of it. The short version: `start` and `handoff` moved to `session/`,
`file-findings` to `knowledge/`, `cut-from-spec` to `tools/`. The skill gained `flow scorecard` as a
fifth input, a check step in `## Method`, a `## Checks` section, and an 89-line
`references/write-checks.md`.

## Two names the user rejected. Never propose either again

- **`/promote-findings`** for the merged skill. Ruled near identical in meaning to `/file-findings`,
  so it buys nothing. The name stays `/file-findings`.
- **A record of which rules are uncheckable.** Ruled a non-issue. If a check can be written it gets
  written, otherwise there is no check and nothing is written down about why.

The user also ruled that a rename requiring a file sweep is never an argument against the rename.
Do not cite sweep cost when weighing a name.

## The last message is awaiting detailed feedback

The user announced detailed feedback on the response that proposed reshaping step 1 of the build
plan. **Nothing in that proposal is approved.** Read it as an open proposal, not a decision.

What it proposed, in full:

1. **Reverse steps 1 and 2** of `design-knowledge-base.md` → `## Build plan`. Mine Delapse and
   lumacraft_v2 before splitting `home/CLAUDE.md`, because the mined stack rules are the only rules
   that path-scope, and `home/CLAUDE.md` holds none.
2. **Shrink step 1** to three things: the rule-ID pass across `home/CLAUDE.md` and the repo
   `CLAUDE.md`, roughly 118 IDs; cutting the flag spellings out of `## Scripts` because `flow` run
   bare prints them, roughly 12 lines of 45; and creating `rules/writing.md` with
   `paths: "**/*.md"` holding the writing pass, as the one rule in the file that path-scopes today.
3. **Keep the `flow` command names.** An agent that does not know `flow drop` exists will not run
   `flow` bare to find it. Only the flags go.

The ID format proposed, which the user set in an earlier session and has not revisited:

```markdown
- **`no-edits-without-approval`** Approval is an instruction to proceed, such as "do it",
  "go ahead", "apply that". Feedback, a new idea, a correction and a hedge are all discussion,
  however much the user agrees.
```

The ID replaces the bold label rather than joining it, so the token cost is near zero. The body says
only what the ID does not.

## The Claude Code facts behind that proposal

All verified against `code.claude.com/docs/en/memory.md`, which is **not** cloned under
`lab/research/claude-code-docs/`. Re-fetch it rather than trusting a summary.

They are written into `design-knowledge-base.md` →
`` ### `.claude/rules/` is a standard Claude Code feature `` in full. The one that reshapes the plan:
**`paths:` triggers on a read, never on a write**, so a rule about writing a file type is absent the
first time a session creates one.

## Two things owed to the user

**`skills/standards/` is still on disk** and needs a specific yes before deleting. The group is
dissolved by decision and gone from every doc. The folder holds only the `.info` file that kept it
in git. A blanket "proceed" was not treated as delete approval.

**The em dash rule was narrowed** in `references/style.md`. It now says strip them from any section
you rewrite, not any file you edit, because a one-line path fix in `CLAUDE.md` would otherwise
trigger a rewrite of 60 unrelated rules in the always-loaded file. The three skill files under
`skills/knowledge/file-findings/` are fully clear. `CLAUDE.md`, `backlog.md`, `state.md` and
`design-knowledge-base.md` are clear only in the sections this session rewrote. `backlog.md` →
`## Repo structure` carries the release sweep.

## Where the work goes next

`design-knowledge-base.md` → `## Build plan` → `### The order for the rest` holds 6 steps, none
started. Whatever the user's feedback settles about step 1 decides whether that order changes.
