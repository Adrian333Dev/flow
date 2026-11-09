# Shapes

## Mark each piece

While planning the sections, mark each piece as one of two kinds:

- **Step**: an ordered action the agent performs.
- **Reference**: a definition, rule or path consulted on demand.

Steps first, in order, with the whole sequence visible before any detail. Reference after, or in a sub-file.

## Section shapes

- **Where things live**: paths, files, what each holds → a labeled list: the path as the label, one line of what is in it. Never write prose about placement. `## The folder` in `~/.flow/references/guides/write-tickets.md` is the model.
- **A procedure** → numbered steps, each ending on a check the agent can evaluate. "Every behavior carries a mark" is a check; "understanding reached" is not.
- **Rules at one altitude** → a flat bulleted list under one heading.

One heading per concept, with its definition, rules and exceptions together underneath.

Put the highest-stakes rules first or last.

## One home per fact

- A rule that fires in one situation lives in the file that loads in that situation, and drops the clause saying when it applies.
- Every fact in exactly one place, a pointer everywhere else.
- Never restate what is already loaded: the global rule file, the project's rule file, or any skill's own description.
- Never rule against a behavior nothing here instructs.
- Never forbid reaching for another skill. Naming which skill owns a *job* is routing, and belongs. Writing that a kind of work (reading, drawing, hunting a bug) is another skill's is a ban. Any skill may invoke any other.

**The test for an always-loaded file:** name a moment the rule fires and no skill is loaded. Cannot → it belongs in the skill.

## Branching a step

A step whose content changes with the situation. 4 kinds, each with its own shape.

**Write the base first.** Put what is true in every case above the first case. Never repeat it inside one.

**Never branch for examples alone.** A case that only swaps the nouns is not a case. Write the instruction in domain-free words, then give examples from more than one domain.

- **Pick one target, then the step ends** → a `→` list, one line per case, every case covered. `## Capture` in `home/CLAUDE.md` is the model.
- **Extra material some runs need** → `### When <situation>` below the base. These add to the base and to each other. Name the situation that fires each.
- **A condition that holds for the whole run** → state it once at the top, never per step.
- **How the run started, before any step runs** → an entrance list at the top of the file. Name what the reader can see: the words they typed, the command that ran, what is on disk. Never a state they would have to work out. Put what every entrance shares above the list, and leave only the difference on each line.

**One case is a sentence. Two or more is a list.**

**When a case changes more than half the step, give it its own file.**

## Words

A word stays only where cutting it changes behavior.

- **Write instructions, nothing else**: in a loaded file, a hook's message, a refusal the agent reads. Explain only where the agent would otherwise get a case wrong, in one short clause.
- Drop articles and filler verbs where the sentence still reads: "Grep it, read the matching slices", not "You should use grep on it and then read only the slices that match".
- Grammar bends where meaning survives. A fragment beats a padded sentence.
- Delete a whole sentence when it changes no behavior. Never trim it.
- **Assume an intelligent reader.** Never write the consequence of a rule, the mechanism behind it, or the case it plainly covers. A command is one executable line, then what it prints. A rule is the rule, then nothing.
- **Mark a skill only the user can start (`disable-model-invocation: true`) as `(user only)` once**, where the agent reads it before any bare mention: `/flow:upkeep` (user only). One listed in `home/CLAUDE.md` → `user-only-skills` needs no other mark.

## Rules

**Name the cost, never only the symptom.** "Match depth to weight" did nothing until `size-by-worth` said what length takes from the reader.

### Rule ids

Every rule in a loaded file carries an id: lowercase, its words joined by dashes, in a bold code span at the start of the rule:

```md
- **`no-git-mutations`** Never run a git command that writes.
```

**The id states the rule. The body says only what the id cannot.**

#### What gets one

3 questions, in order.

- **Does it group other rules?** It is a section, and its id is the slug of its heading text: `## The turn` is `the-turn`. Never write a rule that restates its own heading.
- **Does it instruct?** It is a rule. It gets an id.
- **Does it only frame what follows?** It gets none. "One user message, your work, one reply" sets up the 5 steps under `## The turn` and instructs nothing.

#### The shapes that carry one

- A bullet.
- A numbered step, where the rules run in order.
- A paragraph, where one rule governs the section under it.

A sub-bullet under any of the 3 is a rule of its own and takes its own id. Nest as deep as the material needs. A rule ends where the next rule at its own depth or shallower begins.

A `→` branch list takes no ids. Its lines are the cases of one rule, and the rule above them owns the id.

#### The constraints

- **Unique inside its file.** Section ids and rule ids share one namespace. The same id in 2 files is fine.
- **Every heading slugs cleanly.** Rename a heading whose text makes an unreadable id. Never invent syntax to avoid it. `### When it has parts: a design, a plan, a mechanism, a diff across files` became `### When it has parts`, with the list on the line below.

## Skills

### Before writing one

- **One job, sayable in a sentence.** 2 sentences means 2 skills.
- **Nothing already covers it.** Something close → extend that skill.
- **Aim for the density of `skills/knowledge/upkeep`.**

### Flow's own skills

**Flow's own skills live once, in the Flow clone**, inside the group folder that files it. Only Flow's own workflow gets one.

- **`work/`**: the steps that move a ticket.
- **`techniques/`**: a way of thinking used in any step.
- **`knowledge/`**: what Flow knows, gathered and kept.
- **`session/`**: starting and handing over a session.

**Every Flow skill installs on every machine**, so a skill is typeable the moment its folder exists. Adding, renaming or removing one needs `flow install`.

**Every Flow skill is shown in every session, and nothing switches it off.** A Flow skill has no switch for one project: `skillOverrides`, the settings key that hides a skill, skips a plugin's skills.

**Name the folder bare and write the same bare word as `name` in the frontmatter.** A folder called `groundwork` holding `name: groundwork` is typed `/flow:groundwork`. Never write the prefix into either one. The `flow:` comes from `.claude-plugin/plugin.json` beside the skills, holding `"name": "flow"`.

### Shape

**`SKILL.md` is the only file at a skill's root.** Add another only with a reason, and give it a folder:

- **`references/`**: markdown read on some runs and not others. Split by how often a part is read, never by length.
- **`scripts/`**: runnable code the agent would otherwise rewrite per run.
- **A `` !` `` line in `SKILL.md`**: a shell command Claude Code runs as the skill loads, its output pasted in. Run one named command or script there, never a pattern test and a chain of `&&`.
- **`knowledge/`**: accumulated facts, one file per topic. Let the layout emerge; never design it up front.

One file until one file stops working.

**A Flow skill that learns as it works owns a wiki folder**, never a `knowledge/` folder, since the agent never writes Flow's files. Link it in the frontmatter, `metadata: { wiki: { audit: load } }`, one key per folder:

- **`load`**: the folder's `index.md` arrives with the skill. For a folder most runs need.
- **`name`**: one line naming the folder. For a folder only some runs need.

**Put the learning line at the step where it learns**, naming what the folder takes: "A query or an approach that worked, and would serve another audit → a finding in `~/.flow/wiki/audit/findings/`, filed now."

**Plain, common words, no invented or rare terms**, in what a skill says and in what it produces.

**A command on the `PATH` is written bare**: `flow next`, `util fs tree docs`. Every other script is `~/.flow/scripts/<file.ext>`. A script is `flow.ts` on disk and `flow` to type, since the symlink drops the extension.

### Knowledge files

**A knowledge file holds what is true for anyone.** Anything true only because of one project belongs in that project's `docs/context/`: a class name from your own UI, a decision your app made, a path in another repo.

Date every entry and cite what proved it.

**Once a tactic appears in 2 files, promote it** into the shared file both then point at. Prune on the same pass any line the agent would follow by default.

### Frontmatter

```yaml
name: <short, lowercase and hyphens, the same word as the folder, never a prefix>
description: <what it is and what it covers, then when it fires>
argument-hint: <what to type after the name>    # only where it takes one
disable-model-invocation: true                  # user-only skills
```

**Claude Code loads every skill's description whole into every session, and fires the skill from it alone.** Its length is set by the rules below and by nothing else.

- **Write what it is and what it covers, then one sentence on when it fires. Never the steps.** A description that summarizes the workflow gets followed instead of the file.
- **Put the trigger sentence at the end of `description`.** Never use the `when_to_use` field: Claude Code joins it to `description` anyway, and a claude.ai upload or the Skills API fails on it.
- **Keep each trigger in one place, the description.** `home/CLAUDE.md` keeps only `user-only-skills` and a tie-break between 2 skills.
- **Under-explaining is the failure to avoid.** Cover the subject in enough detail that a reader can tell what the skill reaches. `/flow:visualize` names its media, because nothing else says what it draws. No word count overrides that.
- **User only (`disable-model-invocation: true`) → one short line, with no trigger.** The user already decided.

**A new skill is user-only unless the agent has to start it itself.** A user-only skill costs nothing until it is typed. An agent-reachable skill puts its description in every session.

**`disable-model-invocation: true` takes the skill out of the list a session is handed.** The user still finds it in the `/` menu. Name it in a file the model reads, or the model reports it missing when the user asks for it by name. Write the line only where the user typing it is the whole point, and where never firing is true in every project.

**A skill invoked over and over stays short, and a long skill takes an argument only where the argument names what the skill opens.** Claude Code appends the whole body again on every run whose render differs, through an argument or a shell line's output. A long skill takes an argument only where what it loads is worth more than its body, such as a ticket and its files, and its bare run renders the same text every time.

### Reshaping one

- the same thing written twice → one shared file, both point at it
- a rarely-read reference crowding `SKILL.md` → move it to `references/`
- 2 jobs in one skill → split it
- grown by accretion → rewrite it, never patch it

**Deleting a skill is the user's call.** Discuss it, never unprompted.

## Cuts from real rewrites

Each pair is verbatim from a real rewrite.

### State the test, delete the illustrations

Four examples means the test was never written.

- **56w:** "**Picking an external tool**: MCP server, plugin, skill, library, app → read `~/.claude/toolbox/`, a catalog filed by the job you're doing: `video.md`, `voice.md`, `browser.md`, `ui-design.md`, `ui-libs.md`, `code-quality.md`, `security.md`, `prod-services.md`, `marketing.md`, `agent-tooling.md`, `automation.md`, `collections.md`, `inbox.md`. `README.md` indexes them and carries the install syntax for each kind. Read the one file that fits; never preload the set."
- **29w:** "`~/.claude/flow/toolbox/`: external tools filed by job: MCP servers, plugins, skills, libraries, apps. `README.md` indexes them and carries install syntax. Read the one file that fits, never the set"

### Delete the elaboration

Restatement and hedging around a rule already stated. The reason itself stays: `writing.md` → `## 5. Never cut these`.

- **39w:** "**Read minimal context.** Access to the codebase is not a mandate to read it: target by path and line range, prefer one filtered query over many reads, stop when the answer is in hand."
- **20w:** "**Read minimal context.** Path and line range, one filtered query over many reads, stop when answered."

### Delete the derivable

- **45w:** "**No project here?** Every project row collapses to the working file in front of you: the brainstorm doc, the notes file. Never create a `docs/` tree just to have somewhere to route to. The `~/.claude/flow/notes.md` row is unaffected; it is global and always available."
- **18w:** "Without one there is no `docs/`: every path below collapses to the file in front of you." The exemption follows from that path being absolute.

### Delete the rebuttal

A design debate fossilised into an instruction, arguing against an option the reader never heard of. Deleted, nothing kept:

- "**The tree is the decision log**; there is no `decisions.md`"

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

### State the rule, cut the argument

A rule followed by the case for it, the mechanism behind it, or a consequence the reader infers. The rule stays, the rest goes.

- **Before:** "**Every path named here is a default.** One named in `## Preferences`, in this directory's `CLAUDE.md`, or by the user wins."
- **After:** deleted. An override is read where it is written. Had a line been needed: "Every path here can be overridden."
