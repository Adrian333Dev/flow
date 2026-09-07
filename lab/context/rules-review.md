# The rule-file review, 2026-09-07

The user's review of the two rewritten `CLAUDE.md` files and of the rule ids added the same day. Ten
topics in one message, then two rounds of feedback on the answers. **Closed.** Everything decided is
built, and everything still open is a line in `backlog.md`.

This file keeps what was decided and why, so no later session re-argues it. `backlog.md` is the only
work list. `claude-code-memory.md` holds the Claude Code facts several of these decisions rest on.

## What got built

- **`one-turn` is gone**, and `## The turn` carries the id `the-turn` instead. The sentence under the
  heading stays as plain framing.
- **A heading is a target.** Its id is the slug of its own text, collected by `checks.js` alongside
  rule ids, and `ruleText` returns a whole section when a check names one.
- **An id defined twice in one file is reported** by `flow scorecard`. It found one on its first run:
  `## Capture` and the rule `capture` inside it both slugged to `capture`. The rule is now
  `capture-on-sight`.
- **`references/style.md` § 11** states the format that until now lived only in the files.
- **`## Scripts` holds signatures alone.** `tree-for-structure` and `merge-for-bulk-reads` moved to
  `## Reading`, `call-by-name` and `read-a-refusal` to `## Tools`.
- **`project-template/CLAUDE.md` dropped `## Rules`** for a comment saying sections are named for
  their subject.

## The decisions behind them

### A rule id is not a bold label

The first id pass used a mechanical test: every bold label becomes an id. That is what produced
`one-turn`, which restated its own heading, and the `capture` collision. The test is three-way now,
and it is written into `references/style.md` § 11. A **section** groups rules and takes its heading
slug. A **rule** instructs and takes an id. **Framing** instructs nothing and takes none.

### A duplicate id is only ever checked inside one file

Two files defining the same id is normal: `home/CLAUDE.md` ships a rule and a project restates it
where it applies. Flagging that would have fired 40 times on a correct tree, since `home/CLAUDE.md`
and this repo's `CLAUDE.md` shared 40 ids on the day it was measured. The same id twice in one file
names two rules and reaches neither, which has no legitimate case.

### Capture may write a file that is already loaded

The user's call, and the reasoning holds. A mid-session edit to `~/.claude/CLAUDE.md` is silently
inert for that session, which is the wanted behavior: the write lands on disk for the next session,
and the agent that made it already knows what it wrote. The one case that made it dangerous was
compaction reloading the file mid-session, and `design-resume.md`, `compression.md` and
`design-audit.md` all already record that the user does not use `/compact`.

The routing through `.flow/inbox.md` and `.flow/findings/` stays on the argument that a capture is an
unreviewed guess and `/file-findings` is the review. No rule was written about loaded files.

### Auto memory does not replace `## Capture`

It looked like Claude Code already built the user profile Flow was about to instruct the agent to
build. It is off: `home/settings.json` sets `autoMemoryEnabled: false` and `home/settings.md` gives
the reason, being per repository and machine-local. The research was done against Anthropic's docs
without reading Flow's own settings first.

### Conditional loading richer than a path glob does not exist

The user wanted a rule file or a skill loaded on a condition computed from a file's contents. No hook
does it. `InstructionsLoaded` cannot modify loading, `SessionStart` → `reloadSkills` only re-scans
the folder, and `UserPromptExpansion` fires only on a typed `/name`. Workarounds that route through
the agent invoking the skill itself were offered and rejected: a skill is not a standard file and
pasting it risks loading it twice. `paths:` frontmatter on a skill is the whole of what exists.

## What is still open

Three lines in `backlog.md`, none of them started.

- **`## The user` and `## Preferences`.** The route into them is passive, so the profile never gets
  built. A proposal about how to write each line was rejected as the wrong problem: the question is
  what pushes the agent to fill the section early and ease off later. Whether the two sections merge
  is open beside it.
- **`docs/spec/decisions.md` against `docs/context/`.** Recommended: delete `decisions.md` and split
  it 3 ways rather than merge the folders. Needs 3 real Delapse examples first, and a delete needs
  its own confirmation.
- **Conduct checks off the hook payloads.** `MessageDisplay`, `PreToolUse` and `Stop` between them
  make the shape of a turn readable, which the enforcement design assumed was out of reach. Never
  read the transcript: it lags the live conversation, and the documentation says so.

## What the repo's own `CLAUDE.md` is worth right now

The user's ruling, 2026-09-07: it only has to align roughly with how the work runs, and duplicate ids
inside it do not matter. It is not part of the workflow and nothing installs from it. `home/` is the
file that counts.
