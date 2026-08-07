# Handoff — 2026-08-07

First file to read in a fresh session. Replaced wholesale each time, never appended to.

## What this repo is

**Flow** — a Claude Code workflow for one solo developer. Three shipped parts: `global/` installs to
`~/.claude/` and loads in every directory whether or not there is a project; `skills/` holds the skill set;
`project-template/` is the two files a new project starts with. `toolbox/` is a submodule, its own repo,
a catalog of external tools filed by job.

**It is not finished.** The design is nearly complete and almost nothing is built. The eight skills on disk
were written against an older chain and four of them name paths the design has since deleted.

## What just happened

The `agentic-setup` workbench repo — the incubator this was built inside — was **deleted outright, GitHub
repo included.** `flow` is now the only repo. Everything worth keeping was carried into `wip/`:

- `remaining.md`, `session-new-plugin.md`, and the six `design-*.md` files — the entire design record
- `user-profile.md` — the only copy of the user's profile text, source material for `## The user` and
  `## Preferences` when the globals get installed. **Delete it once that copy exists**
- `v1-template/`, `framework-build/` — the previous generation, for comparison
- `study-cases/`, `research/`, `archived-skills/` — the evidence behind the skills
- `excalidraw/` — three third-party diagram skills awaiting a verdict, with a README comparing them
- `proxy.mjs` — a dev-only context auditor, deliberately not a shipped script

`toolbox` was added as a submodule, and `global/CLAUDE.md`, `README.md`, `CLAUDE.md` and the
`setup-flow-globals` spec were all updated for the new `~/.claude/toolbox` path.

**`wip/` is scaffolding.** Nothing in it installs. The whole folder is deleted when the build is done, and no
path inside it may leak into a skill, into `global/`, or into `project-template/`.

## Machine state — nothing is installed

This is the part most likely to cause confusion. **Flow does not run on this machine.**

- `~/.claude/skills/` holds three unrelated folders from May and no Flow skill. Deliberate — linking waits
  until the skill set is final
- `~/.claude/settings.json` has no `hooks` key, so the `guard.js` PreToolUse hook is not active
- `~/.claude/CLAUDE.md` has not been written, so none of `global/CLAUDE.md`'s rules load
- `~/.claude/toolbox` does not exist yet

The four PATH commands and `~/.claude/scripts` pointed into the deleted workbench directory and **broke when
it was removed.** Re-point them against wherever this repo now lives:

```bash
ln -sfn ~/code/flow/global/scripts ~/.claude/scripts
ln -sfn ~/code/flow/global/scripts/ptree.sh     ~/.local/bin/ptree
ln -sfn ~/code/flow/global/scripts/fmerge.js    ~/.local/bin/fmerge
ln -sfn ~/code/flow/global/scripts/gsave.sh     ~/.local/bin/gsave
ln -sfn ~/code/flow/global/scripts/flow/flow.js ~/.local/bin/flow
ln -sfn ~/code/flow/toolbox                     ~/.claude/toolbox
```

`ptree`, `fmerge` and `flow` are used constantly and will fail until this runs. The `flow` command itself is
built and working — ~950 lines, zero dependencies, the full confirmed surface.

If the repo was cloned without `--recurse-submodules`, `toolbox/` is empty; fix with
`git submodule update --init`.

## ⏸ One decision is parked and it affects most of what is left

`remaining.md` opens with a section titled **"PARKED — delete the topic; a ticket holds its own brainstorm"**.
It is a fully-worked proposal the user understood and **deliberately did not approve**; he wanted other work
first. Everything needed to re-open it is in that section, including the five objections and where each
landed — the conversation it came from is gone.

**Do not implement it. Do not re-open it unprompted.**

It matters for sequencing: `remaining.md` items `2c`–`2g` are the five skill rewrites, and all five are
written against topics. Building them before that call is made risks doing the work twice. Raise the ordering
once, then follow the user's answer.

## Next action — the user's call between

1. **Restructure `remaining.md`** — split steps 4–5 out to `wip/migration.md`, split every checkbox into
   **must** / **later**, cut settled argument out of `[x]` items. Already approved in conversation, spec at
   the bottom of that file, not yet done. Blocks nothing, so it is the safe default
2. **Build step 3, `setup-flow-globals`** — the skill that installs everything listed under "Machine state"
   above. Spec is in `remaining.md`
3. **Un-park the topic decision** — unblocks the five skill rewrites

## How to work here

`CLAUDE.md` at the repo root carries the rules, and they are load-bearing because **no global rules are
installed.** The two that get violated most: **never run git mutations** — print the command, the user runs
it — and **propose a plan and wait for approval before changing files.** Deletes need their own confirmation
on top of that.

Designing Flow itself uses **plain conversation**, never a brainstorming skill.

## Open threads, recorded and not opened

- **Skills vs. agents vs. commands.** Claude Code has three extension points; Flow reflexively uses skills
  for everything. Never actually decided
- **A growing set of global scripts**, most of which are not Flow-specific — `gsave` is the model. Where
  general tools live, how they register, whether Flow should own them. The `toolbox` submodule answers this
  for *catalogued* tools only; it says nothing about scripts
- **Excalidraw** — see `wip/excalidraw/README.md`. `explain` bans SVG and mermaid on measured cost, but that
  ruling never covered excalidraw, which is a different mechanism
