# The toolbox rewrite

The toolbox is a catalog of outside tools that an agent or a project can use. It is a submodule at
`lab/toolbox/`. The design was agreed with the user on 2026-09-13, and **nothing is built yet**. The
build starts in a fresh session after a compaction. This record holds the design, the build, the one
open question, what the toolbox holds today, what was rejected, and the library idea parked for later.

## The design, agreed 2026-09-13

### Where a tool goes

- **One question: is it made for an AI agent to use or run inside, even partly?** Yes goes to
  `agent-tools/`. Everything else goes to `software/`. Then the folder for what the tool helps with.
- **A tool in between goes to `agent-tools/`.** That covers a library for building your own agents
  (browser-use, stagehand, mem0) and a product shipping both a normal tool and an MCP server
  (Firecrawl, dembrandt, claude-task-master). Nothing in `software/` involves an agent.
- **A product with a separate repo per form is filed by the repo bookmarked.** `microsoft/playwright-mcp`
  goes to `agent-tools/browser/`. `microsoft/playwright`, the library, would go to `software/`.
- **One repo that is both is filed by its own description.** HyperFrames says "Built for agents", so
  `agent-tools/video/`. Remotion does not, so `software/video/`.
- **The toolbox keeps what an agent uses, what a project builds on, and projects to learn from.** An
  app used only by hand leaves. Handy stays, because the user plans a tool forked from it.
  Claude-of-Tanks stays in `software/games/`, as a model for building a game with agents. openvid
  leaves.

### The layout

```
lab/toolbox/
  README.md          the guide, then the generated folder tree
  inbox/             where bookmark drops a new tool before it is filed
  agent-tools/       made for AI agents, even partly
    behavior/        how the agent answers: caveman, ponytail, i-have-adhd
    browser/         Playwright MCP, Playwright CLI, browser-use, stagehand
    code/            code-review, Context7, typescript-lsp, Understand-Anything
    collections/     sets of skills: anthropics/skills, mattpocock/skills, softaworks/agent-toolkit
    extending/       making skills, plugins, hooks: skills CLI, skill-creator, claude-code-hooks
    harnesses/       programs agents run inside: PI, oh-my-pi, orca, herdr
    marketing/       claude-seo, claude-ads
    memory/          TencentDB-Agent-Memory, mem0, claude-mem, cognee
    models/          OmniRoute
    research/        deep-research, last30days-skill
    security/        security-guidance, Semgrep Guardian, reverse-skill
    services/        MCP servers for outside services: Supabase, Stripe, Sentry, n8n-mcp
    ui/              frontend-design, impeccable, taste-skill
    video/           HyperFrames, claude-video, video-use
    workflows/       methods adopted whole: superpowers, gstack, ECC
  software/          everything else: libraries, frameworks, services, apps
    backend/         Drizzle, Convex, Hyperswitch, authentik
    documents/       anydoc
    games/           esengine, Claude-of-Tanks
    models/          heretic, promptfoo
    scraping/        Scrapling, scrapfly-scrapers
    security/        Open Policy Agent, OWASP Cheat Sheet Series
    ui/              shadcn/ui, Excalidraw, BlockNote, Storybook
    video/           Remotion, revideo
    voice/           Handy, Coqui TTS, HeadTTS
```

- **Every folder has a `.info` file**: one line saying what belongs. `util fs tree` prints it beside
  the folder.
- **2 levels to start.** A group splits only when it holds 2 sets looked for separately. Memory is the
  likely first: plugins for coding agents (claude-mem, claude-diary) and memory platforms for any agent
  (mem0, cognee, letta).
- **The general text in today's group files is dropped**, ruled by the user. That is the warnings,
  advice, section intros and comparisons in files like `video.md`. Text about one tool moves into that
  tool's notes. An entry under "Considered and skipped" becomes a tool file whose notes say why.

### A tool file

- **Named `owner_repo.md`**, such as `thedotmack_claude-mem.md`. GitHub owner names hold only letters,
  digits and hyphens, so the first `_` always marks where the owner ends. A tool with no GitHub repo
  uses its maker the same way: `anthropics_code-review.md`.
- **Fields at the top, written by bookmark**: `description`, `url`, `stars`, `language`, `pushed`.
  Then a `## Notes` heading.
- **Notes come from real use**, by the user or an agent, and carry the date.

```markdown
---
description: "The Memory Layer for AI Agents - Drop-in memory infrastructure for AI agents and apps. Context that persists. Built for production."
url: https://github.com/mem0ai/mem0
stars: 64.7k
language: Python
pushed: 2026-09-03
---

## Notes
```

### `README.md`

- **A hand-written guide**: the placement question, the in-between rule, how to add a tool, and the
  install commands for MCP servers, plugins and skills.
- **Then the folder tree, folders only**, generated by `util fs tree` between 2 hidden lines,
  `<!-- tree -->` and `<!-- /tree -->`.
- **Rebuilt by whoever adds, renames or removes a folder or edits a `.info`.** Adding a tool never
  changes the tree.
- **No tool lines.** One line per tool costs about 900 tokens for a group of 25, 6,000 for the 170
  tools today, 17,000 at 500. An agent would pay all of it just to learn which groups exist.

### How an agent finds a tool

1. Read `README.md`, about 30 lines.
2. Pick every group that could hold an answer, often several.
3. Search those folders for `description:` lines in one call. The output is one line per tool, with
   its path.
4. Open the 2 or 3 files that look right and read their notes.

When no group fits, search words across every file, notes included. That is the fallback only: in the
search test below, names, descriptions and topics alone missed 6 of 9 needs written as problems.

Nothing points an agent at the toolbox yet. See `## Open`.

### Adding and filing a tool

- **`util github bookmark owner/repo --to lab/toolbox/inbox/`** writes `inbox/owner_repo.md`.
- **Filing a tool is moving its file** into its group, so notes written before filing come along.
- **bookmark skips a repo whose file already exists anywhere in the toolbox**, and says so.

## The build, approved 2026-09-13

### `lab/util`

- **`commands/github/bookmark.sh`**:
  - writes `owner/repo` as the link text, from the repo's `full_name`
  - skips a URL already in the target file
  - writes `owner_repo.md` when `--to` names a folder, with the fields and the `## Notes` heading
  - skips, in folder mode, when a file of that name exists anywhere in the git repository holding the
    folder
  - writes the description inside double quotes, so a colon in GitHub's text cannot break the fields
  - writes `description: ""` for a repo with no description
- **`lib/describe.js`**: drops the double quotes around a `description:` value.
- **`commands/fs/tree.js`**: `--into <file>` replaces what sits between `<!-- tree -->` and
  `<!-- /tree -->` in that file, and stops with an error when either line is missing.
- **`tests/commands.test.js` and `docs/commands.md`**: cover every change above.

### `lab/toolbox`

- **The folders and a `.info` in each**, as laid out above, plus `inbox/`.
- **One file per entry:**
  - An entry with a GitHub link goes through bookmark, about 150 calls, well inside GitHub's hourly
    limit.
  - An entry with no link first gets its GitHub repo looked up with `gh`. Only a tool with no repo of
    its own is written by hand, in the same shape. 22 entries have no link today.
  - Hand-written text about one tool moves into its notes.
  - The 73 inbox lines are filed too, and repeated lines merge.
- **`README.md`** rewritten as above.
- **Removed**: the 13 old group files and `inbox.md` once converted, and `bin/add-repo`.
- **Kept**: `apps.md`, holding openvid's link, until the user has copied it. Deleting it needs its own
  go. `starred.min.json` stays untouched.

### Flow

- **This record, `lab/context/state.md` and `backlog.md`**: describe the built layout.
- **`docs/dev/layout.md`**: the toolbox line changes from "filed by job" to filed by who the tool is
  for, then by job.

### Changed after approval, the same day

- **No save hook.** The approved plan had `util git save` run the repo's `bin/before-save` to rebuild
  the tree before every push. `gsave` on this machine is a symlink to an old `gsave.sh` under
  `~/code/projects/agentic-setup/`, not to `util git save`, so the hook would never run. The tree lists
  folders only, so rebuilding it by hand after a folder change is enough.
- **A `.info` per folder, not a `README.md` per group.** The group `README.md` was proposed to hold the
  general text, and the user dropped that text.

### Not in this build

- **The line telling an agent to read the toolbox.** Where it lives is undecided.
- **Renaming `kind` to `type`** in `lab/util/lib/sources.js` and `lab/util/lib/render.js`.

### After the build

- **Commits are the user's**: inside `lab/util` and `lab/toolbox` first, then Flow.
- **`util` typed on this machine runs `~/code/util/util.js`**, a separate clone. A change in
  `lab/util` reaches it after a commit there and a pull in `~/code/util`.

## Open

- **A `type:` field in the tool file.** Proposed 2026-09-13, no answer yet. 85 entry lines carry a
  hand-written label saying what the tool is, and some carry 2: `[Library]` 25, `[Skill]` 19, `[MCP]`
  13, `[CLI]` 11, `[Plugin]` 9, `[Collection]` 8, `[Reference]` 5, `[Index]` 3, `[Template]` 2, `[App]`
  2, `[Tooling]` 1, `[Framework]` 1. The label tells the agent how to install the tool. GitHub never
  says it, so bookmark cannot write it. Recommended: the move copies each label into `type:`, and
  whoever files a tool out of `inbox/` fills it in, since filing means reading the tool's page. Without
  the field, the labels are lost in the move.

## What the toolbox holds, 2026-09-13

- **13 group files, `inbox.md` and `apps.md`**, about 170 entry lines. 73 of them sit in `inbox.md`.
- **3 sorting axes mixed**: by task (`video.md`), by type of tool (`collections.md`, `apps.md`), by
  audience (`marketing.md`).
- **Most inbox entries are about the agent itself**, over 20 of them memory systems, and no group file
  covers them.
- **11 repeated lines.** `i-have-adhd` is in `inbox.md` 3 times. `vercel-labs/agent-skills` and
  `supabase/agent-skills` both show as `[agent-skills]`.
- **2 entry shapes**: hand-written entries with labels and notes, and the one line
  `util github bookmark` writes.
- **22 entries have no GitHub link**, such as code-review, Context7, Stripe MCP and Handy.
- **Handy is the only desktop app.** openvid is a web app, and `apps.md` holds only its bare link.
- **`research.md` holds 2 entries on 1 line.**
- **`starred.min.json`**: 360 starred repos, used by nothing. 225 carry topics, 59 have no description.
- **`bin/add-repo`** is the script ported to `util github bookmark` on 2026-08-30.

## Ruled by the user

- **The simple version only.** No UI means no harvesters, no database and no advanced search.
- **Browsing means groups with similar tools listed together.** Pages generated per GitHub topic are
  not browsing.
- **Where a new tool goes must be obvious at once.**
- **A clear split between agent tools and other software**, with names carrying no `for-` prefix.
- **One file per tool**, so the user and agents can add notes as tools get used.
- **`util github bookmark` is the one adding command.** `bin/add-repo` is removed, and no toolbox
  script adds entries.
- **Bookmark writes `owner/repo` as the link text**, since 2 repos can share a name.
- **The owner is part of every file name**, joined by a single character.
- **`README.md` lists groups, never tools**, so an agent reads little before searching.
- **A field naming what sort of thing a record is is `type`.** Never `kind`. Carried into the repo
  `CLAUDE.md` as `type-never-kind`.
- **The library is a different product**, designed later through Flow's own groundwork. Its data
  never lives in a file on one machine: the user works from 2 machines, and the first users of the
  workflow need it too.

## Rejected during the conversation

- **One file per group, flat, filled by bookmark appending lines.** Notes from real use grow per tool.
- **Grouping by what a tool helps with, with no split between agent tools and other software.**
- **`for-agents/` and `for-projects/`, `agents/` alone, and `tooling/`** as the top folder names.
  `tooling/` fits both halves, so it separates nothing.
- **`owner--repo.md`.** The user refused a 2-character separator. A plain `-` hides where the owner
  ends, and a `.` reads as a second file extension.
- **Every tool, with its description, in the `README.md` tree.** Too costly to read at hundreds of
  tools.
- **A `README.md` per group holding warnings and comparisons.** The user dropped that text.
- **A save hook in `util git save`.** See `### Changed after approval, the same day`.
- **Every desktop app out.** An app stays when a project builds on it.
- **One file per tool in a flat `tools/` folder**, with `url`, `kind`, `jobs`, `stars` and `pushed`
  fields, a generated `index.md`, `guides/` and `bin/add`. It loses the group view.
- **The group files kept as they are, plus a generated index.** The grouping is the fault.
- **An `agents/` folder beside task folders, for tools that change the agent itself.** code-review and
  Context7 are used through the agent without changing it, so the question has no clean answer.
- **One file per tool with `url`, `kind` and `summary` fields and a `bin/add <link> <group> <kind>`.**
  The summary needs someone to write it, and `bin/add` diverges from bookmark.
- **The library as a 2-day first version**: harvesters for stars, trending and YouTube, SQLite, notes,
  a refresh. No UI, so nothing to browse.
- **A SQLite file on one machine.**
- **A public repository of JSON files as the store**, harvested by GitHub Actions, with generated
  browse pages.

## The library, for later

**The user's idea, from `tmp/notes/library.md`** (gitignored, so not backed up): a catalog of software
tools that grows by itself. Collectors pull from APIs and scrapers from pages, on a schedule: GitHub
trending, the stars and pinned repos of people behind a found repo, the descriptions of YouTube
channels the user registers, and blogs those videos link. Agents reach it fast, maybe through MCP,
and contribute entries. A web UI edits entries the way Wikipedia does, with moderation once others
join. Metadata refreshes monthly. A rating system compares tools that fit different situations, such
as superpowers and Flow. Search has to work for someone who does not know what exists. Free tools
first, then anything software-related, at millions of items with little AI cost.

**Recommended in the conversation, none of it agreed:**

- **The value is notes from real use.** Collecting is already done elsewhere.
- **Rank by how many independent sources saw a tool**, which costs nothing.
- **Rate against a situation**, never one score.
- **Search in layers**: words over name, description, topics and the full README; the searching agent
  rewording the need; search by meaning once a test set of needs starts failing; `key:value` filters
  like GitHub's.
- **A name**: the user liked Harvester plus a word, and Tech Radar. `techharvest` was offered.

**Facts found, 2026-09-13:**

- **GitHub has no trending API.** OSS Insight serves `api.ossinsight.io/v1/trends/repos/?period=past_24_hours`
  with no key, 600 requests an hour per IP.
- **GitHub search**: 30 requests a minute authenticated, up to 1,000 results per query.
- **GitHub Actions**: `GITHUB_TOKEN` allows 1,000 requests an hour per repository, a personal token
  5,000. A schedule runs at most every 5 minutes, and stops after 60 days without activity in a public
  repository.
- **GitHub file limits**: a warning at 50 MiB, a block at 100 MiB. Repositories ideally under 1 GB,
  strongly under 5 GB. "Git is not designed to handle large SQL files."
- **YouTube Data API**: `playlistItems.list` costs 1 unit for up to 50 videos, out of 10,000 units a
  day.
- **ecosyste.ms**: 293 million repos and 14.4 million packages, free, data under CC BY-SA 4.0. A repo
  record adds no README text. A package record carries usage: npm's `zod` shows 1.08 billion downloads
  and 122,785 dependent repos.
- **Similar products**: GithubStarsManager (MIT, 3.5k stars, AI categories, search by meaning and an
  MCP server over your own stars, data kept local), OSS Insight, Trendshift, the GitHub MCP Registry,
  AlternativeTo, LibHunt. None combines chosen sources, notes from use and agent search.
- **Names taken**: theHarvester (17.4k stars) and SUSE's Harvester (5.2k). Tech Radar is a
  ThoughtWorks publication and a Backstage plugin.

**The search test**, `tmp/search-probe/` (gitignored): SQLite full-text search over 435 repos, the 360
starred plus 75 found only in the toolbox, with needs written by someone who does not know the tool.

- **Name, description and topics only**: requiring every word found nothing for 6 of 9 needs.
  Accepting any word ranked the tool 4th to 65th.
- **With the README**: 1st to 4th for 6 of 9. "My coding agent forgets everything between sessions"
  put TencentDB-Agent-Memory 4th.
- **The 2 misses, reworded by an agent**: "browser automation agent" put browser-harness 1st, "claude
  code skills methodology" put superpowers 2nd.
- **READMEs cut to 3,000 characters**: TencentDB fell from 4th to 72nd, since its opening is badges
  and install steps. A README with HTML, images, links and code removed averages 8 KB.
