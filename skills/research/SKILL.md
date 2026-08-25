---
name: research
description: ALWAYS invoke before working against an external tool from memory — recommending one, writing a spec or plan against a library's API, or implementing with it. Also whenever a step is one a developer would normally Google, read the docs for, or check the source on before committing.
---

# Research

**Never work against an external tool from training memory alone.** Above all when writing a plan — a plan written from memory bakes a stale API into every step of it.

**Say what you are researching and why before touching any tool.**

**Research before recommending.** A direction picked first turns every source into evidence for it.

## How deep to go

Four levels. Match depth to the work, escalate when the current level cannot answer, and never start higher than needed. Enough for a confident answer at the current level → stop and answer.

1. **Targeted question** — one API, one config flag, "is X still maintained?" → Context7 or a single doc-page fetch. Inline, quick.
2. **Working against a tool** — planning or building a feature on it → fetch its current docs by the llms.txt route below, cache them, read the relevant pages before freezing any API into a spec or plan.
3. **Deep customization** — extending a library past what its docs describe → docs will not answer it. Clone the source and read the code: `git clone --depth 1 <repo> tmp/refs/<tool>/repo`. Clone without asking — read-only and cheap — just announce it.
4. **Landscape** — surveying what exists, comparing options in depth, a domain you barely know → external prompt research, below.

## Getting current docs — the llms.txt route

Two files most tools publish: **`llms.txt`**, an index linking to per-page markdown docs, and **`llms-full.txt`**, the whole docs in one file, often megabytes. These are the most complete and current machine-readable docs there are. Past level 1, prefer them over Context7, which lags.

Fetch with the bundled script, run from the project root:

```bash
bash ~/.claude/skills/research/scripts/fetch-docs.sh <tool> <domain> [extra-urls...]
# e.g.  bash ~/.claude/skills/research/scripts/fetch-docs.sh inngest inngest.com
```

It chains every candidate URL, keeps real hits only, grabs **both** variants where both exist, and saves to `tmp/refs/<tool>/` with source URL and fetch date in `_sources.md`. **Add a newly discovered URL pattern to the script, never to this file.**

Using what came back:

- **`llms.txt`** — small; read it whole. It is the navigation map: pick the pages the task needs and fetch those too, by passing their URLs to the script.
- **`llms-full.txt`** — **never read inline.** Grep it, read the matching slices. A searchable corpus, not a document.
- Exact signatures and copy-paste examples come from these cached files verbatim. WebFetch summarizes — fine for "how does X work", wrong for a precise signature.
- The cache survives sessions and tickets. Check `tmp/refs/<tool>/` before re-fetching, and re-run the script when new work starts and the stamped dates look old.

**No llms.txt anywhere:** Context7 → web search for the official docs, fetching useful pages into the same cache → ask the user for content or URLs. Never fall back to training memory.

## Delegating heavy reading

**`Explore` is the agent.** Claude Code ships it read-only and built for reading. Where the job has to run something before it can read, `general-purpose` does the same work with the full tool set.

**Dispatch on how much there is to read.** The level never decides it. A cloned codebase, megabytes of cached docs, a question that means opening twenty files: that much reading buries the session it lands in. Send it out and read the findings. A page or two, one grep for a signature, a file whose name you already have: read it here. A dispatch costs a brief, a wait, and everything the subagent saw but never wrote down.

**The brief is a handoff** — `/handoff` writes it, delivered in the subagent's prompt rather than as a file. Three things it carries that belong to reading specifically:

- **The sources** — cache paths under `tmp/refs/<tool>/`, the clone path, or URLs to fetch.
- **The question**, precisely stated, with the constraints that shape the answer: stack, versions, decisions already locked.
- **The output** — findings written into the question's research file, each citing where in the sources it came from.

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

`docs/research/<question>.md` — **flat, and shared by the whole project.** Never inside a ticket or a groundwork folder: the same question gets asked again by different work, and a report buried in one ticket is a report nobody finds.

**A question never becomes a ticket of its own.** Answering one produces a report and no code, so it runs here, inside whatever work raised it, or goes to a subagent.

Level 1 answers inline, no file. Level 2 and up always writes one — the synthesis has to survive compaction.
