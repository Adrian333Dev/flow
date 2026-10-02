---
name: debug
description: Finds the cause by evidence, proves it, fixes it.
---

# Debug

Find the cause by evidence, prove it, then fix it.

**The failing check**: something that fails on this exact bug, every run, and prints something that moves when the bug does.

Usually it is one command you run yourself. Where the failure lives out of reach (a browser, a phone, a service behind a login), the check is a short sequence the user runs and reports back, as exact and repeatable as a command.

**On a ticket, read `## State` before step 1.** Resume at the first hypothesis nothing killed. Never restart the loop. Nothing written there → step 1.

- **Sent from `/flow:execute` mid-build** → move no status. `/flow:execute` owns the moves.
- **Any other ticket** → `flow build <id>`.
- **No ticket** → `flow new "<what failed>" --type issue`, then `flow build <id>`, before the first hypothesis.

## The loop

4 steps, in order. A step you cannot finish is the finding: say so and stop there.

1. **Build the failing check.** Tighten it until it is fast and deterministic: a narrower test, a smaller input, a direct call instead of the whole suite. Reading code to work out what the check should be is part of building it.

   Read all of its output, every line and every frame. The frame naming your own file is where to look, and it is rarely the one printed first. Truncated output is not output: re-run it wider.

   **Never name a cause, a suspect or a likely file until the check has failed in front of you.**

2. **Rank 3 hypotheses, and show the user all 3 before testing any.** 3, always.

   **Find one case that works and one that breaks**, then narrow the gap between them. In time: the last commit that passed against the first that failed, which is what `git bisect` automates. In the input, the largest payload that survives against the smallest that fails. In the machine, the box that works against the box that does not.

   **Force the 3 apart, each a different kind of cause.** Bad data arriving, an environment that differs from the one that works, and 2 things happening in the wrong order are 3 kinds. "`parseDate` mishandles the timezone", "`parseDate` mishandles the locale" and "`parseDate` mishandles a leap year" are one kind in 3 coats of paint.

3. **Write the prediction, then run the check.** "If X is the cause, changing Y makes the check pass."

   Believe the result. Write a killed hypothesis down. A survivor never softens into "probably".

4. **Fix the cause, then re-run the failing check.** A fix checked against a different command, a manual click, or your own reading of the diff is unverified.

**Write the hunt down as it runs**: the failing check, every hypothesis and how it died, what survived, into the ticket's `## State`.

**When the hunt ends, write the report**: `reports/<failure>.md` in the ticket folder, named after what failed: what failed, the failing check, which hypotheses died and how, the cause, the fix, and the output that proves it. A fact that outlives the bug entirely, a verified command, a settled convention, goes where `## Capture` sends it as well.

**Open it with a status**: `FIXED`, `FOUND_NOT_FIXED` where the cause is proved and the fix needs a decision nobody gave, or `UNPROVEN` where the hypotheses ran out. `UNPROVEN` is a real result: what got ruled out is the deliverable.

**Then move the ticket by that status**, unless `/flow:execute` sent you here:

- **`FIXED`** → `flow review <id>`, then `flow done <id>` once the user confirms the fix. Then offer `/flow:file-findings`. A ticket a parent session handed you stops at `review`: the parent closes it.
- **`FOUND_NOT_FIXED`, `UNPROVEN`** → it stays `building`. The user decides whether the hunt carries on, parks or drops.

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

### When it only fails in a browser

DOM, events, network, rendering: anything that reproduces only inside a page → `/web-pages`. It builds the failing check; the 4 steps above still run here.

### When the hypotheses run out

4 moves, in order.

- **Restate the failure in different words.** "The test fails" → "the assertion reads `undefined` where the fixture wrote `0`".
- **Trace the bad value back to where it was born.** Print it at every boundary it crosses until you find the first place it is already wrong.
- **Instrument every boundary at once**, in a system with parts: request in, queue out, worker in, database write.
- **Ask where this shape appeared before**, in any stack.

Still nothing → say so, list what was ruled out and what would settle it, then hand it back. **Evidence with no cause is a real result.**

### When 3 fixes have failed

Stop fixing: the shape of the code is the cause. Name the structure that makes this bug possible, and hand the decision back under `FOUND_NOT_FIXED`.

## Handing it back

**Hunt here.**

2 things end the hunt here:

- **The fix needs a decision nobody gave**, and 3 failed fixes always mean one → ask the user, here, and carry on with the answer.
- **The hypotheses ran out** → a fresh subagent takes the hunt.

**Write the report first, then cut a thin ticket at it.**

**The body carries 3 things and never the conversation:**

- **What failed**, in one line: the step, the command, or what the user did
- **The report**, by its path from the repo root, never a bare `reports/<failure>.md`
- **What would settle it**: the evidence still missing

```bash
flow new "<what failed>" --type issue --parent exp-47 --body - <<'EOF'
<the 3 things>
EOF
```

Then start a subagent with `Run /flow:debug on <id>`. Pass on every question it ends a turn with, in one line: `<id> asks: <question> Answer in its row below the prompt.` Never answer one yourself. When a fix comes back, re-run the failing check yourself. It passes → `flow done <id>` closes the child. A session that ends first leaves the ticket in `building`, and `/flow:debug /exp-12` picks it up.

## Hard rules

- **Never change code to see what happens.** That counts as a check only where you wrote down first what each outcome would mean.
- **Never fix before the failing check exists.**
- **Fix the cause, never the symptom.** Silencing the error, widening a type, adding a retry.
- **Never widen the fix.** A cleanup spotted on the way gets named, never made.
- **Never write the regression test here.** Where the failing check is already a test, the fix is covered. Where it is not, name the test that should exist and hand it to the ticket.
- **Delete every debug print you added.** Tag them all with one unique prefix as you write them, so removing them is one grep.
- **Keep observed apart from supposed.** Observed means a command ran and here is its output. Every sentence that drives the next action traces back to observed output.
