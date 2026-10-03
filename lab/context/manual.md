# Flow's docs: what `docs/` holds, and why it is shaped that way

Designed 2026-08-29 as the manual, renamed from `design-public-docs.md` on 2026-09-16. Pass 5 of the final sweep threw the manual out and wrote `docs/` again from scratch, planned 2026-10-02 and built 2026-10-03. The old pages sit in `lab/archive/manual/`. `references/write-docs.md` holds the rules every page follows.

## Who reads it

**A stranger who knows Claude Code's basics and has never seen Flow.** Flow is going public against superpowers, agent-skills and mattpocock's skills, so the reader cloned it and knows nothing about Flow. A session, tokens, `CLAUDE.md`, a skill and `/clear` need no definition, ruled by the user 2026-10-03. Every term Flow adds does, in plain words where it first appears, and so does any Claude Code feature past the basics.

**No agent reads it, so it has no token budget.** Explaining is these pages' job, so pass 3's rule that a loaded file holds instructions alone does not bind them. A page never restates what a skill says. **No skill and no `CLAUDE.md` points into `docs/`**, except `/flow:help`, planned to answer from `~/.flow/docs/README.md`.

## 3 entry points, one job each

- **The root `README.md`**: the pitch. What Flow is, the loop, whether it is ready, the install line, how it compares, what comes next, links to the docs. `pitch.md` holds the rulings behind its wording.
- **`docs/README.md`**: the index alone, one line per page in 5 groups. Kept as `README.md` because GitHub renders it when the folder opens.
- **`docs/overview.md`**: how Flow works whole, each part named and linked to its page. No pitch and no status.

Task Master's `docs/README.md` is a plain index. beads and NestJS open on an introduction page. `lab/research/doc-design/` found the best-rated docs pair a landing page with an index.

## The tree

```text
docs/
├── README.md        the index
├── overview.md      how Flow works, whole
├── 14 guide pages   one per subject, grouped in the index by why the reader came
├── reference/       commands, settings, skills, files: lookup alone
└── dev/             layout, commands, skills, trying-changes: for whoever changes Flow
```

**Grouped by why the reader came, never by component.** Grouping by component was rejected outright: *"that's absolute worst way to teach strangers."* The index's groups: Start here, Doing the work, Getting better, Making it yours, Reference.

**Reference is split in 4, and explains no concept.** The old `reference.md` was 15,700 words mixing lookup with long explanation. A reference entry says what a thing does and its options. Where it needs a concept, it gives one sentence and links the guide page. Ruled by the user 2026-10-03: "this is just a references page. This is not where we explain any concepts".

**Hidden commands and flags appear only in `docs/dev/`.** `flow handoff`, `--root`, `--no-bin`, `--no-clone`, `--drafts` and `doctor --tests` run for the agent and the tests, so `docs/dev/commands.md` documents them and the user pages never name them.

**No `Why it works this way` section.** The manual planned one, grouped by scope and consequence. A reason now sits beside the decision it explains, on the page where the reader meets the decision: a reason kept apart goes unread, the argument that removed `decisions.md`.

## How dense a page is

Set by the user 2026-10-03 after reading the first build of `docs/reference/commands.md`, which took 3 rewrites:

- **A sentence stays only where the reader would get something wrong without it.** No rule the example already shows, no list repeating the output, no second example showing nothing new.
- **Budget**: `commands.md` about 950 lines, the other reference pages under 300, about 150 per guide page and per dev page, under 5,000 lines in all. The build came to about 2,900 for users and 550 for the dev pages.
- **Ordered by need**: setting up first, the daily work next, rare or destructive things late, specialist things last.
- **Plain words over Flow's own**: "computer" where the reader meets a machine, "everywhere" for `--global`. `flow sync` is "back up your workflow and share it between your computers".

## Every example is real output

Command output is captured on a pretend computer under `tmp/`, built with `flow install --root <dir> --no-clone`, `FLOW_HOME_REMOTE` pointing at a folder and `FLOW_MACHINE_DEFAULT` set. Never the real machine. A file a skill writes, such as a plan, shows the skill's template, labelled as one, until the beta's first real ticket.

## What the research added

Two reports at `lab/research/doc-design/`, run by the user 2026-08-29:

- **Use Diátaxis as a review lens, never as folder structure.** Python's docs team agreed on it in 2022 and never finished, and JetBrains' 2022 Django survey found 3% adoption.
- **Layering beats separation.** Django's most-praised defence is that tutorial, overview, usage, API and source all link to each other.
- **A page on which setting wins.** Both reports call it the highest-value content for a config tool, because a config failure is silent. `docs/configure.md` carries it.

Dropped on the evidence: **`llms.txt`**, since 97% of sites get no traffic from it, and **a named owner per decision record**, since Flow has one author.

## Rejected, and staying rejected

- **A test over the examples in `docs/`.** Raised twice. Hand-written examples cover the obvious tenth of the scenarios and miss every tricky one, so a green suite reports a safety nobody has. **Do not raise it a third time.** Examples captured by running the real command are a different thing.
- **A generated command reference.** Docs get updated inside the change that touched the CLI.
- **A rewrite of each old page in place**, proposed 2026-10-02 and dropped: most pages changed shape, so the tree was planned whole first.
- **`bash` fences for output**: they colour words such as `done` as code, and an apostrophe opens a string. `console` with `$ ` replaced them.

## Parked until Flow goes public

- **The license.** MIT recommended: every project Flow competes with is MIT. Add the file any time before the repository goes public.
- **The upstream research caches.** Tracked files under `lab/research/` are verbatim copies of other people's docs: `claude-code-docs/`, `claude-agent-skill-best-practices.md` and 3 `agentskills-*.md`. Publishing republishes them. The user chose to keep them tracked for now.
