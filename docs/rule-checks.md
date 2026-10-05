# Rule checks

A rule check is a small script that tests each file edit against one of your rules, before the edit lands, and records whether the rule was followed.

## Table of contents

- [Why checks exist](#why-checks-exist): the part of a rule a script can decide
- [The 3 levels](#the-3-levels): count, warn, or refuse
- [Reading the scorecard](#reading-the-scorecard): which rules are broken, and which checks to act on
- [Writing a check](#writing-a-check): finding the giveaway, and where the file goes

## Why checks exist

The agent usually follows a rule, and nothing tells you when it doesn't. A check is the part of a rule a script can decide. "Write the plainest word" has no check. "No em dash in a markdown file" can have one.

A check also covers a gap in Claude Code: a rule file for some paths, such as `*.ts`, loads only once the agent reads a matching file, so it is missing when the agent creates one. The check fires on the new file anyway.

A check that crashes lets the edit through, unrecorded.

## The 3 levels

Every check has one level, written in its file:

- **`measure`**: count the answer, and interrupt nothing. Every check starts here, and most stay.
- **`warn`**: tell the agent what was wrong, and let the edit through.
- **`block`**: refuse the edit. It needs your yes, since a block stops real work.

A check moves up only once it has fired often, and never on an edit that was fine.

## Reading the scorecard

`flow scorecard` adds up every session's results:

```console
$ flow scorecard
never applied: loaded every session, never once relevant
  js-and-ts

1 rules measured, 147 not measurable. 0 results over 0 days.
```

It lists only what needs acting on:

- **Broken checks**: a check file that fails to load. Fix it first.
- **Stale**: the check names a rule that no longer exists.
- **Violated most**: broken although the agent had the rule. Reword the rule, or move the check to `warn`.
- **Ready for promotion**: broken 5 times or more, in at least 60% of its edits. Move it to `warn` once you are sure it never fired on a correct edit.
- **Never applied**: the situation the rule covers stopped happening.

A check that fired on a correct edit goes in `.flow/findings/scorecard.md`, and `/flow:file-findings` fixes it.

## Writing a check

`/flow:file-findings` writes a check for each rule it adds, where a script can decide the rule. To write one by hand:

1. **Collect real examples** of the rule broken and followed. Never invent one.
2. **Write the giveaway as one sentence**: something in every broken example and in no correct one. No sentence, no check.
3. **Write `<clone>/scripts/rule-checks/<rule-id>.js`**, at `measure`. [Writing a check](../skills/tools/file-findings/references/write-checks.md) lists its fields.
4. **Write a test** holding a real broken example and a real correct one.
