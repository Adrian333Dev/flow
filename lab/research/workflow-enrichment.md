# ChatGPT

Below is a **research-filtered shortlist** I would put into an “Optional Recommended Tools” document for your setup.

I treated your existing template as a hard exclusion list: **no brainstorming/specification, planning, task execution/delegation, external research, diagramming/visualization, passive context capture/checkpoints, debugging, or completion verification**. I also favored tools that are useful across multiple projects and avoided recommending a tool merely because it is popular.

A key conclusion from the research: **the highest-value additions are capability-specific integrations and guardrails, not more orchestration.** MCP, plugins, and skills are complementary extension layers, but skills in particular should be selected narrowly: a 2026 benchmark found that most tested SWE skills produced no measurable improvement, while a small minority of specialized skills produced substantial gains. ([arXiv][1])

---

# Optional Recommended Tools

## 1. MCP servers

### 1. GitHub MCP Server

- **What it does:** Gives Claude structured access to repositories, issues, pull requests, branches, files, and GitHub API operations.
- **Use when:** You want Claude to work with GitHub state without relying entirely on ad-hoc `gh`/REST commands—especially for PR/issue triage, repository inspection, and GitHub-native workflows.
- **Install/source:** Use the official GitHub MCP Server and Claude Code MCP configuration; prefer the maintained official implementation rather than older community forks.
- **Maturity:** **Very high / official.** GitHub is one of the most adopted MCP integrations in current ecosystem rankings. ([SFEIR Institute][2])

### 2. Playwright MCP

- **What it does:** Lets the agent control a real browser through Playwright: navigate, inspect accessibility snapshots, interact with pages, and test user-facing flows.
- **Use when:** You need browser-level interaction, manual exploratory testing, authenticated web-app workflows, or reproduction of behavior that cannot be understood from source alone.
- **Install/source:** `npx @playwright/mcp@latest`
- **Maturity:** **Very high / official Playwright project.** Requires Node.js 20+ and is actively maintained. ([Playwright][3])

### 3. Chrome DevTools MCP

- **What it does:** Exposes Chrome DevTools capabilities to the agent for inspecting live pages, performance, network behavior, console output, and browser state.
- **Use when:** The problem is specifically runtime browser behavior—performance, network requests, rendering, console errors, or debugging a running web application.
- **Install/source:** Official `ChromeDevTools/chrome-devtools-mcp` repository; install according to its current README.
- **Maturity:** **High / Google-maintained open source.** The project was actively releasing in May 2026, including support for third-party developer tools. ([GitHub][4])

### 4. Context7 MCP

- **What it does:** Retrieves current, version-aware library documentation and code examples directly into the agent context.
- **Use when:** You are using a fast-moving framework or library and want the agent to consult the relevant version's actual documentation rather than relying on model memory.
- **Install/source:** Install the Context7 MCP integration through the official Claude Code plugin marketplace or Context7's current documentation.
- **Maturity:** **High / widely adopted.** It is included among the most-installed official Claude Code marketplace integrations. ([Claude][5])

### 5. Sentry MCP

- **What it does:** Gives the agent access to application errors, issues, traces, and related runtime diagnostics from Sentry.
- **Use when:** You want the agent to investigate production failures using real observability data rather than only local source and logs.
- **Install/source:** Use Sentry's official MCP integration and current Claude Code setup instructions.
- **Maturity:** **High / vendor-backed.** Prefer the official hosted integration over third-party Sentry MCP wrappers.

### 6. Figma MCP

- **What it does:** Provides structured access to Figma design context, components, variables, layout data, and design-to-code workflows.
- **Use when:** A project has a real Figma source of truth and you need Claude to translate existing design artifacts into implementation or keep implementation aligned with design-system data.
- **Install/source:** `claude plugin install figma@claude-plugins-official`
- **Maturity:** **Very high / official Figma integration.** Figma recommends the remote MCP server for most users, and the Claude Code plugin bundles the MCP setup with relevant skills. ([Figma Help Center][6])

### 7. Notion MCP

- **What it does:** Lets the agent read and work with Notion pages and workspace content.
- **Use when:** Project knowledge, product decisions, operational notes, or documentation live in Notion and Claude needs to consult or update that source of truth.
- **Install/source:** Use Notion's official hosted MCP server through Claude Code's HTTP MCP configuration.
- **Maturity:** **High / official vendor integration**, though operational behavior and context cost should be monitored; avoid unofficial clones unless you have a specific reason. ([Claude][7])

### 8. Supabase MCP

- **What it does:** Connects Claude to Supabase projects for database, schema, and platform operations.
- **Use when:** You are actively building on Supabase and want the agent to inspect or operate on the actual project rather than reasoning from copied schema snippets.
- **Install/source:** Use Supabase's official MCP integration and current Claude Code setup.
- **Maturity:** **High / vendor-backed.** Particularly useful for full-stack development, but scope credentials carefully and prefer project-scoped access.

### 9. Stripe MCP

- **What it does:** Provides structured access to Stripe APIs and account/development resources.
- **Use when:** Implementing or inspecting payments, customers, products, subscriptions, webhooks, and billing flows.
- **Install/source:** Use Stripe's official MCP integration.
- **Maturity:** **High / vendor-backed.** Especially valuable because payment APIs and object models change frequently.

### 10. Cloudflare MCP

- **What it does:** Connects the agent to Cloudflare's developer platform and infrastructure capabilities.
- **Use when:** Working with Workers, Pages, KV, R2, D1, or other Cloudflare services.
- **Install/source:** Use Cloudflare's official MCP integration.
- **Maturity:** **High / vendor-backed.** A good example of a platform MCP that is useful across many projects without being tied to a particular application architecture.

### 11. Sequential Thinking MCP — **conditional**

- **What it does:** Provides a structured reasoning tool for decomposing complex problems into explicit steps.
- **Use when:** A task genuinely benefits from externally represented intermediate reasoning.
- **Install/source:** Official MCP ecosystem implementation.
- **Maturity:** **Mature, but low priority for your template.**
- **Recommendation:** **Skip for your setup unless you have a specific use case.** Your existing planning and execution workflow already covers much of the value, so this risks duplicating your in-house system.

---

## 2. Claude Code plugins

### 12. Security Guidance

- **What it does:** Adds pre-edit security warnings for dangerous patterns such as command injection, XSS, unsafe `eval`/`Function`, unsafe deserialization, and related vulnerabilities.
- **Use when:** You want a lightweight security guardrail operating during code edits, particularly in a solo-developer workflow where there is no separate security engineer.
- **Install:** `/plugin install security-guidance@claude-plugins-official`
- **Maturity:** **Very high / Anthropic Verified.** It is specifically designed as an automatic pre-tool security hook. ([Claude][8])

### 13. Commit Commands

- **What it does:** Provides commands for intelligent commits, push workflows, PR creation, and cleanup of deleted remote branches.
- **Use when:** You want to reduce repetitive Git ceremony while keeping the actual implementation workflow under your existing system.
- **Install:** `/plugin install commit-commands@claude-plugins-official`
- **Maturity:** **Very high / Anthropic Verified**, with substantial adoption.
- **Caveat:** This is **Git workflow automation**, not task execution or implementation orchestration, so it does not materially overlap with your excluded categories. ([Claude][5])

### 14. Frontend Design

- **What it does:** Helps Claude produce distinctive, production-grade frontend interfaces rather than generic AI-generated UI.
- **Use when:** You are building a customer-facing interface and want stronger visual direction, typography, composition, motion, and design-system decisions.
- **Install:** `/plugin install frontend-design@claude-plugins-official`
- **Maturity:** **Very high / Anthropic Verified**, with more than one million marketplace installs reported.
- **Caveat:** This is specifically **design execution**, not brainstorming or product specification, so it complements rather than duplicates your existing workflow. ([Claude][9])

### 15. Code Review

- **What it does:** Performs focused AI-assisted review of code and pull requests, with specialized review agents and confidence-oriented filtering.
- **Use when:** You want an independent second pass on a change set before merging.
- **Install:** `/plugin install code-review@claude-plugins-official`
- **Maturity:** **Very high / Anthropic Verified.**
- **Caveat:** This is a review capability, not debugging or completion verification. It is worth keeping separate if your in-house “verification” skill is focused on proving task completion rather than adversarially reviewing code quality/security. ([Claude][5])

### 16. Figma

- **What it does:** Bundles the official Figma MCP connection and agent skills for Claude Code.
- **Use when:** You regularly move between design files and implementation.
- **Install:** `claude plugin install figma@claude-plugins-official`
- **Maturity:** **Very high / official Figma + Anthropic marketplace integration.** ([Figma Help Center][6])

### 17. MCP Server Development

- **What it does:** Helps scaffold and develop custom MCP servers.
- **Use when:** You repeatedly need a project-specific integration that does not justify a full standalone service or existing MCP server.
- **Install:** `/plugin install mcp-server-dev@claude-plugins-official`
- **Maturity:** **High / official Anthropic plugin.** The official Claude Code documentation explicitly recommends it for scaffolding local stdio or remote HTTP MCP servers. ([Claude][7])

---

## 3. Standalone agent skills

These are the most useful candidates for the `npx skills add` ecosystem, but I would be **more selective here than with MCP**. The ecosystem is growing extremely quickly, and research suggests that many skills add little value or can even hurt when their instructions conflict with the project context. ([arXiv][1])

### 18. `skill-creator` — Anthropic

- **What it does:** Teaches the agent how to create, structure, and improve reusable Agent Skills.
- **Use when:** You are extending your own template with a genuinely reusable capability rather than writing another one-off instruction file.
- **Install/source:** `npx skills add https://github.com/anthropics/skills`
- **Maturity:** **Very high / official Anthropic repository.** ([GitHub][10])

### 19. `MCP Integration` — Anthropic

- **What it does:** Provides procedural guidance for configuring MCP servers inside Claude Code plugins and projects.
- **Use when:** You are adding or maintaining MCP integrations and want the agent to follow current transport, configuration, authentication, and plugin conventions.
- **Install:** `npx skills add https://github.com/anthropics/claude-code --skill "MCP Integration"`
- **Maturity:** **Very high / official Anthropic skill.** ([MCP Servers][11])

### 20. `webapp-testing` — Anthropic

- **What it does:** Provides repeatable guidance for testing web applications using browser automation.
- **Use when:** You need a browser-level test workflow that complements Playwright MCP rather than replacing it.
- **Install/source:** `npx skills add https://github.com/anthropics/skills`
- **Maturity:** **High / official Anthropic skill repository.** ([GitHub][10])

### 21. `code-review` — Block

- **What it does:** Provides a structured code-review checklist covering functionality, edge cases, error handling, testing, and related quality concerns.
- **Use when:** You want a portable review rubric that can be used across Claude Code and other Agent Skills-compatible agents.
- **Install:** `npx skills add https://github.com/block/agent-skills --skill code-review`
- **Maturity:** **Promising / actively maintained**, but substantially smaller and less proven than Anthropic's official Code Review plugin. ([Skills][12])

### 22. Paddle Agent Skills

- **What it does:** Provides procedural skills for Paddle catalog setup, checkout, webhooks, subscriptions, and synchronization workflows.
- **Use when:** You are building SaaS products using Paddle and want current, vendor-authored integration knowledge.
- **Install:** `npx skills add https://developer.paddle.com/`
- **Maturity:** **High / official vendor release, May 2026.** Also available as an official Claude Code plugin with the Paddle docs MCP server. ([Paddle Developer Docs][13])

### 23. `find-skills` — ecosystem discovery

- **What it does:** Helps an agent discover relevant skills from the broader Agent Skills ecosystem.
- **Use when:** You have a specific capability gap and want to find candidates rather than manually browsing thousands of skills.
- **Install/source:** Use the current `skills.sh` / Vercel Labs skills ecosystem.
- **Maturity:** **High ecosystem relevance, but treat discovery as untrusted input.**
- **Important:** I would **not automatically install whatever it recommends**. Review the actual skill source first. The ecosystem has had reports of malicious or suspicious skills, and current research specifically identifies skill provenance and lifecycle security as an important problem. ([Skills][14])

---

# My actual recommendation for your template

I would **not install all 23**. For a solo TypeScript full-stack developer, I would start with this compact baseline:

### Core

1. **GitHub MCP**
2. **Playwright MCP**
3. **Context7 MCP**
4. **Chrome DevTools MCP**
5. **Security Guidance plugin**
6. **Commit Commands plugin**
7. **Code Review plugin**

### Add when relevant

8. **Sentry MCP** — production observability
9. **Figma MCP/plugin** — design-driven work
10. **Supabase MCP** — Supabase projects
11. **Stripe MCP** — billing
12. **Cloudflare MCP** — Workers/platform work
13. **Notion MCP** — if Notion is a real source of truth

### Skills: keep the set deliberately small

14. **Anthropic `skill-creator`**
15. **Anthropic `MCP Integration`**
16. **Anthropic `webapp-testing`**
17. **One domain-specific vendor skill only when you actually use that vendor**

---

# What I would explicitly _not_ recommend

- **Generic “superpowers”/orchestration bundles** — too much overlap with your existing workflow.
- **Planning/specification skills** — redundant by definition.
- **Research/search skills** — already covered in-house and better handled through your existing research workflow.
- **Generic debugging skills** — redundant.
- **Generic “task manager” or autonomous execution plugins** — redundant and likely to interfere with your workflow architecture.
- **Large collections of miscellaneous skills** — poor signal-to-noise ratio and increased prompt/context surface.
- **Unmaintained MCP wrappers** around services that now have official integrations.
- **Random skills installed directly from marketplaces without source review.**

The security point is not theoretical: MCP servers and skills are executable capability extensions, and recent research has identified meaningful security risks across the skill lifecycle. There have also been real-world incidents involving malicious third-party AI plugins and suspicious community skills. I would therefore treat **source provenance, recent commits/releases, permissions, network access, and install scripts as part of the maturity evaluation**, not as an afterthought. ([The JetBrains Blog][15])

**Bottom line:** for your particular template, the best additions are **MCPs that connect Claude to live external state, plugins that add narrow safety/productivity capabilities, and a very small number of specialized skills**. Avoid adding another meta-layer for thinking, planning, delegation, or project memory—the areas your template already owns are precisely where the current ecosystem has the most redundant tooling.

[1]: https://arxiv.org/abs/2603.15401?utm_source=chatgpt.com "SWE-Skills-Bench: Do Agent Skills Actually Help in Real-World Software Engineering?"
[2]: https://institute.sfeir.com/en/claude-code/claude-code-mcp-model-context-protocol/?utm_source=chatgpt.com "MCP: Model Context Protocol | SFEIR Institute"
[3]: https://playwright.dev/mcp/installation?utm_source=chatgpt.com "Installation | Playwright"
[4]: https://github.com/ChromeDevTools/chrome-devtools-mcp/releases?utm_source=chatgpt.com "Releases · ChromeDevTools/chrome-devtools-mcp · GitHub"
[5]: https://claude.com/plugins/commit-commands?utm_source=chatgpt.com "Commit Commands Plugin | Claude by Anthropic"
[6]: https://help.figma.com/hc/en-us/articles/39888612464151-Claude-Code-and-Figma-Set-up-the-MCP-server?utm_source=chatgpt.com "Claude Code and Figma: Set up the MCP server – Figma Learn - Help Center"
[7]: https://code.claude.com/docs/en/mcp?utm_source=chatgpt.com "Connect Claude Code to tools via MCP - Claude Code Docs"
[8]: https://claude.com/plugins/security-guidance?utm_source=chatgpt.com "Security Guidance Plugin | Claude by Anthropic"
[9]: https://claude.com/plugins/frontend-design?utm_source=chatgpt.com "Frontend Design Plugin | Claude by Anthropic"
[10]: https://github.com/anthropics/skills?utm_source=chatgpt.com "GitHub - anthropics/skills: Public repository for Agent Skills · GitHub"
[11]: https://mcpservers.org/agent-skills/anthropic/mcp-integration?utm_source=chatgpt.com "MCP Integration | Agent Skills Library"
[12]: https://www.skills.sh/block/agent-skills/code-review?utm_source=chatgpt.com "code-review — block/agent-skills"
[13]: https://developer.paddle.com/changelog/2026/agent-skills-claude-code-plugin/?utm_source=chatgpt.com "Build Paddle integrations faster with agent skills and the Claude Code plugin"
[14]: https://www.skills.sh/docs?utm_source=chatgpt.com "Documentation | Skills"
[15]: https://blog.jetbrains.com/platform/2026/06/marketplace-ecosystem-security-update-malicious-ai-plugins/?utm_source=chatgpt.com "JetBrains Marketplace Ecosystem Security Update: Addressing Malicious Third-Party AI Plugins - The JetBrains Blog"

# Gemini

Since your monorepo template already handles the heavy lifting of planning, execution, web research, memory, and debugging, I have completely excluded the usual recommendations in those categories (e.g., Linear, Puppeteer/Playwright, memory-graph plugins, and Sentry).

Instead, here are 20 highly active tools for mid-2026 that focus strictly on deep code intelligence, infrastructure observability, and specialized API integrations.

_(Note: I have specifically excluded several of the original 2024/2025 Anthropic reference servers that are now abandoned/archived, prioritizing vendor-maintained and active community builds.)_

### 1. Model Context Protocol (MCP) Servers

These give Claude Code secure, natural-language access to your local environment and external cloud platforms.

- **GitHub MCP**
- **What it does:** Reads repositories, manages issues, and interacts with GitHub APIs.
- **Use when:** You need Claude to pull context from related PRs or codebase history without leaving the terminal.
- **Install:** `claude mcp add github -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server`
- **Maturity:** Vendor-maintained (GitHub/Microsoft). Highly stable and universally supported.

- **Supabase MCP**
- **What it does:** Provides full access to your Supabase Postgres database, auth, and storage state.
- **Use when:** You need Claude to inspect raw production/staging data to inform feature logic or write complex migrations.
- **Install:** `claude mcp add supabase -- npx -y @supabase/mcp-server-supabase`
- **Maturity:** Vendor-maintained. The best choice if you are on the Supabase stack.

- **PostgreSQL MCP**
- **What it does:** Runs relational queries, explores schemas, and describes table relationships.
- **Use when:** You are running a standard Node/Express backend and need the agent to understand your raw SQL schema layout.
- **Install:** `claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres`
- **Maturity:** Official reference build [cite: 1.4.1]. _(Note: Replaces the archived 2024 version.)_

- **Notion MCP**
- **What it does:** Reads existing Notion pages and databases into the agent's context.
- **Use when:** You want Claude to pull specific copy strings, API keys, or product requirements from team wikis.
- **Install:** `claude mcp add notion -- npx -y @notionhq/notion-mcp-server`
- **Maturity:** Vendor-maintained.

- **Stripe MCP**
- **What it does:** Creates and queries payments, customers, and invoices programmatically.
- **Use when:** You are building billing flows and need the agent to interact with Stripe test mode without writing curl scripts.
- **Install:** `claude mcp add stripe -- npx -y @stripe/mcp-server`
- **Maturity:** Vendor-maintained [cite: 1.4.2].

- **Figma MCP**
- **What it does:** Pulls design frames, components, and CSS tokens directly from Figma files.
- **Use when:** You are translating mockups into React components and want the agent to extract exact Tailwind values from the design system.
- **Install:** `claude mcp add figma -- npx -y @figma/mcp-server`
- **Maturity:** Vendor-maintained [cite: 1.4.2].

- **Docker MCP**
- **What it does:** Inspects local container status, logs, and configurations.
- **Use when:** You need Claude to understand the state of your local dev environment or containerized TypeScript services.
- **Install:** `claude mcp add docker -- npx -y docker-mcp`
- **Maturity:** Active community build [cite: 1.4.1].

- **Vercel MCP**
- **What it does:** Connects to Vercel deployments, fetching logs, build context, and environment variables.
- **Use when:** You are deploying a Next.js/React app and need the agent to check deployment infrastructure configurations.
- **Install:** `claude mcp add vercel -- npx -y @vercel/mcp-server`
- **Maturity:** Vendor-maintained [cite: 2.1.2].

- **Slack MCP**
- **What it does:** Reads Slack threads and posts updates.
- **Use when:** You want Claude to pull context from an engineering discussion or post an automated update when a local build finishes.
- **Install:** `claude mcp add slack -- npx -y @zencoder/slack-mcp`
- **Maturity:** Maintained by Zencoder (took over the archived Anthropic reference) [cite: 1.1.2].

- **n8n MCP**
- **What it does:** Triggers and monitors self-hosted n8n workflow pipelines.
- **Use when:** You want your coding agent to trigger a broader background pipeline (like database syncing) without pausing your active session.
- **Install:** `claude mcp add n8n -- npx -y n8n-mcp`
- **Maturity:** Active community build.

### 2. Claude Code Plugins

These are installed natively via Claude Code's plugin manager to enhance its core capabilities.

- **TypeScript LSP**
- **What it does:** Connects Claude's built-in Language Server Protocol (LSP) tool to your TS environment.
- **Use when:** Working in large monorepos where Claude needs to accurately jump to definitions, find references, and view exact type errors immediately after edits.
- **Install:** `/plugin install typescript-lsp@claude-plugins-official`
- **Maturity:** Official Anthropic plugin. Essential for TS developers.

- **Context7**
- **What it does:** Injects up-to-date, version-specific library documentation into the context window.
- **Use when:** You are working with fast-moving beta libraries or specific older versions of React/Node packages and want to prevent hallucinated APIs.
- **Install:** `/plugin install context7@claude-community`
- **Maturity:** Highly rated community plugin [cite: 2.1.2].

- **PR Review Toolkit**
- **What it does:** Provides structured, agent-driven peer review focusing on security, types, and simplification.
- **Use when:** You want a deep structural review of your codebase before merging, distinct from a standard test runner.
- **Install:** `/plugin install pr-review-toolkit@claude-plugins-official`
- **Maturity:** Official Anthropic plugin.

- **Design (Labs)**
- **What it does:** specialized commands for UX/UI accessibility audits and avoiding generic "AI-looking" interface patterns.
- **Use when:** You are polishing the frontend of your React application and want strict adherence to accessibility standards.
- **Install:** `/plugin install design@claude-plugins-official`
- **Maturity:** Official Anthropic plugin (released early 2026).

- **Engineering**
- **What it does:** Automates engineering toil like drafting release notes, formatting runbooks, and summarizing commit history.
- **Use when:** You need to rapidly translate code changes into structured engineering documentation for your template.
- **Install:** `/plugin install engineering@claude-plugins-official`
- **Maturity:** Official Anthropic plugin (released early 2026) [cite: 2.1.1].

- **Semgrep**
- **What it does:** Local security scanning for dependencies and code vulnerabilities.
- **Use when:** You are finalizing an API route and want the agent to proactively spot injection risks or dependency flaws.
- **Install:** `/plugin install semgrep@claude-plugins-official`
- **Maturity:** Official Anthropic plugin [cite: 2.1.2].

### 3. Standalone Agent Skills

Skills are lightweight markdown files that use "progressive disclosure" — they load only their name/description initially, pulling in full SDK instructions only when the task requires it to save context window tokens.

- **Vercel AI SDK Skill**
- **What it does:** Specialized, up-to-date instructions for implementing the Vercel AI SDK.
- **Use when:** You are building streaming UI, tools, or agents directly into your Next.js/React frontend.
- **Install:** `npx skills add vercel/ai`
- **Maturity:** Vendor-maintained (Vercel).

- **Claude API Skill**
- **What it does:** Provides exact reference material for building applications on Anthropic surfaces (Messages API and Managed Agents).
- **Use when:** You are integrating Claude into your own Node backend and need the agent to use the latest SDK patterns without relying on outdated training data.
- **Install:** `npx skills add [https://github.com/anthropics/skills](https://github.com/anthropics/skills) --skill claude-api` (Note: ships bundled with Claude Code, but useful to add to the project universally) [cite: 1.3.1].

- **Stripe Docs Skill**
- **What it does:** Loads Stripe's latest SDK patterns, API references, and best practices.
- **Use when:** Implementing Stripe Connect or custom checkout flows where API versions change rapidly.
- **Install:** `npx skills add [https://docs.stripe.com](https://docs.stripe.com)`
- **Maturity:** Vendor-maintained [cite: 2.4.2].

- **Patterns.dev React Skill**
- **What it does:** Enforces modern architectural patterns, performance optimization, and best practices for React.
- **Use when:** Refactoring older React components to ensure they meet 2026 performance and structural standards.
- **Install:** `npx skills add PatternsDev/skills/react`
- **Maturity:** Community maintained by Patterns.dev [cite: 2.3.1].

# DeepSeek Instant

Here’s a curated set of optional tools for mid-2026 that complement—rather than duplicate—the workflow skills you already have.

---

## Category 1: MCP Servers

_Connect Claude Code to external systems, databases, and APIs via the Model Context Protocol._

### 1. GitHub MCP Server

**What it does:** Lets Claude read issues, review PRs, search repositories, and open pull requests directly.  
**Use when:** You want Claude to act on your repo—triage issues, review PRs, or automate GitHub workflows without leaving the terminal.  
**Install:** `claude mcp add github https://api.github.com/mcp` (remote OAuth) or local via `npx -y @modelcontextprotocol/server-github`.  
**Maturity:** Production-ready, maintained by GitHub, 30,800+ GitHub stars.

### 2. Context7 MCP Server

**What it does:** Pulls fresh, version-specific documentation for 50+ frameworks (Next.js 15, React, Tailwind 4.0, etc.) directly into Claude’s context.  
**Use when:** You need accurate, up-to-date API references—especially for recently updated libraries where Claude’s training data may be stale.  
**Install:** `claude mcp add context7 https://mcp.context7.com/mcp`.  
**Maturity:** Actively maintained by Upstash; widely used.

### 3. Playwright MCP Server

**What it does:** Exposes full browser automation—launch a headless browser, navigate, interact with UI elements, run JavaScript, and return structured results.  
**Use when:** You need end-to-end testing, web scraping, or UI interaction validation that Claude can drive programmatically.  
**Install:** `claude mcp add playwright npx -y @modelcontextprotocol/server-playwright`.  
**Maturity:** Production-ready, maintained by Microsoft.

### 4. Sentry MCP Server

**What it does:** Connects Claude to error and performance data—pull a specific issue, its stack trace, and related events for debugging against real production failures.  
**Use when:** You’re fixing bugs already reported as Sentry issues and want Claude to read the full error context.  
**Install:** `claude mcp add sentry https://mcp.sentry.dev/mcp` (remote OAuth).  
**Maturity:** Production-ready, maintained by Sentry.

### 5. Supabase MCP Server

**What it does:** Direct line from Claude into your Supabase backend—manage tables, query data, inspect schema, manage auth, and invoke edge functions.  
**Use when:** Your project runs on Supabase and you want Claude to interact with your full backend stack.  
**Install:** `claude mcp add supabase https://mcp.supabase.com/mcp?project_ref=<your-ref>` (remote OAuth).  
**Maturity:** Actively maintained by Supabase community; recommended for dev environments only.

### 6. Jira / Confluence MCP Server (Atlassian)

**What it does:** Puts Jira and Confluence inside Claude—search tickets with JQL, update statuses, add comments, create tickets, and pull documentation.  
**Use when:** Your team tracks work in Jira and you want to generate or update tickets from code context without context-switching.  
**Install:** `claude mcp add atlassian https://mcp.atlassian.com/v1/mcp` (remote OAuth).  
**Maturity:** Production-ready, maintained by Atlassian.

### 7. AWS MCP Server Suite (AWS Labs)

**What it does:** Suite of MCP servers covering documentation, core AWS APIs, CDK, cost analysis, and specific services.  
**Use when:** You’re working in AWS and need Claude to read service docs, scaffold infrastructure, or query account state.  
**Install:** Clone and configure from `github.com/awslabs/mcp`; install only the servers you need.  
**Maturity:** Actively maintained by AWS Labs, 9,300+ stars.

### 8. Cloudflare MCP Servers

**What it does:** Lets Claude manage Workers, KV, R2, D1, and observability data via authenticated remote HTTP.  
**Use when:** Your stack runs on Cloudflare’s developer platform and you want Claude to build, inspect, or deploy Workers apps.  
**Install:** Remote OAuth servers; see `github.com/cloudflare/mcp-server-cloudflare`.  
**Maturity:** Production-ready, maintained by Cloudflare.

### 9. Grafana MCP Server

**What it does:** Lets Claude query dashboards, datasources, Prometheus and Loki data, and incidents—turning observability into something Claude can read during debugging.  
**Use when:** You’re diagnosing production issues and want Claude to correlate metrics, logs, and alerts.  
**Install:** `claude mcp add grafana npx -y @modelcontextprotocol/server-grafana`.  
**Maturity:** Production-ready, maintained by Grafana Labs.

### 10. Stripe MCP Server

**What it does:** Lets Claude work with the Stripe API—create products and prices, inspect customers and subscriptions, and search Stripe documentation.  
**Use when:** You’re building or debugging Stripe integrations and want Claude to test against the real API surface.  
**Install:** `claude mcp add stripe https://mcp.stripe.com/mcp`.  
**Maturity:** Production-ready, maintained by Stripe.

### 11. Notion MCP Server

**What it does:** Connects Claude to Notion workspaces—read and write pages and databases.  
**Use when:** Your specs, runbooks, or task tracking live in Notion and you want Claude to pull requirements or update status.  
**Install:** `claude mcp add notion https://mcp.notion.com/mcp`.  
**Maturity:** Production-ready, official Notion server.

### 12. Figma MCP Server

**What it does:** Connects Claude to Figma layout data, component structures, design tokens, and variables—enabling design-to-code generation.  
**Use when:** You need to implement designs from Figma and want Claude to generate code that matches actual layout, spacing, and component hierarchy.  
**Install:** `claude mcp add figma https://mcp.figma.com/mcp` (remote).  
**Maturity:** Production-ready, maintained by Figma.

### ⚠️ Skip: PostgreSQL Official MCP

**Reason:** Anthropic archived it in 2025; unmaintained and has a known SQL-injection flaw that bypassed its read-only guarantee. Use Supabase or a community-maintained Postgres server instead.

---

## Category 2: Claude Code Plugins

_Packaged bundles of skills, MCP server references, slash commands, sub-agents, and hooks—installable from the official marketplace._

> **Note:** The official Anthropic marketplace (`claude-plugins-official`) is auto-installed on Claude Code startup. Run `/plugin` in Claude Code to browse, or `/plugin install <name>@claude-plugins-official` to install.

### 13. mcp-server-dev

**What it does:** Scaffolds custom MCP servers (remote HTTP or local stdio) based on your use case.  
**Use when:** You need to build a custom MCP server for an internal tool or API not covered by existing servers.  
**Install:** `/plugin install mcp-server-dev@claude-plugins-official`.  
**Maturity:** Official Anthropic plugin; actively maintained.

### 14. Code Intelligence Plugins (LSP)

**What it does:** Enables Claude’s built-in LSP tool—jump to definitions, find references, and see type errors immediately after edits.  
**Use when:** You want symbol-level navigation and live type checking inside Claude Code sessions.  
**Install:** Available via the official marketplace; browse under "Code Intelligence" in `/plugin`.  
**Maturity:** Official Anthropic plugins; actively maintained.

### 15. Plugin Marketplace Discovery Tools

**What it does:** Community-maintained registries that discover and index all public Claude Code plugins and agent skills on GitHub.  
**Use when:** You want to browse the full universe of plugins beyond the official catalog (277+ plugins as of July 2026).  
**Install:** See `github.com/Kamalnrf/claude-plugins` for CLI tools.  
**Maturity:** Community-maintained; updated weekly.

---

## Category 3: Standalone Agent Skills

_Reusable skills installable via `npx skills add`—cross-agent compatible (Claude Code, Codex, Cursor, etc.)._

### 16. vercel-labs/agent-skills

**What it does:** A curated collection of reusable AI agent skills (one `SKILL.md` per skill) covering common development workflows.  
**Use when:** You want to quickly add off-the-shelf skills without writing them yourself.  
**Install:** `npx skills add vercel-labs/agent-skills -a claude-code`.  
**Maturity:** Actively maintained by Vercel Labs; part of the open agent skills ecosystem.

### 17. justjavac/skills

**What it does:** Open agent skills tool with a large collection of installable skills; supports targeting specific agents.  
**Use when:** You need a broad skill library and want to install only what you need for Claude Code.  
**Install:** `npx skills add justjavac/skills -a claude-code`.  
**Maturity:** Actively maintained (June 2026).

### 18. shengyy/agent-skills

**What it does:** Reusable AI agent skills for Claude Code and Codex—installable with a single `skills` CLI command.  
**Use when:** You want a lightweight, focused skill collection that works across multiple agents.  
**Install:** `npx skills add shengyy/agent-skills -a claude-code`.  
**Maturity:** Actively maintained (June 2026).

### 19. @skill-hub/cli

**What it does:** Single-command skill installer—`npx @skill-hub/cli install <skill> --agent claude`.  
**Use when:** You want a centralized skill registry with simple installation.  
**Install:** `npx @skill-hub/cli install <skill-name> --agent claude`.  
**Maturity:** Actively maintained (July 2026).

### 20. Metaplex Skill

**What it does:** Agent skill for Metaplex (Solana NFT protocol)—installable via `npx skills add` for any compatible agent.  
**Use when:** You’re building on Solana/Metaplex and want Claude to understand the protocol.  
**Install:** `npx skills add metaplex-foundation/metaplex-skills -a claude-code`.  
**Maturity:** Actively maintained; supports project-scoped and global installs.

---

## Quick Reference Table

| Category   | Tool                     | Install Command                                                            |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| **MCP**    | GitHub                   | `claude mcp add github https://api.github.com/mcp`                         |
| **MCP**    | Context7                 | `claude mcp add context7 https://mcp.context7.com/mcp`                     |
| **MCP**    | Playwright               | `claude mcp add playwright npx -y @modelcontextprotocol/server-playwright` |
| **MCP**    | Sentry                   | `claude mcp add sentry https://mcp.sentry.dev/mcp`                         |
| **MCP**    | Supabase                 | `claude mcp add supabase https://mcp.supabase.com/mcp?project_ref=<ref>`   |
| **MCP**    | Jira                     | `claude mcp add atlassian https://mcp.atlassian.com/v1/mcp`                |
| **MCP**    | AWS                      | Clone from `awslabs/mcp`                                                   |
| **MCP**    | Cloudflare               | See `cloudflare/mcp-server-cloudflare`                                     |
| **MCP**    | Grafana                  | `claude mcp add grafana npx -y @modelcontextprotocol/server-grafana`       |
| **MCP**    | Stripe                   | `claude mcp add stripe https://mcp.stripe.com/mcp`                         |
| **MCP**    | Notion                   | `claude mcp add notion https://mcp.notion.com/mcp`                         |
| **MCP**    | Figma                    | `claude mcp add figma https://mcp.figma.com/mcp`                           |
| **Plugin** | mcp-server-dev           | `/plugin install mcp-server-dev@claude-plugins-official`                   |
| **Plugin** | Code Intelligence        | Browse `/plugin` → "Code Intelligence"                                     |
| **Skill**  | vercel-labs/agent-skills | `npx skills add vercel-labs/agent-skills -a claude-code`                   |
| **Skill**  | justjavac/skills         | `npx skills add justjavac/skills -a claude-code`                           |
| **Skill**  | shengyy/agent-skills     | `npx skills add shengyy/agent-skills -a claude-code`                       |
| **Skill**  | @skill-hub/cli           | `npx @skill-hub/cli install <name> --agent claude`                         |
| **Skill**  | Metaplex                 | `npx skills add metaplex-foundation/metaplex-skills -a claude-code`        |

---

**Final note:** Start with 2–3 MCP servers that match your daily stack—GitHub + Context7 + one domain-specific (database, cloud, or ticketing)—rather than installing everything at once. Plugins and skills are lighter-weight; add them as you identify recurring needs.

# Claude

# Optional Recommended Tools

Snapshot: mid-2026. Curated for a solo TS/React/Node dev on Claude Code. Excludes anything
that duplicates the template's built-in skills: brainstorming/spec-writing, implementation
planning, task execution/subagent delegation, external research, diagramming/visualization,
passive context-capture/checkpoints, debugging, completion-verification.

This ecosystem churns fast — install commands and star counts are a snapshot, not a promise.
Re-verify a repo's activity before installing anything, especially community entries.

---

## 1. MCP Servers

**Context7** — Upstash
Pulls live, version-pinned docs/code examples for a library into context instead of Claude
guessing from stale training data.
_Use when:_ working with any fast-moving JS/TS library or framework version.
_Install:_ `claude mcp add --transport http context7 https://mcp.context7.com/mcp` (or `/plugin install context7@context7-marketplace`)
_Maturity:_ Actively maintained by Upstash; one of the most-installed MCP integrations in the ecosystem (300K+ installs mid-2026).

**Chrome DevTools MCP** — Google / Chrome DevTools team
Gives the agent a live, inspectable Chrome instance — DOM snapshots, console, network,
performance traces, Lighthouse audits.
_Use when:_ debugging Delapse's actual rendered UI, a rendering bug, or a perf issue that only shows up in a real browser.
_Install:_ `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` → `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` (or standalone `npx chrome-devtools-mcp@latest`)
_Maturity:_ Official Google repo, active weekly-ish releases. Note: this is a tool/capability grant (live browser access), not a debugging methodology — complements your template's debugging skill rather than duplicating it.

**Playwright MCP** — Microsoft
Cross-browser (Chromium/Firefox/WebKit) automation via the accessibility tree: navigate, click,
fill, screenshot, assert.
_Use when:_ you want a repeatable E2E check across browsers, not just Chrome internals.
_Install:_ `claude mcp add playwright npx @playwright/mcp@latest` (or `/plugin install playwright@claude-plugins-official`)
_Maturity:_ Microsoft-maintained, most-starred browser-automation MCP (7k+★), weekly updates. Official successor to the now-deprecated `server-puppeteer` — don't use the old Puppeteer MCP.
_Note:_ overlaps Chrome DevTools MCP in scope. DevTools for debugging/perf, Playwright for repeatable cross-browser test flows. Running both is fine, but you likely only need one per task.

**Sentry MCP** — Sentry
Read-only query access to production issues, stack traces, breadcrumbs, and performance traces.
_Use when:_ you're running Sentry on Delapse's backend/extension and want "error reported → fix" without leaving the session.
_Install:_ `{"mcpServers":{"sentry":{"url":"https://mcp.sentry.dev/mcp"}}}` (OAuth on first use)
_Maturity:_ Official, actively maintained. Read-only by design (can't create/modify/delete). Install once you actually have a Sentry project — no value idle.

**MCP Toolbox for Databases** — Google (`googleapis/mcp-toolbox`, formerly `genai-toolbox`)
Official MCP for querying/exploring Cloud SQL, AlloyDB, Spanner, Postgres, MySQL with built-in
auth and connection pooling.
_Use when:_ Claude needs to inspect your GCP-hosted DB schema/data directly instead of you pasting a dump.
_Install:_ `claude mcp add --transport stdio googleapis-genai-toolbox -- docker run -i --rm us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:<version>`
_Maturity:_ Official Google repo, 8k+★, actively developed. Still pre-1.0 (beta) — breaking changes possible between versions.

**Google Cloud MCP (gcloud-backed, remote/OAuth)** — Google
Natural-language access to broader GCP resources — Compute Engine, Cloud Run, Cloud Storage,
BigQuery — via per-service remote MCP endpoints.
_Use when:_ checking a Cloud Run deployment, tailing logs, or poking at Storage/BigQuery without switching to the console.
_Install:_ per Google's official docs (`docs.cloud.google.com/mcp`) — create an OAuth client, connect the service-specific remote MCP URL.
_Maturity:_ Official, actively expanding mid-2026. Scope read-only where you can — it can act on live infra.

**Stripe MCP** — Stripe
Official hosted MCP over customers, payments, subscriptions, invoices, refunds.
_Use when:_ (forward-looking) once Delapse has a paid tier — debug a failed payment or draft a subscription flow with live Stripe context.
_Install:_ hosted at `mcp.stripe.com` (OAuth), or `npx -y @stripe/mcp-server`
_Maturity:_ Official, actively maintained. Skip until you actually integrate Stripe — it's payment/PII data sitting in your context window, so scope the API key tightly when you do.

### Explicitly skip

- **GitHub MCP** — for Claude Code specifically, don't bother. Claude Code already treats `gh` CLI as a first-class tool; a benchmarked GitHub query costs ~30x more tokens through MCP than through `gh` directly (44k vs ~1.4k tokens). Only reach for the plugin if you're on a client without native CLI/bash access.
- **Filesystem / generic Git MCP servers** — redundant; Claude Code already has direct file and git access via its bash tool.
- **Postgres MCP (`@modelcontextprotocol/server-postgres`) / Puppeteer MCP** — both archived by the MCP steering group. Still run, no longer maintained. Use MCP Toolbox for Databases and Playwright MCP instead, respectively.

---

## 2. Claude Code Plugins

**Frontend Design** — Anthropic (official)
Pushes generated UI toward considered typography/layout/restraint instead of generic
"AI slop" gradient-and-card templates.
_Use when:_ any Delapse UI work — popup, options page, in-page overlay.
_Install:_ `/plugin install frontend-design@claude-plugins-official`
_Maturity:_ Anthropic first-party; most-installed plugin in the official marketplace (500K+ installs mid-2026).

**security-guidance** — Anthropic (official)
Quietly reviews every diff for injection, XSS, SSRF, exposed secrets, IDOR, auth-bypass before you see it.
_Use when:_ always-on. Negligible overhead.
_Install:_ `/plugin install security-guidance@claude-plugins-official`
_Maturity:_ Official; ships enabled by default in recent Claude Code versions.

**code-review** — Anthropic (official)
Runs specialized parallel subagents (bug-hunting, convention-compliance, history-aware) over a
diff for a fast second opinion before you commit.
_Use when:_ before merging anything non-trivial — you have no human reviewer to catch this otherwise.
_Install:_ `/plugin install code-review@claude-plugins-official` (also `pr-review-toolkit@claude-plugins-official` for a PR-specific variant)
_Maturity:_ Official. Note: this is a code-quality/security pass, adjacent to — but a different concern than — your template's completion-verification skill (that one likely checks "did it meet spec," this checks "is the diff itself sound"). Worth a quick look to confirm they don't overlap for your setup.

**TypeScript LSP** — Anthropic (official)
Real go-to-definition, find-references, and live type errors instead of Claude guessing from text.
_Use when:_ any TS work, especially across your monorepo.
_Install:_ `/plugin install typescript-lsp@claude-plugins-official`
_Maturity:_ Official, one of ~12 language-server plugins Anthropic maintains.

**Semgrep Guardian** — Semgrep
Bundles the Semgrep MCP server + hooks + skills: scans every file Claude writes against
5,000+ SAST rules (SQLi, XSS, SSRF, secrets) and makes Claude regenerate until it's clean.
_Use when:_ you want a non-optional safety net on AI-generated code, not just an MCP tool Claude can choose to skip.
_Install:_ see `docs.semgrep.dev/guardian` (search "Semgrep" in `/plugin`)
_Maturity:_ Actively maintained by Semgrep. Note: the older standalone `semgrep/mcp` repo is explicitly deprecated in favor of Guardian / the official Semgrep binary — use Guardian, not the old repo.

**commit-commands** — official marketplace
Chains stage → conventional-commit-message-from-diff → commit → push → PR creation into one
namespaced skill bundle.
_Use when:_ you commit/PR often and want it to stop being three manual steps.
_Install:_ `/plugin install commit-commands@claude-code-plugins`, then `/reload-plugins`, invoke with `/commit-commands:commit`
_Maturity:_ Official, free.

**skill-creator** — Anthropic (official)
Interviews you about a repeated workflow and scaffolds a properly-triggered `SKILL.md`; can also audit/improve skills you already have.
_Use when:_ you notice yourself giving Claude the same multi-step instructions repeatedly (you've already built a diagrams skill and a market-research skill this way).
_Install:_ `/plugin install skill-creator@claude-plugins-official`
_Maturity:_ Official.

**Caveman** — JuliusBrussee
Forces terse "caveman-speak" prose while keeping code/commands/errors byte-exact — cuts output tokens ~65% on long agentic runs.
_Use when:_ long unattended multi-step runs where you don't need full prose reasoning, just the result.
_Install:_ `/plugin marketplace add JuliusBrussee/caveman` → `/plugin install caveman@caveman`
_Maturity:_ Community, ~86k★, actively used. Situational — turn off when you need Claude's reasoning spelled out.

### Explicitly skip (duplicates your template)

- **Superpowers** (`obra/superpowers`) — bundles brainstorm → spec → plan → TDD → subagent-delegation. Most-starred plugin in the whole ecosystem (~248k★), but a straight duplicate of what your template already owns end-to-end.
- **Claude Mem** (`thedotmack/claude-mem`) — persistent cross-session memory; overlaps your template's passive context-capture/checkpoints skill. Only worth a look if that skill doesn't already give you this.
- **planning-with-files** — duplicates implementation planning.
- **ECC and similar "god-mode" mega-harnesses** — bundle dozens of agents/skills covering most of your excluded list at once. Skip the category, not just one repo.

---

## 3. Standalone Agent Skills

**react-best-practices** — Vercel Labs
~40 React/Next.js performance and code-quality rules from Vercel engineering (data-fetching,
server/client boundaries, re-render and bundle-size anti-patterns), prioritized by real-world
Core Web Vitals impact.
_Use when:_ writing or reviewing any React code — Delapse's UI now, any future frontend project.
_Install:_ `npx skills add vercel-labs/agent-skills --skill react-best-practices`
_Maturity:_ Actively maintained by Vercel, 180K+ installs, genuinely cross-project (any React/Next codebase — not tied to Vercel hosting).

**web-design-guidelines** — Vercel Labs
Audits UI code against 100+ accessibility/UX/performance rules; fetches the latest guidelines
fresh before each review rather than relying on a frozen copy.
_Use when:_ polishing any user-facing screen before you ship it.
_Install:_ `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`
_Maturity:_ Actively maintained, cross-project.

**mcp-builder** — Anthropic (`anthropics/skills`)
Scaffolds a new MCP server when you need to wire Claude into something not already covered.
_Use when:_ exposing an internal API (e.g. a Delapse admin endpoint) to Claude as a proper tool.
_Install:_ copy the `mcp-builder` folder into `~/.claude/skills/`
_Maturity:_ Official Anthropic skill.

**theme-factory** — Anthropic (`anthropics/skills`)
Applies coherent, professional color/typography themes to generated UI.
_Use when:_ you need a real color system/type scale and have no designer to hand it to.
_Install:_ copy the `theme-factory` folder into `~/.claude/skills/`
_Maturity:_ Official Anthropic skill; pairs with the Frontend Design plugin above.

**nestjs-best-practices** — community (e.g. `Kadajett/agent-nestjs-skills`)
~40 NestJS rules (architecture, DI, security, error handling, testing) with wrong/right code examples.
_Use when:_ backend work on your NestJS API.
_Install:_ `npx skills add Kadajett/agent-nestjs-skills`
_Maturity:_ Community, smaller/newer — not Anthropic/Vercel-scale adoption. A few competing forks exist with overlapping content (also see the `xirothedev` and `giuseppe-trisciuoglio` variants) — skim the rules before trusting them blindly, but genuinely useful since nothing official exists for NestJS.

### Explicitly skip (duplicates your template, or you already have it)

- **Grill Me** — already installed (`/mnt/skills/user/grill-me`).
- **webapp-testing / Playwright skill** (as a _skill_, distinct from Playwright MCP above) — "does the built thing actually run" sits close to your completion-verification skill's territory. Compare before adding; likely redundant.
- **Skill Seekers** (turns any docs site into a skill) — adjacent to your external-research skill. Only add if that skill doesn't already do doc-ingestion for you.

---

## Quick-start stack

If you only install six things: **Context7**, **Chrome DevTools MCP**, **Frontend Design**,
**security-guidance**, **TypeScript LSP**, and **react-best-practices**. Everything else here
is situational — add it when the specific need (Stripe integration, Sentry monitoring, NestJS
backend work) actually shows up.
