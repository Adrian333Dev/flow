# The toolbox rewrite

The toolbox is a catalog of outside tools that an agent or a project can use. It is a submodule at
`lab/toolbox/`. The design was agreed with the user on 2026-09-13 and **built the same day**, and it
waits for the user's commits. This record holds the design as built, the build, what the toolbox held
before, what the user ruled, what was rejected, and the library idea parked for later.

## The design, agreed 2026-09-13

### Where a tool goes

- **One question: is it made for an AI agent to use or run inside, even partly?** Yes goes to
  `agent-tools/`. Everything else goes to `software/`. Then the folder for what the tool helps with.
- **A tool in between goes to `agent-tools/`.** That covers a library for building your own agents
  (browser-use, stagehand, mem0) and a product shipping both a normal tool and an MCP server
  (Firecrawl, dembrandt, claude-task-master).
- **A product with a separate repo per form is filed by the repo bookmarked.** `microsoft/playwright-mcp`
  goes to `agent-tools/browser/`. `microsoft/playwright`, the library, would go to `software/`.
- **One repo that is both is filed by its own description.** HyperFrames says "Built for agents", so
  `agent-tools/video/`. Remotion does not, so `software/video/`.
- **The toolbox keeps what an agent uses, what a project builds on, and projects to learn from.** An
  app used only by hand leaves. Handy stays, because the user plans a tool forked from it.
  Claude-of-Tanks stays in `software/games/`, as a model for building a game with agents. openvid
  leaves.
- **Filed as the agreed layout named them, even where a tool also ships a skill.** Scrapling and anydoc
  sit in `software/` although both now offer something for agents.

### The layout

The number after each folder is how many tools it held after the build, 155 in all.

```
lab/toolbox/
  README.md          the guide, then the generated folder tree
  apps.md            openvid's 2 lines, until the user has copied them
  starred.min.json   360 starred repos, used by nothing
  inbox/             where bookmark drops a new tool before it is filed
  agent-tools/       made for AI agents, even partly
    behavior/     4  how the agent answers: caveman, ponytail, i-have-adhd
    browser/      7  Playwright MCP, Playwright CLI, browser-use, stagehand, Firecrawl
    code/         9  code-review, Context7, typescript-lsp, Understand-Anything
    collections/ 12  sets of skills: anthropics/skills, mattpocock/skills, softaworks/agent-toolkit
    extending/    8  making skills, plugins, hooks: skills CLI, skill-creator, claude-code-hooks
    harnesses/   11  programs agents run inside, and toolkits for building one: PI, orca, herdr
    marketing/    4  claude-seo, claude-ads
    memory/      26  TencentDB-Agent-Memory, mem0, claude-mem, cognee
    models/       1  OmniRoute
    research/     6  deep-research, last30days-skill
    security/     4  security-guidance, Semgrep Guardian, reverse-skill
    services/     8  outside services: MCP Toolbox for Databases, Supabase, Stripe, Sentry, n8n-mcp
    ui/          10  frontend-design, impeccable, taste-skill
    video/        9  HyperFrames, claude-video, video-use
    workflows/    5  methods adopted whole: superpowers, gstack, ECC
  software/          everything else: libraries, frameworks, services, apps
    backend/      4  Drizzle, Convex, Hyperswitch, authentik
    documents/    1  anydoc
    games/        2  esengine, Claude-of-Tanks
    models/       2  heretic, promptfoo
    scraping/     2  Scrapling, scrapfly-scrapers
    security/     2  Open Policy Agent, OWASP Cheat Sheet Series
    ui/          10  shadcn/ui, Excalidraw, BlockNote, Storybook
    video/        5  Remotion, revideo, react-video-editor-pro
    voice/        3  Handy, Coqui TTS, HeadTTS
```

- **Every folder has a `.info` file**: one line saying what belongs, 27 in all. `util fs tree` prints it
  beside the folder.
- **2 levels to start.** A group splits only when it holds 2 sets looked for separately. Memory, at 26,
  is the likely first: plugins for coding agents (claude-mem, claude-diary) and memory platforms for any
  agent (mem0, cognee, letta).
- **The general text in the old group files is dropped**, ruled by the user: the warnings, advice,
  section intros and comparisons. Text about one tool moved into that tool's notes. The one entry under
  "Considered and skipped" in `video.md` was dropped whole, with no file, because it came from one
  research pass and not from use.

### A tool file

- **Named `owner_repo.md`**, such as `thedotmack_claude-mem.md`. GitHub owner names hold only letters,
  digits and hyphens, so the first `_` always marks where the owner ends.
- **Fields at the top, written by bookmark**: `description`, `type`, `url`, `stars`, `language`,
  `pushed`, and `archived: true` only for an archived repo. Then a `## Notes` heading.
- **`type` is filled in by whoever files the tool**, since GitHub never says whether a repo is a skill or
  a library. The words used: `skill`, `plugin`, `mcp`, `cli`, `library`, `app`, `framework`,
  `collection`, `index`, `reference`, `template`, `tooling`. A tool that is 2 lists both: `cli, library`.
- **`description` is written by hand when GitHub has none.** An empty one tells a searching agent
  nothing.
- **Each batch of notes sits under a heading with its date and where it came from**: `### 2026-08-06,
  from research` for the text moved out of the old group files, and a line naming the project for notes
  from real use.
- **A tool with no GitHub repo of its own is written by hand**, named after its maker, with only
  `description`, `type` and `url`: `anthropics_code-review.md`, its `url` pointing at the plugin's
  folder inside `anthropics/claude-plugins-official`.

```markdown
---
description: "The Memory Layer for AI Agents - Drop-in memory infrastructure for AI agents and apps. Context that persists. Built for production."
type: library
url: https://github.com/mem0ai/mem0
stars: 65.2k
language: Python
pushed: 2026-09-11
---

## Notes
```

### `README.md`

- **A hand-written guide**: how to find a tool, what a tool file holds, how to add one, which folder a
  tool goes in, and the install commands for MCP servers, plugins and skills.
- **Then the folder tree, folders only**, generated between 2 hidden lines, `<!-- tree -->` and
  `<!-- /tree -->`, by `util fs tree . --except "*.md" --except "*.json" --except ".*" --into README.md`.
- **Rebuilt by whoever adds, renames or removes a folder or edits a `.info`.** Adding a tool never
  changes the tree.
- **No tool lines.** One line per tool costs about 900 tokens for a group of 25, 6,000 for the 155
  tools today, 17,000 at 500. An agent would pay all of it just to learn which groups exist.

### How an agent finds a tool

1. Read `README.md`: the guide and the tree, about 100 lines.
2. Pick every group that could hold an answer, often several.
3. Search those folders for `description:` lines in one call. The output is one line per tool, with
   its path. `agent-tools/memory` and `agent-tools/code` together print 6,211 characters, about 1,700
   tokens.
4. Open the 2 or 3 files that look right and read their notes.

When no group fits, search words across every file, notes included. That is the fallback only: in the
search test below, names, descriptions and topics alone missed 6 of 9 needs written as problems.

Nothing points an agent at the toolbox yet. See `### Not built`.

### Adding and filing a tool

- **`util github bookmark owner/repo --to inbox/`** writes `inbox/owner_repo.md`.
- **Filing a tool is filling in `type`, then moving its file** into its group, so notes written before
  filing come along.
- **bookmark skips a repo whose file already exists anywhere in the toolbox**, whatever the case of the
  name, and says where.

## The build, 2026-09-13

### `lab/util`

- **`commands/github/bookmark.sh`**:
  - writes `owner/repo` as the link text, from the repo's `full_name`
  - skips a repo whose link is already in the target file
  - writes `owner_repo.md` when `--to` names a folder: a path that exists as one, or ends in `/`
  - skips, in folder mode, when a file of that name exists anywhere in the git repository holding the
    folder, and exits 0
  - writes the description inside double quotes, escaping `"` and `\`, so a colon in GitHub's text
    cannot break the fields
  - writes `description: ""`, `type: ""` and `language: ""` when there is nothing to write
- **`lib/describe.js`**: reads a double-quoted `description:` value without its quotes and escapes, and
  treats `""` as no description.
- **`commands/fs/tree.js`**: `--into <file>` replaces what sits between `<!-- tree -->` and
  `<!-- /tree -->` with the tree in a code block, leaves out the count of folders and files, and stops
  with an error before walking anything when either line is missing.
- **`lib/sources.js` and `lib/render.js`**: the `kind` field is `type`. The column constant `KIND` in
  `render.js` became `LABEL_END`, since it names where a source's label ends.
- **`tests/commands.test.js`**: 5 new tests, 54 in all, passing. The bookmark tests answer from a fake
  `gh` that hands the filter to `jq`, and skip on a machine without `jq`.
- **`docs/commands.md`**: the `tree` and `bookmark` lines cover the new flags.

### `lab/toolbox`

- **145 tools went through bookmark**, into their folders directly. 3 repos had been renamed:
  `Dryxio/auto-re-agent` is `Dryxio/reagent`, `googleapis/genai-toolbox` is `googleapis/mcp-toolbox`,
  `stripe/agent-toolkit` is `stripe/ai`. None is archived.
- **10 tools with no repo of their own were written by hand**: 6 Anthropic plugins (code-review,
  frontend-design, mcp-server-dev, security-guidance, skill-creator, typescript-lsp), 2 Vercel skills
  (react-best-practices, web-design-guidelines), Anthropic's theme-factory skill, and n8n's own MCP
  server.
- **The entries with no GitHub link were looked up with `gh`**: Playwright MCP, Chrome DevTools MCP,
  Context7, Supabase MCP, Sentry MCP, Stripe MCP, Cloudflare MCP, Semgrep Guardian, the NestJS skills
  and Handy all have repos. The rest became the 10 files written by hand. react-video-editor-pro,
  private when its old entry was written, is public now.
- **The 73 inbox lines were filed** and their repeats merged: `i-have-adhd` 3 times, `adhd`, `archify`
  and `claude-code-hooks-mastery` twice each, and 6 tools already in a group file.
- **`README.md`** rewritten, with the tree generated into it.
- **Removed**: the 13 old group files and `inbox.md`, converted, and `bin/add-repo`, replaced by
  bookmark.
- **Kept**: `apps.md`, now holding openvid's site and its GitHub line from the old inbox, until the
  user has copied them. `starred.min.json` untouched. `.claude/skills/explain/`, a copy of Delapse's
  `explain` skill that nothing in the toolbox uses, waits for the user's go to delete.

### Flow

- **This record, `lab/context/state.md` and `backlog.md`**: describe the built layout.
- **`docs/dev/layout.md`**: the toolbox line says filed by who the tool is for, then by what it helps
  with.

### Changed after approval, the same day

- **No save hook.** The approved plan had `util git save` run the repo's `bin/before-save` to rebuild
  the tree before every push. `gsave` on this machine is a symlink to an old `gsave.sh` under
  `~/code/projects/agentic-setup/`, not to `util git save`, so the hook would never run. The tree lists
  folders only, so rebuilding it by hand after a folder change is enough.
- **A `.info` per folder, not a `README.md` per group.** The group `README.md` was proposed to hold the
  general text, and the user dropped that text.
- **"Considered and skipped" dropped whole**, ruled by the user.
- **`type:` and the `kind` rename joined the build**, both approved by the user.
- **3 descriptions written by hand**: GitHub has none for `cloudflare/mcp-server-cloudflare`,
  `Kadajett/agent-nestjs-skills` and `kajisho5/ffmpeg-skill`. `README.md` step 2 says to fill one in.
- **"Vendor doc-skills" in `code-quality.md` got no file.** It named no tool, only advice to install a
  vendor's own skill.

### Not built

- **The line telling an agent to read the toolbox.** The user suggested the `research` skill
  2026-09-13. Under discussion.

### After the build

- **Commits are the user's**: inside `lab/util` and `lab/toolbox` first, then Flow.
- **`util fs tree --into` and bookmark's folder mode reach the typed `util`** after the commit in
  `lab/util` and a pull in `~/code/util`, the clone `~/.local/bin/util` points at.

## What the toolbox held before the build, 2026-09-13

- **13 group files, `inbox.md` and `apps.md`**, about 170 entry lines. 73 of them sat in `inbox.md`.
- **3 sorting axes mixed**: by task (`video.md`), by type of tool (`collections.md`, `apps.md`), by
  audience (`marketing.md`).
- **Most inbox entries were about the agent itself**, over 20 of them memory systems, and no group file
  covered them.
- **11 repeated lines.** `i-have-adhd` was in `inbox.md` 3 times. `vercel-labs/agent-skills` and
  `supabase/agent-skills` both showed as `[agent-skills]`.
- **2 entry shapes**: hand-written entries with labels and notes, and the one line
  `util github bookmark` wrote.
- **85 entry lines carried a hand-written label**, some 2: `[Library]` 25, `[Skill]` 19, `[MCP]` 13,
  `[CLI]` 11, `[Plugin]` 9, `[Collection]` 8, `[Reference]` 5, `[Index]` 3, `[Template]` 2, `[App]` 2,
  `[Tooling]` 1, `[Framework]` 1. Each became a `type:`.
- **22 entries had no GitHub link**, such as code-review, Context7, Stripe MCP and Handy.
- **Handy was the only desktop app.** openvid is a web app, and `apps.md` held only its bare link.
- **`research.md` held 2 entries on 1 line.**
- **`starred.min.json`**: 360 starred repos, used by nothing. 225 carry topics, 59 have no description.
- **`bin/add-repo`** was the script ported to `util github bookmark` on 2026-08-30.

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
- **The general text of the old group files is dropped**, "Considered and skipped" included. Only text
  about one tool survives, in its notes.
- **A `type:` field in every tool file**, approved 2026-09-13.
- **A field naming what sort of thing a record is is `type`.** Never `kind`. Carried into the repo
  `CLAUDE.md` as `type-never-kind`, and applied to `lab/util` in this build.
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
- **A file per "Considered and skipped" entry, with the reason in its notes.** The reason came from one
  research pass, not from use.
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
