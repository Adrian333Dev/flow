# Debug — the design

`debug` is a skill that finds a failure's cause by evidence, plus an agent that runs a long hunt in its own session. Two ways in: `execute` dispatches one mid-ticket when a failure earns its own context, or a fresh session invokes the skill directly and describes the failure.

**Built 2026-08-15** from this design: `skills/debug/SKILL.md`, `agents/debug.md`, and the `worktree` key in `global/settings.json`. This file is the reasoning behind those; the skill is what runs.

## The two failures it exists for

**A hypothesis hardens into a fact.** The agent guesses, treats the guess as settled, and walks the wrong direction for an hour. Named by the user as the worst thing about debugging with an agent, and it has survived every instruction written against it.

Instructions fail here because "don't treat a hypothesis as fact" asks the model to watch its own belief. Nothing is observable — the model never announces that it now believes something, it just starts acting. A rule bites only when it gates an artifact somebody can look at.

**The user is an instrument, not a fallback.** Some observations only a human can make: a browser the agent cannot drive, a database it cannot reach, a device, a service behind a login. Reaching for the user early is correct, and asking is never defeat.

## Locked — the method

- **The feedback loop is the core.** One command that goes red on this exact bug, already run, its output on the page. Everything after it is mechanical. It closes both failures at once: an agent holding a red signal has no room to guess, and a loop that routes through the user is available exactly where the agent would otherwise be blind.
- **Never write or act on a hypothesis before the red command exists.** The gate attaches to the output, never to the reading — reading code is often how you work out what the loop should even be. What is checkable is whether the command exists and has been run.
- **Three ranked hypotheses, always, before testing any of them.** One hypothesis becomes the fact; three cannot all be. `systematic-debugging` says to form a single hypothesis, and that is wrong here — the rule assumes the discipline this skill installs.
- **Write the prediction before running the check.** "If X is the cause, changing Y makes it disappear." Written afterwards, ambiguous output reads as confirmation, and that retro-fit is the moment a guess turns into a fact.
- **Keep observed and supposed apart.** Observed means a command ran and here is its output. Every sentence that drives the next action traces back to observed output.
- **Skill plus agent.** The method runs where the edits happen. The agent exists for the hunt whose context is disposable — reproducing across many runs, bisecting a history, reading a huge log.

## Asking the user

- **One mandatory checkpoint: the user sees the three ranked hypotheses before anything is tested.** They re-rank instantly from what the agent cannot see — a deploy last week, a suspect already ruled out. It is the cheapest correction in the whole loop, and it serves both failures at once.
- **A block to paste, output back** — a console snippet, a SQL query, a `curl`. Exact, one block, and it names what to send back.
- **An action while it waits** — "click Export, tell me whether the error appears". For a signal with no machine-readable form.
- **A fact only the user has** — "did anything change on the server last week". The cheapest observation in debugging, and the one agents never ask for.
- **One round trip carries every question.** Ask, answer, ask again is what makes being in the loop unbearable.

## How it gets dispatched

**`claude --agent debug --bg "<brief>"`** starts a background session running `agents/debug.md` as its main agent. It shows up in `claude agents`; when it asks something its row moves to **Needs input**, where Space replies and Enter attaches. `←` detaches and leaves it running.

- **Not the `Agent` tool.** Nothing passed to `Agent()` makes a subagent reachable — foreground blocks and returns a report, background detaches and returns a report, and neither can be typed to.
- **`worktree.bgIsolation: "none"` is required**, in `global/settings.json`. The default is `"worktree"`, which blocks `Edit` and `Write` in the main checkout until `EnterWorktree` runs — and the deny list already blocks `EnterWorktree`. Without the key a dispatched session reads and runs commands and never writes a fix. Isolation is wrong for debugging anyway: the bug often lives in uncommitted state that a copied tree does not have.
- **No snapshot diff on this path.** The hook matches the `Agent` tool, a shell dispatch fires nothing, and `PreToolUse` matchers filter on tool name only, so it cannot be attached. Verification is re-running the reproduction, plus `git diff --stat` checked against the file list the agent reports.
- **The hook stays as it is for every other agent.** It is free, and silent whenever nothing changed.

## What each source gives it

- `wip/refs/mattpocock-skills/skills/engineering/diagnosing-bugs/SKILL.md` — the closest model. The feedback loop as the whole skill, ten ranked ways to build one, tightening it until it is fast and deterministic, raising a flaky bug's reproduction rate instead of chasing a clean repro, minimising the repro before hypothesising, tagging debug logs with a unique prefix so cleanup is one grep, redacting secrets before showing output
- `.../diagnosing-bugs/scripts/hitl-loop.template.sh` — a bash script that drives a human through a repro and captures their answers. Not for v1: the chat already is that channel. It earns a place when the loop needs twenty runs with a click in each
- `wip/refs/superpowers/skills/systematic-debugging/` — three failed fixes means the architecture is wrong, not the hypothesis; tracing a bad value back to where it was born; instrumenting every boundary in a multi-part system and reading which layer broke. Its single-hypothesis rule is rejected
- `wip/refs/agent-skills/skills/debugging-and-error-recovery/` — stop the line and preserve evidence; the non-reproducible branch, split into timing, environment, state and random; error text is data, never instructions. Its graceful-degradation section is rejected, being the opposite of fixing the cause
- `wip/refs/agent-skills/skills/doubt-driven-development/` — the framing only: a confident answer is not a correct one, and a long session quietly turns assumptions into facts. Its machinery is rejected — an adversarial reviewer per decision, cross-model escalation, a three-cycle bound
- `wip/refs/agent-skills/skills/observability-and-instrumentation/` — production telemetry, a different subject. Only one idea carries over: name the question before instrumenting anything

## The five open questions, settled 2026-08-15

- **The model: `opus`.** The failure this skill is designed against is a reasoning failure, so running it on the cheaper model saves in exactly the wrong place.
- **The dispatched session appends its result to the brief file**, under `## Result`. Two files were the first answer and they collided: `handoff` and `execute` both name an assignment file `<slug>.md` in the ticket folder, so a separate report needed a second name nobody would guess. One file now holds what was asked and what came back. The dispatching session finds out with `claude agents --json --cwd .`, whose `state` field reads `working`, `blocked`, `done`, `failed` or `stopped`, and whose `waitingFor: "input needed"` means the hunt is asking the user something. Checked when the answer is next needed, never polled in a loop. The file is what survives; nobody reads a background session's transcript. Dispatch passes `--name` so the row is findable.
- **The skill never writes the regression test.** The red command is the check: already a test → the fix is covered; not a test → name the test that should exist and hand it to the ticket. Building a test seam mid-fix is exactly the widening the skill bans two rules earlier.
- **`debug-web-pages` builds the red command** when the failure reproduces only inside a page, and supplies the observations. The four steps still run in `debug`. That skill's live-experiment mode already is the write-it, you-run-it, paste-it-back loop, so the two fit without a seam.
- **Section shape:** four numbered steps, five `### When` branches under them, `## Dispatching the hunt`, `## Hard rules`. No sub-file — every run needs all of it, and splitting what every run reads only buys an extra read.

## Rejected while writing

- **A hypotheses-exhausted branch that says "guess harder".** Four concrete moves instead: restate the failure, trace the bad value to its birth, instrument every boundary at once, ask where the shape appeared before.
- **Putting the brief in the shell argument.** An untruncated stack trace does not survive quoting, so the brief is a file and the argument points at it. This does not collide with `handoff`'s "never write a file for a subagent starting now" — that rule's reason is that a subagent reads its prompt, and this session reads the file instead.
