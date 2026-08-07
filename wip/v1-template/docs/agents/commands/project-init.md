# Project Initialization

Run this once when starting a new project from the agentic-setup template.

This document is the body of the `/project-init` command. It is **intentionally not registered as a standard skill** — skills load into agent context every session, but project-init runs once per project. Keeping it as a slash-command pointer (`.claude/commands/project-init.md`) avoids permanent context bloat.

---

## Step 0 — Gate check (BLOCKING — do this before anything else)

1. List every file under `docs/spec/` recursively.
2. Read them all.
3. Verify that the combined content adequately covers **both** dimensions:
   - **Product bible** — what you're building, who it's for, all features, V1 scope, non-goals, edge cases. Detailed enough to understand the product end-to-end without external context.
   - **Tech spec + stack** — full library/framework list with versions and rationale, architecture decisions, deployment target, system design, integration points.

Filenames and structure are free-form. Single files (`product.md`, `tech.md`) or split (`product/overview.md`, `product/v1.md`, `tech/stack.md`, `tech/architecture.md`) — both fine.

**If either dimension is thin or missing: stop immediately. Tell the user exactly what is missing and what to add. Do not proceed to Step 1 or any further step. Do not invent the spec.**

---

## Step 1 — Extract spec content

From the files already read in Step 0, extract and note:

- Project name, one-sentence description
- Full tech stack: every framework, library, service mentioned — with versions where given
- Repo structure (single app, monorepo with which orchestrator, extension layout, library, hybrids) — infer from spec content and from filesystem (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `manifest.json`, `Cargo.toml`)
- V1 scope: what's in, what's explicitly out
- Any explicit author conventions or preferences mentioned in the spec
- Roadmap content if present (will seed `docs/work/roadmap.md`)

---

## Step 2 — Fill CLAUDE.md and AGENTS.md

Replace every `<!-- ... -->` placeholder in both files with real values from the spec. Keep the files in sync — identical content, different filenames.

The "Project-specific rules" section: add rules from the spec that aren't conventions (e.g. *"All app data flows through apps/api — browser never reads DB directly"*). Leave it minimal — this section is for genuinely project-specific gotchas, not generic best practices.

---

## Step 3 — Fill docs/agents/commands.md

Scan the project filesystem for command sources:

- `package.json` (root + every workspace)
- `turbo.json`, `nx.json`, `pnpm-workspace.yaml`
- `Makefile`, `Justfile`, scripts in `scripts/`
- `Cargo.toml`, `pyproject.toml`, etc.
- Manifest files (`manifest.json` for extensions, `app.config.ts` for Expo, etc.)

Document **what's actually there**. Do not impose a fixed section structure — let the structure follow the project shape:

- Single-app project: blocks per concern (dev, test, build, lint, etc.)
- Monorepo: a section per workspace + a "shared" / "root" section for orchestration commands
- Library: build / publish / changeset commands; no dev server section
- Extension: manifest build, content-script bundle, options-page bundle
- Hybrid (e.g. monorepo containing an extension): combine naturally

Mark any command you couldn't verify with `# unverified`.

This file is a **living document**. After init, the agent and the user maintain it together.

---

## Step 4 — Enhance docs/agents/conventions.md

The template ships with substantive **base conventions** (universal patterns + a TS/JS section). Your job is to **enhance**, not rewrite:

1. **Read the existing file** before changing anything.
2. **Prune** rules that don't apply:
   - No DB → drop DB rules
   - No testing setup yet → drop testing section
   - Non-TS language → swap the TS section for the appropriate language section (or remove it)
3. **Add a stack-specific section** per major opinionated library in the stack. Use your training knowledge first; reach for context7 only when in real doubt about current best practices for one of the most opinionated frameworks (e.g. NestJS, Next.js). Examples:
   - **TanStack Query**: stable cache key factories per resource (`queryKeys.user.byId(id)`), one custom hook per query/mutation, invalidate by key prefix not refetch.
   - **NestJS**: domains under `src/domains/<domain>/`, Zod for validation (`ZodValidationPipe` + `@ZodBody`/`@ZodParam`/`@ZodQuery`), `httpErrors` factory for exceptions, `ok()` wrapper for responses.
   - **Zustand**: one store per domain, selectors at call site, no derived state in store.
   - **Drizzle / Prisma**: generated types are output — never edit; migrations one-at-a-time, named with intent.
4. **Ask the user 3–4 quick preference questions** for things you can't infer. One at a time. Do not exceed 4. Examples:
   - Test runner (if not obvious from `package.json`)?
   - Path aliases (`@/`, `~/`) or relative imports?
   - Any naming convention that differs from the base file?
   - Anything else to enforce explicitly?
5. **Write concrete, followable rules** — every line must be specific. Vague guidelines (*"follow best practices"*) are forbidden.

This file is a **living document**. After init, the agent and the user add new rules as they emerge during milestones.

---

## Step 5 — Initialize docs/work/now.md and docs/work/roadmap.md

- **`now.md`**: set the first milestone. Derive from V1 scope in the spec — what's the natural starting point? If genuinely ambiguous, propose one and ask the user to confirm before writing.
- **`roadmap.md`**: if the user supplied roadmap content in `docs/spec/` or it's clearly inferable from V1 scope, seed an ordered loose list of upcoming work. Otherwise leave the placeholder. The roadmap is a blueprint, not a commitment — it will change.

---

## Step 6 — Seed docs/agents/setup-notes.md

After scaffolding decisions are made (Turborepo pipeline, package manager config, DB migration approach, bootstrap ordering), record the one-time choices in `docs/agents/setup-notes.md`. This file is reference, not instruction — it's for choices that are already baked into config files and won't be revisited unless the setup is redone.

If no scaffolding has happened yet, leave a placeholder noting it will be populated as the first milestone is built.

---

## Step 7 — Report

Output a short summary:

- What was filled in automatically (with sources)
- What was added via training-knowledge research; where context7 was consulted, if anywhere
- What required user input (and what was decided)
- What still needs manual review — call these out explicitly

Then tell the user:

> "Initialization complete. Please review:
> - `CLAUDE.md` and `AGENTS.md` — verify the inferred context and rules
> - `docs/agents/conventions.md` — confirm stack-specific additions match your approach
> - `docs/agents/commands.md` — verify commands, especially any marked `# unverified`
> - `docs/work/now.md` — confirm the first milestone
> - `docs/work/roadmap.md` — adjust as needed
>
> When ready, start the first milestone with `superpowers:brainstorming`."
