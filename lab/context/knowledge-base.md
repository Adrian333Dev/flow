# Knowledge base: research, tool folders, Context7 and capture

The design conversation of 2026-09-18 and 2026-09-19 on how `/flow:research` reaches outside tools and where Flow keeps what it learns about them. Nothing is built. A parallel session works on the management skills at the same time, and this file never covers that work.

The user supplied 2 reports as input, both in this folder: `context7-report.md`, on how Context7 retrieves docs, and `context-7-alternatives.md`, on the tools competing with it.

## Where the conversation stands

- **The design is agreed whole**, `wiki/` included. 3 small points the build plan found are shown to the user under `### Settle before building`, each with a recommendation.
- **The build waits for the management skills**, ruled by the user 2026-09-19. `backlog.md` → `### Individual skills` carries the item. Once the user says build, every step under `## The build plan` is in scope, in order.
- **Owed by the end of this work**: a new page under `docs/manual/`, beside `where-everything-lives.md`. It explains from A to Z how research works, how the knowledge base works, how findings are gathered and how capture works, in every case, with tree drawings. Asked by the user 2026-09-19. Step 7 of `## The build plan` holds its outline and recommended name.

## The user's rulings

- **2026-09-18: Context7 comes into Flow.** It sometimes lags, and a tool's own docs are sometimes better.
- **2026-09-18: Context7 never loads into every session.** Only when research needs it.
- **2026-09-19: caching means shortcuts, never saved answers.** The same question rarely comes twice. What gets kept is what helps the next search of the same tool: the Context7 library id, indexes of the docs, which page answers what. Shortcuts go stale too.
- **2026-09-19: the agent works fully without Context7** when its server is down.
- **2026-09-19: the toolbox holds no docs and no knowledge about a tool.** One file per tool cannot hold it. The toolbox exists for the catalog idea in `skills.md` → `### The library, for later`, and gets rewritten whole later.
- **2026-09-19: `tmp/references/<tool>/` was meant as the tool's local documentation**: the clone, `llms.txt`, other indexes, references and useful information, with Context7's output feeding it. It never got a structure or rules.
- **2026-09-19: `docs/research/` stops being the one home for every report.** It is the default when no better path fits. Research about one tool goes under that tool's path. The general place takes only research unrelated to any tool. Without a strong structure, everything scatters.
- **2026-09-19: downloads stay current, and refreshing stays lazy.** First ruled as "refreshed at least whenever they are used". Loosened the same day: a project relying on a tool stays on one version of it, so its docs rarely need refreshing, and a refresh on every use costs too much.
- **2026-09-19: a session reaching outside the project is fine.** It asks, and the user approves. Capture already writes to `~/.agents/AGENTS.md`. No setting is needed for it.
- **2026-09-19: `~/.flow/` lives in a git repository, synced between the user's 2 machines.** Work stopped on one machine must continue on the other. `backlog.md` → "`~/.flow/` as a git repository of its own" is the open item this feeds.
- **2026-09-19: every reply opens with the full picture.** Never a label before its path and contents. Recorded in `rejected-replies.md`.
- **2026-09-19: the design is solid**, apart from the 4 points below. That accepts the placement of reports, the sync split with downloads uncommitted, and capture with the harvest.
- **2026-09-19: `~/.flow/tools/` is the wrong name.** It reads like part of Flow, and it would block a future Flow folder of that name. The content is a knowledge base more than docs. `docs` or `knowledge-base` were the user's candidates, the second a little long.
- **2026-09-19: research starts from the tool's folder** whenever one exists.
- **2026-09-19: the tool's folder is close to append-only.** 2 projects using one tool add to it and never rewrite the same files. `index.md` is the exception.
- **2026-09-19: the agent's answers to those points are approved**: the refresh by version, the order research reads the folder in, and what may be added or rewritten. Everything under `## The design` is agreed except the folder's name.
- **2026-09-19: `knowledge/` is the wrong name.** "Knowledge base" fits, "knowledge" alone less so, and it is too long. The user wants something shorter, and offered `refs`, `context`, `library`, `intel`, `lore` and `wiki`.
- **2026-09-19: the folder is `~/.flow/wiki/`**, the agent's pick from those 6.
- **2026-09-19: the build comes after the management skills.** Everything needed to build it quickly is saved here first.

## Agreed: proposed by the agent, never opposed

- **Context7 is called by a script, never an MCP server.** `skills/tools/research/scripts/context7.sh`, in Bash, calls Context7's web API with `curl`. The script can check the tool's shortcuts before calling, and write what it learns to a file. An MCP answer only ever lands in the conversation. The script runs unchanged on Codex. What would flip it: Context7 closing its API, or its MCP server doing clearly more than the API.
- **A quick question goes to Context7 first. Building against a tool goes to the tool's own `llms.txt` first.**
- **The version check**, from Context7's library record and the project's lockfile:
  - Context7 holds the project's version → ask for that version, as `/vercel/next.js/v15.1.8`.
  - The project is on the latest release, and Context7 last read the tool after that release → ask with no version. Context7 then answers from the tool's development branch.
  - Anything else → skip Context7, and read the tool's own docs for the project's version.
  - `npm view <package> time` gives every release's date. `gh release list` does it for tools outside npm.
- **When Context7 fails**, the script gives up after about 15 seconds or on any error, and prints one line saying so. The skill then tries the pages saved in the tool's index whose topic fits, then the tool's `llms.txt`, then web search. The keyless monthly quota running out, reported as "Monthly quota exceeded", takes the same route.
- **Context7's answers are never saved.** What an answer leaves behind is the library id, the versions Context7 holds, and the page the answer came from. All 3 go into the tool's `index.md`.
- **A shortcut is checked by using it.** It is always tried first. One that fails gets looked up again and its line rewritten. No expiry date.
- **A script where the tool has another way in, an MCP server where it has none.** A tool with a command-line tool or a web API is called from a script: Context7, GitHub through `gh`. A tool that only speaks MCP, or whose server does what a script cannot, such as a browser sign-in or a connection kept open, gets an MCP server. The toolbox already applies this to Playwright: its command-line tool is the default, its MCP server the exception.
- **Where an MCP server gets set up, for one project or for every project, belongs to the management skills.**
- **None of the alternatives joins now.** Repository tools (GitMCP, DeepWiki, Sourcegraph, GitHub MCP) do what cloning plus an Explore subagent already does. Web search tools (Exa, Parallel, Tavily) matter only for replacing `WebSearch` off Anthropic. Ref and Mintlify Index do Context7's job; Mintlify Index is the one to try if Context7's staleness bites often.
- **Research searches a repository's issues** with `gh search issues <words> --repo <owner/repo>`, where most bug explanations live. It matters most for `/flow:debug`.
- **`backlog.md`'s line on replacing `WebSearch` and `WebFetch` off Anthropic names Parallel first**, since its free endpoint needs no key.
- **A tool's folder lives on the machine, shared by every project**, never one copy per project.

## Withdrawn or rejected

- **Saving every Context7 answer** under `tmp/references/<tool>/context7/` and grepping the pile. Rejected by the user 2026-09-19.
- **The toolbox file as the one place per tool**, with `docs:` and `context7:` fields, a `toolbox` setting, and `/flow:file-findings` writing notes into it. Rejected by the user 2026-09-19.
- **`additionalDirectories` in Flow's `settings.json`** to reach `~/.flow/` without a prompt. Dropped: the user accepts the prompt.
- **`flow contribute` sending findings for a tool with no skill to `drafts/<tool>/findings/`** on domain-skills. Replaced by the harvest.
- **`~/.flow/docs/<tool>/` holding downloads only.** Renamed `~/.flow/tools/<tool>/` once research and findings joined it.
- **The name `~/.flow/tools/`.** Rejected by the user 2026-09-19, for the reasons under the rulings. Flow's own skills already sit in a group called `skills/tools/`.
- **The name `~/.flow/knowledge/`.** Rejected by the user 2026-09-19, for the reasons under the rulings.
- **Refreshing every download on its first use in each session**, with `curl -R -z`. Replaced 2026-09-19 by the version test under `### Downloads refresh when a project needs a newer version`.
- **`index.md` recording download dates, in place of `_sources.md`.** Withdrawn 2026-09-19: `index.md` syncs between machines and the downloads do not, so its dates would describe the other machine's downloads.

## The design

Agreed whole on 2026-09-19.

### The layout

```
~/.flow/                                  on each machine, and a git repo both machines share
├─ wiki/
│  └─ next.js/                            one folder per outside tool, named after its GitHub repo
│     ├─ index.md                         where the live docs are, which page answers what
│     ├─ research/<question>.md           research reports about this tool alone
│     ├─ findings/<what-was-learned>.md   facts learned using the tool, waiting for the harvest
│     └─ downloads/                       never committed: each machine downloads its own
│        ├─ _sources.md                   what this machine downloaded, when, and the tool's latest release then
│        ├─ llms.txt
│        ├─ llms-full.txt
│        ├─ pages/<page>.md
│        └─ repo/                         the tool's source, cloned
└─ research/<question>.md                 research about no single tool

<project>/
├─ docs/research/<question>.md            research true only for this project, and the default when unsure
├─ docs/context/<subject>.md              facts true only for this project, unchanged
└─ .flow/findings/<what-was-learned>.md   what a session learned that is not about an outside tool, unchanged
```

A standard with its own docs, such as OAuth 2.1, gets a folder under `wiki/` like a tool. A tool with no GitHub repo is named after the product. 2 tools whose repos share a name take `owner_repo`.

### The name is `wiki/`

Picked 2026-09-19 from the user's 6 candidates.

- It is 4 letters, and a word everyone knows.
- A wiki is a set of pages, one per subject, that grows by additions. That is the folder's own rule: one folder per tool, added to and rarely rewritten.
- Nothing in Flow uses the word.
- Its one weak point: a wiki suggests hand-written pages, and the folder also holds raw downloads.

The other 5 lose:

- `refs`: `~/.flow/references/` already sits beside it, holding Flow's shipped reference files. It is also git's word for branches and tags.
- `context`: every project has `docs/context/`, holding facts true only for that project, the opposite of this folder.
- `library`: the user's planned tool catalog already carries the name, in `skills.md` → `### The library, for later`. Most tools here are not libraries either: command-line tools, services, standards.
- `intel`: slang, reading as spying or as the chip maker.
- `lore`: a rare word. Every skill mentioning it would leave the reader guessing.

### `index.md`

What holds on every machine: where the live docs are, and which page answers what. Values from this session's lookups:

```markdown
# next.js

## Live docs
- llms.txt: https://nextjs.org/docs/llms.txt
- Context7: /vercel/next.js. Pinned versions stop at v15.1.8. Without a version it reads `canary`.
- source: https://github.com/vercel/next.js

## Pages by topic
- auth, redirecting signed-out users: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx
```

### Where a research report goes

- A quick question, one API or one setting → no file
- About one outside tool, true in any project → `~/.flow/wiki/<tool>/research/<question>.md`. `context7-report.md` would be `~/.flow/wiki/context7/research/`.
- About no single tool, true in any project: a comparison, a technique, a field → `~/.flow/research/<question>.md`. `context-7-alternatives.md` would go here.
- True only for this project: its users, its market, a client's old system → `docs/research/<question>.md`. Also the default when unsure, since an unsure report may hold project details, which never enter `~/.flow/`.

Research done with an outside LLM is no separate kind. Its prompt and the pasted report go in the question's file, wherever the list puts it. A decision drawn from research goes to the project's decision record, never the report. A survey run for a project decision splits: the survey to `~/.flow/`, the pick to the project. A question about 2 tools goes to the folder of the tool it is mostly about, with a line in the other tool's `index.md`.

### Research starts from the tool's folder

1. A domain skill for the tool, when the project has one, comes first: it holds what earlier harvests gathered.
2. Open `~/.flow/wiki/<tool>/`, creating it on the first research about the tool. Print the finding count, such as `next.js: 7 findings, no skill`.
3. Read the files in `research/` and `findings/` whose names match the question. Answered → stop, with no outside request.
4. Follow `index.md`: the page listed for the topic, or the Context7 id, which skips Context7's search step.
5. Go outside as agreed: Context7 first for a quick question, the downloads first when building against the tool, then `gh search issues`, then web search.
6. Write back: a new line in `index.md` for the page that answered, and a report in `research/` when the research was more than a quick question.

### Downloads refresh when a project needs a newer version

A downloaded `llms.txt` never describes the project's version. It describes what the tool's site showed on the download day: the latest release. The download script records that release in `downloads/_sources.md`, from `npm view <package> version` or `gh release view --repo <owner/repo>`:

```
- `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5)
- `repo/` <- https://github.com/vercel/next.js (2026-09-19, latest release then 16.3.5)
```

Opening a download inside a project, research reads the tool's version from the project's lockfile:

- Newer than the recorded release → download again, then use it.
- The same or older → use it as it is. Older means the docs may describe what the project lacks, so anything they say is checked against the project's version: Context7 asked for that exact version, or the tool's docs for that version.
- No project, or the tool missing from the lockfile → use it as it is.

No age limit, and no refresh per session. A normal use costs one lockfile read and no network request. Today the research skill re-runs the download "when new work starts and the stamped dates look old".

### The tool's folder only grows

- `research/<question>.md`: a new question makes a new file. The same question asked again on a newer version adds a dated section at the end, naming the version. The older text stays, since another project may still be on that version.
- `findings/<what-was-learned>.md`: one file per finding, written once. The same fact learned again adds one line at the end: the version and the date it held.
- `index.md`: a new shortcut is a new line. A line is rewritten only when its shortcut stops working.
- `downloads/`: replaced on refresh, per machine, outside the rule.
- The harvest is the one step that removes files: the findings it wrote into the skill.

The stronger argument is the 2 machines. Git merges new files from both machines on its own, and stops only where both changed the same lines. Additions at the end of one file can still collide, and keeping both always resolves it.

### What syncs between machines

- **Committed**: `index.md`, `research/`, `findings/`, and `~/.flow/research/`.
- **Never committed**: every `downloads/` folder, `_sources.md` included, listed in `~/.flow/.gitignore`.

The deciding argument: each machine refreshes its own downloads anyway. Committing them stores a new copy each time a file changes, since git keeps every version: a 480 KB `llms-full.txt`, Context7's own, stored again on every change. A clone inside another repository cannot be committed as files at all: git records only a pointer to the other repository. The user had argued for syncing the docs too, and accepted the split when calling the design solid.

### Capture and the harvest

**Today:** capture writes reusable knowledge, a tool behavior or a library quirk, as a file in the project's `.flow/findings/`, skill or no skill. `/flow:file-findings` later moves it. For a tool with a domain skill, `flow contribute` opens a pull request on domain-skills, and `/flow:apply-domain-findings` checks it and writes it into the skill. For a tool with no skill, it becomes a `needs skill:` line in that one project's `.flow/inbox.md` and stops there.

**The design:**

- Capture writes a finding about an outside tool to `~/.flow/wiki/<tool>/findings/<what-was-learned>.md`, skill or no skill, even while the tool's skill is loaded.
- The harvest reads the tool's whole folder, checks each finding against the tool's docs or source, and writes the tool's skill. Run again later, it adds the findings that came in since. Harvested findings are deleted from the folder.
- The harvest is `/flow:write-skill`, planned in `skills.md` → `### /flow:write-skill` and not built: the user names a subject and points it at sources, and it writes the skill.
- Research prints the count when it opens a tool's folder. The user starts the harvest.
- Everything else capture does is unchanged.

The deciding argument: findings about one tool, from every project and both machines, meet in one folder beside the research on that tool, so the harvest reads everything known about the tool at once. What would flip it: wanting each finding in the skill the day it is learned.

**Edge cases:**

- A finding true only in this project → `docs/context/<subject>.md`. The test: would the sentence be true in a different project?
- A finding about 2 tools → the folder of the tool causing it, with a line in the other's `index.md`.
- Every finding names its version. 2 findings that disagree across versions both stay, and the harvest keeps what holds for versions still in use.
- A client's details never enter a finding, since `~/.flow/` goes to GitHub. That repository stays private.
- A tool whose skill came from its makers → findings still go to the tool's folder, and the harvest adds them to the user's copy of that skill in domain-skills, as research already adopts outside skills. `skills.md` → `### /flow:write-skill` already says how: new pages in an existing domain skill are sent like any contribution, and a skill with no home yet starts under `~/.flow/private-skills/`.
- A finding about a skill that is not about an outside tool, such as a domain skill on a field like accessibility → unchanged: the `skill:` header, `/flow:file-findings`, then `flow contribute`.
- A finding about Flow or one of Flow's own skills → unchanged: the project's overlay or `/flow:review`.

**Gaps:**

- Machine 1's findings reach machine 2 only once `~/.flow/` is committed and pushed. Who commits and when is the open `backlog.md` item.
- Other people's findings. They cannot write to the user's `~/.flow/`. `flow contribute` and `/flow:apply-domain-findings` would stay their way in, reading from their own tool folders. Undecided.
- The harvest skill is not built.

## The build plan

Walked against the repository on 2026-09-19, every file below opened and its lines checked. One approval covers every step, the tests and the writing pass. Line numbers are from that day: the parallel management work may move them, so find each by its text.

### Settle before building

3 points the walk found. Each has a recommendation, shown to the user 2026-09-19.

- **Where research clones domain-skills and the toolbox.** `/flow:research` lines 25 and 26 clone Flow's own 2 catalogs into `tmp/references/domain-skills` and `tmp/references/toolbox`, only to search them. Neither is knowledge about an outside tool. Recommended: `tmp/domain-skills` and `tmp/toolbox` in the project, as disposable as today, so the path `tmp/references/` disappears.
- **How `downloads/` stays out of git.** Recommended: `fetch-docs.sh` writes `downloads/.gitignore` holding the one line `*` when it creates the folder. Git then skips the whole folder, the clone inside it included, whatever the `~/.flow/` repository's own `.gitignore` says, and before that repository exists.
- **The manual page's name.** Recommended: `docs/manual/research-and-capture.md`.

### Step 1: the 2 scripts

Both find the global folder as `${FLOW_HOME:-$HOME/.flow}`, the variable `scripts/flow/lib/settings.js` already reads, so a trial can point them into `tmp/`.

**`skills/tools/research/scripts/fetch-docs.sh`**, rewritten:

- Saves to `$FLOW_HOME/wiki/<tool>/downloads/`, and runs from any folder. "Run from the project root" goes from its header and from the skill.
- Single pages go into `downloads/pages/`.
- Writes `downloads/.gitignore`, per the point above.
- Each `_sources.md` line gains the tool's latest release on that day: `` - `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5) ``. The release comes from `npm view <package> version`, else `gh release view --repo <owner/repo> --json tagName`. The script takes the package or the repository as an option, since the folder name is the repository's and the package's often differs: `next.js` against `next`.
- A new option clones the tool's source into `downloads/repo/` with `git clone --depth 1`, or runs `git pull` there when the clone exists, and logs it in `_sources.md` the same way.
- Downloads only when run. The skill decides when, by the version test.

**`skills/tools/research/scripts/context7.sh`**, new, Bash wrapping `curl`:

- `context7.sh search <name> <question>`: `GET /v2/libs/search`, printing per candidate the id, versions, branch and `lastUpdateDate`.
- `context7.sh ask <id> <question>`: `GET /v2/context` with `type=txt`, printing the answer. An id with a version, `/vercel/next.js/v15.1.8`, asks for that version.
- With the tool's folder named, it reads the `Context7:` line of `index.md` and skips the search, or writes that line after a search picked the id. The lines under `## Pages by topic` need a judgment of topic, so the agent writes those.
- Sends `CONTEXT7_API_KEY` as a bearer token when set, and works without it.
- Gives up after 15 seconds (`curl --max-time 15`), on any HTTP error, and on "Monthly quota exceeded": one line, `context7: unavailable (<reason>)`, and a non-zero exit.
- The base address comes from a variable with Context7's as the default, so a trial can point it at a host that never answers.

**Trials**, with `FLOW_HOME=tmp/flow-home`:

- `fetch-docs.sh` on Next.js (`nextjs.org`) and on Context7 (`context7.com`), then again with nothing changed.
- A domain with no `llms.txt`: the script says so and saves nothing.
- `context7.sh` on Next.js: the search, a question with no version, a question pinned to `v15.1.8`, then the same question again through the `index.md` line.
- A bad id, and the unreachable base address: one line each, non-zero exit.

### Step 2: `/flow:research`

`skills/tools/research/SKILL.md`, 120 lines today. Read `references/style.md` first. The folder's full description may move to `skills/tools/research/references/wiki.md` if the skill passes about 150 lines: the layout, `index.md`, `_sources.md` and what may be added or rewritten. The skill keeps one line pointing to it.

- **New, near the top: starting from the tool's folder**, the 6 steps under `## The design` → `### Research starts from the tool's folder`, with the finding count printed at step 2.
- **Lines 23 to 27, the search for an existing skill**: lines 25 and 26 take the clone paths settled above.
- **Line 50, level 1**: Context7 through `context7.sh`, with the version check and the route when Context7 fails. `gh search issues <words> --repo <owner/repo>` for a bug's explanation.
- **Line 51, level 2**: the downloads through `fetch-docs.sh`, into the tool's folder.
- **Line 52, level 3**: the clone through the script's clone option, into `downloads/repo/`.
- **Lines 57 to 75, the `llms.txt` route**: the script's new path and options. Line 73's "re-run the script when new work starts and the stamped dates look old" becomes the version test. Line 75's fallback saves pages into `downloads/pages/`.
- **Line 85, the brief for a reading subagent**: the sources sit under `~/.flow/wiki/<tool>/downloads/`.
- **Lines 108 to 118, `## Where it goes`**: the placement list under `## The design` → `### Where a research report goes`, with its 4 extra cases. Line 110's `tmp/references/<tool>/` goes. Line 114's `docs/research/` rule shrinks to the project's own research. Outside a project, the default when unsure is `~/.flow/research/`. What stays: one file per question, the prompt at the top, level 1 answered inline with no file.
- **What may be added and what rewritten**: the list under `### The tool's folder only grows`.

### Step 3: capture

`home/AGENTS.md` → `## Capture`, lines 76 and 77. A rule file: read `references/write-rules.md` first. The parallel session edits this file too, so read it again right before the edit.

- The reusable-knowledge line splits in 2:
  - About an outside tool → `~/.flow/wiki/<tool>/findings/<what-was-learned>.md`, the same 4 to 8 word name and the same contents: what went wrong, what fixed it, the rule that follows, the version. The same fact already there → one line at its end, with the version and the date. No detail of the project or its client.
  - Anything else → `.flow/findings/<what-was-learned>.md`, as today.
- The `skill:` sub-line stays with the second. A finding about an outside tool gets no header, whether or not the tool's skill is loaded.

### Step 4: `/flow:file-findings`

`skills/tools/file-findings/SKILL.md`.

- **Line 39**, "Knowledge tied to a tool, library or framework → the skill that covers it": becomes → `~/.flow/wiki/<tool>/findings/`, written as capture writes a finding. It catches inbox items, since capture already sends findings there.
- **Line 45**, `needs skill:`: stays, for reusable knowledge about no outside tool.
- **Lines 62 to 71, `## Altitude`**: a tool quirk and a framework pattern go to the wiki folder. A seam between 2 tools goes to the folder of the tool causing it, with a line in the other's `index.md`. A broad principle still goes to a concept skill.
- **Lines 75 to 86**, the domain-skills clone and Flow's own skills: unchanged. They now carry only findings about no outside tool.

### Step 5: the phase skills and the handoff

- `skills/phases/execute/SKILL.md` line 51: with no `## References`, look once in `docs/context/`, `docs/research/`, and `~/.flow/wiki/<tool>/` for each tool the work touches.
- `skills/phases/groundwork/SKILL.md` line 150: the branch waits "until the report lands where `/flow:research` files it".
- `skills/phases/groundwork/SKILL.md` lines 284 and 285, the example `## References`: `~/.flow/wiki/ai-elements/research/conversation-streaming.md` and `~/.flow/wiki/ai-elements/downloads/llms.txt`, with its download date.
- `skills/phases/groundwork/references/read-intake.md` line 55: a research report found in intake goes where `/flow:research` files it, `docs/research/` when unsure.
- `skills/phases/groundwork/references/write-spec.md` line 57: unchanged. A survey of the product's competitors is research about the project's own market.
- `skills/tools/handoff/SKILL.md` line 67: "the research report holds the findings". Line 140: a dispatched question writes "the research file `/flow:research` names".

### Step 6: the reference files and docs

Read `references/write-docs.md` for every page under `docs/`.

- `references/workflow.md` line 65: `docs/research/` holds research true only for this project, and research nobody could place. One line beside it for `~/.flow/wiki/<tool>/` and `~/.flow/research/`.
- `docs/dev/agents.md` line 75: a reader subagent writes its report where `/flow:research` files it.
- `docs/manual/where-everything-lives.md`:
  - the machine tree gains `wiki/` and `research/` under `~/.flow/`
  - `### ~/.flow/` gains an entry for each, with the tool folder's 4 parts
  - line 158, `findings/`: a finding about an outside tool goes to the wiki instead
  - line 169, `research/`: research true only for this project
  - line 173, what stays on one machine: every `~/.flow/wiki/<tool>/downloads/`
- `README.md` line 92: docs downloaded once per machine into `~/.flow/wiki/<tool>/` and shared by every project, Context7 for a quick question, and no `tmp/references/`.
- `backlog.md`:
  - line 224, replacing `WebSearch` off Anthropic: names Parallel first, since its free endpoint needs no key
  - line 84, `~/.flow/` as a git repository: `wiki/` and `research/` are committed, and every `downloads/` stays local by its own `.gitignore`
  - the build item under `### Individual skills` is deleted
- `lab/context/state.md`: the line for this record says it is built.

### Step 7: the manual page

`docs/manual/research-and-capture.md`, or the name settled above, plus its line in `docs/manual/README.md` → `## The pages`. Read `references/style.md` and `references/write-docs.md`. Every tree drawn by `/flow:visualize`'s rules.

Its sections, in order:

1. **What Flow keeps, and where**: the whole tree, machine and project, one line per path.
2. **How research answers a question about a tool**: the 6 steps, walked on one Next.js question.
3. **Context7**: what it is, when research uses it, the version check, and what happens when it is down.
4. **Downloads**: what is downloaded, where, when it is downloaded again, and the clone.
5. **Where a research report goes**: the placement list, with the 2 reports the user supplied as examples.
6. **How a finding is captured**: about an outside tool to the wiki, everything else to `.flow/findings/` and `/flow:file-findings`.
7. **The harvest**: from a tool's findings to its skill.
8. **2 machines**: what syncs, what stays, and when.
9. **Every case**, one short walk each:
   - the first research on a tool
   - a second project on the same tool
   - a project on a newer version than the downloads
   - a project on an older version
   - Context7 down or out of quota
   - a tool with no `llms.txt`
   - a finding about 2 tools
   - the same finding learned twice
   - research outside any project
   - machine 2 before machine 1 has pushed

### Step 8: tests and the writing pass

- `npm test` inside `scripts/`: nothing there changes, and it has to stay green.
- The trials from step 1.
- One live session: `bash lab/scripts/try.sh` asking a Next.js question, then checking the folder it wrote. The session's home folder is the scratch root, so a file the agent writes lands in `tmp/try/root/.flow/`, never the real `~/.flow/`.
- The writing pass on every markdown file touched, inside the edit that touched it.

## Facts found

All checked on 2026-09-18 and 2026-09-19.

### Context7

- **The web API answers with no key**, at low rate limits. A free key from context7.com raises them, sent as `CONTEXT7_API_KEY` or an `Authorization: Bearer` header.
- **3 endpoints matter**, base `https://context7.com/api`:
  - `GET /v2/libs/search?libraryName=&query=`, plus `fast=true` to skip the LLM reranking
  - `GET /v2/context?libraryId=&query=`, plus `type=txt` and `fast`
  - `GET /v3/search?query=`, with up to 4 `library=` hints, `version=` and `language=`: finds the library and returns docs in one request
- **A library record holds** `id`, `title`, `description`, `branch`, `lastUpdateDate`, `state`, `totalTokens`, `totalSnippets`, `stars`, `trustScore`, `benchmarkScore` and `versions`.
- **Next.js, looked up 2026-09-18**: `/vercel/next.js` updated 2026-09-10, versions `v14.3.0-canary.87`, `v13.5.11`, `v15.1.8`, branch `canary`. 2 more candidates came back: `/websites/nextjs` with no versions, and `/workos/authkit-nextjs`.
- **An answer with `type=txt`** is a list of snippets, each with a title, a `Source:` line naming its page, a description and code. The middleware answer was 5.5 KB.
- **Context7 publishes no table of contents per library**, neither in its docs nor in its API.
- **Context7's own setup offers 2 modes**: "CLI + Skills", where a skill runs the `ctx7` command-line tool with no MCP server, and MCP. `ctx7 library <name> <query>` and `ctx7 docs <id> <query>` are the 2 commands. It also ships plugins for Claude Code and Codex.
- **Its docs**: `https://context7.com/llms.txt`, and the whole set at `https://context7.com/docs/llms-full.txt`. The API spec is `https://context7.com/openapi.json`.

### Claude Code and MCP

- **Tool search is on by default.** A session starts with only each MCP tool's name and each server's short note. A tool's full description loads when the agent searches for it. It turns off when `ANTHROPIC_BASE_URL` points anywhere but Anthropic, unless `ENABLE_TOOL_SEARCH` is set, and every MCP tool then loads in full at the start.
- **`alwaysLoad: true`** on a server loads its tools at the start regardless.
- **MCP output** warns past 10,000 tokens and stops at 25,000, raised with `MAX_MCP_OUTPUT_TOKENS`.
- **A skill's frontmatter has no field for an MCP server.**
- **A subagent's `mcpServers` frontmatter** connects an inline server when the subagent starts and disconnects it when it ends. Ignored for a subagent shipped inside a plugin.
- **A plugin can bundle `.mcp.json`**, and its servers start whenever the plugin is enabled.
- **Scopes**: local and user in `~/.claude.json`, project in `.mcp.json` at the project root.

### Codex

- **Its `workspace-write` sandbox** reads anywhere, and edits only in the working folder and the folders listed in `writable_roots`. From `repos/codex/codex-rs/prompts/templates/permissions/sandbox_mode/workspace_write.md`.
- **MCP servers** go in `~/.codex/config.toml` under `[mcp_servers.<name>]`.

### Flow today

- `/flow:research` named Context7 twice before this conversation, and nothing made it callable.
- `/flow:research` clones a tool's source with `git clone --depth 1` into `tmp/references/<tool>/repo`, and re-runs `fetch-docs.sh` "when new work starts and the stamped dates look old".
- `fetch-docs.sh` writes `tmp/references/<tool>/_sources.md`, one line per file: `` - `llms.txt` <- https://context7.com/llms.txt (2026-09-18) ``.
- `references/workflow.md` line 65 says `docs/research/` holds "fetched external docs and research writeups". The research skill says fetched material stays in `tmp/references/<tool>/`. The 2 disagree.
- `/flow:file-findings` turns reusable knowledge with no matching skill into a `needs skill:` line in the project's `.flow/inbox.md`.
- The toolbox is a public repository of 155 tools with no Next.js. `bin/tool.js refresh` writes its fields one at a time.
- domain-skills' `CONTRIBUTING.md` has every `SKILL.md` say where the live docs are once its pages run out. A finding is a pull request, never merged, taken only when it passes 5 rules.
- `https://nextjs.org/docs/llms.txt` answers.
- `npm view next version` printed `16.3.5` on 2026-09-19.

## Scratch on disk

- `tmp/references/context7/`: Context7's `llms.txt`, `llms-full.txt` and `openapi.json`, plus `probe-search.json` and `probe-context.txt` from the 2 test calls.
- `tmp/references/claude-code/`: the `mcp.md` and `skills.md` pages of Claude Code's docs.
