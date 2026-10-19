# Study cases

## A new fault is a ticket

A new mistake, fault in Flow or rejected output is a ticket labelled `flow-issue` plus a type, never a new case: `flow new "<short name>: <what went wrong>" --label flow-issue,<type>`. `flow labels "label:flow-issue"` lists the types with counts, and a near-miss on an existing type refuses; `--force` means it really is a new type. The body below is the shape of the ticket's description. The cases already written stay readable with `flow cases`, until they move into tickets.

## Note or case

A study case when **an artifact exists that will be gone tomorrow**: output the user reacted to, a file that came out wrong, a rule that was loaded and did not fire.

Nothing to preserve (friction hit twice, a gap, a rule that fought the work) → `flow note "…"`.

## Writing one (the old way)

    flow cases
    flow cases new "<title>" --type <type> [--rule "<the rule that did not fire>"]

`flow` owns the path, the date and the frontmatter. It fills in the project from where you stand, and the model and effort level from the running session. You write the body.

**Run `flow cases` first, every time**, and reuse a type that fits. Name the **type of failure**, never this instance of it, `premature-implementation`, not `rewrote-the-rules-early`. A near-miss on an existing type refuses; `--force` means it really is a new type.

`--rule` names the rule that was loaded and did not fire. Omit it when none was.

Cases are files, at `~/.flow/study-cases/<type>/<date>-<slug>.md`. A folder only when one carries attachments: a long pasted output, two versions of one file.

## Two stages

**Now:** the artifact verbatim, plus one line of what was wrong. Nothing else. Never let it derail the work.

**Later:** the analysis, in the sections the template leaves waiting.

## Body

- **What the user sent**: verbatim where the wording is the evidence. Shape counts as much as content: a hedge, a question, a repeat.
- **What happened**: what was produced or done.
- **Why it was wrong**: the concrete cost, not the principle.
- **The tell that was missed**: what was visible at the time and read wrong.
- **Root cause**: one sentence.
- **What would have been right.**
- **The rule that failed**, where one existed. A rule that was loaded and did not fire is a defective rule, not a defective reading: say what it fails to name.

## Whether a rule loaded

`grep '"loaded"' ~/.flow/logs/scorecards/<session-id>.jsonl` prints one line per `CLAUDE.md`, file it imports, or `.claude/rules/*.md` file that entered the session's context. A path-scoped rule loads only after a matching file is read, so its line can be missing. The current session's id is `$CLAUDE_CODE_SESSION_ID`, and `flow audit sessions` lists past ones. A skill leaves no line: find its invocation in the transcript.

A rule that loaded and stayed silent is defective. A rule that never loaded is absent: the fault is whatever should have loaded it.

## Closing

`flow cases edit <ref> --status fixed --by <file>`. Only a fix with a file to name closes a case. Never delete a case.
