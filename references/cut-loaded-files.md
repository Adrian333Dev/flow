# Cutting a loaded file

Read beside `style.md` when writing or rewriting a file that enters an agent's context. Each pair is verbatim from a real rewrite.

## State the test, delete the illustrations

Four examples means the test was never written.

- **56w:** "**Picking an external tool**: MCP server, plugin, skill, library, app → read `~/.claude/toolbox/`, a catalog filed by the job you're doing: `video.md`, `voice.md`, `browser.md`, `ui-design.md`, `ui-libs.md`, `code-quality.md`, `security.md`, `prod-services.md`, `marketing.md`, `agent-tooling.md`, `automation.md`, `collections.md`, `inbox.md`. `README.md` indexes them and carries the install syntax for each kind. Read the one file that fits; never preload the set."
- **29w:** "`~/.claude/flow/toolbox/`: external tools filed by job: MCP servers, plugins, skills, libraries, apps. `README.md` indexes them and carries install syntax. Read the one file that fits, never the set"

## Delete the elaboration

Restatement and hedging around a rule already stated. The reason itself stays: `style.md` → `## 7. Never cut these`.

- **39w:** "**Read minimal context.** Access to the codebase is not a mandate to read it: target by path and line range, prefer one filtered query over many reads, stop when the answer is in hand."
- **20w:** "**Read minimal context.** Path and line range, one filtered query over many reads, stop when answered."

## Delete the derivable

- **45w:** "**No project here?** Every project row collapses to the working file in front of you: the brainstorm doc, the notes file. Never create a `docs/` tree just to have somewhere to route to. The `~/.claude/flow/notes.md` row is unaffected; it is global and always available."
- **18w:** "Without one there is no `docs/`: every path below collapses to the file in front of you." The exemption follows from that path being absolute.

## Delete the rebuttal

A design debate fossilised into an instruction, arguing against an option the reader never heard of. Three deleted, nothing kept:

- "The test is commitment, not size: there is no backlog file"
- "**The tree is the decision log**; there is no `decisions.md`"
- "Nothing is called `plan.md`."

## Placement replaces conditions

A rule that fires at one moment goes in the file that loads at that moment, and drops the clause saying when it applies.

- **51 lines:** a whole `## Workflow` section: the chain, the pickup diagram, the departure clause.
- **1 line:** "`~/.claude/flow/references/workflow.md`: how Flow's pieces fit together. Only when that is genuinely unclear". The content moved there intact; the condition became the location.

## Move what a skill owns into the skill

A `## Rendering` section, near word-for-word what the drawing skill already said. Deleted, not trimmed. A second copy of a rule is worse than none.

## Merge sections at one altitude

`## Communication` and `## Explaining` were both "how to write to the user". Four bullets survived as three: "Explain artifacts from zero" was already covered by "Define from zero" plus "A pointer is not an explanation".

## Delete the file's own metadata

True, and useless to a reader already reading it.

- **49w:** a title, a blockquote, and a paragraph on where the file installs and what a project adds on top.
- **31w:** "Flow: an agentic development workflow for a solo developer. Work runs groundwork → tickets → plan → build, one skill per step; the rules below hold across all of them."

## Rejected: structure absorbs repetition

A table header carrying what each row would repeat. Dropped: a list is preferred to a table, so the header saves nothing worth the columns.

## State the rule, cut the argument

A rule followed by the case for it, the mechanism behind it, or a consequence the reader infers. The rule stays, the rest goes.

- **Before:** "**Every path named here is a default.** One named in `## Preferences`, in this directory's `CLAUDE.md`, or by the user wins."
- **After:** deleted. An override is read where it is written. Had a line been needed: "Every path here can be overridden."

- **Before:** "**`docs/` and `.flow/` both always exist**, project or not, repo or not. Paths are created on first write. `docs/` is the project's own: the spec, durable facts, fetched research, anything there before Flow. `.flow/` is Flow's working store: tickets, groundwork, the inbox, the handoff."
- **After:** deleted. Every route under it names its own path, and `references/workflow.md` maps the folders.
