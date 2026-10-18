---
name: research
description: Researches any subject. Finds a skill, plugin, library, tool, existing solution or anything else. Reverse engineers tools, investigates source code and more. Keeps what it learns about each outside tool or field in wiki pages shared by every project, harvests reports and outside skills into them, and asks Context7 for quick answers from a library's docs.
---

# Research

**Say what you are researching and why before touching any tool.**

**Research before recommending.**

**Research any subject.** A question with no tool behind it, such as market research, uses level 4 and the report file below.
## A question starts from the wiki

`~/.flow/wiki/<subject>/` holds what Flow knows about one outside tool or field: `index.md`, topic pages, and this machine's downloads. Read `~/.flow/references/wiki.md` before any write into it.

1. **A loaded skill covering the subject comes first.**
2. **Read `index.md` and the pages whose names match the question.** Answered → stop, with no outside request.
3. **Read the reports whose names match**, in the project's `.flow/research/<topic>/`, or `~/.flow/research/<topic>/` outside a project. A report with no `harvested:` line → run `## Harvest` on it.
4. **Follow `index.md`**: the doc page listed for the topic, or the Context7 id, which skips Context7's search.
5. **Go outside**, by the levels below.
6. **Write back**: what was learned into the page owning it, a line in `index.md` for the doc page that answered, and a report past level 1. No folder → make it with `index.md` on the first write.

## Look for what already solves it

**Search before building or reading anything.** 2 starting points:

- **A need with no tool yet** → anything that already solves it, fully or partly: a library, CLI, service, app, skill, plugin or MCP server. Name what a partial fit leaves unsolved.
- **A tool already chosen** → its `index.md` → `## Skills` first, then a skill, plugin or MCP server for it, before reading a line of its documentation.

1. **Search skills.sh**, an index of public skills: `npx skills find <the need, or the tool's name>`. For a tool already chosen, add `--owner <its maker's GitHub account>`. It finds tools too, whenever a tool ships a skill. A skill already installed is in the session's skill list, which the wiki steps above check first.
2. **When nothing from step 1 fits, or the need is no skill:**
   - **MCP servers:** `curl 'https://registry.modelcontextprotocol.io/v0/servers?search=<word>'`
   - **The web.** For a chosen tool, name it with the words `skill`, `plugin` and `mcp`.
3. **Rare, only when steps 1 and 2 found nothing:**
   - **Skills on GitHub:** `gh search code <word> --filename SKILL.md`
   - **Plugin marketplaces**, repositories holding `.claude-plugin/marketplace.json`, the file Claude Code reads to list plugins: `gh search code <word> --filename marketplace.json`
   - **Still nothing:** write a level 4 prompt, below, and name ChatGPT for it. It searches GitHub well.
4. **Judge what comes back by `~/.flow/references/knowledge.md`.** A skill → `## An outside skill`: the review, then used whole or harvested. A service → `## Reach a service through a command`. Pick which to read first:
   - **Rank by publisher first:** the tool's own maker beats anyone else. Then the repo's stars and last push.
   - **Weigh install counts least.**
   - **Read the top 3** in full before recommending one, and name what the others lose on.
5. **Write down what you found, including finding nothing**: each skill reviewed into `index.md` → `## Skills`, the rest wherever this question's report goes, under `## Where it goes`.

**Adopting a skill**, only on the user's yes, after step 4's review:

- Used whole, and its repository holds `.claude-plugin/marketplace.json` → it is a plugin: `claude plugin marketplace add <owner/repo>`, then `claude plugin install <name>@<marketplace> --scope project`. The default scope, user, loads it in every project. Each other machine runs the install once more, and a third-party marketplace updates only on `claude plugin update <name>@<marketplace>`.
- Used whole, any other skill → `npx skills add <owner/repo> --skill <name>` installs it into the project's `.claude/skills/`, where git carries it. `-g` installs it into `~/.claude/skills/`, for every project on this machine. `npx skills update` brings it current, and `npx skills remove <name>` removes it.
- Harvested → read it from a throwaway clone in `tmp/`, then `## Harvest` on the user's yes.

## How deep to go

4 levels. Match depth to the work, escalate when the current level cannot answer, and never start higher than needed. Enough for a confident answer at the current level → stop and answer.

1. **Targeted question**: one API, one config flag, "is X still maintained?" → Context7, below, or a single doc-page fetch. Inline, quick.
2. **Working against a tool**: planning or building a feature on it → its downloads, by the llms.txt route below. Read the relevant pages before freezing any API into a spec or plan.
3. **Deep customization**: extending a library past what its docs describe → clone the source and read the code: `fetch-docs.sh <tool> - --repo <owner/repo> --clone` puts it in `downloads/repo/`, or pulls a clone already there. Clone without asking; announce it.
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

2 files most tools publish: **`llms.txt`**, an index linking to per-page markdown docs, and **`llms-full.txt`**, the whole docs in one file, often megabytes. Past level 1, prefer them over Context7, which lags.

Fetch with the bundled script, from any folder:

```bash
bash ~/.agents/skills/flow/skills/research/scripts/fetch-docs.sh <tool> <domain> [--package <npm name>] [--repo <owner/repo>] [--clone] [page-urls...]
# e.g.  bash ~/.agents/skills/flow/skills/research/scripts/fetch-docs.sh next.js nextjs.org --package next
```

It saves **both** variants where both exist to `~/.flow/wiki/<tool>/downloads/`, pages into `pages/`. `_sources.md` there logs each file's address, the date, and the tool's latest release that day, read from `--package` or else `--repo`. **Add a newly discovered URL pattern to the script, never to this file.**

Using what came back:

- **`llms.txt`**: small; read it whole. Pick the pages the task needs and fetch those too, by passing their URLs to the script.
- **`llms-full.txt`**: **never read inline.** Grep it, read the matching slices.
- **Download again only for a newer version.** Opening a download inside a project, read the tool's version from the lockfile:
  - Newer than the release in `_sources.md` → run the script again, then read.
  - The same or older → read what is there. Older means the docs may describe what the project lacks: check what they say against Context7 pinned to the project's version, or the tool's docs for that version.
  - No project, or the tool missing from the lockfile → read what is there.

**No llms.txt anywhere:** Context7 → web search for the official docs, saving useful pages with the script → ask the user for content or URLs.

## Delegating heavy reading

**Plan the reading here.**

1. **List the candidates** in one search, here or in one `general-purpose` agent. No deep reading yet.
2. **Pick the few worth a full read.**
3. **Read a short source here**: a page or two, one grep for a signature, a file whose name you already have.
4. **Send each long source to its own `general-purpose` subagent**: a cloned codebase, megabytes of downloaded docs, a question that means opening 20 files. Never 2 agents on one source. `~/.flow/references/subagents.md` says the rest.

**Dispatch on how much there is to read, never on the level.**

**A landscape too big for this session to hold the plan and the reports** → one `general-purpose` subagent runs these steps itself, dispatching its own readers.

**The brief is a handoff**: `/flow:handoff` writes it, delivered in the subagent's prompt rather than as a file. 3 things it carries that belong to reading specifically:

- **The source**: a path under `~/.flow/wiki/<tool>/downloads/`, the clone at `downloads/repo/`, or a URL to fetch.
- **The question**, precisely stated, with the constraints that shape the answer: stack, versions, decisions already locked.
- **The output**: findings written into the question's research file, each citing where in the sources it came from.

## External prompt research

Level 4 only: synthesis across many independent sources.

**1. Write one prompt per question.** Self-contained, one question each, carrying the constraints that matter: language, framework, stack decisions already made. Mark each **normal** (focused search plus synthesis, right for most) or **deep** (extensive multi-source synthesis, 5–20 minutes, when many options need comparing).

**Which LLM to name**: recommend in this order, and say why when it is not the first:

1. **Claude** (Sonnet/Opus): the default. Strongest on accuracy, critical coverage, and catching the decisive gotcha; usually safe to act on with light verification.
2. **ChatGPT**, including Deep Research: solid fallback, well-calibrated about its own uncertainty. Double-check install commands and citations.
3. **DeepSeek**: good on concrete mechanism detail; verify citations, sometimes fabricated, especially in "Expert" mode.
4. **Gemini**: weakest here. Expect citation artifacts and dubious package names; fact-check before acting.

Write each prompt into its own research file before presenting it, then hand over the paths with the prompt text: *"Please run these with your preferred LLMs and paste each report back under its prompt."*

**2. Wait.** Do not proceed or speculate until the reports are back. Each report goes into the same file as its prompt: paste it yourself if handed a path or raw text.

**3. Read and synthesize.** What was learned, what direction it supports, what caveats and open questions surfaced. Then recommend.

## Where it goes

**One file per question**: the header, then the question, then the findings. Same shape whether an external LLM, a subagent or you answered it. A level 1 question writes no file.

A report goes in `.flow/research/<topic>/<question>.md` of the project that asked. Outside any project it goes in `~/.flow/research/<topic>/<question>.md`. Other projects look in the wiki, which is where a report's facts end up.

**The topic is what the research served**: a tool, a field, a product idea (`reader-app`). Name the file for the question, the topic dropped: `context7/how-it-retrieves-docs.md`.

**Open the report with front matter, 4 fields:**

```markdown
---
question: how does the App Router redirect signed-out users?
researched: 2026-09-19
versions: next.js 16.3.5
for: planning sign-in for a web app
---
```

A value holding `: ` goes in double quotes.

**Write settled facts into the wiki page owning them, in the same pass.**

**Never write a project's or a client's details into `~/.flow/`.**

- **A survey run for a project decision splits**: the survey to the project's `research/`, the pick to the file under `docs/spec/` that owns it, its reason naming the survey. A decision never goes in the report.
- **Research done with an outside LLM** is no separate kind: its prompt and the pasted report go wherever the list puts the question.

**Never put a report inside a ticket or a groundwork folder.**

**A question reading can answer never becomes a ticket of its own.** It runs here, inside whatever work raised it, or goes to a subagent. A question needing something built and run is a prototype, and `/flow:groundwork` runs it in the walk.

## Harvest

Runs at the end of every research pass, on the report just written.

1. **Walk the report section by section.** Keep each lasting fact about the tool or field that would make a fresh agent wrong without it, whatever the question was.
2. **Add each fact to the page owning it**, or start a page, by `~/.flow/references/wiki.md`. Only add. A fact contradicting a line already there stays out, and the report stays unstamped: `/flow:upkeep` settles it.
3. **Write `harvested: <date>` in the report's header**, last.
4. **An outside skill** is read whole and harvested the same way. Mark its `## Skills` line `harvested at <commit>`, then delete the throwaway clone, unless a skill from that repository is used whole.
