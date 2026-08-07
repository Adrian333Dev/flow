# Check Setup

Sanity-check that the agentic-setup template is correctly installed, initialized, and ready to use. Run any time the setup feels off, after pulling template updates, or as a smoke test on a fresh machine.

This document is the body of the `/check-setup` command. **Read-only by design** — it reports problems and suggests fixes; it does not mutate anything.

> Named `check-setup` (not `doctor`) to avoid colliding with Claude Code's built-in `/doctor` command, which checks Claude Code's own installation.

---

## How to run

**Claude Code:** type `/check-setup` in the chat.

**Codex / others:** ask the agent to *follow the instructions in `docs/agents/commands/check-setup.md`*.

The agent runs each check in order, tags it with one of:

- ✅ **PASS** — the check succeeded.
- ⚠️ **WARN** — non-blocking; usually means the project hasn't been initialized yet, or an optional thing is missing.
- ❌ **FAIL** — something is broken; address before continuing.
- ⏭️ **SKIP** — check doesn't apply (e.g. Claude-Code-only check on Codex).

After all checks, the agent prints a short summary: counts per status + a concrete action list for any FAIL / WARN entries.

This command must not run any git mutation commands, install anything, or modify files. If a fix is needed, it surfaces the suggested command for the user to run.

---

## Checks

### A. Repo essentials (FAIL on missing)

For each, report ✅ if present, ❌ if missing:

1. `CLAUDE.md` exists at repo root.
2. `AGENTS.md` exists at repo root.
3. `README.md` exists at repo root.
4. `SETUP.md` exists at repo root.
5. `.gitignore` exists at repo root.
6. `.mcp.json` exists at repo root.
7. `.claude/settings.json` exists.
8. `docs/spec/`, `docs/agents/`, `docs/references/`, `docs/work/`, `docs/work/milestones/` all exist as directories.

If any of these FAIL, surface "this looks like an incomplete clone — re-clone the template" as the suggested fix.

### B. `.mcp.json` schema

1. File parses as valid JSON. (FAIL otherwise.)
2. Top level contains a `mcpServers` key whose value is an object. (FAIL otherwise — Claude Code's schema requires this wrapper.)
3. The two pre-wired entries `context7` and `playwright` are present under `mcpServers`. (WARN if missing — the user may have intentionally removed them.)

Suggest: re-add the wrapper, or add the two pre-wired servers per `SETUP.md` Section 4.

### C. Git mutation deny list (Claude Code only)

If `.claude/settings.json` exists:

1. Parses as valid JSON. (FAIL otherwise.)
2. Contains `permissions.deny` as an array. (FAIL otherwise.)
3. Array includes deny entries for at minimum: `git add`, `git commit`, `git push`, `git reset`, `git rebase`, `git checkout`, `git merge`, `git stash`, `git clean`. (FAIL on each missing.)

⏭️ SKIP this entire section if running under a non-Claude-Code agent.

Suggest: restore the deny list from the template's `.claude/settings.json`.

### D. Bundled skills + slash commands

1. `.agents/skills/checkpoint/SKILL.md` exists and is readable. (FAIL otherwise.)
2. `.claude/skills/checkpoint` exists as a symlink and resolves to `.agents/skills/checkpoint`. (FAIL on broken symlink. ⏭️ SKIP if not Claude Code.)
3. `.claude/commands/project-init.md` exists and references `docs/agents/commands/project-init.md`. (FAIL on missing. ⏭️ SKIP if not Claude Code.)
4. `.claude/commands/check-setup.md` exists and references `docs/agents/commands/check-setup.md`. (FAIL on missing. ⏭️ SKIP if not Claude Code.)
5. `.claude/commands/update-conventions.md` exists and references `docs/agents/commands/update-conventions.md`. (WARN on missing. ⏭️ SKIP if not Claude Code.)
6. `docs/agents/commands/project-init.md` exists. (FAIL otherwise.)
7. `docs/agents/commands/check-setup.md` exists. (FAIL otherwise — that's this file.)
8. `docs/agents/commands/update-conventions.md` exists. (WARN otherwise.)

### E. External skills (best-effort)

These are installed separately per `SETUP.md`. This command can only check best-effort:

1. **Superpowers** — try to invoke `superpowers:brainstorming` (or read its skill metadata if your tool exposes a way). If the agent can confirm Superpowers is available, ✅ PASS. If not detectable, ⚠️ WARN with the install instructions for the current tool from `SETUP.md` Section 1.
2. **Matt Pocock skills (curated subset)** — for each of `grill-me`, `caveman`, `improve-codebase-architecture`, `zoom-out`, `write-a-skill`: ✅ if the agent can confirm the skill is available, ⚠️ if not. Suggest `npx skills@latest add mattpocock/skills` per `SETUP.md` Section 2.
3. `grill-with-docs` — INFO only. Mention it's available as an opt-in alternative once the project has accumulated domain terminology; not required.

If your agent has no way to introspect installed skills, mark these as ⏭️ SKIP and tell the user to verify via their tool's plugin/skill UI.

### F. Initialization status

These checks tell whether `/project-init` has been run on this clone.

1. **`CLAUDE.md` placeholders.** Read `CLAUDE.md`. If it still contains the literal placeholder `<!-- Project Name -->` in the title, or the `<!-- project name -->`, `<!-- e.g. TypeScript, React, ... -->`, `<!-- e.g. single app | monorepo ... -->` placeholders in the Project context block — mark ⚠️ WARN with "run `/project-init`".
2. **`AGENTS.md` placeholders.** Same check on `AGENTS.md`.
3. **`docs/spec/`.** Count files (recursively) excluding `README.md`. Zero files → ⚠️ WARN with "add product bible + tech spec content to `docs/spec/` before running `/project-init`". One or more → ✅.
4. **`docs/work/now.md`.** Read it. If the `**Milestone:**` line still has a placeholder (`<!-- e.g. m01-... -->`) → ⚠️ WARN "set the active milestone (usually done by `/project-init` or by `superpowers:finishing-a-development-branch` when wrapping the previous milestone)". If a milestone slug is set, ✅.
5. **`docs/agents/commands.md`.** Read it. If it's still just the default placeholder (only the header, the lead paragraph, and an HTML comment), ⚠️ WARN "populate via `/project-init` or as commands emerge". Otherwise ✅.
6. **`docs/agents/conventions.md`.** Read it. The Universal section should always exist (template default). Check whether the `## Stack-specific` section has at least one populated subsection (i.e. a `### <Library>` heading with content under it). If only the placeholder remains, ⚠️ WARN "add stack conventions via `/project-init` or as you go". Otherwise ✅.

### G. Active milestone integrity

1. **Read `docs/work/now.md`.** Extract the milestone slug and status.
2. If a slug is set, check that `docs/work/milestones/<slug>/` exists. (FAIL if not.)
3. If status is `in-progress`:
   - `spec.md` should exist in the milestone folder. ⚠️ WARN if missing ("status is in-progress but no spec.md — run `superpowers:brainstorming`").
   - `plan.md` should exist if the next-action references implementation skills. ⚠️ WARN if missing.
4. If status is `complete`, suggest moving the slug to `docs/work/roadmap.md`'s `## Done` section if it isn't there.
5. ⏭️ SKIP this whole section if no milestone is set yet.

### H. `roadmap.md` sanity (informational)

1. Read `docs/work/roadmap.md`. ✅ if file exists.
2. If `## Upcoming` is empty AND no milestone is currently active, INFO: "no active milestone and no upcoming roadmap — pick the next thing".

### I. Optional tooling (INFO)

These are best-effort and informational only — never FAIL.

1. **Node.js + npm.** Run `node --version` and `npm --version`. Report versions or "not found".
2. **TypeScript LSP.** If a `package.json` at repo root or in a workspace mentions `typescript` as a dependency, check whether `typescript-language-server` is on `$PATH`. Suggest `npm install -g typescript-language-server typescript` if missing (per `SETUP.md` Section 3).
3. **Playwright browsers.** If `.mcp.json` includes `playwright`, check whether `~/.cache/ms-playwright/` exists and is non-empty. Suggest `npx playwright install` if not.
4. **`temp/` directory.** Should not be tracked by git (it's where local clones / overviews live). Run `git check-ignore temp/` — if `temp/` exists but isn't ignored, INFO "consider adding `temp/` to `.gitignore`".

---

## Output format

After all checks, print a summary block in this shape:

```
agentic-setup check-setup — <YYYY-MM-DD HH:MM>

Critical:        N pass / N warn / N fail
Init status:     N pass / N warn / N fail
Skills:          N pass / N warn / N skip
Active milestone: <slug or "none"> (status: <not-started|in-progress|complete>)

Action items:
1. <concrete fix for highest-priority FAIL>
2. <concrete fix for next FAIL>
3. <concrete fix for highest-priority WARN>
...
```

If everything is ✅ PASS, print one line: `All checks passed. The setup is ready.`

Action items are sorted: FAILs first (most disruptive first), then WARNs (init-related before tooling-related), then INFOs are not surfaced.

Each action item is a single line with a concrete command or file edit the user can run.

---

## Tone

Brief, mechanical, scannable. This command is not a tutor — it reports state and points at the fix. No prose explanations of why something matters; that lives in `CLAUDE.md`, `README.md`, and `SETUP.md`.
