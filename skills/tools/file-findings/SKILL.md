---
name: file-findings
description: Files what a session learned into the skills, rules and checks that will hold it next time.
---

# File findings

Capture wrote every finding down, and at most named the skill it is about. This pass decides where each belongs, then writes it there. Filing is the only pass that writes into a skill or a rule, and it builds one where nothing fits. A rule written here gets its check in the same pass.

## Method

Batch every step. Never carry one item through to its destination and then start the next.

Move at triage speed. Building a skill is the one slow step, and it fires rarely.

1. Read the inputs below, whole.
2. Sort every item by destination in one pass.
3. Shape what needs it. A fragment has to read like the thing it is about to become.
4. **Show the plan and stop.** One heading per destination file, every item listed under the file it goes into, every check listed under its rule. Items for a domain skill go under that skill, with one question for the batch: send them to `domain-skills`? `## A skill filing must not edit` below.
5. Take the corrections, then write. A few grouped edits per destination.
6. **Write or update a check for every rule you touched**, wherever a function can tell violations apart. `## Checks` below.
7. Clear filed items from the inbox. Delete each filed finding, and clear the filed lines from `scorecard.md`, deleting it once empty. **Never empty an `issues.md`.** It is the record of what happened, like a hunt's report.
8. Mark every ticket you swept: `flow file t047 t048 t049`, the ones that taught nothing included. `status: done` says the work finished; `filed` says the lessons came out of it. Nothing else drains the queue.
9. Report what you filed and what you flagged.

## Inputs

- **`.flow/inbox.md`**, always. Knowledge needing an altitude call, items with no home yet, anything still too raw to file.
- **`.flow/findings/*.md`**: reusable knowledge captured during work, one finding per file, named for what was learned. A `skill:` header names the skill it is about. `scorecard.md` is the exception: one line per wrong warning from a check. Never read a sub-folder: `.flow/findings/<skill>/` holds findings `flow contribute` has yet to send.
- **Closed tickets nobody has filed yet.** `flow ls --unfiled` gives the ids, usually several. In each folder read `issues.md` for what the build learned, and everything in `reports/` for what was answered.
- **The groundwork this session closed.** Sweep its `map.md`: promote reusable lessons into skills, move strays out to where they belong. Never open a map this session did not work.
- **`flow scorecard`**: how the existing checks are doing. It names the stale ones, the ones ready to move up a tier, and the rules nothing has applied to in a long time.

## Routing

**Findings are pre-triaged.** Each file names what was learned and holds reusable knowledge, so route straight to the destination. Inbox items need the altitude call first.

- **A finding with a `skill:` header** → that skill, by `## A skill filing must not edit` below
- **Knowledge tied to a tool, library or framework** → the skill that covers it, by **altitude** below
- **Rule true everywhere, and always relevant** → the section of `~/.claude/CLAUDE.md` that owns the subject. A rule file with no `paths:` loads every session too, and buys nothing over the file already loaded
- **Rule true everywhere, relevant to one stack or file type** → `rules/<topic>.md` with `paths:` frontmatter
- **Rule for this project, always relevant** → the project `CLAUDE.md`, in the section that owns the subject
- **Rule for this project, relevant to one stack or file type** → `.claude/rules/<topic>.md` with `paths:` frontmatter
- **Project-specific fact** → `docs/context/<subject>.md`
- **Reusable, no matching skill** → flag in `.flow/inbox.md` as `needs skill: <group>/<subject> (<note>)`. Several flags on one subject earn a skill; one flag is not evidence
- **Work item** → ticket or stays in inbox
- **Everything else** → the homes under `## Capture` in the global `CLAUDE.md`

**Defer to what exists.** No `docs/spec/` means a locked decision goes to the groundwork that owns the subject, whose `map.md` is the decision log. Never invent a parallel doc bucket.

**An inbox item somebody has committed to build becomes a ticket**, with `flow new`.

## Altitude: which skill

Match the note's scope to the skill's scope:

- tool quirk → that tool's skill
- framework pattern → that framework's skill
- broad principle, such as "the client never touches the DB directly" → a high-level concept skill, `architecture` for that one
- seam between 2 tools → the **source** tool's skill, plus a one-line pointer from the other

Never a "tool-A-with-tool-B" skill. One home per fact, a pointer everywhere else.

## A skill filing must not edit

Follow the skill's link, `.claude/skills/<name>` in the project or `~/.claude/skills/<name>`, to see where its folder lives. 2 places are never edited here:

- **The `domain-skills` clone.** Only `/fold` writes there. Every item bound for it goes under the plan's batch question:
  - Yes → move the finding into `.flow/findings/<skill>/`, its `skill:` header intact, then run `flow contribute`. An inbox item is written there as a finding, with the header
  - No → the skill's overlay, `.flow/overlays/<skill>.md`, or a private skill
- **Flow's own skills**, a link into Flow's `skills/`:
  - Knowledge for this project → `.flow/overlays/<skill>.md`
  - A flaw in Flow itself → `/flow-review`

Write every other skill directly, including a copy an installer put in the project.

## Building or reshaping a skill

**Read `references/write-skills.md`** before creating or restructuring one. It carries the shape, the frontmatter, where a new skill lives, and when to rewrite one rather than patch it.

Appending a line to a skill that already exists needs none of it.

## Checks

**A check is a function that reads an edit and says whether a rule was followed.** It runs before the edit lands, so the scorecard counts violations instead of you catching them by eye.

**A rule and its check are written in the same pass.** A check starts at the `measure` tier, which counts silently and interrupts nothing, so one built from a single example costs nothing when it turns out wrong. Waiting for more examples leaves the rule unmeasured for exactly as long as you wait.

Where no function can tell violations apart, the rule ships without a check. Nothing records the decision and nothing needs to.

**Read `references/write-checks.md`** before writing one, changing one, or moving one between tiers. It carries the file shape, how to find what separates a violation from clean output, how to test it, and how to read `flow scorecard`.

!`flow overlays file-findings`
