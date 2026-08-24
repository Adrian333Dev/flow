# Moving uncommitted work between machines

`flow work` carries work you have not committed from one computer to another. Committed work already travels through the remote. This is for the files you edited, the files you never added, and the deletions you have not staged.

## Once per machine

Give each computer a name:

    git config --global flow.machine desktop

The other computer takes a different one. Every copy is filed under the name, so two machines sharing one name overwrite each other on every send, and nothing reports it. `flow work send` refuses until the name is set, for exactly that reason.

## Leaving one machine

    flow work send

Stores everything uncommitted and pushes it. Your files, your branch and your staging area are untouched — nothing is committed and nothing moves.

Run it on whichever branch you are on, before you walk away.

## Arriving at the other

    flow work get

Fetches the copy and replays the edits into the folder, unstaged, the way you left them.

The branch does not have to be where it was. A copy holds a **set of edits**, not a moment in time, so the edits land on top of whatever the branch is now.

## Switching branches without losing the work

    flow work send --clear

Sends, then empties the folder so `git checkout` works. A local copy stays in git's stash, and `git stash pop` puts everything back. Gitignored files stay where they are — the stash does not sweep those.

## When the branch moved underneath

An edit touching a line that also changed on the branch comes back with `<<<<<<<` markers, and VS Code opens its conflict editor on those as usual. Settle each file, then `git add <file>`.

Files that merged cleanly are staged and the conflicted ones are not. Leave the staging area alone until every conflict is settled.

## Gitignored files

None of them travel by default. Name the ones that should, one path per line, in `.flow-include` at the project root:

    .env.local
    config/local-settings.json

**A path named there is pushed to whatever remote the project uses.** On a public repository that publishes it.

## What never arrives

- **An empty folder.** Git has no way to record one.
- **A folder holding its own `.git`.** Only a pointer travels, never the files inside. `send` names every such path as it runs, so the gap shows when the copy is made rather than when the files are missing.
- **A commit you made and never pushed.** A restore replays edits and nothing else, so push the branch as well.
- **The split between staged and unstaged.** Everything comes back unstaged.

## If a restore goes wrong

`get` stores whatever was in the folder first, at `refs/unfinished-backup/<branch>`, before it overwrites anything. Pull a single file back out of it:

    git show refs/unfinished-backup/main:src/parser.js > src/parser.js

A folder already matching the last commit gets no backup, having nothing to lose.

## Seeing and clearing what is stored

    flow work ls              every copy: machine, branch, age, file count
    flow work drop            this machine's copy of this branch
    flow work drop laptop     a named machine's copy
    flow work drop --all      every copy of this branch

`get` never deletes the copy it used. It prints the drop command instead.

## What a copy actually is

A real git commit holding the whole project folder, hung off the commit you are on. Its name is written into a label at `refs/unfinished/<machine>/<branch>`.

That label sits outside `refs/heads/`, the only place git acts on by itself. So the label is not a branch: it never appears in `git branch`, nothing switches to it, and committing never moves it. It pushes and fetches like anything else.

One label per machine per branch. Each send replaces that machine's previous copy, so only the newest survives.
