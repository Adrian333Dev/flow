# Handoff

Written 2026-09-18. Read it once, then rewrite it whole next time.

**Nothing is half built.** The next step is the management skill, from the first line of `backlog.md` → `### The management skill, in build order`. Read `lab/context/state.md` first: it says what is built.

## Codex waits until Flow ships on Claude Code

The user ruled on 2026-09-18 that Flow releases on Claude Code alone first, and that each harness may get its own mechanisms. It reverses a ruling from the same morning that put the Codex port before the management skill.

- **What stays built:** the rules in `~/.agents/AGENTS.md` with `~/.claude/CLAUDE.md` importing them, the link `~/.codex/AGENTS.md`, the skills in `~/.agents/skills/flow/`, `flow install --root`, and `bash lab/scripts/try.sh --codex`. Codex finds the skills on its own, so dropping the link would not keep Flow out of Codex.
- **Where the port starts:** `lab/context/models.md` → `### The hooks on Codex, walked 2026-09-18`. It walks Flow's 11 hooks against the Codex source and designs each one. The git switch takes 3 pieces there: a Codex rules file that makes git writes ask, `guard.js` denying them when the switch is off, and a `PermissionRequest` hook saying yes when it is on allow. The user rejected turning every "ask" into "deny".
- **The open work** is 4 lines under `backlog.md` → `## After V1` → `### Other people, other models`.
- **README.md and `docs/manual/where-everything-lives.md`** now say Flow does not support Codex yet.

## Every session starts in Manual mode

`home/settings.json` sets `permissions.defaultMode` to `default`, the settings name for Manual. Claude Code 2.1.228 made auto mode the starting mode on Pro, Max and Team plans, and auto mode nudges the model to keep working without stopping, against `instruction-or-thinking`. `docs/manual/settings.md` → `#### Modes` holds the whole argument, including why `guard.js` works in both modes.

## Loose ends nobody has raised yet

- **`flow doctor` does not check `permissions.defaultMode`.** `home/settings.json` is merged by hand, and a merge that misses the key leaves every session in auto mode with nothing reporting it. `checkSettings` in `scripts/flow/commands/doctor.js` checks the hooks and `skillOverrides` only.
- **`find()` in `scripts/flow/lib/skills.js` has no caller.** Deleting it needs the user's yes.
- **This repo has no `AGENTS.md`, so Codex working on Flow reads none of `CLAUDE.md`'s rules.** Say so only if the user starts working on Flow in Codex.
- **The scorecard records use a `kind` field**, against `type-never-kind`. It predates this session.

## Where to look up anything about Codex

The Codex source is the documentation. There is no page set like `lab/research/claude-code-docs/`. The places to look, in order:

- **`repos/codex/codex-rs/`**, read with `cat` and `grep`, never edited. `ext/skills/` covers skills. `utils/plugins/` covers manifests and namespaces. `hooks/` covers hooks, and `core/src/hook_runtime.rs` fires them. `execpolicy/` covers the rules files. `codex-home/` holds the global instructions loader. `external-agent-migration/` is the importer. `login/src/auth/` holds the login renewal.
- **GitHub issues on `openai/codex`**, searched through the API with no token. Issue 25042 gave the 64-character limit on a `plugin:skill` name.
- **`learn.chatgpt.com/docs/`**, for what a feature is meant to do rather than how it works. The pages are heavy on JavaScript, so fetch the raw text and strip the markup.
- **`repos/codex/docs/`**: `config.md`, `agents_md.md`, `slash_commands.md` and `sandbox.md`.
- **A live run**, where the source leaves it open: `bash lab/scripts/try.sh --codex --print`, then `codex exec --sandbox read-only "<question>"` from `tmp/try/project` with the printed environment. The session log under `tmp/try/root/.codex/sessions/` shows exactly which skills and rules Codex was handed.

## Claude Code's current pages

`lab/research/claude-code-docs/` was saved on 2026-08-14 and has gone stale in places: its permissions page predates auto mode becoming the starting mode. `tmp/docs/` holds 4 pages fetched on 2026-09-18: `permission-modes.md`, `auto-mode-config.md`, `hooks.md` and `costs.md`. `https://code.claude.com/docs/en/<page>.md` returns any page as markdown.

## The writing faults, so they stop

`lab/context/rejected-replies.md` holds 15 cases. Two of them are the ones most likely to recur:

- **`## A simple thing explained as a hard one`**: a colon fragment standing for a sentence, an abstract noun before the concrete file, a reason attached to every statement, the file name arriving at the end. Say the thing in one short sentence first, name the file in that sentence, and give a reason only if one is needed.
- **`## What the reader never got`**: a mechanism written with no actor and no moment. Every step names the thing that performs it and when it runs.
