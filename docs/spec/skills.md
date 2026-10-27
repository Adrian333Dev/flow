# Skills

How Flow's skills are shaped and installed, and how outside skills join them. A skill is a folder holding a `SKILL.md` that Claude Code loads when the user types its name or the agent judges it fits. Flow ships 12, typed `/flow:<name>`. 3 of them are the phases, the 3 kinds of work.

## Scope

- **In**: Flow's 12 skills and what each does, the 3 phases, `/flow:handoff`, how skills install, outside skills and how they are used, overlays and arguments.
- **Out**: the `#` ticket list and the ticket header, in `docs/spec/tickets.md`. `/flow:research`, the wiki and how `/flow:upkeep` routes a finding, in `docs/spec/knowledge-base.md`. `/flow:visualize`, in `docs/spec/drawing.md`. The checks `/flow:upkeep` writes, in `docs/spec/rules.md`.

## Where a skill lives

```text
~/.flow/repos/flow/skills/                 Flow's skills, the one real copy
├─ work/        groundwork, write-spec, tickets-from-spec,
│               execute, review-code, debug
├─ techniques/  visualize
├─ knowledge/   research, audit, upkeep
└─ session/     start, handoff
~/.agents/skills/flow/                     the plugin folder
├─ .claude-plugin/plugin.json              copied, names the set "flow"
└─ skills/<name> → the clone               one link per skill
~/.claude/skills/flow → ~/.agents/skills/flow    loaded as flow@skills-dir

~/.claude/skills/<name>                    a skill of the user's own, or a link to one cloned by hand: on everywhere
<project>/.claude/skills/<name>            the same, on in this project alone
~/.flow/skill-overlays/<name>.md         the user's additions to a skill, every project
```

## Behaviors

### Flow's skills

- `V1` **12 skills in 4 groups, by what a skill does** (`fw-233` 0.4.0, 2026-10-27): `work/`, the steps that move a ticket (`groundwork`, `write-spec`, `tickets-from-spec`, `execute`, `review-code`, `debug`); `techniques/`, a way of thinking used in any step (`visualize`); `knowledge/`, what Flow knows, gathered and kept (`research`, `audit`, `upkeep`); `session/`, starting and handing over a session (`start`, `handoff`). The group only files a skill: it is typed `/flow:<name>` either way. Why: a new skill's group is plain before it is written. Refused: `phases/` and `tools/`, where `tools/` held 9 unrelated skills and a skill is no tool in Claude Code's sense. Refused: groups by job (`design/`, `build/`), which `visualize` fits badly. Refused: one flat folder, since many skills are coming.
- `V1` **Every skill is typed `/flow:<name>`, and no folder or `name` carries the prefix.** `skills/.claude-plugin/plugin.json` names the set `flow`, and Claude Code adds the prefix as the skill loads. Decided 2026-09-18: bare, `setup`, `help` and `migrate` claimed ground on a machine with other skills.
- `V1` **Every skill is always on**: `flow install` links each one, and nothing switches one off.
- `V1` **5 skills only the user can start**: `/flow:review-code`, `/flow:start`, `/flow:tickets-from-spec`, `/flow:upkeep` and `/flow:write-spec`, each `disable-model-invocation: true`. `home/CLAUDE.md` → `user-only-skills` names `/flow:start`, `/flow:tickets-from-spec` and `/flow:upkeep`, so the agent suggests them.
- `V1` **A description says what the skill is and what it covers**, never its steps and never when to fire it. Claude Code loads every description at session start and fires a skill from it alone. A description summing up the steps gets followed in place of the file.
- `V1` **A shell line in a skill runs one named command**, never logic written inline: `` !`flow exp-47 2>&1 || true` ``.
- `V1` **A skill splits into files only where a part is read on some runs and not others.** `references/` holds those parts, `scripts/` what the skill runs.
- `V1` **A skill links wiki folders in its frontmatter**: `metadata: { wiki: { <folder>: load | name } }` (`fw-290`, the user 2026-10-25). When the skill loads, started by the agent or typed, the `flow-session` mod appends each `load` folder's `index.md` to the skill's text, and one line naming each `name` folder. Each folder goes once per window: a window holding its line, or a whole `Read` of its `index.md`, gets nothing. A folder whose `index.md` is missing falls back to the line. A subagent's window is judged alone, and the restart window adds the same text. Built on Claude Code's `skill.prompt` event, not a `Read` added to the response (the user, 2026-10-26): no added call, and a typed skill is covered too. Its cases: `fw-290` `context.md` `## 5`. A linked skill carries one line at the step where it learns, sending what worked to the folder's findings, since capture runs only at checkpoints. Why: the failure `fw-204` named was a fact sitting in a store the agent never opened, and a skill's load is when its field's knowledge is needed. `metadata` is Claude Code's field for a tool's own data, and Claude Code ignores it.
- `V1` **An edit to a skill is live at once**, in every project and in sessions already open, since every link points into the clone. Adding, renaming or removing one needs `flow install`.
- `V1` **`/flow:execute`, `/flow:debug` and their review stay as they are**, agreed by the user 2026-10-02. Newer models may run many of the checks unasked, but nobody knows which, and Flow is meant for weaker models too. A check goes once beta sessions show it adds nothing.
- `later` **Each skill audited against what the work touched**, scoped to the files changed, or the reads have no end.
- `later` **When a repeating pattern becomes a new skill, and who writes it.**

### The 3 phases

Closed at 3, set by the user. Prototype was the fourth, until it became a step inside `/flow:groundwork`. The skill is in `lab/archive/prototype/`.

- `V1` **`/flow:groundwork` finds every decision the work needs**, the ones nobody raised included, and writes each answer down. 4 steps: list the open decisions as the ticket's `## Questions`, walk them one at a time with the user, attack the result with real cases, then route each decision to the file that owns it, the spec through `guides/write-spec.md`. No plan and no code.
- `V1` **`/flow:execute` builds one ticket**: it reads the ticket and runs `flow start`, plans (a checklist under `## Tasks` for more than about 3 steps, which the user may read and never approves), builds to the end, reviews the diff in the same session by `guides/review-code.md`, and runs `flow done` once its own check passes. It stops for a decision that is the user's, and before building where the approach departs from what the user said.
- `V1` **`/flow:debug` finds a cause by evidence**: a check that fails on this exact bug every run, 3 hypotheses of 3 different kinds shown before any is tested, a written prediction before each run, and a fix proved by the same check. It writes `reports/<failure>.md`, opening `FIXED`, `FOUND_NOT_FIXED` or `UNPROVEN`.
- `V1` **A prototype is a step inside `/flow:groundwork`**: naive code answering one question, run only once talking and reading have both failed, kept in `protos/<name>/` in its ticket beside a report of what it found, never promoted into the real build.
- `V1` **A prototype runs in its own session, on a child ticket**, agreed by the user 2026-10-02. Its installs, errors and reruns would fill a long groundwork session, and Flow refuses `/compact`. Revisit if most beta prototypes turn out to be 10-line probes.
- `later` **Checking the running app before review**: `/flow:execute` proves a UI change by driving the page. Parked by the user 2026-10-01, until the first real project with a UI.
- `later` **Whether a child map may write an open decision into its parent's `map.md`.** Built as `/flow:groundwork`'s rule for a decision binding more than one child, and unproven: no product has been split into child maps.
- `later` **Ideas, not only shaping**: `game-changing-features` and `adhd` read for `/flow:groundwork`'s half that produces ideas.
- `later` **`/grill`**, user only, fired at a finished artifact. Decided, not designed.

### The tools

- `V1` **`/flow:start` opens a session**: the board from `flow next`, or one ticket, picking its phase from its type and status.
- `never` **`/flow:help`, a skill answering any question about Flow or Claude Code.** Dropped 2026-10-14 by the user (`fw-124`): Flow is for them alone, any session answers from the docs (now `docs/manual/`, which no loaded file points at), `flow doctor` and the logs, and the description loaded into every session for nothing. The skill is in `lab/archive/help/`.
- `V1` **`/flow:tickets-from-spec` cuts the next release's behaviors out of `docs/spec/` into tickets**, earliest release first.
- `V1` **`/flow:upkeep` folds closed tickets, notes, findings and the failure log into the wiki, rules and skills**, user only. It shows one plan and stops, then writes, through `~/.flow/guides/knowledge.md` and `references/write-checks.md`. It also reads `flow audit summary` for tickets that looped or ran long.
- `next` **`/flow:upkeep` stays the periodic sweep, and `/flow:file` is a separate closing step per ticket** (`fw-204`, 2026-10-24). Upkeep consolidates, prunes, flags stale pages and changes existing text, so it keeps its plan, the user's yes and its user-only flag. `/flow:file` only routes one ticket's lessons into new files and lines, so the agent runs it at done, park and drop (`docs/spec/tickets.md`). Upkeep then reads what piled up, never closed tickets whole. Its sources change: the index and `context.md` replace `map.md`, decision files and `## State`.
  - Refused: one skill with two scopes, `/flow:upkeep <id>` and `/flow:upkeep`. The two read as the same command, and a closing step must not start rewriting skills.
- `V1` **`/flow:review-code` and `/flow:write-spec` load a criteria file**, user only: `guides/review-code.md` for the code a session changed, `guides/write-spec.md` for the decisions written into `docs/spec/`. Review runs in the same session, never a subagent.
- `V1` **`/flow:audit` answers a question about how something behaved, from the records** (`fw-290`, the user 2026-10-25): sessions through `flow audit`, the logs in `~/.flow/logs/`, ticket histories, `git log`. A guideline the agent adapts to the question, with 2 hard rules: the question, with what a yes, a no and the baseline look like, is written before any data is read; and no conclusion stands on cases read without a count over every case. It writes `reports/<question>.md`, opening `ANSWERED`, `TOO_EARLY` or `NO_RECORD`, on the ticket it runs on, or one it makes labelled `audit`. A failure found becomes a ticket; a fault with no known cause goes to `/flow:debug`. A raw transcript is read only for what the index does not store. Its wiki folder, `audit/`, is linked `load`. Why: such questions come often (a broken restart, whether an added guide is followed, waste in builds, a trial `CLAUDE.md`), and naming the command gave the records but no method.
  - Refused: a how-to page in the wiki. A page never loads by itself, where a skill fires from its description.
  - Refused: a check ticket made automatically when a change ships. A check that waits on real sessions goes as a line in one ticket of such checks (`fw-294`), never in the `## Done when` of the ticket that built the change: a parent cannot close while a check waits weeks (the user, 2026-10-26).

### `/flow:handoff`

- `V1` **A handoff brings the ticket up to date for a session that was not here.** One test decides each line: would that session get it wrong without it? It never runs at a restart (`fw-228`, decided 2026-10-21, built by `fw-246`): the restart carries the ticket, its open sections and the agent's note. Capture is step 2, and it also runs alone, in the new window after a restart, from the note.
- `V1` **The handoff mostly dissolves** (`fw-204`, 2026-10-24, built by `fw-267`). The index and `context.md` already hold the state, written as the work goes, so the handoff only fills what the work missed. Capture stays as a checkpoint action. Dispatching a subagent or another model, and the start message for it, stay. A subagent keeps its own `jobs/<job>.md` in `context.md`'s format as it works, so a replacement continues when its context fills; `reports/` holds final reports only. The files a session changed are not written: the mod records them (`fw-97`).
  - `never` **`## State` at the bottom of `ticket.md`, written once at the handoff** under `Now`, `Found` and `Open`. Replaced 2026-10-24 by `fw-267`: state written once at the end is lost to a crash, and a restart needed the dialogue to rebuild it. The old skill is `lab/archive/handoff/SKILL-before-fw-267.md`.
  - `never` **A handoff file, `.flow/handoffs/<name>.md`, deleted by the mod after one clean turn.** Replaced 2026-10-24 by `fw-267`: the order of the next work goes in the start message, and the rest in the ticket. The hook is `lab/archive/mod-handoff-note/`.
- `V1` **Work with no ticket gets one.** A job for a session that reports back gets a child ticket, and a subagent a prompt, both written once from `references/dispatch.md`.
- `V1` **The reply opens with the path of each file written.** A restart runs no handoff, so this reply never ends one: the agent's note rides the restart call (`fw-228`). Work for another session or model ends on what the user types there: each skill the work needs, then the ticket's mention (`/flow:execute @.flow/tickets/47/ticket.md`), after a check that the ticket's status matches where the work stands. `/flow:start` is for a user who does not know what to work on.
- `later` **A resumed session told the old transcript is there**: a detail the handoff lacks → the last session in `history.md`, opened with `flow audit`.

### Arguments

- `V1` **A skill invoked over and over stays short and takes no argument.** The 4 phases and `/flow:handoff` take none, since a ticket arrives as an `@` mention of its `ticket.md`. A long skill takes one only where it names what the skill opens.
  - Why: an argument changes the skill's text, so Claude Code loads a body already in context a second time. And whoever supplies an argument is at the keyboard, where a skill the agent starts reads the conversation instead.
- `V1` **No `argument-hint` and no ticket id in a Flow skill's description.** Both invite the argument the rule bars.
- `V1` **The rule binds Flow's own skills**, never an outside one.
- `never` **A hook stripping an argument nobody asked for**, rejected by the user 2026-08-26: new machinery against a cost of one duplicate skill body.

### Installing and switching

- `V1` **`flow install` builds one plugin folder, `~/.agents/skills/flow/`**: one link per skill into the clone, and the manifest copied, since Codex ignores a linked one. `~/.claude/skills/flow` links to it, the one folder Flow links whole.
- `never` **`flow skills add|drop`, the `sources` list and the pull at session start.** Left Flow 2026-10-14 (`fw-124`): `domain-skills` was the only source. An outside skill repository is cloned by hand into the skills folder and updated with `git pull`. `.flow/research/skill-curation/outside-skill-repositories-dropped-in-v1.md` says what the commands did and what leans on them, for when the research skill is reworked.
- `V1` **A Flow skill has no switch per project.** `skillOverrides` does not reach a plugin's skills.
- `V1` **A skill edit in the dev checkout reaches every session at once**, since `~/.flow/repos/flow` links to it (`docs/spec/product.md` → `### Working on Flow itself`).
- `later` **A skill update's new commands, hosts and paths listed before it lands.** Each skill links into its clone, so an update gaining `curl … | bash` reaches every project the next session. SkilLock lists what a change adds.
- `later` **`paths:` on an outside skill**, so it loads only beside matching files. Parked until a project uses 5 or more outside skills.

### Outside skills

- `V1` **An outside skill is used whole or harvested, never anything between**, decided with the user 2026-09-27. Used whole: runs as published. Harvested: never switched on, read into wiki pages (`docs/spec/knowledge-base.md` → `### The harvest`). `~/.flow/guides/knowledge.md` holds the rules.
- `V1` **Used whole is the default.** The agent suggests a harvest where an overlay would rewrite most of the skill, or the skill is mostly facts the wiki already covers, and harvests on the user's yes. A skill on an expertise harvests into a field's folder. Decided by the user 2026-10-12 (`fw-94`): a skill can be about anything, and a harvest is not always smooth.
  - Refused: harvest as the default, ruled 2026-09-27 because every switched-on description loads each turn.
- `V1` **A maker's own skill is used whole, and never suggested for a harvest**, since a copy misses each release. What would overturn it: a maker's skill whose description or process breaks Flow's rules.
- `V1` **A skill carrying process is weighed before knowledge.** A plugin with its own build order competes with `/flow:execute`, and nothing decides between them.
- `V1` **A harvest never follows its inputs**, ruled by the user 2026-09-28. The harvest drops each input's clone and records its commit. The next harvest starts from fresh research.
- `V1` **A harvest owes no license**: facts belong to nobody. A passage copied word for word keeps its notice.
- `V1` **Everything starts on for one project.** A service is reached through its command-line tool first, a script in its skill second, a project's MCP server last: a command's output is cut in the shell, and an MCP tool's never is.
- `never` **Several general skills on at once**: they fire on the same files, and the agent follows whichever it read last.
- `never` **A companion skill beside an untouched outside one**, dropped 2026-09-28: what the user would add goes into the wiki.

### Overlays

- `V1` **The user extends any skill with `~/.flow/skill-overlays/<name>.md`**, the name without its plugin's prefix. `overlays.ts` hands it to the agent under `# Overlay` each time the skill loads, in every project, typed or started by the agent, in a subagent too. Flow's skills and outside ones get the same mechanism, the user's call 2026-09-28.
  - Global only, ruled by the user 2026-10-12: an addition is almost always to an outside skill and wanted in every project. A fact true for one project goes in its `CLAUDE.md`.
- `never` **A per-project overlay, `.flow/overlays/<name>.md`**, dropped by the user 2026-10-12 for simplicity. No overlay file existed. The hook and its test are in `lab/archive/project-overlays/`.
- `later` **An overlay for a skill a subagent preloads through `skills:`**, from a `SubagentStart` hook. Flow ships no such subagent. Approved 2026-09-28.
- `later` **An overlay reaching a skill's `references/` pages.** The hook fires once, when `SKILL.md` loads.

### The archived `domain-skills` repository

- `never` **A skill about one field or tool in a public repository.** The `domain-skills` repository, `flow contribute` and `/flow:apply-domain-findings` left Flow 2026-10-14 (`fw-124`), with all work for strangers (`fw-16`). A copy sits in `lab/archive/domain-skills/`. Knowledge about a tool or field goes to wiki pages (`fw-94`), and `/flow:write-skill`, a harvest into one skill per tool, was dropped 2026-10-12 for that reason.
- `later` **`/web-pages` rebuilt on `browser-harness`**, from 1,059 lines to about 150: the capture scripts go, the investigation method stays. The old skill is in `lab/archive/domain-skills/drafts/web-pages/`. Waits for the move off WSL.
- `later` **Chrome extensions as wiki pages**, from 3 guides in `lab/archive/domain-skills/drafts/chrome-extension/`, at the next extension project. Knowledge about a field goes to the wiki (`fw-94`).

## The parts

- **`skills/`**: Flow's skills, and `skills/.claude-plugin/plugin.json`.
- **`scripts/features/skills/skills.ts`**: the skill catalog and what installs.
- **`scripts/hooks/overlays.ts`**: the overlays.
- **`guides/knowledge.md`**: used whole or harvested, the order for reaching a service, and how a skill is written. It took over `write-skills.md` 2026-10-26 (`fw-284`), so one file serves `/flow:research`, `/flow:upkeep` and `read-before-adding` in `home/CLAUDE.md`.

## What passes between them

An overlay, `~/.flow/skill-overlays/execute.md`, reaching the agent as `/flow:execute` loads:

```markdown
# Overlay

End every review with the next ticket to take, and why.
```

## One real case: a project takes on a skill

1. `/flow:research` finds 3 NestJS skills and reads them. One is the makers' own.
2. The user agrees to use the makers' skill whole. They clone `nestjs/skills`, and link it into the project's `.claude/skills/` by hand.
3. The next session lists it. Its description loads, and the agent starts it on a NestJS file.
4. The user writes `~/.flow/skill-overlays/nestjs.md`. Every load, in every project, hands it over.
5. The makers push a change. The user runs `git pull` in the clone, and every project with the link reads the new version.

## How it fails

- **A link someone replaced with a real folder** → `flow install` refuses to overwrite it.
- **An overlay is missing, or the hook fails** → the skill loads with nothing added.
- **A `skillOverrides` key names a Flow skill** → `flow doctor` reports it, since the key does nothing.
- **A skill synced from the claude.ai account has no `skillOverrides` entry** → `flow doctor` names it with the line that switches it off. `"on"` counts as decided. Decided with `fw-133`.

## How you know it worked

- **Claude Code loads `flow@skills-dir` and names its skills `flow:<name>`**: proven 2026-09-18 in a scratch install.
- **`npm test` covers the links and the overlays.**
- **`overlays.ts` in a live session.** Not yet: its test feeds it the calls the docs describe.
- **The beta runs each phase on real work**, `fw-2` to `fw-14`.

## What is locked

- **The prefix comes from the manifest**, since Codex reads the same file: one manifest gives `/flow:groundwork` in Claude Code and `$flow:groundwork` in Codex.
  - Refused: the prefix in the folder name, `flow-groundwork/`, tried 2026-09-17 and reverted. The user objected to renamed folders in any form.
- **One copy of every skill per machine, reached through links.** An edit holds on every branch and in every project at once.
- **One overlay mechanism for every skill.**
  - Refused: a shell line `` !`flow overlays <name>` `` ending each Flow skill. It reached only a skill carrying it. `git log -S "flow overlays"` finds the code.
- **Harvest over using whole, for anything but a maker's own skill.**
