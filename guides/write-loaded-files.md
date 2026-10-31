 # Write a loaded file

Beside `writing.md`, for any file that enters an agent's context: a rule file, a skill and its references, a command, an agent, a guide in `guides/`, a mod's prompt.

## 1. Mark each piece

While planning the sections, mark each piece as one of two kinds:

- **Step**: an ordered action the agent performs.
- **Reference**: a definition, rule or path consulted on demand.

Steps first, in order, with the whole sequence visible before any detail. Reference after, or in a sub-file.

## 2. Section shapes

- **Where things live**: paths, files, what each holds → a labeled list: the path as the label, one line of what is in it. Never write prose about placement. `## The folder` in `guides/write-tickets.md` is the model.
- **A procedure** → numbered steps, each ending on a check the agent can evaluate. "Every behavior carries a mark" is a check; "understanding reached" is not.
- **Rules at one altitude** → a flat bulleted list under one heading.

One heading per concept, with its definition, rules and exceptions together underneath.

Put the highest-stakes rules first or last.

## 3. One home per fact

- A rule that fires in one situation lives in the file that loads in that situation, and drops the clause saying when it applies.
- Every fact in exactly one place, a pointer everywhere else.
- Never restate what is already loaded: the global rule file, the project's rule file, or any skill's own description.
- Never rule against a behavior nothing here instructs.
- Never forbid reaching for another skill. Naming which skill owns a *job* is routing, and belongs. Writing that a kind of work (reading, drawing, hunting a bug) is another skill's is a ban. Any skill may invoke any other.

**The test for an always-loaded file:** name a moment the rule fires and no skill is loaded. Cannot → it belongs in the skill.

## 4. Branching a step

A step whose content changes with the situation. 4 kinds, each with its own shape.

**Write the base first.** Put what is true in every case above the first case. Never repeat it inside one.

**Never branch for examples alone.** A case that only swaps the nouns is not a case. Write the instruction in domain-free words, then give examples from more than one domain.

- **Pick one target, then the step ends** → a `→` list, one line per case, every case covered. `## Capture` in `home/CLAUDE.md` is the model.
- **Extra material some runs need** → `### When <situation>` below the base. These add to the base and to each other. Name the situation that fires each.
- **A condition that holds for the whole run** → state it once at the top, never per step.
- **How the run started, before any step runs** → an entrance list at the top of the file. Name what the reader can see: the words they typed, the command that ran, what is on disk. Never a state they would have to work out. Put what every entrance shares above the list, and leave only the difference on each line.

**One case is a sentence. Two or more is a list.**

**When a case changes more than half the step, give it its own file.**

## 5. Words

A word stays only where cutting it changes behavior.

- **Write instructions, nothing else**: in a loaded file, a hook's message, a refusal the agent reads. Explain only where the agent would otherwise get a case wrong, in one short clause.
- Drop articles and filler verbs where the sentence still reads: "Grep it, read the matching slices", not "You should use grep on it and then read only the slices that match".
- Grammar bends where meaning survives. A fragment beats a padded sentence.
- Delete a whole sentence when it changes no behavior. Never trim it.
- **Assume an intelligent reader.** Never write the consequence of a rule, the mechanism behind it, or the case it plainly covers. A command is one executable line, then what it prints. A rule is the rule, then nothing.
- **Mark a skill only the user can start (`disable-model-invocation: true`) as `(user only)` once**, where the agent reads it before any bare mention: `/flow:upkeep` (user only). One listed in `home/CLAUDE.md` → `user-only-skills` needs no other mark.

## 6. Frontmatter descriptions

**Claude Code loads every skill's frontmatter description whole into every session, and fires the skill from it alone.** Its length is set by the rules below and by nothing else.

- **What it is and what it covers. Never the steps.** A description that summarizes the workflow gets followed instead of the file.
- **Never when to invoke it.** Write one only where it is wanted; `knowledge.md` → `### Frontmatter` names the 4 homes.
- **Under-explaining is the failure to avoid.** Cover the subject in enough detail that a reader can tell what the skill reaches. `/flow:visualize` names its media, because nothing else says what it draws. No word count overrides that.
- **User only (`disable-model-invocation: true`) → one short line.** The user already decided.

## 7. Cuts from real rewrites

Each pair is verbatim from a real rewrite.

### State the test, delete the illustrations

Four examples means the test was never written.

- **56w:** "**Picking an external tool**: MCP server, plugin, skill, library, app → read `~/.claude/toolbox/`, a catalog filed by the job you're doing: `video.md`, `voice.md`, `browser.md`, `ui-design.md`, `ui-libs.md`, `code-quality.md`, `security.md`, `prod-services.md`, `marketing.md`, `agent-tooling.md`, `automation.md`, `collections.md`, `inbox.md`. `README.md` indexes them and carries the install syntax for each kind. Read the one file that fits; never preload the set."
- **29w:** "`~/.claude/flow/toolbox/`: external tools filed by job: MCP servers, plugins, skills, libraries, apps. `README.md` indexes them and carries install syntax. Read the one file that fits, never the set"

### Delete the elaboration

Restatement and hedging around a rule already stated. The reason itself stays: `writing.md` → `## 6. Never cut these`.

- **39w:** "**Read minimal context.** Access to the codebase is not a mandate to read it: target by path and line range, prefer one filtered query over many reads, stop when the answer is in hand."
- **20w:** "**Read minimal context.** Path and line range, one filtered query over many reads, stop when answered."

### Delete the derivable

- **45w:** "**No project here?** Every project row collapses to the working file in front of you: the brainstorm doc, the notes file. Never create a `docs/` tree just to have somewhere to route to. The `~/.claude/flow/notes.md` row is unaffected; it is global and always available."
- **18w:** "Without one there is no `docs/`: every path below collapses to the file in front of you." The exemption follows from that path being absolute.

### Delete the rebuttal

A design debate fossilised into an instruction, arguing against an option the reader never heard of. Three deleted, nothing kept:

- "The test is commitment, not size: there is no backlog file"
- "**The tree is the decision log**; there is no `decisions.md`"
- "Nothing is called `plan.md`."

### Placement replaces conditions

A rule that fires at one moment goes in the file that loads at that moment, and drops the clause saying when it applies.

- **51 lines:** a whole `## Workflow` section: the chain, the pickup diagram, the departure clause.
- **1 line:** "`~/.claude/flow/references/workflow.md`: how Flow's pieces fit together. Only when that is genuinely unclear". The content moved there intact; the condition became the location.

### Move what a skill owns into the skill

A `## Rendering` section, near word-for-word what the drawing skill already said. Deleted, not trimmed. A second copy of a rule is worse than none.

### Merge sections at one altitude

`## Communication` and `## Explaining` were both "how to write to the user". Four bullets survived as three: "Explain artifacts from zero" was already covered by "Define from zero" plus "A pointer is not an explanation".

### Delete the file's own metadata

True, and useless to a reader already reading it.

- **49w:** a title, a blockquote, and a paragraph on where the file installs and what a project adds on top.
- **31w:** "Flow: an agentic development workflow for a solo developer. Work runs groundwork → tickets → plan → build, one skill per step; the rules below hold across all of them."

### Rejected: structure absorbs repetition

A table header carrying what each row would repeat. Dropped: a list is preferred to a table, so the header saves nothing worth the columns.

### State the rule, cut the argument

A rule followed by the case for it, the mechanism behind it, or a consequence the reader infers. The rule stays, the rest goes.

- **Before:** "**Every path named here is a default.** One named in `## Preferences`, in this directory's `CLAUDE.md`, or by the user wins."
- **After:** deleted. An override is read where it is written. Had a line been needed: "Every path here can be overridden."

- **Before:** "**`docs/` and `.flow/` both always exist**, project or not, repo or not. Paths are created on first write. `docs/` is the project's own: the spec, durable facts, fetched research, anything there before Flow. `.flow/` is Flow's working store: tickets, groundwork, the inbox, the handoff."
- **After:** deleted. Every route under it names its own path.
