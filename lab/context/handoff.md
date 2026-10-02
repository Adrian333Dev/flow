# Handoff

Written 2026-10-02. Read this once, then rewrite it whole next time.

## Where things stand

**Passes 1 to 3 of the final sweep are closed, and everything since is uncommitted.** `lab/backlog/before-beta.md` → the final sweep holds what each pass did. `npm test` in `scripts/` passes, 246 of 246.

**The sweep's order changed on 2026-10-02, approved by the user.** Pass 4 is now the `scripts/` cleanup and new layout, with a check of every command against `references/cli-design.md`. Pass 5 is the docs, planned whole and then written from scratch. The scripts go first because the pages name script paths.

**Built the same day, approved by the user:**

- **The old manual sits in `lab/archive/manual/`**, moved whole out of `docs/manual/`. Every link into it points there now. `scripts/flow/setup/form.md` still names `~/.flow/docs/manual/settings.md` for an installed machine, which pass 5 repoints once a new settings page exists. The archived pages' own 4 links into `docs/dev/` are broken, since the archive is frozen.
- **`disagree-before-building`**, in `home/AGENTS.md` and the root `CLAUDE.md`: what the user says is a claim to test, never a fact.
- **`handoff-read-once` is gone from `home/AGENTS.md`.**
- **`style.md` §9 moved to `references/cut-loaded-files.md`**, read only for a file an agent loads. Every file naming the writing pass names it.
- **`references/knowledge.md`** lists the 2 places a disagreement with an outside skill goes under `Used whole`.
- **`lab/backlog/beta.md`** gained an item for studying beta sessions with `/cost` and `/skill-doctor`.

**Kept, agreed by the user, each recorded in pass 2:** `/flow:execute`, `/flow:debug` and the review as they are; a prototype in its own session; the `open` block. **Dropped:** a `~/.flow/private-scripts/` folder, recorded in pass 4.

## Next

**The user reviews what was built.** Issues they find come back as reports.

**Pass 4, the `scripts/` cleanup, starts when the user says.** Then pass 5: its first page is one command-line reference, every command, flag and option explained, written against `flow help`.

## How the user wants this work done

- Reason extensively before proposing anything. Weigh each candidate against what it is for, and never re-raise one recorded as kept.
- Test what the user says before agreeing with it, including their own suggestions.
- Finish what was asked whole. Leave no proposals open at the end: decide, build, and let the user review.
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
