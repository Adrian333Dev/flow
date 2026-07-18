# <!-- Project Name -->

> Designed for **solo developers**. One author, one branch context.

---

## Project context

- **Name:** <!-- project name -->
- **Stack:** <!-- e.g. TypeScript, React, Vite, NestJS, Supabase, pnpm -->
- **Structure:** <!-- e.g. single app | monorepo | library -->

## Project-specific rules

> Add rules that emerge from your spec and can't be inferred from conventions.

---

## Session start

1. Read `docs/work/now.md` to find the active topic and next action.
2. The next action is usually a skill — invoke it rather than improvising.

## Utility scripts

- **Project tree:** `bash scripts/tree.sh [path] [--depth N] [--except pattern]`
- **Merge files:** `node scripts/merge-files.js [--ext ts,tsx] [--except pattern] <path1[:N-M]> [path2...]`
  - `path:N-M` extracts lines N through M only (1-indexed, inclusive)
  - Use for 5+ files or when you need a single merged blob

**When to use parallel Read vs merge-files:** ≤4 files → issue parallel Read tool calls. 5+ files, or when a single merged output is needed → merge-files.js.

## Context capture

The `context-capture` skill is always active — it runs passively across all phases. Any time something important surfaces (a decision, a future idea, a domain insight, a session checkpoint), write it to the right file immediately. Don't wait for the end of a session. Invoke it explicitly when you want to force a checkpoint or need to route something.

## Hard rules

- **Never run git mutations.** Suggest commands; the user runs them.
- **No pointless mkdir.** The Write tool creates directories automatically — never run `mkdir` just to create a folder before writing a file.
- **Never state cause without evidence.** Every causal claim must be a labeled hypothesis with a verification step: "Hypothesis: X. To verify: Y."
- **Surface reasoning before writing any workflow document** (brainstorm.md, spec.md, plan.md). State your interpretation of the situation first.
- **No placeholders in plans.** Real file paths, real code, real commands — always.
- **Batch sequential checks.** Always chain build/test/lint into one Bash call with `&&`. Never run them as separate calls.
