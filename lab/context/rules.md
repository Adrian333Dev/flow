# Rules: enforcing them, compressing them, and writing them

Everything behind Flow's rule files: `home/CLAUDE.md`, this repository's `CLAUDE.md`, and `rules/comments.md`. Three records merged on 2026-09-16, because they answer 3 halves of one question. How a rule is made to bind is the enforcement machinery. How a rule is worded decides whether it binds at all, and that splits again into the shape of the sentence and the writing the user will accept.

`backlog.md` → `### Rules and always-loaded files` carries every open item, and `references/style.md` is the live house style this record produced.

## Enforcement: the bridge, the conduct rules, and how a rule file loads

Locked across 5 sessions ending 2026-09-05, and built 2026-09-04 to 2026-09-07: capture into `.flow/findings/`, promotion through `/flow:file-findings`, `scripts/rule-check.js`, `scripts/instructions-loaded.js`, `flow scorecard` and a rule id on every rule. `home/CLAUDE.md` → `## Capture`, `/flow:file-findings` and `/flow:file-findings`' `references/write-checks.md` carry what was built, and git holds the research inventory and the build log. Cut on 2026-09-15 to what 4 open items in `backlog.md` still need.

### Locked decisions: the enforcement bridge

The **enforcement bridge** connects a rule written in a file to a check that runs while the agent works. Its design holds for every check written from here on. `backlog.md` → `### The audit` carries scoring a session, which extends it to conduct.

#### The three tiers

1. **Measure**: the rule is text the agent reads. A check counts violations silently. Nothing interrupts.
2. **Warn**: the same check runs before the edit and returns a message the agent reads. The edit proceeds.
3. **Block**: the same check rejects the edit. Reserved for rules with no false positives.

Most rules stay at measure. Promotion needs evidence from the scorecard.

#### One script does all three jobs

Recording, warning and blocking are the same check at the same moment. One `PreToolUse` hook on `Edit|Write` runs one script, and each check's own `tier` field decides what the script returns. No hook per rule, and no separate warning script.

`permissionDecisionReason` on an `allow` reaches the user, never Claude. A warning the agent must read goes in `additionalContext`.

The hook costs 31 ms per edit, measured over 10 runs on 2026-09-10. Nearly all of it is Node starting.

#### Knowing which rules are loaded

An `InstructionsLoaded` hook fires whenever a `CLAUDE.md` or a `.claude/rules/*.md` file enters context. It reports `file_path`, `memory_type`, `load_reason` and the `paths:` globs, and fires again with `load_reason: "compact"` after a compaction.

The scorecard keeps a per-session list of loaded files. A warning then takes 1 of 2 forms:

- **Rule file loaded** → the check's message plus the rule id. The agent already holds the full text.
- **Rule file not loaded** → the hook reads that rule's text out of the file and injects it in `additionalContext`.

Injecting beats telling the agent to go read the file: no extra turn, and no chance it skips the read. This path is unit-tested and has never run live.

#### The check files

One file per check at `scripts/rule-checks/<id>.js`, exporting everything about itself:

- `id`: groups the counts, and matches a rule id in a rule file
- `rule`: path to the file holding that rule
- `tier`: `measure`, `warn` or `block`
- `applies(path, content)`: is the rule relevant to this edit
- `check(path, content)`: was it followed
- `needs`: `'added'` for only the text this edit introduces, `'file'` for the whole file as it will read afterwards
- `message`: the one line the agent reads on a violation
- `since`: the date the check last changed materially, so `flow scorecard` skips counts an older version produced

**The folder is the registry.** Adding a check adds a file, and promotion changes one word. A check can be any JavaScript function, not only a regular expression. The boundary is whether a function tells violations apart reliably.

#### `flow scorecard`

Reads every session file under `~/.flow/scorecards/`, adds the counts, and prints 4 lists:

- **Stale checks**: the check names a rule id no rule file defines
- **Violated most**: rule, count, rate
- **Ready for promotion**: past the threshold, meaning measure becomes warn
- **Never applied**: loaded every session, never once relevant

Thresholds start at 5 violations and a 60% rate. Both are guesses until real data exists. The summary states its own coverage, `12 rules measured, 89 not measurable`, so a clean report never reads as a clean session.

#### Recording

- **Append one line per result.** Never read, modify and write back: 2 hooks firing close together overwrite each other's counts.
- **Each session file records its project.** That answers "violated in one project and nowhere else", the signal a global rule should have been project-scoped. Free now, impossible to backfill.
- **A session with no edits writes no file**, so the reader handles a missing one.
- **A wrong warning goes to `.flow/findings/scorecard.md`**, which `/flow:file-findings` already drains. Block only after path scoping and pattern refinement clear the false positives.

#### What counts as a dead rule

`relevant = 0` across many sessions, and nothing else. The situation the rule governs stopped arising, so the rule pays context rent for a case that no longer exists.

**Never violated is not a dead rule.** A rule only gets written after a real mistake, so zero violations means the fix took. For a promoted rule, zero violations means the warning is doing the work.

#### Tracking what was read

The scorecard reads the current session's transcript at `~/.claude/projects/<project>/<session-id>.jsonl`. No second hook on `Read`, which fires far more often than `Edit`. Cache the byte offset already scanned. This is what makes "read `style.md` before writing a skill" a check somebody can write.

#### Global and project scope

Checks live at `scripts/rule-checks/`, global to the machine. A project check would live at `.flow/checks/<id>.js`, with the scorecard loading both folders. **Only the global half is built**: no project needs one yet, and a mechanism built ahead of its first case gets built wrong.

#### Who writes the checks: `/flow:file-findings`

Set by the user 2026-09-05. **A rule and its check are written at the same moment.** A check starts at `measure`, which interrupts nothing, so one built from a single example costs nothing when it turns out wrong. Waiting for more examples leaves the rule unmeasured for exactly as long as you wait.

### Locked decisions: conduct rules

Locked 2026-09-05.

#### Two kinds of rule

**Output rules** say what a file must contain: comment density, naming, no em dashes. They attach to a file, a path often selects them, and a function can usually check them. The bridge above was built for them.

**Conduct rules** say how the agent behaves in the conversation: when it edits, when it asks, when it speaks, how much it explains. They attach to no file. No path selects them and no function checks them. Every rejected reply in `rejected-replies.md` is a conduct failure, so conduct is where the observed damage is.

#### A rule written only as a prohibition amplifies whatever the model already does

The approval rules written from the 2026-08-10 study cases, both Opus 5 acting on a discussion, said only what approval is **not**. An agent reading them under any uncertainty resolves toward not acting, because that is the only direction the text points. On a model that leans eager the brake corrects it. On a model that leans cautious the brake compounds, which is the Sonnet 4.6 behavior the user reported.

**So every conduct rule states its default action, not only its forbidden one.** That is what makes a rule behave the same across models.

#### One rule set for every model

No model detection and no per-model instructions. Every rule has to work on any model, which is why the positive side above is required. `models.md` records the case for a per-model overlay once measurement earns it.

#### Rules no function can catch

Those get a `UserPromptSubmit` hook injecting a short reminder each turn. Built 2026-09-15 as one fixed line in `references/reminder.md`. **Cost is no constraint**: a session runs about 20 turns, and a 40-line reminder costs under 1,000 tokens across all of them. What decides the shape is what the agent still reads on turn 15.

#### "Go means finish everything" needs the wrap-up hook

Cut from `home/CLAUDE.md` on 2026-08-31, because a run with no brake is worse than a run that stops early. The brake is a hook watching the token count that tells the agent to stop at the next checkpoint. `one-approval-runs-to-the-end` came back before that hook exists, so runaway sessions are possible until it lands. `backlog.md` → `### Context and session boundaries` carries the hook.

#### A study case says `fixed` the moment its rule changes

The 3 cases written 2026-09-06 (`summary-instead-of-work/`, `reopened-settled-points/`, `answered-before-acting/`) were filed `status: fixed`, `fix: home/CLAUDE.md`, the day `## The turn` was written from them. Each maps to one step: step 1 for the restatement, step 3 for the settled points, step 5 for the split answer. None of those steps has run in a real session since, so `fixed` records a rule written, never a rule that worked. `backlog.md` → `### flow, the tool` carries the item.

### `.claude/rules/` is a standard Claude Code feature

Verified against `code.claude.com/docs/en/memory` on 2026-09-05. `docs/dev/claude-code.md` → `## How an instruction file loads` holds the loading facts.

**`paths:` triggers on a read, never on a write.** "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use." An edit is safe, because an edit follows a read. **Creating a new file is not**: write `src/foo.ts` in a session that read no `.ts` file and the TypeScript rule was never in context. The bridge fills that hole: the `PreToolUse` hook fires on `Write` whatever loaded, and the warning injects the rule text when the file never loaded. Filed as `anthropics/claude-code` #93248.

**An unconditional rule file saves no context.** It loads at launch exactly like the text it replaced.

**Flow's symlinked rules are skipped in Cowork desktop sessions.** Those sessions skip a symlinked `~/.claude/rules/` directory or rule file resolving outside the working directory, and `flow install` links every rule file into the Flow clone. Terminal and IDE sessions are unaffected. `CLAUDE.md` is copied rather than linked, so that half is safe.

**Block-level HTML comments are stripped** before a `CLAUDE.md` enters context, so placeholder comments cost nothing.

## Compression: the negation split

The compression pass was locked 2026-08-18 and applied to every skill. Its rules became `references/style.md` §6, §7 and §9, and git holds the rest. Cut on 2026-09-15 to the one idea still open, which `backlog.md` → `### Rules and always-loaded files` carries as a talk-first item.

**Write a prohibition for a rule the agent breaks under pressure. Write a positive recipe where the output comes out the wrong shape.** Never soften either with an "unless it matters" clause.

Source: `repos/superpowers/skills/writing-skills`, read 2026-08-18. `bash lab/scripts/repos.sh` restores the clone.

`references/style.md` §5 already carries a near relative: "Write an action positive. Write a boundary negative." Whether that sentence settles the split, or every rule in both `CLAUDE.md` files still needs sorting into the 2 kinds, is the open question.

## The user's feedback on how a rule file is written

Kept verbatim, with the change each piece produced. `references/style.md` §6, §7 and §9 were written from it, and the next rewrite of any loaded file reads it first. This section covers files an agent loads; a rejected message to the user goes in `rejected-replies.md` instead.

**Entries stay.** Unlike a rejected message, feedback on writing style is the evidence a future rewrite is checked against.

### The principle: direct

State the rule. Nothing argues for it, nothing explains the mechanism behind it, and nothing spells out a consequence the reader works out alone. Four tests, each from one of the examples below:

1. **A command is one executable line, then what it prints.** Never "there are commands, and command A does X".
2. **A limit is a number.** Never a number plus a contrast with what the number is not.
3. **An override is read where it is written.** Never a list of the places one could come from.
4. **The reader is intelligent.** A rule that would insult a competent colleague's intelligence insults the agent's too.

### 2026-09-07, the two examples that set the direction

Given after a session had argued the files were already tight and recommended two small changes.

> "We need a complete rewrite and simplification based on previous examples I fucking gave you. Where we agree that instead of saying coming up with so many justifications, you just, you know, for example, in the case of command, which was just one example, it wasn't just about commands, but it was just one example where they say, you know, let's say we have up command A, right? You just, you know, define command A, like, you know, command A, that's it. Instead of saying we have, you know, commands and we have command A, command A does following, we just define the command as a full executable line. You know, for example, command A. Returns following or does following, that's it. Very direct."

> "This is not just about cutting something. This is about fucking writing style. We just need to be very, very direct.! Period. Like in the In that you know fucking that you know like the Line where you say that's the limit never a target You know that's completely unnecessary fucking line You could have just said you know that you don't know the Default limit is 120 lines or something like that That's it very simple keep it very concise very simple!!!"

The line in question, from `home/CLAUDE.md` → `## Writing files`:

> `util fs tree` and `util ls` cut at the first full stop or 120 characters, so a second sentence is written and never seen. That is a bound, never a target.

The same session's reply was also rejected for its own language: "your whole response is a complete jargon as well". Words named since as jargon: *load-bearing*, *§7*, *dissolves*, *tally sheet*, *bound*.

### 2026-09-07, line by line on the first direct rewrite

The rewrite had cut the arguments and kept every rule. The user went through what was left.

**The path-default line.** Cut entirely.

> "I remove that every path here is a default line. Because it's, you know, like I don't think overwriting is no longer allowed considering how structured our workflow has become. And also, even if we kept it, you know, that example was kind of, you know, very terrible example. You know, like it was, you know, just too long. [...] we could've had something like: "All the paths can be overwritten" or "All the default paths can be overwritten"! There was like no absolutely no need to include shit like "A path in `## Preferences`, this directory's `CLAUDE.md`, or from the user wins."! You know, obviously, once we overwrite it in the preferences section, the agent will obviously see it where it's being overwritten, right?"

**The reader's intelligence.** The general rule behind the path line, and behind most of the cuts below.

> "one other thing we need to really take into consideration is that, you know, like the agent's intelligence. Because, you know, for example, in that path override example, for example, like, you know, you kind of assumed as if, you know, agent is a five year old or something, right? You didn't assume that, you know, agent can immediately figure out on its own that, you know, override line in the preferences section means that we overwritten that specific path, right? So you kind of need to, you know, really consider agent's, you know, like, intelligence as well. Because a lot of things the agent, you know, can really figure out on its own without any, even with minimal context."

**"Never a scratch file or working doc in its place."** Cut from `## The turn` step 5. It came from the 2026-09-06 study case `answered-before-acting`, and the sentence before it already says the last message carries the whole answer.

> "what's the purpose of "Never a scratch file or working doc in its place." line? It feels like, you know, quite unnecessary to me, to be honest."

**Three description bullets became one.** The tool's cut-off went with them.

> "I think you can fully merge the **A description is a few words.** to **Name doesn't say what it holds → a `description:` line at the top** rule! And also, I think the section where you say, you know, the utilfs3 and utills cut it at the first full stop or 120 characters, that's completely unnecessary line. Like, obviously, we're going to feed the agent with those descriptions, but we don't have to, you know, like explain to the agent that it works like that. The agent doesn't need to know that at all."

> "**A description is an index entry, not the file's docs.** Needs to get you know like compacted or merged to some of the other rules [...] you don't have to say shit, you know, like you know, that a skills front matter description is different, right? I mean, you can include something like that, but maybe in our root CLAUDE.md file while we're working on this workflow [...] I think we can just have a single rule about the description which could include everything very concisely."

The skill frontmatter note was already in `references/style.md` §8 and in the repo `CLAUDE.md` → `## Authoring a skill`, so it went nowhere new.

**`## Workflow` lost its intro line and three of five triggers.**

> "in the workflow section "Five fire on a situation, not a phase, in any phase or none:" line is very confusing! We either need to remove it or reword it better. Also, in that workload section, I think we have a lot of unnecessary stuff. For example, the line where we mentioned the debug skill. I think it's unnecessary, right? Because we already mentioned that skill in the execute skill, and the same goes for the prototype and even research as well. We already defined them in proper places, including the skills that they actually needed, right? And also, you need to consider that they are already listed in the agent's context anyway. So, the agent is aware of those tools with their descriptions as well."

`/flow:execute` routes to `/flow:debug`, `/flow:groundwork` routes to `/flow:research` and `/flow:visualize`. No skill routes to `/flow:prototype`; its description in the skill listing is its only trigger now, and the `/flow:research` description beside it already separates reading from running.

**The pointer to `workflow.md`.**

> "we can completely rewrite it in a much concise way. Like, it's just too detailed, includes unnecessary details. We could have just said something like read only if you need more context about workflow or something like that."

**The `docs/` and `.flow/` paragraph, and the git-repo line.** Both cut from `## Capture`. `references/workflow.md` → `## Inside each place` already carries the two roots, and `scripts/flow/lib/root.js` already refuses to run outside a git repo.

> "that "**`docs/` and `.flow/` both always exist**" rule is mostly unnecessary! Like, why don't we have to say stuff like, you know, docs folder and flow folder both always exist? Completely unnecessary. Like, whenever we need that folder, we define its path and stuff, right? [...] Like, in what scenario agent would need it even? Let's say, you know, we're starting execution, you know, like groundwork on some ticket. When we started, you know, we already load the skill, right? And skill already defines where, you know, like, defines the commands."

> "**`flow` needs only a git repo.** The rule is also quite unnecessary as well. Like, if Git repo is a requirement, we can just add some mechanism that where you know we just don't allow this [...] We'll basically won't allow the workflow to function without a Git repo, right? That's it, very simple."

**`## Capture` named no file and routed rules the old way.**

> "you're saying, you know, like, rude about the code to the rule section. You know, you mentioned your preferences section. You mentioned, you know, like, you know, the user section and stuff. You're not clarifying what in what file, right? Because we kind of have two, two global, you know, two CLAUDE.md files. One will be the global one, the other one will be the project specific one, right? We need to really clarify in what path agent is going to, you know, like, make what edits. Also, I think it's kind of outdated considering the new rule mechanism [...] it's actually the capture mechanism that captures them. And then file findings, you know, promotes them to rule or something."

Every route now names its file. A rule noticed during work goes to `.flow/findings/<subject>.md`, and `/flow:file-findings` decides between a skill, `rules/`, `.claude/rules/` and the project `CLAUDE.md`. A warning from a wrong rule check goes to `.flow/findings/scorecard.md`, which the enforcement bridge above had locked and `## Capture` never carried.

**The heading example.**

> "the example you came up with is really terrible and barely understandable. Can't you just come up maybe with a more clear example?"

Was: *"Overrides work: two hooks, because a skill can be invoked two ways", never "The hook fires, and the typed path bypasses it"*. Is: *"The cache is the bottleneck", never "Cache performance" or "Is the cache the problem?"*

**Pointing at an earlier message.**

> "the most recent ones you did, for example, you were just referencing to something from my previous messages, but you were not clarifying what you were fucking referencing to."

The rule *The user does not remember the conversation* became *Never point at an earlier message*, with the restatement as the action.

### 2026-09-07, on the direct rewrite itself

**A rule must not claim more ground than it has.** *Every file gets the writing pass* read as a rule over source code.

> "when it comes to that first line in the writing file section, where you say, you know, every file gets a writing pass, it's not really every file, right? It's more like, you know, like MD files or something. You know, it's actually like, it's more like about the skills and, you know, context files and stuff. [...] if we're, you know, like maybe writing some TypeScript file or something, we clearly don't need it, right?"

The rule is now *Every markdown file gets it*, in both `CLAUDE.md` files, and it lists what that covers: a skill, a doc, a ticket, a finding, a `CLAUDE.md`, a README. It stayed in `home/CLAUDE.md` on the test in `references/style.md` § 3: a plain "write me a README" loads no skill, so no skill can own the rule.

**A section pointer is an anchor.**

> "instead of something like \"`## Preferences` in `~/.claude/CLAUDE.md`\" should we just use something like \"`~/.claude/CLAUDE.md#preferences`\" instead? it'd be shorter."

Both `## Capture` routes are anchors now, and so is the pointer inside *Judge what to explain against `#the-user`*. The bare `#the-user` form is used where the file naming it is the file being read.

### What models cut in testing, 2026-09-07

Four models rewrote the same sections of `home/CLAUDE.md` against the same list of faults. `state.md` carries the verdict. Three lines were cut by more than one model and looked at one by one:

- `/flow:debug` fires on "wrong but running" behavior too. Kept, as *including wrong-but-running behavior*, until the trigger itself was cut on the user's call above.
- `/flow:prototype` fires "where reading could not". Dropped with the trigger. The `/flow:prototype` and `/flow:research` descriptions already say running versus reading.
- "Most faults found late were in the thing already written, because nobody ever ran it." Cut on the direct-writing ruling. The rule *Walk what already exists too* stands alone.

### What the earlier sessions got wrong

- Used "bound" for "upper limit" without defining it.
- Introduced an em dash into a rewritten sentence.
- Wrote "the file" and "§9" without naming which file or which section.
- Cut a trigger condition in a test and flagged it afterwards, instead of preserving it in the same pass.
- Argued that the files were already tight and recommended two small changes, in a reply written in jargon. The user rejected both the recommendation and the reply.
