---
name: upkeep
description: Folds closed tickets, notes, findings and the failure log into the wiki, rules and skills.
disable-model-invocation: true
---

# Upkeep

Read what capture left on disk, show one plan, then write each lasting fact where an agent can browse it. Capture only adds. This skill changes and deletes existing text.

## Guarantees

- **Nothing is lost.** Delete only what a page now says whole. Git keeps a pruned line.
- **Every lesson ends in a wiki page, `docs/context/`, a rule file or a skill.**
- **Existing text changes only after the user saw a plan.** A new file or a new line needs none.

**Admission test for every line written or kept:** would a fresh agent get something wrong without it?

## Method

Batch every step. Never carry one item to its home before the next is sorted.

1. `flow sync`. It stops on a merge clash → change nothing, name the files the error lists, end. The merge is the user's.
2. Read the sources below, newest first, until about 150k tokens. Read each one whole, here: a subagent has not seen the home a fact goes to, so it cannot apply the admission test.
3. Sort every item to its home. Open each home whole.
4. **Show the plan and stop.** One heading per home: lines added, lines removed, each pruned line word for word. List every note (promote, drop or keep) and every delete. A drop or a delete needs the user's yes. End with the observations from `## Efficiency`.
5. Take the corrections, then write. A few grouped edits per home.
6. `flow new` a ticket for each failure worth fixing. Then append `{"at":"<time>","swept":true}` to the month's failure file.
7. `flow file <id>...` on the batch's tickets, the ones that taught nothing included. Last, so an interrupted run reads them again and adds nothing twice.
8. Report what was filed. More tickets waiting → say so.

## Sources

- **Closed tickets nobody filed.** `flow ls "status:done filed:no"`. Read each whole: `ticket.md`, `history.md`, its decision files, `reports/`, and `groundwork/map.md` on a ticket not yet converted. A prototype is read through its report. List `protos/` by file name and open a file the report names. Raw evidence is never harvested.
- **The failure log**, `~/.flow/logs/failures/<year>-<month>.jsonl`, from the line after the newest `swept` marker. A month's file with no marker also reads the month before, from its marker.
- **Notes**, `flow notes`: this project's and the global ones. Promote with `flow notes promote <name>`, inside the project it belongs to. Drop with `flow notes drop <name>`. Fold into a home, or keep.
  - A `profile` or `rule` note is a correction capture inferred. Show it beside any line it contradicts.
- **Findings**: `~/.flow/wiki/<subject>/findings/` and `.flow/findings/`, `scorecard.md` excepted. Fold each into its home and delete the file in the same plan. `checked:` and `version:` carry onto the page line.
- **`flow scorecard` and `.flow/findings/scorecard.md`**: the rules broken most, and the wrong warnings. A wrong warning → fix the check, or rewrite the rule when it is too vague for any check. Clear the filed lines, and delete the file once empty.
- **A report research left unstamped** because it contradicts a page line: settle it in the plan. Sweep no other report.

## Old records (temporary)

Delete this whole section once `flow ls "status:done filed:no"` lists no ticket with an `issues.md`.

- **`issues.md` in a closed ticket**: the old design's list of defects found during the build. Read it beside the ticket's other files. An item still open → a ticket. A fixed or stale one → drop it.

## Efficiency

Observations for the plan, never tickets: the user decides what becomes one. One struggle is enough, and no count gates it.

- **Each batch ticket's `history.md`**: time spent in each status, moves back, handoffs.
- **`flow audit summary --since <the newest `swept` marker's date>`**: errors and tool counts across those sessions.
- **`rework-loop` issue tickets** (`flow ls "label:flow-issue label:rework-loop status:all"`): a live session recorded a user still unhappy after a fix.

Flag a ticket that looped, ran long or ran heavy next to the batch's others. List it with its evidence and one answer:

- **A rule exists and failed** → fix the rule.
- **A capability or tool gap** → a how-to page, a skill, or a research ticket.
- **A flaw in Flow's design**, a phase or a tool → a groundwork ticket for the workflow.

An earlier case of the same issue is a note beside the line. Reading whole sessions is a separate analysis the user starts.

## Where a fact goes

Would the sentence be true in a different project? Yes → global. No → this project. Never write a project's or a client's detail into `~/.flow`.

- **A tool or field** → the page owning it in `~/.flow/wiki/<subject>/`, by `~/.flow/references/wiki.md`
- **How the user works** → `~/.flow/profile.md`
- **Rule true everywhere, always relevant** → the section of `~/.flow/CLAUDE.md` that owns it. Never a rule file with no `paths:`
- **Rule true everywhere, for one stack or file type** → `claude/rules/<topic>.md` in Flow's clone, with `paths:`
- **Rule for this project** → its `CLAUDE.md` `## Rules`, or `.claude/rules/<topic>.md` with `paths:`
- **Project fact most sessions need** → its `CLAUDE.md`
- **Project fact only some work needs** → `docs/context/<subject>.md`
- **A decision** → the `docs/spec/` file that owns it, or the `map.md` of the groundwork that owns the subject
- **A mistake** → a ticket: `flow new "<short name>: <what went wrong>" --label flow-issue,<type>`. A rule born from a mistake names its ticket.
- **Work** → a ticket

**`docs-context-holds-verified-facts`** One question per file, facts and never process, rewritten rather than appended.

**Altitude.** Match the scope to the home:

- tool quirk, framework pattern → a page in that tool's folder
- broad principle → a concept skill
- seam between 2 tools → a page in the **source** tool's folder, plus a line in the other's `index.md`

Never a "tool-A-with-tool-B" folder. One home per fact, a pointer everywhere else.

**A finding with a `skill:` header** goes into that skill's folder. Flow's own skills are the exception, since `flow update` pulls their folder and a local edit blocks the pull. Write `~/.flow/skill-overlays/<skill>.md` instead, which applies in every project. A flaw in Flow itself is a case.

## Stale

Three signals. Age alone never makes a line stale.

- **Version behind.** A page's `Checked against <tool> <version>` is older than the installed tool. List the page. Recheck it when the user says so, or when it is open for another reason. Leave the `claude-code` pages: the release check owns them.
- **Contradicted.** A newer finding, report or ticket says the opposite of a line. Found while reading both, never by scanning.
- **Fails the admission test.** Applied only to a page or rule already open.

## Changing a page

Research only adds to a page. This skill also:

1. **Deletes a fact proven wrong.**
2. **Rewrites a page whole** when its subject changed shape.

## A procedure

Steps that repeat across tickets are never captured whole. A finding that names a repeat is the signal. Read the findings, the reports and the script whole, then write one how-to page in the tool's or field's folder: steps with their expected results, "If it fails", `Checked against <tool> <version>, <date>`.

Make it a skill instead where a script has to run, or after the agent skipped the page twice. A new skill is project-level, unless the same steps serve other projects.

## Checks

Write no check while the rule checks are off. Keep an existing one in step when its rule is renamed or deleted.

**Read `references/write-checks.md`** before changing a check or reading `flow scorecard`.

## Building or reshaping a skill

**Read `references/write-skills.md`** before creating or restructuring one.
