# Knowledge base

How Flow learns about the world outside the project, and where it keeps what it learns. `/flow:research` answers a question about an outside tool or a field, starting from what earlier research left behind. Capture files what a session taught into the place that will be read next time. Knowledge about an outside tool or a field lives in wiki pages, one folder per subject, shared by every project and every machine. Raw research reports sit apart, in topic folders, until a harvest takes what holds into the pages.

## Scope

- **In**: `/flow:research`, Context7, downloaded docs, the wiki of outside tools, research reports, capture's destinations for knowledge, findings, and `/flow:file-findings`' routing.
- **Out**: what makes a rule or writes a check, in `docs/spec/rules.md`. Reviewing, adopting and harvesting an outside skill, in `docs/spec/skills.md`. The failure log, in `docs/spec/failure-log.md`. Tickets, in `docs/spec/tickets.md`.

## Where everything lands

Each path, and what writes it:

```text
~/.flow/                                  the machine: shared by every project, carried by flow sync
├─ wiki/<subject>/                        one folder per outside tool or field
│  ├─ index.md                            /flow:research: what it is, the version in use, the docs, the skill covering it
│  ├─ <topic>.md                          capture, /flow:research: clean knowledge, edited in place
│  └─ downloads/                          fetch-docs.sh: this machine's alone, never synced
└─ research/<topic>/<question>.md         /flow:research: raw reports asked outside any project, none at first

<project>/                                the project: .flow/ rides the branch flow
├─ .flow/research/<topic>/<question>.md   /flow:research: raw reports this project asked for
├─ .flow/findings/<what-was-learned>.md   capture → /flow:file-findings, into a skill or rule
├─ .flow/inbox.md                         capture: anything with no home yet
├─ docs/context/<subject>.md              capture: a fact only some work here needs
└─ CLAUDE.md                              capture: a fact most sessions here need
```

## Behaviors

### Research

- `V1` **A question about a tool or a field starts from its wiki folder**: a loaded skill covering it, then `index.md` and the pages whose names match, then the reports in its research topic folder, then outside sources, then what was learned written into the page. An answer found in the folder makes no outside request.
- `V1` **Research searches for what already solves a need before building or reading anything**: skills.sh first, then skills, plugin marketplaces and MCP servers on GitHub and the web. An outside skill found is judged by `docs/spec/skills.md`.
- `never` **The toolbox as research's catalog of outside tools**, dropped 2026-10-12 (`fw-94`): most of its 166 cards are productivity tools and Flow alternatives no work needs. Nothing migrates. `fw-62`'s library is the later replacement.
- `V1` **4 levels of depth, never starting higher than needed**: a targeted question answered inline, working against a tool from its downloaded docs, deep customization from its cloned source, and a landscape survey through a prompt the user runs in an outside LLM.
- `V1` **A failure inside an outside tool is searched in its issues first**, by `/flow:debug`: `gh search issues <words> --repo <owner/repo>`, where most explanations live.
- `V1` **The main session plans the reading**: what is already written first, then one cheap list of candidates, then the few worth a full read. Short sources are read in the main session. Each long one goes to its own `general-purpose` subagent, never 2 on one source, decided by how much there is to read and never by the level. The brief names the source, the question, the report file and a stopping point. Decided 2026-10-12 (`fw-100`, `reports/token-costs.md`): the measured waste was a whole job handed to one agent that chose alone what to read, and sibling agents reading the same files.
  - Refused: `Explore` as the reader. It skips every `CLAUDE.md`, so no Flow rule reaches it, and it cannot write its findings as it goes.
  - Refused: a planner subagent by default. It repeats the whole-job dispatch with a layer added. Kept for a landscape too big for the main session to hold the plan and the reports.
- `V1` **One file per question, the question at the top and the findings under it.** A level 1 question writes no file.
- `V1` **A report goes in `research/<topic>/` of the project that asked.** The Flow home counts as a project: research asked outside any project goes to `~/.flow/research/<topic>/`, which holds nothing until then.
- `V1` **A report sits in a topic folder, never directly under `research/`.** The topic is what the research served: a tool, a field or a product idea (`reader-app`), since a raw report mixes subjects. The file is named for its question, the topic dropped: `context7/how-it-retrieves-docs.md`.
- `V1` **A report opens with front matter holding `question`, `researched`, `versions` and `for`**, and gains `harvested: <date>` once its facts are in the wiki.
- `V1` **No rule deletes a report.** A delete needs the user's yes, and never while an open ticket or the spec cites it. Decided 2026-10-11 (`fw-94`): a report is raw input to the wiki, a newer report on one question almost never comes, and an unused tool may return in another project.
  - Refused: an archive for reports a newer one replaced, or whose purpose ended.
- `V1` **A survey run for a project decision splits**: the survey to the project's `research/`, the pick to the spec file that owns it, its reason naming the survey.
- `V1` **A question reading can answer never becomes a ticket of its own.** A question needing something built and run is a `prototype` ticket.
- `later` **An MCP search server in place of `WebSearch` and `WebFetch`**, once Flow runs off Anthropic's servers, where both stop. Parallel first, since its free endpoint needs no key.

### Context7

Context7 is a web service that answers a question from a library's docs, for one version where it holds that version.

- `V1` **A quick question goes to Context7 first. Building against a tool goes to the tool's own docs first**, since Context7 lags.
- `V1` **The version is picked before asking**, from the project's lockfile. Context7 holds that version → pin it, `/vercel/next.js/v15.1.8`. The project is on the latest release, and Context7 read the tool after that release → ask with no version. Anything else → skip Context7, and read the tool's docs for that version.
- `V1` **Flow works fully without Context7.** The script gives up after 15 seconds, on any error, or on a used-up quota, and prints one line. Research then tries `index.md`'s pages, the downloads, then web search. Ruled 2026-09-19.
- `V1` **No Context7 answer is ever saved.** The answer's page goes into `index.md` under its topic. Ruled 2026-09-19: the same question rarely comes twice, and a shortcut helps the next search where a saved answer does not.
- `V1` **No key needed.** `CONTEXT7_API_KEY` raises the rate limits when set.
- `never` **Context7 loaded into every session.** Only research needs it. Ruled 2026-09-18.
- `never` **Repository tools: GitMCP, DeepWiki, Sourcegraph, GitHub's MCP server.** Cloning plus a `general-purpose` subagent does their job.
- `later` **Mintlify Index**, which does Context7's job, tried if Context7's lag bites often.

### Downloaded docs

- `V1` **A tool's `llms.txt`, `llms-full.txt`, chosen pages and cloned source download into `~/.flow/wiki/<tool>/downloads/`**, once per machine, shared by every project on it.
- `V1` **`_sources.md` records each file's address, the day, and the tool's latest release that day**, the version the docs describe.
- `V1` **A download is refreshed only for a newer version.** Opening one in a project, research reads the tool's version from the lockfile. Newer than the recorded release → download again. The same or older → read it, checking what it says against Context7 pinned to the project's version. A normal use costs one lockfile read and no network request. Ruled 2026-09-19: a project stays on one version of a tool, so a refresh on every use costs too much.
- `V1` **`llms-full.txt` is never read whole.** Grep it, and read the matching slices.
- `never` **A refresh on each download's first use per session**: replaced by the version test above, 2026-09-19.

### The wiki

The wiki is `~/.flow/wiki/`: clean knowledge an agent can browse, one folder per outside tool or field. A tool's folder is named after its GitHub repository (`next.js`). A tool with no repository takes the product's name, 2 repositories sharing a name take `owner_repo`, and a standard with its own docs, such as OAuth 2.1, gets a folder like a tool. A field takes a plain name: `text-to-speech`, `chrome-extensions`.

- `V1` **A folder is made the first time anything is written about its subject**, with its `index.md`.
- `V1` **`index.md` holds what the subject is, the version in use, every skill reviewed for it, and shortcuts**: where the live docs are, the Context7 id, and which page answers what. A shortcut is checked by using it, and rewritten when it fails. No expiry date.
  - `## Skills` lists each skill research reviewed: used whole, passed over or harvested, why, and the date. Research reviews again only a skill changed since its date. Approved by the user 2026-10-12: reviewing a skill means reading it whole, 3 per search.
- `V1` **One page per topic, edited in place.** A page holds what the docs don't say, linking the doc page. A survey of many tools is one page in the field's folder. A page past about 150 lines splits by topic.
- `V1` **Versions stay minimal.** A page about something with versions opens with the one it was checked against, and every line holds for it unless the line says otherwise. Decided 2026-10-12 by the user (`fw-94`).
  - A line true only elsewhere: `Until 2.1.290: … From 2.1.290: …`. The old behavior stays for projects still on it.
  - A fact added on a newer version carries `(2.1.310)` until the whole page is rechecked and the opening line moves.
  - A field page has no version line.
  - Evidence is a link to a doc page or an issue, only where one exists.
  - Refused: a version and evidence stamped on every fact, which bloats every page.
- `V1` **Pages are rewritten, not only added to.** A fact proven wrong is deleted. A page whose subject changed shape is rewritten whole.
  - Refused: the folder only grows, one findings file per fact, written once. Ruled out 2026-10-12: findings piled into one flat folder (21 in `claude-code/`) and could never be corrected.
- `V1` **The rule file's `## Reading` sends work against an outside tool to its folder first**, then its docs, never training memory alone. A page never loads by itself, where a skill's description fires on the work. Approved by the user 2026-10-12. What would overturn it: the line not firing in practice, answered by a small skill per tool that only points to its folder.
- `V1` **`flow sync` carries `index.md` and the pages to every machine.** Every `downloads/` holds a `.gitignore` of `*` and stays on its machine.
- `V1` **No project's or client's detail ever enters `~/.flow/`**, since the Flow home goes to GitHub. The test: would the sentence be true in a different project?
- `never` **A global `index.md` listing every folder.** It goes stale. `util fs tree ~/.flow/wiki` does not. Ruled by the user 2026-10-12.

### Capture

Capture is the sweep the rule file runs at each checkpoint, filing what the conversation taught. `## Capture` in the rule file is the routing table. The knowledge it files:

- `V1` **Capture runs at checkpoints, never on sight**: a handoff, the wrap-up before the context fills, finished work reported, a groundwork branch closed, a plan step landed and verified. It reads the conversation in context, never the transcript on disk. A rule file written mid-session never reaches that session anyway.
- `V1` **How an outside tool or a field behaves → the page in `~/.flow/wiki/<subject>/` that owns it, edited in place**, even while a skill covering it is loaded.
- `V1` **Other reusable knowledge → `.flow/findings/<what-was-learned>.md`.** A finding about a skill carries a `skill: <name>` header.
- `V1` **A project fact most sessions need → the project's `CLAUDE.md`. One only some work needs → `docs/context/<subject>.md`**, one question per file, rewritten rather than appended.
- `V1` **How the user works → the rule file's `## Preferences`. A fact about the user → `## The user`.** Both inferred from evidence, never announced.
- `V1` **Anything else → `.flow/inbox.md`, raw.** Past 200 lines, the agent offers `/flow:file-findings`.

### Filing findings

- `V1` **`/flow:file-findings`, user only, sorts the inbox, the findings, closed tickets' `reports/` and the `issues.md` that older tickets still hold, in one batch**, shows the plan and stops, then writes. A finding about an outside tool goes to the wiki. A rule goes to the rule file or a file with `paths:`. A project fact goes to `CLAUDE.md` or `docs/context/`.
- `V1` **Reusable knowledge with no skill to hold it becomes a `needs skill:` line in the inbox.** Several on one subject earn a skill.
- `V1` **Altitude decides the home**: a tool quirk or a framework pattern → that tool's wiki folder. A seam between 2 tools → the causing tool's folder, plus a line in the other's `index.md`. A broad principle → a concept skill.

### The harvest

The harvest reads raw reports or an outside skill, and writes what holds into wiki pages, in Flow's own words.

- `V1` **Knowledge about a tool or a field is wiki pages, never a new domain skill.** Most of a domain skill is facts, and a page can be rewritten and browsed. A procedure that must fire by itself stays a skill. Decided with the user 2026-10-12 (`fw-94`).
- `V1` **A harvest runs through `/flow:research` when the user asks**, until the upkeep skill exists. A harvested report gets `harvested: <date>` in its header.
- `later` **One upkeep skill sweeping the wiki, the reports, the rules, the preferences and the skills** for harvests, stale lines and improvements, in place of `/flow:file-findings`: `fw-103`.
- `never` **`/flow:write-skill`, a harvest into one skill per tool**, dropped 2026-10-12 (`fw-94`): the facts live in the wiki.
- `never` **One sharing command for everything anyone learns**, dropped with all work for strangers (`fw-16`), `flow contribute` archived with it.

## The parts

- **`skills/tools/research/SKILL.md`**: the steps from the wiki folder, the search for what already solves a need, the 4 levels, and where a report goes.
- **`references/wiki.md`**: a wiki folder's layout, `index.md`, `_sources.md`, a page's version lines, and how a page changes. Read before any write into the wiki, by research and capture both.
- **`skills/tools/research/scripts/context7.sh`**: Bash over Context7's web API with `curl`. `search <name> <question>`, and `ask <id|folder[@version]> <question>`, `--tool <folder>` writing the id into `index.md`.
- **`skills/tools/research/scripts/fetch-docs.sh`**: downloads into a tool's `downloads/` from any folder. `--package` or `--repo` names where the latest release is read, and `--clone` clones or pulls the source into `downloads/repo/`.
- **`home/CLAUDE.md` → `## Capture`**: where each kind of knowledge goes. **`## Reading`**: work against an outside tool starts from its wiki folder.
- **`skills/tools/file-findings/SKILL.md`**: the routing from the inbox and findings to their homes.
- **`~/.flow/references/knowledge.md`**: the map of what an agent draws on past the rules, read before adding a skill, a plugin or an MCP server.

## What passes between them

An `index.md`, written by research and `context7.sh`:

```markdown
# next.js

React framework for web apps. In use: 16.3.5.

## Skills
- vercel-labs/next-skills: nextjs, used whole (the makers' own), 2026-10-12
- someone/next-tips: passed over, general advice the agent already knows, 2026-10-12

## Live docs
- llms.txt: https://nextjs.org/docs/llms.txt
- Context7: /vercel/next.js. Pinned versions stop at v16.2.9. Without a version it reads `canary`.
- source: https://github.com/vercel/next.js

## Pages by topic
- auth, redirecting signed-out users: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx
```

A wiki page, written by capture and research:

```markdown
# Permissions

Checked against Claude Code 2.1.296, 2026-10-12.

- "Always allow" on a compound command saves one rule per piece.
- Until 2.1.290: `Read` asked even with an allow rule. From 2.1.290: the rule covers it.
- `Edit` outside the project asks every time (2.1.310).
```

A research report's header, written by `/flow:research`:

```markdown
---
question: how does the App Router redirect signed-out users?
researched: 2026-09-19
versions: next.js 16.3.5
for: planning sign-in for a web app
---
```

A line of `_sources.md`, written by `fetch-docs.sh`:

```markdown
- `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5)
```

A failure from `context7.sh`, one line and a non-zero exit: `context7: unavailable (no answer in 15 seconds)`.

## One real case: redirecting signed-out users in Next.js

1. The agent, planning auth in a Next.js 16.3 project, invokes `/flow:research`.
2. No skill covering Next.js is loaded. `~/.flow/wiki/next.js/` exists, with `index.md` and 2 pages.
3. No page or report name matches the question.
4. `index.md` has no page for the topic, but holds the Context7 id.
5. The lockfile says 16.3.5, the latest release, and Context7 read the tool after it. `context7.sh ask next.js "redirect signed-out users"` answers with no version, citing the authentication guide.
6. The agent writes `- auth, redirecting signed-out users: <the guide's address>` under `## Pages by topic`. A level 1 question writes no report.
7. Building the feature, a redirect loops in middleware. The fix lands, and capture at the next checkpoint creates `~/.flow/wiki/next.js/middleware.md`, opening `Checked against next.js 16.3.5`, with the loop's cause and fix as one line.
8. `flow sync` carries both to the other machine. A second project asking about auth finds the page through `index.md`, with no Context7 call.

## How it fails

- **Context7 down, slow or out of quota** → one `context7:` line. Research takes `index.md`'s pages, then the downloads, then web search.
- **A Context7 id from `index.md` no longer found** → search again, then ask with `--tool`, which rewrites the line.
- **A tool with no `llms.txt`** → the script says so and saves nothing. Context7, then web search for the official docs, then the user. Never training memory.
- **Downloads older than the project's version** → downloaded again before use.
- **Downloads newer than the project's version** → read, and checked against Context7 pinned to the project's version.
- **Machine 2 asks before machine 1 has synced** → machine 2 researches as if the folder were new. The 2 machines' additions merge at the next `flow sync`.
- **A fact changes in a newer version** → its line becomes `Until X: … From X: …`. Both halves stay.
- **2 machines rewrite one page** → `flow sync` stops the merge, naming the file, with this machine's commit kept. Resolved by hand, rare for one user.
- **A project detail written into a finding** → it reaches GitHub through the Flow home, which stays private.

## How you know it worked

- **A second project on a tool reads what the first one wrote**: a matching page answers with no outside request.
- **A Context7 question asked twice through the same tool's folder makes no search request** the second time.
- **A `downloads/` never appears in the Flow home's repository.**
- **`/flow:research` has run on a wiki folder in a live session.** Not yet: both scripts passed their trials alone, against the real Context7 and real docs sites, and never through the skill.

## What is locked

- **Context7 is called by a script, never an MCP server.** A script can check the tool's shortcuts before calling and write what it learns to a file. An MCP answer only lands in the conversation. What would flip it: Context7 closing its web API, or its MCP server doing clearly more.
- **A tool is reached through a command, a script, then an MCP server, in that order.** An MCP server only where the tool has no other way in, or needs a live session, such as a browser. `~/.flow/references/knowledge.md` → `## Reach a service through a command`.
- **One folder per tool or field, on the machine, shared by every project.** What every project and both machines learn about one subject meets in one set of pages.
  - Refused: the toolbox file as the one place per tool, with `docs:` and `context7:` fields. One file per tool cannot hold the knowledge. Ruled 2026-09-19.
  - Refused: one copy per project, in `tmp/references/<tool>/`, which never got a structure or rules.
- **The folder is named `wiki/`**, picked 2026-09-19 from the user's candidates: 4 letters, a word everyone knows, and a set of pages one per subject.
  - Refused: `tools/`, which reads like part of Flow. `knowledge/`, too long. `refs`, beside `~/.flow/references/`. `context`, every project's `docs/context/`. `library`, the user's planned tool catalog. `intel` and `lore`, slang and a rare word.
- **Downloads are never committed.** Each machine refreshes its own anyway. Git would store a new copy of a 480 KB `llms-full.txt` on every change, and cannot commit a clone as files.
  - Refused: `index.md` recording download dates. It syncs and the downloads do not, so its dates would describe the other machine's files.
- **Project research lives in `.flow/research/<topic>/`.** `.flow/` is the branch `flow`, checked out once for every code branch, so a report never conflicts across feature branches. Approved 2026-10-06, replacing `docs/research/`. Topic folders replaced the flat layout 2026-10-12 (`fw-94`): 50 flat names hid which report held what.
- **One root for reports: the project's `research/`.** Decided with the user 2026-10-12 (`fw-106`): a report is temporary, since its facts are harvested into the wiki and the report is then deleted, so another project need not find it. What would overturn it: the harvest (`fw-103`) staying unbuilt for months, with other projects blind to every report meanwhile. Harvest the tool reports first (Context7, backlog boards), since other projects look for those.
  - Refused: 2 roots, `~/.flow/research/` for a report true in any project and the project's for the rest, the first build of `fw-106`. It asks a true-in-any-project test of every report, for a file that is harvested and deleted anyway.
- **2 layers: raw reports in `research/`, clean knowledge in `wiki/`.** Decided with the user 2026-10-11 (`fw-94`): a report is raw, often mixed and noisy; the wiki is what an agent browses.
  - Refused: one tree, with every report distilled in place. A product idea or a field survey fits no tool folder.

## References

- `.flow/tickets/fw-94-research-cleanup/groundwork/map.md`: section 1, the wiki and research layout, and the reasoning behind it.

- `.flow/research/context7/how-it-retrieves-docs.md`: how Context7 retrieves docs, supplied by the user.
- `.flow/research/context7/which-tools-compete.md`: the tools competing with Context7, supplied by the user.
