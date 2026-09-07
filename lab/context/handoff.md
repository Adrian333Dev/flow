# Handoff, 2026-09-07

Rewritten whole each time, read once. Durable reasoning belongs in `state.md`, `threads.md` and the
`design-*.md` records. This file holds only what the next session needs and would otherwise lose.

## Where the work stands

**The rule-file review is closed and its 6 changes are built.** `rules-review.md` carries what was
decided, and `state.md` carries the same in the running status. Nothing there needs re-deriving and
nothing there needs re-arguing.

Flow's suite passes 75 tests. The working tree is uncommitted.

## The one thing left from the review

**`## The user` and `## Preferences` in `home/CLAUDE.md` are both empty and nothing fills them.** The
route in `## Capture` is a passive pointer, so an agent that knows nothing about the user writes
nothing and the sections stay empty forever.

What the user wants, in their own framing: push the agent hard early while the profile is thin, ease
off once the base is there, and keep it compressed the whole way. The section is open-ended, holding
anything useful the agent learns, habits and preferences included.

**A proposal about how to write each line was rejected as the wrong problem.** The question is what
makes the agent start, not what shape the lines take. Whether `## The user` and `## Preferences`
merge or stay separate with a stated split is open beside it, and the user raised it without
answering it.

`backlog.md` → `## Rules and always-loaded files` holds the item, and `## Next` puts it first.

## What is easy to get wrong here

- **Auto memory is off.** `home/settings.json` sets `autoMemoryEnabled: false` and
  `home/settings.md` gives the reason. A research pass reported it as live because it read
  Anthropic's docs without reading Flow's own settings.
- **The repo's own `CLAUDE.md` only has to align roughly.** Nothing installs from it, and duplicate
  ids inside it do not matter. `home/CLAUDE.md` is the file that counts.
- **No hook loads a skill or a rule file.** Asked and closed. Workarounds that route through the
  agent invoking the skill itself were offered and rejected.
- **`/compact` is not used**, so a mid-session edit to a loaded file stays inert for the whole
  session. That is why capture is allowed to write one.

## What not to do

- **Never run an experiment on Claude Code behavior before reading the docs.**
  `lab/research/claude-code-docs/` holds pages on disk and `llms.md` indexes every published page.
  Read Flow's own files first: `home/settings.md` answers more than it looks like it does.
- **No git command and no install**, as always.
