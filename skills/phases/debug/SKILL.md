---
name: debug
description: Finds the cause by evidence, proves it, fixes it.
---

# Debug

Find the cause by evidence, prove it, then fix it. The fix is the cheap part.

**The failing check** — something that fails on this exact bug, every run, and prints something that moves when the bug does. Everything below reads from it.

Usually it is one command you run yourself. Where the failure lives somewhere you cannot reach — a browser, a phone, a service behind a login — the check is a short sequence the user runs and reports back, and it has to be as exact and as repeatable as a command.

**On a ticket** → `flow build <id>` before step 1, unless a `→ building` line above shows `/start` already made the move. An `issue` has no phase before building.

## The loop

Four steps, in order. A step you cannot finish is the finding: say so and stop there.

1. **Build the failing check.** Tighten it until it is fast and deterministic — a narrower test, a smaller input, a direct call instead of the whole suite. Reading code to work out what the check should be is part of building it.

   Read all of its output, every line and every frame. The frame naming your own file is where to look, and it is rarely the one printed first. Truncated output is not output — re-run it wider.

   **Never name a cause, a suspect or a likely file until the check has failed in front of you.** "Do not trust your own guess" asks you to watch your own belief, and nothing on the page shows whether you did. Whether the check ran shows.

2. **Rank three hypotheses, then show the user.** Three, always, before testing any of them. One hypothesis becomes the fact by default; three cannot all be.

   **Find one case that works and one that breaks**, then narrow the gap between them. In time — the last commit that passed against the first that failed, which is what `git bisect` automates. In the input — the largest payload that survives against the smallest that fails. In the machine — the box that works against the box that does not. Two known points either side beat any amount of guessing.

   **Force the three apart, each a different kind of cause.** Bad data arriving, an environment that differs from the one that works, and two things happening in the wrong order are three kinds. "`parseDate` mishandles the timezone", "`parseDate` mishandles the locale" and "`parseDate` mishandles a leap year" are one kind in three coats of paint.

   **Send the ranked three before testing the first.** The user re-ranks instantly from what you cannot see: a deploy last week, a suspect they already cleared, a machine that was rebuilt. It is the cheapest correction in the loop.

3. **Write the prediction, then run the check.** "If X is the cause, changing Y makes the check pass." Written first, or ambiguous output reads as confirmation — that retro-fit is the moment a guess turns into a fact.

   Believe the result. A killed hypothesis is progress, and it gets written down. A survivor never softens into "probably".

4. **Fix the cause, then re-run the failing check.** Nothing else verifies it. A fix checked against a different command, a manual click, or your own reading of the diff is unverified.

**Write the hunt down as it runs** — the failing check, every hypothesis and how it died, what survived. Inside a ticket that is `## State`; without one, `/handoff` writes a file. Nothing else records any of it, which makes an interrupted hunt the most expensive thing in Flow to lose.

**When the hunt ends, write the report** — `reports/<failure>.md` in the ticket folder, named after what failed: what failed, the failing check, which hypotheses died and how, the cause, the fix, and the output that proves it. No ticket → `REPORT-<failure>.md` beside the work. `## State` is deleted when the ticket closes and this is not — a cause found once is worth finding again, because the same bug returns wearing a different symptom. A fact that outlives the bug entirely — a verified command, a settled convention — goes to `docs/context/<subject>.md` as well.

**Open it with a status**, so the answer is the first line a week later: `FIXED`, `FOUND_NOT_FIXED` where the cause is proved and the fix needs a decision nobody gave, or `UNPROVEN` where the hypotheses ran out. `UNPROVEN` is a real result — what got ruled out is the whole deliverable then, and it is worth as much as a fix.

### When the failure is somewhere you cannot reach

**Look for your own way in first.** An MCP server already configured, a CLI already logged in, a local port, a log file on disk, a read-only replica. A database "behind a VPN" is often a `psql` this machine already runs, and one tool call beats a round trip through the user. Found a way in → build the failing check on it and carry on.

No way in → ask, and ask early. It is never defeat.

**The exchange is a loop, not one question.** Write the probe, the user runs it and pastes the output back, you read it and write the next one. Each round narrows the failure, and every round costs the user a context switch — so make each one earn its interruption.

- **Write one block to paste** — a console snippet, a SQL query, a `curl`. Exact, runnable unedited, and ending with what to send back.
- **Print more than the answer.** Label every line, and print the surrounding state beside it. Output that turns out ambiguous costs a whole round to ask again.
- **Where no snippet fits, name the action** — "click Export, then say whether the error box appears". For a signal with no machine-readable form.
- **Ask for what only they know** — "did anything change on the server last week". The cheapest observation in debugging, and the one agents skip.

**Put every question for one round in one message.** Ask, wait, ask again is what makes being in the loop unbearable.

### When you cannot make it fail on demand

Raise the failure rate instead of chasing a clean reproduction. Loop the command a hundred times, shrink the timeout, load the machine, run the suite in a random order. A bug that fails one run in fifty is a failing check with a `for` loop around it.

Record what was different about the run that failed. Then split four ways — timing, environment, leftover state, ordering. Those cover nearly all of it, and each one raises the rate differently.

### When it only fails in a browser

DOM, events, network, rendering — anything that reproduces only inside a page → `/web-pages`. It owns the capture bundles and the probe snippets, and it runs the loop above with tooling built for a page. It builds the failing check; the four steps above still run here.

### When the hypotheses run out

Four moves, in order. None of them is guessing harder.

- **Restate the failure in different words.** "The test fails" → "the assertion reads `undefined` where the fixture wrote `0`". Stuck debugging is usually a question too vague to answer.
- **Trace the bad value back to where it was born.** Print it at every boundary it crosses until you find the first place it is already wrong. That place is the cause; everything after it is the symptom.
- **Instrument every boundary at once**, in a system with parts — request in, queue out, worker in, database write. One pass says which layer broke, instead of a guess about which layer to open.
- **Ask where this shape appeared before**, in any stack. Timing, encoding and caching bugs look identical everywhere, and last time's language does not matter.

Still nothing → say so, list what was ruled out and what would settle it, then hand it back. **Evidence with no cause is a real result.** A guess dressed as a cause is not.

### When three fixes have failed

Stop fixing. Three failed fixes means the hypothesis was never the problem — the shape of the code is. Name the structure that makes this bug possible, and hand the decision back under `FOUND_NOT_FIXED`: the structure is the cause, and replacing it is a decision nobody gave. A fourth attempt from the same understanding costs the same and lands the same.

## Handing it back

**Hunt here.** The fix lands in code this session already knows, and a fresh session re-derives all of that first.

Three things end the hunt here: **the fix needs a decision nobody gave**, **the hypotheses ran out**, or **three fixes have failed**. All three go the same way — a ticket, then the user.

**Write the report first, then cut a thin ticket at it.** The report already carries the error, every hypothesis and how it died. Copying that into a ticket body hands the next session two versions of one hunt.

**The body carries three things and never the conversation:**

- **What failed**, in one line — the step, the command, or what the user did
- **The report**, by its path from the repo root. It sits in *this* ticket's folder, and `flow get --files` resolves a path against the new ticket first, so a bare `reports/<failure>.md` points at an empty folder
- **What would settle it** — the decision needed, or the evidence still missing

```bash
flow new "<what failed>" --type issue --parent t047 --body - <<'EOF'
<the three things>
EOF
```

**The ticket is what makes this safe:** it carries a status, and the parent refuses to close around it while it is open, which a file nobody marks finished could never do.

**No ticket system here** → the report is already beside the work, and `/handoff` writes the pickup beside it. The report is the evidence; the handoff is what the next session does with it.

Then stop. The user opens it in a fresh session, and works the hunt there directly with whoever picks it up. When a fix comes back, re-run the failing check yourself — someone else's verification output is their claim, not yours.

## Hard rules

- **Never change code to see what happens.** That counts as a check only where you wrote down first what each outcome would mean.
- **Never fix before the failing check exists.** A fix for a failure nobody reproduced is a guess that also edited the code.
- **Fix the cause, never the symptom.** Silencing the error, widening a type, adding a retry — each one buries the bug, and it returns somewhere worse.
- **Never widen the fix.** A cleanup spotted on the way gets named, never made.
- **Never write the regression test here.** Where the failing check is already a test, the fix is covered. Where it is not, name the test that should exist and hand it to the ticket. Building a test seam mid-fix is the widening this skill just banned.
- **Delete every debug print you added.** Tag them all with one unique prefix as you write them, so removing them is one grep.
- **Keep observed apart from supposed.** Observed means a command ran and here is its output. Every sentence that drives the next action traces back to observed output.

!`flow overlays debug`
