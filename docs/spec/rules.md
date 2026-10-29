# Rules

How Flow tells the agent how to work, and how it finds out whether the agent listened. A rule is one instruction in a file Claude Code loads, with an id of its own. A rule check is a small script that reads an edit before it lands and says whether one rule was followed. `flow scorecard` adds up what the checks recorded across every session.

## Scope

- **In**: the rule files and what each holds, how a rule is written, the guides sent by situation, the rule checks and their hooks, the scorecard, and the open questions about rules.
- **Out**: writing the rule file at install and carrying the user's lines through an update, in `docs/spec/setup.md`. Where capture sends a lesson, and how `/flow:upkeep` routes it, in `docs/spec/knowledge-base.md`. The reminder line beside every message, the audit and issue tickets, in `docs/spec/product.md`.

## A rule meets an edit

What happens each time the agent edits or writes a file:

```text
    an Edit or a Write, about to land
                │
                │  the path, the text the edit adds
                ▼
  ┌─────────────────────────┐
  │      rule-check.ts      │ ◄─ from flow scorecard ─┐
  │                         │                         │
  │  each check in turn:    │                         │
  │  does it apply here?    │                         │
  │  was the rule followed? │                         │
  └─────────────────────────┘                         │
                │                                     │
                │  by the check's tier:               │
                │  measure: counted, nothing said     │
                │  warn: a message to the agent       │
                │  block: the edit refused            │
                ▼                                     │
  ┌─────────────────────────┐                         │
  │   the session's file    │                         │
  │   in logs/scorecards/   │   one line per result   │
  └─────────────────────────┘                         │
                │                                     │
                │  every session's counts             │
                ▼                                     │
  ┌─────────────────────────┐                         │
  │     flow scorecard      │ ── to rule-check.ts ────┘
  │                         │    a check moved up
  │  the 4 lists            │    one tier, by hand
  └─────────────────────────┘
```

## Behaviors

### The rule files

- `V1` **One rule file every session loads: `~/.flow/CLAUDE.md`**, the copy `flow sync` carries, with `~/.claude/CLAUDE.md` a link to it. Ruled by the user 2026-10-08: Flow ships for Claude Code alone, so the machine keeps one `CLAUDE.md`, as a project does, and `AGENTS.md` comes back only once Flow supports another agent. A rule sending the agent to write into the file names `~/.flow/CLAUDE.md`, since the Edit tool refuses to write through a link. The file is `home/CLAUDE.md`. Its sections, in order: `## The turn`, `## Reading`, `## Writing files`, `## Tools`, `## When something breaks`, `## Workflow`, `## Capture`, `## Scripts`, `## What the user sees`, `## Judgment`, `## The reply`.
- `V1` **A project's rule file is its `CLAUDE.md`, and Flow writes no `AGENTS.md` in a project.** The template gives it 2 sections, `## Project` and `## Rules`, each a placeholder comment. The agent decides what else it holds, the user's call 2026-09-30. Ruled by the user 2026-10-08: Flow ships for Claude Code alone, and Codex, Cursor and others treat `AGENTS.md` as their own file and write into it. A root `AGENTS.md` belongs to those agents, and Claude skips it wherever a `CLAUDE.md` exists. A later Codex port renames the file (`.flow/research/models/which-model-and-other-harnesses.md`). Reasons in `fw-80`'s `groundwork/map.md` → `## 6`.
- `V1` **No profile file.** `~/.flow/profile.md` held 12 preferences that loaded every session, and each capture route had to decide what belonged in it, so it kept growing. Ruled by the user 2026-10-19 (`fw-203`): the file and its capture routes are archived (`lab/archive/profile.md`, the template; the user's own copy in `~/.flow/archive/`). A correction is a rule line, in `~/.flow/CLAUDE.md` or the project's `## Rules`. Facts about the user wait for a memory mechanism, designed in `fw-204`.
- `never` **The machine's rules in `~/.agents/AGENTS.md`, imported by `~/.claude/CLAUDE.md`**, the layout until 2026-10-08: 2 files for one set of rules, so another agent could read them. Flow supports no other agent yet.
- `never` **A project's rules in `AGENTS.md`, imported by `CLAUDE.md`**, the layout until 2026-10-08: it let Codex read Flow's rules, and let Codex write into them. No setting blocks every agent's edits, since every agent runs as the user's account.
- `never` **A project's rules in `.agents/AGENTS.md`, imported by `CLAUDE.md`**, proposed 2026-10-08 because Codex never reads that path and its sandbox cannot write it. `CLAUDE.md` alone does the same job with 1 file and no import.
- `never` **Comment rules in `claude/rules/comments.md`**, loaded for code files through `paths:` from 2026-09-10, with their check `js-and-ts.js`. Archived by the user 2026-10-20 in `lab/archive/comment-rules/`: comment shape is minor, and Flow needs none of its 13 rules. The rule checks stay, and take real rules once they exist.
- `V1` **One rule set for every model.** No model detection and no rule written for one model. A rule that works on any model is what makes the default-action rule below required.
- `never` **Flow's rules for a kind of file in a rule file with `paths:`**, planned by `fw-204` (the user 2026-10-20). Replaced 2026-10-25 by `### Guides sent by situation` (`fw-284`): `paths:` tests a path alone, and loads a rule when a matching file is read, never when one is written new or edited from memory. A project's own `.claude/rules/` with `paths:` stays until a project needs entries of its own.
- `never` **Stack content lives in a domain skill, never in a rule file with `paths:`.** Set by the user 2026-09-10, rejecting a `rules/typescript.md`; reversed 2026-10-20, above.
- `V1` **Block-level HTML comments cost nothing**: Claude Code strips them before a `CLAUDE.md` enters context, so placeholder comments in a template are free.
- `later` **Rules that repeat Claude Code's own system prompt, cut.** `home/CLAUDE.md` costs about 3,600 tokens a session, and a rule the built-in prompt already gives adds nothing. `batch-calls` was one, found by hand 2026-09-29. `repos/tools/claude-code-system-prompts/` holds the prompt for every release.
- `later` **Flow's rules in Cowork desktop sessions.** Those sessions skip a rule file linked from outside the working folder and an import pointing outside it, and `~/.claude/CLAUDE.md` always is one. Terminal and IDE sessions load both.
- `later` **A rule on adding a dependency**: a check before one is added, and how a bulk version bump is reviewed.

### Writing a rule

- `V1` **Every rule in a loaded file carries an id**: lowercase words joined by dashes, in a bold code span at its start. `- **`no-git-mutations`** Never run a git command that writes.` The id states the rule, and the body says only what the id cannot.
- `V1` **A heading's id is its text as a slug**, `## The turn` → `the-turn`. Ids are unique inside one file, sections and rules together. A heading whose slug reads badly gets renamed.
- `V1` **A rule file is written by `guides/style.md` plus `guides/write-rules.md`**, and any file an agent loads also by `guides/write-loaded-files.md`. `home/CLAUDE.md` → `writing-pass` sends the agent to `style.md`, which names the guide for each kind of file.
  - `V1` **The guides split by scope** (`fw-284`, the user 2026-10-25). `style.md` keeps what holds for everything Flow writes. `cut-loaded-files.md` becomes `write-loaded-files.md` and takes `style.md`'s loaded-only sections. `write-docs.md` goes to `lab/archive/`, and its table of contents, code-fence language and real-output rules move into `style.md`: the user is the only reader of the docs. A file then reads `style.md` plus at most the guides of its kind. Refused: merging `style.md` and `cut-loaded-files.md`, which makes every ticket and doc edit read 66 lines of loaded-file cuts.
- `V1` **A rule is direct.** It states the rule, with no argument for it and no consequence the reader works out alone. A command is one line to run, then what it prints. A limit is a number. An override is read where it is written. The reader is intelligent. Set by the user 2026-09-07, line by line on a rewrite of `home/CLAUDE.md`.
- `V1` **Every rule states the action to take, never only what is forbidden.** A rule written only as a ban leaves the agent one direction under doubt, not acting. On an eager model that corrects it. On a cautious one it compounds, which is what the user saw on Sonnet 4.6. Locked 2026-09-05.
- `V1` **A failure to act gets structure, not another rule.** One ordered section, `## The turn`, closed 6 kinds of failure in a day. 20 rules in a flat list closed none in 6 weeks.
- `V1` **A rule claims only the ground it covers.** "Every file gets the writing pass" read as a rule over code, so it became "Every markdown file gets it".
- `V1` **A pointer into a rule file is an anchor**: `~/.flow/CLAUDE.md#preferences`, never "`## Preferences` in `~/.flow/CLAUDE.md`".
- `V1` **A rule no script can check gets the reminder line**, in `docs/spec/product.md` → `### Hooks and guardrails`. What decides its shape is what the agent still reads on turn 15, never its cost: 40 lines over 20 turns is under 1,000 tokens.
- `later` **Every rule sorted into 2 kinds**: a ban where the agent breaks the rule under pressure, a step-by-step recipe where the output comes out the wrong shape. Open: whether `style.md`'s "Write an action positive. Write a boundary negative." already settles it.
- `later` **The same rule keeping one id across `home/CLAUDE.md` and a project's file**, so `flow scorecard` counts it once. Parked until rules come from mining sessions rather than rewrites.

### Guides sent by situation

- `next` **One list, `mods/flow-session/features/guides/situations.ts`, says which guide each situation needs** (`fw-284`, the user 2026-10-25). An entry is `{ id, when(call), send(call), why(call) }`. `when` sees the tool call with its path or command. `send` names the calls to add, and `why` ends the header of their results. What the window holds is the engine's test, run only once an entry matches, so a response that touches no matched file costs no read of the window. One engine runs the list on every tool call, and the first match wins. Why: a script tests anything and sends anything, where `paths:` tests a path alone. A mod's hook runs inside the session, where a hook script starts Node on each call. Refused: `paths:` frontmatter in each guide, which also ties a guide to `.claude/rules/`. Refused: folding the rule checks into the engine, which nothing here needs.
- `next` **A guide arrives as a real call the mod adds to the model's own response, at no extra request.** A `turn.step` hook rewrites the response as it streams. A response that reads a matched file gets a `Read` of each guide added beside it. A response that edits or writes one has that call held back and the guide's `Read` put in its place: nothing on disk changes, and the model writes the edit again with the guide in view. Each added result opens `[Auto] <why>`, and `CLAUDE.md` `flow-added-calls` says what the marker means once: act on the call, never mention it to the user, never count it as your own (the user, 2026-10-26). Why: the model otherwise calls the read its own mistake, and a rule in `CLAUDE.md` reaches subagents too, so each header stays a few words. Why: since 2026-10-01, 29 of 173 turns that edited a loaded file read `style.md`, though `writing-pass` names it, and 57 of 136 sessions that edited a `CLAUDE.md` never read it first. Probed 2026-10-25 (`fw-284` `reports/inject-read.md`): the added call runs, for `Read` and `Bash` alike, is saved inside the model's message, and the next request passes, thinking blocks included. The cache reads the whole earlier prefix, and the same holds in a subagent. Refused: a line naming the guide on the `Read` result and a refusal of the first edit, which cost 1 and 2 or more requests and still left the read to the agent. Refused: a warning after the edit, once the file has changed.
  - `V1` **A held edit holds back every call after it in the response**, named in the header: a test run after the edit would run against the old file. Calls before it run. Where the model reads the guide in that same response, the header goes on the model's own `Read` and nothing is added.
  - `V1` **The header rides as the result's `context`**, read right after the result. A `Read` result cannot open with it: the tool numbers the file's lines, and a line put in front would shift every number. Built and checked 2026-10-25 in 2 Haiku sessions: the added `Read` and `--help` ran, the held `Write` and the `Bash` after it never ran, and the model made both again. In 1 of the 2 the model still listed the added calls as its own.
- `next` **Nothing is added that the window or the response already holds**, whoever made the call: a whole-file `Read` of the guide, or a group's `--help` with its result. The mod reads the window through `$.session.messages`, with the `agentId` for a subagent, so each window and each agent is judged alone and a restart starts over. The restart window loads the guides of each matched file it loads, beside that file. Refused: a list kept in `$.state`, which needs its own reset on each restart and each subagent.
- `next` **4 writing entries, first match wins.** Every `CLAUDE.md`, `CLAUDE.local.md` and `.claude/rules/` file → `style.md`, `write-loaded-files.md`, `write-rules.md`. Any other file an agent loads (a skill folder, `.claude/commands/`, `.claude/agents/`, Flow's `guides/`, a skill's `references/`, Flow's `prompts/`) → `style.md`, `write-loaded-files.md`. `docs/spec/` → `style.md`, `write-spec.md`. Any other `.md`, `docs/manual/` included → `style.md`. Ticket folders take the `ticket` entry instead.
- `V1` **A `code` entry sends `guides/write-code.md` at the first `Read`, `Edit` or `Write` of a code file in a window** (`fw-299`, the user 2026-10-27). The guide holds 5 lines on structure and code, for every project. A code file is a source file by its extension (`.ts`, `.js`, `.py`, `.sh` and the like), never a data file such as `.json`. Checked 2026-10-27 in a Haiku session: 2 code files read, the guide added once. Why on a read: planning reads code before it places files, and the guide costs 5 lines once a window. A file not yet written gets it at its first `Write`. Refused: no entry for code, on the grounds that it would fire on every edit; the engine adds a guide once a window, so the cost never was per edit. Refused: a skill, which loads only when the agent chooses it.
- `next` **A `ticket` entry sends `guides/write-tickets.md`** on any read or edit of a file under a `tickets/` folder (`docs/spec/tickets.md`). About 90% of sessions open a ticket, so it costs about what a `CLAUDE.md` section does, and a subagent or session that touches no ticket never pays it.
- `next` **A `command` entry sends a group's own help.** The first `Bash` call in a window running `flow notes …`, `flow audit …` or `util <group> …` gets `<group> --help` added beside it. Bare ticket commands get nothing: the rule or step that runs each one names it. Bare `flow` never counts as a group's help. `home/CLAUDE.md` `## Scripts` opens with `flow <group> --help`, names the groups, and keeps the 2 details needed almost every session, `flow start --activity` and `flow new -p home`. Why: the agent must know a command exists before calling it, and only the usage can wait. Refused: sending `docs/manual/commands.md`, written for the user and too long.
- `next` **A `knowledge` entry sends `guides/knowledge.md` when the agent adds a skill, a plugin or an MCP server** (`fw-284`, the user 2026-10-26): a `Write` of a `SKILL.md`, an edit of `.mcp.json`, or `claude plugin install`, `claude plugin enable` or `claude mcp add`. It sits before the writing entries, so a written `SKILL.md` gets `style.md` and `write-loaded-files.md` beside it, and it holds an install command back as an edit is held. It catches what `read-before-adding` in `home/CLAUDE.md` missed: that rule fires when the agent proposes the addition, since a hook sees only the calls made after the plan, and a `Skill` call means the skill is used, never edited (the user, 2026-10-26). A full rewrite of an existing skill brings `knowledge.md` too, since a call cannot tell a new file from an old one; such rewrites are rare, upkeep's "grown by accretion" alone.
- `next` **A `skill` entry sends a linked skill's wiki folders** (`docs/spec/skills.md`, `fw-290`).
- `V1` **A `shell-write` entry sends the guides an `Edit` of the same file takes, and holds the call until they are read** (`fw-247`, the user 2026-10-29). It covers a `sed` or `perl` with an in-place flag (`-i`, `-pi`, `--in-place`) at the start of a command segment, and a heredoc or an inline `python`/`node` run whose text writes (`.write(`, `write_text`, `writeFileSync`, `open(..., 'w')`). Its files are the words ending in `.md` or a code extension, and a relative path gets a leading `/` so the entries' folder tests match. A command naming a ticket and a test file brings `write-tickets.md` and `write-code.md`. It sits before `command`, and a write that names no such file falls through. Why: the rule `edit-with-edit` failed 8 times after its first ticket (`fw-195`), and what a shell edit skipped was the guides, not the `Edit` tool. From 2026-10-19 to 2026-10-29 the audit found about 247 shell writes, 54 of them rewriting a ticket file, against 1342 `Edit`s of a `ticket.md`. The rule is archived in `lab/archive/edit-with-edit.md`. A path a script builds from variables is not found, and no guide arrives for it. Refused: a guard that refuses shell edits, since the guard only asks today and a refusal would be its first. Refused: a stricter rule, which already failed 8 times. Refused: a `flow tickets tick` command, since ticks are 27 of the 247 writes.

### Changes to a loaded file

A loaded file is one that enters an agent's context: a rule file, a skill and its references, a guide, a prompt. A change to one leaves an entry in a log kept in this repo, so a removed or reworded chunk can be restored and a trial removal judged (`fw-338`, the user 2026-10-30). An entry as designed:

```md
## 2026-10-30 · `agreed` · rewrite
Mode: final
Ticket: fw-288
Why: "mostly approved, but keep it flexible" was recorded as a full approval.
Together with: home/CLAUDE.md
Was: Pushback: an objection, or another solution to the same problem. Never ask for a yes, …
Now: Pushback: an objection, or another solution to the same problem. A hedge on a proposal ("mostly", "maybe") is no pushback. …
```

- `next` **Every edit to a file Flow ships is logged**: `home/`, `project-template/`, `guides/`, `prompts/`, `skills/` and this repo's `CLAUDE.md`, additions, rewrites and removals alike. The live copies in `~/.flow` and `~/.claude` get no log, since they follow the templates (`home-files-exist-twice`). Why: a removed chunk had no single home. It went to `lab/archive/` with a `README.md` line, to the one dated snapshot (`lab/archive/global-rules/CLAUDE-2026-10-17.md`), or to a commit among the batches of `~/.flow` (`pc-wsl: 13 files`) that hold no reason. Refused: a log in `~/.flow`, which would cover the live copies.
- `next` **One log file per logged file, mirroring its path under `lab/edit-log/`**: `home/CLAUDE.md` logs to `lab/edit-log/home/CLAUDE.md`. Why: 3 files are named `CLAUDE.md` and many `SKILL.md`. Refused: one file per month, which hides which file changed (the user). Entries made in one turn for different files name each other in `Together with`. A renamed file moves its log, and a retired file keeps its log.
- `next` **One entry per rule or section per turn**: a rule id where the file has ids, else the enclosing heading. A turn is the edits between one message of the user and the agent's reply. The first edit sets `Was` to the text before the turn, and later edits of the same rule change `Now` only. Why: an entry per edit logs a half-finished wording, and a trial verdict belongs to one rule. A new file gets one `add` entry reading `new file, N lines`, with no copied text.
- `next` **An entry holds** the date, the rule id or heading, the action (`add`, `rewrite`, `remove`), `Mode` (`final` or `trial`, on every entry), the ticket, `Why`, `Was` and `Now` verbatim, and `Together with`. A rewrite is tried like a removal, so `Mode` applies to it too.
- `next` **The mod writes the entry as the edit lands, and the agent writes the `Why`.** An empty `Why` marks an unfinished entry. Why: retyping 30 lines of a section rewrite doubles the output, and a slip ruins the way back. Refused: the agent writing it all, the failure of forgetting that the user keeps seeing. Refused: the mod alone, which cannot know a reason.
  - `next` **The mod appends, newest last.** Two sessions inserting at the top would overwrite each other, and the scorecard appends one line at a time for the same reason. The one read-and-write is a later edit of the same rule in the same turn, by one session.
- `next` **The agent is told by a line on the edit's result and by a guide.** The line: `[Auto] Logged in <log path>, entry <id>. Fill Why.` The guide, `guides/edit-log.md`, holds the fields and the trial lines, and a `situations.ts` entry sends it once per window, the way `style.md` arrives. Why: the log works when an agent in another project edits these files, and a guide sent once never repeats on back-to-back edits (the user 2026-10-30). The guide names no `lab/` path.
- `next` **A trial is an entry with `Mode: trial` and `Verdict: open`**, and its `Why` says what to watch. `/flow:upkeep` in this repo greps the open ones, checks the sessions since through `flow audit`, and sets `Verdict` to `kept` (the mode becomes `final`) or `restored`. Restoring is an ordinary edit, logged like any other. The sweep instruction sits in this repo's `CLAUDE.md`, since the skill ships to every project.
- `never` **A ticket, a `fw-294` line, a `flow doctor` line, a result line listing open trials, or a copy of the file with a link switch, per trial.** The user asked for the simplest path (2026-10-30): a sweep of the logs is the measurement. The copy-and-link switch was drafted 2026-10-25 and replaced by this log.
- `later` **A `Read` of a logged file lists that file's open trials**, if a rule out on trial turns out to be proposed again before its review.

### Rule checks

**Paused 2026-10-27, until `fw-308` rebuilds them** (the user): no file an agent loads, no manual page and no `flow --help` names the rule checks or the scorecard. The code, the tests and both hooks stay. `fw-308` → `## Tasks` lists every mention cut, to restore or rewrite. The behaviors below stand as written.

- `V1` **One `PreToolUse` hook on `Edit|Write` runs every check**, `rule-check.ts`. Counting, warning and blocking are the same check at the same moment, and the check's own `tier` decides which happens. About 31 ms an edit, nearly all of it Node starting, measured 2026-09-10.
- `V1` **3 tiers.** `measure` counts and interrupts nothing. `warn` hands the agent a message and lets the edit through. `block` refuses the edit, kept for a check with no false positives.
- `V1` **One file per check, `scripts/rule-checks/<id>.js`, named for the rule's id.** The folder is the list: adding a check adds a file, and promoting one changes one word. A check is any JavaScript function, never only a pattern.
- `V1` **A rule and its check are written in the same pass**, by whichever pass wrote the rule, usually `/flow:upkeep`. Every check starts at `measure`, so one built from a single example costs nothing when it proves wrong. Set by the user 2026-09-05.
- `V1` **A path-scoped rule that matters starts at `warn`.** `paths:` loads a rule when a matching file is read, never when one is written, so a brand-new file is written without it. Filed as `anthropics/claude-code` #93248.
- `V1` **A warning carries the rule's id where its file is loaded, and its whole text where not.** `instructions-loaded.ts` records each rule file as it enters context, on the `InstructionsLoaded` event.
- `V1` **A warning reaches the agent through `additionalContext`.** `permissionDecisionReason` on an allow reaches the terminal alone.
- `V1` **The hook never allows, and a failure inside it lets the edit through silently.** It cannot widen what the permissions allow. Breaking every edit over one bad check costs more than the counts are worth.
- `V1` **A rule the user called minor stays at `measure`**, whatever the counts say.
- `V1` **A wrong warning goes to `.flow/findings/scorecard.md`**, which `/flow:upkeep` reads. A wrong check gets fixed. A rule too vague for any check gets rewritten.
- `V1` **About 10 checks before V1**, chosen from rules real sessions break, where a script can decide from the edit alone: `fw-12`. Today there are none: the first, `js-and-ts.js`, went with the comment rules on 2026-10-20. The checks stay, ruled by the user 2026-10-01 and again 2026-10-20: they are a major feature, and the next check comes with a real rule.
- `later` **A project's own checks, in `.flow/checks/<id>.js`**, loaded beside the global ones. Skipped 2026-09-07: no project needs one, and a mechanism built before its first case gets built wrong.
- `later` **A linter as a check**: ESLint, ruff or shellcheck run by a check and filed under a Flow rule id, or Flow writing linter settings from its rules. Flow reads a linter a project already has, and adding one stays the user's call.
- `later` **A sweep of the whole tree against every rule, ending in one report.** The hook sees one edit's added text. The open problem: every check judges new text, and handing one a file older than its rule turns a clean tree into thousands of findings.
- `later` **Conduct rules scored, not only reminded.** `MessageDisplay` streams the reply with a turn id, `PreToolUse` carries the prompt id, and `Stop` sees the last reply and can block. Reading a reply against the edits of the same turn would make `the-turn` and `the-reply` checkable. A script where it can decide, a model call where it cannot.
- `later` **A warning when a reply says "done" with no test run since the last edit**, from the `Stop` hook. Never a block.
- `later` **A check that the agent read a file before writing**, from the session's transcript with the place already scanned remembered, or as an entry in `situations.ts`. The old reason against a hook on `Read`, Node starting on each call, does not hold for a mod's hook (`### Guides sent by situation`).

### The scorecard

- `V1` **Each session writes its own file, `~/.flow/logs/scorecards/<session id>.jsonl`, one line added per result.** Never read, change and write back: 2 hooks firing close together would overwrite each other's counts. A session that edits nothing writes no file.
- `V1` **Each result records its project and effort level.** The project answers "broken here and nowhere else", the sign a global rule belongs to one project. The effort answers whether a rule holds when the model thinks less. Both are impossible to add later.
- `V1` **`flow scorecard` prints 4 lists**: checks naming a rule id no file defines, rules broken most, checks ready to move from `measure` to `warn`, and rules loaded every session and never once relevant. It finds ids in `home/CLAUDE.md`, the clone's root `CLAUDE.md`, `claude/rules/` and any file a check names.
- `V1` **Ready to move up means 5 violations at a 60% rate.** Both numbers are guesses until real counts exist.
- `V1` **The report states its coverage**, `12 rules measured, 89 not measurable`, so a clean report never reads as a clean session.
- `V1` **A result older than its check's `since` date is dropped**, so rewriting a check never averages 2 different questions.
- `V1` **A dead rule is one never relevant across many sessions.** Never broken is not dead: a rule is written after a real mistake, so no violations means the fix took.
- `V1` **`flow scorecard` only reads.** Moving a check up a tier is an edit to its file.

## The parts

- **`home/CLAUDE.md`**: the template of the rule file every session loads.
- **`project-template/CLAUDE.md`**: a project's rule file before setup fills it.
- **`guides/style.md`, `write-rules.md`, `write-loaded-files.md`**: how a rule file is written.
- **`mods/flow-session/features/guides/situations.ts`**: the guides sent by situation, and the plan of what to hold and add. `register.ts` runs it on `turn.step`, and `window.ts` on the restart's files. `docs/manual/guides.md` shows every header.
- **`scripts/hooks/rule-check.ts`**: the wiring. **`scripts/features/checks/judge.ts`** judges the edit, and **`checks.ts`** loads the checks and reads a rule's text out of its file.
- **`scripts/hooks/instructions-loaded.ts`**: records each rule file loaded.
- **`scripts/features/checks/scorecard.ts`**: the per-session files.
- **`scripts/rule-checks/`**: one file per check.
- **`scripts/commands/scorecard.ts`**: `flow scorecard`.
- **`skills/knowledge/upkeep/references/write-checks.md`**: how a check is written, tested and promoted.

## What passes between them

A check file, `js-and-ts.js`, archived 2026-10-20 in `lab/archive/comment-rules/`:

```js
module.exports = {
  id: 'js-and-ts',
  rule: 'claude/rules/comments.md',
  tier: 'measure',
  since: '2026-09-10',
  needs: 'added',
  applies: (file, text) => EXTS.test(file) && declares(text),
  check: (file, text) => offenders(text).length === 0,
  message: 'Line comments above a declaration: write them as `/** */`.',
};
```

`needs: 'added'` hands the check only the text the edit adds, and `'file'` the whole file as it will read. `applies` returning false is silence, never a pass.

A line in a session's scorecard file:

```json
{"at":"2026-09-10T14:02:11.000Z","kind":"result","id":"js-and-ts","tier":"measure","since":"2026-09-10","project":"flow-dev","effort":"high","ok":false}
```

## One real case: a check moves up

1. `/flow:upkeep` turns a finding into a rule in `home/CLAUDE.md` and writes its check, `scripts/rule-checks/<id>.js`, at `measure`, with a test holding one real violation and one clean example.
2. Over a week of sessions, every `Edit` and `Write` runs the check. Each result adds a line to its session's file, and the agent sees nothing.
3. `flow scorecard` lists the rule under ready to move up: 7 violations in 10 chances, and no wrong warning in `.flow/findings/scorecard.md`.
4. The user agrees, and the check's `tier` becomes `warn`.
5. The next violation hands the agent the check's message and the rule's id, since its file is loaded. In a session where the file never loaded, the message carries the rule's whole text.

## How it fails

- **A check throws** → the edit lands, and nothing is recorded for that check.
- **The scorecard file cannot be written** → the edit lands, the count is lost.
- **A rule renamed or deleted** → its check names an id nothing defines, and `flow scorecard` lists it as stale.
- **A rule reworded** → its check measures the old wording until `since` is moved.
- **A path-scoped rule's file never loaded before a new file is written** → only a `warn` check reaches the agent, carrying the rule's text.
- **A check at `warn` gives wrong warnings** → the agent writes each to `.flow/findings/scorecard.md`.

## How you know it worked

- **A check fired correctly in a live session** on 2026-09-10: `js-and-ts.js`, since archived.
- **A warning carrying a rule's whole text reaches a live session.** Not yet: unit-tested only, and no `warn` check exists.
- **A rule filed changes what the agent does**: the same rejected reply does not come back once its rule lands. Not yet shown. The 3 study cases of 2026-09-06 (since retired into issue tickets) were marked fixed the day `## The turn` was written from them, so fixed records a rule written, never a rule that worked.
- **About 10 checks recording across real sessions**, and `flow scorecard` naming at least one ready to move up: `fw-12`.

## What is locked

- **One hook and one script for every check, the tier on the check.** No hook per rule, and no second script that only warns.
- **A check starts at `measure`.** Waiting for more examples before writing a check leaves the rule unmeasured for exactly as long as the wait.
- **Injecting a rule's text beats telling the agent to go read it**: no extra turn, and no chance the read is skipped.
- **Global checks only.** A project's checks wait for the first project that needs one.
- **The rule checks stay**, ruled by the user 2026-10-01.
  - Refused: removing `rule-check.ts`, `instructions-loaded.ts`, `flow scorecard` and the one check, proposed in the final sweep since only one check existed and it only counted.
- **No per-model rules.** A base set plus an overlay per model waits for measurement to earn it: `docs/spec/product.md` → `## Bets`.
