# Knowledge base

How Flow learns about the world outside the project, and where it keeps what it learns. `/flow:research` answers a question about an outside tool or a field, starting from what earlier research left behind. Capture files what a session taught into the place that will be read next time. Knowledge about an outside tool or a field lives in wiki pages, one folder per subject, shared by every project and every machine. Raw research reports sit apart, in topic folders, until a harvest takes what holds into the pages.

## Scope

- **In**: `/flow:research`, Context7, downloaded docs, the wiki of outside tools, research reports, capture's destinations for knowledge, findings as the one store of what Flow learned, the session start view, notes, and `/flow:upkeep`'s routing.
- **Out**: what makes a rule or writes a check, in `docs/spec/rules.md`. Reviewing, adopting and harvesting an outside skill, in `docs/spec/skills.md`. The failure log, in `docs/spec/failure-log.md`. Tickets, in `docs/spec/tickets.md`.

## Where everything lands

Each path, and what writes it:

```text
~/.flow/                                  the machine: shared by every project, carried by flow sync
├─ wiki/<subject>/                        one folder per outside tool or field
│  ├─ index.md                            /flow:research: what it is, the version in use, the docs, the skill covering it
│  ├─ <topic>.md                          /flow:research, /flow:upkeep: clean knowledge, edited in place
│  ├─ findings/<lesson>.md                capture: a lesson not yet folded into a page
│  └─ downloads/                          fetch-docs.sh: this machine's alone, never synced
├─ findings/<lesson>.md                   next: flow findings new, a fact true in every project (the user, a machine)
├─ notes/<name>.md                        flow note: the user's ideas and put-off work, from every project
└─ research/<topic>/<question>.md         /flow:research: raw reports asked outside any project, none at first

<project>/                                the project: .flow/ links into ~/.flow/projects/<name>/
├─ .flow/research/<topic>/<question>.md   /flow:research: raw reports this project asked for
├─ .flow/findings/<what-was-learned>.md   capture → /flow:upkeep, into a skill or rule
├─ docs/context/<subject>.md              capture: a fact only some work here needs
└─ CLAUDE.md                              capture: a fact most sessions here need
```

## Behaviors

### Research

- `V1` **A question about a tool or a field starts from its wiki folder**: a loaded skill covering it, then `index.md` and the pages whose names match, then the reports in its research topic folder, then outside sources, then what was learned written into the page. An answer found in the folder makes no outside request.
- `V1` **Research searches for what already solves a need before building or reading anything**: skills.sh first, then skills, plugin marketplaces and MCP servers on GitHub and the web. An outside skill found is judged by `docs/spec/skills.md`.
  - **skills.sh at 2 depths** (`fw-346`, the user 2026-10-30): quick, `npx skills find`, for a chosen tool or a need with an obvious name; wide, `scripts/skills-search.sh` over the site's API with at least 5 wordings, for a survey of what exists. Each search is worded 3 ways: the need, the category and its parent, the sites and tools around it. Why: `npx skills find` shows about 8 results, and in `fw-345` 7 narrow wordings of it were read as the whole index, missing Anthropic's own skill for the need. Refused: the wide search every time, whose hundreds of lines fill the context for a need any 8 results answer.
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
- `V1` **A question reading can answer never becomes a ticket of its own.** A question needing something built and run is a child ticket holding a prototype.
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
- `V1` **A skill's field gets a folder like any other, linked from the skill** (`docs/spec/skills.md`, `fw-290`, 2026-10-25). The folder's `index.md` arrives with the skill's text, so the skill names the folder and never says to read it. Its pages and findings live in the wiki, written by any project and carried by `flow sync`. `/flow:audit`'s folder is `audit/`, covering every record it reads.
  - Refused: a knowledge folder inside each skill, grown as it works. A skill is Flow's code, which the agent never edits from a project, and a local edit blocks `flow update`'s pull.
- `never` **A global `index.md` listing every folder.** It goes stale. `util fs tree ~/.flow/wiki` does not. Ruled by the user 2026-10-12.

### Capture

Capture is the sweep the rule file runs at each checkpoint, filing what the conversation taught. `## Capture` in the rule file is the routing table. The knowledge it files:

- `V1` **Capture runs at checkpoints, never on sight**: a handoff, the wrap-up before the context fills, finished work reported, a groundwork branch closed, a plan step landed and verified. It reads the conversation in context, never the transcript on disk. A rule file written mid-session never reaches that session anyway.
- `V1` **A lesson or fact about an outside tool or a field → a finding, `~/.flow/wiki/<subject>/findings/<lesson>.md`**, even while a skill covering it is loaded. `/flow:upkeep` folds it into the page that owns it.
- `V1` **A lesson or fact about this project → `.flow/findings/<lesson>.md`.** A finding about a skill carries the label `<name>-skill`. `/flow:upkeep` moves a project fact to `CLAUDE.md` when most sessions need it, else to `docs/context/<subject>.md`, one question per file, rewritten rather than appended.
- `next` **A correction rewrites the instruction it breaks, in place, at once** (`fw-204`, the user 2026-10-21). A correction is a fault in the instruction, so the fix goes to its source. Where the rule exists and did not fire, its place or shape changes. No profile file exists (`docs/spec/rules.md`).
  - `never` **A correction filed as `flow note "…" --label rule`**, waiting for `/flow:upkeep`: an override on top of the rule it contradicts, loaded nowhere until upkeep runs. 16 such notes waited at once.
- `never` **Anything else → `flow note "…"`**, refused 2026-10-23 (`fw-204`): notes became the agent's catch-all. Notes are the user's (`### Notes`).

### Findings: one store for what Flow learned

Designed in `fw-204` (2026-10-20 to 2026-10-24). The problem it answers: a fact the agent needed sat in a store it never opened, so it worked the fact out again or filed it twice (`fw-205` and `fw-207` filed one lesson 14 minutes apart).

- `V1` **A finding is the one kind of entry** for anything learned: a lesson about a tool, a fact about a project, the user or a machine, however small. Memory, findings and small facts are one mechanism: the agent creates an entry or rewrites one. Notes are not entries (`### Notes`).
- `V1` **The save test is the agent's judgment: will a future session need this?** No list of topics, no notability rules. Memory holds facts, never instructions: an instruction goes to its rule file.
  - Refused: a list of topics memory holds (setup, refusals, warnings). Memory holds any topic, and the old `~/.flow/profile.md` failed by filling with whatever capture saw (`fw-202`).
  - `later` **A record of removed entries, searched at filing**, so a line the user cut cannot return. Added the first time a cut entry comes back.
- `V1` **An entry lives where its subject lives, in one of 3 homes, with no default**: a fact of one project in its `.flow/findings/`, a fact about a tool or a domain in `~/.flow/wiki/<subject>/findings/`, anything else in `~/.flow/findings/`. A fact about a machine is a global finding that names the machine. Machines see each other's entries. `~/.flow/machines/` holds only each machine's record (`<name>.json`) and the setup how-to. Decided 2026-10-23 and 2026-10-24.
- `V1` **An entry is a markdown file named for its claim** in 4 to 8 words, with front matter `labels` and `updated` (the last edit, `2026-10-21 14:05`) and nothing else. No `#` heading and no template: the body states the claim first. The name is the title, and the folder is the scope, so neither is repeated. A body that changes what the name says renames the file. Decided 2026-10-21.
- `V1` **No length limit.** The agent keeps an entry as short as it can. Trigger to revisit: an entry growing with unrelated points.
- `V1` **A changed fact is rewritten in place.** A file whose every line is false is deleted, and its replacement is filed only if it passes the save test. Git keeps the old text.
- `V1` **An entry says in its own text when it becomes false**, and the agent that sees that moment pass deletes it. No timer, no expiry type, no separate pass. A temporary entry is the same kind of entry.
  - Refused: a version stamp on every entry, since each release would mean updating entries one by one. Staleness of tool knowledge is the wiki's (`fw-227`).
- `V1` **Labels are hyphenated, self-explaining, usually 2 words** (`machine-setup`), reusable, never one per tool or ticket. A tool is the folder, never a label. The filing command shows the labels in use with counts.
- `V1` **`flow findings ["<query>"]` lists the closest findings; `flow findings new "<title>"` files one; `flow findings edit <name>` renames one or sets its labels.** The query takes `label:`, `wiki:`, `project:` and free words, the grammar of `flow notes`. `new` takes `--label`, `--wiki <subject>`, `--body <text|->`, `-p` and `--force`, builds the file name from the title and writes the front matter. `new` refuses with neither `-p` nor `--wiki`, since no home is the default. `edit --title` renames and rewrites the old path wherever it is cited; `edit --label` replaces the labels. No `drop`: the agent deletes a false entry by hand. A script stamps `updated` after any edit in a findings folder. `new --wiki` writes a stub `index.md` where the folder has none.
- `V1` **The filing check runs at creation, never on a rewrite by path.** It ranks the findings folders by shared words and rare labels, with the ranking `flow new` uses for tickets. Below a lower bar it prints nothing. Between the bars it writes and prints the related rows, one per entry (path, then labels), at most 20, then `and N more close`. Above a higher bar, a near-duplicate, it refuses until `--force`. It also names up to 3 wiki folders whose name or `index.md` matches the words, so a tool fact lands in the tool's folder. The bars are tuned on the `fw-205` / `fw-207` pair and on unrelated findings: listed from a cosine score of 0.25, refused from 0.45. The pair scored 0.537, and a finding's closest unrelated neighbour 0.191 at the median (2026-10-27, `fw-270`'s `context.md`). The check reads findings only, never wiki pages or reports.
- `next` **A wiki folder's findings reach the agent with its `index.md`.** When the agent reads a wiki folder's `index.md`, or the user `@`-mentions it, the hook that attaches a ticket's header (`docs/spec/tickets.md`, `fw-236`) adds that folder's findings grouped by label. Once per folder per session per agent, again when the groups change, after a compaction or a restart. A read through the shell fires nothing; the reading rules send file reads to `Read`.
  - Refused: `index.md` regenerated on every change to a finding. A finding deleted by hand triggers no rebuild, a generated block clashes in git between machines, and the agent's hand edits to `index.md` would be lost.
  - Refused: a rule to list the findings in the same message as the `index.md` read. A paired-read rule is the kind that does not fire.
- `next` **A research report is reached through the findings that name it.** The ticket's closing step files at least one finding naming each report with lasting value, so its labels lead to it. No research line in the view.
- `never` **Claude Code's auto memory**, kept off (2026-10-24): two memories would drift apart, it is per machine and never syncs, and its index hit its byte budget mid-task (issues #83114, #47959).

### The session start view

- `V1` **A `SessionStart` hook prints a view of what exists**, computed from disk at each start, `resume`, `clear` and compaction. Nothing generated is written or synced, and the hook's text sits after `CLAUDE.md`, so no cache is broken at the head of the prompt. Decided 2026-10-20, built by `fw-273` in `scripts/features/session-start/view.ts`.
- `V1` **The view holds only what nearly every session needs**: label groups with counts, folder names and spec file names, under 40 lines, as a ceiling. No fact lines and no hand-written line per group, since those grow with every entry and go stale. No commands, since `~/.flow/CLAUDE.md`'s exploring section names them. A line stops at 20 labels, then `+N more`.
  - Each line counts what the plain listing shows: open tickets that are not parked, and the notes of this project and the home. Outside a project, the home's tickets, and no project findings or spec line.
  - A store with nothing in it drops its line, and a view with no line prints nothing.
  ```text
  Labels in use, (n) = entries
  tickets           flow-issue (25), feature (22), rework-loop (11), ...
  notes             <label> (n), ...
  findings global   machine-setup (2), user-preference (3), active-warning (1)
  findings project  <label> (n), ...
  ~/.flow/wiki/     claude-code (31), node (4), ...
  docs/spec/        product, tickets, skills, rules, ...
  ```
- `V1` **The `docs/spec/` line is there so the agent opens a part's decisions before it proposes.** A refused option already sits in that file's `never` lines with its reason, so no store of refusals exists. What would overturn it: re-proposals continuing with the line loaded; then a hook injects the matching `never` lines on each prompt.
- `V1` **The wiki line lists the project's visited folders first, by last visit, with the visit count**: `claude-code (12), node (3), audit, ...`. The others follow, and past 15 folders the 15 changed most recently on disk. Built by `fw-274` in `scripts/features/session-start/view.ts`.
  - **A visit is a `Read` of any file inside a wiki folder or a research topic**, counted once per folder per window by the flow-session mod (`mods/flow-session/features/usage/visits.ts`). A compaction or a restart counts it again, and a subagent's window counts apart. Decided 2026-10-28: the mod sees which ticket the session started, and the `flow` command does not.
  - **The count goes to `usage.json` in the ticket's folder** (`{"claude-code": {"count": 12, "last": "2026-10-24 14:05"}}`), the ticket being the last `flow tickets start <id>` in the main window. With no ticket started, the count goes to the project's `.flow/usage.json`. The file moves, syncs and archives with its ticket, and stays a few hundred bytes. The project's counts are the sum over every file (`scripts/features/usage/usage.ts`). The ticket's own list rides in its header (`fw-236`).
  - Refused: counting in the search. A search names places, and only a read shows one was used.
  - Refused: one counter file per machine. A ticket continued on the other machine would show none of its folders.
- `V1` **`flow search -- "<words>"` lists the wiki folders and research reports closest to a situation**, one line each: the path, then what the place is about. Built by `fw-274` in `scripts/features/usage/search.ts`.
  - A wiki folder ranks by its name, its `index.md`, its page names and its findings' names. A report ranks by its topic, its file name and its text, with the ranking `flow findings new` checks duplicates with (`scripts/shared/similarity.ts`).
  - A report is a markdown file in its topic folder or one folder below it. Deeper files are copies a report collected. A topic shows at most 3 reports, so one large topic cannot fill the list. Scores under 0.08 are dropped, since they share only a common word.
  - Named `search`, not `wiki`, since it covers wiki and research both (the user, 2026-10-28).
- `next` **The search prints `fw-227`'s stale notice** beside a tool whose wiki pages trail its installed version, once `fw-227` finds those tools.
- `never` **A block of tickets in flight, or a line naming this machine and its projects**, refused 2026-10-24: not useful in nearly every session, and `flow next` lists the tickets.

### Notes

- `next` **Notes hold the user's ideas and put-off work.** The agent writes a note when the user asks, and when the user mentions an idea outside the current ticket. One note per topic, found by the filing check: a changed opinion rewrites the note in place, so no ticket is made, rewritten, merged or dropped for an idea. Decided 2026-10-23 and 2026-10-24.

### Exploring

- `next` **One section of `~/.flow/CLAUDE.md` holds everything about exploring**: the wiki, findings, notes, reports, the view and every command that opens them. The exploration steps of `/flow:research` move there, and the skill points to it. It rewrites `know-where-knowledge-lives` and `wiki-first` in place.
- `next` **Before adding a wiki folder, the agent greps the `index.md` files** for every name and address of the tool, so one tool met through a repository and a site gets one folder.
- `next` **Wiki folders stay flat until about 50**, when a flat tree grows too long to read. Nesting by owner (`vercel/skills`) waits for the search.

### Filing findings

- `V1` **`/flow:upkeep`, user only, sorts closed tickets nobody filed (`flow ls "status:done filed:no"`), the failure log, the notes, the findings and the `issues.md` that older tickets still hold, in one batch**, shows the plan and stops, then writes. A finding about an outside tool goes to the wiki page that owns it. A rule goes to `~/.flow/CLAUDE.md`, a project's `## Rules`, or a rule file with `paths:`. A project fact goes to `CLAUDE.md` or `docs/context/`. It ends with `flow file <id>...` on the tickets it read.
- `V1` **A procedure that repeats across tickets becomes a how-to page in the tool's folder.** It becomes a skill only where a script has to run, or after the agent skipped the page twice.
- `V1` **Altitude decides the home**: a tool quirk or a framework pattern → that tool's wiki folder. A seam between 2 tools → the causing tool's folder, plus a line in the other's `index.md`. A broad principle → a concept skill.

### The harvest

The harvest reads raw reports or an outside skill, and writes what holds into wiki pages, in Flow's own words.

- `V1` **Knowledge about a tool or a field is wiki pages, never a new domain skill.** Most of a domain skill is facts, and a page can be rewritten and browsed. A procedure that must fire by itself stays a skill. Decided with the user 2026-10-12 (`fw-94`).
- `V1` **A harvest runs through `/flow:research` when the user asks.** A harvested report gets `harvested: <date>` in its header.
- `V1` **`/flow:upkeep` is the one sweep over the wiki, the rules and the skills**, for stale lines and improvements, built in `fw-103`. It harvests no report, and settles a report that contradicts a page line in its plan.
- `never` **`/flow:write-skill`, a harvest into one skill per tool**, dropped 2026-10-12 (`fw-94`): the facts live in the wiki.
- `never` **One sharing command for everything anyone learns**, dropped with all work for strangers (`fw-16`), `flow contribute` archived with it.

## The parts

- **`skills/knowledge/research/SKILL.md`**: the steps from the wiki folder, the search for what already solves a need, the 4 levels, and where a report goes.
- **`guides/wiki.md`**: a wiki folder's layout, `index.md`, `_sources.md`, a page's version lines, and how a page changes. Read before any write into the wiki, by research and capture both.
- **`skills/knowledge/research/scripts/context7.sh`**: Bash over Context7's web API with `curl`. `search <name> <question>`, and `ask <id|folder[@version]> <question>`, `--tool <folder>` writing the id into `index.md`.
- **`skills/knowledge/research/scripts/fetch-docs.sh`**: downloads into a tool's `downloads/` from any folder. `--package` or `--repo` names where the latest release is read, and `--clone` clones or pulls the source into `downloads/repo/`.
- **`home/CLAUDE.md` → `## Capture`**: where each kind of knowledge goes. **`## Reading`**: work against an outside tool starts from its wiki folder.
- **`skills/knowledge/upkeep/SKILL.md`**: the routing from closed tickets, notes and findings to their homes.
- **`~/.flow/guides/knowledge.md`**: the map of what an agent draws on past the rules, and how a skill is written, read before proposing a skill, a plugin or an MCP server.

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
7. Building the feature, a redirect loops in middleware. The fix lands, and capture at the next checkpoint files `~/.flow/wiki/next.js/findings/middleware-redirect-loop.md`, with the loop's cause and fix as one line. `/flow:upkeep` later folds it into `middleware.md`, opening `Checked against next.js 16.3.5`.
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
- **A fact stated once is never re-derived** (`fw-204`), measured by `/flow:audit` on real sessions: the agent no longer proposes setting up the machine that has no Flow; a fresh session on "agent memory" finds its report through `flow findings`; the view stays under 40 lines.
- **`/flow:research` has run on a wiki folder in a live session.** Not yet: both scripts passed their trials alone, against the real Context7 and real docs sites, and never through the skill.

## What is locked

- **Context7 is called by a script, never an MCP server.** A script can check the tool's shortcuts before calling and write what it learns to a file. An MCP answer only lands in the conversation. What would flip it: Context7 closing its web API, or its MCP server doing clearly more.
- **A tool is reached through a command, a script, then an MCP server, in that order.** An MCP server only where the tool has no other way in, or needs a live session, such as a browser. `~/.flow/guides/knowledge.md` → `## Reach a service through a command`.
- **One folder per tool or field, on the machine, shared by every project.** What every project and both machines learn about one subject meets in one set of pages.
  - Refused: the toolbox file as the one place per tool, with `docs:` and `context7:` fields. One file per tool cannot hold the knowledge. Ruled 2026-09-19.
  - Refused: one copy per project, in `tmp/references/<tool>/`, which never got a structure or rules.
- **The folder is named `wiki/`**, picked 2026-09-19 from the user's candidates: 4 letters, a word everyone knows, and a set of pages one per subject.
  - Refused: `tools/`, which reads like part of Flow. `knowledge/`, too long. `refs`, beside `~/.flow/references/` (now `~/.flow/guides/`). `context`, every project's `docs/context/`. `library`, the user's planned tool catalog. `intel` and `lore`, slang and a rare word.
- **Downloads are never committed.** Each machine refreshes its own anyway. Git would store a new copy of a 480 KB `llms-full.txt` on every change, and cannot commit a clone as files.
  - Refused: `index.md` recording download dates. It syncs and the downloads do not, so its dates would describe the other machine's files.
- **Project research lives in `.flow/research/<topic>/`.** `.flow/` links into the Flow home, one folder for every code branch, so a report never conflicts across feature branches. Approved 2026-10-06, replacing `docs/research/`. Topic folders replaced the flat layout 2026-10-12 (`fw-94`): 50 flat names hid which report held what.
- **One root for reports: the project's `research/`.** Decided with the user 2026-10-12 (`fw-106`): a report is temporary, since its facts are harvested into the wiki and the report is then deleted, so another project need not find it. What would overturn it: the harvest (`fw-103`) staying unbuilt for months, with other projects blind to every report meanwhile. Harvest the tool reports first (Context7, backlog boards), since other projects look for those.
  - Refused: 2 roots, `~/.flow/research/` for a report true in any project and the project's for the rest, the first build of `fw-106`. It asks a true-in-any-project test of every report, for a file that is harvested and deleted anyway.
- **2 layers: raw reports in `research/`, clean knowledge in `wiki/`.** Decided with the user 2026-10-11 (`fw-94`): a report is raw, often mixed and noisy; the wiki is what an agent browses.
  - Refused: one tree, with every report distilled in place. A product idea or a field survey fits no tool folder.

## References

- `.flow/tickets/archive/fw-94/groundwork/map.md`: section 1, the wiki and research layout, and the reasoning behind it.
- `.flow/tickets/204/ticket.md` → `## Decisions`: findings, the view, notes and exploring, with the reasoning.
- `.flow/research/agent-memory/`: how other memory tools store, load and expire entries.

- `.flow/research/context7/how-it-retrieves-docs.md`: how Context7 retrieves docs, supplied by the user.
- `.flow/research/context7/which-tools-compete.md`: the tools competing with Context7, supplied by the user.
