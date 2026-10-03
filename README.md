# Flow

**Flow is a complete development workflow for Claude Code.** It takes a raw idea and finds every decision the project needs, including the ones you never raised. It researches the open ones, settles each one with you, and tests the design against real cases before any code exists. It cuts the design into tickets, then plans, builds and reviews each one. It carries the work from one session to the next. Everything it learns about your preferences, your tools and its own mistakes goes back into its skills, its rules and a wiki that every project shares. Each project starts with what the last one taught it.

```text
Design    idea → every decision mapped → researched → settled with you → tested on real cases → design written down
Build     tickets → plan → build → review → handoff to the next session
Improve   preferences, tool knowledge, mistakes → filed into skills, rules and the wiki ↺ the next project
```

> [!WARNING]
> **Flow is almost ready.** Hold off installing until the full release. Until then, explore it: the [Overview](docs/overview.md) shows how it works, [Walkthroughs](docs/walkthroughs.md) follows every kind of work from idea to shipped code, and [the docs](docs/README.md) cover the rest.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/main/install.sh | bash
```

Needs Claude Code 2.1.287 or later, `git`, `node`, `gh` and a GitHub account. Runs on Linux, macOS and Windows through WSL. Built and tested on Claude's 5.5 models. [Install](docs/install.md) walks through the setup.

## How Flow compares

Skill sets teach the agent each step. Flow also runs everything between the steps.

|  | Flow | [Superpowers](https://github.com/obra/superpowers) | [Agent Skills](https://github.com/addyosmani/agent-skills) | [mattpocock/skills](https://github.com/mattpocock/skills) |
|---|---|---|---|---|
| **Design before code** | Pushes the idea past your first take: questions the premise, researches every unknown, stress-tests the design, cuts it into tickets | Brainstorm into a spec | Interview into a spec | Interview, or decision tickets |
| **Task tracking** | A ticket CLI built for agents: enforced statuses, dependencies, subtasks. Kept in git, so no work gets lost | Plan files with checkboxes | A todo file | Your issue tracker, or local files |
| **Long sessions** | Auto handoff when the context grows large. The ticket stays current, so a fresh session resumes instantly | Resumes a plan at its first open task | No | A handoff skill |
| **Self-improvement** | Captures every correction and lesson as you work, and turns them into its own rules, skills and memory | No | No | A project glossary |
| **Rule enforcement** | Writes automatic checks for its rules and runs them on every edit, so broken rules get caught | Instructions only | Instructions only | No |
| **Multi-machine sync** | Memory, rules, skills, tickets, even uncommitted code, synced across your computers through a private GitHub repository | Only what you commit | Only what you commit | Only what you commit |
| **Skill management** | Replaces Vercel's `npx skills`, adding auto-updates, per-project switches and per-project tweaks | No | No | No |
| **Installation** | Adopts your existing rules, skills and plugins once you approve. Uninstall restores everything | Plugin install | `npx skills add` | Plugin or `npx skills add` |
| **Hooks and guardrails** | 12 hooks, 40+ commands: no permission prompts, risky commands stopped, subagent work verified, failures logged and fixed | 1 hook, at session start | 1 hook, 2 optional | 1 optional git guard |
| **Supported agents** | Claude Code | Claude Code, Codex, Cursor and 7 more | 70+ through skills.sh | Claude Code, and others through skills.sh |

## Coming next

In priority order:

- **Flow built into Claude Code**, through [mods](https://code.claude.com/docs/en/plugins/mods/overview): code that runs inside Claude Code itself and can draw on its screen. A ticket board in its own pane, with buttons that move tickets while Claude works. Every reply checked against Flow's rules before you read it. Sessions on one repository kept from editing over each other. Rules loaded the moment a matching file is written.
- **Flow for teams**: assignees, roles, a dashboard showing who works on what, and tickets connected to the tracker your team already uses: GitHub Issues, GitHub Projects, Jira, Linear and more.
- **More agents and models**: Codex first, then open-source models.

## Documentation

- **[Overview](docs/overview.md)**: how Flow works, start to finish. Start here.
- **[Flow's documentation](docs/README.md)**: every page, grouped by what you came to do.
- **[Changing Flow](docs/dev/README.md)**: the repository, the tests, and adding a skill or a command.
