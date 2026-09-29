# Handoff

Written 2026-09-29. Read this once, then rewrite it whole next time.

## Where pass 1 stands

Pass 1 of the final sweep (`lab/backlog/before-beta.md`) had its first round. The user walked the report with the agent over several messages and approved everything that was not opposed. Nothing is committed.

**Built, 208 of 208 tests passing:**

- `scripts/check-ticket.js` asks for a project only for a ticket id or a bare `/flow:start`. Groundwork in an empty folder and `/flow:start <path>` now get through.
- `/flow:start` reads a feature's or a chore's body, `map:` line and `## State` to pick the phase, and says why. The status table is the fallback. An empty board points to `/flow:groundwork`.
- `/flow:handoff` moves a new ticket to the status the work reached, `flow build` for code in progress. At review, `Found` goes to `issues.md`, matching `/flow:execute`.
- Where `## State` and the files on disk disagree about what exists, the files win. On decisions, `## State` wins. Both `/flow:handoff` and `docs/manual/use/resume.md` say so.
- `/flow:execute`: several child tickets can be open, and one session edits the working folder at a time.
- `flow doctor` runs the 2 suites only with `--tests`.
- `flow contribute` is out of `flow help` and out of `/flow:file-findings`. The code still runs.
- Outside skills are used whole until `/flow:write-skill` ships: `references/knowledge.md`.
- The no-op `/batch` switch is gone from `machine.md`, `form.md` and the manual. `project-template/.claude/settings.json` is `{}`.
- Docs made to match the skills: `references/workflow.md` (prototypes, `issues.md`, which id forms a skill loads), `resume.md` (`## State` labels), `flow help` (the `dev/` skills start off).
- A new manual page, `docs/manual/rule-checks.md`, with a real scorecard captured in a scratch folder.

**Recorded, not built:**

- `lab/context/ticket-store.md`: project tickets on a `flow` branch, ids as `exp-12` with global `home-4`, `flow move`, sync at checkpoints, branch and session ids on a ticket, the 7 setup verbs and `flow init`. It is the first item in `before-beta.md`. Its last section lists 7 decisions the build meets, and the build waits for them.
- `beta.md`: about 10 rule checks before V1.
- `after-v1.md`: one sharing command for everyone, ticket suggestions after `@`, and 2 modes of pace (**talk first**). The old "several branches" and "domain-skills command" items were replaced.

## Decided in the discussion

- Commits: Flow says nothing about them. Fault 4 of round 1 was withdrawn.
- `flow cases` and the rule-check machinery stay. Study cases are the user's tool for the beta.
- Feedback drafts are Claude Code's own product-feedback queue. 2 were drafted in this session. Sending them is the user's call.

## Next

The 7 open decisions in `ticket-store.md` → `## Open when the build starts`, then the build. Round 2 of pass 1 walks the scenarios again, live, through `bash lab/scripts/try.sh`.
