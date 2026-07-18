---
name: research
description: Investigate external tools, libraries, APIs, or solution options before making technical recommendations. Two modes: direct tools for targeted lookups, external prompts for broad or comparative research.
---

# Research

Investigate before committing. When a technical recommendation depends on knowledge you might not have — the full landscape of options, current API behavior, a recently released tool — research it first rather than reasoning from incomplete or potentially stale training data.

**Trigger:** Would a developer facing this same decision normally Google it or read docs before committing? If yes, research before recommending.

This applies broadly: finding the best solution to a problem, comparing library options, verifying how an API works today, discovering what tools exist in a space you have limited knowledge of.

---

## Mode selection

Pick based on scope:

**Direct tools** — for small, targeted lookups where a focused search yields the answer:
- Verifying current API syntax or behavior
- Checking how a specific library works today
- Confirming a tool exists and is maintained
- Tools available: Context7 MCP, web search, llms.txt files, codebase read

**External prompts** — for broad or comparative research requiring synthesis across multiple sources:
- Surveying what options exist for a problem
- Comparing multiple libraries or approaches in depth
- Understanding a domain where your knowledge is limited
- Any research that would require reading several independent sources

The test: if a single well-focused lookup would answer it, use direct tools. If you'd need to synthesize across multiple sources, use external prompts.

---

## Direct tool research

1. State what you're looking up and why — one sentence before touching any tool.
2. Use the appropriate tool (Context7 for library docs, web search for current information, codebase read for existing patterns).
3. Synthesize findings into a brief summary.
4. Record the synthesis:
   - **During brainstorming:** write to `brainstorm.md` under `## Research: [topic]`
   - **During write-spec:** incorporate directly into the relevant spec section
5. Return to the task with the verified facts.

---

## External prompt research

### Step 1 — Generate research prompts

Write one prompt per distinct research question. Each prompt must be:
- **Self-contained** — readable by an external LLM with no context from this conversation
- **Focused** — one clear question per prompt
- **Specific** — include relevant constraints (language, framework, existing stack decisions)

For each prompt, signal the depth needed:

- **Normal research** — focused web search plus synthesis. Right for most questions.
- **Deep research** — extensive multi-source synthesis. Use when the question requires comparing many options in depth or reading multiple long documents. Expect 5–20 minutes.

Present the prompts to the user:

> "I need research on the following before I can make a confident recommendation. Please run these with your preferred LLMs and share the report file path(s) when done:
>
> **Prompt 1 [Normal research]:**
> [self-contained prompt]
>
> **Prompt 2 [Deep research]:**
> [self-contained prompt]"

### Step 2 — Wait for reports

Wait for the user to provide file path(s). Do not proceed or speculate until the reports are available.

### Step 3 — Read and synthesize

Read the report files. Synthesize:
- What did we learn?
- What's the recommended direction based on the research?
- Any caveats or open questions the research surfaced?

Record the synthesis:
- **During brainstorming:** write to `brainstorm.md` under `## Research: [topic]`, referencing the report file paths
- **During write-spec:** incorporate directly into the relevant spec section

Return to the task with the verified findings.

---

## Hard rules

- **Research before recommending**, not after. Don't commit to a direction and then look for evidence that supports it.
- **State what you're researching and why** before running any tool.
- **Don't over-research.** If you already have enough to make a confident recommendation, make it. Research has a cost.
- **Record findings.** Synthesis must survive compaction — write it to `brainstorm.md` or the spec, not just conversation context.
