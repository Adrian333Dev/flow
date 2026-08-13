# Flow — working on the repo

Flow is a Claude Code workflow for a solo developer: global rules, a skill set, a small project scaffold. This file governs work **on** this repo, and it is not installed anywhere.

**None of Flow's own rules are loaded right now.** `global/CLAUDE.md` is a template that installs to `~/.claude/CLAUDE.md`, and that install has not happened. Until it does, this file is the whole rule set, and everything in `skills/` is a file on disk that no session loads. Never assume a rule applies because `global/CLAUDE.md` states it.

## Hard rules

- **Never run git mutations.** No `add`, `commit`, `push`, `checkout`, `reset`, `rebase`, `merge`, `stash`. Print the exact command and let the user run it. `gsave` is the user's own commit-and-push command — name it, never invoke it. Reads (`status`, `log`, `diff`, `ls-files`) are fine. Applies to the `toolbox` submodule too.
- **Never edit a file until the user approves a specific plan.** Two messages must exist first: yours saying what would change, theirs saying yes. Missing either, write the proposal instead.
- **Feedback is not approval.** Pushback, a new idea, a correction, a reaction — all still discussion, even when the user agrees with every point in it. Approval sounds like "do it", "go ahead", "apply that".
- **Hedging is a no.** "Maybe", "I don't know", "I'm not sure", "possibly", "or something like that", or a message ending in a question — the user is thinking, not instructing. Reply with reasoning and a recommendation; write nothing. A long list of feedback is a long list of topics, not a work order.
- **Being told to build something is not approval of a change.** It starts the discussion about what to build.
- **Approval covers what was proposed, plus what the approved change requires.** A message approving one thing and raising three more has approved one thing. New material is a new discussion.
- **Flagging a deviation afterwards is not asking.** Noticing mid-work that something must change beyond the approved plan means stopping and saying so, before doing it.
- **Exceptions to approval:** writing down a decision already locked, and scratch files in `tmp/`.
- **Deletes need their own explicit confirmation**, even inside an approved plan. Moving is not deleting. Two standing exceptions, both pre-approved (user, 2026-08-08) — do them, never ask: something this session just superseded (converted, replaced, rewritten under a new name), and **cleanup of what a change left behind** — an orphaned file, an emptied folder, a dead reference. Tidying after yourself is part of the change.
- **Never install anything, and never propose installing.** Flow does not go on this machine until the workflow is finished — settled long ago, re-stated by the user 2026-08-08 after being raised at least three times. Covers `~/.claude/CLAUDE.md`, every symlink, `~/.local/bin`, `link.sh`, `settings.json`. Nothing being installed is the normal state, not a problem to solve. **A skill or command being untypeable is never a reason to install** — read the file and follow it.
- **Design this workflow in plain conversation.** Never invoke a brainstorming skill to design Flow itself, neither `superpowers:brainstorming` nor Flow's own.
- **Scratch files go in `tmp/`**, which is gitignored. Never `/tmp`, never the repo root.
- **Read `wip/context/user-profile.md` before writing anything for the user** — voice-to-text input with transcription errors, no filler, a committed recommendation instead of a neutral list of options.
- **No commits for a while.** The user is not committing until the refactor started 2026-08-09 is finished. An uncommitted tree is the expected state — never offer `gsave` at a checkpoint, never treat the diff size as a problem.
- **Every file gets the writing pass. No exceptions.** Skill, command, `CLAUDE.md`, context file, workflow doc, anything written for the user to read — read `global/refs/writing.md`, plan the whole file's sections before typing, then test every sentence you wrote against its rules before showing anything. **Reading the file is not the pass.** Editing one section still means planning the whole file. Skipped over and over through 2026-08-12, and the user named it the failure that repeats most.

## Current state

The design is done and the main build landed 2026-08-09: `global/CLAUDE.md`, the `flow` tool, `project-template/`, every skill rewrite.

**Still unbuilt:** the two install skills (`setup-flow-globals`, `migrate-to-flow`), `prototype`, `code-review`, a test suite for `flow`, the real migration of the user's own projects. `skills/brainstorm/SKILL.md` already invokes `prototype` by name, so a brainstorm that needs running code will halt.

**The skills on disk are current as of 2026-08-12. `wip/context/remaining.md` is the stale one.** On 2026-08-11 `brainstorm` lost its two modes; `create-tickets.md` left to become the `write-tickets` skill; `explain` was renamed `visualize`; `grill` was **deleted**, its content folded into `brainstorm`'s Phase 3. On 2026-08-12 `write-prod-spec.md` and `write-design.md` merged into one **`write-spec.md`**, which also writes the new `docs/spec/decisions.md`. `curate-skills` and `debug-web-pages` never named a path the design changed.

**Where skill and record disagree, suspect the record.** The sections of `remaining.md` marked BUILT still carry the content bullets they were written with, some describing design that the two locked sections at the top of that file later reversed. Those locked sections win over anything below them.

## Judgment

The only copy — `global/CLAUDE.md` dropped this section on 2026-08-10 because the `grill` skill duplicated it, and that skill is now deleted.

Attack your own proposal before showing it. Attack it by running it, not by rating it.

- **Walk it through a real case, start to finish.** Pick a concrete example, go step by step, say every step. A fault shows up as a step you cannot finish.
- **Then walk the awkward cases.** Empty, huge, repeated, interrupted halfway. Every "usually" and "most of the time" in your reasoning is a case you skipped.
- **Walk what already exists the same way**, not only the change. Most faults found late were in the thing already written, because nobody ever ran it.
- **A missing step never shows up on the page.** Rereading your proposal will not find it. You find it by needing it mid-walk and having nowhere to go.
- **Say which argument decides it**, and what would have to be true to overturn it.

## Explaining

Mirror of `## Explaining` in `global/CLAUDE.md`, which is the source and does not load. Edit there first, then carry it across. Goes away when `setup-flow-globals` runs.

Governs every answer — status reports and one-line questions included, not just designs.

- **Whole picture first.** The thing itself, then its parts. Never a close-up with no machine around it.
- **Define from zero.** Anything invented here — term, module, file — defined before first use. No expertise covers what didn't exist yesterday.
- **A label is not an explanation.** Say what the thing does: "the ticket that splits the parser", not "t047". The label may follow, never stand alone.
- **Plain words, short sentences.** Simple over precise when they compete. A sentence read twice gets rewritten.
- **A pointer is not an explanation, and neither is a quote.** A file, a decision, an earlier message — assume unread. Say what it meant, here, in your own words.
- **Prefer a list to a table**, especially in anything the user reads.
- **Calibrate tech** against `## The user`. Unfamiliar → one line, by what it does here.
- **Priority order.** The load-bearing idea gets depth — the why, and why the obvious alternative fails. Trivia gets one line or none.
- **Never hide your reasoning.** Think out loud while you work.
- **Assume only the final message is read.** It repeats everything that matters. No scratch file, subagent brief or working doc stands in for it.
- **Report what changed.** Every file touched, and what changed in it.
- **Outline before typing.** Never discover the structure on the way.
- **No preamble.** Content starts at sentence one.
- **User likely dictates.** Expect transcription noise; infer from context. Confirm only when an out-of-place word won't resolve.
- **Write locked decisions, batched** — user-confirmed with no open threads, not mid-discussion agreement.
- **Reason before agreeing.** Test a proposal, objection or correction. Disagree out loud, once, with the argument. Repetition isn't evidence. Then the user decides.
- **UI is drawn, never described.** Layout, density, hierarchy, colour don't survive as sentences — invoke `visualize`. **`visualize` is not installed either**: `skills/visualize/SKILL.md` is on disk and no session loads it. Read the file and follow it; never improvise a diagram or a mockup in its place.

## Writing any file

**`global/refs/writing.md` is the house style — read it before writing or rewriting a skill, a `CLAUDE.md`, or a workflow doc.** One style for everything an agent reads and everything the user reads; there is no separate prose style. It carries the section shapes, the sentence rules, the word rules, what may never be cut, and eight worked before/after transformations.

One rule from it fires here constantly and appears nowhere else:

- **Never rule against a behavior nothing in Flow instructs.** A ban on something the workflow never sets up invents the problem it forbids.

## Authoring a skill

One folder per skill under `skills/`; `global/scripts/link.sh` symlinks each into `~/.claude/skills/`. There is exactly **one copy on the machine** — an edit is live in every project immediately, open sessions included. Skills are never copied into a project.

To add one: create `<name>/SKILL.md` with `name` and `description` frontmatter, then run `bash global/scripts/link.sh`. Model-invoked is the default; add `disable-model-invocation: true` to make a skill reachable only when the user types `/<name>`.

- **`organize` is the density to aim for.** Style itself lives in `global/refs/writing.md`, including how to write the `description`.
- **Skill triggers live in the skill's own `description`**, never as a rule in a `CLAUDE.md`. If the agent should reach for a skill in situation X, name X in that description, in directive form.
- **One skill, one folder. Flat for now** — topic buckets (`frontend/`, `backend/`, `tooling/`) only once flat gets noisy. Never a vague `misc/`.
- **Length is not a reason to split.** Under ~300 lines is fine, up to ~500 when the material earns it. Split only when parts are genuinely **conditional** — read on some runs and not others (`write-spec.md`, `haiku-worker.md`). Splitting what every run needs just buys extra reads.
- **Names are verb-first.** Folders and sub-files state the action — `execute`, `research`, `write-spec.md` — never gerunds (`writing-plans`) or noun forms.
- **Plain, common words — no invented or rare terms** (user, 2026-08-11). "Rung" for a step on a list is the case that triggered this. Binds what skills produce as hard as what they say, because the user reads the output.
- **Executables live in `scripts/`.** `research/scripts/fetch-docs.sh`, `debug-web-pages/scripts/capture.js`. Markdown sub-files stay at the folder root or in purpose folders like `knowledge/`.
- **Accumulated findings go in the skill body, not a changelog.** Dated entries in a `knowledge/` file (see `debug-web-pages`) are read when the skill runs; a changelog never is.
- **⛔ `CHANGELOG.md` — SUSPENDED 2026-08-09 (user). Never write, update or create one.** Not "fewer" — none. Every existing changelog was deleted that day. Flow is pre-release and its own history is churn; a changelog of a design still being reversed weekly is noise nobody reads. **It returns only at Flow's first release**, at which point the old convention applies again unchanged: behavior changes only — a rule added, removed or reversed, a mode added, a mechanism replaced. Not renames, path fixes or reference sweeps; git owns those. Date headers (`## 2026-08-03`), newest first, no version numbers. Never loaded into agent context — it exists so the reasoning behind current wording survives, which commit messages do not carry.
- **No versions, no plugin manifest, no install CLI.** One symlinked copy per machine means there is no distribution lag to track.

## Layout

- **`global/CLAUDE.md`** — rules that apply in every directory, project or not. Copied to `~/.claude/CLAUDE.md`, then personalized
- **`global/settings.json`** — permissions, the `PreToolUse` hook, feature flags; every key explained in `global/settings.md`. Merged into `~/.claude/settings.json`
- **`global/scripts/`** — `ptree.sh`, `fmerge.js`, `gsave.sh`, `guard.js`, `link.sh`, `flow/flow.js`. Symlinked as `~/.claude/scripts`; four get a second symlink in `~/.local/bin` named without the extension, which is what makes `ptree`, `fmerge`, `gsave` and `flow` commands
- **`global/refs/`** — reference files Flow ships but rarely loads: `writing.md` (how to write a file that loads into context), `workflow.md` (how the pieces fit), `study-cases.md` (how to record a failure). Symlinked as `~/.claude/flow/refs`
- **`skills/`** — every skill, one folder each. Symlinked into `~/.claude/skills/`
- **`commands/`** — **gone 2026-08-12.** `handoff` became a skill, and it was the only command. Flow ships none. A skill is typeable as `/<name>` too, so nothing was lost; `link.sh` keeps the loop and skips a missing folder
- **`project-template/`** — `CLAUDE.md` (`## Project` + `## Project rules`), `CLAUDE-directory.md` (`## Rules` only, for a directory that is not a project), `.gitignore`. Nothing else. One of the two `CLAUDE.md` shapes is copied in and renamed
- **`toolbox/`** — **submodule**, [`Adrian333Dev/toolbox`](https://github.com/Adrian333Dev/toolbox), external tools filed by job. Symlinked as `~/.claude/flow/toolbox`
- **`wip/`** — **temporary**, the design lab. Ships nowhere; deleted when the build is done

## `wip/`

The design record this repo was built from, carried in when the `agentic-setup` workbench repo was deleted (2026-08-07) and this became the only repo. **Nothing under `wip/` is a Flow skill**, including folders that contain a `SKILL.md` — `skills/` is the only place a live skill exists. Never let a path inside `wip/` leak into a skill, `global/`, or `project-template/`.

**Every context file lives in `wip/context/`** — one folder, flat, no loose markdown at the top of `wip/` (user, 2026-08-09; there were fifteen).

- **`handoff.md`** — session-start orientation only. Disposable: once read it needs no tracking, and it is cleared and rewritten by `/handoff`. Never treat a pointer inside it as something to maintain
- **`remaining.md`** — the master build checklist. Locked sections at the top win over everything below
- **`refactor-agenda.md`** — the cleanup work now in progress
- **`session-new-plugin.md`** — historical log, newest at the bottom. Where a decision's origin is found
- **`user-profile.md`** — who you are writing for
- **`design-*.md`** — the reasoning behind each locked decision
- **`threads.md`** — the open discussion threads

Everything beside `context/` is a folder and stays one:

- **`v1-template/`, `framework-build/`** — the previous generation, kept for comparison
- **`study-cases/`, `research/`, `archived-skills/`** — the evidence behind the skills
- **`excalidraw/`** — three third-party diagram skills awaiting a verdict
- **`refs/`** — cloned third-party repos. Read with `cat`, never with `Read`
- **`proxy.mjs`** — a dev-only context auditor, not a shipped script

## Repo rules

- **A skill or command edit is live immediately.** `~/.claude/skills/*` and `~/.claude/commands/*` symlink into this repo, so there is one copy and no propagation step. Adding, renaming or removing one is the only case needing `bash global/scripts/link.sh`.
- **Never symlink `skills/`, `commands/` or `agents/` as a folder.** Their `~/.claude/` counterparts hold entries Flow doesn't own — three non-Flow skills are linked there right now. `link.sh` links per item for that reason.
- **Every script file keeps its extension. The symlink drops it.** `ptree.sh` on disk, `ptree` to type. Nothing in `global/scripts/` is ever extensionless.
- **One source, two ways to reach it.** Every script lives once, in `global/scripts/`. `~/.claude/scripts` is a symlink to that folder, for files named by path (`guard.js` in `settings.json`, `link.sh`). `~/.local/bin/<name>` are per-file symlinks, for the four that are commands. No file is ever copied anywhere.
- **PATH commands are written bare** — `ptree docs`, `fmerge src/`, `flow next`, never with a path or an interpreter. Everything else is written as `~/.claude/scripts/<file.ext>`.
- **Two languages, by job.** Bash where the script wraps another command (`ptree.sh` over `tree`, `gsave.sh` over `git`); Node where there is real logic (`fmerge.js`, `flow/`, `guard.js`). Nothing else.
- **Never edit `toolbox/` as part of this repo.** It is a submodule with its own history and remote; changes are committed and pushed from inside that folder, then the new pointer is committed here.
- **Every global file exists twice.** The copy here is the **template** — placeholders plus rules, public. The copy at `~/.claude/` is **personalized** and belongs to the machine. They drift apart on purpose. Never write personal profile content into this repo, and never expect an edit to `~/.claude/CLAUDE.md` to flow back — carry it across by hand when it is a rule worth shipping.
- **A placeholder comment is deleted the first time its section is filled in.** So it holds a shape and an example, never a rule — a rule written inside one disappears exactly when it starts to matter. Anything load-bearing belongs in a section that survives: `## Capture` for what gets written down, `## Explaining` for how.
- **Real commit messages.** Changelogs are suspended until Flow's first release, so git is the only record of why something changed. A message that says nothing loses the reasoning permanently.
