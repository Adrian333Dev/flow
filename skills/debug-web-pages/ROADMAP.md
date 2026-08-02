# debug-web-pages — Roadmap

Where this is going. Two independent axes: **the capture engine** (what we can
extract from a page) and **the packaging** (how the skill itself is hosted and
shared). Plus the knowledge base, which grows continuously as a side effect of
use.

## Axis 1 — Packaging: project skill → hostable multi-skill repo

Today this is a single, project-local skill at
`playground/.claude/skills/debug-web-pages/`. That's deliberate: one skill, used
in one place, no install machinery. The future is to lift it into a **standalone,
hostable personal-skills repo** so any of these skills can be installed with one
command — modeled on `mattpocock/skills` (studied in
`tmp/repos/skills/`).

Target shape when we convert (do NOT build until it's warranted):

```
skills-repo/                     # its own git repo, hostable (e.g. GitHub)
  skills/<category>/debug-web-pages/ # this skill, moved here verbatim
  scripts/link-skills.sh          # symlink every skill into ~/.claude/skills + ~/.agents/skills
  scripts/list-skills.sh
  .claude-plugin/plugin.json      # lists skills → installable as one named plugin
  README.md  CLAUDE.md
```

Key mechanics we liked and will adopt:
- **Symlink install** (`link-skills.sh`): each skill is symlinked into the agent
  skill dirs, so `git pull` / edit-in-place updates every project live.
- **Categories** (`engineering/`, `productivity/`, …) plus `in-progress/` (WIP,
  not linked) and `deprecated/` (kept, excluded from install).
- **`plugin.json`** so the whole set installs by name, not only via symlinks.

Deliberately **skipped** until/unless we publish for real: changesets +
CHANGELOG, ADRs, a `docs/` tree. Those are release-discipline for strangers; not
needed for a private set.

Migration is low-friction by design: converting = *adding* the install script,
`plugin.json`, and README around a folder that already exists — no move of the
skill's internals, no path rewrites inside it.

## Axis 2 — Capture engine: more backends & layers

Current backend: **console-snippet** (`scripts/capture.js`) — the only one that
runs in the user's real logged-in Chrome, paste-and-go, no automation. It cannot
see closed shadow roots, non-DOM EventTargets, or full parsed JS. Planned:

- **Slice 2 — styles + scripts:** inline captured in-snippet; external
  `href`/`src` fetched Node-side in `unpack.js`; written to `styles/` + `scripts/`.
- **Slice 3 — richer runtime + safe-serialize hardening** (depth/size caps,
  circular guard).
- **Slice 4 — network:** fold in a native HAR via `unpack.js --har`, then an
  `arm-network.js` snippet for forward capture.
- **Slice 5 — CDP backend (`cdp-capture.mjs`):** the big one. Pierces **closed
  shadow roots** (`DOM.getDocument {pierce:true}`), grabs all parsed JS + source
  maps, execution coverage, screenshots, and atomic snapshots — reusing the same
  bundle format so investigation habits don't change. This is what unblocks the
  YouTube player internals (see `knowledge/domains/youtube-watch.md`).
  - **Chrome 136+ constraint:** `--remote-debugging-port` is ignored on the
    default profile. Workarounds (a `profile-helper`): copy the profile to a
    non-default `--user-data-dir` (durable, keeps your login), use a dedicated
    debug profile, or Chrome for Testing. Sources:
    <https://developer.chrome.com/blog/remote-debugging-port>,
    <https://chromeenterprise.google/policies/remote-debugging-allowed/>,
    <https://github.com/browser-use/browser-use/issues/1520>.
  - A **remote-Chrome** variant (attach to an already-running instance) is the
    logical extension once the local CDP path works.

The bundle format is backend-agnostic on purpose: a richer backend fills in more
layers, but the directory an agent reads — and every query recipe in
`knowledge/` — stays the same.

## Axis 3 — Knowledge base (continuous)

Every investigation should leave the skill smarter:
- Append verified findings to the relevant `knowledge/domains/<page>.md`, or
  create one from `_TEMPLATE.md`.
- When a tactic recurs across domains, promote it into
  `knowledge/investigation-patterns.md` or `capturing-and-querying.md`.

This is the whole point of making it a skill rather than a script: the tooling is
fixed, but the *expertise* compounds.
