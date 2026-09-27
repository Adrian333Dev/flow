# Research and capture

Flow keeps what sessions learn about outside tools in one place on your machine, shared by every project: a folder per tool under `~/.flow/wiki/`. This page shows where everything research and capture write goes, how `/flow:research` answers a question about a tool, and what happens in every case you are likely to meet. It assumes you know what a Flow skill and a project are.

## Table of contents

- [What Flow keeps, and where](#what-flow-keeps-and-where)
- [How research answers a question about a tool](#how-research-answers-a-question-about-a-tool)
- [Context7](#context7)
- [Downloads](#downloads)
- [Where a research report goes](#where-a-research-report-goes)
- [How a finding is captured](#how-a-finding-is-captured)
- [The harvest](#the-harvest)
- [2 machines](#2-machines)
- [Every case](#every-case)

## What Flow keeps, and where

An outside tool is anything your project uses that someone else makes: a library such as Next.js, a service such as Stripe, a command-line tool, or a standard with its own docs, such as OAuth 2.1. Each gets one folder under `~/.flow/wiki/`, named after its GitHub repository.

```text
~/.flow/
├─ wiki/
│  └─ next.js/                            one folder per outside tool
│     ├─ index.md                         where the live docs are, which page answers what
│     ├─ research/<question>.md           research reports about this tool alone
│     ├─ findings/<what-was-learned>.md   facts learned using the tool
│     └─ downloads/                       this machine's alone, never committed
│        ├─ _sources.md                   what was downloaded, when, and the tool's latest release then
│        ├─ llms.txt
│        ├─ llms-full.txt
│        ├─ pages/<page>.md
│        └─ repo/                         the tool's source code
└─ research/<question>.md                 research about no single tool

<project>/
├─ docs/research/<question>.md            research true only for this project
├─ docs/context/<subject>.md              facts true only for this project
└─ .flow/findings/<what-was-learned>.md   lessons that are not about an outside tool
```

- **`index.md`**: shortcuts for the next search of the same tool. Where its docs live, its id in Context7, and which page answered which topic. Never the answers themselves.
- **`research/`**: one file per question asked about the tool, true in any project.
- **`findings/`**: one file per thing a session learned the hard way using the tool: what went wrong, what fixed it, the rule that follows, and the version it holds for.
- **`downloads/`**: the tool's docs and source code, downloaded by this machine. Git never sees them.
- **`~/.flow/research/`**: research that is about no single tool, such as a comparison of several services.

2 tools whose repositories share a name, such as 2 called `sdk`, take `owner_repo`. A tool with no GitHub repository takes the product's name.

## How research answers a question about a tool

`/flow:research` walks the same 6 steps every time. Here they are on one question: *how does a Next.js app send a signed-out user to the sign-in page?*

1. **The tool's own skill comes first.** If a Next.js skill is loaded, it already holds what earlier sessions learned, and research starts from it.
2. **Open `~/.flow/wiki/next.js/`**, creating it on the first question about Next.js. Research prints one line, such as `next.js: 7 findings, no skill`, so you can see when a tool has gathered enough findings to be worth a skill.
3. **Read the reports and findings whose names match the question.** A file called `redirect-signed-out-users.md` answers it, and research stops there with no outside request.
4. **Follow `index.md`.** It may list the page that answered this topic last time, or Next.js's id in Context7, which saves a search.
5. **Go outside.** A quick question goes to Context7 first. Building against the tool goes to its downloaded docs first. A bug goes to the tool's GitHub issues. Web search comes last.
6. **Write back.** The page that answered gets a line in `index.md`. A question that took more than a quick lookup gets a report in `research/`.

## Context7

Context7 is a free web service that answers a question from a library's docs. It reads thousands of libraries' docs ahead of time, often several versions of each, and returns the snippets that answer the question, each naming its source page.

Research calls it through a small script bundled with the skill, never through an MCP server, so nothing about Context7 loads into a session that does not use it:

```sh
context7.sh search next.js "redirect signed-out users"
context7.sh ask /vercel/next.js/v15.1.8 "redirect signed-out users" --tool next.js
context7.sh ask next.js "redirect signed-out users"
```

The first finds Next.js's id. The second asks, and writes the id into `~/.flow/wiki/next.js/index.md`. The third reads the id from there and skips the search.

- **When research uses it**: for a quick question, such as one function or one setting. For building a feature, the tool's own docs come first, since Context7 sometimes lags behind them.
- **The version check**: research reads the tool's version from the project's lockfile first.
  - Context7 holds that version → it asks for that version.
  - The project is on the newest release, and Context7 read the docs after that release came out → it asks with no version.
  - Anything else → it skips Context7, and reads the tool's own docs for the project's version.
- **When it is down**: the script gives up after 15 seconds and prints one line, such as `context7: unavailable (no answer in 15 seconds)`. Research goes on without it: the pages `index.md` lists for the topic, then the downloads, then web search. A used-up monthly quota takes the same route. Context7 works without an account. Setting `CONTEXT7_API_KEY` to a free key from context7.com raises its limits.
- **Nothing it says is saved.** Only the id and the page the answer came from go into `index.md`. The same question rarely comes twice, and a saved answer goes stale.

## Downloads

Most tools publish 2 files for AI agents on their docs site. `llms.txt` is a short index linking to each docs page. `llms-full.txt` is every page in one file, often several megabytes.

- **What**: both files where the tool has both, single pages research asked for, and the tool's source code when its docs cannot answer a question.
- **Where**: `~/.flow/wiki/<tool>/downloads/`. `_sources.md` there records each file's address, the day it was downloaded, and the tool's newest release that day:

  ```md
  - `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5)
  - `repo/` <- https://github.com/vercel/next.js (2026-09-19, latest release then 16.3.5)
  ```

- **When it is downloaded again**: only when a project is on a newer version of the tool than the release recorded. A project on the same or an older version reads what is there, and checks what it reads against its own version. There is no age limit, and a normal read makes no network request.
- **The source code** is cloned once into `downloads/repo/`, and pulled when downloaded again.

`downloads/` holds a `.gitignore` with the one line `*`, so git skips the whole folder whatever repository it sits in.

## Where a research report goes

Every report is one file per question: the question or prompt at the top, the findings under it.

- A quick question, one function or one setting → no file. The answer is in the conversation.
- About one outside tool, true in any project → `~/.flow/wiki/<tool>/research/<question>.md`.
- About no single tool, true in any project: a comparison, a technique, a field → `~/.flow/research/<question>.md`.
- True only for this project: its users, its market, a client's old system → `docs/research/<question>.md` in the project.
- Unsure → `docs/research/`. A report whose home is unclear may hold project details, and those never enter `~/.flow/`. Outside any project, the default is `~/.flow/research/`.

2 examples. A report on how Context7 finds and ranks docs is about one tool, so it goes to `~/.flow/wiki/context7/research/`. A report comparing Context7 with the services competing with it is about no single tool, so it goes to `~/.flow/research/`.

- **A question about 2 tools** goes to the folder of the tool it is mostly about, and the other tool's `index.md` gets a line pointing to it.
- **A survey run to make a project decision splits.** The survey goes to `~/.flow/`. The decision goes to the project's `docs/spec/decisions.md`.
- **Research done with another AI**, such as ChatGPT's deep research, follows the same list. Its prompt and the pasted report share one file.

## How a finding is captured

A finding is something a session learned the hard way, written down the moment it happens so the next session never learns it again. Capture is the rule in every session's rules that writes it.

- **About an outside tool**: a library's quirk, a service's limit, a command's trap → `~/.flow/wiki/<tool>/findings/<what-was-learned>.md`, named in 4 to 8 words, such as `middleware-runs-before-static-files.md`. It says what went wrong, what fixed it, the rule that follows, and the version. The same fact learned again adds one line at the end of the file, with the version and the date.
- **Anything else reusable**: a pattern that works, a rule worth keeping → `.flow/findings/<what-was-learned>.md` in the project, the same way. `/flow:file-findings` later moves it into a skill or a rule.
- **A fact true only in this project** → `docs/context/<subject>.md`. The test: would the sentence be true in a different project?

A finding never holds a detail of the project or its client, since `~/.flow/` goes to GitHub. The repository stays private.

A tool's folder only grows. A new question makes a new file, a new finding makes a new file, and a new shortcut adds a line to `index.md`. Rewriting happens only where a shortcut stopped working. 2 projects, or 2 machines, add to the same folder without overwriting each other.

## The harvest

The harvest turns a tool's findings into a skill for that tool. It reads the tool's whole folder, checks each finding against the tool's docs or source, and writes the skill. Findings it wrote in are deleted from the folder. Run again later, it adds only what came in since.

Nothing starts it on its own. Research prints each tool's finding count, and you decide when a tool has enough. The skill that runs the harvest, `/flow:write-skill`, is not built yet, so findings wait in their folders until it is.

A tool whose skill came from its makers works the same way: its findings go to its folder, and the harvest adds them to your copy of the skill in the domain-skills repository.

## 2 machines

`flow sync` sends `~/.flow/` to your private Flow home repository on GitHub, and brings the other machine's changes back.

- **Travels**: every `index.md`, `research/` and `findings/` folder, and `~/.flow/research/`.
- **Stays**: every `downloads/` folder. Each machine downloads its own, since a new copy of a multi-megabyte file on every change would bloat the repository, and a cloned repository cannot be stored inside another as files at all.

A finding written on one machine reaches the other after both have synced.

## Every case

- **The first research on a tool**: research creates `~/.flow/wiki/<tool>/`, asks Context7 or downloads the docs, and writes the first `index.md` lines and any report.
- **A second project on the same tool**: research finds the folder, reads its reports and findings first, and follows `index.md`. Often nothing outside is asked at all.
- **A project on a newer version than the downloads**: research downloads again before reading, and `_sources.md` records the new release.
- **A project on an older version**: research reads the downloads as they are, and checks what they say against Context7 pinned to the project's version, or the tool's docs for that version.
- **Context7 down or out of quota**: the script prints one line within 15 seconds, and research carries on from `index.md`, the downloads and web search.
- **A tool with no `llms.txt`**: the download script says `no llms.txt` and saves nothing. Research asks Context7, then web search, saving useful pages with the script, then asks you for the docs.
- **A finding about 2 tools**: it goes to the folder of the tool causing it, and the other tool's `index.md` gets a line pointing to it.
- **The same finding learned twice**: the second time adds one line to the existing file, with the version and the date.
- **Research outside any project**: there is no lockfile, so the downloads are read as they are, and a report with no clear home goes to `~/.flow/research/`.
- **Machine 2 asks before machine 1 has synced**: machine 2 does not see machine 1's new findings yet, and may learn one again. When both sync, git keeps both files, or both lines where they landed in one file.
