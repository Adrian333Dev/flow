---
name: debug
description: Finds the cause by evidence, proves it, fixes it.
---

# Debug

Find the cause by evidence, prove it, then fix it.

**The failing check**: something that fails on this exact bug, every run, and prints something that moves when the bug does.

Usually it is one command you run yourself. Where the failure lives out of reach (a browser, a phone, a service behind a login), the check is a short sequence the user runs and reports back, as exact and repeatable as a command.

**On a ticket, read `reports/<failure>.md` before step 1**, if it exists. Resume at the first hypothesis nothing killed. Never restart the loop. No report → step 1.

- **On a ticket** → `flow start <id> --activity debug`, also where it is already `in-progress`.
- **No ticket** → `flow new "<what failed>" --label bug`, then the same command, before the first hypothesis.

## The loop

4 steps, in order. A step you cannot finish is the finding: say so and stop there.

1. **Build the failing check.** Tighten it until it is fast and deterministic: a narrower test, a smaller input, a direct call instead of the whole suite. Reading code to work out what the check should be is part of building it.

   Read all of its output, every line and every frame. The frame naming your own file is where to look, and it is rarely the one printed first. Truncated output is not output: re-run it wider.

   **Never name a cause, a suspect or a likely file until the check has failed in front of you.**

2. **Rank 3 hypotheses, and show the user all 3 before testing any.** 3, always.

   **A failure inside an outside tool → search its issues first**: `gh search issues <words> --repo <owner/repo>`.

   **Find one case that works and one that breaks**, then narrow the gap between them. In time: the last commit that passed against the first that failed, which is what `git bisect` automates. In the input, the largest payload that survives against the smallest that fails. In the machine, the box that works against the box that does not.

   **Force the 3 apart, each a different kind of cause.** Bad data arriving, an environment that differs from the one that works, and 2 things happening in the wrong order are 3 kinds. "`parseDate` mishandles the timezone", "`parseDate` mishandles the locale" and "`parseDate` mishandles a leap year" are one kind in 3 coats of paint.

3. **Write the prediction, then run the check.** "If X is the cause, changing Y makes the check pass."

   Believe the result. Write a killed hypothesis down. A survivor never softens into "probably".

4. **Fix the cause, then re-run the failing check.** A fix checked against a different command, a manual click, or your own reading of the diff is unverified.

**Open `reports/<failure>.md` at step 1**, in the ticket folder, named after what failed, and write the hunt into it as it runs: the failing check, every hypothesis and how it died, what survived. When the hunt ends, add the cause, the fix, and the output that proves it. A fact that outlives the bug entirely, a verified command, a settled convention, goes where `## Capture` sends it as well. Name the report in the ticket's `## References` when you open it, so a restart mid-hunt finds it.

**Close it with a status**: `FIXED`, `FOUND_NOT_FIXED` where the cause is proved and the fix needs a decision nobody gave, or `UNPROVEN` where the hypotheses ran out. `UNPROVEN` is a real result: what got ruled out is the deliverable.

**Then close the ticket by that status:**

- **`FIXED`** → `flow done <id>` once the user confirms the fix, where the ticket has no parent and no open `## Tasks`. Otherwise report `FIXED` and stop: the parent session, or `/flow:execute`, closes it.
- **`FOUND_NOT_FIXED`, `UNPROVEN`** → it stays `in-progress`. The user decides whether the hunt carries on, parks or drops.

### When the failure is somewhere you cannot reach

**Look for your own way in first.** An MCP server already configured, a CLI already logged in, a local port, a log file on disk, a read-only replica. A database "behind a VPN" is often a `psql` this machine already runs. Found a way in → build the failing check on it and carry on.

No way in → ask, and ask early.

**Run it as a loop**: write the probe, the user runs it and pastes the output back, you read it and write the next one. Make each round earn its interruption.

- **Write one block to paste**: a console snippet, a SQL query, a `curl`. Exact, runnable unedited, and ending with what to send back.
- **Print more than the answer.** Label every line, and print the surrounding state beside it.
- **Where no snippet fits, name the action**: "click Export, then say whether the error box appears".
- **Ask for what only they know**: "did anything change on the server last week".

**Put every question for one round in one message.**

### When you cannot make it fail on demand

Raise the failure rate instead of chasing a clean reproduction. Loop the command a hundred times, shrink the timeout, load the machine, run the suite in a random order. A bug that fails one run in fifty is a failing check with a `for` loop around it.

Record what was different about the run that failed. Then split 4 ways: timing, environment, leftover state, ordering.

### When the hypotheses run out

4 moves, in order.

- **Restate the failure in different words.** "The test fails" → "the assertion reads `undefined` where the fixture wrote `0`".
- **Trace the bad value back to where it was born.** Print it at every boundary it crosses until you find the first place it is already wrong.
- **Instrument every boundary at once**, in a system with parts: request in, queue out, worker in, database write.
- **Ask where this shape appeared before**, in any stack.

Still nothing → say so, list what was ruled out and what would settle it, then hand it back. **Evidence with no cause is a real result.**

### When 3 fixes have failed

Stop fixing: the shape of the code is the cause. Name the structure that makes this bug possible, and hand the decision back under `FOUND_NOT_FIXED`.

## Handing the hunt to a subagent

**Hunt here.** A fix that needs a decision nobody gave is the user's, and 3 failed fixes always mean one: ask here, and carry on with the answer. Only when the hypotheses ran out does a fresh subagent take the hunt.

**Brief it with two things**: the report's path, and the failing check. No ticket is made.

`~/.flow/references/subagents.md` says how a question it has reaches the user.

**When a fix comes back, re-run the failing check yourself.** It passes → close the ticket by the rule above.

## Hard rules

- **Never change code to see what happens.** That counts as a check only where you wrote down first what each outcome would mean.
- **Fix the cause, never the symptom.** Silencing the error, widening a type, adding a retry.
- **Never widen the fix.** A cleanup spotted on the way gets named, never made.
- **Never write the regression test here.** Where the failing check is already a test, the fix is covered. Where it is not, name the test that should exist and hand it to the ticket.
- **Delete every debug print you added.** Tag them all with one unique prefix as you write them, so removing them is one grep.
