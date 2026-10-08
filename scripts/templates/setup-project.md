---
type: setup-project
project: {project}
---

# Setting up {name}

- **Ticked**: Flow does it. **Unticked**: Flow leaves that thing exactly as it is.
- **Text box**: edit or delete any line.
- **Say go** in the session. Nothing changes before that, and `flow restore project` puts everything back.

Your choices come first: {count} boxes and 1 text box. Everything under ✅ happens with no choice. This form and the new version of every file sit in {full path of the migration folder}.

## ❌ Removed: works against Flow's rules

⚠️ Keep one only if you know exactly why. Claude follows it over Flow's rules, and nothing tells you when.

- [x] {removed}, such as: **lint hook**: taken out of `.claude/settings.json`. It tells Claude how to format code after every edit, which Flow's rules already do.
- [x] {removed}, such as: **tdd** skill: deleted. It plans and tests every change, which Flow's steps already do.
- [x] {removed}, such as: **AGENTS.md**: deleted. Its 9 rules moved into `CLAUDE.md`, and Claude skips it beside a `CLAUDE.md`.
- [x] {removed}, such as: **Claude Code's memory** for this project: deleted. Its 14 notes are sorted into Flow's files, listed under ✅.

## Switched on for this project

Each one stays off in your other projects.

- [x] {switched on}, such as: **supabase** plugin: this project uses `@supabase/supabase-js`.
- [x] {switched on}, such as: **stripe-helper** skill: this project takes payments through Stripe.

## Tickets

- [x] {tickets}, such as: **Tickets from your open-work lists**: 12, one per item in `docs/work/now.md` and `roadmap.md`.

## Old memory

- [ ] {old memory}, such as: **Claude Code's memory** under `-home-me-code-projects-backmark`: its project is gone from disk. Tick it only if it was this project, and it is read into Flow's files too.

## Your rules

New rules for every project, not only this one. They go into `~/.flow/CLAUDE.md`.

**Your new rules**:

```text
{your rules}
```

## ✅ Set up with no choice

**Moved into Flow's files**, from your old rule files and the memory. Each file is under `files/` beside this form: edit it there before you say go.

- {moving}, such as: 9 rules → `CLAUDE.md`, each cut to what Claude would get wrong without it.
- {moving}, such as: 4 facts about the project → `docs/context/`: stack, deploys, llm-calls, video-pipeline.
- {moving}, such as: 3 unplanned ideas → `.flow/inbox.md`.
- {moving}, such as: 2 lessons about tools → `~/.flow/wiki/`: Inngest retries, ffmpeg on WSL.
- {dropped}, such as: 23 lines dropped, since Flow's rules already cover them. `dropped.md` lists each one beside the Flow rule that covers it.

**Tickets**

- {fixed tickets}, such as: Write the product spec. Your 6 planning docs stay until it's done.
- {fixed tickets}, such as: Find skills, plugins and MCP servers for NestJS, Postgres and Inngest.

**Flow's files**

- Flow's rules for this project, in `CLAUDE.md`.
- Tickets, the inbox and findings, in `.flow/`.
- Flow's lines added to your `.gitignore`.

**Always removed: Flow can't work with it**

- {always removed}, such as: **superpowers** plugin: switched off in this project. It overrides Flow's rules in every session.

**Left as they are**: {kept}, such as: the context7 MCP server, the frontend-design plugin.

## What setup could not check

Each one below stays exactly as it is.

- {unread}, such as: the project's local settings. `.claude/settings.local.json` is not valid JSON.

## Every file this changes

With every box ticked, in the order it runs. A path with no `~` sits inside the project. A copy of each path outside `~/.flow/` as it was goes to `~/.flow/originals/{place}/` before the first change.

### ➕ Written

- `.flow/settings.json`: the ticket prefix `flow init` chose, written before any `flow` command
- `CLAUDE.md`: the project's rules, in place of what it holds now
- `.gitignore`: Flow's lines added to yours
- `.uncommitted-include`: gitignored files that travel between your machines
- {written}, such as: `.claude/settings.json`: superpowers switched off, supabase switched on, the lint hook removed
- {written}, such as: `.flow/tickets/`: 14 tickets
- {written}, such as: `.flow/inbox.md`: 3 ideas
- {written}, such as: `docs/context/`: 4 facts
- {written}, such as: `~/.flow/CLAUDE.md`: your new rules

### ➖ Deleted

- {deleted}, such as: `AGENTS.md`
- {deleted}, such as: `.claude/skills/tdd`
- {deleted}, such as: `~/.claude/projects/-home-me-code-projects-shop/memory`

### ▶️ Commands

- {commands}, such as: `flow skills on stripe-helper` writes `.flow/settings.json`, `.claude/skills/stripe-helper`

`.flow/version` is stamped once the check at the end passes.
