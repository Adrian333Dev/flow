# Commands as skills

Claude Code merged custom commands into skills. Flow reorganizes around that, and the same session compressed every skill description and cut two mechanisms from the `flow` CLI.

**Status: built 2026-08-29**, all 6 stages, 17 tests green. What is on disk wins over anything below. Still open: the `/file-findings` rewrite, which is in `backlog.md`, and the real session, which no build can stand in for.

## The plan

Six stages, in this order. Stage 3 depends on stage 1.

1. **The `flow` CLI.** Default action `get` in `overlays`, `skills` and `cases`, never in `work`. Prefix matching out of `cli.js`. `fw` added to `install.js`'s bin table. `install.js` drops its `commands/*.md` step.
2. **The skills tree.** New group `skills/commands/` holding `start`, `run`, `file-findings`, `handoff`. `commands/start.md` and `commands/run.md` become `SKILL.md` files. `skills/stack/debug-web-pages/` becomes `skills/stack/web-pages/`. The emptied top-level `commands/` goes.
3. **Frontmatter, all 12 skills.** The descriptions below, and the overlay line shortened to `` !`flow overlays <name>` ``.
4. **`home/CLAUDE.md`.** `## Which skill` becomes `## Workflow`.
5. **The rule files.** `write-skills.md`, `writing.md`, `cli-design.md`, `CLAUDE.md`, `backlog.md`.
6. **Tests.** Default action, exact-match-only, the new tree.

## What Claude Code actually does

Verified 2026-08-29 against `https://code.claude.com/docs/en/skills` and the `claude` binary at `~/.local/share/claude/versions/2.1.251`. Three earlier beliefs were wrong, and the corrections drive most of the plan.

- **Commands are skills.** Quoting the docs: *"Custom commands have been merged into skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way."* A command is a skill without a folder, kept alive for compatibility.
- **Skills take arguments.** `$ARGUMENTS`, `$1`, and named arguments through an `arguments` frontmatter field. The binary carries one frontmatter list for both kinds: `name, description, model, allowed-tools, argument-hint, arguments, disable-model-invocation, user-invocable, effort, shell, ...`
- **Skills run shell before the model reads.** *"Claude Code runs the command and replaces the line with its output before Claude sees the skill content."* Flow's overlay line works as designed. Nothing to change.
- **A changed render is appended in full.** *"When Claude re-invokes a skill whose rendered content is identical to the copy already in context, Claude Code adds a short note that the skill is already loaded rather than a second copy. When the rendered content differs, because the arguments changed or a dynamic context command produced new output, Claude Code appends the full content again."*
- **`user-invocable: false`** is the inverse of `disable-model-invocation` — a skill only Claude reaches.

## Locked decisions

### The tree

- **`skills/commands/` is the fifth group**, holding what you reach for yourself: `start`, `run`, `file-findings`, `handoff`. It files by who invokes rather than by subject, which the other 4 groups do. Acceptable because a group decides nothing else, and because 3 of the 4 are hidden from context, so this is exactly the list `home/CLAUDE.md` must name.
- **~~A phase files under `phases/` even when only you invoke it.~~ Reversed 2026-08-29** — `/cut-from-spec` is in `commands/`, and `commands/` wins wherever two groups fit. `design-skills.md` → `## The groups`.
- **`debug-web-pages` becomes `web-pages`.** The old name says debugging and the skill investigates. A `stack/` skill is named for what it touches, and its description says which pages.
- **`/start` and `/run` carry `disable-model-invocation: true`.** As commands they were unreachable by the model by construction; as skills the default flips, and `/run` auto-invoked is Claude running shell it composed itself.

### Arguments

**A skill invoked repeatedly stays short, and a long skill takes no arguments.** This replaces the flat ban in `write-skills.md`, which was right about the cost and wrong about the cause. Arguments do not cost anything by themselves — a render that differs between invocations does, and arguments are one of 2 ways to change it. The other is ours: `` !`flow overlays <name>` `` returns the same text all session inside one project, so repeat invocations still deduplicate.

`start.md` is 37 lines and `run.md` is 11, so re-appending either costs nothing. `/handoff` is 153 lines, which is why it must never grow an argument however natural one looks.

### Descriptions

**The triggers were never removed in the 2026-08-28 pass.** They were renamed to `Covers …` and kept, and a second copy went into `home/CLAUDE.md` → `## Which skill`. Both load at session start, so the cost that pass existed to remove was being paid twice. 2,200 characters of descriptions plus 1,495 of routing.

- **A subject list stays only where nothing else says what the skill reaches.** `/visualize` keeps its media — ASCII, mockups, HTML — and loses its subjects. `/web-pages` keeps a compressed subject, because a `stack/` skill has no routing entry to inherit one.
- **`/execute` was describing its steps**, which `writing.md` §8 bans outright, and the cited failure is an agent following the description instead of the file.
- **Write `/name` with the slash** when a skill or command is named in prose. Every skill body already does it 44 times; the 2026-08-28 descriptions dropped it. The rule is unwritten, which is why it eroded, and it goes into `writing.md` §6. None of the new descriptions names another skill, so nothing there needs restoring.

### The CLI

- **Default action `get`** in `overlays`, `skills` and `cases`. It is the rule the flat layer already runs one level up, where a word naming no command is a ticket id, so `cli-design.md` gains a line rather than an exception.
- **Never in `work`.** Its `get` replays a stored copy over the folder you are standing in, and a mistyped word falling through to a write of your working tree is the one default worth refusing.
- **Prefix matching goes.** It is 6 lines in `cli.js` and buys typing that tab completion already does. Out with it go the 3 flag-shortening bullets in `cli-design.md`, the `--p` ambiguity error, and the `flow o` collision between `open` and `overlays` — that collision was never a design problem.
- **Ticket ids are untouched.** `flow t047`, `47` and `parser` resolve through the store, not through `match`.
- **`fw`** is a fifth per-file symlink in `~/.local/bin`, pointing at the same `flow.js`.

## The texts

### Descriptions

- **`/groundwork`** — Refines the idea, designs the solution. Maps every open question, including ones nobody raised, and walks each with you to a written answer, filed where it belongs.
- **`/debug`** — Finds the cause by evidence, proves it, fixes it.
- **`/execute`** — Builds one ticket: its plan, its code, its review.
- **`/handoff`** — Writes what a session that was not here needs: the state itself, never a reading list. Inside a ticket, into the ticket.
- **`/visualize`** — Draws structure, architecture and layout: ASCII diagrams, screen mockups, HTML previews. In a message, and equally inside a spec or plan.
- **`/prototype`** — Throwaway code answering one question, and a report of what it found. Naive on purpose — no tests, no error handling, no abstractions, never promoted.
- **`/web-pages`** — Investigates a live web page you do not control — structure, behavior, runtime state — then experiments on it. For extension, scraper and userscript work.
- **`/research`** — Reads what a tool actually does — its docs, its source, its releases — never training memory. Searches first for an existing skill, plugin or MCP server, and records what came back.
- **`/cut-from-spec`** and **`/file-findings`** keep the lines they have. Both are typed-only, and `writing.md` §8 gives those one short line.
- **`/start`** — Opens a session — the board, one ticket, or a loose file.
- **`/run`** — Runs a shell command and reads its output.

2,200 characters down to 1,263 over 12 skills, and 851 of those actually load: the 4 typed-only ones are hidden from the session, and `/web-pages` installs per project.

### `home/CLAUDE.md` → `## Workflow`

Replaces `## Which skill`, which restated 9 descriptions the model already holds. A pipeline carries what no description can: the order, the artifacts, and that one phase runs at a time. Shape taken from `repos/Delapse/CLAUDE.md` → `## Workflow`.

The conditional entries underneath are not decoration. A pipeline says where the steps sit relative to each other, never where you are, so a session opening on "the login button is broken" gets nothing from the diagram alone.

**Draft, not ratified:**

```
/groundwork      → decisions written, each into the file that owns it
/cut-from-spec   → the next batch of tickets
/start           → the board, or one ticket
/execute         → one ticket built and reviewed
/file-findings   → the lessons taken out of it
```

Then `/prototype` against `/research` and `/debug` as the 2 conditional entries, the 3 that fire anywhere, and a line naming `/start`, `/run`, `/cut-from-spec` and `/file-findings` as hidden from context so nothing else can name them. `/handoff` is not hidden and stays out of that line.

The `flow done <id> → archived` row from the first draft is gone. Every other row is a step and what it leaves behind; that one was a CLI command and a state change. `/execute` runs `flow done t047` itself at line 168 of its own body.

## Held back

- **`/file-findings` needs a rewrite, and its shape is unproposed.** It does not know the 4 groups exist — `## Altitude — which skill` routes by scope and never names `phases/`, `tools/`, `standards/` or `stack/`, so its `needs skill:` flag reaches the author without the one decision they need next. It also applies at step 4 and reports at step 7, where the wanted order is sort, shape, show the grouped plan, take feedback, then write. Propose before writing.
- **`README.md` stays frozen**, as it has been since 2026-08-25.
- **`/handoff` closing a session pairs with `/start` opening one**, so `commands/` has a pull on it. It is in `commands/` for the invoker rule, not that pairing.

## Reversed during the session

Recorded so nobody re-derives them.

- **"Typed-only means it belongs in `commands/`."** Dropped once `/file-findings` showed a typed-only skill needs a folder for `references/write-skills.md`.
- **"A command earns its place by running something before the model thinks, or taking an argument."** Both halves describe a product that no longer works that way.
- **"A skill takes no arguments, so it carries no `argument-hint`."** Contradicted by 4 shipped skills in `repos/mattpocock-skills/`, and by the frontmatter list in the binary.
- **`session/` as the fifth group.** Wrong axis: it described when a thing runs, and what the 4 share is who reaches for them.
