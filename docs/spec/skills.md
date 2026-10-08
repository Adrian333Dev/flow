# Skills

How Flow's skills are shaped, installed and switched on, and how outside skills join them. A skill is a folder holding a `SKILL.md` that Claude Code loads when the user types its name or the agent judges it fits. Flow ships 13, typed `/flow:<name>`. 4 of them are the phases, the 4 kinds of work. The rest are the tools around the work.

## Scope

- **In**: Flow's 13 skills and what each does, the 4 phases, `/flow:handoff`, how skills install and switch on, outside skills and their sources, overlays, arguments, and the `domain-skills` repository.
- **Out**: ticket skills, in `docs/spec/tickets.md`. `/flow:research`, the wiki and how `/flow:file-findings` routes a finding, in `docs/spec/knowledge-base.md`. `/flow:visualize`, in `docs/spec/drawing.md`. The checks `/flow:file-findings` writes, in `docs/spec/rules.md`.

## Where a skill lives

```text
~/.flow/repos/flow/skills/                 Flow's skills, the one real copy
├─ phases/    groundwork, execute, prototype, debug
├─ tools/     start, help, handoff, file-findings, research,
│             tickets-from-spec, visualize
├─ dev/       review, apply-domain-findings      start off
└─ drafts/    never installed
~/.agents/skills/flow/                     the plugin folder
├─ .claude-plugin/plugin.json              copied, names the set "flow"
└─ skills/<name> → the clone               one link per skill switched on
~/.claude/skills/flow → ~/.agents/skills/flow    loaded as flow@skills-dir

~/.flow/repos/sources/<owner>_<repo>/      outside skill repositories
~/.flow/private-skills/<name>/             the user's own skills
<project>/.claude/skills/<name> → either   on in this project
~/.claude/skills/<name> → either           on everywhere, --global
<project>/.flow/overlays/<name>.md         this project's additions to a skill
```

## Behaviors

### Flow's skills

- `V1` **13 skills in 4 groups**: `phases/` (`groundwork`, `execute`, `prototype`, `debug`), `tools/` (`start`, `help`, `handoff`, `file-findings`, `research`, `tickets-from-spec`, `visualize`), `dev/` (`review`, `apply-domain-findings`) and `drafts/`, empty today.
- `V1` **Every skill is typed `/flow:<name>`, and no folder or `name` carries the prefix.** `skills/.claude-plugin/plugin.json` names the set `flow`, and Claude Code adds the prefix as the skill loads. Decided 2026-09-18: bare, `setup`, `help` and `migrate` claimed ground on a machine with other skills.
- `V1` **The 11 outside `dev/` are always on**: `flow skills` leaves them out of its list and refuses to switch one. The 2 in `dev/` start off, and `flow skills on <name> --global` links one. `drafts/` never installs.
- `V1` **4 skills only the user can start**: `/flow:start`, `/flow:tickets-from-spec`, `/flow:file-findings` and `/flow:apply-domain-findings`, each `disable-model-invocation: true`. `home/CLAUDE.md` → `user-only-skills` names them, so the agent suggests them.
- `V1` **A description says what the skill is and what it covers**, never its steps and never when to fire it. Claude Code loads every description at session start and fires a skill from it alone. A description summing up the steps gets followed in place of the file.
- `V1` **A shell line in a skill runs one named command**, never logic written inline: `` !`flow get exp-47 --files 2>&1 || true` ``.
- `V1` **A skill splits into files only where a part is read on some runs and not others.** `references/` holds those parts, `scripts/` what the skill runs.
- `V1` **An edit to a skill is live at once**, in every project and in sessions already open, since every link points into the clone. Adding, renaming or removing one needs `flow install`.
- `V1` **`/flow:execute`, `/flow:debug` and their review stay as they are**, agreed by the user 2026-10-02. Newer models may run many of the checks unasked, but nobody knows which, and Flow is meant for weaker models too. A check goes once beta sessions show it adds nothing.
- `later` **Each skill audited against what the work touched**, scoped to the files changed, or the reads have no end.
- `later` **When a repeating pattern becomes a new skill, and who writes it.**

### The 4 phases

Closed at 4, set by the user.

- `V1` **`/flow:groundwork` finds every decision the work needs**, the ones nobody raised included, and writes each answer down. 4 steps: map the open decisions in the ticket's `groundwork/map.md`, walk them one at a time with the user, attack the result with real cases, then send each decision to the file that owns it, the spec through `references/write-spec.md`. No plan and no code.
- `V1` **`/flow:execute` builds one ticket**: a plan the user approves, the build, a review in the same session by `references/review-code.md`, and the user's word for `done`. The plan and the finished work are the only 2 stops. A step that repeats across many files goes to `haiku-worker`.
- `V1` **`/flow:debug` finds a cause by evidence**: a check that fails on this exact bug every run, 3 hypotheses of 3 different kinds shown before any is tested, a written prediction before each run, and a fix proved by the same check. It writes `reports/<failure>.md`, opening `FIXED`, `FOUND_NOT_FIXED` or `UNPROVEN`.
- `V1` **`/flow:prototype` writes naive code answering one question**, kept in `protos/<name>/` in its ticket beside a report of what it found, never promoted into the real build.
- `V1` **A prototype runs in its own session, on a child ticket**, agreed by the user 2026-10-02. Its installs, errors and reruns would fill a long groundwork session, and Flow refuses `/compact`. Revisit if most beta prototypes turn out to be 10-line probes.
- `later` **Checking the running app before review**: `/flow:execute` proves a UI change by driving the page. Parked by the user 2026-10-01, until the first real project with a UI.
- `later` **Whether a child map may write an open decision into its parent's `map.md`.** Built as `/flow:groundwork`'s rule for a decision binding more than one child, and unproven: no product has been split into child maps.
- `later` **Ideas, not only shaping**: `game-changing-features` and `adhd` read for `/flow:groundwork`'s half that produces ideas.
- `later` **`/grill`**, user only, fired at a finished artifact. Decided, not designed.

### The tools

- `V1` **`/flow:start` opens a session**: the board from `flow next`, or one ticket, picking its phase from its type and status.
- `V1` **`/flow:help` answers any question about Flow or Claude Code, and fixes a problem with either**, from the docs, `flow doctor`, the failure log and the clone's code. Built 2026-10-05. The agent may start it.
- `V1` **`/flow:tickets-from-spec` cuts the next release's behaviors out of `docs/spec/` into tickets**, earliest release first.
- `V1` **`/flow:file-findings` files a session's findings into skills, rules and checks**, user only, through `references/write-skills.md` and `references/write-checks.md`.
- `V1` **`/flow:review`, a dev skill, reviews how Flow performed**: where a rule failed, where friction repeated, where the design has a gap. It records study cases or workflow notes, and reads `flow audit`.
- `V1` **`/flow:apply-domain-findings`, a dev skill, reads the findings sent to one domain skill** and writes the true ones into it.

### `/flow:handoff`

- `V1` **A handoff writes the state a session that was not here needs.** One test decides each line: would that session get it wrong without it? It runs the capture sweep first.
- `V1` **Working a ticket, the state is `## State` at the bottom of `ticket.md`**, under 4 labels. `Now`: half-done or in flight. `Found`: what cost effort to learn and lives in no file. `Open`: decisions half-made. `Touched`: files changed that no plan step names. `Now` and `Touched` are rewritten whole, `Found` and `Open` added to.
- `V1` **`## State` never restates `plan.md`, `map.md`, the ticket body or a research report.**
- `V1` **The `open` block names the files the first action opens**, with a line range where known, and `flow get --files` loads them before the next session's first turn. Kept by the user 2026-10-02.
- `V1` **Work with no ticket gets one**, and a job handed to another session gets a child ticket whose body carries everything, written once.
- `V1` **`flow handoff <id>` adds the session to `history.md`**, and the reply ends on what to type: `/clear`, then `/flow:execute /exp-47`.
- `V1` **At `review`, `Found` empties into `issues.md`** and the section goes.
- `later` **A resumed session told the old transcript is there**: a detail the handoff lacks → the last session in `history.md`, opened with `flow audit`.

### Arguments

- `V1` **A skill invoked over and over stays short and takes no argument.** The 4 phases and `/flow:handoff` take none, since a ticket arrives through its own skill. A long skill takes one only where it names what the skill opens.
  - Why: an argument changes the skill's text, so Claude Code loads a body already in context a second time. And whoever supplies an argument is at the keyboard, where a skill the agent starts reads the conversation instead.
- `V1` **No `argument-hint` and no ticket id in a Flow skill's description.** Both invite the argument the rule bars.
- `V1` **The rule binds Flow's own skills**, never an outside one.
- `never` **A hook stripping an argument nobody asked for**, rejected by the user 2026-08-26: new machinery against a cost of one duplicate skill body.

### Installing and switching

- `V1` **`flow install` builds one plugin folder, `~/.agents/skills/flow/`**: one link per skill into the clone, and the manifest copied, since Codex ignores a linked one. `~/.claude/skills/flow` links to it, the one folder Flow links whole.
- `V1` **A skill is on while its link exists.** `flow skills on`, `off` and `reset` write a line `"skills": { "react": "on" }` at one of 2 levels: the project's `.flow/settings.json`, or `~/.flow/settings.json` with `--global`. The project wins name by name. Every command and every session start makes the links match.
- `V1` **`flow skills add <owner/repo>` clones a source into `~/.flow/repos/sources/` and switches nothing on. `flow skills drop <owner/repo>` removes it.** Every clone, pull and switch adds a line to the history log.
- `V1` **Every source pulls itself at session start, at most every 6 hours**, refused where the clone holds changes or the pull is not a fast-forward. `"skillsAutoUpdate": false` turns the pull into a note naming what waits.
- `V1` **A Flow skill has no switch per project.** `skillOverrides` does not reach a plugin's skills.
- `V1` **A dev session loads the dev copy's skills**: `claude --plugin-dir ~/code/flow-dev/skills`, in `docs/spec/product.md` → `### Working on Flow itself`.
- `later` **A skill update's new commands, hosts and paths listed before it lands.** Each skill links into its clone, so an update gaining `curl … | bash` reaches every project the next session. SkilLock lists what a change adds.
- `later` **`paths:` on a domain skill**, so it loads only beside matching files. Parked until a project uses 5 or more domain skills.

### Outside skills

- `V1` **An outside skill is used whole or harvested, never anything between**, decided with the user 2026-09-27. Used whole: runs as published and updates itself. Harvested: never switched on, read into the user's own skill. `~/.flow/references/knowledge.md` holds the rules.
- `V1` **Harvest is the default.** No one skill covers what matters, each holds lines the user disagrees with, and every switched-on description loads each turn.
- `V1` **A maker's own skill is used whole**, since a copy misses each release. What would overturn it: a maker's skill whose description or process breaks Flow's rules.
- `V1` **A skill carrying process is weighed before knowledge.** A plugin with its own build order competes with `/flow:execute`, and nothing decides between them.
- `V1` **A harvested skill never follows its inputs**, ruled by the user 2026-09-28. The harvest drops each input's clone and records its commit. The next harvest starts from fresh research.
- `V1` **A harvest owes no license**: facts belong to nobody. A passage copied word for word keeps its notice.
- `V1` **Everything starts on for one project.** A service is reached through its command-line tool first, a script in its skill second, a project's MCP server last: a command's output is cut in the shell, and an MCP tool's never is.
- `never` **Several general skills on at once**: they fire on the same files, and the agent follows whichever it read last.
- `never` **A companion skill beside an untouched outside one**, dropped 2026-09-28: findings wait in the wiki and go straight into the user's own skill.

### Overlays

- `V1` **A project extends any skill with `.flow/overlays/<name>.md`**, the name without its plugin's prefix. `overlays.js` hands it to the agent under `# Overlay` each time the skill loads, typed or started by the agent, in a subagent too. Flow's skills and outside ones get the same mechanism, the user's call 2026-09-28.
- `later` **An overlay for a skill a subagent preloads through `skills:`**, from a `SubagentStart` hook. Flow ships no such subagent. Approved 2026-09-28.
- `later` **An overlay reaching a skill's `references/` pages.** The hook fires once, when `SKILL.md` loads.

### `domain-skills`

- `V1` **A skill about one field or tool lives in the public `domain-skills` repository**, never in Flow, and is switched on in the project that uses it. It holds 2 drafts and no finished skill.
- `V1` **`flow contribute` and `/flow:apply-domain-findings` stay**, ruled by the user 2026-10-01, both off: the one sharing command after V1 is built from them.
- `later` **CI on the repository's pull requests**: frontmatter, links, the index, no secrets, a body near 150 lines. Waits for the first contributor besides the user.
- `later` **`/flow:write-skill`, the harvest as a skill**, user only, built after a first run by hand: `docs/spec/knowledge-base.md`.
- `later` **One domain skill covering a tool at several versions.** The user has a mechanism in mind. A `package.json` lookup was rejected.
- `later` **`/web-pages` rebuilt on `browser-harness`**, from 1,059 lines to about 150: the capture scripts go, the investigation method stays. Waits for the move off WSL.
- `later` **Chrome extensions as a skill**, from 3 guides in `drafts/chrome-extension/`, at the next extension project.

## The parts

- **`skills/`**: Flow's skills, and `skills/.claude-plugin/plugin.json`.
- **`scripts/lib/skills/skills.js`**: which skills are essential. **`skill-links.js`**: makes the links match the settings.
- **`scripts/commands/skills.js`**: `flow skills`.
- **`scripts/jobs/skills-pull.js`**, **`scripts/lib/skills/skills-update.js`**: the pull at session start.
- **`scripts/hooks/overlays.js`**: the overlays.
- **`references/knowledge.md`**: used whole or harvested, and the order for reaching a service.
- **`docs/dev/skills.md`** and **`skills/tools/file-findings/references/write-skills.md`**: how a skill is written, the same rules in both.

## What passes between them

A project's settings switching 2 skills:

```json
{ "skills": { "react": "on", "nestjs": "off" } }
```

An overlay, `.flow/overlays/execute.md`, reaching the agent as `/flow:execute` loads:

```markdown
# Overlay

Run `pnpm test:unit`, never `pnpm test`: the full suite needs the staging database.
```

## One real case: a project takes on a skill

1. `/flow:research` finds 3 NestJS skills and reads them. One is the makers' own.
2. The user agrees to use the makers' skill whole. `flow skills add nestjs/skills` clones it, and `flow skills on nestjs` links it into the project's `.claude/skills/`.
3. The next session lists it. Its description loads, and the agent starts it on a NestJS file.
4. The project writes `.flow/overlays/nestjs.md`. Every load hands it over.
5. The makers push a change. The next session start pulls it, and every project with the link reads the new version.

## How it fails

- **A source holds local changes, or its pull is not a fast-forward** → nothing is pulled, and the next session prints why.
- **2 sources hold a skill of one name** → `flow skills on` refuses and asks for `owner/repo:name`.
- **`flow skills off` in a project on a skill on everywhere** → refused, naming `--global`.
- **A link someone replaced with a real folder** → `flow install` refuses to overwrite it.
- **An overlay is missing, or the hook fails** → the skill loads with nothing added.
- **A line in settings names an essential Flow skill** → `flow doctor` reports it.

## How you know it worked

- **Claude Code loads `flow@skills-dir` and names its skills `flow:<name>`**: proven 2026-09-18 in a scratch install.
- **`npm test` covers the links, the 2 levels, the pull and its refusals, and the overlays.**
- **`overlays.js` in a live session.** Not yet: its test feeds it the calls the docs describe.
- **The beta runs each phase on real work**, `fw-2` to `fw-14`.

## What is locked

- **The prefix comes from the manifest**, since Codex reads the same file: one manifest gives `/flow:groundwork` in Claude Code and `$flow:groundwork` in Codex.
  - Refused: the prefix in the folder name, `flow-groundwork/`, tried 2026-09-17 and reverted. The user objected to renamed folders in any form.
- **One copy of every skill per machine, reached through links.** An edit holds on every branch and in every project at once.
- **One overlay mechanism for every skill.**
  - Refused: a shell line `` !`flow overlays <name>` `` ending each Flow skill. It reached only a skill carrying it. `git log -S "flow overlays"` finds the code.
- **Harvest over using whole, for anything but a maker's own skill.**
