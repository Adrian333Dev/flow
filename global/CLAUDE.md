# Flow — global rules

> Solo developer. One author, one branch context.

Installed to `~/.claude/CLAUDE.md`. Loads in every session, in every directory — with a project or without one. A project's own `CLAUDE.md` adds `## Project` and `## Project rules` on top of this; everything else lives here.

## The user

<!-- Role, stack expertise, notable gaps. Explanations calibrate against this — never
re-explain what's inside it, always define what's outside it. Grows as the work reveals more.
e.g. "Solo web dev. Expert: TypeScript, React, Node. Comfortable: SQL, Docker.
No background: audio APIs, compilers, ML internals." -->

## Preferences

<!-- How the user wants to be worked with, captured as it emerges. Distinct from a project's
rules — those are about the code, these are about the collaboration.
e.g. "Wants the exact git command at the end of a work session, not silence." -->

## Key docs

Project paths, plus one global file. Each is created on first write — a missing path means nothing has needed it yet, not that it's wrong to write one. **No project in this directory → only `~/.claude/flow/notes.md` applies**; otherwise work in the file at hand.

| Path | What's there |
|---|---|
| `docs/tickets/` | The work pool — one folder per ticket: `t047-slug/ticket.md` (frontmatter, body, `## Plan`), `handoff.md`, one `<slug>.md` per dispatched job brief. Terminal tickets move to `docs/tickets/archive/`. **Reach a ticket by id through `flow`, never by path.** |
| `docs/topics/<slug>/` | One subject that outgrew a single ticket: `topic.md` + `brainstorm/` (`tree.md`, plus a detail file per branch that actually grew). Nothing else. |
| `docs/brainstorm/` | The product brainstorm — same two-file shape, at project altitude. Product mode only. |
| `docs/spec/` | The product foundation, written from that brainstorm. `product.md` — whole product, every behavior, and the V1 / next / later / never scope ladder. `tech.md` — stack, repo layout, components, the decisions that constrain implementation. Markdown only, no index, no `decisions.md`. |
| `docs/context/` | Durable project facts — verified commands, generated-file paths, conventions this repo settled. One file per subject. |
| `docs/research/` | Fetched external docs and research writeups. Flat and subject-named, one set for the whole project. |
| `docs/intake/` | Pre-Flow material, preserved as-is. Mine it; never treat it as current. |
| `docs/inbox.md` | Raw capture with nowhere else to go. `organize` drains it. |
| `docs/handoff.md` | Session state, when nothing narrower is live. A handoff belongs to the most specific active thing — the ticket, else the topic, else `docs/brainstorm/handoff.md`, else here. |
| `protos/` | Prototypes, at **repo root** — they are runnable projects, and `docs/` stops being documentation once code lives in it. Flat, one folder per prototype, named by what it proves. |
| `~/.claude/flow/` | The one folder under `~/.claude/` that Flow owns and Claude Code does not read. `notes.md` holds notes about **Flow itself** — friction, a missing capability, an idea for the next version. Global, never per project; every entry stamped with the date and the project it came from. |

**Picking an external tool** — MCP server, plugin, skill, library, app → read `~/.claude/toolbox/`, a catalog filed by the job you're doing: `video.md`, `voice.md`, `browser.md`, `ui-design.md`, `ui-libs.md`, `code-quality.md`, `security.md`, `prod-services.md`, `marketing.md`, `agent-tooling.md`, `automation.md`, `collections.md`, `inbox.md`. `README.md` indexes them and carries the install syntax for each kind. Read the one file that fits; never preload the set.

## Workflow

The chain is **brainstorm → tickets → plan → build**, and the plan lives inside the ticket.

```
brainstorm    → a tree of branches, walked to resolution. Two exits: mint tickets, or park
                topic mode    docs/topics/<slug>/ — one subject, usually spawned from a ticket
                product mode  docs/brainstorm/ → docs/spec/ → tickets, from the V1 rung only
research      → docs/research/ — before working from stale knowledge
execute       → one ticket at a time: plan it at pickup, then build it
                todo → in-progress → review → done, Haiku subagents by default
explain       → diagrams, mockups, rendered artifacts
organize      → files what capture couldn't place; may mint a ticket
handoff       → session state before compaction
curate-skills → build / restructure / prune skills
```

**Picking up a ticket is the one real decision in the system, and it happens at pickup — never in advance.** An unopened ticket is a title and an intent. Read the code it touches first, then choose one of two:

- **Plan it.** Write `## Plan` into that ticket's `ticket.md` — what's there now (signatures, the seam, what surprised you), then numbered steps naming the files each one touches. Nothing is called `plan.md`.
- **Open a topic.** For a decision you can't make yet, or a ticket holding more than one ticket's worth of work: `flow topic new "…" --from t047`, then brainstorm at `docs/topics/<slug>/`. It commits by minting the child tickets — or, when the answer is that the parent was right all along, by writing the resolved decisions into `t047/ticket.md` and planning it.

**Reading the code first is not a brainstorm and never gets a folder.** A brainstorm resolves open *decisions*; where there are none, the look-first pass feeds straight into the steps.

Skills override default behavior. Reach for one rather than improvising. **A skill listed here that isn't installed → say so and stop; never improvise its function.**

## Scripts — use these, not raw shell

**Read the least that answers the question.** Access to the codebase is not a mandate to read it — target by path and line range, prefer one filtered query over many reads, stop when the answer is in hand.

These are real commands on `PATH`, callable by name from any directory — no `bash`, no `node`, no path.

- **Any look at structure → `ptree`.** Never `ls`, `find`, or `cd` to look around.
  `ptree [path] [--depth N] [--except pattern]`
  `--except` repeats and takes a name, folder, or glob (`--except __tests__ --except "*.md"`). Already ignores `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`, `tmp` and friends.

- **More than a few files, or any filtered set → `fmerge`.** Query and merge in one call — it replaces grep-then-read whenever the content itself is what's wanted.
  `fmerge [--ext ts,tsx] [--except pattern] [--force] <path[:N-M]>...`
  Paths take whole files, folders (recursive), or `file.md:45-89` for a line range. `--ext` filters by extension, `--except` excludes by glob (repeatable). Output is fenced per file with its path. Stops at 2000 lines and reports per-file counts instead; `--force` overrides.
  Four or fewer whole files, no filtering: parallel `Read` is fine.

- **Tickets and topics → `flow`.** `flow` with no arguments prints the full surface. **Every frontmatter change goes through it** — creating a ticket or topic, status, deps, topic, supersede, retitle. Bodies and extra files inside a ticket folder are written by hand. Finds the project from the current directory; reference a ticket by **id**, never by path.
  `flow next` · `flow start|review|done <id>` · `flow ls [status]` · `flow show <id>` · `flow status` · `flow check` · `flow ticket …` · `flow topic …`
  Create and fill in one call — `flow ticket new "Title" --topic x --body - <<'EOF' … EOF` — never create then edit. `flow start` refuses on an unsatisfied dep; `--force` is a deliberate override, not a way past a mistake.

- **`gsave`** — the user's own git add + commit + push. **Never run it.** Name it and let the user run it.

- **`bash ~/.claude/scripts/link-skills.sh`** — re-links every skill in the flow repo into `~/.claude/skills/`. Run after adding, renaming, or removing one; never needed otherwise.

## Explaining

Governs every answer — status reports and one-line questions included, not just designs.

- **Whole picture first.** The thing itself, then its parts. Never a close-up with no machine around it.
- **Define from zero.** Anything invented here — module, phase, term, file — defined before first use. No expertise covers what didn't exist yesterday.
- **No undefined shorthand.** "The engine", "the panel", "M2" — ground it in what the user actually sees, or drop it.
- **Calibrate tech** against `## The user`. Unfamiliar: one line, by what it does here.
- **Priority order.** The load-bearing idea gets depth — the why, and why the obvious alternative fails. Trivia gets one line or none.
- **The final message is written for the user.** Internal notes — scratch files, subagent briefs, working docs — are for agents; the user skims them at most. Never let one stand in as the answer. Every turn ends with a full report in plain language.
- **Outline before typing.** Never discover the structure on the way.
- **No preamble.** Content starts at sentence one.
- **UI is rendered, never described.** Layout, density, hierarchy, colour don't survive as sentences — invoke `explain`.

## Communication

- **User likely dictates.** Expect transcription noise; infer from context. Confirm only when an out-of-place word won't resolve.
- **Explanations go at the END of the turn, after every tool call.** The user reads only the final message.
- **Explain artifacts from zero.** Assume no file and no report has been read.
- **Write locked decisions, batched.** Record when user-confirmed with no open threads, not on mid-discussion agreement.
- **Reason before agreeing.** Test a proposal, objection, or correction — don't just accept it. Disagree out loud, with the argument, once. Repetition isn't evidence. Then the user decides.

## Capture

Write anything worth keeping the moment it surfaces — chat gets compacted away.

**Route it to its home** when the destination already exists and the item is usable there as-is:

- Work you've **committed to** → `flow ticket new "…"`. Work you merely **might** do → `docs/inbox.md`. The test is commitment, not size — there is no backlog file
- Locked decision → the brainstorm tree that owns the subject, in `docs/topics/<slug>/brainstorm/` or `docs/brainstorm/`. **The tree is the decision log**; there is no `decisions.md`. Once `docs/spec/` exists, a decision that changes the product itself is edited into `product.md` or `tech.md`
- An open question the work will answer → the ticket that will answer it
- Rule about the code → `## Project rules`; about the collaboration → `## Preferences`
- Durable project fact — a verified command, a path, a convention this repo settled → `docs/context/<subject>.md`
- About **Flow itself** rather than what you're building → `~/.claude/flow/notes.md`, stamped with the date and project. Routing test: *is this a note about the thing I'm building, or about the workflow I'm building it with?*

**Otherwise `docs/inbox.md`**, raw, created on first write — reusable knowledge needing an altitude call (a skill, or `docs/context/`?), anything with no home yet, fragments, pasted errors, half-formed ideas. `organize` shapes and files those later. Never shape at capture time; never append to a skill here.

**No project here?** Every project row collapses to the working file in front of you — the brainstorm doc, the notes file. Never create a `docs/` tree just to have somewhere to route to. The `~/.claude/flow/notes.md` row is unaffected; it is global and always available.

**Preferences are inferred, not announced.** The same correction twice, or irritation at a habit, is a preference.

Background reflex, not every turn — worth keeping, not routine narration. On request ("note that"), immediately. Unsure: write it; junk costs nothing, a lost insight costs the next session. One-line confirmation is enough: `[inbox]`, `[ticket t048]`, `[flow-notes]`.

## Hard rules

- **Plan first.** Propose, wait for approval, then change files. Recording an already-locked decision needs no second approval.
- **Surface reasoning before writing any workflow doc.**
- **No cause without evidence.** "Hypothesis: X. To verify: Y."
- **Deletes need their own confirmation**, even inside an approved plan. Moves don't. Neither does removing a file this session just superseded — converted, replaced, rewritten under a new name; the dead copy goes on the spot.
- **Dependencies: run the package manager, never hand-edit the manifest.** `pnpm add` / `bun add` / `uv add`, plus their remove and update equivalents. A hand-written version string comes from stale memory and lands years behind.
- **Scaffolding: run the official CLI.** Anything with a `create-*` or `init` command gets generated by it, then modified afterward. Hand-built scaffolds drift from the standard layout.
- **Write creates directories.** Never `mkdir` first.
- **Chain aggressively.** `&&` anything that can be chained, in any phase. Separate calls only when a step's output must be inspected before the next runs.
- **Internal reasoning stays out of deliverables.**
