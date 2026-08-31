# `util` — the utility command dispatcher

**Locked 2026-08-30.** `util` is a second command-line tool, separate from `flow`, holding every
general-purpose script the user types. It ships in its own repository, dispatches to commands it does
not own, and joins several sources into one namespace. Nothing is built yet.

## Why it is not part of `flow`

`flow` was proposed as the home for these commands and rejected by the user, with four arguments.

- **Names collide, and the collision is evidence.** `flow tree` already prints a ticket dependency
  graph, so `ptree` could not become `flow tree` without renaming the ticket command first. One
  collision on the first attempt says the two sets do not belong in one namespace.
- **The tools are unrelated to each other.** A symlink builder, a repo cloner and an image optimiser
  share nothing but the person typing them. A single help page listing all of them is a drawer with a
  menu on it.
- **They are useful with no Flow anywhere.** `util fs tree` answers a question about a directory. It
  needs no ticket, no project, and no workflow.
- **Some of them will be private, and Flow is public.** This is the argument that ends it. A public
  CLI cannot carry private commands, and a private fork of a public CLI is worse than two tools.

## The shape

```
util <namespace> <command> [args]
util <command> [args]              a name unique across namespaces resolves on its own
u ...                              second PATH link, same program
```

- **A namespace is the qualifier the old prefixes carried.** `gsave` meant *git save* and `fmerge`
  meant *file merge*. Dropping to `save` and `merge` threw away the half that made them readable, so
  the namespace spells it out instead: `util git save`, `util fs merge`.
- **A word naming no namespace is looked up across all of them**, and resolves when exactly one
  command has it. `util tree` finds `fs tree` today. The day a second `tree` exists anywhere, the
  short form fails and prints both full names. So brevity is free until ambiguity is real, and the
  tool says so the moment it is. `flow` runs the same rule one level up, where a word naming no
  command is read as a ticket id.
- **A namespace appears when the second command needs it.** `git` earns one with a single member,
  because *save what* has no answer without it. A namespace holding one self-explanatory command is
  noise.
- **A namespace may declare a short alias**, written in its own `.info`. `git` is `g`, `github` is
  `gh`. An alias is for a name that has gone ambiguous and still wants to be brief.

### The namespaces at the start

- **`git`, alias `g`** — `save`, which is `gsave.sh` today: add, commit and push in one step
- **`github`, alias `gh`** — `clone` (one or more repos, any URL form) and `bookmark` (fetch a repo's
  stars, language, pushed date and description, and append one line to a file)
- **`fs`** — `tree` (was `ptree.js`), `merge` (was `fmerge.js`), and `link`, which builds a symlink and
  refuses to replace a real file

**`github`, not `repo`.** Both commands are GitHub-specific: `bookmark` calls `gh api repos/<slug>`,
and the URL parsing normalises `github.com` forms only. `repo` would promise GitLab support that does
not exist.

**`bookmark`, not `add`.** The command adds a repo to nothing. It fetches a repo's details and writes
one line about it down, which is what bookmarking is. The name also survives the namespace being
dropped: `util bookmark <url>` still reads correctly.

## Sources — how private and public share one namespace

**`util` is a dispatcher, not a monolith.** It ships no commands of its own. It reads a registry of
source directories and builds its namespace from what it finds.

- **A source is a directory laid out `<namespace>/<command>`**, one executable per command, in any
  language. `util` runs it and passes every argument through.
- **`~/.util/sources` lists the source paths**, one per line, `#` for a comment. Same shape as
  `home/skills` and `.flow-include`, so it reads the same way.
- **`util source add <path>`, `util source ls`, `util source drop <path>`** maintain it.

Three kinds of source, and the kind is decided by the directory rather than by any marker:

- **Public** — the `util` repository's own `commands/`, registered at install
- **Private** — a second repository, registered by hand, never published. Nothing inside it is marked
  private; the repository it sits in is what makes it so
- **A project's own** — `<project-root>/.util/`, picked up automatically when the working directory is
  inside that project. This is the local-script case: write a command in the repository that needs it
  and it exists nowhere else

**Promotion is a move.** `mv <project>/.util/git/foo <util-repo>/commands/git/foo`. The same
graduation a skill makes out of `drafts/`.

**Two sources defining one `namespace/command` refuse and name both.** `lib/skills.js` already refuses
two skills sharing a name, for the reason that applies here: silent shadowing is the bug nobody finds.
A private command deliberately overriding a public one is a real want and gets an explicit marker the
first time it is needed, not before.

## What a command carries

**The `description:` convention already exists and is not new here.** `ptree.js` reads
`description: <text>` from a comment in a file's first 50 lines, in any comment syntax, and reads a
folder's description from its `.info`. `home/CLAUDE.md` states the authoring half of the same rule.

**One reader, because `ptree` moves into this repository.** `ptree.js` becomes `util fs tree`, so the
tree command and `util ls` end up in one codebase and share the parser. Flow never needs it.

**A description is an index entry, never the file's documentation** (user, 2026-08-30). A file's own
header comment explaining what it does stays as long as it needs to be. The `description:` line is
the one-line entry printed beside the filename. Capped at 120 characters, raised from 60 the same
day, because 60 cut the end off — which is where the distinguishing detail sits.

**A few words, not a sentence** (user, 2026-08-31). The 120 characters are a bound, and the rule as
first written gave nothing else, so everything was written to the bound. What decides the length is
the reader: a listing puts dozens of descriptions in front of an agent at once, and each one is read
on every listing. `home/CLAUDE.md` now says to write what the name is missing and stop.

**A skill's frontmatter `description` is a different field and keeps its own rule.** Claude Code
loads it whole, never clips it, and fires the skill from it — so `references/style.md` § 8 wants it
sufficient rather than short. Both fields are spelled `description`, which is the whole reason the
boundary is written down in both files.

**A fenced code block in markdown is skipped, added 2026-08-31.** `fromComment` cannot tell a `#`
heading from a `#` comment, so any page teaching the `description:` convention was described by its
own example. `util`'s README carried one at line 71 and escaped only because the reader stops at line
50. The fix reads a markdown file's lines outside its fences; a real marker still works anywhere else
in the file.

## `util ls`

Grouped by source, then by namespace, with every command's description beside it.

```
$ util ls

~/code/util                                                    public

  git · g
    save               add, commit and push in one step

  github · gh
    clone              clone one or more repos from any URL form
    bookmark           append a repo's stars, language and pushed date to a file

  fs
    tree               a directory tree with the noise stripped out
    merge              many files as one stream, each in a fenced block
    link               build a symlink, refusing to replace a real file

~/code/util-private                                        not published

  aws                deploys
    push               ship the current branch to staging
```

- **The source header appears only when there are two sources.** With one it is noise.
- **A source with no commands prints its path and nothing under it**, so a registry line pointing at a
  moved folder is visible rather than silently inert.
- **A command missing its `description:` prints with the field blank**, never omitted. The gap is the
  reminder.
- **A namespace prints bare unless its name needs the help.** `aws` earns a description, because
  *deploys* is what the three letters do not say; `fs`, `git` and `github` do not. Decided on
  2026-08-31, and the argument is at the end of `## The rest of it, 2026-08-30`.

## What it costs Flow

Three commands leave `flow install`'s link table, and Flow gains a prerequisite it did not have.

- **`home/CLAUDE.md`** mandates `ptree` in every session — *every look at structure goes through it*.
  That line becomes `util tree`.
- **`scripts/flow/commands/open.js`** executes `fmerge.js` by absolute path out of the Flow clone. It
  becomes a call to `util fs merge`.
- **`flow install`** drops `ptree`, `fmerge` and `gsave` from `BIN`. `util install` owns those links,
  plus `util` and `u`.
- **Flow's install steps name `util` first**, and the install skill checks for it.

**The coupling is only acceptable while `util` is public.** If that repository ever goes private,
`ptree` and `fmerge` have to come back into Flow, because Flow's always-loaded rules depend on them.

## Where it lives

**Its own repository, and a submodule of this one** (user, 2026-08-30). The working copy sits at
`lab/util/`, so both tools are developed in one place; the repository itself is separate, so `util`
installs on a machine that never wanted Flow. Flow depends on `util`, never the reverse, and a folder
inside Flow could not satisfy that.

The rewritten toolbox joins it under `lab/` on the same terms, once it is rewritten.

**Every submodule rule this repo already carries applies**: changes are committed and pushed from
inside the folder, then the new pointer is committed here.

## Decided against

- **Folding the utilities into `flow`.** See `## Why it is not part of flow`.
- **Bare PATH names, one per command.** Proposed first and dropped: dozens of commands means dozens of
  names to remember and to collide with real binaries. The short obvious ones — `tree`, `link`,
  `clone`, `merge` — are all taken or ambiguous, which is why the prefixes existed at all.
- **Per-domain letter prefixes.** `p` for project, `f` for file, `g` for git already gave two meanings
  to `f` once `flow` and `fw` were counted, and domains multiply faster than letters.
- **Declared flags, the way `cli-design.md` requires of `flow`.** `util` dispatches to programs it did
  not write, so it cannot validate their flags. Everything after the command name passes through, and
  each command validates its own. This is the one rule that does not transfer.
- **Splitting `references/cli-design.md` now.** Half of it is `flow`-specific — the status table,
  ticket ids, the default noun. The general half transfers cleanly and gets copied when `util` is
  built. Splitting a reference file for a repository that does not exist buys nothing.
- **Publishing to npm.** `package.json` is wanted for `node --test`, for `"type": "commonjs"`, and for
  a `bin` field that keeps `npm i -g` open at no cost. Publishing waits for a second user.

## Where to start

`util` with the registry, the `source` commands and namespace resolution, then move `gsave` in as
`git save` and nothing else. One command proves the dispatch, the registry and the help before
`ptree` and `fmerge` have to move and Flow has to change with them.

## Built 2026-08-30 — the dispatcher, the registry, and `git save`

`lab/util/` holds a working `util`: `util.js`, `lib/` (sources, catalog, description reader,
listing), `builtin/` (`ls` and `source`), `commands/git/save.sh`, a README and 16 tests. **It is not
a repository yet** — `git init`, the first commit and `git submodule add` are the user's to run.
*Superseded the same day: it is a repository, and all 3 namespaces are built. See
`## The rest of it, 2026-08-30` below.*

**`gsave.sh` moved rather than being copied.** `scripts/gsave.sh` is deleted and `gsave` is out of
`flow install`'s `BIN`, which is 4 links now. Nothing in Flow referenced the file by path, and no
skill named it, so the move cost one line of code. `ptree` and `fmerge` stay where they are: the
always-loaded rules mandate `ptree` and `open.js` runs `fmerge.js`, so those two move with the Flow
edits that pay for them.

**`util ls` was built now, not later.** `## Where to start` asks for the dispatch, the registry and
the help, and the listing *is* the help — bare `util` prints the conventions and then the same
grouped output. Splitting them would have meant writing the listing twice.

### Eight decisions the design did not carry

Each one came up while building and none reverses anything above.

- **A clash refuses one command, never the catalog.** `## Sources` says two sources defining one
  `namespace/command` refuse and name both, and `lib/skills.js` was the model — but that one throws
  while building the catalog, which here would take `util ls` down with it. `util ls` is the tool you
  reach for to diagnose a clash, so the clash is recorded on the command instead: running it refuses
  and names both files, the listing marks it with both paths, and every other command keeps working.
- **The command name is the filename with any extension dropped.** `git/save.sh` is `util git save`.
  The design says "one executable per command" and stops there, which would have made the command
  `save.sh`. Dropping the extension carries Flow's own rule across — the file says what runs it, the
  name you type does not.
- **A source labels itself in its own `.info`.** The drawing in `## util ls` prints `public` and
  `not published` beside two source paths, and nothing in the design says where either word comes
  from. `util` cannot know: a source is a directory. So the label is the first paragraph of the
  source's `.info`, the same convention a namespace already uses, and the project source is labelled
  `this project` with no file needed.
- **A file without its execute bit still lists.** Requiring the bit would have hidden a command you
  had just written, which is the moment you most need to see it. It lists, `util ls` says
  `not executable`, and running it prints the `chmod` line.
- **`UTIL_HOME` and `UTIL_PROJECT`** move the registry and name the project, mirroring `FLOW_HOME`
  and `FLOW_PROJECT`. Without the first, every test reads the registry on the machine running it.
- **`ls`, `source` and `help` are reserved.** `util` answers all three itself, so a namespace with
  one of those names is unreachable. `util ls` says so under the namespace rather than refusing,
  because the fix is a rename the user has to see the reason for.
- **`--dry-run`, `-n` and the rest of `gsave`'s flags survive untouched**, since `util` passes
  everything after the command name through. The help text is now read out of the script's own header
  by `awk` rather than by a hard-coded line range, so a moved line cannot silently truncate it.
- **A builtin refuses an argument it cannot use.** `## Decided against` drops declared flags for
  dispatched commands, and a builtin is not dispatched. `util ls git` used to exit 0 having
  ignored the word, which `cli-design.md` names as the failure that reads exactly like success.

### Still unbuilt

`github clone` and `github bookmark`, the whole `fs` namespace, `fs link`, `util install`, and the
`package.json` `bin` field going anywhere real. Nothing has run outside a test and a scratch
registry, because `util` is not installed and Flow does not go on this machine yet.

## The rest of it, 2026-08-30 — `fs`, `github`, and Flow's dependency

Everything above shipped the same day. `util` is now a repository, a submodule of Flow at
`lab/util/`, and it carries all 3 namespaces the design named: `git save`, `fs tree|merge|link` and
`github clone|bookmark`. 24 tests pass. `util install` is the only piece left.

**Flow's dependency on `util` is real, and softer than `## What it costs Flow` expected.**
`open.js` runs `util fs merge` off `PATH` rather than a file inside the clone. The design treated
that as the hard cost, and the code already had the answer: `loadRefs` wraps the call in a `try`, so
a machine without `util` opens the ticket, prints `util is not on PATH` where the files would have
been, and carries on. A missing prerequisite degrades the resume instead of breaking `flow open`.

**One reader now, in `lib/describe.js`.** `ptree.js` carried a fuller version than the one written
for `util ls` — markdown frontmatter, a binary-file skip, and a folder reader that falls back to a
README. The merge took all three, so `util ls` gained them and the duplicate is gone. One behaviour
changed for `fs tree`: the trailing full stop is now clipped off every description, because these are
rows in a list rather than prose, and `util ls` had always clipped it.

**`bookmark` came from `repos/toolbox/bin/add-repo`, not from the deleted submodule.** The backlog
pointed at `toolbox/`, which has no gitlink in Flow's index and no folder on disk; the clone under
`repos/` is where the script actually was. Two things widened in the port. It takes several repos in
one call, matching `clone`. And the target file resolves against the directory you are standing in
rather than against one repository's root, with `--to` and `$UTIL_BOOKMARKS` to move it.

**A namespace `.info` exists only where an alias needs a home** (user, 2026-08-31). The design gave
all 3 namespaces a description — `files and directories`, `git, wrapped`, `the GitHub API` — and
every one restates the name it sits beside. The standing rule is that a name already saying what it
holds gets no description, so `fs/.info` is deleted and `git/.info` and `github/.info` are one
`alias:` line each. The listing prints a bare namespace name, which `render.js` already handled, and
the drawing under `## util ls` was corrected to match.

### Three more decisions the design did not carry

- **`fs link` takes several sources into a directory**, the shape `ln -s` uses, because linking a
  folder of scripts into `~/.local/bin` is the case that made `fs link` worth having. Naming a
  directory last puts one link inside it per source; naming anything else with 2 sources refuses
  before writing the first link.
- **`fs link` replaces a link and refuses a real file, with `--force` for the second.** The first
  half is `lib/links.js`'s rule and re-running has to be safe. `--force` is new: `lib/links.js` never
  needed one, and a command typed by hand does, because the alternative is deleting the file yourself
  and losing the refusal that was protecting it.
- **`github clone` and `github bookmark` both exit non-zero if any repo failed**, and the ones that
  worked still stand. A batch that stops at the first bad name makes you work out which of six
  cloned, and re-running is already free: `clone` reports `have:` and skips a repo already on disk.

### `master`, then `main`

`git init` ran without `-b main`, so the repository and its GitHub default both started on `master`,
while every other repository the user has is `main`. The user renamed it on 2026-08-31 — local
branch, remote branch, GitHub default, old branch deleted. The lasting fix is that nothing in Flow
ever writes a bare `git init` again; the install skill and the manual both name `-b main`.

## `util install`, 2026-08-31 — the last piece

`util` goes on a machine now. `builtin/install.js` links `util` and `u` in `~/.local/bin`, both
pointing at `util.js`, and registers this repository's `commands/` through `sources.add()`, on the
same terms as any other source. 29 tests pass, and nothing named in `## Where to start` is unbuilt.

**Run by path once, then by name.** `node <clone>/util.js install` is the first run, because `util`
is not a command until that run has made it one. That is `flow install`'s shape, for `flow install`'s
reason.

**The clone is `path.resolve(__dirname, '..')`, and `flow`'s `cloneRoot()` did not transfer.** Flow
walks up looking for a marker; `util`'s entry point sits at the root of its clone, and Node resolves
`__dirname` through the symlink to the real file. A re-run typed as `util` therefore finds the clone
the link points into, which is what makes moving the clone and re-running the fix for a dead link.

**A second redirect, because a test cannot forget an environment variable.** The registry already
moves with `UTIL_HOME`. `~/.local/bin` had nothing, so a test omitting a flag would have put real
symlinks on the machine running the suite — the accident `flow install` refuses a lone `--home` to
prevent, in a shape no flag pair can catch. `--bin <path>` is the flag a person types, `UTIL_BIN` is
the fallback ahead of the default, and the test helper sets it beside `UTIL_HOME` once for every test.

**Every name is checked before any name is written.** A real file holding `u` would otherwise leave
`util` linked and the registry written by a run that failed. `fs link` refuses a multi-source run
before the first link lands, for the same reason.

**The one flag is read by hand.** `lib/args.js` covers a builtin taking nothing and a builtin taking
one path, and a general parser for a single name is noise. `## Decided against` rules out declared
flags for *dispatched* commands, which a builtin is not.
