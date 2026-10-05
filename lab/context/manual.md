# Flow's docs: what `docs/` holds, and why it is shaped that way

Designed 2026-08-29 as the manual, renamed from `design-public-docs.md` on 2026-09-16. Pass 5 of the final sweep threw the manual out and wrote `docs/` again from scratch, planned 2026-10-02 and built 2026-10-03. The old pages sit in `lab/archive/manual/`. `references/write-docs.md` holds the rules every page follows.

## Who reads it

**A stranger who knows Claude Code's basics and has never seen Flow.** Flow is going public against superpowers, agent-skills and mattpocock's skills, so the reader cloned it and knows nothing about Flow. A session, tokens, `CLAUDE.md`, a skill and `/clear` need no definition, ruled by the user 2026-10-03. Every term Flow adds does, in plain words where it first appears, and so does any Claude Code feature past the basics.

**No agent reads it, so it has no token budget.** Explaining is these pages' job, so pass 3's rule that a loaded file holds instructions alone does not bind them. A page never restates what a skill says. **No skill and no `CLAUDE.md` points into `docs/`**, except `/flow:help`, which answers from `~/.flow/docs/README.md` and the pages it names.

## 3 entry points, one job each

- **The root `README.md`**: the pitch. What Flow is, the loop, whether it is ready, the install line, how it compares, what comes next, links to the docs. `pitch.md` holds the rulings behind its wording.
- **`docs/README.md`**: the index alone, one line per page in 5 groups. Kept as `README.md` because GitHub renders it when the folder opens.
- **`docs/overview.md`**: how Flow works whole. One piece of work first, then how the agent works with you, sessions, learning, and what Flow adds to Claude Code last, each linked to its page. No pitch and no status. The user threw out the first build's opening list, `## The parts`, on 2026-10-03: a heading that names nothing, and the rules on top of the root page.

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

**`docs/walkthroughs.md` walks each kind of work start to finish**: a new project, an existing project brought into Flow, a feature, a bug, a question for code, a decision, upkeep. Asked for by the user 2026-10-03: a stranger cannot piece the route together from pages written one per subject, the route from spec to `/flow:tickets-from-spec` least of all. The overview keeps a 4-step walk of one feature and links here. Each walk links `phases.md` rather than retelling a skill. Setup got no page of its own: `install.md` → `## The setup session` carries the machine's, and `new-project.md` → `## A folder that already has files` the project's, which the walk links.

**Reference is split in 4, and explains no concept.** The old `reference.md` was 15,700 words mixing lookup with long explanation. A reference entry says what a thing does and its options. Where it needs a concept, it gives one sentence and links the guide page. Ruled by the user 2026-10-03: "this is just a references page. This is not where we explain any concepts".

**Hidden commands and flags appear only in `docs/dev/`.** `flow handoff`, `--root`, `--no-bin`, `--no-clone`, `--drafts` and `doctor --tests` run for the agent and the tests, so `docs/dev/commands.md` documents them and the user pages never name them.

**A page explains a mechanism, never a rule.** A hook, a file, a command or a skill gets a page. A rule from `home/AGENTS.md` is never retold: the file is short and plain, and every user edits it, so a retelling goes wrong twice. A rule whose effect a stranger would take for a bug gets one line where they meet it, such as the agent waiting for "go ahead" in `docs/overview.md`. Ruled by the user 2026-10-03, deleting `docs/approval.md`.

**No `Why it works this way` section.** The manual planned one, grouped by scope and consequence. A reason now sits beside the decision it explains, on the page where the reader meets the decision: a reason kept apart goes unread, the argument that removed `decisions.md`.

## How dense a page is

Set by the user 2026-10-03 after reading the first build of `docs/reference/commands.md`, which took 3 rewrites:

- **A sentence stays only where it changes what the reader types, sees or decides.** No rule the example already shows, no list repeating the output, no second example showing nothing new.
- **A mechanism the reader meets is explained in full**: what it does, what the reader sees, what goes wrong and how to fix it. How the agent does a job, and the files a mechanism keeps for itself, stay out.
- **Budget**: `commands.md` about 950 lines, the other reference pages under 300, about 75 per guide page, about 150 per dev page.
- **Ordered by need**: setting up first, the daily work next, rare or destructive things late, specialist things last.
- **Plain words over Flow's own**: "computer" where the reader meets a machine, "everywhere" for `--global`. `flow sync` is "back up your workflow and share it between your computers".

Tightened by the user 2026-10-05, after reading 7 pages. The build came to about 3,000 lines and 26,000 words for users, about 2 hours of reading. The old test, "a sentence stays only where the reader would get something wrong without it", let through how Flow works inside, since a reader can always get that wrong. `learning.md` was cut first as the sample, from 1,600 words to 720, then every guide page and the index the same day, from 16,600 words to 10,300. The longest guide page, the one with the most code blocks, came to about 100 lines. The reference pages and `docs/dev/` were left as they were, ruled by the user: a reader looks an entry up there, and never reads the page through. `two-machines.md` became `sync.md`, "Sync between computers", the same day: the docs say "computer" for a machine, and `flow sync` is what the page explains.

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
- **Number prefixes on page files**, such as `01_overview.md`, raised by the user 2026-10-03 and dropped. Adding a page renames every page after it, breaking every link to them, links in public posts too. The index already gives the order, and GitHub shows it when `docs/` opens.
- **`bash` fences for output**: they colour words such as `done` as code, and an apostrophe opens a string. `console` with `$ ` replaced them.
- **Cutting skills, command groups, statuses or types so a beginner has less to learn**, looked at in the final sweep 2026-10-01. 12 skills, 9 command groups, 8 statuses and 5 types shrink through what the docs and `/flow:start` teach first.

## The license and the copied pages

Settled by the user 2026-10-05, once GitHub showed the repository was already public:

- **MIT, in `LICENSE`.** Every project Flow competes with is MIT. AGPL-3.0 was recommended the same day, for the user's wish that whatever builds on Flow stays free, and the user chose MIT over it. No open license forbids selling. AGPL makes a shared or hosted version publish its source, and it costs reach: a skill author on MIT cannot copy a Flow skill in, and some companies ban AGPL. Later versions can be relicensed by the user, who wrote every commit. A version already published stays MIT.
- **The submodules `util` and `domain-skills` carry the same MIT `LICENSE`.** `util` installs beside `flow`, and `domain-skills` invites contributions. `toolbox` has none, proposed and dropped the same day: its notes have little reuse value, and a license at its top would read as licensing its 146 copied READMEs.
- **The 32 copies of other people's docs stay on disk, out of git**: `lab/research/claude-code-docs/`, `claude-code-mods/docs/`, and in `skill-curation/` `claude-agent-skill-best-practices.md` and 3 `agentskills-*.md`. A `LICENSE` at the top would read as licensing them. Git's history still holds them, left unrewritten: 3 forks already carry them, and their publishers give them away free. A fresh clone fetches them again from their URLs.
