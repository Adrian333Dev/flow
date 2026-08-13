---
name: research
description: Investigate before working from potentially stale knowledge — recommending a tool, writing a spec or plan against a library's API, or implementing with one. Fetches current docs (llms.txt route with local caching), escalates to source-code investigation, delegates heavy reading to subagents, and uses external-LLM prompts for broad comparative research.
---

# Research

**Never work against an external tool from training memory alone.** Above all when writing a plan — a plan written from memory bakes a stale API into every step of it.

**Trigger:** would a developer facing this step normally Google it, read the docs, or check the source before committing? If yes, research first.

---

## How deep to go

Four levels. Match depth to the work, escalate when the current level cannot answer, never start higher than needed.

1. **Targeted question** — one API, one config flag, "is X still maintained?" → Context7 or a single doc-page fetch. Inline, quick.
2. **Working against a tool** — planning or building a feature on it → fetch its current docs by the llms.txt route below, cache them, read the relevant pages before freezing any API into a spec or plan.
3. **Deep customization** — extending a library past what its docs describe → docs will not answer it. Clone the source and read the code: `git clone --depth 1 <repo> tmp/refs/<tool>/repo`. Clone without asking — read-only and cheap — just announce it.
4. **Landscape** — surveying what exists, comparing options in depth, a domain you barely know → external prompt research, below.

## Getting current docs — the llms.txt route

Two files most tools publish: **`llms.txt`**, an index linking to per-page markdown docs, and **`llms-full.txt`**, the whole docs in one file, often megabytes. These are the most complete and current machine-readable docs there are — prefer them over Context7 for anything past level 1, which can lag.

Fetch with the bundled script, run from the project root:

```bash
bash ~/.claude/skills/research/scripts/fetch-docs.sh <tool> <domain> [extra-urls...]
# e.g.  bash ~/.claude/skills/research/scripts/fetch-docs.sh inngest inngest.com
```

It chains every known candidate URL, keeps real hits only (rejects HTML error pages), grabs **both** variants when both exist, saves to `tmp/refs/<tool>/`, and records source URL and fetch date in `_sources.md` there. A newly discovered URL pattern is added to the script, never to this file.

Using what came back:

- **`llms.txt`** — small; read it whole. It is the navigation map: pick the pages the task needs and fetch those too, by passing their URLs to the script.
- **`llms-full.txt`** — **never read inline.** Grep it, read the matching slices. A searchable corpus, not a document.
- Exact signatures and copy-paste examples come from these cached files verbatim. WebFetch summarizes — fine for "how does X work", wrong for a precise signature.
- The cache survives sessions and tickets. Check `tmp/refs/<tool>/` before re-fetching; re-run the script when starting new work and the stamped dates look old.

**No llms.txt anywhere:** Context7 → web search for the official docs, fetching useful pages into the same cache → ask the user for content or URLs. Never fall back to training memory.

## Delegating heavy reading

Megabytes of docs or a cloned codebase read inline burns the main context. Level 2 past a few pages, and level 3 always: delegate the reading to a subagent on a cheaper model. The main agent reads only the findings file.

The brief assumes **zero** conversation context:

- the question(s), precisely stated
- the constraints that shape the answer — stack, versions, decisions already locked
- the sources: cache paths under `tmp/refs/<tool>/`, the clone path, or URLs to fetch
- required output: findings written into the question's research file, each one citing where in the sources it came from

## External prompt research

Level 4 only — synthesis across many independent sources, where a dedicated deep-research tool beats an in-house subagent.

**1. Write one prompt per question.** Self-contained, one question each, carrying the constraints that matter: language, framework, stack decisions already made. Mark each **normal** (focused search plus synthesis, right for most) or **deep** (extensive multi-source synthesis, 5–20 minutes, when many options need comparing).

**Which LLM to name**, from repeated head-to-head runs on real tasks. Recommend in this order, and say why when it is not the first:

1. **Claude** (Sonnet/Opus) — the default. Strongest on accuracy, critical coverage, and catching the decisive gotcha; usually safe to act on with light verification.
2. **ChatGPT**, including Deep Research — solid fallback, well-calibrated about its own uncertainty. Double-check install commands and citations.
3. **DeepSeek** — good on concrete mechanism detail; verify citations, sometimes fabricated, especially in "Expert" mode.
4. **Gemini** — weakest here. Expect citation artifacts and dubious package names; fact-check before acting.

Write each prompt into its own research file before presenting it, then hand over the paths with the prompt text: *"Please run these with your preferred LLMs and paste each report back under its prompt."*

**2. Wait.** Do not proceed or speculate until the reports are back. Each report goes into the same file as its prompt — paste it yourself if handed a path or raw text.

**3. Read and synthesize.** What was learned, what direction it supports, what caveats and open questions surfaced. Then recommend.

## Where it goes

**Fetched upstream material** — docs, clones — stays in `tmp/refs/<tool>/`. Gitignored, refetchable, disposable.

**The research itself** — one file per question, the prompt or question at the top and the findings below it in the same file. Same shape whether an external LLM, a subagent or you answered it.

`docs/research/<question>.md` — **flat, and shared by the whole project.** Never inside a ticket or a brainstorm folder: the same question gets asked again by different work, and a report buried in one ticket is a report nobody finds. No project here → beside the file you are working in.

Level 1 answers inline, no file. Level 2 and up always writes one.

**Distilled conclusions** land where the work lives, with source URLs and dates:

- brainstorm running → the branch it belongs to in `map.md`, with a pointer to the full report
- spec or `## Plan` being written → straight into the relevant section, pointer included
- a durable fact rather than a finding — a verified command, a settled convention → `docs/context/<subject>.md`

## Hard rules

- **Never freeze an external API into a spec, plan or code from training memory alone.**
- **Research before recommending**, not after — never pick a direction and then look for evidence for it.
- **State what you are researching and why** before touching any tool.
- **Don't over-research.** Enough for a confident answer at the current level → stop and answer.
- **`llms-full.txt` is grep-only.**
- **Heavy reading goes to a subagent**, not the main context.
- **Record findings.** The synthesis has to survive compaction.
