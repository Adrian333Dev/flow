# The wiki

`~/.flow/wiki/` holds one folder per outside tool: a library, a service, a command-line tool, a standard with its own docs. Every project on the machine shares it, and the Flow home repository carries it to the other machine.

## The layout

```text
~/.flow/wiki/next.js/
├─ index.md                         where the live docs are, which page answers what
├─ research/<question>.md           research reports about this tool alone
├─ findings/<what-was-learned>.md   facts learned using the tool, waiting for the harvest
└─ downloads/                       this machine's alone, never committed
   ├─ _sources.md                   what was downloaded, when, and the tool's latest release then
   ├─ llms.txt
   ├─ llms-full.txt
   ├─ pages/<page>.md
   └─ repo/                         the tool's source, cloned
```

- **The folder name** is the tool's GitHub repository name: `next.js`. A tool with no repository takes the product's name. 2 repositories sharing a name take `owner_repo`.
- **A standard**, such as OAuth 2.1, gets a folder like a tool.

## `index.md`

Shortcuts for the next search of the same tool, never answers:

```md
# next.js

## Live docs
- llms.txt: https://nextjs.org/docs/llms.txt
- Context7: /vercel/next.js. Pinned versions stop at v16.2.9. Without a version it reads `canary`.
- source: https://github.com/vercel/next.js

## Pages by topic
- auth, redirecting signed-out users: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx
```

- `context7.sh` writes the `Context7:` line. Every other line is yours.
- A shortcut is checked by using it. One that fails gets looked up again and its line rewritten. No expiry date.

## `_sources.md`

`fetch-docs.sh` writes one line per file it saved:

```md
- `llms-full.txt` <- https://nextjs.org/docs/llms-full.txt (2026-09-19, latest release then 16.3.5)
- `repo/` <- https://github.com/vercel/next.js (2026-09-19, latest release then 16.3.5)
```

The release is the tool's newest on the download day, which is the version the docs describe. It is never the project's version.

## The folder only grows

- **`research/<question>.md`**: a new question makes a new file. The same question on a newer version adds a dated section at the end, naming the version. The older text stays.
- **`findings/<what-was-learned>.md`**: one file per finding, written once. The same fact learned again adds one line at the end: the version and the date it held.
- **`index.md`**: a new shortcut is a new line. Rewrite a line only when its shortcut stops working.
- **`downloads/`**: replaced on refresh, on each machine, outside the rule.
- **The harvest** deletes the findings it wrote into the tool's skill. Nothing else removes a file.

Where both machines added to the end of one file, keep both additions.

## What never enters it

A project's details or a client's. The test: would the sentence be true in a different project?
