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
~/code/domain-skills/skills/    one folder per subject: react, postgres
~/code/domain-skills/drafts/    skills not yet in the shape, installed by nothing: web-pages
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
~/work/shop/.flow/findings/react/    findings a failed send left, until flow contribute runs again
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
- **`drafts/<name>/` at the root holds a skill not yet in the shape**, added 2026-09-13 at the user's
  request. `web-pages` waits there unchanged until its rebuild. A draft ships by moving into `skills/`.
  The root rather than `skills/drafts/`, because the Vercel CLI walks `skills/` 3 levels deep and would
  offer `skills/drafts/web-pages/` for install like a finished skill (its README, read 2026-09-13).
  `flow domain-skills` reads only `skills/`. One gap: with nothing at all in `skills/`, the Vercel CLI
  falls back to searching the whole repository and finds the draft. It closes when the first finished
  skill lands.
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

**The project keeps a committed list of its domain skills**, `.flow/domain-skills.txt`, one name per
line. Added 2026-09-14, before the build, on the user's go. Git ignores the links, so a fresh clone on
the user's second machine had no skills and no record of which to add, and a new worktree relied on
memory. `add` and `drop` write the list, and `add` with no name links every name on it. Rejected: a key
in `.claude/settings.json`, which puts Flow's data in Claude Code's file, and no list, which rebuilds the
names from memory on every machine.

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
flow domain-skills ls [words]     every skill in the repository; words filter by name and description   built 2026-09-14
flow domain-skills add [names]    symlink each into this project and list it; no name relinks the list  built 2026-09-14
flow domain-skills drop <names>   remove the symlink and the line                                        built 2026-09-14
flow private-skills ls [words]    every skill in ~/.flow/private-skills/, here and on the machine          built 2026-09-14
flow private-skills add [names]   symlink each into this project and list it; --global uses ~/.claude/skills/  built 2026-09-14
flow private-skills drop <names>  remove the symlink and the line; --global on the machine                   built 2026-09-14
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
  nothing shadows anything. `flow private-skills add` refuses a name the domain repository already uses,
  checked only where `domainSkills` is set, and since 2026-09-14 a name one of Flow's own skills uses.
  Without that, `add --global` would replace Flow's link in `~/.claude/skills/`, and the next
  `flow install` would replace it back.
- **It installs globally or per project**, and `--global` is the only difference.
- **A skill that belongs to one repository and its collaborators needs no command**: a real folder
  committed at `<project>/.claude/skills/<name>/`, which the template already tracks.
- **The rule `claude-dir-vs-flow-dir` gains `private-skills/`** in its list of what `~/.flow/` carries.
- **2 machines share the folder** by making it a private git repository.
- **Each place keeps a list, added 2026-09-14.** A project keeps `.flow/private-skills.txt`, committed,
  the same as `.flow/domain-skills.txt`. The machine keeps `global.txt` inside the private folder, so it
  travels with that folder's repository. A bare `add`, with or without `--global`, relinks its list.
  Without a list, a skill missing on the second machine goes unnoticed until it fails to load. The list
  commits only names, never a skill's content. It would move into the private folder if a name alone
  ever proved too private to commit.
- **`add` replaces only a link it could have made, in both commands, 2026-09-14.** That means a link into
  its own source, or a broken link, which is what a moved clone leaves. A working link another installer
  made is left alone, as `drop` already did. `flow domain-skills add` replaced any link until then.

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

### Finding an existing skill stays in `/research`

`/research` → `## Look for what already solves it`, named `## Look for one that already exists` until
2026-09-14, changes in 3 ways. The name `research` stays: the description is what fires a skill, and it
already names skills, plugins, libraries and tools among what the skill finds.

1. **The search runs in 2 rounds.** It ran cheapest first until 2026-09-14: `### skills.sh joins the
   search` below.
   1. At once: your private skills, `flow private-skills ls`, rare since the user usually names the skill
      directly; the domain repository, `flow domain-skills ls <term>`; the toolbox; and skills.sh.
   2. Only when nothing from the first round fits, real research outward: GitHub, the registries, the
      plugin marketplaces, and a level 4 prompt handed to an external LLM, which `/research` already
      carries. ChatGPT searches GitHub well.

   **Built 2026-09-14** as item 10, with 3 additions found by running the commands. `flow domain-skills ls`
   matches every word given, so it runs one word at a time. The private search lists every private
   skill with no words, since there are rarely more than a few. `flow domain-skills ls` fails where
   `domainSkills` is unset, so the agent clones the public repository into `tmp/references/` instead,
   as it does the toolbox. A private or domain skill that fits skips judging and goes straight to `add`.
   The outward round names 3 commands: `gh search code <word> --filename SKILL.md`, the same with
   `marketplace.json`, and the MCP registry's `v0/servers?search=`.
2. **How to search outward stays in `SKILL.md`, 2026-09-14.** It was to be
   `references/find-a-skill.md`. Every research run starts with the search, so a page would load every
   time and save nothing, and the outward half is 5 lines. Ruled by the user at the build.
3. **"Adopting one is where a Flow `stack/` skill starts" is replaced** by the adoption rule below.

What research finds is written where `/research` already writes it: `docs/research/<question>.md` in
the project. The toolbox, rebuilt 2026-09-13, joins the search: `### /research beyond skills,
2026-09-13` below.

### `/research` beyond skills, 2026-09-13

Agreed in the toolbox conversation. **Built 2026-09-14, ahead of item 10**, on the user's go: the
description, the toolbox step, the 2 starting points and the line on any subject. Item 10 added the 2
local steps the same day: `### Finding an existing skill stays in /research` above.

- **The toolbox joins the search**, in the first round with the user's private skills, the domain
  repository and skills.sh. The agent runs `git clone --depth 1
  https://github.com/Adrian333Dev/toolbox tmp/references/toolbox`, reads its `README.md`, and greps the
  `description:` lines of the folders it picks. No `lab/` path enters the skill, and nothing installs.
- **2 starting points.** A need with no tool yet: anything that already solves it, fully or partly, a
  partial fit named with what it leaves unsolved. A tool already chosen: a skill, plugin or MCP server
  for it, as before. The section is named "Look for what already solves it".
- **Research covers any subject**, ruled by the user: "research skill isn't just about researching any
  software, it's about researching anything", marketing research included. The body is still mostly
  about software. A question outside software uses only level 4, the prompt for an outside research
  tool, and the findings file.

**The description, written by the user 2026-09-14**: "Researches any subject. Finds a skill, plugin,
library, tool, existing solution or anything else. Reverse engineers tools, investigates source code
and more." "Reverse engineers" and "investigates" took an `s` to match the first 2 verbs. It replaced
"Reads what an external tool actually does, from its own docs and source. Finds any skill, plugin or
MCP server that already does the job."

The user's constraints:

- Really compressed.
- Generic enough for any subject.
- A list of what it does: "find that, research that".
- No situation or scenario. Describing one makes it too specific.
- Still enough detail to say what the skill does. Cutting details each round was the wrong direction.
- Opens with "Researches any subject", then names the cases it finds, ending in "anything else".

Rejected drafts, each with the user's reason:

1. "Reads what an external tool actually does, from its own docs and source. Finds what already solves
   a problem, fully or partly: a library, CLI, service, app or project. Finds any skill, plugin or MCP
   server for a tool already chosen." Not compressed, and too specific.
2. "Reads what an external tool actually does, from its docs and source. Finds any existing tool that
   does the job." Too much detail, and "any existing tool that does the job" is too vague: it says
   nothing of what the skill does.
3. "Researches outside software: how it really works, and what already exists for a need." "Outside
   software" means nothing, and research is about anything, not only software.
4. "Researches any subject: finds what already exists, reads the original sources, compares the options
   and records the findings." "Researches any subject" is right. The rest says nothing of value: it
   should name the cases instead, such as find a skill, a plugin, an MCP server, a tool or a solution,
   then "anything else" so the list stays open.
5. "Researches any subject. Finds a skill, plugin, MCP server, tool, existing solution or anything
   else. Reads how something really works, from the original sources." Replaced by the user's own
   wording, with no reason given.

### skills.sh joins the search, and find-skills is merged, 2026-09-14

Raised by the user, who found skills.sh and asked whether it makes the toolbox obsolete. Agreed and
built the same day. skills.sh is Vercel's index of every public repository holding a `SKILL.md`, ranked
by installs. `npx skills` is its CLI. Whether the toolbox stays is argued in `design-toolbox.md` →
`## skills.sh, 2026-09-14`.

- **skills.sh is searched at once with the toolbox and Flow's own tree**:
  `npx skills find <the need, or the tool's name>`, with `--owner <maker>` for a tool already chosen.
  The placeholder names both, because the user searches for any skill, not only one for a chosen tool.
  Tool makers now ship a skill teaching their own tool, so the search finds tools too: browser-use and
  browser-harness both appear.
- **The web only when nothing from that round fits.** The user asked for the local searches in
  parallel, and for the web, the most expensive, only when they return nothing relevant. First built as
  4 steps in order. Whether to search the web at all was left to the agent: it stays, because skills.sh
  lists no plugin, MCP server or library that ships no skill, and 57 of the toolbox's 154 repos are
  absent from it.
- **The CLI, never the API.** The documented `/api/v1/` endpoints answer 401 without a Vercel OIDC
  token. Only the endpoint the CLI calls, `https://skills.sh/api/search?q=<words>&limit=20`, answers
  without one, and it is undocumented. A result holds a skill name, its repository and an install
  count. No description, so the agent reads the `SKILL.md` before recommending one.
- **Install counts rank last.** The CLI reports them anonymously and nothing verifies them.
  `prime-skills/runcomfy-agent-skills` → `lipsync` showed 356,974, above Supabase's own `supabase`
  skill at 272,347.
- **`vercel-labs/skills` → `find-skills` was merged, not adopted.** It is among the most installed
  skills on skills.sh, and already sits in `~/.claude/skills/` on this machine, linked from `~/.agents/skills/`.
  Taken into `/research`: the search command, the checks (publisher first, then stars and last push,
  then installs), and `npx skills add <owner/repo> --skill <name>` in the adoption rule.
- **Left out of find-skills:**
  - installing for the whole machine without asking, `npx skills add <package> -g -y`
  - checking the leaderboard first, which ranks by total installs instead of by the need
  - 1,000 installs as a quality bar
  - `npx skills init` offered when nothing is found
  - its trigger, "how do I do X", which matches almost any question
- **A report the user generated with ChatGPT**, `tmp/research/skills-sh.md`, read the documented API
  as needing no key for search. The 401 above disproved it.

### Adopting an external skill

- **For one project, it installs with its own installer**, such as `npx skills add <owner/repo> --skill
  <name>`. A change edits the project's copy, which from then on counts as the project's own skill, and
  `/file-findings` writes into it. A reinstall would wipe the edit, and a changed skill is rarely
  reinstalled. The folder is committed, so `git diff` shows a wipe and a revert restores it. Ruled by the
  user 2026-09-14, replacing "changed at all, it moves into `domain-skills`".
- **When a second project needs the change, it moves into `domain-skills`.** The edited skill is copied
  into `skills/<name>/` with a note naming the upstream repository, the commit it was copied from, and its
  license. From then on it is ours: it carries the overlay line, takes findings, and `/fold` maintains it.
  What was lost: until the second project, a fix stays in the one project that made it.
- **2 checks before a copy.** The license has to allow republishing, since the repository is public. A
  skill carrying its own process, such as a build order or a review loop, competes with `/execute`, and
  `/research` already says to weigh that.

### A skill that needs another names it in one sentence

For example: "Browser steps use the `playwright-cli` skill. If it is not installed, install it before
continuing." No command resolves dependencies. A resolver is a package manager, a skill needing 2 others
is rare, and a sentence also works on a machine without Flow. Overturned if skills needing 3 or more
others turn up regularly.

### A finding is one file in the project, tagged at capture, sent at filing

A finding is reusable knowledge captured mid-work. Most findings never concern a skill: they become a
rule, a project fact under `docs/context/`, or a ticket. Built 2026-09-14 as item 11.

1. **Capture writes one file per finding**, `.flow/findings/<what-was-learned>.md`, named in 4 to 8
   words, in place of one file per subject appended over time. It holds what went wrong, what fixed it,
   the rule that follows, and the version, the shape `CONTRIBUTING.md` asks for. 2 reasons: a single
   finding can be sent without cutting a file apart, and 2 branches adding 2 files never conflict.
2. **Capture tags a finding about a skill in the session's skill list**, loaded or not, and of any type:
   Flow's, private, a project's own, or a domain skill. Capture looks nothing up. The tag says what the
   finding is about, never where it goes. Ruled by the user 2026-09-14, replacing a tag added at filing
   for domain skills alone.

   ```
   ---
   skill: react
   ---
   ```

3. **`/file-findings` routes each one.** A tagged finding goes to its skill. Filing follows the skill's
   link to its folder, and edits nothing in 2 places. Inside the `domain-skills` clone, the question
   below applies. Inside Flow's `skills/`, knowledge for the project goes to `.flow/overlays/<skill>.md`,
   and a flaw in Flow to `/flow-review`. Anywhere else, an installer's copy in the project included, it
   writes into the skill and deletes the finding. Flow's skills were added 2026-09-14, since filing
   would otherwise edit Flow from inside some project.
4. **The batch is asked once** whether its domain findings go to `domain-skills`. A yes moves each into
   `.flow/findings/<skill>/`, header intact, and runs `flow contribute`. A no writes them into the skill's overlay, or into a private
   skill. The overlay replaced a project fact on 2026-09-14, because the knowledge is about the skill and
   the overlay loads with it. An inbox item bound for a domain skill is written there as a finding on a
   yes.

**The sub-folder is where a finding waits to be sent.** A yes moves it there and runs `flow contribute`,
which deletes it once its pull request is open. A failed send, with no network or `gh` logged out, leaves
it for the next run. Filing reads only the top of `.flow/findings/`, so it never asks twice. Until
2026-09-15 the sub-folder was the fold's queue, read by `/fold` from inside the project.

**The question stays in filing**, the last human check before a finding can reach a public repository: a
secret, or one project's quirk.

**`scorecard.md` stays one appended file**, one line per wrong warning from a rule check. Its only cost
is a merge conflict between 2 parallel branches, and the workflow runs one branch at a time.

**No `flow` command writes a finding.** A `Write` call makes one in a single step. A ticket needs
commands for its numbered id, its status and its links, and a finding has none of them. Overturned if a
finding gains an id or a status.

**Nothing writes into the `domain-skills` clone except `/fold`.** A finding reaches the repository as a
pull request that is never merged, and the fold's rewrite arrives on a machine with `git pull`.

### The open pull requests are the queue, and a finding is never merged

Ruled by the user 2026-09-15.

- **Every finding goes to GitHub as a pull request** the moment filing gets a yes, the user's own
  included. `/fold` reads the open ones for a skill from any folder, on any machine. The deciding
  argument: findings waiting in each project's `.flow/findings/<skill>/` are spread across every project,
  so the fold would have to run inside each one, and a scheduled fold could never reach them. What was
  lost: the user's findings are public from filing, not from the fold, and the yes is the last check.
- **The fold closes each pull request with a comment** saying what went in, what did not, and why.
  Merging first added a step, kept finding files in the history, and made 2 pull requests adding one
  file name conflict. What was lost: GitHub shows "Closed", which reads as a rejection. The comment and a
  `Co-authored-by` line on the fold's commit answer it.
- **2 findings with one file name need no rule.** 2 pull requests never meet in git, and in one project
  `Write` refuses to overwrite a file the agent has not read.
- **Filing asks every time**, never after a count of findings. The plan stops for a yes anyway. A count
  strands findings in a project that goes quiet, ages them, and measures the wrong thing: one finding
  about a real bug is worth sending, and 10 project quirks are not. Overturned if the answer is mostly no.
- **A page or a skill goes in as an ordinary pull request**, merged after the user reads it, since it
  loads on other machines. `CONTRIBUTING.md` gives the steps. No Flow command sends one until the first
  contributed page shows the manual steps hurt.
- **A contributor who cannot push gets a fork**, since a pull request's branch has to live where its
  author can write. `flow contribute` makes it, and `gh pr create` does the same by hand.

### `/fold <skill>` is the maintainer's, and the only act that edits a shared body

- **Under `skills/dev/`**, beside `/flow-review`. A contributor never runs it. For `domain-skills` the
  maintainer is the user.
- **Reads** the body, its pages, and every open pull request adding a file under
  `skills/<name>/findings/`, from any folder.
- **Applies the 5 rules in `CONTRIBUTING.md`**, read from there: true for anyone, proved by a failure,
  new or a correction, subject named with its version, fits the size budget.
- **Checks every claim that passes the rules**, the user's own included, since an agent misdiagnoses
  too: by reading the docs, changelog or source through `/research`, or by running a reproduction it
  writes in `tmp/` on the named version. Neither possible means rejected, unless the user vouches for it.
  It never runs a command copied from a finding, and rejects text aimed at an agent, since whatever it
  folds in loads in every project using the skill. Ruled by the user 2026-09-15, replacing a public
  source link beside every claim in a page, which was often impossible and rarely needed.
- **Shows the plan and stops** before writing: each finding with its pull request, how it was checked and
  what that showed, then the file it goes into or the rule it failed. A rewrite's diff never shows which
  finding changed what.
- **Rewrites rather than appends**, with a link beside a claim only when one is at hand. It prints the
  commit message: each rejected finding by file name with its rule, and a `Co-authored-by` line for each
  outside author whose finding went in. It never commits, since the global rules forbid git writes until
  the user turns them on.
- **Closes each pull request once the user says the commit is pushed**, with a comment saying what went
  in, what did not and why, and how each finding was checked. GitHub emails the author.
- **Typed-only**, since it rewrites a body every project loads and must never start on its own.
- **Stops on uncommitted changes under the skill's folder**, and the commit covers that folder alone. The
  rewrite is live in every project through the links, and a draft in progress elsewhere in the clone
  never blocks a fold. The plan closes with a reminder to pull.
- **Runs by hand until trusted**, then headless on a schedule, opening a pull request a person merges.

Built 2026-09-14 in `skills/dev/fold/SKILL.md`, with the plan stop, the printed commit message,
typed-only and the clean-clone check decided before the build. Rewritten 2026-09-15 to read pull requests,
check every claim and close the pull requests.

### `flow contribute` sends a project's findings, one pull request per skill

- **Reads every `.flow/findings/<skill>/` folder holding a finding**, and opens one pull request per
  skill, titled `Findings for <skill>`, adding each file to `skills/<skill>/findings/`. Each file is
  deleted once sent. A skill whose send fails keeps its files, the rest still go, and the command exits 1.
- **Everything goes through `gh api`, with no checkout**: a branch from the default branch, one commit per
  file through the contents API, then the pull request. The only setup is `gh auth login`. It replaced
  the throwaway checkout under `~/.flow/tmp/`, which also needed a git identity and push credentials.
- **Someone who cannot push gets a fork first.** Asking GitHub for a fork that exists returns it, and a
  fork still being created is retried for up to 10 seconds.
- **A skill the repository does not hold is refused**, since no fold would ever read its pull request.
- **`flow contribute status` was dropped 2026-09-15.** The fold's closing comment says what happened, and
  GitHub emails it to the author.

Built 2026-09-15 in `scripts/flow/commands/contribute.js`, with 4 tests in
`scripts/tests/contribute.test.js` against a fake `gh`.

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

- **Routing**: a finding for a skill in `domain-skills` is never a line in the body. A yes moves it into
  `.flow/findings/<skill>/` and runs `flow contribute`, and a no writes it into the skill's overlay. A finding for one of Flow's
  own skills goes to its overlay, or to `/flow-review`. A skill built from several `needs skill` flags goes to
  `~/.flow/private-skills/<name>/`, or into `domain-skills` when it is for everyone.
- **The plan step** lists the domain findings under the skill they are tagged for, with the batch
  question.

Rules, project facts and checks are unchanged. The clearing step deletes each filed finding, and clears
filed lines from `scorecard.md`. Built 2026-09-14 in `skills/tools/file-findings/SKILL.md` →
`## A skill filing must not edit`.

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
- **A page has no header.** A link names a claim's source when one is at hand, and rule 4 already names
  the version. Built 2026-09-14 in `CONTRIBUTING.md`, with the finding header cut to `skill:` alone and rules
  2 and 6 merged into "proved by a failure: the finding says what went wrong and what fixed it".
  - **Pages had a header until then**: `subject`, `date` and `proved-by`, written 2026-09-13. The user
    questioned it the same day, never having seen `proved-by`, which was proposed 2026-09-11 and drew no
    objection.
- **Keyed knowledge is a sub-folder named for the key, with a fixed file set**, such as
  `references/sites/youtube-watch.md` in `web-pages`. The body names the file set once.
- **A finding never lands on `main`.** It stays in its pull request, which the fold closes. The body and
  the pages never link one.
- **A page never links a file it does not ship with**: a finding, a script, another page.
- **The last line of the body is the guarded overlay line.**

Where things go while working: a small fact true for anyone is a finding. A fact true only for this
project goes to `docs/context/`. A whole subject is a page. A whole field is a skill.

### The repository's contract and its checks

- **`CONTRIBUTING.md` at the root** carries the body shape, the 3 folders, the finding header and the
  fold's 5 rules with the check every finding gets, so the repository is usable without Flow. `write-skills.md` points at it
  for domain pages.
- **CI checks form** on every pull request: frontmatter present, every relative link resolves inside the
  pull request, every page is in the index and every index entry exists, no secrets, body within budget.
  A finding is never merged. A page or a skill is merged after a human read, because it loads on other
  machines. Not built.
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
   hydration mismatch. `react` is in the session's skill list, so capture writes
   `.flow/findings/hydration-mismatch-from-server-date-formatting.md` with `skill: react` at the top.
2. The ticket ends. `/file-findings` follows the `react` link into the `domain-skills` clone, so nothing
   is edited. The plan asks once whether the React findings go to `domain-skills`. A yes moves the file
   to `.flow/findings/react/` and runs `flow contribute`, which opens pull request #12, `Findings for
   react`, and deletes the file.
3. Weeks later, from any folder, the user runs `/fold react`. It lists 3 open pull requests for `react`:
   #12, and 2 from contributors.
4. It checks each claim. A reproduction in `tmp/` on React 19.1 confirms #12. One contributor's finding
   teaches the same thing and joins it as one fact. The other names no version and fails rule 4. The plan
   shows all 3 and stops.
5. On a yes it rewrites the page in the clone and prints the commit message, with a `Co-authored-by` line
   for the contributor whose finding went in. The user commits `skills/react` and pushes.
6. The user says it is pushed. The fold closes all 3 pull requests, each with a comment saying what went
   in, or which rule it failed.
7. Every project on this machine that installed `react` has the new text at once, through the symlink.
   Other machines get it with `git pull`.

### An external skill, adopted then changed

1. `/research` finds nothing locally and searches outward. It finds `vercel/ai-elements` and writes the
   result into `docs/research/`.
2. It installs into the project with `npx skills add vercel/ai-elements --skill ai-elements`.
3. Weeks later it needs a correction. A finding tagged `skill: ai-elements` is filed straight into the
   project's copy, `.claude/skills/ai-elements/`, and committed with the project.
4. A second project needs the same correction. Its license allows republishing. The edited copy goes into
   `domain-skills/skills/ai-elements/` with its upstream repository, commit and license noted, and gets
   the overlay line.
5. Both projects remove their own copy, and `flow domain-skills add ai-elements` installs ours.

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
   `flow domain-skills add` with no name relinks everything `.flow/domain-skills.txt` lists.

The user's ideas for the multi-branch work, 2026-09-13, none decided:

- **Record the branch on a ticket**, when it is created or picked up.
- **Record the sessions that worked a ticket**, by session id, with some metadata. Doubted by the user in
  the same message: work on one branch can move between machines, and a session id belongs to one
  machine.

## Edge cases and their fixes

- **A page links a finding, a script or a page that was not sent.** The link check in CI fails the pull
  request.
- **Proof written as a path.** A finding may name `t045` or a project path, which the fold cannot open.
  The fold checks the claim itself, by reading or by running.
- **Secrets.** A finding written mid-work can carry a real endpoint. The batch question in filing is the
  last human gate, since a pull request is public the moment it opens. CI's secret scan comes after.
- **A planted instruction**, a finding telling an agent to run or send something. The fold rejects it,
  and never runs a command copied from a finding.
- **A send failing halfway.** The files stay for the next run, and a branch may be left on GitHub with
  no pull request.
- **A private skill named like a domain skill or a Flow skill.** `flow private-skills add` refuses it.
- **A license that forbids republishing.** The skill never moves into `domain-skills`. A change a second
  project needs becomes a project rule there, or a skill of our own written from scratch, since an
  external skill carries no overlay line.
- **A new worktree, a fresh clone, the second machine.** The symlinks under `.claude/skills/` are ignored
  by git and missing there, so `flow domain-skills add` with no name relinks every listed skill.
- **A listed skill missing from the clone**, such as one not pulled yet. `add` reports it and links the
  rest.
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
  into the file. Filing asks once per batch, and the fold's closing comment reaches the author.
- **The Vercel `skills` CLI as the install mechanism** for our own repository. Its layout is taken, its
  mechanism is not.
- **Toolbox as a place `/research` searches and writes.** Not ready, and being rewritten.
- **`find-what-already-exists.md` as the page name.** Too long. `find-a-skill.md` was kept, then dropped
  2026-09-14 with the page itself: the outward search stays in `SKILL.md`.
- **A dependency resolver in `flow domain-skills add`.** A package manager for a rare case.
- **A per-user fork of a skill folder as the main path.** Guarantees divergence.
- **A machine-wide overlay.** An overlay appends to the end of a body, useless to somebody who rewrote
  the middle.
- **Names.** `flow-corpus` says nothing to a stranger. `~/.flow/private` and `~/.flow/skills` were
  replaced by `~/.flow/private-skills`. `flow private` and `flow domain` were replaced by names matching
  the folders.
- **A versions mechanism through `package.json`.** Guessed 2026-09-12 and wrong. The item stays in
  `backlog.md` with no mechanism.
- **The project's `.flow/findings/<skill>/` as the fold's queue**, read by `/fold` from inside each
  project. Replaced 2026-09-15 by the open pull requests.
- **Merging a finding's pull request before the fold.** An extra step, finding files in the history, and
  a conflict between 2 pull requests adding one file name.
- **`flow contribute status`.** The fold's closing comment already reaches the author.
- **Asking to send only past a count of findings.** It strands findings in quiet projects and counts the
  wrong thing.
- **A public source link beside every claim in a page.** Often impossible and rarely needed. The fold's
  check replaced it.

## The plan

**The essential half**, the loop the user runs alone, about 5 sessions, in this order:

1. **The `domain-skills` repository.** Built 2026-09-13. The user created it and added the submodule.
   `no-skill-under-lab` is rewritten in the repo `CLAUDE.md`, along with the group list in its
   `## Authoring a skill`. `web-pages` moved unchanged to `lab/domain-skills/drafts/web-pages/`, since
   the user ruled it gets no edits before its full rebuild. `CONTRIBUTING.md` and `README.md` at its
   root. `skills/stack/` removed from Flow. `write-skills.md`, `docs/dev/skills.md`, `home/settings.json`
   and `home/settings.md`, the manual, `README.md`, `docs/dev/layout.md`, `skills.test.js` and the
   adoption rule in `/research` updated in the same pass. The page header came out, the finding header
   cut to `skill:` and 2 of the fold's rules merged on 2026-09-14.
   - **Then the toolbox rewrite**, after a compaction and before step 2, ruled by the user 2026-09-13.
2. **`flow domain-skills ls`, `add` and `drop`**, and the `domainSkills` setting. Built 2026-09-14, with
   `.flow/domain-skills.txt` added before the build. `scripts/flow/commands/domain-skills.js`, 6 tests
   in `scripts/tests/domain-skills.test.js`, the header of `commands/skills.js` rewritten. A bare group
   whose default action takes only optional words now runs it, so `flow domain-skills` lists.
   `references/cli-design.md`, the manual, `docs/dev/skills.md`, `write-skills.md`, `home/settings.md`,
   the template `.gitignore` comment and `claude-dir-vs-flow-dir` updated in the same pass.
3. **`flow private-skills ls`, `add` and `drop`**, with `--global`. Built 2026-09-14, with the 2 lists,
   the Flow-name refusal and the link rule for both commands decided before the build.
   `scripts/flow/commands/private-skills.js`, with the linking shared with `domain-skills.js` in
   `scripts/flow/lib/skill-links.js`. 4 tests in `scripts/tests/private-skills.test.js`, and 1 more in
   `domain-skills.test.js` for the link rule. `claude-dir-vs-flow-dir`, the manual, `docs/dev/skills.md`,
   `write-skills.md`, `docs/manual/settings.md`, the template `.gitignore` comment and the `flow` notes
   updated in the same pass.
4. **`/research`**: the 2 local searches added to the first round, and the outward commands. Built
   2026-09-14, in `skills/tools/research/SKILL.md` alone, with no page of its own. The adoption rule
   landed with step 1.
5. **Capture and `/file-findings`**: `home/CLAUDE.md` → `## Capture` writes one file per finding and
   tags a skill in the session's list, and filing moves a finding sent to `domain-skills` into
   `.flow/findings/<skill>/`. Built 2026-09-14, in `home/CLAUDE.md` and
   `skills/tools/file-findings/SKILL.md`, with the tag moved to capture and the sub-folder decided before
   the build.
6. **`/fold <skill>`** under `skills/dev/`. Built 2026-09-14 in `skills/dev/fold/SKILL.md`, with 4
   points decided before the build. `write-skills.md`, `docs/dev/skills.md`, the manual and `README.md`
   updated in the same pass, with `dev/` now covering the `domain-skills` repository too.
7. **`flow contribute`, and `/fold` reading pull requests.** Built 2026-09-15, moved up from the second
   half once the open pull requests became the queue for the user's findings too.
   `scripts/flow/commands/contribute.js` with 4 tests, `/fold` rewritten to check every claim,
   `/file-findings` running the command on a yes, and `CONTRIBUTING.md` rewritten for findings that are
   never merged. The manual and the `flow` notes updated in the same pass.

**The second half**, waiting for the first contributor other than the user: CI on the repository (1). `/distill` (1) waits for the first distill done by hand.
Later: a drift agent and skill evals.
