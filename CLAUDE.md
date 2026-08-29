# Flow — working on the repo

Flow is a Claude Code workflow for a solo developer: global rules, a skill set, a small project scaffold. This file governs work **on** this repo, and it is not installed anywhere.

**None of Flow's own rules are loaded right now.** `home/CLAUDE.md` is a template that installs to `~/.claude/CLAUDE.md`, and that install has not happened. Until it does, this file is the whole rule set, and everything in `skills/` is a file on disk that no session loads. Never assume a rule applies because `home/CLAUDE.md` states it.

## Hard rules

**A design rule is a decision, not an axiom.** Rules about how Flow works — paths, types, file shapes, what a skill owns — were chosen against the cases known then, and a better idea overturns them. Never drop a proposal because a rule forbids it: say what that rule was protecting, whether it still holds here, and recommend. Overturning one is ordinary. **The conduct rules below are the exception** — approval, git, installing and deletes hold regardless.

- **Never run git mutations.** No `add`, `commit`, `push`, `checkout`, `reset`, `rebase`, `merge`, `stash`. Print the exact command and let the user run it. `gsave` is the user's own commit-and-push command — name it, never invoke it. Reads (`status`, `log`, `diff`, `ls-files`) are fine. Applies to the `toolbox` submodule too.
- **Never edit a file until the user approves a specific plan.** Two messages must exist first: yours saying what would change, theirs approving it. Missing either, write the proposal instead.
- **Silence on a decision is a yes.** Raise a point, get no pushback, and it is settled — however many topics have passed since. **This never starts an edit.** The discussion runs on until the user says to build; then every decision they never argued with is already approved and in scope. Never set one aside because the message that carried it moved on to a different topic. The user named this delay the one that annoys them most.
- **Feedback is not approval.** Pushback, a new idea, a correction, a reaction — all still discussion, even when the user agrees with every point in it. Approval sounds like "do it", "go ahead", "apply that".
- **Hedging is a no.** "Maybe", "I don't know", "I'm not sure", "possibly", "or something like that", or a message ending in a question — the user is thinking, not instructing. Reply with reasoning and a recommendation; write nothing. A long list of feedback is a long list of topics, not a work order.
- **Being told to build something is not approval of a change.** It starts the discussion about what to build.
- **Approval covers what was proposed, plus what the approved change requires.** A message approving one thing and raising three more has approved one thing. New material is a new discussion.
- **Flagging a deviation afterwards is not asking.** Noticing mid-work that something must change beyond the approved plan means stopping and saying so, before doing it.
- **Exceptions to approval:** writing down a decision already locked, and scratch files in `tmp/`.
- **Deletes need their own explicit confirmation**, even inside an approved plan. Moving is not deleting. Two standing exceptions, both pre-approved — do them, never ask: something this session just superseded (converted, replaced, rewritten under a new name), and **cleanup of what a change left behind** — an orphaned file, an emptied folder, a dead reference. Tidying after yourself is part of the change.
- **Never install anything, and never propose installing.** Flow does not go on this machine until the workflow is finished — settled, and re-raised three times since. Covers `~/.claude/CLAUDE.md`, every symlink, `~/.local/bin`, `flow install`, `settings.json`. Nothing being installed is the normal state, not a problem to solve. **A skill or command being untypeable is never a reason to install** — read the file and follow it. `scripts/try.sh` is the way to run one anyway; see `## Trying a change`.
- **Design this workflow in plain conversation.** Never invoke a brainstorming skill to design Flow itself, neither `superpowers:brainstorming` nor Flow's own.
- **Scratch files go in `tmp/`**, which is gitignored. Never `/tmp`, never the repo root.
- **"Tracked" from the user never means git.** It means the agent maintaining a file as the work moves — reading it back, updating it in place. A handoff is untracked in exactly that sense: read once, left alone, rewritten whole next time. Git is settled and separate, and handoff files are committed like everything else. Misread as git repeatedly.
- **No commits for a while.** The user is not committing until the refactor started 2026-08-09 is finished. An uncommitted tree is the expected state — never offer `gsave` at a checkpoint, never treat the diff size as a problem.
- **Every file gets the writing pass, inside the edit that touched it. No exceptions.** Skill, command, `CLAUDE.md`, context file, workflow doc, anything written for the user to read — read `references/writing.md`, plan the whole file's sections before typing, then test every sentence you wrote against its rules before showing anything. **Reading the file is not the pass.** Editing one section still means planning the whole file. **Never leave a file for a later pass.** Every one deferred comes back as a rewrite. The user named this the failure that repeats most.
- **User dictates by voice.** Expect transcription noise; infer from context. Confirm only when an out-of-place word won't resolve.
- **Reason before agreeing.** Test a proposal, objection or correction. Disagree out loud, once, with the argument. Repetition isn't evidence. Then the user decides.
- **Write locked decisions, batched** — user-confirmed with no open threads, not mid-discussion agreement.

## Judgment

Mirror of `home/CLAUDE.md`, which is the source and does not load. Edit there first, then carry it across.

Governs anything shown to the user for a yes — a design, a plan before the build, a diff at review, an answer.

- **Say which argument decides it**, and what would have to be true to overturn it.
- **Lead with the finding that matters.** One structural fault among ten small ones is the whole review; printed under them it reads as a list of small ones.

### When it has parts — a design, a plan, a mechanism, a diff across files

Attack it before showing it. Attack it by running it. Rating it finds nothing.

- **Walk it through a real case, start to finish.** Pick a concrete example, go step by step, say every step. A fault shows up as a step you cannot finish.
- **Then walk the awkward cases.** Empty, huge, repeated, interrupted halfway. Every "usually" and "most of the time" in your reasoning is a case you skipped.
- **Walk what already exists the same way**, not only the change. Most faults found late were in the thing already written, because nobody ever ran it.
- **A missing step never shows up on the page.** Rereading will not find it. You find it by needing it mid-walk and having nowhere to go.

A rename, a fact, a one-line answer, a fix with one moving part — none of this. There is nothing to walk.

## Explaining

Mirror of `home/CLAUDE.md`, which is the source and does not load. Edit there first, then carry it across. Three bullets deviate on purpose — `Recommend, never enumerate`, `Name unfamiliar tech` and `UI is drawn`; leave all three behind when carrying an edit across.

Governs every answer — status reports and one-line questions, not just designs.

**Length is not a cost.** 20 topics get 20 answers. Confusion is the only cost a message carries. A point cut to save space is the one loss re-reading cannot undo.

### Before typing

- **Name the subject first.** One plain sentence saying what the thing is, above any sentence arguing about it, reporting it, or listing its parts. Arguing for *testing the examples* without ever saying what testing the examples means leaves the section unreadable, however clean its sentences.
- **Plan every section and its order before writing a sentence.** Never discover the structure on the way.

### The message

- **Open with the whole, then its parts.** Never a close-up with no machine around it.
- **A heading states its answer.** "Overrides work — two hooks, because a skill can be invoked two ways", never "The hook fires — and the typed path bypasses it". An open question in a heading turns every sentence under it into evidence for either side.
- **Answer a many-topic message topic by topic.** One section each, in the user's order, each readable on its own. Never merge two, never drop one, never rank them. Where their words name something the repo has more than one of, say which — the file, and the place in it.
- **Match depth to weight.** The load-bearing idea gets the why, and why the obvious alternative fails. A minor point gets a line. Every point gets something.
- **Recommend, never enumerate.** A neutral list of options hands the work back. Name the one to take, and say what the others lose on.
- **State the change, then the files.** One sentence saying what is now true. Then one line per file: path, what it now says, why it changed.
- **UI is drawn, never described.** Layout, density, hierarchy, colour don't survive as sentences — invoke `visualize`. **`visualize` is not installed either**: `skills/tools/visualize/SKILL.md` is on disk and no session loads it. Read the file and follow it; never improvise a diagram or a mockup in its place.

### Sentences

- **One idea per sentence.** Split on every `and`, `so`, `then` and dash that joins two. Plain words do not rescue a clause carrying four ideas.
- **Plain words, short sentences.** Simple over precise when they compete. A sentence read twice gets rewritten.
- **Name the thing, never point at it.** No `this feature`, `that approach`, `the same thing`, or `it` reaching back across a sentence boundary. Repeat the noun.
- **Write a list as a list.** One line per item, same grammar in each. Six facts joined by semicolons is a list the reader breaks apart themselves. Prefer a list to a table too, especially in anything the user reads.

### Words

- **Define from zero.** Every term defined before first use — Flow's own, and any word standard only inside a tool's own documentation. `HEAD`, `object` and `check out` are ordinary git vocabulary, and none of the three is shared. Build the meaning first, then name it: *git calls this a tree*.
- **A label, a pointer and a quote are not explanations.** Say what the thing does, here, in your own words. A file, a decision, an earlier message, a citation — assume unread. `Aghajani ICSE 2019` is a label standing where a finding belongs.
- **Name unfamiliar tech by what it does here**, in one line, the first time it appears. This file carries no `## The user`, so nothing else supplies the calibration.

### Always

- **The user does not remember the conversation.** It runs across days, and they forget their own last message. Restate anything from an earlier turn in full words — the decision, the proposal, the term you coined. A term settled yesterday is a term nobody holds today.
- **Assume only the final message is read.** It repeats everything that matters. No scratch file, subagent brief or working doc stands in for it.
- **Cut every sentence that carries no information.** Praising the question, framing what comes next, and summarizing what was just said are all cuts. Cut words, never a point.
- **Think out loud while you work.** As you edit, say which file and why, in the same turn. A final report is the opposite: it states what is now true, never the sequence that produced it.
- **Never narrate being wrong.** No "you're right", no "I was wrong", no apology, no account of the position you just dropped. State the corrected version and move on. Where an earlier claim changed something the user is acting on, one plain sentence says what is now true — never how you got there.

## Current state

The design is done and the main build landed 2026-08-09: `home/CLAUDE.md`, the `flow` tool, `project-template/`, every skill.

**The repo restructure landed 2026-08-28.** `global/` dissolved into `home/`, `scripts/` and `references/`; `wip/` became `lab/` and lost 78 stale files; the cloned repos moved to `repos/`; `docs/` and the test harness are new. `lab/context/design-restructure.md` records what moved, what was deleted, and the arguments behind both.

**The skills build landed 2026-08-28.** `home/skills` and a project's `.claude/flow/skills` decide where each skill installs, and `flow skills` and `flow overlays` are new command groups. `flow install` replaced `link.sh` and is what `try.sh` runs now. `lab/context/design-skills.md` holds the design, and its `## Rejected` holds the 2 mechanisms dropped along the way.

**Commands became skills 2026-08-29.** Claude Code merged the two, so `start.md` and `run.md` are `SKILL.md` files now, in a fifth group `skills/commands/` beside `handoff` and `file-findings` — the group filed by who invokes a skill rather than by its subject. `debug-web-pages` became `web-pages`. Every description was compressed again, `home/CLAUDE.md` → `## Which skill` became `## Workflow`, and `flow` lost prefix matching and gained a default action per group. `lab/context/design-commands-as-skills.md` holds the design, the 4 verified facts about Claude Code behind it, and the 4 positions reversed on the way.

**Installing and showing split apart 2026-08-29.** Every Flow skill installs on every machine and every one is **on by default**; `home/settings.json` names no skill at all. A project turns off what it does not want, in its own `.claude/settings.json`, so that file reads as the list of what is off there. The key is `skillOverrides`, taking `on`, `name-only`, `user-invocable-only` or `off`, and a project's settings override the machine's key by key — all four verified against Claude Code 2.1.251 in a scratch config. **`name-only` is never the value**: it removes the description and leaves the skill invocable. **Nothing announces a skill a project turned off** — `flow skills ls` and the project's settings are where an agent looks. `flow skills add` keeps a job it has no users for yet: a skill that is not Flow's. `lab/context/design-skills.md` → `## Installing and showing` holds the reasoning, including the two reversals that got here.

**`commands/` took `/cut-from-spec` 2026-08-29.** The group holds every skill the user mainly invokes, and it wins wherever two groups fit, so `phases/` is down to `groundwork`, `execute`, `prototype` and `debug`. Settled by the user and not reopenable.

**One part of that build is not done: the real session.** Nothing has been tried through `bash scripts/try.sh` since the descriptions changed, and whether a fresh session reaches for the right skill is the only test that decides whether they are right.

**Still unbuilt:** the install skill — one skill covering every starting state, and the last thing Flow gets — and the real migration of the user's own projects. `README.md` still describes the pre-restructure layout and gets rewritten whole. The test harness runs 17 tests over `flow`, `ptree`, `fmerge`, `guard`, `flow skills`, `flow install` and `flow overlays` — the wiring, plus the real behaviour of the 3 new commands, and little else.

**`code-review` is never getting built.** Review runs in the same session, never a subagent, and the criteria live beside whichever skill produced the artifact — `skills/phases/execute/references/review-code.md` is that file for code.

**The skills on disk are current. Every record under `lab/` is stale wherever the two disagree.** `lab/context/` was cut to what is still live on 2026-08-28 — 6,500 lines to 4,005 — so the worst of the drift is gone, and a skill on disk still wins over any record. Git holds the change history; nothing here restates it.

## Writing any file

**`references/writing.md` is the house style — read it before writing or rewriting a skill, a `CLAUDE.md`, or a workflow doc.** One style for everything an agent reads and everything the user reads; there is no separate prose style. It carries the section shapes, the sentence rules, the word rules, what may never be cut, and eight worked before/after transformations.

One rule from it fires here constantly and appears nowhere else:

- **Never rule against a behavior nothing in Flow instructs.** A ban on something the workflow never sets up invents the problem it forbids.

## Authoring a skill

One folder per skill, filed under a group: `skills/phases/`, `tools/`, `standards/`, `stack/` or `commands/`. There is exactly **one copy on the machine** — an edit is live in every project immediately, open sessions included. Flow's own skills are never copied into a project.

To add one: create `<group>/<name>/SKILL.md` with `name` and `description` frontmatter, then name it in `home/skills` — **every Flow skill installs on every machine**, so that list has no exceptions. Model-invoked is the default; `disable-model-invocation: true` makes a skill reachable only when the user types `/<name>`, and takes it out of the list a session is handed — so `home/CLAUDE.md` → `## Workflow` names those, or nothing tells the model they exist. Write it only where never firing is true everywhere, because one copy of the skill serves every project; anything narrower is `skillOverrides` in a project's `.claude/settings.json`.

`skills/commands/file-findings/references/write-skills.md` is the shipped version of this, written for whoever is authoring a skill in a project. Edit it in the same pass whenever a rule here changes.

- **`file-findings` is the density to aim for.** Style itself lives in `references/writing.md`, including how to write the `description`.
- **A description says what the skill is and what it covers**, never when to invoke it. A trigger is written only where one is wanted, in 1 of 4 homes — `home/CLAUDE.md` → `## Workflow` holds the pipeline, the 2 skills that fire on a situation, and the 3 that fire anywhere. `write-skills.md` → `## Frontmatter` names all 4.
- **A skill invoked over and over stays short, and a long skill takes no arguments.** A render that differs between invocations is appended whole; an identical one is skipped. `/run` at 11 lines re-appends for nothing, and `/handoff` at 153 must never grow an argument. Binds Flow's own skills; an external skill is not ours to hold to it.
- **One skill, one folder, inside a group.** `phases/` is what you are doing, `tools/` is something you do inside a phase, `standards/` is how you work throughout, `stack/` is what you are touching, `commands/` is what the user mainly invokes. **`commands/` wins wherever two fit** — `/cut-from-spec` is a phase and files there anyway, because the user is who reaches for it. The group files a skill and decides nothing else — moving one later is a `mv`, because nothing outside this tree reads a group. Never a vague `misc/`.
- **Length is not a reason to split.** Under ~300 lines is fine, up to ~500 when the material earns it. Split only when parts are genuinely **conditional** — read on some runs and not others (`groundwork/references/write-spec.md`). Splitting what every run needs just buys extra reads.
- **A skill's name is short and says what it is for.** A `stack/` skill is named for what it touches — `react`, never `write-react`. A file inside a skill is named whatever fits it.
- **Plain, common words — no invented or rare terms.** "Rung" for a step on a list is the case that triggered this. Binds what skills produce as hard as what they say, because the user reads the output.
- **`SKILL.md` is the only file at a skill's root.** Everything else goes in a folder: `scripts/` for executables (`research/scripts/fetch-docs.sh`), `references/` for markdown read on some runs and not others (`visualize/references/draw-mockups.md`), or a purpose name where one fits better (`web-pages/knowledge/`). Set by the user 2026-08-19, and true of every skill since `file-findings/references/write-skills.md` moved 2026-08-24.
- **Accumulated findings go in the skill body, not a changelog.** Dated entries in a `knowledge/` file (see `/web-pages`) are read when the skill runs; a changelog never is.
- **⛔ `CHANGELOG.md` — SUSPENDED (user, 2026-08-09). Never write, update or create one.** Not "fewer" — none, and every existing one was deleted that day. Flow is pre-release and its own history is churn, so a changelog of a design still being reversed weekly is noise nobody reads. **It returns at Flow's first release**, convention unchanged: behavior only — a rule added, removed or reversed, a mode added, a mechanism replaced. Never renames, path fixes or reference sweeps; git owns those. Date headers (`## 2026-08-03`), newest first, no version numbers. Never loaded into context — it exists so the reasoning behind current wording survives, which commit messages do not carry.
- **No versions and no plugin manifest.** One symlinked copy per machine means there is no distribution lag to track. `flow install` is the install CLI and it only ever builds symlinks — nothing is packaged, published or versioned.

## Trying a change

**`bash scripts/try.sh` builds a throwaway `~/.claude` under `tmp/try/`, then prints the line that starts a real session against it.** It prints rather than runs, because an interactive session cannot start from inside a script already holding the terminal.

- **This is not an install, and the never-install rule holds through it.** Everything is built under `tmp/`, `~/.claude` is neither read nor written, and the one path reached outside the repo is the credential file, symlinked so the scratch session can authenticate.
- **It runs `flow install --home tmp/try/home --no-bin`**, which is the same command a real machine runs. The scratch session therefore tests the arrangement an install produces, rather than a second one built by hand in `try.sh`.
- **Editing a skill is live inside the running session.** Skills and agents are symlinked into the scratch config, so `SKILL.md` there is this repo's file. Write, save, invoke.
- **`tmp/try/project/` is a git repo of its own**, and it has to be: `flow` finds the project root through `git rev-parse`, so without one every ticket would land in Flow itself.
- **`npm test` inside `scripts/`** runs `node --test` over `tests/`. Zero dependencies, no `node_modules` — the runner is built into Node. Tests write only into `tmp/tests/`.

## Layout

- **`.claude/settings.json`** — this repo's own settings, committed. Holds `claudeMdExcludes`, which keeps the 16 `CLAUDE.md` files under `repos/`, `home/` and `project-template/` from loading when a file beside one gets read. `lab/` and `toolbox/` are listed too and match nothing today
- **`backlog.md`** — every open item in Flow, one line each, checkboxes. The only place an open item lives; `lab/context/` holds the reasoning behind them
- **`home/CLAUDE.md`** — rules that apply in every directory, project or not. Copied to `~/.claude/CLAUDE.md`, then personalized
- **`home/settings.json`** — permissions, the `PreToolUse` hook, feature flags; every key explained in `home/settings.md`, including `skillOverrides`, which this file deliberately does not set. Merged into `~/.claude/settings.json`
- **`home/skills`** — the names that link into `~/.claude/skills/`, one per line, `#` for a comment. Every Flow skill is named here, and every one is on by default; a project turns off what it does not want. Committed with Flow, and `flow install` reads it
- **`scripts/`** — `ptree.js`, `fmerge.js`, `gsave.sh`, `guard.js`, `snapshot.js`, `repos.sh`, `try.sh`, `flow/` (`flow.js` is the entry; `lib/` holds the argument layer and the model, `commands/` one file per command group, including `open.js` behind `/start`). Also the Node package root: `package.json` and `tests/`. Symlinked as `~/.claude/scripts`; four get a second symlink in `~/.local/bin` named without the extension, which is what makes `ptree`, `fmerge`, `gsave` and `flow` commands, and `flow` gets a fifth link named `fw`. `guard.js` and `snapshot.js` are hooks, named by path in `settings.json` and never typed
- **`references/`** — reference files Flow ships but rarely loads: `writing.md` (how to write a file that loads into context), `workflow.md` (how the pieces fit), `study-cases.md` (how to record a failure), `cli-design.md` (the rules `flow`'s command surface follows), `work-sync.md` (how to move uncommitted work between two machines). Symlinked as `~/.claude/flow/references`
- **`skills/`** — every skill, one folder each, filed under `phases/`, `tools/`, `standards/`, `stack/` or `commands/`. The group is a filing decision and nothing outside this tree reads one: a link in `~/.claude/skills/` or a project's `.claude/skills/` is flat and named for the skill
- **`agents/`** — subagent definitions, one `.md` file each: a system prompt plus a tool allowlist plus a model. Symlinked into `~/.claude/agents/`. One of them: `haiku-worker`, named for its model so the folder reads at a glance
- **`docs/`** — guides, concepts and the reasoning behind each phase and tool, written for someone who just cloned Flow. Authored here, never moved in from `lab/`. `repos.md` is the only one so far
- **`project-template/`** — `CLAUDE.md` (`## Project` + `## Rules`), `.gitignore`, `.flow-include`, and `.claude/flow/` holding an empty `skills` list beside an `overlays/` folder. Nothing else. One template, copied in as-is; a directory that is not a project deletes `## Project`, which is the section that makes it one. `.flow-include` ships with no entries, only the comment saying what it is for: it names the gitignored files that travel with `flow work send`
- **`toolbox/`** — **submodule**, [`Adrian333Dev/toolbox`](https://github.com/Adrian333Dev/toolbox), external tools filed by job. It left the workflow 2026-08-25 and installs nowhere; the submodule stays, so every repo rule about it holds
- **`lab/`** — the design record this repo was built from. Ships nowhere and never gets deleted; it shrinks to what is still live instead
- **`repos/`** — 12 clones of other people's repositories, gitignored. `bash scripts/repos.sh` restores them, and `docs/repos.md` says what each one is. Read with `cat`, never with `Read`
- **`tmp/`** — gitignored scratch. `tmp/try/` is the throwaway session config, `tmp/tests/` is where the tests write

## `lab/`

**Nothing under `lab/` is a Flow skill**, including folders that contain a `SKILL.md` — `skills/` is the only place a live skill exists. Never let a path inside `lab/` leak into a skill, `home/`, or `project-template/`.

**Every context file lives in `lab/context/`** — one folder, flat, 17 files, no loose markdown at the top of `lab/`. Cut to what is still live on 2026-08-28; `design-restructure.md` → `## The second cut` says what went and why.

- **`remaining.md`** — the 2 decisions locked in 2026-08-08 and 2026-08-09 conversations, and the only record of the arguments behind them
- **`refactor-agenda.md`** — the cleanup work now in progress
- **`session-new-plugin.md`** — historical log, newest at the bottom. Where a decision's origin is found
- **`threads.md`** — the open discussion threads
- **`shit-explanations.md`** — messages the user rejected, kept verbatim, because the wording is the evidence
- **`design-*.md`** — the reasoning behind each locked decision

Everything beside `context/` is a folder and stays one:

- **`study-cases/`** — one case, `premature-implementation/`: a `CLAUDE.md` rewritten without approval, and unproposed changes applied on a partial approval. Every other case documented a failure that got fixed; this one documents a failure that recurs
- **`research/`** — the evidence behind the skills, and cached upstream documentation
- **`framework-build/`** — the previous generation, kept until the backlog harvests it into skills
- **`excalidraw/`** — three third-party diagram skills awaiting a verdict, and the input for a skill built later
- **`proxy.mjs`** — a dev-only context auditor, not a shipped script

## Repo rules

- **A skill edit is live immediately.** `~/.claude/skills/*` symlinks into this repo, so there is one copy and no propagation step. Adding, renaming or removing a skill is the only case needing `flow install`.
- **Never symlink `skills/` or `agents/` as a folder.** Both `~/.claude/` counterparts hold entries Flow doesn't own — three non-Flow skills are linked there right now. `flow install` links per item for that reason, and refuses to replace anything that is not already a symlink.
- **Every script file keeps its extension. The symlink drops it.** `ptree.js` on disk, `ptree` to type. Nothing in `scripts/` is ever extensionless.
- **One source, two ways to reach it.** Every script lives once, in `scripts/`. `~/.claude/scripts` is a symlink to that folder, for files named by path (`guard.js` and `snapshot.js` in `settings.json`). `~/.local/bin/<name>` are per-file symlinks, one per name typed — 5 of them, because `flow` is linked twice, as itself and as `fw`. No file is ever copied anywhere.
- **PATH commands are written bare** — `ptree docs`, `fmerge src/`, `flow next`, never with a path or an interpreter. Everything else is written as `~/.claude/scripts/<file.ext>`.
- **Two languages, by job.** Bash where the script wraps another command (`gsave.sh` over `git`, `repos.sh` over `git clone`, `try.sh` over `flow install`); Node where there is real logic (`ptree.js`, `fmerge.js`, `flow/`, `guard.js`). Linking became Node the day it started reading a list, skipping names whose folder is gone and refusing two skills that share one — `ln` in a loop was the whole of `link.sh`, and it is not the whole of `flow install`.
- **Never edit `toolbox/` as part of this repo.** It is a submodule with its own history and remote; changes are committed and pushed from inside that folder, then the new pointer is committed here.
- **Every file in `home/` exists twice.** The copy here is the **template** — placeholders plus rules, public. The copy at `~/.claude/` is **personalized** and belongs to the machine. They drift apart on purpose. Never write personal profile content into this repo, and never expect an edit to `~/.claude/CLAUDE.md` to flow back — carry it across by hand when it is a rule worth shipping.
- **A placeholder comment is deleted the first time its section is filled in.** So it holds a shape and an example, never a rule — a rule written inside one disappears exactly when it starts to matter. Anything load-bearing belongs in a section that survives: `## Capture` for what gets written down, `## Explaining` for how.
- **Real commit messages.** Changelogs are suspended until Flow's first release, so git is the only record of why something changed. A message that says nothing loses the reasoning permanently.
