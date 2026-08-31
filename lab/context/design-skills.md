# Skills — groups, install tiers, overlays, external plugins

Settled 2026-08-26, revised 2026-08-28. Nothing built. Two designs were tried and dropped along the
way, and `## Rejected` holds both with the argument that killed each. Every test named below ran
against Claude Code 2.1.246 in `tmp/hooktest/`, and `## What the platform does` records what they
found.

This design was built 2026-08-28. `design-commands-as-skills.md` supersedes it on 4 points:
`skills/commands/` is a fifth group, `debug-web-pages` is renamed, every description is rewritten
again, and Claude Code has since merged commands into skills. Read that file first where the two
disagree.

## The decision

**Flow keeps Claude Code's skills.** A skill stays a hand-written `SKILL.md` in the shape it has today.
4 additions carry everything a mechanism of Flow's own was going to buy.

- **A group is a folder in Flow's tree** — `skills/phases/groundwork/SKILL.md`. It files a skill and
  decides nothing else.
- **A skill installs globally, per project, or not at all.** Not installed costs nothing and stays
  findable.
- **An overlay is 1 line at the bottom of the skill** — `` !`flow overlays get groundwork` ``. The
  shell runs as the skill loads, and its output replaces the line.
- **A description says what the skill is. A trigger is written only where one is wanted.**

## The groups

**Reversed 2026-08-29: `commands/` holds every skill the user mainly invokes, and it wins wherever two groups fit.** `/cut-from-spec` moved out of `phases/`. The earlier rule — a phase files under `phases/` even when only the user invokes it — is dead, and the argument behind it (that `phases/` should answer "what are the phases" on disk) was already broken by `/file-findings` sitting in `commands/`. Closed by the user: *"we're fucking moving all of the commands, the skill that will be mainly utilized by the user under the commands folder. Period."*


4 of them: `phases/`, `tools/`, `standards/`, `stack/`. Split by what decides whether you read one,
never by subject.

- **`phases/`** — what you are doing, one at a time: `groundwork`, `cut-from-spec`, `execute`,
  `prototype`, `debug`.
- **`tools/`** — something you do inside a phase. It starts, produces something, finishes: `research`,
  `visualize`, `handoff`, `file-findings`.
- **`standards/`** — how you work, held the whole way through. It produces nothing on its own and
  never finishes. Empty today; comments, naming and error handling land here.
- **`stack/`** — what you are touching: `debug-web-pages`, and where most of the next 40 land.

**The group is a filing decision.** It says where a file sits. Which skills install globally and which
carry a trigger are per-skill choices that move as the set grows.

`framework-build` used `core`, `domain` and `stack`, which splits by subject. `core` then means
everything else. These 4 split by trigger, which is a question with an answer.

Nothing outside Flow's own tree reads a group. Changing one later is a `mv`.

## Installing and showing

**Reversed again 2026-08-30. Read this section first; everything below it is the 2026-08-29 state.**

### Most `stack/` skills are off by default (user, 2026-08-30)

**The argument that set "all on" was one author who wants every skill everywhere.** That is true of
`phases/`, `commands/` and `tools/`, and false of `stack/` by definition. A `stack/` skill is named
for what you are touching, so a React skill's description sits in every Python project's context
permanently. The cost was invisible only because `stack/` holds one skill today and `standards/` holds
none. At ten stack skills it is ten descriptions in every session, forever.

**The default belongs to the group, because the group already knows the answer:**

- `phases/`, `commands/`, `tools/` → **on**
- `stack/` → **off**, turned on per project
- `standards/` → per skill. "How you work throughout" covers both universal and narrow ones, and
  nothing about the group decides which

**It is written in `home/settings.json`**, which ships a `skillOverrides` block naming the off ones.
That file already owns the key. The alternative — a default in each skill's frontmatter, generated
into settings by `flow install` — needs a frontmatter key Claude Code ignores, and `install.js`
deliberately does not write `settings.json` at all.

**Off globally, on in one project, already works and needs nothing built.** Verified 2026-08-29
against Claude Code 2.1.251: a project setting `on` restored a skill the machine had set to `off`. The
objects merge key by key rather than replacing, and the change lands on the next session.

**`skillOverrides` now has two values in use, `on` and `off`.** `name-only` was already never used.
`user-invocable-only` was proposed for `stack/` on 2026-08-30 and rejected by the user: a stack skill
exists to fire during a phase, so a state the model cannot see makes it unfirable, which is the whole
point of having it. Either the agent can reach it or it cannot. `home/settings.md` documents four
values as if all four were live and becomes two, with a line saying why the other two are not. The
never-fire-anywhere case stays in `disable-model-invocation`, in the skill's own frontmatter.

**`flow skills ls` becomes load-bearing.** It prints `global` on every row today and carries no
information. The moment most `stack/` skills are off, a session cannot see them — that is the point —
and something has to answer *what exists that I am not being shown*. Nothing announces a hidden skill
and nothing should. So `flow skills ls` is the only discovery path, and its column becomes each
skill's state, read from the machine's settings and the project's, with the group beside it.

### `home/skills` is deleted (user, 2026-08-30)

**It is a hand-maintained copy of something `flow install` can compute.** Its own header says the list
has no exceptions and every Flow skill is on it: 12 skills on disk, 12 names in the file, identical. A
hand-maintained copy that can only ever be wrong.

**The drafts group removes the last case for it.** The one reason to name skills individually is
*some skills do not ship*, and a group folder answers that better — visible on disk, cannot drift, and
adding a skill to it is a `mkdir` rather than an edit in two places.

`flow install` links every skill in the catalog whose group is not `drafts/`. Two commands change and
both improve: `flow skills add` refuses a name found in the catalog rather than in a list, and
`install.js`'s "named in `home/skills` and no skill has that name" warning disappears, because the case
cannot occur.

**Installing and being shown stay separate questions.** Every skill still installs; `skillOverrides`
decides what a session pays for it. A `stack/` skill set to `off` costs nothing in context, so there is
no case for not installing one.

### `.claude/flow/skills` is deleted, and so is the mechanism behind it (user, 2026-08-30)

**What it was:** a file of skill names in a project. The skill folders lived in the Flow clone, and the
list existed because the symlink could not be committed — it points at wherever that machine's clone
sits.

**An external skill used by one project does not need to be in the Flow clone at all.** Copy the folder
into `<project>/.claude/skills/<name>/` and commit it. Real files. No list, no dependency on a clone,
and the project works on a machine that never installed Flow.

**This already worked.** `project-template/.gitignore` carries `.claude/skills/*` then
`!.claude/skills/*/`, which ignores symlinks and tracks real folders — verified in a real repo
2026-08-28. Copying an external skill in has been supported the whole time; the list was solving a
problem the gitignore had already solved differently.

**Claude Code already owns per-project external things** — MCP servers in `.mcp.json`, plugins in
settings. Flow inventing a third list, for skills only, was the odd one out, and its name read as if it
held something of Flow's.

**Two cases, neither needing a list:**

- **One project wants it** → copy the folder into that project, commit it
- **Several projects want it** → it is a skill used everywhere, which is what installing globally
  means. Vendor it into Flow's tree under a group

**What goes:** the `.claude/flow/skills` file from `project-template/`, the `flow skills add` and
`flow skills sync` commands, `projectList` and `projectLinks` in `lib/skills.js`, and one test in
`skills.test.js`. `flow skills ls` survives with the new job above.

### Built 2026-08-30, all three blocks in one pass

**`skillOverrides` reading turned out to be the interesting part.** `flow skills ls` now resolves each
skill's state itself, merging the machine's `settings.json` under the project's key by key — the same
merge Claude Code does. The machine's config follows `CLAUDE_CODE_CONFIG_DIR`'s successor
`CLAUDE_CONFIG_DIR`, so the scratch session reads the scratch settings rather than the real ones. The
table prints `SKILL | GROUP | STATE | SET BY`, and `SET BY` is what answers *who turned this off*.

**`home/settings.json` names `web-pages` and nothing else**, because it is the only `stack/` skill on
disk. The mechanism is built for a full catalog; the list is short because the tree is.

**`flow skills` lost half its actions.** `add` and `sync` both existed to maintain the two deleted
lists, so both went with them. `ls` and `get` remain, and `get` is still the default action.

**`lib/skills.js` lost `globalList`, `projectList`, `projectLinks`, `readList` and `addToList`** — the
last two had no other caller once the lists were gone, since `work.js` reads `.flow-include` itself. It
gained `DRAFTS`, `installable({ drafts })` and `states(root)`.

**Two tests went and one arrived.** The `add` refusal and the `sync` warning tested commands that no
longer exist. The new one creates a real skill folder under `skills/drafts/` inside a `try`/`finally`,
because the group folder *is* the mechanism and faking it anywhere else would test nothing.

---

### The 2026-08-29 state, kept for its arguments

**Everything from here to the end of this section is history.** The three tiers below were superseded on 2026-08-29, and the all-on rule that replaced them was superseded on 2026-08-30 by the three blocks above.

The tiers answered one question with one lever. *Not installed* was meant to keep a rarely-wanted skill out of context, and it also made the skill untypeable — which is the wrong trade on a machine with one user, who wants every skill reachable and pays for a description he never uses.

Two questions, and they are separate:

- **Is the skill here at all?** Answered by `home/skills` and a project's `.claude/flow/skills`, both unchanged.
- **What does this session pay for it?** Answered by `skillOverrides`, a `settings.json` key nobody had read.

**Every Flow skill installs on every machine.** `home/skills` names all 12. A skill the model is never shown costs nothing, so there is no reason to leave one unreachable.

**`skillOverrides` is keyed by skill name and takes 4 values** — `on` (name and description), `name-only` (the name alone, still invocable), `user-invocable-only` (`/name` works, the model sees nothing), `off` (`/name` refuses too).

**Every skill is `on` by default, and `home/settings.json` names none of them** (user, 2026-08-29, after two reversals). A project turns off what it does not want, so the project's settings file reads as the list of what is off there. The inverse — off on the machine, re-enabled per project — was proposed twice and rejected twice: it makes the common case the one you have to configure.

**`name-only` is never the value.** It hides the description and leaves the skill invocable, so the model keeps the power to fire a skill and loses the only thing it could judge with. `off` blocks the typed path as well, which is right for a project opting out and wrong as a machine default.

**Nothing announces a hidden skill, and a line in `~/.claude/CLAUDE.md` was rejected for it** (user, 2026-08-29). That file loads in every session, so a browser skill would announce itself in projects with no browser — the exact cost this key exists to remove. Discovery is a read, not a broadcast: `flow skills ls` lists every skill on the machine, and `settings.json` says what each is set to.

### Verified, 2026-08-29, Claude Code 2.1.251

Four `-p` runs against a scratch config built by `try.sh`:

- **`off` at machine level hides the skill from the model.** `visualize` vanished from the list the session was handed.
- **`name-only` lists the skill with no description.** `research` appeared by name, and the session reported no description text for it.
- **A project's `.claude/settings.json` overrides the machine's, key by key.** Project `on` restored `visualize` after the machine had set `off`; project `off` hid `debug`, which the machine never named; `research` kept the machine's `name-only` throughout, so the objects merge rather than replace.
- **An edit applies on the next run.** A newly created project `settings.json` did not apply until its second run, which is the workspace trust flow rather than this key.

### What this costs

**`flow skills add` loses its users.** It refuses a name already global, and every Flow skill now is, so the command's remaining job is a skill that is not Flow's — vendored in, or belonging to one project. None exists yet. `sync` still earns its place the day one does, and the refusal now points at `skillOverrides` instead of telling you to edit `home/skills`.

**Kept rather than archived** (user, 2026-08-29). This design is young enough to be reversed, and `add` is the command a reversal would need back.

**`disable-model-invocation` keeps a narrower job.** One copy of a skill serves every project, so the frontmatter line can only say *never fire anywhere*. `/start`, `/run`, `/cut-from-spec` and `/file-findings` carry it because *never* is true of them.

## Where a skill installs

**Installing a skill means creating 1 symlink** whose filename is the skill's name. Nothing is copied.

3 states:

1. **Global** — `~/.claude/skills/<name>`. The essentials, read in every session in every project.
2. **This project** — `<project>/.claude/skills/<name>`. Read only here.
3. **Not installed** — everything else. Costs nothing, and `flow skills ls` still finds it.

**Installing decides what Claude Code loads. It decides nothing about what is readable.** Every skill
file sits in the Flow clone, so a command reads an uninstalled skill as easily as an installed one.

Starting set, and it moves freely afterwards:

- **Global** — the 5 phases, plus `research`, `visualize`, `handoff`, `file-findings`. All 9 fire or
  get typed in any project.
- **This project** — `debug-web-pages`, and every `stack/` skill from here on.

9 of 10 landing globally is a fact about today's catalog, not a rule. Every skill written so far is a
process skill. The next 40 are `stack/` skills and none of them installs globally.

### The 2 lists

A skill's name in a list is what makes it install. 2 files, same format — 1 name per line, no paths, no
groups, no versions. Different owners:

- **`home/skills`, in the Flow repo, committed with Flow.** Names what links into `~/.claude/skills/`.
  Identical on every machine, because it is Flow's own decision.
- **`<project>/.claude/flow/skills`, in the project, committed with the project.** Names what links
  into that project's `.claude/skills/`. It travels with the project.

Commands:

- **`flow skills add react`** — links `react` into this project, appends the name to the project list.
  **It refuses a name already linked globally**, because the global copy silently wins.
- **`flow skills add --global research`** — the same against `home/skills`.
- **`flow skills sync`** — reads the list and rebuilds every link against wherever the clone lives here.
  The 1 command a fresh clone needs.
- **`flow skills ls`** and **`flow skills get`** — read Flow's tree whether a skill is installed or not.

`link.sh` reads `home/skills` for its skill section, and keeps doing commands, agents and scripts.

### Why a symlink cannot be committed

Git stores a symlink as its target path, in text. The commit carries this machine's clone path, and
another machine keeps its clone somewhere else. The link points at nothing, Claude Code stats a path
that does not exist, and skips the entry. **No error prints.** The skill is simply absent.

The list carries the name and nothing else, so nothing machine-specific is ever committed.

### Committed copies were rejected

A project could commit the real skill folder instead, and then need no list, no links and no sync.

**A Flow skill has another copy that keeps improving.** Improve `react` after learning something in
project X, and a committed copy in project Y freezes at the old version with nothing surfacing the
gap. Skills improving as you work is what Flow is for, and copies turn it off.

The trade is 1 command per project clone against silent divergence across every project. A project
clone already needs setup, so the command costs nothing new.

### What the project ignores

`.gitignore` matches path names with globs, and it has exactly 1 filter that tests what a thing is: a
trailing slash means directories only. **Git never treats a symlink as a directory**, because git does
not follow symlinks — it stores one as a small file holding the target path.

So 2 static lines in `project-template/.gitignore` split the folder correctly:

```
.claude/skills/*
!.claude/skills/*/
```

Tested on all 4 cases. A real directory is tracked. A symlink to a directory, a symlink to a file and a
loose file are all ignored.

It commits folders and ignores everything else. That lands correctly because a skill is always a
folder and a link is never one, and it means a real loose file in that directory would be ignored too.

A project therefore holds 2 Flow things under `.claude/`:

- **`.claude/skills/`** — Flow's links, rebuilt by `flow skills sync`; external skills, committed
- **`.claude/flow/`** — real files, tracked: `overlays/` and the `skills` list

### How `flow` finds the clone

Nothing stores the path. `~/.local/bin/flow` is a symlink to `<clone>/scripts/flow/flow.js`, and
**node resolves symlinks before the script runs**. Inside `flow.js`, `__dirname` holds
`<clone>/scripts/flow` — the real location, not the link. The clone is 3 folders up.

Tested, and `commands/open.js` already resolves `fmerge.js` this way.

Move the clone anywhere and re-point the 1 link in `~/.local/bin`. Every path the command builds moves
with it.

## External skills and plugins

3 kinds of outside material, each landing differently.

- **An external skill for 1 project** — copy the folder into `<project>/.claude/skills/` and commit it.
  The drift argument does not reach it: its source of truth is someone else's repo, and it changes when
  you pull a new version. Freezing it is correct.
- **An external skill wanted in several projects** — vendor it into Flow's tree under a group, with its
  origin in the file, then link it like any Flow skill. 1 copy again, and you own the copy. This is
  where writing our own version starts.
- **A plugin** — never in `.claude/skills/`. Claude Code installs it and reads it from elsewhere.

### A plugin brings more than a skill

impeccable ships 1 skill, 4 subagents, 23 commands and 2 hooks. Enabling it adds a small system.

**Prefer external material that carries knowledge. Weigh anything carrying process.** Flow is a process
workflow, so a skill with its own build order competes with `execute` and nothing arbitrates. Of the 3
surveyed, `ui-ux-pro-max` is mostly knowledge — a searchable database of styles, palettes and font
pairings. `impeccable` is mostly process. `taste-skill` sits between.

### Off by default, enabled per project

**`enabledPlugins` is the off switch.** Off means no skill, no commands, no subagents and no hooks.

**`skillOverrides` is not.** It hides the skill from the model and leaves the commands and hooks
running. impeccable's `Stop` hook fires at the end of every turn either way.

Where each setting sits:

- **`.claude/settings.json`, committed** — `extraKnownMarketplaces`, recording that this project may use
  the plugin.
- **`.claude/settings.local.json`, gitignored** — `enabledPlugins`, flipped whenever you want it. No
  diff, no commit, and the project is never forced into the state.

**A flip takes effect in the next session.** Skills, commands, subagents and hooks are all read once at
session start.

### Hiding a skill, when that is what is wanted

`"skillOverrides": { "<name>": "user-invocable-only" }` removes a skill from the model's view
completely — no name, no description, nothing. Typing `/<name>` still loads it and runs its shell.
Tested both halves.

That fits a plugin you want reachable but never self-firing. It leaves the hooks running, so it is a
trigger control, not a cost control.

## Overlays

A project adds to a skill, never edits it. 1 copy of a skill exists per machine and every project
shares it.

**`flow overlays get <name>` prints `<project>/.claude/flow/overlays/<name>.md` and stops.**

- **No file, no output.** Nothing prints, and the skill reads as though the line were not there.
- **Outside a git repo, no output.** Finding the project means asking git for the root, which fails
  there. Every other `flow` command is right to throw without a repo; a skill is invoked anywhere.
- **The command never parses the file.** No schema, no keys, no section it knows about. Whatever the
  file holds is what appears.
- **Every skill carries the line, with no exceptions.** It costs 1 process start per skill load,
  roughly 50ms. Selective would mean editing the shared copy the day a project wants a skill that
  lacks it.

**An overlay holds anything** — an override, an addition, an extension, a mix. `## Overrides` is a
heading someone writes, and the words under it do the work. Guidance on writing a good one belongs
wherever that is taught, and never in the command.

**Removing works by adding**, because the overlay arrives after the phase it changes. "Skip phase 3
here" is enough, and it keeps section-matching out of the script.

**An overlay is a real file, tracked and committed.** Nothing about it is symlinked, and it works the
same whether its skill installed globally or here.

## Descriptions and triggers

Every installed skill's full description sits in context from the moment a session starts. Tested.

**A description says what the skill is and what it covers.** It carries nothing about when to invoke
it. `visualize` names its media because a reader cannot otherwise tell what it draws — **under-explaining
is the failure to avoid**, and no word count overrides it.

**A trigger is written only where one is wanted**, and lands in exactly 1 place:

- **`home/CLAUDE.md`** — the few that must fire with nothing else loaded.
- **A phase's body** — where the phase is what needs it. A global comment standard is named by
  `execute`.
- **A phase's project overlay** — where 1 project wants it. A project `CLAUDE.md` would load that
  trigger into groundwork and debugging sessions too, where the standard is noise.
- **A project `CLAUDE.md`** — where it is project-wide and belongs to no phase.

Which skills get one:

- **The 5 phases share 1 routing block in `home/CLAUDE.md`.** You are in 1 phase at a time, so they
  are 1 decision with 5 outcomes. Written separately, each description has to say when the other 4 do
  not apply, which is why `groundwork`'s runs to 110 words. `/start` already routes when a ticket
  exists; the block covers the case where the user just says something.
- **`research`, `visualize` and `handoff` get 1 line each in `home/CLAUDE.md`.** All 3 fire in bare
  conversation with no phase loaded.
- **`file-findings` gets none.** It is `disable-model-invocation: true` and typed.
- **A `standards/` skill is named by the phase that holds it.** The comments skill is named by
  `execute`.
- **A `stack/` skill gets none**, unless 1 project uses it constantly. Then that project's `CLAUDE.md`
  carries it.

**Moving a trigger saves nothing. Not writing one saves everything.** `home/CLAUDE.md` loads every
session anyway, so the reduction comes from the 40 `stack/` skills that never get a trigger written.
Compressing 5 phase triggers into 1 block is real but small beside that.

**"ALWAYS invoke" leaves every description.** The routing block carries that force instead.

**Finding a skill nobody triggers is research.** `research` gains a step: before working against an
external tool, search outward for an existing skill, plugin or MCP server for it, then check Flow's own
tree, judge what comes back, and record it. Most of what exists is external, and an existing skill for
a tool is often worth more than that tool's documentation. Flow's own `stack/` skills start there —
adopt one, work with it, then write ours.

## Arguments

**A skill takes no arguments. Anything needing an argument is a command.**

**Arguments are for the human. The model reads context instead.** A command is typed, so it can take
one. A skill is reachable by the model, so it takes none.

- **An argument breaks the duplicate check.** Claude Code skips a skill body already loaded when the
  rendered content matches. An argument changes the content, so the whole body loads a second time.
- **A command is typed and a skill is not.** Whoever supplies an argument is at the keyboard.

All 10 current skills already satisfy this. `/start` and `/run` are commands and both take arguments.

**This rule binds Flow's own skills.** An external skill is not ours to hold to it, and impeccable
takes a sub-command as an argument by design.

**The rule is not self-enforcing.** Claude Code appends `ARGUMENTS: t099` even to a skill carrying no
placeholder, and the model volunteers an argument nothing asked for. A `PreToolUse` hook could strip
it, since `updatedInput` is supported on that event. The user rejected that hook 2026-08-26: new
machinery against a rare cost. The cost is 1 duplicate skill body, accepted.

Two consequences:

- **No `argument-hint` on a Flow skill**, and no ticket id in a description. Both invite what the rule
  bans.
- **A command earns its place 2 ways now** — running something before the model thinks, or needing an
  argument. The repo `CLAUDE.md` states only the first.

## Files load at session start

`flow open` reads a ticket's fenced `flow-open` block and prints every file it names. `/start` is the
only caller. **It stays exactly as built.**

Two doors already exist, and only 1 loads files:

- **`flow t047`** — the ticket alone
- **`flow open t047`** — the ticket, then its files

Only `open.js:131` reads the block. Nothing else in `scripts/` touches it.

**A skill never loads a ticket.** `/start t047` prints the ticket, `commands/start.md` routes on its
type, and the skill is invoked with no argument. The body is identical every time, so the platform
skips a second copy for free.

## What the platform does

Tested, not assumed.

- **Shell runs inside `SKILL.md`, at any position.** A body containing `` !`cat payload.txt` `` returned
  a value written 1 second earlier. `--output-format stream-json` showed 1 tool call to `Skill` and no
  `Bash`. The same line at the end of a multi-section file behaved identically. **The whole design
  rests on this.**
- **A duplicate skill is skipped when the rendered content matches.** Two invocations with identical
  arguments returned the body once, then `Skill /dedupe is already loaded above; instructions
  unchanged.` Two invocations with different arguments returned the body twice.
- **`$ARGUMENTS` substitutes, and an argument arrives even without it.** `/pingtest t047` against
  `` !`echo "ARGS-RECEIVED=[$ARGUMENTS]"` `` returned `ARGS-RECEIVED=[t047]`. A skill with no
  placeholder got `ARGUMENTS: t099` appended to its body.
- **The model supplies arguments on its own.** Asked to run a skill twice for 2 ticket ids, it sent
  `{"skill":"noargs"}` first and `{"skill":"noargs","args":"t099"}` second. Nothing instructed either.
- **The model does not re-read what a skill printed.** A skill that `cat`s a file, then a question
  needing that file, produced 1 tool call — `Skill`. No `Read`, no `Bash`, no `Grep`. The body said the
  content was printed above in full. Keep that wording.
- **Every installed skill's full description is in context from the start.** A session asked to list
  what it could see printed every local skill and every installed one, each with its description word
  for word.
- **A global skill beats a project skill of the same name, silently.** With `dupname` in both folders,
  the listing showed 1 entry carrying the global description word for word, and invoking it loaded the
  global body. The project copy produced no warning and no error. Run twice.
- **Exactly 2 skill directories are read** — `<project>/.claude/skills/*/SKILL.md` and
  `~/.claude/skills/*/SKILL.md`. No setting adds a third, so a symlink or a copy is the only way to
  make a skill visible in 1 project.
- **Skill discovery is 1 level deep.** The loader reads the entries of a skills directory and stats
  `<entry>/SKILL.md`. No recursion, and the permission parser accepts exactly 4 path segments. A
  grouped folder under `~/.claude/skills/` never loads.
- **`user-invocable-only` removes a skill from the model's view entirely.** A session asked to list
  every skill including ones it may not invoke did not list it — no name, no description. Typing
  `/pingtest` in the same project loaded the body and ran its shell line.
- **`name-only` shows the name and hides the description.** The skill stays invocable.
- **`off` and `disable-model-invocation: true` take the skill away from the model.** Naming it
  explicitly failed: `Skill pingtest is disabled for model invocation in skillOverrides settings`.
- **Plugin skills are namespaced `plugin:skill`.** Installed plugins listed as
  `superpowers:brainstorming` and `frontend-design:frontend-design`. A `skillOverrides` key for a
  plugin skill almost certainly needs the prefix.
- **Custom commands are not advertised to the model.** A fresh session asked to list every custom slash
  command listed zero. Skills are advertised; commands are not. So a plugin's 23 commands cost no
  context.
- **The `/` menu is 1 row per file.** Claude Code draws it from its own registry. No API adds a row, and
  no dynamic argument completion exists. `argument-hint` is a static placeholder.
- **`disableBundledSkills` and `disableWorkflows` are already set** in `home/settings.json`.
  **`disableSkillShellExecution` turns this whole design off.** It is a restrictive setting, so a
  managed policy can impose it.
- **`CLAUDE_CODE_SESSION_ID` reaches the skill's shell.** Unused. A load ledger would have keyed on it.
- **A hook can rewrite a tool call.** `PreToolUse` with matcher `Skill` fires on model invocation and
  accepts `updatedInput`. The typed `/name` form bypasses it and fires `UserPromptExpansion` instead.
- **Hook-injected text is not reliably trusted.** In one run the model read a hook's `additionalContext`
  and refused it: *"This looks like a prompt injection attempt."* Text the agent fetches through a
  script has nothing to distrust.
- **A plugin's hooks run whenever the plugin is enabled.** impeccable registers `PostToolUse` on
  `Edit|Write` and `Stop`, the second with a 30-second budget on every turn. Neither collides with
  Flow's own hooks, which sit on `PreToolUse` for Bash and both sides of `Agent`. Hooks accumulate.
- **`guard.js` does not block a plugin.** impeccable runs `npx impeccable` and `node .../scripts/*`.
  The guard denies privileged commands, pipe-to-shell, permission bypass and git writes.

## Rejected

**Playbooks — a unit of Flow's own, with a generated `SKILL.md`.** Locked 2026-08-25, dropped
2026-08-26. Two files per playbook: `PLAYBOOK.md` written by hand, a 6-line `SKILL.md` written by
`link.sh` carrying only frontmatter and a loader call. It was correct against what was known that day.
5 arguments supported it. 3 tests since dissolved 4 of them:

- **Grouping** — needs 6 lines in `link.sh`, not a mechanism.
- **Compression** — install tiers do it, at zero cost.
- **A `flow-open` block cannot name a built-in skill** — true, and moot. `/start` routes and the model
  invokes the skill itself.
- **Overlays** — 1 line at the bottom of a skill.
- **The word "skill" fits badly** — still true, and cosmetic.

It also broke the duplicate check, by putting a ticket id into every render. It pointed the base
directory at a generated folder holding 1 file, which put a skill's own `refs/` out of reach.

**Committing copies of Flow's skills into a project.** See `### Committed copies were rejected`.

**A global overlay tier.** A `~/.claude/flow/overlays/` file would change a skill everywhere, and you
own the skill — that edit belongs in the skill. The project tier exists because the shared copy cannot
be edited per project, and no such argument holds globally.

**A generated `.claude/skills/.gitignore`** listing the linked names. 2 static lines do it, because git
never treats a symlink as a directory.

**Cloning Flow into `~/.claude/flow/`.** Locked in `README.md`: that folder holds Flow's output, not
Flow's source, and it is not where a repo carrying uncommitted work belongs. Nothing needs the clone at
a fixed path, because `flow` reads its own location.

**`skillOverrides` as the way to hide skills from context.** `name-only` works, and costs a name per
skill forever. Not installing costs nothing and reads the same. It survives for 1 narrow job — stopping
a plugin from self-firing.

**`skillOverrides` as a plugin off switch.** It leaves the commands and the hooks running.
`enabledPlugins` is the switch.

**A discovery line in `home/CLAUDE.md`** sending the agent to `flow skills ls <tool>`. Finding a skill
is research, and the search is mostly outward. It became a step inside `research`.

**A per-session load ledger.** A file keyed on `CLAUDE_CODE_SESSION_ID` recording every path and body
printed, so a second call prints a note. It records what the script printed, never what the context
holds. Those 2 diverge the moment compaction runs. Line ranges make it worse: `:40-120` already printed
and `:100-200` asked for is overlap arithmetic inside a script that prints files.

**A `PreToolUse` hook stripping `args` from every Flow skill.** See `## Arguments`.

**Preloading a ticket from inside a skill.** `/start` already does it, and the argument it needs is what
broke the duplicate check.

**`paths` frontmatter for a standard.** Glob patterns that load a skill when the model touches a
matching file. A standard is loaded long before the first edit, and its phase already names the moment.
It stays on the backlog for `stack/`, where the file you opened really is the trigger, and where it
costs nothing until it matches.

**A pointer `SKILL.md` telling the agent to run a loader.** 2 steps: read the file, run the command.

**One `/playbook <name>` command for all of them.** The menu shows 1 row, and the name after it is free
text with no completion, no filtering and no descriptions.

**One command file per skill.** Keeps the menu, loses the model.

**Our own autocomplete.** No API exists.

**Overlays injected by a hook.** 2 hooks for 2 invocation routes, and the model may refuse the text.

**A `SessionStart` index of skill names.** Dead — a description already does it.

**Verb-first skill names.** Never a real rule. The goal was short names, and a `stack/` skill is named
for what it touches. A skill's name is short and says what it is for.

## Still open

- **Whether an install command replaces `link.sh`.** The restructure landed 2026-08-28 and fixed
  every path, so `home/skills` sits beside `home/CLAUDE.md` and no longer moves. The management skill is
  what would take `link.sh` over, and it is unbuilt. **talk first**
- **The 10 description strings.** Written during the build, and tested by handing a fresh session the
  situation and watching whether it reaches for the skill.
- **Whether a plugin skill beats a Flow skill of the same name.** Untested. 1 run when a plugin goes in.
- **How a design plugin gets used.** What fires it, whether design work is its own phase, what happens
  when 2 of them disagree, the boundary with `visualize`, and what comes back into Flow afterwards.
  **Decided after the first real run in a project, never before.** Not essential — Flow works without
  one. **talk first**
