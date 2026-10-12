# Flow: what the agent knows beyond its rules

Everything an agent draws on past Flow's rules and its own training: skills, plugins, MCP servers, the wiki, findings. How each piece arrives, updates, and grows.

## The pieces

- **Flow's skills**: `/flow:<name>`, always on, from the Flow clone. The 2 in `dev/`, `/flow:review` and `/flow:apply-domain-findings`, are off until `flow skills on <name> --global`.
- **A skill repository, or source**: a repository of skill folders, cloned whole into `~/.flow/repos/sources/<owner>_<repo>/` and listed under `sources` in `~/.flow/settings.json`. [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) is the user's own and the first. Every other is someone else's.
- **Private skills**: `~/.flow/private-skills/<name>/`, the user's, not yet published.
- **A plugin**: a bundle from a Claude Code marketplace: skills, often hooks, commands and an MCP server. Claude Code installs and updates it.
- **An MCP server**: a running program that hands the agent extra tools. Configured per project in `.mcp.json`.
- **The wiki**: `~/.flow/wiki/<subject>/`, one folder per outside tool or field, every project's: `index.md`, topic pages edited in place, downloads. `/flow:research`'s own `references/wiki.md` holds its layout. Never loads by itself: the rule file's `## Reading` sends work there.
- **Findings**: `.flow/findings/`, one file per lesson from a project. A lesson about an outside tool or field goes to its wiki page instead.
- **An overlay**: `.flow/overlays/<skill>.md`, a project's additions to any skill, handed over as it loads. No plugin prefix in the name.

## Everything starts on for one project

- **A skill** → `flow skills on`, with no flag, switches it on for this project. Add `--global` once a second project needs it.
- **A plugin** → off everywhere, switched on in the project's `.claude/settings.json`: `claude plugin enable <id> --scope project`.
- **An MCP server** → the project's `.mcp.json`. Never for the whole machine.

## Reach a service through a command

Take the first that works:

1. **The vendor's command-line tool**, such as `gh` or `supabase`, with a skill teaching the parts the work needs.
2. **A small script over the service's web API**, bundled inside that service's skill in `domain-skills`. Flow's own `scripts/` holds only what Flow runs, such as `context7.sh`. Only for a service used across projects.
3. **The MCP server**, for that project. Also the answer for a service that needs a live session no command holds, such as a browser.

## An outside skill: review it, then pick one of 2 states

Found by `/flow:research`, or already on the machine when setup runs. Never switch one on unread.

**The review**, on its `SKILL.md` and whatever it points to:

- **Knowledge or process.** A skill with its own work order, such as "Analyze, Design, Implement, Verify", competes with `/flow:execute`.
- **What the agent gets wrong without it.** Only that part earns context. General engineering the agent already knows does not.
- **Where the user would disagree.** Each disagreement is a line to rewrite or drop.
- **The description.** `~/.flow/references/style.md` → `## 8. Frontmatter descriptions` holds the bar.

Install counts and stars only pick which 3 to read.

**The 2 states:**

- **Used whole**, the default: runs as its publisher wrote it and updates by itself. A disagreement with it:
  - **true in one project** → an overlay, `.flow/overlays/<name>.md`, in the project
  - **true in every project** → suggest a harvest
- **Harvested**: never switched on. Its facts are read into wiki pages, an expertise skill's into a field folder. Suggest it only where the review finds lines the user would rewrite in every project, or the skill is mostly facts the wiki covers. Run it on a yes, by `/flow:research` → `## Harvest`.

**Never suggest harvesting a skill from the tool's own makers.**

**How each arrives:**

- **A standalone skill used whole** → `flow skills add <owner/repo>`, then `flow skills on <name>`: cloned, switched on here.
- **A standalone skill to harvest** → `flow skills add <owner/repo>` alone: cloned, nothing switched on.
- **A plugin** → Claude Code's `/plugin install`, then on for this project only. A plugin is used whole or not at all.

**Updates:**

- **A skill repository** → the background job pulls every clone at most every 6 hours, fast-forward only. A skill used whole is current after the pull.
- **A plugin** → Claude Code's own plugin update. Flow never touches one.
- **A harvested skill** → its pages never follow it. Research reviews it again once it changes past the commit its `## Skills` line names.

## What the user builds up

Where a finding goes first is `~/.flow/CLAUDE.md` → `## Capture`. From there:

- **A lesson about an outside tool or field** → its wiki page, edited in place.
- **A project finding** → `.flow/findings/` → `/flow:file-findings` (user only) turns it into a skill, a rule or a check.
- **A change to a skill in `domain-skills`** → waits in `.flow/findings/<skill>/` until Flow's sharing command opens a pull request → `/flow:apply-domain-findings` (user only) writes it in.
- **A new skill** → `~/.flow/private-skills/<name>/`, published by copying it into `domain-skills`.

**A wiki page holds what the agent gets wrong without it:** changes since its training, traps the docs never warn about, the user's choices. The tool's docs stay in `downloads/`, per version. A tool the agent has never seen gets a page on how the tool thinks, and `index.md` says where its docs are.

**A harvested skill's `## Skills` line names its commit.**
