# The project setup form

`migration.md`, as the project's setup session writes it. Copy every fixed line word for word. Replace each line holding a `{…}` whole, with the lines it stands for. The text after `such as:` is one example. Never leave a `{…}` in the file. Replace `{full path of the migration folder}` with its absolute path, since the reader opens the form from the project, not from the folder.

**A line appears only where saying go changes something.** A section left with no line goes, heading included. `## What Flow sets up` and `## Every file this changes` always stay.

**Say what happens, then where.** One line per thing, no explanation past what stops it reading as a mistake.

## What each `{…}` holds

- **`{project}`**: the project's full path, as `run.json` names it. **`{name}`**: its folder's name. **`{place}`**: the first half of `migration` in `run.json`.
- **`{always removed}`**: one line per plugin or hook that tells Claude how to work in every session.
- **`{removed}`**: one box per skill, agent, command or hook that overlaps Flow, then the memory folder's box.
- **`{switched on}`**: one box per plugin or outside skill off on this machine that the project's code uses, naming what uses it.
- **`{moving}`**: one box per place with something in it: the count, then the place, then the names where they fit on the line.
- **`{tickets}`**: the 2 fixed tickets, each where it applies, then one box for the tickets from open-work lists, naming each list.
- **`{old memory}`**: one unticked box per memory folder whose project is gone from disk.
- **`{kept}`**: what stays, by name. None → the line goes.
- **`{your rules}`**: the new lines for `~/.flow/CLAUDE.md`. None → the whole section goes.
- **`{unread}`**: one line per source `flow survey` printed as `unread:`, saying in plain words what went unchecked and why. None → the whole section goes.
- **`{file list}`**: every path saying go changes, ticked or not, grouped and shaped by `## The file list` below.

## The template

````markdown
---
type: setup-project
project: {project}
---

# Setting up {name}

Nothing changes until you say go. The new version of every file is under {full path of the migration folder}/files/. This form is in the same folder.

## What Flow sets up

- Flow's rules for this project. `CLAUDE.md`
- Tickets, the inbox and findings. `.flow/`
- CLAUDE.md is rewritten in Flow's layout. What's worth keeping from it is below.
- {always removed}, such as: The superpowers plugin is switched off here: it overrides Flow's rules in every session. `enabledPlugins`

## 🔴 Removed unless you untick it

⚠️ Do not untick these. Flow was built and tested with every one of them gone. Keeping one makes Claude work against Flow's rules, and nothing will tell you it's happening. Untick one only if you know exactly why. Anything you untick is shown to you again before setup goes ahead.

- [x] {removed}, such as: tdd skill: plans and tests every change, which Flow already does. `.claude/skills/tdd/`
- [x] {removed}, such as: AGENTS.md: its 9 rules moved into CLAUDE.md, and Claude skips it beside a CLAUDE.md. `AGENTS.md`
- [x] {removed}, such as: Claude Code's memory for this project: 14 notes, sorted into the sections below. `~/.claude/projects/-home-me-code-projects-delapse/memory/`

## Switched on for this project

Each stays off in your other projects.

- [x] {switched on}, such as: supabase plugin: this project uses @supabase/supabase-js. `enabledPlugins`
- [x] {switched on}, such as: stripe-helper skill: this project takes payments through Stripe. `flow skills on`

## Moving into Flow's files

- [x] {moving}, such as: 9 rules → `CLAUDE.md`
- [x] {moving}, such as: 4 facts about the project → `docs/context/`: stack, deploys, llm-calls, video-pipeline
- [x] {moving}, such as: 3 unplanned ideas → `.flow/inbox.md`
- [x] {moving}, such as: 2 lessons about tools → `~/.flow/wiki/`: Inngest retries, ffmpeg on WSL
- [ ] {old memory}, such as: Claude Code's memory under -home-me-code-projects-backmark: its project is gone from disk. Tick it only if it was this project.

23 lines are dropped, since Flow's rules already cover them. dropped.md lists each one.

## Tickets

- {tickets}, such as: Write the product spec. Your 6 planning docs stay until it's done.
- {tickets}, such as: Find skills, plugins and MCP servers for NestJS, Postgres and Inngest.
- [x] {tickets}, such as: 12 tickets from your open-work lists: docs/work/now.md, audit/bugs.md, audit/debt.md, roadmap.md

Left as they are: {kept}, such as: the context7 MCP server, the frontend-design plugin.

## Added to your own rules

For every project, not only this one. `~/.flow/CLAUDE.md`

```text
{your rules}
```

## What setup could not check

Setup could not read each one below, so it stays exactly as it is.

- {unread}, such as: the project's local settings. .claude/settings.local.json is not valid JSON.

## Every file this changes

{file list}

~/.flow/originals/{place}/ keeps a copy of every file above outside ~/.flow/ as it was, so `flow restore project` can put this project back. .flow/version is stamped once the check at the end passes.
````

## The file list

At go, the session records every path in it before its first change, so one path left out is a file `flow restore` cannot bring back. Each path sits in backticks, and a path with no `~` sits inside the project. A command's line names the command, then every path it writes, or `writes nothing`. `.flow/settings.json` is written before any `flow` command runs.

```markdown
**➕ Written**

- `CLAUDE.md`: the project's rules, in place of what it holds now
- `.claude/settings.json`: superpowers switched off, supabase switched on, the lint hook removed
- `.gitignore`: Flow's lines added to yours
- `.uncommitted-include`: gitignored files that travel between your machines
- `.flow/settings.json`: the ticket prefix flow init chose
- `.flow/tickets`: 14 tickets
- `.flow/inbox.md`: 3 ideas
- `.flow/findings`: 2 lessons
- `docs/context`: 4 facts
- `~/.flow/CLAUDE.md`: your new rules

**➖ Deleted**

- `AGENTS.md`: its rules moved into CLAUDE.md
- `.claude/skills/tdd`: a skill ticked above
- `~/.claude/projects/-home-me-code-projects-delapse/memory`: sorted above

**▶️ Commands**

- `flow skills on remotion` writes `.flow/settings.json`, `.claude/skills/remotion`
- `flow skills on stripe-helper` writes `.flow/settings.json`, `.claude/skills/stripe-helper`
```
