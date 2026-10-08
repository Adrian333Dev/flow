---
name: file-findings
description: Files a session's findings into skills, rules and checks.
disable-model-invocation: true
---

# File findings

Decide where each finding belongs, then write it there. Build a skill or a rule where nothing fits. A rule written here gets its check in the same pass.

## Method

Batch every step. Never carry one item through to its destination and then start the next.

Move at triage speed. Building a skill is the one slow step.

1. Read the inputs below, whole.
2. Sort every item by destination in one pass.
3. Shape what needs it. A fragment has to read like the thing it is about to become.
4. **Show the plan and stop.** One heading per destination file, every item listed under the file it goes into, every check listed under its rule. Items for a domain skill go under that skill, with one question for the batch: send them to `domain-skills`? `## A skill filing must not edit` below.
5. Take the corrections, then write. A few grouped edits per destination.
6. **Write or update a check for every rule you touched**, wherever a function can tell violations apart. `## Checks` below.
7. Clear filed items from the inbox. Delete each filed finding, and clear the filed lines from `scorecard.md`, deleting it once empty. **Never empty an `issues.md`.**
8. Mark every ticket you swept: `flow file exp-47 exp-48 exp-49`, the ones that taught nothing included.
9. Report what you filed and what you flagged.

## Inputs

- **`.flow/inbox.md`**, always. Knowledge needing an altitude call, items with no home yet, anything still too raw to file.
- **`.flow/findings/*.md`**: reusable knowledge captured during work, one finding per file, named for what was learned. A `skill:` header names the skill it is about. `scorecard.md` is the exception: one line per wrong warning from a check. Never read a sub-folder: `.flow/findings/<skill>/` holds findings `flow contribute` has yet to send.
- **Closed tickets nobody has filed yet.** `flow ls --unfiled` gives the ids. In each folder read `issues.md` for what the build learned, and everything in `reports/` for what was answered.
- **The groundwork this session closed.** Sweep its `map.md`: promote reusable lessons into skills, move strays out to where they belong. Never open a map this session did not work.
- **`flow scorecard`**: how the existing checks are doing. It names the stale ones, the ones ready to move up a tier, and the rules nothing has applied to in a long time.

## Routing

**Route findings straight to the destination.** Inbox items need the altitude call first.

- **A finding with a `skill:` header** → that skill, by `## A skill filing must not edit` below
- **Knowledge tied to an outside tool, library or framework** → `~/.flow/wiki/<tool>/findings/<what-was-learned>.md`, written the way `## Capture` in `~/.agents/AGENTS.md` writes one, by **altitude** below. The harvest takes it into the tool's skill later
- **Rule true everywhere, and always relevant** → the section of `~/.agents/AGENTS.md` that owns the subject. Never a rule file with no `paths:`
- **Rule true everywhere, relevant to one stack or file type** → `claude/rules/<topic>.md` in Flow's clone, with `paths:` frontmatter
- **Rule for this project, always relevant** → the project's `CLAUDE.md`, in the section that owns the subject
- **Rule for this project, relevant to one stack or file type** → `.claude/rules/<topic>.md` with `paths:` frontmatter
- **Project fact most sessions need** → the project's `CLAUDE.md`
- **Project fact only some work needs** → `docs/context/<subject>.md`
- **Reusable, no matching skill** → flag in `.flow/inbox.md` as `needs skill: <group>/<subject> (<note>)`. Several flags on one subject earn a skill; one flag is not evidence
- **Work item** → ticket or stays in inbox
- **Everything else** → the homes under `## Capture` in `~/.agents/AGENTS.md`

**Skill or project context: would this sentence be true in a different project?** Yes → a skill, or the tool's wiki folder. No → `docs/context/`. Content that is both splits, and is never assigned to one side: *a generated file is never hand-edited, regenerate it* goes to that tool's skill, while the script name and the output path go to context. Genuinely cannot tell → leave it in `.flow/inbox.md` until there are enough instances to see the pattern.

**What may go in `docs/context/<subject>.md`**, all 4:

- **It answers what a fresh session would get wrong without it.**
- **A fact, never a process.** A file describing how to work is a skill in the wrong repo.
- **Verified.**
- **Rewritten when it changes, never appended to.**

**Defer to what exists.** No `docs/spec/` means a locked decision goes to the `map.md` of the groundwork that owns the subject. Never invent a parallel doc bucket.

**An inbox item somebody has committed to build becomes a ticket**, with `flow new`.

## Altitude: which home

Match the note's scope to the home's scope:

- tool quirk → that tool's wiki folder
- framework pattern → that framework's wiki folder
- broad principle, such as "the client never touches the DB directly" → a high-level concept skill, `architecture` for that one
- seam between 2 tools → the **source** tool's wiki folder, plus a line in the other's `index.md`

Never a "tool-A-with-tool-B" folder or skill. One home per fact, a pointer everywhere else.

The group in a `needs skill:` flag: `tools/`, or `dev/` for a skill maintaining Flow or `domain-skills`. `phases/` is closed.

## A skill filing must not edit

Follow the skill's link to see where its folder lives: `.claude/skills/<name>` in the project, `~/.claude/skills/<name>` on the machine, or `~/.agents/skills/flow/skills/<name>` for one of Flow's own. 2 places are never edited here:

- **A skill repository's clone**, a link into `~/.flow/repos/sources/`.
  - The `domain-skills` clone → only `/flow:apply-domain-findings` writes there. Every item bound for it goes under the plan's batch question. Yes → move the finding into `.flow/findings/<skill>/`, its `skill:` header intact, where it waits for Flow's sharing command. An inbox item is written there as a finding, with the header. No → the skill's overlay, `.flow/overlays/<skill>.md`, or a private skill
  - Any other clone → the skill's overlay, or a private skill
- **Flow's own skills**, a link into Flow's `skills/`:
  - Knowledge for this project → `.flow/overlays/<skill>.md`
  - A flaw in Flow itself → `/flow:review`

Write every other skill directly, including a copy an installer put in the project.

## Building or reshaping a skill

**Read `references/write-skills.md`** before creating or restructuring one.

Appending a line to a skill that already exists needs none of it.

## Checks

**A check is a function that reads an edit, before it lands, and says whether a rule was followed.**

**A rule and its check are written in the same pass.** Never wait for more examples: a new check starts at the `measure` tier, which counts silently.

Where no function can tell violations apart, the rule ships without a check.

**Read `references/write-checks.md`** before writing one, changing one, moving one between tiers, or reading `flow scorecard`.
