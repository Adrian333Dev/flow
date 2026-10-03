# Writing a check

**A check is a JavaScript function that reads an edit and says whether a rule was followed.** One hook runs every check before an `Edit` or a `Write` lands. Depending on the check's tier, a violation is counted silently, shown to the agent, or refused.

**A rule and its check are written in the same pass**, in whichever pass wrote the rule.

## Where it lives

**`~/.flow/scripts/rule-checks/<id>.js`, one file per check.** Adding a check is adding a file.

`<id>` is the rule's own ID, the one written in bold at the head of the rule. A check whose filename matches no rule ID is stale by definition.

## The file

Every check exports what the runner needs to know about it:

```js
module.exports = {
  id: 'no-em-dashes',
  rule: 'claude/rules/writing.md',
  tier: 'measure',
  since: '2026-09-05',
  needs: 'added',
  applies: (path) => path.endsWith('.md'),
  check: (path, text) => !text.includes('—'),
  message: 'Em dash added. Use a period, a comma, a colon, or parentheses.',
};
```

- **`id`** groups the counts and matches a rule ID.
- **`rule`** is the path to the file holding that rule, so a warning can quote it.
- **`tier`** is `measure`, `warn` or `block`. See below.
- **`since`** is the date the check last changed in a way that moves its numbers. `flow scorecard` ignores counts an older version produced.
- **`needs`** says what the check is handed. `'added'` gives only the text this edit introduces. `'file'` gives the whole file as it will read afterwards.
- **`applies`** decides whether the rule is relevant here at all. Returning false is not a pass, it is silence: the edit never enters the count.
- **`check`** returns true when the rule was followed.
- **`message`** is the one line the agent reads on a violation. Say what was wrong and what to do instead.

**`needs: 'added'` is the default worth reaching for.** It lets a check ship against a codebase that still breaks the rule everywhere.

## Finding the giveaway

Do this before writing any code.

**Collect real examples of both kinds first.** Violations from actual sessions, clean output from actual sessions. Never invent either.

**The giveaway is what is present in every violation and absent from every clean example.** Write that sentence out in plain words before writing the function. If you cannot finish the sentence, there is no check.

**Narrow `applies` before complicating `check`.** A `check` that grows conditions to dodge false positives is usually an `applies` that is too wide.

**A check is any function, not only a pattern match.** Counting comment lines against code lines, measuring sentence length, comparing which files were read against the order a skill requires: all of these are checks.

## Testing it

Every check gets a test in `~/.flow/scripts/tests/`, holding at minimum one real violation and one real clean example. `npm test` runs them.

## The 3 tiers

1. **`measure`** counts violations and interrupts nothing. Every check starts here, with one exception named below.
2. **`warn`** returns the message to the agent before the edit, which then proceeds.
3. **`block`** refuses the edit.

**Promotion needs evidence, and the evidence is in `flow scorecard`.** Move a check to `warn` once it has applied often enough to mean something and produced no false positives. A path-scoped check starting at `warn`, below, skips this. Move it to `block` only after narrowing `applies` and refining the pattern have cleared the false positives entirely, and only with the user agreeing.

**Most checks stay at `measure` forever, and that is success.**

**A rule the user has called minor stays at `measure` whatever the evidence says.** Comment shape is the standing example.

**A path-scoped rule that matters starts at `warn`, never `measure`.** A rule with `paths:` loads only when a matching file is read, so a brand-new file is written without it. `warn` injects the rule's whole text beside the message.

## Reading `flow scorecard`

It prints 4 lists, each with an action:

- **Stale** means the check's rule ID no longer exists. Repoint it or delete it.
- **Ready to promote** means enough applications and no false positives. Move it up a tier.
- **Violated most** means the rule is being broken despite being loaded. Either the rule is worded badly, which is a rewrite, or it needs to reach `warn`.
- **Never applied** means nothing has matched in a long time. `applies` is probably too narrow, or the rule covers a situation that stopped happening.

**Never violated is not on that list**: a rule nobody breaks is working.

## Keeping checks in step with rules

Staleness runs 2 ways, both caught by matching check filenames against rule IDs:

- A rule renamed or deleted leaves a check pointing at nothing.
- A rule reworded enough to change what counts as a violation leaves a check measuring the old wording. Bump `since` when that happens, so the old counts drop out.

**A false positive gets written to `.flow/findings/scorecard.md`** the moment it is noticed, which is the same folder `/flow:file-findings` drains. If the check is wrong, fix the check. If the rule is too vague for any check to be right, the rule is what needs rewriting.
