# The manual

How Flow describes itself: the root `README.md`, which sells it, and `docs/`, which explains it. The reader is a stranger who knows Claude Code's basics and has never seen Flow. No agent reads these pages except `/flow:help`, so they have no token budget, and explaining is their whole job.

## Scope

- **In**: the reader, the 3 entry points, the tree of `docs/`, how dense a page is, where examples come from, the README's wording, and the license.
- **Out**: how a page is written sentence by sentence, in `references/style.md` and `references/write-docs.md`. This spec folder, in `docs/spec/product.md`.

## The tree

```text
README.md            the pitch: what Flow is, the loop, install, the comparison
docs/
├─ README.md         the index alone, 5 groups
├─ overview.md       how Flow works, whole
├─ walkthroughs.md   each kind of work, start to finish
├─ 14 guide pages    one per subject, grouped by why the reader came
├─ reference/        commands, settings, skills, files: looked up, never read through
├─ dev/              layout, commands, skills, trying changes: for whoever changes Flow
└─ spec/             what Flow does and how it is built
```

## Behaviors

### The reader

- `V1` **A stranger who knows Claude Code's basics.** A session, tokens, `CLAUDE.md`, a skill and `/clear` need no definition, ruled by the user 2026-10-03. Every term Flow adds is defined in plain words where it first appears, and so is any Claude Code feature past the basics.
- `V1` **Plain words over Flow's own**: "computer" for a machine, "everywhere" for `--global`. `flow sync` is "back up your workflow and share it between your computers".
- `V1` **No skill and no rule file points into `docs/`**, except `/flow:help`, which answers from `~/.flow/docs/README.md` and the pages it names.

### 3 entry points, one job each

- `V1` **The root `README.md` is the pitch**, "like a resume", the user's words: it convinces a stranger "without over hyping something". The opening, the loop, a warning that Flow is almost ready, the install line, a comparison table, what comes next, and the docs.
- `V1` **`docs/README.md` is the index alone**, one line per page in 5 groups: Start here, Doing the work, Getting better, Making it yours, Reference. Named `README.md` so GitHub shows it when the folder opens.
- `V1` **`docs/overview.md` shows Flow whole**: one piece of work first, then how the agent works with the user, sessions, learning, and what Flow adds to Claude Code, each linked to its page. No pitch and no status.

### The tree

- `V1` **Grouped by why the reader came, never by part.** Grouping by part was rejected outright: "that's absolute worst way to teach strangers."
- `V1` **`docs/walkthroughs.md` walks each kind of work start to finish**: a new project, an existing project brought in, a feature, a bug, a question for code, a decision, upkeep. Asked for by the user 2026-10-03: pages written one per subject never show the route.
- `V1` **Reference is split in 4 and explains no concept.** An entry says what a thing does and its options, and links the guide page for the concept. "This is not where we explain any concepts", ruled by the user 2026-10-03.
- `V1` **Hidden commands and flags appear only in `docs/dev/`**: `flow handoff`, `--root`, `--no-bin`, `--no-clone`, `--drafts`, `doctor --tests`.
- `V1` **A page explains a mechanism, never a rule.** A rule in `home/AGENTS.md` is never retold: every user edits that file, so a retelling goes wrong twice. A rule a stranger would take for a bug gets one line where they meet it, such as the agent waiting for "go ahead". Ruled by the user 2026-10-03, deleting `docs/approval.md`.
- `V1` **A reason sits beside its decision**, on the page where the reader meets it. No separate page of reasons: a reason kept apart goes unread.
- `V1` **A page added, renamed or dropped updates its folder's `README.md`** in the same edit.

### How dense a page is

- `V1` **A sentence stays only where it changes what the reader types, sees or decides.** Set by the user 2026-10-05: the first build came to about 26,000 words, 2 hours of reading, and the guide pages were cut from 16,600 words to 10,300 the same day.
- `V1` **A mechanism the reader meets is explained in full**: what it does, what they see, what goes wrong and how to fix it. How the agent does a job inside stays out.
- `V1` **Budgets**: about 75 lines a guide page, under 300 a reference page, about 950 for `commands.md`, about 150 a dev page. The reference and dev pages kept their length: a reader looks an entry up and never reads the page through.
- `V1` **Ordered by need**: setting up first, the daily work next, rare or destructive things late, specialist things last.
- `V1` **Output in a `console` fence with `$ `**, never `bash`, which colours words like `done` as code.

### Every example is real

- `V1` **Command output is captured on a pretend computer under `tmp/`**, built with `flow install --root <dir> --no-clone`, never the real machine. A file a skill writes shows the skill's template, labelled as one, until the beta's first real ticket.

### The README's wording

- `V1` **The opening, approved by the user 2026-10-02**: "Flow is a complete development workflow for Claude Code. It takes a raw idea and finds every decision the project needs, including the ones you never raised…" Every clause names a real step, and any later edit keeps that density.
- `V1` **The loop in 3 rows**: Design, Build, Improve, ending on lessons filed into skills, rules and the wiki, drawn as a loop.
- `V1` **The comparison table claims only what works today**, one short line a cell, each row named for what it compares. No row where the others tie Flow: plan, build, review and debug. No small feature alone: it joins the row it belongs to.
- `V1` **Status says whether Flow is ready, never a timeline and never a missing feature as a lack.** The warning holds off installing until the full release, and points to the overview, the walkthroughs and the docs. At the beta its text changes, and at the release it goes.
- `V1` **"Built and tested on Claude's 5.5 models", never "optimized for".** No skill or setting is tuned to a model.
- `V1` **The line that leaves the memory category**: "Memory tools remember what went wrong. Flow changes what the agent does next time."
- `V1` **Where Flow runs sits in Install**: Claude Code on Linux, macOS and WSL. Never "expanding" or "multi-agent", which read as work in progress.
- `never` **A GIF or demo video at launch**: a terminal recording hides what Flow adds. Posts are text first, on Reddit and X.
- `never` **"Saves context"**: Flow loads about 4,000 tokens at session start against 1,000 to 2,200 for its contenders.
- `never` **`flow audit` and study cases as selling points**: they serve whoever maintains Flow.

### The license

- `V1` **MIT, in `LICENSE`**, chosen by the user 2026-10-05. Every contender is MIT. AGPL was recommended for keeping what builds on Flow free, and cost reach: a skill author on MIT could not copy a Flow skill in. `util` and `domain-skills` carry the same license.
- `V1` **Copies of other people's docs stay on disk, out of git**, under `~/.flow/wiki/<tool>/downloads/`. A license at the top would read as licensing them.

### Refused

- `never` **A test over the examples in `docs/`**, raised twice: hand-written examples cover the obvious tenth and miss every tricky case, so a green suite reports a safety nobody has. Examples captured by running the real command are a different thing.
- `never` **A generated command reference**: a doc changes inside the change that touched the command.
- `never` **Number prefixes on page names**, `01_overview.md`: adding a page renames every page after it and breaks every link, in public posts too.
- `never` **Cutting skills, commands, statuses or types so a beginner has less to learn**: the docs and `/flow:start` teach the first ones first.
- `never` **`llms.txt`**: 97% of sites get no traffic from it.

## The parts

- **`README.md`**: the pitch.
- **`docs/README.md`**, **`docs/overview.md`**, **`docs/walkthroughs.md`** and the guide pages.
- **`docs/reference/`**: `commands.md`, `settings.md`, `skills.md`, `files.md`.
- **`docs/dev/`**: `layout.md`, `commands.md`, `skills.md`, `trying-changes.md`.
- **`references/write-docs.md`**: the rules beside `style.md` for a documentation page.

## One real case: a new command lands

1. `flow store` is built.
2. In the same change, `docs/reference/commands.md` gains its entry: what it does, its options, one example captured on the pretend computer, and a link to `docs/tickets.md` for where tickets live.
3. `docs/tickets.md` gains the part a reader meets: why tickets might move, what they see, what goes wrong.
4. No README change: the comparison table already claims task tracking.

## How it fails

- **A page retells a rule** → the rule changes and the page goes wrong. The page is cut to the mechanism.
- **A page and the command disagree** → whoever changed the command missed the page. The page follows the command.
- **The README claims what is not built** → a stranger installs for it. The claim moves to what comes next.

## How you know it worked

- **A stranger installs Flow from the README and finds each answer in `docs/`.** Not yet: nobody but the agent and the user has read the guide pages.
- **The user approved the README** on 2026-10-03, after 6 drafts.

## What is locked

- **The README sells, `docs/` explains, and neither does the other's job.**
- **Grouped by why the reader came.**
- **A rule lives once, in the rule file.**
- **Examples come from running the real command.**
