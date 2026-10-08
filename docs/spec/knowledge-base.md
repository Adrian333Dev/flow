# Knowledge base

How Flow learns about the world outside the project, and where it keeps what it learns. `/flow:research` answers a question about an outside tool or a field, starting from what earlier research left behind. Capture files what a session taught into the place that will be read next time. Knowledge about one outside tool collects in one folder per tool, shared by every project and every machine, until a harvest writes it into the tool's skill.

## Scope

- **In**: `/flow:research`, Context7, downloaded docs, the wiki of outside tools, research reports, capture's destinations for knowledge, findings, and `/flow:file-findings`' routing.
- **Out**: what makes a rule or writes a check, in `docs/spec/rules.md`. Reviewing, adopting and harvesting an outside skill, and domain-skills, in `docs/spec/skills.md`. The failure log, in `docs/spec/failure-log.md`. Tickets, in `docs/spec/tickets.md`.

## Where everything lands

Each path, and what writes it:

```text
~/.flow/                                  the machine: shared by every project, carried by flow sync
├─ wiki/<tool>/                           one folder per outside tool
│  ├─ index.md                            /flow:research: shortcuts into the docs
│  ├─ research/<question>.md              /flow:research: reports on this tool alone
│  ├─ findings/<what-was-learned>.md      capture → the harvest, into the tool's skill
│  └─ downloads/                          fetch-docs.sh: this machine's alone, never synced
└─ research/<question>.md                 /flow:research: reports on no single tool

<project>/                                the project: .flow/ rides the branch flow
├─ .flow/research/<question>.md           /flow:research: true only here, and when unsure
├─ .flow/findings/<what-was-learned>.md   capture → /flow:file-findings, into a skill or rule
├─ .flow/inbox.md                         capture: anything with no home yet
├─ docs/context/<subject>.md              capture: a fact only some work here needs
└─ CLAUDE.md                              capture: a fact most sessions here need
```

## Behaviors

### Research

- `V1` **A question about a tool starts from the tool's folder**, in 6 steps: the tool's domain skill when one is loaded, then `~/.flow/wiki/<tool>/` with its finding count printed (`next.js: 7 findings, no skill`), then the reports and findings whose names match, then `index.md`'s shortcuts, then outside sources, then a line written back. An answer found in the folder makes no outside request.
- `V1` **Research searches for what already solves a need before building or reading anything**: `flow skills ls`, the toolbox and skills.sh at once, then skills, plugin marketplaces and MCP servers on GitHub and the web. An outside skill found is judged by `docs/spec/skills.md`.
- `V1` **4 levels of depth, never starting higher than needed**: a targeted question answered inline, working against a tool from its downloaded docs, deep customization from its cloned source, and a landscape survey through a prompt the user runs in an outside LLM.
- `V1` **A bug's explanation is searched in the tool's issues**, `gh search issues <words> --repo <owner/repo>`, where most explanations live.
- `V1` **Heavy reading goes to an `Explore` subagent**, decided by how much there is to read and never by the level. The brief names the sources, the question and the report file.
- `V1` **One file per question, the question at the top and the findings under it.** A level 1 question writes no file.
- `V1` **A report goes where it is true**: about one tool → `~/.flow/wiki/<tool>/research/`. About no single tool → `~/.flow/research/`. True only for this project, or unsure → `.flow/research/`. Outside a project, unsure → `~/.flow/research/`. Unsure defaults to the project because an unsure report may hold project details, which never enter `~/.flow/`.
- `V1` **A survey run for a project decision splits**: the survey to `~/.flow/`, the pick to the spec file that owns it, its reason naming the survey.
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
- `never` **Repository tools: GitMCP, DeepWiki, Sourcegraph, GitHub's MCP server.** Cloning plus an `Explore` subagent does their job.
- `later` **Mintlify Index**, which does Context7's job, tried if Context7's lag bites often.

### Downloaded docs

- `V1` **A tool's `llms.txt`, `llms-full.txt`, chosen pages and cloned source download into `~/.flow/wiki/<tool>/downloads/`**, once per machine, shared by every project on it.
- `V1` **`_sources.md` records each file's address, the day, and the tool's latest release that day**, the version the docs describe.
- `V1` **A download is refreshed only for a newer version.** Opening one in a project, research reads the tool's version from the lockfile. Newer than the recorded release → download again. The same or older → read it, checking what it says against Context7 pinned to the project's version. A normal use costs one lockfile read and no network request. Ruled 2026-09-19: a project stays on one version of a tool, so a refresh on every use costs too much.
- `V1` **`llms-full.txt` is never read whole.** Grep it, and read the matching slices.
- `never` **A refresh on each download's first use per session**: replaced by the version test above, 2026-09-19.

### The wiki

The wiki is `~/.flow/wiki/`: one folder per outside tool, named after its GitHub repository (`next.js`). A tool with no repository takes the product's name, 2 repositories sharing a name take `owner_repo`, and a standard with its own docs, such as OAuth 2.1, gets a folder like a tool.

- `V1` **`index.md` holds shortcuts, never answers**: where the live docs are, the Context7 id, and which page answers what. A shortcut is checked by using it, and rewritten when it fails. No expiry date.
- `V1` **The folder only grows.** A new question is a new report. The same question on a newer version adds a dated section, keeping the older text for projects still on that version. The same finding learned again adds one line: the version and the date it held. `index.md` lines are rewritten only when they stop working. The harvest is the one step that deletes a file. 2 machines adding to one file merge cleanly, and keeping both additions resolves the rest.
- `V1` **`flow sync` carries `index.md`, `research/` and `findings/` to every machine.** Every `downloads/` holds a `.gitignore` of `*` and stays on its machine.
- `V1` **No project's or client's detail ever enters `~/.flow/`**, since the Flow home goes to GitHub. The test: would the sentence be true in a different project?

### Capture

Capture is the sweep the rule file runs at each checkpoint, filing what the conversation taught. `## Capture` in the rule file is the routing table. The knowledge it files:

- `V1` **Capture runs at checkpoints, never on sight**: a handoff, the wrap-up before the context fills, finished work reported, a groundwork branch closed, a plan step landed and verified. It reads the conversation in context, never the transcript on disk. A rule file written mid-session never reaches that session anyway.
- `V1` **`/capture` runs the sweep now**, typed by the user.
- `V1` **How an outside tool behaves → `~/.flow/wiki/<tool>/findings/<what-was-learned>.md`**, even while the tool's skill is loaded: what went wrong, what fixed it, the rule that follows, the version.
- `V1` **Other reusable knowledge → `.flow/findings/<what-was-learned>.md`.** A finding about a skill carries a `skill: <name>` header.
- `V1` **A project fact most sessions need → the project's `CLAUDE.md`. One only some work needs → `docs/context/<subject>.md`**, one question per file, rewritten rather than appended.
- `V1` **How the user works → the rule file's `## Preferences`. A fact about the user → `## The user`.** Both inferred from evidence, never announced.
- `V1` **Anything else → `.flow/inbox.md`, raw.** Past 200 lines, the agent offers `/flow:file-findings`.

### Filing findings

- `V1` **`/flow:file-findings`, user only, sorts the inbox, the findings and closed tickets' `issues.md` and `reports/` in one batch**, shows the plan and stops, then writes. A finding about an outside tool goes to the wiki. A rule goes to the rule file or a file with `paths:`. A project fact goes to `CLAUDE.md` or `docs/context/`.
- `V1` **Reusable knowledge with no skill to hold it becomes a `needs skill:` line in the inbox.** Several on one subject earn a skill.
- `V1` **Altitude decides the home**: a tool quirk or a framework pattern → that tool's wiki folder. A seam between 2 tools → the causing tool's folder, plus a line in the other's `index.md`. A broad principle → a concept skill.
- `V1` **A finding about a domain-skills skill waits in `.flow/findings/<skill>/`** for the sharing command below.

### The harvest and sharing

The harvest reads a tool's whole wiki folder and every outside skill cloned for it, and writes the tool's skill in its own words.

- `next` **`/flow:write-skill`, the harvest**, user only. It checks each finding against the tool's docs, writes the skill, records each input's commit, and deletes the findings it wrote in. Built after one harvest run by hand. Until it ships, findings wait in the wiki, and research prints their count.
- `next` **One sharing command for everything anyone learns**, the same for the user, a maintainer and a new user. Notes and failures become GitHub issues. Skill findings and wiki pages become pull requests. The agent drafts, strips anything private, and sends after one yes. An automatic first pass joins duplicates and checks the format before a person reads anything. Replaces `flow contribute`. Built during the beta, once real knowledge collects. Decided with the user 2026-09-29.

## The parts

- **`skills/tools/research/SKILL.md`**: the 6 steps, the search for what already solves a need, the 4 levels, and where a report goes.
- **`skills/tools/research/references/wiki.md`**: a tool folder's layout, `index.md`, `_sources.md`, and what may be added or rewritten. Read before the first write into a tool's folder.
- **`skills/tools/research/scripts/context7.sh`**: Bash over Context7's web API with `curl`. `search <name> <question>`, and `ask <id|folder[@version]> <question>`, `--tool <folder>` writing the id into `index.md`.
- **`skills/tools/research/scripts/fetch-docs.sh`**: downloads into a tool's `downloads/` from any folder. `--package` or `--repo` names where the latest release is read, and `--clone` clones or pulls the source into `downloads/repo/`.
- **`home/AGENTS.md` → `## Capture`**: where each kind of knowledge goes.
- **`claude/commands/capture.md`**: `/capture`.
- **`skills/tools/file-findings/SKILL.md`**: the routing from the inbox and findings to their homes.
- **`~/.flow/references/knowledge.md`**: the map of what an agent draws on past the rules, read before adding a skill, a plugin or an MCP server.

## What passes between them

An `index.md`, written by research and `context7.sh`:

```markdown
# next.js

## Live docs
- llms.txt: https://nextjs.org/docs/llms.txt
- Context7: /vercel/next.js. Pinned versions stop at v16.2.9. Without a version it reads `canary`.
- source: https://github.com/vercel/next.js

## Pages by topic
- auth, redirecting signed-out users: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx
```

A line of `_sources.md`, written by `fetch-docs.sh`:

```markdown
- `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5)
```

A failure from `context7.sh`, one line and a non-zero exit: `context7: unavailable (no answer in 15 seconds)`.

## One real case: redirecting signed-out users in Next.js

1. The agent, planning auth in a Next.js 16.3 project, invokes `/flow:research`.
2. No `next.js` domain skill is loaded. `~/.flow/wiki/next.js/` exists: `next.js: 2 findings, no skill`.
3. No report or finding name matches the question.
4. `index.md` has no page for the topic, but holds the Context7 id.
5. The lockfile says 16.3.5, the latest release, and Context7 read the tool after it. `context7.sh ask next.js "redirect signed-out users"` answers with no version, citing the authentication guide.
6. The agent writes `- auth, redirecting signed-out users: <the guide's address>` under `## Pages by topic`. A level 1 question writes no report.
7. Building the feature, a redirect loops in middleware. The fix lands, and capture at the next checkpoint writes `~/.flow/wiki/next.js/findings/middleware-redirect-loops-on-matcher.md`, naming 16.3.5.
8. `flow sync` carries both to the other machine. A second project asking about auth finds the page through `index.md`, with no Context7 call.

## How it fails

- **Context7 down, slow or out of quota** → one `context7:` line. Research takes `index.md`'s pages, then the downloads, then web search.
- **A Context7 id from `index.md` no longer found** → search again, then ask with `--tool`, which rewrites the line.
- **A tool with no `llms.txt`** → the script says so and saves nothing. Context7, then web search for the official docs, then the user. Never training memory.
- **Downloads older than the project's version** → downloaded again before use.
- **Downloads newer than the project's version** → read, and checked against Context7 pinned to the project's version.
- **Machine 2 asks before machine 1 has synced** → machine 2 researches as if the folder were new. The 2 machines' additions merge at the next `flow sync`.
- **2 findings disagree across versions** → both stay, each naming its version. The harvest keeps what holds for versions still in use.
- **A project detail written into a finding** → it reaches GitHub through the Flow home, which stays private.

## How you know it worked

- **A second project on a tool reads what the first one wrote**: the finding count prints, and a matching report or finding answers with no outside request.
- **A Context7 question asked twice through the same tool's folder makes no search request** the second time.
- **A `downloads/` never appears in the Flow home's repository.**
- **`/flow:research` has run on a wiki folder in a live session.** Not yet: both scripts passed their trials alone, against the real Context7 and real docs sites, and never through the skill.

## What is locked

- **Context7 is called by a script, never an MCP server.** A script can check the tool's shortcuts before calling and write what it learns to a file. An MCP answer only lands in the conversation. What would flip it: Context7 closing its web API, or its MCP server doing clearly more.
- **A tool is reached through a command, a script, then an MCP server, in that order.** An MCP server only where the tool has no other way in, or needs a live session, such as a browser. `~/.flow/references/knowledge.md` → `## Reach a service through a command`.
- **One folder per tool, on the machine, shared by every project.** Findings about one tool, from every project and both machines, meet beside its research, so the harvest reads everything known about the tool at once. What would flip it: wanting each finding in the skill the day it is learned.
  - Refused: the toolbox file as the one place per tool, with `docs:` and `context7:` fields. One file per tool cannot hold the knowledge. Ruled 2026-09-19.
  - Refused: one copy per project, in `tmp/references/<tool>/`, which never got a structure or rules.
- **The folder is named `wiki/`**, picked 2026-09-19 from the user's candidates: 4 letters, a word everyone knows, and a set of pages one per subject that grows by additions.
  - Refused: `tools/`, which reads like part of Flow. `knowledge/`, too long. `refs`, beside `~/.flow/references/`. `context`, every project's `docs/context/`. `library`, the user's planned tool catalog. `intel` and `lore`, slang and a rare word.
- **Downloads are never committed.** Each machine refreshes its own anyway. Git would store a new copy of a 480 KB `llms-full.txt` on every change, and cannot commit a clone as files.
  - Refused: `index.md` recording download dates. It syncs and the downloads do not, so its dates would describe the other machine's files.
- **Project research lives in `.flow/research/`, flat.** `.flow/` is the branch `flow`, checked out once for every code branch, so a report never conflicts across feature branches. Approved 2026-10-06, replacing `docs/research/`.

## References

- `.flow/research/context7-report.md`: how Context7 retrieves docs, supplied by the user.
- `.flow/research/context-7-alternatives.md`: the tools competing with Context7, supplied by the user.
