# Flow: what the agent knows beyond its rules

The map of everything an agent draws on past Flow's rules and its own training: skills, plugins, MCP servers, the wiki, findings. How each piece arrives, updates, and grows. The procedure inside a step belongs to the file that owns it, named where the step appears.

## The pieces

- **Flow's skills**: `/flow:<name>`, always on, from the Flow clone. The 2 in `dev/`, `/flow:review` and `/flow:apply-domain-findings`, are off until `flow skills on <name> --machine`.
- **A skill repository, or source**: a repository of skill folders, cloned whole into `~/.flow/repos/sources/<owner>_<repo>/` and listed under `sources` in `~/.flow/settings.json`. [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) is the user's own and the first. Every other is someone else's.
- **Private skills**: `~/.flow/private-skills/<name>/`, the user's, not yet published.
- **A plugin**: a bundle from a Claude Code marketplace: skills, often hooks, commands and an MCP server. Claude Code installs and updates it.
- **An MCP server**: a running program that hands the agent extra tools. Configured per project in `.mcp.json`.
- **The wiki**: `~/.flow/wiki/<tool>/`, one folder per outside tool, every project's: docs shortcuts, research reports, findings, downloads. `/flow:research`'s own `references/wiki.md` holds its layout. Never loads by itself: `/flow:research` opens it.
- **Findings**: one file per thing learned. About an outside tool → the wiki. Anything else → the project's `.flow/findings/`.
- **An overlay**: `.flow/overlays/<skill>.md`, a project's additions to any skill, handed over as it loads. No plugin prefix in the name.

## Everything starts on for one project

- **A skill** → `flow skills add` and `flow skills on`, with no flag, switch it on for this project. Add `--machine` once a second project needs it.
- **A plugin** → off everywhere, switched on in the project's `.claude/settings.local.json` by whoever works there.
- **An MCP server** → the project's `.mcp.json`. Never for the whole machine.

## Reach a service through a command

A command's output is cut in the shell, `| jq '.name'` or `| head`, before it reaches context. An MCP tool puts its whole answer there. Take the first that works:

1. **The vendor's command-line tool**, such as `gh` or `supabase`, with a skill teaching the parts the work needs.
2. **A small script over the service's web API**, bundled inside that service's skill in `domain-skills`. Flow's own `scripts/` holds only what Flow runs, such as `context7.sh`. Worth it for a service used across projects: the script breaks when the API changes.
3. **The MCP server**, for that project. Also the answer for a service that needs a live session no command holds, such as a browser.

## An outside skill: review it, then pick one of 2 states

Found by `/flow:research`, or already on the machine when setup runs. Never switch one on unread.

**The review**, on its `SKILL.md` and whatever it points to:

- **Knowledge or process.** A skill with its own work order, such as "Analyze, Design, Implement, Verify", competes with `/flow:execute`, and nothing decides between them.
- **What the agent gets wrong without it.** Only that part earns context. General engineering the agent already knows does not.
- **Where the user would disagree.** Each disagreement is a line to rewrite or drop.
- **The description.** A long one costs context in every session the skill is on for. `~/.flow/references/style.md` → `## 8. Frontmatter descriptions` holds the bar.

Install counts and stars only pick which 3 to read. Neither says which fits.

**The 2 states:**

- **Used whole**: runs as its publisher wrote it and updates by itself. A disagreement goes where `## Adding to a skill the user does not own` says. Take it for a skill from the tool's own makers, which changes with each release, once the review finds nothing structural against it.
- **Harvested**: never switched on. The harvest reads it, with the tool's findings and any other skill on the subject, and writes the user's own skill. One general skill per tool runs, and it is the user's.

**Used whole is the default until `/flow:write-skill` ships.** Harvested becomes the default then. A skill harvested before that waits switched off for a harvest the user runs by hand.

**The harvest** is `/flow:write-skill` (user only), not built yet. Until then, run it by hand when the user asks, by `~/.agents/skills/flow/skills/file-findings/references/write-skills.md`. It ends with `flow skills drop <owner/repo>` per input, unless a skill there is used whole.

**How each arrives:**

- **A standalone skill used whole** → `flow skills add <owner/repo> <name>`: cloned, switched on here.
- **A standalone skill to harvest** → `flow skills add <owner/repo>`, no name: cloned, nothing switched on.
- **A plugin** → Claude Code's `/plugin install`, then on for this project only. A plugin is used whole or not at all.

**Updates:**

- **A skill repository** → the background job pulls every clone at most every 6 hours, fast-forward only. A skill used whole is current after the pull.
- **A plugin** → Claude Code's own plugin update. Flow never touches one.
- **A harvested skill** → never follows its inputs. A new harvest starts from fresh research.

## What the user builds up

Where a finding goes first is `~/.agents/AGENTS.md` → `## Capture`. From there:

- **A finding about an outside tool** → waits in `~/.flow/wiki/<tool>/findings/` → the harvest writes it into the tool's skill and deletes it.
- **A project finding** → `.flow/findings/` → `/flow:file-findings` (user only) turns it into a skill, a rule or a check.
- **A change to a skill in `domain-skills`** → waits in `.flow/findings/<skill>/` until Flow's sharing command opens a pull request → `/flow:apply-domain-findings` (user only) writes it in.
- **A new skill** → `~/.flow/private-skills/<name>/`, published by copying it into `domain-skills`.

**A tool's skill holds what the agent gets wrong without it:** changes since its training, traps the docs never warn about, the user's choices. The tool's docs stay in the wiki, downloaded per version. For a tool the agent has never seen, the skill adds how the tool thinks, in a page, and where its docs are.

**A harvest writes in its own words.** Facts about a tool belong to nobody. A passage or an example copied word for word keeps its license notice. A skill with no license is never copied from. The skill's folder names each input: its repository, path and commit.

## Adding to a skill the user does not own

- **A disagreement in one project** → an overlay, `.flow/overlays/<name>.md`, in the project.
- **A disagreement true in every project** → harvest the skill instead.
