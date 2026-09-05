# Writing a check

Read this before writing a check, changing one, or moving one between tiers.

**A check is a JavaScript function that reads an edit and says whether a rule was followed.** One hook runs every check before an `Edit` or a `Write` lands. Depending on the check's tier, a violation is counted silently, shown to the agent, or refused.

**A rule and its check are written in the same pass**, in whichever pass wrote the rule. Most rules never get one, because no function can tell their violations apart. That is the normal outcome and nothing records it.

## Where it lives

**`~/.flow/scripts/rule-checks/<id>.js`, one file per check.** The folder is the registry, so adding a check means adding a file and nothing else. There is no list to keep in step.

`<id>` is the rule's own ID, the one written in bold at the head of the rule. A check whose filename matches no rule ID is stale by definition.

## The file

Every check exports what the runner needs to know about it:

```js
module.exports = {
  id: 'no-em-dashes',
  rule: 'rules/writing.md',
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
- **`since`** is the date the check last changed in a way that moves its numbers. `flow scorecard` ignores counts an older version produced, because comparing them measures the check rather than the agent.
- **`needs`** says what the check is handed. `'added'` gives only the text this edit introduces. `'file'` gives the whole file as it will read afterwards.
- **`applies`** decides whether the rule is relevant here at all. Returning false is not a pass, it is silence: the edit never enters the count.
- **`check`** returns true when the rule was followed.
- **`message`** is the one line the agent reads on a violation. Say what was wrong and what to do instead.

**`needs: 'added'` is the default worth reaching for.** It flags what this edit introduces and ignores what was already there, so a check can ship against a codebase that still breaks the rule everywhere. The em dash check above works today for exactly that reason.

## Finding the giveaway

This is the whole difficulty, and it is done before any code is written.

**Collect real examples of both kinds first.** Violations from actual sessions, clean output from actual sessions. Never invent either. An invented violation is a violation of the check you are about to write, not of the rule.

**The giveaway is what is present in every violation and absent from every clean example.** Write that sentence out in plain words before writing the function. If you cannot finish the sentence, there is no check.

**Narrow `applies` before complicating `check`.** Most false positives are the rule firing somewhere it was never meant to apply, and a path test removes them in one line. A `check` that grows conditions to dodge false positives is usually an `applies` that is too wide.

**A check is any function, not only a pattern match.** Counting comment lines against code lines, measuring sentence length, comparing which files were read against the order a skill requires: all of these are checks. The boundary is whether a function separates violations reliably, never whether a regular expression can express it.

## Testing it

Every check gets a test in `~/.flow/scripts/tests/`, holding at minimum one real violation and one real clean example. `npm test` runs them.

A check with no test is a check nobody can change later without guessing at what it was for.

## The three tiers

1. **`measure`** counts violations and interrupts nothing. Every check starts here.
2. **`warn`** returns the message to the agent before the edit, which then proceeds.
3. **`block`** refuses the edit.

**Promotion needs evidence, and the evidence is in `flow scorecard`.** Move a check to `warn` once it has applied often enough to mean something and produced no false positives. Move it to `block` only after narrowing `applies` and refining the pattern have cleared the false positives entirely, and only with the user agreeing, because a block rejects real work.

**Most checks stay at `measure` forever, and that is success.** The count is the point.

## Reading `flow scorecard`

It prints four lists, each with an action:

- **Stale** means the check's rule ID no longer exists. Repoint it or delete it.
- **Ready to promote** means enough applications and no false positives. Move it up a tier.
- **Violated most** means the rule is being broken despite being loaded. Either the rule is worded badly, which is a rewrite, or it needs to reach `warn`.
- **Never applied** means nothing has matched in a long time. `applies` is probably too narrow, or the rule covers a situation that stopped happening.

**Never violated is not on that list.** A rule nobody breaks is a rule that is working. Rules are written only after a mistake happens, so a clean record is the outcome the rule was added to produce.

## Keeping checks in step with rules

Staleness runs in both directions and both are caught the same way, by matching check filenames against rule IDs.

- A rule renamed or deleted leaves a check pointing at nothing.
- A rule reworded enough to change what counts as a violation leaves a check measuring the old wording. Bump `since` when that happens, so the old counts drop out.

**A false positive gets written to `.flow/findings/scorecard.md`** the moment it is noticed, which is the same folder `/file-findings` drains. If the check is wrong, fix the check. If the rule is too vague for any check to be right, the rule is what needs rewriting.
