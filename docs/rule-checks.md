# Rule checks

A rule check is a small script that tests each file edit against one of your rules, before the edit lands, and records whether the rule was followed. This page covers what happens on an edit, how to read the results, and how to write a new check.

## Table of contents

- [Why checks exist](#why-checks-exist): the part of a rule a script can decide
- [What happens on every edit](#what-happens-on-every-edit): the check runs, and its answer is recorded
- [The 3 levels](#the-3-levels): count, warn, or refuse
- [Reading the scorecard](#reading-the-scorecard): which rules are broken, and which checks to act on
- [Writing a check](#writing-a-check): finding the giveaway, and where the file goes

## Why checks exist

The agent usually follows a rule, and nothing tells you when it doesn't. A check is the part of a rule a script can decide. "Write the plainest word" has no check, since no script can tell a plain word. "No em dash in a markdown file" can have one.

Checks also cover a gap in how Claude Code loads rules. A rule file limited to some paths, such as `*.ts`, loads only once the agent reads a matching file. Creating a new file is not a read, so the rule is missing when it matters. The check fires on the new file anyway.

## What happens on every edit

1. **The agent is about to edit or write a file.** Before the edit lands, Claude Code runs Flow's hook, a script it calls at that moment.
2. **The hook picks the checks for that file.** The comment check applies to `.js` and `.ts` files, so a markdown edit skips it.
3. **Each check reads the edit, and its answer is recorded** as one line in `~/.flow/logs/scorecards/<session>.jsonl`:

   ```json
   {"at":"2026-09-29T13:59:38.094Z","kind":"result","id":"js-and-ts","tier":"measure","since":"2026-09-10","project":"p","effort":null,"ok":false}
   ```

4. **A broken rule gets what the check's level says.**

A bug inside a check lets the edit through, unrecorded. Stopping every edit over a counting script would cost more than the count is worth.

## The 3 levels

Every check has one level, written in its file:

- **`measure`**: count the answer, and interrupt nothing. Every check starts here.
- **`warn`**: tell the agent what was wrong, and let the edit through. Where the rule's file never loaded in the session, the warning carries the rule's whole text.
- **`block`**: refuse the edit.

A check moves up only on evidence: it fired often, and never on an edit that was fine. Moving to `block` also needs your yes, since a block stops real work. Most checks stay at `measure`, since the count is the point.

## Reading the scorecard

`flow scorecard` adds up every session's results, and prints what needs acting on:

```console
$ flow scorecard
never applied: loaded every session, never once relevant
  js-and-ts

1 rules measured, 147 not measurable. 0 results over 0 days.
```

The last line counts the rules with no check, so a clean report never reads as a clean session. Above it, up to 5 lists:

- **Broken checks**: a check file that fails to load. Fix it first.
- **Stale**: the check names a rule that no longer exists. Point it at the new rule, or delete it.
- **Violated most**: broken although the agent had the rule. Reword the rule, or move the check to `warn`.
- **Ready for promotion**: broken 5 times or more, in at least 60% of the edits it applied to. Move it to `warn` once you are sure it never fired on a correct edit.
- **Never applied**: nothing matched in a long time. The situation the rule covers stopped happening.

A rule nobody breaks is not listed, since the rule is working. A check that fired on a correct edit goes in `.flow/findings/scorecard.md` the moment you notice, and `/flow:file-findings` fixes the check or the rule.

## Writing a check

`/flow:file-findings` writes a check for each rule it adds, where a script can decide the rule. To write one by hand:

1. **Collect real examples** of the rule broken and followed, from actual sessions. Never invent one.
2. **Write the giveaway as one plain sentence**: something in every broken example and in no correct one. Unable to finish the sentence, the rule gets no check.
3. **Write the file**, `<clone>/scripts/rule-checks/<rule-id>.js`, named for the rule it tests, at `measure`. It names the rule, the files it applies to, the test, and the line the agent reads when it fires. A new file is a new check, with no list to update.
4. **Write a test** holding at least one real broken example and one real correct one.

[Writing a check](../skills/tools/file-findings/references/write-checks.md) lists every field a check declares. Flow ships one check today, `js-and-ts`: it counts 2 or more `//` comment lines above a function where the rule asks for a `/** */` block.
