# agent-skills vs. Flow — comparison

A philosophical and structural comparison. Opinionated. One view and an argument for it.

---

## The core philosophical difference

agent-skills and Flow answer the same question differently: *where does workflow discipline live?*

agent-skills answers: **in the skill library, enforced behaviorally.** The skill itself argues against the excuses that would lead an agent to skip it. Common Rationalizations tables pre-empt the arguments before they fire. Verification checklists make completion checkable. The eval system verifies the behavior actually happens. The discipline is baked into the skill artifact.

Flow answers: **in the global rules and the agent's own judgment.** The Judgment section in `home/CLAUDE.md` says: attack your own proposal, walk a real case, find the missing step. The Communication section says: reason before agreeing, disagree out loud. The discipline is stated once at the top and expected to propagate everywhere.

Neither is wrong for its context. But they produce different failure modes.

agent-skills failure mode: the library grows until the overhead of 24 skills and their routing machinery starts competing with the skills themselves for context budget. The eval system becomes something to pass rather than something that proves quality. The Common Rationalizations table for one skill conflicts with the rationalization left out of another.

Flow's failure mode: the global rules are too abstract to fire at the moment an agent is about to skip the hard step. The agent follows the spirit of the Judgment section in principle and ignores it when the local excuse feels valid. The discipline degrades silently, with no mechanism to detect it.

**The verdict**: Flow's failure mode is worse, because it is invisible. agent-skills' failure mode at least produces observable symptoms (routing failures, eval failures, description overlap). Flow has no equivalent signal that discipline is slipping.

---

## Philosophy and principles

**agent-skills** is built on four bets:

1. *Skills are workflows, not docs.* A skill is an executable process that changes agent behavior, not a reference document. A skill that an agent reads and ignores has failed. The eval system tests this directly.

2. *Multi-tool portability is possible.* The same skill works in Claude Code, OpenAI Codex, Gemini CLI, OpenCode. The tradeoff is that skills must avoid tool-specific affordances — no mentions of agent spawning, no Claude-specific hooks, only generic "your agent tool" language. This costs expressiveness to gain reach.

3. *Behavioral mechanisms are as important as process steps.* Having the right process is necessary but not sufficient. An agent that knows the process but rationalizes skipping it is equivalent to an agent that never had the process. The Common Rationalizations table, the Verification checklist, and the pressure-case evals are all responses to this insight.

4. *Scale needs infrastructure.* 24 skills routing through a meta-skill into a session-start hook with validator CI and a 3-tier eval system is a significant engineering investment. The bet is that this infrastructure pays for itself at team scale, where many different users hit many different skills in many different contexts.

**Flow** is built on four different bets:

1. *Context budget is the scarce resource.* Every word loaded into a session competes with the task at hand. A rule present in context is a rule that costs something. Rules that appear rarely used should be cut, not kept. The whole system is designed around minimizing the always-loaded footprint and loading skill detail only when the skill fires.

2. *A personal workflow does not need routing machinery.* The user is the same person every session. They know what the skills do and when to invoke them. A session-start hook that injects a routing chart is solving a problem that does not exist in a one-person workflow.

3. *The ticket system is the integration layer.* Flow has a tool (`flow`) that manages work items, and every other piece of the system — skills, commands, the brainstorm process — connects to the ticket system. This gives the workflow persistence and queryability that agent-skills' free-floating `tasks/` folder cannot match.

4. *Claude-specific is not a liability.* Being Claude Code-specific means Flow can use agent spawning, hooks, worktrees, and TOML commands to their fullest. Portability constraints would make the system weaker, not stronger, for a user who only ever uses Claude.

**Where the philosophies conflict**: agent-skills bets that behavioral enforcement in each skill is worth the context cost of the enforcement machinery. Flow bets that global rules applied with good judgment are sufficient and cheaper. The experimental evidence favors agent-skills here — behavioral pre-emption at the skill level is more reliable than hoping global principles propagate to the moment of failure. But Flow's context budget bet is also correct: carrying 24 skills and their routing overhead would be a net loss for a solo developer with a settled workflow.

The right resolution is not to pick one philosophy wholesale. It is to steal agent-skills' behavioral enforcement mechanisms (Common Rationalizations, Verification checklists, Red Flags) and keep Flow's everything else.

---

## Workflow comparison

**agent-skills workflow**:
1. User asks something
2. Session-start hook has already injected the routing meta-skill
3. Agent routes to the correct skill via `use the <name> skill`
4. Skill loads and agent follows the process
5. If a TOML command triggered this (e.g., `/build`), the command already named which skills to use
6. Skill ends with Verification checklist; agent works through it
7. For review and shipping: `/ship` fans out to three parallel agent personas; results are aggregated

This works well for a team. The routing meta-skill handles the fact that different people have different vocabularies for the same task. The slash commands handle the fact that some workflows are always the same sequence of skills. The agent persona fan-out handles the fact that review benefits from multiple independent perspectives.

**Flow's workflow**:
1. User has a goal (a feature, a spike, a decision)
2. `brainstorm` skill produces a spec and tickets
3. `organize` (optional) restructures if the ticket structure needs work
4. `research` runs targeted investigations if the build needs external knowledge
5. `execute` works through tickets one by one, spawning Haiku workers for mechanical steps and debug agents for failures
6. The `flow` tool tracks progress; `flow status`, `flow next`, `flow show <id>`
7. `/handoff` captures session state at the end

This works well for a solo developer. The ticket system gives persistence; `flow next` always knows what is left. The skill set is smaller and narrower because the user's workflow is narrower. There is no review fan-out because there is one developer.

**The structural difference**: agent-skills covers the SDLC from first spec to production launch, with skills for each phase and personas for each review role. Flow covers the development cycle from idea to shipped code, with the assumption that deployment and production monitoring are the developer's own domain. This is not a gap in Flow — it is a scope decision.

The workflows are not competitive. They solve different problems for different users.

---

## Structural comparison

| Dimension | agent-skills | Flow |
|---|---|---|
| Entry point | Claude Code marketplace plugin | Manual symlinks via link.sh |
| Always-on content | session-start hook injecting meta-skill | home/CLAUDE.md loaded by Claude Code |
| Skill routing | TF-IDF descriptions + session-start injection | Description alone; user is consistent |
| Slash commands | 8 TOML commands (build, plan, review, ship, spec, test, simplify, webperf) | 1 markdown command (/handoff) |
| Agent personas | 4 (code-reviewer, security-auditor, test-engineer, web-perf-auditor) | None |
| Hooks | SessionStart (meta-skill inject), PreToolUse/PostToolUse Read/Edit/Write/Stop (simplify-ignore), PreToolUse/PostToolUse WebFetch (sdd-cache) | PreToolUse Bash (guard.js — command blocking) |
| Validator/CI | 5 Node scripts; checks structure, commands, artifact paths, versions, evals | flow check (ticket integrity only) |
| Eval system | 3 tiers: structural (free) + routing/TF-IDF (free) + behavioral (tokens, opt-in) | None |
| Behavioral mechanisms | Common Rationalizations tables, Verification checklists, Red Flags, pressure-case evals | Judgment section in home/CLAUDE.md |
| Path conventions | tasks/plan.md, tasks/todo.md, artifacts/ | docs/tickets/, docs/brainstorms/, docs/spec/ |
| Work tracking | tasks/todo.md (flat file) | flow tool (structured, queryable, archivable) |
| Cross-skill references | references/ at repo root, shared checklists | None |
| Context style | Verbose (1200–3200 words per skill) | Telegraphic (300–500 line target) |
| Tool portability | 6 tools (Claude, Codex, Gemini, OpenCode, + 2 plugin paths) | Claude Code only |
| Distribution | Claude Code marketplace, one-step install | link.sh, manual |

Two structural asymmetries matter most:

**Behavioral enforcement**: agent-skills has three per-skill behavioral mechanisms (rationalizations, red flags, verification) plus a full eval tier to test them. Flow has one global principle (Judgment) with no per-skill enforcement and no way to detect drift. This is the biggest structural gap — and the one most worth closing.

**Work tracking**: Flow's ticket system is structurally superior to their `tasks/` folder. The ticket is a durable artifact that survives the session, carries the spec, records intermediate decisions, and is queryable via `flow`. Their task list is a flat file that gets written and then abandoned. For a multi-session project, Flow's approach is much more useful.

---

## Scale and coverage

agent-skills: 24 skills, 87 files, ~85,000 words. Covers: spec, planning, incremental build, TDD, code review, security, performance, documentation, observability, CI/CD, git workflow, API design, frontend, simplification, deprecation, interviewing, pair programming, source-driven development, context engineering, doubt-driven development, meta-skill routing.

Flow: 9 skills, ~30 files. Covers: brainstorm, execute, research, organize, explain, grill, curate-skills, debug-web-pages, (code review in progress).

The 15 skills Flow doesn't have are not all gaps. Most of them (security-and-hardening, CI/CD, observability, documentation and ADRs, deprecation) are team concerns or production-operations concerns that don't apply to a solo developer building personal projects. The real gaps are:

- debugging-and-error-recovery (must-build)
- test-driven-development (should build eventually)
- code-review-and-quality (must-build, in progress)

Everything else on their list is either already covered differently in Flow (spec via brainstorm, planning via tickets) or genuinely not needed (production monitoring, security audits for a solo project with no users).

The scale difference reflects audience, not quality. 24 skills for a library that installs into any engineering team's workflow is correct. 9–12 skills for a personal workflow is correct. Bigger is not better here — bigger is more to maintain and more context overhead per session.

---

## Pros and cons

**agent-skills strengths**:
- Behavioral enforcement is the best in any publicly available skill library. Common Rationalizations is the single most valuable idea here.
- The eval system is real engineering. Tier 2 routing tests cost nothing and catch description drift before it causes invisible routing failures.
- Coverage is comprehensive for its audience. If you are an engineering team or a developer who works across many domains, the coverage maps to your actual work.
- Multi-tool portability means the investment compounds — the same skills work in 6+ environments.
- The session-start hook is clever: always-on content without making CLAUDE.md longer.

**agent-skills weaknesses**:
- Verbose. Their skills average 1500–2000 words. At 24 skills with routing overhead, total context load is significant. A library that consumes its own context budget is self-defeating.
- The task/path conventions (`tasks/plan.md`, `artifacts/`) are not integrated with any persistent work-tracking system. Work disappears between sessions.
- Portability constraint costs expressiveness. Skills cannot use Claude-specific affordances (agent spawning, worktrees, specific hook types) that would make them sharper for Claude users.
- The eval system is valuable but also a maintenance obligation. Every new skill needs eval cases; every description change may break routing CI. This is right for a team library; it is significant overhead for a personal workflow.

**Flow strengths**:
- Telegraphic style is the right approach. Skills load into context budget; every unnecessary word is a cost. Flow's discipline here is correct and should not be softened.
- The ticket system is structurally superior to a task list. Persistence, queryability, spec attachment, session handoff — all of this is better for multi-session projects.
- Claude-specific design means the system uses its tool to the fullest. Agent spawning, hooks, worktrees are all available without portability constraints.
- Scope is correct for the audience. 9 skills for a solo developer is the right size.

**Flow weaknesses**:
- No per-skill behavioral enforcement. The Judgment section in CLAUDE.md is a good principle but too abstract to fire at the moment an agent is rationalizing its way out of a hard step.
- No verification mechanism. Skills end at the last instruction. "Is this done?" is unanswered.
- No way to detect discipline drift. If a skill stops changing behavior, Flow has no mechanism to notice.
- Missing debug and code-review skills. These are not design gaps — they're build gaps. But they are real missing pieces.

---

## Who each is for

**agent-skills is for**: an engineering team or team-scale individual who wants consistent AI agent behavior across many developers, many projects, and potentially multiple tools. The infrastructure investment (eval system, routing CI, marketplace plugin, 4 personas, 8 commands) makes sense when it amortizes across many users and sessions. The verbose style is acceptable when the audience is diverse and may need more explanation. The coverage is right when the user's work spans the full SDLC from spec to production.

**Flow is for**: a solo developer with a consistent personal workflow, a fixed tool (Claude Code), and the discipline to invest in making the workflow itself better. The telegraphic style, minimal overhead, and ticket-system integration are right when the user is the same person every session and knows the workflow well. The Claude-specific design is an asset, not a liability, when Claude is the only tool.

---

## The verdict

Pick the system that matches your audience and build the missing pieces from the other.

For Flow's user: Flow's architecture is correct. Keep it. The single most important thing to steal from agent-skills is the behavioral enforcement mechanism — Common Rationalizations tables, Verification checklists, and Red Flags — not the additional skills, not the eval infrastructure, not the scale. These mechanisms cost nothing to add (write 4–8 lines per skill per section) and address the one real failure mode in Flow's design: an agent that knows the process but finds a locally-valid excuse to skip the hard step.

The second thing worth stealing is the session-start hook approach, specifically as a solution to Flow's refactor agenda item 2 (where to put always-on content that is currently in a skill). A lightweight routing list injected at session start keeps CLAUDE.md lean without losing the routing information.

Everything else — the 24-skill library, the personas, the eval system, the TOML commands — is engineering for a different audience. Worth studying. Not worth importing.

The point at which this verdict changes: if Flow ever distributes to more than one user, the eval system and the routing CI become necessary. A library without tests is faith-based; a library used by multiple people with different vocabularies is a library where faith runs out fast. The eval system architecture (described in `evals.md`) should be the design reference at that point.
