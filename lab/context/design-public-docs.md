# Flow's public documentation — `docs/`

Designed 2026-08-29, unwritten and staying unwritten. Two things have to land first: the workflow
finished, and the install skill built. **Read this when writing starts, or when `references/writing.md`
gets restructured** — `## Writing style` below is the half that binds a file outside `docs/`.

Not to be confused with `design-project-docs.md`, which is a *project's* `docs/context/` tree.

## What `docs/` is

**Official documentation for a stranger, A to Z.** Flow is going public against superpowers,
agent-skills and mattpocock's skills, so the reader cloned it and knows nothing about Flow.

**Claude Code familiarity is assumed.** The reader has used Claude Code and knows roughly what a skill
is. They have not touched hooks or most settings. Claude Code and skills get a sentence where they are
first named, never a section.

**It is the only part of Flow with no token budget and no agent reading it.** That decides everything
else: `docs/` explains and never states. A page never restates what a skill says — it says why the
skill says it, and links. **No skill and no `CLAUDE.md` ever points into `docs/`.**

## The six sections

Grouped by **why you are reading**, never by which part of the machine a page touches. Grouping by
component was rejected outright: *"that's absolute worst way to teach strangers."*

- **Use Flow** — concepts first (what Flow is, tickets, phases, the approval discipline), then running
  work. Concepts live here rather than in their own wing, the way ESLint files its core concepts
- **Configure Flow** — settings, `skillOverrides`, overlays, the project template, **precedence and
  resolution order**, and **why didn't my skill fire**
- **Extend Flow** — write a skill, add a stack skill, vendor an external one
- **Why it works this way** — the decisions
- **Reference** — every command, key, skill and file
- **Work on Flow** — the repo, the tests, `try.sh`

**Reference is a section, not the spine.** Both research reports recommended a reference-heavy site on
the ESLint model, and it is wrong here: ESLint's reader knows what linting is and arrives from an error
message, while Flow's reader does not know what a phase is. Flow's explanation load is higher and its
config surface is far smaller.

## `Why it works this way` — four groups

By **scope and consequence**. This is the user's axis, and it is what makes a decision file itself.

- **What you can change** — global, tied to no step, safe to drop. The git-mutation ban,
  `AskUserQuestion` denied, plan mode denied, no changelog, ASCII over images, how the agent explains
  itself
- **What holds it together** — global, and something breaks. Nothing may change the working tree while
  a subagent runs, because the snapshot diff is the only honest account of what it touched. `git add`
  staying reachable. Descriptions carrying no trigger. One copy of a skill per machine
- **Inside a phase** — review running in-session, no `code-review` skill, groundwork walking every open
  decision to an answer
- **At setup, once** — symlinks and no copies, no versions, no plugin manifest, every skill on by
  default, a project overriding key by key

Entry format is Go's FAQ: **the decision, the alternative rejected, the consequence**, in 1 to 3 blunt
paragraphs.

**The inventory is incomplete and known to be.** The real set comes out of reading `lab/context/` end
to end, about 4,000 lines. **The four groups get confirmed by that harvest, not before it.**

## What makes it extensible

Room is not what makes a structure extensible. **Every new item has one obvious home, decided by a
written test rather than by resemblance.**

- **Every section is a folder with an index page and one file per unit.** The unit is whatever you add
  one of. Adding one is a new file plus one line in that index. A page that outgrows itself becomes a
  folder, so depth is added locally and never by reorganizing
- **Each group index states its admission test.** *What you can change* takes a decision that holds
  everywhere, belongs to no step, and leaves Flow running when dropped
- **The index carries titles and one line each, never summaries.** A summary is a second copy
- **No numbered filenames, and no cross-references by position.** Order lives in the index alone; a
  link names the page it points at
- **`docs/README.md` is the index and the tracker.** Every planned page is listed in reading order,
  written or not. A written page is a link, an unwritten one is plain text

## Writing style — two scopes, not one

`references/writing.md` opens by claiming one style with no exceptions, covering every markdown an
agent reads and every message written to the user. A docs page is neither. A stranger lands on it from
a search, reads it once, and it never enters a session's context.

The file holds two scopes, and today it never says which rule is which.

**Everything Flow writes, docs included:**

- §1 — name the sections and their order before writing a sentence; plan the whole file every time you
  touch it
- §2 — standard markdown, default to a list
- §5 — every sentence rule: front-load the polarity, end on the point, one idea per sentence, condition
  left and action right
- §6 in part — digits over words, a skill written `/name`, symbols only where genuinely clearer
- §7 — never cut a rule, the reason, the last example, or information

**Only a file that enters an agent's context:**

- §1 in part — marking each piece Step or Reference
- §2 — the section shapes, and putting the highest-stakes rules first or last
- §3 — one home per fact
- §4 — branching a step
- §6 in the rest — dropping articles and filler verbs, bending grammar, and deleting a sentence that
  changes no behavior
- §8 — frontmatter descriptions
- §9 — the compression transformations

**§6 is one list holding both scopes, and it gets split when the file is edited.** Its own opening line
— *readability first; the token saving is small* — is why half of it reaches docs. A docs sentence
carries no filler either. The other half is compression: telegraphic phrasing, bent grammar, and
*delete a sentence that changes no behavior*, which judges a model rather than a reader. A docs
sentence that changes no behavior may still teach.

**Compression belongs to the loaded scope and already has its own record.** `compression.md` locked the
pass 2026-08-18 and is scoped to skills throughout.

**Inside the loaded scope, pressure varies and the rules do not.** A skill `description` sits in context
from the moment a session starts, invoked or not, so it compresses hardest. A `SKILL.md` loads when the
skill fires. A `references/` file loads on demand and compresses least.

**§3 is the one rule that reverses.** *Every fact in exactly one place* is right for a loaded file,
where a second copy drifts and costs tokens on every run. It is wrong for a page someone reaches from a
search: that page restates the definition it depends on in one sentence, then links.

## `docs/writing-docs.md`

Carries only what differs for a docs page — repetition allowed, length unbounded, a contents block on
each page, reading order in the index, and a page planning what the reader knows on arrival and on
leaving. Everything else points at `writing.md`.

**A docs page, not a skill.** Writing Flow's documentation happens in this repo and nowhere else, and a
skill installs on every machine to fire in projects with no `docs/`. `writing.md` §3's own test settles
it: name a moment the rule fires and no skill is loaded — there is none, because whoever writes a docs
page is working on Flow and reads the repo's files. It files under **Work on Flow**.

**It gets written before the first docs page**, and it is the only docs file written before the
workflow is finished.

## The edit `writing.md` needs

One paragraph replacing the scope line, naming the two scopes and assigning each section, plus splitting
§6 into 2 sub-lists. **Held**, because a second session is restructuring that file. It lands after that
session's split, against whatever numbering survives.

## For the session restructuring `writing.md`

**The seam.** Split on the two scopes above, never on anything else. Any other cut leaves the docs plan
pointing at half a file.

**Three moves that break the docs plan:**

1. **Moving the sentence rules into a skill body.** A skill loads when invoked, and the sentence rules
   have to stay reachable to anyone writing anything, so their single home stays a file under
   `references/`. A skill may use them; it must not own them
2. **Narrowing the scope line to "files an agent reads",** handing prose-to-the-user to the explain
   skill. Documentation is neither of those, and it falls out of scope entirely
3. **Renumbering the sections silently.** Renumber freely, just say so — the citations below break

**`## Explaining` is a mirror pair.** It exists in `home/CLAUDE.md` and again in the repo's own
`CLAUDE.md`. `home/` is the source. The repo copy deviates on exactly 2 bullets on purpose — *Name
unfamiliar tech* and *UI is drawn* — because the repo file carries no `## The user`. Both survive any
rewrite.

**`## Explaining` cannot become invocation-only.** It governs every answer, including a one-line
question, so it fires constantly with no skill loaded. `writing.md` §3's test puts it in an always-loaded
file. An explain skill's natural share is the deep procedure — walking a design, structuring a long
report — never the per-sentence rules.

**What breaks on a rename, a split or a renumber:**

- **Routing pointers** — `home/CLAUDE.md:16` (the writing pass) and `:86` (the references list),
  `skills/commands/file-findings/references/write-skills.md:3`,
  `skills/phases/execute/SKILL.md:154`, and 2 in the repo's own `CLAUDE.md` (the hard rule, and
  `## Writing any file`)
- **Citations by section number** — `compression.md` cites §3 and §7; `backlog.md` cites §5, §6, §8 and
  §9; this file cites §1 through §9
- **Leave alone:** the 2 hits in `skills/tools/visualize/references/draw-mockups.md` are ASCII inside a
  mockup, not pointers

**What comes back:** the new filenames if it splits, and the new numbering if it renumbers. Nothing else.

## What the research changed

Two reports at `lab/research/doc-design/`, one normal and one deep, run by the user 2026-08-29. Four
things came out of them that the plan did not have:

- **Content-type sections are the shape that stalls.** Python's docs team agreed on Diátaxis in 2022 and
  never finished. JetBrains' 2022 Django survey: 3% adoption, 81% no formal architecture, in the
  community that invented it. Every stall case is a migration and Flow is a blank slate, so the risk is
  reduced rather than absent. Use Diátaxis as a review lens, never as folder structure
- **The most-praised site wins on layering, not separation.** Django's top-voted defence is that
  tutorial, overview, usage, API and source are all linked, each layer carrying notes for its own
  altitude. Argues against hard walls between sections
- **A precedence and resolution-order page, as its own page.** Both reports call it the highest-value
  content for a config tool, because a config failure is silent. Flow has exactly that problem and it is
  scattered across 3 files today
- **One complete annotated example as the quickstart target.** A real project's `CLAUDE.md`,
  `.claude/settings.json` and `.claude/flow/`, commented line by line

Dropped on the evidence: **`llms.txt`** (97% get zero traffic, no measured effect, Google says nothing
fetches it) and **a named owner per decision record** (the evidence is about teams losing people; Flow
has one author).

## Rejected, and staying rejected

- **A test over the examples in `docs/`.** Raised twice. The second refusal carries the argument:
  hand-written examples cover the obvious tenth of the scenarios and miss every tricky one, so a green
  suite reports a safety nobody has. Flow's examples are shell lines and JSON rather than compilable
  code, so nothing can run them anyway. **Do not raise it a third time**
- **A generated command reference.** Hand-written, and a command may be explained in several places
  where it is actually reached for. Docs get updated inside the change that touched the CLI, the way the
  writing pass already works
- **Grouping decisions by component** — `skills.md`, `subagents.md`. Closed
- **Naming a project's disabled skills in `home/CLAUDE.md`** — that file loads everywhere. Discovery is
  `flow skills ls` or the project's settings
- **Off-by-default for skills.** Proposed twice, rejected twice
- **`commands/` is closed.** It holds every skill the user mainly invokes and wins wherever 2 groups
  fit. `/cut-from-spec` lives there

## Parked, with nothing owed

- **The license.** MIT recommended — every project Flow competes with is MIT. It is just a file: no
  registration, no fee. Copyright exists on creation; the file is the permission granted on top. Add it
  any time before the repo goes public
- **The upstream research caches.** 16 tracked files are verbatim copies of other people's docs —
  `lab/research/claude-code-docs/` (12), `claude-agent-skill-best-practices.md`, and 3
  `agentskills-*.md`. Publishing republishes them. The user chose to keep them tracked for now
