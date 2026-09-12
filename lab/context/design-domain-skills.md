# Domain skills and the contribution pipeline

**Every decision here is agreed with the user as of 2026-09-13, and nothing is built.** Opened 2026-09-11
inside `design-management.md` as the shared-corpus question, split out 2026-09-12, last changed
2026-09-13. `backlog.md` → `## Next` carries the essential half in build order, and `## The skill system`
the rest.

**What it is.** A second repository of domain skills, installed into one project at a time. A folder for
your own skills. Findings that queue for a shared skill without anyone editing a shared file. And the
pass through which the maintainer folds accepted findings into a skill.

A **domain skill** holds knowledge about a subject: a framework, a library, a service, or a field such as
abuse prevention. A phase or tool skill tells the agent how to work. The pipeline exists for domain
skills only.

## What exists today

- **One clone holds every skill**, at `~/code/flow/skills/<group>/<name>/`. `flow install` puts one
  symlink per skill into `~/.claude/skills/`, the folder Claude Code reads for skills on the whole
  machine. `scripts/flow/lib/skills.js` walks the group folders and refuses 2 skills with one name.
- **`stack/` is the group for domain skills**, and holds `web-pages` alone. `home/settings.json` turns it
  off by name in `skillOverrides`.
- **An overlay** is `.flow/overlays/<name>.md` in a project. The shell line `` !`flow overlays <name>` ``
  at the bottom of a skill body pastes its text into the body when the skill loads.
- **Capture** writes reusable knowledge to `.flow/findings/<subject>.md` in the project, one file per
  subject, appended over time. `home/CLAUDE.md` → `## Capture` carries the rule.
- **`/file-findings`** reads `.flow/inbox.md`, `.flow/findings/*.md`, unfiled tickets, the groundwork map
  and the scorecard. It shows a plan, writes into skill bodies, rules, project docs and checks, and
  clears what it filed.
- **`/research`** → `## Look for one that already exists` searches outward first (the web, GitHub, the
  marketplaces), then Flow's own tree with `flow skills ls --hidden`. It ends: "Adopting one is where a
  Flow `stack/` skill starts."
- **`scripts/flow/commands/skills.js`** opens with "No `add`, `sync`, `new` or `drop`", because an
  external skill used by one project is a folder copied into `<project>/.claude/skills/<name>/` and
  committed.
- **`project-template/.gitignore`** already ignores symlinks under `.claude/skills/` and tracks real
  folders there.
- **`web-pages`** keeps its pages under `knowledge/` and per-site notes under `knowledge/domains/`.
  `write-skills.md` defines both `references/` and `knowledge/`.
- **`lab/toolbox/`** is the user's own curated list of external tooling, one file per kind of job.
  Nothing in Flow reads it.

## Facts from the Claude Code docs

Read from `code.claude.com/docs/en/skills.md` on 2026-09-12. The page is not in
`lab/research/claude-code-docs/`.

- **Claude Code watches `~/.claude/skills/` and the project's `.claude/skills/`.** A skill added, edited
  or removed there is picked up inside the running session with no restart. A skills folder that did not
  exist when the session started needs one restart.
- **Every skill that is on puts its name and description into every session.** The listing has a budget
  of 1% of the context window. Past it, descriptions are dropped, starting with the skills invoked least.
- **A skill set to `off` in `skillOverrides` costs nothing in context.** Verified by Flow against Claude
  Code 2.1.251 on 2026-08-29, in the header of `skills.js`.
- **`` !`command` `` in a body runs when the skill loads**, only where `!` starts a line or follows
  whitespace. The output is pasted in as plain text. The setting `disableSkillShellExecution` replaces it
  with `[shell command execution disabled by policy]`.
- **The same name in `~/.claude/skills/` and a project's `.claude/skills/`**: the personal one runs.

## The machine after the change

```
FOLDERS THAT HOLD SKILL FILES

~/code/flow/skills/             Flow's own: phases, tools, dev
~/code/domain-skills/skills/    one folder per subject: react, web-pages, postgres
~/.flow/private-skills/         yours, each with a name no domain skill uses


WHERE SKILLS GET INSTALLED

~/.claude/skills/                    every session on this machine sees these
├─ groundwork     → ~/code/flow/skills/phases/groundwork/      flow install
├─ file-findings  → ~/code/flow/skills/tools/file-findings/    flow install
└─ my-deploy      → ~/.flow/private-skills/my-deploy/          flow private-skills add my-deploy --global

~/work/shop/.claude/skills/          only sessions inside ~/work/shop see these
├─ react          → ~/code/domain-skills/skills/react/         flow domain-skills add react
└─ acme-billing   → ~/.flow/private-skills/acme-billing/       flow private-skills add acme-billing


FINDINGS

~/work/shop/.flow/findings/hydration-mismatch-from-server-date-formatting.md
                                     one file per finding, in the project, as today
```

During development the repository sits at `lab/domain-skills/` in this clone, a submodule like
`lab/util/` and `lab/toolbox/`. On any other machine it is a plain clone, and `~/code/domain-skills/` is
only the example path.

## Decisions

### The repository is `domain-skills`, and works without Flow

- **Its own public GitHub repository**, `Adrian333Dev/domain-skills`. Public, because other people's pull
  requests are the point. Separate from Flow because many people send domain knowledge and only the user
  changes Flow's own skills: a separate pull request queue, separate permissions.
- **`skills/<name>/SKILL.md` at the root.** This is the path the `skills` CLI from Vercel expects, `npx
  skills add <owner/repo> --skill <name>`, so anyone can install from the repository with no Flow
  involved. No group folders, since the repository holds one kind of skill.
- **A submodule at `lab/domain-skills/` during development.** Nothing that ships names that path. The
  user runs both setup commands, since both change git:

  ```
  gh repo create Adrian333Dev/domain-skills --public
  git submodule add git@github.com:Adrian333Dev/domain-skills.git lab/domain-skills
  ```

- **`no-skill-under-lab` in the repo `CLAUDE.md` loses its first sentence**, "`skills/` is the only place
  a live skill exists", which the submodule breaks. The sentence protected 2 things: `flow install`
  reading one tree, and nothing shipped pointing into `lab/`. The first no longer holds. The second still
  matters. The rule becomes: "Flow's own skills live in `skills/`. A skill from another repository lives
  in that repository. Never let a `lab/` path leak into a skill, `home/`, or `project-template/`."
- **`skills/stack/` leaves Flow's tree**, and `domain` is the word in Flow's docs. "Stack" says a tool
  you touch. "Domain" says a field, and the first big contribution, abuse prevention, is a field.
- **The Vercel CLI is not what Flow builds on.** For our own repository, a clone and `git pull` do
  everything it does and keep a history. Only its folder layout is taken.

### A domain skill installs into one project, never onto the machine

The deciding argument: a skill installed on the machine puts its description into every session on the
machine, and React in a Python project is cost with no return. The 3 options compared:

- **On the machine, on**: the description sits in every session of every project, eating the listing
  budget that the skills in use need.
- **On the machine, off**: free in context. But `flow install` would have to write one `skillOverrides`
  line per skill in the repository into a settings file the user maintains by hand, `~/.claude/skills/`
  fills with symlinks for skills nobody uses, and a skill is unusable until a settings edit turns it on.
- **In the project**: free everywhere else, usable the moment it lands, and no settings line anywhere.

A symlink rather than a copy, so a fold reaches every project that installed the skill. The symlink needs
no `.gitignore` change, since `project-template/.gitignore` already ignores links under
`.claude/skills/`.

What this retires:

- **`flow install` is unchanged** and installs Flow's own skills alone. It never reads the domain
  repository.
- **The question of how a domain skill is off by default is gone.** `home/settings.json` loses
  `"web-pages": "off"`.
- **The header of `scripts/flow/commands/skills.js` is rewritten.** Its "No `add`, `sync`, `new` or
  `drop`" held while an external skill was a copy committed into one project.

### Commands: one group per folder

Each command group owns exactly one folder, so no command ever meets 2 skills of one name. `ls` is the
default action in every group, as it already is for `flow skills`.

```
flow skills ls                    Flow's own skills, and what this project is shown of each   exists today
flow domain-skills ls [term]      every skill in the repository; a term filters by name and description
flow domain-skills add <name>     symlink it into this project
flow domain-skills drop <name>    remove the symlink
flow private-skills ls            every skill in ~/.flow/private-skills/
flow private-skills add <name>    symlink it into this project; --global puts it in ~/.claude/skills/
flow private-skills drop <name>
```

The filter exists because the repository can reach hundreds of skills, and listing all of them into
context to find one is its own cost.

`flow domain-skills` finds the clone through one setting, read by that group alone:

```
# ~/.flow/settings.json
"domainSkills": "~/code/domain-skills/skills"
```

### Your own skills live in `~/.flow/private-skills/`

- **A private skill has a name of its own.** No private skill ever shares a name with a domain skill, so
  nothing shadows anything. `flow private-skills add` refuses a name the domain repository already uses.
- **It installs globally or per project**, and `--global` is the only difference.
- **A skill that belongs to one repository and its collaborators needs no command**: a real folder
  committed at `<project>/.claude/skills/<name>/`, which the template already tracks.
- **The rule `claude-dir-vs-flow-dir` gains `private-skills/`** in its list of what `~/.flow/` carries.
- **2 machines share the folder** by making it a private git repository.

The folder was `~/.flow/skills/` until 2026-09-13, and read as a third folder called skills meaning
something different from the other two.

### Every domain skill body ends with a guarded overlay line

```
!`flow overlays react 2>/dev/null || true`
```

- **On a machine with Flow**, it pastes this project's `.flow/overlays/react.md`, if one exists.
- **On a machine without Flow**, the shell's "command not found" goes to `2>/dev/null`, `|| true` keeps
  the exit clean, and the reader sees a plain skill.

It is the only Flow line in the repository. Flow's own phase and tool skills keep the unguarded `` !`flow
overlays <name>` ``, since they never run without Flow.

### Finding an existing skill stays in `/research`, local first

`/research` → `## Look for one that already exists` changes in 3 ways. The name `research` stays: the
description is what fires a skill, and it already says the skill finds any skill, plugin or MCP server
that does the job.

1. **The search runs cheapest first.**
   1. Your private skills, `flow private-skills ls`. Rare, and usually the user names the skill directly.
   2. The domain repository, `flow domain-skills ls <term>`.
   3. Real research outward: GitHub, the registries, the plugin marketplaces, and a level 4 prompt handed
      to an external LLM, which `/research` already carries. ChatGPT searches GitHub well.
2. **`references/find-a-skill.md` carries how to search outward.** Its opening says it covers any
   existing tooling: a skill, a plugin, an MCP server, a CLI, a knowledge base. The name stays short on
   purpose.
3. **"Adopting one is where a Flow `stack/` skill starts" is replaced** by the adoption rule below.

Toolbox is not part of the search. It is being rewritten and is not ready. Until then, what research
finds is written where `/research` already writes it: `docs/research/<question>.md` in the project. A
second project asking the same question searches again, and the toolbox rewrite is what fixes that.

### Adopting an external skill

- **Used unchanged, it stays upstream.** It installs into the project with its own installer, such as
  `npx skills add <owner/repo> --skill <name>`. Nothing is copied into `domain-skills`.
- **Changed at all, it moves into `domain-skills`.** It is copied into `skills/<name>/` with a note
  naming the upstream repository, the commit it was copied from, and its license, then edited. From then
  on it is ours: it carries the overlay line, takes findings, and `/fold` maintains it. The first edit is
  the trigger, because an edit made inside one project's copy helps no other project.
- **2 checks before a copy.** The license has to allow republishing, since the repository is public. A
  skill carrying its own process, such as a build order or a review loop, competes with `/execute`, and
  `/research` already says to weigh that.

### A skill that needs another names it in one sentence

For example: "Browser steps use the `playwright-cli` skill. If it is not installed, install it before
continuing." No command resolves dependencies. A resolver is a package manager, a skill needing 2 others
is rare, and a sentence also works on a machine without Flow. Overturned if skills needing 3 or more
others turn up regularly.

### A finding is one file in the project, and filing only tags it

A finding is reusable knowledge captured mid-work. Most findings never concern a skill: they become a
rule, a project fact under `docs/context/`, or a ticket.

1. **Capture writes one file per finding**, `.flow/findings/<what-was-learned>.md`, named in 4 to 8
   words, in place of one file per subject appended over time. `home/CLAUDE.md` → `## Capture` changes
   that one line. 2 reasons: a single finding can be sent without cutting a file apart, and 2 branches
   adding 2 files never conflict.
2. **`/file-findings` routes each one.** A rule, a project fact, or a skill you own is written there and
   the finding deleted, as today. A finding whose destination is a skill in `domain-skills` is written
   nowhere: it gets a header and stays where it is.

   ```
   ---
   skill: react
   date: 2026-09-13
   proved-by: ticket t045, a Next 15 app on Node 22
   ---
   ```

3. **The batch is asked once** whether its domain findings go to `domain-skills`. A yes adds the headers.
   A no routes them as a project lesson or into a private skill.

**Capture writes the file, and filing makes the call.** The file capture writes is already the report,
and nothing copies or reshapes it later. What stays in filing is judging that a lesson holds for anyone
using the subject, not only for this project. Capture was built so that call is never made mid-work, and
a wrong call sends one project's quirk to a public repository. Overturned if every finding about a domain
skill turns out universal in practice, in which case capture adds the header.

**A finding file exists only for a skill you cannot edit.** Filing edits a private skill or a Flow skill
directly.

**Nothing writes into the `domain-skills` clone except `/fold`.** A finding reaches the repository
through a pull request, and arrives on a machine with `git pull`.

### `/fold <skill>` is the maintainer's, and the only act that edits a shared body

- **Under `skills/dev/`**, beside `/flow-review`. A contributor never runs it. For `domain-skills` the
  maintainer is the user.
- **Reads** the body, its pages, the tagged findings in the current project, and every finding merged
  into `skills/<name>/findings/` in the repository.
- **Applies 6 acceptance rules**: true for anyone, proved, new or a correction, subject named with its
  version, fits the size budget, written from a failure.
- **Rewrites rather than appends**, deletes every finding it absorbed, and names the rejected ones in the
  commit.
- **Runs by hand until trusted**, then headless on a schedule, opening a pull request a person merges.

### `flow contribute` and `flow contribute status`, the second half

- **Contribute** takes every tagged finding in the project and opens one pull request adding each to
  `skills/<skill>/findings/` under its own filename. It works in a throwaway checkout under
  `~/.flow/tmp/`: a pull request needs a commit on a branch, and making that commit in the everyday clone
  would move the clone off `main` and leave a commit in it. Each local file is deleted once sent. A
  closed pull request still holds the content.
- **Status asks GitHub for the user's pull requests** on the repository. Merged, with the file gone
  upstream, means folded. Merged, with the file still there, means queued for a fold. Closed means turned
  down. Nothing is written back into a file.

### `/distill` is its own skill, typed-only, and waits for its first real run

The user names a subject and points at sources: ticket ids, folders, another project, months apart. The
skill reads them whole, separates what is true for anyone from what belongs to one project, picks the
shape, shows the plan and stops. No skill on the subject means a new skill under
`~/.flow/private-skills/<name>/`, published later by copying it into `domain-skills`. An existing domain
skill means new pages in that skill, sent like any contribution. Several pipelines under one subject are
several pages.

Separate from `/file-findings` because typed-only is a frontmatter line set per skill: the model may
offer `/file-findings` past 200 inbox lines, and must never start hours of distilling on its own. Named
nowhere in `~/.claude/CLAUDE.md`, since a rare typed command is learned from the README. Written after
the first distill done by hand with `write-skills.md`, on the abuse-prevention case, so the skill comes
from a real run.

### `/file-findings` changes in 2 places

- **Routing**: a finding for a skill in `domain-skills` gets the header and stays, never a line in the
  body. A skill built from several `needs skill` flags goes to `~/.flow/private-skills/<name>/`, or into
  `domain-skills` when it is for everyone.
- **The plan step** lists the domain findings under the skill they are tagged for, with the batch
  question.

Rules, project facts, checks and the clearing step are unchanged.

### Phases and tools stay out

A domain skill gathers knowledge from many people. A phase skill is instructions rewritten by one author.
So finding headers, `flow contribute` and `/fold` exist for domain skills only. A different behavior in
one project is an overlay. A wrong phase is a pull request on Flow's repository, and for the user
`/flow-review`.

### The shape of a domain skill

Fixed 2026-09-12 from the research below.

- **`SKILL.md` is the map**, about 150 lines: what the domain covers, the few rules that hold on every
  run, and where the live documentation is when the pages run out.
- **Route twice.** Each body section ends with a pointer naming what the page holds: "see `hooks.md` for
  useCallback, useMemo, useSyncExternalStore". The body closes with an index of every page. Past about 10
  pages, the index groups under topic headings.
- **3 folders, by what the agent does with the file.** `references/` for what it reads, one subject per
  page. `scripts/` for what it runs. `examples/` for what it copies, such as a whole worked component or
  config. `knowledge/` goes.
- **Every page opens with the same header**: subject, date, and what proved it, as a sentence with a
  link. Never a path outside the repository.
- **Keyed knowledge is a sub-folder named for the key, with a fixed file set**, such as
  `references/sites/youtube-watch.md` in `web-pages`. The body names the file set once.
- **A finding in the repository is a queue, never loaded.** The body and the pages never link one. The
  fold absorbs it and deletes it.
- **A page never links a file it does not ship with**: a finding, a script, another page.
- **The last line of the body is the guarded overlay line.**

Where things go while working: a small fact true for anyone is a finding. A fact true only for this
project goes to `docs/context/`. A whole subject is a page. A whole field is a skill.

### The repository's contract and its checks

- **`CONTRIBUTING.md` at the root** carries the body shape, the page header, the 3 folders, the finding
  header and the fold's 6 rules, so the repository is usable without Flow. `write-skills.md` points at it
  for domain pages.
- **CI checks form** on every pull request: frontmatter present, every relative link resolves inside the
  pull request, every page is in the index and every index entry exists, no secrets, body within budget.
  A finding merges on green. A page or a skill waits for a human read, because it loads on other
  machines.
- **No translations**, since a translated copy drifts.

## Walks

### A React project, from nothing to a loaded skill

1. The user is in `~/work/shop`, a Next.js project. `~/.claude/skills/` holds Flow's own skills, and
   `~/work/shop/.claude/skills/` is empty.
2. The work touches React. `/research` looks for an existing skill. `flow private-skills ls` shows
   nothing relevant, and `flow domain-skills ls react` prints `react` with its description.
3. `flow domain-skills add react` creates `~/work/shop/.claude/skills/react`, a symlink to
   `~/code/domain-skills/skills/react/`.
4. Claude Code picks the skill up inside the running session. If `~/work/shop/.claude/skills/` did not
   exist when the session started, the session restarts once.
5. The skill loads. Its last line pastes `~/work/shop/.flow/overlays/react.md`, if the project has one.

### A finding, from capture to the shared skill

1. Mid-work, the agent learns that a server component formatting a date in the local timezone causes a
   hydration mismatch. Capture writes `.flow/findings/hydration-mismatch-from-server-date-formatting.md`.
2. The ticket ends. `/file-findings` routes the finding: true for any React app, so its destination is
   the `react` domain skill. The plan asks once whether the React findings go to `domain-skills`. A yes
   adds the header, and the file stays.
3. The work and the tagged finding are committed together.
4. The user, as maintainer, runs `/fold react` from `~/work/shop`. It reads the tagged file, rewrites the
   body or a page in the `domain-skills` clone, and deletes the finding from the project.
5. The user commits in the clone and pushes. Every project on this machine that installed `react` has the
   new text at once, through the symlink. Other machines get it with `git pull`.

In the second half, a contributor who is not the maintainer runs `flow contribute` at step 4, and the
maintainer folds from the repository.

### An external skill, adopted then changed

1. `/research` finds nothing locally and searches outward. It finds `vercel/ai-elements` and writes the
   result into `docs/research/`.
2. Used unchanged, it installs into the project with `npx skills add vercel/ai-elements --skill
   ai-elements`.
3. Weeks later it needs a correction. Its license allows republishing. It is copied into
   `domain-skills/skills/ai-elements/` with its upstream repository, commit and license noted, gets the
   overlay line, and is edited there.
4. The project's upstream install is removed, and `flow domain-skills add ai-elements` installs ours.

## Branches

**The workflow supports one branch at a time to start with.** Ruled by the user 2026-09-13. The walk
below is recorded so the multi-branch work starts from it, and `backlog.md` → `## Subagents and dispatch`
carries the item.

Project files fall into 2 kinds when the branch changes:

- **Committed, so they change with the branch**: everything in `.flow/`, plus `docs/context/`,
  `CLAUDE.md` and `.claude/rules/`.
- **Ignored, so they stay put across a switch and are missing from a new worktree**: the symlinks in
  `.claude/skills/`, and `.flow/settings.json`.

Every skill reached through a symlink lives outside the project, so an edit to it holds on every branch
the moment it is written. That is the branch independence the user wants for skills. A skill committed as
a real folder in the project, and an overlay, change with the branch.

1. **One branch per task, merged each time.** Works. Findings merge with the work that taught them.
2. **A branch abandoned.** Its committed findings go with it. File before deleting a branch.
3. **An uncommitted finding when switching.** Git leaves new uncommitted files in place, so the finding
   follows to the new branch and is committed there. Wrong branch, never lost.
4. **2 branches in parallel.** Findings never collide, since each is a new file. 3 other files do:
   - `.flow/inbox.md` is appended on both, so the merge conflicts.
   - `.flow/handoff.md` is rewritten whole on both, so the merge conflicts.
   - `flow new` numbers a ticket as the highest id plus 1, `nextId` in `scripts/flow/lib/store.js`, so
     both branches create the same id.
5. **2 worktrees.** Everything in case 4, plus the ignored symlinks are missing in the new folder, so
   `flow domain-skills add` runs again there.

The user's ideas for the multi-branch work, 2026-09-13, none decided:

- **Record the branch on a ticket**, when it is created or picked up.
- **Record the sessions that worked a ticket**, by session id, with some metadata. Doubted by the user in
  the same message: work on one branch can move between machines, and a session id belongs to one
  machine.

## Edge cases and their fixes

- **A page links a finding, a script or a page that was not sent.** The link check in CI fails the pull
  request.
- **Proof written as a path.** A finding may name `t045` or a project path, since only the fold reads it.
  A page states its proof in a sentence.
- **Secrets.** A finding written mid-work can carry a real endpoint. The batch question in filing is the
  last human gate, and CI runs a secret scan.
- **A private skill named like a domain skill.** `flow private-skills add` refuses it.
- **A license that forbids republishing.** The skill stays upstream and unchanged. A needed change
  becomes a project rule, or a skill of our own written from scratch, since an external skill carries no
  overlay line.
- **A new worktree.** The symlinks under `.claude/skills/` are ignored by git and missing there, so `flow
  domain-skills add` runs again.
- **A skills folder created mid-session.** Claude Code watches only folders that existed at session
  start, so the first `add` into a project without `.claude/skills/` needs a restart.

## What the research showed, 2026-09-12

2 surveys, 55 large domain skills under `repos/` and 12 vendor-shipped ones on GitHub, reports in
`tmp/research/` (gitignored). What held everywhere:

- **`references/` is the folder.** 42 of the 55 multi-file skills and 9 of the 12 vendor skills.
  `knowledge/` appears in one skill in the wild, the user's own `debug-web-pages` in Delapse.
- **No skill lets the agent write into the shared skill at run time.** Supabase's skill files a GitHub
  issue when its guidance was wrong. Sentry's weekly agent opens a pull request or an issue. Every
  mechanism puts a review between the agent and the page.
- **Nobody appends a contribution to a page.** ECC rewrites every accepted skill to its house form.
  Vercel compiles rule files into an index.
- **Agent-written notes kept apart from author-written pages exist in one skill**, the user's own, and
  both external runs call it the gap in every high-adoption collection.

The `repos/` survey ranks the user's `debug-web-pages` first, as the only skill that plans for its own
growth: `MAINTAINING.md` names sediment and sprawl, promotes a tactic once it appears in 2 files, prunes.
The fold is those rituals made into a skill.

Taken: routing twice from `react-dev`, grouped indexes from `angular-developer`, the exit to live docs
from the same, `examples/` beside `references/` from 8 skills, a fixed file set per key from Cloudflare's
57 product folders and Sentry's 19 platforms, the contract file from Supabase's `_contributing.md`, the
index check from `remotion-video-creation`, the body budget from the 4 best vendor bodies at 137 to 150
lines.

Left: Vercel's one file per rule with an index of one-liners, since 72 one-liners cost what the pages
cost and Vercel's own tracker complains. Sentry's drift agent and Firebase's eval suites, maintainer
automation for after the fold runs headless. Vercel's dated citation registry, too heavy at this scale.

## Rejected

- **Installing every domain skill on the machine, turned off.** Free in context, but it turns
  `settings.json` into a generated file and fills `~/.claude/skills/` with unused links. Replaced
  2026-09-12 by installing into a project.
- **`~/.flow/sources`**, a list of folders `flow install` searched, the lowest line winning a shared
  name. It existed so a private skill could shadow a public one, and that case is gone. Replaced by one
  setting and one command group per folder.
- **A public and a private version of one skill**, with the provide-or-extend rule and `flow extras`. A
  folder holding `SKILL.md` replaced the public skill, a folder without one extended it, and `flow
  extras` printed the extending files at the bottom of the body. Rejected by the user 2026-09-13 as
  complicated and awkward in real use. A private skill takes its own name. What was lost: one paragraph
  of private knowledge that applies in every project now needs a whole private skill, or an overlay per
  project.
- **Merging overlays into `flow extras`** on one line. It dropped the project overlay from domain skills
  without saying so.
- **One command searching every folder.** The domain repository is a standalone dataset and gets its own
  commands.
- **Findings moved to `~/.flow/findings/`**, and filing writing a copy into the `domain-skills` clone.
  The first made a per-project capture folder global, when most findings are not about skills. The second
  added a second place to write, risky and unneeded, since the finding file is already the report.
- **A `share:` header with a default in `~/.flow/settings.json`**, and the pull request url written back
  into the file. Filing asks once per batch, and status asks GitHub.
- **The Vercel `skills` CLI as the install mechanism** for our own repository. Its layout is taken, its
  mechanism is not.
- **Toolbox as a place `/research` searches and writes.** Not ready, and being rewritten.
- **`find-what-already-exists.md` as the page name.** Too long. `find-a-skill.md` stays, with an opening
  that says it covers any tooling.
- **A dependency resolver in `flow domain-skills add`.** A package manager for a rare case.
- **A per-user fork of a skill folder as the main path.** Guarantees divergence.
- **A machine-wide overlay.** An overlay appends to the end of a body, useless to somebody who rewrote
  the middle.
- **Names.** `flow-corpus` says nothing to a stranger. `~/.flow/private` and `~/.flow/skills` were
  replaced by `~/.flow/private-skills`. `flow private` and `flow domain` were replaced by names matching
  the folders.
- **A versions mechanism through `package.json`.** Guessed 2026-09-12 and wrong. The item stays in
  `backlog.md` with no mechanism.

## The plan

**The essential half**, the loop the user runs alone, about 5 sessions, in this order:

1. **The `domain-skills` repository.** The user creates it and adds the submodule. `no-skill-under-lab`
   is rewritten in the repo `CLAUDE.md`, along with the group list in its `## Authoring a skill`.
   `web-pages` moves to `lab/domain-skills/skills/web-pages/` in the shape above: `knowledge/` becomes
   `references/`, `domains/` becomes `references/sites/`, and the body routes twice and ends on the
   guarded overlay line. `CONTRIBUTING.md` at its root. `skills/stack/` removed from Flow.
   `write-skills.md`, `docs/dev/skills.md` and `home/settings.json` updated in the same pass.
2. **`flow domain-skills ls`, `add` and `drop`**, and the `domainSkills` setting. The header of
   `commands/skills.js` rewritten. Tests in `scripts/`.
3. **`flow private-skills ls`, `add` and `drop`**, with `--global`. `claude-dir-vs-flow-dir` gains
   `private-skills/`. Tests.
4. **`/research`**: the search reordered local first, `references/find-a-skill.md`, and the adoption
   rule.
5. **Capture and `/file-findings`**: `home/CLAUDE.md` → `## Capture` writes one file per finding, and
   filing adds the `skill:` header for a domain skill.
6. **`/fold <skill>`** under `skills/dev/`.

**The second half**, waiting for the first contributor other than the user: `flow contribute` and
`status` (2 sessions), CI on the repository (1). `/distill` (1) waits for the first distill done by hand.
Later: a drift agent and skill evals.
