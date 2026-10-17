# Flow, working on the repo

## Project

Flow is a Claude Code workflow for a solo developer: global rules (`home/`), skills (`skills/`), the `flow` command and its hooks (`scripts/`), a project scaffold (`project-template/`) and the docs (`docs/`). Plain Node and bash with no dependencies, plus 1 submodule under `lab/`. This checkout is the dev copy.

## Layout

- `docs/spec/`: what Flow does and how it is built. `product.md` says it whole and indexes one file per part.
- `.flow/tickets/`: open work, the beta checklist included. `.flow/research/`: the research behind the design.
- `lab/`: the maintainers' workspace, holding the `lab/util` submodule, `lab/scripts/` (serving this repo alone) and `lab/archive/`.
- `~/.flow/wiki/claude-code/downloads/`: Claude Code's documentation on disk. Its `llms.txt` indexes every page Anthropic publishes, and `WebFetch` reaches the rest.
- `.claude/` holds what Claude Code reads here, `.flow/` what Flow owns. `docs/reference/files.md` lists every path.
- `npm test` inside `scripts/` runs Flow's suite, and `lab/util/` has its own.

## Rules

- **`design-lives-in-the-map`** Cite `fw-16`'s map before the spec, whenever you answer or decide anything about the redesign. The spec lags the redesign until its build lands.
- **`work-by-the-loaded-design`** Until the migration starts, the loaded skills, rules and `flow` (the old design) say how to work: handoff, capture, review, status moves. Never follow the dev copies in `skills/`, `scripts/` or `home/`, and never run `flow note`. Name which design a claim comes from.
- **`read-the-spec-first`** Read `docs/spec/product.md` and the spec file of the part you touch, before changing skills, installation, the scripts or the docs tree.
- **`never-suggest-upkeep`** Never offer `/flow:upkeep`, and never count the closed tickets waiting for it. End with the next ticket instead: the user runs it when they choose, and each reminder costs them a line to skip.
- **`check-claude-code-updates`** When asked, run `bash lab/scripts/claude-code-changes.sh` and read each release against Flow. Write what touches Flow into `.flow/research/claude-code/releases-read-against-flow.md`, give each needed change a ticket, then set line 1 to the newest release read. Where Flow comes to rely on a newer release, raise `MIN_CLAUDE` in `scripts/lib/machine/prereq.js` and the README's Install line. Download again any page in `~/.flow/wiki/claude-code/downloads/pages/` whose topic a release changed.
- **`retired-stays-retired`** Never cite a mechanism the user retired (the `open` block, `flow get --files`) as current, in a plan, a proposal or an explanation. A skill, a doc or a script still holding one is stale, never evidence it lives.
- **`design-rules-can-be-overturned`** Paths, types, file shapes, what a skill owns: a better idea wins. Say what the rule protected, whether that still holds, and recommend. The conduct rules, git, installing and deletes hold regardless.
- **`no-commit-no-push`** Never run `git commit` or `git push`, here or in a submodule, unless the user asks. Every other git command is fine, but never discard the user's uncommitted work. Flow has no commit step, so a missing one is never a fault: never raise one.
- **`deletes-need-confirmation`** A delete needs its own confirmation, even inside an approved plan. Moving is not deleting. Pre-approved: something this session superseded, cleanup of what a change left behind, your own scratch in `tmp/`, and a ticket drop, repoint or merge.
- **`dev-copies-only`** Every edit here lands in the repo's copies: `home/`, `project-template/`, skills, scripts, tickets. Never mention, ask about or caveat the live files (`~/.flow/CLAUDE.md`, `~/.claude/settings.json`) or what waits for release day: the user knows none is touched, and ruled this after repeated reminders.
- **`scratch-in-tmp`** Scratch files go in `tmp/`, gitignored. Never `/tmp`, never the repo root. Delete what your work put there in the same turn, once its result is written down. A drawing or mockup is design output, not scratch: keep it in `.flow/research/<topic>/`. `tests/` belongs to the test suite and stays.
- **`tracked-never-means-git`** "Tracked" means the agent maintains the file as the work moves. A handoff file in `.flow/handoffs/` is untracked: read once, and the mod deletes it after one clean turn. A ticket's `## State` is tracked until review deletes it.
- **`write-locked-decisions`** Write a decision the user confirmed with no open threads into its record, batched, with no approval asked. A proposal dropped, whoever dropped it, goes into the ticket or the spec file it belongs to, with why, in the same turn.
- **`decisions-stated-whole`** Write each decision for approval as its own block: what happens today, with a real example from the code; what changes; why; what it costs; what would overturn it. Explain every mechanism in plain words before naming it. A decision squeezed into a clause the user cannot picture gets approved unread or stalls the work.
  - **`short-beats-the-checks`** Never let a check under `### Before sending` stretch any other part of a reply past what its topic is worth. Define a term in a clause, and restate only what the user needs to decide.
- **`never-rule-against-uninstructed`** Never rule against a behavior nothing in Flow instructs.
- **`phases-closed-at-4`** `groundwork`, `execute`, `prototype` and `debug`. Set by the user and not reopenable.
- **`no-code-review-skill`** Review runs in the same session, never a subagent. The criteria live in `references/`: `review-code.md` for code, `write-spec.md` for the spec.
- **`short-skill-no-arguments`** A skill invoked over and over stays short. The 4 phase skills and `/flow:handoff` take no argument, since a ticket arrives through its own skill. A long skill takes one only where it names what the skill opens. Binds Flow's own skills only.
- **`upkeep-density`** `skills/tools/upkeep` is the density to aim for.
- **`plain-words-in-skills`** Plain, common words, with no invented or rare terms. Binds what a skill produces as hard as what it says.
- **`no-versions-no-manifest`** `flow install` records no version number and no list of what installed.
- **`skill-edits-are-live`** A skill edit reaches a session at once, through the symlink. Adding, renaming or removing a skill needs `flow install`.
- **`prefix-comes-from-the-manifest`** Every skill is typed `/flow:<name>`, and no folder, path or frontmatter `name` in this repo carries the prefix. `skills/.claude-plugin/plugin.json` names the set.
- **`never-symlink-a-folder`** Never symlink `~/.claude/skills/`, `agents/`, `rules/` or `commands/` as a whole folder. `flow install` links per item, and refuses to replace anything not already a symlink. The plugin folder `flow/` is the one folder link.
- **`one-source-two-ways`** Every shipped script lives once, in `scripts/`. `lab/scripts/` holds the ones that serve this repo alone. Never copy a file, and never let a `lab/` path leak into a skill, `home/` or `project-template/`.
- **`path-commands-are-bare`** `flow next`, `util fs tree docs`. Everything else as `~/.flow/scripts/<file.ext>`. A script is `flow.js` on disk and `flow` to type, since the symlink drops the extension.
- **`bash-or-node-by-job`** Bash where the script wraps another command. Node where there is real logic.
- **`read-repos-with-cat`** `repos/` holds other people's clones. Read them with `cat`, never `Read`, and never edit them.
- **`home-files-exist-twice`** `home/CLAUDE.md` and `home/profile.md` are the public templates, and `~/.flow/CLAUDE.md` and `~/.flow/profile.md` are the personalized copies. Never write personal content into this repo. Carry a rule worth shipping across by hand.
- **`no-status-in-claude-md`** No counts, no dates and no build status here. What Flow does goes in `docs/spec/`, open work in tickets.
