# Browser Harness

A thin CDP (Chrome DevTools Protocol) layer that connects Claude Code to a real browser. ~1k lines across 4 core files. Created by the browser-use team.

## Self-improvement mechanism

The harness improves itself every run through two editable surfaces the agent writes into during execution:

- **`agent_helpers.py`** — task-specific browser helpers. When the agent hits a missing capability mid-task, it writes the helper code itself, then uses it. The helper persists for future sessions.
- **`domain-skills/`** — site-specific skills the agent generates after figuring out selectors, flows, and edge cases for a particular site. Organized by hostname. Loaded before the agent invents an approach for a site it already has a skill for.

The loop: agent attempts a task, discovers something non-obvious, writes the knowledge as code or a skill file, and next time the same site or mechanic comes up, the harness loads the prior work instead of rediscovering it.

## What makes this interesting for Flow

- **The improvement is the work itself.** There is no separate "learning" step. The agent writes helpers because it needs them to complete the current task, and those helpers happen to persist. No extraction pass, no observer, no background agent.
- **Knowledge is code, not prose.** Helpers are executable Python; domain skills are markdown with selectors and flows. Both are testable.
- **Domain skills are opt-in** (`BH_DOMAIN_SKILLS=1`). The system works without them; they are an accelerator, not a dependency.
- **Skills are agent-authored, not hand-authored.** The README explicitly asks contributors not to hand-write skills — the agent generates ones that reflect what actually works.

## Hooks and enforcement

No hooks beyond standard Claude Code integration. The harness relies on the skill file (`SKILL.md`) to carry all behavioral rules. Enforcement is by instruction, not by machinery.

## Relevance to the knowledge base design

The browser-harness model is narrowly scoped: one tool, one kind of knowledge (browser interaction patterns), stored as code. Flow's knowledge base needs to handle many domains and many kinds of knowledge (conventions, lessons, model behavior, prompt patterns). The "improvement is the work" principle is worth carrying; the storage model is too narrow.
