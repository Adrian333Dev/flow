# Resume — Flow

Read **What to open** in one batch, then start on the first action.

## The job

The final pass before Flow v1. Four phases:

1. **Teardown** — walk Flow end to end and find what breaks. **Done.** Three walks, 21 findings.
2. **Research** — external best-practice material, judged against the teardown's findings. **Not started, and nothing blocks it.**
3. **Fix** — batched off the findings. **The big batch landed 2026-08-18**; three threads survive it.
4. **Writing sweep** — `global/refs/writing.md` over every file phase 3 did not already rewrite. Not started.

**The order is the point.** A writing pass is expensive per file — plan the whole file's sections, then test every sentence — so passing a file the teardown then rewrites does the expensive half twice. Anything phase 3 rewrites gets its writing pass inside that rewrite.

## What landed 2026-08-18

**Eighteen of twenty-one findings are closed.** Every `flow` change was run against a throwaway project before it was called done. Do not re-derive any of this; `wip/context/audit.md` carries the argument behind each one.

**The knowledge problem, which was the session's real work.** A ticket's `## State` held both what is true right now and what the build learned the hard way, and `execute` deletes that section at review — so the expensive findings were discarded by design. The fix is two steps that were being confused for one:

- **Capture** runs continuously, in any phase, and writes a finding where it lands: the ticket's `issues.md`, a brainstorm's `map.md`, or `docs/inbox.md`. **No altitude is decided and no skill is touched.**
- **Promote** is manual and batched. The user types `file-findings` when they choose, often after several tickets closed, and it sweeps all of them. **This is the only step that writes into skills, `docs/context/` and `CLAUDE.md`.**

**`flow review` triggers no skill.** Two earlier versions of this design put promotion inside `execute` Phase 4 and the user rejected both: a manually-fired skill never goes on an automatic trigger.

**What that turned into on disk:**

- **`issues.md`** — a ticket-folder file, created on demand, no shape imposed, **never emptied**. It takes only what is neither work nor a decision.
- **The `filed` marker** — `filed` in ticket frontmatter, set by `flow ticket filed t047 t048 t049`, **including tickets that taught nothing**, because recording that one was looked at is what drains the queue. `flow ls --unfiled` is the pass's input; `flow status` prints the count and then names the skill to run.
- **`update-context` became `file-findings`**, with a third input: closed tickets nobody has filed yet.
- **`execute` Pass 1 opens `docs/context/` before the code.** Eight instructions wrote to that folder and one read it, at review — after the code exists. This was the largest gap the teardown found.
- **Two reminders, because there are two piles.** `flow status` for tickets; `## Capture` for the inbox, at **200 lines**. The user overturned counting entries: the inbox has no fixed structure inside it, so an entry is not a countable thing.
- **`flow` also gained** the `prototype` ticket type, a cycle guard and a dropped-replacement guard on `ticket drop --by`, and a `check` rule for a parent that closed around open children.

## The three open threads

**1. F4's second half — the only thing marked as blocking v1.** A brainstorm that hits a question talking cannot settle is told to write a handoff, hand it to a fresh session, and wait. Nothing starts that session, and nothing tells the waiting brainstorm the answer landed.

**The user's own correction may collapse it to nothing.** A question needing more thought does not need a new brainstorm — the same session carries on, or it becomes a ticket a fresh session picks up. Applied here, the `prototype` ticket type this batch landed may already be the whole mechanism: `brainstorm` cuts a child ticket carrying the question and its pass/fail, a fresh session picks it up, and the brainstorm learns through the ticket closing — exactly how `debug` works. That leaves no handoff file and no agent to build. **Walk it before writing anything.** One thing must change regardless: `prototype`'s description ends "Not for work already committed to a ticket", which now refuses the route `execute` sends it.

**2. F22 — ticket pickup. Raised by the user, not by a walk, and not yet sized.** Every ticket enters through `execute`, whose Phase 1 routes by type; four of five types load a 210-line build loop to be told to go elsewhere. Its description also claims it writes a plan at pickup, false for three types. **Recommended: the router moves to `commands/start.md`**, since `/start t047` already runs `flow show` and has the type on screen before any skill loads — the one thing a command can do that a skill cannot. **The objection:** the command only fires when typed, so the prose path ("let's work on t047") needs a pointer in `execute`'s description. **What decides it: how the user actually starts a ticket.** Ask.

**3. `grill` — decided, undesigned.** A pass the user fires at a chosen moment on a finished artifact. **It is part of Flow and it is a skill** (user, 2026-08-18), rarely fired, and **never model-invoked** — `disable-model-invocation: true`, so only the user starts it. `## Judgment` in `global/CLAUDE.md` stays the always-on floor underneath it. Design it from what this teardown actually did, not from theory. It was once built as `commands/grill.md`, moved to `skills/grill/SKILL.md`, and deleted in commit `ea62431`; nothing references it now.

## The state of the findings

**Every finding lives in `wip/context/audit.md`, F2 to F22.** F1 was deleted. Read it before proposing anything — it carries the locked decisions and the reasoning behind every reversal above.

- **Eighteen fixed**, each verified: F2, F3, F6 to F21 minus the two below.
- **F4 partly fixed** — the type and the route landed; the dispatch did not.
- **F5 parked** — delegating heavy reading to a subagent. It belongs to the `research` rewrite, which happens later the way `debug-web-pages` does.
- **F22 open** — ticket pickup, above.

## What binds it

`CLAUDE.md` in the repo root loads on its own and governs everything. Four things earned the hard way:

- **Explain from zero, every time.** The user has said three times that an explanation was unreadable, once angrily, and the cause was identical each time: using a label — a finding number, a phrase like "two inputs", a term like "one design question" — as though it named something the reader already knew. Name the thing, say what it does, then use the label. **This is the failure that has cost the most.**
- **Delapse is the live project**, a Chrome extension in daily development, at `wip/tmp/Delapse/`. `lumacraft_v2` is archived and kept only for comparison.
- **Delapse is not a fair yardstick.** Its milestones were not tickets — each bundled several pieces of work, ran large, and was often still being figured out mid-implementation. Its records are long because the workflow upstream of them was thin. Apply that discount before its evidence argues anything.
- **Project genesis is settled and closed.** A new project has no route because the install skill is deliberately built last. Raised three times. Never open it again.

## What is already set up

**Nothing is installed and nothing will be.** Every Flow script runs by path: `node global/scripts/flow/flow.js <cmd>`, `node global/scripts/fmerge.js <paths> --force`. `~/.claude/` still points at skills deleted months ago, and `file-findings` was renamed **without** running `link.sh`. Normal, not a problem to fix.

**Both hooks run uninstalled**, which is how three findings were proved. Each reads a JSON payload on stdin and prints its verdict on stdout, so installing only decides whether Claude Code feeds them — never what they answer.

```bash
echo '{"tool_input":{"command":"git tag v1"},"cwd":"'$PWD'"}' | node global/scripts/guard.js
echo '{"tool_use_id":"x","cwd":"/"}' | node global/scripts/snapshot.js --before
```

**`flow` runs against a throwaway project**, which is how every change in this batch was verified and is the basis for the test suite nobody has written:

```bash
export FLOW_PROJECT="$PWD/tmp/flowtest"   # any existing dir; docs/tickets/ is created on first write
node global/scripts/flow/flow.js ticket new "A title" --type prototype
```

**Two standing hazards.** Read anything under `wip/refs/` and `wip/tmp/` with `cat` or `fmerge` — a `Read` pulls that repo's own `CLAUDE.md` into context. And git mutations are forbidden here, `git add` into a scratch index included.

## What is still open beyond the three threads

1. **Phase 2, research.** Every retrieved claim gets recorded with the failure it prevents, then a verdict — adopt, reject, already do it, does not apply — with the argument. **A claim that cannot name a failure Flow has actually hit is rejected by default.** Most published guidance targets teams shipping plugins, and Flow has decided against versioning, manifests and install CLIs. Sources mostly on disk: `wip/refs/guidelines/agentskills`, `wip/research/claude-code-docs/`.
2. **Phase 4, the writing sweep**, over whatever phase 3 did not rewrite. `global/CLAUDE.md` and the `SKILL.md` files first, since those load most.
3. **A test suite for `flow`** — about 1,900 lines of Node, verified only by hand. The walks produced the case material: a plan with no top-level checkboxes, a parent forced closed around an open child, a dropped ticket with live dependents, `--by` pointing at a dropped replacement.
4. **The install skill**, one skill covering every starting state. The last thing built, and its name is deliberately unpicked.

## What was found

- **The live surface is 23 files, about 2,200 lines** — `skills/` minus `debug-web-pages`, `global/`, `agents/`, `commands/`, `project-template/`, the repo `CLAUDE.md`. `debug-web-pages` is out of every phase; it gets rewritten after the move to Linux.
- **How browser-harness handles knowledge buildup** (`wip/refs/browser-harness`, read at the user's request). Knowledge lives in `agent-workspace/domain-skills/<host>/`, one folder per site, 99 of them. **Retrieval is mechanical — the agent never decides to look:** `goto_url(...)` returns up to 10 matching filenames for the host it just navigated to, so the tool call the work already requires is what surfaces the knowledge. Files share one shape: what to do first, working code with real observed output inline, then a long `## Gotchas` list, one failure and its fix per entry. **What transfers is the principle, never the structure** — Flow has no key as clean as a hostname. It is what argued `execute` Pass 1 into reading `docs/context/`.
- **`flow` permits any status transition.** `cmdTransition` guards unmet deps and open children, nothing else. A dependency counts as satisfied at `review`.
- **Delapse plan files drift.** Of its finished milestones, `m30`'s plan has 0 of 48 checkboxes ticked and `m08`'s 0 of 65; `m29b` has 5 of 38, `m31` has 31 of 32. Another tool ran those, so it does not indict Flow's own instruction to tick a step.
- **The records under `wip/context/` are worth cleaning.** `threads.md` opens "Three discussion threads" over a table of six, and both it and `remaining.md` still count `grill` and still say `wip/` gets deleted — a premise that died when the folder was kept.
- **Session transcripts are greppable** at `~/.claude/projects/-home-me-code-flow/*.jsonl`, one per session. That is how a "did we decide this" question gets settled when the written record is wrong.

## What to open

- **`wip/context/audit.md`** — the whole teardown. All 21 findings, the locked decisions, the seams that held under a walk, and the reasoning behind every reversal. Read all of it.
- **`wip/context/threads.md`** — six threads, three still live.

## The first action

**Ask how a ticket actually gets started** — by typing `/start t047`, or by saying it in prose. That one answer decides the F22 recommendation, and F22 is the largest open question in Flow right now. Everything else waits behind a design conversation, and nothing gets edited until a specific plan is approved: feedback is not approval, and a hedged message is a no.
