# Style

Two scopes, and every section below belongs to one.

**Everything Flow writes**: a skill, a rule file, a workflow doc, a message to the user, a documentation page a stranger reads that no session ever loads. §1 planning, §2's markdown defaults, §5 sentences, §6 → `### Anywhere`, §7 what may never be cut.

**Only a file that enters an agent's context.** §1's Step / Reference mark, §2 section shapes, §3 one home per fact, §4 branching, §6 → `### Only in a loaded file`, §8 frontmatter.

3 jobs read a second file, beside this one:

- **A file an agent loads** → `cut-loaded-files.md`: cuts from real rewrites, before and after.
- **A rule file** → `write-rules.md`: what makes a rule fire, and the id every rule carries.
- **A documentation page** → `write-docs.md`: what changes for a page no session loads, §3 included.

## 1. Plan the shape first

Name the sections and their order before writing a sentence. Mark each piece as one of two kinds:

- **Step**: an ordered action the agent performs.
- **Reference**: a definition, rule or path consulted on demand.

Steps first, in order, with the whole sequence visible before any detail. Reference after, or in a sub-file. Never discover the structure while typing.

Plan the whole file every time you touch it. A pointer to one line is not a scope.

## 2. Section shapes

- **Where things live**: paths, files, what each holds → a labeled list: the path as the label, one line of what is in it. Never write prose about placement. `## Inside each place` in `references/workflow.md` is the model.
- **A procedure** → numbered steps, each ending on a check the agent can evaluate. "Every behavior carries a mark" is a check; "understanding reached" is not.
- **Rules at one altitude** → a flat bulleted list under one heading.

One heading per concept, with its definition, rules and exceptions together underneath.

Standard markdown, always: `-` for unordered, `1.` for ordered, `- [ ]` for a checklist. Nest as deep as the material needs. Never invent a layout markdown already has. Default to a list.

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

## 5. Sentences

Three tests. Run them on every sentence that carries a rule, and on every sentence written to the user.

1. **Cover everything past word 2.** Is the direction already right? "Never expose the bookkeeping": yes, at word 1. "Keep the bookkeeping out of the conversation": no. Word 2 says preserve it; word 5 reverses that.
2. **Read the last two words alone.** Do they carry the point? "…the bookkeeping" lands it. "…the conversation" spends the loudest position in the sentence on its most generic word.
3. **Act on it after one read.** Re-reading to find the instruction means rewrite it.

### Where the words go

- **Front-load the polarity and the verb.** `Never`, `Always`, or the verb itself comes before the object.
- **Never make the reader restart.** A sentence meaning one thing at word 3 and the opposite at word 6 has failed, however short it is.
- **End on the point.** Put the specific word last. Endings like "the conversation", "the file", "the process" waste it.
- **Never end on the rejected half.** "Attack it by running it, not by rating it" stresses *rating*. Split it: "Attack it by running it. Rating it finds nothing."
- **Condition left, action right, where a real condition exists.** "To delete the document, click Delete", never "Click Delete if you want to delete the document." Flow's `X → Y` bullets follow it. A rule that always applies has no condition: the verb goes first.

### The verb and the object

- **Finish the verb at the verb.** Split verbs park the meaning behind the object: `keep X out of`, `leave X out`, `hold X back from`. Use `expose`, `print`, `restate`, `delegate`.
- **Put the action in the verb.** "Depth is proportional to the branch" → "Match depth to the branch." Watch for `-tion`, `-ment` and `-ance` propped up by `is`, `make` or `do`.
- **Keep the object short and concrete.** "Read minimal context", not "Read the least that answers the question". Never an abstraction ("the least", "what fits") or a relative clause ("options the user did not bring").
- **Put nothing between the subject and the verb.**

### What kind of sentence

- **Write an action positive. Write a boundary negative.** One negation, at word one, and none of the hidden ones: `unless`, `fail to`, `except`, `other than`.
- **Give the agent a verb it can perform.** "The job is coverage, not fidelity" has none and gets cut. "Never expose the bookkeeping" has one and stays.
- **Put a verb in each half of a contrast.** "Coverage, not fidelity" has none.
- **One idea per sentence.** Split on every `and`, `so`, `then` and dash that joins two.
- **Define anything invented before first use.**
- **Use one word per concept, and the common word.**

## 6. Words

Cut what lengthens a sentence without clarifying it. Readability first. Last pass, after the structure is right.

### Anywhere

- Digits, not words: `5`, not `five`.
- Name a skill with its slash: `/flow:groundwork`, never `groundwork`.
- Symbols only where clearer than the word. They save nothing: `→`, `·` and an invented abbreviation like `cfg` are each their own token.
- Never use em dashes. Use a period, a comma, a colon, or parentheses. The only ones left are the character itself, listed as a drawing glyph in `/flow:visualize` and as the example check in `write-checks.md`.

### Only in a loaded file

- **Write instructions, nothing else**: in a loaded file, a hook's message, a refusal the agent reads. Explain only where the agent would otherwise get a case wrong, in one short clause.
- Drop articles and filler verbs where the sentence still reads: "Grep it, read the matching slices", not "You should use grep on it and then read only the slices that match".
- Grammar bends where meaning survives. A fragment beats a padded sentence.
- Delete a whole sentence when it changes no behavior. Never trim it.
- **Assume an intelligent reader.** Never write the consequence of a rule, the mechanism behind it, or the case it plainly covers. A command is one executable line, then what it prints. A rule is the rule, then nothing.
- **Mark a skill only the user can start (`disable-model-invocation: true`) as `(user only)` once**, where the agent reads it before any bare mention: `/flow:apply-domain-findings` (user only). One listed in `home/CLAUDE.md` → `user-only-skills` needs no other mark.

## 7. Never cut these

- **A rule.** Compression removes words and duplication, never rules. Cutting rule count is banned as a strategy.
- **The reason, where it decides a case the rule does not name.** A reason that only argues for the rule is cut. A rule needs no argument.
- **One example**, wherever the rule alone is ambiguous. Several examples of one pattern → keep the best one. Going to zero is the riskiest cut there is.
- **Information.** Cut words. A file that drops a load-bearing detail to look short has failed.

## 8. Frontmatter descriptions

**Claude Code loads every skill's frontmatter description whole into every session, and fires the skill from it alone.** Its length is set by the rules below and by nothing else.

- **What it is and what it covers. Never the steps.** A description that summarizes the workflow gets followed instead of the file.
- **Never when to invoke it.** Write one only where it is wanted; `write-skills.md` names the 4 homes.
- **Under-explaining is the failure to avoid.** Cover the subject in enough detail that a reader can tell what the skill reaches. `/flow:visualize` names its media, because nothing else says what it draws. No word count overrides that.
- **User only (`disable-model-invocation: true`) → one short line.** The user already decided.
