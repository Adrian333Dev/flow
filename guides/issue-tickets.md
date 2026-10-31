# Issue tickets

## Ticket or note

A ticket when **an artifact exists that will be gone tomorrow**: output the user reacted to, a file that came out wrong, a rule that was loaded and did not fire, a fault in Flow.

Nothing to preserve (friction hit twice, a gap, a rule that fought the work) → `flow notes new "…"`.

## Writing one

    flow tickets labels -- "label:flow-issue"
    flow tickets new "<short name>: <what went wrong>" --label flow-issue,<type> --body "<the evidence>"

The label is `flow-issue` plus one type. `flow` makes the id, the date and the frontmatter. You write the body.

**Run `flow tickets labels -- "label:flow-issue"` first, every time**, and reuse a type that fits. Name the **type of failure**, never this instance of it: `premature-implementation`, not `rewrote-the-rules-early`. A type one typo from an existing one refuses; `--force` means it really is a new type.

Name the rule that was loaded and did not fire in the body, as `Rule: <id>`. Leave it out when none was.

## Two stages

**Now:** the artifact verbatim, one line of what was wrong, and the session: `Session: <$CLAUDE_CODE_SESSION_ID>, began <time from flow audit get>`. Nothing else. Never let it derail the work.
**Later:** the analysis, in the sections below. Read the named session from its first turn to its last before writing it: an annoyance builds across the session's compactions and restarts, so the moment it surfaced holds only its end.

## Body

- **What the user sent**: verbatim where the wording is the evidence. Shape counts as much as content: a hedge, a question, a repeat.
- **What happened**: what was produced or done.
- **Why it was wrong**: the concrete cost, not the principle.
- **The tell that was missed**: what was visible at the time and read wrong.
- **Root cause**: one sentence.
- **What would have been right.**
- **The rule that failed**, where one existed. A rule that was loaded and did not fire is a defective rule, not a defective reading: say what it fails to name.

## Whether a rule loaded

`grep '"loaded"' ~/.flow/logs/scorecards/<session-id>.jsonl` prints one line per `CLAUDE.md`, file it imports, or `.claude/rules/*.md` file that entered the session's context. A path-scoped rule loads only after a matching file is read, so its line can be missing. The current session's id is `$CLAUDE_CODE_SESSION_ID`, and `flow audit` lists past ones. A skill leaves no line: find its invocation in the transcript.

A rule that loaded and stayed silent is defective. A rule that never loaded is absent: the fault is whatever should have loaded it.

## Closing

An issue is open until a file fixes it. Write the file that fixed it into the body, then `flow tickets start <id>` and `flow tickets done <id>`. Only a fix with a file to name closes an issue. Never drop one: a rejected output stays the evidence.
