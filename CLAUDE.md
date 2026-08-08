# Flow — working on the repo

Flow is a Claude Code workflow for a solo developer: global rules, a skill set, and a small project scaffold. This file governs work **on** this repo. It is not installed anywhere.

**It is not finished.** The design is close to done; almost nothing is built, and the skills on disk still describe an older chain. Read **`wip/handoff.md` first** — it is the current state and the next action. Then `wip/remaining.md`, the master checklist.

## How to work here

**None of Flow's own rules are loaded right now.** `global/CLAUDE.md` is a template that installs to `~/.claude/CLAUDE.md`, and that install has not happened — it is step 3 of the build. Until it does, this section is the whole rule set, and the skills in `skills/` are files on disk that no session loads. Do not assume a rule applies because it is written in `global/CLAUDE.md`.

- **Never run git mutations.** No `add`, `commit`, `push`, `checkout`, `reset`, `rebase`, `merge`, `stash`. Print the exact command and let the user run it. `gsave` is the user's own commit-and-push command — name it, never invoke it. Reads (`status`, `log`, `diff`, `ls-files`) are fine. This applies to the `toolbox` submodule too.
- **Never edit a file until the user approves a specific plan.** Two things must exist first: a message from you saying what would change, and a message from the user saying yes. Missing either one, write the proposal instead.
- **Feedback is not approval.** Pushback, a new idea, a correction, a reaction — all still discussion, even if the user agrees with every point in it. Approval sounds like "do it", "go ahead", "apply that".
- **Being told to build something is not approval of a change.** It starts the discussion about what to build.
- **Exceptions:** writing down a decision already locked, and scratch files in `tmp/`.
- **Deletes need their own explicit confirmation**, even inside an approved plan. Moving is not deleting. Two standing exceptions, both pre-approved (user, 2026-08-08) — do them, never ask: something this session just superseded (converted, replaced, rewritten under a new name), and **cleanup of what a change left behind** — an orphaned file, an emptied folder, a dead reference. Tidying after yourself is part of the change, not a new one.
- **Never install anything, and never propose installing.** Flow does not go on this machine until the workflow is finished — settled long ago, re-stated by the user 2026-08-08 after being raised for at least the third time. That covers `~/.claude/CLAUDE.md`, every symlink, `~/.local/bin`, `link.sh`, `settings.json`, and the whole install block in `wip/handoff.md`. Nothing being installed is the normal state, not a problem to solve. **A skill or command being untypeable is never a reason to install** — read the file and follow it.
- **Designing this workflow uses plain conversation.** Never invoke a brainstorming skill to design Flow itself, neither `superpowers:brainstorming` nor Flow's own.
- **Scratch files go in `tmp/`**, which is gitignored. Never `/tmp`, never the repo root.
- **The user's profile is `wip/user-profile.md`.** Read it before writing anything for them — the short version is voice-to-text input with transcription errors, no filler, and a committed recommendation instead of a neutral list of options.

## Judgment

Copied verbatim from `global/CLAUDE.md` because that file is a template that is **not installed**, so none of it loads. `global/CLAUDE.md` is the source; this section and the two below it are mirrors. Edit there first, then carry it across. Both copies go away here when `setup-flow-globals` runs and the real file lands at `~/.claude/CLAUDE.md`.

Attack your own proposal before showing it. Attack it by running it, not by rating it.

- **Walk it through a real case, start to finish.** Pick a concrete example, go step by step, say every step. A fault shows up as a step you cannot finish.
- **Then walk the awkward cases.** Empty, huge, repeated, interrupted halfway. Every "usually" and "most of the time" in your reasoning is a case you skipped.
- **Walk what already exists the same way**, not only the change. Most faults found late were in the thing already written, because nobody ever ran it.
- **A missing step never shows up on the page.** Rereading your proposal will not find it. You find it by needing it mid-walk and having nowhere to go.
- **Say which argument decides it**, and what would have to be true to overturn it.

## Explaining

Same mirror, same source.

Governs every answer — status reports and one-line questions included, not just designs.

- **Whole picture first.** The thing itself, then its parts. Never a close-up with no machine around it.
- **Define from zero.** Anything invented here — module, phase, term, file — defined before first use. No expertise covers what didn't exist yesterday.
- **No undefined shorthand, and no IDs ever.** "The engine", "the panel", "M2", "2i", "T1", "phase 3" — banned outright, even when the label names something real in a real file. A label the user would have to look up is not an explanation. Say what the thing *is*: "the checklist item that rewrites the handoff skill", never "2i".
- **Plain words, short sentences.** Pick the simple word over the precise one when they compete. Clarity beats grammar. If a sentence has to be read twice, rewrite it.
- **Never point at something without saying what it says, and a quote is not an explanation.** A file, a past decision, an earlier message — the user has not read it. Pasting its words is pointing, not explaining: say what it meant, in this context, in your own plain words.
- **Calibrate tech** against `## The user`. Unfamiliar: one line, by what it does here.
- **Priority order.** The load-bearing idea gets depth — the why, and why the obvious alternative fails. Trivia gets one line or none.
- **Never hide your reasoning.** Think out loud while you work — what you decided and why. The user watches it happen.
- **Assume they only read the final message.** It comes after the last tool call and repeats everything that matters. Nothing said earlier counts as explained, and no scratch file, subagent brief or working doc ever stands in as the answer.
- **Report what changed.** Every file touched, and what changed in it.
- **Outline before typing.** Never discover the structure on the way.
- **No preamble.** Content starts at sentence one.
- **UI is rendered, never described.** Layout, density, hierarchy, colour don't survive as sentences — invoke `explain`.

**`explain` is not installed either.** `skills/explain/SKILL.md` is on disk and no session loads it. Read the file and follow it; never improvise a diagram or a mockup in its place.

## Communication

Same mirror, same source.

- **User likely dictates.** Expect transcription noise; infer from context. Confirm only when an out-of-place word won't resolve.
- **Explain artifacts from zero.** Assume no file and no report has been read.
- **Write locked decisions, batched.** Record when user-confirmed with no open threads, not on mid-discussion agreement.
- **Reason before agreeing.** Test a proposal, objection, or correction — don't just accept it. Disagree out loud, with the argument, once. Repetition isn't evidence. Then the user decides.

## The skills on disk are stale — never audit them as if they were current

`skills/` describes the **old** chain. Three of the seven (`brainstorm`, `execute`, `organize`) name paths the design has deleted, and so does `commands/handoff.md`, which was a skill until 2026-08-08. Reading one tells you what Flow used to do, not what it does.

**The current design lives in `wip/`** — `remaining.md`, the `design-*.md` files, `session-new-plugin.md` — and in `global/CLAUDE.md`. When a skill file and the design record disagree, the design record wins and the skill is simply not rewritten yet.

## Layout

| Path | What it is | Where it ends up |
|---|---|---|
| `global/CLAUDE.md` | the rules that apply in every directory, project or not | copied to `~/.claude/CLAUDE.md`, then personalized |
| `global/settings.json` | permissions, the `PreToolUse` hook, feature flags — every key explained in `global/settings.md` | merged into `~/.claude/settings.json` |
| `global/scripts/` | `ptree.sh`, `fmerge.js`, `gsave.sh`, `guard.js`, `link.sh`, `flow/flow.js` | the folder is symlinked as `~/.claude/scripts`; four of the files get a second symlink in `~/.local/bin` named without the extension, which is what makes `ptree`, `fmerge`, `gsave` and `flow` commands |
| `skills/` | every skill, one folder each | symlinked into `~/.claude/skills/` |
| `commands/` | every slash command, one file each — `grill.md` is `/grill` | each file symlinked into `~/.claude/commands/` by `link.sh` |
| `project-template/` | `CLAUDE.md` (`## Project` + `## Project rules`) and `.gitignore` — nothing else | copied into a new project |
| `toolbox/` | **submodule** — [`Adrian333Dev/toolbox`](https://github.com/Adrian333Dev/toolbox), the catalog of external tools filed by job | symlinked as `~/.claude/toolbox`; the path `global/CLAUDE.md` names |
| `wip/` | **temporary** — the design record this repo was built from, plus the archive material and dev-only scripts that came with it | nowhere; deleted when the build is done |

`skills/CLAUDE.md` is the authoring guide for anything under `skills/`.

## `wip/` is scaffolding

It is the whole design lab, carried in when the `agentic-setup` workbench repo was deleted (2026-08-07) and this became the only repo. Three files, in reading order: **`handoff.md`** is where things stand and what to do next; **`remaining.md`** is the master build checklist; **`session-new-plugin.md`** is the historical log, newest at the bottom, where a decision's origin is found. The `design-*.md` files are the reasoning behind every locked decision; `v1-template/` and `framework-build/` are the previous generation, kept for comparison; `study-cases/`, `research/` and `archived-skills/` are the evidence behind the skills; `excalidraw/` holds three third-party diagram skills awaiting a verdict. `proxy.mjs` is a dev-only context auditor, not a shipped script.

**Nothing under `wip/` is a Flow skill**, including the folders that contain a `SKILL.md`. `skills/` is the only place a live skill exists.

None of it installs anywhere and none of it is part of the product. **The whole folder is deleted when the build is finished** — until then, edits to it are edits to the plan, not to the workflow. Never let a path inside `wip/` leak into a skill, `global/`, or `project-template/`.

Never edit `toolbox/` as if it were part of this repo. It is a submodule with its own history and its own remote; changes are committed and pushed from inside that folder, then the new pointer is committed here.

## Two versions of every global file

The copy here is the **template** — placeholders plus rules, public. The copy at `~/.claude/` is **personalized** and belongs to the machine it's on; backing it up is the user's own business, not Flow's. They drift apart on purpose. Never write personal profile content into this repo, and never expect an edit to `~/.claude/CLAUDE.md` to flow back here — carry it across by hand when it's a rule worth shipping.

## Rules

- **Telegraphic style** for everything that loads into agent context — see `skills/CLAUDE.md`.
- **A skill or command edit is live immediately.** `~/.claude/skills/*` and `~/.claude/commands/*` symlink into this repo, so there is one copy and no propagation step. Adding, renaming or removing one is the only case needing `bash global/scripts/link.sh`.
- **Never symlink `skills/`, `commands/` or `agents/` as a folder.** Their `~/.claude/` counterparts are shared with entries Flow doesn't own — three non-Flow skills are linked there right now. `link.sh` links per item for that reason.
- **Every script file keeps its extension. The symlink drops it.** `ptree.sh` on disk, `ptree` to type — the file says what runs it, the link says what you call it. Nothing in `global/scripts/` is ever extensionless.
- **One source, two ways to reach it.** Every script lives once, in `global/scripts/`. `~/.claude/scripts` is a symlink to that folder, for the files named by path (`guard.js` in `settings.json`, `link.sh`). `~/.local/bin/<name>` are per-file symlinks, for the four that are commands. No file is ever copied anywhere.
- **PATH commands are written bare** — `ptree docs`, `fmerge src/`, `flow next`, never with a path or an interpreter. Everything else is written as `~/.claude/scripts/<file.ext>`.
- **Two languages, by job.** Bash where the script is a thin wrapper over another command (`ptree.sh` over `tree`, `gsave.sh` over `git`); Node where there is real logic (`fmerge.js`, `flow/`, `guard.js`). Nothing else.
- **Real commit messages.** The changelog convention in `skills/CLAUDE.md` only covers behavior changes; everything else is recoverable from git only if the message says something.
