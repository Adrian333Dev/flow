# Changelog — debug-web-pages

## 2026-07-23

- `tools/` renamed to `scripts/` (catalog convention: executables live in a `scripts/` subfolder). All references updated; the unpack command in `knowledge/capturing-and-querying.md` now uses the global install path (`~/.claude/skills/debug-web-pages/scripts/unpack.js`).

## 2026-07-22

- Initial publish. Two modes (capture + live-experiment), one loop: understand → hypothesize → probe → intervene → verify → record. Ships `knowledge/` (capturing-and-querying, investigation-patterns, live-experiments, domains/youtube-watch) and `tools/` (capture.js, unpack.js).
