# agent-skills — overview

Repository: [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills)
Version at time of reading: 0.6.6 (plugin.json)
Cloned to: `repos/agent-skills/` (read-only)

## What it is

A curated library of 24 engineering workflow skills for AI coding agents. Each skill is a `SKILL.md` file that tells an agent *how* to follow a specific engineering process — not what the process is, but which steps to take, what to check, and what rationalizations to reject. The repo ships those skills plus the test infrastructure to prove they route correctly and change agent behavior as claimed.

The target audience is any engineering team that wants their AI agent to behave like a disciplined senior engineer rather than a code-completion machine. The skills are designed to be multi-tool: the same files install into Claude Code, Cursor, Windsurf, GitHub Copilot, OpenAI Codex, and others via their respective rules-file conventions.

## The problem it solves

An agent given "build this feature" will take the shortest path to code. It will skip the spec, write 500 lines before testing anything, commit everything in one blob, and never verify its assumptions. These skills install friction at exactly the moments where engineers slow down on purpose — before writing code, at each increment, before merging.

## Scale

- 24 skills — one `SKILL.md` each
- 87 markdown files total across the repo
- ~85,000 words total
- 24 eval case files — one JSON per skill
- 8 TOML slash commands
- 4 agent personas
- 4 hooks (2 are paired pre/post)
- 5 validator scripts (plus their test files)
- 7 shared reference files

## Directory tree

```
agent-skills/
├── skills/                     24 skills, one folder each (488K total)
│   ├── interview-me/SKILL.md
│   ├── idea-refine/            ← only skill with sub-files
│   │   ├── SKILL.md
│   │   ├── examples.md
│   │   ├── frameworks.md
│   │   ├── refinement-criteria.md
│   │   └── scripts/
│   └── … (22 more folders)
│
├── evals/                      testing (408K total)
│   ├── README.md               full spec for the eval system
│   ├── cases/                  24 JSON eval files, one per skill
│   └── fixtures/               real project files used in execution evals
│
├── docs/                       14 files (120K total)
│   ├── skill-anatomy.md        ← the skill authoring spec
│   ├── getting-started.md
│   ├── adoption-guide.md
│   ├── comparison.md
│   ├── agents.md
│   ├── developer-onboarding.md
│   └── *-setup.md              8 tool-specific install guides (Cursor, Windsurf, etc.)
│
├── scripts/                    validators (100K total)
│   ├── run-evals.js            Tier 2 (lexical routing) + Tier 3 (behavioral)
│   ├── validate-skills.js      structural linter
│   ├── validate-commands.js
│   ├── validate-artifact-paths.js
│   ├── validate-versions.js
│   └── lib/skill-lint.js       linter rules, importable
│
├── hooks/                      4 shell hooks (72K total)
│   ├── hooks.json              Claude Code hook registration
│   ├── session-start.sh        injects using-agent-skills at session start
│   ├── simplify-ignore.sh      hides marked code blocks from the agent
│   ├── sdd-cache-pre.sh        WebFetch HTTP cache (keyed by URL, ETag-gated)
│   └── sdd-cache-post.sh       (paired post hook for the cache)
│
├── references/                 7 shared checklists (72K total)
│   ├── definition-of-done.md
│   ├── security-checklist.md
│   ├── performance-checklist.md
│   ├── accessibility-checklist.md
│   ├── testing-patterns.md
│   ├── observability-checklist.md
│   └── orchestration-patterns.md
│
├── commands/                   8 slash commands (TOML format, 40K total)
│   ├── build.toml
│   ├── planning.toml
│   ├── review.toml
│   ├── ship.toml
│   ├── spec.toml
│   ├── test.toml
│   ├── code-simplify.toml
│   └── webperf.toml
│
├── agents/                     4 agent personas (32K total)
│   ├── code-reviewer.md
│   ├── security-auditor.md
│   ├── test-engineer.md
│   └── web-performance-auditor.md
│
├── README.md
├── CLAUDE.md                   configures agents working on this repo (not for users)
├── AGENTS.md                   same, for OpenAI Codex
├── CONTRIBUTING.md
├── plugin.json                 Claude Code marketplace metadata
└── .claude/ .agents/ .gemini/ .opencode/ .codex-plugin/ .claude-plugin/
    ← per-tool install configs (hooks.json, commands/, agents/ pointers)
```

## How the skills are grouped (their own grouping)

**Define** — interview-me, idea-refine, spec-driven-development
**Plan** — planning-and-task-breakdown
**Build** — incremental-implementation, test-driven-development, context-engineering, source-driven-development, doubt-driven-development, frontend-ui-engineering, api-and-interface-design
**Verify** — browser-testing-with-devtools, debugging-and-error-recovery
**Review** — code-review-and-quality, code-simplification, security-and-hardening, performance-optimization
**Ship** — git-workflow-and-versioning, ci-cd-and-automation, deprecation-and-migration, documentation-and-adrs, observability-and-instrumentation, shipping-and-launch
**Meta** — using-agent-skills

## How skills load

Skills sit in the project (or are installed globally). The agent reads skill descriptions at session start. When a task arrives, the agent matches the description vocabulary to decide which skill to load and follow. The `session-start.sh` hook force-injects `using-agent-skills` at the start of every session so the routing chart is always in context.

## Installation model

The repo supports a Claude Code marketplace plugin (`plugin.json`), which installs everything in one step. It also ships per-tool configuration in dot-folders (`.claude/`, `.agents/`, `.gemini/`, etc.) with the hook registration and slash-command wiring for each tool. Users who want only specific skills can copy individual skill folders.

## Key design bet

Skills are workflows, not reference docs. Every `SKILL.md` tells the agent what to *do* — steps, checks, and tables of excuses to reject — not facts about the subject. A skill that says "here is what TDD is" is documentation. A skill that says "write the failing test before the code; if you find yourself writing the code first, stop" is a behavioral intervention.
