# Writing a context file

Applies to every markdown an agent reads — skills, `CLAUDE.md`, workflow docs — and to prose written for the user. One style, no exceptions.

## 1. Plan the shape first

Name the sections and their order before writing a sentence. Mark each piece as one of two kinds:

- **Step** — an ordered action the agent performs.
- **Reference** — a definition, rule or path consulted on demand.

Steps first, in order, with the whole sequence visible before any detail. Reference after, or in a sub-file. Never discover the structure while typing.

Plan the whole file every time you touch it. A pointer to one line is not a scope.

## 2. Section shapes

- **Where things live** — paths, files, what each holds → a labeled list: the path as the label, one line of what is in it. Never write prose about placement. `## References` in `home/CLAUDE.md` is the model.
- **A procedure** → numbered steps, each ending on a check the agent can evaluate. "Every behavior carries a mark" is a check; "understanding reached" is not.
- **Rules at one altitude** → a flat bulleted list under one heading.

One heading per concept, with its definition, rules and exceptions together underneath. Scattered material reads as noise.

Standard markdown, always: `-` for unordered, `1.` for ordered, `- [ ]` for a checklist. Nest as deep as the material needs. Never invent a layout markdown already has. Default to a list.

Put the highest-stakes rules first or last. Material in the middle of a long file is read least.

## 3. One home per fact

- A rule that fires in one situation lives in the file that loads in that situation, and drops the clause saying when it applies.
- Every fact in exactly one place, a pointer everywhere else. Two copies drift and the reader cannot tell which is current.
- Never restate what is already loaded: the global `CLAUDE.md`, the project `CLAUDE.md`, or any skill's own description.
- Never rule against a behavior nothing here instructs. A ban on something the workflow never sets up invents the problem it forbids.
- Never forbid reaching for another skill. Naming which skill owns a *job* is routing and belongs; writing that a kind of work — reading, drawing, hunting a bug — is another skill's reads as a ban, and strands whoever needs it mid-task. Any skill may invoke any other.

**The test for an always-loaded file:** name a moment the rule fires and no skill is loaded. Cannot → it belongs in the skill.

## 4. Branching a step

A step whose content changes with the situation. Three kinds, each with its own shape.

**Write the base first.** Put what is true in every case above the first case. Never repeat it inside one.

**Never branch for examples alone.** A case that only swaps the nouns is not a case — write the instruction in domain-free words, then give examples from more than one domain. Branching for examples doubles the file and adds no instruction.

- **Pick one target, then the step ends** → a `→` list, one line per case, every case covered. `## Capture` in `home/CLAUDE.md` is the model.
- **Extra material some runs need** → `### When <situation>` below the base. These add to the base and to each other, so one run hits none and the next hits four. Name the situation that fires each.
- **A condition that holds for the whole run** → state it once at the top, never per step. Asked in five places, one question gets five different answers. Every reader also reads every path, on every run.

**One case is a sentence. Two or more is a list.**

**When a case changes more than half the step, give it its own file.**

## 5. Sentences

Three tests. Run them on every sentence that carries a rule, and on every sentence written to the user.

1. **Cover everything past word 2.** Is the direction already right? "Never expose the bookkeeping" — yes, at word 1. "Keep the bookkeeping out of the conversation" — no. Word 2 says preserve it; word 5 reverses that.
2. **Read the last two words alone.** Do they carry the point? Readers stress whatever ends a sentence. "…the bookkeeping" lands it. "…the conversation" spends the loudest position in the sentence on its most generic word.
3. **Act on it after one read.** Re-reading to find the instruction means rewrite it.

### Where the words go

- **Front-load the polarity and the verb.** `Never`, `Always`, or the verb itself comes before the object. A qualifier that arrives after the object arrives too late.
- **Never make the reader restart.** A sentence meaning one thing at word 3 and the opposite at word 6 has failed, however short it is.
- **End on the point.** The last word gets stressed and remembered. Put the specific word there. Endings like "the conversation", "the file", "the process" waste it.
- **Never end on the rejected half.** "Attack it by running it, not by rating it" stresses *rating*. Split it: "Attack it by running it. Rating it finds nothing."
- **Condition left, action right, where a real condition exists.** "To delete the document, click Delete", never "Click Delete if you want to delete the document." The reader decides whether the rule applies before reading how to obey it — the shape behind Flow's `X → Y` bullets. A rule that always applies has no condition, so the verb goes first.

### The verb and the object

- **Finish the verb at the verb.** Split verbs park the meaning behind the object: `keep X out of`, `leave X out`, `hold X back from`. Use `expose`, `print`, `restate`, `delegate`.
- **Put the action in the verb.** "Depth is proportional to the branch" → "Match depth to the branch." Watch for `-tion`, `-ment` and `-ance` propped up by `is`, `make` or `do`.
- **Keep the object short and concrete.** "Read minimal context", not "Read the least that answers the question". An object that is an abstraction ("the least", "what fits") or carries a relative clause ("options the user did not bring") has to be assembled before it can be acted on.
- **Put nothing between the subject and the verb.** Readers treat an interruption there as unimportant and skim it.

### What kind of sentence

- **Write an action positive. Write a boundary negative.** A boundary's positive form is every allowed thing, which cannot be written; forcing it yields a false specific or a reversal. One negation, at word one, and none of the hidden ones: `unless`, `fail to`, `except`, `other than`.
- **Give the agent a verb it can perform.** "The job is coverage, not fidelity" has none and gets cut. "Never expose the bookkeeping" has one and stays. Short and memorable was never the defect.
- **Put a verb in each half of a contrast.** "Coverage, not fidelity" leaves the reader to derive the action from two abstract nouns.
- **One idea per sentence.** Split on every `and`, `so`, `then` and dash that joins two.
- **Define anything invented before first use.**
- **Use one word per concept, and the common word.**

## 6. Words

Cut what lengthens a sentence without clarifying it. Readability first; the token saving is small.

- Drop articles and filler verbs where the sentence still reads: "Grep it, read the matching slices", not "You should use grep on it and then read only the slices that match".
- Digits, not words: `5`, not `five`.
- Name a skill with its slash: `/groundwork`, never `groundwork`. The slash is what the user types, and it tells the skill from the ordinary word.
- Grammar bends where meaning survives. A fragment beats a padded sentence.
- Delete a whole sentence when it changes no behavior. Trimming it keeps the noise, and an instruction the model already follows by default says nothing.
- Symbols only where genuinely clearer than the word — usually they are not. They also save nothing: `→` and `·` are each their own token, as are invented abbreviations like `cfg`.

Last pass, after the structure is right.

## 7. Never cut these

- **A rule.** Compression removes words and duplication, never rules. Cutting rule count is banned as a strategy.
- **The reason**, wherever the rule does not cover every case. The reason is what generalizes to the case nobody enumerated. Bare all-caps MUST/NEVER with no reason is a warning sign in Anthropic's own guidance. Drop it only for a mechanical, fully specified constraint.
- **One example**, wherever the rule alone is ambiguous. Several examples of one pattern → keep the best one. Going to zero is the riskiest cut there is.
- **Information.** Cut words. A file that drops a load-bearing detail to look short has failed.

## 8. Frontmatter descriptions

The description is in context from the moment a session starts, whether the skill is ever invoked or not.

- **What it is and what it covers. Never the steps.** A description that summarizes the workflow gets followed instead of the file — an agent given "code review between tasks" did one review where the skill specified two.
- **Never when to invoke it.** A trigger written here is loaded by every session that never fires it. Write one only where it is wanted; `write-skills.md` names the 4 homes.
- **Under-explaining is the failure to avoid.** Cover the subject in enough detail that a reader can tell what the skill reaches — `/visualize` names its media, because nothing else says what it draws. No word count overrides that.
- **Typed-only (`disable-model-invocation: true`) → one short line.** The user already decided.

## 9. Transformations

Each pair is verbatim from one real rewrite: a global rules file, 187 lines / 2941 words down to 96 / 1324, no rule lost.

### State the test, delete the illustrations

Biggest single win. Four examples means the test was never written.

- **56w:** "**Picking an external tool** — MCP server, plugin, skill, library, app → read `~/.claude/toolbox/`, a catalog filed by the job you're doing: `video.md`, `voice.md`, `browser.md`, `ui-design.md`, `ui-libs.md`, `code-quality.md`, `security.md`, `prod-services.md`, `marketing.md`, `agent-tooling.md`, `automation.md`, `collections.md`, `inbox.md`. `README.md` indexes them and carries the install syntax for each kind. Read the one file that fits; never preload the set."
- **29w:** "`~/.claude/flow/toolbox/` — external tools filed by job: MCP servers, plugins, skills, libraries, apps. `README.md` indexes them and carries install syntax. Read the one file that fits, never the set"

### Delete the elaboration

Restatement and hedging around a rule already stated. The reason itself stays — see section 7.

- **39w:** "**Read minimal context.** Access to the codebase is not a mandate to read it — target by path and line range, prefer one filtered query over many reads, stop when the answer is in hand."
- **20w:** "**Read minimal context.** Path and line range, one filtered query over many reads, stop when answered."

### Delete the derivable

- **45w:** "**No project here?** Every project row collapses to the working file in front of you — the brainstorm doc, the notes file. Never create a `docs/` tree just to have somewhere to route to. The `~/.claude/flow/notes.md` row is unaffected; it is global and always available."
- **18w:** "Without one there is no `docs/` — every path below collapses to the file in front of you." The exemption follows from that path being absolute.

### Delete the rebuttal

A design debate fossilised into an instruction, arguing against an option the reader never heard of. Three deleted, nothing kept:

- "The test is commitment, not size — there is no backlog file"
- "**The tree is the decision log**; there is no `decisions.md`"
- "Nothing is called `plan.md`."

### Placement replaces conditions

A rule that fires at one moment goes in the file that loads at that moment, and drops the clause saying when it applies.

- **51 lines:** a whole `## Workflow` section — the chain, the pickup diagram, the departure clause.
- **1 line:** "`~/.claude/flow/references/workflow.md` — how Flow's pieces fit together. Only when that is genuinely unclear". The content moved there intact; the condition became the location.
- Same mechanism behind a skill's trigger living in its own `description:`.

### Move what a skill owns into the skill

A `## Rendering` section, near word-for-word what the drawing skill already said. Deleted, not trimmed — a second copy of a rule is worse than none, because the two drift.

### Merge sections at one altitude

`## Communication` and `## Explaining` were both "how to write to the user". Four bullets survived as three: "Explain artifacts from zero" was already covered by "Define from zero" plus "A pointer is not an explanation".

### Delete the file's own metadata

True, and useless to a reader already reading it.

- **49w:** a title, a blockquote, and a paragraph on where the file installs and what a project adds on top.
- **31w:** "Flow — an agentic development workflow for a solo developer. Work runs groundwork → tickets → plan → build, one skill per step; the rules below hold across all of them."

### Rejected: structure absorbs repetition

A table header carrying what each row would repeat. Dropped: a list is preferred to a table, so the header saves nothing worth the columns.
