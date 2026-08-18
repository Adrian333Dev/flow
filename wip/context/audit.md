# Audit — the teardown before v1

Findings from walking Flow end to end, opened 2026-08-17. Every entry comes from a walk that could not finish, never from reading a file and judging it.

Scope is the live surface: `skills/` minus `debug-web-pages`, `global/`, `agents/`, `commands/`, `project-template/`, the repo `CLAUDE.md`. Roughly 2,200 lines across 23 files.

## Locked this session

- **The install and migration skills are one skill**, built after everything on this list. It is the last thing Flow gets. **Project genesis is therefore not a gap and never gets raised as one** — a new project has no route because the skill that opens one is deliberately last. Said three times.
- **A project is anything.** A pipeline, a folder of scripts, a notes directory, a coding repo. Almost every directory is one; a rare few are not.
- **`debug-web-pages` is out of this phase.** It gets a full rewrite after the move to Linux, so nothing here touches it.
- **`grill` comes back** — a pass the user fires at a chosen moment, on a finished artifact. `## Judgment` in `global/CLAUDE.md` stays the always-on floor underneath it. Designed after this teardown, from what the teardown actually did.
- **`docs/` always exists.** Every Flow path lands under it, project or not, repo or not. A path the user names beats it, and that override is the only branch. `## Project` goes back to describing the thing and stops deciding anything.
- **One user for a while.** No hardening against a hand-edited ticket, a missing git repo, or anyone working outside the workflow on purpose.
- **`prototype` gets a ticket type. It gets no agent** — user, 2026-08-18, overturning the 2026-08-17 direction to copy `debug` whole. `debug` has an agent because the working session dispatches a hunt mid-build and gets a cause back. Nothing dispatches a prototype: the session that hits the question hands it to the user, who prototypes in a session of their own.
- **Plan progress comes out of `flow`.** No regex over a hand-written file. Counting closed children stays, because it reads frontmatter `flow` owns.
- **Nothing is installed, and the hooks were still tested.** Both take a JSON payload on stdin and print to stdout, so they run from the repo by path. A verdict they give uninstalled is the verdict they will give installed.
- **Delapse is the live project**, a Chrome extension in daily development, and the one to cite when a real case is needed. `lumacraft_v2` is archived and kept only for comparison. The user corrected a long-running mix-up of the two on 2026-08-18.
- **Delapse is not a fair yardstick for Flow.** Its milestones were not tickets — each bundled several pieces of work, ran large, and was often still being figured out mid-implementation. Its records are long because the workflow upstream of them was thin, so evidence from it needs that discount applied before it argues anything.
- **Capture and promote are separate, and only promote is the filing pass.** Approved 2026-08-18. Capture runs continuously in any phase and writes a finding where it lands — the ticket's `issues.md`, a brainstorm's `map.md`, `docs/inbox.md` — deciding no altitude and touching no skill. Promote is manual, batched across however many tickets have closed, and is the only step that writes into skills and `docs/context/`.
- **`flow review` triggers no skill.** Review reviews the implementation. A one-line reminder is the most any command may print.
- **A ticket carries a `filed` date**, set by `flow ticket filed <id>...` when the filing pass finishes with it, and set even when that ticket yielded nothing. `flow ls --unfiled` lists the queue and is required, not deferred; `flow status` carries the count.
- **`issues.md` is never emptied.** It stays as the record of what happened, the same way `debug` keeps `report.md`.
- **The filing skill is `file-findings`.** Confirmed 2026-08-18. *Update* was wrong because the skill creates as well; *context* named no material, since everything an agent reads is context.
- **`prototype` is the fifth ticket type**, routed by `execute` Phase 1 to the `prototype` skill. Its agent and its handoff are a separate piece of work.
- **`flow check` never reports unfiled tickets.** It reports corruption and exits non-zero; owed work is not corruption.
- **`grill` is parked behind the research phase.** User, 2026-08-18. The teardown it was waiting on is finished, so nothing blocks it — the user chose to read first anyway. The reference repos hold two grilling skills nobody has opened and a naming collision nobody has settled, and **none of that reading has happened yet**: the repos are cloned, not mined.
- **`grill` is part of Flow, and it is a skill.** Decided 2026-08-18. Rarely fired, **never model-invoked** — `disable-model-invocation: true`, so only the user starts it. `## Judgment` in `global/CLAUDE.md` stays the always-on floor underneath it.
- **A question needing more thought does not need a new brainstorm.** User, 2026-08-18. The same session can carry on; where the user wants it separate it becomes a ticket, typed `research`, picked up by a fresh session that starts brainstorming on arrival. Never treat "this needs more thinking" as a reason to invent a mechanism.
- **`report.md` is not `debug`'s file.** User, 2026-08-18. Any ticket that was created to answer something writes one — a prototype ticket and a research ticket included. `debug` happens to be where it was first written down.
- **A waiting brainstorm learns the answer through `flow`, and nothing else gets built for it.** User, 2026-08-18. No back-reference, no pointer file, no watcher. The session that cut the ticket already knows its id, so "the prototype is done" is enough: it runs `flow show`, sees `done`, and reads `report.md` in that folder. Where the id was lost, `flow ls done` finds it.
- **`prototype`'s description no longer refuses a ticket, and says nothing about `execute` either.** Fixed 2026-08-18, then trimmed again the same day at the user's instruction. It names the `prototype` ticket as a trigger alongside the handoff and ends on the `visualize` boundary. The replacement clause about settled questions was cut as redundant: `research` and `visualize` are the two skills anyone could confuse this with, and a description that says what the skill is does not need a third negative naming a skill nobody would reach for.
- **No skill may forbid reaching for another skill.** User, 2026-08-18, generalizing from `prototype`. Naming which skill owns a *job* is routing and belongs. Writing that a kind of work is another skill's reads as a ban and strands whoever needs it mid-task — and it ages badly, since a skill written today cannot know what will exist to reach for later. Written into `writing.md` §3; the sweep found `prototype` was the only file doing it.
- **Reports live in `reports/` under the ticket**, one file per thing answered, named after what it answers. Approved 2026-08-18.
- **`closed` is a ticket field**, stamped by `flow done` and `flow ticket drop`, cleared by any move back to a live status, carrying a clock time rather than a date. Approved 2026-08-18.
- **Bare `flow start` is the session opener**, read-only; `flow start <id>` picks a ticket up and prints it. The router lives in `commands/start.md`. Approved 2026-08-18.
- **The first fix batch landed 2026-08-18.** Fourteen findings closed across `flow`'s four library files, `execute`, the renamed filing skill, `global/CLAUDE.md`, four other skills, `workflow.md`, `project-template/` and this repo's `CLAUDE.md`. Nothing was deleted — every removal was a sentence inside a file, and the skill folder moved.

## Still open after the fix batch

**Nothing.** F5 closed 2026-08-18, unparked by the user. F4's remainder, F22, F23 and the reports folder closed in the second batch; `prototype`, `brainstorm`, `render.js` and this file took the corrections in the third.

### F22 — The front door for every ticket is a skill called `execute`

**FIXED 2026-08-18.** The router is `commands/start.md`. `execute`'s description now claims `feature` and `chore` and names where the other three go — the pointer, not a second copy.

**Raised by the user 2026-08-18, not by a walk.** No severity yet; it needs the design conversation before it can be sized.

**What happens today.** Every ticket, whatever its type, enters through `execute`. Its Phase 1 reads the type and routes: `feature` and `chore` stay and get built, `issue` goes to `debug`, `research` goes to `brainstorm`, `prototype` goes to `prototype`. So four of the five types load a 210-line build loop in order to be told to go somewhere else.

**The user's doubt, in their words:** is `execute` a proper path for a research ticket, or should something new pick the skill from the ticket's details?

**Why it bites beyond tidiness.** A skill's `description` is always in context and is the whole basis on which an agent decides to load it. `execute`'s says it "takes one ticket from pickup to done, writing its plan at pickup" — false for three of the five types, and `writing.md:108` records that a description summarizing the workflow gets followed instead of the file.

**Recommended: the router moves to `commands/start.md`.** `/start t047` already runs `flow start && flow show`, so the ticket's `type:` is on screen **before any skill loads** — and running something before the model thinks is the one thing a command can do that a skill cannot, which is this repo's own test for whether a command earns its place. `execute` then narrows to what its name says: the build loop for `feature` and `chore`.

**The objection to that, and it is real.** The command only runs when the user types it. Say "let's work on t047" in prose and no command fires, so the routing has to survive in `execute`'s description as well — which is a second copy of the routing table, and two copies drift. The cheap answer is a pointer rather than a copy: the description names the four types it does **not** own and says which skill does, in one clause.

**What would overturn the recommendation.** How the user actually starts a ticket. Always typing `/start` makes this clean; usually saying it in prose makes the command dead code and the router belongs wherever the prose path lands.

**Accepted and expanded by the user, 2026-08-18.** They want the command to work with no id at all, and to do more than start one ticket: run the whole session-opening survey as a script, before the model thinks, and lead with the work already open. With an id it stays explicit — the user names the ticket and nothing gets picked.

**Dates need no field.** Ids are handed out by `nextId` as max + 1, so a higher id was created later, always. "Recently created" is an id sort, not a new frontmatter key.

**And the date is the wrong signal anyway, which the walk found.** The case is: mid-brainstorm on t040 you cut t051 to prototype something, then open a fresh session. What brings t051 back is not that it is new — it is that its parent is `thinking`. A ready child of an in-flight parent is the continuation of work already open, which is exact where recency decays: a week later everything is old. Walking the second case kills recency outright. A brainstorm that decomposes cuts t051, t052 and t053 in one go, and those get worked oldest-first. Newest-first would reverse them. Band membership carries the signal; order inside the band stays oldest-first.

**Never flip the global tie-break.** `graph.js` keeps ties oldest-first on purpose — `flow next` caps at 10, so newest-first would sink stale tickets below the cap permanently.

**Proposed shape, not yet approved:** `flow start` bare prints the session briefing (in flight, then ready children of in-flight parents, then the ready list, then the unfiled count and any `check` problems) and writes nothing; `flow start <id>` transitions and prints the full `show` output as it does today. `commands/start.md` becomes one `!` line plus the routing table by type. The branch lives in Node, where it can be tested, instead of in shell inside a command file.

### Reports become a folder — FIXED 2026-08-18

**Today.** One file, `report.md`, in the ticket folder. The name says nothing about what it holds, and a second one has nowhere to go — a hunt that finds a cause, then a second failure on the same ticket, either overwrites the first or lands in a file named after neither.

**Landed.** `reports/` in the ticket folder, one file per thing answered, named after that thing: `reports/dst-offset-double-applied.md`, `reports/daemon-detection.md`. Same slug rules as a ticket folder.

**Recommended, and the argument is already in the codebase.** `store.js` creates `brainstorm/` from birth on the reasoning that you cannot know at the start whether the thinking will split, so its location must never depend on the outcome. A report is the same shape of question one level down: you cannot know at the start whether a ticket answers one thing or three.

**Created on first write, not from birth.** `brainstorm/` exists from birth because its *location* must be stable. A report's location never moves; it just may not exist, which is `plan.md`'s rule and the right one here — most tickets produce no report and an empty folder in every ticket is noise.

**`flow` does not change.** Nothing in `flow` reads or writes a report; `flow.js:73` mentions the name in help text only. This is a docs change across `debug`, `agents/debug.md`, `execute`, `handoff`, `file-findings`, `workflow.md`, that one help line, and the prototype text.

### F23 — `prototype` forbids the reading that building it requires

**FIXED 2026-08-18**, and generalized: the ban is now ruled out for every skill, in `writing.md` §3. `prototype`'s description clause became a job-selection statement, and its body gained "Invoke whatever the build needs, from right here."

**Found 2026-08-18, walking the user's scenario.** Mid-brainstorm you hit a question about a Chrome extension, and you are not confident about the environment — a domain the agent knows thinly, or a version that moved under it.

**Corrected by the user, 2026-08-18, and the correction shrinks the fix.** The first framing had reading belonging to a step outside the prototype. It does not. `research` and `visualize` are invoked from inside whatever session needs them, and `brainstorm` already does exactly that at five points — prior art, two documentation levels, a landscape too big to read inline, and every drawing. A prototype session invokes them the same way.

**The fault is two sentences, both of which push those skills away.** `prototype`'s description says "Reading documentation or source is `research`, never this", and its body repeats it as "Reading documentation or source is `research` level 3, never this". Read by an agent already building a prototype and needing a function signature, both say reading is another skill's job. A description is always in context, so that copy does the most damage.

**What was actually being protected, and it survives.** Do not prototype what reading would settle — code costs more than a page of documentation, so the cheaper answer goes first, and if it lands there is nothing to build. That is the sentence before it: "Talking failed and reading failed — that is the entry condition." It stays.

**Recommended fix, two edits.** The description clause becomes a job-selection statement — a job that is *only* reading is `research`, never this — so it stops reading as a ban on looking things up. The body's repeat is replaced by a line saying `research` and `visualize` are invoked from here as the build needs them, and that a fact outliving the prototype goes to `docs/context/<subject>.md`, which `## Capture` already requires.

## How a finding closes

Four severities: **blocks v1** · **fix now** · **after v1** · **won't fix**.

A finding needing a real design conversation moves to `threads.md` and leaves a one-line pointer here. Everything else gets fixed in a batch and marked in place.

## Findings

### F2 — One section header decides whether Flow may create a folder

**FIXED 2026-08-18.** All seven branches deleted; `global/CLAUDE.md` now opens `## Capture` with "**`docs/` always exists**, project or not, repo or not." The `writing.md:133` orphan was left as a historical quote — the compression lesson it teaches does not depend on the quoted rule still being live, and replacing it costs finding another before/after pair as good (user, 2026-08-18).

**Decided 2026-08-17. `docs/` always exists.** Only a path the user names overrides it.

**What the flag was.** A project's `CLAUDE.md` can carry a section headed `## Project`, describing what the thing is. Flow read the presence of that header as a yes-or-no answer to a different question: may this directory have a `docs/` folder?

**What turned on it.** With the header, work filed itself into `docs/spec/`, `docs/tickets/`, `docs/research/`, `docs/context/`. Without it, all of those collapsed to whatever single file was open — a brainstorm wrote its map beside itself, a spec had nowhere to go, findings landed in the working file.

**Why it is wrong, proved rather than argued.** `## Capture` contradicts itself two lines apart, in the file that loads on every turn. Line 35: without `## Project` there is no `docs/`. Line 37: `flow` needs only a git repo, so committed work gets a ticket nearly everywhere. `flow` writes tickets into `docs/tickets/` — `store.js` builds that path off the git root and nothing else. So the section instructs an agent to create `docs/tickets/` in a directory where it has just said `docs/` does not exist.

**The rest of the argument.** Creating a folder costs nothing and needs no permission, so the header protects nothing and only makes Flow behave two ways where one would do. It also reads the wrong signal: the header says what the project *is*, and a project can be a pipeline, a folder of scripts or a notes directory just as easily as code.

**The override already exists.** `global/CLAUDE.md` hard rules: "Every path named here is a default. One named in `## Preferences`, in this directory's `CLAUDE.md`, or by the user wins." Nothing new gets built for the user-names-a-path case.

**Seven places carry the branch.** Every one is a deletion, not a rewrite:

- `global/CLAUDE.md:35` — the definition sentence, and the whole reason the other six exist
- `skills/brainstorm/SKILL.md:25` — "No project here → where you are standing, same shape."
- `skills/brainstorm/write-spec.md:24` — "**No project here** → one `design.md` where you are standing, same shape."
- `skills/research/SKILL.md:80` — "No project here → beside the file you are working in."
- `skills/update-context/SKILL.md:18` — "No project here → whatever loose material this session produced, and no inbox file to drain."
- `skills/prototype/SKILL.md:58` — "when that brainstorm sits loose, with no project around it"
- `global/refs/workflow.md:30` — "with no project around it, right where you are standing"

**One orphan follows.** `global/refs/writing.md:133` teaches a compression lesson by quoting the deleted rule as its own worked example. The lesson survives; the example cites wording that will no longer exist anywhere. Replace the example or accept it as a historical quote — decide during the fix batch.

**`handoff` §1 is not on this list.** Its "No ticket system here → `handoff.md`" branch tests for a git repo, not for `docs/`, and the repo question is settled separately.

### F3 — Two ways a ticket is born, two different tickets

**FIXED 2026-08-18.** `execute` Phase 1 writes the check, from whatever the ticket turns out to be, and shows it with the plan. Phase 1 is the earliest moment it can be written, because knowing what the ticket is is that phase's whole job — and capture stays a one-liner, which was the point of capture.

`## Capture` creates one from conversation: `flow ticket new "…"`, a title and nothing else. `write-tickets` creates one from the spec: the spec's own words, the artifact references, and a `## Done when` naming something observable. The template says that check is "written now rather than at pickup".

So a capture-born ticket reaches `execute` Phase 1 carrying the template's comment where its check should be. Nothing names who fills it in, or when.

### F4 — A prototype is handed to a session nobody starts

**Blocks v1.**

`brainstorm` Phase 2 ends a branch it cannot settle by talking: "invoke `prototype`: name the question, write pass and fail, hand it to a fresh session, then wait." `prototype`'s hard rule forbids building in the session that named the question, and its description expects a session that "opens on a handoff".

Between the two there is no mechanism. No prototype agent exists, no file gives the command that starts the session, and nothing says how the waiting brainstorm learns the report landed. `debug` solves the identical problem in six lines — a child ticket, then `claude --agent debug --bg --name`. Prototype has the rule and none of the machinery.

**PARTLY FIXED 2026-08-18. The type landed; the dispatch did not.** `prototype` is `flow`'s fifth ticket type and `execute` Phase 1 routes it to the `prototype` skill the way `research` routes to `brainstorm` — the skill owns the ticket end to end and it closes on the report. The agent definition and the handoff mechanism are deliberately out of that batch: they are new construction rather than a line, and they are one design question together with the contradiction below.

**Found while applying it, and left alone.** `prototype`'s own description ends "Not for work already committed to a ticket", which now refuses the route `execute` sends it. One clause, and fixing it in isolation would half-answer the question that owns it — the two-session rule, the handoff and how a prototype ticket is picked up are settled together or not at all.

**Clarified 2026-08-18: this is not a topic to brainstorm.** The user asked directly, having read "one design question" as a proposal to open a brainstorm. It is not. Three unfinished pieces of Flow's own machinery are left, and settling any one of them decides the other two: whether `prototype` needs an agent definition, how the waiting brainstorm learns the answer landed, and the clause above.

**The user's own correction shrinks it, possibly to nothing.** They pointed out that a question needing more thinking does not need a new brainstorm at all — the same session can carry on, or the work becomes a ticket that a fresh session picks up. Applied to prototypes, the ticket type this batch landed may already be the whole mechanism: `brainstorm` cuts a child ticket of type `prototype` carrying the question and its pass/fail, a fresh session picks it up, and the brainstorm learns the answer through the ticket closing — which is exactly how `debug` works. That would leave nothing to build: no handoff file, and no agent, since `debug` has one because a hunt burns context and a prototype build in its own session does not. **Walk it before writing anything** — the loose-handoff wording in `brainstorm` Phase 2 is the part that would change.

**Settled 2026-08-18. Two of the three pieces turn out to be nothing.** No agent, for the reason in the locked list: an agent exists so a working session can dispatch a job and get an answer back, and nothing ever dispatches a prototype. No handoff mechanism either — the ticket is the mechanism. `brainstorm` cuts a child ticket typed `prototype` carrying the question and its pass/fail, a fresh session picks that ticket up, the build writes `report.md` in the ticket folder, and the ticket closes. The brainstorm learns by asking `flow`, which it can do because it created the ticket and knows the id. The third piece, the contradicting clause, is fixed. **What is left is body text, not design:** `prototype`'s "Two sessions" rule and its `## What the handoff must carry` section still describe the handoff as the only way in, and both now have a second entry to cover. That rewrite is not approved yet.

**Direction, user 2026-08-17:** copy the `debug` shape — a handoff, an agent definition, a ticket type. Agents are fine to add.

**The fifth ticket type is approved.** `flow`'s types are `feature`, `issue`, `chore` and `research`, and `execute` Phase 1 routes on them — `issue` goes to `debug`, `research` goes to `brainstorm`. A fifth type routes to `prototype` the same way, and closes a second hole at the same time: `execute` currently has no prototype outcome at all.

Still open, and small enough to settle inside the fix batch: what the type is called, and what `execute` Phase 1 does with it — dispatch and wait, the way `debug` does, or hand back to whoever asked the question.

### F5 — Heavy reading goes to a subagent that was never defined

**FIXED 2026-08-18.** Unparked by the user: `research` as it stands is the version to fix, and a later rewrite may still improve it but nothing waits on that. Two changes. The dispatch names `Explore`. And the trigger is now the size of the reading rather than the level — a subagent goes out when the material would bury the session, and a page or two is read where it was asked for. Dispatching too readily was the user's own concern, and the old wording caused it by firing on every level 3.

**Correction to what follows: Claude Code ships subagents that need no definition file.** `general-purpose` reads and searches with the full tool set; `Explore` is the read-only one built for exactly this. Every dispatch writes its own prompt from scratch — a file in `agents/` only adds a standing system prompt, a tool allowlist and a model choice. So the gap below is one missing word, not a missing agent. `research`'s hard rule works today by naming `Explore` in the dispatch.

**Not about external LLMs.** `research` has two separate delegation mechanisms and they get confused with each other. **Level 4, `## External prompt research`**, writes prompts the *user* runs in ChatGPT, Claude or DeepSeek and pastes back. That one works and is nobody's problem here. **`## Delegating heavy reading`** is the other one: a Claude Code subagent, dispatched inside the session, given cache paths and a question, returning findings while its reading stays in its own context window.

**The gap, in that second mechanism.** `research`'s hard rule says heavy reading goes to a subagent. Dispatching one means naming which agent runs it. `agents/` holds `debug`, which hunts a failure, and `haiku-worker`, which executes a decided step. Neither reads documentation, and no file names a third, so there is nothing to put in the call.

**The over-built worry, answered.** The section nearly went entirely: the user reads documentation by hand often, and level 3 already says clone and read. It stays because the case behind it is real — a cloned codebase read inline ends the session it lands in. The size trigger is what stops it firing on anything smaller.

### F6 — Nothing ever starts the filing pass

**FIXED 2026-08-18. Two reminders, because there are two piles.** `flow status` prints the unfiled count and then names the skill to run — *"run file-findings to sweep them"* — which covers closed tickets. `## Capture` in `global/CLAUDE.md` covers the inbox: past 200 lines, offer the pass.

**The threshold is a line count, and the user overturned my entry count.** `docs/inbox.md` has no fixed structure inside it, so an entry is not a countable thing — one item is a line, the next is a pasted stack trace. Length is the measure that survives that. 200 is a guess and cheap to move; what it protects is a file nothing reads on its own.

`update-context` carries `disable-model-invocation: true`, so the user is the only thing that can start it. Its job is draining `docs/inbox.md`, which `## Capture` fills every session with whatever had no obvious home.

No skill, rule or command tells the user when to run it. Every other skill fires from its own description. This one cannot, and nothing was put in place of the trigger it gave up.

**Direction, user 2026-08-17:** a rule that offers the pass once `docs/inbox.md` grows past some size. The user runs it by hand often anyway, so this is a backstop rather than the main path — which drops the severity from a hole to a missing line.

### F7 — `execute` names an owner for `## State`, then tells you to write it yourself

**FIXED 2026-08-18, one line rather than two.** `execute:34` now reads "`## State` (`handoff` owns its shape, whoever works the ticket writes it)". `handoff`'s hard rule was left in place: F18 shrank `## State` to resume state, which is exactly what `handoff` owns, so the rule stopped fighting anything and deleting it would remove a live boundary to fix a contradiction that no longer exists.

**Fix now.** Two lines, in two files. Downgraded from "after v1" once the walk located the real source.

**What `## State` is.** A section at the bottom of a ticket's `ticket.md`. It holds what is true right now and written nowhere else: what is half-done, what cost real effort to learn, which decisions are half-made. A session that arrives cold reads it to carry on. It is the one thing in Flow kept current as the work moves, rather than written once.

**Where the contradiction actually is.** `skills/execute/SKILL.md:34` lists who owns each part of a ticket, and ends the line with `## State` (`handoff`). Line 113 of the same file says keep `## State` current as you build. Both are `execute`, 79 lines apart, and an agent mid-build reads them both.

**Corrected from the first version of this finding.** `handoff`'s hard rule "Never write into a section another skill owns" is not the culprit. Rules inside a skill bind whoever is running that skill, so that one tells `handoff` to leave `plan.md`, `report.md` and the frontmatter alone. It never fences anyone off from `## State`. Nothing else conflicts either: `global/CLAUDE.md:6` tells everyone to keep the section current, and `debug` and `agents/debug.md` agree with it.

**The fix.** Change one word in `execute:34`: `handoff` owns the *shape* of `## State` — the four labels and what belongs under each — and whoever works the ticket writes into it. Then delete `handoff`'s hard rule, which the user called out independently and which is a vague restatement of `handoff:101`, twenty-three lines above it. That concrete line already names every owner: `flow` the frontmatter, `execute` `plan.md`, `debug` `report.md`, the creator the body. Abstracting it into "another skill owns" is what made it read as a fence.

### F8 — A ticket in rework reports the wrong status

**FIXED 2026-08-18**, pulled forward into the batch because it is one paragraph inside a file the batch already opened. `execute` "Taking the feedback" now runs `flow build t047` before the first edit and puts the rework into `plan.md` as new steps.

`execute` Phase 4 takes review feedback, checks each note against the code, implements, then runs `flow done`. The ticket sits in `review` the whole time, so `flow next` and `flow status` both report it as waiting on the user while code is being written.

`flow` permits the move. `cmdTransition` guards unmet deps and open children only, so `flow build t047` from `review` works. Nothing tells anyone to run it.

Second half of the same gap: every step in `plan.md` is `[x]` by then, so the rework itself is recorded nowhere.

**Walk B raises this above cosmetic.** `graph.js` satisfies a dependency on `review` as well as `done` — built and checked is enough to unblock work on top. So while the ticket sits in `review` and its code is being rewritten, `flow next` offers every dependent as ready, and the user starts building against a moving target. Moving the ticket back to `building` closes both halves.

### F9 — The project template names a skill that will not exist

**FIXED 2026-08-18 by dropping the name, not by picking one.** The template comment now says "run the install skill from the flow repo". A name it does not carry cannot go stale again, whatever that skill ends up called. The repo `CLAUDE.md` line naming both old skills was corrected to the one collapsed skill at the same time.

`project-template/CLAUDE.md` closes on "If it isn't there, run `setup-flow-globals` from the flow repo." That skill is now one collapsed install skill whose name nobody has picked.

The comment is a placeholder and disappears the first time the section is filled in, so this costs nothing today. It still ships wrong.

### F10 — Seven git commands that write are invisible to the guard

**FIXED 2026-08-17.** `guard.js` now judges git by an allowlist of reads. Every case below was re-run after the change: the seven deny, and the reads Flow uses stay silent.

**`settings.json` did not already cover them.** Its deny list holds the same fifteen subcommands plus `git branch -` and `git worktree add|remove`, so it caught two of the seven. `git apply`, `git tag`, `git config`, `git update-ref` and `git submodule` were in neither place.

`guard.js` is a hook Claude Code runs before every Bash command. It reads the pending command as JSON and answers deny, ask, or nothing. Its job is enforcing the rule an instruction file can only request: never run a git command that writes.

It matches a fixed list of subcommands. Ran against real payloads, these seven passed silently: `git apply`, `git branch -D`, `git tag`, `git config --global`, `git worktree add`, `git update-ref`, `git submodule update`. Each one writes — the working tree, a ref, a branch, or the user's own global config.

A list of forbidden subcommands can only ever be as complete as whoever last edited it. Inverting it fixes the shape rather than the entry: allow the read commands by name — `status`, `log`, `diff`, `show`, `ls-files`, `rev-parse`, `blame`, `describe`, `for-each-ref` — and ask on everything else. Deny stays for the four the user must never be asked about.

**Not an install artifact, checked 2026-08-17.** The script takes a JSON payload on stdin and prints a verdict on stdout; that is its whole interface. Installing only decides whether Claude Code feeds it, never what it answers. The same uninstalled script, in one run, denied `git commit` and `git push` and stayed silent on `git apply` and `git branch -D`. It executed correctly and answered from its list. The seven silences are the list's content, so installing changes nothing about them.

### F11 — The recursive-delete check misses two shell forms

**FIXED 2026-08-17.** `&` joined the segment splitter, and `echo hi & rm -rf ../other` now asks. Command substitution stays unsplit, with a comment saying why and naming what still covers it.

`guard.js` also asks before any `rm -r` that reaches outside the working directory. It finds the `rm` by splitting the command line on `&&`, `||`, `;` and `|`, then reading the first word of each piece.

Two forms slip through, both confirmed by running it: `echo hi & rm -rf ../other` returns silence, because a single `&` is not in the split, and `echo $(rm -rf ../other)` returns silence, because a command substitution is never split at all.

The single `&` is one character in one regex, and the same file already handles it — the deny patterns match on `[;&|]`. Command substitution needs a real parser and is not worth one; say so in a comment instead of leaving the gap unexplained.

### F12 — The guard exempts a command nothing in Flow ever runs

**FIXED 2026-08-17.** The exemption and its comment are gone, and `GIT_INDEX_FILE=… git add -A` now denies like any other `add`. Leading `VAR=value` assignments are stripped before the subcommand is read, so the variable can no longer hide what follows it.

`guard.js` strips `GIT_INDEX_FILE=… git add` out of the command line before scanning it, so that one form of `git add` escapes the deny. The comment explains why: staging into a throwaway index writes objects and moves nothing, and `execute` used it to snapshot a dirty tree either side of a subagent.

Nothing types it. The only caller left is `snapshot.js`, which runs git through `execFileSync` — a direct process call that never becomes a Bash tool call, so the hook never sees it. The exemption survives from before the hook existed, and its comment describes a mechanism that has since moved into another file.

Not a hole: the strip is narrow and `git commit` on the same line still denies. Dead weight plus a comment that lies.

### F13 — `execute` reads a diff that may never arrive

**FIXED 2026-08-18.** Dispatch step 5 now opens "**No diff means verify the step yourself before marking it**", and says why: silence is what an early-stopping worker returns and what a broken hook returns, and the two look identical from the parent session.

`snapshot.js` is the other hook. It records the whole working tree before a subagent runs and again after, compares the two, and hands the parent session exactly what the subagent changed. `execute` step 4 depends on it: "Read the diff. It arrives with the report."

Every failure path in that script exits quietly. Ran against real payloads: not a git repo, no stored state from the before-event, a missing tool id, unparseable input, and the wrong argument in the hook registration all print nothing and exit 0. That is correct for a hook — a broken diff must never take a dispatch down with it.

It is wrong for the step that depends on it. Silence means "nothing changed" and "the hook is broken" at once, and `execute` offers no branch for either. 276 lines of hook have never executed in a real session, so the first dispatch after install is also the first test.

One line in `execute` closes it: no diff means verify the step yourself before marking it.

### F14 — Plan progress parses a hand-written file, and goes quiet when it parses wrong

**FIXED 2026-08-17 by removal.** Storing the count in frontmatter was weighed and rejected: any updater still has to parse the checkboxes, so the fragile part survives and gains a second copy that can disagree with the file.

**The argument that decided it, from the user:** a step count only means something inside the plan. Out in a list, `status` already answers what the count was there for — building, review, done. That beats the case for keeping it, which was only that the number is nice to have.

`flow` reports how far a build has got by counting checkboxes in `plan.md`, and it counts nothing else — no tally is stored anywhere, so nothing can drift. `execute` states the format plainly: a step is a top-level `1. [ ]` and nothing else is.

`planProgress` returns `null` for two different situations. There is no `plan.md`, which is normal — a research ticket never gets one. Or there is a `plan.md` whose steps are not top-level checkboxes, which means the plan was written wrong. Both print nothing, and the function's own docstring anticipates only the first.

**The deeper objection, and why it wins.** A regex over a file a person writes by hand can only ever guess at structure. Worse, the guess is what justifies the format rule: `execute` constrains how plans are written so the counter keeps working, which is the wrong way round for a file whose only real reader is the next session.

**Two different counters share one name, and only one is being removed.** `render.js` calls `progressOf`, which answers two questions. For a **parent** it counts children that closed, reading `status` in frontmatter that `flow` owns outright — robust, and it stays. For a **leaf** it counts checkboxes in `plan.md` — the fragile half, and it goes.

**What the removal touches:**

- `store.js` — delete `planProgress` and its export
- `render.js` — six call sites, at lines 36, 55, 94, 99, 144 and 162. The children half of `progressOf` survives all of them
- `global/CLAUDE.md:75` — drop the clause "Step progress is counted from `plan.md`'s top-level checkboxes, never stored, so it cannot go stale"
- `flow.js:71` — drop the `steps` line from the help text
- `execute/SKILL.md:91` — keep the format rule, replace its reason. Nothing counts the steps any more; the indent stays so a session picking the ticket up can tell a step from the notes underneath it

**What is lost.** The steps column in `flow next` and `flow show`, which is the only place a half-built ticket said how far it got. `execute` Phase 1 opens `plan.md` on pickup anyway, so the number is one line further away rather than gone.

**What replaced it.** `store.hasPlan` — one `existsSync`, no parsing. `flow show` prints `plan: plan.md` when a plan exists and nothing when it does not, which is the useful half of the old line and cannot drift. Run against a scratch project afterwards: the STEPS column is gone from `ls`, `next` and `status`; a parent still reads `0/2 done`; and a `plan.md` written with headings instead of checkboxes now shows up in `show` rather than vanishing.

### F15 — `ticket drop --by` builds a cycle the tool refuses to let you build by hand

**FIXED 2026-08-18, and narrowed on the second half.** The cycle check runs `wouldCycle` per direct live dependent **before the drop is written**, since a refusal after it would leave the graph half-edited. The replacement-status guard refuses `dropped` only: a dep is satisfied at `done`, so re-pointing at a finished ticket unblocks the dependent immediately — pointless, harmless, and refusing it would be hardening against a mistake that costs nothing. Both verified by running them.

Dropping a ticket strands everything that depended on it, so `flow ticket drop` refuses while live dependents exist and offers two ways out: `--force` drops them too, `--by <id>` re-points them at a replacement.

`flow ticket dep` refuses any edge that would close a dependency loop. `--by` re-points every direct dependent with no such check. Walk it: t060 depends on t047, and t070 depends on t060. Run `flow ticket drop t047 "…" --by t070`. Now t060 depends on t070 and t070 depends on t060. The command prints success; `flow check` reports the cycle afterwards, if anyone runs it.

The same command also accepts a replacement that is itself `dropped` or `done`. Re-pointing dependents at a dropped ticket blocks them permanently, which is the exact harm `--by` exists to prevent.

Both are cheap: `wouldCycle` is already written and already imported, and the replacement's status is one comparison.

### F16 — `flow done --force` on a parent leaves nothing anyone can find

**FIXED 2026-08-18**, pulled forward as one rule in a function the batch already opened. `check` reports closed parents, and the parent checks now run over `OPEN` rather than `LIVE` — `LIVE` excludes `review`, so a child in review under a force-closed parent was exactly the case the old guard could not see.

A parent ticket is one that was split into children. `flow done` refuses to close it while any child is still open, on the grounds that the parent's work is theirs — and `--force` closes it anyway.

After that, nothing records the override. `flow check` looks for a parent id that does not exist, never for one that is finished. The parent moves to `docs/tickets/archive/` while its live children stay in `docs/tickets/`, so `flow tree` nests open work under an archived ticket.

Nothing is lost — the children still appear in `flow next`, because readiness never consults the parent. What is lost is the claim: the parent said its work belonged to its children, then closed without them, and no view says so.

One more rule in `check` covers it: a live ticket whose parent is `done` or `dropped`.

### F17 — `execute` demands a plan shape no real plan on disk uses

**FIXED 2026-08-18.** The sentence is gone and the reason it carried survives: "**Anything else checkable goes indented, underneath the step it belongs to.** The indent is what tells a session picking this up which lines are the plan and which are working notes."

**Fix now.** One sentence deleted.

`skills/execute/SKILL.md:91` states that a step is a top-level `1. [ ]` and nothing else is, and sends everything else checkable underneath it, indented.

**No plan the user has ever written looks like that.** `wip/tmp/Delapse/` is the project Flow is being built for, and its plans live one per milestone under `docs/work/milestones/`. Each is `### Task 3` headings with `- [ ] **Step 9: …**` beneath them — `m30-dev-panel/plan.md` is 2,444 lines, 6 tasks, 48 steps. Every plan in that folder is shaped the same way.

**Nothing reads the shape any more.** Its only mechanical reader was the step counter in `store.js`, deleted in F14. So the sentence now constrains a hand-written file for no reader, and it rules against the habit of the one person writing them.

**This finding does not rest on the comparison.** Those plans came out of a different workflow, and the user is right that Delapse is not a fair yardstick for Flow — see F18. The argument here needs only the second paragraph: no reader, hand-written file, one syntax mandated.

**The fix.** Delete the sentence. Keep the reason it carried, which is real — notes nest under the step they belong to, so a session picking the plan up can tell plan from working note. `execute:85` already shows one shape by example without banning the others.

### F18 — A finding that cost real effort is written into a section built to be deleted

**FIXED 2026-08-18.** `execute` Phase 3 routes what cost real effort to learn into `issues.md` and states the entry test; Phase 4 moves anything durable out of `## State` before deleting the section, and both files survive review. The ticket folder is now "five files, five owners", with `issues.md` marked as written only where a build produced a finding — otherwise nothing told `execute` it may write there. **`flow show` does not list the file** (user, 2026-08-18): the filing pass finds tickets through `--unfiled` and then opens the folder, so a line in `show` would be one more thing to keep true for no reader.

**Fix now**, and it replaces the design thread the handoff opened. Far smaller than that thread assumed.

**What the two things are.** `## State` is a section at the bottom of a ticket's `ticket.md` holding what is true right now — what is half-done, what is half-decided, which files were touched. `execute` Phase 4 deletes it at review, on the grounds that every line describes work in progress.

**The fault.** `execute:113` routes four kinds of writing into that section and one of them is durable: what cost real effort to learn. A version that turned out to matter, a workaround a broken library forced, a code path no test covers. Those stay true after the ticket closes, and Phase 4 throws them out with the rest.

**The shape, settled by the user 2026-08-17: a file created on demand.** `issues.md` in the ticket folder, written the first time a build produces a finding worth keeping, absent from every ticket that produces none. Not a fifth standard file. **Impose no shape inside it** — Delapse's own vary between dated phase headings, `## Open` / `## Closed`, and plain prose, and all three work.

**The Delapse comparison was over-weighted, and the user overturned it.** Delapse's milestone folders each carry an `issues.md` — 22 of 42, 608 lines — and the first version of this finding leaned on them. **A milestone there was not a ticket.** It bundled several pieces of work, ran large, and was often still being figured out mid-implementation, so those logs are long because the workflow upstream of them was thin. Flow puts `brainstorm/map.md`, `docs/spec/`, `docs/research/` and a prototype ticket ahead of every build. A finding of the kind `m29a-pipeline-config/issues.md` files under *pre-planning verification* therefore already has a home, and copying it into a ticket's log would duplicate it.

**What the same evidence says once counted properly.** `m30-dev-panel` is the best-prepared milestone in that folder — a spec with no open questions, a brainstorm resolving all five design branches, a 2,444-line plan carrying its own self-review. It produced three log entries and only one is a build-time technical surprise: plan code written from React habit broke three lint rules the repo enables, caught when `pnpm lint` ran at the end. The CORS gap was found while planning, and the overlapping-milestones entry is a process problem. One, in the best-prepared case, is the argument for on demand.

**Where it still bites, and preparation cannot reach it.** No brainstorm tells you the repo's ESLint config turns on the React Compiler rules. Upstream work finds design surprises; the class that appears only when code meets the repo's real constraints arrives during the build or never. Expect few, and expect not none — noting that the prototype skill this argument leans on is unbuilt, so how few is unmeasured.

**The entry test, which is what stops it duplicating anything.** `issues.md` takes what the build produced, and only what is neither work nor a decision. A finding that changes a decision goes to `brainstorm/map.md`. A finding that is separable work becomes a ticket, and `execute`'s "when the plan turns out wrong" already routes both. What is left belongs here: true, learned in this build, worth keeping, nobody's task.

**Why it survives review while `## State` dies.** `## State` asserts something about now, and closing the ticket makes it false. `issues.md` asserts what happened, which stays true. So Phase 4 promotes its entries into the homes `## Capture` already names — a ticket, `docs/context/`, Flow's own notes — then leaves the file in place as the record.

**Recommended against: a `## Capture` entry in `global/CLAUDE.md`.** The user asked. Flow's own test for an always-loaded file is `writing.md:35` — name a moment the rule fires and no skill is loaded. There is none, because a ticket's `issues.md` is only ever written while `execute` runs. `## Capture` also lists destinations that work in any directory, and a ticket-folder path sits below that altitude.

**Recommended against: teaching `update-context` the new path.** The user asked, and the premise needs one correction: `update-context` does not already read many places. Its `## Inputs` are two — `docs/inbox.md` always, and a brainstorm's `map.md` only when that brainstorm closed in the same session, with an explicit refusal to dig through maps from other sessions. Making it crawl specs, research reports and prototypes breaks `batch, don't crawl`, the property the skill rests on. `flow review` drains `issues.md` instead, inside the Phase 4 sweep that already deletes `## State`, because the session that found something is the only one that knows what it meant. Whatever that session cannot place goes to `docs/inbox.md`, which `update-context` already always reads — so it learns no new path and the chain still works.

**Rejected: no file at all, findings straight to `docs/inbox.md`.** Cheaper, and it reuses machinery that already exists. Rejected because the finding loses its build: read weeks later out of a long project-wide inbox, *"the panel is the first `PATCH` caller and CORS did not allow it"* has nothing around it, while the same line beside the plan that hit it explains itself. **What would overturn this:** real use where the file appears in one ticket out of twenty. At that rate it is not a file, it is an inbox line.

**What it closes.** The cross-step-facts problem the handoff invented disappears: a fact governing the whole plan is a finding, and findings have their own file. F7 shrinks too, from the opposite direction — `## State` reduced to resume state is exactly what `handoff` owns, so the ownership line stops fighting anything.

**Still open.** Whether `execute:32`'s "four files, four owners" becomes five with the fifth marked optional, and whether `flow show` lists the file on the tickets that have one.

### F19 — The filing pass never reads the folder where a ticket keeps everything

**FIXED 2026-08-18, with one approved part dropped.** The skill gained the third input, the `## Method` marker step and a "never empty an `issues.md`" rule; `flow` gained the `filed` key, `flow ticket filed <id>... [--force]`, `flow ls --unfiled` and the `flow status` count. Every one was run against a throwaway project.

**Dropped: the `flow check` rule for unfiled tickets** — approved here, then overturned by the user on 2026-08-18 after I argued against it. `check` reports graph corruption and exits non-zero so a broken graph cannot be read past. An unfiled ticket is owed work, not corruption, so the rule would make `check` fail routinely, and a command that always fails stops being read. `flow status` carries the count and `flow ls --unfiled` carries the queue. **What would overturn this:** wanting one command that answers "is anything broken or owed" in a single call.

**Fix now.** One boundary sentence added, and it depends on F18 landing first. Raised by the user 2026-08-17 after the previous finding surfaced it.

**What the filing pass is.** `update-context` is the skill that takes what a session learned and writes it into the files that will load it next time — a skill, a `CLAUDE.md`, a file under `docs/context/`. The user types it; it never fires on its own. Its `## Inputs` section names two sources and no others: `docs/inbox.md` every run, and a brainstorm's `map.md` only when that brainstorm closed in the same session, with an explicit refusal to dig through maps from other sessions.

**Walked at both moments the user actually runs it, and it misses the same thing twice.**

- **Mid-implementation.** Deep in building a ticket, context filling, so the user fires the pass to get the session's learning onto disk. It reads the inbox and stops. No brainstorm closed this session, so the second input is empty. The material the moment was called for — what this build just discovered — sits in the ticket folder and in the session, and the pass looks at neither.
- **After the work finishes.** The ticket just closed, so its material is finally settled. Same two inputs. The brainstorm that fed this ticket closed days ago in another session, which the skill forbids reading. So this run misses the ticket folder too.

**The ticket folder is where Flow accumulates everything** — `plan.md`, `brainstorm/map.md`, `report.md`, `## State`, and `issues.md` once F18 lands. None of it is an input to the pass whose whole job is filing.

**The fix, corrected twice by the user on 2026-08-18. Two steps, and only the second one is the filing pass.**

1. **Capture — continuous, any phase, no filing pass involved.** A finding gets written where it lands: the ticket's `issues.md`, the brainstorm's `map.md`, or `docs/inbox.md`. Nothing decides altitude and no skill is touched. `## Capture` in `global/CLAUDE.md` already runs this way and already says it — *"Never shape at capture time."*
2. **Promote — manual, batched, whenever the user chooses.** The user types the filing pass, possibly after three or four tickets have closed, and it sweeps all of them at once. It decides altitude and writes into skills, `docs/context/` and `CLAUDE.md`.

**`flow review` triggers nothing.** Reviewing means reviewing the implementation; the filing pass is the user's to fire and runs on their schedule, not the ticket's. A one-line reminder is the most any command may print.

**Two earlier versions of this fix were wrong.** The first said the pass needed no new input because review would promote everything. The user's counter: a ticket produces best practices, principles and general knowledge as well as build findings, and placing those needs the altitude judgment nothing at review performs. The second version kept a promotion step inside `execute` Phase 4, which put a manual skill on an automatic trigger and used *promote* for what is only capture.

**The pass therefore gains a third input: closed tickets not yet filed.** The mid-build risk that argued against reading tickets does not apply — the queue holds closed tickets only, so nothing it files describes work still moving. Batching across several tickets is the normal case, not an edge case.

**The marker, and it is the user's design.** A `filed` key in the ticket's frontmatter, holding the date. The filing pass sets it by running a `flow` command once it finishes that ticket, so `flow` stays the only writer of frontmatter. **The command runs even when the ticket yielded nothing** — recording that it was looked at is what drains the queue. It takes several ids at once (`flow ticket filed t047 t048 t049`), because sweeping a batch is the normal case.

**How the pass finds its queue. Both, and the user settled it.** A dedicated list command is required, not deferred — `flow ls --unfiled`, which the pass runs as its first action to get the ids it will sweep. `flow status` also carries a one-line count, which is the reminder that filing is owed. My recommendation was to ship only the `status` line and add the query later if the list outgrew a screen; the user overturned it, and the argument is that the pass needs a machine-readable queue as an input rather than a number a human reads.

**Rejected: inferring it from an empty `issues.md`.** Proposed earlier here, and it fails twice. The user will not empty `issues.md` — it stays as the record of what happened, which is the same reason `debug` keeps `report.md`. And `issues.md` covers only build findings, so an artifact check cannot see whether the general knowledge was ever harvested.

**Dropped objection: a self-report is not evidence.** Raised against the field, and it proves too much. The agent decides when to run `flow review` and `flow done` as well, so if judging your own completion disqualified a field, `status` would be disqualified first. `filed` is exactly as trustworthy as `status`, which Flow already treats as authoritative.

**It does not duplicate `status`.** `status: done` claims the work is finished. `filed: 2026-08-18` claims the knowledge was harvested. Two different claims, and a closed ticket with no `filed` date is the gap worth reporting — one more rule for `flow check`.

**The inbox half needs no marker.** `docs/inbox.md` is drained to empty by design, so emptiness already answers the question there.

**Rejected: two modes inside the skill**, one for an open ticket and one after. `writing.md:47` — a condition holding for the whole run gets stated once, never per step, because every reader reads every path on every run. Two modes doubles the file and the reader still has to pick. The closed-only queue removes the need for a second mode anyway.

**Walked and holding: the fast and slow halves.** The skill says work at triage speed, then carries a slow half that builds or reshapes a skill from `write-skills.md`. Those read as contradictory until the gate is noticed: a fact with no home gets flagged in the inbox as `needs skill:`, and **several flags on one subject earn a skill, one flag is not evidence**. The slow half fires rarely and on accumulated evidence. No fix needed.

**What would overturn it.** A `filed` date nobody ever looks at. If the closed-and-unfiled list is never read, the field is bookkeeping with no reader and the queue should be the archive folder itself, scanned each run.

### F20 — Five skills write durable facts into a folder that one skill opens, at the wrong end of the work

**FIXED 2026-08-18.** `execute` Pass 1 now opens "**Open `docs/context/` before the code**, and read what touches this ticket", ahead of reading the code, with the reason: opened at review instead, the folder can only judge code that already exists.

**Fix now.** One line in `execute` Pass 1. The largest gap the teardown has found, because it makes every other filing decision worthless.

**What `docs/context/` is.** A folder of durable project facts, one file per subject — a verified command, a path that matters, a convention the project settled on. `global/CLAUDE.md` routes to it from `## Capture`, and it is the destination the whole filing pass exists to fill.

**Counted across the live surface: eight instructions write there, one reads.** `global/CLAUDE.md`, `brainstorm`, `debug`, `research`, `update-context` and `workflow.md` all say to write a durable fact there. The single read is `skills/execute/review-code.md:24`, which consults it during the code-review pass to decide whether a convention overrides a review flag.

**That read is at the wrong end.** Code review happens in Phase 4, after the code exists. So the file that would have said *how to write this correctly* gets opened only to judge what was already written. A convention discovered three tickets ago changes nothing about how the fourth ticket is built.

**Walked.** `flow start t047` → Phase 1 reads the ticket body, its `## State`, its `brainstorm/map.md`, and the code it touches. Pass 1 then reads the code the ticket changes and writes down what is there. Neither list names `docs/context/`. So a plan gets written against the code as it stands and against nothing the project has ever learned about that code.

**How browser-harness solves the same problem** (`wip/refs/browser-harness`, read 2026-08-18). Its accumulated knowledge lives in `agent-workspace/domain-skills/<host>/`, one folder per site, 99 of them. **Retrieval is mechanical: the agent never decides to look.** `goto_url(...)` returns up to 10 matching skill filenames for the host it just navigated to, so the tool call the work already requires is what surfaces the knowledge. The files themselves are shaped alike — what to do first, working code with real observed output inline, then a long `## Gotchas` list where each entry is one failure and its fix.

**What transfers, and what does not.** Flow has no key as clean as a hostname, and one folder per file path would be nonsense — do not copy the structure. What transfers is the principle: **accumulated knowledge pays off only where the work itself surfaces it.** Flow's equivalent moment already exists — `execute` Pass 1, the pass that records what the code looks like today.

**The fix.** Pass 1 lists `docs/context/` and reads what matches this ticket, before writing the current-state section. One line, no new machinery, and it puts the read at the moment the knowledge changes the plan rather than the review.

**Already consistent with the workflow.** `debug/SKILL.md:38` states the same principle for its own output: *"`## State` is deleted when the ticket closes and this is not — a cause found once is worth finding again."* Nothing here is a new idea; it is the read half of a rule the skills already state on the write half.

**What would overturn it.** A project whose `docs/context/` grows past what Pass 1 can scan. Then the folder needs an index, and the read becomes a lookup rather than a list.

### F21 — The filing skill's name says neither what it does nor what it touches

**FIXED 2026-08-18. The name is `file-findings`**, confirmed explicitly by the user rather than left to silence. The folder moved, the frontmatter `name:` changed, and both mentions were carried across — `global/CLAUDE.md:45` and this repo's `CLAUDE.md:97`. `link.sh` was **not** run: nothing is installed and nothing will be until the workflow is finished.

**Fix now, name still open.** Raised by the user 2026-08-18, who is certain the rename happens and rejected both the current name and their own first replacement.

**The name is `update-context`.** Two problems, and the second is the real one. *Update* is wrong because the skill also creates — a new file under `docs/context/`, a new skill where nothing fits. *Context* is the generic word `writing.md` warns against spending the stressed final position on, and it names no material: everything an agent reads is context.

**Rejected: `update-flow`,** the user's own first candidate. The skill mostly writes *project* files — `docs/context/`, the project `CLAUDE.md`, an existing skill. Writing about Flow itself is one destination out of six in `## Capture`, so this name points at the smallest part of the job and would make an agent skip the rest.

**Recommended: `file-findings`.** *File* is the verb for putting a thing where it belongs, which is the whole judgment the skill exists to make, and it covers creating a home as well as adding to one. The skill's own first line already calls itself *"The filing pass"* — the vocabulary was there and the name never caught up. *Findings* covers every kind of material it handles: a gotcha, a verified command, a settled convention, a rule about the code.

**Runner-up: `file-lessons`,** which loses because a lesson implies a mistake, and half of what gets filed is a plain fact nobody got wrong.

**Cost of the rename: three lines.** The folder, the `name:` in its frontmatter, and two mentions — `global/CLAUDE.md:45` and this repo's `CLAUDE.md:97`. Adding or renaming a skill is also the one case that needs `bash global/scripts/link.sh`.

## Walked and clean

Checked against a real case, start to finish, and held:

- **Ticket → pickup** — `execute` Phase 1 routes by type, then gives a feature or chore four outcomes. The decision the design called the only real one in the system has a home.
- **Brainstorm → spec** — Phase 4 routes every decision, `write-spec.md` picks the file by one test.
- **Spec → tickets** — `write-tickets`, V1 marks only, promotion before creation.
- **Plan → build → review** — `execute` Phases 2 to 4, two gates, both the user's.
- **Research → the work that needed it** — `## Where it goes` names four destinations by what the finding is.
- **A bug found mid-build** — `execute` routes to `debug`, `debug` dispatches a child ticket, `agents/debug.md` runs it and writes `report.md`.
- **Parent and children** — refused in `flow`, stated in three skills, and the parent returns to `flow next` when the last child closes.
- **Session ends** — `handoff` picks the destination before writing anything, which is what makes the rest follow.
- **The two things called research** — `research/SKILL.md` names the collision with `flow`'s `research` ticket type and resolves it in place.

Walk B ran the two hooks rather than reading them. Payloads on stdin, no install, nothing written outside `tmp/`:

- **What the guard does catch** — `git commit` and `git push` deny, `sudo` denies, `curl | sh` denies. `npm install` asks, `rm -rf ../other` asks. `git status` and `rm -rf tmp/walkb` stay silent. Every one confirmed by running it.
- **Every failure path in `snapshot.js`** — not a repo, no stored state, no tool id, unparseable input, no argument at all. All five exit 0, print nothing, and leave no state file behind.
- **The hook registration** in `global/settings.json` matches what the scripts expect: `--before` on PreToolUse for the Agent tool, `--after` on PostToolUse.
- **Two subagents corrupting each other's diff** — cannot happen. `execute` dispatches one worker in the foreground and waits, and its hard rules say to start nothing while a subagent runs.
- **Dropping a ticket with live dependents** — refuses, prints the whole transitive chain, offers `--by` or `--force`, and excludes a dependent from being re-pointed at itself. Only the two holes in F15 survive this.
- **`--from-brainstorm`** — refuses a folder with no `map.md`, and refuses one already inside `docs/tickets/`.
- **Where `research` clones to** — `tmp/refs/<tool>/`, which the shipped `project-template/.gitignore` already ignores. The nine embedded repos under this repo's own `wip/refs/` predate that convention and are a repo-hygiene item, not a workflow gap.

Walk C read the user's live project, `wip/tmp/Delapse/`, against the ticket folder Flow ships. One thing held:

- **A folder per unit of work, holding a spec, a brainstorm and a plan as separate files** — that is what Delapse's `docs/work/milestones/m30-dev-panel/` is, and it maps onto Flow's ticket folder file for file. The plan is a file of its own there for the same reason `execute` insists on it: the plan is the part that grows, and it is opened by one kind of session only.

## The second batch — what landed 2026-08-18

Approved in one message, built, and run against throwaway projects.

- **`store.js`** — `closed` in `TICKET_KEYS`, parsed and defaulted; `now()` beside `today()`; `reportFiles()`, which lists `reports/*.md` in a ticket folder.
- **`graph.js`** — `continuingTickets()`, the ready tickets whose parent is still in flight; `lastClosed()`, the newest `closed` stamp, resolving a same-minute tie to the later id.
- **`flow.js`** — `cmdStart` branches on whether an id was given; `closed` stamped on `done` and on both kinds of drop, cleared on every other transition and on `park`; two USAGE blocks rewritten.
- **`render.js`** — `brief()`, the session opener; `reports:` and `closed:` lines in `show`.
- **`commands/start.md`** — rewritten whole: one `!` line and the routing table.
- **`prototype`** — the ticket is the door, `research` and `visualize` invoked from inside it, the report moved into `reports/`.
- **`writing.md`, `execute`, `debug`, `agents/debug.md`, `handoff`, `file-findings`, `workflow.md`, `global/CLAUDE.md`** — the composition rule, the narrowed description, and the `reports/` sweep.

**Verified by running.** The briefing prints last-closed with its reports, the in-flight block, the continuing band, the ready list and the unfiled count; it degrades correctly on an empty project and on one where everything is blocked. Reopening a done ticket clears `closed`. `check`, `ls`, `tree`, `next` and `status` all still run.

**Verified 2026-08-18, against CLI 2.1.234.** A bare `/start` expands `$ARGUMENTS` to an empty string, so the injected line runs as plain `flow start`. Probed with a throwaway command under `tmp/`, because the documentation states this only for indexed placeholders — `$2` with no second argument stays in the text literally, and `$ARGUMENTS` does not. The same probe confirmed a `!` line runs without an `allowed-tools` grant under the current settings.

## The third batch — what landed 2026-08-18

The second batch overreached in two places and missed one line. All three came from the user reading it.

- **`prototype`** — the paragraph telling it to invoke `research` and `visualize` is deleted, nothing in its place. The rule is only that no skill may forbid another; a skill does not need instructions about which ones to reach for.
- **`render.js`** — the session opener prints `last closed  t005  Drop the legacy storage shim`. The status, the `closed` stamp and the report list are gone: they pushed the title to the right of the line, where the one thing a reader wants read as noise. `closed` still picks which ticket this is.
- **`brainstorm:104`** — a question the round cannot settle now cuts a ticket typed `prototype` with `flow ticket new`, instead of invoking the skill in the session that named the question, which that skill's own hard rule forbids. This is the line F4 predicted would have to change.
- **`research`** — F5, above.
