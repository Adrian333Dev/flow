---
name: research
description: Researches any subject. Finds a skill, plugin, library, tool, existing solution or anything else. Reverse engineers tools, investigates source code and more. Keeps what it learns about each outside tool in one folder per tool, shared by every project, and asks Context7 for quick answers from a library's docs.
---

# Research

**Never work against an external tool from training memory alone.** Above all when writing a plan: a plan written from memory bakes a stale API into every step of it.

**Say what you are researching and why before touching any tool.**

**Research before recommending.** A direction picked first turns every source into evidence for it.

**Research any subject.** A question with no tool behind it, such as market research, has no docs or source to read. It uses level 4 and the report file below.

## A question about a tool starts from its folder

`~/.flow/wiki/<tool>/` holds what Flow knows about one outside tool, shared by every project on the machine: shortcuts into the docs, research reports, findings, and this machine's downloads. `references/wiki.md` holds its layout and what may be added or rewritten. Read it before the first write into a tool's folder.

1. **The tool's domain skill comes first**, when one is loaded: it holds what earlier harvests gathered.
2. **Open `~/.flow/wiki/<tool>/`**, creating it on the first research about the tool. Print the finding count, and whether `flow skills ls <tool>` finds a skill: `next.js: 7 findings, no skill`.
3. **Read the files in `research/` and `findings/` whose names match the question.** Answered → stop, with no outside request.
4. **Follow `index.md`**: the page listed for the topic, or the Context7 id, which skips Context7's search.
5. **Go outside**, by the levels below.
6. **Write back**: a line in `index.md` for the page that answered, and a report in `research/` past level 1.

## Look for what already solves it

**Search before building or reading anything.** 2 starting points:

- **A need with no tool yet** → anything that already solves it, fully or partly: a library, CLI, service, app, skill, plugin or MCP server. Name what a partial fit leaves unsolved.
- **A tool already chosen** → a skill, plugin or MCP server for it, before reading a line of its documentation. A skill written by the people who build the tool is worth more than the docs it was made from.

1. **Search these at once:**
   - **Every skill Flow can reach:** `flow skills ls <pattern>`. Each pattern is a regular expression over the name and the description, and a skill shows when it matches every one. It covers your private skills, the domain-skills repository and every other skill repository Flow has. `flow skills ls --source domain-skills` lists one repository whole.
   - **The toolbox**, a catalog of outside tools with notes from real use, at `~/.flow/repos/toolbox/`. Read its `README.md`, then search the folders that could hold an answer, the way it says. No folder there → `flow install` clones it.
   - **skills.sh**, an index of public skills: `npx skills find <the need, or the tool's name>`. For a tool already chosen, add `--owner <its maker's GitHub account>`. It finds tools too, whenever a tool ships a skill.
2. **A skill `flow skills ls` found in `domain-skills` or your private skills needs no judging.** Turn it on: `flow skills on <name>`. One from any other repository is judged in step 4 first.
3. **When nothing from step 1 fits, search outward:**
   - **Skills on GitHub:** `gh search code <word> --filename SKILL.md`
   - **Plugin marketplaces:** `gh search code <word> --filename marketplace.json`
   - **MCP servers:** `curl 'https://registry.modelcontextprotocol.io/v0/servers?search=<word>'`
   - **The web.** For a chosen tool, name it with the words `skill`, `plugin` and `mcp`.
   - **Still nothing:** write a level 4 prompt, below, and name ChatGPT for it. It searches GitHub well.
4. **Judge what comes back by `~/.flow/references/knowledge.md`.** A skill → `## An outside skill`: the review, then used whole or harvested. A service → `## Reach a service through a command`. Pick which to read first:
   - **Rank by publisher first:** the tool's own maker beats anyone else. Then the repo's stars and last push.
   - **Weigh install counts least.** The CLI reports them anonymously, and nothing verifies them.
   - **Read the top 3** in full before recommending one, and name what the others lose on.
5. **Write down what you found, including finding nothing**, wherever this question's report goes, under `## Where it goes`. The next session asking the same question reads that instead of searching again.

**Adopting a skill:**

- Used whole → `flow skills add <owner/repo> <name>`, which clones the repository and turns the skill on for this project.
- Harvested → `flow skills add <owner/repo>`, no name, which clones it and switches nothing. Tell the user it waits for the harvest.

## How deep to go

4 levels. Match depth to the work, escalate when the current level cannot answer, and never start higher than needed. Enough for a confident answer at the current level → stop and answer.

1. **Targeted question**: one API, one config flag, "is X still maintained?" → Context7, below, or a single doc-page fetch. A bug's explanation → the tool's issues: `gh search issues <words> --repo <owner/repo>`. Inline, quick.
2. **Working against a tool**: planning or building a feature on it → its downloads, by the llms.txt route below. Read the relevant pages before freezing any API into a spec or plan.
3. **Deep customization**: extending a library past what its docs describe → docs will not answer it. Clone the source and read the code: `fetch-docs.sh <tool> - --repo <owner/repo> --clone` puts it in `downloads/repo/`, or pulls a clone already there. Clone without asking, read-only and cheap, just announce it.
4. **Landscape**: surveying what exists, comparing options in depth, a domain you barely know → external prompt research, below.

## Context7

A web service answering a question from a library's docs, for one version where it holds that version. Called through the bundled script, never an MCP server:

```bash
bash ~/.agents/skills/flow/skills/research/scripts/context7.sh search next.js "redirect signed-out users"
bash ~/.agents/skills/flow/skills/research/scripts/context7.sh ask /vercel/next.js "redirect signed-out users" --tool next.js
bash ~/.agents/skills/flow/skills/research/scripts/context7.sh ask next.js@v15.1.8 "redirect signed-out users"
```

- **`search`** prints each library Context7 holds under the name: its id, branch, the day Context7 last read it, and the versions it can pin.
- **`ask <id> ... --tool <folder>`** writes the id into the folder's `index.md` once it has answered. After that, **`ask <folder>`** skips the search. `@<version>` pins a version.
- **Pick the version first**, from the tool's version in the project's lockfile:
  - Context7 lists that version → pin it.
  - The project is on the latest release, and Context7 last read the tool after that release → no version. Context7 then answers from the tool's development branch. `npm view <package> time` dates every release, and `gh release list --repo <owner/repo>` does it outside npm.
  - Anything else → skip Context7, and read the tool's own docs for the project's version.
- **Never save an answer.** Write the page it came from into `index.md` → `## Pages by topic`, under the topic it answered.
- **`context7: unavailable (...)`** → the pages in `index.md` whose topic fits, then the downloads, then web search. A used-up monthly quota prints the same line.
- **`context7: Library ... not found`** for an id `index.md` gave → search again, then ask with `--tool`, which rewrites the line.

## Getting current docs: the llms.txt route

2 files most tools publish: **`llms.txt`**, an index linking to per-page markdown docs, and **`llms-full.txt`**, the whole docs in one file, often megabytes. These are the most complete and current machine-readable docs there are. Past level 1, prefer them over Context7, which lags.

Fetch with the bundled script, from any folder:

```bash
bash ~/.agents/skills/flow/skills/research/scripts/fetch-docs.sh <tool> <domain> [--package <npm name>] [--repo <owner/repo>] [--clone] [page-urls...]
# e.g.  bash ~/.agents/skills/flow/skills/research/scripts/fetch-docs.sh next.js nextjs.org --package next
```

It chains every candidate URL, keeps real hits only, grabs **both** variants where both exist, and saves to `~/.flow/wiki/<tool>/downloads/`, pages into `pages/`. `_sources.md` there logs each file's address, the date, and the tool's latest release that day, read from `--package` or else `--repo`. **Add a newly discovered URL pattern to the script, never to this file.**

Using what came back:

- **`llms.txt`**: small; read it whole. It is the navigation map: pick the pages the task needs and fetch those too, by passing their URLs to the script.
- **`llms-full.txt`**: **never read inline.** Grep it, read the matching slices. A searchable corpus, not a document.
- Exact signatures and copy-paste examples come from these downloaded files verbatim. WebFetch summarizes: fine for "how does X work", wrong for a precise signature.
- **Download again only for a newer version.** Opening a download inside a project, read the tool's version from the lockfile:
  - Newer than the release in `_sources.md` → run the script again, then read.
  - The same or older → read what is there. Older means the docs may describe what the project lacks: check what they say against Context7 pinned to the project's version, or the tool's docs for that version.
  - No project, or the tool missing from the lockfile → read what is there.

**No llms.txt anywhere:** Context7 → web search for the official docs, saving useful pages with the script → ask the user for content or URLs. Never fall back to training memory.

## Delegating heavy reading

**`Explore` is the agent.** Claude Code ships it read-only and built for reading. Where the job has to run something before it can read, `general-purpose` does the same work with the full tool set.

**Dispatch on how much there is to read.** The level never decides it. A cloned codebase, megabytes of downloaded docs, a question that means opening 20 files: that much reading buries the session it lands in. Send it out and read the findings. A page or two, one grep for a signature, a file whose name you already have: read it here. A dispatch costs a brief, a wait, and everything the subagent saw but never wrote down.

**The brief is a handoff**: `/flow:handoff` writes it, delivered in the subagent's prompt rather than as a file. 3 things it carries that belong to reading specifically:

- **The sources**: paths under `~/.flow/wiki/<tool>/downloads/`, the clone at `downloads/repo/`, or URLs to fetch.
- **The question**, precisely stated, with the constraints that shape the answer: stack, versions, decisions already locked.
- **The output**: findings written into the question's research file, each citing where in the sources it came from.

## External prompt research

Level 4 only: synthesis across many independent sources, where a dedicated deep-research tool beats an in-house subagent.

**1. Write one prompt per question.** Self-contained, one question each, carrying the constraints that matter: language, framework, stack decisions already made. Mark each **normal** (focused search plus synthesis, right for most) or **deep** (extensive multi-source synthesis, 5–20 minutes, when many options need comparing).

**Which LLM to name**, from repeated head-to-head runs on real tasks. Recommend in this order, and say why when it is not the first:

1. **Claude** (Sonnet/Opus): the default. Strongest on accuracy, critical coverage, and catching the decisive gotcha; usually safe to act on with light verification.
2. **ChatGPT**, including Deep Research: solid fallback, well-calibrated about its own uncertainty. Double-check install commands and citations.
3. **DeepSeek**: good on concrete mechanism detail; verify citations, sometimes fabricated, especially in "Expert" mode.
4. **Gemini**: weakest here. Expect citation artifacts and dubious package names; fact-check before acting.

Write each prompt into its own research file before presenting it, then hand over the paths with the prompt text: *"Please run these with your preferred LLMs and paste each report back under its prompt."*

**2. Wait.** Do not proceed or speculate until the reports are back. Each report goes into the same file as its prompt: paste it yourself if handed a path or raw text.

**3. Read and synthesize.** What was learned, what direction it supports, what caveats and open questions surfaced. Then recommend.

## Where it goes

**One file per question**, the prompt or question at the top and the findings below it in the same file. Same shape whether an external LLM, a subagent or you answered it.

- A quick question, level 1 → no file.
- About one outside tool, true in any project → `~/.flow/wiki/<tool>/research/<question>.md`.
- About no single tool, true in any project: a comparison, a technique, a field → `~/.flow/research/<question>.md`.
- True only for this project: its users, its market, a client's old system → `docs/research/<question>.md`.
- Unsure → `docs/research/`, since an unsure report may hold project details. Outside a project → `~/.flow/research/`.

**Never write a project's or a client's details into `~/.flow/`.** It goes to GitHub, and every project reads it.

- **A question about 2 tools** → the folder of the tool it is mostly about, with a line in the other tool's `index.md`.
- **A survey run for a project decision splits**: the survey to `~/.flow/`, the pick to `docs/spec/product.md` or `tech.md`, its reason naming the survey. A decision never goes in the report.
- **Research done with an outside LLM** is no separate kind: its prompt and the pasted report go wherever the list puts the question.

`docs/research/` and `~/.flow/research/` are **flat**. Never put a report inside a ticket or a groundwork folder: the same question gets asked again by different work, and a report buried in one ticket is a report nobody finds.

**A question reading can answer never becomes a ticket of its own.** Answering one produces a report and no code, so it runs here, inside whatever work raised it, or goes to a subagent. A question needing something built and run is a `prototype` ticket, and `/flow:groundwork` cuts it.

Level 1 answers inline, no file. Level 2 and up always writes one: the synthesis has to survive compaction.
