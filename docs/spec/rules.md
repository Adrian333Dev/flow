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
- `V1` **A file an agent loads is written through `/flow:write-instructions`** (`fw-425`, the user 2026-11-08): a rule file, a skill, a guide, a hook's prompt. The skill's step 5 reads `references/guides/writing.md`, and its `references/shapes.md` holds what `write-loaded-files.md`, `write-rules.md` and `write-skills.md` held, now in `lab/archive/write-guides/`. The mod attaches no guide to loaded text (`### Guides sent by situation`).
  - `never` **A rule sending the agent to `writing.md` first, with the list of guides on top of it** (`read-writing-first`, 2026-10-31). Removed 2026-11-03 (`fw-397`, the user): the agent's own read came before the first markdown edit in 0 of 13 windows, and the list repeated the mod's entries. Its `Was` sits in `lab/edit-log/home/CLAUDE.md.log.md`.
  - `V1` **A change to loaded text runs its own path, `/flow:write-instructions`** (`fw-425`, the user 2026-11-08): read what exists, state the problem, write the cases, design, show the exact text, land it, check it later. Every step runs, sized by the job. Its description fires it as the change is first discussed, and this repo's `CLAUDE.md` → `loaded-text-path` names it in place of `/flow:groundwork` and `/flow:execute`. Why: in `9feb0e67` the user agreed only to summaries, and the real text and behaviour showed after the build (`fw-358`). Why a skill: the guide holding the path, `write-loaded-files.md` → `## 0. The path`, was attached by the hook and still not followed (`fw-423`, `fw-424`); ordered steps get followed where flat rules do not. Refused (`fw-358`, now overturned): a skill of its own, on the grounds that the path must load before any skill is picked. Refused: a "prefer removal" rule with no lookup of the line's reason, since a line added for a forgotten fault would be cut.
  - `V1` **The guides split by scope** (`fw-284`, the user 2026-10-25). `writing.md` keeps what holds for everything Flow writes. `cut-loaded-files.md` becomes `write-loaded-files.md` and takes `writing.md`'s loaded-only sections. `write-docs.md` goes to `lab/archive/`, and its table of contents, code-fence language and real-output rules move into `writing.md`: the user is the only reader of the docs. A file then reads `writing.md` plus at most the guides of its kind. Refused: merging `writing.md` and `cut-loaded-files.md`, which makes every ticket and doc edit read 66 lines of loaded-file cuts.
- `V1` **A rule is direct.** It states the rule, with no argument for it and no consequence the reader works out alone. A command is one line to run, then what it prints. A limit is a number. An override is read where it is written. The reader is intelligent. Set by the user 2026-09-07, line by line on a rewrite of `home/CLAUDE.md`.
- `V1` **Every rule states the action to take, never only what is forbidden.** A rule written only as a ban leaves the agent one direction under doubt, not acting. On an eager model that corrects it. On a cautious one it compounds, which is what the user saw on Sonnet 4.6. Locked 2026-09-05.
- `V1` **A failure to act gets structure, not another rule.** One ordered section, `## The turn`, closed 6 kinds of failure in a day. 20 rules in a flat list closed none in 6 weeks.
- `V1` **A rule claims only the ground it covers.** "Every file gets the writing pass" read as a rule over code, so it became "Every markdown file gets it".
- `V1` **A pointer into a rule file is an anchor**: `~/.flow/CLAUDE.md#preferences`, never "`## Preferences` in `~/.flow/CLAUDE.md`".
- `V1` **A rule no script can check gets the reminder line**, in `docs/spec/product.md` → `### Hooks and guardrails`. What decides its shape is what the agent still reads on turn 15, never its cost: 40 lines over 20 turns is under 1,000 tokens.
- `later` **Every rule sorted into 2 kinds**: a ban where the agent breaks the rule under pressure, a step-by-step recipe where the output comes out the wrong shape. Open: whether `writing.md`'s "Write an action positive. Write a boundary negative." already settles it.
- `later` **The same rule keeping one id across `home/CLAUDE.md` and a project's file**, so `flow scorecard` counts it once. Parked until rules come from mining sessions rather than rewrites.

### Guides sent by situation

- `V1` **One list, `mods/flow-session/features/triggers/list.ts`, holds every trigger: anything the mod adds for the agent when a situation holds** (`fw-397`, the user 2026-11-03). Each entry names its moment, `on`, and one engine in `features/triggers/engine/` runs each moment: `response.ts` as a response streams, `result.ts` once a tool's result is in or a file is `@` mentioned, `skill.ts` as a skill starts. The functions entries call sit in `checks/` (what a call touches, the files a shell command reads or writes) and `sends/` (the text they build). An entry gets no `$`: the engine hands it plain lookups (`read`, `flow`, `home`, the window), since the mod loader refuses `$` passed to a function it cannot name. Why: 5 files each added text by situation, each with its own matching and its own "already sent?" test, and a new trigger had no one place to go. The edit-log line stays counted per turn, every other trigger per window. Refused (the user 2026-11-03): triggers in each guide's frontmatter, since some checks need code, skills and rule files would carry fields Claude Code does not define, and every read of a guide would carry frontmatter the agent never uses. Refused: scripts written inside frontmatter, a process per tool call and untested.
- `next` **The `response` entries say which guide each situation needs** (`fw-284`, the user 2026-10-25). An entry is `{ id, on: 'response', when(call), send(call), why(call) }`. `when` sees the tool call with its path or command. `send` names the calls to add, and `why` ends the header of their results. What the window holds is the engine's test, run only once an entry matches, so a response that touches no matched file costs no read of the window. One engine runs the list on every tool call, and the first match wins. Why: a script tests anything and sends anything, where `paths:` tests a path alone. A mod's hook runs inside the session, where a hook script starts Node on each call. Refused: `paths:` frontmatter in each guide, which also ties a guide to `.claude/rules/`. Refused: folding the rule checks into the engine, which nothing here needs.
- `next` **A guide arrives as a real call the mod adds to the model's own response, at no extra request.** A `turn.step` hook rewrites the response as it streams. A response that reads a matched file gets a `Read` of each guide added beside it. A response that edits or writes one has that call held back and the guide's `Read` put in its place: nothing on disk changes, and the model writes the edit again with the guide in view. Each added result opens `[Auto] <why>`, and `CLAUDE.md` `flow-added-calls` says what the marker means once: act on the call, never mention it to the user, never count it as your own (the user, 2026-10-26). Why: the model otherwise calls the read its own mistake, and a rule in `CLAUDE.md` reaches subagents too, so each header stays a few words. Why: since 2026-10-01, 29 of 173 turns that edited a loaded file read `style.md`, though `writing-pass` names it, and 57 of 136 sessions that edited a `CLAUDE.md` never read it first. Probed 2026-10-25 (`fw-284` `reports/inject-read.md`): the added call runs, for `Read` and `Bash` alike, is saved inside the model's message, and the next request passes, thinking blocks included. The cache reads the whole earlier prefix, and the same holds in a subagent. Refused: a line naming the guide on the `Read` result and a refusal of the first edit, which cost 1 and 2 or more requests and still left the read to the agent. Refused: a warning after the edit, once the file has changed.
  - `V1` **A held edit holds back every call after it in the response**, named in the header: a test run after the edit would run against the old file. Calls before it run. Where the model reads the guide in that same response, the header goes on the model's own `Read` and nothing is added.
  - `V1` **The header rides as the result's `context`**, read right after the result. A `Read` result cannot open with it: the tool numbers the file's lines, and a line put in front would shift every number. Built and checked 2026-10-25 in 2 Haiku sessions: the added `Read` and `--help` ran, the held `Write` and the `Bash` after it never ran, and the model made both again. In 1 of the 2 the model still listed the added calls as its own.
- `next` **Nothing is added that the window or the response already holds**, whoever made the call: a whole-file `Read` of the guide, or a group's `--help` with its result. The mod reads the window through `$.session.messages`, with the `agentId` for a subagent, so each window and each agent is judged alone and a restart starts over. The restart window loads the guides of each matched file it loads, beside that file. Refused: a list kept in `$.state`, which needs its own reset on each restart and each subagent.
- `next` **4 writing entries, first match wins.** Every `CLAUDE.md`, `CLAUDE.local.md` and `.claude/rules/` file → nothing. Any other file an agent loads (a skill folder, `.claude/commands/`, `.claude/agents/`, Flow's `references/guides/`, a skill's `references/`, Flow's `prompts/`) → nothing. Both entries stay so such a file never falls through to `writing.md` alone: `/flow:write-instructions` covers loaded text, and its guides were attached and unfollowed (`fw-425`, the user 2026-11-08). What would reopen it: real sessions where the skill never fires on a loaded-text change. `docs/spec/` → `writing.md`, `write-spec.md`. A page in `~/.flow/wiki/` → `writing.md`, `wiki.md` (added 2026-11-03, `fw-397`, when `writing.md` lost its list of guides, the only route to `wiki.md`). Any other `.md`, `docs/manual/` included → `writing.md`. Ticket folders take the `ticket` entry instead.
- `V1` **A `code` entry sends `references/guides/write-code.md` at the first `Read`, `Edit` or `Write` of a code file in a window** (`fw-299`, the user 2026-10-27). The guide holds 5 lines on structure and code, for every project. A code file is a source file by its extension (`.ts`, `.js`, `.py`, `.sh` and the like), never a data file such as `.json`. Checked 2026-10-27 in a Haiku session: 2 code files read, the guide added once. Why on a read: planning reads code before it places files, and the guide costs 5 lines once a window. A file not yet written gets it at its first `Write`. Refused: no entry for code, on the grounds that it would fire on every edit; the engine adds a guide once a window, so the cost never was per edit. Refused: a skill, which loads only when the agent chooses it.
- `next` **A `ticket` entry sends `references/guides/write-tickets.md`** on any read or edit of a file under a `tickets/` folder (`docs/spec/tickets.md`). About 90% of sessions open a ticket, so it costs about what a `CLAUDE.md` section does, and a subagent or session that touches no ticket never pays it.
- `next` **A `command` entry sends a group's own help.** The first `Bash` call in a window running `flow notes …`, `flow audit …` or `util <group> …` gets `<group> --help` added beside it. Bare ticket commands get nothing: the rule or step that runs each one names it. Bare `flow` never counts as a group's help. `home/CLAUDE.md` `## Scripts` opens with `flow <group> --help`, names the groups, and keeps the 2 details needed almost every session, `flow start --activity` and `flow new -p home`. Why: the agent must know a command exists before calling it, and only the usage can wait. Refused: sending `docs/manual/commands.md`, written for the user and too long.
- `next` **A `knowledge` entry sends `references/guides/knowledge.md` when the agent adds a skill, a plugin or an MCP server** (`fw-284`, the user 2026-10-26): a `Write` of a `SKILL.md`, an edit of `.mcp.json`, or `claude plugin install`, `claude plugin enable` or `claude mcp add`. A written `SKILL.md` no longer takes the entry (2026-11-08, `fw-425`): it falls to the loaded-file entry, which sends nothing. The entry holds an install command back as an edit is held. It catches what `read-before-adding` in `home/CLAUDE.md` missed: that rule fires when the agent proposes the addition, since a hook sees only the calls made after the plan, and a `Skill` call means the skill is used, never edited (the user, 2026-10-26). A full rewrite of an existing skill brings `knowledge.md` too, since a call cannot tell a new file from an old one; such rewrites are rare, upkeep's "grown by accretion" alone.
- `V1` **An `agent` entry holds an `Agent` call until `references/guides/subagents.md` is read** (`fw-397`, the user 2026-11-03). It replaced `read-subagents-before-dispatch` in `home/CLAUDE.md`, followed in 4 of 12 windows. The header: `[Auto] Your Agent call was held back, so it did not run. Read this guide, then make it again.`
- `never` **A `spec-first` entry, removed 2026-11-03 by the user (`fw-397`, archived in `lab/archive/spec-first-trigger/`): `product.md` is the index of the spec files, not a guide, and no signal says when a change needs it. The session start view already lists the spec files. In the window checked it held one edit and prevented nothing.** As built: it held an `Edit` or `Write` under the Flow repo's `skills/`, `scripts/`, `docs/manual/`, `home/` or `project-template/` until `docs/spec/product.md` was read (`fw-397`, the user 2026-11-03), beside the file's own guides: it is an `also` entry, matched on top of the first match. The repo and the links into it come from session start (`checks/shipped.ts`), so an edit through `~/.claude/skills/flow/` counts, and a whole `Read` of a repo file counts by its repo path. It replaced `read-the-spec-first` in this repo's `CLAUDE.md`, followed in 18 of 129 windows. Costs: the rule's "the spec file of the part you touch" has no entry. A shell write with a relative path is not resolved to the repo.
- `next` **A `skill` entry sends a linked skill's wiki folders** (`docs/spec/skills.md`, `fw-290`).
- `V1` **A `shell-write` entry sends the guides an `Edit` of the same file takes, and holds the call until they are read** (`fw-247`, the user 2026-10-29). It covers a `sed` or `perl` with an in-place flag (`-i`, `-pi`, `--in-place`) at the start of a command segment, and a heredoc or an inline `python`/`node` run whose text writes (`.write(`, `write_text`, `writeFileSync`, `open(..., 'w')`). Its files are the words ending in `.md` or a code extension, and a relative path gets a leading `/` so the entries' folder tests match. A command naming a ticket and a test file brings `write-tickets.md` and `write-code.md`. It sits before `command`, and a write that names no such file falls through. Why: the rule `edit-with-edit` failed 8 times after its first ticket (`fw-195`), and what a shell edit skipped was the guides, not the `Edit` tool. From 2026-10-19 to 2026-10-29 the audit found about 247 shell writes, 54 of them rewriting a ticket file, against 1342 `Edit`s of a `ticket.md`. The rule is archived in `lab/archive/edit-with-edit.md`. A path a script builds from variables is not found, and no guide arrives for it. Refused: a guard that refuses shell edits, since the guard only asks today and a refusal would be its first. Refused: a stricter rule, which already failed 8 times. Refused: a `flow tickets tick` command, since ticks are 27 of the 247 writes.
- `V1` **A shell read sends the guides of each file its output shows, after the result is in** (`fw-397`, the user 2026-11-03). A read is a segment starting with `grep`, `rg`, `cat`, `head`, `tail`, `sed` (never in place), `awk`, `less` or `bat` (`features/triggers/checks/shell-read.ts`, the `shell-read` entry). A grep's file is a path heading its output lines. Where none does, as in a grep of one file or any `cat`, the files are the ones the command names. A listing (`grep -l`, `-c`, `-q`) and an empty output send nothing. Each file takes the guides an `Edit` of it would, so a slice of a guide brings that guide whole. The guides ride the result's `context`, each after `[Auto] Before planning a change to <file>, follow this guide, references/guides/<guide>:`, and the window check counts that line as a read, so a later edit runs. Why: in `07fdc43a` the agent grepped `writing.md` § 6 and proposed rewrites of it with no guide in view, since only `Read`, `Edit` and `Write` matched. Why after the result: the command alone cannot tell a grep that shows a file from one that matches nothing, and a read changes nothing on disk, so nothing needs holding (the user, 2026-11-03). Refused: holding the read until its guides are read, which decides from the command before the result exists. Costs: a word in the pattern of a one-file grep, such as `grep "writing.md" home/CLAUDE.md`, counts as a file too.
- `V1` **Every guide's header names the file and the act**: `[Auto] Before planning a change to rules.md, follow this guide.` (the user 2026-11-03, `fw-397`). Why: a guide loaded with no instruction is read as context, and the act it guards gets no line. Replaced `Guide for spec files.` and the like, which said why the guide came and never what to do.
- `V1` **Every firing is one line in `~/.flow/logs/triggers/<year>-<month>.jsonl`** (`fw-397`, the user 2026-11-03, `features/triggers/log.ts`): `at`, `session`, `turn` (the user's prompts so far), `agent` for a subagent, the entry `id`, `by`, the `file` or command, what was `sent`, a chat `score`, and `error` where the send broke. `by` is `held` (a call held back, a miss by definition), `beside` (a guide added beside the matching call), `result`, `mention`, `skill` or `chat`. Each engine writes its own lines in the background, so a lost line delays nothing. Why: a guide never loaded was found only when the user noticed, and `/flow:audit` had no record of what the mod sent. Costs: a held call is dropped from the transcript, so the log alone holds it.
- `never` **A mod command that checks, with no model request, whether each trigger fired in time** (`fw-397`, built and dropped 2026-11-03, archived in `lab/archive/triggers-check-mod/`). Why refused: it reports only the misses its own checks recognize (a held call, an edit with a guide never in the window), so a guide that should have loaded during a discussion, and never did, stays invisible: the miss the check exists to find (the user 2026-11-03). Replaced by `/flow:triggers-check` (`docs/spec/skills.md`), where the agent reads the transcript and judges each moment a file change came up. Kept from the build, for that skill: text a hook adds to a tool result is its own `attachment` row in the transcript (`hook_additional_context`), never inside the `tool_result`, and a held call is dropped from the transcript, so the load log alone holds it.
- `V1` **The chat score attaches a file's guides before any call touches it** (`fw-397`, the user 2026-11-03, `features/triggers/checks/chat.ts`, run by `engine/message.ts` on each message the user types). It scores each file the last 3 turns name, the user's words and the agent's text alike, each turn back counting half the one after it: 3 for a file named, 2 more where the same message holds a word of change (edit, rewrite, write, create, build…, never one inside a file name such as `writing.md` or `edit-log/`: write, create, build and implement added 2026-11-04 after `/flow:triggers-check` found "write the file" scoring 3), and 5 to `CLAUDE.md` for a reply drafting a rule line (``- **`an-id`** …``). At 5 the guides an `Edit` of the file takes are attached beside the message, each after the line a shell read's attachment uses, so the window counts them as read, once per window. Why: a held edit catches only a miss followed by an edit, and in `07fdc43a` the rewrites were proposed in chat with no call made. Why never on one signal: a file named in passing is no plan to change it (the user 2026-11-03). The weights start conservative, to be tuned from past sessions through `/flow:audit` (`fw-397` `## Tasks`). The signals are one set for every file, and the file's own entry in `list.ts` picks its guides. Refused: a small model judging each message, which costs seconds per message and can only block a prompt hook, never add to it.

### Changes to a loaded file

A loaded file is one that enters an agent's context: a rule file, a skill and its references, a guide, a prompt. A change to one leaves an entry in a log kept in this repo, so a removed or reworded rule can be restored (`fw-338`, the user 2026-10-30; reshaped in `fw-341`, the user 2026-11-01). An entry:

````md
## 2026-11-01 · `agreed` · rewrite
Ticket: fw-341
Why: a hedge on a proposal was read as pushback, and the user asked for hedges to count as agreement.
Was:
```md
- **`agreed`** Everything you proposed that drew no pushback. Pushback: an objection, or another solution to the same problem.
```
````

- `V1` **A change of approach in a markdown file Flow ships is logged**: a rule that now has the agent act otherwise, by a decision, and every removal. A rename, a rewording and a line a release made true, such as a tool's new option, get no entry (the user 2026-11-01): they hold no decision anyone would restore. Refused: an entry for every edit, which buried the decisions under renames and release notes. The files watched are `home/`, `project-template/`, `references/guides/`, `prompts/` and `skills/`, reached by the repo path or through a link (`~/.flow/references/guides/`, `~/.claude/skills/flow/skills/`), which the mod reads at session start (`features/triggers/checks/shipped.ts`). The live copies in `~/.flow` and `~/.claude` get no log, since they follow the templates (`home-files-exist-twice`). This repo's own `CLAUDE.md` gets none: it ships nowhere (the user, 2026-11-07). Why: a removed chunk had no single home. It went to `lab/archive/` with a `README.md` line, to the one dated snapshot (`lab/archive/global-rules/CLAUDE-2026-10-17.md`), or to a commit among the batches of `~/.flow` (`pc-wsl: 13 files`) that hold no reason. Refused: a log in `~/.flow`, which would cover the live copies.
- `V1` **One log per logged file, its path mirrored under `lab/edit-log/` with `.log.md` added**: `home/CLAUDE.md` logs to `lab/edit-log/home/CLAUDE.md.log.md`. Why: one log per file shows which file changed, and 3 files are named `CLAUDE.md` and many `SKILL.md` (the user 2026-11-01). The suffix keeps a log from being named `CLAUDE.md`, which Claude Code would load as rules. Refused: one file per month, which hides which file changed (the user 2026-10-29). Refused: one log for every file (the user 2026-11-01). A renamed file moves its log, and a retired file keeps its log.
- `V1` **The agent writes the entry, one per rule or section changed in a turn**: the rule id where the file has ids, else the heading. Several edits of one rule in a turn are one entry. Newest last. The fields are in `references/guides/edit-log.md`: the date, the rule, `add`, `rewrite` or `remove`, the ticket, `Why` and `Was`.
- `V1` **`Was` holds the whole rule or section before the turn, verbatim**, for a rewrite or a remove. Why: restoring a rule from `git log -p` means searching every commit of a file that changes often (the user 2026-11-01). The new text is in the file, so no `Now`.
- `V1` **The mod only reminds.** The turn's first landed `Edit` or `Write` of a logged file gets one line on its result: `[Auto] home/CLAUDE.md is logged: a change of approach gets an entry in <log>, as ~/.flow/references/guides/edit-log.md says.` The edit runs as it would, never held back. Why: the agent can write the entry after the edit lands, and the log will cover every change later, code included, where a mod's copy of the text fits nothing (the user 2026-11-01). The line works from any project, and the guide names no `lab/` path. Refused, built and dropped the same day: the mod diffing each edit and writing `Was`, `Now`, `Together with` and an id itself, the agent filling `Why`; and `references/guides/edit-log.md` sent by a guide entry, which held the first edit back until the guide was read.
- `never` **A `Trial:` line on a change under test, swept by `/flow:upkeep`**, and a `Read` of a logged file listing its open trials. Built 2026-11-01, refused 2026-11-05 (the user, `fw-425`): upkeep rarely runs, so the lines piled up unswept, as findings did. A change that fails shows when its fault returns, and gets a ticket. Refused earlier (the user 2026-11-01): `Mode: final` or `trial` on every entry and a `Verdict` of `kept` or `restored`.
- `never` **A ticket, a `fw-294` line, a `flow doctor` line, a result line listing open trials, or a copy of the file with a link switch, per trial.** The user asked for the simplest path (2026-10-30): a sweep of the logs is the measurement. The copy-and-link switch was drafted 2026-10-25 and replaced by this log.
- `later` **Every change logged, not only markdown**: features added and removed, code included, in the same logs (the user 2026-11-01). Waits until the workflow settles.
- `later` **An edit made from the shell (`sed -i`, a script) is reminded too.** Today only `Edit` and `Write` are, and `fw-294` counts the rest from `git log`.

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
- `later` **A check that the agent read a file before writing**, from the session's transcript with the place already scanned remembered, or as an entry in `features/triggers/list.ts`. The old reason against a hook on `Read`, Node starting on each call, does not hold for a mod's hook (`### Guides sent by situation`).

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
- **`references/guides/writing.md`**: the rules for everything Flow writes, sent before any markdown change.
- **`skills/work/write-instructions/`**: how a rule file, a skill or any loaded text is written, with `references/shapes.md`.
- **`mods/flow-session/features/triggers/list.ts`**: every trigger. `engine/response.ts` plans what to hold and add on `turn.step`, `engine/result.ts` adds to results, `engine/skill.ts` to a skill's text, and `features/restart/window.ts` reads the guide entries for the restart's files. `docs/manual/guides.md` shows every header.
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
