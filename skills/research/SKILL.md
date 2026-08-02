---
name: research
description: Investigate before working from potentially stale knowledge — recommending a tool, writing a spec or plan against a library's API, or implementing with one. Fetches current docs (llms.txt route with local caching), escalates to source-code investigation, delegates heavy reading to subagents, and uses external-LLM prompts for broad comparative research.
---

# Research

Never work against an external tool from training memory alone. When the task depends on knowledge that may be stale or incomplete — a library's current API, the landscape of options, a recently released tool — verify first. This applies at every phase: recommending during a brainstorm, writing a spec, and above all **writing a plan** — a plan written from memory bakes stale APIs into every task.

**Trigger:** would a developer facing this step normally Google it, read the docs, or check the source before committing? If yes, research first.

---

## How deep to go

Four rungs — match depth to what the work needs. Escalate when the current rung can't answer; never start higher than needed.

1. **Targeted question** — one API, one config flag, "is X still maintained?" → Context7 or a single doc-page fetch. Inline, quick.
2. **Working against a tool** — planning or building a feature on it → fetch its current docs via the llms.txt route below, cache them locally, read the relevant pages before freezing any API into a spec or plan.
3. **Deep customization** — extending a library beyond what its docs describe → docs won't answer it; clone the source (`git clone --depth 1 <repo> tmp/refs/<tool>/repo`) and investigate the code directly. Clone without asking — it's read-only and cheap; just announce it in the turn.
4. **Landscape** — surveying what exists, comparing options in depth, a domain you barely know → external prompt research (below).

## Getting current docs — the llms.txt route

Most tools publish `llms.txt` (an index linking to per-page markdown docs) and/or `llms-full.txt` (the entire docs in one file, often megabytes). In practice these are the most complete and current machine-readable docs — prefer them over Context7 for anything past rung 1 (Context7 can lag).

Fetch with the bundled script (in this skill's folder), run from the project root:

```bash
bash ~/.claude/skills/research/scripts/fetch-docs.sh <tool> <domain> [extra-urls...]
# e.g.  bash ~/.claude/skills/research/scripts/fetch-docs.sh inngest inngest.com
```

It chains the known candidate locations, keeps real hits only (rejects HTML error pages), grabs **both** variants when both exist, saves everything to `tmp/refs/<tool>/`, and records source URL + fetch date in `_sources.md` there.

Known location patterns (append newly discovered patterns here):

- `https://<domain>/llms.txt` · `https://<domain>/llms-full.txt`
- `https://docs.<domain>/llms.txt` · `https://docs.<domain>/llms-full.txt`
- `https://<domain>/docs/llms.txt` · `https://<domain>/docs/llms-full.txt`

Using what you fetched:

- **`llms.txt`** — small; read it whole. It's the navigation map: pick the pages the task needs and fetch them too (pass their URLs to the script — many sites serve doc pages as raw markdown).
- **`llms-full.txt`** — **never read inline** (megabytes). Grep it, read the matching slices. It's a searchable corpus, not a document.
- Exact API signatures and copy-paste examples come from these cached verbatim files. WebFetch summarizes — fine for "how does X work", wrong for precise signatures.
- The cache persists across sessions and milestones — check `tmp/refs/<tool>/` before re-fetching. Refresh (re-run the script) when starting new work against a tool and the stamped fetch dates look old.

**Fallback when no llms.txt exists anywhere:** Context7 → web search for the official docs (fetch useful pages into the same cache) → ask the user to supply content or URLs. Never silently fall back to training memory.

## Delegating heavy reading

Reading megabytes of docs or a cloned codebase inline burns the main context. For rung 2 beyond a few pages, and rung 3 always, delegate the reading to a subagent on a cheaper model (e.g. Sonnet under an Opus main agent).

The brief must be self-contained — zero conversation context assumed:

- the question(s), precisely stated
- project constraints that shape the answer (stack, versions, decisions already locked)
- the sources: cache paths under `tmp/refs/<tool>/`, the clone path, or URLs to fetch
- required output: findings written into the question's research file (below), each finding referencing where in the sources it came from

The main agent reads only the findings file.

## External prompt research

For rung 4 — research needing synthesis across many independent sources, where dedicated deep-research tools beat an in-house subagent.

### Step 1 — Generate research prompts

Write one prompt per distinct research question. Each prompt must be:
- **Self-contained** — readable by an external LLM with no context from this conversation
- **Focused** — one clear question per prompt
- **Specific** — include relevant constraints (language, framework, existing stack decisions)

For each prompt, signal the depth needed:

- **Normal research** — focused web search plus synthesis. Right for most questions.
- **Deep research** — extensive multi-source synthesis; expect 5–20 minutes. Use when the question requires comparing many options in depth.

**Which LLM to name**, from repeated head-to-head runs on real research tasks — recommend in this order, and say why when it isn't the first:

1. **Claude** (Sonnet/Opus) — the default. Strongest on accuracy, critical coverage, and catching the decisive gotcha; usually safe to act on with light verification.
2. **ChatGPT** (incl. Deep Research) — solid fallback, well-calibrated about its own uncertainty. Double-check install commands and citations.
3. **DeepSeek** — good on concrete mechanism detail; verify citations, sometimes fabricated (especially "Expert" mode).
4. **Gemini** — weakest here; expect citation artifacts and dubious package names, fact-check before acting.

Write each prompt into its own research file (below) before presenting it. Then hand the user the paths along with the prompt text:

> "I need research on the following before I can make a confident recommendation. Please run these with your preferred LLMs and paste each report back under its prompt: …"

### Step 2 — Wait for reports

Wait. Do not proceed or speculate until the reports are back. Each report goes into the same file as its prompt — paste it yourself if the user hands you a path or the raw text instead.

### Step 3 — Read and synthesize

Read the report files. Synthesize: what did we learn, what direction does it support, what caveats or open questions surfaced.

Present the synthesis assuming the user has read **zero** lines of the reports — plain language: what the research found, what you conclude, what you recommend, and why. Never point at a report in place of explaining it.

## Where it goes

**Fetched upstream material** — docs, clones — stays in `tmp/refs/<tool>/`. Gitignored, refetchable, disposable.

**The research itself** — one file per question, the prompt or question at the top, the findings below it in that same file. Same shape whether an external LLM, a subagent, or you answered it.

- topic active → `docs/work/topics/t<NN>-<slug>/research/<NN>-<question>.md`
- no topic → `docs/work/research/<question>.md`

Rung 1 answers inline, no file. Rung 2 and up always writes one — the synthesis has to survive compaction.

**Distilled conclusions** land where the work lives, with source URLs and dates:

- brainstorm running → `brainstorm.md` under `## Research: <topic>`
- spec or plan being written → straight into the relevant section
- reference meant for reuse across milestones → `docs/refs/` (committed; flat files unless one genuinely needs a folder)

## Hard rules

- **Never freeze an external API into a spec, plan, or code from training memory alone.** Verify first.
- **Research before recommending**, not after — don't pick a direction and then look for evidence that supports it.
- **State what you're researching and why** before touching any tool.
- **Don't over-research.** Enough for a confident answer at the current rung → stop and answer.
- **`llms-full.txt` is grep-only.** Never read it inline.
- **Heavy reading goes to a subagent**, not the main context.
- **Record findings.** Synthesis must survive compaction — write it to the paths above.
