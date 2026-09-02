---
name: flow-review
description: Reviews how Flow performed. Finds where rules failed, where friction repeated, and where the design has a gap. Records findings as study cases or workflow notes, globally.
---

# Flow review

Two shapes. A clear failure gets recorded. A suspected flaw gets investigated first.

## Clear failure

The user rejected output, or a loaded rule did not fire.

1. Keep the offending output verbatim.
2. Name every rule that was loaded and should have prevented the failure.
3. Record a study case: `flow cases issues`, then `flow cases new "<title>" --issue <issue>`. `~/.flow/references/study-cases.md` carries the body format.

The artifact is perishable. Write it now, analyse later.

## Suspected flaw

Friction hit twice, a rule fought the work, or a pattern looks wrong without a concrete failure.

1. Name the suspicion in one sentence.
2. Investigate. The conversation is evidence when the session holds it. `flow audit read` opens a bounded turn range from any past session. `flow audit sessions` lists what is available.
3. Compare what happened against the loaded rules. A rule present and silent is a defective rule.
4. Record the finding in `~/.flow/workflow-notes.md`, dated, with the project.

## Recording

Both destinations are global, reachable from any project.

- **Study case** (`~/.flow/study-cases/`): a failure with an artifact. Written in two stages: the artifact and one line now, the analysis later.
- **Workflow note** (`~/.flow/workflow-notes.md`): friction, a gap, a pattern. One dated line.

Neither shape derails the current work. Record and return.
