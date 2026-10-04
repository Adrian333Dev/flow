# ctxlint

Read 2026-10-04 from `repos/tools/ctxlint/`. 11 stars, MIT. A linter for `CLAUDE.md`, `AGENTS.md` and similar files: dead file paths, dead commands, secrets, token waste.

**Tried on Flow the same day, it found nothing.** A script following its dead-path rule read every backticked path in `skills/`, `docs/`, `home/AGENTS.md`, `CLAUDE.md` and `README.md`. 41 hits, and none was a fault. 39 name a file inside a user's project, such as `docs/spec/product.md`, and 2 are relative to a skill's own folder.

## What Flow could take

Nothing. A path check for Flow would need to tell the paths in this repo from those in a project, and the sweep of 2026-09-30 already checked every Flow path the shipped files mention.
