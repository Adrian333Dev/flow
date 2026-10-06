# Flow, working on the repo

## Project

Flow is a Claude Code workflow for a solo developer: global rules (`home/`), skills (`skills/`), the `flow` command and its hooks (`scripts/`), a project scaffold (`project-template/`) and the docs (`docs/`). Plain Node and bash with no dependencies, plus 3 submodules under `lab/`. This checkout is the dev copy. Not yet released.

## Layout

- `docs/spec/`: what Flow does and how it is built. `product.md` says it whole and indexes one file per part. `docs/dev/layout.md` maps the tree.
- `.flow/tickets/`: open work, the beta checklist included. `.flow/research/`: the research behind the design.
- `lab/`: the maintainers' workspace, holding the 3 submodules and `lab/scripts/`, which serve this repo alone.
- `~/.flow/wiki/claude-code/downloads/`: Claude Code's documentation on disk. Its `llms.txt` indexes every page Anthropic publishes, and `WebFetch` reaches the rest.
- `.agents/` holds the one real copy of the rules and skills, `.claude/` what Claude Code reads, `.flow/` what Flow owns. `docs/reference/files.md` lists every path.
- `npm test` inside `scripts/` runs Flow's suite, and `lab/util/` has its own. `docs/dev/trying-changes.md` has both procedures.

## Rules

- **`read-the-spec-first`** Read `docs/spec/product.md` and the spec file of the part you touch before changing skills installation, the scripts or the docs tree.
- **`drain-workflow-notes`** Before choosing the next work, read `~/.flow/workflow-notes.md` and the current month of `~/.flow/logs/failures/`. File each note as a ticket through `flow new`, or join it to the ticket it repeats, then delete the note. A failure worth fixing gets a ticket the same way, and the log stays untouched.
- **`check-claude-code-updates`** When asked, run `bash lab/scripts/claude-code-changes.sh` and read each release against Flow. Write what touches Flow into `.flow/research/claude-code-updates.md`, give each needed change a ticket, then set line 1 to the newest release read. Where Flow comes to rely on a newer release, raise `MIN_CLAUDE` in `scripts/lib/machine/prereq.js` and the README's Install line. Download again any page in `~/.flow/wiki/claude-code/downloads/pages/` whose topic a release changed.
- **`design-rules-can-be-overturned`** Paths, types, file shapes, what a skill owns: a better idea wins. Say what the rule protected, whether that still holds, and recommend. The conduct rules, git, installing, deletes and forks hold regardless.
- **`no-commit-no-push`** Never run `git commit` or `git push`, here or in a submodule, unless the user asks. Every other git command is fine, but never discard the user's uncommitted work.
- **`deletes-need-confirmation`** A delete needs its own confirmation, even inside an approved plan. Moving is not deleting. Pre-approved: something this session superseded, cleanup of what a change left behind, and your own scratch in `tmp/`.
- **`design-in-conversation`** Design this workflow in plain conversation. Never invoke a brainstorming skill for it.
- **`no-fork-subagent`** Never use a fork, the subagent that starts with a copy of the whole conversation. Never propose one, never write one into a skill.
- **`no-commit-step`** Flow never commits a project's code, and no skill, rule or hook tells the agent to. The user commits when they judge the work done. A missing commit step is never a fault: never raise one.
- **`scratch-in-tmp`** Scratch files go in `tmp/`, gitignored. Never `/tmp`, never the repo root. Delete what your work put there in the same turn, once its result is written down. `computers/`, `try/` and `tests/` belong to tools and stay.
- **`tracked-never-means-git`** "Tracked" means the agent maintains the file as the work moves. A handoff is untracked: read once, left alone, rewritten whole next time. Handoff files are committed like everything else.
- **`write-locked-decisions`** Write a decision the user confirmed with no open threads into its record, batched.
  - **`write-dropped-proposals`** A proposal dropped, whoever dropped it, goes into the ticket or the spec file it belongs to, with why, in the same turn.
- **`approval-exceptions`** Writing down a decision already locked, and scratch files in `tmp/`, need no approval.
- **`one-sentence-where-one-works`** Skill content can be detailed. A trigger or routing line in a rule file cannot.
- **`short-beats-the-checks`** Never let a check under `### Before sending` stretch a reply past what its topic is worth. Define a term in a clause, and restate only what the user needs to decide.
- **`never-rule-against-uninstructed`** Never rule against a behavior nothing in Flow instructs.
- **`skills-docs-move-together`** `docs/dev/skills.md` and `skills/tools/file-findings/references/write-skills.md` say the same rules. Edit both in the same pass.
- **`phases-closed-at-4`** `groundwork`, `execute`, `prototype` and `debug`. Set by the user and not reopenable.
- **`no-code-review-skill`** Review runs in the same session, never a subagent. The criteria live beside the skill that produced the artifact: `skills/phases/execute/references/review-code.md` for code.
- **`short-skill-no-arguments`** A skill invoked over and over stays short. The 4 phase skills and `/flow:handoff` take no argument, since a ticket arrives through its own skill. A long skill takes one only where it names what the skill opens. Binds Flow's own skills only.
- **`file-findings-density`** `skills/tools/file-findings` is the density to aim for.
- **`plain-words-in-skills`** Plain, common words, with no invented or rare terms. Binds what a skill produces as hard as what it says.
- **`no-versions-no-manifest`** `flow install` records no version number and no list of what installed.
- **`skill-edits-are-live`** A skill edit reaches a session at once, through the symlink. Adding, renaming or removing a skill needs `flow install`.
- **`prefix-comes-from-the-manifest`** Every skill is typed `/flow:<name>`, and no folder, path or frontmatter `name` in this repo carries the prefix. `skills/.claude-plugin/plugin.json` names the set. A command in `claude/commands/` sits outside the plugin, so it is typed bare: `/capture`.
- **`never-symlink-a-folder`** Never symlink `~/.claude/skills/`, `agents/`, `rules/` or `commands/` as a whole folder. `flow install` links per item, and refuses to replace anything not already a symlink. The plugin folder `flow/` is the one folder link.
- **`scripts-keep-their-extension`** `flow.js` on disk, `flow` to type: the symlink drops the extension.
- **`one-source-two-ways`** Every shipped script lives once, in `scripts/`. `lab/scripts/` holds the ones that serve this repo alone. Never copy a file.
- **`path-commands-are-bare`** `flow next`, `util fs tree docs`. Everything else as `~/.flow/scripts/<file.ext>`.
- **`bash-or-node-by-job`** Bash where the script wraps another command. Node where there is real logic.
- **`type-never-kind`** A field saying what sort of thing a record is gets called `type`.
- **`no-skill-under-lab`** Flow's own skills live in `skills/`. A skill from another repository lives in that repository. Never let a `lab/` path leak into a skill, `home/` or `project-template/`.
- **`read-repos-with-cat`** `repos/` holds other people's clones. Read them with `cat`, never `Read`, and never edit them.
- **`home-files-exist-twice`** `home/AGENTS.md` is the public template, and `~/.agents/AGENTS.md` is the personalized copy. Never write personal content into this repo. Carry a rule worth shipping across by hand.
- **`placeholder-comments-are-deleted`** A placeholder comment goes the first time its section is filled in.
- **`no-status-in-agents-md`** No counts, no dates and no build status here. What Flow does goes in `docs/spec/`, open work in tickets.
