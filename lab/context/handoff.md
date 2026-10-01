# Handoff

Written 2026-10-02. Read this once, then rewrite it whole next time.

## Where things stand

Pass 2 of the final sweep is finished and committed by the user. Since then:

- **`/flow:start` runs `flow next`**, and `flow get` needs an id. `npm test` in `scripts/` passed, 246 of 246.
- **Claude Code 2.1.287 is read** into `lab/research/claude-code-updates.md`, nothing to change.
- **`CLAUDE.md` → `check-claude-code-updates` runs only when the user asks**, since 2026-10-02.

## Next: pass 3, approved by the user 2026-10-02, start at once

`lab/backlog/before-beta.md` → pass 3 holds the approved plan. **The rule: a file the agent loads is instructions, never an explanation.** A short reason stays only where the agent would otherwise get a case wrong. The user ruled it, and wants it applied hard: concise, really concise.

**Run it alone, start to finish, with no checkpoints.** The user approved the whole sweep and will not review each change. Never stop to show a list and wait.

1. **Add the user's rule to `references/style.md`**, one line, under `### Only in a loaded file`.
2. **Always-loaded rules**: `home/AGENTS.md`, `home/CLAUDE.md` and `rules/comments.md`.
3. **Skills**, every one outside `drafts/`, each with its `references/`. Biggest first: groundwork, execute, visualize, research, debug, handoff, file-findings, prototype, then start, review, apply-domain-findings, tickets-from-spec. Keep `docs/dev/skills.md` and `skills/tools/file-findings/references/write-skills.md` in step where a rule there changes.
4. **`references/`**: `workflow.md`, `style.md`, `write-rules.md`, `write-docs.md`, `knowledge.md`, `cli-design.md`, `study-cases.md`, `reminder.md`, `harnesses/`.
5. **Setup and templates**: `scripts/flow/setup/`, `scripts/flow/templates/`, `project-template/`, `agents/`, `commands/`.
6. **Hook messages**: every line the hooks in `scripts/*.js` print to the agent.
7. **CLI output**: every `flow` command's output and refusals, under `scripts/flow/`. Output the user reads (the board, `flow doctor`, the restore form) is short, plain and laid out to read, not instructions. Update the tests matching a changed message.
8. **`npm test` in `scripts/`**, then the one report.

**The safeguards:**

- **Cut words, never rules.** A rule worth removing goes on the report's list and stays in the file.
- **Keep every load-bearing fact**: a path, a command, a flag, an example where the rule alone is ambiguous.
- **Rewrite this file as each group finishes**, saying which groups are done, so a compaction loses nothing.

**The report at the end:** words before and after per group, the rules proposed for removal, anything unsure.

### Groundwork, already worked through

The cuts proposed for `skills/phases/groundwork/SKILL.md` on 2026-10-01, all agreed:

- **About 25 reasons that only argue for their rule.** Example: "**On a ticket, open `map.md` first.** The map decides the phase, never the status." replaces 3 sentences.
- **Rules another file already gives**: "Recommend… a neutral list is not an answer" (`recommend-never-enumerate`); "write the decision once locked" and "batching 2–3 is fine" (`## Capture`); Phase 4's durable-fact route (`## Capture`); "ASCII frame first… colour only when" (`/flow:visualize`).
- **Said twice inside the skill**: "'I don't know' twice" in 2 sections; the 3 "the answer is no" lines become one, keeping the split (a feature not worth building is dropped, a topic whose answer is no is done); "Everything else routes out… decision log" repeats Phase 4; "A ticket's plan is written at pickup" repeats "No plan".
- **For the report's removal list, never cut**: in `### When the branch is about structure`, "Propose parts with one clear purpose…" and "A part that needs a huge file… is one part doing too much". "Build the smallest thing that works" and "If the right design replaces what exists, that's in scope" stay regardless.

## How the user wants this work done

- Reason extensively before proposing anything. Weigh each candidate against what it is for, and never re-raise one recorded as kept.
- Record every dropped proposal in its backlog item, with why, in the same turn: `CLAUDE.md` → `write-dropped-proposals`.
- Keep replies short. The user is always in a rush.
- Reuse what exists, and match the conventions the user names.
- The user dictates by voice, thinks out loud, and approves with "go" or "approve". A message ending in a question is thinking.
- The user commits. Never suggest a commit.

## Watch in the beta

- **`/flow:start /home-4` outside a project may be refused.** `scripts/check-ticket.js` refuses a bare `/flow:start` outside a project, and whether Claude Code hands it an empty `command_args` when a ticket's skill follows it is unchecked. A phase skill with the ticket, `/flow:groundwork /home-4`, always gets through.
- **Whether `/flow:execute /exp-47` still loads both skills after Claude Code 2.1.287**, which changed how a skill name typed mid-message reaches Claude. `lab/research/claude-code-updates.md` → `## 2.1.287`.
- **`flow init`'s push check is a dry run**, tested only against a missing remote folder. Whether GitHub refuses a dry run from someone signed out, or without write access, is unchecked.
- **Whether `claude plugin list`, run from inside the safe-mode setup session, still lists synced plugins.** The docs do not say.
- **The restore form has never met a real terminal.** Tests answer the word in process. Check the prompt reads well, and that saving the form in an editor and typing the word works as written.
- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
