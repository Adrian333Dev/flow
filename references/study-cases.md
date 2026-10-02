# Study cases

## Note or case

`~/.flow/workflow-notes.md` when there is nothing to preserve: friction hit twice, a gap, a rule that fought the work. One line.

A study case when **an artifact exists that will be gone tomorrow**: output the user reacted to, a file that came out wrong, a rule that was loaded and did not fire.

## Writing one

    flow cases issues
    flow cases new "<title>" --issue <issue> [--rule "<the rule that did not fire>"]

`flow` owns the path, the date and the frontmatter. It fills in the project from where you stand, and the model and effort level from the running session. You write the body.

**Run `flow cases issues` first, every time**, and reuse an issue that fits. Name the **kind of failure**, never this instance of it, `premature-implementation`, not `rewrote-the-rules-early`. A near-miss on an existing issue refuses; `--force` means it really is a new kind.

`--rule` names the rule that was loaded and did not fire. Omit it when none was.

Cases are files, at `~/.flow/study-cases/<issue>/<date>-<slug>.md`. A folder only when one carries attachments: a long pasted output, two versions of one file.

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

## Closing

`flow cases edit <ref> --status fixed --by <file>`. Only a fix with a file to name closes a case. Never delete a case.
