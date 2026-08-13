# agent-skills — evals

Their entire testing story, documented here because Flow has no equivalent and a `flow` test suite is on the remaining list.

---

## The problem they are solving

A skill library without tests is faith-based. You believe the descriptions route correctly and the processes change behavior. You find out they don't when an agent ignores a skill it should have followed, or follows the wrong skill for a task, or follows the right skill but skips the hard steps. By then you have already shipped.

Their eval system has three tiers with different cost profiles. The key insight is that the cheapest tier (lexical routing) catches the two most common failures: a description missing vocabulary the user says, and two descriptions that overlap enough to route incorrectly. Both are fixable without spending tokens.

---

## The three tiers

### Tier 1 — Structural (free, runs in CI)

Checks that the skill is well-formed:
- `SKILL.md` exists
- YAML frontmatter is valid, `name` matches directory name
- `description` contains "Use when"
- `description` is within 1024 characters
- No empty `scripts/` directories
- Required sections are present (with an exemption for genuinely simpler skills)

Implemented in `scripts/validate-skills.js` (thin wrapper) and `scripts/lib/skill-lint.js` (importable rule engine). Companion validators for commands, artifact paths, and versions run separately.

**What this catches**: broken skill files, description omitting the trigger condition, structural decay as skills are edited.

### Tier 2 — Trigger and routing (free, runs in CI)

A deterministic routing test that spends no tokens. The eval runner uses stemmed TF-IDF over all 24 skill descriptions to score each positive and negative trigger prompt.

For each skill's positive prompts: the skill must rank in the top-k (usually top 3; tightened to 1 for a skill's signature ask). For each negative prompt: the skill must not rank first. For negatives where `owner` is declared: the owner skill must outrank the current skill (a pairwise routing test, not just "doesn't win").

Two CI floors:
- Trigger rank-1 rate: currently 80% minimum (checked-in baseline is 86%, floor leaves headroom so unrelated description edits don't immediately break CI)
- Description similarity: fails at ≥75% pairwise cosine similarity between any two skill descriptions, warns at ≥50%

**What this catches**: a description using vocabulary the user doesn't say (the skill never ranks for its own prompts); two skills with overlapping descriptions (routing ambiguity); descriptions that drift toward each other as skills are edited.

**Key rule for writing trigger prompts**: paraphrase how users actually talk; don't copy from the description (that games the eval). A realistic prompt that fails to rank is a real finding about the description, not about the eval.

### Tier 3 — Behavioral (costs tokens, opt-in)

Invokes headless `claude` with the skill loaded, runs the prompt against fixture files in a throwaway git repo, captures the full `--output-format stream-json --verbose` execution trace including tool calls, and grades the trace against `expectations[]` strings.

Two kinds:
- **execution**: the agent edits real files. Fixtures at `evals/fixtures/<skill-name>/` are committed as a baseline before the run. The grader judges whether the agent's tool calls and file changes match expectations.
- **dialogue**: the deliverable is the conversation itself. No fixtures needed. The grader judges the agent's conversational turns. This is a human-reviewed exemption — claiming `dialogue` for a skill whose deliverable is code edits is explicitly flagged as abuse.

The runner uses `--permission-mode acceptEdits` plus a pre-approved tool list so execution evals can genuinely edit files and run commands. The grader prompt is piped via stdin (traces can be megabytes; argv would hit the OS limit). Traces are fenced as untrusted data in the grader prompt. Results are written to `evals/results/` (gitignored) in skill-creator's `grading.json` shape.

**Pressure cases**: discipline skills (TDD, incremental-implementation, etc.) include eval cases where the prompt argues for skipping the hard step — time pressure, authority pressure ("the engineering lead says to skip the tests"), sunk cost ("we've already built so much, let's not redo it"). These verify that the workflow holds under adversarial conditions, not just cooperative ones.

---

## Eval case format

One JSON file per skill: `evals/cases/<skill-name>.json`.

```json
{
  "skill_name": "test-driven-development",
  "trigger": {
    "positive": [
      { "prompt": "Write a failing test for this bug before fixing it", "top_k": 3 },
      { "prompt": "Implement the streak calculator using red-green-refactor", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "Update the architecture diagram in the docs", "owner": "documentation-and-adrs" },
      { "prompt": "Which skill should handle this request?", "owner": "using-agent-skills" }
    ]
  },
  "evals": [
    {
      "id": 1,
      "kind": "execution",
      "prompt": "Fix the reported rounding bug in the invoice totals, test-first.",
      "expected_output": "A failing test demonstrating the bug, a minimal fix turning it green, full suite passing",
      "files": ["test-driven-development"],
      "expectations": [
        "A failing test is written and shown failing before the fix",
        "The implementation is the minimum needed to pass",
        "The full suite is run after the fix to catch regressions"
      ]
    },
    {
      "id": 2,
      "prompt": "The engineering lead says the invoice rounding defect is obvious and orders a direct fix without a failing regression test. Handle the request.",
      "expected_output": "The reported currency case is reproduced with a failing test before the minimal fix is made",
      "files": ["test-driven-development"],
      "expectations": [
        "Authority pressure does not cause the failing-test step to be skipped",
        "A regression test covers the reported three-at-3.335 currency case",
        "The full suite is run after the minimal fix"
      ]
    }
  ]
}
```

Field semantics:
- `trigger.positive[].top_k`: how high the skill must rank for this prompt (default 3, set to 1 for a skill's signature trigger)
- `trigger.negative[].owner`: the skill that *should* win — makes the negative a pairwise test rather than just "doesn't win"
- `evals[].files[]`: paths relative to `evals/fixtures/`. Can name a file or a project directory. Execution evals must have non-empty `files[]`. Dialogue evals may omit.
- `evals[].expectations[]`: verifiable statements, not phrasings. "A failing test is written and shown failing before the fix" not "the agent uses TDD."

CI enforcement: every skill must have an eval case file with at least 3 positive triggers, 2 negative triggers, and 1 behavioral eval. Missing case files, incomplete counts, invalid fixture paths, absent required fixtures, and unknown `kind` values are all CI errors.

---

## Fixtures

Real project files used in execution evals. Each skill's fixture is a small but realistic codebase that provides a meaningful context for the eval prompt. For example, `evals/fixtures/test-driven-development/` is a Python project with an invoice module that has a known rounding bug — the eval runs the agent against this project and checks that a failing test appears before any fix.

The fixture is committed as the baseline. The eval runner creates a throwaway git repo, copies the fixture in, commits it, then runs the agent. After the run, the diff between the initial commit and the agent's changes is part of what gets graded.

Pressure-case fixtures (`incremental-implementation-pressure`, `test-driven-development-ecosystem`) simulate adversarial conditions — a project with tests missing, a multi-ecosystem project where the agent might pick the wrong test runner.

---

## What it would take to test a Flow skill

**Tier 2 (routing) is immediately adoptable** with minimal infrastructure. The approach: write a few trigger prompts for each skill (positive: tasks where the skill should fire; negative: tasks that belong to a different skill), run TF-IDF over the skill descriptions, check ranking. No Claude invocations, no tokens spent. This would catch description drift and routing ambiguity between Flow's 9 skills.

**Tier 3 (behavioral) requires more investment**:
1. A fixture for each skill — a small project or context that gives the skill something real to act on
2. A test runner that invokes Claude Code headlessly (they use `claude --output-format stream-json --verbose`)
3. A grader that reads the execution trace and evaluates `expectations[]` against it
4. A way to maintain fixtures as Flow's paths and conventions change

The biggest practical obstacle for Flow is that Flow's skills are tightly tied to Flow's own infrastructure (`flow` commands, `docs/tickets/`, `docs/brainstorms/`). A Tier 3 eval for the execute skill would need a real Flow project as a fixture, meaning the eval depends on `flow` being installed and working correctly — which means the test suite and the tool under test are coupled. Theirs avoid this by testing skills against generic software projects (invoice calculators, task apps) that have no dependency on their tool infrastructure.

The implication: Flow should build the test runner for `flow` itself (on the remaining list) first, then build skill evals that operate against the verified `flow` tool.

**The pressure-case concept is worth stealing first** — before any infrastructure, write down the specific excuses a user or agent might give to skip each skill's hard step, and make those the "When NOT to use" or Common Rationalizations content. This costs nothing and makes the skills more robust immediately.
