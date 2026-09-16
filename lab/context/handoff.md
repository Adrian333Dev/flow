# Handoff

Written 2026-09-16, after `## The reply` replaced `## Explaining` in both `CLAUDE.md` files and the 14 study cases were deleted. Everything before the deletion is committed by the user. The deletion and the record edits beside it are on disk, uncommitted.

## What changed on 2026-09-16

- **`CLAUDE.md` → `no-git-mutations` rewritten whole**: never run, print or offer a git command that writes, here or in a submodule, unless the user asks for one. Reads are fine. `never-offer-to-commit`, `submodules-commit-twice` and `real-commit-messages` were deleted as dead under it. The old wording ordered the agent to print commit commands, which is why every report ended with one.
- **`## The reply` replaced `## Explaining`** in `home/CLAUDE.md` and `CLAUDE.md`, last section in each. 3 ordered steps, `plan-before-writing`, `size-by-worth`, `whole-then-parts`, then `### Inside each section`, then 5 tests under `### Before sending`: `the-whole-machine`, `define-from-zero`, `explain-never-label`, `nothing-to-remember`, `cut-empty-sentences`. Rules were merged, never cut. `never-narrate-being-wrong` moved to `## The turn` step 2 in `home/CLAUDE.md`.
- **2 follow-ups the user approved after questioning the section.** `topic-by-topic` lost its ban on merging: two topics with one answer share a section, headed by both. `plan-before-writing` gained: where the topics are parts of one thing, the first section says the thing whole. A build report after an approved plan was ruled to pass the 5 tests as it is, sized by `state-the-change-then-the-files`, so it got no exception.
- **`lab/context/models.md` → `#### Degrades silently`**: `## The reply` needs thinking. Its steps and tests run on a draft that exists only in the thinking before the reply.
- **`references/reminder.md`** now points at `## The reply` and names `### Before sending`.
- **`lab/context/rejected-replies.md`, new.** Every rejected reply, one line each with the user's words, grouped by fault. The test set the next rewrite of `## The reply` is checked against.
- **`lab/study-cases/` deleted whole**, 14 cases in 8 folders, on the user's yes. `git log -p -- lab/study-cases/` restores any of them. `state.md`, `docs/dev/layout.md` and `rules.md` no longer name the folder as live.
- **`backlog.md`**: the `## Explaining` rework item became "`## The reply` has never been measured": a failure the 5 tests miss means changing the shape again, never adding a sixth test.

## Checks run

`npm test` in `scripts/`: 114 pass, 0 fail. No em dash in any file touched. No duplicate rule id in either `CLAUDE.md`. Nothing in `scripts/` reads `lab/study-cases/`; `flow cases` reads `~/.flow/study-cases/`.

## What is still open

- **The next topic is unnamed.** The user said one follows the compaction. `backlog.md` → `## V1` → `### The spine` holds the build order.
- **`## The reply` is unmeasured.** The first rejected reply under it decides whether the 5 tests fire.
- **The 4 `docs/context/` conditions are in `/file-findings` alone.** `references/workflow.md` still carries only the one compressed line about that folder, and nothing has decided whether the conditions belong there too.

## Designed later, never before its turn

- **Phase skills take a ticket id**, `backlog.md` → `### The spine`. A second run whose rendered text differs appends the whole skill again. Lifting `short-skill-no-arguments` for the 4 phase skills was proposed and never approved.
- **The management skill's 3 open questions**, plus the 3 the install thread left, all in `management.md`.
