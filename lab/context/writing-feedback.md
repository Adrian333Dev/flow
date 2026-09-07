# Writing feedback

The user's feedback on how Flow's rule files are written, kept verbatim, with the change each piece produced. `references/style.md` §6, §7 and §9 were written from it, and the next rewrite of any loaded file reads it first. `shit-explanations.md` is the sibling file for messages to the user; this one is for files an agent loads.

Entries stay. Unlike a rejected message, feedback on writing style is the evidence a future rewrite is checked against.

## The principle: direct

State the rule. Nothing argues for it, nothing explains the mechanism behind it, and nothing spells out a consequence the reader works out alone. Four tests, each from one of the examples below:

1. **A command is one executable line, then what it prints.** Never "there are commands, and command A does X".
2. **A limit is a number.** Never a number plus a contrast with what the number is not.
3. **An override is read where it is written.** Never a list of the places one could come from.
4. **The reader is intelligent.** A rule that would insult a competent colleague's intelligence insults the agent's too.

## 2026-09-07, the two examples that set the direction

Given after a session had argued the files were already tight and recommended two small changes.

> "We need a complete rewrite and simplification based on previous examples I fucking gave you. Where we agree that instead of saying coming up with so many justifications, you just, you know, for example, in the case of command, which was just one example, it wasn't just about commands, but it was just one example where they say, you know, let's say we have up command A, right? You just, you know, define command A, like, you know, command A, that's it. Instead of saying we have, you know, commands and we have command A, command A does following, we just define the command as a full executable line. You know, for example, command A. Returns following or does following, that's it. Very direct."

> "This is not just about cutting something. This is about fucking writing style. We just need to be very, very direct.! Period. Like in the In that you know fucking that you know like the Line where you say that's the limit never a target You know that's completely unnecessary fucking line You could have just said you know that you don't know the Default limit is 120 lines or something like that That's it very simple keep it very concise very simple!!!"

The line in question, from `home/CLAUDE.md` → `## Writing files`:

> `util fs tree` and `util ls` cut at the first full stop or 120 characters, so a second sentence is written and never seen. That is a bound, never a target.

The same session's reply was also rejected for its own language: "your whole response is a complete jargon as well". Words named since as jargon: *load-bearing*, *§7*, *dissolves*, *tally sheet*, *bound*.

## 2026-09-07, line by line on the first direct rewrite

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

`/execute` routes to `/debug`, `/groundwork` routes to `/research` and `/visualize`. No skill routes to `/prototype`; its description in the skill listing is its only trigger now, and the `/research` description beside it already separates reading from running.

**The pointer to `workflow.md`.**

> "we can completely rewrite it in a much concise way. Like, it's just too detailed, includes unnecessary details. We could have just said something like read only if you need more context about workflow or something like that."

**The `docs/` and `.flow/` paragraph, and the git-repo line.** Both cut from `## Capture`. `references/workflow.md` → `## Inside each place` already carries the two roots, and `scripts/flow/lib/root.js` already refuses to run outside a git repo.

> "that "**`docs/` and `.flow/` both always exist**" rule is mostly unnecessary! Like, why don't we have to say stuff like, you know, docs folder and flow folder both always exist? Completely unnecessary. Like, whenever we need that folder, we define its path and stuff, right? [...] Like, in what scenario agent would need it even? Let's say, you know, we're starting execution, you know, like groundwork on some ticket. When we started, you know, we already load the skill, right? And skill already defines where, you know, like, defines the commands."

> "**`flow` needs only a git repo.** The rule is also quite unnecessary as well. Like, if Git repo is a requirement, we can just add some mechanism that where you know we just don't allow this [...] We'll basically won't allow the workflow to function without a Git repo, right? That's it, very simple."

**`## Capture` named no file and routed rules the old way.**

> "you're saying, you know, like, rude about the code to the rule section. You know, you mentioned your preferences section. You mentioned, you know, like, you know, the user section and stuff. You're not clarifying what in what file, right? Because we kind of have two, two global, you know, two CLAUDE.md files. One will be the global one, the other one will be the project specific one, right? We need to really clarify in what path agent is going to, you know, like, make what edits. Also, I think it's kind of outdated considering the new rule mechanism [...] it's actually the capture mechanism that captures them. And then file findings, you know, promotes them to rule or something."

Every route now names its file. A rule noticed during work goes to `.flow/findings/<subject>.md`, and `/file-findings` decides between a skill, `rules/`, `.claude/rules/` and the project `CLAUDE.md`. A warning from a wrong rule check goes to `.flow/findings/scorecard.md`, which `design-knowledge-base.md` had locked and `## Capture` never carried.

**The heading example.**

> "the example you came up with is really terrible and barely understandable. Can't you just come up maybe with a more clear example?"

Was: *"Overrides work: two hooks, because a skill can be invoked two ways", never "The hook fires, and the typed path bypasses it"*. Is: *"The cache is the bottleneck", never "Cache performance" or "Is the cache the problem?"*

**Pointing at an earlier message.**

> "the most recent ones you did, for example, you were just referencing to something from my previous messages, but you were not clarifying what you were fucking referencing to."

The rule *The user does not remember the conversation* became *Never point at an earlier message*, with the restatement as the action.

## 2026-09-07, on the direct rewrite itself

**A rule must not claim more ground than it has.** *Every file gets the writing pass* read as a rule over source code.

> "when it comes to that first line in the writing file section, where you say, you know, every file gets a writing pass, it's not really every file, right? It's more like, you know, like MD files or something. You know, it's actually like, it's more like about the skills and, you know, context files and stuff. [...] if we're, you know, like maybe writing some TypeScript file or something, we clearly don't need it, right?"

The rule is now *Every markdown file gets it*, in both `CLAUDE.md` files, and it lists what that covers: a skill, a doc, a ticket, a finding, a `CLAUDE.md`, a README. It stayed in `home/CLAUDE.md` on the test in `references/style.md` § 3: a plain "write me a README" loads no skill, so no skill can own the rule.

**A section pointer is an anchor.**

> "instead of something like \"`## Preferences` in `~/.claude/CLAUDE.md`\" should we just use something like \"`~/.claude/CLAUDE.md#preferences`\" instead? it'd be shorter."

Both `## Capture` routes are anchors now, and so is the pointer inside *Judge what to explain against `#the-user`*. The bare `#the-user` form is used where the file naming it is the file being read.

## What models cut in testing, 2026-09-07

Four models rewrote the same sections of `home/CLAUDE.md` against the same list of faults. `state.md` carries the verdict. Three lines were cut by more than one model and looked at one by one:

- `/debug` fires on "wrong but running" behavior too. Kept, as *including wrong-but-running behavior*, until the trigger itself was cut on the user's call above.
- `/prototype` fires "where reading could not". Dropped with the trigger. The `/prototype` and `/research` descriptions already say running versus reading.
- "Most faults found late were in the thing already written, because nobody ever ran it." Cut on the direct-writing ruling. The rule *Walk what already exists too* stands alone.

## What the earlier sessions got wrong

- Used "bound" for "upper limit" without defining it.
- Introduced an em dash into a rewritten sentence.
- Wrote "the file" and "§9" without naming which file or which section.
- Cut a trigger condition in a test and flagged it afterwards, instead of preserving it in the same pass.
- Argued that the files were already tight and recommended two small changes, in a reply written in jargon. The user rejected both the recommendation and the reply.
