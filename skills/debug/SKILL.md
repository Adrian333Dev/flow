---
name: debug
description: ALWAYS invoke when something fails and the cause is unknown — a test that broke, an error nobody expected, behavior that is wrong but runs, a fix that did not hold, a failure that came back. Finds the cause by evidence, proves it, then fixes that. Browser and DOM specifics belong to `debug-web-pages`, which this hands off to. Not for a failure whose cause the error message already states.
---

# Debug

Find the cause by evidence, prove it, then fix it. The fix is the cheap part.

**The red command** — one command that fails on this exact bug, every run, and prints something that moves when the bug does. Everything below reads from it.

## The loop

Four steps, in order. A step you cannot finish is the finding: say so and stop there.

1. **Build the red command.** Tighten it until it is fast and deterministic — a narrower test, a smaller input, a direct call instead of the whole suite. Reading code to work out what the command should be is part of building it.

   Read all of its output, every line and every frame. The frame naming your own file is where to look, and it is rarely the one printed first. Truncated output is not output — re-run it wider.

   **Never name a cause, a suspect or a likely file until that command has failed in front of you.** "Do not trust your own guess" asks you to watch your own belief, and nothing on the page shows whether you did. Whether the command ran shows.

2. **Rank three hypotheses, then show the user.** Three, always, before testing any of them. One hypothesis becomes the fact by default; three cannot all be.

   Bound it first where you can: the last commit that passed, the input that survives, the machine that does not fail. Two known points either side turn guessing into a bisect.

   Force the three apart — one from the data, one from the environment, one from the ordering. Three ways the same function could be wrong is one hypothesis in three coats of paint.

   **Send the ranked three before testing the first.** The user re-ranks instantly from what you cannot see: a deploy last week, a suspect they already cleared, a machine that was rebuilt. It is the cheapest correction in the loop.

3. **Write the prediction, then run the check.** "If X is the cause, changing Y makes the red command pass." Written first, or ambiguous output reads as confirmation — that retro-fit is the moment a guess turns into a fact.

   Believe the result. A killed hypothesis is progress, and it gets written down. A survivor never softens into "probably".

4. **Fix the cause, then re-run the red command.** Nothing else verifies it. A fix checked against a different command, a manual click, or your own reading of the diff is unverified.

**Write the hunt down as it runs** — the red command, every hypothesis and how it died, what survived. Inside a ticket that is `## State`; without one, `handoff` writes a file. Nothing else records any of it, which makes an interrupted hunt the most expensive thing in Flow to lose.

**Once the cause is proved, write the report** — `reports/<failure>.md` in the ticket folder, named after what failed: what failed, the red command, which hypotheses died and how, the cause, the fix, and the output that proves it. `## State` is deleted when the ticket closes and this is not — a cause found once is worth finding again, because the same bug returns wearing a different symptom. A fact that outlives the bug entirely — a verified command, a settled convention — goes to `docs/context/<subject>.md` as well.

### When you need an observation only the user can make

A browser you cannot drive, a database behind a VPN, a phone, a service behind a login. Asking early is correct, and it is never defeat.

- **A block to paste** — a console snippet, a SQL query, a `curl`. One block, exact, ending with what to send back.
- **An action to take** — "click Export, then say whether the error box appears". For a signal with no machine-readable form.
- **A fact only they hold** — "did anything change on the server last week". The cheapest observation in debugging, and the one agents skip.

**Put every question in one message.** Ask, wait, ask again is what makes being in the loop unbearable.

### When you cannot make it fail on demand

Raise the failure rate instead of chasing a clean reproduction. Loop the command a hundred times, shrink the timeout, load the machine, run the suite in a random order. A bug that fails one run in fifty is a red command with a `for` loop around it.

Record what was different about the run that failed. Then split four ways — timing, environment, leftover state, ordering. Those cover nearly all of it, and each one raises the rate differently.

### When it only fails in a browser

DOM, events, network, rendering — anything that reproduces only inside a page → `debug-web-pages`. It owns the capture bundles and the probe snippets, and its live-experiment mode already is the write-it, you-run-it, paste-it-back loop. It builds the red command; the four steps above still run here.

### When the hypotheses run out

Four moves, in order. None of them is guessing harder.

- **Restate the failure in different words.** "The test fails" → "the assertion reads `undefined` where the fixture wrote `0`". Stuck debugging is usually a question too vague to answer.
- **Trace the bad value back to where it was born.** Print it at every boundary it crosses until you find the first place it is already wrong. That place is the cause; everything after it is the symptom.
- **Instrument every boundary at once**, in a system with parts — request in, queue out, worker in, database write. One pass says which layer broke, instead of a guess about which layer to open.
- **Ask where this shape appeared before**, in any stack. Timing, encoding and caching bugs look identical everywhere, and last time's language does not matter.

Still nothing → say so, list what was ruled out and what would settle it, then hand it back. **Evidence with no cause is a real result.** A guess dressed as a cause is not.

### When three fixes have failed

Stop fixing. Three failed fixes means the hypothesis was never the problem — the shape of the code is. Name the structure that makes this bug possible, and hand the decision back. A fourth attempt from the same understanding costs the same and lands the same.

## Dispatching the hunt

**Debug here by default.** The fix lands in code this session already knows, and a cold session re-derives all of it first.

Dispatch where the hunt is long and its context is disposable — running the reproduction fifty times, bisecting a history, reading a large log, trying six variants of one command. That reading fills a window and none of it is worth keeping. The cause and the evidence are.

### How to dispatch

A background session, never the `Agent` tool. `Agent()` blocks or detaches and returns one report either way, and neither can be answered mid-hunt. This hunt asks questions.

**The brief is a child ticket.** `handoff` writes it, and `flow` takes it on stdin — so an untruncated stack trace never passes through shell quoting:

```bash
flow ticket new "<what failed>" --type issue --parent t047 --body - <<'EOF'
<the brief>
EOF
claude --agent debug --bg --name "t123" "Run flow start t123, read it, and start."
```

The brief carries four things and never the conversation:

- **What failed** — the step, the command, or what the user did
- **The error**, in full, untruncated
- **What changed** — the diff, or the last state known to work
- **Already tried** — one line each, and what it ruled out

**Tell it to write its answer into `reports/<failure>.md`, in its own ticket folder.** The ticket is what makes this safe to dispatch: it carries a status, and the dispatching ticket's `flow done` refuses to close around it while it is open — which is what a file nobody marks finished could never do.

**No ticket system here** → `handoff` writes a file instead, and the session reads that.

### While it runs

**Tell the user it is running, and name the row.** They are the one who answers it.

**Touch nothing it might touch.** Two sessions editing one checkout is how a proved fix gets overwritten.

Check when the answer is next needed, never in a loop:

```bash
claude agents --json --cwd .
```

`state` reads `working`, `blocked`, `done`, `failed` or `stopped`. `blocked` with `waitingFor: "input needed"` means it is asking the user — say so, and name the row. `done` means read the report file.

When it lands, re-run the red command yourself. Its verification output is its own claim.

## Hard rules

- **Never change code to see what happens.** That counts as a check only where you wrote down first what each outcome would mean.
- **Never fix before the red command exists.** A fix for a failure nobody reproduced is a guess that also edited the code.
- **Fix the cause, never the symptom.** Silencing the error, widening a type, adding a retry — each one buries the bug, and it returns somewhere worse.
- **Never widen the fix.** A cleanup spotted on the way gets named, never made.
- **Never write the regression test here.** The red command is the check. Already a test → the fix is covered. Not a test → name the test that should exist and hand it to the ticket. Building a test seam mid-fix is the widening this skill just banned.
- **Delete every debug print you added.** Tag them all with one unique prefix as you write them, so removing them is one grep.
- **Keep observed apart from supposed.** Observed means a command ran and here is its output. Every sentence that drives the next action traces back to observed output.
