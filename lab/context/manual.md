# Flow's manual: what `docs/manual/` is, and the pages still planned

Designed 2026-08-29, and renamed from `design-public-docs.md` on 2026-09-16. 4 pages have shipped since: `reference.md`, `settings.md`, `tickets.md` and `where-everything-lives.md`. Git holds what else this record carried: the three scopes of `references/style.md`, the move of Flow's working files from `docs/` to `.flow/`, the `docs/dev/` split and the `~/.flow/` rule, all built. Cut on 2026-09-15 to what the manual items in `backlog.md` still need.

## What `docs/manual/` is

**Official documentation for a stranger, A to Z.** Flow is going public against superpowers, agent-skills and mattpocock's skills, so the reader cloned it and knows nothing about Flow.

**Claude Code familiarity is assumed.** The reader has used Claude Code and knows roughly what a skill is. They have not touched hooks or most settings. Claude Code and skills get a sentence where they are first named, never a section.

**It is the only part of Flow with no token budget and no agent reading it.** A page never restates what a skill says. It says why the skill says it, and links. **No skill and no `CLAUDE.md` ever points into `docs/`.**

## The six sections

Grouped by **why you are reading**, never by which part of the machine a page touches. Grouping by component was rejected outright: *"that's absolute worst way to teach strangers."*

- **Use Flow**: concepts first (what Flow is, tickets, phases, the approval discipline), then running work. Running work shipped 2026-09-16 as `docs/manual/use/`, one page per chunk, written now so the details are not forgotten; the user ruled that the management skill blocks only the pages it touches, and kept the option of a whole rewrite if the split reads badly. The concepts are still unwritten.
- **Configure Flow**: settings, `skillOverrides`, overlays, the project template, **precedence and resolution order**, and **why didn't my skill fire**.
- **Extend Flow**: write a skill, add a domain skill, adopt an external one.
- **Why it works this way**: the decisions.
- **Reference**: every command, key, skill and file. Shipped 2026-09-10.
- **Work on Flow**: the repo, the tests, `try.sh`. Overlaps `docs/dev/`.

**Reference is a section, not the spine.** ESLint's reader knows what linting is and arrives from an error message. Flow's reader does not know what a phase is, so Flow's explanation load is higher and its config surface far smaller.

## `Why it works this way`: four groups

By **scope and consequence**, the user's axis:

- **What you can change**: global, tied to no step, safe to drop. The git-mutation ban, `AskUserQuestion` denied, plan mode denied, ASCII over images, how the agent explains itself.
- **What holds it together**: global, and something breaks. The change record being the only honest account of what a subagent touched. Descriptions carrying no trigger. One copy of a skill per machine.
- **Inside a phase**: review running in the same session, no `code-review` skill, groundwork walking every open decision to an answer.
- **At setup, once**: symlinks and no copies, no versions, no plugin manifest, every skill on by default, a project overriding key by key.

Entry format is Go's FAQ: **the decision, the alternative rejected, the consequence**, in 1 to 3 blunt paragraphs.

**The inventory is incomplete and known to be.** The real set comes out of reading `lab/context/` end to end. The four groups get confirmed by that reading, not before it.

## What makes it extensible

**Every new item has one obvious home, decided by a written test rather than by resemblance.**

- **Every section is a folder with an index page and one file per unit.** Adding one is a new file plus one line in that index. A page that outgrows itself becomes a folder.
- **Each group index states its admission test.** *What you can change* takes a decision that holds everywhere, belongs to no step, and leaves Flow running when dropped.
- **The index carries titles and one line each, never summaries.** A summary is a second copy.
- **No numbered filenames, and no cross-references by position.** Order lives in the index alone.

## What the research added

Two reports at `lab/research/doc-design/`, run by the user 2026-08-29:

- **Use Diátaxis as a review lens, never as folder structure.** Python's docs team agreed on it in 2022 and never finished, and JetBrains' 2022 Django survey found 3% adoption.
- **Layering beats separation.** Django's most-praised defence is that tutorial, overview, usage, API and source all link to each other.
- **A precedence and resolution-order page, as its own page.** Both reports call it the highest-value content for a config tool, because a config failure is silent.
- **One complete annotated example as the quickstart target**: a real project's `CLAUDE.md`, `.claude/settings.json` and `.flow/`, commented line by line.

Dropped on the evidence: **`llms.txt`**, since 97% of sites get no traffic from it, and **a named owner per decision record**, since Flow has one author.

## Rejected, and staying rejected

- **A test over the examples in `docs/`.** Raised twice. Hand-written examples cover the obvious tenth of the scenarios and miss every tricky one, so a green suite reports a safety nobody has. **Do not raise it a third time.** Examples captured by running the real command are a different thing, and `backlog.md` → `## V1` asks for them.
- **A generated command reference.** A command may be explained in several places where it is reached for. Docs get updated inside the change that touched the CLI.
- **Grouping decisions by component**, such as `skills.md` and `subagents.md`.

## Parked until Flow goes public

- **The license.** MIT recommended: every project Flow competes with is MIT. Add the file any time before the repository goes public.
- **The upstream research caches.** 16 tracked files are verbatim copies of other people's docs: `lab/research/claude-code-docs/` (12), `claude-agent-skill-best-practices.md` and 3 `agentskills-*.md`. Publishing republishes them. The user chose to keep them tracked for now.
