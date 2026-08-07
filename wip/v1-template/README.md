# agentic-setup

A project template for AI-assisted development. Designed for **solo developers** — workflow assumes one author, one branch context, no team coordination layer.

Works with **Claude Code**, **Codex**, **Cursor**, and any tool that reads instruction files or supports skills.

---

## What's included

| What | Where | Purpose |
|------|-------|---------|
| Local skills | `.agents/skills/` | Tool-agnostic skill files |
| Local skills (symlinked) | `.claude/skills/` | Same skills, auto-discovered by Claude Code |
| Slash commands | `.claude/commands/` | Lazy-loaded one-shot commands (e.g. `/project-init`) |
| Claude settings | `.claude/settings.json` | Git mutation deny list |
| MCP servers | `.mcp.json` | Pre-wired `context7` + `playwright` |
| Instruction files | `CLAUDE.md` / `AGENTS.md` | Project context (kept in sync) |
| Setup guide | `SETUP.md` | Per-machine tool installation |
| Project spec | `docs/spec/` | Product bible + tech spec (free-form structure) |
| Active milestone | `docs/work/now.md` | Current milestone and next action |
| Roadmap | `docs/work/roadmap.md` | Loose blueprint of upcoming work |
| Milestone history | `docs/work/milestones/` | Per-milestone specs, plans, checkpoints |
| Conventions | `docs/agents/conventions.md` | Living doc — base + stack layer |
| Dev/build commands | `docs/agents/commands.md` | Living doc — dev/test/build/lint |
| Setup decisions | `docs/agents/setup-notes.md` | One-time scaffold choices; reference, not directives |
| Tool registry | `docs/agents/recommended-tools.md` | All available skills, MCPs, plugins |
| LLM doc overrides | `docs/references/llms.md` | Optional `llms.txt` overrides for specific libraries |
| `/project-init` body | `docs/agents/commands/project-init.md` | One-time init instructions (not loaded as a skill) |
| `/check-setup` body | `docs/agents/commands/check-setup.md` | Tool-agnostic setup health-check (read-only) |
| `/update-conventions` body | `docs/agents/commands/update-conventions.md` | Record new conventions or setup decisions |

---

## Quick start

### 1. Clone the template

```bash
git clone https://github.com/Adrian333Dev/agentic-setup.git my-project
cd my-project
```

### 2. Per-machine setup

Follow **SETUP.md** to install Superpowers, the Matt Pocock skills subset, and any optional MCPs / language tooling your stack needs.

### 3. Add your project documentation

Populate `docs/spec/` with a **product bible** (what you're building, A-Z) and a **detailed tech spec** (stack, architecture, decisions). Filenames and structure are free-form — see `docs/spec/README.md` for examples.

### 4. Initialize

**Claude Code:** type `/project-init` in the chat.

**Codex / others:** ask the agent to *follow the instructions in `docs/agents/commands/project-init.md`*.

Review what was filled in. Correct any wrong inferences. Start building.

### 5. Sanity check anytime

Run `/check-setup` (Claude Code) or ask the agent to *follow the instructions in `docs/agents/commands/check-setup.md`* (Codex / others). It's read-only — reports template integrity, init status, skills accessibility, and optional tooling, then prints a sorted action list for any failures or warnings.

---

## Development flow

One feature per milestone, driven by Superpowers:

```
superpowers:brainstorming     → spec.md
[grill-me]                    → stress-test (optional but recommended)
superpowers:writing-plans     → plan.md
superpowers:subagent-driven-development | executing-plans
superpowers:verification-before-completion
superpowers:requesting-code-review
superpowers:finishing-a-development-branch
→ update docs/work/now.md, adjust docs/work/roadmap.md → next milestone
```

Save session state any time with the `checkpoint` skill.

`docs/work/roadmap.md` is a loose forward-looking blueprint — formal milestones are still defined one at a time.

Once the project has accumulated domain terminology, `grill-with-docs` can replace `grill-me` for stress-testing — it writes a glossary to repo-root `CONTEXT.md` and ADRs to `docs/adr/`. Opt-in only.

---

## Skills overview

| Source | Examples | How |
|--------|----------|-----|
| **This template** | `checkpoint` | Already in `.agents/skills/` |
| **Superpowers** | core workflow chain (brainstorming, writing-plans, subagent-driven-development, …) | See SETUP.md |
| **Matt Pocock — curated subset** | `grill-me`, `caveman`, `improve-codebase-architecture`, `zoom-out`, `write-a-skill` (`grill-with-docs` optional) | See SETUP.md |
| **Claude Code plugins** | `supabase`, `sentry`, `playwright`, etc. | `claude plugin install …` per project need |

Full reference: `docs/agents/recommended-tools.md`.

---

## AI tool compatibility

| Tool | How |
|------|-----|
| **Claude Code** | `CLAUDE.md` + `.claude/settings.json` + `.claude/skills/` (symlinked) + `.claude/commands/` + `.mcp.json` |
| **Codex** | `AGENTS.md` + `.agents/skills/` + `.mcp.json` + Superpowers plugin |
| **Cursor** | `CLAUDE.md` or `AGENTS.md` + `.mcp.json` |
| **Others** | Point your tool at `CLAUDE.md` or `AGENTS.md` |

---

## Git rules

Agents using this template **never run git mutations**. No `git add`, `commit`, `push`, `reset`, `checkout`, or any destructive git command. The agent suggests commands — you run them.

Enforced via `.claude/settings.json` deny list for Claude Code, and via the instruction files for other tools.

---

## Customization

- **Add a skill:** create `<name>/SKILL.md` in `.agents/skills/`, then symlink into `.claude/skills/`.
- **Add an MCP:** add the config to `.mcp.json` under `mcpServers` (see SETUP.md for snippets).
- **Project-specific rules:** add to the *Project-specific rules* section in `CLAUDE.md` and `AGENTS.md`.
- **Update conventions / commands:** run `/update-conventions` (Claude Code) or ask the agent to follow `docs/agents/commands/update-conventions.md`. It accepts explicit rules or analyzes the session to extract patterns, then writes to `conventions.md` or `setup-notes.md` as appropriate.
- **Adjust the roadmap:** edit `docs/work/roadmap.md` whenever priorities shift.

---

## Resources

- [Superpowers](https://github.com/obra/superpowers) — core workflow skills
- [Matt Pocock's skills](https://github.com/mattpocock/skills) — engineering & productivity skills
- [Claude Code docs](https://code.claude.com/docs) — skills, MCP, settings
- `docs/agents/recommended-tools.md` — full tool ecosystem reference
