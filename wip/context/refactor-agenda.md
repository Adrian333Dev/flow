# Refactor agenda — user notes, 2026-08-09 (late)

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
belongs directly in `global/CLAUDE.md`, which is always in context.

`explain` is the case that proves it. Today the user has to name the skill out loud for it to fire, which
means it does not fire. **Archive `explain`** and move the large majority of its content into
`global/CLAUDE.md`.

Not all of it. The split:

- **Into `global/CLAUDE.md`** — the essentials, meaning the ASCII-visualization rules. Diagrams in ordinary
  conversation, and whenever something is being proposed. **Not** the mockup material and **not** the HTML.
- **Into reference files** — the advanced and situational material. `global/CLAUDE.md` points at them, and
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

**Measure the whole context window, never one file** (user's correction, 2026-08-09). The agent objected that
item 2 grows `global/CLAUDE.md` while item 5 shrinks it, and called that a tension. It is not. Today's cost is
`CLAUDE.md` **plus the entire `explain` skill**, because the skill loads almost every turn. Afterwards it is
`CLAUDE.md` plus a smaller block, and the skill is gone. A file getting longer is not a regression when a
larger file stops loading. **Judge every proposal in this refactor by total input, not by any single file's
line count.**

## 3. Compress every context file — start now, research first

Previously deferred; the user is **reversing that** and starting now. The goal as they put it: **if a thing
takes three lines, work out how to say it in one.**

**Research comes before any rewriting**, and it must be extensive. First stop is **caveman**, cloned at
`wip/refs/caveman`. The user had not read it and asked to understand it fully before it gets used as a
reference — that explanation was given in conversation 2026-08-09 and the substance is in item 3a below.

### 3a — What caveman is (researched 2026-08-09, so the next session need not re-read the repo)

A third-party skill, [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman). One idea: instruct
the model to **write** in a clipped, article-free register — "New object ref each render. Wrap in `useMemo`."
It shrinks what the agent **says**. It does not shrink what the agent **reads**.

Their own honesty page is the useful part. Measured: **65% fewer output tokens** on prose replies, **0%** on
input, and the skill itself **costs about 1–1.5k input tokens every turn** because its rules sit in context.
On short replies it is a net loss, and they say so in writing.

**For Flow, the output mode is the wrong half.** The problem here is input size — `global/CLAUDE.md` loading
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

## 4. `wip/` has too many context files

Roughly 15–20 markdown files sit **directly under `wip/`**, and that is the specific complaint. Archive them
or delete them.

The wanted end state: **one folder holding all context produced while building this workflow.** Not a dozen
loose files at one level.

### ✅ DONE 2026-08-09 — `wip/context/`

Thirteen files moved there; `wip/` now holds folders and `proxy.mjs` and nothing else. Every `wip/<name>.md`
reference swept to `wip/context/<name>.md` across the root `CLAUDE.md` and the moved files themselves.

**Folders were left completely alone** — the user's correction: the complaint was about loose files, not
about folder structure. No `archive/`, nothing moved into `refs/`, `excalidraw/` and `archived-skills/`
untouched.

Two files deleted (user-authorized, both recoverable from git): `shit-explanation.md` and
`2026-07-22-explanation-counter-example-c5.md` — specimens of bad explanations collected **before** the
`explain` skill existed, and spent now that it does.

**One file held back against the user's instruction to delete everything about explaining:**
`design-explain-rework.md`. It is not a specimen, it is the design record, and it already contains the
decision item 2 needs — which half of `explain` is always-on prose and which half only fires when something
gets rendered — plus the ASCII charset reasoning, including why Unicode's own width data cannot be used to
detect the banned glyphs. **Delete it once item 2 has landed**, not before.

Still open: the files' *contents* have not been cleaned. Several are stale, which is item 4b.

### 4b — Clean up what is inside those files

Not started. The user: *"many of the other files could be outdated as well."* Known stale already:
`remaining.md` carries pre-2026-08-08 content bullets under sections marked BUILT.

## 5. `global/CLAUDE.md` carries too much that does not belong

The user's principle: **stop explaining to the agent how to make decisions.** The file over-instructs.

Named specifically:

- **The ticket-pickup decision diagram must go.** *"It wasn't supposed to be there."* The user doubts it
  should even be referenced from the file.
- **`## Key docs` — remove a large chunk.**
- **`## Workflow` — compress heavily.** It lists every core skill and explains what each one does. But skills
  are already loaded, so their descriptions are already in context; the file is repeating them. **Naming them
  may be enough.** This gets worse as more core skills are added.

## 6. The handoff file is read once, then discarded

A correction aimed at the agent's behaviour. The agent has been **actively tracking and updating
`wip/context/handoff.md`** as though it were a living document. It is not.

The intended lifecycle: a fresh session **reads it once, absorbs it, and is then done with it.** No ongoing
tracking, no constant updating. The user expects to add **strong instructions to `commands/handoff.md`**
saying the file is cleaned up once absorbed — phrased as "probably going to", so it is not yet decided.

## 7. No commits for a long time

The user will **not commit until the refactor is fully finished.** Do not offer `gsave` at checkpoints, and
do not treat an uncommitted tree as a problem to solve.

## 8. Stale command symlinks point at the deleted workbench repo

Found 2026-08-09. `~/.local/bin/ptree`, `flow`, `fmerge` and `gsave` all resolve to
`/home/me/code/projects/agentic-setup/flow/global/scripts/…` — the workbench repo the root `CLAUDE.md` says
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

**Sources.** `wip/refs/agent-skills` (`interview-me`, `idea-refine`, the spec/plan/implement chain);
`wip/refs/mattpocock-skills` (`grilling`, `grill-me`, and the `question-limits` rationale);
`wip/research/making-ai-creative.md`, the commissioned report.

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

---

## Status

| # | Item | State |
|---|---|---|
| 1 | changelogs suspended | ✅ **done** — suspended, not deleted, in `skills/CLAUDE.md` |
| 2 | frequently-loaded skills into `CLAUDE.md`; archive `explain` | direction given, nothing designed. **Next.** |
| 3 | compress everything; research first | direction given; caveman researched, see 3a |
| 4 | move context files into one folder | ✅ **done** — `wip/context/`. Contents not yet cleaned (4b) |
| 5 | cut `global/CLAUDE.md` down | direction given, specific targets named |
| 6 | handoff is read-once | correction accepted; the `commands/handoff.md` edit is not approved |
| 7 | no commits until done | standing |
| 8 | stale `~/.local/bin` symlinks point at the deleted workbench repo | deferred by the user, 2026-08-09 |
| 9 | `brainstorm` reworked to generate options, not structure input | ✅ **done** — 180 → 223 lines. Depth half still owed to `execute` and the debug skill |
