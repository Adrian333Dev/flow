# Skills: arguments, plugins, the shared repository, and the toolbox

Four records merged on 2026-09-16, all about where knowledge lives outside a rule file. `docs/dev/skills.md` says how Flow files and writes a skill, and [What Claude Code does](../../docs/dev/claude-code.md) holds every tested fact about what the platform does with one. Neither is restated here: this record holds only the arguments still open.

`backlog.md` → `### The skill system` and `### Individual skills` carry the open items.

## Arguments and plugins

Designed 2026-08-26 and built 2026-08-28: group folders, overlays, descriptions that carry no trigger. Most of that design has since been replaced, and git holds it. What survives is the argument rule and the plugin switch.

### Arguments

**A long skill takes an argument only where the argument names what it opens.** `short-skill-no-arguments` in the repo `CLAUDE.md` carries the rule. Set 2026-09-16, when the 4 phase skills gained a ticket id: `/flow:execute t047` loads the ticket and its files in the skill's first line, and a bare `/flow:execute` prints nothing there, so its text stays identical to every earlier bare run. The user accepted the one cost: a phase opened bare and then with an id in one session holds its body twice, which the id appended by Claude Code already caused before the change. A split into a 10-line typed skill opening a hidden method skill was rejected the same day as overhead that rebuilt `/flow:start` 4 times. The skill's first line runs `flow get` only when the first word typed is shaped like an id, and `$ARGUMENTS` on its own line keeps any text typed after the name. `scripts/check-ticket.js`, a `UserPromptExpansion` hook, blocks the skill before it loads when the id matches nothing, since a misspelt id is the common miss. Shaped like an id means `t` then a digit, in the hook and in the skill alike, so the folder name `t047-parser-split` is checked too.

- **An argument breaks the duplicate check.** Claude Code skips a skill body already loaded when the rendered text matches. An argument changes the text, so the whole body loads a second time.
- **Whoever supplies an argument is at the keyboard.** A typed skill can take one. A skill the model invokes reads context instead.

**The rule binds Flow's own skills.** An external skill is not Flow's to hold to it: impeccable takes a sub-command as an argument by design.

**The rule does not enforce itself.** Claude Code appends `ARGUMENTS: t099` even to a skill with no placeholder, and the model volunteers an argument nothing asked for. A `PreToolUse` hook could strip it, since that event accepts `updatedInput`. The user rejected that hook 2026-08-26: new machinery against a rare cost. The cost is 1 duplicate skill body, accepted.

- **No `argument-hint` on a Flow skill outside the 4 phase skills**, and no ticket id in a description. Both invite what the rule bans.

### External skills and plugins

**Superseded in part, 2026-09-14**: an external skill for one project installs with its own installer and becomes the project's copy, and a second project needing a change moves it into `domain-skills`. Only the plugin half below is still open.

#### A plugin brings more than a skill

impeccable ships 1 skill, 4 subagents, 23 commands and 2 hooks. Enabling it adds a small system.

**Prefer external material that carries knowledge. Weigh anything carrying process.** Flow is a process workflow, so a plugin with its own build order competes with `/flow:execute` and nothing arbitrates. Of the 3 surveyed, `ui-ux-pro-max` is mostly knowledge: a searchable database of styles, palettes and font pairings. `impeccable` is mostly process. `taste-skill` sits between.

#### Off by default, enabled per project

**The decision: a plugin is off everywhere, and turned on for one project by the person working it.** The 2 settings that do it, and why `skillOverrides` is not an off switch, are in [What Claude Code does](../../docs/dev/claude-code.md#a-plugin-is-a-bundle-not-a-skill).

The reasoning that picked that shape:

- **Recording the permission and flipping the switch are different acts.** Committing `extraKnownMarketplaces` says this project may use the plugin, which is a decision worth a diff. Enabling it is a preference, so it goes in a gitignored file and nobody else is forced into the state.
- **There is no middle setting for a plugin.** `skillOverrides` looked like one, and it is not: Claude Code's settings page rules it out for plugin skills outright, so `user-invocable-only` on `impeccable:review` does nothing. A plugin is on or off, and its hooks run for as long as it is on.

### Flow is a plugin too, and that is where the `flow:` prefix comes from

**Decided 2026-09-18, built the same day.** Every Flow skill is typed `/flow:groundwork`, and the prefix is not written anywhere in the clone.

The problem it solves is 3 skills the management build adds: `setup`, `help` and `migrate`. Bare, those words claim ground no workflow should claim on a machine that has other skills on it. The user rejected the 2 obvious fixes: a prefix in the folder name, `flow:groundwork/` or `flow-groundwork/`, which was tried on 2026-09-17 and reverted, because the objection was the renamed folders themselves in any form.

**What a plugin is, here: a folder holding one extra file.** `.claude-plugin/plugin.json` names it, and every skill below that file is offered as `<plugin name>:<skill name>`. No marketplace, nothing installed. `flow install` links the 12 skills into `~/.claude/skills/flow/skills/` and copies the manifest to `~/.claude/skills/flow/.claude-plugin/plugin.json`. The clone keeps bare folders and bare frontmatter names.

**Codex reads the same file**, which is what decided it over every alternative. `repos/codex/codex-rs/exec-server-protocol/src/protocol.rs` lists 3 manifests it accepts and Claude Code's is the second, and `ext/skills/src/loader/namespace.rs` builds the name with `format!("{namespace}:{base_name}")`. So one manifest gives `/flow:groundwork` in Claude Code and `$flow:groundwork` in Codex. `lab/context/models.md` holds the Codex findings, with the file behind each one.

Two constraints the source set, both now honored by `flow install`: the manifest is copied rather than linked, because `utils/plugins/src/plugin_namespace.rs` calls `symlink_metadata` and ignores a link; and the skills themselves may be links, because `ext/skills/src/loader/host.rs` follows directory symlinks at user scope.

**What it cost:** `skillOverrides` no longer reaches any Flow skill, so there is no per-skill off switch, only `claude plugin disable flow@skills-dir`. Flow shipped the key empty and never used a value, so nothing broke. Domain skills and private skills land in `.claude/skills/` as plain skills and answer to the key as before.

**Proven live on 2026-09-18.** A scratch session built by `lab/scripts/try.sh` reported `flow@skills-dir` loaded, and asked to name its skills it answered `flow:groundwork`, `flow:handoff`, `flow:visualize`.

## The `domain-skills` repository: what is left to build

The `domain-skills` repository and its pipeline were agreed with the user by 2026-09-13 and built by 2026-09-15: the repository at `lab/domain-skills/`, `flow domain-skills`, `flow private-skills`, `/flow:research`'s local searches, one file per finding, `/flow:fold` and `flow contribute`. `lab/domain-skills/CONTRIBUTING.md` and `docs/dev/skills.md` describe what was built, and git holds the design conversation. Cut on 2026-09-15 to the 3 parts not built.

A **domain skill** holds knowledge about a subject: a framework, a library, a service, or a field such as abuse prevention. A **finding** is one fact learned mid-work, saved as a file in the project and sent to the repository as a pull request that is never merged. **`/flow:fold`** is the maintainer's skill that reads those pull requests and rewrites the skill.

### CI on the repository

Waits for the first contributor other than the user. `lab/domain-skills/backlog.md` carries it.

**CI checks form** on every pull request:

- frontmatter present
- every relative link resolves inside the pull request
- every page is in the skill's index, and every index entry exists
- no secrets
- the body within its budget, about 150 lines

A finding is never merged, so CI only reports on it. A page or a whole skill is merged after the user reads it, because it loads on other machines. CI's secret scan comes after the filing question, which stays the last human check before a finding goes public.

### `/distill`: its own skill, typed-only, and waits for its first real run

The user names a subject and points at sources: ticket ids, folders, another project, months apart. The skill reads them whole, separates what is true for anyone from what belongs to one project, picks the shape, shows the plan and stops.

- **No skill on the subject** → a new skill under `~/.flow/private-skills/<name>/`, published later by copying it into `domain-skills`.
- **An existing domain skill** → new pages in that skill, sent like any contribution.

Several pipelines under one subject are several pages.

**Separate from `/flow:file-findings`**, because typed-only is a frontmatter line set per skill. The model may offer `/flow:file-findings` once the inbox passes 200 lines, and must never start hours of distilling on its own. Named nowhere in `~/.claude/CLAUDE.md`, since a rare typed command is learned from the README.

**Written after the first distill done by hand** with `write-skills.md`, on the abuse-prevention case, so the skill comes from a real run.

### Branches

**The workflow supports one branch at a time to start with.** Ruled by the user 2026-09-13. The walk below is recorded so the multi-branch work starts from it. `backlog.md` → `### Subagents and dispatch` carries the item.

Project files fall into 2 kinds when the branch changes:

- **Committed, so they change with the branch**: everything in `.flow/`, plus `docs/context/`, `CLAUDE.md` and `.claude/rules/`.
- **Ignored, so they stay put across a switch and are missing from a new worktree**: the symlinks in `.claude/skills/`, and `.flow/settings.json`.

Every skill reached through a symlink lives outside the project, so an edit to it holds on every branch the moment it is written. That is the branch independence the user wants for skills. A skill committed as a real folder in the project, and an overlay, change with the branch.

1. **One branch per task, merged each time.** Works. Findings merge with the work that taught them.
2. **A branch abandoned.** Its committed findings go with it. File before deleting a branch.
3. **An uncommitted finding when switching.** Git leaves new uncommitted files in place, so the finding follows to the new branch and is committed there. Wrong branch, never lost.
4. **2 branches in parallel.** Findings never collide, since each is a new file. 3 other files do:
   - `.flow/inbox.md` is appended on both, so the merge conflicts.
   - `.flow/handoff.md` is rewritten whole on both, so the merge conflicts.
   - `flow new` numbers a ticket as the highest id plus 1, `nextId` in `scripts/flow/lib/store.js`, so both branches create the same id.
5. **2 worktrees.** Everything in case 4, plus the ignored symlinks are missing in the new folder, so `flow domain-skills add` with no name relinks everything `.flow/domain-skills.txt` lists.

The user's ideas for the multi-branch work, 2026-09-13, none decided:

- **Record the branch on a ticket**, when it is created or picked up.
- **Record the sessions that worked a ticket**, by session id, with some metadata. Doubted by the user in the same message: work on one branch can move between machines, and a session id belongs to one machine.

## Browser tooling: `/web-pages` and `browser-harness`

**Status: deferred to after Flow's V1.** Decided 2026-08-12, when the skill was still called `debug-web-pages`. It has since moved to the `domain-skills` repository unchanged, and waits there for the rebuild. This section holds the reasoning until that happens.

### The two things

**`debug-web-pages`**: Flow's own skill, `skills/debug-web-pages/`, 1,299 lines across 12 files. It reverse-engineers a live web page you do not control: how it works, what handles a key press, whether you can intercept it.

**`browser-harness`**: a third-party tool from the browser-use team, 16.5k stars, catalogued in `toolbox/browser.md` and cloned at `repos/browser-harness/`. It connects an agent straight to a running Chrome over CDP. The agent clicks, types, navigates and reads the page itself. Roughly 1k lines of core, plus 18 mechanics files and a self-growing store of site-specific knowledge.

### Why this came up

`browser-harness` is not a bigger version of `debug-web-pages`. It removes the constraint `debug-web-pages` was built around.

That skill says so in its own words: *"I can't drive the browser, so both modes are a collaborative loop, I write, you run, you paste back, I read."* Everything in it follows from that. You paste `capture.js` into the DevTools console, download `capture.json`, run `unpack.js` to get a queryable bundle. Every live experiment is a round trip through the user: agent writes a probe, user runs it, user pastes logs back.

With `browser-harness` installed, the agent has a browser. The round trip is gone.

### The verdict: split the skill, keep the method

`debug-web-pages` holds three separate things and they have three different fates.

- **The transport: `scripts/capture.js` (301 lines) and `scripts/unpack.js` (190 lines).** Dead. Everything `capture.js` pulls out through the DevTools console, event listeners, shadow DOM, runtime state, `browser-harness` reaches through raw CDP, which it exposes directly as `cdp("Domain.method", ...)`.
- **The context discipline**: *"bundle files are multi-MB. Query them, never read them whole into context."* Keep. It matters more with a live browser, not less, because CDP output is unbounded. `browser-harness` says the same thing in one clause: *"filter in Python before printing (it is thousands of nodes)."*
- **The investigation method**: `understand → hypothesize → probe → intervene → verify → record`, plus the probe craft: gate early and narrowly, log the state that proves the outcome, one variable per probe, reload between attempts. **Keep all of it.** `browser-harness` has no equivalent. That repo is a mechanics manual: how to click, how to handle an iframe, how to connect. It carries no method for working out how a page works.

So `debug-web-pages` drops from 1,299 lines to roughly 150 and becomes a method skill standing on `browser-harness` as the mechanism. That is Flow's own disjointness rule: the general skill owns the method, the tool owns the specifics.

### The overlap to resolve at the same time

Both accumulate site knowledge. `debug-web-pages` writes `knowledge/domains/<page>.md` by hand at the end of an investigation. `browser-harness` writes `agent-workspace/domain-skills/<host>/`, surfaced automatically on navigation and gated behind `BH_DOMAIN_SKILLS=1`.

Theirs is better engineered. Two stores of the same facts drift, so `knowledge/domains/` folds into theirs. Only one file exists today, `youtube-watch.md`, so the migration is small.

### Why it waits

**The platform blocks it** (stated 2026-08-16). Flow runs on Windows under WSL, and driving a browser from there (Playwright, or Chrome over CDP) hits more problems than it is worth fighting. The user moves to Linux in **two to three weeks**, and expects to be on it before this work starts. Nothing here is scheduled before that move.

`browser-harness` also needs Python 3.12, `uv`, and a Chrome launched with remote debugging plus a permission click the user makes by hand. Flow installs nothing until the workflow is finished, and that rule is not being bent for this.

Until it is installed, `capture.js` is the only thing that works. **Nothing gets deleted before the install.** Deleting the transport first would leave a skill that cannot do anything.

### When it is time

1. Install `browser-harness` and register its skill.
2. Rewrite `skills/debug-web-pages/SKILL.md` around the loop and the probe craft, pointing at `browser-harness` as the driver.
3. Delete `scripts/capture.js`, `scripts/unpack.js`, and `knowledge/capturing-and-querying.md`: the whole capture-bundle mode.
4. Move `knowledge/domains/youtube-watch.md` into the harness's domain-skills store.
5. Re-check `DESIGN.md`, `ROADMAP.md` and `MAINTAINING.md`: 490 lines describing an architecture that will no longer exist.
6. Decide whether the skill keeps its name. It stops being about pages you cannot drive.

## The toolbox: why it stayed, and the library for later

The toolbox is a catalog of outside tools an agent or a project can use, one file per tool, at `lab/toolbox/`. It was rewritten on 2026-09-13, and `bin/tool.js` for adding tools was built on 2026-09-14. `lab/toolbox/README.md` describes both, and git holds the design conversation. Cut on 2026-09-15 to the 2 parts no other file carries.

### skills.sh, 2026-09-14

**The toolbox stays. skills.sh replaced it for finding skills only.** skills.sh is Vercel's index of every public repository holding a `SKILL.md`. The user found it and asked whether the toolbox should go. `/flow:research` now searches both at once.

**What skills.sh holds of the toolbox**, measured by searching it for each of the 154 GitHub repositories:

- 97 have at least one skill there, all 28 typed `skill` among them.
- 57 have none. Most are libraries (drizzle-orm, graphiti), MCP servers (sentry-mcp, playwright-mcp), references (OWASP/CheatSheetSeries) and apps (letta).
- A search result holds a skill name, its repository and an install count. No description, no stars, nothing saying which of 2 tools to take.

**The notes decide it.** For a browser tool for a coding agent, skills.sh returns agent-browser (843k installs), browser-act (108k), browser-use (95k) and anti-detect-browser (84k). The toolbox's `microsoft_playwright-cli.md` says "Use when: browser work inside a coding session. The default", and when to take `microsoft_playwright-mcp.md` instead.

**What would overturn it:** real `/flow:research` runs where the toolbox never adds anything skills.sh and the web did not. All 88 notes so far say "from research" and none "from use", so the case is not yet made.

**Install counts rank last.** The CLI reports them anonymously and nothing verifies them: `prime-skills/runcomfy-agent-skills` → `lipsync` showed 356,974, above Supabase's own `supabase` skill at 272,347.

### The library, for later

**The user's idea**: a catalog of software tools that grows by itself. Collectors pull from APIs and scrapers from pages, on a schedule: GitHub trending, the stars and pinned repositories of people behind a found repository, the descriptions of YouTube channels the user registers, and blogs those videos link. Agents reach it fast, maybe through MCP, and contribute entries. A web UI edits entries the way Wikipedia does, with moderation once others join. Metadata refreshes monthly. A rating system compares tools that fit different situations, such as superpowers and Flow. Search has to work for someone who does not know what exists. Free tools first, then anything software-related, at millions of items with little AI cost.

**Ruled by the user**: the library is a different product, designed later through Flow's own groundwork. Its data never lives in a file on one machine, because the user works from 2 machines and the workflow's first users need it too.

**Recommended in the conversation, none of it agreed:**

- **The value is notes from real use.** Collecting is already done elsewhere.
- **Rank by how many independent sources saw a tool**, which costs nothing.
- **Rate against a situation**, never one score.
- **Search in layers**: words over name, description, topics and the full README; the searching agent rewording the need; search by meaning once a test set of needs starts failing; `key:value` filters like GitHub's.
- **A name**: the user liked Harvester plus a word, and Tech Radar. `techharvest` was offered.

**Rejected for it**: a 2-day first version with harvesters, SQLite and no UI, since nothing could be browsed. A SQLite file on one machine. A public repository of JSON files harvested by GitHub Actions, with generated browse pages.

**Facts found, 2026-09-13:**

- **GitHub has no trending API.** OSS Insight serves `api.ossinsight.io/v1/trends/repos/?period=past_24_hours` with no key, 600 requests an hour per IP.
- **GitHub search**: 30 requests a minute authenticated, up to 1,000 results per query.
- **GitHub Actions**: `GITHUB_TOKEN` allows 1,000 requests an hour per repository, a personal token 5,000. A schedule runs at most every 5 minutes, and stops after 60 days without activity in a public repository.
- **GitHub file limits**: a warning at 50 MiB, a block at 100 MiB. Repositories ideally under 1 GB, strongly under 5 GB. "Git is not designed to handle large SQL files."
- **YouTube Data API**: `playlistItems.list` costs 1 unit for up to 50 videos, out of 10,000 units a day.
- **ecosyste.ms**: 293 million repositories and 14.4 million packages, free, data under CC BY-SA 4.0. A repository record adds no README text. A package record carries usage: npm's `zod` shows 1.08 billion downloads and 122,785 dependent repositories.
- **Similar products**: GithubStarsManager (MIT, 3.5k stars, AI categories, search by meaning and an MCP server over your own stars, data kept local), OSS Insight, Trendshift, the GitHub MCP Registry, AlternativeTo, LibHunt. None combines chosen sources, notes from use and agent search.
- **Names taken**: theHarvester (17.4k stars) and SUSE's Harvester (5.2k). Tech Radar is a ThoughtWorks publication and a Backstage plugin.

**The search test**: SQLite full-text search over 435 repositories, the 360 the user starred plus 75 found only in the toolbox, with needs written by someone who does not know the tool.

- **Name, description and topics only**: requiring every word found nothing for 6 of 9 needs. Accepting any word ranked the tool 4th to 65th.
- **With the README**: 1st to 4th for 6 of 9. "My coding agent forgets everything between sessions" put TencentDB-Agent-Memory 4th.
- **The 2 misses, reworded by an agent**: "browser automation agent" put browser-harness 1st, "claude code skills methodology" put superpowers 2nd.
- **READMEs cut to 3,000 characters**: TencentDB fell from 4th to 72nd, since its opening is badges and install steps.
