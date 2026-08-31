# Flow's public documentation — `docs/manual/`

Designed 2026-08-29, unwritten and staying unwritten. Two things have to land first: the workflow
finished, and the management skill built. **Read this when writing starts, or when `references/style.md`
gets restructured** — `## Writing style` below binds every file Flow writes, not only a manual page.

Not to be confused with `design-project-docs.md`, which is a *project's* `docs/context/` tree.

## What `docs/manual/` is

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

## Writing style — three scopes in one file, landed 2026-08-30

`references/writing.md` became `references/style.md`. It claimed one style with no exceptions and held
more than one: a manual page is read once by a stranger arriving from a search and never enters a
session, so rules written for a file that costs tokens on every run do not reach it.

The file now names three scopes at the top and assigns every section.

**Everything Flow writes** — a skill, a `CLAUDE.md`, a workflow doc, a message to the user, a manual
page: §1 planning, §2's markdown defaults, §5 sentences, §6 → `### Anywhere`, §7 what may never be cut.

**Only a file that enters an agent's context**: §1's Step / Reference mark, §2 section shapes, §3 one
home per fact, §4 branching, §6 → `### Only in a loaded file`, §8 frontmatter, §9 transformations.

**A manual page**, on top of the first scope: §10.

**§6 held both and split in place.** `### Anywhere` keeps digits over words, a skill written `/name`,
and symbols only where genuinely clearer. `### Only in a loaded file` keeps dropping articles, bending
grammar, and deleting a sentence that changes no behavior — a rule that judges a model rather than a
reader, and a manual sentence that changes no behavior may still teach. The section's own opening line
is why the other half reaches a manual page: *readability first; the token saving is small*.

**§3 is the one rule that reverses.** A second copy of a fact drifts and costs a loaded file tokens on
every run. It costs a page reached from a search nothing, so §10 tells a manual page to restate the
definition it rests on in one sentence, then link.

**§1–§9 kept their numbers**, so every citation in `compression.md`, `backlog.md` and this file still
resolves. §10 is new and sits after §9.

**Compression belongs to the loaded scope and has its own record.** `compression.md` locked that pass
2026-08-18 and is scoped to skills throughout.

**Inside the loaded scope, pressure varies and the rules do not.** A skill `description` sits in context
from the moment a session starts, invoked or not, so it compresses hardest. A `SKILL.md` loads when the
skill fires. A `references/` file loads on demand and compresses least.

### No separate docs style file

`docs/writing-docs.md` was planned and dropped. Style rules split across two files drift, and the drift
is invisible because nobody reads both. The deltas are 5 bullets, and 5 bullets do not earn a file that
has to stay consistent with 190 lines elsewhere. They are §10.

What stayed out of `style.md`: the six sections, the group indexes and their admission tests. That is
architecture rather than style, and it lives in this file until the manual is built.

### What names `style.md`

- **Routing pointers** — the writing-pass rule in `home/CLAUDE.md` → `## Hard rules`,
  `skills/commands/file-findings/references/write-skills.md:3`, `skills/phases/execute/SKILL.md:154`,
  and 2 in the repo's own `CLAUDE.md` (the hard rule, and `## Writing any file`)
- **Citations by section number** — `compression.md` cites §3 and §7, `backlog.md` cites §5, §6, §8 and
  §9, and this file cites §1 through §10
- **Never swept** — the 2 hits in `skills/tools/visualize/references/draw-mockups.md` are ASCII inside a
  mockup, not pointers

## The docs collision — `docs/` was wanted by two things

Flow writes 8 things into a project's `docs/`, and a project installing Flow very often has a `docs/`
folder already. Both halves settled 2026-08-30.

**Flow's working store moved to `.flow/`** — `tickets/`, `groundwork/`, `inbox.md` and `handoff.md`. A
ticket queue is not documentation, which is the line `references/workflow.md` already draws for
`protos/`: *a prototype is runnable code, and `docs/` stops being documentation once code lives in it*.

**The project's documents stayed in `docs/`** — `spec/`, `context/`, `research/` and `intake/`. Someone
who inherits the repo and never heard of Flow has to find these, and `intake/` holds their own prior
material. Burying them under a folder named after the tool makes them unfindable by the person who owns
them: six months on, nobody opens `docs/flow/` to learn why checkout was rebuilt.

**`docs/flow/` was rejected even for the store alone.** Docusaurus, MkDocs and GitHub Pages all serve
`docs/` by default and publish every markdown file under it. A project publishing from `docs/` and
storing tickets in `docs/flow/` puts its whole ticket queue on the internet, and nothing warns it. A
hidden root folder sits outside every one of those defaults.

**Flow's own manual is `docs/manual/`.** A root-level `manual/` was argued first and loses the stranger.
All 3 competitor repos — superpowers, agent-skills, mattpocock's skills — publish from `docs/`, so a
stranger opens `docs/` first and lands in Flow's internal specs. Under `docs/manual/` the same instinct
puts them one click from the manual.

**Flow never creates a manual folder in anyone else's project.** The management skill creates `docs/spec/`,
`docs/context/`, `docs/research/` and `docs/intake/`, and nothing else under `docs/`.

**One job went to the management skill**, recorded in `backlog.md`: read `docs/` before writing into it.

**A site-generator warning was rejected, 2026-09-01.** It was proposed here and never asked for. Flow's
own documentation is served from this repository by GitHub Pages, which is all it needs, and no project
Flow touches is planning a generator. A landing page for the workflow would reopen the question; nothing
short of one does.

## `docs/dev/` — the second audience, added 2026-08-30

**Developer documentation had no home.** Three places existed and none fits: `docs/manual/` is for
someone using Flow, `lab/` holds *why* a decision was made rather than *how* to carry a procedure out,
and the repo `CLAUDE.md` loads into every session, so a procedure written there costs tokens in every
turn that never runs it.

```
docs/
├─ manual/     using Flow — every concept, every command, the reasoning
└─ dev/        developing Flow — the dev checkout, the scratch session, the tests
```

**Both are published and `README.md` indexes both.** The split is audience, and it is the same split
that put the manual under `docs/manual/` rather than at `docs/`'s root.

**The line against the repo `CLAUDE.md` is rule versus procedure.** `CLAUDE.md` keeps the short rules
that must be in context. `docs/dev/` holds the long how-to. It is the same line `style.md` draws
between a file that enters an agent's context and one read on demand.

`lab/context/design-dev-loop.md` holds what the first pages have to describe.

## `~/.flow/` — one rule for both levels, decided 2026-08-30

**`.claude/` holds what Claude Code reads. `.flow/` holds what Flow owns.** One rule, applied on the
machine and inside a project, and it is the only rule that says without opening anything whether
deleting a folder breaks Claude Code or loses your work.

Four things under `~/.claude/` are read by Claude Code and stay: `CLAUDE.md`, `settings.json`,
`skills/<name>`, `agents/<name>.md`. Three are not, and move:

- `~/.claude/flow/references` → `~/.flow/references`
- `~/.claude/flow/notes.md` and `study-cases/` → `~/.flow/`
- `~/.claude/scripts` → `~/.flow/scripts`, with `home/settings.json`'s hook paths following

**The project side had the same problem twice as badly.** A Flow project carried `.claude/flow/skills`
and `.claude/flow/overlays/` alongside `.flow/tickets/`, `.flow/groundwork/`, `.flow/inbox.md` and
`.flow/handoff.md` — two Flow folders, one nested inside Claude Code's, and nothing read
`.claude/flow/` except Flow. `.claude/flow/overlays/` moves to `.flow/overlays/`;
`.claude/flow/skills` is deleted outright, along with the mechanism behind it
(`design-skills.md` → `## Installing and showing`).

**Cost:** about 15 path strings in live files, plus `try.sh`'s hook rewrite and `install.js`'s link
targets. The three hits in `references/style.md` are quoted before/after examples and must not be
swept.

**One leak to close while in there.** `lib/cases.js` resolves `FLOW_HOME || ~/.claude/flow` from
`os.homedir()`, and `try.sh` never sets `FLOW_HOME`. A scratch session running `flow cases new` writes
into the real study cases today.

### Built 2026-08-30, and the design was missing a flag

**`flow install` resolved one root and hung all four link groups off it**, so `--home` redirected the
whole install in one move. That single flag is what made `try.sh` safe. Splitting the destination left
`--home` covering only what Claude Code reads, so `scripts/` and `references/` would have installed
into the real `~/.flow` from a scratch run — silently, the symlinks then pointing at whichever
checkout ran the script.

**`flow install --flow-home <path>` closes it**, defaulting to `~/.flow`, and `lab/scripts/try.sh`
passes both. The scoping test was rewritten with it: it asserted that nothing landed beside `--home`,
which would have kept passing while every script escaped.

**One flag without the other is refused, added the same day.** Two flags where there was one turned a
safe default into something a caller has to remember, and forgetting writes to the real machine
silently. Refusing costs nothing: a real install passes neither flag, the scratch session passes both,
and one alone is only ever the mistake.

**The `lib/cases.js` leak closed in the same pass.** It now defaults to `~/.flow`, and `try.sh`
exports `FLOW_HOME` into the session it starts, so a scratch `flow cases new` writes into `tmp/`.

**Verified:** both roots build under `tmp/try/`, the scratch `settings.json` carries rewritten hook
paths, `flow overlays groundwork` reads `.flow/overlays/`, `flow cases new` honours `FLOW_HOME`, and
`~/.flow` does not exist on this machine afterwards. 17 tests pass.

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
- **Off-by-default for skills — overturned 2026-08-30.** Proposed twice and rejected twice, then
  reversed by the user: `stack/` skills ship off and a project turns one on. Kept here because the
  2 rejections are still findable and the reversal is what holds. `design-skills.md` →
  `## Installing and showing`
- **Replacing `references/style.md` §9's toolbox example.** It quotes a bullet deleted from
  `home/CLAUDE.md` on 2026-08-25 as the before/after for *state the test, delete the illustrations*.
  An example routes nobody anywhere, and hunting for another real pair buys nothing
- **`commands/` is closed.** It holds every skill the user mainly invokes and wins wherever 2 groups
  fit. `/cut-from-spec` lives there

## Parked, with nothing owed

- **The license.** MIT recommended — every project Flow competes with is MIT. It is just a file: no
  registration, no fee. Copyright exists on creation; the file is the permission granted on top. Add it
  any time before the repo goes public
- **The upstream research caches.** 16 tracked files are verbatim copies of other people's docs —
  `lab/research/claude-code-docs/` (12), `claude-agent-skill-best-practices.md`, and 3
  `agentskills-*.md`. Publishing republishes them. The user chose to keep them tracked for now
