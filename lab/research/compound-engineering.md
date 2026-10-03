# Compound Engineering

Read 2026-10-04 from `repos/workflows/compound-engineering-plugin/`, version 3.30.3. A plugin of 36 skills by Every, about 25,000 stars, MIT. It runs on 14 agent hosts, Claude Code, Codex and Cursor among them. Its pitch is Flow's closest: "AI skills that make each unit of engineering work easier than the last", and "Run one teaches it. Run two remembers."

## Table of contents

- [How it works](#how-it-works): the loop, the lessons, the rule packs
- [Against the README's comparison](#against-the-readmes-comparison): one cell per row
- [What Flow could take](#what-flow-could-take): 6 ideas, best first
- [What Flow does that it lacks](#what-flow-does-that-it-lacks): the rows where Flow leads
- [What each loads into a session](#what-each-loads-into-a-session): measured at session start

## How it works

**The loop is 6 skills**: `/ce-brainstorm` writes what to build, `/ce-plan` adds how, `/ce-work` builds it, `/ce-simplify-code` cleans it, `/ce-code-review` reviews it, and `/ce-compound` writes down what was learned. `/lfg` runs the whole loop with no questions, through commit, pull request and a watch on CI.

**A lesson is one file per solved problem**, under `docs/solutions/<area>/` in the project. The repository holds 66 of its own. Frontmatter carries `problem_type`, `component`, `severity`, `tags` and `last_updated`. `/ce-plan` and `/ce-brainstorm` search them before writing, so the next plan meets the lesson.

**A lesson must pass a bar before it is written**: "if the learning document disappeared, would a future engineer reading the final implementation still be likely to repeat the mistake or redo substantial investigation?" A no writes nothing. Effort and diff size never qualify a lesson. One run writes one lesson, since batching leaks drafting labels such as "Learning 3" into the files.

**`/ce-compound-refresh` checks old lessons against the code as it is now**, and updates or retires the ones that went wrong.

**A Compound Pack is a folder of rules shared across repositories**, experimental. Each rule file carries `title` and `applies_when` in its frontmatter. A project names its packs in `.compound-engineering/config.yaml`. Planning reads the rules that apply, and review checks the code against them, citing the rule file for each finding.

**It ships no hooks.** Everything runs through skills the agent or the user calls. Every setting lives in `.compound-engineering/config.yaml`, with a local override beside it.

**The skills are short, with the detail in references read at the step that needs it.** The longest `SKILL.md` is 122 lines. `CONCEPTS.md` names the shape: a "phase-loaded kernel" keeps the outcome, the done condition and the phase order in the body, and names a required read right before each step. An earlier read never counts for the step's read.

## Against the README's comparison

A column for it, each cell checked against the clone:

- **Design before code**: Brainstorm into a requirements plan, with its claims checked
- **Task tracking**: Plan files
- **Long sessions**: A handoff skill
- **Self-improvement**: Writes each solved problem as a lesson the next plan reads, kept in that repository
- **Rule enforcement**: Shared rule packs, checked at review (experimental)
- **Multi-machine sync**: Only what you commit
- **Skill management**: No
- **Installation**: Plugin install
- **Hooks and guardrails**: None
- **Supported agents**: Claude Code, Codex, Cursor and 11 more

Flow still leads on self-improvement. A Compound Engineering lesson stays in the repository that learned it, packs aside, and changes no skill. Flow files a lesson into its own skills, its rules and a wiki every project reads.

## What Flow could take

1. **A bar for what capture files.** `home/AGENTS.md` → `capture-at-checkpoints` ends "Unsure: write it." Compound Engineering's counterfactual is the opposite default for lessons about code: write nothing the final code already teaches. The bar fits wiki findings and project notes. Preferences and corrections are a different case: the code never teaches them.
2. **A refresh of stored knowledge against the code.** Nothing in Flow checks a wiki finding or a `docs/context/` note against the tree it describes. `flow scorecard` covers checks only. A refresh pass, run on request or by `/flow:research` before it trusts a finding, would catch notes gone wrong.
3. **A sizing test for plans.** A guard, retry, mode or abstraction nobody asked for gets built only when an existing contract requires it, when leaving it out lets harm land before anyone notices, or when adding it later is expensive. A concern that fails is written down as considered and not built, with its reason. `skills/phases/execute/` could carry it into planning and `references/review-code.md`.
4. **The required read at the step.** "An earlier read does not satisfy the acting-point read" closes a gap Flow's skills share: a reference read early, then followed from memory. One line in `references/cut-loaded-files.md` would carry it.
5. **Retuning for a new model by measurement.** `/ce-retune` refuses to run without a way to replay a task on 2 builds. It runs 2 identical copies first to find the noise, and writes the bar down before changing anything. Flow's study cases are the replay. The method fits the day Flow moves to a new model.
6. **A test before treating a decision as settled.** `/ce-brainstorm` reads `references/settled-decisions.md` before skipping a question the conversation seems to have answered, so it neither re-asks a decided question nor promotes a passing remark into a decision. `/flow:groundwork` meets the same case.

Not worth taking: small work ending in chat with no file. Flow ruled on 2026-10-01 that every phase works on a ticket.

## What Flow does that it lacks

- **Hooks.** No guard, no failure log, no context meter, no refused `/compact`.
- **A ticket system.** Work lives in plan files and pull requests.
- **An automatic handoff.** `/ce-handoff` runs only when called.
- **Anything across machines** past what git carries.
- **Skill management.** It is one plugin, installed whole.

## What each loads into a session

Measured 2026-10-04 in characters, about 4 to a token, before the first message:

- **Compound Engineering**: 8,900, the names and descriptions of 36 skills. No rule file, no hook.
- **Superpowers**: 2,400 of descriptions, plus its `using-superpowers` skill, about 3,100, injected by a session-start hook.
- **Flow**: 14,550 for `home/AGENTS.md`, plus 1,600 of descriptions, plus 101 for the reminder on every message.

Flow loads the most, about 4,000 tokens, because its rules do work the others leave out: the reply's shape, capture, the git limits. Calling Flow lighter on context would be wrong at session start. Whether Flow's handoffs save more over a long task than its rules cost is unmeasured.
