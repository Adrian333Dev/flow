# Handoff

Written 2026-09-29, before a compaction, with the build approved and not started. Read this once, then rewrite it whole next time.

## Next: 3 edits to `home/AGENTS.md`, then one reply

The user approved these after the prompt audit of `home/AGENTS.md`. The working tree was clean when this was written.

1. **Replace `## The turn`** with the text below. It carries across the approval rules the root `CLAUDE.md` gained from 2026-08-08 on, which never reached the shipped file. `approval-exceptions` stays out, since it names this repo's `tmp/`. The dates stay out.
2. **`## The reply` → `define-from-zero`**: add "A tool or a library gets one line saying what it does here." after "any word the user has not used themselves."
3. **Delete `batch-calls`** from `## Tools`: Claude Code's own instructions already say it. `scripts/tests/scorecard.test.js` uses the id as fixture text in its own file, so it stays.
4. **Records**: `lab/context/state.md` → the `home/AGENTS.md` line count. `lab/backlog/before-beta.md` → pass 1 says the audit of `home/AGENTS.md` is next, so mark it done and leave "Then walk the scenarios".
5. **Writing pass** on both files: `references/style.md` and `references/write-rules.md`.
6. **`npm test` in `scripts/`**: 207 passed before this build.
7. **One reply**: what changed, per file.

```markdown
1. **`instruction-or-thinking`** An instruction names the change or approves a plan: "do it", "go ahead", "apply that". Everything else is thinking: a hedge ("maybe", "not sure"), a question, a correction, a new idea, feedback. Being told to build something starts the discussion about what to build. A long list of feedback is a list of topics, not tasks. Thinking gets a reply and no edit: test it, disagree where you disagree, recommend. An instruction gets work, never a restatement of itself.
   - **`user-dictates`** Expect transcription noise and infer from context. Confirm only when a wrong word won't resolve.
2. **`disagree-before-building`** Test a proposal, objection or correction rather than agreeing with it. Say it once, with the argument. Once the user has chosen, the answer is the plan, never the case for it.
   - **`never-narrate-being-wrong`** No "you're right", no apology, no account of the position you dropped. State what is now true.
3. **`build-what-was-agreed`** Two messages must exist before any edit: yours saying what would change, theirs approving it. Missing either, write the proposal.
   - **`agreed`** Everything you proposed that drew no objection, however far back. Silence is a yes, so never ask for one. A delete is the only yes asked for. Never re-ask one, never list one as open.
   - **`not-agreed`** Anything you never spelled out, and anything raised in the message that approved something else.
   - **`new-decision-stops`** Deciding something nobody proposed: stop and say so first.
   - **`one-approval-runs-to-the-end`** The build, every record it makes stale, the tests, the writing pass. Never stop at a checkpoint to wait for a second go.
4. **`name-each-action`** One line as you take it: "editing `docs/spec/product.md`".
5. **`act-then-answer-once`** Every action first, then one answer. During long work, one line saying what is running now. The last message is the only one the user reads. It carries the whole answer and every change made.
   - **`move-forward-never-sideways`** No confirming settled points, no summarizing agreement, no recapping before the next topic. State what is now true, never the sequence that produced it.
```

## Decided 2026-09-29

- **`user-dictates` stays in the public template.** The user's reason: dictation is how most people drive agents now, so the rule is common practice, not a personal detail.
- **No backlog line about the root `CLAUDE.md` after the install.** The install replaces the root `CLAUDE.md` completely, so the double loading never happens.
- **Rule files stay lists.** The audit's checklist prefers prose. A list keeps one rule per line with an id that other files cite. A reason gets added only where a rule looks arbitrary without it, in pass 4.
- **Already built and committed today**: the `act-then-answer-once` status line in both rule files, the old wording kept in `lab/context/models.md` as the first per-model candidate, the `lab/util/` path in `scripts-keep-their-extension`, the `~/.flow/` list replaced by a pointer to `docs/manual/where-everything-lives.md`, and the new `## Scripts` in `home/AGENTS.md`.

## After this: pass 1 walks the scenarios

`lab/backlog/before-beta.md` → the final sweep, pass 1. Walk each start to finish, reading every skill and script a step touches, and report every failing step with its file and line and a proposed fix. Nothing gets fixed mid-walk.

1. A new project: the files Flow adds, then the first `/flow:start`.
2. One ticket: `/flow:start`, `/flow:groundwork`, `/flow:execute`, `/flow:handoff`.
3. A bug: `/flow:debug` on an existing ticket.
4. A throwaway: `/flow:prototype`, and how its result becomes a ticket or is dropped.
5. A session that died halfway through a ticket, then resumed.
6. A second machine: `flow restore machine`, with projects moved by `util git uncommitted`.

## Carried over, not recorded anywhere yet

- **One developer using Flow on a team repository**, with Flow's files kept out of git through `.git/info/exclude`. A proposal only.
- **The util installed on this machine is older than `lab/util/`**: `util ls` still shows `git work`, since `~/code/util` has not pulled the rename.

## Scratch

`tmp/audit/` holds the diffs of the sections both rule files share.
