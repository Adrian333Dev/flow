# Flow: what the agent knows beyond its rules

Everything an agent draws on past Flow's rules and its own training: skills, plugins, MCP servers, the wiki, findings. How each piece arrives, updates and grows, and how a skill is written.

## The pieces

- **Flow's skills**: `/flow:<name>`, always on, from the Flow clone.
- **A skill repository**: someone else's repository of skill folders, cloned by hand. Its skills are linked one at a time into a skills folder of Claude Code's.
- **Personal skills**: `~/.claude/skills/<name>/` for every project, `<project>/.claude/skills/<name>/` for one. Claude Code loads them, and Flow neither links nor switches them.
- **A plugin**: a bundle from a Claude Code marketplace: skills, often hooks, commands and an MCP server. Claude Code installs and updates it.
- **An MCP server**: a running program that hands the agent extra tools. Configured per project in `.mcp.json`.
- **The wiki**: `~/.flow/wiki/<subject>/`, one folder per outside tool or field, every project's. `guides/wiki.md` holds its layout.
- **An overlay**: `~/.flow/skill-overlays/<skill>.md`, the user's additions to any skill, handed over in every project as it loads. No plugin prefix in the name.

## Everything starts on for one project

- **A skill** → `<project>/.claude/skills/<name>/`. Move it to `~/.claude/skills/` once the same steps serve a second project.
- **A plugin** → off everywhere, switched on in the project's `.claude/settings.json`: `claude plugin enable <id> --scope project`.
- **An MCP server** → the project's `.mcp.json`. Never for the whole machine.

## Reach a service through a command

Take the first that works:

1. **The vendor's command-line tool**, such as `gh` or `supabase`, with a skill teaching the parts the work needs.
2. **A small script over the service's web API**, bundled inside that service's skill. Flow's own `scripts/` holds only what Flow runs, such as `context7.sh`. Only for a service used across projects.
3. **The MCP server**, for that project. Also the answer for a service that needs a live session no command holds, such as a browser.

## An outside skill: review it, then pick one of 2 states

Found by `/flow:research`, or already on the machine when setup runs. Never switch one on unread.

**The review**, on its `SKILL.md` and whatever it points to:

- **Knowledge or process.** A skill with its own work order, such as "Analyze, Design, Implement, Verify", competes with `/flow:execute`.
- **What the agent gets wrong without it.** Only that part earns context. General engineering the agent already knows does not.
- **Where the user would disagree.** Each disagreement is a line to rewrite or drop.
- **The description.** `~/.flow/guides/write-loaded-files.md` → `## 6. Frontmatter descriptions` holds the bar.

Install counts and stars only pick which 3 to read.

**The 2 states:**

- **Used whole**, the default: runs as its publisher wrote it and updates by itself. A disagreement with it → an overlay, `~/.flow/skill-overlays/<name>.md`:
  - **Additions only**: short imperative lines, one fact each, never restating the skill.
  - **Never edit the skill's clone**: the next pull overwrites it.
  - **A fact true for one project** → that project's `CLAUDE.md`, never an overlay.
- **Harvested**: never switched on. Its facts are read into wiki pages, an expertise skill's into a field folder. Suggest it only where an overlay would rewrite most of the skill, or the skill is mostly facts the wiki covers. Run it on a yes, by `/flow:research` → `## Harvest`.

**Never suggest harvesting a skill from the tool's own makers.**

**How each arrives:**

- **A standalone skill used whole** → `git clone` it, then link its folder into `<project>/.claude/skills/`: used in this project.
- **A standalone skill to harvest** → read it from a throwaway clone in `tmp/`: nothing switched on.
- **A plugin** → Claude Code's `/plugin install`, then on for this project only. A plugin is used whole or not at all.

**Updates:**

- **A skill repository** → `git pull` in its clone. A skill used whole is current after the pull.
- **A plugin** → Claude Code's own plugin update. Flow never touches one.
- **A harvested skill** → its pages never follow it. Research reviews it again once it changes past the commit its `## Skills` line names.

**A wiki page holds what the agent gets wrong without it:** changes since its training, traps the docs never warn about, the user's choices. The tool's docs stay in `downloads/`, per version. A tool the agent has never seen gets a page on how the tool thinks, and `index.md` says where its docs are. **A harvested skill's `## Skills` line names its commit.**

## Writing a skill

Write it by `style.md` and `write-loaded-files.md`. They hold the style, the `description` included.

### Before writing one

- **One job, sayable in a sentence.** 2 sentences means 2 skills.
- **Nothing already covers it.** Something close → extend that skill.
- **Aim for the density of `skills/knowledge/upkeep`.**

### Flow's own skills

**Flow's own skills live once, in the Flow clone**, inside the group folder that files it. Only Flow's own workflow gets one.

- **`phases/`**: what you are doing, one at a time. Closed to new skills.
- **`tools/`**: what you reach for around the work. It starts, produces something, finishes.

**Every Flow skill installs on every machine**, so a skill is typeable the moment its folder exists. Adding, renaming or removing one needs `flow install`.

**Every Flow skill is shown in every session, and nothing switches it off.** A Flow skill has no switch for one project: `skillOverrides`, the settings key that hides a skill, skips a plugin's skills.

**Name the folder bare and write the same bare word as `name` in the frontmatter.** A folder called `groundwork` holding `name: groundwork` is typed `/flow:groundwork`. Never write the prefix into either one. The `flow:` comes from `.claude-plugin/plugin.json` beside the skills, holding `"name": "flow"`.

### Shape

**`SKILL.md` is the only file at a skill's root.** Add another only with a reason, and give it a folder:

- **`references/`**: markdown read on some runs and not others. Split by how often a part is read, never by length.
- **`scripts/`**: runnable code the agent would otherwise rewrite per run.
- **A `` !` `` line in `SKILL.md`**: a shell command Claude Code runs as the skill loads, its output pasted in. Run one named command or script there, never a pattern test and a chain of `&&`.
- **`knowledge/`**: accumulated facts, one file per topic. Let the layout emerge; never design it up front.

One file until one file stops working.

**A Flow skill that learns as it works owns a wiki folder**, never a `knowledge/` folder, since the agent never writes Flow's files. Link it in the frontmatter, `metadata: { wiki: { audit: load } }`, one key per folder:

- **`load`**: the folder's `index.md` arrives with the skill. For a folder most runs need.
- **`name`**: one line naming the folder. For a folder only some runs need.

**Put the learning line at the step where it learns**, naming what the folder takes: "A query or an approach that worked, and would serve another audit → a finding in `~/.flow/wiki/audit/findings/`, filed now."

**Plain, common words, no invented or rare terms**, in what a skill says and in what it produces.

**A command on the `PATH` is written bare**: `flow next`, `util fs tree docs`. Every other script is `~/.flow/scripts/<file.ext>`. A script is `flow.ts` on disk and `flow` to type, since the symlink drops the extension.

### Knowledge files

**A knowledge file holds what is true for anyone.** Anything true only because of one project belongs in that project's `docs/context/`: a class name from your own UI, a decision your app made, a path in another repo.

Date every entry and cite what proved it.

**Once a tactic appears in 2 files, promote it** into the shared file both then point at. Prune on the same pass any line the agent would follow by default.

### Frontmatter

```yaml
name: <short, lowercase and hyphens, the same word as the folder, never a prefix>
description: <what it is and what it covers>
argument-hint: <what to type after the name>    # only where it takes one
disable-model-invocation: true                  # user-only skills
```

**A description says what the skill is and what it covers. It says nothing about when to invoke it.**

**Write a trigger only where one is wanted**, in exactly 1 of these:

- **`~/.flow/CLAUDE.md`**: the few that must fire with nothing else loaded
- **A phase's body**, where that phase is what needs it. A comment standard is named by `/flow:execute`
- **A phase's overlay**, `~/.flow/skill-overlays/<phase>.md`, where the user wants it in every project. `~/.flow/CLAUDE.md` would load it into every session
- **The project's `CLAUDE.md`**, where it is project-wide and belongs to no phase

**A new skill is user-only (`disable-model-invocation: true`) unless the agent has to start it itself.** A user-only skill costs nothing until it is typed. An agent-reachable skill puts its description in every session.

**`disable-model-invocation: true` takes the skill out of the list a session is handed.** The user still finds it in the `/` menu. Name it in a file the model reads, or the model reports it missing when the user asks for it by name. Write the line only where the user typing it is the whole point, and where never firing is true in every project. Mark the skill `(user only)` once, where the model reads it before any bare mention.

**A skill invoked over and over stays short, and a long skill takes an argument only where the argument names what the skill opens.** Claude Code appends the whole body again on every run whose render differs, through an argument or a shell line's output. A long skill takes an argument only where what it loads is worth more than its body, such as a ticket and its files, and its bare run renders the same text every time.

### Reshaping one

- the same thing written twice → one shared file, both point at it
- a rarely-read reference crowding `SKILL.md` → move it to `references/`
- 2 jobs in one skill → split it
- grown by accretion → rewrite it, never patch it

**Deleting a skill is the user's call.** Discuss it, never unprompted.
