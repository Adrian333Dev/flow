# Handoff — 2026-08-12

Read every file listed under "What to read" in one parallel batch, then start on the first action. The decisions below are settled.

## The job

Building Flow's skills, in plain conversation, one skill at a time. This session finished `prototype`, converted `handoff` from a slash command into a skill, and added a hard rule about following the house writing style.

**The user is angry, with cause.** Two things earned it. The writing rules got broken repeatedly across many sessions, including twice in this one. And `prototype` was handed over for review while a piece it depends on was never moved — see the first action.

## Where it stands

Files written this session:

- **`skills/handoff/SKILL.md`** — new, 88 lines. Was `commands/handoff.md`.
- **`skills/prototype/SKILL.md`** — restructured, 80 lines. Second pass.
- **`skills/brainstorm/SKILL.md`** — one line, in `### When the user is not the one who can answer`.
- **`skills/execute/SKILL.md`** — three lines, 102 / 112 / 129.
- **`CLAUDE.md`** — new last hard rule; `## Writing any file` lost a bullet; `commands/` layout line.
- **`global/CLAUDE.md`** — new hard rule; trimmed the `writing.md` reference bullet.
- **`global/refs/workflow.md`**, **`global/settings.md`**, **`README.md`** — one line each.
- **`commands/handoff.md`** — deleted, and the folder with it.
- **`wip/context/remaining.md`** — three entries.

**Never run `git status` here.** The tree has been uncommitted since 2026-08-09, so it returns 60 lines that cannot separate this session's work from three weeks of it. The user raised this directly.

## What binds it — decisions locked this session

1. **A prototype takes two sessions, not three.** The brainstorm names the question, writes the handoff, and **waits**. A fresh session builds and reports back. The brainstorm reads the report and closes its own branch. A third session appears only when the first runs out of context.
2. **`prototype` owns the middle only.** Naming the question, writing the handoff, and closing the branch all belong to the brainstorm. The first draft had the prototype session writing its own handoff, which cannot happen — that document already exists by the time the skill runs. `map.md` now appears nowhere in the skill.
3. **The gap was in `handoff`, not in `prototype`.** Three of the six things a prototype handoff needs landed nowhere on `handoff`'s list. What those three share is that **someone is waiting for an answer** — nothing to do with prototypes. So `handoff` now names two jobs, **resume** and **assign**, and an assigned job carries four extra things: what turns on the answer · what done looks like · what to produce · what to say back.
4. **Two repairs to what every handoff answers.** *What is already set up* is now its own line, covering the machine and not just the work — the install that ran, the server still listening, the read-only folder. *What was found* is now its own line, and it reverses the old test: writing out a fact costs less than re-deriving it, so "point at what's on disk" was suppressing exactly the payloads and endpoints that took an hour to extract.
5. **"Brief" is retired.** Every job document is a handoff. A resume file is overwritten; an assigned job takes its own filename and never clobbers it.
6. **`handoff` is a skill, not a command.** A command can only be typed, yet the file's own trigger list asked it to fire when a brainstorm resolves. A skill is still typeable as `/handoff`. The bigger win: `git status` and `flow status` were baked in and fired every time, so they became step 2, *gather only what this job needs*, where nothing runs by default.
7. **Every file gets the writing pass.** New hard rule in both `CLAUDE.md` files. Reading `writing.md` is not the pass — plan the whole file's sections before typing, then test every sentence you wrote against its rules before showing anything.

Decisions locked earlier and still binding: a prototype is naive by design and **never promoted**; the real build reads it and starts again. Layout locks in ASCII inside `visualize`, then HTML varies colour and density on the frozen frame — and `visualize:100`'s claim that an HTML preview takes one round is **correct** given that order.

## What was found

- **`skills/handoff/SKILL.md` has a defect, unfixed.** Step 2 tells a build resume to run `git status --short` with no guard for a repo nobody commits. Proposed fix, not yet approved: name the files this session changed, and fall back to `git status` only where the tree is committed regularly.
- Deleting `commands/` needed no change to `global/scripts/link.sh` — it skips a missing folder by design.
- Two uses of "brief" survive on purpose: `skills/execute/SKILL.md:93` is the ordinary adjective inside a prompt string, and `global/CLAUDE.md:87` is generic prose mirrored in this repo's `CLAUDE.md`, so changing one silently desyncs the pair.

## What to read

- **`skills/prototype/SKILL.md`** — 80 lines. The skill this session was about.
- **`skills/visualize/SKILL.md:96-107`** — the `## HTML previews` section that has to move, plus its frontmatter description, which still advertises it.
- **`skills/handoff/SKILL.md`** — 88 lines, and the defect above lives in step 2.
- **`global/refs/writing.md`** — 169 lines. Read it fully before writing any file, then test what you wrote against section 5.
- **`wip/context/user-profile.md`** — who this is for. Voice-to-text, no filler, a committed recommendation over a neutral list.
- **`wip/context/remaining.md`** — the master checklist. Locked sections at the top beat everything below.
- **`wip/context/design-browser-tooling.md`** — `debug-web-pages` versus `browser-harness`, deferred to after V1. Do not act on it.

## The first action

**Move `## HTML previews` out of `visualize` and into `prototype`.** The user is angriest about this one, so do it first.

The state today: `prototype` says HTML varies colour, density, weight and spacing on a locked frame, while `visualize` still carries the whole HTML-preview section and still advertises it in its own frontmatter description. Two skills claim one job. **`prototype` is incomplete until this lands**, which is why reviewing it wasted the user's time.

The move needs three things: the section out of `visualize`, the `visualize` description edited so it stops offering HTML previews, and `visualize`'s medium-choosing list repointed at `prototype` for the colour case.

## Then, in order

- **`project-template/.gitignore`** gains a `protos/` line. It is one line today, `tmp/`. A prototype folder holds `node_modules`, model caches and generated media; one real harness reached 779 MB.
- **Fix the `git status` defect** in `skills/handoff/SKILL.md` step 2.
- **Subagent assignments never got the same treatment.** `skills/research/SKILL.md:49` describes a subagent prompt with its own four-item shape — the question, the constraints, the sources, the required output — which is the assign shape under another name. `execute` dispatches subagents too. Decide whether an in-session subagent dispatch is the same document type as a cross-session assignment. Nothing contradicts anything today; this is a unification, so it needs the user's call.
- **Make the resume handoff untracked.** The skill already says to delete it once the job finishes. Keeping it out of git is the missing half, and the user deferred the mechanism.

## Never reviewed — on disk from an earlier session

Shown to the user, and they never said keep or revert. Do not treat these as blessed.

- **`skills/execute/SKILL.md`** rewritten end to end, 122 → 129 lines, including the decision to keep the name `execute`.
- **`flow ticket new --from-brainstorm <path>`** in `global/scripts/flow/flow.js` and `lib/store.js`.
- **The `map.md` format** — every leaf a question, topic parents in Title Case.

## Known style debt — 13 sentences

Audited against `writing.md` in an earlier session, still unfixed. `skills/brainstorm/SKILL.md` lines 181, 207, 209. `skills/execute/SKILL.md` lines 3, 28, 37, 43, 55 (twice), 102, 112. Also `skills/organize/SKILL.md:36` still says "the brainstorm **tree**", renamed to "map" long ago.

## Evidence on disk

- **`wip/tmp/tts-lab/`** — a real feasibility prototype from the read-aloud app. 779 MB, 441 lines of test scripts, a 226-line `REPORT.md`, and a `HANDOFF.md` that every rule in `prototype` was derived from. The most useful file in the repo on this subject.
- **`wip/refs/`** — cloned third-party repos. Read with `cat`, never with `Read`; reading a file inside auto-loads that repo's own `CLAUDE.md`.

## Standing state

- **Nothing is installed.** `global/CLAUDE.md` is a template that would install to `~/.claude/CLAUDE.md`, and that has not happened. No Flow rule and no Flow skill loads in any session. This repo's `CLAUDE.md` is the whole rule set in force. **Never propose installing.**
- **No commits.** The tree is meant to be dirty until the refactor finishes. Never offer `gsave`, never run a git mutation.
- **Approval is explicit.** Feedback is not approval. Hedging is a no. A long list of feedback is a list of topics, not a work order.
- **Still unbuilt overall:** `setup-flow-globals`, `migrate-to-flow`, `code-review`, a test suite for `flow`, and the real migration of the user's own projects.
