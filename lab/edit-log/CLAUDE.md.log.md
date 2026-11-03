# Log of CLAUDE.md

## 2026-11-02 · `loaded-text-path` · add
Ticket: fw-358
Why: the guides for loaded text were read at the edit, after the proposals they should shape (`fw-339`, 3 repeats). All Flow issues are worked in this repo, so the user allowed a repo-only rule for it.
Trial: watch the next change to a skill, rule or guide here: is `guides/write-loaded-files.md` read before the first proposal.

## 2026-11-03 · `read-the-spec-first` · remove
Ticket: fw-397
Why: the agent read `docs/spec/product.md` before the change in 18 of 129 windows. The mod's `spec-first` entry now holds an `Edit` or `Write` under `skills/`, `scripts/`, `docs/manual/`, `home/` or `project-template/` until `product.md` is read. The user approved the removal 2026-11-03. Dropped with it: "the spec file of the part you touch", which no entry sends.
Trial: watch whether changes to a part still contradict its own spec file, now that only `product.md` is held for.
Was:
```md
- **`read-the-spec-first`** Read `docs/spec/product.md` and the spec file of the part you touch, before changing skills, installation, the scripts or the docs tree.
```
