# Recommended Tools, Skills & MCPs

A living reference of the tools ecosystem for this template. Add or remove per project.

---

## Local skills (`.agents/skills/`)

Bundled in the template:

| Skill | Trigger | What it does |
|-------|---------|-------------|
| `checkpoint` | "save context" / "/checkpoint" | Saves a resumable session snapshot to the active milestone folder |

## Local slash commands (`.claude/commands/`)

Lazy-loaded on invocation — they don't bloat session context like skills do.

| Command | Body | What it does |
|---------|------|-------------|
| `/project-init` | `docs/agents/project-init.md` | One-shot project initialization from `docs/spec/`. Run once per project. |
| `/check-setup` | `docs/agents/check-setup.md` | Read-only health check: template integrity, init status, skills accessibility, optional tooling. Run anytime. |

Both have natural-language fallbacks for non-Claude-Code tools — ask the agent to *follow the instructions in `<body-path>`*.

`/project-init` and `/check-setup` are intentionally **not** registered as standard skills — skills load into agent context every session, but these run on demand. Slash commands lazy-load only when invoked.

`/check-setup` is named to avoid collision with Claude Code's built-in `/doctor` command (which checks Claude Code's own installation, not your project setup).

---

## Superpowers (installed separately — see SETUP.md)

The core workflow engine. Per-milestone chain:

| Skill | When |
|-------|------|
| `superpowers:brainstorming` | Design exploration → spec |
| `superpowers:writing-plans` | Detailed step-by-step implementation plan |
| `superpowers:subagent-driven-development` | Implement (preferred for non-trivial milestones) |
| `superpowers:executing-plans` | Implement (simpler alternative) |
| `superpowers:verification-before-completion` | Verify before claiming done |
| `superpowers:requesting-code-review` | Pre-merge review |
| `superpowers:receiving-code-review` | Process review feedback rigorously |
| `superpowers:finishing-a-development-branch` | Wrap up the milestone |

Cross-cutting:

| Skill | When |
|-------|------|
| `superpowers:systematic-debugging` | Structured debugging before proposing a fix |
| `superpowers:test-driven-development` | TDD red-green-refactor loop |
| `superpowers:dispatching-parallel-agents` | Parallelize independent tasks |

---

## Matt Pocock skills (installed separately — see SETUP.md)

Curated subset that complements Superpowers:

| Skill | When |
|-------|------|
| `grill-me` | Default stress-test for any plan/design. Zero side effects — pure Socratic interview. Use during the milestone flow and ad hoc outside it. |
| `grill-with-docs` | Opt-in alternative once the project has accumulated domain terminology. Same interview style, but writes a glossary to repo-root `CONTEXT.md` and ADRs to `docs/adr/`. Not milestone-scoped — invoke deliberately. |
| `caveman` | Ultra-compressed response mode (~75% token reduction). |
| `improve-codebase-architecture` | Surface deepening opportunities; run periodically. |
| `zoom-out` | Get a higher-level perspective on an unfamiliar code area. |
| `write-a-skill` | Author your own skills with proper structure. |

Skip the rest:

- `tdd`, `diagnose` — covered by Superpowers (`test-driven-development`, `systematic-debugging`).
- `to-prd`, `to-issues`, `triage`, `setup-matt-pocock-skills` — GitHub / Linear issue-tracker workflows that don't fit milestone folders.
- `git-guardrails-claude-code` — `.claude/settings.json` deny list already covers it.
- `migrate-to-shoehorn`, `scaffold-exercises`, `setup-pre-commit` — niche / stack-specific.

---

## Optional skills (Claude Code plugins)

Install with `claude plugin install <name>@claude-plugins-official`:

| Plugin | When to add |
|--------|------------|
| `ai-elements` | AI chat UI components (React) |
| `supabase` | Supabase MCP + skills |
| `sentry` | Error monitoring |
| `firecrawl` | Web scraping / research |
| `chrome-devtools-mcp` | Performance debugging |
| `typescript-lsp` | TS code intelligence |
| `playwright` | E2E testing |

Do **not** install:

- `commit-commands` — agents must not run git mutations
- `feature-dev` — Superpowers replaces it

---

## MCP servers

Pre-wired in two config files — both are checked in (no setup beyond install):

| File | Used by |
|------|---------|
| `.mcp.json` | Claude Code |
| `.codex/config.toml` | Codex |

| MCP | What it does |
|-----|-------------|
| `context7` | Pulls library docs on demand. Optional override per library in `docs/references/llms.md`. |
| `playwright` | Browser automation for E2E testing |

Optional — when adding new MCPs, add to **both** `.mcp.json` and `.codex/config.toml` (see SETUP.md for snippets):

| MCP | URL / command | Auth | Best for |
|-----|---------------|-----|---------|
| `supabase` | `https://mcp.supabase.com/mcp` | access token | Supabase DB, auth, storage |
| `stripe` | `https://mcp.stripe.com` | secret key | Stripe payments |
| `shadcn` | `npx shadcn@latest mcp` | none | Shadcn/ui generation |
| `inngest-dev` | `http://127.0.0.1:8288/mcp` | local | Inngest dev server |
| `sentry` | via plugin | auth token | Error monitoring |
| `firecrawl` | via plugin | API key | Web scraping |
| `chrome-devtools` | via plugin | none | Performance debugging |
