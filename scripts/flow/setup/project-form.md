# The project setup form

`migration.md`, as the project's setup session writes it. Copy every fixed line word for word. Replace each line holding a `{…}` whole, with the lines it stands for. The text after `such as:` is one example. Never leave a `{…}` in the file.

**A line appears only where saying go changes something.** A section left with no line goes, heading included. `## What Flow sets up` and `## Every file this changes` always stay.

**Say what happens, then where.** One line per thing, no explanation past what stops it reading as a mistake.

## What each `{…}` holds

- **`{project}`**: the project's full path, as `run.json` names it. **`{name}`**: its folder's name. **`{place}`**: the first half of `migration` in `run.json`.
- **`{always removed}`**: one line per plugin or hook that tells Claude how to work in every session.
- **`{removed}`**: one box per skill, agent, command or hook that overlaps Flow, then the memory folder's box.
- **`{moving}`**: one box per place with something in it: the count, then the place, then the names where they fit on the line.
- **`{tickets}`**: the 2 fixed tickets, each where it applies, then one box for the tickets from open-work lists, naming each list.
- **`{old memory}`**: one unticked box per memory folder whose project is gone from disk.
- **`{kept}`**: what stays, by name. None → the line goes.
- **`{your rules}`**: the new lines for `~/.flow/AGENTS.md`. None → the whole section goes.
- **`{action lines}`**: every line under `## Every file this changes`, in the order they run.

## The template

````markdown
---
type: setup-project
project: {project}
---

# Setting up {name}

Nothing changes until you say go. The new version of every file is under files/, beside this form.

## What Flow sets up

- Flow's rules for this project. `AGENTS.md`, loaded by `CLAUDE.md`
- Tickets, the inbox and findings. `.flow/`
- CLAUDE.md is replaced. What's worth keeping from it is below.
- {always removed}, such as: The superpowers plugin is switched off here: it overrides Flow's rules in every session. `enabledPlugins`

## 🔴 Removed unless you untick it

⚠️ Do not untick these. Flow was built and tested with every one of them gone. Keeping one makes Claude work against Flow's rules, and nothing will tell you it's happening. Untick one only if you know exactly why. Anything you untick is shown to you again before setup goes ahead.

- [x] {removed}, such as: tdd skill: plans and tests every change, which Flow already does. `.claude/skills/tdd/`
- [x] {removed}, such as: Claude Code's memory for this project: 14 notes, sorted into the sections below. `~/.claude/projects/-home-me-code-projects-delapse/memory/`

## Moving into Flow's files

- [x] {moving}, such as: 9 rules → `AGENTS.md`
- [x] {moving}, such as: 4 facts about the project → `docs/context/`: stack, deploys, llm-calls, video-pipeline
- [x] {moving}, such as: 3 unplanned ideas → `.flow/inbox.md`
- [x] {moving}, such as: 2 lessons about tools → `.flow/findings/`: Inngest retries, ffmpeg on WSL
- [ ] {old memory}, such as: Claude Code's memory under -home-me-code-projects-backmark: its project is gone from disk. Tick it only if it was this project.

23 lines are dropped, since Flow's rules already cover them. dropped.md lists each one.

## Tickets

- {tickets}, such as: Write the product spec. Your 6 planning docs stay until it's done.
- {tickets}, such as: Find skills, plugins and MCP servers for NestJS, Postgres and Inngest.
- [x] {tickets}, such as: 12 tickets from your open-work lists: docs/work/now.md, audit/bugs.md, audit/debt.md, roadmap.md

Left as they are: {kept}, such as: the context7 MCP server, the frontend-design plugin.

## Added to your own rules

For every project, not only this one. `~/.flow/AGENTS.md`

```text
{your rules}
```

## Every file this changes

{action lines}

~/.flow/originals/{place}/ keeps a copy of every file above outside ~/.flow/ as it was, so `flow restore project` can put this project back. .flow/version is stamped once the check at the end passes.
````

## The action lines

`~/.flow/scripts/apply-migration.js` acts on every line opening `- write `, `- delete `, `- move ` or `- run `, anywhere in the file, so no other line may open with one of those 4 words. One path per line. A path with no `~` sits inside the project. Everything after `: ` is for the user.

```markdown
- write AGENTS.md: the project's rules
- write CLAUDE.md: one line loading AGENTS.md, in place of what it holds now
- write .claude/settings.json: superpowers switched off, the lint hook removed
- delete .claude/skills/tdd: a skill ticked above
- write .gitignore: Flow's lines added to yours
- write .work-include: gitignored files that travel between your machines
- write .flow/settings.json: marks this project as Flow's
- write .flow/tickets: 14 tickets
- write .flow/inbox.md: 3 ideas
- write .flow/findings: 2 lessons
- write docs/context: 4 facts
- run flow skills on remotion: writes .flow/settings.json, .claude/skills/remotion
- write ~/.flow/AGENTS.md: your new rules
- delete ~/.claude/projects/-home-me-code-projects-delapse/memory: sorted above
```

`.flow/settings.json` comes before any `flow` command, since `flow` needs the folder. A `run` line names every path its command writes, or ends `: writes nothing`.
