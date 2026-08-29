# Handoff — 2026-08-29

```flow-open
backlog.md                                  # every open item; nothing below repeats it
lab/research/doc-design/deep-research.md    # the evidence behind the docs design
lab/context/shit-explanations.md            # 6 rejected messages, verbatim. Read entry 6 before writing a report
```

## The job

Flow's own build is finished and verified. The live work is **designing `docs/`, Flow's public
documentation**. Nothing is being written yet and nothing should be: the workflow has to be finished
and the install skill has to exist first. The design below exists only in conversation and in this
file.

The repo `CLAUDE.md` carries the state of the build in `## Current state` and auto-loads, so nothing
here restates it.

## What `docs/` is

**Official documentation for a stranger, A to Z.** Flow is going public as a competitor to
superpowers, agent-skills and mattpocock's skills, so the reader is someone who cloned it and knows
nothing about Flow.

**Assume Claude Code familiarity.** The reader has used Claude Code and knows roughly what a skill
is. They have not touched hooks or most settings. So Claude Code and skills get a sentence where they
are first named, never a section.

**It is the only part of Flow with no token budget and no agent reading it.** That is what it is for,
and it decides everything else: `docs/` explains and never states. A page never restates what a skill
says — it says why the skill says it, and links. **No skill and no `CLAUDE.md` ever points into
`docs/`.**

## The structure

Six sections, grouped by **why you are reading**, never by which part of the machine a page touches.
Grouping by component was rejected outright: *"that's absolute worst way to teach strangers."*

- **Use Flow** — concepts first (what Flow is, tickets, phases, the approval discipline), then
  running work. Concepts live here rather than in their own wing, which is how ESLint files its core
  concepts
- **Configure Flow** — settings, `skillOverrides`, overlays, the project template, **precedence and
  resolution order**, and **why didn't my skill fire**
- **Extend Flow** — write a skill, add a stack skill, vendor an external one
- **Why it works this way** — the decisions
- **Reference** — every command, key, skill and file
- **Work on Flow** — the repo, the tests, `try.sh`

**Reference is a section, not the spine.** Both research reports recommended a reference-heavy site on
the ESLint model and that is wrong here: ESLint's readers know what linting is and arrive from an
error message; Flow's reader does not know what a phase is. Flow's explanation load is higher and its
config surface is far smaller.

### Inside `Why it works this way`

Four groups, by **scope and consequence** — this is the user's axis and it is what makes a decision
file itself:

- **What you can change** — global, tied to no step, safe to drop. The git-mutation ban,
  `AskUserQuestion` denied, plan mode denied, no changelog, ASCII over images, how the agent explains
  itself
- **What holds it together** — global, and something breaks. Nothing may change the working tree
  while a subagent runs, because the snapshot diff is the only honest account of what it touched.
  `git add` staying reachable. Descriptions carrying no trigger. One copy of a skill per machine
- **Inside a phase** — review running in-session, no `code-review` skill, groundwork walking every
  open decision to an answer
- **At setup, once** — symlinks and no copies, no versions, no plugin manifest, every skill on by
  default, a project overriding key by key

Entry format is Go's FAQ: **the decision, the alternative rejected, the consequence**, in one to three
blunt paragraphs.

**The inventory is incomplete and known to be.** The real set comes out of reading `lab/context/` end
to end, about 4,000 lines. **The four groups get confirmed by that harvest, not before it.**

### What makes it extensible

Room is not what makes a structure extensible. **Every new item has one obvious home, decided by a
written test rather than by resemblance.**

- **Every section is a folder with an index page and one file per unit.** The unit is whatever you add
  one of. Adding one is a new file plus one line in that folder's index. A page that outgrows itself
  becomes a folder, so depth is added locally and never by reorganizing
- **Each group index states its admission test.** *What you can change* takes a decision that holds
  everywhere, belongs to no step, and leaves Flow running when dropped
- **The index carries titles and one line each, never summaries.** A summary is a second copy
- **No numbered filenames, and no cross-references by position.** Order lives in the index alone;
  links name the page they point at
- **`docs/README.md` is the index and the tracker.** Every planned page is listed in reading order,
  written or not. A written page is a link, an unwritten one is plain text. `backlog.md` holds one
  line pointing at it

## Style

`references/writing.md` splits into two layers rather than forking:

- **Style** — common terminology over rare, no invented terms, one idea per sentence, condition then
  action, plain over precise, **plan the shape before typing**. Applies to everything Flow produces:
  skills, `CLAUDE.md`, code comments, and the docs
- **Shape** — steps then reference, every fact in exactly one place, the compression targets. Applies
  only to files that load into context

`docs/writing-docs.md` carries only the deltas: repetition is allowed, length is unbounded, pages
carry a contents block, the index carries reading order. A comments convention later does the same.

**Repetition is the only real conflict.** *Every fact in exactly one place* is right for a loaded file
and wrong for a guide someone lands on from a search. A docs page restates any definition it depends
on in one sentence, then links.

**A docs page plans what the reader knows on arrival, what they know on leaving, and the path
between.** The group index is planned before any page under it.

## What the research changed

Two reports at `lab/research/doc-design/`, one normal and one deep, run by the user 2026-08-29. Four
things came out of them that the plan did not have:

- **Content-type sections are the shape that stalls.** Python's docs team agreed on Diátaxis in 2022
  and never finished. JetBrains' 2022 Django survey: 3% adoption, 81% no formal architecture, in the
  community that invented it. Every stall case is a migration, and Flow is a blank slate, so the risk
  is reduced rather than absent. Use Diátaxis as a review lens, never as folder structure
- **The most-praised site wins on layering, not separation.** Django's top-voted defence is that
  tutorial, overview, usage, API and source are all linked and each layer carries notes for its own
  altitude. Argues against hard walls between sections
- **A precedence and resolution-order page, as its own page.** Both reports call it the highest-value
  content for a config tool, because config failures are silent. Flow has exactly this problem and it
  is scattered across three files today
- **One complete annotated example as the quickstart target.** A real project's `CLAUDE.md`,
  `.claude/settings.json` and `.claude/flow/`, commented line by line

Dropped on the evidence: **`llms.txt`** (97% get zero traffic, no measured effect, Google says nothing
fetches it) and **a named owner per decision record** (the evidence is about teams losing people; one
author).

## Rejected, and staying rejected

- **A test over the examples in `docs/`.** Raised twice. The second refusal carries the argument:
  hand-written examples cover the obvious tenth of the scenarios and miss every tricky one, so a green
  suite reports a safety nobody has. Flow's examples are shell lines and JSON rather than compilable
  code, so nothing can run them anyway. **Do not raise it a third time.**
- **Generated command reference.** Hand-written, and a command may be explained in several places
  where it is actually reached for. Docs get updated inside the change that touched the CLI, the way
  the writing pass already works
- **Grouping decisions by component** — `skills.md`, `subagents.md`. Closed
- **Naming a project's disabled skills in `home/CLAUDE.md`** — that file loads everywhere. Discovery
  is `flow skills ls` or the project's settings
- **Off-by-default for skills.** Proposed twice, rejected twice
- **`commands/` is closed.** It holds every skill the user mainly invokes and wins wherever two groups
  fit. `/cut-from-spec` lives there

## Parked, with nothing owed

- **The license.** MIT recommended — every project Flow competes with is MIT. It is just a file: no
  registration, no fee. Copyright already exists on creation; the file is the permission granted on
  top. Add it any time before the repo goes public
- **The upstream research caches.** 16 tracked files are verbatim copies of other people's docs —
  `lab/research/claude-code-docs/` (12), `claude-agent-skill-best-practices.md`, and 3
  `agentskills-*.md`. Publishing republishes them. The user chose to keep them tracked for now
- **`toolbox/`** — moved under `repos/` by the user and meant to be deleted. Settled. Never raise it

## The state of the repo

Everything from the skills build is applied and verified: 17 tests pass, `try.sh` rebuilds with no
dangling links and links all 12 skills, every frontmatter parses, and no file outside `lab/` mentions
the superseded install tiers or a `commands/*.md` path. The tree is uncommitted and that is expected.

## The first action

Nothing is pending. The docs get designed further or built later — not now.

If work resumes on Flow itself, `backlog.md` → `## Next` item 1 is the real session: `bash
scripts/try.sh`, then start an interactive session against it and watch whether a fresh session
reaches for the right skill from its description alone. No build can stand in for it.
