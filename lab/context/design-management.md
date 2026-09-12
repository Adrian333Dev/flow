# The management skill

**Nothing in this file is approved.** Opened 2026-09-11, continued 2026-09-12, in conversation, and
still open. The user said explicitly that no design here has their yes yet. `backlog.md` → `## Next` carries the item, and
`threads.md` → `## install: one skill instead of two` carries the history that produced it. The shared
corpus of domain skills, its private folder and the fold started here and moved to
`design-domain-skills.md` on 2026-09-12, where every decision stood unopposed.

**What it is.** One skill owning Flow's whole life on a machine: install, verify, update, re-install,
and every migration after that. Scoped by the user 2026-09-08: install, verify and re-install across
their 2 machines are v1, and converting a project that already has its own workflow waits for such a
project to exist.

## What already exists, so the skill never rebuilds it

- **`flow install`** links everything per item into `~/.claude/`, `~/.flow/` and `~/.local/bin/`,
  reads the skill list off the tree, and is idempotent. It refuses to touch `settings.json` and
  prints the file to merge instead.
- **`flow doctor`** makes every check a function can make: the names resolve, the 3 `util` commands
  run, `~/.claude/` is linked with its `CLAUDE.md` present, the hooks in `settings.json` are
  registered with every script on disk, `~/.flow/` resolves into this clone, both suites pass. It
  returns an exit code. Its own header says the management skill runs it first, then walks what no
  function can reach.
- **The 2 checkouts**, ruled and written up at `docs/dev/checkout.md`. Stable is `~/code/flow`, which
  every symlink points at and which real projects run. Dev is `~/code/flow-dev`, a `git worktree` on
  a branch that nothing points at. Shipping is `git pull` in stable. `flow install` is re-run only
  when a skill was added, renamed or removed.
- **Project overlays**, at `scripts/flow/commands/overlays.js`. A project writes
  `.flow/overlays/<name>.md` and the skill prints it from a shell line at the bottom of its body.
- **`/file-findings`**, which writes `.flow/findings/<subject>.md` during real work and promotes a
  finding into a skill or a rule later.

## Faults found in the code, all verified this session

- **`flow install` does nothing on a machine that already has `~/.claude/CLAUDE.md`.**
  `install.js:125` copies Flow's rule file only when none is there, and otherwise prints `kept:
  CLAUDE.md, yours, already here`. Every skill still links, so the machine looks installed while none
  of Flow's rules load. `doctor.js:248` then reports success, because it checks the file exists and
  whether it still holds template placeholders, never whose file it is. This is the exact case a real
  user arrives in. Recorded in `backlog.md`.
- **An overlay reaches a `SKILL.md` and nothing else.** The mechanism is the shell line
  ``!`flow overlays <name>` `` inside a skill body, and 10 skills carry one. A `references/` page
  under a skill has nowhere to run a command, and neither does a file in `rules/`. Recorded in
  `backlog.md`, deliberately not designed here.
- **Flow has no uninstall**, so nothing reverses an install that rearranged somebody's configuration.

## Rulings the user gave in this discussion

These are the user's positions, stated in their own messages. They are not proposals of mine.

- **Setup is a complete replacement, not a merge.** The user's existing memory system exists because
  they had no workflow like this one. Installing Flow replaces it. The sequence is: read what is
  there, harvest what is worth keeping about the user, then delete it, then put Flow's `CLAUDE.md` in
  place, then fill `## The user` and `## Preferences` from the harvest.
- **`~/.claude/CLAUDE.md` is Flow's file.** It is the live version of the `home/CLAUDE.md` template,
  not a different file and not the user's own. A proposal of mine that read "Flow never writes it"
  was wrong and was corrected.
- **Project memories are migrated on demand.** Walking every directory under `~/.claude/projects/`
  is refused: most are abandoned or unimportant. The user names a project and that one is migrated.
- **A competitor is deleted, not scoped to a project.** Anything that answers the questions Flow
  answers fights the global rules everywhere else. Scoping it to one repository is not a middle path.
- **Domain-specific things stay.** A skill, plugin or MCP server that knows a domain Flow does not
  can remain.
- **`settings.json` is analyzed key by key.** No blind merge. Most keys are expected to be replaced,
  some kept, and which is which depends on what the file holds.
- **`.codex/` and `.agents/` are not v1**, but the skill has to work for them seamlessly once
  multi-harness support lands.
- **A snapshot before install**, so a user who does not want Flow can return to the state they had.
- **Overlays are project-scoped and minimal by design.** The user refused a machine-wide overlay: the
  mechanism is for small project-specific additions and nothing else.
- **The goal for `stack/` skills is a shared corpus.** Hundreds of skills, improved continuously by
  everyone using the workflow, so thousands of people read work that thousands of people contributed.
  This is the user's stated product goal, and it is what the contribution design has to serve.

## Proposals on the table, none approved

The proposals about the shared corpus, the private folder, `flow contribute` and the fold moved to
`design-domain-skills.md` on 2026-09-12.

**P1. `~/.claude/CLAUDE.md` stays a copy, and the skill regenerates it on update.** The personal
content lives in exactly 2 named sections, so updating is a transplant with defined edges: read
`## The user` and `## Preferences` out, write the new template, put them back. The skill already has
to write that file on install day, so update is the same code path. Where the live file was edited
outside those 2 sections, it falls back to the 3-way resolution in P2.

**P2. Migration reads git, not a second clone.** The machine records the commit it installed from.
`git show <commit>:home/CLAUDE.md` is the version it was set up from and `git show HEAD:...` the
version it is moving to, so both are available from the one stable checkout. Requires a clone that is
not shallow. Where 3 documents exist (upstream at the recorded commit, upstream now, the live file),
resolution is done by an agent reading them, not by `git merge`. Git's unit is the hunk and a rule
has no half.

**P3. One global changelog, un-suspended at v1.** `CLAUDE.md` already says `CHANGELOG.md` returns at
Flow's first release, behavior only. A changelog per skill cannot say what order to apply things in,
and a migration across several skills is where order matters, so it is one file with every entry
naming what it touched. The split of duties: git says what changed inside Flow, the changelog says
what has to be done to the machine, which is the part no diff can produce. A change needing a
migration ships its migration step in the same commit. The user's counter-idea, a global changelog
plus per-skill ones pointing at each other, is unanswered.

**P4. A snapshot gates every destructive step.** Before anything is touched, copy `~/.claude/` and
`~/.flow/` whole into `~/.flow/snapshots/<timestamp>/`, with a manifest of what was found and what
the skill intends to do. Restoring puts the tree back, and that replaces the uninstall command Flow
does not have. Everything in the replacement and deletion work above destroys something, so none of
it runs before this exists.

**P5. The competitor test is instructions against domain knowledge.** Anything telling the agent how
to work goes: rule sets, workflow plugins, agent frameworks, competing skill collections. Anything
knowing a domain Flow does not stays, and gets costed, because its tool definitions load every
session. A plugin carrying both keeps its domain parts and loses its rule files, since a plugin's
parts are separate files.

**P6. Install day splits into survey and execute.** The survey produces a written plan the user
approves before anything is touched. The argument: a real machine turns up 20 plugins and 40 project
memory directories, and approving that list is a different act from approving "install Flow". This
was the open question at the end of that message and was never answered.

## Rejected, recorded so it is not proposed again

- **Moving Flow's rules out of `~/.claude/CLAUDE.md` into `~/.claude/rules/`.** Dropped by the user:
  "forget about the rules folder". Rules under `rules/` are already symlinked per file by
  `install.js:102` and checked by `doctor.js:236`, which is the behavior the user wanted confirmed.
- The per-user fork and the machine-wide overlay, both rejected here, are recorded with the pipeline in
  `design-domain-skills.md`.

## Where the thread stands, 2026-09-12

The 2 sessions of 2026-09-11 and 2026-09-12 went almost wholly to the shared corpus, which is now its own
record and its own build. What is left here is the management skill proper: install day, the 2
personalised files, verify, update. P1 to P6 are still unjudged, and the 3 questions below are still open.
The next session on this record starts from the questions, never from a re-explanation.

## Facts from the Claude Code docs, checked 2026-09-11

- **`@path` imports work in a `CLAUDE.md`.** Relative, absolute and `~`-prefixed paths, up to 4 hops
  deep, skipped inside code spans and fenced blocks. Imports in a user-scope file such as
  `~/.claude/CLAUDE.md` load without the external-import approval dialog. Splitting a file this way
  saves no context: an imported file loads at launch like inlined text.
- **Rules with no `paths` frontmatter load at launch with the same priority as `.claude/CLAUDE.md`**,
  and user-level rules load before project rules. **Nothing in the docs says what wins when a user
  line and a Flow line contradict.** That tie-break needs one live test.
- **Auto memory is on by default** and Flow turns it off in `home/settings.json`. It stores per
  repository under `~/.claude/projects/<project>/memory/`, and the first 200 lines of `MEMORY.md`
  load into every session. A real machine will carry many of these directories.
- **Plugins install at user, project or local scope**, written to `~/.claude/settings.json`,
  `.claude/settings.json` or `.claude/settings.local.json`. `claude plugin install <name>@<market>
  --scope project` is the whole of scoping one to a repository. `enabledPlugins` honors project and
  local settings.
- **Settings: scalars override by scope and permission rules merge across scopes.** Settings files
  reload without a restart.
- **Claude Code reads `CLAUDE.md` and ignores `AGENTS.md`.** A repository using `AGENTS.md` needs a
  `CLAUDE.md` importing it.
- **HTML comments in a `CLAUDE.md` are stripped before the content reaches context**, so the template
  placeholders cost nothing.

## Open questions, in the order they were asked

1. **Is install day one skill run, or a survey that produces an approved plan first?** (P6.)
2. **Do `## The user` and `## Preferences` merge into one section, or stay split with a stated line
   between them?** This is queue item 2 in `backlog.md` and the interview design depends on it.
3. **The skill's name and group.** `/manage-flow` under `dev/` was suggested and is the weakest
   recommendation on this page.

Answered elsewhere, in `design-domain-skills.md`: how a domain skill installs, which is into one project
and never through `flow install`, plus `/distill` and every name.
