# The wiki

`~/.flow/wiki/` holds one folder per outside tool or field, shared by every project on the machine. `flow sync` carries it to the other machine, `downloads/` excepted.

## The folder

```text
~/.flow/wiki/next.js/
├─ index.md               what it is, the version in use, skills reviewed, doc shortcuts
├─ <topic>.md             one page per topic, edited in place
├─ findings/<lesson>.md   one file per lesson, not yet folded into a page
└─ downloads/             this machine's alone, never synced
   ├─ _sources.md         what was downloaded, when, and the tool's latest release then
   ├─ llms.txt
   ├─ llms-full.txt
   ├─ pages/<page>.md
   └─ repo/               the tool's source, cloned
```

- **A tool's folder** takes its GitHub repository name: `next.js`. No repository → the product's name. 2 repositories sharing a name → `owner_repo`. A standard with its own docs, such as OAuth 2.1, gets a folder like a tool.
- **A field's folder** takes a plain name: `text-to-speech`, `chrome-extensions`.
- **Make the folder with its `index.md`**, on the first page written about its subject. A finding makes the folder alone.
- **Never write a global index.** `util fs tree ~/.flow/wiki` lists every folder.

## `index.md`

Shortcuts for the next search, never answers:

```md
# next.js

React framework for web apps. In use: 16.3.5.

## Skills
- vercel-labs/next-skills: nextjs, used whole, the makers' own, 2026-10-12
- someone/next-tips: next-tips, passed over, general advice the agent already knows, 2026-10-12

## Live docs
- llms.txt: https://nextjs.org/docs/llms.txt
- Context7: /vercel/next.js. Pinned versions stop at v16.2.9. Without a version it reads `canary`.
- source: https://github.com/vercel/next.js

## Pages by topic
- auth, redirecting signed-out users: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx
```

- **The opening line**: what the subject is, then the version in use.
- **A field's `index.md`** lists its tools, one line each, with no version.
- **`## Skills`**: every skill research reviewed for the subject, one line each: `<owner/repo>: <name>, used whole | passed over | harvested at <commit>, <why>, <date>`. Review again only a skill changed since its date.
- **`context7.sh` writes the `Context7:` line.** Every other line is yours.
- **A shortcut is checked by using it.** One that fails gets looked up again and its line rewritten. No expiry date.

## `_sources.md`

`fetch-docs.sh` writes one line per file it saved:

```md
- `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5)
- `repo/` <- https://github.com/vercel/next.js (2026-09-19, latest release then 16.3.5)
```

The release is the tool's newest on the download day, which is the version the docs describe. It is never the project's version.

## A page

One topic, named for it: `permissions.md`. It holds what the docs don't say, linking the doc page.

```md
# Permissions

Checked against Claude Code 2.1.296, 2026-10-12.

- "Always allow" on a compound command saves one rule per piece.
- Until 2.1.290: `Read` asked even with an allow rule. From 2.1.290: the rule covers it.
- `Edit` outside the project asks every time (2.1.310).
```

- **Open with the version the page was checked against.** Every line holds for it unless the line says otherwise.
- **A line true only on another version** → `Until 2.1.290: … From 2.1.290: …`. Keep both halves: a project may still run the old one.
- **A fact added on a newer version** → `(2.1.310)` at its end, until the whole page is rechecked and the opening line moves.
- **A field page** has no version line.
- **Evidence** is a link to a doc page or an issue, only where one exists. Never stamp every line.

## A finding

One lesson, one file, named for it in 4 to 8 words: `compound-command-saves-one-rule-per-piece.md`. Capture adds it with no read of any page and no choice of page: the subject's folder name is all it needs. A subject with no folder yet gets the folder alone, and the first page written for it adds `index.md`. The upkeep skill (`/flow:upkeep`) folds findings into the pages, then deletes the folded files.

```md
checked: 2026-10-16
version: 2.1.300

"Always allow" on a compound command saves one rule per piece.
```

- **Both header lines are optional.** `checked: <date>` for a fact that expires (a price, a limit). `version: <x>` for one bound to a version.
- **A finding that contradicts an older one** replaces that file's text. Read only that file.

## Changing a page

Research and the upkeep skill change a page. Capture adds findings and changes no page.

1. **Read the page first.**
2. **Edit the page owning the subject.** None owns it → start one.
3. **Delete a fact proven wrong.**
4. **Rewrite a page whole** when its subject changed shape.
5. **Split by topic** past about 150 lines.

2 machines edited one page → `flow sync` stops, naming the file. Merge by hand, keeping both sides.

## What never enters it

A project's details or a client's. The test: would the sentence be true in a different project?
