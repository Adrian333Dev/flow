# Rule checks

A rule check is a small script that looks at a file edit before it lands and says whether one of Flow's rules was followed. Flow counts the answers, so you can see which rules get broken and how often. This page says how the checks run, how to read the counts, and how a new check gets written.

## Table of contents

- [Why checks exist](#why-checks-exist)
- [What happens on every edit](#what-happens-on-every-edit)
- [The 3 levels](#the-3-levels)
- [Reading the scorecard](#reading-the-scorecard)
- [Where the pieces live](#where-the-pieces-live)
- [Writing a new check](#writing-a-new-check)
- [The checks today](#the-checks-today)

## Why checks exist

A rule is a sentence in a rule file, such as `rules/comments.md`. Claude reads it and usually follows it. Nothing tells you when it doesn't.

A check is the part of a rule a script can decide. It reads the edit and answers yes or no. Most rules never get a check, because no script can tell a broken one from a followed one: "write the plainest word" has no check. A rule with a pattern that always gives it away can have one: "no em dash in a markdown file" does.

Checks also cover a gap in how rules load. A rule file limited to certain paths, such as `*.ts`, loads only when Claude reads a matching file. Creating a new file is not a read, so the rule is missing at the moment it matters. A check fires on the new file anyway.

## What happens on every edit

1. **Claude is about to edit or write a file.** Before the edit lands, Claude Code runs a hook, a script it calls at a fixed moment. Flow's is `rule-check.js`.
2. **The hook picks the checks that apply.** Each check says which files it cares about. The comment check applies to `.js` and `.ts` files, so a markdown edit skips it.
3. **Each check reads the edit and answers.** The answer is written as one line to `~/.flow/logs/scorecards/<session>.jsonl`. Two edits, the first breaking the comment rule and the second following it:

   ```json
   {"at":"2026-09-29T13:59:38.094Z","kind":"result","id":"js-and-ts","tier":"measure","since":"2026-09-10","project":"p","effort":null,"ok":false}
   {"at":"2026-09-29T13:59:38.127Z","kind":"result","id":"js-and-ts","tier":"measure","since":"2026-09-10","project":"p","effort":null,"ok":true}
   ```

4. **A broken rule gets what the check's level says.** The level is the next section.

The hook never allows anything the permission system would refuse, and a bug inside it lets the edit through silently. Breaking every edit over a counting script would cost more than the counts are worth.

## The 3 levels

Every check has one level, written in its file:

- **`measure`**: counts the answer and interrupts nothing. Every check starts here.
- **`warn`**: tells Claude what was wrong before the edit lands, and the edit goes ahead. Where the rule's own file never loaded in this session, the warning carries the rule's whole text.
- **`block`**: refuses the edit.

A check moves up only on evidence from the scorecard: it has fired often, and never on an edit that was actually fine. Moving to `block` also needs your yes, since a block stops real work. Most checks stay at `measure`, and that is fine: the count is the point.

## Reading the scorecard

`flow scorecard` reads every session's lines and prints what needs acting on. After the 2 edits above:

```text
violated most
  RULE       TIER     BROKEN  OF  RATE
  js-and-ts  measure  1       2   50%

1 rules measured, 140 not measurable. 2 results over 1 days.
```

`140 not measurable` is the rules with no check. It prints up to 4 lists:

- **Stale**: the check names a rule that no longer exists. Point it at the new rule, or delete it.
- **Ready to promote**: fired often, never wrongly. Move it up a level.
- **Violated most**: broken even though Claude had the rule. Reword the rule, or move the check to `warn`.
- **Never applied**: nothing has matched in a long time. The check looks at too few files, or the situation stopped happening.

A rule nobody breaks is not listed. It is working.

## Where the pieces live

- **`~/.flow/scripts/rule-check.js`**: the hook. Runs the checks on each edit and writes the lines.
- **`~/.flow/scripts/rule-checks/<rule-id>.js`**: one file per check, named for the rule it tests. Adding a file adds a check, with no list to update.
- **`~/.flow/scripts/flow/lib/checks.js`**: finds the checks, refuses a malformed one, and reads rule ids out of the rule files.
- **`~/.flow/logs/scorecards/<session>.jsonl`**: the answers, one file per session.
- **`.flow/findings/scorecard.md`**: a check that fired on a correct edit, written down the moment someone notices. `/flow:file-findings` fixes the check or the rule.

## Writing a new check

The hard part is finding the giveaway: something present in every broken example and absent from every correct one. The steps:

1. **Collect real examples of both kinds** from actual sessions. Never invent one.
2. **Write the giveaway as one plain sentence.** If you can't finish the sentence, the rule gets no check.
3. **Write the file** in `rule-checks/`, at `measure`. It names the rule, the files it applies to, the test itself, and the one line Claude reads when it fires.
4. **Write a test** holding at least one real broken example and one real correct one.

The full guide, with every field a check declares, is [Writing a check](../../skills/tools/file-findings/references/write-checks.md).

## The checks today

One check: `js-and-ts`, at `measure`. It counts a run of 2 or more `//` comment lines directly above a function, a class, or a named arrow function, where the rule asks for a `/** */` block. Comment shape is a minor rule, so the check stays at `measure` whatever the counts say. More checks come from rules that real sessions break.
