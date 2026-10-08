# Archive

Code Flow no longer runs, kept so it can be read without digging through git history. Nothing here is installed, tested or loaded.

- **`apply-migration.js`** carried out a setup's or an update's `migration.md`, one action line at a time. Replaced 2026-10-08 by `scripts/record-originals.js`, which records the originals, and by the setup sessions, which make each change themselves. `docs/spec/setup.md` → `### Migrations` says why.
- **`migrations.js`** is `scripts/lib/machine/migrations.js` as it stood then, holding the action-line parser `apply-migration.js` used. The live file keeps `resume` and `guard`.
- **`machine-form.md`** and **`project-form.md`** were `scripts/sessions/form.md` and `project-form.md`, the setup forms' templates before 2026-10-08, with a settings key on each line and the boxes after the no-choice part. Replaced by `scripts/templates/setup-machine.md` and `setup-project.md`. `docs/spec/setup.md` → `### The forms` says why.
