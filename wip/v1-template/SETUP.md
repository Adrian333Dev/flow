# Setup

One-time per-machine setup. Run these before starting development on any project using this template.

---

## 1. Superpowers

Provides the design → plan → implement → verify → ship workflow this template depends on.

### Claude Code

```bash
claude plugin install superpowers@claude-plugins-official
```

### Codex CLI

```bash
/plugins
```

Search for `superpowers`, then select **Install Plugin**.

### Codex App

In the Codex app, click **Plugins** in the sidebar. Find **Superpowers** in the Coding section and click **+** next to it.

To enable subagent skills (`dispatching-parallel-agents`, `subagent-driven-development`), add to `~/.codex/config.toml`:

```toml
[features]
multi_agent = true
```

---

## 2. Matt Pocock's skills (curated subset)

A small set of complementary engineering / productivity skills. Install once, then enable only the curated subset.

```bash
npx skills@latest add mattpocock/skills
```

The installer will ask which skills to enable. Pick this subset:

- **`grill-me`** — default stress-test skill. Pure Socratic interview, zero side effects. Used in the milestone workflow and ad hoc outside it.
- **`caveman`** — ultra-compressed response mode (~75% token reduction with no loss of technical accuracy).
- **`improve-codebase-architecture`** — surface refactoring opportunities to deepen modules.
- **`zoom-out`** — get a higher-level perspective on an unfamiliar code area.
- **`write-a-skill`** — author your own skills with proper structure.

Optional add-on once your project has real domain terminology:

- **`grill-with-docs`** — same interview style as `grill-me` but writes a domain glossary to repo-root `CONTEXT.md` and ADRs to `docs/adr/`. Not milestone-scoped. Skip on early milestones; consider it later.

Skip the rest:

- `tdd`, `diagnose` — covered by Superpowers (`test-driven-development`, `systematic-debugging`).
- `to-prd`, `to-issues`, `triage`, `setup-matt-pocock-skills` — built around GitHub / Linear issue trackers; this template uses milestone folders, not issues.
- `git-guardrails-claude-code` — `.claude/settings.json` deny list already covers this.
- `migrate-to-shoehorn`, `scaffold-exercises`, `setup-pre-commit` — niche / stack-specific.

You can always add more later via the same installer.

---

## 3. Optional language tooling

Install only if your project uses these.

### TypeScript Language Server (Claude Code LSP)

```bash
npm install -g typescript-language-server typescript
```

---

## 4. MCP servers

This template pre-wires `context7` and `playwright` in two config files — both are checked in:

| File | Used by |
|------|---------|
| `.mcp.json` | Claude Code |
| `.codex/config.toml` | Codex |

Both run via `npx` on demand — no install required.

For Playwright, install browser binaries once:

```bash
npx playwright install
```

### Optional MCPs

Add to `.mcp.json` (Claude Code) **and** `.codex/config.toml` (Codex) when adding new MCPs. Full list: `docs/agents/recommended-tools.md`.

#### Supabase

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_SUPABASE_ACCESS_TOKEN"
      }
    }
  }
}
```

Get your access token: https://supabase.com/dashboard/account/tokens

#### Stripe

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com",
      "headers": {
        "Authorization": "Bearer YOUR_STRIPE_SECRET_KEY"
      }
    }
  }
}
```

#### Shadcn/ui

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

#### Inngest (local dev server)

Start the Inngest dev server first (`npx inngest-cli@latest dev`), then add:

```json
{
  "mcpServers": {
    "inngest-dev": {
      "url": "http://127.0.0.1:8288/mcp"
    }
  }
}
```

---

## 5. Initialize the project

After cloning this template and adding documentation to `docs/spec/` (a product bible and tech spec — named and split however suits the project), initialize:

**Claude Code:** `/project-init`

**Codex / others:** ask the agent to *follow the instructions in `docs/agents/project-init.md`*.

---

## 6. Verify the setup (anytime)

If something feels off — after pulling template updates, on a fresh machine, or just as a smoke test — run the check. It's read-only.

**Claude Code:** `/check-setup`

**Codex / others:** ask the agent to *follow the instructions in `docs/agents/check-setup.md`*.

It reports template integrity, initialization status, skills accessibility, and optional tooling — then prints a sorted action list for any failures or warnings.

> Named `check-setup` rather than `doctor` to avoid colliding with Claude Code's built-in `/doctor` command, which checks Claude Code itself.
