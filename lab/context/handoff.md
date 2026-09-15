# Handoff

The lab cleanup and the backlog split are finished, built on 2026-09-16 after the user approved everything proposed over the 2 sessions before it. It went in with the 2026-09-15 build, and both are committed.

## What changed

- **`docs/dev/claude-code.md`, new.** What Claude Code does, tested rather than assumed: sessions and compaction, the 3 request layers, how an instruction file loads, where a skill is found and what it does when it runs, arguments, `skillOverrides`, plugins, what a hook can load and see, and what a hook sees inside a subagent. Written out of 2 lab records plus `design-subagents.md`'s live findings. Listed in `docs/dev/README.md`, and `docs/dev/skills.md` points at it.
- **`skills/tools/file-findings/SKILL.md` → `## Routing`** gained the routing test, *would this sentence be true in a different project?*, and the 4 conditions for what may go in a project's `docs/context/`. Neither had ever shipped anywhere an agent reads.
- **`lab/context/` went from 20 files to 9**: `claude-code.md`, `drawing.md`, `handoff.md`, `management.md`, `manual.md`, `models.md`, `rules.md`, `skills.md`, `state.md`. `state.md` → `## Which record covers what` says what each holds.
- **Deleted**: `threads.md`, `design-subagents.md` and `design-project-docs.md`, each after its live content moved. `threads.md` gave its install questions to `management.md`, its caveman pointer to the output-contract backlog line, and its `claude-code.md` pointers to `docs/manual/settings.md` and `docs/dev/agents.md`.
- **`backlog.md` split.** `## V1` went from 7 items to 39, `## After V1` down to 20. V1 now opens with `### The spine`, the 7 original items in build order, and files the other 32 by area. 3 items left the file: `haiku-worker` is built and live, `docs/dev/claude-code.md` is written, and the 3 old workbench commands are gone.
- **`gsave`, `ptree` and `fmerge` are gone**, removed by the user from `~/.local/bin`. `CLAUDE.md` → `no-git-mutations` was rewritten whole on 2026-09-16: never run, print or offer a git command that writes, unless the user asks for one.
- **A study case**: `lab/study-cases/undefined-terms/2026-09-16-three-labels-and-no-explanation.md`, on 3 sentences that named a thing and never explained it.

## Checks run

`npm test` in `scripts/`: 114 pass, 0 fail. No em dash in any file touched. Every pointer to a merged or deleted record was swept, and the only surviving mentions of an old filename are historical sentences saying where something moved.

## What is still open

- **`## Explaining` needs its own rework**, now `backlog.md` → `## V1` → `### Rules and always-loaded files`. The section holds 20 rules in 42 lines, and the 2 that bind hardest are buried. The study case above is the evidence.
- **The 4 `docs/context/` conditions are in `/file-findings` alone.** `references/workflow.md` still carries only the one compressed line about that folder, and nothing has decided whether the conditions belong there too.

## Designed later, never before its turn

- **Phase skills take a ticket id**, `backlog.md` → `### The spine`. A second run whose rendered text differs appends the whole skill again. Lifting `short-skill-no-arguments` for the 4 phase skills was proposed and never approved.
- **The management skill's 3 open questions**, plus the 3 the install thread left, all in `management.md`.
