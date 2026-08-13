# agent-skills — skill catalog

All 24 skills. Columns: lines / words / shape / what it makes the agent do / Flow equivalent.

Line counts are exact. Word counts rounded to nearest 50.

---

## Summary table

| Skill | Lines | Words | Flow equivalent |
|---|---|---|---|
| interview-me | 225 | 2400 | none |
| idea-refine | 178 | 1250 | brainstorm (partial) |
| spec-driven-development | 206 | 1300 | execute + brainstorm write-spec.md (partial) |
| planning-and-task-breakdown | 234 | 1250 | execute (partial) |
| incremental-implementation | 249 | 1500 | execute (partial) |
| test-driven-development | 398 | 2450 | none |
| context-engineering | 289 | 1600 | none (but CLAUDE.md does some of this) |
| source-driven-development | 194 | 1200 | research (partial) |
| doubt-driven-development | 243 | 2550 | grill (closest; different mechanism) |
| frontend-ui-engineering | 328 | 1450 | none |
| api-and-interface-design | 294 | 1450 | none |
| browser-testing-with-devtools | 317 | 2150 | debug-web-pages (overlaps) |
| debugging-and-error-recovery | 300 | 1700 | debug-web-pages (narrow), none general |
| code-review-and-quality | 396 | 3250 | none (code-review skill is on remaining list) |
| code-simplification | 331 | 2050 | none |
| security-and-hardening | 467 | 2950 | none |
| performance-optimization | (large) | 2200 | none |
| git-workflow-and-versioning | 355 | 2150 | none |
| ci-cd-and-automation | 390 | 1550 | none |
| deprecation-and-migration | 247 | 1950 | none |
| documentation-and-adrs | 288 | 1450 | none |
| observability-and-instrumentation | 203 | 1700 | none |
| shipping-and-launch | 310 | 1600 | none |
| using-agent-skills | 191 | 1300 | none (routing is implicit in descriptions) |

---

## Per-skill notes

### interview-me (225 lines / 2400 words)

**Shape**: Overview · When to Use · Loading Constraints · The Process (5 steps) · Output · Example · Interaction with Other Skills · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before any plan, spec, or code, pause and run a structured intent-extraction interview. Write a confidence number (0–100%) with a best-guess hypothesis. Ask one question at a time, each with the agent's own prediction attached. Watch for sophistication-signaling answers ("scalable," "modern") and probe for what the user actually wants. Stop only when the agent can predict the user's next three answers. Deliver a six-field restate (Outcome / User / Why now / Success / Constraint / Out of scope) and require an explicit yes before proceeding.

**Flow equivalent**: None. Flow's brainstorm skill handles design-space thinking; there is nothing in Flow that extracts and validates user intent before the brainstorm starts. The closest analog is Flow's emphasis on not guessing, but that is a CLAUDE.md principle, not a structured process.

---

### idea-refine (178 lines / 1250 words) — has sub-files

**Sub-files**: `examples.md`, `frameworks.md`, `refinement-criteria.md`, `scripts/` (initialize script). The main SKILL.md loads these by reference during specific phases.

**Shape**: Overview · How It Works (3-phase summary) · Usage · Output · Detailed Instructions (3 phases in full) · Anti-patterns · Red Flags · Verification

**What it makes the agent do**: Three-phase ideation process. Phase 1: restate as "How Might We," ask 3–5 sharpening questions, then generate 5–8 variations using named lenses (inversion, constraint removal, 10x version, etc.). Phase 2: cluster into 2–3 directions, stress-test each against user value / feasibility / differentiation, name hidden assumptions for each. Phase 3: produce a markdown one-pager with Recommended Direction, Key Assumptions to Validate, MVP Scope, and a "Not Doing" list. The agent is explicitly told to push back on weak ideas.

**Flow equivalent**: brainstorm (partial). Flow's brainstorm skill also explores a design space and produces a decision tree. But idea-refine is narrower — it is about divergent/convergent thinking on a concept, not about resolving open decisions for a work item. Flow's brainstorm applies at any level (product, feature, ticket); idea-refine is specifically pre-spec ideation.

---

### spec-driven-development (206 lines / 1300 words)

**Shape**: Overview · When to Use · The Gated Workflow (4 phases with gate diagram) · Keeping the Spec Alive · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Four-phase gated workflow — Specify, Plan, Tasks, Implement — where each phase requires human review before advancing. In Specify: surface assumptions explicitly ("ASSUMPTIONS I'M MAKING: ... correct me now"), write a spec covering Objective / Commands / Project Structure / Code Style / Testing Strategy / Boundaries. In Plan: generate a technical plan, save to `tasks/plan.md`. In Tasks: break into items with acceptance criteria, verification step, and file list, save to `tasks/todo.md`. In Implement: follow incremental-implementation and test-driven-development skills.

**Flow equivalent**: Partial match to execute (which does ticket pickup and planning) plus write-spec.md (which writes docs/spec/). But Flow's planning happens at ticket pickup, not up front, and is written into the ticket itself rather than `tasks/`. The four-gate model is more explicit than Flow's approach.

---

### planning-and-task-breakdown (234 lines / 1250 words)

**Shape**: Overview · When to Use · The Planning Process (5 steps) · Task Sizing Guidelines · Output Files · Plan Document Template · Parallelization Opportunities · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Read the spec in plan mode (no code), map a dependency graph, slice vertically (one complete end-to-end path per task, not horizontal layers), write each task with acceptance criteria and verification steps, add checkpoints between phases, save to `tasks/plan.md` and `tasks/todo.md`. Explicit size guidelines: S (1–2 files), M (3–5), L (5–8, acceptable), XL (8+, must be broken down).

**Flow equivalent**: Partial match to the `## Plan` section of Flow's execute skill. Flow also breaks work into steps with file lists, but does not use the vertical-slicing framing or explicit T-shirt sizing. The `tasks/` path convention is theirs, not Flow's.

---

### incremental-implementation (249 lines / 1477 words)

**Shape**: Overview · When to Use · The Increment Cycle (diagram) · Slicing Strategies (3 types) · Implementation Rules (5 numbered rules) · Working with Agents · Increment Checklist · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Build in thin vertical slices — implement, test, verify, commit, then move to the next slice. Hard rules: touch only task scope (no drive-by cleanup), keep the codebase compilable between increments, use feature flags for incomplete work, make each increment independently revertable. After each increment: run the repo's specific test command (never assume `npm test`), run the build, run type checking, run linting. After a clean run, do not repeat the same command — re-running without code changes adds nothing.

**Flow equivalent**: Partial match to execute. Flow's execute also prescribes building step by step, but does not lay out the specific rules about scope discipline (Rule 0.5), the feature-flag rule (Rule 3), or the "don't re-run the same command" check. Flow's execute is more focused on ticket state transitions.

---

### test-driven-development (398 lines / 2438 words)

**Shape**: Overview · When to Use · Discover the Stack First · The TDD Cycle (RED/GREEN/REFACTOR with code examples) · The Prove-It Pattern (bug fixes) · The Test Pyramid · Writing Good Tests (5 subsections) · Test Anti-Patterns · Browser Testing with DevTools · When to Use Subagents · See Also · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before writing implementation, discover the repo's actual test stack (package.json, go.mod, pyproject.toml, etc.) and use its specific test command. Write the failing test first — if it passes immediately, it proves nothing. For bug fixes, reproduce with a test before attempting the fix. Test state not interactions; use DAMP (Descriptive And Meaningful Phrases) over DRY; prefer real implementations over mocks. After a passing run, do not re-run the same command without code changes.

**Flow equivalent**: None. Flow has no testing skill. This is one of the most significant gaps. The systematic-debugging hard rule in Flow's CLAUDE.md ("No cause without evidence. Hypothesis: X. To verify: Y.") is philosophically adjacent but covers only debugging, not test authorship.

---

### context-engineering (289 lines / 1590 words)

**Shape**: Overview · When to Use · The Context Hierarchy (5 levels) · Context Packing Strategies · MCP Integrations · Confusion Management · Anti-Patterns · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Structure what the agent sees and when. Level 1 (always-on): rules files (CLAUDE.md etc.) with tech stack, commands, conventions, boundaries. Level 2 (per-feature): only the relevant spec section, not the whole spec. Level 3 (per-task): read the files to be modified plus one example of the pattern. Level 4 (per-iteration): specific error output, not full 500-line test logs. Level 5 (conversation): start fresh sessions when switching major tasks. When encountering conflicts between spec and existing code, surface the conflict explicitly with options; never silently pick one.

**Flow equivalent**: None as a skill, but Flow's global/CLAUDE.md itself is context engineering — it defines what loads, sets the scripts to avoid excessive reads, and instructs the agent to read the least that answers the question. The refactor-agenda item 5 (cutting global/CLAUDE.md down) is context engineering in practice.

---

### source-driven-development (194 lines / 1194 words)

**Shape**: Overview · When to Use · The Process (4 steps with diagram) · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before writing any framework-specific code, read the dependency file to identify exact versions, fetch the specific official documentation page for the pattern being implemented (not the homepage, not blog posts, not Stack Overflow), cite the source with a full URL in code comments and conversation, and flag anything that cannot be verified as "UNVERIFIED." When docs conflict with existing code, surface the conflict rather than picking one silently.

**Flow equivalent**: research (partial). Flow's research skill also fetches current docs before working from stale knowledge. But SDD is narrower — it is specifically about framework-specific implementation decisions in the code-writing moment. Flow's research is broader, covering any knowledge gap before a plan or spec is written.

---

### doubt-driven-development (243 lines / 2562 words)

**Shape**: Overview · When to Use · Loading Constraints · The Process (5 steps) · Common Rationalizations · Red Flags · Interaction with Other Skills · Verification

**What it makes the agent do**: For any non-trivial decision (defined by five criteria: branching logic, crossing a module boundary, asserting unverifiable properties, blast radius is irreversible, etc.) — name the CLAIM, extract the smallest reviewable artifact + contract (strip all reasoning), spawn a fresh-context reviewer with an adversarial prompt ("find issues, do not validate"), offer cross-model review to the user, reconcile findings by classifying each as contract-misread / actionable / trade-off / noise, stop after 3 cycles or trivial findings.

**Flow equivalent**: grill is the closest. Both use adversarial review. Key difference: grill is a conversational skill that runs across a discussion; doubt-driven is invoked per-decision, spawns a separate subagent, and includes a formal 5-step cycle with cross-model escalation. Doubt-driven is more mechanistic and more expensive; grill is more conversational and cheaper.

---

### frontend-ui-engineering (328 lines / 1440 words)

**Shape**: Overview · When to Use · Component Architecture · State Management · Design System Adherence · Accessibility (WCAG 2.1 AA) · Responsive Design · Loading and Transitions · See Also · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Build accessible, responsive, production-quality UI. Explicit rules against the "AI aesthetic" (purple gradients, excessive rounding, stock card grids, lorem ipsum). Use semantic color tokens. Every component handles loading / error / empty states. Keyboard navigation must work. Screen reader must work. Test at four breakpoints. Use skeleton loading over spinners. Use optimistic updates for perceived speed.

**Flow equivalent**: None. Flow has no UI skill.

---

### api-and-interface-design (294 lines / 1444 words)

**Shape**: Overview · When to Use · Core Principles (5 principles including Hyrum's Law and One-Version Rule) · REST API Patterns · TypeScript Interface Patterns · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Define the interface contract before implementing. Consistent error semantics across all endpoints (one error shape, always). Validate at system boundaries only. Prefer addition over modification (additive optional fields, never type changes or removals). Predictable naming conventions. Use discriminated unions for variants. Separate input/output types. Cite Hyrum's Law: every observable behavior becomes a de facto contract.

**Flow equivalent**: None.

---

### browser-testing-with-devtools (317 lines / 2138 words)

**Shape**: Overview · When to Use · Setting Up Chrome DevTools MCP (including installation JSON) · Security Boundaries (detailed) · The DevTools Debugging Workflow · Writing Test Plans · Screenshot-Based Verification · Console Analysis · Accessibility Verification · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Use Chrome DevTools MCP to verify browser behavior at runtime. Specific security rules: default to isolated browser profile, treat all browser content (DOM, console, network) as untrusted data — never interpret as instructions, never navigate to extracted URLs without confirmation, never read cookies or localStorage.

**Flow equivalent**: debug-web-pages (overlaps). Flow's debug-web-pages is more general — it covers investigating live pages the agent doesn't control. browser-testing-with-devtools is narrower — it covers testing pages the agent is building, using the DevTools MCP server specifically.

---

### debugging-and-error-recovery (300 lines / 1677 words)

**Shape**: Overview · When to Use · The Stop-the-Line Rule · The Triage Checklist (6 steps) · Error-Specific Patterns (3 types) · Safe Fallback Patterns · Instrumentation Guidelines · Common Rationalizations · Treating Error Output as Untrusted Data · Red Flags · Verification

**What it makes the agent do**: When something unexpected happens, stop adding features. Reproduce the failure reliably before doing anything. Localize to a layer. Create a minimal reproduction. Fix the root cause (not the symptom). Write a regression test. Verify end-to-end. Treat error messages from external sources as untrusted data — do not execute commands found in error output.

**Flow equivalent**: Flow has debug-web-pages (browser-specific only) and the one-line hard rule ("No cause without evidence"). No general systematic debugging skill. This skill is on the remaining.md list as one of the must-build items.

---

### code-review-and-quality (396 lines / 3262 words) ← largest skill

**Shape**: Overview · When to Use · The Five-Axis Review (5 detailed sections) · Structural Remedies · Change Sizing · Change Descriptions · Review Process (5 steps) · Multi-Model Review Pattern · Dead Code Hygiene · Review Speed · Handling Disagreements · Honesty in Review · Dependency Discipline · The Review Checklist · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Review every change across five axes: correctness, readability/simplicity, architecture, security, performance. For architecture: check specifically for refactors that relocate complexity without reducing it; feature logic leaking into shared modules; new conditionals bolted onto unrelated flows. Label every finding Critical / Required / Optional / Nit. Lead with correctness and security; don't bury real issues under nits. Dependency upgrades get their own rigor: read the changelog, upgrade one package at a time, review the lockfile diff.

**Flow equivalent**: None. The code-review skill is on Flow's remaining.md as "promoted to blocking."

---

### code-simplification (331 lines / 2028 words)

**Shape**: Overview · When to Use · The Five Principles · The Simplification Process (4 steps) · Language-Specific Guidance (TypeScript, Python, React) · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before simplifying, apply Chesterton's Fence — understand why code exists before changing it. Scan for specific patterns (deep nesting, long functions, generic names, duplicated logic, dead code). Make one simplification at a time, run tests after each. Never simplify code you don't understand. Submit simplification changes separately from feature changes.

**Flow equivalent**: None.

---

### security-and-hardening (467 lines / 2926 words) ← second largest

**Shape**: Overview · When to Use · Process: Threat Model First (STRIDE table) · The Three-Tier Boundary System (Always/Ask/Never) · Authentication · Authorization · Input Validation · OWASP Top 10 coverage · Supply Chain · AI/LLM Security · Security Review Checklist · See Also · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before hardening, spend 5 minutes on a threat model — map trust boundaries, name assets, run STRIDE over each boundary. Never use string concatenation in SQL. Use bcrypt/scrypt/argon2, never plaintext passwords. Treat LLM output as untrusted data (not innerHTML, not SQL, not eval). For dependency supply chain: one authoritative lockfile, triaged audits, block install scripts unless approved, one dependency per upgrade PR.

**Flow equivalent**: None.

---

### performance-optimization (~340 lines / 2200 words)

**Shape**: Overview · When to Use · Measure First · The Optimization Process (4 steps) · Frontend Performance · Backend Performance · Database Optimization · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Never optimize without a measurement. Profile first to confirm the bottleneck is where you think it is. Fix one thing at a time and remeasure. For frontend: Core Web Vitals (LCP, CLS, INP) with specific thresholds. For backend: identify N+1 queries, add missing indexes, cache appropriately. For database: EXPLAIN queries, index at read time not write time.

**Flow equivalent**: None.

---

### git-workflow-and-versioning (355 lines / 2131 words)

**Shape**: Overview · When to Use · Core Principles (5 + trunk-based dev) · Branching Strategy · Working with Worktrees · The Save Point Pattern · Change Summaries · Pre-Commit Hygiene · Handling Generated Files · Using Git for Debugging · Release & Versioning · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Commit every successful increment. Each commit does one logical thing. Message explains the why, not the what (uses conventional commit format: feat/fix/refactor/test/docs/chore). Never mix formatting changes with behavior changes. Write a "CHANGES MADE / THINGS I DIDN'T TOUCH / POTENTIAL CONCERNS" summary after every modification. For releases: tag every release, derive version from tag, write a human-readable changelog entry (not `git log`), write the changelog entry with the change while impact is fresh.

**Flow equivalent**: None. Flow's gsave handles the commit-push mechanics but prescribes nothing about commit discipline, message format, or changelog.

---

### ci-cd-and-automation (390 lines / 1560 words)

**Shape**: Overview · When to Use · The Quality Gate Pipeline (diagram) · GitHub Actions Example · Security in CI/CD · Deployment Strategies · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Set up a quality gate pipeline: lint → type check → unit tests → build → integration tests → deploy. Shift left — catch problems as early as possible. Faster is safer: smaller batches reduce risk. Security in CI: never print secrets, use secret scanning, pin action versions, run dependency audits on every PR. Deployment strategies: blue-green, canary, rollback triggers.

**Flow equivalent**: None.

---

### deprecation-and-migration (247 lines / 1953 words)

**Shape**: Overview · When to Use · Core Principles (including Hyrum's Law) · The Deprecation Decision · Compulsory vs Advisory Deprecation · The Migration Process (5 steps) · Coexistence Patterns · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before deprecating, answer 5 questions: does it still provide unique value? how many consumers? does a replacement exist? what is migration cost per consumer? what is ongoing cost of NOT deprecating? Migrate consumers one at a time. Provide migration tooling. Use the expand-then-contract pattern for API migrations (add new → migrate consumers → remove old). Never break consumers without warning.

**Flow equivalent**: None.

---

### documentation-and-adrs (288 lines / 1470 words)

**Shape**: Overview · When to Use · Architecture Decision Records · Code Documentation · README Standards · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Write ADRs for architectural decisions (framework choice, data model, auth strategy). Before creating one, check for existing ADR conventions in the repo (`.adr-dir`, existing `docs/decisions/`, etc.) and match them exactly rather than imposing the template. ADR format: Status / Date / Context / Decision / Alternatives Considered. Write the ADR with the change, not after. Code documentation: explain why, not what; use docstrings for public APIs; never comment obvious code.

**Flow equivalent**: None. Flow's brainstorm records decisions in tree.md; Flow's execute records plans in ticket.md. Neither is an ADR.

---

### observability-and-instrumentation (203 lines / 1699 words)

**Shape**: Overview · When to Use · Process (4 steps) · Structured Logging · Metrics and Alerting · Tracing · Instrumentation Checklist · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Before instrumenting, write down 2–4 questions an on-call engineer will ask about this feature. Pick the right signal: structured logs for specific cases, metrics for aggregate rates/latency, traces for distributed call paths. Correlation IDs are mandatory — attach to every log line and outbound call. Log events as JSON objects with stable event names, not prose. Symptom-based alerts (error rate > threshold) not cause-based alerts (disk usage > 80%).

**Flow equivalent**: None.

---

### shipping-and-launch (310 lines / 1583 words)

**Shape**: Overview · When to Use · The Pre-Launch Checklist (6 sections) · Feature Flag Strategy · Staged Rollout · Monitoring and Alerting · Rollback Plan · Post-Launch Verification · Common Rationalizations · Red Flags · Verification

**What it makes the agent do**: Use a pre-launch checklist covering code quality, security, performance, accessibility, infrastructure, and documentation. Ship behind feature flags to decouple deployment from release. Use staged rollout (5% → 25% → 100%) with monitoring between stages. Define rollback triggers before launch. Monitor for 24 hours after launch.

**Flow equivalent**: None.

---

### using-agent-skills (191 lines / 1307 words)

**Shape**: Overview · Skill Discovery (routing flowchart) · Core Operating Behaviors (6 rules) · Failure Modes to Avoid · Skill Rules · Lifecycle Sequence · Quick Reference Table

**What it makes the agent do**: This is the meta-skill. It is injected at session start by the `session-start.sh` hook. It provides a routing flowchart that maps incoming tasks to specific skills. It also establishes six always-on operating behaviors that apply regardless of which skill is active: surface assumptions explicitly before acting, stop and name confusion rather than proceeding with a guess, push back on approaches with clear problems, prefer the simplest solution, maintain scope discipline (touch only what the task requires), and verify — never assume a task is complete without evidence.

**Flow equivalent**: None. Flow's routing is implicit in skill descriptions and the CLAUDE.md workflow section. The explicit routing chart and the six always-on operating behaviors are unique to this meta-skill.

---

## Skills with no Flow counterpart (priority order)

1. **debugging-and-error-recovery** — general systematic debugging. Flow's remaining.md lists this as must-build.
2. **test-driven-development** — no test authorship skill in Flow at all.
3. **code-review-and-quality** — on Flow's remaining.md as blocking.
4. **interview-me** — no intent-extraction step before brainstorm in Flow.
5. **context-engineering** — no explicit skill; partially in CLAUDE.md rules.
6. **git-workflow-and-versioning** — Flow has gsave but no discipline skill.
7. **security-and-hardening** — not addressed anywhere in Flow.
8. **code-simplification** — no equivalent.
9. **ci-cd-and-automation** — no equivalent.
10. **frontend-ui-engineering** — no equivalent.
11. **api-and-interface-design** — no equivalent.
12. **deprecation-and-migration** — no equivalent.
13. **documentation-and-adrs** — no equivalent (Flow records decisions in brainstorm trees).
14. **observability-and-instrumentation** — no equivalent.
15. **shipping-and-launch** — no equivalent.
16. **performance-optimization** — no equivalent.
