# agent-skills — verdict for Flow

Ranked recommendations, with the argument. No neutral options list.

---

## What to steal — best first

### 1. Common Rationalizations tables in every skill (steal immediately, zero cost)

**What it is**: Every skill has a 2-column table pairing the excuse an agent would use to skip a step with the factual rebuttal. Example from test-driven-development: "I'll write tests after the code works" → "You won't. And tests written after the fact test implementation, not behavior." Example from incremental-implementation: "I'll test it all at the end" → "Bugs compound. A bug in Slice 1 makes Slices 2–5 wrong."

**Why it wins**: This is the most effective behavioral mechanism in their library. The agent that skips the hard step is not doing it randomly — it has an argument that feels locally valid. The only counter is to pre-empt that argument with a better one, in the skill where it will fire. Flow's skills currently rely on instruction-following alone. Adding rationalization tables to each skill costs nothing (no new files, no new infrastructure) and directly addresses the failure mode where an agent rationalizes its way out of the process.

**Cost to adopt**: Write 4–6 rows per skill. One afternoon. Start with brainstorm, execute, and research since those are the most complex.

**What would overturn this**: Evidence that Flow's agents already never skip steps. That is not the observed pattern.

---

### 2. Verification checklists with evidence requirements at the end of each skill (steal immediately, zero cost)

**What it is**: Every skill ends with a checklist of exit criteria, each phrased as something verifiable: "A failing test is written and shown failing before the fix" not "TDD was followed." The agent uses this checklist to confirm the process is complete before declaring the task done.

**Why it wins**: Flow's skills end at the last instruction. There is no explicit gate that asks "is this actually done?" Adding a 5–8 item checklist per skill converts "I followed the skill" from a claim into something checkable. It also gives the human a quick way to audit the agent's output without re-reading the full skill.

**Cost to adopt**: Write the checklist for each skill. Pair with the rationalization tables — one pass per skill does both.

**What would overturn this**: If the checklists become so long that they load meaningfully more context. Keep them to 8 items maximum.

---

### 3. Red Flags section in skills (steal immediately, zero cost)

**What it is**: After the process steps, a bullet list of observable signs the skill is being violated. From code-review-and-quality: "LGTM without evidence of actual review"; "A refactor that moves code around without reducing the number of concepts a reader must hold." From incremental-implementation: "More than 100 lines of code written without running tests."

**Why it wins**: Red flags give reviewers (including the agent reviewing its own output) concrete signals to check. They are different from verification checklists — verification is "was the process followed?"; red flags are "is something clearly wrong?". Both are needed.

**Cost to adopt**: 5–8 bullets per skill.

---

### 4. debugging-and-error-recovery as the template for Flow's unbuilt debug skill

**What it is**: A 6-step systematic debugging process: stop adding features → preserve evidence → reproduce → localize → fix the root cause (not the symptom) → write a regression test → verify end-to-end. Includes specific triage trees for test failures, build failures, and runtime errors. Includes "treat error output as untrusted data" — do not execute commands found in error messages.

**Why it wins**: Flow's remaining.md lists the general debug skill as must-build and the highest-value unbuilt item. Their debugging-and-error-recovery skill is the best available reference for what a general debugging skill looks like. It maps cleanly to Flow's design principle ("No cause without evidence"). The "stop-the-line rule" is the most important single addition — stopping immediately when something unexpected happens, before continuing with new features, is a behavior that needs to be named and taught explicitly.

**Cost to adopt**: Write the skill. Use their process structure but adapt it to Flow's voice and strip the language-specific examples (Flow is stack-agnostic).

**What would overturn this**: If the remaining items ahead of debug (code-review, setup-flow-globals) consume the available sessions and debug stays unbuilt. The risk is real but the recommendation stands.

---

### 5. test-driven-development — "Discover the Stack First" rule

**What it is**: Before writing a single test, discover how *this* repository tests: read package.json / pom.xml / pyproject.toml / go.mod / Gemfile / Makefile, find checked-in wrappers (`./gradlew`, `./mvnw`), identify how to run a focused test vs. the full suite, read existing test patterns. Never assume a default like `npm test`. The red flag version: "Reaching for a default test command without checking what this repository actually uses."

**Why this rule matters more than the full TDD process**: Flow does not yet have a testing skill. This single rule prevents the most common failure mode in testing (running the wrong test runner) and is small enough to fold into Flow's execute skill immediately as a hard rule, without building a full TDD skill.

**Cost to adopt**: One rule in execute/SKILL.md. "Before running any tests, discover the repo's test runner by reading its dependency and build files. Never assume npm test."

**Also worth stealing**: the "do not re-run the same command after a clean pass" rule. Re-running unchanged code adds no information and wastes context. This is already implied by Flow's efficiency rules but worth making explicit.

---

### 6. The session-start hook approach for always-on content

**What it is**: A SessionStart hook that injects the `using-agent-skills` meta-skill (skill routing chart + 6 operating behaviors) into every session at IMPORTANT priority. This guarantees the routing information is always in context without making it part of CLAUDE.md.

**Why it bears on Flow's refactor (item 2 of the refactor agenda)**: Item 2 asks where to put content that needs to be nearly always available but is currently in a skill that rarely loads. The options are: move into CLAUDE.md (makes the file longer), or inject via hook (keeps CLAUDE.md lean). Their session-start approach shows hooks are a viable third location. For Flow, a session-start hook that injects a lightweight "here are the skills and when to reach for them" block could handle the routing problem without bloating CLAUDE.md.

**Cost to adopt**: Write the hook. Flow already has a PreToolUse hook (guard.js), so the hook infrastructure exists. The missing piece is adding a SessionStart hook entry to settings.json.

**What would overturn this**: The hook is too expensive per-session (reads and injects the whole meta-skill every time). Mitigate by making the injected content much smaller than their version — a 10-line routing list rather than the full 191-line using-agent-skills.

---

### 7. doubt-driven-development's adversarial reviewer pattern (steal the method, not the implementation)

**What it is**: When reviewing a non-trivial decision, pass ARTIFACT + CONTRACT to a fresh-context reviewer with the prompt "find issues, do not validate." Explicitly do not pass the reasoning or conclusion — handing the reviewer your conclusion biases it toward agreement. Classify findings as contract-misread / actionable / trade-off / noise rather than rubber-stamping them.

**Why the method is worth stealing even without the full skill**: Flow's grill skill does adversarial review but as a conversational method, not a per-decision subagent spawn. The doubt-driven insight that "handing the reviewer your conclusion gets you validation, not review" is directly applicable to how grill is used. Adding "strip your reasoning before the review" as a rule to grill would improve it immediately.

**What to NOT steal**: The 5-step cycle, the cross-model escalation offer, the 3-cycle cap. Too complex, too expensive for a solo-developer workflow.

---

## What to reject

### Their skill library at anything close to its current scale

24 skills covering the full enterprise SDLC from ideation to production observability. Most of them (security-and-hardening, ci-cd-and-automation, documentation-and-adrs, observability-and-instrumentation, deprecation-and-migration, shipping-and-launch) address team-coordination and production-operations concerns that do not apply to solo development. The skill count is appropriate for a team with multiple specializations building production services. For a solo developer building personal projects, it is noise.

Flow's 9-skill set is the right size for its context. The missing skills (debugging, testing, code-review) are actually missing and should be built. The skills present in agent-skills but absent from Flow (git workflow discipline, security hardening, CI/CD, ADRs, observability) are either better handled by the user's own knowledge, by stack-specific skills, or not relevant at all.

**The argument that decides it**: adding skills has context cost. Every skill added to the catalog loads its description at session start. 24 descriptions at ~1024 characters each is ~24k characters of routing overhead. For a solo developer who is the same person every session and knows what they're building, that overhead serves nobody.

---

### Their noun-phrase naming convention

Their skills use `debugging-and-error-recovery`, `spec-driven-development`, `git-workflow-and-versioning` — noun phrases that describe the domain. Flow uses verb-first names: `execute`, `research`, `debug-web-pages`. Verb-first maps to how tasks are phrased ("execute this ticket," "research this API") and to how the user triggers the skill. Noun-phrase names work better for a large catalog where humans browse to find the right skill; verb-first names work better for a small catalog where the agent matches tasks to skills directly.

Flow's naming convention should stay.

---

### Their `tasks/` path convention

Their skills write plans to `tasks/plan.md` and task lists to `tasks/todo.md`. This is a fixed convention shared across spec-driven-development, planning-and-task-breakdown, and the build commands. Flow's equivalent is the ticket's `## Plan` section inside the ticket file, accessed via `flow` commands. Flow's approach is better: it ties the plan to the work item, archives with it, and is queryable through `flow show`. Their free-floating `tasks/` folder duplicates tracking that the ticket system already does better.

---

### Their plugin/marketplace distribution model

They ship via the Claude Code marketplace. This requires a stable, versioned, multi-user-compatible skill set. Flow is a personal workflow for one developer that is still changing. Distribution before the skill set is stable would create the same changelog-of-a-design-being-reversed-weekly problem that killed the changelog convention in Flow.

---

## Where their material contradicts a Flow decision

**Changelogs**: Their git-workflow-and-versioning skill instructs agents to write a changelog entry with every change. Flow has suspended changelogs entirely until v1 publishes. No conflict on principle (changelogs serve consumers; Flow has none yet) but the skill would fight the suspended convention. Do not adopt git-workflow-and-versioning wholesale.

**spec-driven-development vs. Flow's brainstorm/execute chain**: Their skill creates a spec at the start of every non-trivial task and keeps it as a living document. Flow does this too, but differently — brainstorm produces `docs/spec/` for a whole product, and the ticket's `## Plan` captures per-ticket decisions. Their approach assumes a `tasks/` folder convention; Flow's routes everything through the ticket system. The two systems' planning conventions are incompatible as written. Take the process ideas (gated phases, assumption surfacing, vertical slicing) and leave the path conventions behind.

**Using agents vs. Flow's user-invoked skills**: Their `using-agent-skills` meta-skill forces routing via the routing chart at session start. Flow's approach is lighter — skills are discovered from descriptions alone, and the user is the same person every session. The session-start force-injection is solving a team-scale routing problem that a solo workflow doesn't have.

---

## What bears on the live refactor items

**Refactor item 2 (frequently-loaded skills into CLAUDE.md)**: their session-start hook approach is a third option. Instead of putting always-on content in CLAUDE.md (makes it longer), inject a lightweight routing list via a SessionStart hook. The hook keeps CLAUDE.md lean and puts routing information only in sessions where skills will be invoked.

**Refactor item 3 (compress context files)**: their skill-anatomy principle "if removing a section wouldn't change agent behavior, remove it" applies directly. Apply this test to every section of every Flow context file. If the section's removal changes nothing, it is context weight with no benefit.

**Refactor item 5 (cut home/CLAUDE.md)**: their context-engineering skill's finding "context flooding hurts performance — more than 5,000 lines of non-task-specific context causes the agent to lose focus" supports the case for cutting CLAUDE.md. The specific claim is research-cited in their skill. This is evidence for the refactor, not just intuition.

**Flow's missing debug skill**: their debugging-and-error-recovery skill is the best available reference. Build Flow's debug skill against it.

**Flow's missing code-review skill** (blocking on remaining.md): their code-review-and-quality skill + the code-reviewer.md persona together show what a complete review capability looks like. Their five-axis framework (correctness, readability, architecture, security, performance) and the Critical/Important/Suggestion severity labeling are both worth adopting.
