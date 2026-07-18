# Recommended Tools

Optional, external tools that complement this workflow. None are required — the core loop works without any of them.

**One rule governs this list:** it holds only tools that fill a gap the built-in skills *don't* cover. Anything this workflow already owns — brainstorming/spec-writing, planning, execution, research, visualization, context-capture, debugging, verification — is deliberately absent. If you're about to add a tool that duplicates a built-in skill, don't.

> Snapshot: mid-2026. This ecosystem churns fast — re-check a repo's recent activity before installing, especially community entries. Treat every MCP server and skill as executable code you're granting access to: skim the source and scope credentials tightly.

## How to install

- **MCP servers:** `claude mcp add <name> <endpoint-or-command>` — many are remote/OAuth, so first use opens a browser.
- **Plugins:** `/plugin install <name>@claude-plugins-official` — the official marketplace auto-registers on first launch.
- **Skills:** `npx skills add <owner/repo> --skill <name>` — pick specific skills, choose your agent, symlinked by default so `git pull` keeps them current (`--copy` for a frozen copy).

---

## 1. MCP servers

Give Claude Code capabilities it lacks natively — live docs, a real browser, production data, external platforms.

### Always useful

- **Context7** (Upstash) — pulls live, version-pinned library docs into context instead of relying on stale training data.
  - *Use when:* working with any fast-moving framework/library version.
  - `claude mcp add --transport http context7 https://mcp.context7.com/mcp`

- **Playwright MCP** (Microsoft) — cross-browser automation via the accessibility tree: navigate, click, fill, screenshot, assert.
  - *Use when:* you want repeatable end-to-end checks across browsers.
  - `claude mcp add playwright npx @playwright/mcp@latest`
  - *Note:* the official successor to the deprecated Puppeteer MCP — don't use the old one.

- **Chrome DevTools MCP** (Google) — a live, inspectable Chrome: DOM, console, network, performance traces.
  - *Use when:* debugging a real rendered page or a perf issue that only shows up in a browser.
  - `npx chrome-devtools-mcp@latest`
  - *Overlaps Playwright:* DevTools for debugging/perf, Playwright for repeatable test flows — you rarely need both in one task.

### Add when your stack uses it

- **Supabase MCP** — inspect/operate your Supabase DB, auth, and storage directly. *Dev environments only; scope credentials.*
  - `claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<ref>"` (OAuth)
- **Sentry MCP** — read production errors, stack traces, and performance traces. Read-only by design.
  - `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` (OAuth)
- **Stripe MCP** — customers, payments, subscriptions, webhooks. Payment/PII data — scope the key tightly.
  - `claude mcp add --transport http stripe https://mcp.stripe.com/mcp` (OAuth)
- **Cloudflare MCP** — Workers, Pages, KV, R2, D1. See `cloudflare/mcp-server-cloudflare` (remote/OAuth).
- **Generic SQL database?** Use Google's **MCP Toolbox for Databases** (`googleapis/mcp-toolbox`) — *not* the official `@modelcontextprotocol/server-postgres`, which is archived and has a known SQL-injection flaw that bypasses its read-only guard.

---

## 2. Claude Code plugins

From the official marketplace: `/plugin install <name>@claude-plugins-official`.

- **frontend-design** — pushes generated UI toward considered typography/layout/restraint instead of generic "AI slop."
  - *Use when:* any user-facing UI work. *(Official; most-installed plugin in the marketplace.)*
- **security-guidance** — reviews every diff for injection, XSS, SSRF, exposed secrets, and auth-bypass before you see it.
  - *Always-on, negligible overhead.*
- **code-review** — parallel review subagents (bug-hunting, conventions, history-aware) for a fast second opinion before you commit.
  - *Distinct from the built-in verification skill:* this checks "is the diff itself sound," not "did it meet spec."
- **typescript-lsp** — real go-to-definition, find-references, and live type errors instead of guessing from text.
  - *Use when:* any TS work, especially across a monorepo. *(One of ~12 language-server plugins Anthropic maintains.)*
- **Semgrep Guardian** (Semgrep) — SAST scanning against thousands of rules; makes Claude regenerate until the code is clean.
  - *Use the Guardian bundle, not the deprecated standalone `semgrep/mcp` repo.*
- **skill-creator** / **mcp-server-dev** — scaffold a new skill or a custom MCP server when you hit a genuinely reusable gap.
  - *skill-creator ties into this workflow's own skill-creation flow.*

---

## 3. Standalone agent skills (`npx skills add`)

Keep this set small and deliberate — a mid-2026 benchmark found most SWE skills produced no measurable gain, and some even hurt when they conflicted with project context. Review a skill's source before installing, and treat any skill-*discovery* tool as untrusted input.

### UI / Design

*These overlap — pick one or two, don't stack them all.*

- **taste-skill** — anti-slop frontend guidance. `Leonxlnx/taste-skill`
- **ui-ux-pro-max-skill** — heavy UI/UX ruleset (161 rules, 67 styles). `nextlevelbuilder/ui-ux-pro-max-skill`
- **web-design-guidelines** (Vercel) — audits UI against 100+ a11y/UX/perf rules, fetched fresh each run. `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`
- **theme-factory** (Anthropic) — coherent color systems and type scales. From `anthropics/skills`.

### Code quality

- **react-best-practices** (Vercel) — React/Next perf & code-quality rules, prioritized by real Core Web Vitals impact. `npx skills add vercel-labs/agent-skills --skill react-best-practices`
- **nestjs-best-practices** (community) — NestJS architecture/DI/security rules. `npx skills add Kadajett/agent-nestjs-skills` *(community, several forks exist — skim before trusting.)*

### Vendor doc-skills

When you build on a specific vendor (Stripe, Paddle, etc.), their official doc-skill keeps API usage current. Add only the one you actually use.

### Utilities

- **agent-toolkit** (`softaworks/agent-toolkit`) — large collection; cherry-pick the useful ones (e.g. `database-schema-designer`, `qa-test-planner`, `naming-analyzer`, `reducing-entropy`). Don't install the whole set — poor signal-to-noise is the trap.
