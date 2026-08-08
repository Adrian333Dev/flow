# skills — authoring guide

Every skill Flow ships. One folder per skill; `../global/scripts/link.sh` symlinks each into `~/.claude/skills/`. There is exactly **one copy on the machine** — an edit here is live in every project immediately, including open sessions. Skills are never copied into a project.

## Adding a skill

1. Create `<name>/SKILL.md`. The frontmatter is load-bearing — its `description` is all the model sees when deciding whether to reach for the skill:
   ```
   ---
   name: <name>
   description: <one line — length follows invocation type, see Conventions>
   ---
   ```
2. Choose invocation type:
   - **Model-invoked** (default): omit the flag — the agent may auto-reach for it when the task fits.
   - **User-invoked only**: add `disable-model-invocation: true` — reachable only when the human types `/<name>`.
3. Run `bash ../global/scripts/link.sh` so it appears in `~/.claude/skills/`.

## Conventions

- **Telegraphic style — the house standard for every markdown file that loads into agent context.** Skills, `CLAUDE.md`, workflow docs: same rule. Write tight — every sentence earns its place, no filler, no restating what the agent already knows, no rules that are already hard rules elsewhere. **Cut words, never information** — a file that drops a load-bearing detail to look short has failed. `organize` is the reference for the density to aim for. Applies to new files and to reworking existing ones; anything written before this standard gets brought up to it as it's touched. Prose *to the user* is the exception — that stays free-form, per `~/.claude/CLAUDE.md`.
- One skill = one folder under `skills/`. **Flat for now** — add topic buckets (`frontend/`, `backend/`, `tooling/`) only once flat gets noisy. No vague `misc/`.
- **Length is not a reason to split.** Under ~300 lines is fine; up to ~500 is acceptable when the material earns it. Split a skill into sub-files only when parts are genuinely **conditional** — read on some runs and not others (`write-spec.md`, `write-plan.md`, `haiku-worker.md`). Splitting content the skill needs on every run just buys extra reads across multiple turns.
- **Names are verb-first.** Skill folders and sub-files state the action — `execute`, `research`, `debug-web-pages`, `write-spec.md`, `write-plan.md` — never gerunds (`writing-plans`) or noun forms.
- **Executables live in `scripts/`.** A skill that ships runnable files keeps them in a `scripts/` subfolder (`research/scripts/fetch-docs.sh`, `debug-web-pages/scripts/capture.js`). Markdown sub-files stay at the folder root or in purpose folders like `knowledge/`.
- **`CHANGELOG.md` logs behavior changes only** — a rule added, removed or reversed; a mode added; a mechanism replaced. Not renames, path fixes, or reference sweeps: git owns those. Date headers (`## 2026-08-03`), newest first, no version numbers. The file is never loaded into agent context — it exists so the reasoning behind a skill's current wording survives, which commit messages here do not carry.
- **Accumulated findings go in the skill body, not the changelog.** Dated entries in a `knowledge/` file (see `debug-web-pages`) are read when the skill runs; a changelog never is.
- **Description length follows invocation.** Model-invoked → what the skill does **and** when to reach for it. User-invoked → one short, general line; the user already decided.
- **No versions, no plugin manifest, no install CLI.** One symlinked copy per machine means there is no distribution lag to track. Adding a skill is: make the folder, run `link.sh`.
