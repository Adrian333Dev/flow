# <!-- Project Name -->

<!-- One-sentence project description -->

> Designed for **solo developers**. Workflow assumes one author, one branch context, no team coordination layer (no PR templates, code-owners, multi-reviewer gates).
>
> This file is the Codex equivalent of `CLAUDE.md`. Keep them in sync.

---

## Project context

> Fill in after running `/project-init`.

- **Name:** <!-- project name -->
- **Stack:** <!-- e.g. TypeScript, React, Vite, NestJS, Supabase, pnpm -->
- **Structure:** <!-- e.g. single app | monorepo (apps/web + apps/api + packages/contracts) | extension + dashboard | library -->

## Project-specific rules

> Add rules that emerge from your spec and can't be inferred from conventions.

<!-- e.g.
- Never write raw SQL — use the query builder
- All app data goes through apps/api — browser never reads DB directly
-->

---

## Session start

1. Read `docs/work/now.md` to find the active milestone and next action.
2. Read `docs/agents/workflow-rules.md`.
3. If the active milestone folder has `session.md`, read it before reading source files.
4. The next action in `now.md` is usually a **Superpowers** skill — invoke it rather than improvising.

## Workflow — Superpowers as the engine

This template's design → plan → implement → verify → ship loop runs on the Superpowers skill suite. Per milestone:

```
superpowers:brainstorming                    → spec.md
[grill-me]                                   → stress-test the spec
superpowers:writing-plans                    → plan.md
superpowers:subagent-driven-development      → implement (or executing-plans for simpler work)
[checkpoint mid-session]                     → session.md
superpowers:verification-before-completion   → verify against plan + conventions
superpowers:requesting-code-review           → pre-merge review
superpowers:finishing-a-development-branch   → wrap, update now.md, adjust roadmap.md
```

Skills override default agent behavior. When `now.md` points to one, use it.

`grill-with-docs` is an opt-in alternative to `grill-me`, useful once the project has accumulated domain terminology. It writes to repo-root `CONTEXT.md` and `docs/adr/` (not the milestone folder) — invoke it deliberately, not by default.

## Hard rules

All process rules live in `docs/agents/workflow-rules.md` — read it at session start. Key non-negotiables also enforced here:

- **Never run git mutations.** Suggest commands; the user runs them. (Also enforced via `.claude/settings.json`.)
- **One formal milestone at a time.** Only one `spec.md` + `plan.md` exists at any moment.
- **No placeholders in plans.** Real file paths, real code, real commands — always.

## Superpowers path overrides

- Specs → `docs/work/milestones/<slug>/spec.md`
- Plans → `docs/work/milestones/<slug>/plan.md`

## Key docs

| Doc | Purpose |
|-----|---------|
| `docs/work/now.md` | Active milestone and next action |
| `docs/work/roadmap.md` | Loose blueprint of upcoming work — not a commitment |
| `docs/spec/` | Project bible (product + tech) |
| `docs/agents/conventions.md` | Coding conventions — base + stack layer; living document |
| `docs/agents/workflow-rules.md` | Milestone process rules — agent behavior during workflow; living document |
| `docs/agents/commands.md` | Dev/test/build/lint commands; living document |
| `docs/agents/setup-notes.md` | One-time setup decisions, scaffold commands, tooling configuration choices |
| `docs/agents/recommended-tools.md` | Skills, MCPs, plugins reference |
| `docs/references/llms.md` | Optional `llms.txt` overrides for specific libraries |
