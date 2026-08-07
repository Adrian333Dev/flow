# Flow — working on the repo

Flow is a Claude Code workflow for a solo developer: global rules, a skill set, and a small project scaffold. This file governs work **on** this repo. It is not installed anywhere.

**It is not finished.** The design is close to done; almost nothing is built, and the skills on disk still describe an older chain. Read **`wip/handoff.md` first** — it is the current state and the next action. Then `wip/remaining.md`, the master checklist.

## How to work here

**None of Flow's own rules are loaded right now.** `global/CLAUDE.md` is a template that installs to `~/.claude/CLAUDE.md`, and that install has not happened — it is step 3 of the build. Until it does, this section is the whole rule set, and the skills in `skills/` are files on disk that no session loads. Do not assume a rule applies because it is written in `global/CLAUDE.md`.

- **Never run git mutations.** No `add`, `commit`, `push`, `checkout`, `reset`, `rebase`, `merge`, `stash`. Print the exact command and let the user run it. `gsave` is the user's own commit-and-push command — name it, never invoke it. Reads (`status`, `log`, `diff`, `ls-files`) are fine. This applies to the `toolbox` submodule too.
- **Propose a plan and wait for approval before changing files.** Recording a decision the user has already locked needs no second approval.
- **Deletes need their own explicit confirmation**, even inside an approved plan. Moving is not deleting. The one exception: something this session just superseded — converted, replaced, rewritten under a new name — where the dead copy goes immediately.
- **Designing this workflow uses plain conversation.** Never invoke a brainstorming skill to design Flow itself, neither `superpowers:brainstorming` nor Flow's own.
- **Scratch files go in `tmp/`**, which is gitignored. Never `/tmp`, never the repo root.
- **The user's profile is `wip/user-profile.md`.** Read it before writing anything for them — the short version is voice-to-text input with transcription errors, no filler, and a committed recommendation instead of a neutral list of options.
- **Explanations go at the end of the turn, after every tool call.** The user copies the last message; never emit prose and then edit files.

## Layout

| Path | What it is | Where it ends up |
|---|---|---|
| `global/CLAUDE.md` | the rules that apply in every directory, project or not | copied to `~/.claude/CLAUDE.md`, then personalized |
| `global/settings.json` | permissions, the `PreToolUse` hook, feature flags — every key explained in `global/settings.md` | merged into `~/.claude/settings.json` |
| `global/scripts/` | `ptree.sh`, `fmerge.js`, `gsave.sh`, `guard.js`, `link-skills.sh`, `flow/flow.js` | the folder is symlinked as `~/.claude/scripts`; four of the files get a second symlink in `~/.local/bin` named without the extension, which is what makes `ptree`, `fmerge`, `gsave` and `flow` commands |
| `skills/` | every skill, one folder each | symlinked into `~/.claude/skills/` |
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
- **A skill edit is live immediately.** `~/.claude/skills/*` symlinks into `skills/`, so there is one copy and no propagation step. Adding, renaming or removing a skill is the only case needing `bash global/scripts/link-skills.sh`.
- **Every script file keeps its extension. The symlink drops it.** `ptree.sh` on disk, `ptree` to type — the file says what runs it, the link says what you call it. Nothing in `global/scripts/` is ever extensionless.
- **One source, two ways to reach it.** Every script lives once, in `global/scripts/`. `~/.claude/scripts` is a symlink to that folder, for the files named by path (`guard.js` in `settings.json`, `link-skills.sh`). `~/.local/bin/<name>` are per-file symlinks, for the four that are commands. No file is ever copied anywhere.
- **PATH commands are written bare** — `ptree docs`, `fmerge src/`, `flow next`, never with a path or an interpreter. Everything else is written as `~/.claude/scripts/<file.ext>`.
- **Two languages, by job.** Bash where the script is a thin wrapper over another command (`ptree.sh` over `tree`, `gsave.sh` over `git`); Node where there is real logic (`fmerge.js`, `flow/`, `guard.js`). Nothing else.
- **Real commit messages.** The changelog convention in `skills/CLAUDE.md` only covers behavior changes; everything else is recoverable from git only if the message says something.
