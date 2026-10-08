# Rules

How Flow tells the agent how to work, and how it finds out whether the agent listened. A rule is one instruction in a file Claude Code loads, with an id of its own. A rule check is a small script that reads an edit before it lands and says whether one rule was followed. `flow scorecard` adds up what the checks recorded across every session.

## Scope

- **In**: the rule files and what each holds, how a rule is written, the rule checks and their hooks, the scorecard, and the open questions about rules.
- **Out**: writing the rule file at install and carrying the user's lines through an update, in `docs/spec/setup.md`. Where capture sends a lesson, and how `/flow:file-findings` routes it, in `docs/spec/knowledge-base.md`. The reminder line beside every message, the audit and study cases, in `docs/spec/product.md`.

## A rule meets an edit

What happens each time the agent edits or writes a file:

```text
    an Edit or a Write, about to land
                │
                │  the path, the text the edit adds
                ▼
  ┌─────────────────────────┐
  │      rule-check.js      │ ◄─ from flow scorecard ─┐
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
  │     flow scorecard      │ ── to rule-check.js ────┘
  │                         │    a check moved up
  │  the 4 lists            │    one tier, by hand
  └─────────────────────────┘
```

## Behaviors

### The rule files

- `V1` **One rule file every session loads: `~/.flow/CLAUDE.md`**, the copy `flow sync` carries, with `~/.claude/CLAUDE.md` a link to it. Ruled by the user 2026-10-08: Flow ships for Claude Code alone, so the machine keeps one `CLAUDE.md`, as a project does, and `AGENTS.md` comes back only once Flow supports another agent. A rule sending the agent to write into the file names `~/.flow/CLAUDE.md`, since the Edit tool refuses to write through a link. The file is `home/CLAUDE.md` plus the user's 2 sections, `## The user` and `## Preferences`. Its sections, in order: `## The turn`, `## Reading`, `## Writing files`, `## Tools`, `## When something breaks`, `## Workflow`, `## The user`, `## Preferences`, `## Capture`, `## Scripts`, `## Judgment`, `## The reply`.
- `V1` **A project's rule file is its `CLAUDE.md`, and Flow writes no `AGENTS.md` in a project.** The template gives it 2 sections, `## Project` and `## Rules`, each a placeholder comment. The agent decides what else it holds, the user's call 2026-09-30. Ruled by the user 2026-10-08: Flow ships for Claude Code alone, and Codex, Cursor and others treat `AGENTS.md` as their own file and write into it. A root `AGENTS.md` belongs to those agents, and Claude skips it wherever a `CLAUDE.md` exists. A later Codex port renames the file (`.flow/research/models.md`). Reasons in `fw-80`'s `groundwork/map.md` → `## 6`.
- `never` **The machine's rules in `~/.agents/AGENTS.md`, imported by `~/.claude/CLAUDE.md`**, the layout until 2026-10-08: 2 files for one set of rules, so another agent could read them. Flow supports no other agent yet.
- `never` **A project's rules in `AGENTS.md`, imported by `CLAUDE.md`**, the layout until 2026-10-08: it let Codex read Flow's rules, and let Codex write into them. No setting blocks every agent's edits, since every agent runs as the user's account.
- `never` **A project's rules in `.agents/AGENTS.md`, imported by `CLAUDE.md`**, proposed 2026-10-08 because Codex never reads that path and its sandbox cannot write it. `CLAUDE.md` alone does the same job with 1 file and no import.
- `V1` **`claude/rules/comments.md` holds the comment rules**, 13 of them, loaded only for JS, TS, Python, shell, SQL and CSS files through `paths:`. The user ruled comment shape minor.
- `V1` **One rule set for every model.** No model detection and no rule written for one model. A rule that works on any model is what makes the default-action rule below required.
- `V1` **Stack content lives in a domain skill, never in a rule file with `paths:`.** Set by the user 2026-09-10, rejecting a `rules/typescript.md`.
- `V1` **Block-level HTML comments cost nothing**: Claude Code strips them before a `CLAUDE.md` enters context, so placeholder comments in a template are free.
- `later` **Rules that repeat Claude Code's own system prompt, cut.** `home/CLAUDE.md` costs about 3,600 tokens a session, and a rule the built-in prompt already gives adds nothing. `batch-calls` was one, found by hand 2026-09-29. `repos/tools/claude-code-system-prompts/` holds the prompt for every release.
- `later` **Flow's rules in Cowork desktop sessions.** Those sessions skip a rule file linked from outside the working folder and an import pointing outside it, and `~/.claude/CLAUDE.md` always is one. Terminal and IDE sessions load both.
- `later` **A rule on adding a dependency**: a check before one is added, and how a bulk version bump is reviewed.

### Writing a rule

- `V1` **Every rule in a loaded file carries an id**: lowercase words joined by dashes, in a bold code span at its start. `- **`no-git-mutations`** Never run a git command that writes.` The id states the rule, and the body says only what the id cannot.
- `V1` **A heading's id is its text as a slug**, `## The turn` → `the-turn`. Ids are unique inside one file, sections and rules together. A heading whose slug reads badly gets renamed.
- `V1` **A rule file is written by `references/style.md` plus `references/write-rules.md`**, and any file an agent loads also by `references/cut-loaded-files.md`. `home/CLAUDE.md` → `writing-pass` sends the agent there.
- `V1` **A rule is direct.** It states the rule, with no argument for it and no consequence the reader works out alone. A command is one line to run, then what it prints. A limit is a number. An override is read where it is written. The reader is intelligent. Set by the user 2026-09-07, line by line on a rewrite of `home/CLAUDE.md`.
- `V1` **Every rule states the action to take, never only what is forbidden.** A rule written only as a ban leaves the agent one direction under doubt, not acting. On an eager model that corrects it. On a cautious one it compounds, which is what the user saw on Sonnet 4.6. Locked 2026-09-05.
- `V1` **A failure to act gets structure, not another rule.** One ordered section, `## The turn`, closed 6 kinds of failure in a day. 20 rules in a flat list closed none in 6 weeks.
- `V1` **A rule claims only the ground it covers.** "Every file gets the writing pass" read as a rule over code, so it became "Every markdown file gets it".
- `V1` **A pointer into a rule file is an anchor**: `~/.flow/CLAUDE.md#preferences`, never "`## Preferences` in `~/.flow/CLAUDE.md`".
- `V1` **A rule no script can check gets the reminder line**, in `docs/spec/product.md` → `### Hooks and guardrails`. What decides its shape is what the agent still reads on turn 15, never its cost: 40 lines over 20 turns is under 1,000 tokens.
- `later` **Every rule sorted into 2 kinds**: a ban where the agent breaks the rule under pressure, a step-by-step recipe where the output comes out the wrong shape. Open: whether `style.md`'s "Write an action positive. Write a boundary negative." already settles it.
- `later` **The same rule keeping one id across `home/CLAUDE.md` and a project's file**, so `flow scorecard` counts it once. Parked until rules come from mining sessions rather than rewrites.

### Rule checks

- `V1` **One `PreToolUse` hook on `Edit|Write` runs every check**, `rule-check.js`. Counting, warning and blocking are the same check at the same moment, and the check's own `tier` decides which happens. About 31 ms an edit, nearly all of it Node starting, measured 2026-09-10.
- `V1` **3 tiers.** `measure` counts and interrupts nothing. `warn` hands the agent a message and lets the edit through. `block` refuses the edit, kept for a check with no false positives.
- `V1` **One file per check, `scripts/rule-checks/<id>.js`, named for the rule's id.** The folder is the list: adding a check adds a file, and promoting one changes one word. A check is any JavaScript function, never only a pattern.
- `V1` **A rule and its check are written in the same pass**, by whichever pass wrote the rule, usually `/flow:file-findings`. Every check starts at `measure`, so one built from a single example costs nothing when it proves wrong. Set by the user 2026-09-05.
- `V1` **A path-scoped rule that matters starts at `warn`.** `paths:` loads a rule when a matching file is read, never when one is written, so a brand-new file is written without it. Filed as `anthropics/claude-code` #93248.
- `V1` **A warning carries the rule's id where its file is loaded, and its whole text where not.** `instructions-loaded.js` records each rule file as it enters context, on the `InstructionsLoaded` event.
- `V1` **A warning reaches the agent through `additionalContext`.** `permissionDecisionReason` on an allow reaches the terminal alone.
- `V1` **The hook never allows, and a failure inside it lets the edit through silently.** It cannot widen what the permissions allow. Breaking every edit over one bad check costs more than the counts are worth.
- `V1` **A rule the user called minor stays at `measure`**, whatever the counts say. Comment shape is the case.
- `V1` **A wrong warning goes to `.flow/findings/scorecard.md`**, which `/flow:file-findings` reads. A wrong check gets fixed. A rule too vague for any check gets rewritten.
- `V1` **About 10 checks before V1**, chosen from rules real sessions break, where a script can decide from the edit alone: `fw-12`. Today there is one, `js-and-ts.js`, counting a run of `//` lines above a function. The checks stay, ruled by the user 2026-10-01: they are a major feature, and one check says nothing about its worth.
- `later` **A project's own checks, in `.flow/checks/<id>.js`**, loaded beside the global ones. Skipped 2026-09-07: no project needs one, and a mechanism built before its first case gets built wrong.
- `later` **A linter as a check**: ESLint, ruff or shellcheck run by a check and filed under a Flow rule id, or Flow writing linter settings from its rules. Flow reads a linter a project already has, and adding one stays the user's call.
- `later` **A sweep of the whole tree against every rule, ending in one report.** The hook sees one edit's added text. The open problem: every check judges new text, and handing one a file older than its rule turns a clean tree into thousands of findings.
- `later` **Conduct rules scored, not only reminded.** `MessageDisplay` streams the reply with a turn id, `PreToolUse` carries the prompt id, and `Stop` sees the last reply and can block. Reading a reply against the edits of the same turn would make `the-turn` and `the-reply` checkable. A script where it can decide, a model call where it cannot.
- `later` **A warning when a reply says "done" with no test run since the last edit**, from the `Stop` hook. Never a block.
- `later` **A check that the agent read a file before writing**, from the session's transcript with the place already scanned remembered. No second hook on `Read`, which fires far more often than `Edit`.

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
- **`claude/rules/comments.md`**: the comment rules, linked into `~/.claude/rules/` by `flow install`.
- **`references/style.md`, `write-rules.md`, `cut-loaded-files.md`**: how a rule file is written.
- **`scripts/hooks/rule-check.js`**: the wiring. **`scripts/lib/checks/judge.js`** judges the edit, and **`checks.js`** loads the checks and reads a rule's text out of its file.
- **`scripts/hooks/instructions-loaded.js`**: records each rule file loaded.
- **`scripts/lib/checks/scorecard.js`**: the per-session files.
- **`scripts/rule-checks/`**: one file per check.
- **`scripts/commands/scorecard.js`**: `flow scorecard`.
- **`skills/tools/file-findings/references/write-checks.md`**: how a check is written, tested and promoted.

## What passes between them

A check file, the one there is:

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

1. `/flow:file-findings` turns a finding into a rule in `home/CLAUDE.md` and writes its check, `scripts/rule-checks/<id>.js`, at `measure`, with a test holding one real violation and one clean example.
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

- **`js-and-ts.js` fired correctly in a live session** on 2026-09-10.
- **A warning carrying a rule's whole text reaches a live session.** Not yet: unit-tested only, and no `warn` check exists.
- **A rule filed changes what the agent does**: the same rejected reply does not come back once its rule lands. Not yet shown. The 3 study cases of 2026-09-06 were marked fixed the day `## The turn` was written from them, so fixed records a rule written, never a rule that worked.
- **About 10 checks recording across real sessions**, and `flow scorecard` naming at least one ready to move up: `fw-12`.

## What is locked

- **One hook and one script for every check, the tier on the check.** No hook per rule, and no second script that only warns.
- **A check starts at `measure`.** Waiting for more examples before writing a check leaves the rule unmeasured for exactly as long as the wait.
- **Injecting a rule's text beats telling the agent to go read it**: no extra turn, and no chance the read is skipped.
- **Global checks only.** A project's checks wait for the first project that needs one.
- **The rule checks stay**, ruled by the user 2026-10-01.
  - Refused: removing `rule-check.js`, `instructions-loaded.js`, `flow scorecard` and the one check, proposed in the final sweep since only one check existed and it only counted.
- **No per-model rules.** A base set plus an overlay per model waits for measurement to earn it: `docs/spec/product.md` → `## Bets`.
