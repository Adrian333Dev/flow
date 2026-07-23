# <!-- Project Name -->

> Designed for **solo developers**. One author, one branch context.

---

## Project context

- **Name:** <!-- project name -->
- **Stack:** <!-- e.g. TypeScript, React, Vite, NestJS, Supabase, pnpm -->
- **Structure:** <!-- e.g. single app | monorepo | library -->

## Who the user is

<!-- One paragraph: role, stack expertise, notable gaps. The explain skill calibrates
against this — it never re-explains what's inside the profile and always defines what's
outside it. Written at project init; extend only when a real gap shows up.
e.g. "Solo web developer. Expert: TypeScript, React, Node. Comfortable: SQL, Docker.
No background: audio APIs, compilers, ML internals." -->

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

The `capture-context` skill is always active — it runs passively across all phases. Any time something important surfaces (a decision, a future idea, a domain insight, a session checkpoint), write it to the right file immediately. Don't wait for the end of a session. Invoke it explicitly when you want to force a checkpoint or need to route something.

## Working with the user

- Solo developer, one author. Communicates almost entirely by **voice-to-text**, so messages carry transcription errors — misspellings, wrong or dropped words, homophones, run-on phrasing. Read for intent, not literal wording; infer the intended word from context. Ask only when a likely mis-transcription genuinely changes the meaning and context can't settle it.
- **No fluff.** No cheerleading, no jargon, no filler, never "you're absolutely right." Every sentence earns its place. In brainstorming, write **free-form prose** (not compressed/telegraphic); telegraphic fragments are fine elsewhere.
- Work iteratively: commit to a recommendation the user can react to, rather than laying out every option neutrally.

## Communication (/copy discipline)

- **HARD RULE — all explanations go at the END of the turn, after every tool call.** The user reads (and `/copy`-captures) only the final message of a turn; any prose written before or between tool calls (reads, edits, writes, commands) is effectively invisible. Do the tool work first, then deliver the full explanation as the last thing in the turn — never split it around edits, and never assume text written before a tool call was seen. If an earlier turn violated this, re-deliver the explanation in full.
- **Write locked decisions, batched.** Write to a workflow doc only when a decision is genuinely locked (user-confirmed, no open threads on it) — not on mid-discussion agreement. Let a few accumulate and record them together. Don't gate each write behind a yes/no question, and don't edit every turn.
- **Explain artifacts from zero.** Never assume the user has read a research report or file. Explain the content in plain language — what it says, what you conclude, what you propose, and why. Research reports get the strongest form: assume **zero** lines read. (Earlier chat messages are fine to assume read — the /copy discipline means they were the last thing each turn.)

## Hard rules

- **Never run git mutations.** Suggest commands; the user runs them.
- **Plan first.** Propose a plan and wait for explicit approval before changing files. (Recording an already-locked decision into a workflow doc follows the surface-reasoning rule below — no second approval round-trip.)
- **Never use the AskUserQuestion tool.** Ask questions in plain prose; the user answers inline.
- **No pointless mkdir.** The Write tool creates directories automatically — never run `mkdir` just to create a folder before writing a file.
- **Never state cause without evidence.** Every causal claim must be a labeled hypothesis with a verification step: "Hypothesis: X. To verify: Y."
- **Surface reasoning before writing any workflow document** (brainstorm.md, spec.md, plan.md). State your interpretation first. When the decision is already locked (user-confirmed, no open threads), record it in the same turn — no separate approval round-trip. Wait for approval only when the write rests on an inference beyond what was explicitly discussed.
- **No placeholders in plans.** Real file paths, real code, real commands — always.
- **Chain shell commands.** If chaining won't bite back, chain — any operations, any phase: one `&&` call instead of several. `&&` halts at the first failure. Separate calls only when a step's output must be inspected before the next runs, or when a partial run would be hard to detect or undo.
- **No auto-memory.** Never use the memory feature. Anything worth keeping goes in the repo — CLAUDE.md, the work/session docs, or a skill.
- **Never run install or setup commands** — `pnpm add`/`remove`, `npm install`, editor extensions, global CLIs, MCP servers, system packages. No exceptions. Name the command; the user runs it.
- **Never delete source after copying** without a separate explicit confirmation — even inside an approved plan. Moves are fine; deletes are not.
- **Keep internal reasoning out of deliverables.** Rejected-alternatives / "deliberately skipped" catalogs belong in design notes, never in a polished spec/plan/artifact.
