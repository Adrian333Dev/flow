# Refactor agenda — user notes, 2026-08-09 (late)

**Open items are indexed in `backlog.md`, at the repo root.** This file holds the reasoning behind them; it is not a place to check for work.

Parked at the user's request, mid-conversation, **nothing here is designed and nothing is approved.** One
message, eight items. Written down so the conversation can proceed one item at a time without losing the rest.

The user's framing: *"there is a lot to say here… let's go over them one by one."* Order below is theirs, not
priority — except the last line, which sets what happens first.

**Start with item 6.** The user's own instruction: park these notes, then begin with the context-file cleanup
and the single folder. Everything else waits its turn.

---

## 1. Changelogs — stop, until v1 publishes

**Stop writing `CHANGELOG.md` files entirely.** Not "write fewer" — stop. The user is deleting every existing
one immediately.

They come back **only after the first published version of Flow**, not before. Any rule requiring a changelog
entry is to be suspended or removed; the user left that choice to the agent.

Rules affected: `skills/CLAUDE.md` (the `CHANGELOG.md` convention), root `CLAUDE.md` `## Rules` (the commit-
message bullet that leans on it).

## 2. Frequently-loaded skills belong in `CLAUDE.md`, not in `skills/`

**The big one.** A skill that has to load 95–99% of the time should not be a skill — the essential part of it
belongs directly in `home/CLAUDE.md`, which is always in context.

`explain` is the case that proves it. Today the user has to name the skill out loud for it to fire, which
means it does not fire. **Archive `explain`** and move the large majority of its content into
`home/CLAUDE.md`.

Not all of it. The split:

- **Into `home/CLAUDE.md`** — the essentials, meaning the ASCII-visualization rules. Diagrams in ordinary
  conversation, and whenever something is being proposed. **Not** the mockup material and **not** the HTML.
- **Into reference files** — the advanced and situational material. `home/CLAUDE.md` points at them, and
  the rule is **reach for them only when actually required**.
- Target the user named: **70–80% of the time everything essential is already in `CLAUDE.md`**, no file read
  needed.

Open, undecided: where reference files live. A new path is needed; the user said to come up with one.

Two observations from the user, not yet acted on:

- `explain` is really **explain + visualize** — two jobs in one folder.
- It will **overlap with `prototype`**, a skill not yet brainstormed. Design the boundary when `prototype` is
  designed, not before.

The same test applies to any other skill that loads nearly every time. Which ones those are has not been
worked out.

### ✅ DONE 2026-08-12, by a different mechanism than this item proposed

`explain` was **renamed `visualize`**, not archived, and nothing moved into `home/CLAUDE.md`. What made the
skill fire without the user naming it was its own `description`, which sits in context every turn — so the
trigger became always-loaded while the skill body stayed on demand. That is this item's goal (*"70–80% of
the time everything essential is already in `CLAUDE.md`"*) reached without growing the always-loaded file at
all, which the measurement rule below asks for. The repo `CLAUDE.md` carries a `UI is drawn` bullet that the
global copy deliberately lacks, for exactly this reason: there, `visualize`'s description already says it.

**Measure the whole context window, never one file** (user's correction, 2026-08-09). The agent objected that
item 2 grows `home/CLAUDE.md` while item 5 shrinks it, and called that a tension. It is not. Today's cost is
`CLAUDE.md` **plus the entire `explain` skill**, because the skill loads almost every turn. Afterwards it is
`CLAUDE.md` plus a smaller block, and the skill is gone. A file getting longer is not a regression when a
larger file stops loading. **Judge every proposal in this refactor by total input, not by any single file's
line count.**

## 3. Compress every context file — start now, research first

Previously deferred; the user is **reversing that** and starting now. The goal as they put it: **if a thing
takes three lines, work out how to say it in one.**

**Research comes before any rewriting**, and it must be extensive. First stop is **caveman**, cloned at
`repos/caveman`. The user had not read it and asked to understand it fully before it gets used as a
reference — that explanation was given in conversation 2026-08-09 and the substance is in item 3a below.

### 3a — What caveman is (researched 2026-08-09, so the next session need not re-read the repo)

A third-party skill, [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman). One idea: instruct
the model to **write** in a clipped, article-free register — "New object ref each render. Wrap in `useMemo`."
It shrinks what the agent **says**. It does not shrink what the agent **reads**.

Their own honesty page is the useful part. Measured: **65% fewer output tokens** on prose replies, **0%** on
input, and the skill itself **costs about 1–1.5k input tokens every turn** because its rules sit in context.
On short replies it is a net loss, and they say so in writing.

**For Flow, the output mode is the wrong half.** The problem here is input size — `home/CLAUDE.md` loading
in every session. The relevant half is the sibling skill **`caveman-compress`**, which rewrites a memory file
in place, keeping code, paths, commands, URLs, headings and table structure byte-exact and compressing only
the prose around them. Measured on its own test fixtures: a sample project `CLAUDE.md` went **1122 → 641
words**, and a notes file **1145 → 535**. Roughly **45–55% of the words gone** with structure intact.

Two rules of theirs worth stealing outright, both counter-intuitive and both justified by tokenizer
behaviour rather than taste:

- **Never invent abbreviations** (`cfg`, `impl`, `req`, `fn`). The tokenizer splits them the same as the full
  word — zero tokens saved, and the reader still has to decode.
- **Never use arrows (`→`) as connectors.** Each is its own token and saves nothing.

Also worth stealing: never drop `not` / `never` / `no` / `only` / `except`, since inverting a rule costs far
more than the token saved.

Not yet decided: whether Flow adopts caveman's *style* for its own files, borrows only its compression rules,
or just uses it as evidence that compression works. The user has read none of this yet.

## 4. `lab/` has too many context files

Roughly 15–20 markdown files sit **directly under `lab/`**, and that is the specific complaint. Archive them
or delete them.

The wanted end state: **one folder holding all context produced while building this workflow.** Not a dozen
loose files at one level.

### ✅ DONE 2026-08-09 — `lab/context/`

Thirteen files moved there; `lab/` now holds folders and `proxy.mjs` and nothing else. Every `lab/<name>.md`
reference swept to `lab/context/<name>.md` across the root `CLAUDE.md` and the moved files themselves.

**Folders were left completely alone** — the user's correction: the complaint was about loose files, not
about folder structure. No `archive/`, nothing moved into `refs/`, `excalidraw/` and `archived-skills/`
untouched.

Two files deleted (user-authorized, both recoverable from git): `shit-explanation.md` and
`2026-07-22-explanation-counter-example-c5.md` — specimens of bad explanations collected **before** the
`explain` skill existed, and spent now that it does.

**One file was held back against the user's instruction to delete everything about explaining:**
`design-explain-rework.md`. It was the design record rather than a specimen, and it carried the decision
item 2 needed — which half of `explain` is always-on prose, and which half fires only when something gets
rendered — plus the ASCII charset reasoning. **It went 2026-08-28**, once its condition had landed and the
charset reasoning had moved into `skills/visualize/SKILL.md`.

The files' contents were cleaned 2026-08-28, which is item 4b.

### 4b — Clean up what is inside those files — ✅ DONE 2026-08-28

The user: *"many of the other files could be outdated as well."* They were. Every file was tested against
`backlog.md` and against what ships on disk; `lab/context/` went from 6,500 lines to 4,005 and from 18
files to 17. `design-restructure.md` → `## The second cut` records what went and why.

## 5. `home/CLAUDE.md` carries too much that does not belong

The user's principle: **stop explaining to the agent how to make decisions.** The file over-instructs.

Named specifically:

- **The ticket-pickup decision diagram must go.** *"It wasn't supposed to be there."* The user doubts it
  should even be referenced from the file.
- **`## Key docs` — remove a large chunk.**
- **`## Workflow` — compress heavily.** It lists every core skill and explains what each one does. But skills
  are already loaded, so their descriptions are already in context; the file is repeating them. **Naming them
  may be enough.** This gets worse as more core skills are added.

### ✅ DONE — all three targets are gone

`home/CLAUDE.md` has no ticket-pickup diagram, no `## Key docs` and no `## Workflow`. `## Workflow` went
furthest: rather than being compressed, it was deleted outright, and the one line pointing at
`~/.claude/flow/references/workflow.md` replaced it.

## 6. The handoff file is read once, then discarded

A correction aimed at the agent's behaviour. The agent has been **actively tracking and updating
`lab/context/handoff.md`** as though it were a living document. It is not. The file itself was
deleted 2026-08-28.

The intended lifecycle: a fresh session **reads it once, absorbs it, and is then done with it.** No ongoing
tracking, no constant updating. The user expects to add **strong instructions to `commands/handoff.md`**
saying the file is cleaned up once absorbed — phrased as "probably going to", so it is not yet decided.

## 7. No commits for a long time

The user will **not commit until the refactor is fully finished.** Do not offer `gsave` at checkpoints, and
do not treat an uncommitted tree as a problem to solve.

## 8. Stale command symlinks point at the deleted workbench repo

Found 2026-08-09. `~/.local/bin/ptree`, `flow`, `fmerge` and `gsave` all resolve to
`/home/me/code/projects/agentic-setup/flow/scripts/…` — the workbench repo the root `CLAUDE.md` says
was deleted 2026-08-07. **It still exists on disk**, and its `flow.js` differs from this repo's, so the
`flow` command currently runs old code. `ptree.sh` is byte-identical, so `ptree` is safe to use meanwhile.

The user's call: *"we just probably forgot to update it or delete it, so you can handle that later."* Deferred,
not a problem to solve now. **Not an install** — repointing an existing symlink is repair, not installing
Flow, but confirm with the user before touching anything under `~/`.

---

## 9. `brainstorm` reworked — ✅ DONE 2026-08-09

Not originally on this agenda; it came out of reading three third-party skill libraries and one
commissioned research report. Recorded here because **there are no commits right now**, so git carries none
of the reasoning.

**The problem the user named:** brainstorm structured their input and generated nothing. Every branch derived
from something they had already said, so a whole approach could go unconsidered. Their words: *"it's more
closer to just structuring users' inputs. Rather than throwing ideas at the user."* Their stated fear is
missing a branch.

**Sources.** `repos/agent-skills` (`interview-me`, `idea-refine`, the spec/plan/implement chain);
`repos/mattpocock-skills` (`grilling`, `grill-me`, and the `question-limits` rationale);
`lab/research/making-ai-creative.md`, the commissioned report.

**What landed, and why each one rather than the obvious alternative:**

| Change | Chosen over | Because |
|---|---|---|
| widen step: dimensions × HAZOP guide words, premortem, prior art, premise challenge, relevance cut | a lens list (simplify / 10x / invert / expert eye) | soft cues are the weak class. Structural enumeration converts "think what's missing" into a finite cross-product. Guide words already contain simplify (`less`), 10x (`more`) and invert (`reverse`) |
| one procedure at any input size | separate long-input and short-input paths | user, explicitly: one mode handling both ends of the spectrum |
| rounds in Phase 1, one branch at a time in Phase 2 | Matt's frontier rounds everywhere, or one-at-a-time everywhere | the two references contradict each other. Split by job: gap-filling questions are independent and batch fine; a decision that constrains other decisions earns its own turn, which is Flow's existing hard rule |
| new input absorbed mid-walk, re-widened, closed branches re-checked | intake as a front phase | user: the ask never arrives at once — *"as we continue discussion those ideas come to my mind and I keep dumping them"* |
| `grill` dispatched as a separate subagent for the closing coverage pass | grill inline, or no coverage pass | self-critique with no external check degrades reasoning, and models soften where the user looks invested. Grill already demands a named case and step; only context isolation was missing |
| render the unanswerable via `explain`, ASCII frame first | Matt's stop-and-prototype | Flow has `explain`; the delapse dev-control-panel session went frames-in-separate-files → agreement → HTML for colour only → build. "Prototypes never come first" survives |
| non-goals recorded at close, both modes | `never` rung in product mode only | both references treat the not-doing list as non-negotiable |

**Deliberately rejected**, with the evidence:

- **"Think outside the box" as an instruction.** Folklore. Measured effect is stylistic — more adjectives —
  with no gain in novel structure, and quality drops.
- **Ban-your-own-first-instinct (denial prompting).** The report's own draft instruction included it while
  its evidence sections show it helps on soft writing tasks and **significantly hurts** on hard tool-use
  tasks. Flow's domain is the second kind. The anti-fixation job is done instead by forcing three
  structurally distinct solution families before any evaluation, which has no measured downside.
- **Multi-agent debate as a diversity engine.** It converges — conformity measured up to 85.5%, and a proof
  of no expected gain over independent voting. Parallel *independent* subagents with non-overlapping
  contexts are the working form.
- **Adopting `interview-me` or `idea-refine` as skills.** User: bake it in. Matt's `grilling` is already
  near-identical to Flow's brainstorm; the gap was that Flow's interview started only after the tree existed.

**Unverified:** the report's classical citations check out (Luchins, Duncker, Gick & Holyoak, the Bilalić
chess Einstellung work, Klein's premortem, tree-of-thoughts, the self-correction result). Its 2026 arXiv
identifiers could not be checked and several postdate the model's training. Load-bearing conclusions rest on
the classical work.

**Left open:** `explain` is archived by item 2, so the render pointer in `brainstorm` has to be re-aimed when
that lands. The depth material — reformulation, forced distant analogue, three families — also belongs in
`execute` and in the unbuilt debug skill; only the brainstorm half is done.

**Naming collision, unresolved:** Flow's `grill` attacks a finished design by running cases. Matt's
`grill-me` is the interview. Same word, opposite activities. Typing "grill me" here gets the case-walker.

## 10. Every skill gets the whole `style.md` pass — in progress

One skill at a time, each read end to end against `references/style.md`: plan the sections before typing,
then test every sentence.

**It is a compression pass — reversed by the user 2026-08-20**, after the first `execute` attempt did
structure only and they rejected it: *"there is zero compression, all the sentences are just too much
detail, too much over explanation. I fully disapprove this shit."* The standard they gave: **instruct, do
not justify.** Why Flow decided something goes in a document written for the user, never in the file an
agent loads. The line held so far, and not yet overruled: cut the design justification, keep a reason only
where it tells the agent what to do in a case the rule does not name.

**`visualize` is done, 2026-08-19**, and it set three conventions the rest of the queue inherits:

- **`SKILL.md` is the only file at a skill's root.** Everything else goes in a folder — `scripts/` for
  executables, `refs/` for markdown read on some runs and not others, or a purpose name where one fits
  better. Written into the repo `CLAUDE.md`. `brainstorm/write-spec.md` moved the same day.
- **A skill never restates a rule `home/CLAUDE.md` already carries.** Found when *Preferred over a table*
  turned out to duplicate a line in the always-loaded file.
- **An agent-facing file states the rule; the reasoning behind it goes in a document written for the user.**
  Found when a measured cost figure was cut out of `visualize` — the agent needs the instruction, and the
  argument for adopting it belongs where the user reads it.

**`execute` — first attempt rejected, still owed.** The dedup pass landed (221 → 204 lines,
`review-code.md` moved to `refs/`, no rule lost) and stays as the base, but the file is not done: the user
rejected it for over-explaining, and its scope then shrank twice — pickup moved to `/start` 2026-08-20, and
the pickup fork itself came out of Phase 1 the same day, leaving 186 lines. See `design-pickup.md`. That pass still set two conventions the queue inherits:

- **A `## Hard rules` section is a home, not a recap.** `execute`'s 13 bullets were a table of contents for
  its own body: 10 restated a bold rule sitting in the phase where it fires, 1 restated `home/CLAUDE.md`,
  and 2 existed nowhere else — which is the drift `style.md` §3 predicts. The whole section went, after
  folding those 2 back in. The other 7 sections were read the same way and stay: theirs carry rules their
  bodies never state.
- **`/name` names a skill. Bare backticks name a ticket type, a file or a command.** Found on the line that
  read "**`prototype`** → **`prototype`** owns it", where the type and the skill rendered identically.

**The queue**, each still owed the pass: `file-findings` (+`write-skills.md`), `debug`, `handoff`,
`prototype`, `research`, `write-tickets`. `debug-web-pages` is excluded. `groundwork` — renamed from
`brainstorm` 2026-08-20 — had its rework at item 9 but not this pass.

**`debug` — parked with a batch, 2026-08-21.** The user read the skill, could not follow it, and asked
whether it had ever had the pass. It has not. Everything below waits and lands in one go, at the pass:

- **Bring the collaboration loop out of `debug-web-pages` and make it general.** Its write-it, you-run-it,
  paste-it-back exchange is the only place in Flow that handles a failure the agent cannot reproduce itself.
  `debug` needs the same shape for a failure with no domain tooling and no access to where it happens.
  Handing off to `debug-web-pages` stays exactly as it is; this is for everything that is not a page.
- **The failing check is not always a command.** Sometimes it is steps the user runs and reports back. The
  file states it as "one command" in its second sentence and only qualifies that 30 to 50 lines below, under
  headings a reader reaches after already deciding the skill does not fit.
- **Rename "the red command" to "the failing check".** "Red" is borrowed from red/green testing and never
  defined in the file. The replacement reads correctly in all eight places it appears.
- **Two lines carry no meaning as written.** `Bound it first where you can…` means find one case that works
  and one that breaks — in time (`git bisect`), in the input, or in the machine — and says none of it.
  `one from the data, one from the environment, one from the ordering` means the three hypotheses must be
  different kinds of cause, and gives no example of any of the three.

**`file-findings/write-skills.md` is the last file breaking the root rule**, and that skill is the natural
next one.

**Also owed:** finish the `/skill-name` sweep — `skills/prototype/SKILL.md` writes `visualize` bare in 4
places. Check `handoff/`, `research/` and `references/study-cases.md` the same way. And
`handoff/SKILL.md:97` — "Capture in the project `CLAUDE.md`" looks wrong.

## 11. Three corrections after the pickup build — 2026-08-20

The user read the built result and named three. Two are settled — `graph.js` keeps its name, the folder is
renamed. The routing line landed 2026-08-22 and is written below as they put it, next to what the code does.

### The `/start` routing line is unreadable — ✅ **done 2026-08-22**

`commands/start.md` carries `` - `feature`, `chore` → `/groundwork` at `groundwork`; `/execute` at `planning`,
`building` or `review` ``. The first `groundwork` is the skill and the second is the status, and nothing on the
line says so — the user worked it out rather than being told, and called the line confusing twice.

**Their fix: the status leads, and the arrow points at the skill**, possibly with the skill in parentheses.
Sketch:

```
- `groundwork` → `/groundwork`
- `planning`, `building`, `review` → `/execute`
```

**The type half stays.** `issue`, `prototype` and `topic` each route on type alone; only `feature` and `chore`
branch on status. So the fix is a nested list under those two, never a flat list of statuses.

**They also object to the word `route`** — nothing is routed anywhere, since the same session loads the skill
and carries straight on.

**Counter-argument, for the discussion.** `route` is Flow's own term, defined in `style.md`: *"Naming which
skill owns a job is routing and belongs."* `groundwork` Phase 4 is titled *route what was decided* and
`file-findings` has a `## Routing` section, so renaming it in `/start` alone gives Flow two words for one idea.
The ambiguity the user hit is real and it comes from somewhere else: `/start` never says the skill loads here,
in this session. One added line fixes that and keeps the term.

### `graph.js` keeps its name — closed 2026-08-20

The user proposed `ticket-tree.js`, on the grounds that `ptree` already exists so `graph` reads as some other
structure. **Withdrawn the same day, on the counter-argument: half the file is not a tree.** `forest`,
`children`, `descendants` and `wouldOrphan` walk the parent nesting, which is one. `unmetDeps`, `dependents`,
`findCycles` and `wouldCycle` walk the dependency edges, which are not — a ticket takes several blockers,
blockers converge, and `findCycles` exists because they can loop. A name saying tree makes that half
unfindable.

### The ticket folder is still `brainstorm/` — ✅ **done 2026-08-21**

The user's argument: the folder holds the whole pre-build record — `map.md`, the branch files, `design.md` —
and the skill that owns it is `groundwork`, so a folder named after the retired skill name misleads whoever
opens it. Renamed everywhere: the ticket's `brainstorm/` → `groundwork/`, `docs/brainstorms/<slug>/` →
`docs/groundwork/<slug>/`, `--from-brainstorm` → `--from-groundwork`, plus the identifiers in `store.js` and
`flow.js`. Verified by creating a ticket and moving a loose folder in.

Nothing on disk needed migrating — no project has been migrated to Flow yet, which is why it was worth doing
now rather than after Delapse moves.

**It leaves one name carrying four meanings:** the skill `/groundwork`, the ticket status `groundwork`, the
`flow groundwork <id>` verb, and now the folder. That makes the `/start` routing line above worse, not
better — `` `feature`, `chore` → `/groundwork` at `groundwork` `` now sits next to a folder with the same
name. Fixing that line is still open.

### `## References` in `ticket.md` — built 2026-08-21

**The user's rule: never make the agent work out what is relevant, hand it the references.** Flow already
had this for one entry path — `write-tickets` carried *"artifact references travel with the ticket"* as a
hard rule — and it now holds for all of them, under a fixed section name.

- **Groundwork adds a line to `## References` in `map.md` the moment it reads something the build will
  need**, rather than assembling the list at the end, where half of it is forgotten. Phase 4 copies each
  ticket the lines that ticket needs, never the whole list — `/execute` reads every one, so a ticket pointed
  at everything is pointed at nothing.
- **`execute` Pass 1 starts there** instead of browsing `docs/context/`. A ticket born in conversation has no
  section: look once, then write back what you found so the next session does not repeat the search.
- **`review-code.md` checks the diff against it, first**, before the smell baseline. A convention nobody
  referenced was never in scope, which is what stops review turning into an audit.
- **It survives the ticket.** Review deletes `## State` and leaves this.

**Rejected on the way:** a Phase 4 step in `execute` writing an integration reference to `docs/context/`,
modelled on LumaCraft's `customizations.md`. That document only existed because LumaCraft had no groundwork,
no research phase and no prototyping, so everything discovered mid-build had to be written down afterwards.
Under Flow that content is produced upstream — the prototype answers whether the library can do it, the
design states the shape, the research file holds the API calls. Never compare an artifact from that project
to this workflow one-to-one.
