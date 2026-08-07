# Workflow Rules

Rules for how the agent should behave during the milestone flow. Separate from `conventions.md` — these govern process and agent behavior, not code style.

Every rule must be **concrete and followable**.

---

## Milestone planning

### One formal milestone at a time
Only one milestone has a `spec.md` + `plan.md` at any moment. The next milestone is formalized only after the current one ships. A loose `docs/work/roadmap.md` of upcoming work is fine and expected; it is not a commitment.

### Milestone size limit
Before writing a plan, estimate the task count. If the plan will require more than ~6 tasks, pause and propose splitting into sub-milestones (`m01a-…`, `m01b-…`). A milestone should be completable in a single focused session. Surface this to the user before writing the plan — not after.

### Milestone scope
One feature per milestone. If scope grows during planning or implementation, split into sub-milestones rather than expanding the current one.

### Milestone type declaration
Declare the milestone type in `spec.md`. Type drives skill selection and review depth:

| Type | Description | Implementation skill |
|------|-------------|---------------------|
| `scaffold` | Configs, tooling, project structure. No domain logic. | `executing-plans` |
| `feature` | New behavior, domain logic, API endpoints, UI. | `subagent-driven-development` |
| `refactor` | Structural changes without behavior change. | `executing-plans` |

### Issues log
Create `docs/work/milestones/<slug>/issues.md` at the start of every milestone. Append anything surprising, broken, or inefficient as it happens. Review and promote entries to `workflow-rules.md` or `conventions.md` at milestone wrap (`superpowers:finishing-a-development-branch`).

---

## Skill selection

### scaffold and refactor milestones → executing-plans
For scaffold/config/refactor milestones: use `superpowers:executing-plans` inline. The two-stage subagent review per task is overkill for config files and structural moves — it burns credits without proportional quality gain.

### feature milestones → subagent-driven-development
For feature milestones with domain logic and multi-file integration: use `superpowers:subagent-driven-development` with the full two-stage review cycle. The review overhead is warranted for code with real behavioral complexity.

---

## Task design in plans

### No placeholders
Every task in `plan.md` must contain real file paths, real code, and real commands. Never write "TBD", "TODO", "implement later", "add appropriate handling", or similar. If you cannot write the real content, the plan is not ready.

### User-delegated commands
When a plan task is "run a command" (package installs, framework init commands, migrations, etc.), delegate it to the user. Structure the plan step as:

```
**User runs:**
\```bash
<package-manager> add <package>
\```
Expected: package in node_modules, manifest updated.
```

Agent file edits and user-run commands are separate concerns. Mixing them is a credit sink and adds unnecessary risk.

### No agent-run interactive CLIs
Framework scaffolding commands are interactive, may conflict with existing files, and are cheap for the user to run. Never execute these — always delegate. Document expected output so the user knows what to verify.

---

## During implementation

### Two-strike rule on failures
After **two consecutive failures** on the same command, edit, or approach:
1. Stop — do not attempt a third variation.
2. Write a "stuck brief":
   - What was attempted (commands and edits)
   - The exact error
   - Hypothesis about root cause
   - What you'd try next
3. Wait for user input before continuing.

Applies to: command failures, persistent test failures, type errors that don't resolve after two fixes, linter errors that survive two attempts.

### No retry-same
Never run the exact same command twice without changing something first. If a command failed, something must change (a file edit, a flag, a different approach) before running it again.

### Limit file re-reads per task
Do not re-read the same file more than twice in a single task. Re-reading the same file repeatedly is a signal the task scope is too large — finish the current subtask, then re-orient.

### Batch reads before edits
At the start of a task, read all files needed in parallel before beginning any edits. Do not interleave reads and edits.

---

## Verification

### Mandatory build check
Every milestone must pass the full pipeline before verification is considered complete. Run lint, typecheck, and build as defined in `docs/agents/commands.md`. All must pass.

This is non-negotiable. Broken lint or types = milestone not done, regardless of spec compliance.

### Verification covers behavior, not just spec
Spec compliance is necessary but not sufficient. Verification must also confirm:
- Full build pipeline passes
- No new type errors or linter errors introduced
- Relevant tests pass

---

## Git

### Never run git mutations
Never run `git add`, `git commit`, `git push`, `git reset`, `git checkout`, `git rebase`, `git merge`, `git stash`, `git clean`, or any branch/worktree mutation. Always suggest the command for the user to run.

### Single commit per milestone
All milestone work goes into one commit at milestone wrap. Never suggest per-task commits.

```bash
git add .
git commit -m "feat(<milestone-slug>): <milestone-name>"
```

Use `git add .` — never list individual files. Per-task commits are only appropriate when a milestone explicitly spans independent features that warrant separate history.

---

## Tooling

### External packages via package manager only
Always use the project's package manager add/remove commands for external dependencies. Never edit the manifest file directly for external deps — omit the version to install latest. Local monorepo packages may be added to the manifest directly since they have no published versions.

### CLI-first setup
Never hand-create files that an official CLI generates (manifests, framework configs, tsconfig, etc.). Use init commands and delegate them to the user.

---

## Living documents

### Keep docs current
When you discover or apply a convention not listed in `docs/agents/conventions.md`, suggest adding it. When you use a command not listed in `docs/agents/commands.md`, suggest adding it. When a new process rule emerges, suggest adding it here.

The three living docs: `conventions.md`, `commands.md`, `workflow-rules.md`.

---

## Credit efficiency

### Match review depth to task risk
- Config files, manifest edits, framework config: quick self-check only, no two-stage subagent review.
- Domain logic, API endpoints, message passing, state management: full two-stage review.

### Escalate rather than thrash
If something isn't working after two attempts, the cost of continuing to guess almost always exceeds the cost of surfacing the problem to the user. Escalate with a clear brief and wait. Thrashing is the most expensive failure mode.
