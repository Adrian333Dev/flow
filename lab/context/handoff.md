# Handoff

Written 2026-09-30, before a compaction the user asked for. Read this once, then rewrite it whole next time.

## Where things stand

The final sweep is on pass 1, the walk: `lab/backlog/before-beta.md`, item 1. Round 2 is the second walk on paper, wider than round 1. It reads and reasons, and runs no live session and no `try.sh`. The user wants no commit suggestions.

**The user approved every fix round 2 has found so far, and said to proceed after the compaction.** The first action is building them. They are listed under pass 1 in the backlog, each with its file and line:

1. **`flow init` in a project with code and no competing file leaves `AGENTS.md` as the bare template.** Open the setup session whenever git keeps any file (`scripts/flow/commands/init.js:245`, `lib/setup` tests in `scripts/tests/setup.test.js`). An empty folder keeps the template, and `/flow:groundwork` Phase 4 fills `## Project` once the map says what the project is (`skills/phases/groundwork/SKILL.md` → `## Phase 4`).
2. **A refused push reads as offline, and no ticket can be made.** `flow new`'s refusal prints git's own reason (`scripts/flow/commands/tickets.js:416` → `notMade`, fed by `scripts/flow/lib/records.js:159`). `flow init` tries a dry-run push of the branch and offers `--local` where it is refused.
3. **`skills/phases/debug/SKILL.md:47` and `:49`**: no ticket inside a project → `flow new "<what failed>" --type issue` first, the line `/flow:prototype` already has at its line 75. A loose `REPORT-<failure>.md` stays for outside a project.
4. **`skills/phases/execute/SKILL.md:196`**: the ticket folder list gains `history.md` (written by `flow`) and `protos/` (by `/flow:prototype`).
5. **`references/knowledge.md:12`**: the wiki guide is `skills/tools/research/references/wiki.md`, not `~/.flow/references/wiki.md`.
6. **`references/cli-design.md:48`**: replace the `flow domain-skills` example, a group removed 2026-09-23.

Every fix also updates what it makes stale: `lab/context/state.md`, the backlog line, `docs/manual/` pages that describe `flow init` or `flow new` (`reference.md`, `use/start.md`), and `docs/dev/` where it applies. Then `npm test` in `scripts/`, then the writing pass on every markdown file touched. One test, *2 workers at once each get only their own file*, fails about 1 whole-suite run in 8 and never alone: rerun before blaming a change.

**After the fixes, round 2 walks the 10 areas the sweep only name-checked**: `/flow:research`, `/flow:visualize`, `/flow:file-findings`, `/flow:tickets-from-spec`, `/flow:review`, `flow audit`, `flow cases`, `flow restore`, `flow uninstall`, `flow update`. Report each finding with file:line and a proposed fix. Fix nothing without the user's yes.

## Done this session

- **Plugins synced from the claude.ai account are handled.** `scripts/flow/lib/skill-links.js` → `outside()` and `scripts/flow/setup/machine.md` step 3 list plugins through `claude plugin list --json`. Setup switches a synced one off with `claude plugin disable <name>@synced`, which writes `"<name>@synced": false` into this machine's `~/.claude/settings.json` alone: claude.ai and other machines keep it on. Setting `CLAUDE_CONFIG_DIR`, even to `~/.claude`, hides synced plugins from the list, so the script sets it only for a folder other than the default. `form.md`, `docs/manual/reference.md`, `state.md` and `lab/research/claude-code-updates.md` carry it.
- **Claude Code releases are tracked.** `lab/scripts/claude-code-changes.sh` prints releases newer than line 1 of `lab/research/claude-code-updates.md`, now 2.1.285. It printed nothing new today.
- **Watch in the beta**: whether `claude plugin list`, run from inside the safe-mode setup session, still lists synced plugins. The docs do not say.

## Open findings, only if `try.sh` survives pass 2

- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
